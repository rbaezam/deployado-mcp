#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { DeployadoClient } from "./client.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";

const config = loadConfig();
const client = new DeployadoClient(config);

const server = new McpServer({
  name: "deployado",
  version: "1.0.0",
});

registerAllTools(server, client);
registerAllResources(server, client);
registerAllPrompts(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Deployado MCP server started");
