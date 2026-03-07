import { useState, useEffect } from 'react';
import { useAuthSafe, CLERK_ENABLED } from '../hooks/useClerkSafe';
import type { AXSettings, LLMSettings, ProjectSpec } from '../../lib/types';

interface Props {
    settings: AXSettings;
    onSave: (settings: AXSettings) => void;
}

export function SettingsTab({ settings, onSave }: Props) {
    const { signOut, isSignedIn } = useAuthSafe();
    const [mode, setMode] = useState<'ax' | 'byok'>(CLERK_ENABLED ? (settings.mode || 'ax') : 'byok');
    const [ownKey, setOwnKey] = useState(settings.mode === 'byok' ? settings.llm.apiKey : '');
    const [ownEndpoint, setOwnEndpoint] = useState(settings.llm.endpoint || '');
    const [ownModel, setOwnModel] = useState(settings.mode === 'byok' ? settings.llm.model : '');
    const [projectSpecs, setProjectSpecs] = useState<ProjectSpec[]>(settings.projectSpecs || []);
    const [projectStage, setProjectStage] = useState<'early-dev' | 'pre-launch' | 'production'>(settings.projectStage || 'early-dev');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setMode(settings.mode || 'ax');
        if (settings.mode === 'byok') {
            setOwnKey(settings.llm.apiKey);
            setOwnModel(settings.llm.model);
            setOwnEndpoint(settings.llm.endpoint || '');
        }
        setProjectStage(settings.projectStage || 'early-dev');
        setProjectSpecs(settings.projectSpecs || []);
    }, [settings]);

    const handleSave = () => {
        if (mode === 'ax') {
            onSave({
                ...settings,
                mode: 'ax',
                llm: { provider: 'vercel', apiKey: '', model: 'zai/glm-4.7-flashx' },
                projectStage,
                projectSpecs,
            });
        } else {
            onSave({
                ...settings,
                mode: 'byok',
                llm: {
                    provider: 'custom',
                    apiKey: ownKey,
                    model: ownModel,
                    endpoint: ownEndpoint,
                },
                projectSpecs,
            });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDisconnect = async () => {
        if (isSignedIn) {
            await signOut();
        }
        onSave({
            ...settings,
            mode: 'ax',
            llm: { provider: 'vercel', apiKey: '', model: 'zai/glm-4.7-flashx' },
            projectStage,
            projectSpecs,
        });
    };

    const addSpec = () => {
        setProjectSpecs([...projectSpecs, { id: crypto.randomUUID(), name: '', content: '' }]);
    };

    const updateSpec = (id: string, field: 'name' | 'content', value: string) => {
        setProjectSpecs(projectSpecs.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSpec = (id: string) => {
        setProjectSpecs(projectSpecs.filter(s => s.id !== id));
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <h2 className="text-sm font-semibold">AI Settings</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose how AX connects to an AI model for diagnostics.
                </p>
            </div>

            {/* Mode Toggle — only shown when Clerk is available */}
            {CLERK_ENABLED && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('ax')}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all border ${mode === 'ax'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40'
                            : 'bg-slate-800/30 text-slate-400 border-slate-700/30 hover:border-slate-600/50'
                            }`}
                    >
                        <span className="block text-sm mb-0.5">✨ Use AX's key</span>
                        <span className="block text-[10px] text-slate-500">Works instantly, no setup</span>
                    </button>
                    <button
                        onClick={() => setMode('byok')}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all border ${mode === 'byok'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40'
                            : 'bg-slate-800/30 text-slate-400 border-slate-700/30 hover:border-slate-600/50'
                            }`}
                    >
                        <span className="block text-sm mb-0.5">🔑 Use your own key</span>
                        <span className="block text-[10px] text-slate-500">Bring your own API key</span>
                    </button>
                </div>
            )}

            {/* Own Key Fields */}
            {mode === 'byok' && (
                <div className="flex flex-col gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">API Key</label>
                        <input
                            type="password"
                            value={ownKey}
                            onChange={(e) => setOwnKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                        <p className="text-[10px] text-slate-600">
                            🔒 Stored locally. Never sent anywhere except your provider.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">API Endpoint</label>
                        <input
                            type="text"
                            value={ownEndpoint}
                            onChange={(e) => setOwnEndpoint(e.target.value)}
                            placeholder="https://api.openai.com/v1/chat/completions"
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Model</label>
                        <input
                            type="text"
                            value={ownModel}
                            onChange={(e) => setOwnModel(e.target.value)}
                            placeholder="gpt-4o-mini"
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    {/* Project Stage Selection */}
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Project Stage
                            </label>
                            <span className="text-xs text-white/40">Adjusts diagnostic strictness</span>
                        </div>

                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${projectStage === 'early-dev' ? 'bg-white/10 border-[#85002F]/50 shadow-[0_0_15px_rgba(133,0,47,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="radio"
                                    name="projectStage"
                                    value="early-dev"
                                    checked={projectStage === 'early-dev'}
                                    onChange={(e) => setProjectStage(e.target.value as 'early-dev')}
                                    className="w-4 h-4 text-[#85002F] bg-black/50 border-white/20 focus:ring-[#85002F] focus:ring-offset-black"
                                />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium transition-colors ${projectStage === 'early-dev' ? 'text-white' : 'text-slate-300'}`}>1. Early Development</p>
                                    <p className="text-xs text-white/50 mt-1">Focus only on broken code, errors, and crashes. Ignores SEO, alt text, and minor performance quirks.</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${projectStage === 'pre-launch' ? 'bg-white/10 border-[#85002F]/50 shadow-[0_0_15px_rgba(133,0,47,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="radio"
                                    name="projectStage"
                                    value="pre-launch"
                                    checked={projectStage === 'pre-launch'}
                                    onChange={(e) => setProjectStage(e.target.value as 'pre-launch')}
                                    className="w-4 h-4 text-[#85002F] bg-black/50 border-white/20 focus:ring-[#85002F] focus:ring-offset-black"
                                />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium transition-colors ${projectStage === 'pre-launch' ? 'text-white' : 'text-slate-300'}`}>2. Pre-launch / QA</p>
                                    <p className="text-xs text-white/50 mt-1">Strict grading. Checks accessibility (WCAG), performance (TTFB), and SEO fundamentals heavily.</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${projectStage === 'production' ? 'bg-white/10 border-[#85002F]/50 shadow-[0_0_15px_rgba(133,0,47,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="radio"
                                    name="projectStage"
                                    value="production"
                                    checked={projectStage === 'production'}
                                    onChange={(e) => setProjectStage(e.target.value as 'production')}
                                    className="w-4 h-4 text-[#85002F] bg-black/50 border-white/20 focus:ring-[#85002F] focus:ring-offset-black"
                                />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium transition-colors ${projectStage === 'production' ? 'text-white' : 'text-slate-300'}`}>3. Production</p>
                                    <p className="text-xs text-white/50 mt-1">Hyper-focused on end-user impact, unhandled edge cases, and systemic performance degradation.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* AX Key Info */}
            {mode === 'ax' && (
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                    {isSignedIn ? (
                        <p className="text-[11px] text-indigo-400/80 leading-relaxed">
                            ✅ You're signed in and using AX's built-in AI. No configuration needed — just head to
                            the <strong>Diagnose</strong> tab and start debugging.
                        </p>
                    ) : (
                        <p className="text-[11px] text-amber-400/80 leading-relaxed">
                            🔐 Sign in with your AX account to use the built-in AI key. Use the Sign In button on the Welcome screen.
                        </p>
                    )}
                </div>
            )}

            {/* Project Specifications */}
            <div className="pt-4 border-t border-slate-700/50 mt-2">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-sm font-semibold">Project Specifications</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Add custom rules (e.g., .cursorrules, design guidelines) for context-aware diagnostics.
                        </p>
                    </div>
                    <button
                        onClick={addSpec}
                        className="text-xs bg-slate-800 text-slate-300 hover:text-white px-2 py-1.5 rounded-md border border-slate-700 transition"
                    >
                        + Add Spec
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {projectSpecs.length === 0 ? (
                        <p className="text-[11px] text-slate-600 italic">No specifications added yet.</p>
                    ) : (
                        projectSpecs.map(spec => (
                            <div key={spec.id} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg space-y-2">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={spec.name}
                                        onChange={(e) => updateSpec(spec.id, 'name', e.target.value)}
                                        placeholder="Spec Name (e.g., Cursor Rules)"
                                        className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded p-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                                    />
                                    <button
                                        onClick={() => removeSpec(spec.id)}
                                        className="text-red-400/70 hover:text-red-400 p-1 font-bold"
                                        title="Remove Specification"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <textarea
                                    value={spec.content}
                                    onChange={(e) => updateSpec(spec.id, 'content', e.target.value)}
                                    placeholder="Paste your rules or specifications here..."
                                    className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 h-24 resize-y"
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Save */}
            <div className="flex flex-col gap-2 mt-2">
                <button
                    onClick={handleSave}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${saved
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20'
                        }`}
                >
                    {saved ? '✅ Saved!' : 'Save Settings'}
                </button>

                <button
                    onClick={handleDisconnect}
                    className="w-full py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 active:scale-[0.98] transition-all duration-200"
                >
                    Disconnect (Log Out)
                </button>
            </div>
        </div>
    );
}
