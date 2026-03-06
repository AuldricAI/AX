/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
    readonly VITE_AX_API_BASE?: string;
    readonly VITE_DEFAULT_LLM_ENDPOINT: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
