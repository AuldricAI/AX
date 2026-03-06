// AX — Build Script
// 4-pass build: popup + signin, service worker, content script

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const alias = { '@': resolve(root, 'src') };

// ─── Pass 1: Popup (React) ─────────────────────────────────────────
console.log('\n🔨 Building popup...');
await build({
    root,
    plugins: [react()],
    base: '',
    resolve: { alias },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(root, 'popup.html'),
            },
            output: {
                // Inline all dynamic imports into a single bundle.
                // Chrome extension CSP can block cross-origin chunk fetches;
                // a single file avoids the issue entirely.
                inlineDynamicImports: true,
                entryFileNames: '[name].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
});

// Strip crossorigin attributes (breaks Chrome extension CSP)
for (const htmlFile of ['dist/popup.html']) {
    const htmlPath = resolve(root, htmlFile);
    if (existsSync(htmlPath)) {
        let html = readFileSync(htmlPath, 'utf-8');
        html = html.replace(/ crossorigin/g, '');
        writeFileSync(htmlPath, html);
    }
}

// ─── Pass 2: Service Worker (IIFE) ─────────────────────────────────
console.log('\n🔨 Building service worker...');
await build({
    root,
    plugins: [],
    base: '',
    resolve: { alias },
    build: {
        outDir: 'dist/background',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(root, 'src/background/service-worker.ts'),
            output: {
                format: 'iife',
                entryFileNames: 'service-worker.js',
                inlineDynamicImports: true,
            },
        },
    },
});

// ─── Pass 3: Content Script (IIFE) ─────────────────────────────────
console.log('\n🔨 Building content script...');
await build({
    root,
    plugins: [],
    base: '',
    resolve: { alias },
    build: {
        outDir: 'dist/content',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(root, 'src/content/state-capture.ts'),
            output: {
                format: 'iife',
                entryFileNames: 'state-capture.js',
                inlineDynamicImports: true,
            },
        },
    },
});

// ─── Copy manifest, polyfill & icons ──────────────────────────────
console.log('\n📋 Copying manifest & icons...');
copyFileSync(resolve(root, 'manifest.json'), resolve(root, 'dist/manifest.json'));

// Copy global polyfill required by Clerk
const polyfillSrc = resolve(root, 'global-polyfill.js');
if (existsSync(polyfillSrc)) {
    copyFileSync(polyfillSrc, resolve(root, 'dist/global-polyfill.js'));
}

const iconsDir = resolve(root, 'dist/icons');
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

const publicIcons = resolve(root, 'public/icons');
if (existsSync(publicIcons)) {
    for (const file of ['icon-16.png', 'icon-48.png', 'icon-128.png']) {
        const src = resolve(publicIcons, file);
        if (existsSync(src)) copyFileSync(src, resolve(iconsDir, file));
    }
}

console.log('\n✅ AX build complete!');
