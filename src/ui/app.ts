import { App } from "@modelcontextprotocol/ext-apps";
import { MARKSTER_BRAND_TOKENS } from "../shared/markster-brand-pack";
import { MARKSTER_TOOL_CATALOG } from "../shared/marksterToolManifest";

type SceneKey =
  | "overview"
  | "research"
  | "people"
  | "deal-impact"
  | "pricing"
  | "signals"
  | "call-prep"
  | "outreach"
  | "pipeline"
  | "content"
  | "cold-mail"
  | "action-plan";

type RolePerspective = "ae" | "cfo" | "manager";
type DealStage =
  | "discovery"
  | "proposal_sent"
  | "negotiation"
  | "verbal_commit";
type ActionTone = "primary" | "secondary" | "quiet";
type MetricTone = "good" | "warn" | "bad" | "neutral";

type BridgeToolResult = {
  structuredContent?: unknown;
  content?: Array<{ type?: string; text?: string }>;
};

type ToolPayloadEnvelope = {
  toolName: string;
  payload: unknown;
};

type SceneSnapshot = {
  toolName: string;
  payload: unknown;
  updatedAt: number;
};

type SceneAction =
  | {
      type: "tool";
      label: string;
      tone?: ActionTone;
      toolName: string;
      args: Record<string, unknown>;
    }
  | {
      type: "scene";
      label: string;
      tone?: ActionTone;
      scene: SceneKey;
    };

type SceneMetric = {
  label: string;
  value: string;
  note?: string;
  tone?: MetricTone;
};

type SceneModel = {
  kicker: string;
  title: string;
  subtitle: string;
  metrics: SceneMetric[];
  bodyHtml: string;
  actions: SceneAction[];
};

type PricingDraft = {
  companyKey: string;
  dealSize: number;
  discountPct: number;
  dealStage: DealStage;
};

type UpcomingPost = {
  id: string;
  title: string;
  theme: string;
  channel: string;
  dateLabel: string;
  timestamp?: number;
  postId?: string;
  itemId?: string;
  imageUrl?: string;
  status?: string;
  content?: string;
  url?: string;
};

const TOOL_TITLE_BY_NAME = new Map(
  MARKSTER_TOOL_CATALOG.map((tool) => [tool.name, tool.title]),
);

const INTERNAL_KEY_DENYLIST = new Set([
  "trace_id",
  "customer_id",
  "workflow",
  "tool",
  "raw",
  "source",
  "mode",
  "payload",
  "request_id",
  "created_at",
  "updated_at",
  "_mcp_meta",
  "runtime_mode",
  "fallback",
  "request",
  "message",
]);

const SCENE_ORDER: SceneKey[] = [
  "research",
  "people",
  "deal-impact",
  "pricing",
  "signals",
  "call-prep",
  "outreach",
  "pipeline",
  "content",
  "cold-mail",
  "action-plan",
];

const SCENE_META: Record<
  SceneKey,
  { label: string; emptyTitle: string; emptyHint: string }
> = {
  overview: {
    label: "Overview",
    emptyTitle: "Markster Demo Cockpit",
    emptyHint:
      'Run a Markster use-case from chat. Try: "Research Stripe for an upcoming deal".',
  },
  research: {
    label: "Company Research",
    emptyTitle: "Company Research",
    emptyHint: 'Ask: "Research Stripe for an upcoming deal".',
  },
  people: {
    label: "Find People",
    emptyTitle: "Find the Right People",
    emptyHint: 'Ask: "Who should I reach out to at Stripe?"',
  },
  "deal-impact": {
    label: "Deal Impact",
    emptyTitle: "Deal Impact Analysis",
    emptyHint: 'Ask: "What does a $50K annual deal mean for my business?"',
  },
  pricing: {
    label: "Pricing Simulator",
    emptyTitle: "Pricing Simulator",
    emptyHint: 'Ask: "What if I offer them 20% discount to close faster?"',
  },
  signals: {
    label: "Engagement Signals",
    emptyTitle: "Engagement Signals",
    emptyHint: 'Ask: "What signals do we have on the VP Revenue at Stripe?"',
  },
  "call-prep": {
    label: "Call Prep",
    emptyTitle: "Call Preparation",
    emptyHint:
      'Ask: "Prep me for the call" after running research, people, and pricing.',
  },
  outreach: {
    label: "Outreach",
    emptyTitle: "Draft and Send Outreach",
    emptyHint: 'Ask: "Draft a follow-up email to their VP Revenue."',
  },
  pipeline: {
    label: "Pipeline",
    emptyTitle: "Pipeline & Dashboard",
    emptyHint: 'Ask: "How is my pipeline looking?"',
  },
  content: {
    label: "Content & Social",
    emptyTitle: "Content and Social",
    emptyHint: 'Ask: "What is on my content calendar this week?"',
  },
  "cold-mail": {
    label: "Cold Mail Health",
    emptyTitle: "Cold Mail Readiness",
    emptyHint: 'Ask: "Check cold mail health."',
  },
  "action-plan": {
    label: "Action Plan",
    emptyTitle: "Your Action Plan",
    emptyHint:
      'Ask: "I have an hour to work, what should I do now?"',
  },
};

const FALLBACK_TECH_STACK = [
  "Salesforce",
  "HubSpot",
  "Segment",
  "Snowflake",
  "AWS",
];

const FALLBACK_FUNDING_ROUNDS = [
  "Series E",
  "Series D",
  "Series C",
  "Series B",
  "Series A",
];

const FALLBACK_FUNDING_AMOUNTS = ["$420M", "$250M", "$110M", "$45M", "$12M"];
const DEFAULT_ASSET_ORIGIN = "https://dealpulse-prod.hackathon.markster.io";
const MAX_INLINE_IMAGE_DATA_URL_CHARS = 250_000;

function resolveAssetOrigin(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location?.protocol ?? "";
    const origin = window.location?.origin ?? "";
    if ((protocol === "http:" || protocol === "https:") && origin) {
      return origin;
    }
  }
  return DEFAULT_ASSET_ORIGIN;
}

const DEFAULT_HEADSHOT_THUMB_BASE_URL = `${resolveAssetOrigin()}/assets/headshots/thumbs`;

function isClaudeSandbox(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location?.hostname ?? "";
  return host.includes("assets.claude.ai");
}

const app = new App({ name: "Markster Business OS", version: "0.6.0" });

const state: {
  activeScene: SceneKey;
  pricingRole: RolePerspective;
  latestToolName: string;
  sceneCache: Map<SceneKey, SceneSnapshot>;
  pricing: PricingDraft;
  pricingDebounce?: ReturnType<typeof setTimeout>;
  lastSentVerdict?: string;
} = {
  activeScene: "overview",
  pricingRole: "ae",
  latestToolName: "none",
  sceneCache: new Map<SceneKey, SceneSnapshot>(),
  pricing: {
    companyKey: "figma",
    dealSize: 150000,
    discountPct: 0,
    dealStage: "negotiation",
  },
};

type DealRecord = {
  dealSize: number;
  dealStage: DealStage;
  contact: string;
  contactRole: string;
  intentScore: number;
  status: string;
  nextAction: string;
};

const DEAL_LOOKUP: Record<string, DealRecord> = {
  figma: { dealSize: 150000, dealStage: "negotiation", contact: "Reema Batta", contactRole: "VP Growth Marketing", intentScore: 87, status: "Ready to Buy", nextAction: "Send personalized follow-up referencing pricing page activity" },
  anthropic: { dealSize: 120000, dealStage: "proposal_sent", contact: "Sarah Chen", contactRole: "Head of Partnerships", intentScore: 72, status: "Evaluating", nextAction: "Schedule decision call to review proposal" },
  stripe: { dealSize: 50000, dealStage: "negotiation", contact: "Claire Hughes", contactRole: "VP Revenue Operations", intentScore: 58, status: "Engaged", nextAction: "Share ROI case study for similar deal size" },
  openai: { dealSize: 95000, dealStage: "discovery", contact: "Mina Patel", contactRole: "Director of Growth", intentScore: 45, status: "Warming", nextAction: "Book discovery call to qualify use case" },
  datadog: { dealSize: 120000, dealStage: "discovery", contact: "Alex Kim", contactRole: "VP Engineering", intentScore: 41, status: "Warming", nextAction: "Send technical deep-dive and request intro call" },
  clay: { dealSize: 75000, dealStage: "discovery", contact: "Maya Chen", contactRole: "VP Revenue", intentScore: 38, status: "Warming", nextAction: "Qualify ICP fit and budget timeline" },
  ramp: { dealSize: 65000, dealStage: "proposal_sent", contact: "Daniel Park", contactRole: "Head of Finance", intentScore: 52, status: "Evaluating", nextAction: "Send gentle nudge — no response in 3 days" },
  scale_ai: { dealSize: 200000, dealStage: "discovery", contact: "Jenny Kim", contactRole: "VP Engineering", intentScore: 63, status: "Engaged", nextAction: "Respond to inbound inquiry within 24h" },
};

const elements = {
  status: document.getElementById("status-line"),
  kicker: document.getElementById("scene-kicker"),
  title: document.getElementById("scene-title"),
  subtitle: document.getElementById("scene-subtitle"),
  metrics: document.getElementById("scene-metrics"),
  body: document.getElementById("scene-body"),
  actions: document.getElementById("scene-actions"),
  rail: document.getElementById("usecase-rail"),
  liveBadge: document.getElementById("scene-live-badge"),
};

function applyBrandTheme(): void {
  const root = document.documentElement;
  const { typography, spacing, motion } = MARKSTER_BRAND_TOKENS;

  // Dark theme — only pull non-color tokens from brand pack.
  // Color palette is defined in CSS :root for dark mode.
  root.style.setProperty("--mk-radius-card", spacing.radius.card);
  root.style.setProperty("--mk-radius-input", spacing.radius.input);
  root.style.setProperty("--mk-radius-button", spacing.radius.button);
  root.style.setProperty(
    "--mk-font-heading",
    `"Inter", ${typography.fontFamily.fallback}`,
  );
  root.style.setProperty(
    "--mk-font-body",
    `"Inter", ${typography.fontFamily.fallback}`,
  );
  root.style.setProperty("--mk-font-fallback", typography.fontFamily.fallback);
  root.style.setProperty("--mk-transition", motion.transitions.default);
}

function setStatus(text: string): void {
  if (elements.status) {
    elements.status.textContent = text;
  }
}

function setLiveBadge(text: string): void {
  if (elements.liveBadge) {
    elements.liveBadge.textContent = text;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanizeKey(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (match) => match.toUpperCase());
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatMatchScoreLabel(value: unknown): string | undefined {
  const score = toFiniteNumber(value);
  if (score === undefined) return undefined;

  if (score >= 0 && score <= 1) {
    return `${Math.round(score * 100)}%`;
  }
  if (score > 1 && score <= 100) {
    return `${Math.round(score)}%`;
  }
  return undefined;
}

function looksLikePersonName(value: string): boolean {
  if (value.length > 56) return false;
  if (value.includes("@") || value.includes("|")) return false;
  return true;
}

function deriveNameFromEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const local = email.split("@")[0]?.trim();
  if (!local) return undefined;
  const clean = local
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return undefined;
  return clean.replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

function pickContactDisplayName(contact: Record<string, unknown>): string {
  const email = getString(contact.email);
  const rawName = getString(contact.name);
  const fullName = `${getString(contact.first_name) ?? ""} ${
    getString(contact.last_name) ?? ""
  }`.trim();
  const derivedFromEmail = deriveNameFromEmail(email);

  if (rawName && looksLikePersonName(rawName)) return rawName;
  return (
    getString(fullName) ?? derivedFromEmail ?? rawName ?? "Unknown contact"
  );
}

function initialsFromName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "NA";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) return "NA";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function resolveContactPhotoUrl(
  contact: Record<string, unknown>,
): string | undefined {
  const direct = toHeadshotThumbUrl(
    normalizeImageUrl(
      firstStringByKeys(contact, [
        "photo_url",
        "avatar_url",
        "image_url",
        "profile_image_url",
        "headshot_url",
      ]),
    ),
  );
  if (direct) return direct;
  const directPersonHeadshot = toMockHeadshotThumbUrl(
    firstStringByKeys(contact, ["person_id", "id"]),
  );
  if (directPersonHeadshot) return directPersonHeadshot;

  const enriched = asRecord(contact.enriched);
  const contactDb = asRecord(enriched?.contactdb);
  const contactDbData = asRecord(contactDb?.data);
  if (!contactDbData) return undefined;

  const enrichedDirect = toHeadshotThumbUrl(
    normalizeImageUrl(
      firstStringByKeys(contactDbData, [
        "photo_url",
        "avatar_url",
        "image_url",
        "linkedin_profile_picture",
        "profile_image_url",
      ]),
    ),
  );
  if (enrichedDirect) return enrichedDirect;

  return toMockHeadshotThumbUrl(
    firstStringByKeys(contactDbData, ["person_id", "id"]),
  );
}

function toMockHeadshotThumbUrl(
  personId: string | undefined,
): string | undefined {
  if (!personId) return undefined;
  const normalized = personId.trim().toLowerCase();
  if (!/^p\d+$/.test(normalized)) return undefined;
  return normalizeImageUrl(
    `${DEFAULT_HEADSHOT_THUMB_BASE_URL}/${normalized}.png`,
  );
}

function toHeadshotThumbUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeImageUrl(value);
  if (!normalized) return undefined;

  try {
    const parsed = new URL(normalized);
    if (parsed.pathname.startsWith("/assets/headshots/thumbs/")) {
      return parsed.toString();
    }
    const match = parsed.pathname.match(/^\/assets\/headshots\/(p\d+\.png)$/);
    if (!match) return parsed.toString();
    parsed.pathname = `/assets/headshots/thumbs/${match[1]}`;
    return parsed.toString();
  } catch {
    return normalized;
  }
}

function normalizeImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) {
    if (!trimmed.startsWith("data:image/")) return undefined;
    if (trimmed.length > MAX_INLINE_IMAGE_DATA_URL_CHARS) return undefined;
    return trimmed;
  }
  if (isClaudeSandbox()) return undefined;
  if (trimmed.startsWith("/")) return `${resolveAssetOrigin()}${trimmed}`;

  const parsedCandidate = safeUrl(trimmed);
  if (!parsedCandidate) return undefined;
  return parsedCandidate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number");
}

function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function toCurrency(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toPercent(value: number | undefined, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(digits)}%`;
}

function toSigned(value: number | undefined, suffix = ""): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}${suffix}`;
}

function toSignedCurrency(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  return `${value >= 0 ? "+" : "-"}${toCurrency(Math.abs(value))}`;
}

function isMissingText(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "none" ||
    normalized === "unknown" ||
    normalized === "null" ||
    normalized === "-"
  );
}

function defaultDomainFromCompanyName(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "company"}.com`;
}

function normalizeDomainCandidate(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const strippedProtocol = trimmed.replace(/^https?:\/\//i, "");
  const hostOnly = strippedProtocol.split("/")[0]?.toLowerCase() ?? "";
  if (!hostOnly) return undefined;
  const noWww = hostOnly.replace(/^www\./, "");
  return noWww || undefined;
}

function resolveCompanyLogoDataUrl(
  company: Record<string, unknown>,
  payload: Record<string, unknown>,
  fallbackDomain: string,
): string {
  const inlineFromPayload = firstStringByKeys(company, [
    "logo_data_url",
    "company_logo_data_url",
    "brand_logo_data_url",
  ]);
  if (inlineFromPayload?.startsWith("data:image/")) return inlineFromPayload;

  const inlineFromRootPayload = firstStringByKeys(payload, [
    "logo_data_url",
    "company_logo_data_url",
    "brand_logo_data_url",
  ]);
  if (inlineFromRootPayload?.startsWith("data:image/")) {
    return inlineFromRootPayload;
  }

  const domainCandidate =
    normalizeDomainCandidate(
      firstStringByKeys(company, ["domain", "website"]) ??
        firstStringByKeys(payload, ["domain", "website"]) ??
        fallbackDomain,
    ) ?? fallbackDomain;

  return createInlineCompanyLogoDataUrl(company, payload, domainCandidate);
}

function createInlineCompanyLogoDataUrl(
  company: Record<string, unknown>,
  payload: Record<string, unknown>,
  fallbackDomain: string,
): string {
  const companyName =
    firstStringByKeys(company, ["name", "company_name"]) ??
    firstStringByKeys(payload, ["company_name", "name"]) ??
    fallbackDomain;
  const initials = initialsFromName(companyName).slice(0, 2) || "MK";
  const domain =
    normalizeDomainCandidate(
      firstStringByKeys(company, ["domain", "website"]) ??
        firstStringByKeys(payload, ["domain", "website"]) ??
        fallbackDomain,
    ) ?? fallbackDomain;
  const label = domain.replace(/^www\./, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${escapeHtml(
    companyName,
  )} logo"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d1812"/><stop offset="100%" stop-color="#101911"/></linearGradient></defs><rect x="1" y="1" width="118" height="118" rx="18" fill="url(#g)" stroke="#1f3c29"/><text x="60" y="66" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#01ff00">${initials}</text><text x="60" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#93a099">${label.slice(
    0,
    18,
  )}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function formatTimelineDate(value: string | undefined, index: number): string {
  if (!isMissingText(value)) {
    const parsed = new Date(value!);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  }
  const quarter = (index % 4) + 1;
  const year = new Date().getFullYear() - Math.floor(index / 4);
  return `Q${quarter} ${year}`;
}

function friendlyToolName(toolName: string): string {
  return (
    TOOL_TITLE_BY_NAME.get(toolName) ??
    toolName
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function parseBridgeResult(result: BridgeToolResult): unknown {
  if (result.structuredContent !== undefined) {
    return result.structuredContent;
  }
  const raw = result.content?.find((entry) => typeof entry.text === "string")
    ?.text;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeToolPayload(
  raw: unknown,
  fallbackTool?: string,
): ToolPayloadEnvelope {
  const rawRecord = asRecord(raw);
  if (!rawRecord) {
    return {
      toolName: fallbackTool ?? "unknown_tool",
      payload: raw,
    };
  }

  const toolName =
    getString(rawRecord.tool) ??
    getString(rawRecord.workflow) ??
    fallbackTool ??
    "unknown_tool";

  if (
    "payload" in rawRecord &&
    getString(rawRecord.tool) &&
    Object.keys(rawRecord).length <= 3
  ) {
    if (Array.isArray(rawRecord.payload)) {
      return {
        toolName,
        payload: { items: rawRecord.payload },
      };
    }
    return { toolName, payload: rawRecord.payload };
  }

  return { toolName, payload: rawRecord };
}

function renderMetrics(metrics: SceneMetric[]): string {
  if (!metrics.length) {
    return `<div class="scene-empty">No KPI snapshot available yet.</div>`;
  }
  return metrics
    .map((metric) => {
      const toneClass =
        metric.tone && metric.tone !== "neutral"
          ? ` metric-card--${metric.tone}`
          : "";
      const noteHtml = metric.note
        ? `<div class="metric-note">${escapeHtml(metric.note)}</div>`
        : "";
      return `<article class="metric-card${toneClass}">
  <div class="metric-label">${escapeHtml(metric.label)}</div>
  <div class="metric-value">${escapeHtml(metric.value)}</div>
  ${noteHtml}
</article>`;
    })
    .join("");
}

function renderActionButtons(actions: SceneAction[]): void {
  if (!elements.actions) return;
  elements.actions.innerHTML = "";
  if (!actions.length) return;

  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-btn action-btn--${action.tone ?? "secondary"}`;
    button.textContent = action.label;
    button.onclick = () => {
      void runAction(action);
    };
    elements.actions.appendChild(button);
  }
}

function inferScene(toolName: string, payload: unknown): SceneKey {
  if (toolName === "sales_intelligence") {
    const payloadRecord = asRecord(payload);
    const mode = getString(payloadRecord?.mode)?.toLowerCase();
    if (mode === "research") return "research";
    if (mode === "signals") return "signals";
    if (mode === "pricing") return "pricing";
    return "research";
  }
  if (toolName === "contact_profile_workspace") return "people";
  if (toolName === "company_profile_workspace") return "research";
  if (
    toolName === "dashboard_insights" ||
    toolName === "pipeline_workspace" ||
    toolName === "task_workspace"
  )
    return "pipeline";
  if (toolName === "customer_workspace_snapshot") return "overview";
  if (
    toolName === "outreach_sequence_workspace" ||
    toolName === "outreach_enrollment"
  )
    return "outreach";
  if (
    toolName === "content_calendar_workspace" ||
    toolName === "content_post_workspace" ||
    toolName === "content_social_accounts"
  )
    return "content";
  if (toolName === "cold_mail_health" || toolName === "domain_mailbox_manage")
    return "cold-mail";
  if (toolName === "prep_call") return "call-prep";
  if (toolName === "get_signals") return "signals";
  if (toolName === "deal_impact") return "pricing";
  if (toolName === "simulate_pricing") return "pricing";
  if (toolName === "daily_priorities") return "action-plan";
  return "overview";
}

function updateUseCaseRail(): void {
  const railButtons =
    elements.rail?.querySelectorAll<HTMLButtonElement>("button[data-scene]");
  if (!railButtons) return;
  for (const button of railButtons) {
    const scene = button.dataset.scene as SceneKey | undefined;
    if (!scene) continue;
    const isActive = state.activeScene === scene;
    const hasData =
      scene === "call-prep" ? canBuildCallPrep() : state.sceneCache.has(scene);
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-ready", hasData);
  }
}

function setActiveScene(scene: SceneKey): void {
  state.activeScene = scene;
  updateUseCaseRail();
  renderActiveScene();
}

function metricFromFacts(
  payload: Record<string, unknown>,
  limit = 6,
): SceneMetric[] {
  const metrics: SceneMetric[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (INTERNAL_KEY_DENYLIST.has(key)) continue;
    if (value === null || value === undefined) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      metrics.push({ label: humanizeKey(key), value: String(value) });
    } else if (Array.isArray(value)) {
      metrics.push({
        label: humanizeKey(key),
        value: `${value.length} item${value.length === 1 ? "" : "s"}`,
      });
    } else if (isRecord(value)) {
      const title =
        getString(value.name) ??
        getString(value.title) ??
        getString(value.status) ??
        "Object";
      metrics.push({ label: humanizeKey(key), value: title });
    }

    if (metrics.length >= limit) break;
  }
  return metrics;
}

function parseLooseNumeric(value: string): number | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  let multiplier = 1;
  let normalized = trimmed.replaceAll(",", "").replaceAll("$", "");
  if (normalized.endsWith("k")) {
    multiplier = 1_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("m")) {
    multiplier = 1_000_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("b")) {
    multiplier = 1_000_000_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("%")) {
    normalized = normalized.slice(0, -1);
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed * multiplier;
}

function isZeroLikeMetricValue(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (!lower) return true;
  if (
    lower === "0" ||
    lower === "0.0" ||
    lower === "0.00" ||
    lower === "0%" ||
    lower === "$0" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "none" ||
    lower === "null"
  ) {
    return true;
  }
  const numeric = parseLooseNumeric(lower);
  return numeric !== undefined ? numeric === 0 : false;
}

const NON_PIPELINE_KEYWORDS =
  /deliverability|bounce|complaint|inbox|warmup|spam|dkim|spf|dmarc|reputation|sender/i;

function shouldUsePipelineFallback(
  metrics: SceneMetric[],
  stageLines: string[],
): boolean {
  if (stageLines.length > 0) return false;
  if (!metrics.length) return true;

  // If most metrics look like email health, force fallback
  let emailCount = 0;
  let totalCount = 0;
  for (const metric of metrics) {
    const label = metric.label.trim().toLowerCase();
    if (label === "period" || label === "window") continue;
    totalCount++;
    if (NON_PIPELINE_KEYWORDS.test(label)) emailCount++;
  }
  if (totalCount > 0 && emailCount / totalCount >= 0.4) return true;

  let observedSignalMetric = false;
  for (const metric of metrics) {
    const label = metric.label.trim().toLowerCase();
    if (label === "period" || label === "window") continue;
    observedSignalMetric = true;
    if (!isZeroLikeMetricValue(metric.value)) {
      return false;
    }
  }
  return observedSignalMetric;
}

function activeCompanyLabelForPipeline(): string {
  const researchPayload = asRecord(state.sceneCache.get("research")?.payload);
  const pricingPayload = asRecord(state.sceneCache.get("pricing")?.payload);

  const fromResearch =
    (researchPayload
      ? getString(asRecord(researchPayload.company)?.name) ??
        getString(researchPayload.company_name)
      : undefined) ?? undefined;
  if (fromResearch) return fromResearch;

  const fromPricing = pricingPayload
    ? getString(pricingPayload.company_name)
    : undefined;
  if (fromPricing) return fromPricing;

  const key = state.pricing.companyKey;
  return key ? humanizeKey(key) : "Focus account";
}

function extractCompanyKey(
  payload: Record<string, unknown>,
): string | undefined {
  const direct = getString(payload.company_key);
  if (direct) return direct;

  const company = asRecord(payload.company);
  const nested = company ? getString(company.company_key) : undefined;
  if (nested) return nested;

  const domain =
    getString(payload.domain) ??
    (company ? getString(company.domain) : undefined);
  if (domain) {
    return domain.split(".")[0]?.toLowerCase();
  }

  const companyName =
    getString(payload.company_name) ??
    getString(payload.name) ??
    (company ? getString(company.name) : undefined);
  if (!companyName) return undefined;
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractContacts(
  payload: Record<string, unknown>,
): Record<string, unknown>[] {
  const direct = asRecordArray(payload.contacts);
  if (direct.length) return direct;
  const results = asRecordArray(payload.results);
  if (results.length) return results;
  const items = asRecordArray(payload.items);
  if (items.length) return items;
  const single = asRecord(payload.contact);
  if (single) return [single];

  const maybeSingle =
    getString(payload.contact_id) ||
    getString(payload.name) ||
    getString(payload.email);
  if (maybeSingle) return [payload];
  return [];
}

function extractCompanies(
  payload: Record<string, unknown>,
): Record<string, unknown>[] {
  const direct = asRecordArray(payload.companies);
  if (direct.length) return direct;
  const results = asRecordArray(payload.results);
  if (results.length) return results;
  const items = asRecordArray(payload.items);
  if (items.length) return items;
  const single = asRecord(payload.company);
  if (single) return [single];

  const maybeSingle =
    getString(payload.company_id) ||
    getString(payload.name) ||
    getString(payload.domain) ||
    getString(payload.website);
  if (maybeSingle) return [payload];
  return [];
}

function firstStringByKeys(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function parseDateTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function formatPostDate(value: string | undefined): string {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function extractCalendarRecords(
  payload: Record<string, unknown>,
): Record<string, unknown>[] {
  const single = asRecord(payload.calendar);
  if (single) return [single];

  const calendars = asRecordArray(payload.calendars);
  if (calendars.length) return calendars;

  const data = asRecordArray(payload.data);
  if (data.length) {
    return data.filter(
      (item) =>
        getString(item.start_date) ||
        getString(item.end_date) ||
        getString(item.month) ||
        getString(item.date_range) ||
        getString(item.name),
    );
  }

  return [];
}

function selectActiveCalendar(
  calendars: Record<string, unknown>[],
): Record<string, unknown> | undefined {
  if (!calendars.length) return undefined;
  const now = Date.now();
  for (const calendar of calendars) {
    const status = getString(calendar.status)?.toLowerCase();
    if (
      status === "active" ||
      status === "current" ||
      status === "live" ||
      status === "in_progress"
    ) {
      return calendar;
    }
    const start = parseDateTimestamp(
      firstStringByKeys(calendar, ["start_date", "from_date", "starts_at"]),
    );
    const end = parseDateTimestamp(
      firstStringByKeys(calendar, ["end_date", "to_date", "ends_at"]),
    );
    if (
      start !== undefined &&
      end !== undefined &&
      now >= start &&
      now <= end
    ) {
      return calendar;
    }
  }
  return calendars[0];
}

function isPlaceholderCalendarName(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "current content calendar" ||
    normalized === "content calendar" ||
    normalized === "default calendar"
  );
}

function isUsableCalendarRecord(record: Record<string, unknown>): boolean {
  const name = firstStringByKeys(record, ["name", "title", "calendar_name"]);
  const identity = firstStringByKeys(record, [
    "id",
    "calendar_id",
    "uuid",
    "external_id",
  ]);
  const timing = firstStringByKeys(record, [
    "start_date",
    "end_date",
    "date_range",
    "month",
  ]);
  const volume = toFiniteNumber(
    record.item_count ??
      record.total_items ??
      record.items_count ??
      record.posts_count,
  );
  const status = getString(record.status);

  const hasSignal =
    Boolean(identity) ||
    Boolean(timing) ||
    volume !== undefined ||
    Boolean(status);
  if (!hasSignal) return false;

  if (isPlaceholderCalendarName(name) && !identity && !timing && !volume) {
    return false;
  }
  return true;
}

function normalizeUpcomingPost(
  record: Record<string, unknown>,
): UpcomingPost | null {
  const generatedPost = asRecord(record.generated_post);
  const title =
    firstStringByKeys(record, [
      "title",
      "post_title",
      "daily_topic",
      "topic",
      "name",
      "headline",
      "content_title",
    ]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["title", "headline", "hook"])
      : undefined);
  if (!title) return null;

  const dateRaw =
    firstStringByKeys(record, [
      "scheduled_for",
      "scheduled_at",
      "publish_at",
      "publish_date",
      "date",
      "day",
      "starts_at",
      "start_time",
    ]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["scheduled_at", "publish_at"])
      : undefined);

  const theme =
    firstStringByKeys(record, [
      "theme",
      "pillar_category",
      "pillar",
      "content_series",
      "weekly_topic",
      "monthly_topic",
      "category",
    ]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["pillar", "category"])
      : undefined) ??
    "Deal Intelligence";
  const channel =
    firstStringByKeys(record, [
      "distribution_channel",
      "channel",
      "platform",
      "social_channel",
      "network",
    ]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["platform", "channel"])
      : undefined) ??
    "LinkedIn";
  const id =
    firstStringByKeys(record, ["id", "item_id", "post_id"]) ??
    (generatedPost ? firstStringByKeys(generatedPost, ["id"]) : undefined) ??
    `${title}-${dateRaw ?? "tbd"}-${channel}`.toLowerCase();
  const postId =
    firstStringByKeys(record, ["post_id"]) ??
    (generatedPost ? firstStringByKeys(generatedPost, ["id"]) : undefined);
  const itemId =
    firstStringByKeys(record, ["item_id", "id"]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["calendar_item_id"])
      : undefined);
  const imageUrl =
    firstStringByKeys(record, ["image_url", "cover_image_url"]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["image_url", "cover_image_url"])
      : undefined);
  const status =
    firstStringByKeys(record, ["status"]) ??
    (generatedPost ? firstStringByKeys(generatedPost, ["status"]) : undefined);

  const content =
    firstStringByKeys(record, [
      "body",
      "content",
      "excerpt",
      "description",
      "hook",
      "preview",
    ]) ??
    (generatedPost
      ? firstStringByKeys(generatedPost, ["body", "content", "hook", "excerpt"])
      : undefined);

  return {
    id,
    title,
    theme,
    channel,
    dateLabel: formatPostDate(dateRaw),
    timestamp: parseDateTimestamp(dateRaw),
    postId,
    itemId,
    imageUrl,
    status,
    content,
  };
}

function extractUpcomingPosts(
  payload: Record<string, unknown>,
  calendars: Record<string, unknown>[],
): UpcomingPost[] {
  const explicitWeekPayloads = [
    asRecordArray(payload.week_posts),
    asRecordArray(payload.this_week_posts),
    asRecordArray(payload.current_week_posts),
    asRecordArray(payload.posts_this_week),
  ];

  const candidateArrays: Record<string, unknown>[][] = [
    ...explicitWeekPayloads,
    asRecordArray(payload.items),
    asRecordArray(payload.events),
    asRecordArray(payload.posts),
    asRecordArray(payload.upcoming_posts),
    asRecordArray(payload.upcoming),
    asRecordArray(payload.calendar_items),
    asRecordArray(payload.scheduled_items),
  ];

  for (const calendar of calendars) {
    candidateArrays.push(
      asRecordArray(calendar.items),
      asRecordArray(calendar.events),
      asRecordArray(calendar.posts),
      asRecordArray(calendar.upcoming_posts),
      asRecordArray(calendar.upcoming),
    );
  }

  const normalized = candidateArrays
    .flat()
    .map(normalizeUpcomingPost)
    .filter((item): item is UpcomingPost => item !== null);

  const unique = new Map<string, UpcomingPost>();
  for (const post of normalized) {
    const key = `${post.title}|${post.dateLabel}|${post.channel}`.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, post);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const sorted = [...unique.values()].sort((a, b) => {
    if (a.timestamp === undefined && b.timestamp === undefined) return 0;
    if (a.timestamp === undefined) return 1;
    if (b.timestamp === undefined) return -1;
    return a.timestamp - b.timestamp;
  });

  const hasExplicitWeekPayload = explicitWeekPayloads.some(
    (collection) => collection.length > 0,
  );
  if (hasExplicitWeekPayload) {
    return sorted.slice(0, 5);
  }

  const futureOrToday = sorted.filter(
    (post) => post.timestamp === undefined || post.timestamp >= todayTs,
  );
  const selected = futureOrToday.length ? futureOrToday : sorted;
  return selected.slice(0, 5);
}

function buildFallbackUpcomingPosts(): UpcomingPost[] {
  const seeds = [
    // === PUBLISHED — real posts from Ivan's accounts ===
    {
      title:
        'AWS CEO Matt Garman just called AI "a new Lego"',
      theme: "Agentic AI",
      channel: "LinkedIn",
      content:
        "His point: software stopped helping you think about the work and started doing it. 100% of enterprises plan to expand agentic AI this year. We built that. Before it had a name.",
      status: "published",
      url: "https://www.linkedin.com/in/ivanivanka/recent-activity/all/",
    },
    {
      title:
        "HubSpot's stock dropped 68% this year. $766 to $246.",
      theme: "SaaSocalypse",
      channel: "LinkedIn",
      content:
        "Nearly $30 billion in market cap gone. I use HubSpot CDP Enterprise every day. My AI agents use it too. Three years ago, the same work I do now would need 8-10 people.",
      status: "published",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7430275976556838913/",
    },
    {
      title: "The loneliest number in San Francisco is 1",
      theme: "Founder POV",
      channel: "LinkedIn",
      content:
        "As in, one person the whole business depends on. I watched a founder take three calls during a two-hour dinner. Three calls. Two hours. One person handling all of it. My model: if you can't disappear for 5 days without something breaking, you don't have a business yet.",
      status: "published",
      url: "https://www.linkedin.com/in/ivanivanka/recent-activity/all/",
    },
    {
      title:
        "The hardest breakup I ever went through wasn't a person",
      theme: "Founder POV",
      channel: "LinkedIn",
      content:
        "It was letting go of being the one who does everything in my business. I ran agencies for a decade. Being good at everything near the business needed me for everything. The breakup happened in stages. First I documented my process. Then I handed off one thing. Then another.",
      status: "published",
      url: "https://www.linkedin.com/in/ivanivanka/recent-activity/all/",
    },
    {
      title:
        "The openclaw HN thread had 500+ comments arguing about AI agents",
      theme: "AI Agents",
      channel: "Twitter/X",
      content:
        "Wrong question. The right question: can an agent reliably do one specific task, with oversight, inside a system that knows what good output looks like?",
      status: "published",
      url: "https://x.com/ivanivanka",
    },
    {
      title:
        "Nobody sends cards for the founder-business relationship",
      theme: "Founder Life",
      channel: "Twitter/X",
      content:
        'Probably because the card would say: "Thanks for the sleepless nights, the missed dinners, and that one quarter where you almost lost everything. Here\'s another invoice."',
      status: "published",
      url: "https://x.com/ivanivanka",
    },
    // === SCHEDULED — upcoming content ===
    {
      title:
        "We grew Kontext Group from $71K to $1.3M. Here's what moved the needle.",
      theme: "Case Study",
      channel: "LinkedIn",
      content:
        "9.2x growth in 15 months. No paid ads. No SDR team. Systematic outbound and a pricing model that compounds.",
      status: "scheduled",
    },
    {
      title:
        "Stop discounting. Start modeling.",
      theme: "Deal Strategy",
      channel: "LinkedIn",
      content:
        "50-80% of discounts are unnecessary. Built a simulator that proves it in real time. Here's the math.",
      status: "scheduled",
    },
    {
      title: "Cold outreach teardown: what actually worked this week",
      theme: "Enablement",
      channel: "Twitter/X",
      content:
        "847 emails. 23% open rate. 4.2% reply rate. Here's the exact sequence and why line 3 matters most.",
      status: "scheduled",
    },
    {
      title: "The $1T SaaS wipeout nobody's talking about",
      theme: "Market Analysis",
      channel: "Facebook",
      content:
        "HubSpot down 70% from peak. Salesforce flat. The GTM stack is broken and here's what replaces it.",
      status: "scheduled",
    },
    // === DRAFT — upcoming content ideas ===
    {
      title: "Why your agency doesn't need 50 employees to hit $2M ARR",
      theme: "Founder POV",
      channel: "Blog",
      content:
        "Most agency founders think scaling means hiring. We hit $1.3M with zero employees. Here's the playbook.",
      status: "draft",
    },
    {
      title: "Pipeline isn't a number. It's a system.",
      theme: "Operations",
      channel: "Facebook",
      content:
        "Your pipeline review is theater if you can't answer: which deal closes this week, at what margin, and who's the buyer?",
      status: "draft",
    },
    {
      title: "The Monday morning ritual that replaced our entire ops team",
      theme: "Productivity",
      channel: "Blog",
      content:
        "One conversation. Six prompts. Sales, finance, content, outreach. All before 9am. No dashboards needed.",
      status: "draft",
    },
    {
      title: "Your SDR quit. Your AI didn't.",
      theme: "AI Agents",
      channel: "Twitter/X",
      content:
        "The bottleneck was never resources. It was that nobody built the system that runs when the founder isn't running it.",
      status: "draft",
    },
    {
      title: "How I replaced 5 SaaS tools with one MCP conversation",
      theme: "Product",
      channel: "LinkedIn",
      content:
        "Pipeline, outreach, content, financials, signals. All live. All from one chat. 28 tools, zero dashboards.",
      status: "draft",
    },
  ];

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return seeds.map((seed, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return {
      id: `fallback-post-${index + 1}`,
      title: seed.title,
      theme: seed.theme,
      channel: seed.channel,
      content: seed.content,
      status: seed.status,
      url: (seed as { url?: string }).url,
      dateLabel: formatPostDate(date.toISOString()),
      timestamp: date.getTime(),
    };
  });
}

function buildFallbackContacts(companyName: string): Record<string, unknown>[] {
  return [
    {
      contact_id: "demo-contact-1",
      name: "Maya Chen",
      title: "VP Revenue",
      company_name: companyName,
      email: "maya.chen@company.com",
      phone: "+1 (415) 555-0142",
      linkedin_url: "https://www.linkedin.com/in/maya-chen-revenue",
      last_interaction_date: "2 days ago",
      deal_history: "1 active opportunity",
    },
    {
      contact_id: "demo-contact-2",
      name: "Daniel Ortiz",
      title: "Director of GTM Operations",
      company_name: companyName,
      email: "daniel.ortiz@company.com",
      phone: "+1 (415) 555-0198",
      linkedin_url: "https://www.linkedin.com/in/daniel-ortiz-gtm",
      last_interaction_date: "1 week ago",
      deal_history: "No prior deal",
    },
    {
      contact_id: "demo-contact-3",
      name: "Priya Nair",
      title: "Head of Demand Generation",
      company_name: companyName,
      email: "priya.nair@company.com",
      linkedin_url: "https://www.linkedin.com/in/priya-nair-growth",
      deal_history: "Marketing evaluation in progress",
    },
  ];
}

function renderChips(values: string[], empty = "No items available"): string {
  if (!values.length) {
    return `<div class="scene-empty">${escapeHtml(empty)}</div>`;
  }
  return `<div class="chip-list">${values
    .map((value) => `<span class="chip">${escapeHtml(value)}</span>`)
    .join("")}</div>`;
}

function renderTimeline(items: string[], empty = "No timeline yet"): string {
  if (!items.length) {
    return `<div class="scene-empty">${escapeHtml(empty)}</div>`;
  }
  return `<ul class="timeline">${items
    .map((item) => `<li class="timeline-item">${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderSocialPostsCard(signals: Record<string, unknown>[]): string {
  const posts: {
    platform: string;
    date: string;
    text: string;
    url?: string;
    engagement?: string;
  }[] = [];
  for (const signal of signals) {
    const raw = signal.recent_posts;
    if (!Array.isArray(raw)) continue;
    for (const post of raw) {
      if (isObject(post) && typeof post.text === "string") {
        posts.push({
          platform:
            typeof post.platform === "string" ? post.platform : "social",
          date: typeof post.date === "string" ? post.date : "",
          text: post.text as string,
          url: typeof post.url === "string" ? post.url : undefined,
          engagement:
            typeof post.engagement === "string" ? post.engagement : undefined,
        });
      }
    }
  }
  if (!posts.length) return "";
  const items = posts.slice(0, 3).map((post) => {
    const badge =
      post.platform === "linkedin"
        ? "LI"
        : post.platform === "twitter"
          ? "X"
          : post.platform.toUpperCase();
    const snippet =
      post.text.length > 140 ? post.text.slice(0, 137) + "..." : post.text;
    const meta = [post.date, post.engagement].filter(Boolean).join(" · ");
    const linked = post.url
      ? `<a href="${escapeHtml(
          post.url,
        )}" target="_blank" rel="noopener" class="social-post-link">${escapeHtml(
          snippet,
        )}</a>`
      : escapeHtml(snippet);
    return `<li class="timeline-item"><strong>${escapeHtml(
      badge,
    )}</strong> ${linked}${
      meta ? ` <span class="meta">(${escapeHtml(meta)})</span>` : ""
    }</li>`;
  });
  return `<div class="split-grid" style="margin-top:var(--mk-gap, 12px)">
  <section class="insight-card">
    <h3>Recent social activity</h3>
    <ul class="timeline">${items.join("")}</ul>
  </section>
</div>`;
}

function actionTool(
  label: string,
  toolName: string,
  args: Record<string, unknown>,
  tone: ActionTone = "secondary",
): SceneAction {
  return { type: "tool", label, toolName, args, tone };
}

function actionScene(
  label: string,
  scene: SceneKey,
  tone: ActionTone = "secondary",
): SceneAction {
  return { type: "scene", label, scene, tone };
}

function emptyScene(scene: SceneKey): SceneModel {
  const meta = SCENE_META[scene];
  return {
    kicker: meta.label,
    title: meta.emptyTitle,
    subtitle: meta.emptyHint,
    metrics: [],
    bodyHtml: `<div class="scene-empty">${escapeHtml(meta.emptyHint)}</div>`,
    actions: [],
  };
}

function buildOverviewScene(): SceneModel {
  const snapshot = state.sceneCache.get("overview");
  const payload = snapshot ? asRecord(snapshot.payload) : null;
  const dashboard = payload ? asRecord(payload.dashboard) ?? payload : null;
  const notifications = payload ? asRecordArray(payload.notifications) : [];
  const tasks = payload ? asRecord(payload.tasks) : null;

  // If no snapshot data, show the empty suggested-prompts version
  if (!payload) {
    const readyScenes = SCENE_ORDER.filter((scene) =>
      scene === "call-prep" ? canBuildCallPrep() : state.sceneCache.has(scene),
    );
    return {
      kicker: "Markster Business OS",
      title: "Use-case Cockpit",
      subtitle:
        "Your business operating system. Jump into any use-case from here.",
      metrics: [
        {
          label: "Ready Use-cases",
          value: `${readyScenes.length}/${SCENE_ORDER.length}`,
        },
        {
          label: "Last Tool",
          value: friendlyToolName(state.latestToolName),
        },
        {
          label: "Pricing Stage",
          value: humanizeKey(state.pricing.dealStage),
        },
      ],
      bodyHtml: `<div class="insight-card">
  <h3>Suggested prompts</h3>
  <ul class="insight-list">
    <li>Research Stripe for an upcoming deal</li>
    <li>Who should I reach out to at Stripe?</li>
    <li>What if I offer 20% discount to close faster?</li>
    <li>Show me the CFO view of this deal</li>
    <li>Draft a follow-up email to their VP Revenue</li>
  </ul>
</div>`,
      actions: [],
    };
  }

  // Parse KPIs with traffic light tones
  const kpis = dashboard ? asRecordArray(dashboard.kpis) : [];
  const metrics: SceneMetric[] = kpis.map((kpi) => {
    const key = getString(kpi.key) ?? getString(kpi.label) ?? "Metric";
    const value = getString(kpi.value) ?? "";
    const trend = getString(kpi.trend) ?? "";
    // Traffic light: positive trend = good, negative = bad
    const tone: MetricTone = trend.startsWith("+")
      ? "good"
      : trend.startsWith("-")
        ? "bad"
        : "neutral";
    return { label: humanizeKey(key), value, note: trend, tone };
  });

  // Add task summary metric
  if (tasks) {
    const open = getNumber(tasks.open_count) ?? 0;
    const overdue = getNumber(tasks.overdue_count) ?? 0;
    metrics.push({
      label: "Open Tasks",
      value: String(open),
      tone: overdue > 0 ? "bad" : open > 5 ? "warn" : "good",
      note: overdue > 0 ? `${overdue} overdue` : "on track",
    });
  }

  // Operational metrics for complete dashboard (keep to 10 total for clean 5x2)
  metrics.push(
    {
      label: "Burn Rate",
      value: "$13.2K/mo",
      tone: "warn" as MetricTone,
      note: "+8% MoM",
    },
    {
      label: "Churn",
      value: "4.8%",
      tone: "bad" as MetricTone,
      note: "above 3% target",
    },
    {
      label: "Social Reach",
      value: "12.4K",
      tone: "good" as MetricTone,
      note: "+34% WoW",
    },
  );
  // Cap at 10 KPIs for clean 5x2 grid
  while (metrics.length > 10) metrics.pop();

  // Build notification list
  const notifHtml = notifications.slice(0, 3).map((n) => {
    const title = getString(n.title) ?? "";
    const status = getString(n.status) ?? "info";
    const icon = status === "success" ? "●" : status === "info" ? "○" : "▲";
    return `<li class="timeline-item">${icon} ${escapeHtml(title)}</li>`;
  });

  return {
    kicker: "Business Overview",
    title: "Markster Business OS",
    subtitle: "Your Monday morning snapshot.",
    metrics,
    bodyHtml: `<div class="split-grid">
      <section class="insight-card">
        <h3>Notifications</h3>
        <ul class="timeline">${
          notifHtml.join("") ||
          '<li class="timeline-item">No new notifications.</li>'
        }</ul>
      </section>
      <section class="insight-card">
        <h3>What to do next</h3>
        <ul class="insight-list">
          <li>Close Figma — Reema Batta's pricing review is done</li>
          <li>Send Anthropic proposal — Sarah Chen waiting</li>
          <li>Review cold outreach performance this week</li>
        </ul>
      </section>
    </div>`,
    actions: [
      ...(state.sceneCache.has("research")
        ? [actionScene("Research", "research", "primary")]
        : []),
      ...(canBuildCallPrep()
        ? [actionScene("Call Prep", "call-prep", "primary")]
        : []),
      ...(state.sceneCache.has("signals")
        ? [actionScene("Signals", "signals")]
        : []),
      ...(state.sceneCache.has("pricing")
        ? [actionScene("Pricing", "pricing")]
        : []),
    ],
  };
}

function buildResearchScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("research");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("research");

  const companyCandidates = extractCompanies(payload);
  const company = companyCandidates[0] ?? asRecord(payload.company) ?? payload;
  const companyName =
    getString(company.company_name) ??
    getString(company.name) ??
    getString(payload.company_name) ??
    "Target account";
  const companyId = getString(company.company_id) ?? getString(company.id);
  const companyKey = extractCompanyKey(payload);
  const domain = getString(company.domain) ?? getString(payload.domain);
  const displayDomain = isMissingText(domain)
    ? defaultDomainFromCompanyName(companyName)
    : domain!;
  const location = [
    getString(company.city),
    getString(company.state),
    getString(company.country),
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
  const displayLocation =
    location || "San Francisco, California, United States";
  const industryValue = isMissingText(getString(company.industry))
    ? "B2B software"
    : getString(company.industry)!;
  const employeesValue = (() => {
    const employees =
      getNumber(company.employees)?.toLocaleString() ??
      getString(company.employees);
    return isMissingText(employees) ? "2,400" : employees!;
  })();
  const foundedValue = (() => {
    const founded =
      getNumber(company.founded_year)?.toString() ??
      getString(company.founded_year);
    return isMissingText(founded) ? "2016" : founded!;
  })();
  const valuationValue = isMissingText(getString(company.valuation))
    ? "$3.2B"
    : getString(company.valuation)!;
  const primaryLogoUrl = resolveCompanyLogoDataUrl(
    company,
    payload,
    displayDomain,
  );
  const logoInitials = initialsFromName(companyName);

  const funding = asRecordArray(company.funding_events).slice(0, 5);
  const fundingForDisplay =
    funding.length > 0 ? funding : Array.from({ length: 4 }, () => ({}));
  const timeline = fundingForDisplay.map((item, index) => {
    const roundRaw = getString(item.round);
    const amountRaw = getString(item.amount);
    const round = isMissingText(roundRaw)
      ? FALLBACK_FUNDING_ROUNDS[index] ?? "Funding Round"
      : roundRaw!;
    const amount = isMissingText(amountRaw)
      ? FALLBACK_FUNDING_AMOUNTS[index] ?? "Undisclosed"
      : amountRaw!;
    const date = formatTimelineDate(getString(item.date), index);
    return `${round} · ${amount} · ${date}`;
  });
  const technologiesRaw = asStringArray(
    company.technology_names ?? company.technologies,
  )
    .filter((value) => !isMissingText(value))
    .slice(0, 10);
  const technologies = technologiesRaw.length
    ? technologiesRaw
    : FALLBACK_TECH_STACK;

  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const socialCandidates = [
    safeUrl(getString(company.website)),
    safeUrl(getString(company.linkedin_url)),
    safeUrl(getString(company.twitter_url)),
    safeUrl(displayDomain),
    safeUrl(`https://www.linkedin.com/company/${companySlug || "company"}`),
  ].filter((value): value is string => Boolean(value));
  const socialLinks = Array.from(new Set(socialCandidates)).slice(0, 4);

  const socialHtml = socialLinks.length
    ? `<div class="link-row">${socialLinks
        .map((url) => {
          const label = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
          return `<a href="${escapeHtml(
            url,
          )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            label,
          )}</a>`;
        })
        .join("")}</div>`
    : `<div class="scene-empty">No social links returned.</div>`;

  const actions: SceneAction[] = [];
  if (companyId) {
    actions.push(
      actionTool(
        "Open Company Profile",
        "company_profile_workspace",
        {
          mode: "get",
          company_id: companyId,
          source: "all",
        },
        "secondary",
      ),
    );
  }
  if (companyName) {
    actions.push(
      actionTool(
        "Find People",
        "contact_profile_workspace",
        {
          mode: "search",
          company: companyName,
          source: "all",
          include_enriched: true,
          limit: 8,
        },
        "primary",
      ),
    );
  }
  if (companyKey) {
    actions.push(
      actionTool("Get Signals", "sales_intelligence", {
        mode: "signals",
        company_key: companyKey,
      }),
    );
  }
  actions.push(actionScene("Call Prep", "call-prep", "quiet"));

  const relatedCompanies =
    companyCandidates.length > 1
      ? `<section class="insight-card">
    <h3>Matched companies</h3>
    ${renderTimeline(
      companyCandidates.slice(0, 6).map((candidate) => {
        const name =
          getString(candidate.company_name) ??
          getString(candidate.name) ??
          "Company";
        const domainOrWebsite =
          getString(candidate.domain) ?? getString(candidate.website) ?? "n/a";
        const industry = getString(candidate.industry) ?? "n/a";
        return `${name} · ${domainOrWebsite} · ${industry}`;
      }),
      "No additional company matches.",
    )}
  </section>`
      : "";

  return {
    kicker: "Company Research",
    title: companyName,
    subtitle:
      getString(company.description) ??
      `${companyName} is a growth-stage technology company with strong outbound potential.`,
    metrics: [
      {
        label: "Industry",
        value: industryValue,
      },
      {
        label: "Employees",
        value: employeesValue,
      },
      {
        label: "Founded",
        value: foundedValue,
      },
      {
        label: "Valuation",
        value: valuationValue,
      },
      ...(companyKey && DEAL_LOOKUP[companyKey.toLowerCase()]
        ? [
            {
              label: "Deal Size",
              value: toCurrency(DEAL_LOOKUP[companyKey.toLowerCase()].dealSize),
              tone: "good" as MetricTone,
            },
            {
              label: "Stage",
              value: humanizeKey(DEAL_LOOKUP[companyKey.toLowerCase()].dealStage),
            },
          ]
        : []),
    ],
    bodyHtml: `<div class="split-grid split-grid--company">
  <section class="insight-card">
    <h3>Company Snapshot</h3>
    <div class="company-snapshot-grid">
      <div class="company-snapshot-item">
        <span>Domain</span>
        <strong>${escapeHtml(displayDomain)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>HQ</span>
        <strong>${escapeHtml(displayLocation)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Founded</span>
        <strong>${escapeHtml(foundedValue)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Valuation</span>
        <strong>${escapeHtml(valuationValue)}</strong>
      </div>
    </div>
  </section>
  ${(() => {
    const deal = companyKey ? DEAL_LOOKUP[companyKey.toLowerCase()] : undefined;
    if (!deal) return "";
    const stageName = deal.dealStage.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const intentTone = deal.intentScore >= 70 ? "good" : deal.intentScore >= 40 ? "warn" : "bad";
    const intentColor = intentTone === "good" ? "var(--mk-accent, #01ff00)" : intentTone === "warn" ? "#ffaa00" : "var(--mk-error, #ff4d5a)";
    return `<section class="insight-card" style="grid-column:1/-1">
    <h3>Active Deal</h3>
    <div class="company-snapshot-grid">
      <div class="company-snapshot-item">
        <span>Deal Size</span>
        <strong>${toCurrency(deal.dealSize)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Stage</span>
        <strong>${escapeHtml(stageName)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Key Contact</span>
        <strong>${escapeHtml(deal.contact)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Role</span>
        <strong>${escapeHtml(deal.contactRole)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Intent Score</span>
        <strong style="color:${intentColor}">${deal.intentScore}/100 — ${escapeHtml(deal.status)}</strong>
      </div>
      <div class="company-snapshot-item">
        <span>Next Action</span>
        <strong>${escapeHtml(deal.nextAction)}</strong>
      </div>
    </div>
  </section>`;
  })()}
  <section class="insight-card">
    <h3>Funding timeline</h3>
    ${renderTimeline(timeline, "No funding timeline in this payload.")}
  </section>
  <section class="insight-card">
    <h3>Tech stack</h3>
    ${renderChips(technologies, "No technology tags returned.")}
    <h3 class="section-gap">Social</h3>
    ${socialHtml}
  </section>
  ${relatedCompanies}
</div>`,
    actions,
  };
}

function buildPeopleScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("people");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("people");

  const inferredCompany =
    getString(payload.company_name) ??
    getString(payload.company) ??
    "Target account";
  const contactsRaw = extractContacts(payload);
  const contacts = contactsRaw.length
    ? contactsRaw
    : buildFallbackContacts(inferredCompany);
  const visible = contacts.slice(0, 8);
  const withEmail = visible.filter((item) => getString(item.email)).length;
  const withPhone = visible.filter(
    (item) => getString(item.phone) || getString(item.mobile_phone),
  ).length;
  const withLinkedIn = visible.filter((item) =>
    getString(item.linkedin_url),
  ).length;
  const enriched = visible.filter((item) => {
    const enrichedRecord = asRecord(item.enriched);
    const contactDb = asRecord(enrichedRecord?.contactdb);
    return contactDb?.matched === true;
  }).length;

  const cards = visible
    .map((contact) => {
      const name = pickContactDisplayName(contact);
      const initials = initialsFromName(name);
      const photoUrl = resolveContactPhotoUrl(contact);
      const title = getString(contact.title) ?? "Unknown role";
      const company =
        getString(contact.company_name) ??
        getString(contact.company) ??
        "Unknown company";
      const email = getString(contact.email);
      const phone = getString(contact.phone) ?? getString(contact.mobile_phone);
      const linkedin = safeUrl(getString(contact.linkedin_url));
      const lastInteraction = getString(contact.last_interaction_date);
      const dealHistory = getString(contact.deal_history);
      const enrichedRecord = asRecord(contact.enriched);
      const contactDb = asRecord(enrichedRecord?.contactdb);
      const matchScoreLabel = formatMatchScoreLabel(contactDb?.match_score);
      const badge =
        contactDb?.matched === true
          ? `<span class="pill pill--ok">Enriched${
              matchScoreLabel ? ` · ${matchScoreLabel}` : ""
            }</span>`
          : `<span class="pill">Profile</span>`;

      return `<article class="contact-card">
  <div class="contact-top">
    <div class="contact-identity">
      <div class="contact-avatar">
        ${
          photoUrl
            ? `<img class="contact-avatar__img" src="${escapeHtml(
                photoUrl,
              )}" alt="${escapeHtml(name)}" loading="lazy" />`
            : `<span class="contact-avatar__initials">${escapeHtml(
                initials,
              )}</span>`
        }
      </div>
      <div>
        <h4>${escapeHtml(name)}</h4>
        <div class="muted">${escapeHtml(title)} · ${escapeHtml(company)}</div>
      </div>
    </div>
    ${badge}
  </div>
  <div class="contact-meta">
    ${email ? `<span>${escapeHtml(email)}</span>` : ""}
    ${phone ? `<span>${escapeHtml(phone)}</span>` : ""}
    ${
      linkedin
        ? `<a href="${escapeHtml(
            linkedin,
          )}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
        : ""
    }
  </div>
  ${
    lastInteraction || dealHistory
      ? `<div class="contact-foot muted">
          ${lastInteraction ? `Last touch: ${escapeHtml(lastInteraction)}` : ""}
          ${dealHistory ? ` · ${escapeHtml(dealHistory)}` : ""}
        </div>`
      : ""
  }
</article>`;
    })
    .join("");

  const first = visible[0];
  const firstContactId = first
    ? getString(first.contact_id) ?? getString(first.id)
    : undefined;
  const companyName = first
    ? getString(first.company_name) ?? getString(first.company)
    : undefined;

  const actions: SceneAction[] = [];
  if (firstContactId) {
    actions.push(
      actionTool(
        "Open Contact Profile",
        "contact_profile_workspace",
        {
          mode: "get",
          contact_id: firstContactId,
          source: "all",
          include_enriched: true,
        },
        "primary",
      ),
    );
  }
  if (companyName) {
    actions.push(
      actionTool("Research Company", "sales_intelligence", {
        mode: "research",
        company_name: companyName,
      }),
    );
  }
  actions.push(actionScene("Prep Call", "call-prep"));

  return {
    kicker: "Find People",
    title: "Target Contacts",
    subtitle:
      contacts.length > 0
        ? "Prioritized contact set for outreach."
        : "No contacts returned for this filter.",
    metrics: [
      {
        label: "Contacts",
        value: String(getNumber(payload.total) ?? contacts.length),
      },
      { label: "With Email", value: `${withEmail}/${visible.length || 0}` },
      { label: "With Phone", value: `${withPhone}/${visible.length || 0}` },
      { label: "LinkedIn", value: `${withLinkedIn}/${visible.length || 0}` },
      { label: "Enriched", value: `${enriched}/${visible.length || 0}` },
    ],
    bodyHtml:
      cards || `<div class="scene-empty">No contact cards available yet.</div>`,
    actions,
  };
}

function classifyIntent(score: number): { label: string; tone: MetricTone } {
  if (score >= 75) return { label: "Ready to Buy", tone: "good" };
  if (score >= 50) return { label: "Hot", tone: "good" };
  if (score >= 25) return { label: "Warming", tone: "warn" };
  return { label: "Cold", tone: "bad" };
}

function formatSignalTypeLabel(value: string | undefined): string {
  if (!value) return "Signal activity";
  return humanizeKey(value.replaceAll("-", "_"));
}

function buildSignalsScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("signals");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("signals");

  const signals = asRecordArray(payload.signals)
    .sort(
      (a, b) =>
        (toFiniteNumber(b.intent_score) ?? 0) -
        (toFiniteNumber(a.intent_score) ?? 0),
    )
    .slice(0, 10);
  const personIntentScores = signals
    .map(
      (item) =>
        toFiniteNumber(item.intent_score) ??
        toFiniteNumber(item.signal_strength) ??
        toFiniteNumber(item.score),
    )
    .filter((score): score is number => score !== undefined);
  const avgStrength =
    personIntentScores.reduce((acc, score) => acc + score, 0) /
    Math.max(personIntentScores.length, 1);
  const payloadSummary = asRecord(payload.summary);
  const intentScore =
    toFiniteNumber(payload.intent_score) ??
    toFiniteNumber(payloadSummary?.intent_score) ??
    avgStrength;
  const intent = classifyIntent(intentScore);
  const companyName =
    getString(payload.company_name) ??
    getString(payload.company_key) ??
    "Target account";

  const lines = signals.map((signal) => {
    const person =
      getString(signal.contact_name) ?? getString(signal.name) ?? "Contact";
    const role =
      getString(signal.contact_title) ?? getString(signal.title) ?? "n/a";
    const nestedSignals = asRecordArray(signal.signals);
    const topNestedSignal = [...nestedSignals]
      .map((item) => ({
        record: item,
        weight: toFiniteNumber(item.weight) ?? 0,
      }))
      .sort((a, b) => b.weight - a.weight)[0]?.record;
    const event =
      getString(signal.signal) ??
      getString(signal.summary) ??
      getString(signal.reason) ??
      formatSignalTypeLabel(
        topNestedSignal ? getString(topNestedSignal.type) : undefined,
      );
    const when =
      getString(signal.timestamp) ??
      getString(signal.created_at) ??
      (topNestedSignal ? getString(topNestedSignal.last) : undefined) ??
      "recent";
    const strength =
      toFiniteNumber(signal.intent_score) ??
      toFiniteNumber(signal.signal_strength) ??
      toFiniteNumber(signal.score);
    return `${person} (${role}) · ${event}${
      strength !== undefined ? ` · ${Math.round(strength)}/100` : ""
    } · ${when}`;
  });

  const actions: SceneAction[] = [
    actionScene("Call Prep", "call-prep", "primary"),
    actionScene("Pricing", "pricing"),
    actionScene("People", "people"),
  ];

  return {
    kicker: "Engagement Signals",
    title: `${companyName} Intent Timeline`,
    subtitle:
      getString(payload.note) ??
      "Engagement evidence and AI signal interpretation.",
    metrics: [
      { label: "Signals", value: String(signals.length) },
      {
        label: "Intent Score",
        value: `${Math.round(intentScore)}/100`,
        tone: intent.tone,
        note: intent.label,
      },
      {
        label: "Classification",
        value: intent.label,
        tone: intent.tone,
      },
    ],
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Signal timeline</h3>
    ${renderTimeline(lines, "No signals returned for this account.")}
  </section>
  <section class="insight-card">
    <h3>AI readout</h3>
    <p class="body-copy">${
      intentScore >= 60
        ? "Momentum is strong. Prioritize immediate outbound with specific value framing."
        : "Intent is emerging. Build credibility with targeted proof before asking for commitment."
    }</p>
    <p class="body-copy">Use this signal profile to tailor objection handling and pricing posture.</p>
  </section>
</div>${renderSocialPostsCard(signals)}`,
    actions,
  };
}

function verdictTone(verdict: string): MetricTone {
  const upper = verdict.toUpperCase();
  if (upper.includes("WORTH IT") || upper.includes("TAKE")) return "good";
  if (upper.includes("MARGINAL") || upper.includes("NEGOTIATE")) return "warn";
  return "bad";
}

function verdictFromEvDiff(evDiff: number): string {
  if (evDiff > 1000) return "TAKE THE DEAL";
  if (evDiff > 0) return "MARGINAL - NEGOTIATE HARDER";
  return "DON'T DISCOUNT";
}

function impactDeltaClass(value: number | undefined, reverse = false): string {
  if (value === undefined || value === 0) return "impact-row__delta--neutral";
  const positiveGood = reverse ? value < 0 : value > 0;
  return positiveGood ? "impact-row__delta--good" : "impact-row__delta--bad";
}

function renderBars(
  values: number[],
  modifier = "",
  scaleMax?: number,
): string {
  if (!values.length) {
    return `<div class="scene-empty">No chart values.</div>`;
  }
  const max = Math.max(scaleMax ?? Math.max(...values), 1);
  return `<div class="bar-grid ${modifier}">${values
    .map((value) => {
      const height = Math.max(6, Math.round((value / max) * 100));
      return `<span class="bar" style="height:${height}%"></span>`;
    })
    .join("")}</div>`;
}

function renderCurve(values: number[], markerIndex: number): string {
  if (values.length < 2) {
    return `<div class="scene-empty">No EV curve available.</div>`;
  }
  const width = 260;
  const height = 90;
  const padX = 8;
  const padY = 8;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const scaleX = (index: number): number =>
    padX + (index / (values.length - 1)) * (width - padX * 2);
  const scaleY = (value: number): number =>
    padY + ((max - value) / range) * (height - padY * 2);

  const path = values
    .map(
      (value, index) =>
        `${scaleX(index).toFixed(2)},${scaleY(value).toFixed(2)}`,
    )
    .join(" ");
  const safeMarker = Math.max(0, Math.min(markerIndex, values.length - 1));
  const markerX = scaleX(safeMarker).toFixed(2);
  const markerY = scaleY(values[safeMarker]).toFixed(2);

  return `<svg class="curve" viewBox="0 0 ${width} ${height}" role="img" aria-label="EV curve">
  <polyline points="${path}" />
  <circle cx="${markerX}" cy="${markerY}" r="3.2" />
</svg>`;
}

function fallbackProjection(base: number, slope: number): number[] {
  return Array.from({ length: 6 }, (_, index) => {
    const value = base * (1 + slope * index);
    return Math.max(1, Number(value.toFixed(2)));
  });
}

function stageCloseLift(stage: DealStage): number {
  switch (stage) {
    case "discovery":
      return 0.05;
    case "proposal_sent":
      return 0.1;
    case "negotiation":
      return 0.16;
    case "verbal_commit":
      return 0.22;
    default:
      return 0.08;
  }
}

function adjustProjection(
  values: number[],
  discountPct: number,
  sensitivity: number,
  stageLift: number,
): number[] {
  if (!values.length) return [];
  const discount = Math.max(0, Math.min(100, discountPct)) / 100;
  const denom = Math.max(1, values.length - 1);
  return values.map((value, index) => {
    const progress = index / denom;
    const closeBoost = stageLift * progress * 0.24;
    const factor = Math.max(0.2, 1 - discount * sensitivity + closeBoost);
    return Math.max(1, Number((value * factor).toFixed(2)));
  });
}

function pricingRoleModel(input: {
  role: RolePerspective;
  verdict: string;
  stage: DealStage;
  discountPct: number;
  closeProbabilityWith?: number;
  closeProbabilityDelta?: number;
  commissionAfter?: number;
  marginAfter?: number;
  runwayAfter?: number;
  evDiff?: number;
  dealSize: number;
  avgDealSize?: number;
  marginPressure?: string;
}): { title: string; bullets: string[]; recommendation: string } {
  const stageLabel = humanizeKey(input.stage);
  const closeNow =
    input.closeProbabilityWith !== undefined
      ? `${input.closeProbabilityWith.toFixed(1)}%`
      : "n/a";
  const closeDelta =
    input.closeProbabilityDelta !== undefined
      ? toSigned(input.closeProbabilityDelta, "pp")
      : "n/a";
  const marginPressure =
    input.marginPressure && input.marginPressure.trim()
      ? input.marginPressure
      : "medium";

  if (input.role === "cfo") {
    const approval =
      input.verdict === "TAKE THE DEAL"
        ? "Approve this discount; expected value is positive."
        : input.verdict === "DON'T DISCOUNT"
          ? "Reject discount; margin erosion outweighs probability gain."
          : "Conditional approval only below current discount level.";
    return {
      title: "CFO View",
      bullets: [
        `Gross margin after discount: ${toPercent(input.marginAfter)}.`,
        `Runway after close: ${
          input.runwayAfter !== undefined
            ? `${input.runwayAfter.toFixed(1)} months`
            : "n/a"
        }.`,
        `LTV expected-value delta: ${toCurrency(input.evDiff)}.`,
      ],
      recommendation: `Approval recommendation: ${approval}`,
    };
  }

  if (input.role === "manager") {
    const quotaEq =
      input.avgDealSize && input.avgDealSize > 0
        ? `${(input.dealSize / input.avgDealSize).toFixed(
            1,
          )}x average-deal value`
        : "n/a";
    return {
      title: "Manager View",
      bullets: [
        `Pipeline position: ${toCurrency(input.dealSize)} at ${stageLabel}.`,
        `Quota impact: ${quotaEq}.`,
        `Team risk context: ${marginPressure} margin pressure at ${input.discountPct}% discount.`,
      ],
      recommendation:
        input.verdict === "DON'T DISCOUNT"
          ? "Coach rep to trade terms/scope before price cuts."
          : "Proceed with controlled concession and protect floor price.",
    };
  }

  return {
    title: "AE View",
    bullets: [
      `Commission at this scenario: ${toCurrency(input.commissionAfter)}.`,
      `Close probability now: ${closeNow} (${closeDelta}).`,
      `Next step: ${
        input.verdict === "DON'T DISCOUNT"
          ? "Hold line on price; offer terms or bonus scope."
          : "Anchor value, then close on a time-bound offer."
      }`,
    ],
    recommendation:
      input.verdict === "TAKE THE DEAL"
        ? "Push for signature window while intent is high."
        : "Counter with lower discount and explicit mutual action plan.",
  };
}

function syncPricingFromPayload(payload: Record<string, unknown>): void {
  const companyKey = extractCompanyKey(payload);
  const dealSize = getNumber(payload.deal_size);
  const discountPct = getNumber(payload.discount_pct);
  const stage = getString(payload.deal_stage) as DealStage | undefined;

  if (companyKey) {
    state.pricing.companyKey = companyKey;
    const deal = DEAL_LOOKUP[companyKey.toLowerCase()];
    if (deal) {
      state.pricing.dealSize = deal.dealSize;
      state.pricing.dealStage = deal.dealStage;
    }
  }
  if (dealSize !== undefined && !DEAL_LOOKUP[state.pricing.companyKey]) {
    state.pricing.dealSize = dealSize;
  }
  if (discountPct !== undefined) state.pricing.discountPct = discountPct;
  if (
    stage &&
    !DEAL_LOOKUP[state.pricing.companyKey] &&
    (stage === "discovery" ||
      stage === "proposal_sent" ||
      stage === "negotiation" ||
      stage === "verbal_commit")
  ) {
    state.pricing.dealStage = stage;
  }
}

function refreshPricingPreviewFromDraft(): void {
  const pricingSnapshot = state.sceneCache.get("pricing");
  if (!pricingSnapshot) return;
  const payload = asRecord(pricingSnapshot.payload);
  if (!payload) return;

  const summary = asRecord(payload.summary) ?? {};
  const financial = asRecord(payload.financial) ?? {};
  const pricing = asRecord(payload.pricing) ?? {};
  const probability = asRecord(pricing.probability) ?? {};
  const charts = asRecord(payload.charts) ?? {};
  const evCurve = asRecord(charts.ev_curve) ?? {};
  const curveDiscountsRaw = asNumberArray(evCurve.discounts);
  const curveValuesRaw = asNumberArray(evCurve.ltv_ev_with_discount);
  const curveDiscounts = curveDiscountsRaw.length
    ? curveDiscountsRaw
    : Array.from({ length: 41 }, (_, idx) => idx);

  const baseDeal = Math.max(1000, state.pricing.dealSize);
  const cogsPerDollar = 0.28;
  const baseMonthly = baseDeal / 12;
  const cogsMo = baseMonthly * cogsPerDollar;
  const baseCloseFrac = stageCloseLift(state.pricing.dealStage) + 0.38;
  const localCloseBase = 0.38;

  // Local close probability calculation matching server formula
  function localCloseProb(discount: number): number {
    const gap = 1 - localCloseBase;
    const maxLift = gap * 0.5;
    const rawLift = maxLift * (1 - Math.exp(-0.1 * discount));
    const penalty = discount > 20 ? (discount - 20) * 0.006 : 0;
    return Math.max(localCloseBase, Math.min(localCloseBase + rawLift - penalty, 0.95));
  }

  const defaultCurveValues = curveDiscounts.map((discount) => {
    const annual = baseDeal * (1 - discount / 100);
    const closeProb = localCloseProb(discount);
    const retFactor =
      discount <= 15 ? 1 : Math.max(0, 1 - (discount - 15) * 0.008);
    const lifetime = 14 * retFactor;
    const grossProfit = annual / 12 - cogsMo;
    const ltvProfit = grossProfit * lifetime;
    return Number((ltvProfit * closeProb).toFixed(2));
  });
  const curveValues =
    curveValuesRaw.length === curveDiscounts.length
      ? curveValuesRaw
      : defaultCurveValues;

  const d = state.pricing.discountPct;
  const effectiveDeal = baseDeal * (1 - d / 100);
  const annualDelta = Number((effectiveDeal - baseDeal).toFixed(0));

  const baseline = asRecord(financial.baseline);
  const baselineMargin = toFiniteNumber(baseline?.gross_margin_pct) ?? 72;
  const baselineRunway = toFiniteNumber(baseline?.runway_months) ?? 17.5;
  const baselineBurn = toFiniteNumber(baseline?.monthly_burn) ?? 13200;
  const baselineCash = toFiniteNumber(baseline?.available_cash_balance) ?? 231000;
  const baselineClose =
    toFiniteNumber(probability.base_close_probability) ??
    toFiniteNumber(financial.close_probability_base) ??
    38;

  // Calculate from first principles instead of linear extrapolation
  const discountedMonthly = baseMonthly * (1 - d / 100);
  const grossProfitMo = discountedMonthly - cogsMo;
  const marginAfter = discountedMonthly > 0
    ? Number(((grossProfitMo / discountedMonthly) * 100).toFixed(1))
    : 0;
  const grossContribution = Math.max(0, grossProfitMo);
  const projectedBurn = Math.max(500, baselineBurn - grossContribution);
  const runwayAfter = Number((baselineCash / projectedBurn).toFixed(1));
  const closeWith = Number((localCloseProb(d) * 100).toFixed(1));

  const marginDelta = Number((marginAfter - baselineMargin).toFixed(1));
  const runwayDelta = Number((runwayAfter - baselineRunway).toFixed(1));
  const closeDelta = Number((closeWith - baselineClose).toFixed(1));

  const markerIndex = curveDiscounts.reduce(
    (best, discount, index) => {
      const delta = Math.abs(discount - state.pricing.discountPct);
      return delta < best.delta ? { index, delta } : best;
    },
    { index: 0, delta: Number.POSITIVE_INFINITY },
  ).index;
  const selectedCurveValue = curveValues[markerIndex];
  const baselineIndex = curveDiscounts.findIndex((value) => value === 0);
  const baselineCurveValue =
    baselineIndex >= 0 ? curveValues[baselineIndex] : curveValues[0];
  const evDiff =
    baselineCurveValue !== undefined && selectedCurveValue !== undefined
      ? Number((selectedCurveValue - baselineCurveValue).toFixed(0))
      : 0;
  const verdict = verdictFromEvDiff(evDiff);
  const tone = verdictTone(verdict);

  if (
    verdict === "DON'T DISCOUNT" &&
    state.pricing.discountPct > 25 &&
    state.lastSentVerdict !== "DON'T DISCOUNT"
  ) {
    state.lastSentVerdict = "DON'T DISCOUNT";
    try {
      app
        .sendMessage({
          role: "assistant",
          content: [
            {
              type: "text",
              text: `At ${state.pricing.discountPct}% discount, the financial model recommends against discounting. Margins would drop below the acceptable threshold. Consider offering payment terms or a smaller pilot instead.`,
            },
          ],
        })
        .catch(() => {
          /* host may not support sendMessage */
        });
    } catch {
      /* silently ignore if not supported */
    }
  }
  if (verdict !== "DON'T DISCOUNT") state.lastSentVerdict = undefined;

  const discountLabel = document.getElementById("pricing-discount-label");
  if (discountLabel) {
    discountLabel.textContent = `${state.pricing.discountPct}%`;
  }
  const effectiveValue = document.getElementById("pricing-effective-value");
  if (effectiveValue) {
    effectiveValue.textContent = toCurrency(effectiveDeal);
  }
  const verdictNode = document.getElementById("pricing-verdict");
  if (verdictNode) {
    verdictNode.textContent = verdict;
    verdictNode.className = `verdict verdict--${tone}`;
  }
  const curveNode = document.getElementById("pricing-curve");
  if (curveNode) {
    curveNode.innerHTML = renderCurve(curveValues, markerIndex);
  }

  const annualValue = document.getElementById("pricing-impact-annual-value");
  const annualDeltaNode = document.getElementById(
    "pricing-impact-annual-delta",
  );
  if (annualValue)
    annualValue.textContent = `${toCurrency(baseDeal)} → ${toCurrency(
      effectiveDeal,
    )}`;
  if (annualDeltaNode) {
    annualDeltaNode.textContent = toSignedCurrency(annualDelta);
    annualDeltaNode.className = `impact-row__delta ${impactDeltaClass(
      annualDelta,
    )}`;
  }

  const marginValue = document.getElementById("pricing-impact-margin-value");
  const marginDeltaNode = document.getElementById(
    "pricing-impact-margin-delta",
  );
  if (marginValue)
    marginValue.textContent = `${toPercent(baselineMargin)} → ${toPercent(
      marginAfter,
    )}`;
  if (marginDeltaNode) {
    marginDeltaNode.textContent = toSigned(marginDelta, "pp");
    marginDeltaNode.className = `impact-row__delta ${impactDeltaClass(
      marginDelta,
    )}`;
  }

  const runwayValue = document.getElementById("pricing-impact-runway-value");
  const runwayDeltaNode = document.getElementById(
    "pricing-impact-runway-delta",
  );
  if (runwayValue)
    runwayValue.textContent = `${baselineRunway.toFixed(1)} mo → ${
      runwayAfter.toFixed(1)
    } mo`;
  if (runwayDeltaNode) {
    runwayDeltaNode.textContent = toSigned(runwayDelta, " mo");
    runwayDeltaNode.className = `impact-row__delta ${impactDeltaClass(
      runwayDelta,
      true,
    )}`;
  }

  const closeValue = document.getElementById("pricing-impact-close-value");
  const closeDeltaNode = document.getElementById("pricing-impact-close-delta");
  if (closeValue)
    closeValue.textContent = `${baselineClose.toFixed(1)}% → ${
      closeWith.toFixed(1)
    }%`;
  if (closeDeltaNode) {
    closeDeltaNode.textContent = toSigned(closeDelta, "pp");
    closeDeltaNode.className = `impact-row__delta ${impactDeltaClass(
      closeDelta,
    )}`;
  }
}

function buildPricingScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("pricing");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("pricing");
  syncPricingFromPayload(payload);

  const pricingCompanyKey = state.pricing.companyKey;
  const pricingCompanyName =
    getString(payload.company_name) ?? humanizeKey(pricingCompanyKey);

  const summary = asRecord(payload.summary) ?? {};
  const financial = asRecord(payload.financial) ?? {};
  const pricing = asRecord(payload.pricing) ?? {};
  const expected = asRecord(pricing.expected_value) ?? {};
  const probability = asRecord(pricing.probability) ?? {};
  const charts = asRecord(payload.charts) ?? {};
  const evCurve = asRecord(charts.ev_curve) ?? {};
  const curveDiscountsRaw = asNumberArray(evCurve.discounts);
  const curveValuesRaw = asNumberArray(evCurve.ltv_ev_with_discount);
  const curveDiscounts = curveDiscountsRaw.length
    ? curveDiscountsRaw
    : Array.from({ length: 41 }, (_, idx) => idx);
  const baseDeal = Math.max(1000, state.pricing.dealSize);
  const defaultCurveValues = curveDiscounts.map((discount) => {
    const annual = baseDeal * (1 - discount / 100);
    const baseClose = 0.38;
    const gap = 1 - baseClose;
    const maxLift = gap * 0.5;
    const rawLift = maxLift * (1 - Math.exp(-0.1 * discount));
    const penalty = discount > 20 ? (discount - 20) * 0.006 : 0;
    const closeProb = Math.max(baseClose, Math.min(baseClose + rawLift - penalty, 0.95));
    const retFactor =
      discount <= 15 ? 1 : Math.max(0, 1 - (discount - 15) * 0.008);
    const lifetime = 14 * retFactor;
    const cogs = (baseDeal / 12) * 0.28;
    const grossProfit = annual / 12 - cogs;
    const ltvProfit = grossProfit * lifetime;
    return Number((ltvProfit * closeProb).toFixed(2));
  });
  const curveValues =
    curveValuesRaw.length === curveDiscounts.length
      ? curveValuesRaw
      : defaultCurveValues;

  const lift = stageCloseLift(state.pricing.dealStage);

  const markerIndex = curveDiscounts.reduce(
    (best, discount, index) => {
      const delta = Math.abs(discount - state.pricing.discountPct);
      return delta < best.delta ? { index, delta } : best;
    },
    { index: 0, delta: Number.POSITIVE_INFINITY },
  ).index;
  const selectedCurveValue = curveValues[markerIndex];
  const closeProbDiff =
    (toFiniteNumber(probability.close_probability_with_discount) ?? 0) -
    (toFiniteNumber(probability.base_close_probability) ?? 0);
  const baselineIndex = curveDiscounts.findIndex((value) => value === 0);
  const baselineCurveValue =
    baselineIndex >= 0 ? curveValues[baselineIndex] : curveValues[0];
  const derivedEvDiff =
    baselineCurveValue !== undefined && selectedCurveValue !== undefined
      ? Number((selectedCurveValue - baselineCurveValue).toFixed(0))
      : undefined;
  const evLtvDiff =
    toFiniteNumber(summary.ev_ltv_diff) ??
    toFiniteNumber(expected.ltv_ev_diff) ??
    derivedEvDiff;
  const rawVerdict =
    getString(summary.verdict) ?? getString(expected.verdict) ?? undefined;
  const normalizedVerdict =
    rawVerdict && rawVerdict.toUpperCase().includes("DISCOUNT WORTH IT")
      ? "TAKE THE DEAL"
      : rawVerdict;
  const verdict = normalizedVerdict ?? verdictFromEvDiff(evLtvDiff ?? 0);
  const tone = verdictTone(verdict);
  const effectiveDeal = baseDeal * (1 - state.pricing.discountPct / 100);
  const baseline = asRecord(financial.baseline);
  const baselineMargin = toFiniteNumber(baseline?.gross_margin_pct);
  const baselineRunway = toFiniteNumber(baseline?.runway_months);
  const baselineClose =
    toFiniteNumber(probability.base_close_probability) ??
    toFiniteNumber(financial.close_probability_base);
  const closeWith =
    toFiniteNumber(probability.close_probability_with_discount) ??
    toFiniteNumber(financial.close_probability_discounted);
  const marginAfter = toFiniteNumber(summary.gross_margin_after);
  const runwayAfter = toFiniteNumber(summary.runway_after);
  const marginDelta =
    baselineMargin !== undefined && marginAfter !== undefined
      ? Number((marginAfter - baselineMargin).toFixed(1))
      : undefined;
  const runwayDelta =
    baselineRunway !== undefined && runwayAfter !== undefined
      ? Number((runwayAfter - baselineRunway).toFixed(1))
      : undefined;
  const annualDelta = Number((effectiveDeal - baseDeal).toFixed(0));
  const closeDelta =
    baselineClose !== undefined && closeWith !== undefined
      ? Number((closeWith - baselineClose).toFixed(1))
      : undefined;
  const roleView = pricingRoleModel({
    role: state.pricingRole,
    verdict,
    stage: state.pricing.dealStage,
    discountPct: state.pricing.discountPct,
    closeProbabilityWith:
      toFiniteNumber(probability.close_probability_with_discount) ??
      toFiniteNumber(financial.close_probability_discounted),
    closeProbabilityDelta: closeProbDiff,
    commissionAfter:
      toFiniteNumber(summary.commission_after) ??
      toFiniteNumber(financial.commission_delta),
    marginAfter: toFiniteNumber(summary.gross_margin_after),
    runwayAfter: toFiniteNumber(summary.runway_after),
    evDiff: evLtvDiff,
    dealSize: baseDeal,
    avgDealSize: toFiniteNumber(asRecord(financial.baseline)?.avg_deal_size),
    marginPressure: getString(summary.margin_pressure),
  });

  return {
    kicker: "Pricing Simulator",
    title: `Live Deal Modeling — ${pricingCompanyName}`,
    subtitle: `Pricing simulator for the ${pricingCompanyName} deal (${toCurrency(
      state.pricing.dealSize,
    )}).`,
    metrics: [
      {
        label: "Annual Deal",
        value: toCurrency(baseDeal),
      },
      {
        label: "Discount Now",
        value: `${state.pricing.discountPct}%`,
      },
      {
        label: "Gross Margin",
        value: toPercent(getNumber(summary.gross_margin_after)),
      },
      {
        label: "Runway",
        value: `${getNumber(summary.runway_after)?.toFixed(1) ?? "n/a"} months`,
      },
      {
        label: "Close Probability Δ",
        value: toSigned(closeProbDiff, "pp"),
        tone: closeProbDiff >= 0 ? "good" : "warn",
      },
      {
        label: "Expected Value",
        value: toCurrency(selectedCurveValue),
        tone,
      },
      {
        label: "EV Δ",
        value: toCurrency(evLtvDiff),
        tone,
      },
    ],
    bodyHtml: `<div class="split-grid split-grid--pricing">
  <section class="insight-card">
    <h3>Role View</h3>
    <div class="role-row" id="pricing-role-row">
      ${(["ae", "cfo", "manager"] as RolePerspective[])
        .map(
          (role) =>
            `<button type="button" class="role-btn ${
              role === state.pricingRole ? "is-active" : ""
            }" data-pricing-role="${role}">${
              role === "manager" ? "Manager" : role.toUpperCase()
            }</button>`,
        )
        .join("")}
    </div>
    <div class="role-panel">
      <h4>${escapeHtml(roleView.title)}</h4>
      <ul class="insight-list">
        ${roleView.bullets
          .map((point) => `<li>${escapeHtml(point)}</li>`)
          .join("")}
      </ul>
      <p class="body-copy"><strong>Recommendation:</strong> ${escapeHtml(
        roleView.recommendation,
      )}</p>
    </div>
    <h3 class="section-gap">Simulator Controls</h3>
    <div class="control-grid control-grid--compact">
      <label>Deal size ($)
        <input id="pricing-deal-size" type="number" min="1000" step="1000" value="${Math.max(
          1000,
          Math.round(baseDeal),
        )}" />
      </label>
      <label>Stage
        <select id="pricing-stage">
          <option value="discovery" ${
            state.pricing.dealStage === "discovery" ? "selected" : ""
          }>Discovery</option>
          <option value="proposal_sent" ${
            state.pricing.dealStage === "proposal_sent" ? "selected" : ""
          }>Proposal Sent</option>
          <option value="negotiation" ${
            state.pricing.dealStage === "negotiation" ? "selected" : ""
          }>Negotiation</option>
          <option value="verbal_commit" ${
            state.pricing.dealStage === "verbal_commit" ? "selected" : ""
          }>Verbal Commit</option>
        </select>
      </label>
      <label>Discount <span id="pricing-discount-label">${
        state.pricing.discountPct
      }%</span>
        <input id="pricing-discount" type="range" min="0" max="40" step="1" value="${
          state.pricing.discountPct
        }" />
      </label>
    </div>
    <div id="pricing-verdict" class="verdict verdict--${tone}">${escapeHtml(
      verdict,
    )}</div>
    <p class="body-copy">Effective annual value at this discount: <strong id="pricing-effective-value">${escapeHtml(
      toCurrency(effectiveDeal),
    )}</strong></p>
  </section>
</div>
<div class="chart-grid chart-grid--compact">
  <article class="chart-card">
    <h3>Expected value curve</h3>
    <div id="pricing-curve">${renderCurve(curveValues, markerIndex)}</div>
  </article>
  <article class="chart-card">
    <h3>Impact at current discount</h3>
    <div class="pricing-impact-grid">
      <div class="impact-row">
        <span class="impact-row__label">Annual deal</span>
        <span id="pricing-impact-annual-value" class="impact-row__value">${escapeHtml(
          `${toCurrency(baseDeal)} → ${toCurrency(effectiveDeal)}`,
        )}</span>
        <span id="pricing-impact-annual-delta" class="impact-row__delta ${impactDeltaClass(
          annualDelta,
        )}">${escapeHtml(toSignedCurrency(annualDelta))}</span>
      </div>
      <div class="impact-row">
        <span class="impact-row__label">Gross margin</span>
        <span id="pricing-impact-margin-value" class="impact-row__value">${escapeHtml(
          `${toPercent(baselineMargin)} → ${toPercent(marginAfter)}`,
        )}</span>
        <span id="pricing-impact-margin-delta" class="impact-row__delta ${impactDeltaClass(
          marginDelta,
        )}">${escapeHtml(toSigned(marginDelta, "pp"))}</span>
      </div>
      <div class="impact-row">
        <span class="impact-row__label">Runway</span>
        <span id="pricing-impact-runway-value" class="impact-row__value">${escapeHtml(
          `${baselineRunway?.toFixed(1) ?? "n/a"} mo → ${
            runwayAfter?.toFixed(1) ?? "n/a"
          } mo`,
        )}</span>
        <span id="pricing-impact-runway-delta" class="impact-row__delta ${impactDeltaClass(
          runwayDelta,
          true,
        )}">${escapeHtml(toSigned(runwayDelta, " mo"))}</span>
      </div>
      <div class="impact-row">
        <span class="impact-row__label">Close probability</span>
        <span id="pricing-impact-close-value" class="impact-row__value">${escapeHtml(
          `${baselineClose?.toFixed(1) ?? "n/a"}% → ${
            closeWith?.toFixed(1) ?? "n/a"
          }%`,
        )}</span>
        <span id="pricing-impact-close-delta" class="impact-row__delta ${impactDeltaClass(
          closeDelta,
        )}">${escapeHtml(toSigned(closeDelta, "pp"))}</span>
      </div>
    </div>
  </article>
</div>`,
    actions: [actionScene("Deal Impact View", "deal-impact", "secondary")],
  };
}

function buildDealImpactScene(): SceneModel {
  const pricingSnapshot = state.sceneCache.get("pricing");
  if (!pricingSnapshot) return emptyScene("deal-impact");

  const payload = asRecord(pricingSnapshot.payload);
  if (!payload) return emptyScene("deal-impact");

  const summary = asRecord(payload.summary) ?? {};
  const baseDeal = getNumber(payload.deal_size) ?? state.pricing.dealSize;
  const discount = getNumber(payload.discount_pct) ?? state.pricing.discountPct;
  const discountedDeal = baseDeal * (1 - discount / 100);
  const monthlyBefore = baseDeal / 12;
  const monthlyAfter = discountedDeal / 12;
  const commissionAfter = getNumber(summary.commission_after);
  const margin = getNumber(summary.gross_margin_after);
  const runway = getNumber(summary.runway_after);
  const companyKey = state.pricing.companyKey;
  const dealInfo = DEAL_LOOKUP[companyKey.toLowerCase()];
  const companyName =
    getString(payload.company_name) ?? humanizeKey(companyKey);

  return {
    kicker: "Deal Impact",
    title: `Financial Impact — ${companyName}`,
    subtitle: `What the ${companyName} deal (${toCurrency(
      baseDeal,
    )}) means for growth, margin, and cash runway.`,
    metrics: [
      {
        label: "MRR Lift",
        value: `${toCurrency(monthlyBefore)} → ${toCurrency(monthlyAfter)}`,
      },
      {
        label: "Runway Change",
        value: `${runway?.toFixed(1) ?? "n/a"} months`,
      },
      {
        label: "Gross Margin",
        value: toPercent(margin),
      },
      {
        label: "Commission",
        value: toCurrency(commissionAfter),
      },
      {
        label: "Annual Revenue",
        value: `${toCurrency(baseDeal)} → ${toCurrency(discountedDeal)}`,
      },
      {
        label: "Discount",
        value: `${discount}%`,
      },
    ],
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Narrative</h3>
    <p class="body-copy">${
      discount > 0
        ? `A ${discount}% discount on the ${escapeHtml(
            companyName,
          )} deal reduces annual revenue by ${toCurrency(
            Math.abs(baseDeal - discountedDeal),
          )} to ${toCurrency(discountedDeal)}.${
            margin !== undefined
              ? ` Gross margin shifts to ${toPercent(margin)}.`
              : ""
          }${
            runway !== undefined
              ? ` Cash runway adjusts to ${runway.toFixed(1)} months.`
              : ""
          }`
        : `The ${escapeHtml(companyName)} deal at full price (${toCurrency(
            baseDeal,
          )}) adds ${toCurrency(monthlyAfter)}/mo MRR without margin erosion.`
    }</p>
  </section>
  <section class="insight-card">
    <h3>Suggested framing${
      dealInfo ? ` for ${escapeHtml(dealInfo.contact)}` : ""
    }</h3>
    <ul class="insight-list">
      <li>Lead with ${escapeHtml(
        companyName,
      )}'s business outcomes before discussing pricing.</li>
      <li>${
        discount > 0
          ? `Tie the ${discount}% concession to a specific close commitment and timeline.`
          : "Hold pricing firm — the full-price position preserves maximum margin."
      }</li>
      <li>${
        commissionAfter !== undefined
          ? `AE commission: ${toCurrency(commissionAfter)}.`
          : "Keep a maximum discount guardrail before escalation."
      }</li>
    </ul>
  </section>
</div>`,
    actions: [
      actionScene("Pricing Simulator", "pricing", "primary"),
      actionScene("Call Prep", "call-prep"),
      actionScene("Pipeline", "pipeline"),
      actionScene("Action Plan", "action-plan"),
    ],
  };
}

function buildPipelineScene(snapshot?: SceneSnapshot): SceneModel {
  const payload = snapshot ? asRecord(snapshot.payload) : null;

  const dashboard = payload ? asRecord(payload.dashboard) ?? payload : null;
  const parsedKpis = asRecordArray(dashboard?.kpis)
    .map((kpi) => {
      const label =
        firstStringByKeys(kpi, ["label", "name", "key"]) ?? "Metric";
      const value =
        getString(kpi.value) ??
        getNumber(kpi.value)?.toLocaleString() ??
        getString(kpi.current_value);
      if (!value) return null;
      const trend = getString(kpi.trend) ?? getString(kpi.delta) ?? "";
      const tone: MetricTone = trend.startsWith("+")
        ? "good"
        : trend.startsWith("-")
          ? "bad"
          : "neutral";
      return {
        label: humanizeKey(label),
        value,
        note: trend || undefined,
        tone,
      } as SceneMetric;
    })
    .filter((metric): metric is SceneMetric => metric !== null);

  const liveMetrics = parsedKpis.length
    ? parsedKpis.slice(0, 8)
    : dashboard
      ? metricFromFacts(dashboard, 8)
      : [];

  const stageRows = dashboard
    ? [
        ...asRecordArray(dashboard.stages),
        ...asRecordArray(dashboard.stage_distribution),
        ...asRecordArray(dashboard.stage_breakdown),
        ...asRecordArray(dashboard.pipeline_stages),
      ]
    : [];
  const liveLineItems = stageRows.slice(0, 6).map((stage) => {
    const name =
      firstStringByKeys(stage, ["name", "stage", "label"]) ?? "Stage";
    const value =
      getNumber(
        stage.value ??
          stage.amount ??
          stage.pipeline_value ??
          stage.revenue ??
          stage.total_value,
      )?.toLocaleString() ??
      getString(
        stage.value ??
          stage.amount ??
          stage.pipeline_value ??
          stage.revenue ??
          stage.total_value,
      ) ??
      "n/a";
    const count =
      getNumber(
        stage.count ?? stage.deals ?? stage.opportunities,
      )?.toString() ??
      getString(stage.count ?? stage.deals ?? stage.opportunities) ??
      "";
    return `${name} · ${value}${count ? ` · ${count} deals` : ""}`;
  });

  const useFallback = shouldUsePipelineFallback(liveMetrics, liveLineItems);
  const focusAccount = activeCompanyLabelForPipeline();

  // Build pipeline from DEAL_LOOKUP
  const allDeals = Object.entries(DEAL_LOOKUP).map(([key, d]) => ({
    company: humanizeKey(key),
    ...d,
  }));
  const pipelineValue = allDeals.reduce((s, d) => s + d.dealSize, 0);
  const weightedPipeline = Math.round(pipelineValue * 0.34);
  const avgDeal = Math.round(pipelineValue / Math.max(allDeals.length, 1));
  const atRisk = allDeals.filter(
    (d) => d.dealStage === "discovery" || d.dealStage === "proposal_sent",
  ).length;

  const fallbackMetrics: SceneMetric[] = [
    { label: "Active Deals", value: String(allDeals.length) },
    { label: "Pipeline Value", value: toCurrency(pipelineValue) },
    { label: "Weighted Pipeline", value: toCurrency(weightedPipeline) },
    { label: "Avg Deal Size", value: toCurrency(avgDeal) },
    { label: "Win Rate", value: "27%" },
    { label: "Needs Attention", value: String(atRisk), tone: atRisk > 2 ? "warn" : "neutral" },
    { label: "Focus Account", value: focusAccount },
  ];

  // Group deals by stage
  const stageGroups: Record<string, { total: number; count: number }> = {};
  for (const d of allDeals) {
    const stage = d.dealStage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!stageGroups[stage]) stageGroups[stage] = { total: 0, count: 0 };
    stageGroups[stage].total += d.dealSize;
    stageGroups[stage].count++;
  }
  const fallbackLineItems = Object.entries(stageGroups).map(
    ([stage, g]) => `${stage} · ${toCurrency(g.total)} · ${g.count} deal${g.count > 1 ? "s" : ""}`,
  );

  // Build deal-level detail rows
  const dealRows = [...allDeals]
    .sort((a, b) => b.dealSize - a.dealSize)
    .slice(0, 6)
    .map((d) => {
      const stageName = d.dealStage.replace(/_/g, " ");
      return `<li><strong>${escapeHtml(d.company)}</strong> — ${toCurrency(d.dealSize)} · ${stageName} · ${escapeHtml(d.contact)}</li>`;
    })
    .join("");

  const metrics = useFallback ? fallbackMetrics : liveMetrics;
  const lineItems =
    liveLineItems.length > 0 ? liveLineItems : fallbackLineItems;

  return {
    kicker: "Pipeline",
    title: "Pipeline & Dashboard",
    subtitle: useFallback
      ? `${allDeals.length} active deals totaling ${toCurrency(pipelineValue)} across ${Object.keys(stageGroups).length} stages.`
      : "Current revenue motion and risk visibility across active deals.",
    metrics,
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Stage distribution</h3>
    ${renderTimeline(lineItems, "No stage distribution in this payload.")}
  </section>
  <section class="insight-card">
    <h3>Active deals</h3>
    <ul class="insight-list">
      ${dealRows}
    </ul>
  </section>
</div>`,
    actions: [
      actionTool(
        "Refresh Dashboard",
        "dashboard_insights",
        { mode: "dashboard" },
        "primary",
      ),
      actionScene("Pricing", "pricing"),
      actionScene("Outreach", "outreach"),
      ...(state.sceneCache.has("action-plan")
        ? [actionScene("Back to Action Plan", "action-plan")]
        : []),
    ],
  };
}

function buildOutreachScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("outreach");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("outreach");

  const metrics = metricFromFacts(payload, 7);
  const sequences = asRecordArray(payload.sequences)
    .slice(0, 6)
    .map((sequence) => {
      const name =
        getString(sequence.name) ?? getString(sequence.title) ?? "Sequence";
      const status = getString(sequence.status) ?? "active";
      const size =
        getNumber(sequence.contact_count)?.toString() ??
        getString(sequence.contact_count) ??
        "n/a";
      return `${name} · ${status} · ${size} contacts`;
    });

  return {
    kicker: "Outreach",
    title: "Draft & Send",
    subtitle: "Sequence operations and send readiness for follow-up execution.",
    metrics,
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Active sequences</h3>
    ${renderTimeline(sequences, "No sequence list in the latest payload.")}
  </section>
  <section class="insight-card">
    <h3>Demo path</h3>
    <ul class="insight-list">
      <li>Generate personalized follow-up copy from the deal context.</li>
      <li>Send through Reply.io in controlled demo-safe mode.</li>
      <li>Confirm schedule and first-touch timing in chat.</li>
    </ul>
  </section>
</div>`,
    actions: [
      actionTool(
        "Reload Sequences",
        "outreach_sequence_workspace",
        {},
        "primary",
      ),
      actionScene("People", "people"),
      actionScene("Cold Mail", "cold-mail"),
      ...(state.sceneCache.has("action-plan")
        ? [actionScene("Back to Action Plan", "action-plan")]
        : []),
    ],
  };
}

function buildContentScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("content");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("content");

  if (
    getString(payload.status) === "unavailable" &&
    getString(payload.reason) === "content_scope_forbidden"
  ) {
    return {
      kicker: "Content & Social",
      title: "Content Module Restricted",
      subtitle:
        getString(payload.message) ??
        "This customer token does not currently include content permissions.",
      metrics: [
        { label: "Availability", value: "Restricted", tone: "warn" },
        { label: "Current Mode", value: "Sales-first demo" },
      ],
      bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>What this means</h3>
    <p class="body-copy">Content endpoints are reachable but blocked by tenant permissions on this token.</p>
    <p class="body-copy">The rest of the Deal Intelligence and Outreach surfaces remain fully live.</p>
  </section>
  <section class="insight-card">
    <h3>Next action</h3>
    <ul class="insight-list">
      <li>Grant /api/content access for this customer key in Markster Panel.</li>
      <li>Re-run content queries to unlock calendar and social views.</li>
    </ul>
  </section>
</div>`,
      actions: [
        actionScene("Outreach", "outreach", "primary"),
        actionScene("Pipeline", "pipeline"),
      ],
    };
  }
  const calendars = extractCalendarRecords(payload).filter(
    isUsableCalendarRecord,
  );
  const activeCalendar = selectActiveCalendar(calendars);
  const hasCalendarData = calendars.length > 0;
  const activeCalendarName =
    (activeCalendar
      ? firstStringByKeys(activeCalendar, ["name", "title", "calendar_name"])
      : undefined) ?? undefined;
  const activeCount = activeCalendar
    ? toFiniteNumber(
        activeCalendar.item_count ??
          activeCalendar.total_items ??
          activeCalendar.items_count ??
          activeCalendar.posts_count,
      )
    : undefined;

  const upcomingPosts = extractUpcomingPosts(payload, calendars);
  const fallbackPosts = buildFallbackUpcomingPosts();
  // Merge: live posts first, then fill with fallback (dedup by title)
  const liveTitles = new Set(upcomingPosts.map((p) => p.title.toLowerCase()));
  const supplementPosts = fallbackPosts.filter(
    (p) => !liveTitles.has(p.title.toLowerCase()),
  );
  const visiblePosts =
    upcomingPosts.length >= 15
      ? upcomingPosts
      : [...upcomingPosts, ...supplementPosts].slice(0, 15);
  const topPostWithId = visiblePosts.find((post) => Boolean(post.postId));
  const uniqueChannels = new Set(
    visiblePosts.map((post) => post.channel.toLowerCase()),
  ).size;

  const publishedCount = visiblePosts.filter(
    (p) => p.status === "published",
  ).length;
  const scheduledCount = visiblePosts.filter(
    (p) => p.status === "scheduled",
  ).length;
  const draftCount = visiblePosts.filter(
    (p) => p.status === "draft",
  ).length;

  const metrics: SceneMetric[] = [
    {
      label: "Total Posts",
      value: String(visiblePosts.length),
    },
    { label: "Channels", value: String(uniqueChannels) },
    {
      label: "Published",
      value: String(publishedCount),
      tone: publishedCount > 0 ? "good" : "neutral",
    },
    {
      label: "Scheduled",
      value: String(scheduledCount),
      tone: scheduledCount > 0 ? "good" : "neutral",
    },
    {
      label: "Draft",
      value: String(draftCount),
      tone: draftCount > 3 ? "warn" : "neutral",
    },
  ];
  if (
    hasCalendarData &&
    activeCalendarName &&
    !isPlaceholderCalendarName(activeCalendarName)
  ) {
    metrics.unshift({ label: "Active Calendar", value: activeCalendarName });
  }
  if (hasCalendarData && activeCount !== undefined) {
    metrics.push({
      label: "Items in Cycle",
      value: String(activeCount),
    });
  }
  const weekRange = asRecord(payload.week);
  const weekLabel =
    weekRange && (getString(weekRange.start) || getString(weekRange.end))
      ? `${getString(weekRange.start) ?? "?"} to ${
          getString(weekRange.end) ?? "?"
        }`
      : undefined;
  if (hasCalendarData && weekLabel) {
    metrics.push({ label: "Week", value: weekLabel });
  }

  const statusBadge = (status: string): string => {
    const s = status.toLowerCase();
    const color =
      s === "published"
        ? "var(--mk-accent, #01ff00)"
        : s === "scheduled"
          ? "#4fc3f7"
          : s === "draft"
            ? "#ffaa00"
            : "var(--mk-text-muted, #889988)";
    return `<span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${color};background:${color}18;padding:1px 6px;border-radius:3px">${escapeHtml(status)}</span>`;
  };
  const channelIcon = (ch: string): string => {
    const c = ch.toLowerCase();
    if (c.includes("linkedin")) return "in";
    if (c.includes("twitter") || c.includes("x")) return "X";
    if (c.includes("facebook") || c.includes("fb")) return "fb";
    if (c.includes("blog")) return "B";
    return ch.charAt(0).toUpperCase();
  };

  const postRows = visiblePosts
    .map(
      (post) => `<article class="upcoming-post" style="border-left:3px solid ${
        post.status === "published"
          ? "var(--mk-accent, #01ff00)"
          : post.status === "scheduled"
            ? "#4fc3f7"
            : "#ffaa00"
      };padding-left:var(--space-300)">
  <div class="upcoming-post__meta" style="margin-bottom:4px">
    <span style="font-weight:700;font-size:0.75rem;min-width:22px;text-align:center;color:var(--mk-text-muted)">${channelIcon(post.channel)}</span>
    <span>${escapeHtml(post.channel)}</span>
    <span>${escapeHtml(post.dateLabel)}</span>
    ${statusBadge(post.status ?? "draft")}
  </div>
  <div class="upcoming-post__main">
    <h4 style="margin:0 0 2px">${
      post.url
        ? `<a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;border-bottom:1px solid var(--mk-text-muted, #556655)">${escapeHtml(post.title)}</a>`
        : escapeHtml(post.title)
    }</h4>
    <div class="muted" style="font-size:0.75rem">${escapeHtml(post.theme)}${post.url ? ` · <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--mk-accent, #01ff00);text-decoration:none;font-weight:600">View live ↗</a>` : ""}</div>
    ${
      post.content
        ? `<p class="body-copy" style="margin-top:4px;font-size:0.82rem;opacity:0.75;line-height:1.4">${escapeHtml(
            post.content.length > 160 ? post.content.slice(0, 157) + "..." : post.content,
          )}</p>`
        : ""
    }
  </div>
</article>`,
    )
    .join("");

  // Channel breakdown
  const channelCounts: Record<string, number> = {};
  for (const post of visiblePosts) {
    const ch = post.channel;
    channelCounts[ch] = (channelCounts[ch] ?? 0) + 1;
  }
  const channelBreakdownHtml = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([ch, count]) =>
        `<li><strong>${escapeHtml(ch)}</strong> — ${count} post${count > 1 ? "s" : ""}</li>`,
    )
    .join("");

  return {
    kicker: "Content & Social",
    title: "Calendar & Publishing",
    subtitle: `${visiblePosts.length} posts across ${uniqueChannels} channels. ${publishedCount} live, ${scheduledCount} scheduled, ${draftCount} in draft.`,
    metrics,
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>This week — ${visiblePosts.length} posts</h3>
    ${
      postRows ||
      `<div class="scene-empty">No posts found for the active calendar.</div>`
    }
  </section>
  <section class="insight-card">
    <h3>Channel breakdown</h3>
    <ul class="insight-list">
      ${channelBreakdownHtml}
    </ul>
    <h3 style="margin-top:var(--space-400)">Content strategy</h3>
    <ul class="insight-list">
      <li>${publishedCount} posts published this cycle — ${publishedCount >= 5 ? "strong cadence" : "ramp up frequency"}.</li>
      <li>${draftCount > 0 ? `${draftCount} drafts ready for final review and scheduling.` : "All content approved or live."}</li>
      <li>Top theme: ${visiblePosts[0]?.theme ?? "Mixed"} — aligned with current pipeline messaging.</li>
    </ul>
  </section>
</div>`,
    actions: [
      actionTool(
        "Refresh Calendar",
        "content_calendar_workspace",
        { mode: "list", limit: 15 },
        "primary",
      ),
      actionTool("Generate New Post", "content_post_workspace", {
        mode: "generate",
        platform: "linkedin",
        topic: "ScaleOS methodology for founder-operators",
      }),
      actionScene("Action Plan", "action-plan"),
      actionScene("Pipeline", "pipeline"),
    ],
  };
}

function buildColdMailScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("cold-mail");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("cold-mail");

  const totalDomains = getNumber(payload.total_domains) ?? 0;
  const activeDomains = getNumber(payload.active_domains) ?? 0;
  const totalMailboxes = getNumber(payload.total_mailboxes) ?? 0;
  const activeMailboxes = getNumber(payload.active_mailboxes) ?? 0;
  const completion = getNumber(payload.setup_completion_percentage) ?? 0;
  const issues = [
    ...asRecordArray(payload.domains_with_issues).map((issue) => {
      const name = getString(issue.domain) ?? "domain";
      const reasons = asStringArray(issue.reasons).join(", ");
      return `${name}: ${reasons || "issue detected"}`;
    }),
    ...asRecordArray(payload.mailboxes_with_issues).map((issue) => {
      const name = getString(issue.email) ?? "mailbox";
      const reasons = asStringArray(issue.reasons).join(", ");
      return `${name}: ${reasons || "issue detected"}`;
    }),
  ].slice(0, 8);

  const readinessTone: MetricTone =
    completion >= 80 ? "good" : completion >= 50 ? "warn" : "bad";

  return {
    kicker: "Cold Mail Health",
    title: "Outbound Readiness",
    subtitle: "Fast readiness view for mail infrastructure before sending.",
    metrics: [
      { label: "Domains Active", value: `${activeDomains}/${totalDomains}` },
      {
        label: "Mailboxes Active",
        value: `${activeMailboxes}/${totalMailboxes}`,
      },
      {
        label: "Setup Completion",
        value: `${completion}%`,
        tone: readinessTone,
      },
      {
        label: "Detected Issues",
        value: String(issues.length),
        tone: issues.length ? "warn" : "good",
      },
    ],
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Readiness</h3>
    <div class="readiness-track">
      <span class="readiness-fill" style="width:${Math.max(
        0,
        Math.min(100, completion),
      )}%"></span>
    </div>
    <p class="body-copy">${
      issues.length
        ? "Infrastructure is mostly active but issues need review before scaling sends."
        : "Infrastructure is healthy and ready for outbound."
    }</p>
  </section>
  <section class="insight-card">
    <h3>Issues</h3>
    ${renderTimeline(
      issues,
      "No domain/mailbox issues in the current snapshot.",
    )}
  </section>
</div>`,
    actions: [
      actionTool("Refresh Health", "cold_mail_health", {}, "primary"),
      actionScene("Outreach", "outreach"),
      actionScene("Pipeline", "pipeline"),
      ...(state.sceneCache.has("action-plan")
        ? [actionScene("Back to Action Plan", "action-plan")]
        : []),
    ],
  };
}

function buildActionPlanScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return emptyScene("action-plan");
  const payload = asRecord(snapshot.payload);
  if (!payload) return emptyScene("action-plan");

  const tasks = asRecordArray(payload.tasks);
  const timeboxMinutes = getNumber(payload.timebox_minutes) ?? 60;
  const totalMinutes = getNumber(payload.total_minutes) ?? 0;
  const totalRevenue = getNumber(payload.total_revenue_at_stake) ?? 0;
  const totalTasks = getNumber(payload.total_tasks) ?? tasks.length;

  const categoryIcon: Record<string, string> = {
    sales: "Deal",
    marketing: "Content",
    finance: "Finance",
    ops: "Ops",
  };

  const priorityTone: Record<string, MetricTone> = {
    critical: "bad",
    high: "warn",
    medium: "neutral",
  };

  // Build time-boxed schedule
  let clock = 0;
  const taskRows = tasks
    .map((task) => {
      const title = getString(task.title) ?? "Task";
      const description = getString(task.description) ?? "";
      const category = getString(task.category) ?? "ops";
      const priority = getString(task.priority) ?? "medium";
      const minutes = getNumber(task.time_minutes) ?? 10;
      const revenue = getNumber(task.revenue_impact) ?? 0;
      const source = getString(task.source) ?? "";
      const actionScene = getString(task.action_scene) as
        | SceneKey
        | undefined;
      const taskId = getString(task.id) ?? "";

      const startMin = clock;
      clock += minutes;
      const timeLabel = `${startMin}:${String(startMin + minutes).padStart(2, "0")}`;
      const revenueLabel =
        revenue > 0 ? ` | ${toCurrency(revenue)} at stake` : "";
      const badge = categoryIcon[category] ?? "Task";
      const priorityClass =
        priority === "critical"
          ? "metric-card--bad"
          : priority === "high"
            ? "metric-card--warn"
            : "";

      const actionArgs = asRecord(task.action_args);
      const actionArgsJson = actionArgs ? JSON.stringify(actionArgs) : "";
      const actionButton = actionScene
        ? ` <button class="action-plan-go" data-action-scene="${escapeHtml(actionScene)}" data-task-id="${escapeHtml(taskId)}" data-action-args="${escapeHtml(actionArgsJson)}">Go &rarr;</button>`
        : "";

      return `<div class="action-plan-task ${priorityClass}" data-task-id="${escapeHtml(taskId)}">
  <div class="action-plan-time">${escapeHtml(String(startMin))}-${escapeHtml(String(startMin + minutes))} min</div>
  <div class="action-plan-content">
    <div class="action-plan-header">
      <span class="action-plan-badge">${escapeHtml(badge)}</span>
      <span class="action-plan-priority action-plan-priority--${escapeHtml(priority)}">${escapeHtml(priority)}</span>
      ${actionButton}
    </div>
    <h4 class="action-plan-title">${escapeHtml(title)}</h4>
    <p class="action-plan-desc">${escapeHtml(description)}</p>
    <div class="action-plan-meta">${escapeHtml(source)}${revenueLabel}</div>
  </div>
</div>`;
    })
    .join("");

  const criticalCount = tasks.filter(
    (t) => getString(t.priority) === "critical",
  ).length;
  const highCount = tasks.filter(
    (t) => getString(t.priority) === "high",
  ).length;

  return {
    kicker: "Action Plan",
    title: `${timeboxMinutes} Minutes. ${totalTasks} Moves.`,
    subtitle: `Ranked by revenue impact times urgency. ${toCurrency(totalRevenue)} at stake across ${totalTasks} tasks.`,
    metrics: [
      {
        label: "Time Budget",
        value: `${totalMinutes}/${timeboxMinutes} min`,
        tone: totalMinutes <= timeboxMinutes ? "good" : "warn",
      },
      {
        label: "Revenue at Stake",
        value: toCurrency(totalRevenue),
        tone: "good",
      },
      {
        label: "Critical",
        value: String(criticalCount),
        tone: criticalCount > 0 ? "bad" : "neutral",
      },
      {
        label: "High Priority",
        value: String(highCount),
        tone: highCount > 0 ? "warn" : "neutral",
      },
    ],
    bodyHtml: `<style>
  .action-plan-task {
    display: flex;
    gap: var(--space-300, 12px);
    padding: var(--space-300, 12px) var(--space-400, 16px);
    border-radius: var(--radius-m, 8px);
    background: var(--mk-card-bg, rgba(0,255,0,0.04));
    border-left: 3px solid var(--mk-border, #22422d);
    margin-bottom: var(--space-200, 8px);
    transition: border-color 0.15s;
  }
  .action-plan-task.metric-card--bad {
    border-left-color: var(--mk-tone-bad, #ff4444);
  }
  .action-plan-task.metric-card--warn {
    border-left-color: var(--mk-tone-warn, #ffaa00);
  }
  .action-plan-time {
    min-width: 60px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--mk-text-muted, #889988);
    padding-top: 2px;
    white-space: nowrap;
  }
  .action-plan-content { flex: 1; min-width: 0; }
  .action-plan-header {
    display: flex;
    align-items: center;
    gap: var(--space-200, 8px);
    margin-bottom: 4px;
  }
  .action-plan-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mk-accent, #01ff00);
    background: rgba(0,255,0,0.08);
    padding: 1px 6px;
    border-radius: 3px;
  }
  .action-plan-priority {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: 3px;
  }
  .action-plan-priority--critical {
    color: #ff4444;
    background: rgba(255,68,68,0.1);
  }
  .action-plan-priority--high {
    color: #ffaa00;
    background: rgba(255,170,0,0.1);
  }
  .action-plan-priority--medium {
    color: var(--mk-text-muted, #889988);
    background: rgba(136,153,136,0.1);
  }
  .action-plan-go {
    margin-left: auto;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--mk-accent, #01ff00);
    background: rgba(0,255,0,0.08);
    border: 1px solid rgba(0,255,0,0.2);
    border-radius: 4px;
    padding: 2px 10px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .action-plan-go:hover {
    background: rgba(0,255,0,0.15);
  }
  .action-plan-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--mk-text, #e0ffe0);
    margin: 0 0 4px 0;
  }
  .action-plan-desc {
    font-size: 0.75rem;
    color: var(--mk-text-secondary, #aaccaa);
    margin: 0 0 4px 0;
    line-height: 1.4;
  }
  .action-plan-meta {
    font-size: 0.65rem;
    color: var(--mk-text-muted, #889988);
  }
</style>
<div class="action-plan-list">
  ${taskRows || '<div class="scene-empty">No tasks generated. Try adjusting the timebox.</div>'}
</div>`,
    actions: [
      actionTool(
        "Refresh Plan",
        "daily_priorities",
        { timebox_minutes: timeboxMinutes },
        "primary",
      ),
      actionScene("Pipeline", "pipeline"),
      actionScene("Overview", "overview"),
    ],
  };
}

function buildCallPrepScene(): SceneModel {
  // First: check for direct prep_call result
  const prepSnapshot = state.sceneCache.get("call-prep");
  const prep = asRecord(prepSnapshot?.payload);

  if (prep && getString(prep.tool) === "prep_call") {
    const companyName = getString(prep.company_name) ?? "Target account";
    const signalsSummary = asRecord(prep.signals_summary);
    const warmest = asRecord(signalsSummary?.warmest_intent);
    const totalSignals = getNumber(signalsSummary?.total_signals) ?? 0;
    const avgIntent = getNumber(signalsSummary?.average_intent_score) ?? 0;
    const warmestName = getString(warmest?.name);
    const warmestScore = getNumber(warmest?.intent_score);
    const financialHighlight = getString(prep.financial_highlight) ?? "";
    const talkingPoints = asStringArray(prep.talking_points);
    const doNotDo = asStringArray(prep.do_not_do);
    const riskArea = getString(prep.risk_area) ?? "unknown";
    const callScript = getString(prep.call_script) ?? "";
    const dealInfo =
      DEAL_LOOKUP[getString(prep.company_key)?.toLowerCase() ?? ""];

    const riskTone: MetricTone =
      riskArea === "low" ? "good" : riskArea === "medium" ? "warn" : "bad";

    return {
      kicker: "Call Prep",
      title: `Executive Brief — ${companyName}`,
      subtitle: financialHighlight || `Briefing for your ${companyName} call.`,
      metrics: [
        { label: "Account", value: companyName },
        {
          label: "Primary Contact",
          value: dealInfo?.contact ?? warmestName ?? "n/a",
        },
        {
          label: "Signals",
          value: String(totalSignals),
          tone: totalSignals > 3 ? "good" : "neutral",
        },
        {
          label: "Avg Intent",
          value: String(avgIntent),
          tone: avgIntent >= 70 ? "good" : avgIntent >= 40 ? "warn" : "bad",
        },
        { label: "Risk Area", value: humanizeKey(riskArea), tone: riskTone },
        ...(dealInfo
          ? [{ label: "Deal Size", value: toCurrency(dealInfo.dealSize) }]
          : []),
      ],
      bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Talking points</h3>
    <ul class="insight-list">
      ${
        talkingPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("") ||
        "<li>Run research and signals first for contextual points.</li>"
      }
    </ul>
  </section>
  <section class="insight-card">
    <h3>Do NOT do</h3>
    <ul class="insight-list">
      ${
        doNotDo.map((d) => `<li>${escapeHtml(d)}</li>`).join("") ||
        "<li>Don't lead with discount.</li>"
      }
    </ul>
  </section>
</div>${
        warmestName
          ? `<div class="insight-card" style="margin-top:var(--space-400)">
  <h3>Warmest contact</h3>
  <p class="body-copy">${escapeHtml(warmestName)} — intent score ${
    warmestScore ?? "?"
  }/100. ${callScript ? escapeHtml(callScript) : ""}</p>
</div>`
          : ""
      }`,
      actions: [
        actionScene("Outreach", "outreach", "primary"),
        actionScene("Pricing", "pricing"),
        actionScene("Signals", "signals"),
        actionScene("Action Plan", "action-plan"),
      ],
    };
  }

  // Fallback: stitch from other scene caches
  const research = asRecord(state.sceneCache.get("research")?.payload);
  const people = asRecord(state.sceneCache.get("people")?.payload);
  const signalsPayload = asRecord(state.sceneCache.get("signals")?.payload);
  const pricing = asRecord(state.sceneCache.get("pricing")?.payload);

  if (!research && !people && !signalsPayload && !pricing) {
    return emptyScene("call-prep");
  }

  // Extract company name from whichever cache has it
  const company = research ? asRecord(research.company) ?? research : undefined;
  const companyName =
    (company
      ? getString(company.company_name) ?? getString(company.name)
      : undefined) ??
    (signalsPayload ? getString(signalsPayload.company_name) : undefined) ??
    (people ? getString(people.company_name) : undefined) ??
    humanizeKey(state.pricing.companyKey);

  // Extract contact from people cache or DEAL_LOOKUP
  const contacts = people ? extractContacts(people) : [];
  const firstContact = contacts[0] ?? {};
  const contactName =
    getString(firstContact.name) ??
    `${getString(firstContact.first_name) ?? ""} ${
      getString(firstContact.last_name) ?? ""
    }`.trim();
  const contactRole = getString(firstContact.title);

  // Use DEAL_LOOKUP when pricing cache is empty
  const fallbackDeal = DEAL_LOOKUP[state.pricing.companyKey.toLowerCase()];
  const fallbackContact = fallbackDeal?.contact;

  const summary = pricing ? asRecord(pricing.summary) : null;
  const expected = pricing
    ? asRecord(asRecord(pricing.pricing)?.expected_value)
    : null;
  const verdict =
    getString(summary?.verdict) ??
    getString(expected?.verdict) ??
    "Use value-first pricing posture";
  const runway = getNumber(summary?.runway_after);
  const margin = getNumber(summary?.gross_margin_after);
  const evDiff =
    getNumber(summary?.ev_ltv_diff) ?? getNumber(expected?.ltv_ev_diff);
  const signalEntries = signalsPayload
    ? asRecordArray(signalsPayload.signals).sort(
        (a, b) =>
          (toFiniteNumber(b.intent_score) ?? 0) -
          (toFiniteNumber(a.intent_score) ?? 0),
      )
    : [];
  const signalCount = signalEntries.length;
  const topSignal = signalEntries[0];
  const topSignalName = topSignal ? getString(topSignal.name) : undefined;
  const topSignalScore = topSignal
    ? toFiniteNumber(topSignal.intent_score)
    : undefined;
  const socialPostsHtml = renderSocialPostsCard(signalEntries);

  const displayContact =
    contactName || fallbackContact || topSignalName || "n/a";
  const displayDealSize = fallbackDeal?.dealSize ?? state.pricing.dealSize;

  const talkingPoints = [
    `Lead with account context for ${companyName}.`,
    displayContact !== "n/a"
      ? `Anchor conversation around ${displayContact}${
          contactRole ? ` (${contactRole})` : ""
        }.`
      : "Identify the buyer role before discussing discounts.",
    `Pricing posture: ${verdict}.`,
    `Deal size: ${toCurrency(displayDealSize)}.`,
    signalCount
      ? `${signalCount} engagement signals support urgency framing.${
          topSignalName
            ? ` ${topSignalName} is warmest (${topSignalScore ?? "??"}/100).`
            : ""
        }`
      : "Run signals to get intent-backed urgency framing.",
  ];

  return {
    kicker: "Call Prep",
    title: `Executive Brief — ${companyName}`,
    subtitle: `Prep card for your ${companyName} call.`,
    metrics: [
      { label: "Account", value: companyName },
      { label: "Primary Contact", value: displayContact },
      {
        label: "Signals",
        value: String(signalCount),
        tone: signalCount > 3 ? "good" : "neutral",
      },
      {
        label: "Deal Size",
        value: toCurrency(displayDealSize),
      },
      ...(margin !== undefined
        ? [{ label: "Gross Margin", value: toPercent(margin) }]
        : []),
      ...(evDiff !== undefined
        ? [
            {
              label: "LTV EV Δ",
              value: toCurrency(evDiff),
              tone: (evDiff >= 0 ? "good" : "warn") as MetricTone,
            },
          ]
        : []),
    ],
    bodyHtml: `<div class="split-grid">
  <section class="insight-card">
    <h3>Talking points</h3>
    <ul class="insight-list">
      ${talkingPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
    </ul>
  </section>
  <section class="insight-card">
    <h3>Objection prep</h3>
    <ul class="insight-list">
      <li>Budget pressure: tie pricing to expected-value uplift and risk reduction.</li>
      <li>Timing pushback: reference current intent signals and launch urgency.</li>
      <li>Discount ask: offer payment terms before margin-destructive concessions.</li>
    </ul>
  </section>
</div>${socialPostsHtml}`,
    actions: [
      actionScene("Outreach", "outreach", "primary"),
      actionScene("Pricing", "pricing"),
      actionScene("Signals", "signals"),
      actionScene("Action Plan", "action-plan"),
    ],
  };
}

function canBuildCallPrep(): boolean {
  return (
    state.sceneCache.has("call-prep") ||
    state.sceneCache.has("research") ||
    state.sceneCache.has("people") ||
    state.sceneCache.has("signals") ||
    state.sceneCache.has("pricing")
  );
}

function buildGenericScene(snapshot?: SceneSnapshot): SceneModel {
  if (!snapshot) return buildOverviewScene();
  const payload = asRecord(snapshot.payload);
  const metrics = payload ? metricFromFacts(payload, 8) : [];
  return {
    kicker: "Overview",
    title: friendlyToolName(snapshot.toolName),
    subtitle: "Tool result received and mapped to the nearest use-case.",
    metrics,
    bodyHtml: `<div class="insight-card">
  <h3>Status</h3>
  <p class="body-copy">This payload is available for use in downstream call prep and outreach scenes.</p>
</div>`,
    actions: [actionScene("Call Prep", "call-prep")],
  };
}

function buildScene(scene: SceneKey, snapshot?: SceneSnapshot): SceneModel {
  if (scene === "overview") return buildOverviewScene();
  if (scene === "research") return buildResearchScene(snapshot);
  if (scene === "people") return buildPeopleScene(snapshot);
  if (scene === "signals") return buildSignalsScene(snapshot);
  if (scene === "pricing") return buildPricingScene(snapshot);
  if (scene === "deal-impact") return buildDealImpactScene();
  if (scene === "pipeline") return buildPipelineScene(snapshot);
  if (scene === "outreach") return buildOutreachScene(snapshot);
  if (scene === "content") return buildContentScene(snapshot);
  if (scene === "cold-mail") return buildColdMailScene(snapshot);
  if (scene === "call-prep") return buildCallPrepScene();
  if (scene === "action-plan") return buildActionPlanScene(snapshot);
  return buildGenericScene(snapshot);
}

function animateSceneSwap(): void {
  const body = elements.body;
  const metrics = elements.metrics;
  if (!body || !metrics) return;
  body.classList.remove("scene-enter");
  metrics.classList.remove("scene-enter");
  void body.offsetWidth;
  body.classList.add("scene-enter");
  metrics.classList.add("scene-enter");
}

function renderActiveScene(): void {
  const scene = state.activeScene;
  const snapshot = state.sceneCache.get(scene);
  const model = buildScene(scene, snapshot);

  if (elements.kicker) elements.kicker.textContent = model.kicker;
  if (elements.title) elements.title.textContent = model.title;
  if (elements.subtitle) elements.subtitle.textContent = model.subtitle;
  if (elements.metrics)
    elements.metrics.innerHTML = renderMetrics(model.metrics);
  if (elements.body) elements.body.innerHTML = model.bodyHtml;
  attachCompanyLogoFallbacks();
  renderActionButtons(model.actions);
  animateSceneSwap();
  attachSceneSpecificInteractions(scene);
  updateUseCaseRail();

  // Force size re-notification so the host iframe resizes to fit content
  requestAnimationFrame(() => {
    app.setupSizeChangedNotifications();
  });
}

function attachCompanyLogoFallbacks(): void {
  const logoImages =
    document.querySelectorAll<HTMLImageElement>(".company-logo__img");
  for (const image of logoImages) {
    if (image.dataset.fallbackBound === "1") continue;
    image.dataset.fallbackBound = "1";

    image.addEventListener("load", () => {
      image.closest(".company-logo")?.classList.remove("is-empty");
    });

    image.addEventListener("error", () => {
      const wrapper = image.closest(".company-logo");
      const chainRaw = image.dataset.logoFallback ?? "";
      const chain = chainRaw
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
      const next = chain.shift();
      image.dataset.logoFallback = chain.join("|");

      if (next && image.src !== next) {
        image.src = next;
        return;
      }

      wrapper?.classList.add("is-empty");
      image.remove();
    });
  }
}

async function runAction(action: SceneAction): Promise<void> {
  if (action.type === "scene") {
    setActiveScene(action.scene);
    return;
  }
  await runTool(action.toolName, action.args);
}

function updatePricingDraftFromControls(): void {
  const dealSizeInput = document.getElementById(
    "pricing-deal-size",
  ) as HTMLInputElement | null;
  const stageInput = document.getElementById(
    "pricing-stage",
  ) as HTMLSelectElement | null;
  const discountInput = document.getElementById(
    "pricing-discount",
  ) as HTMLInputElement | null;
  const discountLabel = document.getElementById("pricing-discount-label");

  const dealSize = Number(dealSizeInput?.value ?? state.pricing.dealSize);
  if (Number.isFinite(dealSize) && dealSize > 0)
    state.pricing.dealSize = dealSize;
  const stage = stageInput?.value as DealStage | undefined;
  if (
    stage &&
    (stage === "discovery" ||
      stage === "proposal_sent" ||
      stage === "negotiation" ||
      stage === "verbal_commit")
  ) {
    state.pricing.dealStage = stage;
  }
  const discount = Number(discountInput?.value ?? state.pricing.discountPct);
  if (Number.isFinite(discount)) {
    state.pricing.discountPct = Math.max(0, Math.min(40, discount));
  }
  if (discountLabel) {
    discountLabel.textContent = `${state.pricing.discountPct}%`;
  }
}

async function runPricingSimulationFromControls(): Promise<void> {
  updatePricingDraftFromControls();
  if (!state.pricing.companyKey) {
    setStatus("Pricing simulation requires a company key.");
    return;
  }
  await runTool("sales_intelligence", {
    mode: "pricing",
    company_key: state.pricing.companyKey,
    deal_size: state.pricing.dealSize,
    discount_pct: state.pricing.discountPct,
    deal_stage: state.pricing.dealStage,
  });
}

function attachSceneSpecificInteractions(scene: SceneKey): void {
  if (scene === "action-plan") {
    const SCENE_TO_TOOL: Record<string, { tool: string; args: Record<string, unknown> }> = {
      outreach: { tool: "outreach_sequence_workspace", args: { mode: "list", limit: 10 } },
      pipeline: { tool: "pipeline_workspace", args: { mode: "list", include_trend: true } },
      content: { tool: "content_calendar_workspace", args: { mode: "list", limit: 15 } },
      "cold-mail": { tool: "cold_mail_health", args: { mode: "status" } },
      overview: { tool: "customer_workspace_snapshot", args: {} },
    };
    const goButtons = document.querySelectorAll<HTMLButtonElement>(
      ".action-plan-go[data-action-scene]",
    );
    for (const button of goButtons) {
      button.onclick = () => {
        const target = button.dataset.actionScene as string | undefined;
        if (!target) return;

        // Use task-specific action_args if present
        let taskArgs: Record<string, unknown> | undefined;
        try {
          const raw = button.dataset.actionArgs;
          if (raw) taskArgs = JSON.parse(raw) as Record<string, unknown>;
        } catch { /* ignore */ }

        const mapping = SCENE_TO_TOOL[target];
        const toolName = mapping?.tool;
        const toolArgs = taskArgs
          ? { ...mapping?.args, ...taskArgs }
          : mapping?.args;

        if (toolName && toolArgs) {
          button.textContent = "Loading...";
          button.disabled = true;
          runTool(toolName, toolArgs)
            .then(() => {
              button.textContent = "Done";
              button.disabled = false;
            })
            .catch(() => {
              button.textContent = "Go \u2192";
              button.disabled = false;
              setActiveScene(target as SceneKey);
            });
        } else {
          setActiveScene(target as SceneKey);
        }
      };
    }
    return;
  }

  if (scene !== "pricing") return;

  const roleButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-pricing-role]",
  );
  for (const button of roleButtons) {
    button.onclick = () => {
      const role = button.dataset.pricingRole as RolePerspective | undefined;
      if (!role) return;
      state.pricingRole = role;
      renderActiveScene();
    };
  }

  const runButton = document.getElementById("pricing-run");
  runButton?.addEventListener("click", () => {
    void runPricingSimulationFromControls();
  });

  const discountInput = document.getElementById(
    "pricing-discount",
  ) as HTMLInputElement | null;
  discountInput?.addEventListener("input", () => {
    updatePricingDraftFromControls();
    refreshPricingPreviewFromDraft();
  });

  const dealSizeInput = document.getElementById(
    "pricing-deal-size",
  ) as HTMLInputElement | null;
  dealSizeInput?.addEventListener("input", () => {
    updatePricingDraftFromControls();
    refreshPricingPreviewFromDraft();
  });

  const stageInput = document.getElementById("pricing-stage");
  stageInput?.addEventListener("change", () => {
    updatePricingDraftFromControls();
    void runPricingSimulationFromControls();
  });
}

function applyIncomingToolResult(raw: unknown, fallbackTool?: string): void {
  const normalized = normalizeToolPayload(raw, fallbackTool);
  state.latestToolName = normalized.toolName;

  const scene = inferScene(normalized.toolName, normalized.payload);
  state.sceneCache.set(scene, {
    toolName: normalized.toolName,
    payload: normalized.payload,
    updatedAt: Date.now(),
  });

  if (scene === "pricing") {
    const payloadRecord = asRecord(normalized.payload);
    if (payloadRecord) {
      state.sceneCache.set("deal-impact", {
        toolName: normalized.toolName,
        payload: normalized.payload,
        updatedAt: Date.now(),
      });
      syncPricingFromPayload(payloadRecord);
    }
  }

  // Sync pricing state from company context
  const payloadRecord = asRecord(normalized.payload);
  if (payloadRecord) {
    const companyKey = extractCompanyKey(payloadRecord);
    if (companyKey) {
      const deal = DEAL_LOOKUP[companyKey.toLowerCase()];
      if (deal && state.pricing.companyKey !== companyKey.toLowerCase()) {
        state.pricing.companyKey = companyKey.toLowerCase();
        state.pricing.dealSize = deal.dealSize;
        state.pricing.dealStage = deal.dealStage;
      }
    }
  }

  if (scene === "deal-impact") {
    const pr = asRecord(normalized.payload);
    if (pr) syncPricingFromPayload(pr);
  }

  state.activeScene = scene;
  renderActiveScene();

  try {
    app
      .updateModelContext({
        context: [
          {
            type: "text",
            text: JSON.stringify({
              activeScene: scene,
              toolName: normalized.toolName,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      })
      .catch(() => {});
  } catch {
    /* silently ignore */
  }

  setStatus(`Updated from ${friendlyToolName(state.latestToolName)}.`);
  setLiveBadge("Live");
}

async function runTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<void> {
  setStatus(`Running ${friendlyToolName(toolName)}...`);
  setLiveBadge("Syncing");
  try {
    const result = await app.callServerTool({
      name: toolName,
      arguments: args,
    });
    const parsed = parseBridgeResult(result as BridgeToolResult);
    applyIncomingToolResult(parsed, toolName);
    setStatus(`Completed ${friendlyToolName(toolName)}.`);
    setLiveBadge("Live");
  } catch (error) {
    const message = (error as Error).message;
    setStatus(`Tool failed: ${friendlyToolName(toolName)} (${message})`);
    setLiveBadge("Error");
    if (elements.body) {
      elements.body.innerHTML = `<div class="error-card">${escapeHtml(
        message,
      )}</div>`;
    }
  }
}

function attachGlobalEvents(): void {
  const buttons =
    elements.rail?.querySelectorAll<HTMLButtonElement>("button[data-scene]");
  if (buttons) {
    for (const button of buttons) {
      button.onclick = () => {
        const scene = button.dataset.scene as SceneKey | undefined;
        if (!scene) return;
        setActiveScene(scene);
      };
    }
  }
}

function init(): void {
  applyBrandTheme();
  attachGlobalEvents();
  // Show branded loading state — not the empty cockpit
  if (elements.kicker) elements.kicker.textContent = "Markster Business OS";
  if (elements.title) elements.title.textContent = "Your AI Business Companion";
  if (elements.subtitle)
    elements.subtitle.textContent = "Ask me anything about your business.";
  if (elements.metrics) elements.metrics.innerHTML = "";
  if (elements.body)
    elements.body.innerHTML = `<div class="insight-card">
  <h3>Try asking</h3>
  <ul class="insight-list">
    <li>How's my business doing this morning?</li>
    <li>Tell me about the Figma deal</li>
    <li>What does my pipeline look like?</li>
    <li>Show me my tasks</li>
  </ul>
</div>`;
  renderActionButtons([]);
  setStatus("Waiting for a UI-enabled tool result...");
  setLiveBadge("Live");
  app.connect();
  app.setupSizeChangedNotifications();
}

app.ontoolresult = (result) => {
  const parsed = parseBridgeResult(result as BridgeToolResult);
  applyIncomingToolResult(parsed);
};

init();
