import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerProjectTools(
  server: McpServer,
  client: DeployadoClient,
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
    },
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
    },
  );

  server.tool(
    "deployado_create_project",
    "Create a new project in your Deployado account.",
    {
      name: z.string().describe("Project name"),
      description: z.string().optional().describe("Project description"),
      repository_url: z.string().optional().describe("Git repository URL"),
      default_branch: z
        .string()
        .optional()
        .describe("Default branch (e.g. 'main')"),
    },
    async ({ name, description, repository_url, default_branch }) => {
      try {
        const data = await client.createProject({
          name,
          description,
          repository_url,
          default_branch,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(data.project, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    },
  );

  server.tool(
    "deployado_update_project",
    "Update a project's name, description, or other settings.",
    {
      project_id: z.string().describe("Project ID (UUID)"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New description"),
      repository_url: z.string().optional().describe("New repository URL"),
      default_branch: z.string().optional().describe("New default branch"),
    },
    async ({
      project_id,
      name,
      description,
      repository_url,
      default_branch,
    }) => {
      try {
        const params: Record<string, unknown> = {};
        if (name !== undefined) params.name = name;
        if (description !== undefined) params.description = description;
        if (repository_url !== undefined)
          params.repository_url = repository_url;
        if (default_branch !== undefined)
          params.default_branch = default_branch;

        const data = await client.updateProject(project_id, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.project, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    },
  );

  server.tool(
    "deployado_delete_project",
    "Delete a project and all its associated apps. This action cannot be undone.",
    {
      project_id: z.string().describe("Project ID (UUID)"),
    },
    async ({ project_id }) => {
      try {
        const data = await client.deleteProject(project_id);
        return {
          content: [{ type: "text", text: data.message }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    },
  );
}
