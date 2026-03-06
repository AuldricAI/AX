# AX (Agentic Experience) - Roadmap

This document outlines future features, ideas, and improvements planned for the AX extension.

## Planned Features

### 1. Local MCP Server Development (`@auldric/ax-mcp`)
*   **Description:** Build a standalone local Node.js server using the official `@modelcontextprotocol/sdk`.
*   **Approach:** Establish an HTTP/WebSocket interface for the server and define core MCP Resources (e.g., `ax://latest-capture`) and Tools (e.g., `trigger_browser_capture()`).
*   **Benefit:** Provides the foundational bridge for Cursor and Windsurf to communicate with the AX ecosystem.

### 2. Extension-to-MCP Communication Bridge
*   **Description:** Enable the AX Chrome Extension background service worker to send captured payloads directly to the local MCP server.
*   **Approach:** Add an option in AX Settings to connect to `localhost:3008` (the MCP server). When a diagnostic capture is triggered, `POST` the JSON state to the MCP server's webhook so it stays in the server's memory.
*   **Benefit:** Feeds the MCP server with real-time browser state (DOM, Network, Console) for the IDE to access.



### 3. Multi-Page / Site-Wide Scanning
*   **Description:** Instead of just capturing the current active tab, allow the extension to scan the "main pages" of an application automatically.
*   **Approach:** Open an invisible/background tab to automatically navigate to various pages (Home, About, Pricing, etc.), wait for them to load, extract the full state (including Console and Network errors), and synthesize a comprehensive multi-page report.
*   **Benefit:** Catches issues that might only appear on specific routes without requiring the user to manually visit and click "Diagnose" on each one.

### 4. Prompt History
*   **Description:** Update the History tab to save generated Prompts, not just Diagnostic Reports.
*   **Benefit:** Prevents losing a perfectly crafted prompt if the user accidentally closes the extension popup.

### 5. Background Auto-Scanning
*   **Description:** Implement a passive background mode where the extension automatically runs local security and console error scans (free, non-LLM checks) whenever a page loads.
*   **Benefit:** If it detects a JavaScript error or exposed secret, the AX icon flashes red in the toolbar to alert the user immediately.


