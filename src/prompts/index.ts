import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";
import { registerStatusPrompt } from "./status.js";

export function registerAllPrompts(
  server: McpServer,
  client: DeployadoClient
) {
  registerStatusPrompt(server, client);
}
