import { useState } from 'react';
import { useAuthSafe } from '../hooks/useClerkSafe';
import type { PromptReport } from '../../lib/types';
import { marked } from 'marked';
import { SkeletonLoader } from './SkeletonLoader';

interface Props {
    isUsingAxKey: boolean;
    hasApiKey: boolean;
}

export function PromptTab({ isUsingAxKey, hasApiKey }: Props) {
    const { getToken, isSignedIn } = useAuthSafe();
    const [isLoading, setIsLoading] = useState(false);
    const [intent, setIntent] = useState('');
    const [report, setReport] = useState<PromptReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!intent.trim()) return;

        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            if (isUsingAxKey && !isSignedIn) {
                throw new Error('Please sign in to use AX prompt builder.');
            }
            if (!isUsingAxKey && !hasApiKey) {
                throw new Error('Please add an API key in Settings.');
            }

            const clerkToken = isUsingAxKey ? await getToken() : null;

            const result = await chrome.runtime.sendMessage({
                type: 'GENERATE_PROMPT',
                payload: {
                    intent,
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
        await navigator.clipboard.writeText(report.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 flex flex-col gap-4 h-full">
            {/* Input Phase */}
            {!report && !isLoading && (
                <div className="flex flex-col gap-4 py-2">
                    <div className="text-center mb-2">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                            💬
                        </div>
                        <h2 className="text-base font-semibold">Prompt Builder</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Generate rich context prompts for Lovable or Cursor.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300 ml-1">What do you want to build or change?</label>
                        <textarea
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            placeholder="e.g. Add a dark mode toggle to the navbar..."
                            className="w-full h-24 text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none shadow-inner"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={!intent.trim()}
                        className="ax-pulse px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25"
                    >
                        Generate Prompt
                    </button>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 mt-2">
                        <p className="text-[11px] text-emerald-300/80 leading-relaxed text-center">
                            AX will capture the page DOM, network state, and errors, and use the LLM to write a comprehensive prompt tailored for your intent.
                        </p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="pt-8">
                    <SkeletonLoader
                        message="Crafting Prompt..."
                        subMessage="Analysing page state and user intent..."
                    />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">⚠️ {error}</p>
                    <button
                        onClick={() => { setError(null); setIsLoading(false); }}
                        className="mt-2 text-xs text-white underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Results */}
            {report && (
                <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                        <span className="text-xs font-semibold text-slate-300">Generated Prompt</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setReport(null); setError(null); setIntent(''); }}
                                className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleCopy}
                                className={`text-[10px] px-3 py-1 rounded-md font-medium transition-all ${copied
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                                    }`}
                            >
                                {copied ? '✅  Copied!' : '📋 Copy Prompt'}
                            </button>
                        </div>
                    </div>

                    {/* Raw Text Box */}
                    <div className="flex-1 relative rounded-lg bg-slate-800/50 border border-slate-700/50 overflow-hidden min-h-[200px]">
                        <textarea
                            readOnly
                            value={report.prompt}
                            className="absolute inset-0 w-full h-full p-3 bg-transparent text-xs text-slate-300 resize-none focus:outline-none font-mono leading-relaxed"
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-500 shrink-0">
                        Paste this directly into Lovable, Cursor, or Copilot.
                    </p>
                </div>
            )}
        </div>
    );
}
