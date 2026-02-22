---
id: dealpulse-smoke-deploy-guide
title: "DealPulse Mock Prototype — Setup, Smoke, and Deploy Guide"
type: guide
status: active
owner: ivan
created: 2026-02-20
updated: 2026-02-20
tags: [dealpulse, hackathon, mcp-app, manufact, deploy]
---

# DealPulse Mock Prototype — Setup, Smoke, and Deploy Guide

## 1) Local setup

```bash
npm install
npm run build
```

Notes:

- This prototype is TypeScript-only and defaults to live Markster calls when
  `MARKSTER_CUSTOMER_API_KEY` is set; it can be switched to mock mode with
  `MARKSTER_MOCK_MODE=true`.
- The MCP UI is bundled as `dist/resources/app.html`.

## 2) Local smoke check

1. Start the server:

```bash
PORT=3002 npm run start
```

2. Confirm health endpoint:

```bash
curl -s http://127.0.0.1:3002/
```

Expected output:

```json
{
  "name": "Markster Business OS MCP",
  "status": "running",
  "health": "ok",
  "mode": "live",
  "markster_api": "https://panel.markster.io"
}
```

3. Confirm MCP tool metadata responds from the Streamable HTTP route.

```bash
curl -sS \
  -H 'Accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  -X POST http://127.0.0.1:3002/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expected response should include the explicit tool catalog (25 tools), including:

- `sales_intelligence`
- `customer_workspace_snapshot`
- `task_workspace`
- `ai_team_workspace`
- `content_calendar_workspace`
- `outreach_sequence_workspace`
- `domain_mailbox_manage`
- `voice_pack_workspace`

This keeps the LLM-facing API tight while surfacing all 24 Markster
capabilities as explicit tools.

Why this header matters:

- The Streamable transport returns SSE-style responses for MCP.
- If the `Accept` header is missing `application/json` and `text/event-stream`, the server returns:
  `Not Acceptable: Client must accept both application/json and text/event-stream`.

### Automated validation CLI (recommended pre-demo check)

```bash
npm run mcp:test -- check --endpoint http://127.0.0.1:3002/mcp
npm run mcp:test -- list-tools --endpoint https://your-deployed-server.mcp-use.com/mcp
npm run mcp:test -- health --endpoint https://your-deployed-server.mcp-use.com/mcp
npm run mcp:test:check -- --json
```

For CI-like runs, set `MCP_TEST_ENDPOINT`:

```bash
MCP_TEST_ENDPOINT=https://your-deployed-server.mcp-use.com/mcp npm run mcp:test:check
```

## 3) Deploy checklist (Manufact Cloud)

1. Ensure `@mcp-use/cli` is available (already in `package.json`).
2. Log in to Manufact per your environment requirements.
3. From repo root run:

```bash
npm run deploy
```

For hosts without a system Node runtime, the service deploy now auto-installs Node via nvm:

- pulls and installs nvm to `/home/app/.nvm` if missing,
- installs latest LTS (`nvm install --lts`),
- and runs the service under that nvm-managed Node.

You can bootstrap manually on the host if needed:

```bash
export HOME=/home/app
export NVM_DIR=$HOME/.nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source "$NVM_DIR/nvm.sh"
nvm install --lts
nvm alias default "lts/*"
nvm use default
```

4. Confirm deploy URL is reachable and route returns the same JSON health payload.
5. Validate basic in-host MCP flow: `tools/list` then call one tool and render UI panel.

## 4) Rollback plan for demo

If host deploy is slow or blocked:

- Use this local run as the fallback flow.
- For demo, provide local URL with the same MCP App URL path.
- Keep dummy data deterministic so UI behavior is repeatable during the event.
