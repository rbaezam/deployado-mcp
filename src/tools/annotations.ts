import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

// Safety hints MCP clients use to decide what needs confirmation. The spec's
// defaults are the pessimistic ones (destructive, non-idempotent, open-world),
// so every tool is classified explicitly — `npm test` fails when a tool is
// registered without an entry here.
//
// read        — only reads Deployado state
// write       — additive change (creates something new, triggers a run)
// idempotent  — change that converges: repeating it leaves the same state
// destructive — deletes, overwrites or takes something down
type Kind = "read" | "write" | "idempotent" | "destructive";

const TOOLS: Record<string, [title: string, kind: Kind, openWorld?: true]> = {
  // Account
  deployado_whoami: ["Who am I", "read"],

  // Apps
  deployado_list_apps: ["List apps", "read"],
  deployado_get_app: ["Get app", "read"],
  deployado_create_app: ["Create app", "write"],
  deployado_update_app: ["Update app settings", "destructive"],
  deployado_delete_app: ["Delete app", "destructive"],
  deployado_deploy: ["Deploy app", "write"],
  deployado_rollback: ["Roll back app", "destructive"],
  deployado_get_logs: ["Get runtime logs", "read"],

  // Releases & builds
  deployado_list_releases: ["List releases", "read"],
  deployado_get_release: ["Get release", "read"],
  deployado_get_build_logs: ["Get build logs", "read"],
  deployado_release_logs: ["Get build transcript", "read"],

  // Deployments
  deployado_list_deployments: ["List deployments", "read"],
  deployado_get_deployment: ["Get deployment", "read"],
  deployado_current_deployment: ["Get current deployment", "read"],

  // Environment variables
  deployado_list_env: ["List environment variables", "read"],
  deployado_set_env: ["Set environment variables", "destructive"],
  deployado_delete_env: ["Delete environment variable", "destructive"],

  // Servers
  deployado_list_servers: ["List servers", "read"],
  deployado_get_server: ["Get server", "read"],

  // Projects
  deployado_list_projects: ["List projects", "read"],
  deployado_get_project: ["Get project", "read"],
  deployado_create_project: ["Create project", "write"],
  deployado_update_project: ["Update project", "destructive"],
  deployado_delete_project: ["Delete project", "destructive"],

  // Databases
  deployado_list_databases: ["List databases", "read"],
  deployado_get_database: ["Get database", "read"],
  deployado_create_database: ["Create database", "write"],
  deployado_delete_database: ["Delete database", "destructive"],
  deployado_connect_database: ["Connect database to app", "idempotent"],
  deployado_disconnect_database: ["Disconnect database from app", "destructive"],

  // Exec — an arbitrary command can do anything
  deployado_exec: ["Run command in app container", "destructive", true],

  // Blueprints
  deployado_validate_blueprint: ["Validate blueprint", "read"],
  deployado_deploy_blueprint: ["Deploy blueprint", "destructive", true],

  // Domains
  deployado_list_domains: ["List domains", "read"],
  deployado_add_domain: ["Add domain", "idempotent"],
  deployado_remove_domain: ["Remove domain", "destructive"],
  deployado_set_primary_domain: ["Set primary domain", "idempotent"],
  // Records the verification result, so not strictly read-only.
  deployado_verify_domains: ["Verify domain DNS", "idempotent", true],

  // Cron jobs
  deployado_list_cron_jobs: ["List cron jobs", "read"],
  deployado_create_cron_job: ["Create cron job", "write"],
  deployado_update_cron_job: ["Update cron job", "destructive"],
  deployado_delete_cron_job: ["Delete cron job", "destructive"],
  deployado_run_cron_job: ["Run cron job now", "write"],

  // Services
  deployado_list_service_templates: ["List service templates", "read"],
  deployado_list_services: ["List services", "read"],
  deployado_get_service: ["Get service", "read"],
  deployado_install_service: ["Install service", "write"],
  deployado_start_service: ["Start service", "idempotent"],
  deployado_stop_service: ["Stop service", "destructive"],
  deployado_restart_service: ["Restart service", "write"],

  // Backups
  deployado_list_backup_targets: ["List backup targets", "read"],
  deployado_create_backup_target: ["Create backup target", "write"],
  deployado_get_backup_target: ["Get backup target", "read"],
  deployado_run_backup: ["Run backup now", "write"],
  deployado_restore_backup: ["Restore database from backup", "destructive"],

  // Diagnostics
  deployado_doctor: ["Diagnose app", "read"],
};

export function annotationsFor(name: string): ToolAnnotations | undefined {
  const entry = TOOLS[name];
  if (!entry) return undefined;
  const [title, kind, openWorld] = entry;

  return {
    title,
    readOnlyHint: kind === "read",
    destructiveHint: kind === "destructive",
    idempotentHint: kind === "read" || kind === "idempotent",
    openWorldHint: openWorld ?? false,
  };
}
