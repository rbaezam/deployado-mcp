import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerCronTools(server: McpServer, client: DeployadoClient) {
  server.tool(
    "deployado_list_cron_jobs",
    "List all cron jobs for an app.",
    {
      app_id: z.string().describe("App ID (UUID)"),
    },
    async ({ app_id }) => {
      try {
        const data = await client.listCronJobs(app_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.cron_jobs, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_create_cron_job",
    "Create a new cron job for an app.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      name: z.string().describe("Cron job name"),
      schedule: z
        .string()
        .describe("Cron schedule expression, e.g. '0 * * * *' for hourly"),
      command: z.string().describe("Shell command to execute"),
      enabled: z
        .boolean()
        .optional()
        .describe("Whether the cron job is enabled (default: true)"),
      timezone: z
        .string()
        .optional()
        .describe("Timezone, e.g. 'America/New_York' (default: UTC)"),
      timeout_seconds: z
        .number()
        .optional()
        .describe("Max execution time in seconds"),
    },
    async ({ app_id, name, schedule, command, enabled, timezone, timeout_seconds }) => {
      try {
        const data = await client.createCronJob(app_id, {
          name,
          schedule,
          command,
          enabled,
          timezone,
          timeout_seconds,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(data.cron_job, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_update_cron_job",
    "Update an existing cron job.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      cron_id: z.string().describe("Cron job ID (UUID)"),
      name: z.string().optional(),
      schedule: z.string().optional(),
      command: z.string().optional(),
      enabled: z.boolean().optional(),
      timezone: z.string().optional(),
      timeout_seconds: z.number().optional(),
    },
    async ({ app_id, cron_id, name, schedule, command, enabled, timezone, timeout_seconds }) => {
      try {
        const params: Record<string, unknown> = {};
        if (name !== undefined) params.name = name;
        if (schedule !== undefined) params.schedule = schedule;
        if (command !== undefined) params.command = command;
        if (enabled !== undefined) params.enabled = enabled;
        if (timezone !== undefined) params.timezone = timezone;
        if (timeout_seconds !== undefined) params.timeout_seconds = timeout_seconds;

        const data = await client.updateCronJob(app_id, cron_id, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.cron_job, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_delete_cron_job",
    "Delete a cron job.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      cron_id: z.string().describe("Cron job ID (UUID)"),
    },
    async ({ app_id, cron_id }) => {
      try {
        const data = await client.deleteCronJob(app_id, cron_id);
        return {
          content: [
            { type: "text", text: data.message },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_run_cron_job",
    "Manually trigger a cron job to run immediately.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      cron_id: z.string().describe("Cron job ID (UUID)"),
    },
    async ({ app_id, cron_id }) => {
      try {
        const data = await client.runCronJob(app_id, cron_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { message: data.message, run_id: data.run_id },
                null,
                2
              ),
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
