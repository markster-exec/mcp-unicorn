import {
  MarksterToolDescriptor,
  MarksterToolHttpMethod,
} from "../shared/marksterToolManifest";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { MARKSTER_TOOL_RESPONSE_SCHEMAS } from "./generated-openapi-schemas";

export type MarksterRuntimeMode = "live_with_fallback" | "live_strict" | "mock";

export type MarksterApiContext = {
  baseUrl: string;
  headers: Record<string, string>;
};

export class MarksterRequestError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "MarksterRequestError";
    this.status = status;
    this.body = body;
  }
}

type MarksterToolCallInput = Record<string, unknown>;

type MockEnvelope = {
  source: "mock";
  tool: string;
  method: MarksterToolHttpMethod;
  endpoint: string;
  path: string;
  generated_at: string;
};

const DEFAULT_BASE_URL = "https://panel.markster.io";
const MOCK_INLINE_HEADSHOT_DIR = path.join(
  process.cwd(),
  "data/generated-headshots/inline-96",
);
const MOCK_HEADSHOT_BASE_URL = (() => {
  const configuredHost =
    process.env.MARKSTER_PUBLIC_BASE_URL ?? process.env.MCP_PUBLIC_BASE_URL;
  if (configuredHost?.trim()) {
    return `${configuredHost.replace(/\/$/, "")}/assets/headshots`;
  }
  // Default to deployed production asset host.
  return "https://dealpulse-prod.hackathon.markster.io/assets/headshots";
})();
const MOCK_INLINE_HEADSHOT_DATA_URL_CACHE = new Map<string, string>();
const MOCK_PERSON_ID_BY_EMAIL: Record<string, string> = {
  "dario@anthropic.com": "p1",
  "sarah.chen@anthropic.com": "p2",
  "marcus.j@anthropic.com": "p3",
  "sam@openai.com": "p4",
  "mina@openai.com": "p5",
  "claire@stripe.com": "p6",
  "diana@stripe.com": "p7",
  "ivan@notion.so": "p8",
  "daniel@ramp.com": "p9",
  "nina@ramp.com": "p10",
  "emily.hart@mercury.com": "p11",
  "sasha@figma.com": "p12",
  "reema@figma.com": "p13",
  "maya@clay.com": "p14",
  "pietro@manufact.com": "p15",
  "luigi@manufact.com": "p16",
};
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
});
addFormats(ajv, ["date-time", "uuid", "email"]);
const TOOL_LOGGING_FLAG_KEYS = [
  "MARKSTER_TOOL_CALL_LOGGING",
  "MARKSTER_TOOL_LOGGING",
];
const DEFAULT_LIVE_TIMEOUT_MS = 12_000;
const DISABLED_TOOL_NAMES = new Set(["ai_team_memory_manage"]);
const MARKSTER_TOKEN_ENV_KEYS = [
  "MARKSTER_CUSTOMER_API_KEY",
  "MARKSTER_CUSTOMER_TOKEN",
  "MARKSTER_CUSTOMER_API_TOKEN",
  "MARKSTER_API_TOKEN",
  "MARKSTER_API_KEY",
  "MARKSTER_TOKEN",
];
let runtimeModeOverride: MarksterRuntimeMode | null = null;

function getTrimmedEnvValue(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function nextRequestId(toolName: string): string {
  return `${toolName}-${Date.now()}-${randomSuffix(String(Math.random()))}`;
}

const RESPONSE_VALIDATORS = new Map<string, ValidateFunction>();
const fallbackSchema = ajv.compile({
  anyOf: [{ type: "object" }, { type: "array" }],
});

function getToolResponseValidator(toolName: string): ValidateFunction {
  const existingValidator = RESPONSE_VALIDATORS.get(toolName);
  if (existingValidator) {
    return existingValidator;
  }

  const schema = (MARKSTER_TOOL_RESPONSE_SCHEMAS as Record<string, unknown>)[
    toolName
  ];
  const validate = schema
    ? ajv.compile(schema as Parameters<typeof ajv.compile>[0])
    : fallbackSchema;
  RESPONSE_VALIDATORS.set(toolName, validate);
  return validate;
}

function validateMarksterPayload(toolName: string, payload: unknown): unknown {
  const validate = getToolResponseValidator(toolName);
  const valid = validate(payload);

  if (!valid) {
    throw new MarksterRequestError(
      `Markster response did not match schema for tool '${toolName}'.`,
      502,
      {
        tool: toolName,
        issues: validate.errors,
        sample: payload,
      },
    );
  }

  return payload;
}

function validateMockPayloadBestEffort(
  toolName: string,
  payload: unknown,
): unknown {
  try {
    return validateMarksterPayload(toolName, payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logToolEvent(
      "error",
      `mock_schema_mismatch name=${toolName} reason=${reason} (continuing with mock payload)`,
    );
    return payload;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): MarksterToolCallInput {
  return isObject(value) ? { ...value } : {};
}

function boolFromEnv(value?: string): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on", "enabled"].includes(value.toLowerCase());
}

function parseRuntimeMode(value?: string): MarksterRuntimeMode | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "live_with_fallback" ||
    normalized === "live-fallback" ||
    normalized === "live"
  ) {
    return "live_with_fallback";
  }
  if (
    normalized === "live_strict" ||
    normalized === "live-strict" ||
    normalized === "strict"
  ) {
    return "live_strict";
  }
  if (normalized === "mock" || normalized === "demo") {
    return "mock";
  }
  return undefined;
}

function resolveRuntimeModeFromEnv(): MarksterRuntimeMode {
  const explicitRuntime = parseRuntimeMode(
    getTrimmedEnvValue("MARKSTER_RUNTIME_MODE"),
  );
  if (explicitRuntime) {
    return explicitRuntime;
  }

  if (boolFromEnv(process.env.MARKSTER_MOCK_MODE)) {
    return "mock";
  }

  return "mock";
}

export function getMarksterRuntimeMode(): MarksterRuntimeMode {
  return runtimeModeOverride ?? resolveRuntimeModeFromEnv();
}

export function setMarksterRuntimeMode(
  mode: MarksterRuntimeMode,
): MarksterRuntimeMode {
  runtimeModeOverride = mode;
  return getMarksterRuntimeMode();
}

export function clearMarksterRuntimeModeOverride(): void {
  runtimeModeOverride = null;
}

export function shouldLogToolCalls(): boolean {
  for (const key of TOOL_LOGGING_FLAG_KEYS) {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return boolFromEnv(envValue);
    }
  }

  return true;
}

function logToolEvent(level: "debug" | "error", message: string): void {
  if (!shouldLogToolCalls()) return;
  if (level === "error") {
    console.error(`[markster:tool] ${message}`);
    return;
  }
  console.info(`[markster:tool] ${message}`);
}

function nowISO(): string {
  return new Date().toISOString();
}

function randomSuffix(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000000007;
  }
  return String(hash).padStart(6, "0");
}

function normalizeEmailKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mockHeadshotUrlForPersonId(
  personId: string | undefined,
): string | undefined {
  if (!personId) return undefined;
  const normalized = personId.trim().toLowerCase();
  if (!/^p\d+$/.test(normalized)) return undefined;
  const cachedDataUrl = MOCK_INLINE_HEADSHOT_DATA_URL_CACHE.get(normalized);
  if (cachedDataUrl) {
    return cachedDataUrl;
  }
  const inlinePath = path.join(MOCK_INLINE_HEADSHOT_DIR, `${normalized}.jpg`);
  try {
    const buffer = fs.readFileSync(inlinePath);
    if (buffer.length > 0) {
      const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      MOCK_INLINE_HEADSHOT_DATA_URL_CACHE.set(normalized, dataUrl);
      return dataUrl;
    }
  } catch {
    // Fall through to URL path fallback for environments without inline assets.
  }
  return `${MOCK_HEADSHOT_BASE_URL}/${normalized}.png`;
}

function resolveMockPersonIdForEmail(
  email: string | undefined,
): string | undefined {
  const normalizedEmail = normalizeEmailKey(email);
  if (!normalizedEmail) return undefined;
  return MOCK_PERSON_ID_BY_EMAIL[normalizedEmail];
}

function getMarksterTokenFromEnv(): string | undefined {
  for (const key of MARKSTER_TOKEN_ENV_KEYS) {
    const value = getTrimmedEnvValue(key);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function hasAnyMarksterEnvValue(): boolean {
  return MARKSTER_TOKEN_ENV_KEYS.some(
    (key) => getTrimmedEnvValue(key) !== undefined,
  );
}

function tokenEnvPresenceSummary(): string {
  return MARKSTER_TOKEN_ENV_KEYS.map((key) => {
    const value = getTrimmedEnvValue(key);
    return `${key}=${value ? "set" : "unset"}`;
  }).join(", ");
}

export function createMarksterContext(): MarksterApiContext {
  const baseUrl =
    process.env.MARKSTER_API_BASE_URL ??
    process.env.MARKSTER_PANEL_URL ??
    process.env.MARKSTER_API_URL ??
    DEFAULT_BASE_URL;

  const token = getMarksterTokenFromEnv();

  if (!token) {
    throw new Error(
      "Missing Markster customer API token. Set MARKSTER_CUSTOMER_API_KEY (preferred, or MARKSTER_API_TOKEN fallback) and keep MARKSTER_MOCK_MODE=false/unset.",
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "markster-business-os/0.2.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-API-Key"] = token;
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), headers };
}

export function shouldUseMockMode(): boolean {
  const runtimeMode = getMarksterRuntimeMode();
  if (runtimeMode === "mock") {
    return true;
  }

  if (!getMarksterTokenFromEnv()) {
    if (hasAnyMarksterEnvValue()) {
      console.warn(
        `[markster] No usable Markster token found. Checked env: ${tokenEnvPresenceSummary()}`,
      );
    } else {
      console.warn(
        "[markster] No Markster API token env vars set; falling back to MOCK mode.",
      );
    }
    return true;
  }

  return false;
}

type InterpolationResult = {
  path: string;
  missing: string[];
  remainingArgs: MarksterToolCallInput;
};

function interpolateEndpoint(
  endpoint: string,
  args: MarksterToolCallInput,
): InterpolationResult {
  const missing: string[] = [];
  const remaining = { ...args };

  const path = endpoint.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_match, key) => {
    const value = remaining[key];
    if (value === undefined || value === null) {
      missing.push(key);
      return `:${key}`;
    }

    delete remaining[key];
    return encodeURIComponent(String(value));
  });

  return { path, missing, remainingArgs: remaining };
}

export async function callMarksterTool(
  spec: MarksterToolDescriptor,
  args: unknown,
): Promise<unknown> {
  if (DISABLED_TOOL_NAMES.has(spec.name)) {
    throw new Error(`Tool '${spec.name}' is disabled for this MCP demo.`);
  }

  const requestArgs: MarksterToolCallInput = asRecord(args);
  const interpolation = interpolateEndpoint(spec.endpoint, requestArgs);
  const requestId = nextRequestId(spec.name);

  if (interpolation.missing.length > 0) {
    logToolEvent(
      "error",
      `request=${requestId} missing path params for ${
        spec.name
      }: ${interpolation.missing.join(", ")}`,
    );
    throw new Error(
      `Missing required path parameter(s): ${interpolation.missing.join(
        ", ",
      )} for ${spec.name}.`,
    );
  }

  const cleanedArgs = interpolation.remainingArgs;
  const query = Object.keys(cleanedArgs).length
    ? JSON.stringify(cleanedArgs)
    : "{}";
  const startedAt = Date.now();

  logToolEvent(
    "debug",
    `request=${requestId} start name=${spec.name} method=${spec.method} path=${interpolation.path} query=${query}`,
  );

  const runtimeMode = getMarksterRuntimeMode();
  const fallbackEnabled = runtimeMode === "live_with_fallback";
  const mockOnlyMode = runtimeMode === "mock";

  if (mockOnlyMode) {
    const mockPayload = buildMockPayload(spec, interpolation.path, cleanedArgs);
    const validatedPayload = validateMockPayloadBestEffort(
      spec.name,
      mockPayload.payload,
    );
    const elapsedMs = Date.now() - startedAt;
    logToolEvent(
      "debug",
      `request=${requestId} done name=${spec.name} status=mock_ok duration_ms=${elapsedMs}`,
    );
    return {
      status: 200,
      ok: true,
      runtime_mode: runtimeMode,
      ...mockPayload,
      payload: validatedPayload,
    };
  }

  try {
    const context = createMarksterContext();
    const [path, queryString] = splitPathAndQuery(interpolation.path);
    const { explicitQuery, requestBody } = extractBodyAndQuery(cleanedArgs);
    const requestPath = buildRequestUrl(
      path,
      queryString,
      explicitQuery,
      cleanedArgs,
      context.baseUrl,
      spec.method,
    );
    const requestInit = buildRequestInit(
      spec.method,
      context.headers,
      requestBody,
      cleanedArgs,
    );

    const timeoutMs = resolveLiveTimeoutMs();
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, timeoutMs);

    let response: Response;
    try {
      response = await fetch(requestPath, {
        ...requestInit,
        signal: abortController.signal,
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        throw new Error(
          `Markster live request timed out after ${timeoutMs}ms for ${spec.name}.`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }

    const elapsedMs = Date.now() - startedAt;
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      logToolEvent(
        "error",
        `request=${requestId} failed name=${spec.name} status=${response.status} endpoint=${requestPath}`,
      );
      throw new MarksterRequestError(
        `Markster API call failed: ${spec.name}`,
        response.status,
        payload,
      );
    }
    const validatedPayload = validateMarksterPayload(spec.name, payload);
    logToolEvent(
      "debug",
      `request=${requestId} done name=${spec.name} status=${response.status} duration_ms=${elapsedMs}`,
    );

    return {
      status: response.status,
      ok: true,
      tool: spec.name,
      method: spec.method,
      endpoint: spec.endpoint,
      runtime_mode: runtimeMode,
      payload: validatedPayload,
    };
  } catch (error) {
    if (!fallbackEnabled || !shouldFallbackToMock(error)) {
      throw error;
    }

    const fallbackMeta = formatFallbackMeta(error);
    logToolEvent(
      "error",
      `request=${requestId} fallback_to_mock name=${spec.name} reason=${fallbackMeta.message}`,
    );
    const mockPayload = buildMockPayload(spec, interpolation.path, cleanedArgs);
    const validatedPayload = validateMockPayloadBestEffort(
      spec.name,
      mockPayload.payload,
    );
    const elapsedMs = Date.now() - startedAt;
    logToolEvent(
      "debug",
      `request=${requestId} done name=${spec.name} status=mock_fallback duration_ms=${elapsedMs}`,
    );
    return {
      status: 200,
      ok: true,
      runtime_mode: runtimeMode,
      fallback: {
        active: true,
        reason: fallbackMeta.message,
        error_type: fallbackMeta.type,
        ...(fallbackMeta.status !== undefined
          ? { status: fallbackMeta.status }
          : {}),
      },
      ...mockPayload,
      payload: validatedPayload,
    };
  }
}

function resolveLiveTimeoutMs(): number {
  const fromEnv = Number.parseInt(
    process.env.MARKSTER_API_TIMEOUT_MS ?? "",
    10,
  );
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  return DEFAULT_LIVE_TIMEOUT_MS;
}

function shouldFallbackToMock(error: unknown): boolean {
  if (error instanceof MarksterRequestError) {
    return (
      error.status === 401 ||
      error.status === 403 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500
    );
  }
  return true;
}

function formatFallbackMeta(error: unknown): {
  type: string;
  message: string;
  status?: number;
} {
  if (error instanceof MarksterRequestError) {
    return {
      type: "markster_request_error",
      message: `${error.message} (${error.status})`,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    return {
      type: "error",
      message: error.message,
    };
  }
  return {
    type: "unknown",
    message: String(error),
  };
}

function extractBodyAndQuery(args: MarksterToolCallInput): {
  explicitQuery?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
} {
  const body = isObject(args.body) ? args.body : undefined;
  const query = isObject(args.query) ? args.query : undefined;
  return { explicitQuery: query, requestBody: body };
}

function splitPathAndQuery(pathWithQuery: string): [string, URLSearchParams] {
  const [pathPart, queryPart] = pathWithQuery.split("?", 2);
  const query = new URLSearchParams(queryPart);
  return [pathPart, query];
}

function buildRequestUrl(
  basePath: string,
  existingQuery: URLSearchParams,
  explicitQuery: Record<string, unknown> | undefined,
  requestArgs: MarksterToolCallInput,
  baseUrl: string,
  method: MarksterToolHttpMethod,
): string {
  if (method !== "GET") {
    return contextualUrl(basePath, existingQuery, baseUrl);
  }

  const additionalQuery = new URLSearchParams(existingQuery);
  addRequestArgsToQuery(additionalQuery, requestArgs);
  addObjectToQuery(additionalQuery, explicitQuery);

  return contextualUrl(basePath, additionalQuery, baseUrl);
}

function addRequestArgsToQuery(
  query: URLSearchParams,
  requestArgs: MarksterToolCallInput,
): void {
  Object.entries(requestArgs).forEach(([key, value]) => {
    if (key === "body" || key === "query") {
      return;
    }
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null)
          query.append(key, String(item));
      });
      return;
    }
    if (isObject(value)) {
      return;
    }
    query.set(key, String(value));
  });
}

function addObjectToQuery(
  query: URLSearchParams,
  objectValue?: Record<string, unknown>,
): void {
  if (!isObject(objectValue)) return;
  Object.entries(objectValue).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value) || isObject(value)) return;
    query.set(key, String(value));
  });
}

function buildRequestInit(
  method: MarksterToolHttpMethod,
  headers: Record<string, string>,
  requestBody: Record<string, unknown> | undefined,
  requestArgs: MarksterToolCallInput,
): RequestInit {
  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (method === "GET" || method === "DELETE") {
    return requestInit;
  }

  let bodyPayload: Record<string, unknown> | undefined = requestBody;
  if (bodyPayload === undefined) {
    const inlineBody = { ...requestArgs };
    delete inlineBody.body;
    delete inlineBody.query;
    bodyPayload = Object.keys(inlineBody).length > 0 ? inlineBody : undefined;
  }

  if (bodyPayload !== undefined) {
    requestInit.body = JSON.stringify(bodyPayload);
  }

  return requestInit;
}

function contextualUrl(
  path: string,
  query: URLSearchParams,
  baseUrl: string,
): string {
  const hasQuery = query.toString();
  return `${baseUrl}${path}${hasQuery ? `?${hasQuery}` : ""}`;
}

function buildMockPayload(
  spec: MarksterToolDescriptor,
  path: string,
  args: MarksterToolCallInput,
): MockEnvelope & { payload: unknown; tool: string } {
  const seed = `${spec.name}:${path}:${JSON.stringify(args)}`;
  const generatedAt = nowISO();
  const base = {
    source: "mock" as const,
    tool: spec.name,
    method: spec.method,
    endpoint: spec.endpoint,
    path,
    generated_at: generatedAt,
  };

  const requestId = `mock-${randomSuffix(seed)}`;
  const sampleTaskId = String(args.task_id ?? "task-101");
  const sampleConversationId = String(args.conversation_id ?? "conv-88");
  const sampleCalendarId = String(args.calendar_id ?? "calendar-77");
  const sampleItemId = String(args.item_id ?? "post-33");
  const sampleSequenceId = String(args.sequence_id ?? "seq-09");
  const sampleLeadIds = Array.isArray(args.lead_ids)
    ? args.lead_ids.filter((item): item is string => typeof item === "string")
    : ["lead-1", "lead-2"];

  switch (spec.name) {
    case "customer_workspace_snapshot": {
      return {
        ...base,
        payload: {
          plan_tier: "growth",
          calendar_link: "https://cal.com/markster/demo",
          mode: "live",
          custom_fields: {
            operating_model: "ai_native",
            product: "markster_business_os",
          },
          whatsapp_morning_brief_enabled: true,
          id: 13,
          company_id: 101,
          onboarding_state: {
            current_step: 7,
            total_steps: 7,
            completion_pct: 100,
          },
          onboarding_completed: 1,
          preferred_language: "en",
          whatsapp_morning_brief_last_sent_at: generatedAt,
          created_at: "2025-09-01T09:00:00Z",
          updated_at: generatedAt,
          company: {
            name: "Markster",
            website: "https://markster.ai",
            business_type: "professional_services",
            industry: "Revenue operations",
            google_folder_id: null,
            replyio_workspace_id: null,
            usp: "AI-native GTM operating system",
            icp: "Founder-led B2B service companies",
            business_goals: "pipeline growth, predictable meetings",
            industry_trends_email: null,
            id: 101,
            created_at: "2025-09-01T09:00:00Z",
            updated_at: generatedAt,
            onboarding_profile: {
              timezone: "America/Los_Angeles",
              channels: ["email", "linkedin"],
            },
            primary_offer: "Growth",
            target_role: "Founder / VP Revenue",
            buyer_geo: "US",
            availability_days: "Mon-Fri",
            availability_hours_start: "09:00",
            availability_hours_end: "17:00",
            meeting_duration_min: 30,
            meeting_modes: "remote",
            office_address: null,
            on_site_radius_km: null,
            on_site_fee_note: null,
            weekly_bookings_goal: 12,
            avg_deal_value: 50000,
            allowed_channels: "email,linkedin",
            timezone: "America/Los_Angeles",
          },
          contacts: [
            {
              first_name: "Ivan",
              last_name: "Ivanka",
              email: "ivan@markster.ai",
              phone: "+1-415-555-0101",
              position: "Founder",
              is_primary: 1,
              id: 501,
              company_id: 101,
              created_at: "2025-09-01T09:00:00Z",
              updated_at: generatedAt,
            },
          ],
          profile: {
            id: "cust_mrkstr",
            company: "Markster",
            plan: "Growth",
            owner: "Ivan Ivanka",
          },
          notifications: [
            {
              id: "n-1",
              type: "outreach",
              title:
                "Figma: Reema Batta visited pricing 6x — intent 87, ready to buy",
              status: "success",
            },
            {
              id: "n-2",
              type: "outreach",
              title: "Anthropic: Sarah Chen submitted demo request",
              status: "success",
            },
            {
              id: "n-3",
              type: "task",
              title: "Kontext Group quarterly review due tomorrow",
              status: "info",
            },
          ],
          onboarding: {
            current_step: 7,
            total_steps: 7,
            completion_pct: 100,
            started_at: "2026-01-15T08:00:00Z",
          },
          tasks: {
            open_count: 8,
            completed_count: 23,
            blocked_count: 1,
            overdue_count: 0,
          },
          cold_mail_setup: {
            status: "ready",
            domain_health: "good",
            warmup_day: 21,
            warmup_target_days: 21,
          },
          dashboard: {
            kpis: [
              { key: "mrr", value: "$15,628", trend: "+18.3% MoM" },
              { key: "pipeline", value: "$1.25M", trend: "+42% MoM" },
              {
                key: "total_revenue",
                value: "$211,534",
                trend: "+$24K one-off",
              },
              { key: "gross_margin", value: "82%", trend: "+4.2pp" },
              {
                key: "meetings_booked",
                value: "8 this month",
                trend: "+33% MoM",
              },
              { key: "win_rate", value: "34%", trend: "+6pp QoQ" },
            ],
          },
          requestId,
        },
      };
    }

    case "customer_profile_manage": {
      const update: Record<string, unknown> | undefined = isObject(args.updates)
        ? args.updates
        : isObject(args.profile)
          ? args.profile
          : undefined;
      const action =
        typeof args.action === "string"
          ? args.action
          : typeof args.mode === "string"
            ? args.mode
            : "read";
      return {
        ...base,
        payload: {
          plan_tier: "growth",
          calendar_link: "https://cal.com/markster/demo",
          mode: "live",
          custom_fields: {
            operating_model: "ai_native",
          },
          whatsapp_morning_brief_enabled: true,
          id: 13,
          company_id: 101,
          onboarding_state: {
            current_step: 7,
            total_steps: 7,
            completion_pct: 100,
          },
          onboarding_completed: 1,
          preferred_language: "en",
          whatsapp_morning_brief_last_sent_at: generatedAt,
          created_at: "2025-09-01T09:00:00Z",
          updated_at: generatedAt,
          company: {
            name: "Markster",
            website: "https://markster.ai",
            business_type: "professional_services",
            industry: "Revenue operations",
            google_folder_id: null,
            replyio_workspace_id: null,
            usp: "AI-native GTM operating system",
            icp: "Founder-led B2B service companies",
            business_goals: "pipeline growth, predictable meetings",
            industry_trends_email: null,
            id: 101,
            created_at: "2025-09-01T09:00:00Z",
            updated_at: generatedAt,
            onboarding_profile: {
              timezone: "America/Los_Angeles",
              channels: ["email", "linkedin"],
            },
            primary_offer: "Growth",
            target_role: "Founder / VP Revenue",
            buyer_geo: "US",
            availability_days: "Mon-Fri",
            availability_hours_start: "09:00",
            availability_hours_end: "17:00",
            meeting_duration_min: 30,
            meeting_modes: "remote",
            office_address: null,
            on_site_radius_km: null,
            on_site_fee_note: null,
            weekly_bookings_goal: 12,
            avg_deal_value: 50000,
            allowed_channels: "email,linkedin",
            timezone: "America/Los_Angeles",
          },
          contacts: [
            {
              first_name: "Ivan",
              last_name: "Ivanka",
              email: "ivan@markster.ai",
              phone: "+1-415-555-0101",
              position: "Founder",
              is_primary: 1,
              id: 501,
              company_id: 101,
              created_at: "2025-09-01T09:00:00Z",
              updated_at: generatedAt,
            },
          ],
          action,
          profile_update: update,
          requestId,
        },
      };
    }

    case "contact_profile_workspace":
    case "contact_profile_workspace_get": {
      const includeEnriched = args.include_enriched !== false;
      const filterContactId =
        typeof args.contact_id === "string" ? args.contact_id : "c1";
      const filterEmail = typeof args.email === "string" ? args.email : null;
      const mkContact = (
        id: string,
        name: string,
        email: string,
        title: string,
        company: string,
        linkedin: string,
        city: string,
        intentScore: number,
        intentStatus: string,
      ) => {
        const personId = resolveMockPersonIdForEmail(email);
        const photoUrl = mockHeadshotUrlForPersonId(personId);
        return {
          contact_id: id,
          person_id: personId,
          name,
          email,
          title,
          company,
          source: "crm",
          intent_score: intentScore,
          intent_status: intentStatus,
          ...(photoUrl ? { photo_url: photoUrl, avatar_url: photoUrl } : {}),
          enriched: includeEnriched
            ? {
                contactdb: {
                  matched: true,
                  match_score: 0.94,
                  data: {
                    id: `person-${id}`,
                    person_id: personId,
                    full_name: name,
                    title,
                    company_name: company,
                    email,
                    linkedin_url: linkedin,
                    city,
                    country: "United States",
                    ...(photoUrl
                      ? { photo_url: photoUrl, avatar_url: photoUrl }
                      : {}),
                  },
                },
              }
            : {
                contactdb: {
                  matched: false,
                  match_score: 0,
                  data: null,
                },
              },
        };
      };

      const allContacts = [
        mkContact(
          "c1",
          "Claire Hughes",
          "claire@stripe.com",
          "VP Revenue",
          "Stripe",
          "https://www.linkedin.com/in/claire-hughes",
          "San Francisco",
          89,
          "Ready to Buy",
        ),
        mkContact(
          "c2",
          "Sarah Chen",
          "sarah.chen@anthropic.com",
          "VP Revenue",
          "Anthropic",
          "https://www.linkedin.com/in/sarah-chen-ai",
          "San Francisco",
          88,
          "Ready to Buy",
        ),
        mkContact(
          "c3",
          "Maya Chen",
          "maya@clay.com",
          "Chief Revenue Officer",
          "Clay",
          "https://www.linkedin.com/in/maya-chen-cro",
          "New York",
          87,
          "Ready to Buy",
        ),
        mkContact(
          "c4",
          "Emily Hart",
          "emily.hart@mercury.com",
          "VP Sales",
          "Mercury",
          "https://www.linkedin.com/in/emily-hart-sales",
          "San Francisco",
          84,
          "Ready to Buy",
        ),
        mkContact(
          "c5",
          "Mina Patel",
          "mina@openai.com",
          "Director of Partnerships",
          "OpenAI",
          "https://www.linkedin.com/in/mina-patel",
          "San Francisco",
          82,
          "Ready to Buy",
        ),
        mkContact(
          "c6",
          "Luigi Pignone",
          "luigi@manufact.com",
          "Co-Founder",
          "Manufact",
          "https://www.linkedin.com/in/luigi-pignone",
          "San Francisco",
          81,
          "Ready to Buy",
        ),
        mkContact(
          "c7",
          "Dario Amodei",
          "dario@anthropic.com",
          "CEO",
          "Anthropic",
          "https://www.linkedin.com/in/dario",
          "San Francisco",
          76,
          "Hot",
        ),
        mkContact(
          "c8",
          "Pietro Zullo",
          "pietro@manufact.com",
          "Founder",
          "Manufact",
          "https://www.linkedin.com/in/pietro-zullo",
          "San Francisco",
          74,
          "Hot",
        ),
        mkContact(
          "c9",
          "Diana Lin",
          "diana@stripe.com",
          "Head of Enterprise",
          "Stripe",
          "https://www.linkedin.com/in/diana-lin",
          "San Francisco",
          73,
          "Hot",
        ),
        mkContact(
          "c10",
          "Daniel Brooks",
          "daniel@ramp.com",
          "Chief Revenue Officer",
          "Ramp",
          "https://www.linkedin.com/in/daniel-brooks-cro",
          "New York",
          70,
          "Hot",
        ),
        mkContact(
          "c11",
          "Ivan Ivanov",
          "ivan@notion.so",
          "CRO",
          "Notion",
          "https://www.linkedin.com/in/ivan-ivanov-notion",
          "San Francisco",
          69,
          "Hot",
        ),
        mkContact(
          "c12",
          "Sasha Ivanov",
          "sasha@figma.com",
          "VP Revenue",
          "Figma",
          "https://www.linkedin.com/in/sasha-ivanov-figma",
          "San Francisco",
          68,
          "Hot",
        ),
        mkContact(
          "c13",
          "Sam Altman",
          "sam@openai.com",
          "Chief Executive Officer",
          "OpenAI",
          "https://www.linkedin.com/in/sam-altman",
          "San Francisco",
          57,
          "Warming",
        ),
        mkContact(
          "c14",
          "Nina K",
          "nina@ramp.com",
          "Head of Mid-Market",
          "Ramp",
          "https://www.linkedin.com/in/nina-k-ramp",
          "New York",
          53,
          "Warming",
        ),
        mkContact(
          "c15",
          "Marcus Johnson",
          "marcus.j@anthropic.com",
          "Head of Sales",
          "Anthropic",
          "https://www.linkedin.com/in/marcus-johnson-sales",
          "San Francisco",
          49,
          "Warming",
        ),
        mkContact(
          "c16",
          "Reema Batta",
          "reema@figma.com",
          "VP Growth Marketing",
          "Figma",
          "https://www.linkedin.com/in/reema-batta/",
          "San Francisco",
          46,
          "Warming",
        ),
      ];
      const filtered = allContacts.filter((contact) => {
        if (
          typeof args.contact_id === "string" &&
          contact.contact_id !== args.contact_id
        ) {
          return false;
        }
        if (filterEmail && contact.email !== filterEmail) {
          return false;
        }
        if (
          typeof args.name === "string" &&
          !contact.name.toLowerCase().includes(args.name.toLowerCase())
        ) {
          return false;
        }
        if (
          typeof args.title === "string" &&
          !contact.title.toLowerCase().includes(args.title.toLowerCase())
        ) {
          return false;
        }
        if (
          typeof args.company === "string" &&
          !contact.company.toLowerCase().includes(args.company.toLowerCase())
        ) {
          return false;
        }
        return true;
      });

      if (spec.name === "contact_profile_workspace_get") {
        return {
          ...base,
          payload:
            filtered[0] ??
            mkContact(
              filterContactId,
              "Unknown Contact",
              "unknown@example.com",
              "Unknown",
              "Unknown",
              "",
              "",
              0,
              "Unknown",
            ),
        };
      }

      return {
        ...base,
        payload: {
          total: filtered.length,
          include_enriched: includeEnriched,
          filters: {
            contact_id:
              typeof args.contact_id === "string" ? args.contact_id : undefined,
            name: typeof args.name === "string" ? args.name : undefined,
            email: filterEmail ?? undefined,
            title: typeof args.title === "string" ? args.title : undefined,
            company:
              typeof args.company === "string" ? args.company : undefined,
            source: typeof args.source === "string" ? args.source : "all",
          },
          results: filtered,
          requestId,
        },
      };
    }

    case "onboarding_flow_manage": {
      const responses = isObject(args.step_answers)
        ? args.step_answers
        : isObject(args.answers)
          ? args.answers
          : null;
      return {
        ...base,
        payload: {
          id: 9001,
          survey_id: 77,
          customer_id: 13,
          responses,
          current_step: 5,
          is_completed: 0,
          started_at: "2026-02-20T09:00:00Z",
          completed_at: null,
          flow_id: `flow-${randomSuffix(
            String(args.company_key ?? "default"),
          )}`,
          status: "ok",
          stage: args.stage || "assessment",
          answers_stored: responses ? Object.keys(responses).length : 0,
          requestId,
        },
      };
    }

    case "onboarding_ai_assist": {
      return {
        ...base,
        payload: {
          suggestions: [
            "Suggested ICP title: Agency Owner / VP Revenue / Head of Growth",
            "Suggested voice: practical, concise, founder-first — lead with results not theory",
          ],
          quality_score: 91,
          generated_profile_fields: {
            risk_profile: "balanced",
            onboarding_complexity: "medium",
          },
          requestId,
        },
      };
    }

    case "dashboard_insights": {
      return {
        ...base,
        payload: {
          customer_id: 13,
          period: typeof args.period === "string" ? args.period : "daily",
          qualified_meetings: 8,
          show_rate: 78.5,
          positive_reply_rate: 6.8,
          bookings_per_1k_recipients: 4.1,
          deliverability_health_index: 92.4,
          hard_bounce_rate: 0.7,
          complaint_rate: 0.12,
          messages_sent: 1240,
          leads_generated: 37,
          daily_send_pace: 177,
          sql_rate: 22.4,
          time_to_first_send_hours: 6.2,
          time_to_first_meeting_hours: 51.4,
          revenue: 15627.83,
          previous_qualified_meetings: 6,
          previous_messages_sent: 1110,
          previous_revenue: 13205.17,
          previous_positive_reply_rate: 5.9,
          previous_show_rate: 73.2,
          previous_bookings_per_1k_recipients: 3.6,
          refresh: true,
          time_series: [
            { date: "2025-11-01", mrr: 9811.0, leads: 12 },
            { date: "2025-12-01", mrr: 11043.5, leads: 16 },
            { date: "2026-01-01", mrr: 13205.17, leads: 22 },
            { date: "2026-02-01", mrr: 15627.83, leads: 34 },
          ],
          stages: [
            { name: "Prospect", count: 10, value: "$545,000" },
            { name: "Discovery", count: 5, value: "$295,000" },
            { name: "Proposal", count: 3, value: "$185,000" },
            { name: "Negotiation", count: 2, value: "$222,500" },
          ],
          rollup: {
            total_revenue: "$187,534 ARR",
            pipeline_value: "$1,247,500",
            win_rate: "34%",
            avg_deal_size: "$103,958",
            open_opportunities: 12,
            active_contacts: 22,
            meetings_booked_this_month: 5,
            team_velocity: "+22.3%",
          },
          requestId,
        },
      };
    }

    case "task_workspace": {
      return {
        ...base,
        payload: {
          workspace: "sales",
          overview: {
            active: 8,
            completed_today: 4,
            stalled: 1,
            overdue: 0,
          },
          tasks: [
            {
              id: "task-101",
              title:
                "Close Figma deal — Reema Batta pricing review complete (intent 87)",
              status: "in_progress",
              owner: "ivan",
              priority: "urgent",
              due: "2026-02-21",
              type: "deal",
              context:
                "Reema visited pricing 6x, used ROI calculator, and reviewed the case study. $150K deal in negotiation. Close probability: 72%.",
            },
            {
              id: "task-106",
              title:
                "Reply to Reema Batta — follow-up email on competitive positioning",
              status: "queued",
              owner: "ivan",
              priority: "urgent",
              due: "2026-02-21",
              type: "email",
              context:
                "Reema replied asking how Markster compares to traditional agencies. Draft response using founder voice — lead with 4 agencies, 12 years, zero employees proof point.",
            },
            {
              id: "task-102",
              title: "Send Anthropic enterprise proposal to Sarah Chen",
              status: "queued",
              owner: "ivan",
              priority: "high",
              due: "2026-02-22",
              type: "deal",
              context:
                "Sarah used ROI calculator twice and downloaded 3 case studies. Deal size: $120K.",
            },
            {
              id: "task-107",
              title:
                "Reply to Datadog intro — Alex Kim wants technical deep-dive",
              status: "queued",
              owner: "ivan",
              priority: "high",
              due: "2026-02-22",
              type: "email",
              context:
                "Alex forwarded our case study to his VP. Wants a technical walkthrough of the platform. Reply with available slots this week.",
            },
            {
              id: "task-103",
              title: "Schedule pricing walkthrough with Clay — Maya Chen",
              status: "queued",
              owner: "ivan",
              priority: "high",
              due: "2026-02-23",
              type: "deal",
              context:
                "Maya submitted demo request. As CRO, she's the decision maker. Intent score: 87.",
            },
            {
              id: "task-105",
              title:
                "Send Figma competitive analysis — Reema requested comparison",
              status: "queued",
              owner: "ivan",
              priority: "high",
              due: "2026-02-22",
              type: "content",
              context:
                "Reema asked for competitive comparison with traditional agencies. Send our positioning doc.",
            },
            {
              id: "task-104",
              title: "Publish case study — 9.2x revenue growth in 15 months",
              status: "queued",
              owner: "automation",
              priority: "normal",
              due: "2026-02-24",
              type: "content",
              context:
                "LinkedIn + blog distribution. Content approved, awaiting publish slot.",
            },
          ],
          requestId,
        },
      };
    }

    case "task_action": {
      return {
        ...base,
        payload: {
          task_id: sampleTaskId,
          action: args.action || "start",
          previous_status: "queued",
          status: args.action === "complete" ? "complete" : "in_progress",
          note: "Mock task transition saved.",
          requestId,
        },
      };
    }

    case "task_content_regenerate": {
      return {
        ...base,
        payload: {
          task_id: sampleTaskId,
          regenerate_token: `regen-${randomSuffix(sampleTaskId)}`,
          status: "ok",
          revised_content: `Updated onboarding content block for ${sampleTaskId}`,
          requestId,
        },
      };
    }

    case "ai_team_workspace": {
      return {
        ...base,
        payload: {
          agents: [
            { id: "agent-research", name: "Researcher", role: "insights" },
            { id: "agent-finance", name: "Finance Copilot", role: "modeling" },
            { id: "agent-copy", name: "Positioning Writer", role: "content" },
          ],
          conversations: [
            {
              id: sampleConversationId,
              name: "Stripe enterprise deal strategy",
              updated: generatedAt,
            },
          ],
          requestId,
        },
      };
    }

    case "ai_team_chat_turn": {
      return {
        ...base,
        payload: {
          conversation_id: sampleConversationId,
          turn: 3,
          user: {
            text:
              typeof args.message === "string"
                ? args.message
                : "Mock user turn",
          },
          assistant:
            "I analyzed Markster's pipeline and recommend prioritizing Stripe — Claire Hughes has visited pricing 5x this week, used the ROI calculator, and submitted a demo request. Intent score: 89.",
          sse_simulated: true,
          requestId,
        },
      };
    }

    case "ai_team_memory_manage": {
      const operation =
        typeof args.operation === "string" ? args.operation : "list";
      return {
        ...base,
        payload: {
          operation,
          memory_items: [
            {
              id: "mem-001",
              label: "Stripe: Claire Hughes opened pricing page 5x this week",
              pinned: true,
            },
            {
              id: "mem-002",
              label:
                "Kontext Group prefers results-first messaging — always lead with revenue numbers",
              pinned: false,
            },
          ],
          requestId,
        },
      };
    }

    case "customer_artifact_workspace": {
      const operation =
        typeof args.operation === "string" ? args.operation : "list";
      return {
        ...base,
        payload: {
          operation,
          artifacts: [
            {
              id: "art-9",
              title: "Markster GTM Playbook",
              status: "published",
              updated_at: generatedAt,
            },
          ],
          requestId,
        },
      };
    }

    case "customer_document_workspace": {
      return {
        ...base,
        payload: {
          documents: [
            {
              id: "doc-1",
              title: "Q1 GTM Strategy — Agency ICP Expansion",
              kind: "md",
            },
            {
              id: "doc-2",
              title: "Kontext Group Case Study — $71K to $1.3M",
              kind: "txt",
            },
          ],
          requestId,
        },
      };
    }

    case "customer_data_change_review": {
      return {
        ...base,
        payload: {
          proposals: [
            {
              id: "prop-12",
              area: "voice_pack",
              change: "Tone updated from pragmatic to pragmatic+ambitious",
              status: "pending",
              requested_by: "onboarding_ai_assist",
            },
          ],
          requestId,
        },
      };
    }

    case "content_calendar_workspace": {
      // Raw endpoint shape for GET /api/content/calendars:
      // Always return a list of calendars. Curated week filtering is handled by
      // runContentCalendarWorkspace in src/tools/markster-business-os.ts.
      return {
        ...base,
        payload: [
          {
            id: sampleCalendarId,
            name: "Current content calendar",
            status: "ready",
            date_start: "2026-02-16",
            date_end: "2026-02-22",
            items: 14,
          },
          {
            id: "41",
            name: "Previous cycle",
            status: "ready",
            date_start: "2026-02-09",
            date_end: "2026-02-15",
            items: 11,
          },
        ],
      };
    }

    case "content_calendar_workspace_get": {
      const calendarId =
        typeof args.calendar_id === "string" ? args.calendar_id : "42";
      return {
        ...base,
        payload: {
          id: calendarId,
          name: "Current content calendar",
          status: "ready",
          date_start: "2026-02-16",
          date_end: "2026-02-22",
          items: [
            {
              id: "501",
              date: "2026-02-20",
              platform: "LinkedIn",
              pillar: "Case Study",
              daily_topic:
                "We grew Kontext Group from $71K to $1.3M. Here's what moved the needle.",
              status: "scheduled",
              generated_post: {
                id: "9001",
                title:
                  "We grew Kontext Group from $71K to $1.3M. Here's what moved the needle.",
                hook: "Everyone talks about AI replacing agencies. We used it to 18x a client's revenue.",
                body: "In 2023, Kontext Group was doing $71K. Two years later, they crossed $1.3M...",
                image_url:
                  "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p2.png",
                status: "draft",
              },
            },
            {
              id: "502",
              date: "2026-02-21",
              platform: "LinkedIn",
              pillar: "Owner Independence",
              daily_topic:
                "Why your agency doesn't need 50 employees to hit $2M ARR",
              status: "scheduled",
              generated_post: {
                id: "9002",
                title:
                  "Why your agency doesn't need 50 employees to hit $2M ARR",
                hook: "Most growth teams scale headcount first. We scaled systems first.",
                body: "The old playbook says hire before process. The AI-native playbook flips it.",
                image_url:
                  "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p3.png",
                status: "draft",
              },
            },
          ],
          requestId,
        },
      };
    }

    case "content_post_workspace":
    case "content_post_workspace_get":
    case "content_post_workspace_edit":
    case "content_post_workspace_regenerate":
    case "content_post_workspace_schedule": {
      const modeFromSpec: string | undefined =
        spec.name === "content_post_workspace_get"
          ? "get"
          : spec.name === "content_post_workspace_edit"
            ? "edit"
            : spec.name === "content_post_workspace_regenerate"
              ? "regenerate"
              : spec.name === "content_post_workspace_schedule"
                ? "schedule"
                : undefined;
      const mode =
        typeof args.mode === "string" ? args.mode : modeFromSpec ?? "get";
      const postId = typeof args.post_id === "string" ? args.post_id : "9001";
      if (mode === "get") {
        return {
          ...base,
          payload: {
            workflow: "content_post_workspace",
            mode: "get",
            post_id: postId,
            post: {
              id: postId,
              title:
                "We grew Kontext Group from $71K to $1.3M. Here's what actually moved the needle.",
              hook: "Everyone talks about AI replacing agencies. We used it to 18x a client's revenue.",
              body: "In 2023, Kontext Group was doing $71K. Two years later, they crossed $1.3M. Not because we hired more people — we hired zero. Here's what we did differently...",
              hashtags: ["#agencygrowth", "#ainative", "#revops"],
              image_url:
                "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p2.png",
              media: [
                {
                  type: "image",
                  url: "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p2.png",
                },
              ],
              status: "draft",
            },
            image_url:
              "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p2.png",
            requestId,
          },
        };
      }
      if (mode === "edit") {
        return {
          ...base,
          payload: {
            id: postId,
            status: "draft",
            body:
              typeof args.body === "object" && args.body !== null
                ? (args.body as Record<string, unknown>).body ??
                  "Updated post body"
                : "Updated post body",
            updated_at: generatedAt,
            requestId,
          },
        };
      }
      if (mode === "regenerate") {
        return {
          ...base,
          payload: {
            id: postId,
            status: "draft",
            image_url:
              "https://dealpulse-prod.hackathon.markster.io/assets/headshots/p3.png",
            updated_at: generatedAt,
            requestId,
          },
        };
      }
      if (mode === "approve" || mode === "schedule") {
        return {
          ...base,
          payload: {
            id: postId,
            status: "scheduled",
            scheduled_for: "2026-02-21T09:30:00Z",
            requestId,
          },
        };
      }
      return {
        ...base,
        payload: {
          item_id: sampleItemId,
          generated_post: {
            headline:
              "Two founders. Zero employees. 41 customers. Here's the playbook.",
            body: "We run Markster with Claude Code, Codex, and Cursor. No account managers. No SDR team. AI handles research, outreach, and content. We handle strategy and relationships.",
            hashtags: ["#ainative", "#founderselling", "#scaleos"],
          },
          status: "scheduled",
          scheduled_for: "2026-02-21T09:30:00Z",
          requestId,
        },
      };
    }

    case "content_audio_library": {
      return {
        ...base,
        payload: {
          tracks: [
            { id: "trk-1", name: "Studio Loop", duration_sec: 35 },
            { id: "trk-2", name: "Soft Rise", duration_sec: 42 },
          ],
          requestId,
        },
      };
    }

    case "content_social_accounts": {
      return {
        ...base,
        payload: {
          accounts: [
            {
              platform: "linkedin",
              status: "connected",
              handle: "@ivanivanka",
            },
            { platform: "x", status: "connected", handle: "@TheIvanIvanka" },
            {
              platform: "email",
              status: "connected",
              handle: "ivan@markster.ai",
            },
          ],
          requestId,
        },
      };
    }

    case "tap_brand_assets_workspace":
    case "outreach_brand_assets_workspace": {
      return {
        ...base,
        payload: {
          brand: {
            company: "Markster",
            tagline: "4 agencies. 12 years. One system. Zero employees.",
            positioning:
              "AI-native growth agency. Full-stack: pipeline + outbound, content + thought leadership, proposals, CRM. One flat fee replaces your growth team.",
            dinner_pitch:
              "We built and exited 4 agencies over 12 years. Then we encoded everything we learned into a system. Zero employees - and our first client grew 9.2x in 15 months.",
            offers: [
              {
                name: "Calibration Sprint",
                price: "$5,000 one-time",
                description: "14 days to learn your business and launch",
              },
              {
                name: "Pipeline",
                price: "$3,000-$5,000/mo",
                description:
                  "Fill my calendar — 200-500 prospects/month, multi-channel outbound, meeting booking",
              },
              {
                name: "Growth",
                price: "$6,000-$9,000/mo",
                description:
                  "Build my brand + fill my calendar — adds 8-12 LinkedIn posts/mo, 4-8 blog articles, content calendar",
              },
              {
                name: "Scale",
                price: "$10,000-$15,000/mo",
                description:
                  "Be my growth department — ABM, event intel, CRM management, weekly strategy calls",
              },
            ],
            replacement_value:
              "$225K/year (RevOps $100K + SDR $70K + Content Writer $35K + Tools $20K)",
          },
          social_proof: [
            {
              source: "First client",
              result:
                "9.2x revenue growth in 15 months. $71K → $1.3M. Proposals 2/week → 15+/week. Profit +31%.",
            },
            {
              source: "BPO pilot",
              result:
                "Full pipeline built in 6 weeks. $105M revenue B2B industrial wholesaler, Burbank.",
            },
            {
              source: "Organic demand",
              result:
                "477 companies on waitlist from running the same system on ourselves.",
            },
          ],
          testimonial: {
            quote:
              "Markster's AI does market research and proposals while I sleep. My team didn't grow - my system did.",
            author: "Tamas Kiss, First Client",
          },
          differentiators: [
            "Both founders code daily — Claude Code, Codex, Cursor",
            "We run on the same system we deploy for clients (eating our own dog food)",
            "No contracts — you stay because it keeps getting better",
            "Compounding data: cross-client learning makes month 6 dramatically better than month 1",
          ],
          requestId,
        },
      };
    }

    case "tap_icp_workspace":
    case "outreach_icp_workspace": {
      const stage = typeof args.stage === "string" ? args.stage : "review";
      return {
        ...base,
        payload: {
          stage,
          icps: [
            {
              id: "icp-1",
              name: "B2B Service Agencies",
              revenue_range: "$500K-$5M",
              headcount_min: 5,
              headcount_max: 50,
              geo: "US (beachhead: Bay Area / SF)",
              titles: [
                "Agency Owner",
                "CEO",
                "VP Revenue",
                "Head of Growth",
                "Managing Director",
              ],
              pain: "Founder IS the sales team. Spending 40-60 hrs/month on GTM. Feast-or-famine pipeline.",
              prior_attempts:
                "Tried agencies (black boxes, junior employees). Tried tools (still managing software).",
              budget: "$3-10K/mo already being spent on marketing",
            },
            {
              id: "icp-2",
              name: "IT Services / MSPs (Beachhead)",
              revenue_range: "$1M-$10M",
              headcount_min: 10,
              headcount_max: 50,
              geo: "US (4,500+ in Bay Area, ~180,000 national)",
              titles: ["Owner", "CEO", "VP Sales", "Marketing Director"],
              pain: "Sell essential but boring services. Technical founders = AI-positive. Already budget $3-10K/mo.",
              prior_attempts:
                "Fear-based buyers (cybersecurity, compliance). Short sales cycles (1-3 months).",
              budget: "$3-10K/mo",
            },
          ],
          disqualification: [
            "< $300K revenue (can't sustain $3K+/month)",
            "Solo founder with no clients yet",
            "B2C business (our playbook is B2B)",
            "Wants to buy a tool, not a service",
            '"Can you do this for $500/month?"',
          ],
          requestId,
        },
      };
    }

    case "tap_sequence_workspace":
    case "outreach_sequence_workspace": {
      return {
        ...base,
        payload: {
          sequence_id: sampleSequenceId,
          name: "SF B2B Agency Owners — Peer Growth",
          status: "active",
          target_icp: "B2B Service Agencies ($500K-$5M)",
          enrolled: 48,
          steps: [
            {
              id: "step-1",
              day: 0,
              channel: "email",
              subject: "Quick question about [company] growth",
              status: "sent",
              description:
                "Warm intro — peer founder angle, specific observation about their business",
            },
            {
              id: "step-2",
              day: 2,
              channel: "linkedin",
              subject: "Connection request + note",
              status: "sent",
              description:
                "Personalized LinkedIn connection with shared context",
            },
            {
              id: "step-3",
              day: 4,
              channel: "email",
              subject: "Thought this might help — [relevant case study]",
              status: "sent",
              description: "Value-first follow up with relevant proof point",
            },
            {
              id: "step-4",
              day: 7,
              channel: "email",
              subject: "15 min this week?",
              status: "scheduled",
              description: "Soft CTA — 'Would you be open to a brief call?'",
            },
            {
              id: "step-5",
              day: 14,
              channel: "email",
              subject: "One last thing",
              status: "scheduled",
              description:
                "Final touch — share a relevant insight, no pressure",
            },
          ],
          analytics: {
            sent: 180,
            opened: 112,
            open_rate: "62.2%",
            clicked: 41,
            click_rate: "22.8%",
            replied: 16,
            response_rate: "8.9%",
            booked_calls: 5,
            conversion_rate: "2.8%",
          },
          requestId,
        },
      };
    }

    case "tap_enrollment":
    case "outreach_enrollment": {
      return {
        ...base,
        payload: {
          sequence_id: sampleSequenceId,
          enrolled: sampleLeadIds,
          duplicate_rejected: Math.max(sampleLeadIds.length - 1, 0),
          requestId,
        },
      };
    }

    case "tap_outreach_insights": {
      return {
        ...base,
        payload: {
          events: [
            { event: "reply", count: 7, date: "2026-02-18" },
            { event: "email_open", count: 34, date: "2026-02-18" },
          ],
          rollups: {
            sent: 180,
            opened: 112,
            clicked: 41,
            replied: 16,
            booked_calls: 5,
          },
          requestId,
        },
      };
    }

    case "domain_mailbox_manage": {
      return {
        ...base,
        payload: {
          domains: [
            {
              domain: "markster.ai",
              dkim: "passed",
              spf: "passed",
              dmarc: "passed",
            },
          ],
          mailboxes: [
            {
              email: "ivan@markster.ai",
              inbox_health: "healthy",
              capacity_pct: 24,
            },
          ],
          requestId,
        },
      };
    }

    case "cold_mail_health_domains": {
      return {
        ...base,
        payload: [
          {
            id: 41,
            customer_id: 13,
            domain_name: "markster.ai",
            status: "active",
            health_score: 94,
            bounce_rate: 1.2,
            last_health_check: generatedAt,
            created_at: "2025-11-01T10:00:00Z",
          },
          {
            id: 42,
            customer_id: 13,
            domain_name: "go.markster.ai",
            status: "active",
            health_score: 91,
            bounce_rate: 1.5,
            last_health_check: generatedAt,
            created_at: "2025-11-01T10:05:00Z",
          },
        ],
      };
    }

    case "cold_mail_health_mailboxes": {
      return {
        ...base,
        payload: [
          {
            id: 101,
            customer_id: 13,
            domain_id: 41,
            email_address: "ivan@markster.ai",
            status: "active",
            health_score: 93,
            bounce_rate: 1.1,
            last_health_check: generatedAt,
            created_at: "2025-11-01T10:10:00Z",
          },
          {
            id: 102,
            customer_id: 13,
            domain_id: 42,
            email_address: "growth@markster.ai",
            status: "active",
            health_score: 90,
            bounce_rate: 1.4,
            last_health_check: generatedAt,
            created_at: "2025-11-01T10:12:00Z",
          },
        ],
      };
    }

    case "cold_mail_health": {
      return {
        ...base,
        payload: {
          setup_status: "ready",
          warmed_accounts: 5,
          target_accounts: 5,
          warmup_progress_pct: 100,
          warmup_day: 21,
          warmup_target_days: 21,
          daily_send_capacity: 150,
          blockers: [],
          domain_health: {
            domain: "markster.ai",
            dkim: "passed",
            spf: "passed",
            dmarc: "passed",
            blacklist_status: "clean",
            sender_reputation: 94,
          },
          mailboxes: [
            {
              email: "ivan@markster.ai",
              status: "healthy",
              daily_capacity: 50,
              sent_today: 12,
            },
            {
              email: "hello@markster.ai",
              status: "healthy",
              daily_capacity: 50,
              sent_today: 8,
            },
            {
              email: "growth@markster.ai",
              status: "healthy",
              daily_capacity: 50,
              sent_today: 15,
            },
          ],
          deliverability: {
            inbox_rate_pct: 94.2,
            spam_rate_pct: 3.1,
            bounce_rate_pct: 2.7,
          },
          requestId,
        },
      };
    }

    case "customer_image_assets": {
      return {
        ...base,
        payload: {
          uploaded: true,
          assets: [
            {
              id: `asset-${randomSuffix(JSON.stringify(args))}`,
              kind: "logo",
              url: "https://cdn.markster.ai/mock-assets/logo.png",
            },
          ],
          requestId,
        },
      };
    }

    case "voice_pack_workspace": {
      return {
        ...base,
        payload: {
          default_pack: "Founder Direct",
          packs: [
            {
              id: "vp-01",
              name: "Founder Direct",
              tone: "specific, conversational, experience-backed",
              description:
                "Leads with facts and numbers, not questions. Uses 'I' freely. Drops into second person when teaching. Parenthetical asides for specificity. Writes the way he talks.",
              rules: [
                "Lead with a specific fact or number, never a question",
                "Pattern: Statement. Evidence. Implication.",
                "Average sentence length: 22 words (15-30 range)",
                "Names, numbers, timeframes everywhere — never 'a client' or 'a company'",
                "Zero banned words: leverage, utilize, innovative, synergy, game-changer, ecosystem",
                "Never end with 'Agree?' or engagement bait",
                "USD only, never EUR",
              ],
              sample:
                "I replaced 7 tools at a $4.4M company last month. Total monthly cost of their old stack: $4,133. Meetings booked in 90 days: 12. I cost them $997. I booked 23 meetings in 48 days.",
            },
            {
              id: "vp-02",
              name: "Community Vulnerable",
              tone: "raw, generous, stream-of-consciousness",
              description:
                "Used in private groups and trusted spaces. Real pain, real numbers, real contrast. Never performative. Vulnerability earns credibility.",
              sample:
                "I exited from my last agency with 52 FTEs and 600+ contractors. I left because I couldn't keep up, burned out, and developed serious health problems. Today, the picture is extremely different: with my co-founder, we reduced our team headcount to 0.",
            },
            {
              id: "vp-03",
              name: "Twitter Sharp",
              tone: "casual, sarcastic, technically generous",
              description:
                "Sharper, more casual. Detailed technical breakdowns. Dry observations. Sarcasm welcome.",
              sample:
                "Sven is moving too fast. He should really take another 38 months to make sure that 15k is safe, especially in such FX environment.",
            },
          ],
          signature_phrases: [
            "Amateurs hustle. Pros systemize.",
            "B2B growth without the corporate BS.",
            "We build scalable predictable growth engines.",
            "4 agencies. 12 years. One system. Zero employees.",
          ],
          requestId,
        },
      };
    }

    case "pipeline_workspace": {
      return {
        ...base,
        payload: {
          pipeline_summary: {
            total_value: "$1,247,500",
            weighted_value: "$487,250",
            open_deals: 12,
            avg_deal_size: "$103,958",
            avg_cycle_days: 34,
            win_rate_pct: 34,
          },
          stages: [
            { name: "Prospect", count: 4, value: "$285,000" },
            { name: "Discovery", count: 3, value: "$195,000" },
            { name: "Proposal", count: 2, value: "$167,500" },
            { name: "Negotiation", count: 2, value: "$250,000" },
            { name: "Closed Won (Feb)", count: 1, value: "$50,000" },
          ],
          deals: [
            {
              id: "deal-1",
              company: "Stripe",
              contact: "Claire Hughes",
              value: 50000,
              stage: "Negotiation",
              probability: 68,
              days_in_stage: 5,
              next_action: "Schedule pricing walkthrough",
              last_activity: "2026-02-20",
            },
            {
              id: "deal-2",
              company: "Anthropic",
              contact: "Sarah Chen",
              value: 120000,
              stage: "Proposal",
              probability: 55,
              days_in_stage: 8,
              next_action: "Send enterprise proposal",
              last_activity: "2026-02-19",
            },
            {
              id: "deal-3",
              company: "OpenAI",
              contact: "Mina Patel",
              value: 95000,
              stage: "Discovery",
              probability: 40,
              days_in_stage: 12,
              next_action: "Partnership alignment call",
              last_activity: "2026-02-20",
            },
            {
              id: "deal-4",
              company: "Clay",
              contact: "Maya Chen",
              value: 67500,
              stage: "Proposal",
              probability: 60,
              days_in_stage: 4,
              next_action: "Follow up on ROI analysis",
              last_activity: "2026-02-20",
            },
            {
              id: "deal-5",
              company: "Mercury",
              contact: "Emily Hart",
              value: 35000,
              stage: "Discovery",
              probability: 45,
              days_in_stage: 7,
              next_action: "Demo follow-up",
              last_activity: "2026-02-18",
            },
            {
              id: "deal-6",
              company: "Ramp",
              contact: "Daniel Brooks",
              value: 40000,
              stage: "Prospect",
              probability: 25,
              days_in_stage: 10,
              next_action: "Initial outreach sequence",
              last_activity: "2026-02-19",
            },
            {
              id: "deal-7",
              company: "Figma",
              contact: "Reema Batta",
              value: 150000,
              stage: "Negotiation",
              probability: 72,
              days_in_stage: 6,
              next_action: "Send pricing proposal — intent 87, ready to close",
              last_activity: "2026-02-21",
            },
            {
              id: "deal-8",
              company: "Notion",
              contact: "Ivan Ivanov",
              value: 30000,
              stage: "Prospect",
              probability: 20,
              days_in_stage: 6,
              next_action: "Warm intro via shared connection",
              last_activity: "2026-02-20",
            },
            {
              id: "deal-9",
              company: "Manufact",
              contact: "Pietro Zullo",
              value: 27500,
              stage: "Closed Won",
              probability: 100,
              days_in_stage: 0,
              next_action: "Onboarding kickoff",
              last_activity: "2026-02-20",
              closed_date: "2026-02-15",
            },
            {
              id: "deal-10",
              company: "Datadog",
              contact: "Alex Kim",
              value: 120000,
              stage: "Discovery",
              probability: 35,
              days_in_stage: 9,
              next_action: "Technical deep-dive call",
              last_activity: "2026-02-19",
            },
            {
              id: "deal-11",
              company: "Scale AI",
              contact: "Rachel Torres",
              value: 95000,
              stage: "Prospect",
              probability: 20,
              days_in_stage: 5,
              next_action: "Initial outreach via warm intro",
              last_activity: "2026-02-20",
            },
            {
              id: "deal-12",
              company: "Vercel",
              contact: "Tom Nguyen",
              value: 70000,
              stage: "Prospect",
              probability: 15,
              days_in_stage: 3,
              next_action: "Research + personalized approach",
              last_activity: "2026-02-21",
            },
          ],
          at_risk: [],
          requestId,
        },
      };
    }

    case "company_profile_workspace":
    case "company_profile_workspace_get": {
      const companyName =
        typeof args.name === "string"
          ? args.name
          : typeof args.company === "string"
            ? args.company
            : null;
      const knownCompanies: Record<string, Record<string, unknown>> = {
        stripe: {
          id: "comp-stripe",
          name: "Stripe",
          domain: "stripe.com",
          industry: "Fintech / Payments",
          city: "San Francisco",
          employees: "5,200+",
          valuation: "$95B",
          founded: 2010,
          fit_score: 72,
          fit_reason:
            "Large enterprise — above typical ICP range but strong expansion opportunity. Payment infrastructure partner potential.",
          key_contacts: [
            {
              name: "Claire Hughes",
              title: "VP Revenue",
              intent: 89,
              status: "Ready to Buy",
            },
            {
              name: "Diana Lin",
              title: "Head of Enterprise",
              intent: 73,
              status: "Hot",
            },
          ],
        },
        anthropic: {
          id: "comp-anthropic",
          name: "Anthropic",
          domain: "anthropic.com",
          industry: "AI / Safety",
          city: "San Francisco",
          employees: "340+",
          valuation: "$7B",
          founded: 2021,
          fit_score: 65,
          fit_reason:
            "AI infrastructure company. Partnership opportunity more than client fit.",
          key_contacts: [
            {
              name: "Sarah Chen",
              title: "VP Revenue",
              intent: 88,
              status: "Ready to Buy",
            },
            { name: "Dario Amodei", title: "CEO", intent: 76, status: "Hot" },
          ],
        },
        openai: {
          id: "comp-openai",
          name: "OpenAI",
          domain: "openai.com",
          industry: "AI Infrastructure",
          city: "San Francisco",
          employees: "1,800+",
          valuation: "$80B",
          founded: 2015,
          fit_score: 58,
          fit_reason:
            "Strategic partnership target. Platform distribution opportunity.",
          key_contacts: [
            {
              name: "Mina Patel",
              title: "Director of Partnerships",
              intent: 82,
              status: "Ready to Buy",
            },
            { name: "Sam Altman", title: "CEO", intent: 57, status: "Warming" },
          ],
        },
        clay: {
          id: "comp-clay",
          name: "Clay",
          domain: "clay.com",
          industry: "Sales Intelligence",
          city: "New York",
          employees: "200+",
          valuation: "$3.1B",
          founded: 2017,
          fit_score: 45,
          fit_reason:
            "Competitor in enrichment space. Potential acquisition or integration play.",
          key_contacts: [
            {
              name: "Maya Chen",
              title: "CRO",
              intent: 87,
              status: "Ready to Buy",
            },
          ],
        },
        mercury: {
          id: "comp-mercury",
          name: "Mercury",
          domain: "mercury.com",
          industry: "Banking / Fintech",
          city: "San Francisco",
          employees: "400+",
          valuation: "$3.2B",
          founded: 2019,
          fit_score: 70,
          fit_reason:
            "Startup banking — overlapping customer base. Strong integration opportunity.",
          key_contacts: [
            {
              name: "Emily Hart",
              title: "VP Sales",
              intent: 84,
              status: "Ready to Buy",
            },
          ],
        },
        ramp: {
          id: "comp-ramp",
          name: "Ramp",
          domain: "ramp.com",
          industry: "Corporate Finance",
          city: "New York",
          employees: "800+",
          valuation: "$8.1B",
          founded: 2019,
          fit_score: 68,
          fit_reason:
            "Finance automation overlaps with our deal impact analysis. Strong integration fit.",
          key_contacts: [
            { name: "Daniel Brooks", title: "CRO", intent: 70, status: "Hot" },
          ],
        },
        figma: {
          id: "comp-figma",
          name: "Figma",
          domain: "figma.com",
          industry: "Design Tools",
          city: "San Francisco",
          employees: "1,200+",
          valuation: "$12.5B",
          founded: 2012,
          fit_score: 55,
          fit_reason:
            "Large design platform. GTM team expansion indicates potential.",
          key_contacts: [
            {
              name: "Sasha Ivanov",
              title: "VP Revenue",
              intent: 68,
              status: "Hot",
            },
          ],
        },
        notion: {
          id: "comp-notion",
          name: "Notion",
          domain: "notion.so",
          industry: "Productivity",
          city: "San Francisco",
          employees: "700+",
          valuation: "$10B",
          founded: 2013,
          fit_score: 62,
          fit_reason: "Workspace platform — strong complementary positioning.",
          key_contacts: [
            { name: "Ivan Ivanov", title: "CRO", intent: 69, status: "Hot" },
          ],
        },
        manufact: {
          id: "comp-manufact",
          name: "Manufact",
          domain: "manufact.com",
          industry: "Developer Tools / MCP",
          city: "San Francisco",
          employees: "15",
          valuation: "YC S25",
          founded: 2024,
          fit_score: 88,
          fit_reason:
            "Ideal ICP fit. Early-stage, founder-led, needs growth infrastructure. Active partnership.",
          key_contacts: [
            {
              name: "Pietro Zullo",
              title: "Founder",
              intent: 74,
              status: "Hot",
            },
            {
              name: "Luigi Pignone",
              title: "Co-Founder",
              intent: 81,
              status: "Ready to Buy",
            },
          ],
        },
      };
      const key = companyName?.toLowerCase().replace(/\s+/g, "") ?? "";
      const match = knownCompanies[key];
      if (match) {
        return { ...base, payload: { ...match, requestId } };
      }
      return {
        ...base,
        payload: {
          id: `comp-${randomSuffix(key)}`,
          name: companyName ?? "Unknown",
          domain: "unknown.com",
          industry: "Unknown",
          fit_score: 0,
          fit_reason:
            "Company not found in CRM. Use sales_intelligence with mode=research to enrich.",
          key_contacts: [],
          requestId,
        },
      };
    }

    default: {
      return {
        ...base,
        payload: {
          message: `Mock payload for ${spec.name} is not fully modeled yet.`,
          requestId,
          args,
        },
      };
    }
  }
}
