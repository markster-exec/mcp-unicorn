# Your Entire Business. One Conversation.

**YC MCP Apps Hackathon | Feb 21, 2026 | Y Combinator, SF**

We replaced 8 SaaS tools with 7 natural-language prompts. In 90 seconds, a founder goes from "How's my business?" to closing a $150K deal — with real pipeline data, real intent signals, and a pricing simulator that tells you whether to discount or hold firm. All inside Claude.

This is not a hackathon prototype. This is 2 years of production infrastructure — 41 customers, $15.6K MRR, 82% gross margins — exposed through MCP in a single weekend.

---

## Why This Matters

The $1T+ SaaS market is collapsing. HubSpot down 70%. ZoomInfo down 49%. Five CEO departures in 2025. Every founder still stitches together 8-12 disconnected tools that don't talk to each other.

Meanwhile, 800M people use ChatGPT weekly. Claude is where developers live. Both have zero business context — no pipeline, no customers, no revenue.

We fixed that. **32 MCP tools. 8 business domains. 12 interactive scenes. One conversation.**

The founder asks a question. The AI workspace answers with live data, interactive charts, and actionable recommendations — not generic advice, but "Reema Batta at Figma has intent score 87/100, she visited your pricing page 6 times this week, here are your talking points for the call, and here's what happens to your runway if you offer 20% off."

---

## The Demo (7 prompts, 90 seconds)

| # | What you say | What happens |
|---|---|---|
| 1 | *"How's my business doing this morning?"* | Full business dashboard: $15.6K MRR, 82% margins, 41 customers, pipeline, tasks, notifications |
| 2 | *"Tell me about Figma"* | Live company profile via Apollo enrichment, auto-syncs $150K deal, key contacts |
| 3 | *"What signals do we have on Figma?"* | Reema Batta — VP Growth, intent 87/100, "Ready to Buy." 6 pricing page visits this week |
| 4 | *"What if I offer 20% discount?"* | **Interactive slider.** Drag to 10% → "TAKE THE DEAL." Drag to 35% → "DON'T DISCOUNT." Live Chart.js EV curves |
| 5 | *"Show me the deal impact"* | Financial narrative: MRR shift, margin impact, runway change, framing for Reema |
| 6 | *"Prep me for the call"* | Executive brief: talking points, do-not-do list, call script, warmest contact analysis |
| 7 | *"I have an hour, what should I do?"* | Time-boxed action plan: 5 tasks, $350K at stake, **Go buttons** that execute each task |

Every scene links to every other scene. The slider talks back to the server. The Go buttons trigger real tool calls.

---

## What Makes This Different

**Bidirectional UI inside the AI workspace.** The pricing simulator slider doesn't just display data — it calls `app.callServerTool()` to re-run financial models on every drag. The server responds, charts update, the verdict changes. This is not a static embed. This is a reactive application living inside Claude.

**Real business, real data.** $875K pipeline across 8 active deals. Person-level intent signals with behavioral scoring. Financial models that calculate close probability, expected value curves, and LTV impact. Not mock data for a demo — production APIs serving a live business.

**32 tools, zero new infrastructure.** Every tool is a thin MCP wrapper around existing Markster Panel REST APIs that serve 41 customers today. The hackathon didn't build a product. It proved a distribution model.

---

## Architecture

```
+-----------------------------------------------------------+
|                   Claude / ChatGPT                         |
|                   (AI Workspace)                           |
+--------------------------+--------------------------------+
                           | MCP Protocol
+--------------------------+--------------------------------+
|              Markster MCP Server                           |
|  Express 5 + StreamableHTTPServerTransport                 |
|  32 tools + UI resource (single-file HTML bundle)          |
+------------------------------------------------------------+
|  +-----------+ +-----------+ +-----------+ +-----------+   |
|  | Customer  | | Content   | | Outreach  | |  Tasks    |   |
|  | Workspace | | Calendar  | | Pipeline  | | AI Team   |   |
|  +-----+-----+ +-----+-----+ +-----+-----+ +-----+-----+  |
|        |              |             |              |        |
|  +-----+--------------+-------------+--------------+----+  |
|  |           Markster Panel REST API                     |  |
|  |           panel.markster.io (production)              |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-----------+ +-----------+ +-----------+ +-----------+   |
|  | Apollo    | | Impact    | | Pricing   | | Signals   |   |
|  | Enrich    | | Engine    | | Sim       | | Engine    |   |
|  +-----------+ +-----------+ +-----------+ +-----------+   |
|  Custom tools: live enrichment + financial modeling         |
+------------------------------------------------------------+
|  Interactive UI (Vite + vite-plugin-singlefile)            |
|  Chart.js | Bidirectional callServerTool() | 12 scenes     |
+------------------------------------------------------------+
```

### 12 Interactive Scenes

| Scene | What it does | Interactive elements |
|-------|-------------|---------------------|
| Overview | Business bootstrap — KPIs, tasks, notifications | Traffic-light metrics, quick actions |
| Research | Company profiles, Apollo live enrichment | Real-time API calls, deal sync |
| People | Contact search, intent scoring | Profile cards, role context |
| Signals | Person-level buying signals | Ranked by intent score |
| Pricing | Discount simulation, EV curves | **Slider, live charts, verdict** |
| Deal Impact | Financial narrative per deal | Contextual framing per contact |
| Call Prep | Executive brief, talking points | Stitched from all available data |
| Outreach | Sequences, enrollment | Draft + send |
| Pipeline | Deals by stage, at-risk flags | $875K across 8 deals |
| Content | Calendar across 4 platforms, 15 posts | Status badges, live links |
| Cold Mail | Domain health, mailbox warmup | Infrastructure monitoring |
| Action Plan | Time-boxed priorities by revenue impact | **Go buttons → execute tasks** |

---

## 32 Tool Inventory

### Customer and CRM (8 tools)
| Tool | Description |
|------|------------|
| `customer_workspace_snapshot` | Unified customer state: profile, notifications, tasks, KPIs |
| `customer_profile_manage` | Read/update customer profile and onboarding data |
| `contact_profile_workspace` | Search, fetch, and manage contact profiles |
| `company_profile_workspace` | Search, fetch, and manage company profiles |
| `onboarding_flow_manage` | Start onboarding, persist step answers |
| `onboarding_ai_assist` | AI prefill, scoring, voice-pack generation |
| `dashboard_insights` | Dashboard slices, time-series, refresh |
| `pipeline_workspace` | CRM pipeline, trend history, at-risk deals |

### Tasks and AI Team (5 tools)
| Tool | Description |
|------|------------|
| `task_workspace` | Task overview, progress, initialization |
| `task_action` | Start, complete, reopen tasks, update notes |
| `task_content_regenerate` | Regenerate onboarding-generated content |
| `ai_team_workspace` | List AI agents, manage conversations |
| `ai_team_chat_turn` | Send message turn with SSE streaming |

### Content and Social (4 tools)
| Tool | Description |
|------|------------|
| `content_calendar_workspace` | Generate, list, get content calendars |
| `content_post_workspace` | Generate, edit, regenerate, approve social posts |
| `content_audio_library` | List, upload, delete audio tracks |
| `content_social_accounts` | Fetch CRM-connected social accounts |

### Outreach and Prospecting (4 tools)
| Tool | Description |
|------|------------|
| `outreach_brand_assets_workspace` | Manage brands, offers, personas |
| `outreach_icp_workspace` | Create, list, filter ideal customer profiles |
| `outreach_sequence_workspace` | Manage outbound sequence lifecycle |
| `outreach_enrollment` | Enroll leads into outreach campaigns |

### Knowledge and Artifacts (3 tools)
| Tool | Description |
|------|------------|
| `customer_artifact_workspace` | Create, list, edit, archive artifacts |
| `customer_document_workspace` | CRUD for customer documents |
| `customer_data_change_review` | Proposal queue + approval/rejection |

### Email Infrastructure (3 tools)
| Tool | Description |
|------|------------|
| `domain_mailbox_manage` | CRUD domain/mailbox with health checks |
| `cold_mail_health` | Setup status, warmup progress, inbox rate |
| `customer_image_assets` | Upload, delete profile photos and logos |

### Voice and Brand (1 tool)
| Tool | Description |
|------|------------|
| `voice_pack_workspace` | Voice-pack CRUD, set company default voice |

### Deal Intelligence (4 custom tools)
| Tool | Description |
|------|------------|
| `sales_intelligence` | Multi-mode: research (Apollo live), signals, pricing simulation |
| `deal_impact` | MRR, margin, runway, commission impact modeling |
| `simulate_pricing` | Discount simulation with close probability + EV curves |
| `daily_priorities` | Time-boxed action plans ranked by revenue impact |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| MCP Server | `@modelcontextprotocol/sdk` 1.19.3 + Express 5.0.1 |
| MCP Apps UI | `@modelcontextprotocol/ext-apps` 1.0.1 |
| Deploy | `@mcp-use/cli` 2.13.5 (Manufact Cloud) |
| Auth | `@workos-inc/node` 8.5.0 (OAuth 2.1, AuthKit) |
| Bundler | Vite 6.3.5 + vite-plugin-singlefile (zero CSP, single HTML) |
| Charts | Chart.js (inline, bundled) |
| Validation | Zod 3.24.4 + OpenAPI schema generation |
| Language | TypeScript 5.8.3 |
| Enrichment | Apollo API (live, any domain) |
| Financial Engine | Custom: close probability, EV curves, LTV modeling |

### Sponsor Technology Integration

| Sponsor | How we use it |
|---------|------------|
| **Anthropic** | Claude is the primary AI workspace. MCP is the protocol. |
| **OpenAI** | ChatGPT is the second platform. Same server, same tools, same UI. |
| **Puzzle** | Financial metrics use Puzzle terminology: `burn_multiple`, `spotlight_anomalies`, `cash_out_date`. Direct API swap when available. |
| **WorkOS** | AuthKit + OAuth 2.1 for multi-tenant MCP authentication. RBAC in JWTs. |
| **Cloudflare** | DNS and email infrastructure. Domain health monitoring via `cold_mail_health`. |
| **Manufact** | One-command deploy to Manufact Cloud. MCP Apps scaffold via `@mcp-use/cli`. |

---

## Quick Start

```bash
npm install
npm run build
PORT=3002 npm run start
```

Verify:
```bash
curl -s http://127.0.0.1:3002/
curl -sS -H 'Accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  -X POST http://127.0.0.1:3002/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MARKSTER_API_BASE_URL` | For live mode | Markster Panel API base URL |
| `MARKSTER_CUSTOMER_API_KEY` | For live mode | Customer token from Markster Panel |
| `MARKSTER_MOCK_MODE` | No | Set `true` for local mock responses |
| `MARKSTER_TOOL_CALL_LOGGING` | No | Set `true` for verbose tool logging |
| `WORKOS_CLIENT_ID` | For auth | WorkOS client ID |
| `WORKOS_REDIRECT_URI` | For auth | OAuth redirect URI |
| `WORKOS_COOKIE_PASSWORD` | For auth | Session cookie encryption key |
| `PORT` | No | Server port (default: 3000) |

### Deploy

```bash
npm run deploy   # One-command deploy to Manufact Cloud
```

### MCP Validation CLI

```bash
npm run mcp:test -- check --endpoint http://127.0.0.1:3002/mcp
npm run mcp:test -- list-tools --endpoint http://127.0.0.1:3002/mcp
npm run mcp:test -- call --tool sales_intelligence \
  --args '{"mode":"research","company_name":"Anthropic"}' \
  --endpoint http://127.0.0.1:3002/mcp
```

---

## Numbers

| Metric | Value |
|--------|-------|
| MCP tools registered | 32 |
| UI scenes | 12 interactive |
| Sponsor integrations | 6 of 6 |
| Bidirectional UI | Yes (slider talks back to server) |
| Live MRR | $15,628 |
| Customers | 41 |
| Gross margin | 82% |
| First client growth | 9.2x in 15 months ($71K to $1.3M) |
| Pipeline | $875K across 8 deals |
| Employees | 0 (both founders code daily) |

---

## Project Structure

```
.
├── server.ts                 # MCP server setup + tool registration
├── main.ts                   # Express app, auth, logo proxy, MCP routes
├── src/
│   ├── tools/
│   │   ├── markster-business-os.ts   # 28 Markster tool executors + registration
│   │   ├── daily-priorities.ts       # Action plan tool
│   │   ├── simulate-pricing.ts       # Pricing simulator
│   │   ├── deal-impact.ts            # Financial deal modeling
│   │   ├── prep-call.ts              # Call prep briefing
│   │   └── get-signals.ts            # Person-level signals
│   ├── services/
│   │   ├── impactEngine.ts           # Close probability, EV curves, LTV model
│   │   └── mockData.ts               # Pre-seeded company data, deal defaults
│   ├── ui/
│   │   └── app.ts                    # 4500+ line interactive UI (12 scenes)
│   ├── shared/
│   │   ├── marksterToolManifest.ts   # Tool catalog + schema definitions
│   │   └── markster-brand-pack.ts    # Visual system tokens
│   ├── markster/
│   │   └── client.ts                 # Markster Panel API client
│   └── types/
│       └── contracts.ts              # Zod schemas + TypeScript types
├── data/
│   ├── financials.json               # Puzzle-style financial baseline
│   ├── mock-signals.json             # Person-level intent signals
│   └── preseeded/                    # Apollo company cache (10 companies)
├── resources/
│   └── app.html                      # UI entry point (Vite builds to dist/)
└── docs/
    ├── demo-storyboard.md            # Demo script + Q&A playbook
    ├── design.md                     # Full architecture + positioning
    ├── ecosystem-poster.html         # Visual ecosystem map
    └── demo-page.html                # One-page project overview
```

---

## Team

**Ivan Ivanka** (CEO) — on-site at YC SF. Pitch, demo, strategy.
**Attila Sukosd** (CTO) — remote from Copenhagen. Engineering, MCP wiring, deploy.

Zero employees. Both founders code daily. First client grew 9.2x in 15 months.

[markster.ai](https://markster.ai)

---

*28 production tools. Your entire business operating system. One conversation. We showed you one flow — try the rest.*
