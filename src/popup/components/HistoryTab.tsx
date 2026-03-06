import { useState, useEffect } from 'react';
import { formatMarkdown } from '../../lib/formatters';
import type { DiagnosticReport } from '../../lib/types';
import { marked } from 'marked';

export function HistoryTab() {
    const [history, setHistory] = useState<DiagnosticReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (result) => {
            if (Array.isArray(result)) setHistory(result);
        });
    }, []);

    const handleClear = async () => {
        await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
        setHistory([]);
        setSelectedReport(null);
    };

    const handleCopy = async (report: DiagnosticReport) => {
        await navigator.clipboard.writeText(formatMarkdown(report));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (selectedReport) {
        return (
            <div className="p-4 flex flex-col gap-3">
                <button
                    onClick={() => setSelectedReport(null)}
                    className="text-xs text-slate-500 hover:text-slate-300 self-start"
                >
                    ← Back to history
                </button>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500">{new URL(selectedReport.capture.url).hostname}</p>
                    <p className="text-xs text-white font-medium mt-0.5">{selectedReport.capture.title}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                        {new Date(selectedReport.timestamp).toLocaleString()}
                    </p>
                </div>
                <div
                    className="p-3 rounded-lg bg-slate-800/30 prose prose-sm prose-invert prose-p:text-[11px] prose-p:leading-relaxed prose-li:text-[11px] prose-headings:text-slate-200 prose-a:text-blue-400 max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked.parse(selectedReport.summary, { async: false }) as string }}
                />
                <div className="space-y-1.5">
                    {selectedReport.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-slate-800/30">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${issue.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                                    issue.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                        issue.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-slate-500/10 text-slate-400'
                                }`}>
                                {issue.severity.toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-300 truncate">{issue.title}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => handleCopy(selectedReport)}
                    className="w-full py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
                >
                    {copied ? '✅ Copied!' : '📋 Copy Report'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Diagnosis History</h2>
                {history.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="text-[10px] text-slate-600 hover:text-red-400 transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                    <span className="text-3xl opacity-30">📋</span>
                    <p className="text-xs text-slate-500">No diagnoses yet</p>
                    <p className="text-[10px] text-slate-600">Go to Diagnose tab and AX a page</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {history.map((report, i) => {
                        const criticalCount = report.issues.filter(i => i.severity === 'critical').length;
                        const totalIssues = report.issues.length;
                        let hostname = '';
                        try { hostname = new URL(report.capture.url).hostname; } catch { }

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedReport(report)}
                                className="text-left p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{hostname}</span>
                                    <span className="text-[10px] text-slate-600">
                                        {new Date(report.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-white font-medium mt-0.5 truncate">{report.capture.title}</p>
                                <div className="flex gap-2 mt-1.5">
                                    <span className="text-[10px] text-slate-500">{totalIssues} issues</span>
                                    {criticalCount > 0 && (
                                        <span className="text-[10px] text-red-400">{criticalCount} critical</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
