// Smoke test for the built server (dist/). Talks MCP over stdio exactly like a
// client would — no network: tools/list, prompts/list and resources/list never
// call the Deployado API. Run via `npm test` (also gates `npm publish`).
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const ENTRY = new URL("../dist/index.js", import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

// 1. --version
const v = spawnSync(process.execPath, [ENTRY, "--version"], { encoding: "utf8" });
assert.equal(v.stdout.trim(), version, "--version must print package.json version");

// 2. Missing token: exit 1 with an actionable one-liner, no stack trace
const noToken = spawnSync(process.execPath, [ENTRY], {
  encoding: "utf8",
  env: { ...process.env, DEPLOYADO_API_TOKEN: "" },
  input: "",
});
assert.equal(noToken.status, 1, "must exit 1 without DEPLOYADO_API_TOKEN");
assert.match(noToken.stderr, /DEPLOYADO_API_TOKEN/);
assert.doesNotMatch(noToken.stderr, /\n\s+at /, "no stack trace on missing token");

// 3. MCP handshake + listings
const child = spawn(process.execPath, [ENTRY], {
  env: { ...process.env, DEPLOYADO_API_TOKEN: "smoke-test", DEPLOYADO_BASE_URL: "http://127.0.0.1:9" },
  stdio: ["pipe", "pipe", "inherit"],
});

const pending = new Map();
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf("\n")) >= 0) {
    const msg = JSON.parse(buffer.slice(0, i));
    buffer = buffer.slice(i + 1);
    pending.get(msg.id)?.(msg);
  }
});

let nextId = 1;
const request = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error(`timeout: ${method}`)), 10_000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result);
    });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });

try {
  const init = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0" },
  });
  assert.equal(init.serverInfo.version, version);
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const { tools } = await request("tools/list");
  assert.ok(tools.length > 0, "no tools registered");

  const unannotated = tools.filter(
    (t) => !t.annotations?.title || typeof t.annotations.readOnlyHint !== "boolean",
  );
  assert.deepEqual(
    unannotated.map((t) => t.name),
    [],
    "every tool needs an entry in src/tools/annotations.ts",
  );

  for (const t of tools) {
    if (/_(delete|remove|restore)_/.test(t.name) || t.name.endsWith("_rollback")) {
      assert.equal(t.annotations.destructiveHint, true, `${t.name} must be destructive`);
    }
    if (/_(list|get)_/.test(t.name)) {
      assert.equal(t.annotations.readOnlyHint, true, `${t.name} must be read-only`);
    }
  }

  const { prompts } = await request("prompts/list");
  const { resources } = await request("resources/list");

  const readOnly = tools.filter((t) => t.annotations.readOnlyHint).length;
  const destructive = tools.filter((t) => t.annotations.destructiveHint).length;
  console.log(
    `ok — v${version}: ${tools.length} tools (${readOnly} read-only, ${destructive} destructive), ` +
      `${prompts.length} prompts, ${resources.length} resources`,
  );
} finally {
  child.kill();
}
