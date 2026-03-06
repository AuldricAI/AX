// AX — Safe Clerk wrapper
// Returns no-op defaults when VITE_CLERK_PUBLISHABLE_KEY is not set,
// so the app works in BYOK-only mode without Clerk.

import { useAuth as useClerkAuth } from '@clerk/chrome-extension';

export const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const CLERK_DISABLED_AUTH = {
    isLoaded: true,
    isSignedIn: false,
    getToken: async () => null,
    signOut: async () => { },
} as const;

/**
 * Drop-in replacement for `useAuth()` from @clerk/chrome-extension.
 * When Clerk is not configured, returns safe defaults so the rest of the
 * app can operate in BYOK-only mode without ever calling Clerk APIs.
 */
export function useAuthSafe() {
    if (!CLERK_ENABLED) return CLERK_DISABLED_AUTH;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClerkAuth();
}
