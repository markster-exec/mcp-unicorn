# Changelog

## [0.2.41] - 2026-02-21

### Changed

- Restored GitHub Actions `Pre-Commit` workflow to strict `--all-files` mode in `.github/workflows/markster-pre-commit.yml`.
- Ran markdown formatting cleanup with Prettier across legacy docs/research markdown files to align with strict pre-commit formatting checks.

## [0.2.40] - 2026-02-21

### Fixed

- Fixed GitHub Actions `CI` workflow bootstrap:
  - added `actions/setup-node@v4` and `npm ci` before running `./scripts/ci` so `tsx` is available for `openapi:generate`.
- Hardened `scripts/ci` for environments without Markster docs secrets:
  - skips OpenAPI sync check with a clear warning when neither `MARKSTER_DOCS_API_KEY` nor `MARKSTER_OPENAPI_URL` (with `api_key`) is provided.
- Fixed GitHub Actions `Pre-Commit` workflow scope:
  - switched from unconditional `--all-files` to changed-files mode using `--from-ref/--to-ref` for push/PR events.
  - keeps `--all-files` only for initial push events where `before` is all zeros.

## [0.2.39] - 2026-02-21

### Fixed

- Made `Company Research` logos fully CSP-safe and embedded in the UI:
  - `src/ui/app.ts` now resolves company logo to an inline data URL by default (`data:image/...`) instead of external logo hosts.
  - Removed the standalone large logo card and moved logo into a compact snapshot tile.
- Reduced logo visual footprint in `resources/app.html`:
  - compact logo container and fixed logo image max dimensions for tighter iframe layout.

## [0.2.38] - 2026-02-21

### Added

- Added opt-in HTTP request logging in `main.ts`:
  - set `MARKSTER_HTTP_REQUEST_LOGGING=true` (or rely on `MARKSTER_TOOL_CALL_LOGGING=true`) to log all incoming routes with status + duration.

### Changed

- Switched mock contact avatars to CSP-safe inline data URLs in `src/markster/client.ts`:
  - mock headshots now load from `data/generated-headshots/inline-96/*.jpg` and are embedded as `data:image/jpeg;base64,...`.
  - generated compressed inline headshots at `96x96` for all mock `p*.jpg`.
- Updated image normalization in `src/ui/app.ts` for Claude sandbox:
  - allow bounded inline `data:image/*` URLs,
  - block remote image URLs in Claude iframe context to prevent broken-image rendering from CSP.
- Updated company logo candidate strategy in `src/ui/app.ts`:
  - prefer direct inline logo fields when present,
  - otherwise render a compact inline SVG logo card (`120x120`) from company initials/domain.

## [0.2.37] - 2026-02-21

### Added

- Added lightweight thumbnail endpoint for contact avatars:
  - static route `GET /assets/headshots/thumbs/:file` in `main.ts`.
  - generated thumbnail assets under `data/generated-headshots/thumbs/`.

### Changed

- `Find People` avatar rendering in `src/ui/app.ts` now prefers thumbnail URLs:
  - converts `/assets/headshots/pX.png` to `/assets/headshots/thumbs/pX.png`,
  - keeps absolute URLs and falls back safely when conversion is not applicable.

## [0.2.36] - 2026-02-21

### Fixed

- Fixed mock payload shape for raw `content_calendar_workspace` (`GET /api/content/calendars`) in `src/markster/client.ts`:
  - it now always returns a calendar list (raw endpoint contract),
  - which restores correct behavior in curated `content_calendar_workspace` (no more false `total_calendars=0` / empty week posts in mock mode).
- Added content media URL sanitization in `src/tools/markster-business-os.ts` for calendar post extraction:
  - drops `data:` URLs and very long URLs before emitting `image_url`,
  - reduces risk of oversized MCP payloads caused by inline/base64 media.
- Fixed `Engagement Signals` scene score mapping in `src/ui/app.ts`:
  - intent score now reads `intent_score` (plus fallbacks) instead of relying only on `signal_strength`,
  - timeline rows now read nested person `signals[]` events (type/last/weight context) for mock signal payloads.
- Fixed contact avatar URL resolution across hosts:
  - mock headshot URLs now default to an absolute deployed asset host in `src/markster/client.ts`,
  - UI now normalizes relative image paths to absolute asset origin in `src/ui/app.ts` to prevent broken-avatar alt text in MCP iframe contexts.
- Added same-origin company logo proxy endpoint in `main.ts`:
  - `GET /assets/company-logos/:domain` fetches from Clearbit (fallback to Google favicon) and caches responses,
  - returns an SVG fallback badge when upstream logo sources are unavailable,
  - `Company Research` now prioritizes this same-origin logo URL in `src/ui/app.ts`.

## [0.2.35] - 2026-02-21

### Added

- Added automatic company logo resolution in `Company Research`:
  - uses direct logo fields when available (`logo_url`, `company_logo_url`, etc.).
  - falls back to domain-based logo sources (Clearbit, then favicon fallback).
  - gracefully falls back to initials when no logo source resolves.

### Changed

- Updated `Company Research` layout with a dedicated right-side logo panel and a compact company snapshot block (`Domain`, `HQ`, `Founded`, `Valuation`) to match the requested demo composition.

## [0.2.34] - 2026-02-21

### Fixed

- Improved `Pipeline & Dashboard` rendering for `customer_workspace_snapshot` payloads:
  - KPI arrays (for example `dashboard.kpis`) are now expanded into real metric cards instead of a single `KPIs: N items` metric.
  - Stage rows now parse multiple payload shapes (`stages`, `stage_distribution`, `stage_breakdown`, `pipeline_stages`).
  - When stage rows are missing, the panel now still renders meaningful fallback stage distribution lines.

## [0.2.33] - 2026-02-21

### Changed

- Added deterministic mock headshot wiring for `contact_profile_workspace` mock contacts:
  - mock contacts now include `person_id` and `photo_url`/`avatar_url` derived from known demo emails.
  - enriched ContactDB mock payload mirrors the same photo fields.
- Added UI fallback for mock person ids (`p*`) to render headshots from `/assets/headshots/{person_id}.png` when photo fields are missing.

## [0.2.32] - 2026-02-21

### Changed

- Default runtime mode on server startup is now `mock` when `MARKSTER_RUNTIME_MODE` is not explicitly set.
- Updated `runtime_mode_switch` schema defaults to `mock` and clarified mode descriptions:
  - `mock` = default startup/demo mode
  - `live_with_fallback` = mixed mode (live first, fallback to mock)
  - `live_strict` = live only (no fallback)

## [0.2.31] - 2026-02-21

### Fixed

- Fixed Apollo enrichment failure crash path in `companyEnrichmentService`:
  - Prevented unhandled rejection from in-flight cleanup (`job.finally(...)`) when Apollo returns an error (for example missing `organization` object).
  - Service now remains alive and continues returning graceful fallback payloads for failed Apollo lookups.

## [0.2.30] - 2026-02-21

### Fixed

- Reduced MCP app load failures caused by oversized tool payload transport:
  - Added UI payload size guard for app-enabled tools to keep structured payloads under a safe limit.
  - Added recursive payload trimming for very large responses (arrays/objects/long strings), including `social_posts` compaction.
  - Replaced unbounded `content.text` JSON emission with bounded text output to avoid duplicating multi-megabyte payloads in tool responses.
  - Added `_mcp_meta.size_truncated=true` when a response is compacted for transport safety.

## [0.2.29] - 2026-02-21

### Fixed

- Fixed contradictory content-calendar UI metrics when only fallback posts are available:
  - Placeholder calendar rows (for example `Current content calendar`) are no longer treated as real active calendars.
  - `Active Calendar` now renders only for real calendar records.
  - `Week` now renders only when real calendar context exists.
- Prevented mixed states where fallback weekly posts were shown together with "no calendars" style metadata.

## [0.2.28] - 2026-02-21

### Fixed

- Removed internal `request` payload object from UI metric rendering so `Pipeline & Dashboard` no longer shows `Request: Object`.

## [0.2.27] - 2026-02-21

### Fixed

- Fixed mock-mode schema failures for dashboard and customer profile tools by aligning demo payloads to required OpenAPI fields:
  - `dashboard_insights`
  - `customer_workspace_snapshot`
  - `customer_profile_manage`
  - `onboarding_flow_manage`
- Hardened mock-mode behavior to continue serving mock payloads even when strict schema mismatch is detected (`mock_schema_mismatch` is now logged instead of hard-failing the tool call).
- Added dedicated mock payloads for internal raw helper specs used by curated tools:
  - `content_calendar_workspace_get`
  - `content_post_workspace_get`
  - `content_post_workspace_edit`
  - `content_post_workspace_regenerate`
  - `content_post_workspace_schedule`
  - `cold_mail_health_domains`
  - `cold_mail_health_mailboxes`

## [0.2.26] - 2026-02-21

### Added

- Added generated Flux.2-Pro headshots under `data/generated-headshots/` with manifest metadata.
- Added static serving route for headshots at `/assets/headshots/*` from the MCP server runtime.

### Changed

- Updated preseeded demo contacts to use deployed local headshot assets for key personas.
- Switched `headshots:flux2` npm script to a Node `.mjs` runner to avoid local `tsx/esbuild` architecture mismatches.
- Upgraded Flux generator to support Azure provider endpoint flow (`/providers/blackforestlabs/v1/flux-2-pro`) with flexible response parsing.

## [0.2.25] - 2026-02-21

### Added

- Added `runtime_mode_switch` MCP tool so operators can switch server runtime mode without redeploy:
  - `live_with_fallback` (default recommended)
  - `live_strict`
  - `mock`
- Added `headshots:flux2` script (`scripts/generate-headshots-flux2.ts`) for Azure Flux.2-Pro image generation from a JSON prompt list.

### Changed

- Changed Markster API client runtime behavior to `LIVE first` with automatic `DEMO/mock` fallback in `live_with_fallback` mode.
- Added live request timeout handling via `MARKSTER_API_TIMEOUT_MS` (default `12000` ms).
- Added fallback metadata in tool responses when live calls degrade to mock payloads.
- Added contact avatar rendering in the people scene:
  - uses `photo_url`/avatar fields when present
  - falls back to deterministic initials badges when image is unavailable
- Extended preseeded demo people with `photo_url` fields for more realistic contact cards.

## [0.2.24] - 2026-02-21

### Fixed

- Fixed pricing simulator live-preview behavior so `Impact at current discount` updates while dragging the discount slider.
- Added in-place pricing preview updates (without full iframe rerender) for:
  - verdict badge
  - EV curve marker position
  - annual deal delta
  - gross margin delta
  - runway delta
  - close probability delta
- Wired deal-size input to the same local preview updater for consistent realtime behavior before recalculation.

## [0.2.23] - 2026-02-21

### Changed

- Upgraded `content_calendar_workspace` into a curated content-read flow:
  - default mode now resolves the latest active calendar
  - fetches full calendar details
  - returns this-week post queue (`week_posts`) with `post_id`, `item_id`, and `image_url` when available
- Added explicit `content_calendar_workspace` modes:
  - `current_week` (default)
  - `list`
  - `get_calendar`
- Extended `content_post_workspace` for direct post retrieval and lifecycle actions:
  - `mode=get` now returns full post payload by `post_id` (including media/image URL)
  - `mode=edit`, `mode=regenerate`, and `mode=approve/schedule` now route to the correct post endpoints
- Updated Content scene UI to prioritize weekly post execution:
  - renders "This week posts" instead of generic calendar rows
  - surfaces post/item IDs and image links
  - adds direct `Open Top Post` action using `content_post_workspace mode=get`
- Tightened tool manifest guidance/examples so the LLM picks the right content tools and arguments for:
  - "what's on my calendar this week?"
  - "open post X"

## [0.2.22] - 2026-02-21

### Changed

- Added realistic pipeline fallback modeling in the `Pipeline & Dashboard` scene when live dashboard payload is effectively empty (all-zero metrics and no stage distribution).
- Fallback now renders consistent, demo-grade KPI cards and stage distribution tied to current deal context (`state.pricing` + active account), instead of showing blank/zero operational stats.
- Preserved live rendering path when non-zero dashboard metrics or stage data are available.

## [0.2.21] - 2026-02-21

### Changed

- Redesigned pricing simulator interactions to stop full in-chat re-renders while dragging the discount slider.
- Removed quick discount buttons (`10%`, `20%`, `35%`) to reduce vertical footprint in small iframe chat surfaces.
- Replaced low-signal projection bar charts with a compact high-signal impact block showing before/after + delta for:
  - annual deal value
  - gross margin
  - runway
  - close probability
- Kept EV curve as the primary visual chart and tightened compact chart layout for faster scanning.

## [0.2.20] - 2026-02-21

### Fixed

- Fixed MCP UI payload normalization for array-shaped tool responses by wrapping them into an object (`{ items: [...] }`) before scene rendering.
- Resolved empty-state rendering in content calendar scene when `content_calendar_workspace` returns list payloads.

## [0.2.19] - 2026-02-21

### Added

- Added `pipeline_workspace` curated MCP tool for pipeline-specific CRM asks (overview, trend history, at-risk checks, refresh) backed by Markster dashboard/metrics APIs.
- Added pipeline tool catalog/use-case guidance so the LLM can choose a dedicated pipeline tool instead of generic dashboard calls.

### Changed

- Upgraded `Content & Social` scene to show a direct `Next 5 posts` widget in-chat with:
  - post title
  - theme
  - channel
  - scheduled date
- Added robust content payload extraction for post rows across multiple response shapes (`items`, `events`, `posts`, `upcoming_*`, and calendar-nested arrays).
- Added realistic fallback upcoming posts when only calendar metadata is available.

## [0.2.18] - 2026-02-21

### Fixed

- Resolved pricing scene build failure in `src/ui/app.ts` by removing a duplicate `verdict` declaration in `buildPricingScene`.
- Restored successful production build/start for `dealpulse-mcp` deploys.

## [0.2.17] - 2026-02-20

### Changed

- Reintroduced role-based pricing lens in a compact format aligned to the walkthrough:
  - `AE` view: commission, close probability movement, next-step guidance
  - `CFO` view: margin/runway risk and approval recommendation
  - `Manager` view: pipeline position, quota-impact proxy, team risk context
- Kept pricing scene compact while adding role toggles and lens-specific recommendation copy.
- Wired role toggle interaction into the pricing scene renderer so view switches are instant without extra server calls.

## [0.2.16] - 2026-02-20

### Changed

- Aligned pricing verdict language with the demo story:
  - `TAKE THE DEAL`
  - `MARGINAL - NEGOTIATE HARDER`
  - `DON'T DISCOUNT`
- Updated pricing engine verdict output (`src/services/impactEngine.ts`) and shared type unions (`src/types/contracts.ts`) to use the new verdict labels consistently.
- Hardened pricing UI EV-diff handling (`src/ui/app.ts`) to avoid `n/a` when backend values are numeric strings, and to derive EV delta from the EV curve when needed.
- Added legacy verdict normalization in UI (`DISCOUNT WORTH IT` → `TAKE THE DEAL`) so older payloads still render correct badge/tone.

## [0.2.15] - 2026-02-20

### Changed

- Redesigned the pricing simulator scene into a compact single-control card plus compact chart row to reduce vertical footprint in iframe chat surfaces.
- Removed AE/CFO/Manager role-lens controls from pricing UI (they were low-signal for demo flow and added unnecessary height/complexity).
- Made pricing charts react more visibly to discount changes by:
  - applying deterministic discount/stage sensitivity transforms on projection series
  - anchoring bar scaling to baseline maxima (so magnitude changes are visually apparent)
  - rendering immediate local UI updates on slider/stage changes before server response
- Added fallback EV/projection generation when payload chart arrays are sparse so the simulator stays visually informative in demo mode.

## [0.2.14] - 2026-02-20

### Changed

- Fixed contact-card enrichment badge rendering in the people scene by normalizing `match_score` into readable percentages and suppressing unrealistic outliers (e.g. `999.00`).
- Improved contact display-name fallback logic:
  - prioritizes valid `name`
  - falls back to `first_name` + `last_name`
  - derives a readable name from email local-part when needed
  - avoids empty or malformed name strings in UI cards

## [0.2.13] - 2026-02-20

### Changed

- Expanded `data/mock-signals.json` into a typed, demo-grade signals dataset with realistic intent activity for major target companies.
- Added broad mock coverage across:
  - `openai`
  - `anthropic`
  - `stripe`
  - `notion`
  - `ramp`
  - `mercury`
  - `figma`
  - `clay`
  - `manufact`
- Aligned mock signal records with runtime schema fields (`person_id`, `name`, `title`, `company_key`, `signals`, `intent_score`, `status`) so `get_signals` lookups return deterministic data by company key.

## [0.2.12] - 2026-02-20

### Changed

- Simplified the MCP app header to a slim title/subtitle/live-only strip by removing the top use-case button rail and status line.
- Removed the non-functional "Use-case scene" badge from the result card header.
- Normalized link typography in research/contact cards to match surrounding body text.
- Upgraded research and people scenes with realistic fallback demo data when live payload fields are missing (`N/A`, null, unknown), including:
  - funding timeline placeholders
  - technology stack defaults
  - social link inference
  - contact-card fallback set

## [0.2.11] - 2026-02-20

### Added

- Added `company_profile_workspace` curated MCP tool for company lookup flows:
  - `mode: "search"` and `mode: "list"` via `/api/app/companies/profile`
  - `mode: "get"` via `/api/app/companies/{company_id}/profile`
- Added company tool input schema support for:
  - `company_id`, `name`, `domain`, `website`, `industry`
  - `source`, `limit`, `offset`, `include_raw`

### Changed

- Mapped `company_profile_workspace` into the research scene so company-profile responses render as first-class research cards in the MCP UI.
- Added company-profile quick action from research scene (`Open Company Profile`) when company id is present.

## [0.2.10] - 2026-02-20

### Added

- Added Ajv format support (`uuid`, `date-time`, `email`) via `ajv-formats` to fully validate OpenAPI-derived response schemas without noisy unknown-format warnings.

### Changed

- Added graceful 403 handling for content tools:
  - `content_calendar_workspace`
  - `content_post_workspace`
  - `content_social_accounts`
- Content-scope permission failures now return structured `unavailable` payloads instead of hard MCP tool errors.
- Updated content UI scene to present a clear tenant-permission message and next action when content scope is restricted.

## [0.2.9] - 2026-02-20

### Added

- Added a non-sequential UI use-case scene system for MCP App rendering with dedicated views for:
  - company research
  - people discovery
  - deal impact
  - pricing simulator
  - engagement signals
  - call prep
  - outreach
  - pipeline
  - content
  - cold mail health
- Added an adaptive use-case chip rail so demo operators can jump across scenarios in any order.
- Added role-lens switching (`AE`, `CFO`, `Manager`) inside pricing simulation to support perspective-based storytelling.
- Added a unified call-prep scene that composes context from prior research/people/signals/pricing tool results.
- Added polished scene transitions, KPI card animations, and compact iframe-safe layout behavior.

### Changed

- Rebuilt `resources/app.html` into a sleek, futuristic presentation shell optimized for judge demos.
- Removed gradient button styles; all interactive buttons now use flat branded styling.
- Removed end-user rendering of raw/internal payload details (trace IDs, customer IDs, backend internals).
- Updated scene rendering logic to map tool outputs to use-cases rather than a fixed walkthrough order.

## [0.2.8] - 2026-02-20

### Added

- Added `contact_profile_workspace` as a curated MCP tool for enriched person lookups with:
  - `mode: "search"` via `/api/app/contacts/profile`
  - `mode: "get"` via `/api/app/contacts/{contact_id}/profile`
- Added contact-profile mock payloads (including ContactDB enrichment fields) for both list and single-contact flows.
- Added a dedicated contact profile UI card with enrichment status, match score, and follow-up actions.

### Changed

- Updated MCP UI tool visibility allowlist so contact-profile results render with the app component.
- Updated OpenAPI schema generation to support:
  - temporary manual schema fallback for tools not yet present in published OpenAPI (`contact_profile_workspace`)
  - explicit path override mapping for `outreach_brand_assets_workspace`
- Updated tool inventory docs with the new contact profile workspace capability.

## [0.2.7] - 2026-02-20

### Changed

- Added nvm bootstrap into deploy steps for `dealpulse-mcp` in ops inventory so hosts auto-pull nvm, install LTS Node, and run npm using nvm-managed Node.
- Updated `dealpulse-mcp` systemd unit startup to use `nvm use default`, removing dependency on global `/usr/bin/node`.
- Documented the host bootstrap flow (`nvm` pull/install) in the deploy runbook.

## [0.2.6] - 2026-02-20

### Changed

- Curated grouped tool surface to reduce LLM decision overhead by adding explicit use-case family guidance and a new `knowledge_hub` workspace for artifacts/documents/review workflows.
- Added per-tool input modes for `business_workspace` and `knowledge_hub` to make downstream intent routing deterministic.
- Routed the pricing simulator UI flow through `sales_intelligence` `mode: pricing` so grouped tools remain the single surface for live reads and decisions.
- Removed direct MCP registrations for `research_company`, `get_signals`, and `simulate_pricing` from the runtime toolset to prevent overload.

## [0.2.5] - 2026-02-20

### Added

- Added `scripts/mcp-test-cli.ts` for local/deployed MCP validation with command modes:
  - `health`
  - `list-tools`
  - `call`
  - `check` (health + initialize + tools/list + smoke tool calls)
- Added npm scripts:
  - `mcp:test`
  - `mcp:test:check`
- Documented the CLI validation flow in `README.md` and `docs/prototype-smoke-and-deploy-guide.md`.

## [0.2.4] - 2026-02-20

### Added

- Added `sales_intelligence` grouped tool to the MCP app surface for single-call demo workflows covering research, signals, and pricing.
- Wired demo UI to expose `sales_intelligence` with opinionated default arguments for fast manual rehearsal.
- Updated tool catalog docs to document the new Sales Intelligence use-case grouping.

### Changed

- Expanded sales workflow schema validation so `simulate_pricing`, `get_signals`, and enrichment calls can be orchestrated in one grouped path while preserving direct tool calls.

## [0.2.3] - 2026-02-20

### Added

- Registered `research_company` and `get_signals` into the active MCP server so they are callable alongside grouped Markster tools and the pricing calculator.
- Added Apollo-backed company enrichment with mocked fallback and in-process result caching in `src/services/companyEnrichmentService.ts`.
- Added optional domain-based lookup and API-key-aware fallback logic in `research_company` payloads.
- Added verbose tool-level logging for `research_company`, `get_signals`, and `simulate_pricing`.

### Changed

- Updated `ResearchCompanyInput` schema to accept either `company_name` or `domain` for enrichment input.

## [0.2.2] - 2026-02-20

### Added

- Added OpenAPI-driven Markster tool response schema generation into `src/markster/generated-openapi-schemas.ts`.
- Added CI enforcement (`./scripts/ci`) to fail when generated schema contracts drift from `docs/openapi.json`.
- Added optional docs key support (`MARKSTER_DOCS_API_KEY`) and documented generation flow in `README.md`.
- Added verbose MCP server + Markster API logging for every grouped workflow and underlying API call.
- Added grouped, demo-oriented tool surfaces in `MARKSTER_TOOL_GROUP_CATALOG` for faster, use-case-first LLM orchestration.
- Added temporary `lint` script to keep `pre-commit` hook passing with current repo tooling.

### Changed

- Updated Markster API client to validate runtime payloads against generated OpenAPI-derived schemas via Ajv.

## [0.2.1] - 2026-02-20

### Added

- Added explicit single-customer binding contract for the Markster customer panel (`panel.markster.io`).
- Added live-mode startup validation using `MARKSTER_CUSTOMER_API_KEY` so MCP starts in live mode only when token is configured.
- Added startup health metadata (`mode`, `markster_api`) on `GET /` for quick deployment verification.

### Changed

- Standardized live auth header usage for Markster API requests and updated `.env.example`/docs for single instance configuration.

## [0.2.0] - 2026-02-20

### Changed

- Pivoted the prototype to Markster Business OS instead of a standalone DealPulse sales flow.
- Registered the documented Markster MCP surface (28 tools) from `docs/markster-mcp-tools.md`.
- Updated MCP app metadata, resource labels, and UI shell branding to Markster.

### Added

- Full mock mode for Markster tool calls:
  - New Markster API client fallback with deterministic dummy payloads per tool.
  - `MARKSTER_MOCK_MODE` and Markster env configuration in `.env.example`.
  - No external Markster dependency required to run the UI and tool surface locally.
- Added mock payload generators for all Markster tool categories:
  - Customer workspace/onboarding, tasks, AI team, knowledge, content, TAP, outreach, mailboxes, and voice.
- Updated docs quick-start framing and status endpoints for the Markster deployment.

### Notes

- Existing pricing simulator mock implementation remains for the wow moment.

## [0.1.0] - 2026-02-20

### Added

- TypeScript MCP App server scaffold for mock-only sales companion prototype.
- Server tools:
  - `research_company`
  - `deal_impact`
  - `simulate_pricing`
  - `get_signals`
  - `prep_call`
- Pre-seeded mock datasets under `src/data`:
  - Companies (`src/data/preseeded/index.json`)
  - Financial baseline (`src/data/financials.json`)
  - Signals (`src/data/mock-signals.json`)
- SPA-like MCP UI (`resources/app.html`, `src/ui/app.ts`) with tabs, slider simulator, and call-prep rendering.
- Deployment and local dev scripts in `package.json`.
- Type definitions in `src/types/contracts.ts` and core mock business logic services.
- UI transport compatibility improvements:
  - Fixed production UI asset path so `dist/resources/app.html` is used for MCP app rendering.
  - Added legacy `ui/resourceUri` metadata fallback for broader client compatibility.
  - Ensured startup builds UI assets before server boot so fresh deployments serve the bundled HTML.

### Documentation

- Added `docs/prototype-smoke-and-deploy-guide.md` with local smoke steps and Manufact deploy checklist.
- Added `.gitignore` and TypeScript config updates for the app scaffold.

### Notes

- All external integrations are mocked in this stage; external API calls are represented by local JSON fixtures.
