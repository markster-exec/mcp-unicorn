import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import {
  PrepCallInput,
  PrepCallInputType,
  type SignalProfile,
} from "../types/contracts";
import {
  DEAL_DEFAULTS,
  getCompanyByKey,
  getSignals,
  getBaselineFinancials,
} from "../services/mockData";
import { buildDealProjection } from "../services/impactEngine";

function humanizeSignalType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildSignalNarrative(signals: SignalProfile[]): string[] {
  const lines: string[] = [];
  for (const person of signals.slice(0, 3)) {
    const behaviors = person.signals
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((s) => {
        const label = humanizeSignalType(s.type);
        return s.count > 1 ? `${label} (${s.count}x)` : label;
      });
    lines.push(
      `${person.name} (${person.title}, intent ${person.intent_score}/100): ${behaviors.join(", ")}.`,
    );
  }
  return lines;
}

function buildTalkingPoints(
  companyName: string,
  warmest: SignalProfile | undefined,
  dealSize: number,
  dealStage: string,
  marginPressure: "low" | "medium" | "high",
  signals: SignalProfile[],
): string[] {
  const points: string[] = [];

  // Deal context
  const stage = dealStage.replace(/_/g, " ");
  points.push(
    `This is a $${(dealSize / 1000).toFixed(0)}K deal in ${stage}. Frame every point around closing it.`,
  );

  // Warmest contact and their specific behaviors
  if (warmest) {
    const topBehaviors = warmest.signals
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    const behaviorText = topBehaviors
      .map((s) => {
        const label = humanizeSignalType(s.type).toLowerCase();
        return s.count > 1 ? `${s.count} ${label}s` : label;
      })
      .join(", ");
    points.push(
      `Lead with ${warmest.name}'s activity: ${behaviorText}. She's at ${warmest.intent_score}/100 intent.`,
    );
  }

  // Pricing posture
  if (marginPressure === "low") {
    points.push(
      "Margins are healthy. You have pricing flexibility, but don't volunteer it. Let them ask.",
    );
  } else if (marginPressure === "medium") {
    points.push(
      "Margins are moderate. Offer value add (extended onboarding, premium support) before any discount.",
    );
  } else {
    points.push(
      "Margins are tight. Do NOT discount. Offer payment terms or phased rollout instead.",
    );
  }

  // Urgency framing
  if (signals.length > 0) {
    const readyToBuy = signals.filter((s) => s.status === "Ready to Buy");
    if (readyToBuy.length > 0) {
      points.push(
        `${readyToBuy.length} contact${readyToBuy.length > 1 ? "s" : ""} flagged "Ready to Buy". Create urgency: "We have Q1 onboarding slots closing this week."`,
      );
    }
  }

  // Close move
  points.push(
    `Ask for the close: "Based on what you've seen, is there anything stopping us from moving forward this week?"`,
  );

  return points;
}

function buildDoNotDo(
  warmest: SignalProfile | undefined,
  marginPressure: "low" | "medium" | "high",
  dealStage: string,
): string[] {
  const items: string[] = [];

  items.push(
    "Don't open with pricing. They already know the number. Open with their business problem.",
  );

  if (warmest && warmest.intent_score >= 70) {
    items.push(
      `Don't oversell to ${warmest.name}. She's already engaged. Listen more than you pitch.`,
    );
  }

  if (marginPressure !== "low") {
    items.push(
      "Don't offer discount unprompted. If they ask, counter with 'What timeline are you working with?'",
    );
  }

  if (dealStage === "negotiation" || dealStage === "verbal_commit") {
    items.push(
      "Don't introduce new stakeholders at this stage. Close with who's at the table.",
    );
  }

  items.push(
    "Don't badmouth competitors. If they bring up alternatives, say 'We hear that a lot. Here's what our clients found after switching.'",
  );

  return items;
}

export function registerPrepCallTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "prep_call",
    {
      title: "Prep Call",
      description:
        "Generate an executive briefing with signal-backed talking points, deal context, and do-not-do list.",
      inputSchema: PrepCallInput.shape,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args) => {
      const parsed = PrepCallInput.parse(args);
      const company = getCompanyByKey(parsed.company_key);
      const financials = getBaselineFinancials(parsed.company_key);
      const signals = getSignals(parsed.company_key);
      const sorted = [...signals].sort(
        (a, b) => b.intent_score - a.intent_score,
      );
      const warmest = sorted[0] ?? null;

      const dealOverride =
        DEAL_DEFAULTS[parsed.company_key?.toLowerCase() ?? ""];
      const dealSize = dealOverride?.dealSize ?? financials.avg_deal_size;
      const dealStage = dealOverride?.dealStage ?? "negotiation";

      const projection = buildDealProjection(
        financials,
        dealSize,
        0,
        dealStage,
      );

      const companyName = company?.name ?? financials.company;
      const talkingPoints = buildTalkingPoints(
        companyName,
        warmest ?? undefined,
        dealSize,
        dealStage,
        projection.summary.margin_pressure,
        sorted,
      );
      const doNotDo = buildDoNotDo(
        warmest ?? undefined,
        projection.summary.margin_pressure,
        dealStage,
      );
      const signalNarrative = buildSignalNarrative(sorted);

      const payload = {
        tool: "prep_call",
        source: "mock",
        persona: parsed.persona ?? "Sales AE",
        company_key: parsed.company_key,
        company_name: companyName,
        deal_size: dealSize,
        deal_stage: dealStage,
        signals_summary: {
          total_signals: signals.length,
          warmest_intent: warmest,
          average_intent_score:
            signals.length === 0
              ? 0
              : Math.round(
                  signals.reduce((acc, item) => acc + item.intent_score, 0) /
                    signals.length,
                ),
          signal_narrative: signalNarrative,
        },
        financial_highlight: `$${(dealSize / 1000).toFixed(0)}K ${dealStage.replace(/_/g, " ")} deal. ${projection.summary.margin_pressure === "low" ? "Margins healthy." : projection.summary.margin_pressure === "medium" ? "Margins moderate." : "Margins tight."} Close probability ${projection.financial.close_probability_base}% at current stage.`,
        talking_points: talkingPoints,
        do_not_do: doNotDo,
        recommendation: projection.financial.recommendation,
        risk_area: projection.summary.margin_pressure,
        call_script: warmest
          ? `Open: "Hi ${warmest.name}, I noticed you've been exploring our platform. What problem are you trying to solve?" Then reference her specific activity. Close: "Given where you are in your evaluation, what would it take to make a decision this week?"`
          : `Open with their business context. Move to ROI framing. Close with timeline commitment.`,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload),
          },
        ],
      };
    },
  );
}
