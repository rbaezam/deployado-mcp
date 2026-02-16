import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";

export function registerAppResources(
  server: McpServer,
  client: DeployadoClient
) {
  server.resource("apps-list", "deployado://apps", {
    description:
      "Summary of all apps in the Deployado account with their IDs, names, and projects.",
    mimeType: "application/json",
  }, async () => {
    try {
      const data = await client.listApps();
      const summary = data.apps.map((app) => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        project_id: app.project_id,
        branch: app.branch,
        port: app.port,
      }));
      return {
        contents: [
          {
            uri: "deployado://apps",
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch {
      return {
        contents: [
          {
            uri: "deployado://apps",
            mimeType: "text/plain",
            text: "Failed to fetch apps. Check your DEPLOYADO_API_TOKEN.",
          },
        ],
      };
    }
  });
}
