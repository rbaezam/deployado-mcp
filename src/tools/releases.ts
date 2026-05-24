import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

/**
 * MCP tools for release introspection.
 *
 * Right now this is just `deployado_release_logs` (fetch a build
 * transcript by release UUID), which closes the loop on the
 * doctor / deploy --watch error hints — those point users at
 * `deployado releases logs <id>`, and AI agents looking at a
 * failed deploy should be able to fetch the same data without
 * shelling out.
 *
 * Backed by the cross-app endpoint shipped in H1:
 *   GET /api/v1/releases/:release_id/logs
 */
export function registerReleaseTools(
  server: McpServer,
  client: DeployadoClient,
) {
  server.tool(
    "deployado_release_logs",
    "Fetch the docker build transcript for a release. Works for both in-progress and finished builds. Returns the full logs plus status/timing metadata. Use this when investigating a build failure — the release ID comes from `deployado deploy` output or the `releases` field of an app's deployment.",
    {
      release_id: z
        .string()
        .describe(
          "Release UUID (full id, not the 8-char prefix). Get it from list_releases or from a deployment's release_id field.",
        ),
      tail: z
        .number()
        .optional()
        .describe(
          "Only return the last N lines of build output. Useful for very long transcripts. Omit for the full log.",
        ),
    },
    async ({ release_id, tail }) => {
      try {
        const data = await client.getBuildLogsByRelease(release_id);

        // Trim to the trailing N lines if requested — handy when the
        // AI just wants to see the failure point without dragging
        // 500+ lines of cache-pull output into context.
        let logs = data.logs ?? "";
        if (typeof tail === "number" && tail > 0 && logs.length > 0) {
          const lines = logs.split("\n");
          logs = lines.slice(-tail).join("\n");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: data.status,
                  duration_seconds: data.duration_seconds,
                  started_at: data.started_at,
                  finished_at: data.finished_at,
                  error_message: data.error_message,
                  logs,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (e) {
        return handleApiError(e);
      }
    },
  );
}
