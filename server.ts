import fs from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { registerMarksterTools } from "./src/tools/markster-business-os";
import { registerDailyPrioritiesTool } from "./src/tools/daily-priorities";

const APP_UI_URI = "ui://markster-business-os/app.html";

function resolveBaseDir(): string {
  return process.cwd();
}

async function loadUiHtml(): Promise<string> {
  const root = resolveBaseDir();
  const distFile = path.join(root, "dist", "resources", "app.html");
  return await fs.readFile(distFile, "utf8");
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Markster Business OS MCP",
    version: "1.0.0",
  });

  registerMarksterTools(server, APP_UI_URI);
  registerDailyPrioritiesTool(server, APP_UI_URI);

  registerAppResource(
    server,
    "Markster Business OS UI",
    APP_UI_URI,
    {
      description: "Markster Business OS MCP UI",
      mimeType: RESOURCE_MIME_TYPE,
    },
    async () => {
      const html = await loadUiHtml();
      return {
        contents: [
          {
            uri: APP_UI_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  return server;
}
