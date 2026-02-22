---
id: dealpulse-prep-guide
title: "Pre-Hackathon Prep Guide — Markster MCP"
type: guide
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-20
tags: [hackathon, prep, mcp-apps, markster-xo]
---

# Pre-Hackathon Prep Guide (v4, Full Scope)

Everything to do BEFORE Saturday Feb 21, 2026.

**Key change from v3:** Attila is handling ALL engineering (scaffold, MCP wiring, deploy). Ivan focuses on pitch, demo flow, networking, and pre-seeding backup data.

---

## 1. ATTILA STATUS CHECK (Friday morning)

Before anything else, get status from Attila:

| Question                               | Why it matters                |
| -------------------------------------- | ----------------------------- |
| How many of the 28 tools are wired up? | Determines demo scope         |
| Python or TypeScript?                  | Affects deploy strategy       |
| Manufact Cloud working?                | Need plan B if not            |
| Pricing simulator slider working?      | THE wow moment — must be live |
| Apollo enrichment working?             | Live data = critical          |
| What's the deploy URL?                 | Need to test on-site          |

---

## 2. IVAN'S FRIDAY PREP

### 2a. Pitch rehearsal

Memorize the pitch cheatsheet (`docs/pitch-cheatsheet.md`). Key stats to know cold:

- $1T SaaS market cap wiped (Feb 2025)
- HubSpot -70% from peak
- 95-5 Rule: only 5% of B2B buyers in-market per quarter
- 50-80% of discounts are unnecessary
- 70% of buyers can't track who they're talking to
- 800M weekly ChatGPT users, 35-57M daily business users
- Kontext: $71K → $1.3M+ (6.2x Y1, 3.0x Y2)

### 2b. Demo flow memorized

Walk through `docs/demo-walkthrough.md` at least 3 times. Know:

- What to type for each step
- What appears on screen
- Which sponsor powers each step
- What to say if something breaks (fallback to pre-seeded data)

The 10-step flow:

1. "Research Stripe" → Company card (Apollo LIVE)
2. "Who should I reach out to?" → Contact cards
3. "What does a $50K deal mean for my business?" → Financial dashboard
4. "What if I offer 20% discount?" → **PRICING SIMULATOR (WOW)**
5. "Show me the CFO view" → Role-based views (WorkOS)
6. "What signals do we have?" → Intent timeline
7. "Prep me for the call" → AI briefing card
8. "Draft a follow-up email" → Email in your voice → "Send it"
9. "How's my pipeline?" → Dashboard view
10. "What's on my content calendar?" → Content calendar

### 2c. Pre-seed 10 company JSONs (backup)

Need Apollo API key from Attila or vault. Fetch:

| #   | Company   | Domain        | Why                      |
| --- | --------- | ------------- | ------------------------ |
| 1   | Stripe    | stripe.com    | Fintech, massive funding |
| 2   | Figma     | figma.com     | Design tools, well-known |
| 3   | Notion    | notion.so     | Productivity             |
| 4   | Anthropic | anthropic.com | Sponsor connection       |
| 5   | OpenAI    | openai.com    | Sponsor connection       |
| 6   | Ramp      | ramp.com      | Fintech (Puzzle partner) |
| 7   | Mercury   | mercury.com   | Banking (Puzzle partner) |
| 8   | Vercel    | vercel.com    | Dev tools                |
| 9   | Clay      | clay.com      | Sales intel competitor   |
| 10  | Manufact  | manufact.com  | The host — ultimate flex |

```bash
# For each domain:
curl -s "https://api.apollo.io/api/v1/organizations/enrich?domain=stripe.com" \
  -H "X-Api-Key: $APOLLO_API_KEY" \
  -H "Content-Type: application/json" \
  > data/preseeded/stripe.json
```

### 2d. Understand every tool well enough to explain to judges

Study `docs/markster-mcp-tools.md`. For each of the 28 tools, know:

- What it does in one sentence
- What API backs it
- Why it's useful from a business owner's perspective

---

## 3. COMPETITOR Q&A (know these cold)

| If they ask about...                               | Say                                                                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Vendis.ai** (Greylock)                           | "Closest to us — AI-native sales companion. But no financial modeling, no pricing simulation. Private beta. We have 28 production tools." |
| **People.ai** (MCP, Feb 18)                        | "Just launched MCP 3 days ago. Enterprise revenue intelligence — not for founder-sellers. We serve the 35M daily ChatGPT business users." |
| **Clay** ($3.1B)                                   | "Spreadsheet enrichment, $700+/mo. No financial context, not conversational, not from chat."                                              |
| **Gong** ($7.25B)                                  | "Post-call only. Deal intelligence = health scores, not financial impact. No pricing simulation."                                         |
| **6sense**                                         | "CEO left. Company-level intent = broken math. They published 'Why Sales Hates Intent Data.'"                                             |
| **AI SDRs (11x, Artisan)**                         | "They replace you. We empower you. Companion vs replacement."                                                                             |
| **"Why not just connect each tool individually?"** | "You'd need 5-8 separate MCP servers and half the connections don't exist. We provide the unified stack."                                 |

---

## 4. DAY-OF CHECKLIST

**Pack:** laptop, charger, phone charger, water, notebook, snacks, business cards if any.

**Digital (verify Friday night):**

- [ ] Deploy URL from Attila — test it works
- [ ] Demo walkthrough practiced 3+ times
- [ ] Pitch stats memorized
- [ ] Competitor responses ready
- [ ] Pre-seeded company JSONs in `data/preseeded/` (backup)
- [ ] `financials.json` ready (Puzzle-style)
- [ ] Attila's phone number saved (for real-time chat during event)
- [ ] WhatsApp/Slack channel with Attila ready for live comms

**On-site morning:**

- [ ] Test deployed app on YC wifi
- [ ] Verify Apollo enrichment works (try a random company)
- [ ] Walk through full demo flow once
- [ ] Scout: what are other teams building? What are judges asking about?

---

## 5. DEMO SCRIPT (90 seconds)

**0:00 — Hook (10s)**
"$1 trillion in SaaS market cap wiped. The GTM stack is broken. Your data is in 15 different tools. None of them talk to each other."

**0:10 — Insight (10s)**
"Every founder-seller flies blind. Nobody shows them what a deal actually means for their business."

**0:20 — Product (15s)**
"We built the business operating system you access from one conversation. 28 production tools — outreach, content, pipeline, financials — all live, all from ChatGPT or Claude."

**0:35 — Demo (45s)**

- "Research Stripe" → Company card (live Apollo data)
- "What does a $50K deal mean?" → Financial dashboard (Puzzle-style metrics)
- **Pricing Simulator** → Drag slider → Charts update LIVE → "Discount worth $8.4K — take it"
- "Draft a follow-up" → Email in your voice → "Send it" → Sequence created
- "Show my content calendar" → This week's posts across platforms

**1:20 — Why us (10s)**
"This isn't a hackathon project. This is 2 years of production infrastructure — 28 tools, live APIs, real customer data. The hackathon proved the distribution model."

**1:30 — Close (5s)**
"Your entire business from one conversation. We showed you five tools — try the other 23."

---

## 6. THE MOAT SLIDE (for Q&A)

"Without us, you'd need 5-8 separate MCP servers:

- One for CRM (doesn't exist for GHL)
- One for email sequences (Reply.io — doesn't exist)
- One for content calendar (doesn't exist)
- One for financial modeling (Puzzle = enterprise only)
- One for enrichment (Apollo — exists but isolated)

And half those connections don't exist. We provide the unified business stack."

---

## 7. POST-HACKATHON PLAN (If we win)

**Days 1-3:** Deploy publicly, landing page, waitlist signup.
**Days 4-7:** Talk to 20+ potential users, collect quotes, iterate.
**Before YC interview:** Have signups, usage data, and user quotes.

The win IS the YC interview. Everything after Saturday is interview prep.
