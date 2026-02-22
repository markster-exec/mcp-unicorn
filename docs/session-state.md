---
id: session-state
title: "Session State — Hackathon Day"
type: state
status: active
owner: ivan
created: 2026-02-20
updated: 2026-02-21
tags: [hackathon, state]
---

# Session State — Feb 21, 2026 (Hackathon Day, Afternoon)

## Current Status

Live demo testing revealed 6 critical UX breaks. All fixed, pushed, CI green. Attila is deploying.

**One pitch doc:** `docs/demo-storyboard.md` — everything else archived to `docs/_archived/`.

## What Was Done This Session (afternoon, Claude Opus 4.6)

### 1. Fixed Broken Scene Routing (commit 2633528)

Root cause: standalone tools (prep_call, get_signals, deal_impact, simulate_pricing) returned payloads without a `tool` field → `normalizeToolPayload` couldn't identify them → `inferScene` fell through to `"overview"` → all data cached under wrong scene keys → downstream scene builders read empty caches → "n/a" everywhere.

**Files changed:**

- `src/tools/prep-call.ts` — added `tool: "prep_call"` to payload
- `src/tools/deal-impact.ts` — added `tool: "deal_impact"` to payload
- `src/tools/simulate-pricing.ts` — added `tool: "simulate_pricing"` to payload
- `src/tools/get-signals.ts` — added `tool: "get_signals"` to payload
- `src/ui/app.ts` `inferScene()` — added routing: prep_call→call-prep, get_signals→signals, deal_impact→pricing, simulate_pricing→pricing

### 2. Fixed Initial Flash (commit 2633528)

`init()` called `renderActiveScene()` before any data → showed "Use-case Cockpit" with "0/10 Ready". Replaced with branded loading state ("Your AI Business Companion" + "Try asking" prompts).

### 3. Fixed Pricing Defaults (commit 2633528)

Changed defaults from Anthropic/$50K/20% to Figma/$150K/0%. Added `DEAL_LOOKUP` map (8 companies with dealSize, dealStage, contact). `applyIncomingToolResult()` now auto-syncs `state.pricing` when any payload contains a company key.

### 4. Rebuilt Call Prep Scene (commit 2633528)

`buildCallPrepScene()` now checks for direct `prep_call` result first, showing real talking points, do-not-do list, warmest contact from DEAL_LOOKUP. Falls back to stitching from other caches.

### 5. Fixed Deal Impact + Pricing Scene Titles (commit 2633528)

- Deal impact: "Financial Impact — Figma" with contextual narrative (discount math, contact name, suggested framing)
- Pricing: "Live Deal Modeling — Figma" with deal size in subtitle

### 6. Added Reema Batta to Mock Signals (commit 2633528)

`data/mock-signals.json` — added person p17 Reema Batta (VP Growth Marketing, Figma, intent 87, "Ready to Buy"). Now the warmest Figma contact.

### 7. Fixed Pre-Commit CI (commit 1146bff)

`src/markster/client.ts` had pre-existing prettier formatting issue causing Pre-Commit workflow failure. Formatted with prettier 3.1.0 (matching pre-commit config version). Both CI and Pre-Commit now green.

### 8. Consolidated Pitch Docs (commit e6b21c4)

Rewrote `docs/demo-storyboard.md` as the single source of truth — pitch, demo (Figma flow), Q&A, fallbacks, numbers. Archived `demo-walkthrough.md`, `prep-guide.md`, `pitch-cheatsheet.md` to `docs/_archived/`.

### 9. Fixed Dead-End Buttons + UX Issues (commit 1d254a3)

- Overview: removed action buttons that led to empty scenes; now only shows buttons for scenes with data
- Signals: sorted by intent_score descending (Reema 87 shows first)
- Signals: removed confusing "Run Pricing 20%" button (was calling wrong tool `sales_intelligence`)
- Call Prep fallback: uses DEAL_LOOKUP for company name, contact, deal size when caches are empty; no more "Target account" / n/a everywhere

## Commits This Session (afternoon)

| Hash    | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| 2633528 | fix(ux): fix broken scene routing, call prep, pricing, deal impact  |
| 1146bff | fix(precommit): format client.ts with prettier 3.1.0               |
| e6b21c4 | docs(pitch): consolidate into single demo-storyboard                |
| 1d254a3 | fix(ux): remove dead-end buttons, sort signals, fix call prep       |

## Demo Flow (what to type, what happens)

1. **"How's my business"** → branded loading → overview with KPIs
2. **"Tell me about Figma"** → research scene; pricing auto-syncs to Figma $150K
3. **"What signals on Figma?"** → signals scene; Reema Batta (87) at top
4. **"What if 20% discount?"** → pricing scene; $150K base, "Figma" in title, slider
5. **"Show deal impact"** → "Financial Impact — Figma" with contextual narrative
6. **"Prep me for the call"** → call-prep; talking points, Reema, do-not-do list

## Known Issues / Next Steps

- Attila deploying current code
- Ivan: practice the 6-step Figma demo flow with storyboard on phone
- The user mentioned "we had a different idea for the flow" — not yet discussed

## Key Architecture Notes for Next Session

- `normalizeToolPayload()` at app.ts:710 reads `rawRecord.tool` to identify tools
- `inferScene()` at app.ts:783 maps tool names to scene keys
- `DEAL_LOOKUP` at app.ts:270 maps company keys to deal size/stage/contact
- `applyIncomingToolResult()` at app.ts:3755 syncs pricing state from company context
- `buildCallPrepScene()` at app.ts:3457 has two paths: direct prep_call result vs fallback stitch
- Prettier version mismatch: pre-commit uses 3.1.0, npx default installs 3.8.1. Always use `npx prettier@3.1.0`
- CWD issue: bash commands need `cd /Users/ivanivanka/Workspace/dealpulse-hackathon &&` prefix or `git -C` flag
