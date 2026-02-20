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
    `Create a new app in a project.

IMPORTANT: Apps with a repository_url are built using Docker. The repository MUST contain a Dockerfile (at dockerfile_path, default "Dockerfile" relative to build_context).

For static websites (HTML/CSS/JS), add a simple Dockerfile:
  FROM nginx:alpine
  COPY . /usr/share/nginx/html
  EXPOSE 80

Key parameters:
- repository_url: Git repo URL (HTTPS). Required for repo-based apps.
- dockerfile_path: Path to Dockerfile relative to build_context (default: "Dockerfile").
- build_context: Subdirectory where Docker build runs, relative to repo root (default: "."). Use this when your site is in a subfolder (e.g. "website").
- port: The port your app listens on inside the container. For nginx use 80, for Node.js typically 3000 or 8080.
- branch: Git branch to build from (default: "main").`,
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
    `Trigger a new deployment for an app. Returns immediately with a release_id while the build runs in the background.

The deployment process: source code is cloned → Docker image is built → image is pushed → container is deployed.

After triggering:
- Use deployado_get_release with the returned release_id to check build status (queued → pending → building → ready or failed).
- If the build fails, use deployado_get_build_logs with the release_id to see the Docker build output.
- commit_sha is optional — if omitted, the latest commit from the configured branch is used.
- For runtime container logs after deployment, use deployado_get_logs.`,
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
    "List available releases for an app, showing version history and build status. Each release has a status: queued, pending, building, ready (success), or failed. Use deployado_get_build_logs with a release_id to see build output.",
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
    "Fetch recent runtime logs from a running app's container. NOTE: These are runtime/application logs, NOT build logs. To see build output (e.g. why a deploy failed), use deployado_get_build_logs instead.",
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

  server.tool(
    "deployado_get_release",
    "Get detailed information about a specific release, including build status, commit info, and error details. Use this to check if a build succeeded or failed after triggering a deploy.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      release_id: z
        .string()
        .describe("Release ID (UUID) — returned by deployado_deploy"),
    },
    async ({ app_id, release_id }) => {
      try {
        const data = await client.getRelease(app_id, release_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.release, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_build_logs",
    `Fetch build logs for a specific release. Use this to diagnose why a build failed.

Returns the Docker build output, including Dockerfile parsing errors, dependency installation logs, and compilation output. If the build is still in progress, returns partial logs collected so far.

IMPORTANT: This returns BUILD logs (from the Docker build process), not runtime container logs. For runtime logs of a running app, use deployado_get_logs instead.`,
    {
      app_id: z.string().describe("App ID (UUID)"),
      release_id: z
        .string()
        .describe(
          "Release ID (UUID) — returned by deployado_deploy or deployado_list_releases"
        ),
    },
    async ({ app_id, release_id }) => {
      try {
        const data = await client.getBuildLogs(app_id, release_id);
        const parts: string[] = [];
        parts.push(`Build Status: ${data.status}`);
        if (data.duration_seconds)
          parts.push(`Duration: ${data.duration_seconds}s`);
        if (data.error_message) parts.push(`Error: ${data.error_message}`);
        if (data.started_at) parts.push(`Started: ${data.started_at}`);
        if (data.finished_at) parts.push(`Finished: ${data.finished_at}`);
        parts.push("");
        parts.push("--- Build Output ---");
        parts.push(data.logs || "(no logs available yet)");
        return {
          content: [{ type: "text", text: parts.join("\n") }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
