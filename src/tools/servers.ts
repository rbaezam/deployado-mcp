import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerServerTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_servers",
    "List all servers with their status and resource metrics (CPU, memory, disk).",
    {},
    async () => {
      try {
        const data = await client.listServers();
        return {
          content: [
            { type: "text", text: JSON.stringify(data.servers, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_server",
    "Get detailed information about a specific server, including agent version, OS, architecture, and Docker version.",
    {
      server_id: z.string().describe("Server ID (UUID)"),
    },
    async ({ server_id }) => {
      try {
        const data = await client.getServer(server_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.server, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
