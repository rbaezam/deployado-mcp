import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerAccountTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_whoami",
    "Show current account, user, and API token information. Useful to verify authentication is working.",
    {},
    async () => {
      try {
        const data = await client.getMe();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
