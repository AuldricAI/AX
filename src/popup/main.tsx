import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import App from './App';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { SuccessPage } from './pages/SuccessPage';
import '../styles/index.css';

// Use HashRouter so we can open routes directly in a new tab
// Example: chrome-extension://<id>/popup.html#/sign-in
const router = createHashRouter([
    {
        element: <RootLayout />,
        children: [
            { path: '/', element: <App /> },
            { path: '/sign-in', element: <SignInPage /> },
            { path: '/sign-up', element: <SignUpPage /> },
            { path: '/success', element: <SuccessPage /> },
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
