// AX — Shared Types

export interface ConsoleEntry {
    level: 'error' | 'warn' | 'info' | 'log';
    message: string;
    source?: string;
    timestamp: number;
}

export interface NetworkEntry {
    url: string;
    method: string;
    status: number;
    statusText: string;
    duration: number;
    size: number;
    type: string;
    error?: string;
}

export interface SecretMatch {
    type: string;
    pattern: string;
    location: 'dom' | 'script' | 'meta' | 'attribute' | 'inline-handler';
    snippet: string;
    severity: 'critical' | 'high' | 'medium';
}

export interface PerformanceMetrics {
    fcp?: number;
    lcp?: number;
    cls?: number;
    ttfb?: number;
    domContentLoaded?: number;
    loadComplete?: number;
}

export interface DomSnapshot {
    meta: Record<string, string>;
    headings: { level: number; text: string }[];
    images: { src: string; alt: string; hasAlt: boolean }[];
    structuredData: any[];
    forms: { action: string; method: string; id?: string }[];
    externalScripts: string[];
    pageContent: string;
    selectionText: string;
    totalElements: number;
}

export interface DiagnosticCapture {
    url: string;
    title: string;
    timestamp: number;
    userAgent: string;
    console: ConsoleEntry[];
    network: NetworkEntry[];
    dom: DomSnapshot;
    secrets: SecretMatch[];
    performance: PerformanceMetrics;
}

export interface DiagnosticIssue {
    category: 'security' | 'performance' | 'error' | 'accessibility' | 'seo' | 'best-practice';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    fix?: string;
}

export interface DiagnosticReport {
    capture: DiagnosticCapture;
    diagnosis: string;
    issues: DiagnosticIssue[];
    summary: string;
    timestamp: number;
}

export interface PromptReport {
    intent: string;
    prompt: string;
    timestamp: number;
}

export interface LLMSettings {
    provider: 'deepseek' | 'openrouter' | 'vercel' | 'custom';
    apiKey: string;
    model: string;
    endpoint?: string;
}

export interface ProjectSpec {
    id: string;
    name: string;
    content: string;
}

export interface AXSettings {
    mode: 'ax' | 'byok';
    llm: LLMSettings;
    features: {
        autoCaptureNetwork: boolean;
        autoCaptureConsole: boolean;
    };
    autoCapture: boolean;
    theme: 'dark' | 'light' | 'system';
    projectSpecs?: ProjectSpec[];
    projectStage?: 'early-dev' | 'pre-launch' | 'production';
}

// Message types between popup, service worker, and content script
export type AXMessage =
    | { type: 'CAPTURE_STATE'; payload?: undefined }
    | { type: 'TRIGGER_BATCH_SCAN'; payload: { urls: string[] } }
    | { type: 'STATE_CAPTURED'; payload: any }
    | { type: 'CAPTURE_AND_DIAGNOSE'; payload?: { clerkToken?: string } }
    | { type: 'DIAGNOSIS_COMPLETE'; payload: DiagnosticReport }
    | { type: 'DIAGNOSIS_ERROR'; payload: { error: string } }
    | { type: 'GET_SETTINGS'; payload?: undefined }
    | { type: 'SAVE_SETTINGS'; payload: AXSettings }
    | { type: 'GENERATE_PROMPT'; payload: { intent: string; clerkToken?: string } };
