#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { MARKSTER_TOOL_CATALOG } from "../src/shared/marksterToolManifest";

type OpenApiDoc = {
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

type OpenApiOperation = {
  responses?: Record<
    string,
    { content?: Record<string, { schema?: unknown }> }
  >;
};

type OpenApiPath = Record<string, OpenApiOperation | undefined>;

type OpenApiPathMethod = OpenApiPath & {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
};

const DEFAULT_OPENAPI_URL = "https://panel.markster.io/docs/openapi.json";
const OUTPUT_PATH = "src/markster/generated-openapi-schemas.ts";
const TEMPLATE_SEGMENT_RE = /^\{[a-zA-Z0-9_-]+\}$/u;
const MANUAL_TOOL_RESPONSE_SCHEMA_FALLBACKS: Record<
  string,
  { schema: unknown; reason: string }
> = {
  contact_profile_workspace: {
    schema: {
      anyOf: [{ type: "object" }, { type: "array" }],
    },
    reason: "awaiting-openapi-sync",
  },
};
const OPENAPI_PATH_OVERRIDES: Record<string, string[]> = {
  outreach_brand_assets_workspace: ["/api/tap/brand-assets/brands"],
};

function normalizePath(pathWithQuery: string): string {
  const pathOnly = pathWithQuery.split("?", 1)[0] ?? "";
  if (pathOnly.length <= 1) return pathOnly;
  return pathOnly.endsWith("/") ? pathOnly.replace(/\/+$/u, "") : pathOnly;
}

function splitPathSegments(pathWithQuery: string): string[] {
  return normalizePath(pathWithQuery)
    .split("/")
    .filter((segment) => segment.length > 0);
}

function isTemplateSegment(segment: string): boolean {
  return TEMPLATE_SEGMENT_RE.test(segment);
}

function pathSegmentsMatch(manifestPath: string, openApiPath: string): boolean {
  const manifestSegments = splitPathSegments(manifestPath);
  const openApiSegments = splitPathSegments(openApiPath);

  if (manifestSegments.length !== openApiSegments.length) {
    return false;
  }

  return manifestSegments.every((manifestSegment, idx) => {
    const openApiSegment = openApiSegments[idx];
    if (
      isTemplateSegment(manifestSegment) ||
      isTemplateSegment(openApiSegment)
    ) {
      return true;
    }
    return manifestSegment === openApiSegment;
  });
}

function dedupeByJson(items: unknown[]): unknown[] {
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const item of items) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function resolveOpenApiRef(
  schema: unknown,
  components: Record<string, unknown>,
  seenRefs: Set<string> = new Set(),
): unknown {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => resolveOpenApiRef(item, components, seenRefs));
  }

  const typed = schema as Record<string, unknown>;
  if (typed.$ref !== undefined && typeof typed.$ref === "string") {
    const match = /^#\/components\/schemas\/(.+)$/u.exec(typed.$ref);
    if (!match) {
      return typed;
    }

    const schemaName = match[1];
    const resolved = components[schemaName];
    if (!resolved) {
      return { type: "object", additionalProperties: true };
    }

    if (seenRefs.has(schemaName)) {
      return resolved as unknown;
    }

    const next = new Set(seenRefs);
    next.add(schemaName);
    return resolveOpenApiRef(resolved, components, next);
  }

  return Object.entries(typed).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (
        ["title", "$id", "$schema", "description", "examples"].includes(key)
      ) {
        return acc;
      }
      acc[key] = resolveOpenApiRef(value, components, seenRefs);
      return acc;
    },
    {},
  );
}

function pickSuccessResponseSchema(
  operation: OpenApiOperation,
  contentTypePreference = "application/json",
): { statusCode: string; schema: unknown } {
  const responses = operation.responses ?? {};
  const responseCodes = Object.keys(responses);

  const twoHundred = responseCodes
    .filter((code) => /^2\d{2}$/.test(code))
    .sort((a, b) => {
      const rank = ["200", "201", "202", "203", "204", "205", "206"];
      const ai = rank.indexOf(a);
      const bi = rank.indexOf(b);

      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  const candidateCodes = twoHundred.length > 0 ? twoHundred : responseCodes;

  for (const statusCode of candidateCodes) {
    const response = responses[statusCode];
    const content = response?.content;
    if (!content) {
      return { statusCode, schema: {} };
    }

    const byContentType = content[contentTypePreference];
    if (byContentType?.schema) {
      return { statusCode, schema: byContentType.schema };
    }

    const firstContentEntry = Object.values(content)[0];
    if (firstContentEntry?.schema) {
      return { statusCode, schema: firstContentEntry.schema };
    }
  }

  return {
    statusCode: "default",
    schema: { type: "object", additionalProperties: true },
  };
}

function buildOpenApiUrl(): string {
  const envUrl = process.env.MARKSTER_OPENAPI_URL?.trim();
  const apiKey = process.env.MARKSTER_DOCS_API_KEY?.trim();

  if (envUrl) {
    if (/api_key=/.test(envUrl)) return envUrl;
    if (apiKey)
      return `${envUrl}${envUrl.includes("?") ? "&" : "?"}api_key=${apiKey}`;
    return envUrl;
  }

  if (!apiKey) {
    throw new Error(
      "Missing Markster docs API key. Set MARKSTER_DOCS_API_KEY or include api_key in MARKSTER_OPENAPI_URL.",
    );
  }

  return `${DEFAULT_OPENAPI_URL}?api_key=${apiKey}`;
}

async function loadOpenApiSpec(url: string): Promise<OpenApiDoc> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const raw = await response.text();
  return JSON.parse(raw) as OpenApiDoc;
}

function writeGeneratedFile(payload: {
  openapiVersion: string;
  toolsCount: number;
  fingerprints: {
    toolName: string;
    paths: string[];
    method: string;
    statusCodes: string[];
    source: string;
  }[];
  schemas: Record<string, unknown>;
}): string {
  return `// Auto-generated from Markster OpenAPI spec.
// Do not hand-edit. Regenerate via: npm run openapi:generate

export const MARKSTER_OPENAPI_VERSION = ${JSON.stringify(
    payload.openapiVersion,
  )};
export const MARKSTER_TOOL_RESPONSE_SCHEMA_SOURCES = ${JSON.stringify(
    payload.fingerprints,
    null,
    2,
  )};
export const MARKSTER_TOOL_RESPONSE_SCHEMAS = Object.freeze(${JSON.stringify(
    payload.schemas,
    null,
    2,
  )} as const);
export const MARKSTER_TOOL_COUNT = ${JSON.stringify(payload.toolsCount)};
`;
}

async function main(): Promise<void> {
  const openApiUrl = buildOpenApiUrl();
  const openApi = await loadOpenApiSpec(openApiUrl);
  const openApiPaths = (openApi.paths ?? {}) as Record<
    string,
    OpenApiPathMethod
  >;
  const components = openApi.components?.schemas ?? {};

  const normalizedPathIndex = new Map<string, string>();
  Object.keys(openApiPaths).forEach((pathKey) => {
    normalizedPathIndex.set(normalizePath(pathKey), pathKey);
  });

  const schemas: Record<string, unknown> = {};
  const fingerprints: {
    toolName: string;
    paths: string[];
    method: string;
    statusCodes: string[];
    source: string;
  }[] = [];

  for (const tool of MARKSTER_TOOL_CATALOG) {
    const normalizedToolPath = normalizePath(tool.endpoint);
    const method = tool.method.toLowerCase();
    const exactPath = normalizedPathIndex.get(normalizedToolPath);
    const overrideCandidates = (OPENAPI_PATH_OVERRIDES[tool.name] ?? [])
      .map((path) => normalizedPathIndex.get(normalizePath(path)))
      .filter((path): path is string => Boolean(path));
    const candidates = exactPath
      ? [exactPath]
      : overrideCandidates.length > 0
        ? overrideCandidates
        : Object.keys(openApiPaths).filter((pathKey) =>
            pathSegmentsMatch(normalizedToolPath, pathKey),
          );

    if (candidates.length === 0) {
      const fallback = MANUAL_TOOL_RESPONSE_SCHEMA_FALLBACKS[tool.name];
      if (fallback) {
        schemas[tool.name] = fallback.schema;
        fingerprints.push({
          toolName: tool.name,
          paths: [tool.endpoint],
          method,
          statusCodes: ["manual"],
          source: `manual:${fallback.reason}`,
        });
        continue;
      }
      throw new Error(
        `No OpenAPI path found for tool '${tool.name}'. Expected manifest endpoint: ${tool.endpoint}`,
      );
    }

    const resolvedOperations = candidates
      .map((pathKey) => ({
        path: pathKey,
        operation: openApiPaths[pathKey][method],
      }))
      .filter((entry): entry is { path: string; operation: OpenApiOperation } =>
        Boolean(entry.operation),
      );

    if (resolvedOperations.length === 0) {
      const candidateMethods = candidates
        .map(
          (pathKey) =>
            `${pathKey}: [${Object.keys(openApiPaths[pathKey]).join(", ")}]`,
        )
        .join("; ");
      throw new Error(
        `No OpenAPI method '${method.toUpperCase()}' found for tool '${
          tool.name
        }'. Candidate path(s): ${candidateMethods}`,
      );
    }

    const resolved = resolvedOperations.map(
      ({ path: sourcePath, operation }) => {
        const { statusCode, schema: rawSchema } =
          pickSuccessResponseSchema(operation);
        const resolvedSchema = resolveOpenApiRef(rawSchema, components);
        return { path: sourcePath, statusCode, schema: resolvedSchema };
      },
    );

    const statusCodes = dedupeByJson(
      resolved.map((item) => item.statusCode),
    ).sort();
    const resolvedSchemas = dedupeByJson(resolved.map((item) => item.schema));
    const mergedSchema =
      resolvedSchemas.length === 1
        ? resolvedSchemas[0]
        : { anyOf: resolvedSchemas };

    schemas[tool.name] = mergedSchema;

    fingerprints.push({
      toolName: tool.name,
      paths: dedupeByJson(
        resolved.map((entry) => entry.path),
      ).sort() as string[],
      method,
      statusCodes: statusCodes as string[],
      source: "openapi",
    });
  }

  const normalizedFingerprints = [...fingerprints].sort((a, b) =>
    a.toolName.localeCompare(b.toolName),
  );
  const output = writeGeneratedFile({
    openapiVersion: openApi.info?.version ?? "unknown",
    toolsCount: Object.keys(schemas).length,
    fingerprints: normalizedFingerprints,
    schemas,
  });

  await fs.writeFile(OUTPUT_PATH, output, "utf8");

  const hash = crypto
    .createHash("sha256")
    .update(openApiUrl)
    .update(output)
    .digest("hex");

  console.log(
    `Generated response contracts for ${
      Object.keys(schemas).length
    } Markster tools (openapi v${openApi.info?.version ?? "unknown"})`,
  );
  console.log(`Fingerprint: ${hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
