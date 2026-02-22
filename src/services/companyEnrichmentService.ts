import { getCompanyByNameOrDomain, getAllCompanies } from "./mockData";
import { CompanyProfile } from "../types/contracts";
import { shouldLogToolCalls } from "../markster/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

type CompanyLookupInput = {
  company_name?: string;
  domain?: string;
};

type ApolloTechnology = {
  name?: string;
  organization_name?: string;
};

type ApolloFundingEvent = {
  round?: string;
  amount?: string | number;
  date?: string;
  details?: string;
  investor?: string;
  organization_name?: string;
};

type ApolloOrganization = {
  name?: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  industries?: string[];
  estimated_num_employees?: number;
  founded_year?: number;
  city?: string;
  state?: string;
  country?: string;
  organization_revenue_printed?: string;
  logo_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  technology_names?: string[];
  current_technologies?: ApolloTechnology[];
  funding_events?: ApolloFundingEvent[];
};

type ApolloOrganizationResponse = {
  organization?: ApolloOrganization | null;
  error?: string;
  errors?: Array<{ message?: string }> | string | null;
  message?: string;
};

type CachedCompany = {
  source: "apollo";
  company: CompanyProfile;
  fetchedAt: number;
};

type CompanyEnrichmentResult = {
  source: "apollo" | "mock";
  company: CompanyProfile;
  enrichment: {
    status: "live" | "cached" | "fallback";
    requested_domain: string | null;
    key: string;
    note?: string;
    fetched_at?: string;
    cached?: boolean;
    cached_at?: string;
  };
};

const APOLLO_ORG_ENRICH_URL =
  "https://api.apollo.io/api/v1/organizations/enrich";
const APOLLO_TIMEOUT_MS = 2500;
const ENRICH_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ENRICH_CACHE_MAX_ENTRIES = 5000;
const APOLLO_CACHE_FILENAME = "apollo-company-enrichment.json";
const APOLLO_CACHE_PATH_CANDIDATES = (() => {
  const configuredFile = process.env.APOLLO_CACHE_PATH?.trim();
  const configuredDir = process.env.APOLLO_CACHE_DIR?.trim();

  const candidates = new Set<string>();

  if (configuredFile) {
    const explicit = configuredFile.endsWith(".json")
      ? configuredFile
      : path.join(configuredFile, APOLLO_CACHE_FILENAME);
    candidates.add(path.resolve(explicit));
  }
  if (configuredDir) {
    candidates.add(path.resolve(configuredDir, APOLLO_CACHE_FILENAME));
  }
  candidates.add(path.resolve(process.cwd(), ".cache", APOLLO_CACHE_FILENAME));
  candidates.add(
    path.resolve(os.tmpdir(), "markster-mcp", APOLLO_CACHE_FILENAME),
  );

  return [...candidates];
})();

const enrichmentCache = new Map<string, CachedCompany>();
const inFlightRequests = new Map<string, Promise<CompanyProfile>>();
let cacheInitialized = false;
let cacheWriteScheduled = false;

type CachedCompanyRecord = {
  fetchedAt: number;
  company: CompanyProfile;
};

function boolFromEnv(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on", "enabled"].includes(value.toLowerCase());
}

function isCacheEnabled(): boolean {
  if (process.env.APOLLO_CACHE_ENABLED === undefined) {
    return true;
  }
  return boolFromEnv(process.env.APOLLO_CACHE_ENABLED.trim());
}

function scheduleCachePersist(): void {
  if (!isCacheEnabled()) {
    return;
  }
  if (cacheWriteScheduled) {
    return;
  }
  cacheWriteScheduled = true;
  setTimeout(() => {
    cacheWriteScheduled = false;
    persistCacheToDisk();
  }, 1000);
}

function pruneCacheIfNeeded(): void {
  if (enrichmentCache.size <= ENRICH_CACHE_MAX_ENTRIES) {
    return;
  }

  const keys = Array.from(enrichmentCache.keys());
  for (const staleKey of keys) {
    enrichmentCache.delete(staleKey);
    if (enrichmentCache.size <= ENRICH_CACHE_MAX_ENTRIES) {
      break;
    }
  }
}

function loadCacheFromDisk(): void {
  if (!isCacheEnabled() || cacheInitialized) {
    return;
  }

  cacheInitialized = true;

  for (const cachePath of APOLLO_CACHE_PATH_CANDIDATES) {
    if (!fs.existsSync(cachePath)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(cachePath, "utf8");
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed)) {
        continue;
      }

      const now = Date.now();
      for (const [key, value] of Object.entries(parsed)) {
        if (!isPlainObject(value)) {
          continue;
        }

        const candidate = value as Partial<CachedCompanyRecord>;
        const fetchedAtRaw = candidate.fetchedAt;
        const company = candidate.company;
        if (!Number.isFinite(fetchedAtRaw) || !isPlainObject(company)) {
          continue;
        }

        const fetchedAt = Number(fetchedAtRaw);
        if (!Number.isFinite(fetchedAt) || fetchedAt > now) {
          continue;
        }

        if (now > fetchedAt + ENRICH_CACHE_TTL_MS) {
          continue;
        }

        const companyCandidate = company as Partial<CompanyProfile>;
        const normalized = getCompanyCandidate(companyCandidate);
        if (!normalized) {
          continue;
        }

        if (enrichmentCache.has(key)) {
          enrichmentCache.delete(key);
        }
        enrichmentCache.set(key, {
          source: "apollo",
          company: normalized,
          fetchedAt,
        });
      }

      if (shouldLogToolCalls()) {
        console.info(
          `[enrichment] cache loaded from ${cachePath} (${enrichmentCache.size} entries)`,
        );
      }

      pruneCacheIfNeeded();
      return;
    } catch (error) {
      if (shouldLogToolCalls()) {
        console.info(
          `[enrichment] cache load failed for ${cachePath}: ${
            (error as Error).message
          }`,
        );
      }
      continue;
    }
  }
}

function getCompanyCandidate(
  raw: Partial<CompanyProfile>,
): CompanyProfile | null {
  if (!raw.company_key || !raw.name || !raw.domain) {
    return null;
  }

  return {
    ...raw,
    company_key: String(raw.company_key),
    name: String(raw.name),
    domain: String(raw.domain),
    industry: String(raw.industry ?? "Unknown"),
    logo_url: String(raw.logo_url ?? "N/A"),
    employees: Number(raw.employees ?? 0),
    founded_year: Number(raw.founded_year ?? 0),
    city: String(raw.city ?? "N/A"),
    state: String(raw.state ?? "N/A"),
    country: String(raw.country ?? "N/A"),
    valuation: raw.valuation,
    funding_events: Array.isArray(raw.funding_events)
      ? raw.funding_events.filter(
          (event) =>
            isPlainObject(event) &&
            typeof event.round === "string" &&
            typeof event.date === "string" &&
            typeof event.amount === "string" &&
            typeof event.details === "string",
        )
      : [],
    technology_names: Array.isArray(raw.technology_names)
      ? raw.technology_names.filter((tech) => typeof tech === "string")
      : [],
    website: String(raw.website ?? `https://${raw.domain}`),
    social_profiles: raw.social_profiles ?? {
      linkedin: "N/A",
      twitter: "N/A",
      crunchbase: "N/A",
    },
    people: Array.isArray(raw.people) ? raw.people : [],
    description:
      typeof raw.description === "string"
        ? raw.description
        : `${String(raw.name)} profile loaded from Apollo enrichment.`,
  };
}

function persistCacheToDisk(): void {
  if (!isCacheEnabled()) {
    return;
  }

  const payload: Record<string, CachedCompanyRecord> = {};
  for (const [key, entry] of enrichmentCache.entries()) {
    payload[key] = {
      fetchedAt: entry.fetchedAt,
      company: entry.company,
    };
  }

  for (const cachePath of APOLLO_CACHE_PATH_CANDIDATES) {
    try {
      const dir = path.dirname(cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");

      if (shouldLogToolCalls()) {
        console.info(`[enrichment] cache persisted to ${cachePath}`);
      }
      return;
    } catch {
      continue;
    }
  }

  if (shouldLogToolCalls()) {
    console.warn("[enrichment] cache persist failed on all configured paths.");
  }
}

function setCachedCompany(key: string, company: CompanyProfile): void {
  loadCacheFromDisk();
  if (enrichmentCache.has(key)) {
    enrichmentCache.delete(key);
  }
  enrichmentCache.set(key, {
    source: "apollo",
    company,
    fetchedAt: Date.now(),
  });
  pruneCacheIfNeeded();
  scheduleCachePersist();
}

function normalizeCandidate(value?: string): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const withProtocolRemoved = trimmed
    .replace(/^https?:\/\/+/i, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "");
  return withProtocolRemoved || null;
}

function normalizeLookupKey(value: string | undefined | null): string | null {
  const candidate = normalizeCandidate(value ?? undefined);
  if (!candidate) {
    return null;
  }
  return normalizeCompanyKey(candidate);
}

function normalizeCompanyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildLookupKeys(input: CompanyLookupInput): string[] {
  const keys = new Set<string>();

  const explicitDomainKey = normalizeLookupKey(input.domain);
  if (explicitDomainKey) {
    keys.add(explicitDomainKey);
  }

  const inferredDomainKey = normalizeLookupKey(resolveDomainFromInput(input));
  if (inferredDomainKey) {
    keys.add(inferredDomainKey);
  }

  if (input.company_name) {
    keys.add(normalizeCompanyKey(input.company_name));
  }

  if (keys.size === 0) {
    keys.add("unknown-company");
  }

  return [...keys];
}

function stringOrEmpty(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "N/A";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "N/A";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumberOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function resolveDomainFromPreseed(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  const candidates = getAllCompanies().filter(
    (company) =>
      company.name.toLowerCase() === normalized ||
      company.name.toLowerCase().includes(normalized) ||
      normalized.includes(company.name.toLowerCase()),
  );

  const domainFromNameMatch = candidates[0]?.domain;
  if (domainFromNameMatch) {
    return normalizeCandidate(domainFromNameMatch);
  }

  const domainFromDomainMatch = candidates.find((candidate) =>
    candidate.domain.toLowerCase().includes(normalized),
  )?.domain;

  if (domainFromDomainMatch) {
    return normalizeCandidate(domainFromDomainMatch);
  }

  return null;
}

function resolveDomainFromInput(input: CompanyLookupInput): string | null {
  if (!input.company_name) {
    return null;
  }

  const normalized = input.company_name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const fromPreseed = resolveDomainFromPreseed(normalized);
  if (fromPreseed) {
    return fromPreseed;
  }

  const asExplicitDomain = normalizeCompanyNameAsDomain(normalized);
  if (asExplicitDomain) {
    return asExplicitDomain;
  }

  if (!normalized.includes(" ")) {
    const compact = normalized.replace(/[^a-z0-9-]+/g, "");
    if (compact.length >= 3) {
      return normalizeCandidate(`${compact}.com`);
    }
  }

  return null;
}

function normalizeCompanyNameAsDomain(name: string): string | null {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed || trimmed.includes(" ")) {
    return null;
  }
  if (!trimmed.includes(".")) {
    return null;
  }
  return normalizeCandidate(trimmed);
}

function normalizeSeedForCache(input: CompanyLookupInput): {
  domain: string | null;
  name: string | null;
  key: string;
  cacheKeys: string[];
} {
  const explicitDomain = normalizeCandidate(input.domain);
  const inferredDomain = explicitDomain || resolveDomainFromInput(input);
  const domain = inferredDomain || null;
  const name = input.company_name
    ? input.company_name.trim().toLowerCase()
    : null;
  const cacheKeys = buildLookupKeys(input);
  const key = cacheKeys[0] ?? "unknown-company";
  return {
    domain,
    name,
    key,
    cacheKeys,
  };
}

function createCompanyFallback(input: CompanyLookupInput): CompanyProfile {
  const candidate = getCompanyByNameOrDomain({
    ...(input.company_name ? { company_name: input.company_name } : {}),
    ...(input.domain ? { domain: input.domain } : {}),
  });
  return (
    candidate ?? {
      ...getAllCompanies()[0],
      company_key: "fallback-demo-company",
      name: "Fallback Demo Company",
      domain: normalizeSeedForCache(input).domain || "example.com",
    }
  );
}

function mapApolloOrganization(
  organization: ApolloOrganization,
  seed: { domain: string | null; name: string | null },
): CompanyProfile {
  const domain = organization.primary_domain
    ? normalizeCandidate(organization.primary_domain) ?? "example.com"
    : organization.website_url
      ? normalizeCandidate(organization.website_url) ?? "example.com"
      : seed.domain ?? "example.com";

  const city = stringOrEmpty(organization.city);
  const state = stringOrEmpty(organization.state);
  const country = stringOrEmpty(organization.country);

  const technologies: string[] = [];
  if (Array.isArray(organization.technology_names)) {
    for (const item of organization.technology_names) {
      if (typeof item === "string" && item.trim()) {
        technologies.push(item.trim());
      }
    }
  }
  if (Array.isArray(organization.current_technologies)) {
    for (const item of organization.current_technologies) {
      const name = typeof item === "string" ? item : item?.name;
      if (typeof name === "string" && name.trim()) {
        technologies.push(name.trim());
      }
    }
  }

  const fundingEvents = Array.isArray(organization.funding_events)
    ? organization.funding_events
        .filter(isPlainObject)
        .map((raw) => ({
          round: stringOrEmpty(raw.round),
          amount: stringOrEmpty(raw.amount),
          date: stringOrEmpty(raw.date),
          details: stringOrEmpty(
            raw.details ??
              raw.organization_name ??
              raw.investor ??
              "Apollo funding row",
          ),
        }))
        .filter(
          (item) =>
            item.round !== "N/A" ||
            item.amount !== "N/A" ||
            item.date !== "N/A",
        )
    : [];

  const companyKey = normalizeCompanyKey(
    organization.name ? organization.name : seed.name ? seed.name : domain,
  );
  const companyName = organization.name ?? seed.name ?? "Enriched company";

  return {
    company_key: companyKey || "apollo-company",
    name: companyName,
    domain,
    industry:
      organization.industry ?? organization.industries?.[0] ?? "Unknown",
    logo_url: stringOrEmpty(organization.logo_url),
    employees: toNumberOrZero(organization.estimated_num_employees),
    founded_year: toNumberOrZero(organization.founded_year),
    city,
    state,
    country,
    valuation: organization.organization_revenue_printed ?? "N/A",
    funding_events: fundingEvents,
    technology_names: Array.from(new Set(technologies)),
    website: organization.website_url ?? `https://${domain}`,
    social_profiles: {
      linkedin: stringOrEmpty(organization.linkedin_url),
      twitter: stringOrEmpty(organization.twitter_url),
      crunchbase: stringOrEmpty(organization.facebook_url),
    },
    people: [],
    description:
      organization.industry && organization.estimated_num_employees
        ? `${companyName} is a ${organization.industry} company with ~${organization.estimated_num_employees} employees.`
        : `${companyName} profile loaded from Apollo enrichment.`,
  };
}

async function fetchApolloOrganizationProfile(
  domain: string,
): Promise<CompanyProfile> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error("APOLLO_API_KEY is not configured.");
  }

  const query = new URLSearchParams({ domain });
  const url = `${APOLLO_ORG_ENRICH_URL}?${query}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, APOLLO_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      signal: controller.signal,
    });
    const payload = (await response.json()) as ApolloOrganizationResponse;

    if (!response.ok) {
      throw new Error(
        `Apollo organization enrichment failed (${
          response.status
        }): ${stringOrEmpty(
          payload.message || payload.error || `${response.statusText}`,
        )}`,
      );
    }

    const organization = payload.organization;
    if (!isPlainObject(organization)) {
      throw new Error("Apollo response was missing organization data.");
    }

    return mapApolloOrganization(organization, {
      domain,
      name: null,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getCachedCompany(key: string): CachedCompany | null {
  loadCacheFromDisk();
  const cached = enrichmentCache.get(key);
  if (!cached) {
    return null;
  }

  enrichmentCache.delete(key);
  const staleAt = cached.fetchedAt + ENRICH_CACHE_TTL_MS;
  if (Date.now() > staleAt) {
    enrichmentCache.delete(key);
    return null;
  }

  enrichmentCache.set(key, cached);
  return cached;
}

function getCachedCompanyByKeys(keys: string[]): CachedCompany | null {
  for (const key of keys) {
    const cached = getCachedCompany(key);
    if (cached) {
      return cached;
    }
  }
  return null;
}

function setCachedCompanyForKeys(
  keys: string[],
  company: CompanyProfile,
): void {
  for (const key of keys) {
    setCachedCompany(key, company);
  }
}

function withBackgroundLogging<T>(
  job: Promise<T>,
  context: string,
): Promise<T> {
  return job
    .then((value) => {
      if (shouldLogToolCalls()) {
        console.info(`[enrichment] job resolved ${context}`);
      }
      return value;
    })
    .catch((error) => {
      if (shouldLogToolCalls()) {
        console.error(
          `[enrichment] job failed ${context}: ${(error as Error).message}`,
        );
      }
      throw error;
    });
}

function getOrCreateInFlight(
  key: string,
  runJob: () => Promise<CompanyProfile>,
): Promise<CompanyProfile> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const job = withBackgroundLogging(runJob(), `lookup=${key}`);
  inFlightRequests.set(key, job);
  void job
    .finally(() => {
      if (inFlightRequests.get(key) === job) {
        inFlightRequests.delete(key);
      }
    })
    .catch(() => undefined);
  return job;
}

export async function enrichCompanyProfile(
  input: CompanyLookupInput,
): Promise<CompanyEnrichmentResult> {
  const seed = normalizeSeedForCache(input);
  const key = seed.key;
  const fallbackCompany = createCompanyFallback(input);
  const requestedDomain = seed.domain;
  const cached = getCachedCompanyByKeys(seed.cacheKeys);

  if (cached) {
    return {
      source: "apollo",
      company: cached.company,
      enrichment: {
        status: "cached",
        requested_domain: requestedDomain,
        key,
        fetched_at: new Date(cached.fetchedAt).toISOString(),
        cached: true,
        cached_at: new Date(cached.fetchedAt).toISOString(),
      },
    };
  }

  if (!process.env.APOLLO_API_KEY || !requestedDomain) {
    return {
      source: "mock",
      company: fallbackCompany,
      enrichment: {
        status: "fallback",
        requested_domain: requestedDomain,
        key,
        note: requestedDomain
          ? "APOLLO_API_KEY missing."
          : "No domain resolved for Apollo enrichment; using fallback.",
      },
    };
  }

  const inFlight = getOrCreateInFlight(key, () =>
    fetchApolloOrganizationProfile(requestedDomain).then((company) => {
      setCachedCompanyForKeys(seed.cacheKeys, company);
      return company;
    }),
  );

  try {
    const company = await inFlight;
    return {
      source: "apollo",
      company,
      enrichment: {
        status: "live",
        requested_domain: requestedDomain,
        key,
        fetched_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      source: "mock",
      company: fallbackCompany,
      enrichment: {
        status: "fallback",
        requested_domain: requestedDomain,
        key,
        note: (error as Error).message,
      },
    };
  }
}
