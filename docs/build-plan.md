---
id: dealpulse-build-plan
title: "Build Plan — Markster MCP + Pricing Simulator"
type: plan
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-20
tags: [hackathon, build, mcp-apps, markster-xo]
---

# YC MCP Apps Hackathon — Build Plan (v4, Full Scope)

Sat Feb 21, 2026 | 10:30AM-6:00PM (7.5 hours)

**Core insight:** We are NOT building 5 tools from scratch. We are registering 28 existing production Markster Panel APIs as MCP tools + building 1 new wow moment (pricing simulator with bidirectional slider + live Chart.js updates).

**Division of labor:**

- **Attila (remote, Copenhagen):** Scaffold, MCP tool registration, API wiring, pricing simulator UI, deploy
- **Ivan (on-site, YC SF):** Pitch, demo, networking, real-time feedback to Attila

---

## WHAT ATTILA IS BUILDING (before + during Saturday)

### Before Saturday (Friday night Copenhagen time)

- [ ] MCP scaffold running in ChatGPT 5.2 (DONE — screenshots exist)
- [ ] Wire up minimum 10 tools from Markster Panel APIs
- [ ] Apollo API integration (live enrichment, any domain)
- [ ] Pricing simulator: bidirectional slider + Chart.js live updates
- [ ] Deploy to Manufact Cloud (or plan B if Python doesn't work there)
- [ ] Test bidirectional communication (UI → server → UI via `app.callServerTool()`)

### During Saturday (remote support)

- Bug fixes based on Ivan's on-site feedback
- Additional tool wiring if time permits
- UI polish, loading states, error handling

---

## 8 CORE TOOL SURFACES FOR DEMO FLOW

These power the end-to-end Markster-focused walkthrough:

| #   | Tool                          | What it does                                          | Data source                                    |
| --- | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| 1   | `sales_intelligence`          | Research, signals, and pricing for one target account | Markster Panel API (LIVE) + internal simulator |
| 2   | `customer_workspace_snapshot` | Bootstrap workspace + KPIs + onboarding               | Markster Panel API (LIVE)                      |
| 3   | `task_workspace`              | Task overview + action management                     | Markster Panel API (LIVE)                      |
| 4   | `ai_team_workspace`           | Agent workspace + conversation management             | Markster Panel API (LIVE)                      |
| 5   | `content_calendar_workspace`  | Calendar + social + post orchestration                | Markster Panel API (LIVE)                      |
| 6   | `outreach_sequence_workspace` | ICP + sequence + enrollment controls                  | Markster Panel API (LIVE)                      |
| 7   | `domain_mailbox_manage`       | Domains, mailboxes, and cold-mail readiness           | Markster Panel API (LIVE)                      |
| 8   | `voice_pack_workspace`        | Voice profile configuration                           | Markster Panel API (LIVE)                      |

---

## NICE-TO-HAVE TOOLS (if time permits)

| Tool                                         | Why it's impressive                                  |
| -------------------------------------------- | ---------------------------------------------------- |
| `ai_team_workspace` + `ai_team_chat_turn`    | ChatGPT calls our AI Team — meta and brutal          |
| `domain_mailbox_manage` + `cold_mail_health` | Infrastructure management from chat                  |
| `customer_data_change_review`                | Human-in-the-loop from chat (WorkOS would love this) |
| `onboarding_ai_assist`                       | Onboard new customer from chat                       |

---

## IVAN'S SATURDAY SCHEDULE

| Time        | What                                 | Notes                                      |
| ----------- | ------------------------------------ | ------------------------------------------ |
| 10:30-11:00 | Arrive, set up, test deployed app    | Verify everything works on YC wifi         |
| 11:00-12:00 | Networking + explore other teams     | Learn what judges care about               |
| 12:00-12:30 | Lunch + sync with Attila             | Report what you've learned                 |
| 12:30-14:00 | Continue networking, help test       | Feed Attila bug reports + feature requests |
| 14:00-15:00 | Demo rehearsal (full walkthrough 3x) | Use docs/demo-walkthrough.md               |
| 15:00-16:00 | Final sync with Attila, polish pitch | Adjust based on what other teams built     |
| 16:00-17:30 | Demos + judging                      | Go time                                    |
| 17:30-18:00 | Networking, follow-ups               | Exchange contacts with judges              |

---

## DATA STRATEGY

**CRITICAL: Judges will try random companies. Mock data = instant loss.**

| Data source                  | Live vs Mock                                 | Why                                                                                         |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Apollo enrichment**        | **LIVE** — any domain                        | Annual subscription, plenty of credits. Real data for any company judge types.              |
| **All 28 Markster tools**    | **LIVE** — production APIs                   | These are real production APIs with real customer data. This IS the product.                |
| **Financial baseline**       | **Configured** — "your company" scenario     | Mock OK because it's YOUR company's numbers (not the prospect's). Puzzle-style terminology. |
| **Pricing simulator**        | **Pure math** — computed live                | No external data needed. Discount slider → margin/runway/commission math.                   |
| **Pre-seeded company JSONs** | **Backup only** — 10 cached Apollo responses | Only used if Apollo API is slow/down during demo.                                           |

---

## TECHNICAL DECISIONS

| Decision         | Choice                                        | Why                                                         |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------- |
| Backend language | Python (preferred) or TypeScript              | Attila deciding — whole Markster stack is Python            |
| MCP framework    | Attila's scaffold (working in ChatGPT 5.2)    | Already built and tested                                    |
| Charts           | Chart.js                                      | ~70KB, confirmed working in sandboxed iframes               |
| UI bundling      | Vite + vite-plugin-singlefile                 | Single HTML bundle, zero CSP entries                        |
| API source       | Markster Panel production APIs                | 28 tools already exist, just need MCP wrappers              |
| Deploy           | Manufact Cloud (plan A) or own infra (plan B) | Hackathon requires Manufact. Plan B if Python incompatible. |
| Cross-platform   | ChatGPT + Claude                              | Both work — Anthropic + OpenAI sponsors both happy          |

---

## FALLBACK PLANS

| Problem                      | Fallback                                               | Time cost      |
| ---------------------------- | ------------------------------------------------------ | -------------- |
| Apollo API down              | Pre-seeded JSON for 10 companies                       | 0m (pre-built) |
| Manufact won't deploy Python | Own infra (Cloudflare Workers, Railway, ngrok)         | 30m            |
| Markster Panel API down      | Pivot to narrower demo with cached data                | 15m            |
| Chart.js iframe issues       | QuickChart.io (chart as image URL)                     | 15m            |
| Bidirectional comm fails     | Static charts (still impressive, just not interactive) | 0m             |
| Running behind at 3PM        | Ship what works. 10 live tools > 28 broken tools.      | N/A            |

---

## PITCH EVOLUTION

**v1:** "Should I take this deal, at what price, and why?"
**v2:** "Your AI sales companion — knows your prospects, knows your numbers"
**v3:** "28 production tools. Your entire business operating system. One conversation."

**The YC interview answer:** "This isn't a hackathon project. This is 2 years of production infrastructure exposed through MCP. The hackathon proved the distribution model works."

---

## SPONSOR ALIGNMENT

| Sponsor        | Where it appears                                           | Notes             |
| -------------- | ---------------------------------------------------------- | ----------------- |
| **Anthropic**  | Runs natively in Claude                                    | Platform          |
| **OpenAI**     | Runs natively in ChatGPT                                   | Platform          |
| **Puzzle**     | Deal Impact + Pricing Simulator (exact Puzzle terminology) | Steps 3+4 of demo |
| **WorkOS**     | Role-based views (AE/CFO/Manager), FGA                     | Step 5 of demo    |
| **Cloudflare** | Workers AI for signal analysis, AI Gateway for caching     | Steps 1+6         |

Every sponsor represented in actual product, not just mentioned.
