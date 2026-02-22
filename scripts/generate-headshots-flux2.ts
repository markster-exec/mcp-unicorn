#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

type HeadshotInput = {
  id?: string;
  name?: string;
  prompt?: string;
};

type CliOptions = {
  inputPath: string;
  outputDir: string;
  deployment: string;
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  size: string;
  style: "realistic" | "studio" | "neutral";
};

type GeneratedRecord = {
  id: string;
  name: string;
  prompt: string;
  file: string;
  source: "b64_json" | "url";
  timestamp: string;
};

const DEFAULT_INPUT = "data/headshot-prompts.json";
const DEFAULT_OUTPUT_DIR = "data/generated-headshots";
const DEFAULT_API_VERSION = "2025-04-01-preview";
const DEFAULT_SIZE = "1024x1024";

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
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

function ensureString(value: string | undefined, label: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value.trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function resolveOptions(): CliOptions {
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
  const size = args.size ?? process.env.AZURE_OPENAI_IMAGE_SIZE ?? DEFAULT_SIZE;
  const styleRaw = (args.style ?? "studio").toLowerCase();
  const style: CliOptions["style"] =
    styleRaw === "realistic" || styleRaw === "neutral" ? styleRaw : "studio";

  return {
    inputPath: resolve(args.input ?? DEFAULT_INPUT),
    outputDir: resolve(args.outputDir ?? DEFAULT_OUTPUT_DIR),
    deployment,
    endpoint,
    apiKey,
    apiVersion,
    size,
    style,
  };
}

function readInputs(inputPath: string): HeadshotInput[] {
  const raw = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Input must be a JSON array: ${inputPath}`);
  }
  return parsed as HeadshotInput[];
}

function buildPrompt(name: string, style: CliOptions["style"]): string {
  const styleLine =
    style === "realistic"
      ? "Highly realistic editorial portrait."
      : style === "neutral"
        ? "Neutral corporate portrait style."
        : "Modern studio portrait style with soft lighting and clean background.";

  return [
    `${styleLine}`,
    `Professional headshot of fictional business person named ${name}.`,
    "Tight framing on head and shoulders, facing camera, neutral expression.",
    "No text, no watermark, no logo, no extra limbs, no distortions.",
    "Business casual clothing, high detail face, natural skin tone.",
  ].join(" ");
}

async function fetchImage(
  options: CliOptions,
  prompt: string,
): Promise<{ source: "b64_json" | "url"; bytes: Uint8Array }> {
  const url = `${options.endpoint}/openai/deployments/${encodeURIComponent(
    options.deployment,
  )}/images/generations?api-version=${encodeURIComponent(options.apiVersion)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": options.apiKey,
    },
    body: JSON.stringify({
      prompt,
      size: options.size,
      n: 1,
      response_format: "b64_json",
    }),
  });

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
    throw new Error(
      `Azure Flux request failed (${response.status}): ${JSON.stringify(
        payload,
      )}`,
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    Array.isArray((payload as Record<string, unknown>).data)
  ) {
    const first = (payload as { data: Array<Record<string, unknown>> }).data[0];
    const b64 =
      typeof first?.b64_json === "string" ? first.b64_json : undefined;
    if (b64) {
      return {
        source: "b64_json",
        bytes: Buffer.from(b64, "base64"),
      };
    }
    const imageUrl = typeof first?.url === "string" ? first.url : undefined;
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
  }

  throw new Error(
    `Unexpected Azure response shape: ${JSON.stringify(payload)}`,
  );
}

async function main(): Promise<void> {
  const options = resolveOptions();
  const inputs = readInputs(options.inputPath);
  mkdirSync(options.outputDir, { recursive: true });

  const manifest: GeneratedRecord[] = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const entry = inputs[i] ?? {};
    const name = (entry.name ?? "").trim();
    if (!name) continue;
    const id =
      (entry.id ?? "").trim() ||
      `${slugify(name)}-${String(i + 1).padStart(2, "0")}`;
    const prompt =
      (entry.prompt ?? "").trim() || buildPrompt(name, options.style);
    const filename = `${slugify(id)}.png`;
    const outputPath = join(options.outputDir, filename);

    console.info(`[headshots] generating ${name} -> ${filename}`);
    const generated = await fetchImage(options, prompt);
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
    `[headshots] done: ${manifest.length} images -> ${basename(
      options.outputDir,
    )} (${extname(manifestPath) ? manifestPath : ""})`,
  );
}

main().catch((error) => {
  console.error(
    `[headshots] failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
