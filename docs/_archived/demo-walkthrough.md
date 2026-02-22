---
id: demo-walkthrough
title: "End-to-End Demo Walkthrough — What Judges See"
type: design
status: draft
owner: ivan
created: 2026-02-20
updated: 2026-02-20
tags: [hackathon, demo, sponsors, e2e]
---

# End-to-End Demo Walkthrough

Not a pitch script. The actual experience — what the judge types, what appears, which sponsor tech powers each step, and what's live vs mock.

The app runs in BOTH ChatGPT and Claude (cross-platform = Anthropic + OpenAI sponsors both happy).

> ✅ **Markster OS Current Scope Note (2026-02-20):**
> The live implementation now surfaces explicit Markster tools (`sales_intelligence`, `customer_workspace_snapshot`, `task_workspace`, `task_action`, `customer_profile_manage`, `outreach_sequence_workspace`, `content_post_workspace`, `domain_mailbox_manage`, `voice_pack_workspace`) and routes calls directly to those tools from the UI and LLM.

---

## Step 1: Company Research

**Judge types:** "Research Stripe for an upcoming deal"

**What appears:**

- ChatGPT/Claude calls `sales_intelligence` with `mode=research`
- Interactive card renders inline in chat (MCP App UI in iframe):
  - Company header: Stripe logo, "Payments Infrastructure", San Francisco
  - Key stats: Founded 2010, ~8,000 employees, $95B valuation
  - Recent funding rounds with investors
  - Tech stack list
  - Social links
- Below the card, the LLM adds context: "Stripe is a strong fit for your [ICP]. They recently expanded into X, which aligns with your positioning around Y."

**Powered by:**

- Apollo.io — live enrichment (real data, any domain)
- **Cloudflare AI Gateway** — caches Apollo responses, tracks latency/costs
- ICP + Brand config from Markster Panel — the LLM knows YOUR positioning

**Live data:** YES — works for any company the judge types

---

## Step 2: Find the Right People

**Judge types:** "Who should I reach out to?"

**What appears:**

- Tool calls `fetch_contacts` → pulls from GHL + ContactDB
- Contact cards: name, title, email, phone, LinkedIn
- If contacts exist in your CRM: shows deal history, last interaction date
- If NOT in CRM: Apollo people search returns relevant contacts by title
- LLM recommends: "Based on their org structure, start with [VP Revenue] — they own the buying decision for your category."

**Powered by:**

- GHL (contacts, pipeline, conversations) — real CRM data
- ContactDB — enriched contact database
- Apollo people enrichment — fallback for companies not in your CRM

**Live data:** YES — CRM contacts for existing relationships, Apollo for new companies

---

## Step 3: Deal Impact Analysis

**Judge types:** "What does a $50K annual deal mean for my business?"

**What appears:**

- Tool calls `deal_impact` → financial modeling
- Interactive dashboard renders:
  - MRR chart: current $47K → $51.2K (+8.9%)
  - Runway gauge: 14.2 months → 16.1 months (+1.9 months)
  - Margin bar: 72% gross margin
  - Commission: $5,000 at 10%
  - Comparison: "This would be your 3rd largest client"
  - Cash flow projection line chart (12 months forward)

**Powered by:**

- **Puzzle-style financial metrics** — uses exact Puzzle terminology (available_cash_balance, burn_multiple, cash_out_date, spotlight_anomalies)
- **Chart.js** — interactive charts in sandboxed iframe
- When Puzzle API is integrated: "Financials sync from Puzzle in real-time. Today using configured baseline."

**Data:** Financial baseline is YOUR company's configured numbers (this is intentionally your data, not mock — it's "your company" in the scenario). Chart.js renders live.

---

## Step 4: Pricing Simulator [THE WOW MOMENT]

**Judge types:** "What if I offer them 20% discount to close faster?"

**What appears:**

- Tool calls `sales_intelligence` with `mode=pricing`
- Slider UI appears with discount % (0-40%)
- **Judge drags the slider — ALL charts update in real-time:**
  - Revenue: $50K → $40K
  - Margin: 72% → 62.4%
  - Runway impact: -0.6 months
  - Commission: -$1,000
  - Risk-adjusted value: "At 35% close probability without discount vs 68% with → discount is worth $8,400 in expected value"
  - **Verdict: "TAKE THE DEAL — the expected value gain outweighs the margin loss"**
- Second scenario: judge slides to 35%
  - **Verdict: "DON'T DISCOUNT — margin erosion exceeds probability gain. Offer extended payment terms instead."**

**Powered by:**

- **Bidirectional MCP communication** — UI calls server via `app.callServerTool()`, server recalculates, UI re-renders
- Chart.js with real-time updates
- Financial logic (margin math, probability modeling, risk-adjusted revenue)

**This is where judges go "wow."** It's visual, interactive, and shows real business logic — not just data display.

---

## Step 5: Role-Based Views

**Judge types:** "Show me the CFO view of this deal"

**What appears:**

- View switches from AE perspective to CFO perspective:
  - AE view: commission, talking points, close probability, next steps
  - CFO view: margin analysis, runway impact, risk assessment, approval recommendation
  - Manager view: pipeline position, quota impact, team performance context
- Toggle buttons or the LLM switches based on request

**Powered by:**

- **WorkOS AuthKit** — RBAC (role-based access control). In production: SSO login determines role. In demo: role selector or natural language switch.
- WorkOS FGA (Fine-Grained Authorization) — deal-level permissions (who can approve discounts above X%)

**Even as a demo toggle, this shows the judge:** "This isn't a toy. This has enterprise-grade access control. AE, CFO, Manager all see different data from the same deal."

---

## Step 6: Engagement Signals

**Judge types:** "What signals do we have on the VP Revenue at Stripe?"

**What appears:**

- Tool calls `sales_intelligence` with `mode=signals`
- Person-level timeline:
  - If contact exists in HubSpot/GHL: REAL engagement data (email opens, page visits, document views, call notes)
  - AI analysis layer: "Based on 3 pricing page visits in 5 days + case study download → Intent Score: 78/100 (Hot)"
  - For contacts NOT in CRM: AI-generated contextual signals from Apollo data ("Stripe posted 4 sales roles last month → building outbound team → likely evaluating tools")
- Composite scoring: Cold (0-25) | Warming (25-50) | Hot (50-75) | Ready to Buy (75-100)

**Powered by:**

- GHL/HubSpot — real engagement data where available
- **Cloudflare Workers AI** — generates contextual signals from company data
- ContactDB — enrichment data

**Live data:** YES — real CRM data + AI-generated analysis for any company

---

## Step 7: Call Prep

**Judge types:** "Prep me for the call"

**What appears:**

- Briefing card combining ALL previous context:
  - Company summary (from Step 1)
  - Contact info + engagement (from Steps 2 + 6)
  - Deal positioning: "Position at $50K — 0.05% of their revenue, well within typical spend"
  - Financial impact: "This deal extends your runway by 1.9 months"
  - Pricing strategy: "Don't lead with discount. If pushed, 15% max — expected value positive."
  - Talking points: based on their recent activity + your case studies
  - Objection prep: based on ICP + brand configuration
- Uses YOUR voice pack, case studies, social proof from Markster config

**Powered by:**

- Everything above combined
- ICP + Brand + Voice pack from Markster Panel
- Case studies + social proof library

---

## Step 8: Draft & Send Outreach

**Judge types:** "Draft a follow-up email to their VP Revenue"

**What appears:**

- Email draft using YOUR voice, YOUR case studies, personalized to the contact + company context
- Subject line + body, formatted and ready
- "Send via Reply.io" button — actually creates the sequence
- Or: "Add to existing campaign" if one is running

**Judge types:** "Send it"

- Confirmation: "Email sequence created in Reply.io. First touchpoint sends tomorrow at 9:04 AM."

**Powered by:**

- **Reply.io** — cold mail sequences (create + monitor)
- Voice pack + brand config — writes in YOUR voice
- Contact data from Step 2

**Live data:** YES — actually creates a sequence in Reply.io (can use test/draft mode for demo safety)

---

## Step 9: Pipeline & Dashboard

**Judge types:** "How's my pipeline looking?"

**What appears:**

- Dashboard view pulling from GHL:
  - Pipeline stages with deal counts + values
  - Total pipeline value, weighted pipeline, average deal size
  - Deals at risk (no activity in 7+ days)
  - Win rate trends
- Or: "fetch any number we have on any of the 5 dashboards"

**Powered by:**

- GHL (contacts, pipeline, deals, conversations)
- Markster Panel dashboards

**Live data:** YES — real pipeline data

---

## Step 10: Content & Social (If Judge Explores)

**Judge types:** "What's on my content calendar this week?"

**What appears:**

- Content calendar with scheduled posts across platforms
- Social stats from recent posts
- "Create a LinkedIn post about the Stripe deal" → generates post in your voice

**Powered by:**

- Content calendar from Markster Panel
- Social monitoring
- Voice pack for content generation

---

## Sponsor Alignment Summary

| Sponsor        | Where it appears                                                               | Visibility                       |
| -------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| **Anthropic**  | Runs natively in Claude                                                        | Platform                         |
| **OpenAI**     | Runs natively in ChatGPT                                                       | Platform                         |
| **Puzzle**     | Deal Impact + Pricing Simulator (exact Puzzle terminology, financial modeling) | Core feature — Steps 3+4         |
| **WorkOS**     | Role-based views (AE/CFO/Manager), auth, FGA                                   | Step 5                           |
| **Cloudflare** | Workers AI for signal analysis, AI Gateway for API caching                     | Steps 1+6 (can mention in pitch) |

Every sponsor is represented in the actual product, not just mentioned in the pitch.

---

## What the Judge Takes Away

1. "They typed a company name and got a full research profile — live data, not pre-seeded"
2. "The pricing simulator was interactive — I dragged a slider and charts updated in real-time"
3. "They showed me different views for AE vs CFO — this has enterprise access control"
4. "They actually sent an email from inside ChatGPT"
5. "There were like 15 more tools I could explore — content calendar, dashboards, social"
6. "This isn't a hackathon project. This is a full business operating system accessible from chat."
