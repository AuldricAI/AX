// Polyfills for Node.js globals expected by @clerk/chrome-extension
window.global = window;
window.process = window.process || { env: { NODE_ENV: 'production' } };
