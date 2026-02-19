import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

export function registerDomainTools(
  server: McpServer,
  client: DeployadoClient
) {
  server.tool(
    "deployado_list_domains",
    "List all custom domains for an app, including the auto-generated subdomain.",
    {
      app_id: z.string().describe("App ID (UUID)"),
    },
    async ({ app_id }) => {
      try {
        const data = await client.listDomains(app_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { domains: data.domains, subdomain: data.subdomain },
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

  server.tool(
    "deployado_add_domain",
    "Add a custom domain to an app. You must configure DNS (CNAME or A record) separately.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      hostname: z.string().describe("Domain hostname, e.g. app.example.com"),
    },
    async ({ app_id, hostname }) => {
      try {
        const data = await client.addDomain(app_id, hostname);
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
    "deployado_remove_domain",
    "Remove a custom domain from an app.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      domain_id: z.string().describe("Domain ID (UUID)"),
    },
    async ({ app_id, domain_id }) => {
      try {
        const data = await client.removeDomain(app_id, domain_id);
        return {
          content: [{ type: "text", text: data.message }],
        };
      } catch (e) {
        return handleApiError(e);
      }
    }
  );

  server.tool(
    "deployado_set_primary_domain",
    "Set a domain as the primary domain for an app. The primary domain is used for redirects.",
    {
      app_id: z.string().describe("App ID (UUID)"),
      domain_id: z.string().describe("Domain ID (UUID)"),
    },
    async ({ app_id, domain_id }) => {
      try {
        const data = await client.setPrimaryDomain(app_id, domain_id);
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
    "deployado_verify_domains",
    "Verify DNS configuration for all domains of an app. Returns per-domain verification status.",
    {
      app_id: z.string().describe("App ID (UUID)"),
    },
    async ({ app_id }) => {
      try {
        const data = await client.verifyDomains(app_id);
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
}
