import { useState, useEffect } from 'react';

export function ScannerTab() {
    const [urls, setUrls] = useState<string[]>([]);
    const [isSpidering, setIsSpidering] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState<any>(null);

    // Spider on load
    useEffect(() => {
        handleSpider();
    }, []);

    const handleSpider = async () => {
        setIsSpidering(true);
        setUrls([]);
        setScanResults(null);
        try {
            const response = await chrome.runtime.sendMessage({ type: 'SPIDER_ACTIVE_TAB' });
            if (response?.success && response.urls) {
                setUrls(response.urls);
            }
        } catch (error) {
            console.error("Spidering failed:", error);
        } finally {
            setIsSpidering(false);
        }
    };

    const handleScan = async () => {
        if (urls.length === 0) return;

        setIsScanning(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'TRIGGER_BATCH_SCAN',
                payload: { urls }
            });

            if (response?.error) {
                console.error("Batch scan failed:", response.error);
            } else {
                setScanResults(response.data);
            }
        } catch (error) {
            console.error("Error communicating with background script:", error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-4">
            <h2 className="text-lg font-semibold text-white mb-1">Site Scanner (Beta)</h2>
            <p className="text-xs text-slate-400 mb-4">
                Automatically spiders the active tab to detect internal links and diagnoses the entire application.
            </p>

            {isSpidering ? (
                <div className="flex flex-col items-center justify-center h-32 bg-slate-900 border border-slate-800 rounded-lg mb-4">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400">Discovering links...</p>
                </div>
            ) : urls.length > 0 ? (
                <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4 max-h-[160px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pages found ({urls.length}/5 max)</span>
                        <button onClick={handleSpider} className="text-[10px] text-blue-400 hover:text-blue-300">Rescan</button>
                    </div>
                    <ul className="space-y-1">
                        {urls.map((u, i) => {
                            let path = u;
                            try { path = new URL(u).pathname; } catch { }
                            return (
                                <li key={i} className="text-xs text-slate-300 flex items-center gap-2 truncate">
                                    <span className="text-slate-600 text-[10px]">{i + 1}.</span>
                                    {path || '/'}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 bg-slate-900 border border-slate-800 rounded-lg mb-4">
                    <p className="text-xs text-slate-500">No internal links found on this page.</p>
                </div>
            )}

            <button
                onClick={handleScan}
                disabled={isScanning || urls.length === 0}
                className="w-full py-3 rounded-xl font-medium transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
            >
                {isScanning ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Scanning in Background...
                    </span>
                ) : (
                    'Diagnose All Pages'
                )}
            </button>

            {scanResults && (
                <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <h3 className="text-sm font-semibold text-white mb-1">Scan Complete</h3>
                    <p className="text-xs text-slate-400">
                        {scanResults.length} pages captured. Open the History tab to view the results (API merging coming soon).
                    </p>
                </div>
            )}
        </div>
    );
}
