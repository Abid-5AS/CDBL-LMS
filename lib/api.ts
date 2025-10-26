type FetchOptions = RequestInit & { json?: unknown };

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as Record<string, unknown>).error)
        : response.statusText || "Request failed";
    throw new Error(errorMessage);
  }

  return payload as T;
}

export async function fetchJson<T>(input: RequestInfo, init: FetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = init;

  const response = await fetch(input, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  });

  return handleResponse<T>(response);
}

export async function submitApprovalDecision(
  id: string,
  action: "approve" | "reject",
  comment?: string
) {
  return fetchJson<{ ok: boolean; status: string }>(`/api/approvals/${id}/decision`, {
    method: "POST",
    json: { action, comment },
  });
}
