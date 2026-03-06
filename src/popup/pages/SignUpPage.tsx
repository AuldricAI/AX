import { SignUp } from '@clerk/chrome-extension';
import { CLERK_ENABLED, useAuthSafe } from '../hooks/useClerkSafe';
import { Logo } from '../components/Logo';

export function SignUpPage() {
    const { isSignedIn } = useAuthSafe();

    if (!CLERK_ENABLED) {
        return (
            <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 text-white">
                <p className="text-sm text-slate-400">Sign-up is not available. Configure a Clerk key to enable authentication.</p>
            </div>
        );
    }

    if (isSignedIn) {
        return (
            <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-8 text-white">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Logo className="w-10 h-10" />
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 animate-[bounce_1s_ease-in-out_infinite]">
                    <span className="text-2xl">✅</span>
                </div>
                <h1 className="text-xl font-semibold mb-3 text-center">Account Created!</h1>
                <p className="text-sm text-slate-400 text-center max-w-[280px]">
                    You can now safely close this tab and return to the AX extension. You are automatically signed in.
                </p>
                <p className="text-xs font-semibold text-slate-500 text-center mt-8">
                    AX - Agentic Experience
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 overflow-y-auto">
            <SignUp routing="virtual" />
        </div>
    );
}
