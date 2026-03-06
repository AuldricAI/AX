import { useState } from 'react';
import { useAuthSafe } from '../hooks/useClerkSafe';
import { marked } from 'marked';
import { formatMarkdown } from '../../lib/formatters';
import type { DiagnosticReport } from '../../lib/types';

interface Props {
    hasApiKey: boolean;
    isUsingAxKey: boolean;
    onGoToSettings: () => void;
}

export function DiagnoseTab({ hasApiKey, isUsingAxKey, onGoToSettings }: Props) {
    const { getToken, isSignedIn } = useAuthSafe();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<DiagnosticReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleDiagnose = async () => {
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            // AX mode: need Clerk token. BYOK mode: key is in settings.
            if (isUsingAxKey && !isSignedIn) {
                throw new Error('Please sign in to use AX diagnostics.');
            }
            if (!isUsingAxKey && !hasApiKey) {
                throw new Error('Please add an API key in Settings.');
            }

            const clerkToken = isUsingAxKey ? await getToken() : null;

            const result = await chrome.runtime.sendMessage({
                type: 'CAPTURE_AND_DIAGNOSE',
                payload: {
                    mode: isUsingAxKey ? 'ax' : 'byok',
                    clerkToken: clerkToken ?? undefined,
                },
            });
            if (result?.error) {
                setError(result.error);
            } else {
                setReport(result);
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!report) return;
        await navigator.clipboard.writeText(formatMarkdown(report));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Hero / Diagnose Button */}
            {!report && !isLoading && (
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                        ⚡
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold">Diagnose This Page</h2>
                        <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                            Capture browser state, detect exposed secrets, and get AI-powered diagnostics.
                        </p>
                    </div>
                    <button
                        onClick={handleDiagnose}
                        className="ax-pulse px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                    >
                        🪓 AX This Page
                    </button>
                    {!hasApiKey && !isSignedIn && (
                        <button
                            onClick={onGoToSettings}
                            className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                        >
                            Add an API key for AI diagnosis →
                        </button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                        <p className="text-sm text-white">Analysing page...</p>
                        <p className="text-xs text-slate-500 mt-1">This can take a few seconds while the AI reads and diagnoses the page.</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">⚠️ {error}</p>
                    <button
                        onClick={handleDiagnose}
                        className="mt-2 text-xs text-white underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Results */}
            {report && (
                <div className="flex flex-col gap-3">
                    {/* Report Text */}
                    <div
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 max-h-[320px] overflow-y-auto ax-report prose prose-sm prose-invert prose-p:text-[11px] prose-p:leading-relaxed prose-li:text-[11px] prose-headings:text-slate-200 prose-a:text-blue-400 max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked.parse(report.summary, { async: false }) as string }}
                    />

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${copied
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/20'
                            }`}
                    >
                        {copied ? '✅ Copied!' : '📋 Copy for IDE'}
                    </button>

                    <p className="text-[10px] text-center text-slate-500">
                        Paste this report directly into your AI coding tool.
                    </p>

                    {/* New Diagnosis */}
                    <button
                        onClick={() => { setReport(null); setError(null); }}
                        className="text-xs text-slate-500 hover:text-slate-300 py-1"
                    >
                        ← Run new diagnosis
                    </button>
                </div>
            )}
        </div>
    );
}
