#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { DeployadoClient } from "./client.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import { VERSION } from "./version.js";

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  console.log(VERSION);
  process.exit(0);
}

let config;
try {
  config = loadConfig();
} catch (e) {
  // stderr is what MCP clients show when a server fails to start — keep it
  // to the actionable message, not a stack trace.
  console.error(`deployado-mcp: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
const client = new DeployadoClient(config);

const server = new McpServer({
  name: "deployado",
  version: VERSION,
});

registerAllTools(server, client);
registerAllResources(server, client);
registerAllPrompts(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`Deployado MCP server ${VERSION} started`);
