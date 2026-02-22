# Markster MCP UI Use-Case Scenes

## Goal

The MCP App UI is now organized by use-cases instead of a fixed step order, so demos can run in any sequence based on live judge questions.

## Scene Model

- The UI maps incoming tool results (`tool + mode`) to one of the use-case scenes.
- Each scene focuses on:
  - high-signal insight
  - KPI snapshot
  - next best actions
- Internal payload details are hidden from normal user rendering.

## Use-Case Scenes

- `Company Research`
  - Triggered by `sales_intelligence` with `mode=research` or `company_profile_workspace`
  - Shows account profile, funding, tech, and social links
- `Find People`
  - Triggered by `contact_profile_workspace`
  - Shows contact cards with enrichment status
- `Deal Impact`
  - Built from pricing output
  - Highlights financial impact framing
- `Pricing Simulator`
  - Triggered by `sales_intelligence` with `mode=pricing`
  - Includes slider, stage, role lens, and live recalc
- `Engagement Signals`
  - Triggered by `sales_intelligence` with `mode=signals`
  - Shows timeline and intent summary
- `Call Prep`
  - Composed from cached research + people + signals + pricing
  - Produces an executive briefing card
- `Outreach`
  - Triggered by sequence/enrollment tool outputs
  - Focuses on send-readiness and execution
- `Pipeline`
  - Triggered by `dashboard_insights`, `task_workspace`, `customer_workspace_snapshot`
  - Shows pipeline health and stage context
- `Content & Social`
  - Triggered by content workspace tools
  - Shows weekly content and publishing context
- `Cold Mail Health`
  - Triggered by `cold_mail_health`
  - Shows readiness + issue summary without internals

## Styling and Motion Rules

- No gradient button backgrounds.
- Flat branded controls:
  - primary accent: `#01FF00`
  - secondary brand green: `#00A84C`
  - neutral border: `#CDCDCD`
  - base text: `#000000`
  - page background: `#FAF8F6`
- Scene transitions and KPI animations are short and professional.
- `prefers-reduced-motion` is respected.

## Demo Operations

- Run any supported prompt in any order.
- The scene rail updates readiness as data arrives.
- Click scene chips to jump to the latest cached context for that use-case.
- Use pricing role lens buttons (`AE`, `CFO`, `Manager`) to reframe the same data instantly.
