---
id: demo-storyboard
title: "Demo Storyboard — YC MCP Apps Hackathon"
type: guide
status: final
owner: ivan
created: 2026-02-21
updated: 2026-02-21
tags: [hackathon, demo, pitch]
---

# Demo Storyboard

The one document. Pitch, demo, Q&A, fallbacks, numbers. Everything else is archived.

**Total time:** 90 seconds pitch + 90 seconds live demo = 3 minutes.
**Platform:** Claude (Anthropic sponsor).
**Demo account:** Figma ($150K deal, Reema Batta, VP Growth Marketing).

---

## SETUP

- Open Claude with Markster MCP connected
- Clear the conversation
- This doc on your phone as backup

---

## THE PITCH (90 seconds)

**0:00 — Hook (15s)**

> "Anthropic and OpenAI are building the world's most powerful workspace. 800 million people open ChatGPT every week. Claude is where developers live. Both are betting that AI becomes where people work — not just where they chat."

**0:15 — Problem (10s)**

> "But when a founder opens Claude right now, there's nothing there. No pipeline. No customers. No revenue data. The most powerful AI in the world — and zero business context."

**0:25 — What we built (15s)**

> "We built the business layer. 28 production tools that turn your AI conversation into a revenue operations center. Pipeline, outreach, content, financials — all live, all from this conversation. This isn't a hackathon project. This is 2 years of production infrastructure exposed through MCP."

**0:40 — Transition**

> "Let me show you."

---

## THE DEMO (90 seconds, 6 steps)

### Step 1: Bootstrap (10s)

**Type:** `How's my business doing this morning?`

**What appears:** Branded loading screen ("Your AI Business Companion"), then overview — $15.6K MRR, 82% margins, 41 customers, KPI cards with traffic-light tones, notifications (Figma prospect activity), tasks.

**Say:** "One call. My entire business."

---

### Step 2: Research Figma (15s)

**Type:** `Tell me about Figma`

**What appears:** Research scene — Figma company profile, key stats, contacts. Pricing state auto-syncs to Figma $150K deal.

**Say:** "Live data. Any company. The system already knows this is a $150K deal in negotiation."

---

### Step 3: Signals (10s)

**Type:** `What signals do we have on Figma?`

**What appears:** Signals scene — Reema Batta (VP Growth Marketing, intent 87, Ready to Buy) at the top. Sasha Ivanov (68), Priya Shah (46) below. Pricing page visits, ROI calculator, demo request.

**Say:** "Person-level intent. Reema Batta is ready to buy — 6 pricing page visits, used the ROI calculator, requested a demo."

---

### Step 4: Pricing Simulator — THE WOW MOMENT (20s)

**Type:** `What if I offer 20% discount to close faster?`

**What appears:** Pricing scene — "Live Deal Modeling — Figma", $150K base deal. Slider, charts, role views, expected value curve.

**DO THIS:** Drag the slider from 20% to 10%, then to 35%.

- At 10%: Verdict says "TAKE THE DEAL"
- At 35%: Verdict flips to "DON'T DISCOUNT"

**Say:** "The slider updates everything in real time. Bidirectional — the UI talks back to the server. At 35%, the math says offer payment terms instead."

**Pause.** Let them process.

---

### Step 5: Deal Impact (15s)

**Type:** `Show me the deal impact`

**What appears:** "Financial Impact — Figma" — contextual narrative: what the $150K deal means for MRR, margin, runway. Suggested framing for Reema Batta. Commission math.

**Say:** "Not generic — it names the deal, names the contact, tells you exactly what the discount costs."

---

### Step 6: Call Prep (20s)

**Type:** `Prep me for the call`

**What appears:** "Executive Brief — Figma" — talking points from real signals, do-not-do list, Reema Batta as warmest contact (intent 87), risk area, deal size. Everything from the previous 5 steps stitched together.

**Say:** "Started with nothing. Six prompts later — a complete call brief for a $150K deal. Talking points, who to call, what not to say. All from one conversation."

---

### Step 7: The Closer — Time-Boxed Action Plan (15s)

**Type:** `I have an hour to work, what should I do now?`

**What appears:** Interactive action plan widget — "60 Minutes. 5 Moves." Time-boxed task cards: Follow up with Reema Batta ($150K critical), Respond to Scale AI inbound ($200K critical), Move Anthropic deal forward ($120K high), Review LinkedIn post (high), Review burn rate (high). Each card shows time block, priority badge, revenue at stake, source. "Go" buttons on each task link to the relevant scene (outreach, pipeline, content, etc.).

**DO THIS:** Click "Go" on the Figma follow-up — it jumps to the outreach scene. Click back to Action Plan.

**Say:** "This is the moment. It doesn't just show data — it tells you what to do. Ranked by revenue impact times urgency. And every task is interactive — click Go and you're in the right tool. Your AI co-CEO just planned your next hour."

**Pause.** This is the applause line.

---

## THE CLOSE

> "You saw 7 prompts. There are 28 tools. Content calendar, brand voice, cold mail infrastructure, outreach sequences — all live, all from this conversation."

> "One business. One chat. You."

---

## IF JUDGES ASK

**"What makes this different from Clay?"**

> "Clay is a spreadsheet with enrichment. $700 a month. No financial context, not conversational, not from chat. We provide the unified stack — pipeline, financials, content, outreach — all from one place."

**"Is the data real?"**

> "Apollo enrichment is live — try any domain. The financial model uses our actual numbers. The pipeline reflects our real prospect targets. We're dogfooding — this is us using the product."

**"How do you make money?"**

> "Growth agency model. Three tiers: $3K to $15K per month. One flat fee replaces your growth team. Our first client grew 9.2x in 15 months."

**"Why MCP?"**

> "Anthropic and OpenAI are both betting that AI conversations become the workspace. MCP is how you put business tools inside that workspace. Without us, a founder would need 5 to 8 separate MCP servers and none of them talk to each other. We unify the entire stack into one connection."

**"What about Puzzle / WorkOS?"** (sponsors)

> "Our financial modeling uses Puzzle's exact terminology — available_cash_balance, burn_multiple, spotlight_anomalies. When their API is available, it's a direct swap from configured baseline to live sync."

**"Is this just for your company?"**

> "Multi-tenant. Every customer gets their own workspace — their data, their voice, their ICP, their financials. Onboarding takes 14 days."

---

## IF SOMETHING BREAKS

**Apollo enrichment fails:**

> "Apollo rate-limited us — here, let me show you a pre-loaded profile instead."
> Type: `Tell me about Anthropic`

**UI doesn't render:**

> "The MCP app UI is rendering — sometimes the iframe takes a moment."
> Keep talking. Describe the data. Move to next step.

**Server is down:**

> "Our server is having a moment. Let me show you the architecture — 28 tools, all wired to production APIs."

**Rule:** Never stop talking. If one thing breaks, move to the next step.

---

## NUMBERS TO KNOW COLD

| Stat                  | Value                                 |
| --------------------- | ------------------------------------- |
| Tools registered      | 28                                    |
| MRR                   | $15,628                               |
| Customers             | 41                                    |
| Margin                | 82%                                   |
| First client growth   | 9.2x in 15 months ($71K → $1.3M)      |
| Figma deal            | $150K, negotiation stage              |
| Top Figma contact     | Reema Batta, intent 87                |
| Pipeline              | $412K across 9 deals                  |
| SaaS market cap wiped | $1T+                                  |
| HubSpot decline       | -70% from peak                        |
| Unnecessary discounts | 50-80% (Professional Pricing Society) |
| ChatGPT weekly users  | 800M                                  |
| Zero employees        | Both founders code daily              |

---

## SCENE CHIP MAP (if judge wants to explore)

| Chip               | What to type                      | What they see                                      |
| ------------------ | --------------------------------- | -------------------------------------------------- |
| Overview           | "How's my business?"              | KPIs, notifications, tasks                         |
| Company Research   | "Tell me about [company]"         | Apollo card, live data                             |
| Engagement Signals | "What signals on Figma?"          | Reema Batta (87), person-level intent              |
| Pricing Simulator  | "What if 20% discount?"           | Interactive slider, $150K Figma deal               |
| Deal Impact        | "Show deal impact"                | Financial Impact — Figma, narrative                |
| Call Prep          | "Prep me for the call"            | Executive brief, everything stitched               |
| Find People        | "Who should I talk to at Stripe?" | Contacts with intent scores                        |
| Outreach           | "Draft a follow-up to Reema"      | Email in your voice + sequence                     |
| Pipeline           | "Show my pipeline"                | 9 deals, $412K, stages                             |
| Content & Social   | "What's on my calendar?"          | 7 posts across LinkedIn, Twitter/X, Facebook, Blog |
| Cold Mail Health   | "Check email infrastructure"      | Domain health, inbox rate                          |
| Action Plan        | "I have an hour, what to do now?" | Interactive time-boxed tasks with Go buttons       |
