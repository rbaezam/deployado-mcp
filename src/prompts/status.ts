import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";

export function registerStatusPrompt(
  server: McpServer,
  client: DeployadoClient
) {
  server.prompt(
    "deployado_status",
    "Get a full overview of your Deployado infrastructure — apps, servers, and databases.",
    async () => {
      const sections: string[] = [];

      try {
        const me = await client.getMe();
        sections.push(
          `## Account\n- Name: ${me.account.name}\n- Slug: ${me.account.slug}\n- User: ${me.user.name} (${me.user.email})`
        );
      } catch {
        sections.push("## Account\n- Failed to fetch account info");
      }

      try {
        const { servers } = await client.listServers();
        const lines = servers.map(
          (s) =>
            `- **${s.name}** (${s.status}) — CPU: ${s.metrics?.cpu_percent ?? "?"}%, Mem: ${s.metrics?.memory_percent ?? "?"}%`
        );
        sections.push(`## Servers (${servers.length})\n${lines.join("\n")}`);
      } catch {
        sections.push("## Servers\n- Failed to fetch");
      }

      try {
        const { projects } = await client.listProjects();
        const lines = projects.map((p) => `- **${p.name}** (${p.slug})`);
        sections.push(`## Projects (${projects.length})\n${lines.join("\n")}`);
      } catch {
        sections.push("## Projects\n- Failed to fetch");
      }

      try {
        const { apps } = await client.listApps();
        const lines = apps.map(
          (a) => `- **${a.name}** (${a.slug}) — port ${a.port}, branch: ${a.branch}`
        );
        sections.push(`## Apps (${apps.length})\n${lines.join("\n")}`);
      } catch {
        sections.push("## Apps\n- Failed to fetch");
      }

      try {
        const { databases } = await client.listDatabases();
        const lines = databases.map(
          (d) =>
            `- **${d.name}** (${d.status}) — ${d.db_name}@${d.db_host}:${d.db_port}`
        );
        sections.push(
          `## Databases (${databases.length})\n${lines.join("\n")}`
        );
      } catch {
        sections.push("## Databases\n- Failed to fetch");
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Here is the current status of my Deployado infrastructure:\n\n${sections.join("\n\n")}`,
            },
          },
        ],
      };
    }
  );
}
