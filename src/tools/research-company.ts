import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { shouldLogToolCalls } from "../markster/client";
import {
  ResearchCompanyInput,
  ResearchCompanyInputType,
} from "../types/contracts";
import { enrichCompanyProfile } from "../services/companyEnrichmentService";

export function registerResearchCompanyTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "research_company",
    {
      title: "Research Company",
      description:
        "Fetch company profile, people, funding, and intent-friendly context.",
      inputSchema: ResearchCompanyInput,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args: ResearchCompanyInputType) => {
      const query = ResearchCompanyInput.parse(args);
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] start tool=research_company args=${JSON.stringify(
            query,
          )}`,
        );
      }

      const payload = await enrichCompanyProfile(query);
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] done tool=research_company source=${payload.source}`,
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
