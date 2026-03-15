import { useEffect } from 'react';
import { Logo } from '../components/Logo';

export function SuccessPage() {
    useEffect(() => {
        // Automatically close the tab after a few seconds so the user isn't stuck
        const timer = setTimeout(() => {
            window.close();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="z-10 flex flex-col items-center justify-center max-w-md text-center">
                <div className="w-20 h-20 mb-8 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] border border-emerald-500/20">
                    <Logo className="w-12 h-12" />
                </div>

                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-6 border border-emerald-500/30 animate-[bounce_2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <span className="text-3xl">✅</span>
                </div>

                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                    Authentication Successful
                </h1>

                <p className="text-base text-slate-300 leading-relaxed mb-8">
                    You're all set! You can now safely close this tab and return to the AX extension to start using its features.
                </p>

                <button
                    onClick={() => window.close()}
                    className="px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all duration-200 border border-slate-700 shadow-lg"
                >
                    Close Tab
                </button>
            </div>

            <p className="absolute bottom-8 text-xs font-semibold text-slate-600 tracking-widest uppercase">
                AX - Agentic Experience
            </p>
        </div>
    );
}
