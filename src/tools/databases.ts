import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerDatabaseTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_databases",
    "List all managed PostgreSQL databases. Optionally filter by project or status.",
    {
      project_id: z.string().optional().describe("Filter by project ID"),
      status: z
        .string()
        .optional()
        .describe("Filter by status (initializing, ready, failed, deleting)"),
    },
    async ({ project_id, status }) => {
      try {
        const data = await client.listDatabases(project_id, status);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.databases, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_get_database",
    "Get detailed information about a database, including connection URL and credentials.",
    {
      database_id: z.string().describe("Database ID (UUID)"),
    },
    async ({ database_id }) => {
      try {
        const data = await client.getDatabase(database_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.database, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_create_database",
    "Create a new managed PostgreSQL database. The database name will be auto-prefixed with your account slug.",
    {
      name: z.string().describe("Database display name"),
      project_id: z.string().optional().describe("Project ID to associate with"),
      server_id: z.string().optional().describe("Specific database server ID (uses default if omitted)"),
    },
    async (params) => {
      try {
        const data = await client.createDatabase(params);
        return {
          content: [
            { type: "text", text: JSON.stringify(data.database, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_delete_database",
    "Permanently delete a managed PostgreSQL database. This will drop the database and remove all data. This action cannot be undone.",
    {
      database_id: z.string().describe("Database ID (UUID)"),
    },
    async ({ database_id }) => {
      try {
        const data = await client.deleteDatabase(database_id);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_connect_database",
    "Connect an app to a database. This injects the connection URL as an environment variable into the app.",
    {
      database_id: z.string().describe("Database ID (UUID)"),
      app_id: z.string().describe("App ID (UUID) to connect"),
      env_var_name: z
        .string()
        .optional()
        .describe("Environment variable name for the connection URL (default: DATABASE_URL)"),
      driver: z.string().optional().describe("Database driver (default: postgres)"),
      use_ssl: z.boolean().optional().describe("Use SSL for connection"),
    },
    async ({ database_id, app_id, env_var_name, driver, use_ssl }) => {
      try {
        const data = await client.connectDatabase(database_id, {
          app_id,
          env_var_name,
          driver,
          use_ssl,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(data.connection, null, 2) },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_disconnect_database",
    "Disconnect an app from a database, removing the injected environment variable.",
    {
      database_id: z.string().describe("Database ID (UUID)"),
      connection_id: z.string().describe("Connection ID (UUID)"),
    },
    async ({ database_id, connection_id }) => {
      try {
        await client.disconnectDatabase(database_id, connection_id);
        return {
          content: [{ type: "text", text: "Database disconnected successfully." }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
