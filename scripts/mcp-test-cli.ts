#!/usr/bin/env tsx
import { MARKSTER_TOOL_CATALOG } from "../src/shared/marksterToolManifest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type CliCommand = "check" | "list-tools" | "health" | "call" | "walkthrough";

type ParsedArgs = {
  command: CliCommand;
  endpoint: string;
  timeoutMs: number;
  outputJson: boolean;
  verbose: boolean;
  pretty: boolean;

  companyName: string;
  companyKey: string;
  dealSize: number;
  discountPct: number;
  walkthroughFile: string;
  strictWalkthrough: boolean;

  callToolName?: string;
  callToolArgs?: Record<string, unknown>;
  requireAllTools: boolean;
  skipSmokeChecks: boolean;
};

type ValidationRecord = {
  name: string;
  pass: boolean;
  message: string;
  durationMs: number;
};

type MCPError = {
  code: number;
  message: string;
};

type MCPEnvelope = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: Record<string, unknown>;
  error?: MCPError;
};

type ToolResult = {
  content?: Array<{ type?: string; text?: string; [key: string]: unknown }>;
};

type ToolListResult = {
  tools?: Array<{ name?: string; [key: string]: unknown }>;
};

type CallContext = {
  endpoint: string;
  baseEndpoint: string;
  timeoutMs: number;
  verbose: boolean;
};

const DEFAULT_ENDPOINT =
  process.env.MCP_TEST_ENDPOINT?.trim() ??
  process.env.MCP_URL?.trim() ??
  "http://127.0.0.1:3001/mcp";

const DEFAULT_TIMEOUT_MS = 12_000;

const VALIDATION_TOOLS = MARKSTER_TOOL_CATALOG.map((entry) => entry.name);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isToolResult(value: unknown): value is ToolResult {
  return isObject(value) && "content" in value;
}

function usage(): string {
  return `
Usage:
  npm run mcp:test [check|list-tools|health|call|walkthrough] [options]

Commands:
  check       Run full validation suite (default)
  list-tools  List tools exposed by the MCP server
  health      Check health endpoint
  call        Call one MCP tool with explicit JSON args
  walkthrough Run the docs/demo-walkthrough.md sequence against live tools

Options:
  --endpoint, -e <url>       MCP /mcp endpoint (default: ${DEFAULT_ENDPOINT})
  --timeout-ms <ms>          Request timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS})
  --company-name <name>       Company name used for research checks (default: Anthropic)
  --company-key <key>         Company key used for signal/pricing checks (default: anthropic)
  --deal-size <value>         Deal size for pricing check (default: 250000)
  --discount-pct <value>      Discount percentage for pricing check (default: 15)
  --json                      Print machine-readable JSON result
  --pretty                    Pretty-print tool payloads (default: true)
  --compact                   Keep tool response output compact
  --verbose, -v               Print request/response details
  --no-smoke                  Skip tool smoke calls
  --walkthrough-file <path>    Demo walkthrough markdown file (default: docs/demo-walkthrough.md)
  --strict-walkthrough        Fail walkthrough if any step is skipped

Call command options:
  --tool <name>               Tool name to call
  --args <json>               Tool args JSON object

Examples:
  npm run mcp:test -- check --endpoint http://127.0.0.1:3001/mcp
  npm run mcp:test -- health --endpoint https://yellow-bar-pakmq.run.mcp-use.com/mcp
  npm run mcp:test -- call --tool sales_intelligence --args '{"mode":"research","company_name":"Anthropic"}'
  npm run mcp:test:walkthrough -- --endpoint https://yellow-bar-pakmq.run.mcp-use.com/mcp
`;
}

function parseArgs(argv: string[]): ParsedArgs {
  const options: ParsedArgs = {
    command: "check",
    endpoint: DEFAULT_ENDPOINT,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    outputJson: false,
    verbose: false,
    pretty: true,
    companyName: "Anthropic",
    companyKey: "anthropic",
    dealSize: 250_000,
    discountPct: 15,
    walkthroughFile: "docs/demo-walkthrough.md",
    strictWalkthrough: false,
    requireAllTools: true,
    skipSmokeChecks: false,
  };

  const commandSet = new Set<CliCommand>([
    "check",
    "list-tools",
    "health",
    "call",
    "walkthrough",
  ]);

  let i = 0;
  let sawCommand = false;

  while (i < argv.length) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--args") {
      if (next === undefined) {
        throw new Error(`Missing value for ${arg}`);
      }
      const rawArgs = next;
      try {
        const parsed = JSON.parse(rawArgs);
        if (!isObject(parsed)) {
          throw new Error("Tool args must be an object");
        }
        options.callToolArgs = parsed;
      } catch {
        throw new Error(
          'Unable to parse --args JSON. Use format: \'{"company_name":"Anthropic"}\'',
        );
      }
      i += 2;
      continue;
    }

    if (arg.startsWith("--") || arg === "-e" || arg === "-v") {
      if (arg === "--endpoint" || arg === "-e") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.endpoint = next;
        i += 2;
        continue;
      }

      if (arg === "--timeout-ms") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.timeoutMs = Number.parseInt(next, 10);
        i += 2;
        continue;
      }

      if (arg === "--company-name") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.companyName = next;
        i += 2;
        continue;
      }

      if (arg === "--company-key") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.companyKey = next;
        i += 2;
        continue;
      }

      if (arg === "--deal-size") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.dealSize = Number.parseFloat(next);
        i += 2;
        continue;
      }

      if (arg === "--discount-pct") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.discountPct = Number.parseFloat(next);
        i += 2;
        continue;
      }

      if (arg === "--tool") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.callToolName = next;
        i += 2;
        continue;
      }

      if (arg === "--json") {
        options.outputJson = true;
        i += 1;
        continue;
      }

      if (arg === "--pretty") {
        options.pretty = true;
        i += 1;
        continue;
      }

      if (arg === "--compact") {
        options.pretty = false;
        i += 1;
        continue;
      }

      if (arg === "--verbose" || arg === "-v") {
        options.verbose = true;
        i += 1;
        continue;
      }

      if (arg === "--no-smoke") {
        options.skipSmokeChecks = true;
        i += 1;
        continue;
      }

      if (arg === "--walkthrough-file") {
        if (next === undefined) {
          throw new Error(`Missing value for ${arg}`);
        }
        options.walkthroughFile = next;
        i += 2;
        continue;
      }

      if (arg === "--strict-walkthrough") {
        options.strictWalkthrough = true;
        i += 1;
        continue;
      }

      throw new Error(`Unknown flag: ${arg}`);
    }

    if (!sawCommand && commandSet.has(arg as CliCommand)) {
      options.command = arg as CliCommand;
      sawCommand = true;
      i += 1;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

function parseEndpoint(endpoint: string): {
  mcpUrl: string;
  healthUrl: string;
} {
  const raw = endpoint.trim();
  if (!raw) {
    throw new Error("Endpoint cannot be empty.");
  }

  const url = new URL(raw);
  const basePath = url.pathname.replace(/\/+$/u, "") || "/";
  const mcpPath = basePath.endsWith("/mcp")
    ? basePath
    : `${basePath === "/" ? "" : basePath}/mcp`;

  const mcpUrl = `${url.origin}${mcpPath}`;
  const healthPath = mcpPath.endsWith("/mcp")
    ? mcpPath.slice(0, -4) || "/"
    : mcpPath;
  const healthUrl = `${url.origin}${healthPath}`;

  return { mcpUrl, healthUrl };
}

function parseSSEPayload(body: string): MCPEnvelope {
  const raw = body.trim();

  const tryJson = (value: string): MCPEnvelope => {
    const parsed = JSON.parse(value) as MCPEnvelope;
    if (parsed?.jsonrpc !== "2.0") {
      throw new Error("Invalid MCP response: missing jsonrpc");
    }
    return parsed;
  };

  try {
    return tryJson(raw);
  } catch {
    const dataLines = raw
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:") && line.length > 5)
      .map((line) => line.slice(5).trim())
      .filter((line) => line.length > 0);

    if (dataLines.length === 0) {
      throw new Error("Failed to parse MCP payload (empty SSE body)");
    }

    return tryJson(dataLines[dataLines.length - 1]!);
  }
}

async function requestJson(
  url: string,
  options: { method: string; body?: string; headers?: Record<string, string> },
  timeoutMs: number,
): Promise<Response> {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: timeoutController.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

class MCPHttpClient {
  private readonly context: CallContext;
  private requestId = 1;

  constructor(context: CallContext) {
    this.context = context;
  }

  private log(message: string): void {
    if (this.context.verbose) {
      console.log(`[mcp-test-cli] ${message}`);
    }
  }

  async call(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const requestBody = {
      jsonrpc: "2.0",
      id: this.requestId,
      method,
      params: params ?? {},
    } satisfies Record<string, unknown>;

    this.requestId += 1;

    const response = await requestJson(
      this.context.endpoint,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      this.context.timeoutMs,
    );

    this.log(`POST ${method} -> ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(
        `MCP call failed (${method}): HTTP ${response.status} ${response.statusText}`,
      );
    }

    const responseText = await response.text();
    this.log(`response: ${responseText}`);

    const envelope = parseSSEPayload(responseText);
    if (envelope.error) {
      throw new Error(
        `MCP protocol error (${method}): ${envelope.error.code} ${envelope.error.message}`,
      );
    }
    return envelope.result ?? {};
  }

  async callToolsList(): Promise<ToolListResult> {
    const result = await this.call("tools/list");
    if (!isObject(result)) {
      throw new Error("tools/list did not return an object");
    }
    return result as ToolListResult;
  }

  async callTool(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<ToolResult> {
    const params = args ? { name, arguments: args } : { name };
    const result = await this.call("tools/call", params);
    if (!isToolResult(result)) {
      throw new Error(`Tool call did not return MCP content payload: ${name}`);
    }
    return result;
  }
}

function parseToolTextPayload(result: ToolResult): unknown {
  const content = result.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error("Tool response has no content");
  }

  const first = content[0];
  if (!first || typeof first !== "object" || typeof first.text !== "string") {
    throw new Error("Tool response content did not include text");
  }

  const text = first.text.trim();
  if (text.startsWith("{") || text.startsWith("[")) {
    return JSON.parse(text);
  }
  return text;
}

function extractToolError(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    const message = payload.trim();
    return message.startsWith("MCP error") ? message : undefined;
  }

  if (isObject(payload) && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
    if (isObject(error) && "message" in error) {
      const message = error.message;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
  }

  return undefined;
}

function renderToolPayload(payload: unknown, pretty: boolean): string {
  if (typeof payload === "string") {
    return payload;
  }

  try {
    return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

type WalkthroughAction =
  | {
      kind: "tool-call";
      label: string;
      toolName: string;
      toolArgs: Record<string, unknown>;
      required: boolean;
    }
  | {
      kind: "note";
      label: string;
      message: string;
      required: boolean;
    };

type ParsedWalkthroughStep = {
  number: number;
  title: string;
};

function parseWalkthroughSteps(markdown: string): ParsedWalkthroughStep[] {
  const headingRegex = /^## Step\s+(\d+):\s*(.+)$/gm;
  const matches = Array.from(markdown.matchAll(headingRegex));

  return matches.map((match) => ({
    number: Number.parseInt(match[1] ?? "0", 10),
    title: (match[2] ?? "").trim(),
  }));
}

function buildWalkthroughActions(
  step: ParsedWalkthroughStep,
  options: ParsedArgs,
): WalkthroughAction[] {
  const title = step.title.toLowerCase();

  if (title.includes("company research")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: company research`,
        toolName: "sales_intelligence",
        toolArgs: { mode: "research", company_name: options.companyName },
        required: true,
      },
    ];
  }

  if (title.includes("right people")) {
    return [
      {
        kind: "note",
        label: `Step ${step.number}: find people`,
        required: false,
        message:
          "No direct fetch_contacts tool is currently exposed in this curated toolset.",
      },
    ];
  }

  if (title.includes("deal impact analysis")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: deal impact baseline`,
        toolName: "sales_intelligence",
        toolArgs: {
          mode: "pricing",
          company_key: options.companyKey,
          deal_size: options.dealSize,
          discount_pct: 0,
        },
        required: false,
      },
    ];
  }

  if (title.includes("pricing simulator")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: pricing scenario`,
        toolName: "sales_intelligence",
        toolArgs: {
          mode: "pricing",
          company_key: options.companyKey,
          deal_size: options.dealSize,
          discount_pct: options.discountPct,
        },
        required: true,
      },
    ];
  }

  if (title.includes("role-based views")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: role-based dashboard`,
        toolName: "dashboard_insights",
        toolArgs: { mode: "dashboard", metric: "role_views" },
        required: true,
      },
    ];
  }

  if (title.includes("engagement signals")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: engagement signals`,
        toolName: "sales_intelligence",
        toolArgs: {
          mode: "signals",
          company_key: options.companyKey,
        },
        required: true,
      },
    ];
  }

  if (title.includes("call prep")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: call prep snapshot`,
        toolName: "customer_workspace_snapshot",
        toolArgs: {},
        required: true,
      },
      {
        kind: "tool-call",
        label: `Step ${step.number}: call prep signals`,
        toolName: "sales_intelligence",
        toolArgs: {
          mode: "signals",
          company_key: options.companyKey,
        },
        required: true,
      },
    ];
  }

  if (title.includes("draft & send outreach")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: outreach workspace`,
        toolName: "outreach_sequence_workspace",
        toolArgs: {},
        required: true,
      },
      {
        kind: "note",
        label: `Step ${step.number}: send draft`,
        required: false,
        message:
          "Live outreach send/enrollment is intentionally excluded from automation for demo safety.",
      },
    ];
  }

  if (title.includes("pipeline")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: pipeline dashboard`,
        toolName: "dashboard_insights",
        toolArgs: { mode: "metrics", metric: "pipeline" },
        required: true,
      },
    ];
  }

  if (title.includes("content & social")) {
    return [
      {
        kind: "tool-call",
        label: `Step ${step.number}: content calendar`,
        toolName: "content_calendar_workspace",
        toolArgs: {},
        required: true,
      },
      {
        kind: "tool-call",
        label: `Step ${step.number}: content social accounts`,
        toolName: "content_social_accounts",
        toolArgs: {},
        required: true,
      },
    ];
  }

  return [
    {
      kind: "note",
      label: `Step ${step.number}: ${step.title}`,
      required: false,
      message: "Step not mapped to currently exposed tools.",
    },
  ];
}

async function runWalkthrough(
  client: MCPHttpClient,
  options: ParsedArgs,
): Promise<ValidationRecord[]> {
  const walkthroughPath = resolve(process.cwd(), options.walkthroughFile);
  const markdown = readFileSync(walkthroughPath, "utf-8");
  const steps = parseWalkthroughSteps(markdown);

  if (steps.length === 0) {
    return [
      {
        name: "walkthrough",
        pass: false,
        message: "No steps found in walkthrough file.",
        durationMs: 0,
      },
    ];
  }

  const records: ValidationRecord[] = [];
  let skippedCount = 0;
  let strictFail = false;

  const runAction = async (
    action: WalkthroughAction,
  ): Promise<ValidationRecord> => {
    const start = Date.now();

    if (action.kind === "note") {
      const message = `SKIP: ${action.message}`;
      if (action.required) {
        return {
          name: action.label,
          pass: false,
          message,
          durationMs: 0,
        };
      }
      if (options.strictWalkthrough) {
        skippedCount += 1;
        strictFail = true;
      }
      return {
        name: action.label,
        pass: true,
        message,
        durationMs: 0,
      };
    }

    try {
      const payload = parseToolTextPayload(
        await client.callTool(action.toolName, action.toolArgs),
      );
      const toolError = extractToolError(payload);
      if (toolError) {
        throw new Error(toolError);
      }
      return {
        name: action.label,
        pass: true,
        message: options.pretty
          ? `${action.toolName}: ${renderToolPayload(payload, options.pretty)}`
          : summarizeToolPayload(action.toolName, payload),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      if (!action.required) {
        skippedCount += 1;
        if (options.strictWalkthrough) {
          strictFail = true;
        }
        return {
          name: action.label,
          pass: true,
          message: `SKIP/OPTIONAL FAILED: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          durationMs: Date.now() - start,
        };
      }

      return {
        name: action.label,
        pass: false,
        message: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      };
    }
  };

  for (const step of steps) {
    const actions = buildWalkthroughActions(step, options);
    if (actions.length === 0) {
      const result: ValidationRecord = {
        name: `step-${step.number}: no-op`,
        pass: options.strictWalkthrough ? false : true,
        message: `No mapped actions for "${step.title}"`,
        durationMs: 0,
      };
      if (options.strictWalkthrough) {
        strictFail = true;
      }
      records.push(result);
      continue;
    }

    for (const action of actions) {
      records.push(await runAction(action));
    }
  }

  if (options.strictWalkthrough && (skippedCount > 0 || strictFail)) {
    return [
      ...records,
      {
        name: "walkthrough:strictness",
        pass: false,
        message: `Strict walkthrough enabled, optional failures encountered (${skippedCount}).`,
        durationMs: 0,
      },
    ];
  }

  return records;
}

function summarizeToolPayload(tool: string, payload: unknown): string {
  if (isObject(payload) && "company" in payload) {
    const company = payload.company;
    if (typeof company === "string") {
      return `${tool}: ${company}`;
    }
  }

  if (isObject(payload) && "company_name" in payload) {
    const companyName = payload.company_name;
    if (typeof companyName === "string") {
      return `${tool}: ${companyName}`;
    }
  }

  if (isObject(payload) && "source" in payload) {
    const source = payload.source;
    if (typeof source === "string") {
      return `${tool}: source=${source}`;
    }
  }

  return `${tool}: response received`;
}

function extractMetaSource(payload: unknown): string | undefined {
  if (!isObject(payload)) return undefined;

  const readMetaSource = (candidate: unknown): string | undefined => {
    if (!isObject(candidate)) return undefined;
    const meta = candidate._mcp_meta;
    if (!isObject(meta)) return undefined;
    const source = meta.source;
    return typeof source === "string" ? source : undefined;
  };

  const direct = readMetaSource(payload);
  if (direct) return direct;

  if (isObject(payload.payload)) {
    return readMetaSource(payload.payload);
  }

  return undefined;
}

function validatePayloadContains(result: unknown, fields: string[]): boolean {
  if (!isObject(result)) {
    return false;
  }

  return fields.every((field) =>
    Object.prototype.hasOwnProperty.call(result, field),
  );
}

async function runChecks(
  client: MCPHttpClient,
  options: ParsedArgs,
): Promise<ValidationRecord[]> {
  const checks: ValidationRecord[] = [];

  const execute = async (
    name: string,
    action: () => Promise<string>,
    required: boolean,
  ): Promise<ValidationRecord> => {
    const start = Date.now();
    try {
      const message = await action();
      return { name, pass: true, message, durationMs: Date.now() - start };
    } catch (error) {
      if (!required) {
        return {
          name,
          pass: false,
          message: `SKIP/OPTIONAL FAILED: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          durationMs: Date.now() - start,
        };
      }
      return {
        name,
        pass: false,
        message: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      };
    }
  };

  const init = await execute(
    "initialize",
    async () => {
      const result = (await client.call("initialize", {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: {
          name: "mcp-use-test-cli",
          version: "0.1.0",
        },
      })) as { serverInfo?: { name?: string } };
      return `protocolVersion initialized (server=${
        result?.serverInfo?.name ?? "unknown"
      })`;
    },
    true,
  );
  checks.push(init);

  const listResult = await execute(
    "tools/list",
    async () => {
      const result = await client.callToolsList();
      const tools = result.tools;
      if (!Array.isArray(tools)) {
        throw new Error("tools/list missing tools array");
      }

      const seen = new Set(
        tools
          .map((tool) => (isObject(tool) ? tool.name : undefined))
          .filter((name): name is string => typeof name === "string"),
      );

      const missing = VALIDATION_TOOLS.filter((name) => !seen.has(name));
      if (options.requireAllTools && missing.length > 0) {
        throw new Error(`Missing expected tool(s): ${missing.join(", ")}`);
      }

      return `${tools.length} tools available, missing=${missing.length}`;
    },
    true,
  );
  checks.push(listResult);

  if (!options.skipSmokeChecks) {
    const runtimeSwitchE2E = await execute(
      "tool:runtime_mode_switch.e2e",
      async () => {
        const switchedToMock = parseToolTextPayload(
          await client.callTool("runtime_mode_switch", { mode: "mock" }),
        );
        if (
          !isObject(switchedToMock) ||
          switchedToMock.workflow !== "runtime_mode_switch" ||
          switchedToMock.mode !== "mock"
        ) {
          throw new Error("runtime_mode_switch failed to enter mock mode");
        }

        const mockSnapshot = parseToolTextPayload(
          await client.callTool("outreach_sequence_workspace", {}),
        );
        const mockSource = extractMetaSource(mockSnapshot);
        if (mockSource !== "mock") {
          throw new Error(
            `Expected mock source after runtime switch, got '${
              mockSource ?? "unknown"
            }'`,
          );
        }

        const switchedToLive = parseToolTextPayload(
          await client.callTool("runtime_mode_switch", {
            mode: "live_with_fallback",
          }),
        );
        if (
          !isObject(switchedToLive) ||
          switchedToLive.workflow !== "runtime_mode_switch" ||
          switchedToLive.mode !== "live_with_fallback"
        ) {
          throw new Error(
            "runtime_mode_switch failed to return to live_with_fallback mode",
          );
        }

        const liveSnapshot = parseToolTextPayload(
          await client.callTool("outreach_sequence_workspace", {}),
        );
        const liveSource = extractMetaSource(liveSnapshot) ?? "unknown";
        return `runtime toggle ok (mock source=mock, live source=${liveSource})`;
      },
      true,
    );
    checks.push(runtimeSwitchE2E);

    const salesResearch = await execute(
      "tool:sales_intelligence.research",
      async () => {
        const payload = parseToolTextPayload(
          await client.callTool("sales_intelligence", {
            mode: "research",
            company_name: options.companyName,
          }),
        );
        if (
          !isObject(payload) ||
          !validatePayloadContains(payload, ["workflow", "mode", "source"]) ||
          payload.workflow !== "sales_intelligence" ||
          payload.mode !== "research"
        ) {
          throw new Error(
            "sales_intelligence research payload missing expected fields",
          );
        }
        return options.pretty
          ? `sales_intelligence.research payload:\n${renderToolPayload(
              payload,
              options.pretty,
            )}`
          : summarizeToolPayload("sales_intelligence.research", payload);
      },
      true,
    );
    checks.push(salesResearch);

    const salesSignals = await execute(
      "tool:sales_intelligence.signals",
      async () => {
        const payload = parseToolTextPayload(
          await client.callTool("sales_intelligence", {
            mode: "signals",
            company_key: options.companyKey,
          }),
        );
        if (
          !isObject(payload) ||
          !validatePayloadContains(payload, [
            "workflow",
            "mode",
            "company_key",
            "signals",
            "count",
          ]) ||
          payload.workflow !== "sales_intelligence" ||
          payload.mode !== "signals"
        ) {
          throw new Error(
            "sales_intelligence signals payload missing expected fields",
          );
        }
        return options.pretty
          ? `sales_intelligence.signals payload:\n${renderToolPayload(
              payload,
              options.pretty,
            )}`
          : summarizeToolPayload("sales_intelligence.signals", payload);
      },
      true,
    );
    checks.push(salesSignals);

    const salesPricing = await execute(
      "tool:sales_intelligence.pricing",
      async () => {
        const payload = parseToolTextPayload(
          await client.callTool("sales_intelligence", {
            mode: "pricing",
            company_key: options.companyKey,
            deal_size: options.dealSize,
            discount_pct: options.discountPct,
          }),
        );
        if (
          !isObject(payload) ||
          !validatePayloadContains(payload, [
            "workflow",
            "mode",
            "company_key",
            "deal_size",
            "discount_pct",
          ]) ||
          payload.workflow !== "sales_intelligence" ||
          payload.mode !== "pricing"
        ) {
          throw new Error(
            "sales_intelligence pricing payload missing expected fields",
          );
        }
        return options.pretty
          ? `sales_intelligence.pricing payload:\n${renderToolPayload(
              payload,
              options.pretty,
            )}`
          : summarizeToolPayload("sales_intelligence.pricing", payload);
      },
      true,
    );
    checks.push(salesPricing);
  }

  return checks;
}

async function run(): Promise<number> {
  let options: ParsedArgs;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    console.log(usage());
    return 2;
  }

  const { mcpUrl, healthUrl } = parseEndpoint(options.endpoint);
  const context: CallContext = {
    endpoint: mcpUrl,
    baseEndpoint: healthUrl,
    timeoutMs: options.timeoutMs,
    verbose: options.verbose,
  };

  const client = new MCPHttpClient(context);
  const records: ValidationRecord[] = [];
  const started = Date.now();

  const doHealthCheck = async (): Promise<ValidationRecord> => {
    const checkStart = Date.now();
    const response = await requestJson(
      context.baseEndpoint,
      { method: "GET" },
      context.timeoutMs,
    );
    if (!response.ok) {
      throw new Error(
        `Health check failed: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const body = await response.text();
    const payload = JSON.parse(body);
    if (!isObject(payload)) {
      throw new Error("Health response is not an object");
    }
    if (payload.status !== "running") {
      throw new Error(
        `Health check status unexpected: ${String(payload.status)}`,
      );
    }

    return {
      name: "health",
      pass: true,
      message: `status=${String(payload.status)} mode=${String(
        payload.mode ?? "n/a",
      )}`,
      durationMs: Date.now() - checkStart,
    };
  };

  if (options.command === "health") {
    records.push(await doHealthCheck());
  }

  if (options.command === "list-tools") {
    const listResult = await (async () => {
      const start = Date.now();
      const tools = await client.callToolsList();
      const names = (tools.tools ?? [])
        .map((tool) => (isObject(tool) ? tool.name : undefined))
        .filter((name): name is string => typeof name === "string")
        .sort();
      return {
        name: "tools/list",
        pass: true,
        message: names.join("\n"),
        durationMs: Date.now() - start,
      } satisfies ValidationRecord;
    })();
    records.push(listResult);
  }

  if (options.command === "call") {
    const toolName = options.callToolName;
    if (!toolName) {
      console.error("Missing --tool for call command.");
      console.log(usage());
      return 2;
    }

    const start = Date.now();
    try {
      const payload = parseToolTextPayload(
        await client.callTool(toolName, options.callToolArgs ?? {}),
      );
      records.push({
        name: `tools/call:${toolName}`,
        pass: true,
        message: options.pretty
          ? `${toolName} response:\n${renderToolPayload(
              payload,
              options.pretty,
            )}`
          : summarizeToolPayload(toolName, payload),
        durationMs: Date.now() - start,
      });
    } catch (error) {
      records.push({
        name: `tools/call:${toolName}`,
        pass: false,
        message: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      });
    }
  }

  if (options.command === "check") {
    records.push(await doHealthCheck());
    const checkRecords = await runChecks(client, options);
    records.push(...checkRecords);
  }

  if (options.command === "walkthrough") {
    const healthRecord = await doHealthCheck();
    records.push(healthRecord);
    const walkthroughRecords = await runWalkthrough(client, options);
    records.push(...walkthroughRecords);
  }

  const passCount = records.filter((record) => record.pass).length;
  const failCount = records.length - passCount;
  const tookMs = Date.now() - started;

  if (options.outputJson) {
    const payload = {
      endpoint: mcpUrl,
      summary: {
        passed: passCount,
        failed: failCount,
        total: records.length,
        durationMs: tookMs,
      },
      checks: records,
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    const header = `mcp-use validation against ${mcpUrl} (${records.length} checks, ${tookMs}ms)`;
    console.log(header);
    for (const record of records) {
      const status = record.pass ? "PASS" : "FAIL";
      console.log(`[${status}] ${record.name} (${record.durationMs}ms)`);
      console.log(`      ${record.message}`);
    }
    if (failCount === 0) {
      console.log(`\nResult: ✅ ${passCount}/${records.length} checks passed`);
    } else {
      console.log(`\nResult: ❌ ${failCount} check(s) failed`);
    }
  }

  return failCount > 0 ? 1 : 0;
}

run()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  });
