import { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";
import { annotationsFor } from "./annotations.js";
import { registerAppTools } from "./apps.js";
import { registerDeploymentTools } from "./deployments.js";
import { registerEnvTools } from "./env.js";
import { registerServerTools } from "./servers.js";
import { registerProjectTools } from "./projects.js";
import { registerDatabaseTools } from "./databases.js";
import { registerExecTools } from "./exec.js";
import { registerBlueprintTools } from "./blueprints.js";
import { registerAccountTools } from "./account.js";
import { registerDomainTools } from "./domains.js";
import { registerCronTools } from "./cron.js";
import { registerServiceTools } from "./services.js";
import { registerBackupTools } from "./backups.js";
import { registerDoctorTools } from "./doctor.js";
import { registerReleaseTools } from "./releases.js";

export function registerAllTools(server: McpServer, client: DeployadoClient) {
  // Capture every registered tool so the safety annotations live in one
  // table (annotations.ts) instead of being repeated in each file.
  const registered: Array<[string, RegisteredTool]> = [];
  const originalTool = server.tool.bind(server) as (...args: unknown[]) => RegisteredTool;
  server.tool = ((...args: unknown[]) => {
    const tool = originalTool(...args);
    registered.push([args[0] as string, tool]);
    return tool;
  }) as McpServer["tool"];

  registerTools(server, client);

  server.tool = originalTool as McpServer["tool"];
  for (const [name, tool] of registered) {
    const annotations = annotationsFor(name);
    if (annotations) tool.update({ annotations });
  }
}

function registerTools(server: McpServer, client: DeployadoClient) {
  registerAccountTools(server, client);
  registerAppTools(server, client);
  registerDeploymentTools(server, client);
  registerEnvTools(server, client);
  registerServerTools(server, client);
  registerProjectTools(server, client);
  registerDatabaseTools(server, client);
  registerExecTools(server, client);
  registerBlueprintTools(server, client);
  registerDomainTools(server, client);
  registerCronTools(server, client);
  registerServiceTools(server, client);
  registerBackupTools(server, client);
  registerDoctorTools(server, client);
  registerReleaseTools(server, client);
}
