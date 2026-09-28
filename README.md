# deployado-mcp

[Model Context Protocol](https://modelcontextprotocol.io) server for
[Deployado](https://deployado.com). It lets AI agents (Claude Code, Claude
Desktop, Cursor and any other MCP client) deploy and roll back apps, read build
and runtime logs, diagnose broken apps, and manage env vars, databases, domains,
cron jobs, services and backups.

Docs: https://deployado.com/en/docs/mcp

## Requirements

- Node.js 22 or newer (`npx` comes with it). Node 20 reached end of life in April 2026.
- A Deployado API token: **Settings → API Tokens**
  (https://deployado.com/settings/api-tokens). This is separate from the CLI's
  `deployado auth login`.

## Install

### Claude Code

```bash
claude mcp add deployado --scope user --env DEPLOYADO_API_TOKEN=<your-token> -- npx -y deployado-mcp
```

`--scope user` makes it available in every project; drop it to add it only to
the current one. Check it with `claude mcp list`.

### Claude Desktop, Cursor and other clients

Add to the client's MCP configuration (`claude_desktop_config.json`,
`~/.cursor/mcp.json`, …):

```json
{
  "mcpServers": {
    "deployado": {
      "command": "npx",
      "args": ["-y", "deployado-mcp"],
      "env": {
        "DEPLOYADO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Restart the client after editing the file.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DEPLOYADO_API_TOKEN` | Yes | API token from Settings → API Tokens |
| `DEPLOYADO_BASE_URL` | No | API base URL (default `https://deployado.com`) |

`npx deployado-mcp --version` prints the installed version.

## Safety annotations

Every tool declares MCP [tool annotations](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool-annotations):
read-only tools (`list_*`, `get_*`, logs, `doctor`) are marked `readOnlyHint`,
and anything that deletes, overwrites or takes something down (deletes,
rollback, restore, `set_env`, `exec`, stopping a service, …) is marked
`destructiveHint`, so clients can ask for confirmation before running them.

## Tools

### Diagnostics
- `deployado_doctor` — full diagnostic checklist for one app (deployment, latest build, server, instances, HTTP probe, env). Start here when an app misbehaves.

### Account
- `deployado_whoami` — current account, user and token

### Apps
- `deployado_list_apps`, `deployado_get_app`
- `deployado_create_app`, `deployado_update_app`, `deployado_delete_app`
- `deployado_deploy` — trigger a deployment (returns a `release_id`)
- `deployado_rollback` — roll back to a previous release
- `deployado_get_logs` — runtime logs of the running container

### Releases & builds
- `deployado_list_releases`, `deployado_get_release`
- `deployado_get_build_logs`, `deployado_release_logs` — build transcript (in-progress or finished)

### Deployments
- `deployado_list_deployments`, `deployado_get_deployment`, `deployado_current_deployment`

### Environment variables
- `deployado_list_env`, `deployado_set_env`, `deployado_delete_env`

### Servers
- `deployado_list_servers`, `deployado_get_server`

### Projects
- `deployado_list_projects`, `deployado_get_project`
- `deployado_create_project`, `deployado_update_project`, `deployado_delete_project`

### Databases (managed PostgreSQL)
- `deployado_list_databases`, `deployado_get_database`
- `deployado_create_database`, `deployado_delete_database`
- `deployado_connect_database`, `deployado_disconnect_database`

### Exec
- `deployado_exec` — run a command inside an app's container (60 s timeout)

### Blueprints
- `deployado_validate_blueprint`, `deployado_deploy_blueprint`

### Domains
- `deployado_list_domains`, `deployado_add_domain`, `deployado_remove_domain`
- `deployado_set_primary_domain`, `deployado_verify_domains`

### Cron jobs
- `deployado_list_cron_jobs`, `deployado_create_cron_job`, `deployado_update_cron_job`
- `deployado_delete_cron_job`, `deployado_run_cron_job`

### Services (marketplace)
- `deployado_list_service_templates`, `deployado_list_services`, `deployado_get_service`
- `deployado_install_service`, `deployado_start_service`, `deployado_stop_service`, `deployado_restart_service`

### Backups
- `deployado_list_backup_targets`, `deployado_create_backup_target`, `deployado_get_backup_target`
- `deployado_run_backup`, `deployado_restore_backup`

## Prompts and resources

- Prompt `deployado_status` — overview of apps, servers and databases
- Resources `deployado://apps` and `deployado://servers`

## Development

```bash
npm install
npm run build
npm test        # stdio smoke test: handshake, listings, annotations
npm run dev     # run from source with tsx
```

When adding a tool, add its entry to `src/tools/annotations.ts` — `npm test`
(and therefore `npm publish`) fails otherwise.
