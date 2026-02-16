import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerEnvTools(server: McpServer, client: DeployadoClient) {
  server.tool(
    "deployado_list_env",
    "List all environment variables for an app. Values of secret variables may be masked.",
    {
      app_id: z.string().describe("App ID (UUID)"),
    },
    async ({ app_id }) => {
      try {
        const data = await client.listEnv(app_id);
        return {
          content: [{ type: "text", text: JSON.stringify(data.env, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_set_env",
    "Set or update environment variables for an app. Merges with existing variables. A redeploy may be triggered automatically.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      env: z
        .record(z.string(), z.string())
        .describe(
          'Key-value map of environment variables to set, e.g. {"DATABASE_URL": "postgres://...", "SECRET_KEY": "abc123"}'
        ),
    },
    async ({ app_id, env }) => {
      try {
        const data = await client.setEnv(app_id, env);
        return {
          content: [{ type: "text", text: JSON.stringify(data.env, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_delete_env",
    "Delete a single environment variable from an app.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      key: z.string().describe("Environment variable name to delete"),
    },
    async ({ app_id, key }) => {
      try {
        await client.deleteEnv(app_id, key);
        return {
          content: [
            { type: "text", text: `Environment variable '${key}' deleted.` },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
