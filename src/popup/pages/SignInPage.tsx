import { SignIn } from '@clerk/chrome-extension';
import { CLERK_ENABLED } from '../hooks/useClerkSafe';
import { Logo } from '../components/Logo';

const POPUP_URL = chrome.runtime.getURL('popup.html');

export function SignInPage() {
    if (!CLERK_ENABLED) {
        return (
            <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 text-white">
                <p className="text-sm text-slate-400">Sign-in is not available. Configure a Clerk key to enable authentication.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 overflow-y-auto">
            {/* AX Branded Header */}
            <div className="flex flex-col items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-3">
                    <Logo className="w-5 h-5 text-emerald-500" />
                </div>
                <h1 className="text-lg font-semibold text-white">Sign in to AX</h1>
                <p className="text-xs text-slate-500 mt-0.5">Agentic Experience</p>
            </div>

            <SignIn
                routing="virtual"
                forceRedirectUrl={`${POPUP_URL}#/`}
                appearance={{
                    variables: {
                        colorPrimary: '#10b981',
                        colorBackground: '#0f172a',
                        colorText: '#f1f5f9',
                        colorTextSecondary: '#94a3b8',
                        colorInputBackground: '#1e293b',
                        colorInputText: '#f1f5f9',
                        borderRadius: '0.75rem',
                    },
                    elements: {
                        card: 'bg-transparent shadow-none',
                        headerTitle: 'hidden',
                        headerSubtitle: 'hidden',
                        socialButtonsBlockButton: 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700',
                        formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20',
                        footerActionLink: 'text-emerald-400 hover:text-emerald-300',
                        formFieldInput: 'bg-slate-800 border-slate-700 text-white',
                        formFieldLabel: 'text-slate-300',
                        dividerLine: 'bg-slate-700',
                        dividerText: 'text-slate-500',
                        footer: 'hidden',
                    },
                }}
            />
        </div>
    );
}
