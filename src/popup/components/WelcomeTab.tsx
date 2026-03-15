import { CLERK_ENABLED } from '../hooks/useClerkSafe';
import { Logo } from './Logo';

interface WelcomeTabProps {
    onConnectByok: () => void;
}

export function WelcomeTab({ onConnectByok }: WelcomeTabProps) {
    return (
        <div className="flex flex-col h-[560px] w-[420px] bg-slate-950 items-center justify-center p-6 text-white">
            <div className="w-16 h-16 mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Logo className="w-10 h-10" />
            </div>

            <div className="text-center mb-8">
                <h1 className="text-xl font-semibold mb-2">Welcome to AX</h1>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                    {CLERK_ENABLED
                        ? 'Choose how you want to connect to get started.'
                        : 'Add your own LLM API key to get started.'}
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[260px]">
                {CLERK_ENABLED && (
                    <>
                        <button
                            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup.html#/sign-in') })}
                            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <span>🔐</span> Sign In
                        </button>

                        <button
                            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup.html#/sign-up') })}
                            className="w-full py-2.5 px-4 rounded-lg border border-emerald-600/50 bg-emerald-500/10 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span>✨</span> Create Account
                        </button>

                        <div className="relative flex items-center my-1">
                            <div className="flex-grow border-t border-slate-700/50"></div>
                            <span className="px-3 text-[10px] text-slate-500">or</span>
                            <div className="flex-grow border-t border-slate-700/50"></div>
                        </div>
                    </>
                )}

                <button
                    onClick={onConnectByok}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <span>🔑</span> Bring Your Own Key
                </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-4 text-center px-4">
                {CLERK_ENABLED
                    ? 'Sign in for full access. BYOK stores your own LLM key locally.'
                    : 'Your API key is stored locally and never sent anywhere except your chosen provider.'}
            </p>
            <a
                href="https://github.com/AuldricAI/ax"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-600 hover:text-emerald-400 mt-2 transition-colors"
            >
                ⭐ Star us on GitHub — open source forever
            </a>
        </div>
    );
}
