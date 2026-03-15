export function SkeletonLoader({ message, subMessage }: { message: string; subMessage: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-8 px-4 w-full">
            <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Glowing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-lg animate-pulse absolute">✨</span>
            </div>

            <div className="text-center space-y-1.5 w-full max-w-[240px]">
                <p className="text-sm font-medium text-white animate-pulse">{message}</p>
                <p className="text-xs text-slate-400">{subMessage}</p>
            </div>

            {/* Skeleton Lines */}
            <div className="w-full mt-4 space-y-3 bg-slate-800/20 border border-slate-700/30 p-4 rounded-xl shadow-inner relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                <div className="h-2.5 bg-slate-700/50 rounded-full w-3/4 animate-pulse" />
                <div className="h-2.5 bg-slate-700/50 rounded-full w-full animate-pulse delay-75" />
                <div className="h-2.5 bg-slate-700/50 rounded-full w-5/6 animate-pulse delay-150" />
                <div className="h-2.5 bg-slate-700/50 rounded-full w-1/2 animate-pulse delay-300 mt-2 text-emerald-500/20" />
            </div>
        </div>
    );
}
