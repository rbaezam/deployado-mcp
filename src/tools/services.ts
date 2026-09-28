import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerServiceTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_service_templates",
    "Browse available service templates from the Deployado marketplace (databases, caches, monitoring tools, etc.).",
    {
      category: z
        .string()
        .optional()
        .describe("Filter by category: database, cache, monitoring, etc."),
    },
    async ({ category }) => {
      try {
        const data = await client.listServiceTemplates(category);
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_list_services",
    "List all installed services for your account.",
    {
      status: z
        .string()
        .optional()
        .describe("Filter by status: running, stopped, error"),
    },
    async ({ status }) => {
      try {
        const data = await client.listServices(status);
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_service",
    "Get detailed information about a specific installed service.",
    {
      service_id: z.string().describe("Service ID (UUID)"),
    },
    async ({ service_id }) => {
      try {
        const data = await client.getService(service_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_install_service",
    "Install a new service from a marketplace template.",
    {
      template_id: z
        .string()
        .describe(
          "Service template ID (UUID) — use deployado_list_service_templates to find available templates"
        ),
      name: z.string().describe("Name for the service instance"),
      config: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Service-specific configuration"),
      memory_mb: z
        .number()
        .optional()
        .describe("Memory limit in MB (default: 512)"),
    },
    async ({ template_id, name, config, memory_mb }) => {
      try {
        const data = await client.installService({
          template_id,
          name,
          config,
          memory_mb,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_start_service",
    "Start a stopped service.",
    {
      service_id: z.string().describe("Service ID (UUID)"),
    },
    async ({ service_id }) => {
      try {
        const data = await client.startService(service_id);
        return {
          content: [
            {
              type: "text",
              text: `Service started successfully.\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_stop_service",
    "Stop a running service.",
    {
      service_id: z.string().describe("Service ID (UUID)"),
    },
    async ({ service_id }) => {
      try {
        const data = await client.stopService(service_id);
        return {
          content: [
            {
              type: "text",
              text: `Service stopped successfully.\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_restart_service",
    "Restart a service.",
    {
      service_id: z.string().describe("Service ID (UUID)"),
    },
    async ({ service_id }) => {
      try {
        const data = await client.restartService(service_id);
        return {
          content: [
            {
              type: "text",
              text: `Service restarted successfully.\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
