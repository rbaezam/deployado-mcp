import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerProjectTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_projects",
    "List all projects in your Deployado account.",
    {},
    async () => {
      try {
        const data = await client.listProjects();
        return {
          content: [
            { type: "text", text: JSON.stringify(data.projects, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_project",
    "Get detailed information about a specific project.",
    {
      project_id: z.string().describe("Project ID (UUID)"),
    },
    async ({ project_id }) => {
      try {
        const data = await client.getProject(project_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.project, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
