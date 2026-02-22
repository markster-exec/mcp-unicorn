import {
  DealImpactProjection,
  DealStage,
  FinancialBaseline,
} from "../types/contracts";

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const BASE_CLOSE_RATES: Record<DealStage, number> = {
  discovery: 15,
  proposal_sent: 35,
  negotiation: 38,
  verbal_commit: 80,
};

function closeProbabilityInputs(
  baseCloseRate: number,
  discountPct: number,
): {
  base: number;
  gap: number;
  maxLift: number;
  rawLift: number;
  penalty: number;
  withDiscount: number;
  qualityThreshold: number;
} {
  const base = clamp(baseCloseRate, 0, 95);
  const gap = 100 - base;
  const maxLift = gap * 0.5;
  const rawLift = maxLift * (1 - Math.exp(-0.1 * discountPct));
  const qualityPenalty = discountPct > 20 ? (discountPct - 20) * 0.6 : 0;
  const withDiscount = Math.min(base + rawLift - qualityPenalty, 95);

  return {
    base,
    gap,
    maxLift: round(maxLift, 2),
    rawLift: round(rawLift, 2),
    penalty: round(qualityPenalty, 2),
    withDiscount: clamp(round(withDiscount, 2), base, 95),
    qualityThreshold: 20,
  };
}

function effectiveRetentionFactor(discountPct: number): number {
  if (discountPct <= 15) {
    return 1;
  }
  return clamp(1 - (discountPct - 15) * 0.008, 0.0, 1.0);
}

type EvCurve = {
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

type PricingVerdict =
  | "TAKE THE DEAL"
  | "MARGINAL - NEGOTIATE HARDER"
  | "DON'T DISCOUNT";

function buildEvCurve(
  baseline: FinancialBaseline,
  baseDealSize: number,
  baseMonthlyRetainer: number,
  cogsMonthly: number,
  baseCloseRate: number,
): EvCurve {
  const discounts: number[] = [];
  const annualEvWithDiscount: number[] = [];
  const ltvEvWithDiscount: number[] = [];
  const closeProbabilities: number[] = [];

  let bestAnnualEv = Number.NEGATIVE_INFINITY;
  let bestAnnualDiscount = 0;
  let bestLtvEv = Number.NEGATIVE_INFINITY;
  let bestLtvDiscount = 0;
  const baselineLifetime = baseline.avg_client_lifetime_months;

  for (let discount = 0; discount <= 40; discount += 1) {
    const probabilities = closeProbabilityInputs(baseCloseRate, discount);
    const retentionFactor = effectiveRetentionFactor(discount);
    const adjustedLifetime = Math.max(0, baselineLifetime * retentionFactor);

    const discountRate = clamp(discount, 0, 100) / 100;
    const arrWithDiscount = round(baseDealSize * (1 - discountRate), 0);
    const discountedMonthlyRetainer = round(
      baseMonthlyRetainer * (1 - discountRate),
      2,
    );
    const grossProfitMonthly = round(
      discountedMonthlyRetainer - cogsMonthly,
      2,
    );
    const ltvProfitDiscounted = round(grossProfitMonthly * adjustedLifetime, 0);

    const annualEv = round(
      arrWithDiscount * (probabilities.withDiscount / 100),
      0,
    );
    const ltvEv = round(
      ltvProfitDiscounted * (probabilities.withDiscount / 100),
      0,
    );

    discounts.push(discount);
    annualEvWithDiscount.push(annualEv);
    ltvEvWithDiscount.push(ltvEv);
    closeProbabilities.push(probabilities.withDiscount);

    if (annualEv > bestAnnualEv) {
      bestAnnualEv = annualEv;
      bestAnnualDiscount = discount;
    }

    if (ltvEv > bestLtvEv) {
      bestLtvEv = ltvEv;
      bestLtvDiscount = discount;
    }
  }

  if (bestAnnualEv === Number.NEGATIVE_INFINITY) {
    bestAnnualEv = 0;
  }
  if (bestLtvEv === Number.NEGATIVE_INFINITY) {
    bestLtvEv = 0;
  }

  return {
    discounts,
    annual_ev_with_discount: annualEvWithDiscount,
    ltv_ev_with_discount: ltvEvWithDiscount,
    close_probability_with_discount: closeProbabilities,
    base_close_probability: round(baseCloseRate, 2),
    annual_ev_peak_discount: bestAnnualDiscount,
    annual_ev_peak_value: round(bestAnnualEv, 0),
    ltv_ev_peak_discount: bestLtvDiscount,
    ltv_ev_peak_value: round(bestLtvEv, 0),
  };
}

function verdictFromLtvExpectedValueDiff(
  ltvExpectedValueDiff: number,
): PricingVerdict {
  if (ltvExpectedValueDiff > 1000) {
    return "TAKE THE DEAL";
  }
  if (ltvExpectedValueDiff > 0) {
    return "MARGINAL - NEGOTIATE HARDER";
  }
  return "DON'T DISCOUNT";
}

export function buildDealProjection(
  baseline: FinancialBaseline,
  dealSize: number,
  discountPct: number,
  dealStage: DealStage = "negotiation",
): DealImpactProjection {
  const baseDealSize = clamp(dealSize, 0, Number.MAX_VALUE);
  const discountRate = clamp(discountPct, 0, 100) / 100;
  const baseMonthlyRetainer = round(baseDealSize / 12);
  const cogsPerDollar = clamp(baseline.cogs_per_dollar ?? 0.28, 0, 1);
  const cogsMonthly = round(baseMonthlyRetainer * cogsPerDollar);

  const discountedMonthlyRetainer = round(
    baseMonthlyRetainer * (1 - discountRate),
    2,
  );
  const grossProfitMonthly = round(discountedMonthlyRetainer - cogsMonthly, 2);
  const grossProfitMonthlyFull = round(baseMonthlyRetainer - cogsMonthly, 2);

  const effectiveGrossMargin =
    discountedMonthlyRetainer > 0
      ? round((grossProfitMonthly / discountedMonthlyRetainer) * 100, 1)
      : 0;

  const baseRunway = round(baseline.runway_months, 1);
  const grossContribution = Math.max(0, grossProfitMonthly);
  const projectedBurn = Math.max(
    500,
    baseline.monthly_burn - grossContribution,
  );
  const runwayAfter = round(baseline.available_cash_balance / projectedBurn, 1);

  const runwayChange = round(runwayAfter - baseRunway, 1);
  const newMrr = round(discountedMonthlyRetainer);
  const newMrrTotal = round(baseline.mrr + newMrr, 0);
  const mrrChangePct =
    baseline.mrr > 0 ? round((newMrr / baseline.mrr) * 100) : 0;
  const arrChange = round(baseDealSize * (1 - discountRate), 0);
  const newArr = round(baseline.arr + arrChange, 0);

  const commissionBefore = round(
    baseDealSize * (baseline.commission_rate_pct / 100),
    2,
  );
  const commissionAfter = round(
    arrChange * (baseline.commission_rate_pct / 100),
    2,
  );

  const stageRate = BASE_CLOSE_RATES[dealStage];
  const probabilities = closeProbabilityInputs(stageRate, discountPct);

  const adjustedLifetime = round(
    Math.max(
      0,
      (baseline.avg_client_lifetime_months ?? 14) *
        effectiveRetentionFactor(discountPct),
    ),
    1,
  );

  const ltvFull = round(
    baseMonthlyRetainer * baseline.avg_client_lifetime_months,
    0,
  );
  const ltvProfitFull = round(
    grossProfitMonthlyFull * baseline.avg_client_lifetime_months,
    0,
  );
  const ltvDiscounted = round(discountedMonthlyRetainer * adjustedLifetime, 0);
  const ltvProfitDiscounted = round(grossProfitMonthly * adjustedLifetime, 0);
  const ltvProfitLost = round(ltvProfitFull - ltvProfitDiscounted, 2);
  const evWithoutDiscount = round(baseDealSize * (probabilities.base / 100), 0);
  const evWithDiscount = round(
    arrChange * (probabilities.withDiscount / 100),
    0,
  );
  const ltvExpectedValueWithoutDiscount = round(
    ltvProfitFull * (probabilities.base / 100),
    0,
  );
  const ltvExpectedValueWithDiscount = round(
    ltvProfitDiscounted * (probabilities.withDiscount / 100),
    0,
  );
  const ltvExpectedValueDiff = round(
    ltvExpectedValueWithDiscount - ltvExpectedValueWithoutDiscount,
    0,
  );
  const verdict = verdictFromLtvExpectedValueDiff(ltvExpectedValueDiff);

  const baseRiskAdjusted = round(baseDealSize * (stageRate / 100), 2);
  const adjustedRiskAdjusted = round(
    arrChange *
      (probabilities.withDiscount / 100) *
      (Math.max(effectiveGrossMargin, 0) / 100),
    2,
  );

  const marginPressure: "low" | "medium" | "high" =
    discountPct <= 10 ? "low" : discountPct <= 20 ? "medium" : "high";

  let recommendation =
    "TAKE THE DEAL — expected value gain outweighs margin loss.";
  if (verdict === "DON'T DISCOUNT") {
    if (dealStage === "verbal_commit") {
      recommendation =
        "They've already said yes. Don't discount. Offer speed or scope upgrade instead.";
    } else {
      recommendation = "Don't discount: EV isn't positive after LTV impact.";
    }
  } else if (verdict === "MARGINAL - NEGOTIATE HARDER") {
    recommendation =
      "This is marginally positive; prefer a lower discount and a tighter pilot offer.";
  } else if (discountPct === probabilities.qualityThreshold) {
    recommendation =
      "Sweet-spot region. Good close uplift with manageable margin impact.";
  }

  const headline = `${
    probabilities.withDiscount
  }% close probability at ${dealStage
    .replace("_", " ")
    .replace(/\b\w/g, (value) =>
      value.toUpperCase(),
    )} with ${discountPct}% discount`;

  const mrrProjection = [
    round(baseline.mrr, 0),
    round(baseline.mrr + newMrr * 0.8, 0),
    round(newMrrTotal, 0),
    round(newMrrTotal * (1 + discountRate * 0.1), 0),
    round(newMrrTotal + baseMonthlyRetainer * 0.2, 0),
  ];

  const marginProjection = [
    baseline.gross_margin_pct,
    round(Math.max(effectiveGrossMargin, baseline.gross_margin_pct - 4), 1),
    round(effectiveGrossMargin, 1),
    round(Math.max(effectiveGrossMargin - 1.2, 45), 1),
    round(Math.max(effectiveGrossMargin - 2.6, 40), 1),
  ];

  const runwayProjection = [
    baseRunway,
    round(baseRunway + runwayChange * 0.35, 1),
    round(runwayAfter, 1),
    round(Math.max(runwayAfter - 0.4, 0), 1),
    round(Math.max(runwayAfter - 0.9, 0), 1),
  ];

  const commissionProjection = [
    round(commissionBefore, 2),
    round(commissionAfter, 2),
    round(commissionAfter, 2),
    round(commissionAfter, 2),
    round(Math.max(commissionAfter * 0.95, 0), 2),
  ];

  return {
    company_key: baseline.company_key,
    scenario: {
      deal_size: round(baseDealSize, 0),
      deal_stage: dealStage,
      discount_pct: clamp(discountPct, 0, 100),
      effective_deal_size: round(baseDealSize * (1 - discountRate), 0),
      deal_mrr: newMrr,
    },
    financial: {
      baseline,
      close_probability_base: probabilities.base,
      close_probability_discounted: probabilities.withDiscount,
      margin_delta_pct: round(
        effectiveGrossMargin - baseline.gross_margin_pct,
        1,
      ),
      runway_change_months: runwayChange,
      commission_delta: round(commissionAfter - commissionBefore, 2),
      risk_adjusted_value: adjustedRiskAdjusted,
      recommendation,
      verdict,
    },
    pricing: {
      lifetime: {
        ltv: ltvFull,
        ltv_profit: ltvProfitFull,
        ltv_discounted: ltvDiscounted,
        ltv_profit_discounted: ltvProfitDiscounted,
        ltv_profit_lost: ltvProfitLost,
        adjusted_client_lifetime_months: adjustedLifetime,
      },
      probability: {
        base_close_probability: probabilities.base,
        close_probability_with_discount: probabilities.withDiscount,
        gap_pct: probabilities.gap,
        max_lift_pct: probabilities.maxLift,
        raw_lift_pct: probabilities.rawLift,
        quality_penalty_pct: probabilities.penalty,
        retention_factor: effectiveRetentionFactor(discountPct),
      },
      expected_value: {
        annual_no_discount: evWithoutDiscount,
        annual_with_discount: evWithDiscount,
        ltv_no_discount: ltvExpectedValueWithoutDiscount,
        ltv_with_discount: ltvExpectedValueWithDiscount,
        ltv_ev_diff: ltvExpectedValueDiff,
        verdict,
      },
    },
    charts: {
      mrr_projection: mrrProjection,
      margin_projection: marginProjection,
      runway_projection: runwayProjection,
      commission_projection: commissionProjection,
      ev_curve: buildEvCurve(
        baseline,
        baseDealSize,
        baseMonthlyRetainer,
        cogsMonthly,
        stageRate,
      ),
    },
    summary: {
      revenue_after_discount: round(baseDealSize * (1 - discountRate), 0),
      gross_margin_after: effectiveGrossMargin,
      runway_after: runwayAfter,
      commission_after: commissionAfter,
      margin_pressure: marginPressure,
      headline,
      verdict,
      ev_ltv_diff: ltvExpectedValueDiff,
    },
    derived_metrics: {
      mrr_change_pct: mrrChangePct,
      new_arr: newArr,
      new_arr_growth:
        baseline.arr > 0 ? round((arrChange / baseline.arr) * 100, 1) : 0,
      gross_profit_monthly: grossProfitMonthly,
      gross_profit_monthly_full: grossProfitMonthlyFull,
      cogs_monthly: cogsMonthly,
      base_risk_adjusted: baseRiskAdjusted,
      arr_change: arrChange,
      close_probability_delta: round(
        probabilities.withDiscount - probabilities.base,
        2,
      ),
      avg_client_lifetime: baseline.avg_client_lifetime_months,
      adjusted_client_lifetime: adjustedLifetime,
    },
  };
}
