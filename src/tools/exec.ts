import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerExecTools(server: McpServer, client: DeployadoClient) {
  server.tool(
    "deployado_exec",
    "Execute a command inside an app's running container. Timeout is 60 seconds. Returns exit code, stdout, and stderr.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      command: z
        .string()
        .describe("Shell command to execute in the container"),
      working_dir: z
        .string()
        .optional()
        .describe("Working directory inside the container"),
    },
    async ({ app_id, command, working_dir }) => {
      try {
        const data = await client.exec(app_id, command, working_dir);
        const parts = [];
        if (data.stdout) parts.push(`STDOUT:\n${data.stdout}`);
        if (data.stderr) parts.push(`STDERR:\n${data.stderr}`);
        parts.push(`Exit code: ${data.exit_code}`);
        return {
          content: [{ type: "text", text: parts.join("\n\n") }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );
}
