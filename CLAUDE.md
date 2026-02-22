# CLAUDE.md — YC MCP Apps Hackathon

## What This Is

Markster's business operating system exposed via MCP for the YC MCP Apps Hackathon (Feb 21, 2026).
28 production tools across 8 categories, accessible from ChatGPT and Claude.
One new feature: pricing simulator with bidirectional slider + live Chart.js updates.

## Key Docs

- `docs/design.md` — Full design, architecture, positioning
- `docs/build-plan.md` — Build plan + division of labor (Attila = engineering, Ivan = pitch/demo)
- `docs/prep-guide.md` — Ivan's Friday prep checklist + demo script
- `docs/demo-walkthrough.md` — 10-step end-to-end walkthrough with sponsor integration
- `docs/markster-mcp-tools.md` — Full 28-tool inventory from Markster Panel APIs
- `docs/pitch-cheatsheet.md` — Every stat for the pitch, sourced
- `docs/session-state.md` — Current session state + conversation log

## Architecture

**NOT building from scratch.** Registering existing Markster Panel APIs as MCP tools.

| Category                  | Tools | Example                                                |
| ------------------------- | ----- | ------------------------------------------------------ |
| Customer Workspace        | 5     | `customer_workspace_snapshot` — "show me my business"  |
| Tasks                     | 3     | `task_workspace`, `task_action`                        |
| AI Team                   | 3     | `ai_team_workspace`, `ai_team_chat_turn`               |
| Content Artifacts         | 3     | `customer_artifact_workspace`                          |
| Content Calendar & Social | 4     | `content_calendar_workspace`, `content_post_workspace` |
| TAP Strategy & Outreach   | 5     | `tap_sequence_workspace`, `tap_enrollment`             |
| Domains & Mailboxes       | 3     | `domain_mailbox_manage`, `cold_mail_health`            |
| Voice & Localization      | 1     | `voice_pack_workspace`                                 |

**Plus:** Apollo enrichment (live, any domain) + financial modeling (deal impact + pricing simulator)

## 10 Minimum Tools for Demo Flow

1. `customer_workspace_snapshot` — one-call business bootstrap
2. Apollo enrichment — research any company (live)
3. `tap_icp_workspace` — ICP + targeting
4. `tap_sequence_workspace` + `tap_enrollment` — create sequence + enroll contacts
5. `tap_outreach_insights` — outreach performance
6. `dashboard_insights` — KPIs, metrics
7. `content_calendar_workspace` — content calendar
8. `content_post_workspace` — create + schedule social post
9. `voice_pack_workspace` — brand voice config
10. Financial modeling — deal impact + pricing simulator (NEW BUILD)

## Data

- `data/financials.json` — Puzzle-style financial baseline (configured, not mock)
- `data/mock-signals.json` — Person-level intent signals (5 prospects)
- `data/preseeded/` — Pre-cached Apollo company data (10 companies, backup only)
- Apollo API: `GET /api/v1/organizations/enrich?domain=X` with `X-Api-Key` header (LIVE)
- All 28 Markster tools: LIVE production APIs

## Tech Stack

- MCP server (Python preferred, TypeScript fallback)
- Scaffold already built and working in ChatGPT 5.2
- Chart.js for financial visualizations
- Vite + vite-plugin-singlefile (single HTML bundle)
- Deploy: Manufact Cloud (plan A) or own infra (plan B)

## Division of Labor

- **Attila (remote, Copenhagen):** All engineering — scaffold, MCP wiring, API integration, pricing simulator UI, deploy
- **Ivan (on-site, YC SF):** Pitch, demo, networking, real-time feedback

## Coding Rules

- Keep it simple. Hackathon = speed over perfection.
- The Pricing Simulator slider is the WOW moment. Prioritize it.
- Pre-seeded data fallback for Apollo calls. Demo must never break.
- Dark theme preferred (matches Claude UI).
- Bidirectional comms via `app.callServerTool()` — critical for slider.
- All Markster tools = thin MCP wrappers around existing REST APIs.

## Commits

`<type>(<scope>): <summary>` — types: feat, fix, docs, chore, refactor

## Positioning

"28 production tools. Your entire business operating system. One conversation. We showed you one flow — try the rest."

The YC interview answer: "This isn't a hackathon project. This is 2 years of production infrastructure exposed through MCP. The hackathon proved the distribution model works."
