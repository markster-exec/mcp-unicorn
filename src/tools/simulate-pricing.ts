import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { shouldLogToolCalls } from "../markster/client";
import {
  SimulatePricingInput,
  SimulatePricingInputType,
} from "../types/contracts";
import { buildDealProjection } from "../services/impactEngine";
import {
  DEAL_DEFAULTS,
  getBaselineFinancials,
  getCompanyByKey,
} from "../services/mockData";

export function registerSimulatePricingTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "simulate_pricing",
    {
      title: "Simulate Pricing",
      description:
        "Run a live what-if pricing simulation (discount %) for deal projections.",
      inputSchema: SimulatePricingInput,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args: SimulatePricingInputType) => {
      const parsed = SimulatePricingInput.parse(args);
      const company = getCompanyByKey(parsed.company_key);
      const financials = getBaselineFinancials(parsed.company_key);
      const dealOverride =
        DEAL_DEFAULTS[parsed.company_key?.toLowerCase() ?? ""];
      const effectiveDealSize = dealOverride?.dealSize ?? parsed.deal_size;
      const effectiveStage = dealOverride?.dealStage ?? parsed.deal_stage;
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] start tool=simulate_pricing company_key=${parsed.company_key} deal_size=${effectiveDealSize} discount_pct=${parsed.discount_pct} stage=${effectiveStage}`,
        );
      }

      const projection = buildDealProjection(
        financials,
        effectiveDealSize,
        parsed.discount_pct,
        effectiveStage,
      );

      const payload = {
        tool: "simulate_pricing",
        source: "mock",
        company_name: company?.name ?? financials.company,
        company_key: parsed.company_key,
        deal_stage: effectiveStage,
        discount_pct: parsed.discount_pct,
        deal_size: effectiveDealSize,
        ...projection,
        recommendation:
          projection.financial.recommendation +
          " Use the slider to see margin pressure and runway changes in real time.",
        live_simulation: true,
      };
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] done tool=simulate_pricing company_key=${parsed.company_key} margin_pressure=${payload.summary.margin_pressure}`,
        );
      }

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
