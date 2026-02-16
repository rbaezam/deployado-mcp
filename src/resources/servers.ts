import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";

export function registerServerResources(
  server: McpServer,
  client: DeployadoClient
) {
  server.resource("servers-list", "deployado://servers", {
    description:
      "Overview of all servers with their status and resource metrics.",
    mimeType: "application/json",
  }, async () => {
    try {
      const data = await client.listServers();
      const summary = data.servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        roles: s.roles,
        metrics: s.metrics,
        last_heartbeat_at: s.last_heartbeat_at,
      }));
      return {
        contents: [
          {
            uri: "deployado://servers",
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch {
      return {
        contents: [
          {
            uri: "deployado://servers",
            mimeType: "text/plain",
            text: "Failed to fetch servers. Check your DEPLOYADO_API_TOKEN.",
          },
        ],
      };
    }
  });
}
