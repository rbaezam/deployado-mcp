import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";
import { registerAppResources } from "./apps.js";
import { registerServerResources } from "./servers.js";

export function registerAllResources(
  server: McpServer,
  client: DeployadoClient
) {
  registerAppResources(server, client);
  registerServerResources(server, client);
}
