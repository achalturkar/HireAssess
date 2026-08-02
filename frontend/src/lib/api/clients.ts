import type {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ListClientsParams,
  PaginationMeta,
} from "@/src/types/client";

const API_BASE =
  process.env.NEXT_PUBLIC_API ||
  "http://localhost:5000/api/";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Every endpoint on this API wraps its real payload two levels deep:
// { success, message: "Success", data: { message: "...", data: T, meta? } }
// This mirrors the shape used by /auth/login and /companies.
type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

async function request<T>(
  path: string,
  accessToken: string | null | undefined,
  init?: RequestInit
): Promise<T> {
  if (!accessToken) {
    // Calling an authenticated endpoint without a token would otherwise send
    // "Authorization: Bearer undefined" and fail with a confusing 401/403.
    // Fail fast with a clear message instead.
    throw new ApiError("You must be signed in to do this.", 401);
  }

  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    const msgObj = body?.message;
    const message =
      (typeof msgObj === "object" && msgObj?.message) ||
      (typeof msgObj === "string" ? msgObj : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>
) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") {
      qs.set(k, String(v));
    }
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* -------------------------------------------------------------------------- */
/*                                   LIST                                     */
/* -------------------------------------------------------------------------- */

export async function listClients(
  params: ListClientsParams,
  accessToken: string | null
): Promise<{ items: Client[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    includeDeleted: params.includeDeleted,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request<Envelope<Client[]>>(`/clients${query}`, accessToken);

  return {
    items: res.data.data,
    meta: res.data.meta as PaginationMeta,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  GET ONE                                   */
/* -------------------------------------------------------------------------- */

export async function getClient(
  id: string,
  accessToken: string | null
): Promise<Client> {
  const res = await request<Envelope<Client>>(`/clients/${id}`, accessToken);
  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

export async function createClient(
  payload: CreateClientPayload,
  accessToken: string | null
): Promise<Client> {
  const res = await request<Envelope<Client>>("/clients", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                   */
/* -------------------------------------------------------------------------- */

export async function updateClient(
  id: string,
  payload: UpdateClientPayload,
  accessToken: string | null
): Promise<Client> {
  const res = await request<Envelope<Client>>(`/clients/${id}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

export async function deleteClient(
  id: string,
  accessToken: string | null
): Promise<void> {
  await request<ApiResponse<{ message: string }>>(`/clients/${id}`, accessToken, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/*                                  ACTIVATE                                  */
/* -------------------------------------------------------------------------- */

export async function activateClient(
  id: string,
  accessToken: string | null
): Promise<Client> {
  const res = await request<Envelope<Client>>(`/clients/${id}/activate`, accessToken, {
    method: "POST",
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                INACTIVATE                                  */
/* -------------------------------------------------------------------------- */

export async function inactivateClient(
  id: string,
  accessToken: string | null
): Promise<Client> {
  const res = await request<Envelope<Client>>(`/clients/${id}/inactivate`, accessToken, {
    method: "POST",
  });

  return res.data.data;
}

export { ApiError };