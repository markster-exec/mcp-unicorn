import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { DealImpactInput, DealImpactInputType } from "../types/contracts";
import { buildDealProjection } from "../services/impactEngine";
import {
  DEAL_DEFAULTS,
  getBaselineFinancials,
  getCompanyByKey,
} from "../services/mockData";

export function registerDealImpactTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "deal_impact",
    {
      title: "Deal Impact",
      description:
        "Calculate MRR, margin, runway, and commission impact for a target deal.",
      inputSchema: DealImpactInput.shape,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args) => {
      const parsed = DealImpactInput.parse(args);
      const company = getCompanyByKey(parsed.company_key);
      const financials = getBaselineFinancials(parsed.company_key);
      const dealOverride =
        DEAL_DEFAULTS[parsed.company_key?.toLowerCase() ?? ""];
      const effectiveDealSize = dealOverride?.dealSize ?? parsed.deal_size;

      const projection = buildDealProjection(financials, effectiveDealSize, 0);

      const payload = {
        tool: "deal_impact",
        ...projection,
        source: "mock",
        company_name: company?.name ?? financials.company,
        company_key: parsed.company_key,
        scenario_note:
          "This projection is a mock model with deterministic parameters and Puzzle-style metric naming.",
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
