---
id: person-level-intel
title: "Person-Level vs Company-Level Signals"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, narrative, signals]
---

# Person-Level vs Company-Level Signals

Person-level (contact-/prospect-/individual-level) tracks specific buyers' behaviors, enabling precise, timely, personalized outreach. Company-level (account-based) intent aggregates research signals to the organization but suffers from extreme noise.

This is DealPulse's core edge: company-level math is broken; person-level makes intent actionable.

## 1. Academic/Industry Research on Effectiveness

### The 95-5 Rule (Original Source)

**LinkedIn B2B Institute paper: "Advertising Effectiveness and the 95-5 Rule" by Prof. John Dawes (Ehrenberg-Bass Institute, ~2020-2024)**

Only ~5% of B2B buyers are in-market in any given quarter (20% annually for typical 5-year purchase cycles). 95% are out-of-market but will buy later. Company-level intent therefore captures mostly false positives.

This is the canonical source cited across MarTech, DemandGen, NetLine reports (often rounded to 3-5%).

### Buying Committees

- **Gartner**: Average 6-10 stakeholders for complex purchases
- **Forrester State of Business Buying 2026**: 13 internal + 9 external stakeholders
- A company-level signal (one person's research) doesn't identify decision-makers → blind outreach

### Vendor/Practitioner Analyses (2024-2026)

- Influ2, Intentsify, Demandbase, Zymplify: Contact-level enables 20%+ higher sales productivity via personalization (Forrester-cited benchmarks)
- DemandGen Report (2025): Contact-level ABM drives stronger sales-marketing alignment, faster cycles, higher ROI. 42% of marketers cite poor contact data as #1 barrier.
- Punch! B2B Trends Report 2026: Shift from "which accounts" to "which people right now" is #1 trend for 2026.

**Person-level isn't incrementally better — it's structurally superior because it aligns with how B2B actually buys.**

## 2. Stats on Intent Signal Conversion to Pipeline

- **NetLine 2024** (6.2M+ first-party registrations): 25% of intent "surges" led to no meaningful buying activity in 6 months
- **NetLine 2025**: Only 16.5-34% of content consumers self-report purchase intent within 12 months
- **Broad intent data ROI**: Intent-driven pipelines convert 2-4x better than non-intent leads; 25-35% higher conversion rates, 30-40% shorter cycles claimed
- **Adoption reality check**: Only 24% of teams report "exceptional ROI" from intent tools; 70% cite data quality/false positives as top issue
- **Saturation effect**: ~96% of B2B marketers now use intent, but company-level signals trigger "36+ vendor outreaches in 2 weeks" → buyer fatigue

**Bottom line**: Company-level intent often converts <10-20% to qualified pipeline (high noise). Person-level materially improves this.

## 3. Companies Moving Toward Person-Level Tracking

The market is rapidly shifting (2025-2026 trend):

| Company                        | Approach                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Punch! B2B**                 | Priority Intent — explicit contact-level signals + dynamic scoring                       |
| **Onfire**                     | Prospect-level intent from technical communities (GitHub, Reddit, Slack, Stack Overflow) |
| **TechTarget Priority Engine** | Strongest person-level signals from content network (IT/tech buyers)                     |
| **NetLine INTENTIVE**          | Person-level contact data tied to consumption                                            |
| **Influ2**                     | Contact-level advertising + first-party intent                                           |
| **Intentsify**                 | Persona-/buying-group-level (Forrester Wave leader)                                      |
| **Demandbase**                 | Evolved to person-based intent (contacts + buying-group roles)                           |
| **IntentData.io**              | Explicit contact-level                                                                   |
| **UserGems**                   | Contact-level intent + champions tracking                                                |
| **SalesIntel**                 | Contact-verified + intent                                                                |

Traditional account-heavy players (Bombora, early 6sense) are adding person-level layers. Pure company-level is table stakes; person-level is the differentiator.

## 4. HubSpot Engagement Tracking (via API)

HubSpot excels at person-level (contact-centric) tracking. Core CRM APIs (v3):

- **Engagements/Communications API**: CRUD for emails, calls, meetings, notes, tasks, WhatsApp/LinkedIn/SMS. Full properties + associations to contacts/companies/deals.
- **Sales Email Tracking**: Auto-logs opens/clicks (tracking pixel) → populates contact properties (last open date, engagement date, open/click counts)
- **Search & Associations**: Full search across objects; retrieve engagement history per contact; batch operations; webhooks for real-time
- **Scopes needed**: `crm.objects.contacts.read/write`, `crm.objects.communications.read/write`

**For DealPulse integration**: Pull complete per-person engagement history to layer as first-party signals on top of third-party intent. Enrich person-level scores with HubSpot activity.

## Quotes to Use

> "Only 5% of B2B buyers are in-market in any given quarter. Company-level intent is mathematically doomed to low precision." — Prof. John Dawes, Ehrenberg-Bass Institute

> "42% of marketers cite poor contact data as the #1 barrier to precision." — DemandGen Report 2025

> "96% of B2B marketers use intent data, but company-level signals trigger 36+ vendor outreaches in 2 weeks — buyer fatigue." — Industry analysis 2025

Sources: LinkedIn B2B Institute, Forrester State of Business Buying 2026, NetLine 2024-2025 reports, DemandGen Report 2025, Punch! B2B Trends 2026.
