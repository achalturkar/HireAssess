const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  "/api/v1";

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const extractApiMessage = (payload: any): string | null => {
  if (payload == null) return null;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) {
    return payload.map((item) => extractApiMessage(item)).filter(Boolean).join(', ');
  }
  if (typeof payload === 'object') {
    if (typeof payload.message === 'string') return payload.message;
    if (payload.message != null) return extractApiMessage(payload.message);
    if (payload.errors != null) return extractApiMessage(payload.errors);
    const stringValues = Object.values(payload).filter((value) => typeof value === 'string');
    if (stringValues.length) return stringValues.join(' ');
    return JSON.stringify(payload);
  }
  return String(payload);
};

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = extractApiMessage(json?.message ?? json) ?? `Request failed (${response.status})`;
    const errors = json?.errors ?? null;
    throw new ApiError(message, response.status, errors);
  }

  return json as T;
}

export const api = apiFetch;