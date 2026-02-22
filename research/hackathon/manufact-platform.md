---
id: manufact-platform-deep-dive
title: "Manufact Deep Dive — Platform, SDK, Cloud, Founders"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, manufact, mcp-use, sdk]
---

# Manufact Deep Dive — Platform, SDK, Cloud, Founders

## Overview

Manufact (formerly mcp-use, YC S25) is the leading open-source SDK + managed cloud platform for MCP. Think "Vercel for MCP": one SDK to build, Inspector to debug/preview, GitHub → instant cloud deploy. 9k+ GitHub stars, 5M+ downloads, used by ~4k companies (incl. NASA, NVIDIA, SAP), 20% of Fortune 500 per YC profile.

## What `npx create-mcp-use-app` Generates

```
my-mcp-server/
├── resources/
│   └── component.tsx          # Example React widgets (useWidget() hook, interactive UIs)
├── public/
│   ├── icon.svg               # Server icon
│   └── favicon.ico
├── index.ts                   # Entry point – serverInfo, registers tools/resources/prompts
├── package.json               # Scripts: "dev", "build", "start", "deploy"
├── tsconfig.json              # TS config (Edge/browser compatible, HMR support)
└── README.md
```

- Default config: Pre-wired for hot-reload, Apps SDK widget discovery, MCP spec compliance.
- Runs immediately: `npm install && npm run dev` → local server + Inspector in browser.
- Templates add examples for Supabase integration, Remotion video widgets, etc.

## Manufact Cloud: Deployment

**Zero-config hosting** for MCP Servers/Agents/Apps.

1. Scaffold with `create-mcp-use-app`.
2. Develop locally (Inspector auto-launches).
3. **Option A (recommended)**: Install Manufact GitHub App → connect repo → every `git push` triggers auto-build + deploy.
4. **Option B**: `npx @mcp-use/cli deploy --name my-server` → production URL in seconds.
5. Done: server live at `your-server.manufact.cloud`, instantly discoverable by any MCP client.

### Features

- Isolated single-threaded execution per agent (no race conditions).
- Built-in persistent memory/context across sessions.
- Global distribution, auto-scaling, low-latency.
- Pre-built shareable chat UI for every deployment.
- SDK integration: reference deployed agent by ID in 1 line.
- Observability dashboard (logs, tracing).

### Plans

- **Hobby (free forever)**: 5 deployments, 500k requests/mo, 100 agent executions/mo, 14-day logs, community support.
- **Business (custom pricing)**: Unlimited deployments, custom request limits, SOC 2 Type II, audit logs, RBAC/team mgmt, custom SLAs (up to 99.99%), priority Slack + dedicated success engineer.

### Gotchas

- Custom domains: Not mentioned on Hobby/Business.
- Environment variables: `.env` locally; GitHub secrets / dashboard secrets on Cloud.
- Hobby rate limits & cold starts exist; single-threaded = design tools idempotently.

## mcp-use SDK

- **Current versions**: TypeScript `mcp-use` 1.19.3 (very active); Python equivalent keeps pace. `@mcp-use/cli` 2.13.5.
- **Features**: MCP Client + Agent (6-8 lines), full server framework, React widgets for MCP Apps, Code Mode, OAuth, notifications, sampling, observability.
- **Known issues**: None major. Community reports smooth upgrades. Lock deps for protocol evolution.
- **Community**: 9k+ GitHub stars, 5M+ downloads, active Discord/LinkedIn/X.

## Inspector Tool

Interactive web-based debugger for any MCP server.

- `npm run dev` auto-launches browser UI.
- Discover tools/resources/prompts, call tools interactively, view real-time request history / JSON output / errors.
- Edit prompts live, resource preview, notifications, visualized errors.
- Essential for iteration — test end-to-end flows without full agent.

## Founders

- **Pietro Zullo** (co-founder, technical lead): Ex-founding engineer at Morgen (ETH Zurich AI/calendar spin-off used by Spotify, GitHub, Linear, Canva). ETH Zurich background. Active on X/LinkedIn.
- **Luigi Pederzani** (co-founder): Ex-YouTube creator (150k subs, 15M+ views). Strong product/marketing. Handles outward comms, YC intros.
- **Enrico Toniato** (CTO): Ex-IBM Research AI reasoning.

## Vision

MCP is becoming the foundational protocol for how AI systems interact with the world (like HTTP for agents). They want an open, developer-first ecosystem: "build anything a web app can do" with MCP, zero plumbing friction, production-grade. Companies will expose internal tools as MCP servers; devs ship MCP Apps as the new product primitive.

"Made by humans, used by agents."

## Business Model

Open-source SDK (free, viral adoption) + freemium Manufact Cloud (hosting, deploy, observability). Revenue from paid plans. Classic infra play. Raised **$6.3M seed** (Feb 2026, led by Peak XV, with Liquid 2, Ritual, Pioneer, YC, Supabase co-founder angels).

Sources: manufact.com, manufact.com/docs, github.com/mcp-use, npmjs.com, YC profile, Forbes, X/LinkedIn posts.
