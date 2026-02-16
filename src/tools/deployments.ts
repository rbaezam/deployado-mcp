import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerDeploymentTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_deployments",
    "List recent deployments for an app, showing status, version, and timing.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      limit: z
        .number()
        .optional()
        .describe("Max deployments to return (default 10, max 50)"),
    },
    async ({ app_id, limit }) => {
      try {
        const data = await client.listDeployments(app_id, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data.deployments, null, 2),
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_deployment",
    "Get detailed information about a specific deployment, including phases and error details.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      deployment_id: z.string().describe("Deployment ID (UUID)"),
    },
    async ({ app_id, deployment_id }) => {
      try {
        const data = await client.getDeployment(app_id, deployment_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.deployment, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_current_deployment",
    "Get the currently active deployment for an app.",
    {
      app_id: z.string().describe("App ID (UUID)"),
    },
    async ({ app_id }) => {
      try {
        const data = await client.getCurrentDeployment(app_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.deployment, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
