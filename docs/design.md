---
id: markster-business-os-design
title: "Hackathon Design — Markster Business OS MCP"
type: design
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, design, mcp-apps, sales-companion]
---

# YC MCP Apps Hackathon — Design Doc (v3, Full Research)

## Markster Business OS Interface (Single Customer)

- Live mode is bound to a single Markster customer token using `MARKSTER_CUSTOMER_API_KEY`.
- API base URL is `https://panel.markster.io`.
- The MCP server calls production Markster Panel endpoints for `GET /api/app/me` and related `customer-app` routes.

**Event:** Sat Feb 21, 2026 | YC office, SF | 10:30AM-6PM (7.5h hacking)
**Prize:** $10K+ credits + Mac Minis + **GUARANTEED YC INTERVIEW** (1st place / best team ONLY)
**Host:** Manufact (YC S25, $6.3M seed) — Pietro Zullo, Luigi Pederzani
**Sponsors:** Anthropic, OpenAI, Cloudflare, Puzzle (finance, $66.5M raised, Sasha Orloff), WorkOS (enterprise auth, $30M ARR, Michael Grinich)
**Judge:** Jon Xu (YC GP, ex-CTO FutureAdvisor/BlackRock, MIT EECS, fintech background)
**Participants:** 50-150 expected, heavy on engineers. Less saturated: vertical apps with polished UX.
**Rules:** No pre-built projects. Pre-seeded data is fine. Build MCP Apps (servers + UI). Deploy to Manufact Cloud.

---

## THE POSITIONING PIVOT

### What we're NOT building

- Not "deal intelligence" (sounds cold, transactional, about the company's deal)
- Not a sales tool that helps you sell harder (most people don't like sales)
- Not a discount optimizer (nobody likes being begged for discounts)

### What we ARE building

**An AI sales companion that lives in your chat and helps you sell with confidence.**

The shift: instead of "what intelligence can I extract from this deal?" → **"how can I help you make the right decision on this deal?"**

This companion sticks with you through the entire sales journey — research, prep, pricing, negotiation, follow-up. No handoffs, no context loss, no switching tools. One companion that knows your pipeline, your numbers, and your prospects.

### Why this framing wins

1. **Anthropic explicitly showcased sales/outreach MCP Apps** — Clay (company/contact research + personalized drafts) is a launch partner. We're building exactly what they want to see, but deeper.
2. **Anti-handoff is a massive trend** — 70% of B2B buyers can't keep track of who they're talking to (SBI 2024). 46% of SaaS companies returning to full-cycle model (Ebsta 2025). 86% of purchases stall mid-process (Forrester). The one-companion model is the answer.
3. **Jon Xu backs "agentic AI in regulated B2B"** — his portfolio is Fenrock (fintech compliance), FINNY (wealth AI), Manufact, Maywood (M&A AI). A sales companion with financial context fits perfectly.
4. **Greenfield confirmed** — no dominant unified sales + finance MCP App exists. Vendis.ai (Greylock) is closest but still in private beta, no financial modeling. People.ai announced MCP integration Feb 18 (3 days ago) but is enterprise-only revenue intelligence, not companion-style.
5. **"Apps live inside the chat, not separate visits"** — both Anthropic and OpenAI said this explicitly. We're building a chat-native experience, not another SaaS dashboard.

> **Working name:** TBD. "DealPulse" is the repo name but not final. Name parked — will decide post-hackathon.

---

## THE IDEA

### One-liner

"Your AI sales companion — knows your prospects, knows your numbers, and helps you close with confidence. Lives in Claude and ChatGPT."

### What it does

An MCP App that enriches every sales interaction with BOTH prospect intelligence AND your own financial reality:

- **Before the call:** Who they are, what they need, what this deal means for your business
- **During pricing:** Model discounts/terms and see margin/runway/commission impact live
- **After the call:** Talking points, follow-up actions, all informed by financial context

### What it is NOT

- Not a CRM (Salesforce -44%, HubSpot -70%) — those store data, this models impact
- Not sales intel (ZoomInfo -49%, Apollo) — those tell you about THEM, not about YOU
- Not an AI SDR (11x, Artisan) — those replace you, this empowers you
- Not revenue ops (Clari+Salesloft merged, both CEOs left) — $500K enterprise, backward-looking

### The category

**Chat-Native AI Sales Companion** — Sales Intel x Financial Context x Person-Level Signals x MCP-Native

> When judges ask "What category is this?":
> "We're building the AI sales companion — the tool that sticks with you from research to close, knows your prospects AND your numbers, and lives where you already work. Not another dashboard. Not an AI that replaces you. A companion that makes you better."

---

## MARKET THESIS: Why Now

### The SaaSpocalypse (Feb 2026)

**$1 trillion+ in SaaS market cap wiped in weeks.** IGV software ETF plunged 20-30% while S&P 500 stayed flat.

| Company      | Peak        | Current | Decline     |
| ------------ | ----------- | ------- | ----------- |
| Salesforce   | $314B       | $176B   | -44%        |
| HubSpot      | $42B        | $12.6B  | -70%        |
| ZoomInfo     | $3.9B (52w) | $2.0B   | -49%        |
| Atlassian    | —           | —       | -74%        |
| Asana/monday | —           | —       | -68 to -77% |

Private: 6sense secondary market -80-89% from $5.2B peak.

> "Traditional SaaS business models are dying, and agentic AI is the catalyst." — Suresh Madhuvarsu

### The Anti-Handoff Revolution

Buyers are exhausted by fragmented sales processes:

| Stat                                                         | Source              |
| ------------------------------------------------------------ | ------------------- |
| 70% of B2B buyers can't keep track of who they're talking to | SBI 2024            |
| 71% describe supplier rep experience as "frustrating"        | SBI 2024            |
| 61% prefer a rep-free buying experience                      | Gartner 2025        |
| 86% of B2B purchases stall mid-process                       | Forrester 2024/2026 |
| 60% feel post-purchase regret from broken transitions        | Opine 2025          |
| 46% of SaaS companies returning to full-cycle sales model    | Ebsta 2025          |

An AI companion = the ultimate single-thread solution. Same "person" from discovery → demo → negotiation → close → onboarding. Zero handoff loss. Full context retained.

### The Founder-Seller Reality

- Early revenue (0-$5M ARR) is almost always founder-led
- Founders bring authentic vision, deepest product knowledge, direct feedback loops
- But founders don't have time for CRM busywork, manual research, or pricing math
- They need a companion that does the work so they can focus on the relationship

### Financial Context Is a Greenfield

**50-80% of individually negotiated discounts are unnecessary** (Professional Pricing Society, 25+ years of data).

| Problem                     | Stat                                              | Source            |
| --------------------------- | ------------------------------------------------- | ----------------- |
| Unnecessary discounts       | 50-80% of negotiated discounts                    | PPS               |
| Revenue leakage             | 4-20% of revenue annually                         | BCG 2020          |
| Deals rejected by finance   | 49% of leaders saw increase in 2025               | Creditsafe        |
| CFO regret on bad approvals | 71% regretted high-risk deals                     | Creditsafe        |
| Margin math blind spot      | 10% discount on 40% margin = need 33% more volume | Pricing economics |

A 10% discount on 40% gross margin requires **33% more volume** to break even. 20% = 100% more. 30% = 300% more. Reps never see this math.

**No tool connects "should I discount?" to "what happens to my runway?"** Model N is closest but enterprise-only, not AI-native, not chat-embedded.

### Company-Level Signals Are Broken Math

**The 95-5 Rule** (Prof. John Dawes, Ehrenberg-Bass): Only 5% of B2B buyers are in-market in any given quarter.

- 6sense published "Why Sales Hates Intent Data" — about their own product
- 96% of B2B marketers use intent → "36+ vendor outreaches in 2 weeks" per trigger
- Only 24% report exceptional ROI from intent tools

Person-level behavioral signals are structurally superior.

---

## DEMO SCRIPT (2 minutes — optimized for judges)

**Calibration:** Polish + narrative > raw tech depth. Live data > mock. 1-2 killer interactive features win. Jon Xu (fintech bg) appreciates financial modeling + data trust.

### Opening (10s)

"$1 trillion in SaaS market cap wiped this month. The GTM stack is broken. Sellers are overwhelmed — 70% of buyers can't even keep track of who they're talking to. Here's the fix."

### Moment 1 — Company Research (15s)

"Research Acme Corp for my call tomorrow"

→ Company card appears inline: Logo, $12M Series A, 85 employees, fintech, SF HQ.
Tabs: **Overview** | **People** | **Funding** | **Deal Impact** | **Signals**

Live Apollo data: name, industry, employees, funding_events, technology stack, location.

### Moment 2 — Person-Level Signals (15s)

Click **Signals** tab

→ "Sarah Chen (VP Revenue): visited your pricing page 3x this week. Opened case study 2x. Downloaded ROI calculator. **Intent score: 82/100 — Ready to Buy.**"

→ "This isn't '6sense says Acme is in-market.' This is Sarah Chen actively evaluating your product RIGHT NOW."

### Moment 3 — Deal Impact (20s)

Click **Deal Impact** tab

→ "If Acme signs at $48K/year..." Charts animate:

- Your MRR: $47K → $51K (+8.5%)
- Runway: 14.2 → 15.8 months (+1.6 months)
- Gross margin: 72%
- AE commission: $4,800

Financial modeling uses Puzzle-style metrics: `available_cash_balance`, `burn_multiple`, `cash_out_date`.

### Moment 4 — Pricing Simulator [THE WOW MOMENT] (20s)

"What if I offer 20% discount?"

→ Slider moves. Charts update LIVE:

- Revenue: $48K → $38.4K. Margin: 72% → 64%.
- "Risk-adjusted revenue: $26.1K (discounted) vs $16.8K (full price)."
- "Runway impact: -0.4 months. Commission: -$960."
- **"The discount is worth $9.3K in expected value. Take it."**

→ "50-80% of discounts are unnecessary. Your companion shows the math before you give money away."

### Moment 5 — Call Prep (20s)

"Prep me for the call with Sarah"

→ Briefing card:

- "Sarah hired 3 SDRs. Building outbound infrastructure."
- "Position at $48K — 0.4% of their Series A."
- "She opened the case study 2x — lead with the growth story."
- "Don't lead with discount. CFO background = respects value-based pricing."

### Closing (30s)

"Every founder-seller flies blind. They don't know what a deal means for their business until the invoice hits. 70% of buyers can't keep track of who they're talking to. The old stack is broken — $1 trillion in value proves it.

This is the AI sales companion that sticks with you from research to close. Same context, same conversation, no handoffs. We already do this for clients — Kontext from $71K to $1.3M. Both founders code daily. Zero employees.

Your sales companion. YC S26."

---

## TECHNICAL ARCHITECTURE

### MCP Apps (Launched Jan 26, 2026)

Supported clients: Claude (web + desktop), ChatGPT, Goose, VS Code Insiders. Build once, works everywhere.

**Spec:**

- `ui://` resources — HTML/JS bundles rendered in sandboxed iframes
- Tool metadata: `_meta.ui.resourceUri` + optional `csp` and `permissions`
- CSP deny-by-default — **bundle everything via Vite singlefile** (zero CSP entries)
- Bidirectional JSON-RPC via `postMessage` (standard MCP 2.0)
- Sandbox: no parent DOM, no cookies/localStorage of host

### Manufact Platform (Host)

- **Scaffold:** `npx create-mcp-use-app [name]` generates: `resources/`, `public/`, `index.ts`, `package.json`, `tsconfig.json`
- **Inspector:** Dev tool at localhost for testing tools + UI
- **Deploy:** `yarn deploy` → Manufact Cloud
- **Pricing:** Hobby tier = 5 deployments, 500k requests/mo — **FREE** (sufficient for hackathon + demo)
- **SDK:** `@mcp-use/cli` v2.13.5, `mcp-use` v1.19.3 TypeScript (9k+ GitHub stars, 5M+ downloads)

### Server Tools

```
src/
├── server.ts              — MCP server + Express 5 + StreamableHTTPServerTransport
├── tools/
│   ├── research-company.ts  → Apollo org enrichment → company profile
│   ├── deal-impact.ts       → Financial baseline + deal params → projections
│   ├── simulate-pricing.ts  → Slider input → live chart data + AI recommendation
│   ├── get-signals.ts       → Mock person-level engagement data
│   └── prep-call.ts         → AI briefing combining all context
├── ui/
│   ├── App.tsx              → Main app with tab routing
│   ├── CompanyCard.tsx      → Overview, People, Funding tabs
│   ├── DealImpact.tsx       → Chart.js: MRR line, margin bars, runway gauge
│   ├── PricingSim.tsx       → Discount slider + live chart updates
│   ├── Signals.tsx          → Person-level intent timeline
│   └── CallPrep.tsx         → AI briefing card
└── data/
    ├── preseeded/*.json     → 10 cached companies
    ├── financials.json      → Your company baseline (Puzzle-style metrics)
    └── mock-signals.json    → Person-level intent data
```

### Data Sources

| Source                              | What                                                                                                                    | Hackathon approach                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Apollo.io** (annual subscription) | Org: name, industry, employees, funding, tech stack, location, revenue, logo, socials. People: title, email, employment | **Live API** via `GET /api/v1/organizations/enrich?domain=X` (header: `X-Api-Key`). Pre-seeded fallback. |
| **Puzzle-style metrics**            | Cash, burn rate, runway, ARR/MRR, burn multiple, cashOutDate                                                            | **Mock with exact Puzzle terminology.** No free tier (partner approval required).                        |
| **Person-level signals**            | Email opens, page views, document views per contact                                                                     | **Mock with realistic data.** Live HubSpot = stretch goal.                                               |
| **LogoKit** (free, 5K/day)          | Company logos                                                                                                           | **Live API** if Apollo `logo_url` insufficient.                                                          |

### Financial Baseline (Mock, Puzzle-Style)

```json
{
  "company": "Your Company",
  "available_cash_balance": 340000,
  "monthly_burn": 24000,
  "burn_rate_3mo_avg": 23500,
  "burn_multiple": 1.8,
  "runway_months": 14.2,
  "cash_out_date": "2027-05-15",
  "mrr": 47000,
  "arr": 564000,
  "gross_margin_pct": 72,
  "customers": 12,
  "avg_deal_size": 48000,
  "commission_rate_pct": 10,
  "spotlight_anomalies": []
}
```

### Code Patterns

```typescript
// Server: register tool with UI
registerAppTool(
  server,
  "research_company",
  {
    title: "Research Company",
    description: "Get full company profile with financial impact analysis",
    inputSchema: z.object({
      company_name: z.string(),
      domain: z.string().optional(),
      deal_size: z.number().optional(),
      discount_pct: z.number().optional(),
    }),
    _meta: {
      ui: { resourceUri: "ui://companion/app.html" },
    },
  },
  async (args) => {
    const company = await enrichCompany(args.domain || args.company_name);
    const signals = getIntentSignals(args.company_name);
    const impact = args.deal_size
      ? modelDealImpact(args.deal_size, args.discount_pct)
      : null;
    return {
      content: [
        { type: "text", text: JSON.stringify({ company, signals, impact }) },
      ],
    };
  },
);
```

```typescript
// Client: bidirectional communication for pricing simulator
const handleDiscountChange = async (pct: number) => {
  const result = await app.callServerTool({
    name: "simulate_pricing",
    arguments: {
      deal_size: currentDealSize,
      discount_pct: pct,
      baseline: financials,
    },
  });
  setImpact(JSON.parse(result.content[0].text));
};
```

### Build + Deploy

```bash
npx create-mcp-use-app companion      # Scaffold (Manufact generates: resources/, public/, index.ts, etc.)
npm install chart.js react react-dom zod
npm run dev                            # Dev + Inspector at localhost
npm run build                          # Vite + vite-plugin-singlefile → single HTML
yarn deploy                            # → Manufact Cloud (Hobby: 5 deploys, 500k req/mo FREE)
```

---

## SPONSOR ALIGNMENT (ALL 5)

### Puzzle (Finance) — PRIMARY

- **In demo:** Deal Impact + Pricing Simulator powered by Puzzle-style metrics. Exact terminology: `available_cash_balance`, `burn_multiple`, `cash_out_date`, `spotlight`.
- **Their angle:** "An MCP App that brings real-time financial context into every sales conversation."
- **Why they love it:** Sasha Orloff started Puzzle because 100+ founders wanted real-time financials. We're extending Puzzle's vision into the sales workflow.
- **Mock strategy:** No public free tier. Mock with exact schemas. Mention Puzzle by name. Puzzle integration partners (Stripe, Ramp, Mercury, Brex) are demo companies.

### WorkOS (Enterprise Auth)

- **In demo:** "Sales teams need role-based views. AE sees commission + talking points. CFO sees margin + runway. Manager sees pipeline."
- **Their angle:** WorkOS AuthKit — 1M MAUs free, RBAC in JWTs, FGA (Fine-Grained Authorization, Zanzibar-inspired) for resource-scoped permissions.
- **Why they love it:** $30M ARR (Oct 2025), 1,000+ customers. Michael Grinich spoke at re:Invent 2025 on "Securing AI Agents" — MCP + AI auth is his thesis. OAuth 2.1 for MCP servers is the natural pattern. AuthKit free tier more than covers hackathon.
- **Integration scope:** ~2h for basic RBAC (login, role-based views). FGA for deal-level permissions = stretch.

### Anthropic (Claude)

- **In demo:** Claude IS the workspace. Research, model, decide, act — all inline.
- **Why they love it:** Sales/outreach is **explicitly showcased by Anthropic** as an MCP Apps use case. Clay (company research + personalized drafts) is a launch partner example. We're going deeper with financial context + interactive pricing simulation.
- **David Soria Parra** (MCP co-creator): "I am excited about the possibilities that MCP Apps opens up."

### OpenAI (ChatGPT)

- **In demo:** Same MCP App works in ChatGPT — cross-platform by default.
- **Their vision:** "Know/Do/Show" — new context (Know), actions/workflows (Do), clear UI like charts/tables (Show). Our app nails all three.
- **Nick Cooper** (OpenAI): "MCP Apps builds upon the foundations of MCP-UI and the ChatGPT Apps SDK."

### Cloudflare (Edge)

- **In demo:** "Enrichment + financial modeling on Workers for sub-100ms globally."
- **Their stack:** Workers AI (10k Neurons/day free), AI Gateway (caching, observability, rate limiting), D1 (serverless SQLite), Vectorize (vector DB). MCP server support on Workers.
- **Realistic scope:** Workers AI for recommendation text generation. AI Gateway for Apollo API caching. Stretch: D1 for persisting deal history.

---

## COMPETITIVE LANDSCAPE

### Direct Competitors (Chat-Native / MCP-Enabled)

| Company        | What                                                                    | Funding                                      | Gap                                                         |
| -------------- | ----------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **Vendis.ai**  | "AI-native sales companion." Conversational CRM, auto-updates pipeline. | Greylock-backed                              | Private beta. No financial modeling. No pricing simulation. |
| **People.ai**  | MCP integration (Feb 18, 2026!). Query revenue data in Claude/ChatGPT.  | Major player                                 | Enterprise-only. Revenue intelligence, not companion-style. |
| **HeyReach**   | MCP server for campaigns, personalization, reply analysis.              | —                                            | LinkedIn-focused outbound only. No financial context.       |
| **Cliccc.ai**  | AI sales companion syncing IRL interactions to CRM.                     | Won Anthropic/Lovable hackathon (Slush 2025) | Mobile-first. Not chat-native.                              |
| **Prismus.ai** | "Agentic AI Sales Companion" for deep tech/scientific sales.            | MS AI Accelerator 2026                       | Separate dashboard. No MCP.                                 |

**Key insight:** No one owns the polished, end-to-end, in-chat sales companion with financial context. Vendis is closest but doesn't model financial impact. People.ai is enterprise-only revenue intel. We're building for founder-sellers who need both prospect intelligence AND their own numbers.

### AI SDR vs AI Companion Positioning

| Type                            | Examples                        | Model                                |
| ------------------------------- | ------------------------------- | ------------------------------------ |
| **AI SDR** (replaces you)       | 11x (Alice), Artisan (Ava)      | Autonomous, operates independently   |
| **AI Companion** (empowers you) | Vendis, Amplemarket Duo, **Us** | Human-first, interactive in workflow |

We're companion/augment. Not an AI employee that works alone — a teammate that makes you better.

### Traditional Tools (Collapsing)

| Tool            | Status                 | What's missing                                                    |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| ZoomInfo        | $2B (-49%), ~1% growth | No financial impact. Company-level only.                          |
| Apollo          | $1.6B, $150M ARR       | No financial modeling.                                            |
| Clay            | $3.1B, $100M ARR       | No financial context. Spreadsheet UX. $700+/mo.                   |
| Gong            | $7.25B val, $300M+ ARR | Post-call only. "Deal Intelligence" = deal health, not financial. |
| 6sense          | $5.2B peak (-89%)      | CEO left. Company-level signals = broken math.                    |
| Clari+Salesloft | Merged Dec 2025        | Neither CEO stayed. Enterprise-only.                              |

### Capability Matrix

| Capability            | ZoomInfo   | Apollo | Clay            | Vendis  | People.ai | **Us**  |
| --------------------- | ---------- | ------ | --------------- | ------- | --------- | ------- |
| Company enrichment    | Yes        | Yes    | Yes             | Yes     | Yes       | **Yes** |
| Person-level intent   | No         | Email  | No              | Partial | No        | **Yes** |
| Financial impact/deal | No         | No     | No              | No      | No        | **Yes** |
| Pricing simulation    | No         | No     | No              | No      | No        | **Yes** |
| Chat-native (MCP)     | No         | No     | No              | Yes     | Yes (new) | **Yes** |
| Founder-accessible    | No ($15K+) | Yes    | Partial ($700+) | TBD     | No        | **Yes** |

---

## JON XU — JUDGE PROFILE & PITCH FRAMING

**Background:** YC GP. Ex-CTO FutureAdvisor (acquired by BlackRock). MIT EECS. Deep fintech + AI.

**Portfolio (what he invests in):**

- Fenrock — fintech compliance AI
- FINNY — AI wealth management
- Manufact — MCP tooling (the host!)
- Maywood — M&A AI workflows

**His thesis:** Agentic AI in regulated, high-stakes B2B verticals. Financial modeling + data trust + compliance-ready.

**How to pitch to Jon specifically:**

- Lead with financial modeling depth (his FutureAdvisor/BlackRock background)
- Emphasize data trust, auditability, role-based access
- Show this isn't a toy — it's the infrastructure for how B2B selling works in an AI-native world
- Connect to his portfolio: "Like Maywood for M&A or FINNY for wealth, but for sales — financial intelligence in every deal conversation"

---

## YC INTERVIEW CONVERSION (Post-Hackathon Plan)

If we win (1st place = guaranteed interview):

**Standard YC interview format:**

- 10-minute Zoom call with 2-3 partners, within days/weeks
- All founders must attend
- "What is your company working on?" → rapid questions on users/metrics/challenges/competition
- May ask for live demo (screen-share ready, no slides)
- Decision within ~24 hours

**What to do in the days between hackathon and interview (from winners):**

1. **April (YC S25):** Won MCP/Vapi hackathon. In 7 days before interview: launched landing page, $10 early-access, 150 signups from multiple countries. Got in. Key: "Ship over polish. Charge early."
2. **Lingo.dev:** Won hackathon → ~20 users + love notes. Did 40-50 customer calls, rewrote in customer language, added paying customers. Got in on second attempt.

**Our post-hack plan:**

1. "We built the initial prototype at the YC MCP Apps Hackathon and won 1st place because it solved a painful problem."
2. "Since then we've launched MVP, talked to X users, got Y signups / $Z revenue."
3. Back with specifics: user quotes, retention, why this isn't "just a hackathon project."
4. Treat the hack as origin story + traction signal, not the product itself.

**Existing traction to reference:**

- 6 AI agents in production, 1,099 contacts processed
- Kontext Group: $71K → $1.3M revenue (2023→2025)
- Both founders code daily, zero employees

---

## PITCH SCRIPT (90 seconds)

**0:00 — The hook (10s)**
"$1 trillion in SaaS market cap wiped this month. HubSpot down 70. Salesforce down 44. The GTM stack is broken — and 70% of B2B buyers can't even keep track of who they're talking to."

**0:10 — The insight (10s)**
"Every founder-seller flies blind. They don't know what a deal means for their business until the invoice hits. 50-80% of discounts are unnecessary because nobody shows them the math."

**0:20 — The product (10s)**
"We built the AI sales companion. It knows your prospects, knows your numbers, and helps you close with confidence. It lives in Claude and ChatGPT."

**0:30 — Demo (50s)**
[Research company → card renders with Apollo data]
[Signals tab → "Sarah Chen visited pricing 3x, intent score 82"]
[Deal Impact → MRR/runway/margin charts, Puzzle-style metrics]
[Pricing sim → slider, live chart updates, "discount is worth $9.3K — take it"]
[Call prep → briefing card combining all context]

**1:20 — Why us (15s)**
"We already do this for paying clients. 6 AI agents, 1,099 contacts, Kontext from $71K to $1.3M. Zero employees. Both founders code daily."

**1:35 — Close (10s)**
"Your AI sales companion. One conversation, full context, no handoffs. YC S26."

---

## WHAT MAKES THIS "RIGHT IN THIS WAVE"

1. **The SaaSpocalypse is NOW** — $1T+ wiped. Every founder/AE/CRO feels it.
2. **MCP Apps launched 26 days ago** — Building for the new standard from day zero.
3. **Anti-handoff is the mega-trend** — 70% buyer confusion, 46% returning to full-cycle, 86% purchases stall. One companion = the answer.
4. **Sales is explicitly showcased by Anthropic** — Clay is a launch partner. We're going deeper.
5. **Person-level signals > company-level** — 95-5 Rule makes company intent broken math.
6. **Financial context is confirmed greenfield** — No one connects discounting to runway impact.
7. **Chat IS the workspace** — Both Anthropic and OpenAI pushing apps inside chat, not separate visits.
8. **Jon Xu's thesis = our product** — Agentic AI in regulated B2B + fintech background.
9. **Post-hack → YC interview** — Ship, charge, talk to users in the days after. We have existing traction (Kontext $71K→$1.3M) to prove this is a real business.

---

## HACKATHON EXECUTION STRATEGY

### What wins MCP hackathons (from studying winners)

1. **Polish + narrative > raw tech depth** — Scoped + impressive > rough + deep
2. **Live/real data >> mock** — Winners used real APIs. Builds credibility.
3. **1-2 killer interactive features** — Don't try to ship everything
4. **Tight demo arc** — "Pain → solution → impact" in 1-3 minutes
5. **Deployed URL** — Production-ready feel

### Priority tiers

**MUST (4h):** Company card (live Apollo) + Deal Impact (Chart.js) + Pricing Simulator (slider + live charts). This IS the demo.
**SHOULD (2h):** Signals tab + Call Prep card. These differentiate from generic tools.
**STRETCH (1.5h):** Polish (theming, animations, loading states). WorkOS RBAC demo.

The Pricing Simulator with live-updating charts IS the "aha" moment. All time optimized toward making that one interaction flawless.

---

## PRE-SEEDED COMPANIES

| #   | Company   | Domain        | Why                                  |
| --- | --------- | ------------- | ------------------------------------ |
| 1   | Stripe    | stripe.com    | Fintech, massive funding             |
| 2   | Figma     | figma.com     | Design tools, well-known             |
| 3   | Notion    | notion.so     | Productivity, Series C               |
| 4   | Anthropic | anthropic.com | AI, sponsor connection               |
| 5   | OpenAI    | openai.com    | AI, sponsor connection               |
| 6   | Ramp      | ramp.com      | Fintech (Puzzle integration partner) |
| 7   | Mercury   | mercury.com   | Banking (Puzzle integration partner) |
| 8   | Vercel    | vercel.com    | Dev tools, recent funding            |
| 9   | Clay      | clay.com      | Sales intel — show we know the space |
| 10  | Manufact  | manufact.com  | The host — ultimate flex             |

---

## THE "WHY YOU?" ANSWER

"We already do this. Our SDR pipeline has 6 AI agents: company research, person research, qualification, hook generation, pitch strategy, email composition. We've processed 1,099 contacts through it. We grew Kontext Group from $71K to $1.3M by connecting sales execution to financial reality. Both founders code daily — Claude Code, Codex, Cursor. Zero employees.

This is the product version of what we already sell as a service. The MCP App makes it accessible to every founder-seller."
