import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import {
  MARKSTER_TOOL_CATALOG,
  MARKSTER_TOOL_USE_CASES,
  MarksterToolDescriptor,
} from "../shared/marksterToolManifest";
import { buildDealProjection } from "../services/impactEngine";
import {
  getBaselineFinancials,
  getCompanyByKey,
  getSignals,
} from "../services/mockData";
import { enrichCompanyProfile } from "../services/companyEnrichmentService";
import {
  callMarksterTool,
  shouldLogToolCalls,
  MarksterRequestError,
  getMarksterRuntimeMode,
  setMarksterRuntimeMode,
  MarksterRuntimeMode,
} from "../markster/client";

const TOOL_META_FALLBACK_KEY = "ui/resourceUri";
const UI_ENABLED_TOOL_NAMES = new Set<string>([
  "sales_intelligence",
  "customer_workspace_snapshot",
  "contact_profile_workspace",
  "company_profile_workspace",
  "dashboard_insights",
  "pipeline_workspace",
  "task_workspace",
  "content_calendar_workspace",
  "content_post_workspace",
  "outreach_sequence_workspace",
  "cold_mail_health",
]);

const ToolSchemaEmpty = z.object({});

const ToolSchemaSalesIntelligence = z.object({
  mode: z
    .enum(["research", "signals", "pricing"])
    .describe(
      "Operation mode. research=company profile lookup, signals=buying signals, pricing=deal simulation.",
    )
    .optional()
    .default("research"),
  company_name: z
    .string()
    .trim()
    .describe("Company name for research mode (example: Airtame).")
    .optional(),
  domain: z
    .string()
    .trim()
    .describe("Company domain for research mode (example: airtame.com).")
    .optional(),
  company_key: z
    .string()
    .trim()
    .describe(
      "Canonical company key for signals/pricing mode (example: anthropic).",
    )
    .optional(),
  deal_size: z
    .number()
    .positive()
    .finite()
    .describe("Deal amount used by pricing mode (example: 250000).")
    .optional(),
  deal_stage: z
    .enum(["discovery", "proposal_sent", "negotiation", "verbal_commit"])
    .describe("Deal stage used by pricing mode.")
    .optional()
    .default("negotiation"),
  discount_pct: z
    .number()
    .min(0)
    .max(100)
    .describe("Discount percentage for pricing mode (0-100).")
    .optional(),
});

const ToolSchemaCustomerProfileManage = z.object({
  mode: z
    .enum(["read", "update_profile", "update_onboarding_profile"])
    .describe(
      "read returns current profile. update_profile writes profile. update_onboarding_profile writes onboarding defaults.",
    )
    .optional()
    .default("read"),
  profile: z
    .record(z.unknown())
    .describe(
      'Profile patch object for update_profile mode (example: {"timezone":"Europe/Copenhagen"}).',
    )
    .optional(),
  onboarding_profile: z
    .record(z.unknown())
    .describe("Onboarding profile patch for update_onboarding_profile mode.")
    .optional(),
});

const ToolSchemaContactProfileWorkspace = z.object({
  mode: z
    .enum(["search", "get", "list"])
    .describe(
      "search uses filters, get fetches one contact by id, list intentionally returns broad contact pages.",
    )
    .optional()
    .default("search"),
  contact_id: z
    .string()
    .trim()
    .describe("Contact id. Required for mode=get.")
    .optional(),
  name: z
    .string()
    .trim()
    .describe("Name filter for mode=search (example: Ivan Ivanka).")
    .optional(),
  email: z.string().trim().describe("Email filter for mode=search.").optional(),
  title: z.string().trim().describe("Title filter for mode=search.").optional(),
  company: z
    .string()
    .trim()
    .describe("Company filter for mode=search.")
    .optional(),
  source: z
    .string()
    .trim()
    .describe("Data source selector, typically all/crm/contactdb.")
    .optional(),
  include_enriched: z
    .boolean()
    .describe("Include ContactDB enrichment payloads when available.")
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe("Page size for mode=search/list (max 100).")
    .optional(),
  offset: z
    .number()
    .int()
    .min(0)
    .describe("Result offset for mode=search/list.")
    .optional(),
});

const ToolSchemaCompanyProfileWorkspace = z.object({
  mode: z
    .enum(["search", "get", "list"])
    .describe(
      "search uses filters, get fetches one company by id, list intentionally returns broader company pages.",
    )
    .optional()
    .default("search"),
  company_id: z
    .string()
    .trim()
    .describe("Company id. Required for mode=get.")
    .optional(),
  name: z
    .string()
    .trim()
    .describe("Company name filter for mode=search (example: Stripe).")
    .optional(),
  domain: z
    .string()
    .trim()
    .describe("Domain filter for mode=search (example: stripe.com).")
    .optional(),
  website: z
    .string()
    .trim()
    .describe("Website filter for mode=search.")
    .optional(),
  industry: z
    .string()
    .trim()
    .describe("Industry filter for mode=search.")
    .optional(),
  source: z
    .string()
    .trim()
    .describe("Data source selector, typically all/crm/contactdb.")
    .optional(),
  include_raw: z
    .boolean()
    .describe("Include provider raw payload when available.")
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe("Page size for mode=search/list (max 100).")
    .optional(),
  offset: z
    .number()
    .int()
    .min(0)
    .describe("Result offset for mode=search/list.")
    .optional(),
});

const ToolSchemaOnboardingFlowManage = z.object({
  mode: z
    .enum(["start", "save", "profile"])
    .describe(
      "start initializes onboarding, save persists answers, profile reads consolidated onboarding profile.",
    )
    .optional()
    .default("start"),
  step_answers: z
    .record(z.unknown())
    .describe("Step answers payload for mode=save.")
    .optional(),
  task_id: z
    .string()
    .describe("Optional onboarding task id context.")
    .optional(),
});

const ToolSchemaOnboardingAiAssist = z.object({
  mode: z
    .enum(["prefill", "score", "voice_pack"])
    .describe(
      "prefill suggests values, score evaluates completeness, voice_pack builds default voice profile.",
    )
    .optional()
    .default("prefill"),
  company_name: z
    .string()
    .trim()
    .describe("Company name context for score/voice_pack modes.")
    .optional(),
  context: z
    .record(z.unknown())
    .describe("Optional rich context object for AI onboarding assist.")
    .optional(),
});

const ToolSchemaDashboardInsights = z.object({
  mode: z
    .enum(["dashboard", "metrics", "refresh"])
    .describe(
      "dashboard returns summary, metrics returns metric history, refresh triggers data refresh.",
    )
    .optional()
    .default("dashboard"),
  metric: z.string().describe("Metric key for mode=metrics.").optional(),
  date_from: z
    .string()
    .describe("ISO date lower bound for mode=metrics.")
    .optional(),
  date_to: z
    .string()
    .describe("ISO date upper bound for mode=metrics.")
    .optional(),
});

const ToolSchemaPipelineWorkspace = z.object({
  mode: z
    .enum(["overview", "trend", "at_risk", "refresh"])
    .describe(
      "overview returns dashboard pipeline rollup, trend returns metric history, at_risk targets risk-focused metric history, refresh triggers dashboard refresh.",
    )
    .optional()
    .default("overview"),
  metric: z
    .string()
    .describe(
      "Optional metric override for trend/at_risk modes (example: pipeline_created).",
    )
    .optional(),
  date_from: z
    .string()
    .describe("ISO date lower bound for trend/at_risk modes.")
    .optional(),
  date_to: z
    .string()
    .describe("ISO date upper bound for trend/at_risk modes.")
    .optional(),
});

const ToolSchemaTaskAction = z.object({
  action: z
    .enum(["start", "complete", "reopen", "submit-data", "validate"])
    .optional()
    .default("start"),
  task_id: z.string().min(1),
  notes: z.string().optional(),
});

const ToolSchemaAiTeamWorkspace = z.object({
  mode: z
    .enum([
      "agents",
      "conversations",
      "get",
      "create",
      "rename",
      "delete",
      "switch",
    ])
    .describe("Conversation management mode.")
    .optional()
    .default("agents"),
  conversation_id: z
    .string()
    .describe("Conversation id for get/rename/delete/switch modes.")
    .optional(),
  conversation_name: z
    .string()
    .describe("Conversation display name for create/rename.")
    .optional(),
  agent_id: z.string().describe("Agent id for switch mode.").optional(),
  name: z
    .string()
    .describe("Alias for conversation_name in create mode.")
    .optional(),
});

const ToolSchemaAiTeamChatTurn = z.object({
  mode: z.enum(["send"]).optional().default("send"),
  conversation_id: z.string().optional(),
  message: z.string().min(1),
  create_conversation: z.boolean().optional(),
});

const ToolSchemaCustomerImageAssets = z.object({
  mode: z.enum(["upload", "delete"]).optional().default("upload"),
  asset_id: z.string().optional(),
  asset_url: z.string().optional(),
});

const ToolSchemaContentCalendarWorkspace = z.object({
  mode: z
    .enum(["current_week", "list", "get_calendar"])
    .describe(
      "current_week (default) resolves latest active calendar and returns this week's posts. list returns calendars only. get_calendar returns calendar with all items.",
    )
    .optional()
    .default("current_week"),
  calendar_id: z
    .string()
    .describe(
      "Calendar id override. Optional for current_week/get_calendar; if omitted, latest active calendar is used.",
    )
    .optional(),
  week_start: z
    .string()
    .describe(
      "Optional ISO date override for current_week mode start boundary (YYYY-MM-DD).",
    )
    .optional(),
  week_end: z
    .string()
    .describe(
      "Optional ISO date override for current_week mode end boundary (YYYY-MM-DD).",
    )
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .describe("Max posts returned for current_week mode (default 5).")
    .optional(),
});

const ToolSchemaContentPostWorkspace = z.object({
  mode: z
    .enum(["get", "generate", "edit", "regenerate", "approve", "schedule"])
    .describe(
      "get/edit/regenerate/approve/schedule use post_id. generate uses item_id.",
    )
    .optional()
    .default("get"),
  item_id: z
    .string()
    .describe("Calendar item id for generate mode.")
    .optional(),
  post_id: z
    .string()
    .describe("Post id for get/edit/regenerate/approve/schedule modes.")
    .optional(),
  text: z.string().describe("Updated post text for mode=edit.").optional(),
  image_prompt: z
    .string()
    .describe("Optional image prompt for mode=regenerate.")
    .optional(),
  social_account_id: z
    .string()
    .describe("Social account id for mode=approve/schedule.")
    .optional(),
  schedule_time: z
    .string()
    .describe("ISO datetime for mode=schedule.")
    .optional(),
  schedule_date: z
    .string()
    .describe("ISO date for mode=schedule when schedule_time is omitted.")
    .optional(),
});

const ToolSchemaVoicePackWorkspace = z.object({
  mode: z
    .enum(["list", "set_default"])
    .describe(
      "list returns available voice packs; set_default applies one voice_pack_id.",
    )
    .optional()
    .default("list"),
  voice_pack_id: z
    .string()
    .describe("Voice pack id required for mode=set_default.")
    .optional(),
});

const ToolSchemaRuntimeModeSwitch = z.object({
  mode: z
    .enum(["live_with_fallback", "live_strict", "mock"])
    .describe(
      "Runtime mode: mock (default startup), live_with_fallback (mixed mode), or live_strict (no fallback).",
    )
    .optional()
    .default("mock"),
  persist_to_env: z
    .boolean()
    .describe(
      "If true, also sets MARKSTER_RUNTIME_MODE in-process for this running server instance.",
    )
    .optional()
    .default(false),
});

const TOOL_INPUT_SCHEMAS: Record<string, z.ZodTypeAny> = {
  sales_intelligence: ToolSchemaSalesIntelligence,
  runtime_mode_switch: ToolSchemaRuntimeModeSwitch,
  customer_workspace_snapshot: ToolSchemaEmpty,
  customer_profile_manage: ToolSchemaCustomerProfileManage,
  contact_profile_workspace: ToolSchemaContactProfileWorkspace,
  company_profile_workspace: ToolSchemaCompanyProfileWorkspace,
  onboarding_flow_manage: ToolSchemaOnboardingFlowManage,
  onboarding_ai_assist: ToolSchemaOnboardingAiAssist,
  dashboard_insights: ToolSchemaDashboardInsights,
  pipeline_workspace: ToolSchemaPipelineWorkspace,
  task_workspace: ToolSchemaEmpty,
  task_action: ToolSchemaTaskAction,
  task_content_regenerate: z.object({ task_id: z.string().min(1) }),
  ai_team_workspace: ToolSchemaAiTeamWorkspace,
  ai_team_chat_turn: ToolSchemaAiTeamChatTurn,
  customer_artifact_workspace: ToolSchemaEmpty,
  customer_document_workspace: ToolSchemaEmpty,
  customer_data_change_review: ToolSchemaEmpty,
  content_calendar_workspace: ToolSchemaContentCalendarWorkspace,
  content_post_workspace: ToolSchemaContentPostWorkspace,
  content_audio_library: ToolSchemaEmpty,
  content_social_accounts: ToolSchemaEmpty,
  outreach_brand_assets_workspace: ToolSchemaEmpty,
  outreach_icp_workspace: ToolSchemaEmpty,
  outreach_sequence_workspace: ToolSchemaEmpty,
  outreach_enrollment: z.object({
    sequence_id: z.string().min(1),
    lead_ids: z.array(z.string().min(1)),
  }),
  domain_mailbox_manage: ToolSchemaEmpty,
  cold_mail_health: ToolSchemaEmpty,
  customer_image_assets: ToolSchemaCustomerImageAssets,
  voice_pack_workspace: ToolSchemaVoicePackWorkspace,
};

type ToolCallContext = { tool: string; traceId: string };
type ToolCallArgs = Record<string, unknown>;
const MAX_MCP_TEXT_BYTES = Number(
  process.env.MCP_TOOL_TEXT_MAX_BYTES ?? 120000,
);
const MAX_UI_STRUCTURED_BYTES = Number(
  process.env.MCP_UI_STRUCTURED_MAX_BYTES ?? 3500000,
);
const MAX_TRIM_DEPTH = 6;
const MAX_TRIM_ARRAY_ITEMS = 40;
const MAX_TRIM_OBJECT_KEYS = 80;
const MAX_TRIM_STRING_CHARS = 4000;

function inputSchemaForTool(toolName: string): z.ZodTypeAny {
  return TOOL_INPUT_SCHEMAS[toolName] ?? ToolSchemaEmpty;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function stringifyInput(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function utf8ByteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function tryStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function trimForUiTransport(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length > MAX_TRIM_STRING_CHARS
      ? `${value.slice(0, MAX_TRIM_STRING_CHARS)}...`
      : value;
  }

  if (depth >= MAX_TRIM_DEPTH) {
    if (Array.isArray(value)) {
      return `[truncated array: ${value.length} items]`;
    }
    if (isRecord(value)) {
      return "[truncated object]";
    }
    return String(value);
  }

  if (Array.isArray(value)) {
    const trimmed = value
      .slice(0, MAX_TRIM_ARRAY_ITEMS)
      .map((item) => trimForUiTransport(item, depth + 1));
    const remainder = value.length - MAX_TRIM_ARRAY_ITEMS;
    if (remainder > 0) {
      trimmed.push(`[+${remainder} more items]`);
    }
    return trimmed;
  }

  if (!isRecord(value)) {
    return String(value);
  }

  const output: Record<string, unknown> = {};
  let count = 0;
  for (const [key, nested] of Object.entries(value)) {
    if (count >= MAX_TRIM_OBJECT_KEYS) break;
    if (key === "social_posts" && Array.isArray(nested)) {
      output[key] = `[omitted ${nested.length} social posts for size safety]`;
      count += 1;
      continue;
    }
    output[key] = trimForUiTransport(nested, depth + 1);
    count += 1;
  }
  const hidden = Object.keys(value).length - count;
  if (hidden > 0) {
    output._truncated_keys = hidden;
  }
  return output;
}

function enforceUiPayloadLimit(payload: unknown): {
  payload: unknown;
  truncated: boolean;
} {
  const raw = tryStringify(payload);
  if (!raw) {
    return { payload, truncated: false };
  }
  if (utf8ByteLength(raw) <= MAX_UI_STRUCTURED_BYTES) {
    return { payload, truncated: false };
  }

  const trimmed = trimForUiTransport(payload);
  const trimmedRaw = tryStringify(trimmed);
  if (trimmedRaw && utf8ByteLength(trimmedRaw) <= MAX_UI_STRUCTURED_BYTES) {
    return { payload: trimmed, truncated: true };
  }

  const preview =
    isRecord(payload) || Array.isArray(payload)
      ? trimForUiTransport(payload, MAX_TRIM_DEPTH)
      : String(payload);
  return {
    payload: {
      message:
        "Payload truncated for MCP UI size safety. Narrow the query to fetch full details.",
      preview,
    },
    truncated: true,
  };
}

function buildToolContentText(payload: unknown): string {
  const raw = tryStringify(payload);
  if (!raw) {
    return "Result returned.";
  }
  if (utf8ByteLength(raw) <= MAX_MCP_TEXT_BYTES) {
    return raw;
  }
  const maxChars = Math.max(1024, Math.floor(MAX_MCP_TEXT_BYTES * 0.75));
  return `${raw.slice(0, maxChars)}\n...[truncated for MCP transport]`;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord);
}

function isUiEnabledTool(toolName: string): boolean {
  return UI_ENABLED_TOOL_NAMES.has(toolName);
}

function withUiToolContext(
  toolName: string,
  payload: unknown,
): Record<string, unknown> | unknown {
  if (!isRecord(payload)) {
    return {
      tool: toolName,
      payload,
    };
  }
  if (typeof payload.tool === "string") {
    return {
      tool: toolName,
      payload,
    };
  }
  return {
    tool: toolName,
    ...payload,
  };
}

const TOOL_BY_NAME = new Map(
  MARKSTER_TOOL_CATALOG.map((tool) => [tool.name, tool] as const),
);

function getToolDescriptor(name: string): MarksterToolDescriptor {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) {
    throw new Error(`Unknown raw Markster tool: ${name}`);
  }
  return tool;
}

function unwrapToolPayload(result: unknown): unknown {
  if (!isRecord(result)) return result;
  const payload =
    isRecord(result.payload) || Array.isArray(result.payload)
      ? result.payload
      : "payload" in result
        ? result.payload
        : result;

  if (!isRecord(payload)) {
    return payload;
  }

  const meta: Record<string, unknown> = {};
  if (typeof result.source === "string") {
    meta.source = result.source;
  }
  if (typeof result.runtime_mode === "string") {
    meta.runtime_mode = result.runtime_mode;
  }
  if (isRecord(result.fallback)) {
    meta.fallback = result.fallback;
  }

  if (Object.keys(meta).length === 0) {
    return payload;
  }

  if (isRecord(payload._mcp_meta)) {
    return payload;
  }

  return {
    ...payload,
    _mcp_meta: meta,
  };
}

function makeTraceId(prefix: string): string {
  const seed = `${prefix}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000000007;
  }
  return `${prefix}-${hash}`;
}

async function callRawTool(
  name: string,
  args: ToolCallArgs = {},
  context?: ToolCallContext,
): Promise<unknown> {
  const spec = getToolDescriptor(name);
  const traceId = context?.traceId ?? "unscoped";
  const started = Date.now();
  if (shouldLogToolCalls()) {
    console.info(
      `[mcp-server] start raw=${name} tool=${
        context?.tool ?? "na"
      } trace=${traceId} args=${stringifyInput(args)}`,
    );
  }

  const result = await callMarksterTool(spec, args);
  const durationMs = Date.now() - started;
  if (shouldLogToolCalls()) {
    console.info(
      `[mcp-server] done raw=${name} tool=${
        context?.tool ?? "na"
      } trace=${traceId} duration_ms=${durationMs}`,
    );
  }
  return unwrapToolPayload(result);
}

async function runSalesIntelligence(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "research";
  const companyName = toStringOrUndefined(args.company_name);
  const domain = toStringOrUndefined(args.domain);
  const companyKey = toStringOrUndefined(args.company_key);
  const dealSize =
    typeof args.deal_size === "number" && Number.isFinite(args.deal_size)
      ? args.deal_size
      : undefined;
  const dealStage = toStringOrUndefined(args.deal_stage) || "negotiation";
  const discountPct =
    typeof args.discount_pct === "number" && Number.isFinite(args.discount_pct)
      ? args.discount_pct
      : undefined;

  if (mode === "research") {
    if (!companyName && !domain) {
      throw new Error(
        "sales_intelligence.research requires company_name or domain.",
      );
    }

    const profile = await enrichCompanyProfile({
      ...(companyName ? { company_name: companyName } : {}),
      ...(domain ? { domain } : {}),
    });

    return {
      workflow: "sales_intelligence",
      mode,
      trace_id: context.traceId,
      ...profile,
    };
  }

  if (mode === "signals") {
    if (!companyKey) {
      throw new Error("sales_intelligence.signals requires company_key.");
    }

    const company = getCompanyByKey(companyKey);
    const signals = getSignals(companyKey);
    return {
      workflow: "sales_intelligence",
      mode,
      trace_id: context.traceId,
      source: "mock",
      live: false,
      company_key: companyKey,
      company_name: company?.name ?? companyKey,
      signals,
      count: signals.length,
      note: "Signals are synthetic and tuned for demo scenarios.",
    };
  }

  if (mode === "pricing") {
    if (!companyKey || !dealSize || discountPct === undefined) {
      throw new Error(
        "sales_intelligence.pricing requires company_key, deal_size, discount_pct.",
      );
    }

    const company = getCompanyByKey(companyKey);
    const financials = getBaselineFinancials(companyKey);
    const projection = buildDealProjection(
      financials,
      dealSize,
      discountPct,
      dealStage as
        | "discovery"
        | "proposal_sent"
        | "negotiation"
        | "verbal_commit",
    );

    return {
      ...projection,
      workflow: "sales_intelligence",
      mode,
      trace_id: context.traceId,
      source: "mock",
      company_name: company?.name ?? financials.company,
      company_key: companyKey,
      discount_pct: discountPct,
      deal_stage: dealStage,
      deal_size: dealSize,
    };
  }

  throw new Error(`sales_intelligence mode '${mode}' is not supported.`);
}

async function runCustomerProfileManage(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "read";
  if (mode === "update_profile" && !isRecord(args.profile)) {
    throw new Error(
      "customer_profile_manage.update_profile requires profile object.",
    );
  }
  if (
    mode === "update_onboarding_profile" &&
    !isRecord(args.onboarding_profile)
  ) {
    throw new Error(
      "customer_profile_manage.update_onboarding_profile requires onboarding_profile object.",
    );
  }
  return callRawTool("customer_profile_manage", args, context);
}

async function runRuntimeModeSwitch(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const requested = (toStringOrUndefined(args.mode) ??
    "live_with_fallback") as MarksterRuntimeMode;
  const persistToEnv = args.persist_to_env === true;
  const previousMode = getMarksterRuntimeMode();
  const mode = setMarksterRuntimeMode(requested);

  if (persistToEnv) {
    process.env.MARKSTER_RUNTIME_MODE = mode;
  }

  return {
    workflow: "runtime_mode_switch",
    trace_id: context.traceId,
    previous_mode: previousMode,
    mode,
    persist_to_env: persistToEnv,
    note:
      mode === "mock"
        ? "All tool calls now use demo/mock payloads."
        : mode === "live_strict"
          ? "Tool calls now use strict live mode (no fallback)."
          : "Tool calls now use live-first with automatic demo fallback.",
  };
}

async function runOnboardingFlowManage(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "start";
  if (mode === "save" && !isRecord(args.step_answers)) {
    throw new Error("onboarding_flow_manage.save requires step_answers.");
  }
  return callRawTool("onboarding_flow_manage", args, context);
}

async function runOnboardingAiAssist(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "prefill";
  if (
    mode === "score" &&
    !toStringOrUndefined(args.company_name) &&
    !isRecord(args.context)
  ) {
    throw new Error(
      "onboarding_ai_assist.score requires company_name or context.",
    );
  }
  return callRawTool("onboarding_ai_assist", args, context);
}

async function runDashboardInsights(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "dashboard";
  if (mode === "metrics" && !toStringOrUndefined(args.metric)) {
    throw new Error("dashboard_insights.metrics requires metric.");
  }
  return callRawTool("dashboard_insights", args, context);
}

async function runPipelineWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "overview";
  const metric = toStringOrUndefined(args.metric);
  const dateFrom = toStringOrUndefined(args.date_from);
  const dateTo = toStringOrUndefined(args.date_to);

  let dashboardMode: "dashboard" | "metrics" | "refresh" = "dashboard";
  let resolvedMetric: string | undefined;

  if (mode === "refresh") {
    dashboardMode = "refresh";
  } else if (mode === "trend") {
    dashboardMode = "metrics";
    resolvedMetric = metric ?? "pipeline_created";
  } else if (mode === "at_risk") {
    dashboardMode = "metrics";
    resolvedMetric = metric ?? "deals_at_risk";
  } else if (mode === "overview") {
    dashboardMode = "dashboard";
  } else {
    throw new Error(
      "pipeline_workspace mode must be one of: overview, trend, at_risk, refresh.",
    );
  }

  const requestArgs: ToolCallArgs = {
    mode: dashboardMode,
    ...(resolvedMetric ? { metric: resolvedMetric } : {}),
    ...(dashboardMode === "metrics" && dateFrom ? { date_from: dateFrom } : {}),
    ...(dashboardMode === "metrics" && dateTo ? { date_to: dateTo } : {}),
  };

  const payload = await callRawTool("dashboard_insights", requestArgs, context);
  const payloadRecord = isRecord(payload) ? payload : null;

  if (payloadRecord) {
    return {
      workflow: "pipeline_workspace",
      mode,
      trace_id: context.traceId,
      source: "markster_panel_dashboard",
      request: requestArgs,
      ...payloadRecord,
    };
  }

  return {
    workflow: "pipeline_workspace",
    mode,
    trace_id: context.traceId,
    source: "markster_panel_dashboard",
    request: requestArgs,
    payload,
  };
}

async function runAiTeamWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "agents";
  const conversationId = toStringOrUndefined(args.conversation_id);
  const conversationName =
    toStringOrUndefined(args.conversation_name) ??
    toStringOrUndefined(args.name);
  const agentId = toStringOrUndefined(args.agent_id);

  if (mode === "create" && !conversationName) {
    throw new Error("ai_team_workspace.create requires conversation_name.");
  }
  if (mode === "switch" && (!conversationId || !agentId)) {
    throw new Error(
      "ai_team_workspace.switch requires conversation_id and agent_id.",
    );
  }
  if (
    (mode === "get" || mode === "rename" || mode === "delete") &&
    !conversationId
  ) {
    throw new Error(`ai_team_workspace.${mode} requires conversation_id.`);
  }

  return callRawTool("ai_team_workspace", args, context);
}

async function runContentPostWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "get";
  const itemId = toStringOrUndefined(args.item_id);
  const postId = toStringOrUndefined(args.post_id);
  const text = toStringOrUndefined(args.text);
  const imagePrompt = toStringOrUndefined(args.image_prompt);
  const socialAccountId = toStringOrUndefined(args.social_account_id);
  const scheduleTime = toStringOrUndefined(args.schedule_time);
  const scheduleDate = toStringOrUndefined(args.schedule_date);

  const callCustomRawTool = async (
    spec: MarksterToolDescriptor,
    requestArgs: ToolCallArgs,
  ): Promise<unknown> => {
    const started = Date.now();
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] start raw=${spec.name} tool=${context.tool} trace=${
          context.traceId
        } args=${stringifyInput(requestArgs)}`,
      );
    }
    const result = await callMarksterTool(spec, requestArgs);
    const durationMs = Date.now() - started;
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] done raw=${spec.name} tool=${context.tool} trace=${context.traceId} duration_ms=${durationMs}`,
      );
    }
    return unwrapToolPayload(result);
  };

  if (mode === "get") {
    if (!postId) {
      throw new Error("content_post_workspace.get requires post_id.");
    }
    const singleSpec: MarksterToolDescriptor = {
      name: "content_post_workspace_get",
      title: "Content Post Workspace (single)",
      description: "Fetch one content post by id.",
      category: "Content Calendar & Social Publishing",
      method: "GET",
      endpoint: "/api/content/posts/{post_id}",
    };
    try {
      const post = await callCustomRawTool(singleSpec, { post_id: postId });
      const postRecord = isRecord(post) ? post : {};
      return {
        workflow: "content_post_workspace",
        mode: "get",
        trace_id: context.traceId,
        post_id: postId,
        post: postRecord,
        image_url: toStringOrUndefined(postRecord.image_url),
      };
    } catch (error) {
      if (error instanceof MarksterRequestError && error.status === 403) {
        return {
          workflow: "content_post_workspace",
          status: "unavailable",
          available: false,
          reason: "content_scope_forbidden",
          message:
            "Content module is not enabled for this customer token. Ask an admin to grant /api/content permissions for this instance.",
        };
      }
      throw error;
    }
  }

  if (mode === "generate" && !itemId) {
    throw new Error("content_post_workspace.generate requires item_id.");
  }
  if (mode === "edit" && (!postId || !text)) {
    throw new Error("content_post_workspace.edit requires post_id and text.");
  }
  if (
    (mode === "regenerate" || mode === "approve" || mode === "schedule") &&
    !postId
  ) {
    throw new Error(`content_post_workspace.${mode} requires post_id.`);
  }

  if (mode === "edit") {
    const editSpec: MarksterToolDescriptor = {
      name: "content_post_workspace_edit",
      title: "Content Post Workspace (edit)",
      description: "Edit generated post content by post id.",
      category: "Content Calendar & Social Publishing",
      method: "PATCH",
      endpoint: "/api/content/posts/{post_id}",
    };
    return callCustomRawTool(editSpec, {
      post_id: postId!,
      body: { body: text },
    });
  }

  if (mode === "regenerate") {
    const regenSpec: MarksterToolDescriptor = {
      name: "content_post_workspace_regenerate",
      title: "Content Post Workspace (regenerate image)",
      description: "Regenerate post image by post id.",
      category: "Content Calendar & Social Publishing",
      method: "POST",
      endpoint: "/api/content/posts/{post_id}/image/regenerate",
    };
    return callCustomRawTool(regenSpec, {
      post_id: postId!,
      body: {
        ...(imagePrompt ? { image_prompt: imagePrompt } : {}),
      },
    });
  }

  if (mode === "approve" || mode === "schedule") {
    const scheduleSpec: MarksterToolDescriptor = {
      name: "content_post_workspace_schedule",
      title: "Content Post Workspace (approve and schedule)",
      description: "Approve and schedule generated post by post id.",
      category: "Content Calendar & Social Publishing",
      method: "POST",
      endpoint: "/api/content/posts/{post_id}/approve-and-schedule",
    };
    return callCustomRawTool(scheduleSpec, {
      post_id: postId!,
      body: {
        ...(socialAccountId ? { social_account_id: socialAccountId } : {}),
        ...(scheduleTime ? { schedule_time: scheduleTime } : {}),
        ...(scheduleDate ? { schedule_date: scheduleDate } : {}),
      },
    });
  }

  return runContentToolWith403Fallback(
    "content_post_workspace",
    {
      ...(itemId ? { item_id: itemId } : {}),
      ...(text ? { text } : {}),
      ...(args.body && isRecord(args.body) ? { body: args.body } : {}),
    },
    context,
  );
}

function parseTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeDateOnly(value: Date): Date {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function isoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function resolveWeekRange(
  weekStartInput: string | undefined,
  weekEndInput: string | undefined,
): {
  startTs: number;
  endTs: number;
  startIso: string;
  endIso: string;
} {
  const startTsInput = parseTimestamp(weekStartInput);
  const endTsInput = parseTimestamp(weekEndInput);
  if (startTsInput !== undefined && endTsInput !== undefined) {
    const start = normalizeDateOnly(new Date(startTsInput));
    const end = normalizeDateOnly(new Date(endTsInput));
    end.setHours(23, 59, 59, 999);
    return {
      startTs: start.getTime(),
      endTs: end.getTime(),
      startIso: isoDateOnly(start),
      endIso: isoDateOnly(end),
    };
  }

  const now = new Date();
  const start = normalizeDateOnly(now);
  const dayIndex = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayIndex);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    startTs: start.getTime(),
    endTs: end.getTime(),
    startIso: isoDateOnly(start),
    endIso: isoDateOnly(end),
  };
}

function extractImageUrl(record: Record<string, unknown>): string | undefined {
  const direct = sanitizeMediaUrl(toStringOrUndefined(record.image_url));
  if (direct) return direct;
  const media = asRecordArray(record.media);
  for (const item of media) {
    const url = sanitizeMediaUrl(toStringOrUndefined(item.url));
    if (!url) continue;
    const mediaType = toStringOrUndefined(item.type)?.toLowerCase();
    if (!mediaType || mediaType === "image") return url;
  }
  return undefined;
}

function sanitizeMediaUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return undefined;
  if (trimmed.length > 2048) return undefined;
  return trimmed;
}

async function runContentCalendarWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "current_week";
  const calendarIdInput = toStringOrUndefined(args.calendar_id);
  const weekStartInput = toStringOrUndefined(args.week_start);
  const weekEndInput = toStringOrUndefined(args.week_end);
  const limitRaw = toNumberOrUndefined(args.limit);
  const limit =
    limitRaw !== undefined ? Math.min(20, Math.max(1, limitRaw)) : 5;

  try {
    const listPayload = await callRawTool(
      "content_calendar_workspace",
      {},
      context,
    );
    let calendars = asRecordArray(listPayload);
    if (!calendars.length && isRecord(listPayload)) {
      calendars = asRecordArray(listPayload.calendars);
    }
    if (!calendars.length && isRecord(listPayload)) {
      calendars = asRecordArray(listPayload.data);
    }

    if (mode === "list") {
      return {
        workflow: "content_calendar_workspace",
        mode: "list",
        trace_id: context.traceId,
        total_calendars: calendars.length,
        calendars,
      };
    }

    const nowTs = Date.now();
    const inferredCurrentCalendar =
      calendars.find((calendar) => {
        const status = toStringOrUndefined(calendar.status)?.toLowerCase();
        return (
          status === "active" ||
          status === "current" ||
          status === "live" ||
          status === "in_progress"
        );
      }) ??
      calendars.find((calendar) => {
        const start = parseTimestamp(
          toStringOrUndefined(calendar.date_start) ??
            toStringOrUndefined(calendar.start_date),
        );
        const end = parseTimestamp(
          toStringOrUndefined(calendar.date_end) ??
            toStringOrUndefined(calendar.end_date),
        );
        return (
          start !== undefined &&
          end !== undefined &&
          nowTs >= start &&
          nowTs <= end
        );
      });

    let selectedCalendar =
      calendars.find(
        (calendar) => toStringOrUndefined(calendar.id) === calendarIdInput,
      ) ??
      inferredCurrentCalendar ??
      null;
    if (!selectedCalendar && calendars.length) {
      selectedCalendar = calendars[0];
    }
    const selectedCalendarId =
      calendarIdInput ??
      (selectedCalendar ? toStringOrUndefined(selectedCalendar.id) : undefined);

    if (!selectedCalendarId) {
      return {
        workflow: "content_calendar_workspace",
        mode,
        trace_id: context.traceId,
        total_calendars: 0,
        week_posts: [],
        message: "No content calendars found for this customer.",
      };
    }

    const detailsSpec: MarksterToolDescriptor = {
      name: "content_calendar_workspace_get",
      title: "Content Calendar Workspace (single)",
      description: "Fetch one calendar with nested content items by id.",
      category: "Content Calendar & Social Publishing",
      method: "GET",
      endpoint: "/api/content/calendars/{calendar_id}",
    };
    const started = Date.now();
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] start raw=${detailsSpec.name} tool=${
          context.tool
        } trace=${context.traceId} args=${stringifyInput({
          calendar_id: selectedCalendarId,
        })}`,
      );
    }
    const detailResult = await callMarksterTool(detailsSpec, {
      calendar_id: selectedCalendarId,
    });
    const detailsDurationMs = Date.now() - started;
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] done raw=${detailsSpec.name} tool=${context.tool} trace=${context.traceId} duration_ms=${detailsDurationMs}`,
      );
    }
    const detailPayload = unwrapToolPayload(detailResult);
    const detailRecord = isRecord(detailPayload) ? detailPayload : {};
    const calendarItems = asRecordArray(detailRecord.items);

    const weekRange = resolveWeekRange(weekStartInput, weekEndInput);
    const normalizedWeekPosts = calendarItems
      .map((item) => {
        const itemDate =
          toStringOrUndefined(item.date) ??
          toStringOrUndefined(item.scheduled_at) ??
          toStringOrUndefined(item.publish_date);
        const itemTs = parseTimestamp(itemDate);
        if (mode === "current_week") {
          if (itemTs === undefined) return null;
          if (itemTs < weekRange.startTs || itemTs > weekRange.endTs)
            return null;
        }
        const generatedPost = isRecord(item.generated_post)
          ? item.generated_post
          : null;
        const title =
          (generatedPost
            ? toStringOrUndefined(generatedPost.title) ??
              toStringOrUndefined(generatedPost.hook)
            : undefined) ??
          toStringOrUndefined(item.daily_topic) ??
          toStringOrUndefined(item.weekly_topic) ??
          "Untitled post";

        const imageUrl = generatedPost ? extractImageUrl(generatedPost) : null;
        return {
          item_id: toStringOrUndefined(item.id),
          post_id: generatedPost ? toStringOrUndefined(generatedPost.id) : null,
          title,
          date: itemDate,
          channel:
            toStringOrUndefined(item.platform) ??
            toStringOrUndefined(item.distribution_channel) ??
            "LinkedIn",
          theme:
            toStringOrUndefined(item.pillar) ??
            toStringOrUndefined(item.weekly_topic) ??
            "Deal Intelligence",
          status:
            (generatedPost
              ? toStringOrUndefined(generatedPost.status)
              : undefined) ?? toStringOrUndefined(item.status),
          image_url: imageUrl,
          hook: generatedPost ? toStringOrUndefined(generatedPost.hook) : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const aTs = parseTimestamp(toStringOrUndefined(a?.date)) ?? 0;
        const bTs = parseTimestamp(toStringOrUndefined(b?.date)) ?? 0;
        return aTs - bTs;
      });

    const selectedPosts =
      mode === "current_week"
        ? normalizedWeekPosts.slice(0, limit)
        : normalizedWeekPosts;

    return {
      workflow: "content_calendar_workspace",
      mode,
      trace_id: context.traceId,
      calendar: {
        id: selectedCalendarId,
        name:
          toStringOrUndefined(detailRecord.name) ??
          (selectedCalendar
            ? toStringOrUndefined(selectedCalendar.name)
            : undefined),
        status: toStringOrUndefined(detailRecord.status),
        date_start: toStringOrUndefined(detailRecord.date_start),
        date_end: toStringOrUndefined(detailRecord.date_end),
      },
      week: {
        start: weekRange.startIso,
        end: weekRange.endIso,
      },
      total_items: calendarItems.length,
      total_posts: selectedPosts.length,
      week_posts: selectedPosts,
      items: mode === "get_calendar" ? calendarItems : undefined,
    };
  } catch (error) {
    if (error instanceof MarksterRequestError && error.status === 403) {
      return {
        workflow: "content_calendar_workspace",
        status: "unavailable",
        available: false,
        reason: "content_scope_forbidden",
        message:
          "Content module is not enabled for this customer token. Ask an admin to grant /api/content permissions for this instance.",
      };
    }
    throw error;
  }
}

async function runCustomerImageAssets(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "upload";
  const assetId = toStringOrUndefined(args.asset_id);
  const assetUrl = toStringOrUndefined(args.asset_url);
  if (mode === "delete" && !assetId && !assetUrl) {
    throw new Error(
      "customer_image_assets.delete requires asset_id or asset_url.",
    );
  }
  return callRawTool("customer_image_assets", args, context);
}

async function runVoicePackWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "list";
  if (mode === "set_default" && !toStringOrUndefined(args.voice_pack_id)) {
    throw new Error("voice_pack_workspace.set_default requires voice_pack_id.");
  }
  return callRawTool("voice_pack_workspace", args, context);
}

async function runContentToolWith403Fallback(
  toolName:
    | "content_calendar_workspace"
    | "content_post_workspace"
    | "content_social_accounts",
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  try {
    return await callRawTool(toolName, args, context);
  } catch (error) {
    if (error instanceof MarksterRequestError && error.status === 403) {
      return {
        workflow: toolName,
        status: "unavailable",
        available: false,
        reason: "content_scope_forbidden",
        message:
          "Content module is not enabled for this customer token. Ask an admin to grant /api/content permissions for this instance.",
      };
    }
    throw error;
  }
}

async function runContactProfileWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "search";
  const contactId = toStringOrUndefined(args.contact_id);
  const name = toStringOrUndefined(args.name);
  const email = toStringOrUndefined(args.email);
  const title = toStringOrUndefined(args.title);
  const company = toStringOrUndefined(args.company);
  const source = toStringOrUndefined(args.source);
  const limit = toNumberOrUndefined(args.limit);
  const offset = toNumberOrUndefined(args.offset);
  const includeEnriched =
    typeof args.include_enriched === "boolean"
      ? args.include_enriched
      : undefined;
  const hasSearchFilter = Boolean(
    contactId || name || email || title || company,
  );

  const baseArgs: ToolCallArgs = {
    ...(contactId ? { contact_id: contactId } : {}),
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(title ? { title } : {}),
    ...(company ? { company } : {}),
    ...(source ? { source } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(offset !== undefined ? { offset } : {}),
    ...(includeEnriched === undefined
      ? {}
      : { include_enriched: includeEnriched }),
  };

  if (mode === "get") {
    if (!contactId) {
      throw new Error("contact_profile_workspace.get requires contact_id.");
    }

    const singleSpec: MarksterToolDescriptor = {
      name: "contact_profile_workspace_get",
      title: "Contact Profile Workspace (single)",
      description: "Get one contact profile by id.",
      category: "Customer Workspace & Onboarding",
      method: "GET",
      endpoint: "/api/app/contacts/{contact_id}/profile",
    };
    const requestArgs: ToolCallArgs = {
      contact_id: contactId,
      ...(source ? { source } : {}),
      include_enriched: includeEnriched ?? true,
    };

    const started = Date.now();
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] start raw=${singleSpec.name} tool=${context.tool} trace=${
          context.traceId
        } args=${stringifyInput(requestArgs)}`,
      );
    }
    const result = await callMarksterTool(singleSpec, requestArgs);
    const durationMs = Date.now() - started;
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] done raw=${singleSpec.name} tool=${context.tool} trace=${context.traceId} duration_ms=${durationMs}`,
      );
    }
    const contact = unwrapToolPayload(result);
    return {
      workflow: "contact_profile_workspace",
      mode: "get",
      trace_id: context.traceId,
      contact_id: contactId,
      include_enriched: includeEnriched ?? true,
      contact,
    };
  }

  if (mode === "search" && !hasSearchFilter) {
    throw new Error(
      "contact_profile_workspace.search requires a filter (name, email, title, company, or contact_id). Use mode=list for broad results.",
    );
  }

  const payload = await callRawTool(
    "contact_profile_workspace",
    baseArgs,
    context,
  );
  const payloadRecord = isRecord(payload) ? payload : null;
  let contacts = asRecordArray(payload);
  if (!contacts.length && payloadRecord) {
    contacts = asRecordArray(payloadRecord.contacts);
  }
  if (!contacts.length && payloadRecord) {
    contacts = asRecordArray(payloadRecord.results);
  }
  if (!contacts.length && payloadRecord) {
    contacts = asRecordArray(payloadRecord.items);
  }

  if (payloadRecord) {
    return {
      workflow: "contact_profile_workspace",
      mode,
      trace_id: context.traceId,
      include_enriched: includeEnriched ?? false,
      ...payloadRecord,
    };
  }

  return {
    workflow: "contact_profile_workspace",
    mode,
    trace_id: context.traceId,
    include_enriched: includeEnriched ?? false,
    total: contacts.length,
    results: contacts,
  };
}

async function runCompanyProfileWorkspace(
  args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const mode = toStringOrUndefined(args.mode) ?? "search";
  const companyId = toStringOrUndefined(args.company_id);
  const name = toStringOrUndefined(args.name);
  const domain = toStringOrUndefined(args.domain);
  const website = toStringOrUndefined(args.website);
  const industry = toStringOrUndefined(args.industry);
  const source = toStringOrUndefined(args.source);
  const limit = toNumberOrUndefined(args.limit);
  const offset = toNumberOrUndefined(args.offset);
  const includeRaw =
    typeof args.include_raw === "boolean" ? args.include_raw : undefined;
  const hasSearchFilter = Boolean(
    companyId || name || domain || website || industry,
  );

  const baseArgs: ToolCallArgs = {
    ...(companyId ? { company_id: companyId } : {}),
    ...(name ? { name } : {}),
    ...(domain ? { domain } : {}),
    ...(website ? { website } : {}),
    ...(industry ? { industry } : {}),
    ...(source ? { source } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(offset !== undefined ? { offset } : {}),
    ...(includeRaw === undefined ? {} : { include_raw: includeRaw }),
  };

  if (mode === "get") {
    if (!companyId) {
      throw new Error("company_profile_workspace.get requires company_id.");
    }

    const singleSpec: MarksterToolDescriptor = {
      name: "company_profile_workspace_get",
      title: "Company Profile Workspace (single)",
      description: "Get one company profile by id.",
      category: "Customer Workspace & Onboarding",
      method: "GET",
      endpoint: "/api/app/companies/{company_id}/profile",
    };
    const requestArgs: ToolCallArgs = {
      company_id: companyId,
      ...(source ? { source } : {}),
      ...(includeRaw === undefined ? {} : { include_raw: includeRaw }),
    };

    const started = Date.now();
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] start raw=${singleSpec.name} tool=${context.tool} trace=${
          context.traceId
        } args=${stringifyInput(requestArgs)}`,
      );
    }
    const result = await callMarksterTool(singleSpec, requestArgs);
    const durationMs = Date.now() - started;
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] done raw=${singleSpec.name} tool=${context.tool} trace=${context.traceId} duration_ms=${durationMs}`,
      );
    }
    const company = unwrapToolPayload(result);
    return {
      workflow: "company_profile_workspace",
      mode: "get",
      trace_id: context.traceId,
      company_id: companyId,
      ...(includeRaw === undefined ? {} : { include_raw: includeRaw }),
      company,
    };
  }

  if (mode === "search" && !hasSearchFilter) {
    throw new Error(
      "company_profile_workspace.search requires a filter (company_id, name, domain, website, or industry). Use mode=list for broad results.",
    );
  }

  const payload = await callRawTool(
    "company_profile_workspace",
    baseArgs,
    context,
  );
  const payloadRecord = isRecord(payload) ? payload : null;
  let companies = asRecordArray(payload);
  if (!companies.length && payloadRecord) {
    companies = asRecordArray(payloadRecord.companies);
  }
  if (!companies.length && payloadRecord) {
    companies = asRecordArray(payloadRecord.results);
  }
  if (!companies.length && payloadRecord) {
    companies = asRecordArray(payloadRecord.items);
  }

  if (payloadRecord) {
    return {
      workflow: "company_profile_workspace",
      mode,
      trace_id: context.traceId,
      ...(includeRaw === undefined ? {} : { include_raw: includeRaw }),
      ...payloadRecord,
    };
  }

  return {
    workflow: "company_profile_workspace",
    mode,
    trace_id: context.traceId,
    ...(includeRaw === undefined ? {} : { include_raw: includeRaw }),
    total: companies.length,
    results: companies,
  };
}

function toolDescriptionForModel(tool: MarksterToolDescriptor): string {
  const guide = MARKSTER_TOOL_USE_CASES[tool.name];
  if (!guide) {
    return `${tool.description} Endpoint: ${tool.method} ${tool.endpoint}.`;
  }
  return [
    tool.description,
    `Endpoint: ${tool.method} ${tool.endpoint}.`,
    `When to use: ${guide.whenToUse}`,
    `Avoid when: ${guide.avoid}`,
    `Example args JSON: ${guide.exampleArgs}`,
    `Expected output: ${guide.expectedOutput}`,
  ].join(" ");
}

function isActiveStatus(value: unknown): boolean {
  const status = toStringOrUndefined(value)?.toLowerCase();
  return status === "active" || status === "ready" || status === "healthy";
}

async function runColdMailHealth(
  _args: ToolCallArgs,
  context: ToolCallContext,
): Promise<unknown> {
  const domainsSpec: MarksterToolDescriptor = {
    name: "cold_mail_health_domains",
    title: "Cold Mail Health Domains",
    description: "Fetch domain inventory from app scope.",
    category: "Domains, Mailboxes & File Assets",
    method: "GET",
    endpoint: "/api/app/domains",
  };
  const mailboxesSpec: MarksterToolDescriptor = {
    name: "cold_mail_health_mailboxes",
    title: "Cold Mail Health Mailboxes",
    description: "Fetch mailbox inventory from app scope.",
    category: "Domains, Mailboxes & File Assets",
    method: "GET",
    endpoint: "/api/app/mailboxes",
  };

  const callCustomRawTool = async (
    spec: MarksterToolDescriptor,
  ): Promise<unknown> => {
    const started = Date.now();
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] start raw=${spec.name} tool=${context.tool} trace=${context.traceId} args={}`,
      );
    }
    const result = await callMarksterTool(spec, {});
    const durationMs = Date.now() - started;
    if (shouldLogToolCalls()) {
      console.info(
        `[mcp-server] done raw=${spec.name} tool=${context.tool} trace=${context.traceId} duration_ms=${durationMs}`,
      );
    }
    return unwrapToolPayload(result);
  };

  const domainsPayload = await callCustomRawTool(domainsSpec);
  const mailboxesPayload = await callCustomRawTool(mailboxesSpec);

  let domains = asRecordArray(domainsPayload);
  if (!domains.length && isRecord(domainsPayload)) {
    domains = asRecordArray(domainsPayload.domains);
  }

  let mailboxes = asRecordArray(mailboxesPayload);
  if (!mailboxes.length && isRecord(mailboxesPayload)) {
    mailboxes = asRecordArray(mailboxesPayload.mailboxes);
  }

  const totalDomains = domains.length;
  const totalMailboxes = mailboxes.length;
  const activeDomains = domains.filter((domain) =>
    isActiveStatus(domain.status),
  ).length;
  const activeMailboxes = mailboxes.filter((mailbox) =>
    isActiveStatus(mailbox.status),
  ).length;

  const domainsWithIssues = domains
    .map((domain) => {
      const reasons: string[] = [];
      const status = toStringOrUndefined(domain.status) ?? "unknown";
      const healthScore = toNumberOrUndefined(domain.health_score);
      const bounceRate = toNumberOrUndefined(domain.bounce_rate);

      if (!isActiveStatus(status)) {
        reasons.push(`status:${status}`);
      }
      if (healthScore !== undefined && healthScore < 70) {
        reasons.push(`health_score:${healthScore}`);
      }
      if (bounceRate !== undefined && bounceRate > 5) {
        reasons.push(`bounce_rate:${bounceRate}`);
      }

      if (!reasons.length) return null;
      return {
        domain:
          toStringOrUndefined(domain.domain_name) ??
          toStringOrUndefined(domain.domain) ??
          "unknown-domain",
        reasons,
      };
    })
    .filter(
      (item): item is { domain: string; reasons: string[] } => item !== null,
    );

  const mailboxesWithIssues = mailboxes
    .map((mailbox) => {
      const reasons: string[] = [];
      const status = toStringOrUndefined(mailbox.status) ?? "unknown";
      const healthScore = toNumberOrUndefined(mailbox.health_score);
      const bounceRate = toNumberOrUndefined(mailbox.bounce_rate);

      if (!isActiveStatus(status)) {
        reasons.push(`status:${status}`);
      }
      if (healthScore !== undefined && healthScore < 70) {
        reasons.push(`health_score:${healthScore}`);
      }
      if (bounceRate !== undefined && bounceRate > 5) {
        reasons.push(`bounce_rate:${bounceRate}`);
      }

      if (!reasons.length) return null;
      return {
        email:
          toStringOrUndefined(mailbox.email_address) ??
          toStringOrUndefined(mailbox.email) ??
          "unknown-mailbox",
        reasons,
      };
    })
    .filter(
      (item): item is { email: string; reasons: string[] } => item !== null,
    );

  const lastHealthCandidates = [
    ...domains.map((domain) => toStringOrUndefined(domain.last_health_check)),
    ...mailboxes.map((mailbox) =>
      toStringOrUndefined(mailbox.last_health_check),
    ),
  ].filter((value): value is string => Boolean(value));

  const domainCompletionPct =
    totalDomains === 0 ? 0 : Math.round((activeDomains / totalDomains) * 100);
  const mailboxCompletionPct =
    totalMailboxes === 0
      ? 0
      : Math.round((activeMailboxes / totalMailboxes) * 100);
  const setupCompletionPercentage =
    totalDomains === 0 && totalMailboxes === 0
      ? 0
      : Math.round((domainCompletionPct + mailboxCompletionPct) / 2);

  const customerId =
    toNumberOrUndefined(domains[0]?.customer_id) ??
    toNumberOrUndefined(mailboxes[0]?.customer_id) ??
    null;

  return {
    workflow: "cold_mail_health",
    trace_id: context.traceId,
    source: "api_app_domains_mailboxes",
    customer_id: customerId,
    total_domains: totalDomains,
    active_domains: activeDomains,
    total_mailboxes: totalMailboxes,
    active_mailboxes: activeMailboxes,
    setup_completion_percentage: setupCompletionPercentage,
    domains_with_issues: domainsWithIssues,
    mailboxes_with_issues: mailboxesWithIssues,
    last_health_check: lastHealthCandidates.sort().at(-1) ?? null,
    domain_inventory: domains.map((domain) => ({
      id: toNumberOrUndefined(domain.id) ?? null,
      domain_name:
        toStringOrUndefined(domain.domain_name) ??
        toStringOrUndefined(domain.domain) ??
        "unknown-domain",
      status: toStringOrUndefined(domain.status) ?? "unknown",
      health_score: toNumberOrUndefined(domain.health_score) ?? null,
      last_health_check: toStringOrUndefined(domain.last_health_check) ?? null,
    })),
    mailbox_inventory: mailboxes.map((mailbox) => ({
      id: toNumberOrUndefined(mailbox.id) ?? null,
      email:
        toStringOrUndefined(mailbox.email_address) ??
        toStringOrUndefined(mailbox.email) ??
        "unknown-mailbox",
      status: toStringOrUndefined(mailbox.status) ?? "unknown",
      health_score: toNumberOrUndefined(mailbox.health_score) ?? null,
      last_health_check: toStringOrUndefined(mailbox.last_health_check) ?? null,
    })),
  };
}

const TOOL_EXECUTORS: Record<
  string,
  (args: ToolCallArgs, context: ToolCallContext) => Promise<unknown>
> = {
  sales_intelligence: runSalesIntelligence,
  runtime_mode_switch: runRuntimeModeSwitch,
  customer_workspace_snapshot: (args, context) =>
    callRawTool("customer_workspace_snapshot", args, context),
  customer_profile_manage: runCustomerProfileManage,
  contact_profile_workspace: runContactProfileWorkspace,
  company_profile_workspace: runCompanyProfileWorkspace,
  onboarding_flow_manage: runOnboardingFlowManage,
  onboarding_ai_assist: runOnboardingAiAssist,
  dashboard_insights: runDashboardInsights,
  pipeline_workspace: runPipelineWorkspace,
  task_workspace: (args, context) =>
    callRawTool("task_workspace", args, context),
  task_action: (args, context) => callRawTool("task_action", args, context),
  task_content_regenerate: (args, context) =>
    callRawTool("task_content_regenerate", args, context),
  ai_team_workspace: runAiTeamWorkspace,
  ai_team_chat_turn: (args, context) =>
    callRawTool("ai_team_chat_turn", args, context),
  customer_artifact_workspace: (args, context) =>
    callRawTool("customer_artifact_workspace", args, context),
  customer_document_workspace: (args, context) =>
    callRawTool("customer_document_workspace", args, context),
  customer_data_change_review: (args, context) =>
    callRawTool("customer_data_change_review", args, context),
  content_calendar_workspace: runContentCalendarWorkspace,
  content_post_workspace: runContentPostWorkspace,
  content_audio_library: (args, context) =>
    callRawTool("content_audio_library", args, context),
  content_social_accounts: (args, context) =>
    runContentToolWith403Fallback("content_social_accounts", args, context),
  outreach_brand_assets_workspace: (args, context) =>
    callRawTool("outreach_brand_assets_workspace", args, context),
  outreach_icp_workspace: (args, context) =>
    callRawTool("outreach_icp_workspace", args, context),
  outreach_sequence_workspace: (args, context) =>
    callRawTool("outreach_sequence_workspace", args, context),
  outreach_enrollment: (args, context) =>
    callRawTool("outreach_enrollment", args, context),
  domain_mailbox_manage: (args, context) =>
    callRawTool("domain_mailbox_manage", args, context),
  cold_mail_health: runColdMailHealth,
  customer_image_assets: runCustomerImageAssets,
  voice_pack_workspace: runVoicePackWorkspace,
};

function executeTool(name: string, args: ToolCallArgs): Promise<unknown> {
  const context: ToolCallContext = {
    tool: name,
    traceId: makeTraceId(name),
  };
  const handler = TOOL_EXECUTORS[name];
  if (!handler) {
    throw new Error(`No tool handler for '${name}'.`);
  }
  return handler(args, context);
}

function logError(error: unknown): string {
  if (error instanceof MarksterRequestError) {
    return `${error.message} (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function registerMarksterTools(
  server: McpServer,
  uiResourceUri: string,
): void {
  for (const tool of MARKSTER_TOOL_CATALOG) {
    const schema = inputSchemaForTool(tool.name);
    const includeUi = isUiEnabledTool(tool.name);
    type ToolCallbackResult = {
      content: Array<{ type: "text"; text: string }>;
      structuredContent?: unknown;
    };
    const registerToolWithConfig = (
      cb: (args: unknown) => Promise<ToolCallbackResult>,
    ): void => {
      if (includeUi) {
        registerAppTool(
          server,
          tool.name,
          {
            title: tool.title,
            description: toolDescriptionForModel(tool),
            inputSchema: schema,
            _meta: {
              ui: { resourceUri: uiResourceUri },
              [TOOL_META_FALLBACK_KEY]: uiResourceUri,
            },
          },
          cb as Parameters<typeof registerAppTool>[3],
        );
        return;
      }

      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: toolDescriptionForModel(tool),
          inputSchema: schema,
        },
        cb as Parameters<typeof server.registerTool>[2],
      );
    };

    registerToolWithConfig(async (args) => {
      const parsedArgs = schema.parse(args);
      const startedAt = Date.now();
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] start tool=${tool.name} args=${stringifyInput(
            parsedArgs,
          )}`,
        );
      }
      try {
        const result = await executeTool(tool.name, parsedArgs);
        const basePayload = includeUi
          ? withUiToolContext(tool.name, result)
          : result;
        const constrained = includeUi
          ? enforceUiPayloadLimit(basePayload)
          : { payload: basePayload, truncated: false };
        const responsePayload =
          constrained.truncated && isRecord(constrained.payload)
            ? {
                ...constrained.payload,
                _mcp_meta: {
                  ...(isRecord(constrained.payload._mcp_meta)
                    ? constrained.payload._mcp_meta
                    : {}),
                  size_truncated: true,
                },
              }
            : constrained.payload;
        const elapsedMs = Date.now() - startedAt;
        if (shouldLogToolCalls()) {
          console.info(
            `[mcp-server] done tool=${tool.name} duration_ms=${elapsedMs}`,
          );
        }
        return {
          structuredContent: responsePayload,
          content: [
            {
              type: "text",
              text: buildToolContentText(responsePayload),
            },
          ],
        };
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        console.error(
          `[mcp-server] failed tool=${
            tool.name
          } duration_ms=${elapsedMs} error=${logError(error)}`,
        );
        throw error;
      }
    });
  }
}
