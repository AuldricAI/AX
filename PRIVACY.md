# Privacy Policy — AX (Agentic Experience)

**Last updated:** March 2026

## What AX Collects

AX captures browser page state **only when you explicitly click "AX This Page"**. This includes:

- **Page content:** DOM structure, text, meta tags, headings, images, and links from the active tab
- **Console logs:** JavaScript errors and warnings present on the page
- **Network requests:** URLs, status codes, and response times of HTTP requests made by the page
- **Performance metrics:** Page load timing (First Contentful Paint, Time to First Byte, etc.)
- **Exposed secrets:** API keys or credentials detected in page source (flagged locally, never transmitted)

AX does **not** collect browsing history, track which pages you visit, monitor clicks/scrolls, or run in the background.

## Where Your Data Goes

- **Your chosen LLM provider only.** When you trigger a diagnosis, the captured page state is sent to the LLM API you configured (DeepSeek, OpenRouter, Vercel AI Gateway, or a custom endpoint). AX never sends your data anywhere else.
- **Authentication (optional).** If you sign in via Clerk, authentication tokens are exchanged with Clerk's servers solely for session management.

## What's Stored Locally

The following is stored on your device using `chrome.storage.local` and **never leaves your browser**:

- Your API key and LLM provider settings
- Diagnostic history (past reports)
- Project specifications and preferences

## Third-Party Services

| Service | Purpose | Data shared |
|:--------|:--------|:------------|
| Your LLM provider (user-configured) | AI diagnostic analysis | Page state snapshot |
| Clerk (optional) | User authentication | Email, auth tokens |

## Data Selling / Sharing

AX does **not** sell, trade, or transfer your data to third parties for advertising, analytics, or any other purpose.

## Contact

If you have questions about this policy, open an issue at [github.com/AuldricAI/ax](https://github.com/AuldricAI/ax) or email hello@auldric.com.
