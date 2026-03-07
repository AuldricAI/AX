import { SignUp } from '@clerk/chrome-extension';
import { CLERK_ENABLED } from '../hooks/useClerkSafe';

export function SignUpPage() {
    if (!CLERK_ENABLED) {
        return (
            <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 text-white">
                <p className="text-sm text-slate-400">Sign-up is not available. Configure a Clerk key to enable authentication.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[560px] w-[420px] bg-slate-950 items-center justify-center p-4 overflow-y-auto">
            <SignUp routing="virtual" />
        </div>
    );
}
