// AX — LLM Client
// Supports DeepSeek (direct), OpenRouter, and custom endpoints

import type { LLMSettings } from './types';

interface LLMResponse {
    content: string;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const PROVIDER_CONFIG: Record<string, { endpoint: string; defaultModel: string }> = {
    deepseek: {
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        defaultModel: 'deepseek-chat',
    },
    openrouter: {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        defaultModel: 'deepseek/deepseek-chat',
    },
    vercel: {
        endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
        defaultModel: 'zai/glm-4.7-flashx',
    },
};

export async function callLLM(
    settings: LLMSettings,
    systemPrompt: string,
    userMessage: string,
): Promise<LLMResponse> {
    const config = PROVIDER_CONFIG[settings.provider];
    const endpoint = settings.endpoint || config?.endpoint;
    const model = settings.model || config?.defaultModel;

    if (!endpoint) throw new Error(`Unknown LLM provider: ${settings.provider}`);
    if (!settings.apiKey) throw new Error('No API key configured. Add one in Settings.');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
    };

    // OpenRouter requires extra headers
    if (settings.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://github.com/AuldricAI/ax';
        headers['X-Title'] = 'AX Browser Diagnostics';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.1,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
        content: choice?.message?.content || '',
        model: data.model || model,
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}

export function estimateCost(provider: string, usage: LLMResponse['usage']): string {
    const rates: Record<string, { input: number; output: number }> = {
        deepseek: { input: 0.40, output: 1.20 },       // per 1M tokens
        openrouter: { input: 0.50, output: 1.50 },      // approx for DeepSeek via OpenRouter
    };
    const rate = rates[provider] || rates.deepseek;
    const cost = (usage.prompt_tokens * rate.input + usage.completion_tokens * rate.output) / 1_000_000;
    return cost < 0.01 ? '<$0.01' : `$${cost.toFixed(4)}`;
}
