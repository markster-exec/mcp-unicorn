import type {
  CompanyProfile,
  DealStage,
  FinancialBaseline,
  SignalProfile,
} from "../types/contracts";
import companies from "../data/preseeded/index.json";
import baseFinancials from "../data/financials.json";
import signalProfiles from "../../data/mock-signals.json";

export const DEAL_DEFAULTS: Record<
  string,
  { dealSize: number; dealStage: DealStage }
> = {
  figma: { dealSize: 150000, dealStage: "negotiation" },
  anthropic: { dealSize: 120000, dealStage: "proposal_sent" },
  stripe: { dealSize: 50000, dealStage: "negotiation" },
  openai: { dealSize: 95000, dealStage: "discovery" },
  datadog: { dealSize: 120000, dealStage: "discovery" },
  clay: { dealSize: 75000, dealStage: "discovery" },
  ramp: { dealSize: 65000, dealStage: "proposal_sent" },
  scale_ai: { dealSize: 200000, dealStage: "discovery" },
};

const typedCompanies = companies as CompanyProfile[];

const companyByKey = new Map<string, CompanyProfile>(
  typedCompanies.map((company) => [company.company_key.toLowerCase(), company]),
);

const companyByName = new Map<string, CompanyProfile>(
  typedCompanies.map((company) => [company.name.toLowerCase(), company]),
);

const companyByDomain = new Map<string, CompanyProfile>(
  typedCompanies.map((company) => [company.domain.toLowerCase(), company]),
);

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function getCompanyByNameOrDomain(query: {
  company_name?: string;
  domain?: string;
}): CompanyProfile | null {
  if (!query.company_name && !query.domain) {
    return null;
  }

  if (query.domain) {
    const direct = companyByDomain.get(normalizeKey(query.domain));
    if (direct) {
      return direct;
    }
  }

  if (query.company_name) {
    const exact = companyByName.get(normalizeKey(query.company_name));
    if (exact) {
      return exact;
    }

    const partial = typedCompanies.find((company) =>
      company.name
        .toLowerCase()
        .includes(normalizeKey(query.company_name as string)),
    );
    if (partial) {
      return partial;
    }

    const fuzzy = companyByDomain.get(normalizeKey(query.company_name));
    if (fuzzy) {
      return fuzzy;
    }
  }

  return typedCompanies[0] ?? null;
}

export function getCompanyByKey(companyKey: string): CompanyProfile | null {
  return companyByKey.get(normalizeKey(companyKey)) ?? null;
}

export function getBaselineFinancials(_companyKey?: string): FinancialBaseline {
  return {
    ...(baseFinancials as FinancialBaseline),
    company_key: _companyKey
      ? normalizeKey(_companyKey)
      : baseFinancials.company_key,
    company:
      (_companyKey ? getCompanyByKey(_companyKey)?.name : undefined) ??
      baseFinancials.company,
  };
}

export function getSignals(companyKey: string): SignalProfile[] {
  const normalized = normalizeKey(companyKey);
  return (signalProfiles as SignalProfile[]).filter(
    (signal) => signal.company_key === normalized,
  );
}

export function getSignalPerson(personId: string): SignalProfile | null {
  return (
    (signalProfiles as SignalProfile[]).find(
      (signal) => signal.person_id === personId,
    ) ?? null
  );
}

export function getAllCompanies(): CompanyProfile[] {
  return [...typedCompanies];
}
