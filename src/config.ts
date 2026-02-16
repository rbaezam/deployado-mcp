export interface DeployadoConfig {
  apiToken: string;
  baseUrl: string;
}

export function loadConfig(): DeployadoConfig {
  const apiToken = process.env.DEPLOYADO_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "DEPLOYADO_API_TOKEN environment variable is required. " +
        "Create an API token at https://deployado.com/settings/api-tokens"
    );
  }
  return {
    apiToken,
    baseUrl: (process.env.DEPLOYADO_BASE_URL || "https://deployado.com").replace(
      /\/$/,
      ""
    ),
  };
}
