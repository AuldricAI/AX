import { Outlet, useNavigate } from 'react-router';
import { ClerkProvider } from '@clerk/chrome-extension';
import { CLERK_ENABLED } from '../hooks/useClerkSafe';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Chrome extensions need chrome-extension:// URLs for redirect props
const POPUP_URL = chrome.runtime.getURL('popup.html');

export function RootLayout() {
    const navigate = useNavigate();

    if (!CLERK_ENABLED) {
        return <Outlet />;
    }

    return (
        <ClerkProvider
            publishableKey={CLERK_KEY}
            routerPush={(to) => navigate(to)}
            routerReplace={(to) => navigate(to, { replace: true })}
            afterSignOutUrl={`${POPUP_URL}#/`}
            signInFallbackRedirectUrl={`${POPUP_URL}#/`}
            signUpFallbackRedirectUrl={`${POPUP_URL}#/`}
        >
            <Outlet />
        </ClerkProvider>
    );
}
