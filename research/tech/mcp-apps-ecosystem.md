---
id: mcp-apps-ecosystem
title: "MCP Apps Ecosystem — Technical Landscape"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, tech, mcp]
---

# MCP Apps Ecosystem (Feb 19, 2026)

MCP Apps is the first official extension (SEP-1865, stabilized Jan 26 2026) to the Model Context Protocol. It lets MCP servers/tools return interactive UIs that render directly inside supported AI chat clients.

## Clients Supporting MCP Apps Today

| Client                     | Status                                       |
| -------------------------- | -------------------------------------------- |
| **Claude** (web + desktop) | Full support (shipped day-of launch, Jan 26) |
| **ChatGPT**                | Full support (rolling out)                   |
| **Goose**                  | Full support (docs + tutorials live)         |
| **VS Code** (Insiders)     | Full support (via MCP server config)         |
| **Airia**                  | Enterprise gateway, proxies to all four      |

Build once, works everywhere — no client-specific code required.

## MCP Apps Spec Summary

### Core Primitives

- **ui:// resources** — Servers register HTML/JS bundles under `ui://` URI scheme
- **Tool metadata** — Any tool opts-in with `_meta.ui.resourceUri` + optional `csp` and `permissions`
- **Rendering** — Host pre-fetches resource, renders in sandboxed iframe in conversation thread
- **CSP** — Declarative via `_meta.ui.csp`. Default = deny-by-default. Best practice: bundle everything via Vite singlefile so CSP is empty.
- **Sandbox** — Strict iframe: no parent DOM, no cookies/localStorage of host, no top-level navigation, restricted permissions
- **Bidirectional JSON-RPC** — Communication over `postMessage` using standard MCP JSON-RPC 2.0

### Tool Registration Example

```json
{
  "name": "visualize_data",
  "inputSchema": { ... },
  "_meta": {
    "ui": {
      "resourceUri": "ui://charts/interactive",
      "csp": ["https://cdn.jsdelivr.net"],
      "permissions": ["microphone"]
    }
  }
}
```

### Security Model

- Pre-declared + auditable resources
- User consent gates for UI-initiated actions
- Full logging possible
- All communication via loggable JSON-RPC

## mcp-use SDK Quickstart (Manufact)

```bash
npx create-mcp-use-app my-dealpulse-app
cd my-dealpulse-app
npm install
npm run dev    # hot reload + Inspector at http://localhost:3000/inspector
```

### Generated File Structure

```
my-dealpulse-app/
├── resources/          # React/Vue/Svelte UI widgets (MCP Apps)
│   └── component.tsx
├── public/
│   ├── icon.svg
│   └── favicon.ico
├── index.ts            # MCP server entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Build & Deploy

1. `npm run build`
2. Test locally (stdio or HTTP transport)
3. `yarn deploy` → Manufact MCP Cloud
   - GitHub repo → auto-build on every push
   - Branch deploys, metrics, logs, observability, scaling, auth/ACLs, inspector

Or use `@modelcontextprotocol/ext-apps` SDK for lower-level control.

## ext-apps Examples (Copy These Patterns)

All at https://github.com/modelcontextprotocol/ext-apps/tree/main/examples:

| Example                          | Relevance to DealPulse                                     |
| -------------------------------- | ---------------------------------------------------------- |
| **scenario-modeler-server**      | Financial scenario modeling — CLOSEST to DealPulse         |
| **customer-segmentation-server** | Interactive scatter/bubble charts + tabs                   |
| **budget-allocator-server**      | Budget/resource allocation with charts, sliders, real-time |
| **cohort-heatmap**               | Data visualization patterns                                |
| **system-monitor**               | Real-time dashboards                                       |

## Chart.js in Sandboxed Iframes

**Confirmed working.** Budget-allocator and customer-segmentation use interactive JS visualizations. Community examples (Claude + Chart.js widgets, QuickChart MCP server) all work.

Best practice: Bundle Chart.js + data via Vite singlefile → zero CSP entries needed. External CDN also works if declared in `_meta.ui.csp`.

## Known Limitations & Gotchas

- **Sandbox is strict** — No direct parent DOM, no persistent storage, limited browser APIs. Everything self-contained or via MCP tool calls.
- **CSP deny-by-default** — Bundle assets or explicitly whitelist CDNs.
- **Latency on tool calls from UI** — Round-trip to server (acceptable for finance UIs; use optimistic UI).
- **Client UX nuances** — Size/theming can vary slightly between hosts.
- **Needs public HTTPS endpoint** (or stdio for local/desktop clients).
- **No native mobile yet** — Desktop/web clients only.
- **Early ecosystem** — Still maturing; test with Inspector.

## Why This Is Perfect for DealPulse

Ship exactly the interactive financial modeling, tabs, and Chart.js dashboards needed — rendered natively inside Claude/ChatGPT/VS Code/Goose. Copy scenario-modeler + budget-allocator patterns (projections, charts, sliders, real-time updates). Build once, works everywhere.

Sources: [MCP Apps Blog](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), [ext-apps GitHub](https://github.com/modelcontextprotocol/ext-apps), [mcp-use GitHub](https://github.com/mcp-use/mcp-use-ts), [WorkOS MCP Apps post](https://workos.com/blog/2026-01-27-mcp-apps)
