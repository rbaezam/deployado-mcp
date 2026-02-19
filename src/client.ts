import { DeployadoConfig } from "./config.js";
import { DeployadoApiError } from "./errors.js";

export class DeployadoClient {
  constructor(private config: DeployadoConfig) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 30_000,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.config.apiToken}`,
        "User-Agent": "deployado-mcp/1.0",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new DeployadoApiError(
        res.status,
        errorBody as Record<string, unknown>,
      );
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  // ── Account ──

  async getMe() {
    return this.request<{
      account: { id: string; name: string; slug: string };
      user: { id: string; email: string; name: string };
      token: { name: string; last_used_at: string; expires_at: string | null };
    }>("GET", "/api/v1/me");
  }

  // ── Apps ──

  async listApps(projectId?: string) {
    const qs = projectId ? `?project_id=${projectId}` : "";
    return this.request<{ apps: App[] }>("GET", `/api/v1/apps${qs}`);
  }

  async getApp(id: string) {
    return this.request<{ app: App }>("GET", `/api/v1/apps/${id}`);
  }

  async createApp(params: Record<string, unknown>) {
    return this.request<{ app: App }>("POST", "/api/v1/apps", params);
  }

  async updateApp(id: string, params: Record<string, unknown>) {
    return this.request<{ app: App }>("PATCH", `/api/v1/apps/${id}`, params);
  }

  async deleteApp(id: string) {
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/apps/${id}`,
    );
  }

  async deploy(
    appId: string,
    params?: { branch?: string; commit_sha?: string },
  ) {
    return this.request<{
      ok: boolean;
      message: string;
      release_id: string;
    }>("POST", `/api/v1/apps/${appId}/deploy`, params ?? {});
  }

  async rollback(
    appId: string,
    params?: { release_id?: string; version?: string },
  ) {
    return this.request<{
      ok: boolean;
      message: string;
      deployment_id: string;
      release_version: string;
    }>("POST", `/api/v1/apps/${appId}/rollback`, params ?? {});
  }

  async listReleases(appId: string, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return this.request<{ releases: Release[] }>(
      "GET",
      `/api/v1/apps/${appId}/releases${qs}`,
    );
  }

  async getLogs(appId: string, lines?: number, timestamps?: boolean) {
    const params = new URLSearchParams();
    if (lines) params.set("lines", String(lines));
    if (timestamps) params.set("timestamps", "true");
    const qs = params.toString() ? `?${params}` : "";
    return this.request<{ logs: LogEntry[]; message?: string }>(
      "GET",
      `/api/v1/apps/${appId}/logs${qs}`,
    );
  }

  // ── Deployments ──

  async listDeployments(appId: string, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return this.request<{ deployments: Deployment[] }>(
      "GET",
      `/api/v1/apps/${appId}/deployments${qs}`,
    );
  }

  async getDeployment(appId: string, deploymentId: string) {
    return this.request<{ deployment: Deployment }>(
      "GET",
      `/api/v1/apps/${appId}/deployments/${deploymentId}`,
    );
  }

  async getCurrentDeployment(appId: string) {
    return this.request<{ deployment: Deployment }>(
      "GET",
      `/api/v1/apps/${appId}/deployments/current`,
    );
  }

  // ── Environment Variables ──

  async listEnv(appId: string) {
    return this.request<{ env: Record<string, string> }>(
      "GET",
      `/api/v1/apps/${appId}/env`,
    );
  }

  async setEnv(appId: string, env: Record<string, string>) {
    return this.request<{ env: Record<string, string> }>(
      "PUT",
      `/api/v1/apps/${appId}/env`,
      { env },
    );
  }

  async deleteEnv(appId: string, key: string) {
    return this.request<{ ok: boolean }>(
      "DELETE",
      `/api/v1/apps/${appId}/env/${key}`,
    );
  }

  // ── Servers ──

  async listServers() {
    return this.request<{ servers: Server[] }>("GET", "/api/v1/servers");
  }

  async getServer(id: string) {
    return this.request<{ server: Server }>("GET", `/api/v1/servers/${id}`);
  }

  // ── Projects ──

  async listProjects() {
    return this.request<{ projects: Project[] }>("GET", "/api/v1/projects");
  }

  async getProject(id: string) {
    return this.request<{ project: Project }>("GET", `/api/v1/projects/${id}`);
  }

  async createProject(params: {
    name: string;
    description?: string;
    repository_url?: string;
    default_branch?: string;
  }) {
    return this.request<{ project: Project }>(
      "POST",
      "/api/v1/projects",
      params,
    );
  }

  async updateProject(id: string, params: Record<string, unknown>) {
    return this.request<{ project: Project }>(
      "PATCH",
      `/api/v1/projects/${id}`,
      params,
    );
  }

  async deleteProject(id: string) {
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/projects/${id}`,
    );
  }

  // ── Databases ──

  async listDatabases(projectId?: string, status?: string) {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", projectId);
    if (status) params.set("status", status);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<{ databases: Database[] }>(
      "GET",
      `/api/v1/databases${qs}`,
    );
  }

  async getDatabase(id: string) {
    return this.request<{ database: Database }>(
      "GET",
      `/api/v1/databases/${id}`,
    );
  }

  async createDatabase(params: Record<string, unknown>) {
    return this.request<{ database: Database }>(
      "POST",
      "/api/v1/databases",
      params,
    );
  }

  async deleteDatabase(id: string) {
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/databases/${id}`,
    );
  }

  async connectDatabase(
    databaseId: string,
    params: {
      app_id: string;
      env_var_name?: string;
      driver?: string;
      use_ssl?: boolean;
    },
  ) {
    return this.request<{ connection: DatabaseConnection }>(
      "POST",
      `/api/v1/databases/${databaseId}/connect`,
      params,
    );
  }

  async disconnectDatabase(databaseId: string, connectionId: string) {
    return this.request<{ ok: boolean }>(
      "DELETE",
      `/api/v1/databases/${databaseId}/connect/${connectionId}`,
    );
  }

  // ── Exec ──

  async exec(appId: string, command: string, workingDir?: string) {
    const body: Record<string, string> = { command };
    if (workingDir) body.working_dir = workingDir;
    return this.request<{ exit_code: number; stdout: string; stderr: string }>(
      "POST",
      `/api/v1/apps/${appId}/exec`,
      body,
      65_000,
    );
  }

  // ── Blueprints ──

  async validateBlueprint(content: string) {
    return this.request<Record<string, unknown>>(
      "POST",
      "/api/v1/blueprints/validate",
      { content },
    );
  }

  async deployBlueprint(params: Record<string, unknown>) {
    return this.request<Record<string, unknown>>(
      "POST",
      "/api/v1/blueprints/deploy",
      params,
    );
  }

  // ── Domains ──

  async listDomains(appId: string) {
    return this.request<{ domains: AppDomain[]; subdomain: string }>(
      "GET",
      `/api/v1/apps/${appId}/domains`,
    );
  }

  async addDomain(appId: string, hostname: string) {
    return this.request<{ domain: AppDomain }>(
      "POST",
      `/api/v1/apps/${appId}/domains`,
      { hostname },
    );
  }

  async removeDomain(appId: string, domainId: string) {
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/apps/${appId}/domains/${domainId}`,
    );
  }

  async setPrimaryDomain(appId: string, domainId: string) {
    return this.request<{ domain: AppDomain }>(
      "PUT",
      `/api/v1/apps/${appId}/domains/${domainId}/primary`,
    );
  }

  async verifyDomains(appId: string) {
    return this.request<{ results: DomainVerification[] }>(
      "POST",
      `/api/v1/apps/${appId}/domains/verify`,
    );
  }

  // ── Cron Jobs ──

  async listCronJobs(appId: string) {
    return this.request<{ cron_jobs: CronJob[] }>(
      "GET",
      `/api/v1/apps/${appId}/cron`,
    );
  }

  async createCronJob(
    appId: string,
    params: {
      name: string;
      schedule: string;
      command: string;
      enabled?: boolean;
      timezone?: string;
      timeout_seconds?: number;
    },
  ) {
    return this.request<{ cron_job: CronJob }>(
      "POST",
      `/api/v1/apps/${appId}/cron`,
      params,
    );
  }

  async updateCronJob(
    appId: string,
    cronId: string,
    params: Record<string, unknown>,
  ) {
    return this.request<{ cron_job: CronJob }>(
      "PATCH",
      `/api/v1/apps/${appId}/cron/${cronId}`,
      params,
    );
  }

  async deleteCronJob(appId: string, cronId: string) {
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/apps/${appId}/cron/${cronId}`,
    );
  }

  async runCronJob(appId: string, cronId: string) {
    return this.request<{ ok: boolean; message: string; run_id: string }>(
      "POST",
      `/api/v1/apps/${appId}/cron/${cronId}/run`,
    );
  }

  // ── Services ──

  async listServiceTemplates(category?: string) {
    const qs = category ? `?category=${category}` : "";
    return this.request<{ templates: ServiceTemplate[] }>(
      "GET",
      `/api/v1/services/templates${qs}`,
    );
  }

  async listServices(status?: string) {
    const qs = status ? `?status=${status}` : "";
    return this.request<{ services: Service[] }>(
      "GET",
      `/api/v1/services${qs}`,
    );
  }

  async getService(id: string) {
    return this.request<{ service: Service }>("GET", `/api/v1/services/${id}`);
  }

  async installService(params: {
    template_id: string;
    name: string;
    config?: Record<string, unknown>;
    memory_mb?: number;
  }) {
    return this.request<{ service: Service }>(
      "POST",
      "/api/v1/services",
      params,
    );
  }

  async startService(id: string) {
    return this.request<{ ok: boolean; message: string; service: Service }>(
      "POST",
      `/api/v1/services/${id}/start`,
    );
  }

  async stopService(id: string) {
    return this.request<{ ok: boolean; message: string; service: Service }>(
      "POST",
      `/api/v1/services/${id}/stop`,
    );
  }

  async restartService(id: string) {
    return this.request<{ ok: boolean; message: string; service: Service }>(
      "POST",
      `/api/v1/services/${id}/restart`,
    );
  }

  async deleteService(id: string, deleteVolumes?: boolean) {
    const qs = deleteVolumes ? "?delete_volumes=true" : "";
    return this.request<{ ok: boolean; message: string }>(
      "DELETE",
      `/api/v1/services/${id}${qs}`,
    );
  }

  // ── Backups ──

  async listBackupTargets() {
    return this.request<{ targets: BackupTarget[] }>("GET", "/api/v1/backups");
  }

  async createBackupTarget(params: Record<string, unknown>) {
    return this.request<{ target: BackupTarget }>(
      "POST",
      "/api/v1/backups",
      params,
    );
  }

  async getBackupTarget(id: string) {
    return this.request<{ target: BackupTarget; runs: BackupRun[] }>(
      "GET",
      `/api/v1/backups/${id}`,
    );
  }

  async runBackup(id: string) {
    return this.request<{ ok: boolean; message: string; run_id: string }>(
      "POST",
      `/api/v1/backups/${id}/run`,
    );
  }

  async restoreBackup(
    targetId: string,
    runId: string,
    params?: { destination_target_id?: string; drop_first?: boolean },
  ) {
    return this.request<{
      ok: boolean;
      message: string;
      restore_run_id: string;
    }>("POST", `/api/v1/backups/${targetId}/restore/${runId}`, params ?? {});
  }
}

// ── Types ──

export interface App {
  id: string;
  name: string;
  slug: string;
  project_id: string;
  repository_url: string;
  branch: string;
  port: number;
  dockerfile_path: string;
  build_context: string;
  target_server_id: string;
  auto_deploy_enabled: boolean;
}

export interface Release {
  id: string;
  version: string;
  status: string;
  commit_sha: string;
  commit_message: string;
  created_at: string;
  is_current: boolean;
}

export interface Deployment {
  id: string;
  status: string;
  version: string;
  server_name: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string;
  is_current: boolean;
  error: string | null;
  failure_reason: string | null;
  container_id: string | null;
  is_rollback: boolean;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  stream: string;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ip_address: string;
  status: string;
  roles: string[];
  last_heartbeat_at: string;
  metrics: Record<string, number>;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Database {
  id: string;
  name: string;
  db_name: string;
  db_user: string;
  db_host: string;
  db_port: number;
  db_version: string;
  status: string;
  server_id: string;
  server_name: string;
  project_id: string;
  project_name: string;
  connection_count: number;
  connection_url: string;
  backup_enabled: boolean;
  max_connections: number;
  ssl_enabled: boolean;
  error_message: string;
  created_at: string;
}

export interface DatabaseConnection {
  id: string;
  database_id: string;
  database_name: string;
  app_id: string;
  app_name: string;
  env_var_name: string;
  connection_url: string;
}

export interface AppDomain {
  id: string;
  hostname: string;
  status: string;
  is_primary: boolean;
  inserted_at: string;
}

export interface DomainVerification {
  hostname: string;
  status: string;
  expected_value: string;
  current_value: string | null;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  timezone: string;
  timeout_seconds: number;
  last_run_at: string | null;
  next_run_at: string | null;
  inserted_at: string;
}

export interface ServiceTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  docker_image: string;
  default_port: number;
  logo_url: string;
  is_featured: boolean;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  status: string;
  docker_image: string;
  docker_tag: string;
  subdomain: string;
  memory_mb: number;
  error_message: string | null;
  installed_at: string | null;
  inserted_at: string;
}

export interface BackupTarget {
  id: string;
  name: string;
  db_name: string;
  db_user: string;
  db_host: string;
  db_port: number;
  enabled: boolean;
  schedule_daily_at: string;
  retention_keep_last_n: number;
  server_id: string;
  server_name: string | null;
  inserted_at: string;
}

export interface BackupRun {
  id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  size_bytes: number | null;
  error_message: string | null;
  inserted_at: string;
}
