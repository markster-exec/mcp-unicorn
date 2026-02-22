import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { shouldLogToolCalls } from "../markster/client";
import { GetSignalsInput, GetSignalsInputType } from "../types/contracts";
import { getCompanyByKey, getSignals } from "../services/mockData";

export function registerSignalsTool(
  server: McpServer,
  uiResourceUri: string,
): void {
  registerAppTool(
    server,
    "get_signals",
    {
      title: "Get Signals",
      description:
        "Return person-level engagement and intent signals for a company.",
      inputSchema: GetSignalsInput.shape,
      _meta: {
        ui: { resourceUri: uiResourceUri },
        "ui/resourceUri": uiResourceUri,
      },
    },
    async (args) => {
      const parsed = GetSignalsInput.parse(args);
      const company = getCompanyByKey(parsed.company_key);
      const signals = getSignals(parsed.company_key);
      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] start tool=get_signals company_key=${parsed.company_key}`,
        );
      }

      const payload = {
        tool: "get_signals",
        source: "mock",
        company_name: company?.name ?? parsed.company_key,
        company_key: parsed.company_key,
        signals,
        count: signals.length,
        note: "Signals are synthetic and tuned for demo scenarios.",
      };

      if (shouldLogToolCalls()) {
        console.info(
          `[mcp-server] done tool=get_signals count=${signals.length}`,
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
