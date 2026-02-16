import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerBlueprintTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_validate_blueprint",
    "Validate a Deployado blueprint YAML without deploying it. Returns validation results and a preview of what would be created.",
    {
      content: z.string().describe("Blueprint YAML content to validate"),
    },
    async ({ content }) => {
      try {
        const data = await client.validateBlueprint(content);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_deploy_blueprint",
    "Deploy an entire application stack from a blueprint. Can use inline YAML content or a GitHub repository URL.",
    {
      content: z.string().optional().describe("Blueprint YAML content"),
      repository_url: z
        .string()
        .optional()
        .describe("GitHub repository URL containing a deployado.yaml"),
      branch: z.string().optional().describe("Git branch (default: main)"),
      project_id: z.string().optional().describe("Target project ID"),
      server_id: z.string().optional().describe("Target server ID"),
    },
    async (params) => {
      try {
        const data = await client.deployBlueprint(params);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
