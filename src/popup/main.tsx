import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import App from './App';
import '../styles/index.css';

// Use HashRouter so we can open routes directly in a new tab
// Example: chrome-extension://<id>/popup.html#/sign-in
const router = createHashRouter([
    {
        element: <RootLayout />,
        children: [
            { path: '/', element: <App /> },
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
