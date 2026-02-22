---
id: apollo-api
title: "Apollo.io API — Hackathon Integration Guide"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, tech, apollo, api]
---

# Apollo.io API — Hackathon Integration Guide

## Exact Endpoints (Feb 2026, from docs.apollo.io/reference)

| Endpoint                                | Method | URL                                                                    |
| --------------------------------------- | ------ | ---------------------------------------------------------------------- |
| People Enrichment (single)              | POST   | `https://api.apollo.io/api/v1/people/match`                            |
| Bulk People Enrichment (up to 10)       | POST   | `https://api.apollo.io/api/v1/people/bulk_match`                       |
| Organization Enrichment (single)        | GET    | `https://api.apollo.io/api/v1/organizations/enrich?domain=example.com` |
| Bulk Organization Enrichment (up to 10) | POST   | `https://api.apollo.io/api/v1/organizations/bulk_enrich`               |
| People Search (credit-free)             | POST   | `https://api.apollo.io/api/v1/mixed_people/api_search`                 |

## Authentication

```
X-Api-Key: YOUR_API_KEY
Content-Type: application/json
Cache-Control: no-cache
```

Create key in Apollo Settings > Integrations > Apollo API. Works with free/starter accounts.

## People Enrichment Response Schema

Top-level `person` object:

| Field                             | Type   | Notes                                                               |
| --------------------------------- | ------ | ------------------------------------------------------------------- |
| `id`                              | string | Apollo person ID                                                    |
| `first_name`, `last_name`, `name` | string | Full name                                                           |
| `title`                           | string | Current job title                                                   |
| `headline`                        | string | LinkedIn-style headline                                             |
| `email`                           | string | Work email                                                          |
| `email_status`                    | string | verified/unverified                                                 |
| `linkedin_url`                    | string | LinkedIn profile                                                    |
| `twitter_url`                     | string | Twitter/X profile                                                   |
| `github_url`                      | string | GitHub profile                                                      |
| `facebook_url`                    | string | Facebook profile                                                    |
| `photo_url`                       | string | Profile photo                                                       |
| `organization_id`                 | string | Link to org                                                         |
| `employment_history`              | array  | Past/current roles (title, org_name, start_date, end_date, current) |

Optional (extra credits): `phone_numbers`, personal `emails` if `reveal_*=true` or waterfall.

## Organization Enrichment Response Schema

Top-level `organization` object:

| Field                                     | Type   | Notes                               |
| ----------------------------------------- | ------ | ----------------------------------- |
| `id`                                      | string | Apollo org ID                       |
| `name`                                    | string | Company name                        |
| `website_url`                             | string | Primary website                     |
| `primary_domain`                          | string | Domain                              |
| `logo_url`                                | string | Company logo                        |
| `linkedin_url`                            | string | LinkedIn company page               |
| `twitter_url`, `facebook_url`             | string | Social profiles                     |
| `industry`                                | string | Primary industry                    |
| `industries`                              | array  | All industries                      |
| `keywords`                                | array  | Company keywords                    |
| `estimated_num_employees`                 | number | Employee count                      |
| `founded_year`                            | number | Year founded                        |
| `raw_address`, `city`, `state`, `country` | string | HQ location                         |
| `primary_phone`                           | string | Company phone                       |
| `organization_revenue`                    | number | Revenue                             |
| `organization_revenue_printed`            | string | e.g., "150M"                        |
| `funding_events`                          | array  | Round type, amount, date, investors |
| `technology_names`                        | array  | Tech stack (strings)                |
| `current_technologies`                    | array  | Tech stack (name, category, uid)    |

## Rate Limits & Credits (Free Tier)

- **Credits**: ~1 per successful enrichment record; more for emails/phones/waterfall (up to ~9 total per record)
- **Free/Starter tier**: ~900 credits/user/year (~75/month) or ~100 credits/month. Enough for hackathon (100+ enrichments).
- **Rate limits**: Plan-dependent (stricter on free; low dozens per minute). Use `/api/v1/usage_stats/api_usage_stats` to check.
- **Free vs Paid**: All enrichment endpoints available on free tier but credit-consuming. People Search (`/mixed_people/api_search`) is credit-free.

## Hackathon Strategy

1. Sign up free Apollo account → generate API key instantly
2. For company card UI: Use **org enrichment** as primary (domain input) → reliably get logo, name, industry, employees, location, revenue, founded_year, funding_events, **tech stack**, socials
3. People enrichment for contact details + org_id link
4. Test with public domains (e.g., apollo.io, stripe.com)
5. Monitor credits in Apollo dashboard
6. Pre-seed 5-10 companies as JSON fallback for smooth demo

## Data Mapping to DealPulse UI

| DealPulse UI Element | Apollo Field                                 |
| -------------------- | -------------------------------------------- |
| Company name         | `name`                                       |
| Logo                 | `logo_url`                                   |
| Industry             | `industry`, `industries`                     |
| Employees            | `estimated_num_employees`                    |
| HQ Location          | `city`, `state`, `country`                   |
| Founded              | `founded_year`                               |
| Revenue              | `organization_revenue_printed`               |
| Funding rounds       | `funding_events`                             |
| Tech stack           | `technology_names` / `current_technologies`  |
| Key contacts         | People enrichment via `organization_id`      |
| Social links         | `linkedin_url`, `twitter_url`, `website_url` |

Sources: docs.apollo.io/reference (Feb 2026), Apollo pricing page, API knowledge base.
