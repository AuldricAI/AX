export function Logo({ className = '' }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="50,7 87.24,28.5 87.24,71.5 50,93 12.76,71.5 12.76,28.5" />
            <path d="M 33.5,35.5 L 17,74" />
            <path d="M 33.5,35.5 L 50,74" />
            <path d="M 23.5,58 L 43.5,58" />
            <path d="M 50,35.5 L 83,74" />
            <path d="M 83,35.5 L 50,74" />
        </svg>
    );
}
