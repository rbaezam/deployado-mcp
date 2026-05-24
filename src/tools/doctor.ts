import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DeployadoClient } from "../client.js";
import { handleApiError } from "../errors.js";

/**
 * MCP-side diagnostic checklist for one app. Ports the CLI's
 * `deployado doctor` checks to TypeScript so AI agents can run the
 * same checks without shelling out to the Go binary. The check
 * surface is intentionally a subset of the CLI's — enough to
 * answer "is this app healthy and if not, why" but not every
 * single check the CLI runs.
 *
 * Returns structured JSON (one entry per check, plus a roll-up
 * summary). Status field uses the same stable string labels as
 * the CLI's `--json` output: "pass" | "info" | "warn" | "fail".
 *
 * Cross-language consistency: if you add or change a check here,
 * also update `deployado-cli/internal/cmd/doctor.go` so the two
 * surfaces don't drift. The CHANGELOG entry for any doctor change
 * should mention both.
 */

type CheckStatus = "pass" | "info" | "warn" | "fail";

interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  hint?: string;
}

export function registerDoctorTools(
  server: McpServer,
  client: DeployadoClient,
) {
  server.tool(
    "deployado_doctor",
    "Run a fixed diagnostic checklist against one app. Returns structured results plus a roll-up: deployment status, latest build, target server health, instance count, HTTP probe of the primary domain, env vars, placement. Use this as the first stop when triaging 'app X is acting weird'. Mirrors the `deployado doctor` CLI command.",
    {
      app_id: z
        .string()
        .describe("App ID (UUID) or slug — same input shape as the CLI"),
      deep: z
        .boolean()
        .optional()
        .describe(
          "Scan more log lines and use a longer HTTP probe timeout (default false). Use sparingly — the HTTP probe with deep=true can take ~10 seconds.",
        ),
    },
    async ({ app_id, deep }) => {
      const results: CheckResult[] = [];

      // App lookup is the gate — if this fails everything else is
      // meaningless. Return a single failed check with exit-code-2
      // semantics in the summary.
      let app;
      try {
        const data = await client.getApp(app_id);
        app = data.app;
      } catch (e) {
        return handleApiError(e);
      }

      results.push({
        name: "App",
        status: "pass",
        message: `${app.name} (branch=${app.branch ?? "?"}, port=${app.port ?? "?"})`,
      });

      results.push(await checkDeployment(client, app.id));
      results.push(await checkLatestBuild(client, app.id));
      results.push(await checkTargetServer(client, app));
      results.push(await checkInstanceCount(client, app.id));
      results.push(await checkPrimaryDomain(client, app.id, deep ?? false));
      results.push(await checkEnvVars(client, app.id));

      const summary = rollup(results);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ app_id, summary, checks: results }, null, 2),
          },
        ],
      };
    },
  );
}

// ---------------------------------------------------------------------------
// Individual checks. Each catches its own errors and returns an "info"-level
// result so the rest of the checklist still runs — diagnostic tools should
// degrade gracefully, not crash on the first transient network blip.
// ---------------------------------------------------------------------------

async function checkDeployment(
  client: DeployadoClient,
  appId: string,
): Promise<CheckResult> {
  try {
    const { deployment } = await client.getCurrentDeployment(appId);
    if (!deployment) {
      return {
        name: "Current deployment",
        status: "fail",
        message: "no current deployment",
        hint: `Trigger one with \`deployado deploy ${appId}\`.`,
      };
    }

    switch (deployment.status) {
      case "healthy":
        return {
          name: "Current deployment",
          status: "pass",
          message: `v${deployment.version} healthy on ${deployment.server_name ?? "?"}`,
        };
      case "degraded":
        return {
          name: "Current deployment",
          status: "warn",
          message: `v${deployment.version} DEGRADED`,
          hint: `Container may have stopped — \`deployado deploy ${appId}\` to restart.`,
        };
      case "failed":
        return {
          name: "Current deployment",
          status: "fail",
          message: `v${deployment.version} FAILED${deployment.error ? `: ${deployment.error}` : ""}`,
          hint: "Check build logs or roll back.",
        };
      default:
        return {
          name: "Current deployment",
          status: "info",
          message: `v${deployment.version} status=${deployment.status}`,
        };
    }
  } catch (e) {
    return {
      name: "Current deployment",
      status: "info",
      message: `couldn't fetch deployment status: ${errMsg(e)}`,
    };
  }
}

async function checkLatestBuild(
  client: DeployadoClient,
  appId: string,
): Promise<CheckResult> {
  try {
    const { releases } = await client.listReleases(appId, 5);
    if (!releases || releases.length === 0) {
      return {
        name: "Latest build",
        status: "warn",
        message: "no releases recorded",
      };
    }
    const latest = releases[0];
    switch (latest.status) {
      case "ready":
        return {
          name: "Latest build",
          status: "pass",
          message: `v${latest.version} ready${latest.is_current ? " (current)" : ""}`,
        };
      case "building":
      case "pending":
        return {
          name: "Latest build",
          status: "info",
          message: `v${latest.version} ${latest.status} (in progress)`,
        };
      case "build_failed":
        return {
          name: "Latest build",
          status: "fail",
          message: `v${latest.version} build_failed`,
          hint: `Inspect with deployado_release_logs(release_id="${latest.id}").`,
        };
      default:
        return {
          name: "Latest build",
          status: "info",
          message: `v${latest.version} status=${latest.status}`,
        };
    }
  } catch (e) {
    return {
      name: "Latest build",
      status: "info",
      message: `couldn't list releases: ${errMsg(e)}`,
    };
  }
}

async function checkTargetServer(
  client: DeployadoClient,
  // Loose typing on purpose — the App interface is broad and the
  // optional fields we read aren't guaranteed.
  app: any,
): Promise<CheckResult> {
  if (!app.target_server_id) {
    return {
      name: "Target server",
      status: "info",
      message: "auto-placement (no pinned server)",
    };
  }

  try {
    const { servers } = await client.listServers();
    const server = (servers ?? []).find((s: any) => s.id === app.target_server_id);
    if (!server) {
      return {
        name: "Target server",
        status: "fail",
        message: `pinned server ${app.target_server_id.slice(0, 8)} not in account's servers`,
        hint: "Re-assign in the dashboard.",
      };
    }
    switch (server.status) {
      case "online":
        return {
          name: "Target server",
          status: "pass",
          message: `${server.name} online (${server.ip_address ?? "?"})`,
        };
      case "offline":
        return {
          name: "Target server",
          status: "fail",
          message: `${server.name} OFFLINE`,
          hint: `Last heartbeat: ${server.last_heartbeat_at ?? "never"}`,
        };
      default:
        return {
          name: "Target server",
          status: "warn",
          message: `${server.name} status=${server.status}`,
        };
    }
  } catch (e) {
    return {
      name: "Target server",
      status: "info",
      message: `couldn't list servers: ${errMsg(e)}`,
    };
  }
}

async function checkInstanceCount(
  client: DeployadoClient,
  appId: string,
): Promise<CheckResult> {
  try {
    const { deployments } = await client.listDeployments(appId, 20);
    let current = 0,
      healthy = 0,
      degraded = 0,
      failed = 0;
    for (const d of deployments ?? []) {
      if (!d.is_current) continue;
      current++;
      if (d.status === "healthy") healthy++;
      else if (d.status === "degraded") degraded++;
      else if (d.status === "failed") failed++;
    }

    if (current === 0) {
      return {
        name: "Instances",
        status: "fail",
        message: "no current deployments — app is not serving traffic",
        hint: `Trigger a deploy with \`deployado deploy ${appId}\`.`,
      };
    }
    if (healthy === current) {
      return {
        name: "Instances",
        status: "pass",
        message: `${healthy}/${current} healthy`,
      };
    }
    if (healthy === 0) {
      return {
        name: "Instances",
        status: "fail",
        message: `0/${current} healthy (${degraded} degraded, ${failed} failed)`,
        hint: "All instances down. Check the target server and recent logs.",
      };
    }
    return {
      name: "Instances",
      status: "warn",
      message: `${healthy}/${current} healthy (degraded: ${degraded}, failed: ${failed})`,
    };
  } catch (e) {
    return {
      name: "Instances",
      status: "info",
      message: `couldn't list deployments: ${errMsg(e)}`,
    };
  }
}

async function checkPrimaryDomain(
  client: DeployadoClient,
  appId: string,
  deep: boolean,
): Promise<CheckResult> {
  try {
    const { domains } = await client.listDomains(appId);
    const primary =
      (domains ?? []).find((d: any) => d.is_primary) ??
      (domains ?? []).find((d: any) => d.status === "verified") ??
      (domains ?? [])[0];

    if (!primary) {
      return {
        name: "HTTP probe",
        status: "info",
        message: "no domains attached — skipping probe",
      };
    }

    const timeoutMs = deep ? 10000 : 3000;
    const url = `https://${primary.hostname}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (resp.status >= 200 && resp.status < 400) {
        return {
          name: "HTTP probe",
          status: "pass",
          message: `${url} → ${resp.status}`,
        };
      }
      if (resp.status >= 500) {
        return {
          name: "HTTP probe",
          status: "fail",
          message: `${url} → ${resp.status} (server error)`,
          hint: "5xx from the edge. Likely a crashed container or misconfigured upstream.",
        };
      }
      return {
        name: "HTTP probe",
        status: "warn",
        message: `${url} → ${resp.status}`,
        hint: "4xx at '/' may be expected (auth gate, missing route).",
      };
    } catch (fetchErr) {
      clearTimeout(timer);
      return {
        name: "HTTP probe",
        status: "fail",
        message: `${url}: ${errMsg(fetchErr)}`,
        hint: "App may be down at the edge. Check the target server and Traefik.",
      };
    }
  } catch (e) {
    return {
      name: "HTTP probe",
      status: "info",
      message: `couldn't list domains: ${errMsg(e)}`,
    };
  }
}

async function checkEnvVars(
  client: DeployadoClient,
  appId: string,
): Promise<CheckResult> {
  try {
    const { env } = await client.listEnv(appId);
    const count = Object.keys(env ?? {}).length;
    if (count === 0) {
      return {
        name: "Environment",
        status: "warn",
        message: "no env vars set",
        hint: "Most apps need at least DATABASE_URL or similar.",
      };
    }
    return {
      name: "Environment",
      status: "info",
      message: `${count} var(s) set`,
    };
  } catch (e) {
    return {
      name: "Environment",
      status: "info",
      message: `couldn't fetch env: ${errMsg(e)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rollup(results: CheckResult[]) {
  let pass = 0,
    info = 0,
    warn = 0,
    fail = 0;
  for (const r of results) {
    if (r.status === "pass") pass++;
    else if (r.status === "info") info++;
    else if (r.status === "warn") warn++;
    else if (r.status === "fail") fail++;
  }
  return { pass, info, warn, fail };
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
