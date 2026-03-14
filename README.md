# AX — Agentic Experience

> Browser diagnostics for AI agents. AX the problem.

**AX** captures your browser's state — console errors, network failures, exposed secrets, DOM issues — and uses a cheap LLM (ZAI GLM-4.7-FlashX via Vercel AI Gateway) to produce structured diagnostic reports you can paste directly into your AI coding tool.

## Why AX?

When debugging web apps with AI agents (Claude, Cursor, Copilot), the bottleneck is **context** — your agent can't see the browser. AX bridges that gap:

1. **🪓 One-click diagnosis** — Capture page state and get AI-powered analysis
2. **🔒 Secret detection** — Scans for exposed API keys, tokens, and credentials (AWS, Stripe, Firebase, GitHub, etc.)
3. **📋 Copy-to-tool** — Formatted reports ready to paste into your AI coding assistant
4. **💰 Cheap** — Uses ZAI GLM-4.7-FlashX via Vercel AI Gateway instead of burning your Claude/GPT budget

## Architecture

```
Chrome Extension (MV3)
├── Content Script ──── Captures: console, network, DOM, secrets, performance
├── Service Worker ──── Aggregates data, formats payload, stores history
└── Popup (React) ───── Diagnose UI, BYOK / AX Mode toggle, settings
         │
         ├─ [BYOK Mode] ──▶ Direct API call (DeepSeek / OpenRouter / custom)
         │
         └─ [AX  Mode]  ──▶ api.auldric.com (Vercel AI SDK)
                                  │
                                  ▼
                            LLM Providers
```

## Quick Start

```bash
# Clone
git clone https://github.com/AuldricAI/ax.git
cd ax

# Configure environment
cp .env.example .env
# Edit .env if needed (see Environment Variables below)

# Install & build
npm install
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select the dist/ folder
```

## Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_AX_API_BASE` | No | Backend API URL for AX hosted mode. Default: `https://api.auldric.com` |

**BYOK mode:** The extension runs in Bring-Your-Own-Key mode — enter your LLM API key directly in Settings.

**AX hosted mode:** Users get access to AX's built-in AI key without configuring their own.

## Configuration

1. Click the AX extension icon
2. Go to **Settings** tab
3. Enter your API key:
   - **Vercel AI Gateway** (default, recommended — uses ZAI GLM-4.7-FlashX): Get a key at [sdk.vercel.ai/docs/ai-sdk-core/gateway](https://sdk.vercel.ai/docs/ai-sdk-core/gateway)
   - **DeepSeek** (alternative): Get a key at [platform.deepseek.com](https://platform.deepseek.com)
   - **OpenRouter** (multi-model): Get a key at [openrouter.ai](https://openrouter.ai)
   - **Any OpenAI-compatible endpoint**: Paste your API key, endpoint URL, and model name
4. Click **Save Settings**

> AX works without an API key too — you'll get local diagnostics (secret scanning, error detection) without the AI analysis.

## What AX Detects

### 🔒 Security
- Exposed AWS keys, Stripe secrets, Firebase configs
- Hardcoded passwords, JWT tokens, database connection strings
- GitHub tokens, Slack tokens, SendGrid keys

### ❌ Errors
- Console errors and framework error overlays
- Failed network requests (4xx, 5xx)
- Slow requests (>3s)

### 🔍 SEO & Accessibility
- Missing meta descriptions
- Images without alt text
- Missing structured data (JSON-LD)

### ⚡ Performance
- First Contentful Paint, Time to First Byte
- DOM Content Loaded, Load Complete timing

## Roadmap

- [x] **Phase 1**: State capture + secret detection + AI diagnosis
- [x] **Phase 2**: Copy-to-tool (Markdown, Compact, JSON formats)
- [ ] **Phase 3**: MCP server for automatic agent integration
- [ ] **Phase 4**: Native Messaging for IDE bridge

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Extension | Manifest V3, TypeScript, Vite |
| Popup UI | React 19 + Tailwind CSS |
| Content Script | Vanilla TS (injected on demand) |
| Background | Service Worker |
| Backend (AX Mode) | Vercel AI SDK (Next.js) |
| LLM | ZAI GLM-4.7-FlashX (default) / DeepSeek / OpenRouter (BYOK) |

## License

MIT — see [LICENSE](./LICENSE)

---

Built by [Auldric](https://auldric.com). AX the problem. 🪓
