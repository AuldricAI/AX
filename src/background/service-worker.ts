// AX — Service Worker
// Message hub: captures state via content script, calls LLM, stores results

import { callLLM, estimateCost } from '../lib/llm';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_BUILDER_SYSTEM, buildPromptBuilderUserPrompt } from '../lib/prompts';
import { formatMarkdown } from '../lib/formatters';
import type { AXSettings, DiagnosticCapture, DiagnosticReport, DiagnosticIssue, LLMSettings, PromptReport } from '../lib/types';

// ─── Constants ────────────────────────────────────────────────────────

const AX_API_BASE = import.meta.env.VITE_AX_API_BASE || 'https://api.auldric.com';

// ─── Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AXSettings = {
    mode: 'ax',
    llm: {
        provider: 'vercel',
        apiKey: '',
        model: 'zai/glm-4.7-flashx',
    },
    features: {
        autoCaptureNetwork: true,
        autoCaptureConsole: true
    },
    autoCapture: false,
    theme: 'dark',
    projectSpecs: [],
    projectStage: 'early-dev'
};

async function getSettings(): Promise<AXSettings> {
    const { axSettings } = await chrome.storage.local.get(['axSettings']);
    return axSettings ? { ...DEFAULT_SETTINGS, ...axSettings } : DEFAULT_SETTINGS;
}

async function saveSettings(settings: AXSettings): Promise<void> {
    await chrome.storage.local.set({ axSettings: settings });
}

// ─── Diagnosis History ────────────────────────────────────────────────

async function getHistory(): Promise<DiagnosticReport[]> {
    const { axHistory } = await chrome.storage.local.get(['axHistory']);
    return axHistory || [];
}

async function saveToHistory(report: DiagnosticReport): Promise<void> {
    const history = await getHistory();
    history.unshift(report);
    // Keep last 50 reports
    if (history.length > 50) history.length = 50;
    await chrome.storage.local.set({ axHistory: history });
}

// ─── Message Router ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const handler = messageHandlers[message.type];
    if (handler) {
        handler(message.payload)
            .then(sendResponse)
            .catch((err: Error) => sendResponse({ error: String(err) }));
        return true; // async response
    }
});

const messageHandlers: Record<string, (payload: any) => Promise<any>> = {
    CAPTURE_AND_DIAGNOSE: handleCaptureAndDiagnose,
    TRIGGER_BATCH_SCAN: handleBatchScan,
    GENERATE_PROMPT: handleGeneratePrompt,
    GET_SETTINGS: async () => getSettings(),
    SAVE_SETTINGS: async (payload: AXSettings) => {
        await saveSettings(payload);
        return { success: true };
    },
    GET_HISTORY: async () => getHistory(),
    CLEAR_HISTORY: async () => {
        await chrome.storage.local.set({ axHistory: [] });
        return { success: true };
    },
    SPIDER_ACTIVE_TAB: handleSpiderActiveTab,
};

// ─── Automated Spidering ──────────────────────────────────────────────

async function handleSpiderActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) throw new Error('No active tab to spider');

    const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const currentHostname = window.location.hostname;
            const links = Array.from(document.querySelectorAll('a'))
                .map(a => a.href.split('#')[0]) // Remove hash fragments
                .filter(href => {
                    try {
                        const url = new URL(href);
                        // Only internal links, ignore standard file downloads
                        return url.hostname === currentHostname &&
                            url.protocol.startsWith('http') &&
                            !url.pathname.match(/\.(pdf|jpg|png|svg|gif|zip|exe|dmg|mp4|webm)$/i);
                    } catch { return false; }
                });

            return Array.from(new Set(links));
        }
    });

    const urls = result[0]?.result || [];
    // Ensure the current active page is always the first URL scanned
    const finalUrls = Array.from(new Set([tab.url.split('#')[0], ...urls])).slice(0, 5);

    return { success: true, urls: finalUrls };
}

// ─── Batch Scanning ───────────────────────────────────────────────────

async function handleBatchScan(payload: { urls: string[] }) {
    const { urls } = payload;
    const results = [];

    for (const url of urls) {
        try {
            // 1. Create a background tab
            const tab = await chrome.tabs.create({ url, active: false });
            if (!tab.id) continue;

            // 2. Wait for it to load completely
            await new Promise<void>((resolve) => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });

                // Fallback timeout in case page hangs
                setTimeout(() => {
                    resolve();
                }, 10000);
            });

            // 3. Inject our capture script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/state-capture.js'],
            });

            // Small delay for script to initialize
            await new Promise(r => setTimeout(r, 500));

            // 4. Request the capture
            const captureResult = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_STATE' }).catch(() => null);

            // 5. Close the tab immediately so we don't clutter the user's browser
            await chrome.tabs.remove(tab.id);

            if (captureResult?.success) {
                results.push(captureResult.data);
            } else {
                results.push({ url, error: 'Capture failed or timed out' });
            }

        } catch (error) {
            console.error(`Failed to scan ${url}:`, error);
            results.push({ url, error: String(error) });
        }
    }

    // TODO: In the future, send 'results' array to the AI for a multi-page diagnosis.
    // For now, return the raw data back to the UI.
    return { success: true, count: results.length, data: results };
}

// ─── Capture & Diagnose ───────────────────────────────────────────────

async function handleCaptureAndDiagnose(payload?: { mode?: 'ax' | 'byok'; clerkToken?: string }) {
    // 1. Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    // 2. Inject content script and capture state
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/state-capture.js'],
    });

    // Small delay to let script initialise
    await new Promise(r => setTimeout(r, 100));

    const captureResult = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_STATE' });

    if (!captureResult?.success) {
        throw new Error(captureResult?.error || 'Failed to capture page state');
    }

    const capture: DiagnosticCapture = captureResult.data;
    const settings = await getSettings();
    const mode = payload?.mode || settings.mode || 'ax';

    // 3. Trim capture data to keep payload size low
    const trimmedCapture = {
        url: capture.url,
        title: capture.title,
        console: capture.console.slice(0, 20),
        network: capture.network
            .filter(n => n.status >= 400 || n.duration > 3000 || n.error)
            .slice(0, 20),
        dom: {
            meta: capture.dom.meta,
            headings: capture.dom.headings.slice(0, 15),
            images: capture.dom.images.filter(i => !i.hasAlt || !i.src).slice(0, 10),
            structuredData: capture.dom.structuredData.length > 0 ? 'present' : 'missing',
            forms: capture.dom.forms,
            pageContent: capture.dom.pageContent.substring(0, 30000),
            selectionText: capture.dom.selectionText.substring(0, 10000),
            totalElements: capture.dom.totalElements,
        },
        secrets: capture.secrets,
        performance: capture.performance,
        projectSpecs: settings.projectSpecs || [],
        projectStage: settings.projectStage,
    };

    let content: string;
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    if (mode === 'ax') {
        // ─── AX Mode: Clerk JWT → Backend Proxy ───────────────────────
        const token = payload?.clerkToken;
        if (!token) {
            // Return capture without AI diagnosis
            const report: DiagnosticReport = {
                capture,
                diagnosis: '',
                issues: buildLocalIssues(capture),
                summary: `Captured ${capture.console.length} console entries, ${capture.network.length} network requests, ${capture.secrets.length} exposed secrets. Please sign in for AI-powered diagnosis.`,
                timestamp: Date.now(),
            };
            await saveToHistory(report);
            return report;
        }

        const response = await fetch(`${AX_API_BASE}/api/ax/diagnose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                systemPrompt: SYSTEM_PROMPT,
                userMessage: buildUserPrompt(JSON.stringify(trimmedCapture, null, 2))
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Proxy API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        content = data.content;
        usage = data.usage || usage;

    } else {
        // ─── BYOK Mode: Direct LLM Call ───────────────────────────────
        if (!settings.llm.apiKey) {
            throw new Error('No API key configured. Add one in Settings.');
        }

        const systemAndUserPrompt = SYSTEM_PROMPT + buildUserPrompt(JSON.stringify(trimmedCapture, null, 2));

        const llmResult = await callLLM(
            settings.llm,
            SYSTEM_PROMPT,
            buildUserPrompt(JSON.stringify(trimmedCapture, null, 2)),
        );
        content = llmResult.content;
        usage = llmResult.usage;

        // If usage is 0 (some providers might not return it), estimate it
        if (!usage || (usage.prompt_tokens === 0 && usage.completion_tokens === 0)) {
            const promptWords = systemAndUserPrompt.split(/\s+/).length;
            const completionWords = content.split(/\s+/).length;
            usage = {
                prompt_tokens: Math.ceil(promptWords * 1.33),
                completion_tokens: Math.ceil(completionWords * 1.33),
                total_tokens: Math.ceil((promptWords + completionWords) * 1.33)
            };
        }
    }

    // 4. Build report
    const localIssues = buildLocalIssues(capture);
    const cost = estimateCost(mode === 'ax' ? 'vercel' : settings.llm.provider, usage);

    const report: DiagnosticReport = {
        capture,
        diagnosis: content,
        issues: localIssues,
        summary: content,
        timestamp: Date.now(),
    };

    await saveToHistory(report);
    return report;
}

// ─── Generate Prompt ──────────────────────────────────────────────────

async function handleGeneratePrompt(payload: { intent: string; mode?: 'ax' | 'byok'; clerkToken?: string }): Promise<PromptReport> {
    // 1. Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    // 2. Inject content script and capture state
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/state-capture.js'],
    });

    await new Promise(r => setTimeout(r, 100));
    const captureResult = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_STATE' });
    if (!captureResult?.success) throw new Error(captureResult?.error || 'Failed to capture page state');

    const capture: DiagnosticCapture = captureResult.data;
    const settings = await getSettings();
    const mode = payload.mode || settings.mode || 'ax';

    // 3. Trim capture data
    const trimmedCapture = {
        url: capture.url,
        title: capture.title,
        console: capture.console.slice(0, 20),
        network: capture.network.filter(n => n.status >= 400 || n.duration > 3000 || n.error).slice(0, 20),
        dom: {
            pageContent: capture.dom.pageContent.substring(0, 30000),
            selectionText: capture.dom.selectionText.substring(0, 10000),
        },
        projectSpecs: settings.projectSpecs || [],
        projectStage: settings.projectStage
    };

    let content: string;

    if (mode === 'ax') {
        // ─── AX Mode: Clerk JWT → Backend Proxy ───────────────────────
        const token = payload.clerkToken;
        if (!token) throw new Error('Sign in required for AX prompt builder.');

        const response = await fetch(`${AX_API_BASE}/api/ax/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                systemPrompt: PROMPT_BUILDER_SYSTEM,
                userMessage: buildPromptBuilderUserPrompt(payload.intent, JSON.stringify(trimmedCapture, null, 2))
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Proxy API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        content = data.content;

    } else {
        // ─── BYOK Mode: Direct LLM Call ───────────────────────────────
        if (!settings.llm.apiKey) throw new Error('No API key configured. Add one in Settings.');

        const systemAndUserPrompt = PROMPT_BUILDER_SYSTEM + buildPromptBuilderUserPrompt(payload.intent, JSON.stringify(trimmedCapture, null, 2));

        const llmResult = await callLLM(
            settings.llm,
            PROMPT_BUILDER_SYSTEM,
            buildPromptBuilderUserPrompt(payload.intent, JSON.stringify(trimmedCapture, null, 2)),
        );
        content = llmResult.content;

        // Estimate tokens and log the cost for open source users
        let usage = llmResult.usage;
        if (!usage || (usage.prompt_tokens === 0 && usage.completion_tokens === 0)) {
            const promptWords = systemAndUserPrompt.split(/\s+/).length;
            const completionWords = content.split(/\s+/).length;
            usage = {
                prompt_tokens: Math.ceil(promptWords * 1.33),
                completion_tokens: Math.ceil(completionWords * 1.33),
                total_tokens: Math.ceil((promptWords + completionWords) * 1.33)
            };
        }
        const cost = estimateCost(settings.llm.provider, usage);
        console.log(`[AX Prompt] Estimated Token Usage: ${usage.total_tokens} tokens (Cost: ${cost})`);
    }

    return {
        intent: payload.intent,
        prompt: content,
        timestamp: Date.now(),
    };
}

// ─── Local Issue Detection (no LLM needed) ────────────────────────────

function buildLocalIssues(capture: DiagnosticCapture): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];

    // Exposed secrets
    for (const secret of capture.secrets) {
        issues.push({
            category: 'security',
            severity: secret.severity,
            title: `Exposed: ${secret.type}`,
            description: `${secret.pattern} found in ${secret.location}. Snippet: ${secret.snippet}`,
            fix: 'Move this secret to server-side environment variables. Never include secrets in client-side code.',
        });
    }

    // Failed network requests
    const failed = capture.network.filter(n => n.status >= 400);
    for (const req of failed.slice(0, 5)) {
        issues.push({
            category: 'error',
            severity: req.status >= 500 ? 'high' : 'medium',
            title: `HTTP ${req.status}: ${new URL(req.url).pathname}`,
            description: `${req.type} request to ${req.url} returned ${req.status}`,
            fix: req.status === 404 ? 'Check the URL path and ensure the resource exists.' :
                req.status === 403 ? 'Check authentication/authorization and CORS configuration.' :
                    'Investigate server logs for the root cause.',
        });
    }

    // Console errors
    for (const entry of capture.console.filter(c => c.level === 'error').slice(0, 5)) {
        issues.push({
            category: 'error',
            severity: 'medium',
            title: 'Console Error',
            description: entry.message.substring(0, 200),
        });
    }

    // Missing meta description
    if (!capture.dom.meta.description && !capture.dom.meta['og:description']) {
        issues.push({
            category: 'seo',
            severity: 'medium',
            title: 'Missing meta description',
            description: 'No meta description found. Search engines and AI agents use this to understand page content.',
            fix: 'Add <meta name="description" content="..."> to the <head>.',
        });
    }

    // Images with broken/empty src
    const brokenSrc = capture.dom.images.filter(i => !i.src);
    if (brokenSrc.length > 0) {
        issues.push({
            category: 'error',
            severity: 'high',
            title: `${brokenSrc.length} image(s) with empty or missing src`,
            description: `Images with empty or missing src attributes will cause the browser to re-fetch the page and trigger framework errors. This is commonly caused by rendering an <img> or Next.js <Image> before the source URL is available.`,
            fix: 'Conditionally render images only when a valid src is available, or pass null/undefined instead of an empty string.',
        });
    }

    // Images without alt text
    const noAlt = capture.dom.images.filter(i => !i.hasAlt);
    if (noAlt.length > 0) {
        issues.push({
            category: 'accessibility',
            severity: 'medium',
            title: `${noAlt.length} image(s) missing alt text`,
            description: `Images without alt attributes are inaccessible to screen readers and AI agents.`,
            fix: 'Add descriptive alt attributes to all <img> elements.',
        });
    }

    return issues;
}

function deduplicateIssues(issues: DiagnosticIssue[]): DiagnosticIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
        const key = `${issue.category}:${issue.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
