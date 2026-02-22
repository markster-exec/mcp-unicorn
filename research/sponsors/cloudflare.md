---
id: cloudflare-hackathon-angle
title: "Cloudflare Hackathon Angle — Workers AI, AI Gateway, MCP"
type: research
status: active
owner: ivan
created: 2026-02-19
updated: 2026-02-19
tags: [hackathon, research, sponsors, cloudflare]
---

# Cloudflare Hackathon Angle

## Workers AI

Serverless AI inference on Cloudflare's global GPU network (200+ cities). 50+ models: text gen (Llama 4, GPT-OSS, Qwen3, Gemma 3, Mistral), image (FLUX.2), speech (Whisper, Deepgram), embeddings (BGE, Qwen3-embedding).

### Pricing

- **Neurons** (GPU compute units): $0.011 per 1,000 Neurons.
- **Free**: 10,000 Neurons/day (resets 00:00 UTC).
- Example: Llama-3.1-8b ~$0.15-0.83/M tokens. FLUX image: pennies per tile. Whisper: ~$0.0005/audio minute.
- No idle costs; pay-per-inference.

## AI Gateway

Reverse-proxy/observability for ANY AI provider (Workers AI, OpenAI, Anthropic, etc.).

- **Observability**: Dashboard analytics (requests, tokens, costs, latency, errors). Full request/response logging.
- **Caching**: Edge caching (up to 90% latency/cost reduction on repeat prompts). Custom rules, TTL.
- **Rate Limiting**: Per-user/IP/key, sliding/fixed windows. Prevents abuse.
- **Retry & Fallback**: Auto-retry on errors; define model/provider fallbacks.

Free tier: ~100k total logs/month. Paid: 1M+.

## D1 + Vectorize

- **D1**: Serverless SQLite. Time Travel (point-in-time restore). Free: 10 DBs, 500 MB/DB.
- **Vectorize**: Globally distributed vector DB. Median query latency ~31ms. RAG: generate embeddings → store → query → feed to LLM.

## MCP Support

Cloudflare has deep MCP support:

- Build/deploy MCP servers on Workers (HTTP endpoints exposing tools/prompts/resources).
- **Agents SDK**: Goal-driven agents that reason, call tools, schedule tasks on Workers (stateful via Durable Objects).
- Managed/remote MCP servers from Cloudflare: AI Gateway, AI Search, Docs.
- Full catalog in GitHub (mcp-server-cloudflare).

## Workers Free Tier Limits

- Requests: 100k/day.
- CPU Time: 10ms per invocation (Free); up to 5 min on Paid.
- Memory: 128 MB.
- Paid ($5/mo min): 10M requests/month, much higher limits.

## What Would Impress Cloudflare

Full end-to-end Cloudflare stack: Pages + Workers + Workers AI + Vectorize + D1 + AI Gateway + Agents SDK + MCP server + Durable Objects + R2.

**Dream project**: AI voice/customer-service agent with MCP tools + RAG over docs; or personalized recommender with Vectorize + image gen; or secure agent that edits configs via MCP.

**Previous sponsor prizes**: Up to $250K in credits (TreeHacks 2026!), swag, hardware.

**Pro tips**:

- Use MCP + Agents (new/hot).
- Demo AI Gateway dashboard live (caching savings, logs).
- Combine Vectorize + D1 + Workers AI for RAG.
- Ship fast, document the stack, show metrics/latency.

Sources: developers.cloudflare.com, Cloudflare blog, DevWeek announcements, hackathon sponsor pages.
