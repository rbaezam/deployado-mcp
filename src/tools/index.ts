import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployadoClient } from "../client.js";
import { registerAppTools } from "./apps.js";
import { registerDeploymentTools } from "./deployments.js";
import { registerEnvTools } from "./env.js";
import { registerServerTools } from "./servers.js";
import { registerProjectTools } from "./projects.js";
import { registerDatabaseTools } from "./databases.js";
import { registerExecTools } from "./exec.js";
import { registerBlueprintTools } from "./blueprints.js";
import { registerAccountTools } from "./account.js";

export function registerAllTools(server: McpServer, client: DeployadoClient) {
  registerAccountTools(server, client);
  registerAppTools(server, client);
  registerDeploymentTools(server, client);
  registerEnvTools(server, client);
  registerServerTools(server, client);
  registerProjectTools(server, client);
  registerDatabaseTools(server, client);
  registerExecTools(server, client);
  registerBlueprintTools(server, client);
}
