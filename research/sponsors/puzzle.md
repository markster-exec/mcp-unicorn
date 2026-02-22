---
id: puzzle-api-deep-dive
title: "Puzzle API Deep Dive — Finance Sponsor"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, sponsors, puzzle]
---

# Puzzle API Deep Dive (Finance Sponsor)

## Overview

Puzzle is "the first smart accounting software" — a streaming financial data platform connected to a general accounting ledger. Founded 2019 by Sasha Orloff. $66.5M total funding. 7K+ businesses, $50B+ transactions processed.

## API Details

**Docs**: puzzle-api.readme.io

### Auth Methods

- **OAuth2** (preferred for partners): Standard authorize → token exchange flow. Access tokens expire 24h; refresh tokens long-lived. `Authorization: Bearer $TOKEN`.
- API key for simpler internal/embedded use.
- **Sandbox**: `https://staging.southparkdata.com`
- **Prod**: `https://api.puzzle.io`

### Key Endpoints

| Category             | Endpoints                                          | Notes                                                                      |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| **Company Summary**  | `GET /rest/v0/company/{id}`                        | cashOutDate, runway, operating burn, salary costs, data completeness score |
| **Metrics**          | `/rest/v0/company/{id}/metrics`                    | Cash, burn, ARR/MRR, margin                                                |
| **Accounts Payable** | `GET/POST /company/{id}/bills`, `PATCH .../status` | Full CRUD (Draft, Posted, Voided)                                          |
| **Vendors**          | `GET/POST /company/{id}/vendors`                   | Name, type, is1099Vendor                                                   |
| **Reports**          | `/rest/v0/company/{id}/reports`                    | Real-time P&L, balance sheet                                               |
| **Transactions**     | Various                                            | GL, categorization, reconciliation                                         |
| **Onboarding**       | `POST`                                             | Returns URL for company creation                                           |

Schemas: Clean JSON, typed objects with IDs like `co_123`, `bil_xyz`. Amounts as strings ("500.00"), currency "USD".

## Metrics Available (All Real-Time, Native)

| Metric        | Available | Notes                                                                 |
| ------------- | --------- | --------------------------------------------------------------------- |
| **Cash**      | Yes       | Position, available balance, cash flow reports, monitoring            |
| **Burn Rate** | Yes       | Net burn, 1-mo/3-mo avg, burn multiple (spend per $ new ARR)          |
| **Runway**    | Yes       | Projected months, cashOutDate                                         |
| **ARR/MRR**   | Yes       | Automated revenue recognition (esp. Stripe subs), by product/customer |
| **P&L**       | Yes       | Full real-time financial statements (cash + accrual)                  |
| **Variance**  | Yes       | Anomaly detection (Spotlight), spend/revenue by category/vendor       |

Data always up-to-date from day 1.

## Free Tier

- **Product free tier ("Accounting Basics")**: $0 until $20K cumulative transaction volume (lifetime). Then $25/mo. Unlimited users/seats.
- **API access**: **No public/free tier**. Strictly limited, case-by-case. Individuals: waitlist only. Platforms/fintechs: apply via Partner Program. No published rate limits. 99.9% uptime.

## Integration Partners

Strong native/one-click with modern fintech stack:

- **Stripe** (revenue rec, ARR/MRR)
- **Brex, Ramp, Mercury** (cards/banking, expenses, real-time sync)
- **Gusto, Deel** (payroll/contractors)
- **Plaid** (banks)
- **AngelList/LTSE Runway** (investor/shareholder reporting)
- FP&A tools: Runway.com, Causal, Meow

## Developer Experience

- Customer onboarding: **<10 seconds** (one-click Brex/Deel/Ramp sync)
- First data/metrics/dashboards: **Day 1 / real-time** (auto-categorization up to 99%)
- Full integration launch: **Weeks** (clear docs, full dev support, sandbox)
- Focus: "Launch in weeks, scale for years."

## Sasha Orloff Background

20+ years fintech. Ex-CEO/co-founder of **LendUp** (first mobile lending in US; raised $1B+ VC/debt) and Mission Lane (credit card spinout). Not a CPA — a finance modeler who loves accounting as strategic intelligence. Started Puzzle in 2019 after interviewing 100+ founders who all wanted real-time financials from a modern stack but were stuck with laggy QuickBooks + spreadsheets.

## What Puzzle Cares About (Hackathon Angle)

- Real-time, accurate, AI-native financial intelligence for **founders**
- Modern fintech integrations + automation (85-95% bookkeeping gone)
- **Embedded use cases**: Dashboards, FP&A, investor tools, cross-selling in platforms — exactly DealPulse territory
- Turning raw fintech feeds into actionable insights (burn multiples <2.0, variance, product-level ARR)

## Hackathon Strategy

- **If partner-approved**: Use live API for authentic real financial data
- **If not**: Mock **perfectly** with their exact metrics/endpoints/schemas/terminology (Available Cash Balance, burn multiple, Spotlight, etc.)
- Either way: speak "Puzzle" fluently. They optimize for startups building "next-gen financial software."

Sources: Official puzzle.io, puzzle-api.readme.io, help center, pricing, partner/embedded pages (Feb 2026).
