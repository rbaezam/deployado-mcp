import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerBackupTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_backup_targets",
    "List all database backup targets configured for your account.",
    {},
    async () => {
      try {
        const data = await client.listBackupTargets();
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
    "deployado_create_backup_target",
    "Create a new database backup target. Backups are stored in S3.",
    {
      name: z.string().describe("Human-readable name for this backup target"),
      db_name: z.string().describe("Database name to back up"),
      db_user: z.string().describe("Database user"),
      db_password: z.string().describe("Database password"),
      db_host: z.string().describe("Database host"),
      db_port: z.number().optional().describe("Database port (default: 5432)"),
      server_id: z.string().describe("Server ID where the database runs"),
      schedule_daily_at: z
        .string()
        .optional()
        .describe("Time for daily backup in HH:MM format (e.g. '02:00')"),
      retention_keep_last_n: z
        .number()
        .optional()
        .describe("Number of backups to keep (default: 14)"),
    },
    async ({
      name,
      db_name,
      db_user,
      db_password,
      db_host,
      db_port,
      server_id,
      schedule_daily_at,
      retention_keep_last_n,
    }) => {
      try {
        const data = await client.createBackupTarget({
          name,
          db_name,
          db_user,
          db_password,
          db_host,
          db_port,
          server_id,
          schedule_daily_at,
          retention_keep_last_n,
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
    "deployado_get_backup_target",
    "Get a backup target's details and its recent backup runs.",
    {
      target_id: z.string().describe("Backup target ID (UUID)"),
    },
    async ({ target_id }) => {
      try {
        const data = await client.getBackupTarget(target_id);
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
    "deployado_run_backup",
    "Trigger an immediate backup for a target.",
    {
      target_id: z.string().describe("Backup target ID (UUID)"),
    },
    async ({ target_id }) => {
      try {
        const data = await client.runBackup(target_id);
        return {
          content: [
            {
              type: "text",
              text: `Backup triggered successfully.\nRun ID: ${data.run_id}\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_restore_backup",
    "Restore a database from a specific backup run. This will overwrite the target database.",
    {
      target_id: z.string().describe("Backup target ID (UUID)"),
      run_id: z.string().describe("Backup run ID (UUID) to restore from"),
      destination_target_id: z
        .string()
        .optional()
        .describe("Restore to a different target (default: same target)"),
      drop_first: z
        .boolean()
        .optional()
        .describe("Drop existing database before restore (default: false)"),
    },
    async ({ target_id, run_id, destination_target_id, drop_first }) => {
      try {
        const data = await client.restoreBackup(target_id, run_id, {
          destination_target_id,
          drop_first,
        });
        return {
          content: [
            {
              type: "text",
              text: `Restore initiated successfully.\nRestore Run ID: ${data.restore_run_id}\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
