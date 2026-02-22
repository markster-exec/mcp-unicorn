#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const DEFAULT_INPUT = "data/headshot-prompts.json";
const DEFAULT_OUTPUT_DIR = "data/generated-headshots";
const DEFAULT_API_VERSION = "2025-04-01-preview";
const DEFAULT_PROVIDER_API_VERSION = "preview";
const DEFAULT_SIZE = "1024x1024";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function ensureString(value, label) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value.trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function resolveOptions() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = ensureString(
    args.endpoint ?? process.env.AZURE_OPENAI_ENDPOINT,
    "--endpoint or AZURE_OPENAI_ENDPOINT",
  ).replace(/\/$/, "");
  const apiKey = ensureString(
    args.apiKey ?? process.env.AZURE_OPENAI_API_KEY,
    "--apiKey or AZURE_OPENAI_API_KEY",
  );
  const deployment = ensureString(
    args.deployment ?? process.env.AZURE_OPENAI_FLUX_DEPLOYMENT,
    "--deployment or AZURE_OPENAI_FLUX_DEPLOYMENT",
  );
  const apiVersion =
    args.apiVersion ??
    process.env.AZURE_OPENAI_API_VERSION ??
    DEFAULT_API_VERSION;
  const providerApiVersion =
    args.providerApiVersion ??
    process.env.AZURE_OPENAI_FLUX_PROVIDER_API_VERSION ??
    DEFAULT_PROVIDER_API_VERSION;
  const size = args.size ?? process.env.AZURE_OPENAI_IMAGE_SIZE ?? DEFAULT_SIZE;
  const styleRaw = (args.style ?? "studio").toLowerCase();
  const style =
    styleRaw === "realistic" || styleRaw === "neutral" ? styleRaw : "studio";
  const model = args.model ?? process.env.AZURE_OPENAI_FLUX_MODEL ?? "FLUX.2-pro";
  const endpointTypeArg = (args.endpointType ?? "auto").toLowerCase();
  const endpointType =
    endpointTypeArg === "provider" || endpointTypeArg === "openai"
      ? endpointTypeArg
      : "auto";
  const retriesRaw =
    args.retries ?? process.env.AZURE_OPENAI_FLUX_RETRIES ?? "3";
  const parsedRetries = Number.parseInt(String(retriesRaw), 10);
  const retries =
    Number.isFinite(parsedRetries) && parsedRetries >= 1 ? parsedRetries : 3;
  const skipExistingRaw = (args.skipExisting ?? "true").toLowerCase();
  const skipExisting = !["0", "false", "no", "off"].includes(skipExistingRaw);

  return {
    inputPath: resolve(args.input ?? DEFAULT_INPUT),
    outputDir: resolve(args.outputDir ?? DEFAULT_OUTPUT_DIR),
    deployment,
    endpoint,
    apiKey,
    apiVersion,
    providerApiVersion,
    size,
    style,
    model,
    endpointType,
    retries,
    skipExisting,
  };
}

function readInputs(inputPath) {
  const raw = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Input must be a JSON array: ${inputPath}`);
  }
  return parsed;
}

function buildPrompt(name, style) {
  const styleLine =
    style === "realistic"
      ? "Highly realistic editorial portrait."
      : style === "neutral"
        ? "Neutral corporate portrait style."
        : "Modern studio portrait style with soft lighting and clean background.";

  return [
    `${styleLine}`,
    `Professional headshot of a fictional business person named ${name}.`,
    "Tight framing on head and shoulders, facing camera, neutral expression.",
    "No text, no watermark, no logo, no extra limbs, no distortions.",
    "Business casual clothing, high detail face, natural skin tone.",
  ].join(" ");
}

function parseSize(size) {
  const [wRaw, hRaw] = String(size).split("x");
  const width = Number.parseInt(wRaw ?? "1024", 10);
  const height = Number.parseInt(hRaw ?? "1024", 10);
  return {
    width: Number.isFinite(width) ? width : 1024,
    height: Number.isFinite(height) ? height : 1024,
  };
}

function resolveProviderEndpoint(endpoint) {
  const parsed = new URL(endpoint);
  if (parsed.hostname.endsWith(".openai.azure.com")) {
    const host = parsed.hostname.replace(
      ".openai.azure.com",
      ".api.cognitive.microsoft.com",
    );
    return `${parsed.protocol}//${host}`;
  }
  return `${parsed.protocol}//${parsed.host}`;
}

function shouldUseProviderPath(options) {
  if (options.endpointType === "provider") return true;
  if (options.endpointType === "openai") return false;
  return options.model.toLowerCase().includes("flux.2");
}

function readBase64FromPayload(payload) {
  if (!payload || typeof payload !== "object") return undefined;

  const directFields = [
    payload.b64_json,
    payload.image,
    payload.image_base64,
    payload.base64,
    payload.output_base64,
  ];
  for (const entry of directFields) {
    if (typeof entry === "string" && entry.length > 128) {
      return entry;
    }
  }

  const arrayCandidates = [];
  if (Array.isArray(payload.data)) arrayCandidates.push(...payload.data);
  if (Array.isArray(payload.output)) arrayCandidates.push(...payload.output);
  if (Array.isArray(payload.images)) arrayCandidates.push(...payload.images);
  for (const item of arrayCandidates) {
    if (!item || typeof item !== "object") continue;
    const value =
      item.b64_json ?? item.image ?? item.image_base64 ?? item.base64 ?? item.output_base64;
    if (typeof value === "string" && value.length > 128) {
      return value;
    }
  }

  return undefined;
}

function readImageUrlFromPayload(payload) {
  if (!payload || typeof payload !== "object") return undefined;

  const direct = payload.url ?? payload.image_url;
  if (typeof direct === "string" && direct.startsWith("http")) {
    return direct;
  }

  const arrayCandidates = [];
  if (Array.isArray(payload.data)) arrayCandidates.push(...payload.data);
  if (Array.isArray(payload.output)) arrayCandidates.push(...payload.output);
  if (Array.isArray(payload.images)) arrayCandidates.push(...payload.images);

  for (const item of arrayCandidates) {
    if (!item || typeof item !== "object") continue;
    const value = item.url ?? item.image_url;
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    }
  }
  return undefined;
}

async function fetchImage(options, prompt) {
  const useProvider = shouldUseProviderPath(options);
  const { width, height } = parseSize(options.size);
  const url = useProvider
    ? `${resolveProviderEndpoint(options.endpoint)}/providers/blackforestlabs/v1/flux-2-pro?api-version=${encodeURIComponent(options.providerApiVersion)}`
    : `${options.endpoint}/openai/deployments/${encodeURIComponent(
        options.deployment,
      )}/images/generations?api-version=${encodeURIComponent(options.apiVersion)}`;

  const headers = useProvider
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      }
    : {
        "Content-Type": "application/json",
        "api-key": options.apiKey,
      };

  const body = useProvider
    ? {
        model: options.model,
        prompt,
        width,
        height,
        output_format: "png",
      }
    : {
        prompt,
        size: options.size,
        n: 1,
        response_format: "b64_json",
      };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().startsWith("image/")) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { source: "url", bytes };
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Azure Flux request failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  const b64 = readBase64FromPayload(payload);
  if (b64) {
    return {
      source: "b64_json",
      bytes: Buffer.from(b64, "base64"),
    };
  }

  const imageUrl = readImageUrlFromPayload(payload);
  if (imageUrl) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Image URL download failed (${imageResponse.status}): ${imageUrl}`,
      );
    }
    const bytes = new Uint8Array(await imageResponse.arrayBuffer());
    return { source: "url", bytes };
  }

  throw new Error(`Unexpected Azure response shape: ${JSON.stringify(payload)}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = resolveOptions();
  const inputs = readInputs(options.inputPath);
  mkdirSync(options.outputDir, { recursive: true });

  const manifest = [];
  const failures = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const entry = inputs[i] ?? {};
    const name = (entry.name ?? "").trim();
    if (!name) continue;
    const id =
      (entry.id ?? "").trim() || `${slugify(name)}-${String(i + 1).padStart(2, "0")}`;
    const prompt = (entry.prompt ?? "").trim() || buildPrompt(name, options.style);
    const filename = `${slugify(id)}.png`;
    const outputPath = join(options.outputDir, filename);

    if (options.skipExisting && existsSync(outputPath)) {
      console.info(`[headshots] skip existing ${name} -> ${filename}`);
      manifest.push({
        id,
        name,
        prompt,
        file: outputPath,
        source: "existing",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    console.info(`[headshots] generating ${name} -> ${filename}`);
    let generated = null;
    let lastError = null;
    for (let attempt = 1; attempt <= options.retries; attempt += 1) {
      try {
        generated = await fetchImage(options, prompt);
        break;
      } catch (error) {
        lastError = error;
        console.error(
          `[headshots] attempt ${attempt}/${options.retries} failed for ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (attempt < options.retries) {
          await wait(1200 * attempt);
        }
      }
    }
    if (!generated) {
      failures.push({
        id,
        name,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      });
      continue;
    }
    writeFileSync(outputPath, generated.bytes);

    manifest.push({
      id,
      name,
      prompt,
      file: outputPath,
      source: generated.source,
      timestamp: new Date().toISOString(),
    });
  }

  const manifestPath = join(options.outputDir, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.info(
    `[headshots] done: ${manifest.length} images -> ${basename(options.outputDir)} (${extname(manifestPath) ? manifestPath : ""})`,
  );
  if (failures.length > 0) {
    console.error(
      `[headshots] failed entries: ${failures.length} (${failures
        .map((item) => item.id)
        .join(", ")})`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    `[headshots] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
