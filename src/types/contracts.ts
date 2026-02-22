import { z } from "zod";

export const ResearchCompanyInput = z
  .object({
    company_name: z.string().trim().min(1).optional(),
    domain: z.string().trim().optional(),
  })
  .refine((value) => Boolean(value.company_name || value.domain), {
    message: "Either company_name or domain is required.",
    path: ["company_name"],
  });

export const DealImpactInput = z.object({
  company_key: z.string().trim().min(1),
  deal_size: z.number().positive().finite(),
});

export const SimulatePricingInput = z.object({
  company_key: z.string().trim().min(1),
  deal_size: z.number().positive().finite(),
  deal_stage: z
    .enum(["discovery", "proposal_sent", "negotiation", "verbal_commit"])
    .optional()
    .default("negotiation"),
  discount_pct: z.number().min(0).max(100),
});

export const GetSignalsInput = z.object({
  company_key: z.string().trim().min(1),
});

export const PrepCallInput = z.object({
  company_key: z.string().trim().min(1),
  persona: z.string().trim().optional(),
  scenario_notes: z.string().trim().optional(),
});

export const DailyPrioritiesInput = z.object({
  timebox_minutes: z.number().int().positive().optional().default(60),
});

export type ResearchCompanyInputType = z.infer<typeof ResearchCompanyInput>;
export type DealImpactInputType = z.infer<typeof DealImpactInput>;
export type SimulatePricingInputType = z.infer<typeof SimulatePricingInput>;
export type GetSignalsInputType = z.infer<typeof GetSignalsInput>;
export type PrepCallInputType = z.infer<typeof PrepCallInput>;
export type DailyPrioritiesInputType = z.infer<typeof DailyPrioritiesInput>;

export type MCPTextResult = {
  content: Array<{ type: "text"; text: string }>;
};

export type CompanyProfile = {
  company_key: string;
  name: string;
  domain: string;
  industry: string;
  logo_url: string;
  employees: number;
  founded_year: number;
  city: string;
  state: string | null;
  country: string;
  valuation?: string;
  funding_events: Array<{
    round: string;
    amount: string;
    date: string;
    details?: string;
  }>;
  technology_names: string[];
  website: string;
  social_profiles: {
    linkedin?: string;
    twitter?: string;
    crunchbase?: string;
  };
  people: Array<{
    id: string;
    name: string;
    title: string;
    email: string;
    linkedin?: string;
  }>;
  description: string;
};

export type DealStage =
  | "discovery"
  | "proposal_sent"
  | "negotiation"
  | "verbal_commit";

export type FinancialBaseline = {
  company_key: string;
  company: string;
  available_cash_balance: number;
  monthly_burn: number;
  burn_rate_3mo_avg: number;
  burn_multiple: number;
  runway_months: number;
  cash_out_date: string;
  mrr: number;
  arr: number;
  gross_margin_pct: number;
  customers: number;
  avg_deal_size: number;
  avg_monthly_retainer: number;
  avg_client_lifetime_months: number;
  commission_rate_pct: number;
  cogs_per_dollar: number;
  spotlight_anomalies: string[];
};

export type SignalEvent = {
  type: string;
  count: number;
  last: string;
  weight: number;
};

export type SocialPost = {
  platform: string;
  date: string;
  text: string;
  url?: string;
  engagement?: string;
};

export type SignalProfile = {
  person_id: string;
  name: string;
  title: string;
  company_key: string;
  signals: SignalEvent[];
  intent_score: number;
  status: "Ready to Buy" | "Hot" | "Warming" | "Cold";
  recent_posts?: SocialPost[];
};

export type DealImpactProjection = {
  company_key: string;
  scenario: {
    deal_size: number;
    deal_stage?: DealStage;
    discount_pct: number;
    effective_deal_size: number;
    deal_mrr: number;
  };
  financial: {
    baseline: FinancialBaseline;
    close_probability_base?: number;
    close_probability_discounted?: number;
    margin_delta_pct: number;
    runway_change_months: number;
    commission_delta: number;
    risk_adjusted_value: number;
    recommendation: string;
    verdict?:
      | "TAKE THE DEAL"
      | "MARGINAL - NEGOTIATE HARDER"
      | "DON'T DISCOUNT";
  };
  charts: {
    mrr_projection: number[];
    margin_projection: number[];
    runway_projection: number[];
    commission_projection: number[];
    ev_curve?: {
      discounts: number[];
      annual_ev_with_discount: number[];
      ltv_ev_with_discount: number[];
      close_probability_with_discount: number[];
      base_close_probability: number;
      annual_ev_peak_discount: number;
      annual_ev_peak_value: number;
      ltv_ev_peak_discount: number;
      ltv_ev_peak_value: number;
    };
  };
  pricing?: {
    lifetime?: {
      ltv: number;
      ltv_profit: number;
      ltv_discounted: number;
      ltv_profit_discounted: number;
      ltv_profit_lost: number;
      adjusted_client_lifetime_months: number;
    };
    probability?: {
      base_close_probability: number;
      close_probability_with_discount: number;
      gap_pct: number;
      max_lift_pct: number;
      raw_lift_pct: number;
      quality_penalty_pct: number;
      retention_factor: number;
    };
    expected_value?: {
      annual_no_discount: number;
      annual_with_discount: number;
      ltv_no_discount: number;
      ltv_with_discount: number;
      ltv_ev_diff: number;
      verdict:
        | "TAKE THE DEAL"
        | "MARGINAL - NEGOTIATE HARDER"
        | "DON'T DISCOUNT";
    };
  };
  summary: {
    revenue_after_discount: number;
    gross_margin_after: number;
    runway_after: number;
    commission_after: number;
    margin_pressure: "low" | "medium" | "high";
    headline: string;
    verdict?:
      | "TAKE THE DEAL"
      | "MARGINAL - NEGOTIATE HARDER"
      | "DON'T DISCOUNT";
    ev_ltv_diff?: number;
  };
  derived_metrics?: {
    mrr_change_pct: number;
    new_arr: number;
    new_arr_growth: number;
    gross_profit_monthly: number;
    gross_profit_monthly_full: number;
    cogs_monthly: number;
    base_risk_adjusted: number;
    arr_change: number;
    close_probability_delta: number;
    avg_client_lifetime: number;
    adjusted_client_lifetime: number;
  };
};

export type ToolSuccess<T> = MCPTextResult & { payload: T };
