# Deployado MCP Server

MCP server for [Deployado](https://deployado.com) PaaS. Allows AI agents (Claude Code, etc.) to deploy apps, manage databases, view logs, and more.

## Setup

```bash
npm install
npm run build
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DEPLOYADO_API_TOKEN` | Yes | API token from Deployado |
| `DEPLOYADO_BASE_URL` | No | API base URL (default: `https://deployado.com`) |

Create an API token at **Settings > API Tokens** in your Deployado dashboard.

## Register with Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "deployado": {
      "command": "node",
      "args": ["/absolute/path/to/deployado-mcp/dist/index.js"],
      "env": {
        "DEPLOYADO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Then restart Claude Code.

## Available Tools

### Diagnostics (new)
- `deployado_doctor` — Run the full diagnostic checklist on one app (deployment status, latest build, target server, instance count, HTTP probe of primary domain, env vars). Returns structured `{ summary, checks }` with stable status labels (`pass`/`info`/`warn`/`fail`). First stop when triaging a misbehaving app.
- `deployado_release_logs` — Fetch the docker build transcript for a release. Works for in-progress AND finished builds. Use when investigating a build failure — pass the release UUID from `deployado deploy` output or from a deployment's `release_id` field. Supports `tail` to truncate.

### Account
- `deployado_whoami` — Current account and token info

### Apps
- `deployado_list_apps` — List all apps
- `deployado_get_app` — App details
- `deployado_create_app` — Create an app
- `deployado_update_app` — Update app config
- `deployado_delete_app` — Delete an app
- `deployado_deploy` — Trigger deployment
- `deployado_rollback` — Rollback to previous release
- `deployado_list_releases` — Version history
- `deployado_get_logs` — Container logs

### Deployments
- `deployado_list_deployments` — Recent deployments
- `deployado_get_deployment` — Deployment details
- `deployado_current_deployment` — Active deployment

### Environment Variables
- `deployado_list_env` — List env vars
- `deployado_set_env` — Set/update env vars
- `deployado_delete_env` — Delete env var

### Servers
- `deployado_list_servers` — Server status and metrics
- `deployado_get_server` — Server details

### Projects
- `deployado_list_projects` — List projects
- `deployado_get_project` — Project details

### Databases
- `deployado_list_databases` — List PostgreSQL databases
- `deployado_get_database` — Database details with credentials
- `deployado_create_database` — Create database
- `deployado_delete_database` — Delete database
- `deployado_connect_database` — Connect app to database
- `deployado_disconnect_database` — Disconnect app from database

### Exec
- `deployado_exec` — Run command in container

### Blueprints
- `deployado_validate_blueprint` — Validate blueprint YAML
- `deployado_deploy_blueprint` — Deploy from blueprint
