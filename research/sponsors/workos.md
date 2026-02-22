---
id: workos-hackathon-angle
title: "WorkOS Hackathon Angle — AuthKit, FGA, AI Agents"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, sponsors, workos]
---

# WorkOS Hackathon Angle

## Overview

WorkOS: developer-first platform for enterprise-ready auth and user identity. ~$30M ARR (up 50%, fueled by AI companies). "Make your app enterprise-ready in minutes."

## AuthKit (Free Tier)

- **First 1 million MAUs completely free.** After: $2,500/mo per additional 1M MAUs.
- Included: Social auth, email/password, magic links, MFA (TOTP + SMS), passkeys/biometrics, email verification, org-level policies, JIT provisioning, **RBAC** (roles + permissions in JWTs), CLI auth, fully customizable UI (hosted or React/Radix components).
- Add-ons: Enterprise SSO (SAML/OIDC) $125/mo per connection. Custom domains $99/mo.
- Sandbox: Fully free for testing.

## FGA (Fine-Grained Authorization)

- Extends RBAC with resource-scoped, hierarchical permissions (Zanzibar-inspired).
- Model: org > workspace > project > document. Permissions inherit down.
- Sub-50ms p95 checks, strong consistency.
- **Perfect for "role-based views"**: AE sees commission + talking points. CFO sees margin + runway. Manager sees pipeline.

## Michael Grinich on AI Agents + Enterprise Auth

All-in on AI agents as the 2026 narrative:

- Agents break traditional IAM — need first-class identity + authorization + guardrails.
- **MCP**: Big bet. WorkOS provides OAuth 2.1 auth server for MCP, dynamic client registration, fine-grained tool scopes/permissions.
- "Agents need Authorization, not just Authentication."
- WorkOS is silver sponsor of Linux Foundation MCP governance.
- Won their own hackathon: WebMCP used AuthKit RBAC for permission-based dynamic tool access in MCP flows.

## Realistic Integration Scope (7.5 Hours)

- **<2 hours**: Full AuthKit (login, orgs, sessions/JWTs, customizable UI, basic RBAC).
- **+2-3 hours**: Role-based views (different dashboards per role) + FGA for resource-scoped checks.
- **+1-2 hours**: Mock SSO flow + Admin Portal demo + MCP/OAuth snippet.

## What Would Impress WorkOS

A B2B SaaS or AI/agentic app that feels instantly "enterprise-ready":

- AuthKit login (magic/MFA/passkeys).
- Multi-tenant orgs with seamless switching.
- Role-based views (RBAC in JWT + FGA for hierarchical resources).
- **AI agent twist**: MCP-integrated agent with FGA-enforced fine-grained permissions.
- Demo Admin Portal (IT admin self-serves SSO/SCIM setup).

**Pitch angle**: "We built [idea] with WorkOS to go from prototype to enterprise-sellable in hours — complete with role-based views and agent-ready auth."

Sources: workos.com, pricing page, Michael Grinich talks (AWS re:Invent, MCP Nights), WorkOS hackathon recaps.
