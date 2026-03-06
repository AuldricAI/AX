import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/chrome-extension';
import { useAuthSafe, CLERK_ENABLED } from './hooks/useClerkSafe';
import { DiagnoseTab } from './components/DiagnoseTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { PromptTab } from './components/PromptTab';
import { WelcomeTab } from './components/WelcomeTab';
import { ScannerTab } from './components/ScannerTab';
import { Logo } from './components/Logo';
import { useSettings } from './hooks/useSettings';

type TabId = 'diagnose' | 'prompt' | 'scanner' | 'history';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'diagnose', label: 'Diagnose', icon: '⚡' },
    { id: 'prompt', label: 'Prompt', icon: '💬' },
    { id: 'scanner', label: 'Scan', icon: '🔍' },
    { id: 'history', label: 'History', icon: '📋' },
];

export default function App() {
    const { isLoaded: isClerkLoaded, isSignedIn } = useAuthSafe();
    const { settings, saveSettings, isLoaded: isSettingsLoaded, hasApiKey, isUsingAxKey } = useSettings();
    const [activeTab, setActiveTab] = useState<TabId>('prompt');
    const [showSettings, setShowSettings] = useState(false);

    const isAppLoaded = isSettingsLoaded && isClerkLoaded;

    // AX mode: need Clerk sign-in. BYOK mode: need own API key.
    const isAuthed = (isUsingAxKey && isSignedIn) || hasApiKey;

    // Initialise tab and settings view once loaded
    useEffect(() => {
        if (isAppLoaded) {
            setActiveTab(isAuthed ? 'diagnose' : 'prompt');
            // When newly authenticated, ensure we close the settings view if it was open
            if (isAuthed && showSettings) {
                setShowSettings(false);
            }
        }
    }, [isAppLoaded, isAuthed]);

    if (!isAppLoaded) {
        return (
            <div className="min-h-[560px] w-[420px] bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Loading AX...</span>
                </div>
            </div>
        );
    }

    if (!isAuthed && !showSettings) {
        return <WelcomeTab onConnectByok={() => setShowSettings(true)} />;
    }

    return (
        <div className="flex flex-col h-[560px] w-[420px] bg-slate-950 text-white">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <Logo className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold tracking-tight">AX</span>
                        <span className="text-[10px] text-slate-500 ml-1.5 flex flex-col">Agentic Experience</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showSettings ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                    {CLERK_ENABLED && isSignedIn ? (
                        <UserButton />
                    ) : hasApiKey ? (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs border border-slate-700 hover:bg-slate-700 transition-colors"
                            title="Profile & Settings"
                        >
                            👤
                        </button>
                    ) : null}
                </div>
            </header>

            {showSettings ? (
                <main className="flex-1 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-slate-800/50 flex items-center">
                        {isAuthed && (
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                ← Back
                            </button>
                        )}
                        {!isAuthed && (
                            <span className="text-xs text-amber-400 font-medium ml-1">Setup Required</span>
                        )}
                    </div>
                    <SettingsTab settings={settings} onSave={saveSettings} />
                </main>
            ) : (
                <>
                    {/* Tab Bar */}
                    <div className="flex border-b border-slate-800/50 shrink-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <main className="flex-1 overflow-y-auto relative">
                        {activeTab === 'diagnose' && <DiagnoseTab hasApiKey={hasApiKey} isUsingAxKey={isUsingAxKey} onGoToSettings={() => setShowSettings(true)} />}
                        {activeTab === 'prompt' && <PromptTab isUsingAxKey={isUsingAxKey} hasApiKey={hasApiKey} />}
                        {activeTab === 'scanner' && <ScannerTab />}
                        {activeTab === 'history' && <HistoryTab />}
                    </main>
                </>
            )}

            {/* Footer */}
            <div className="px-4 py-1.5 border-t border-slate-800/50 shrink-0 text-[10px] text-slate-600 flex items-center justify-between">
                <span>AX v{chrome.runtime.getManifest().version}</span>
                <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAuthed ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                    {isAuthed ? 'Ready' : isUsingAxKey ? 'Sign in required' : 'No API key'}
                </span>
            </div>
        </div>
    );
}
