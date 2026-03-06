// AX — Content Script: State Capture
// Injected into pages on demand to capture browser state

import { scanForSecrets } from '../lib/secret-patterns';
import type { DiagnosticCapture, ConsoleEntry, NetworkEntry, SecretMatch, DomSnapshot, PerformanceMetrics } from '../lib/types';

function extractVisibleText(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return '';

    const el = node as Element;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'SVG') return '';

    let text = '';
    const children = (el.shadowRoot || el).childNodes;
    for (const child of Array.from(children)) {
        text += extractVisibleText(child) + ' ';
    }
    return text;
}

function captureConsole(): ConsoleEntry[] {
    // We can't retroactively capture console — but we can grab what's in performance entries
    // and any errors visible on the page. The real console interception happens via
    // a pre-injected script or the devtools protocol.
    const entries: ConsoleEntry[] = [];

    // Check for visible error overlays (common in React/Next.js/Vite)
    const errorOverlays = Array.from(document.querySelectorAll(
        'nextjs-portal, vite-error-overlay, [data-nextjs-dialog], [data-vite-error], .react-error-overlay, #webpack-dev-server-client-overlay'
    ));

    errorOverlays.forEach((el) => {
        const rawText = extractVisibleText(el);
        const cleanText = rawText.replace(/\s+/g, ' ').trim();

        if (cleanText) {
            entries.push({
                level: 'error',
                message: `Framework error overlay detected: ${cleanText.substring(0, 1000)}`,
                source: 'error-overlay',
                timestamp: Date.now(),
            });
        }
    });

    return entries;
}

function captureNetwork(): NetworkEntry[] {
    const entries: NetworkEntry[] = [];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    for (const r of resources) {
        entries.push({
            url: r.name,
            method: 'GET', // Performance API doesn't expose method
            status: r.responseStatus || 0,
            statusText: '',
            duration: Math.round(r.duration),
            size: r.transferSize || 0,
            type: r.initiatorType,
            error: r.responseStatus >= 400 ? `HTTP ${r.responseStatus}` : undefined,
        });
    }

    return entries;
}

function captureDom(): DomSnapshot {
    // Meta tags
    const meta: Record<string, string> = {};
    document.querySelectorAll('meta').forEach((el) => {
        const name = el.getAttribute('name') || el.getAttribute('property') || el.getAttribute('http-equiv');
        const content = el.getAttribute('content');
        if (name && content) meta[name] = content;
    });

    // Headings
    const headings: { level: number; text: string }[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        headings.push({
            level: parseInt(el.tagName[1]),
            text: (el.textContent || '').trim().substring(0, 100),
        });
    });

    // Images
    const images: { src: string; alt: string; hasAlt: boolean }[] = [];
    document.querySelectorAll('img').forEach((el) => {
        images.push({
            src: el.src,
            alt: el.alt,
            hasAlt: el.hasAttribute('alt') && el.alt.length > 0,
        });
    });

    // Structured data (JSON-LD)
    const structuredData: any[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
        try {
            structuredData.push(JSON.parse(el.textContent || ''));
        } catch { /* skip malformed JSON-LD */ }
    });

    // Forms
    const forms: { action: string; method: string; id?: string }[] = [];
    document.querySelectorAll('form').forEach((el) => {
        forms.push({
            action: el.action || '',
            method: (el.method || 'GET').toUpperCase(),
            id: el.id || undefined,
        });
    });

    // External scripts
    const externalScripts: string[] = [];
    document.querySelectorAll('script[src]').forEach((el) => {
        externalScripts.push(el.getAttribute('src') || '');
    });

    let pageContent = document.body?.innerText || '';

    // Explicitly append shadow DOM overlays so the LLM can read the full stack traces
    const nextPortal = document.querySelector('nextjs-portal');
    if (nextPortal) {
        pageContent += '\n\n--- Next.js Error Overlay ---\n' + extractVisibleText(nextPortal);
    }
    const viteOverlay = document.querySelector('vite-error-overlay');
    if (viteOverlay) {
        pageContent += '\n\n--- Vite Error Overlay ---\n' + extractVisibleText(viteOverlay);
    }

    return {
        meta,
        headings,
        images,
        structuredData,
        forms,
        externalScripts,
        pageContent,
        selectionText: window.getSelection()?.toString() || '',
        totalElements: document.querySelectorAll('*').length,
    };
}

function captureSecrets(domSnapshot: DomSnapshot): SecretMatch[] {
    const matches: SecretMatch[] = [];
    const seen = new Set<string>();

    // Scan the combined pageContent (which includes shadow DOM overlays)
    for (const result of scanForSecrets(domSnapshot.pageContent)) {
        const key = `${result.pattern.name}:${result.match}`;
        if (!seen.has(key)) {
            seen.add(key);
            matches.push({
                type: result.pattern.name,
                pattern: result.pattern.description,
                location: 'dom',
                snippet: result.match,
                severity: result.pattern.severity,
            });
        }
    }

    // Scan inline scripts
    document.querySelectorAll('script:not([src])').forEach((el) => {
        const content = el.textContent || '';
        for (const result of scanForSecrets(content)) {
            const key = `${result.pattern.name}:${result.match}`;
            if (!seen.has(key)) {
                seen.add(key);
                matches.push({
                    type: result.pattern.name,
                    pattern: result.pattern.description,
                    location: 'script',
                    snippet: result.match,
                    severity: result.pattern.severity,
                });
            }
        }
    });

    // Scan meta tags and data attributes
    const metaContent = Array.from(document.querySelectorAll('meta[content]'))
        .map(el => el.getAttribute('content') || '').join(' ');
    for (const result of scanForSecrets(metaContent)) {
        const key = `${result.pattern.name}:${result.match}`;
        if (!seen.has(key)) {
            seen.add(key);
            matches.push({
                type: result.pattern.name,
                pattern: result.pattern.description,
                location: 'meta',
                snippet: result.match,
                severity: result.pattern.severity,
            });
        }
    }

    return matches;
}

function capturePerformance(): PerformanceMetrics {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(e => e.name === 'first-contentful-paint');

    return {
        fcp: fcp ? Math.round(fcp.startTime) : undefined,
        ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : undefined,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : undefined,
        loadComplete: nav ? Math.round(nav.loadEventEnd) : undefined,
    };
}

// ─── Main capture function ──────────────────────────────────────────

function captureState(): DiagnosticCapture {
    const dom = captureDom();
    return {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        console: captureConsole(),
        network: captureNetwork(),
        dom,
        secrets: captureSecrets(dom),
        performance: capturePerformance(),
    };
}

// Listen for capture requests from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'CAPTURE_STATE') {
        try {
            const state = captureState();
            sendResponse({ success: true, data: state });
        } catch (err) {
            sendResponse({ success: false, error: String(err) });
        }
        return true;
    }
});
