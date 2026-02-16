import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerAppTools(server: McpServer, client: DeployadoClient) {
  server.tool(
    "deployado_list_apps",
    "List all apps in your Deployado account. Optionally filter by project ID.",
    { project_id: z.string().optional().describe("Filter by project ID") },
    async ({ project_id }) => {
      try {
        const data = await client.listApps(project_id);
        return {
          content: [{ type: "text", text: JSON.stringify(data.apps, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_app",
    "Get detailed information about a specific app.",
    { app_id: z.string().describe("App ID (UUID)") },
    async ({ app_id }) => {
      try {
        const data = await client.getApp(app_id);
        return {
          content: [{ type: "text", text: JSON.stringify(data.app, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_create_app",
    "Create a new app in a project.",
    {
      project_id: z.string().describe("Project ID to create the app in"),
      name: z.string().describe("App name"),
      repository_url: z.string().optional().describe("Git repository URL"),
      branch: z.string().optional().describe("Git branch (default: main)"),
      port: z.number().optional().describe("Internal port the app listens on"),
      dockerfile_path: z.string().optional().describe("Path to Dockerfile"),
      build_context: z.string().optional().describe("Docker build context path"),
    },
    async (params) => {
      try {
        const data = await client.createApp(params);
        return {
          content: [{ type: "text", text: JSON.stringify(data.app, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_update_app",
    "Update an existing app's configuration.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      name: z.string().optional().describe("New app name"),
      port: z.number().optional().describe("Internal port"),
      pre_deploy_command: z.string().optional().describe("Command to run before deploy"),
      health_check_path: z.string().optional().describe("Health check endpoint path"),
      dockerfile_path: z.string().optional().describe("Path to Dockerfile"),
      build_context: z.string().optional().describe("Docker build context path"),
      auto_deploy_enabled: z.boolean().optional().describe("Enable auto-deploy on git push"),
    },
    async ({ app_id, ...params }) => {
      try {
        const data = await client.updateApp(app_id, params);
        return {
          content: [{ type: "text", text: JSON.stringify(data.app, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_delete_app",
    "Permanently delete an app and all its deployments, releases, and environment variables. This action cannot be undone.",
    { app_id: z.string().describe("App ID (UUID)") },
    async ({ app_id }) => {
      try {
        const data = await client.deleteApp(app_id);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_deploy",
    "Trigger a new deployment for an app. Returns immediately with release info while the deployment runs in the background.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      branch: z.string().optional().describe("Branch to deploy (defaults to app's configured branch)"),
      commit_sha: z.string().optional().describe("Specific commit SHA to deploy"),
    },
    async ({ app_id, branch, commit_sha }) => {
      try {
        const data = await client.deploy(app_id, { branch, commit_sha });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_rollback",
    "Rollback an app to a previous release version.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      release_id: z.string().optional().describe("Release ID to rollback to"),
      version: z.string().optional().describe("Release version number to rollback to"),
    },
    async ({ app_id, release_id, version }) => {
      try {
        const data = await client.rollback(app_id, { release_id, version });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_list_releases",
    "List available releases for an app, showing version history.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      limit: z.number().optional().describe("Max number of releases to return (default 10, max 50)"),
    },
    async ({ app_id, limit }) => {
      try {
        const data = await client.listReleases(app_id, limit);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.releases, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_logs",
    "Fetch recent logs from a running app's container.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      lines: z.number().optional().describe("Number of log lines to return (default 100)"),
      timestamps: z.boolean().optional().describe("Include timestamps in log output"),
    },
    async ({ app_id, lines, timestamps }) => {
      try {
        const data = await client.getLogs(app_id, lines, timestamps);
        if (data.logs && data.logs.length > 0) {
          const formatted = data.logs
            .map((l) =>
              l.timestamp
                ? `[${l.timestamp}] ${l.message}`
                : l.message
            )
            .join("\n");
          return { content: [{ type: "text", text: formatted }] };
        }
        return {
          content: [
            { type: "text", text: data.message || "No logs available" },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
