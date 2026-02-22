---
id: anthropic-openai-mcp-vision
title: "Anthropic + OpenAI — What They Want From MCP Apps"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, sponsors, anthropic, openai, mcp-apps]
---

# Anthropic + OpenAI — What They Want From MCP Apps

## MCP Apps Overview

Launched January 26, 2026. MCP servers return rich, interactive UI components (dashboards, forms, charts) rendered directly inside AI chat in sandboxed iframes. Built on `@modelcontextprotocol/ext-apps` SDK. Build once, works across clients.

## Anthropic's Vision

Claude blog: turning Claude into a true **workspace/command center**: "Starting today, we're bringing interactive connectors to Claude with MCP Apps."

### Use cases that excite Anthropic

- Real-time data exploration & BI (Amplitude, Hex — drill into trends with interactive tables)
- Project management (Asana timelines/tasks, monday.com boards)
- Design/creative collab (Figma flowcharts from text, Canva decks from outlines)
- **Sales/outreach (Clay company/contact research + personalized draft emails with funding/size data)**
- Enterprise CRM (Salesforce Agentforce 360 context + bi-directional actions)

### What they want

- **Polished, secure, production-grade interactive productivity tools** for knowledge-work workflows.
- Agentic depth (Claude reasoning + visual UI) and real business impact.
- **Enterprise/B2B focus** (Pro/Max/Team/Enterprise plans only).

> **David Soria Parra** (MCP co-creator): "I am excited about the possibilities that MCP Apps opens up."

## OpenAI's Vision

"Apps in ChatGPT" + Apps SDK launched October 2025. Full MCP Apps support from Jan 26, 2026.

> **Nick Cooper** (OpenAI): "MCP Apps builds upon the foundations of MCP-UI and the ChatGPT Apps SDK... We're proud to support this new open standard."

### What they want

- **"Know/Do/Show"** capabilities: new context/data (Know), actions/workflows (Do), clearer UI like charts/tables (Show).
- Small scoped toolkits tied to real jobs-to-be-done.
- Model-friendly (clear params, structured outputs), privacy-first, composable.
- Consumer-leaning (Spotify, Zillow, Canva) but expanding into Business/Enterprise.

## Apps in Chat vs. Apps You Visit

Both platforms are explicit: **the future is apps living inside the chat, not separate visits.**

- Anthropic: Unified agent interface reduces context-switching. Tools appear inline.
- OpenAI: Apps surface contextually when most useful. "AI as the platform."

## B2B vs Consumer

- **Anthropic** heavily favors **B2B/enterprise** (launch partners are workplace tools; paid-tier only).
- **OpenAI** is broader but actively expanding into Business/Enterprise.
- **Both prize sales, finance, and business intelligence MCP Apps.**

### Explicitly highlighted by both platforms

- BI/analytics: Amplitude/Hex dashboards (filter, drill-down, trends).
- **Sales: Clay research + outreach drafting; Salesforce CRM actions.**
- Finance/ops: Enterprise data actions, monitoring/metrics.

## Ideal Hackathon MCP Apps

- **Anthropic-favored**: Enterprise-grade interactive workflows (live sales pipeline dashboard + AI insights + task creation). Secure, auditable, multi-step.
- **OpenAI-favored**: Contextual + delightful. Quick value, natural-language friendly, composable.
- **Both**: Build-once cross-platform, polished, useful. Especially BI/sales/finance tools, real-time collab, novel visualizations. "Chat-native" experiences that feel like a real product.

## Key Insight for Our Build

**Sales/outreach is an explicitly showcased use case by Anthropic** (Clay integration is a launch partner example). We're building exactly what they want to see — but going deeper with financial context and interactive pricing simulation.

Sources: blog.modelcontextprotocol.io, claude.com/blog, openai.com/index/introducing-apps-in-chatgpt, developers.openai.com.
