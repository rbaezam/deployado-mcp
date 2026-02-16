export class DeployadoApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>
  ) {
    const msg =
      (body?.message as string) ||
      (body?.error as string) ||
      `HTTP ${status}`;
    super(msg);
    this.name = "DeployadoApiError";
  }
}

export function handleApiError(e: unknown) {
  if (e instanceof DeployadoApiError) {
    if (e.status === 401) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Authentication failed. Check your DEPLOYADO_API_TOKEN environment variable.\nError: ${e.message}`,
          },
        ],
        isError: true,
      };
    }
    const details = e.body?.details
      ? `\nDetails: ${JSON.stringify(e.body.details, null, 2)}`
      : "";
    return {
      content: [
        {
          type: "text" as const,
          text: `API Error (${e.status}): ${e.message}${details}`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      },
    ],
    isError: true,
  };
}
