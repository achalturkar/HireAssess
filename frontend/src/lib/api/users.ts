import type {
  User,
  RoleRef,
  CompanyRef,
  CreateUserPayload,
  UpdateUserPayload,
  ListUsersParams,
  PaginationMeta,
} from '@/src/types/user';

// Adjust if your app proxies API calls differently (e.g. through Next.js rewrites).
const API_BASE = process.env.NEXT_PUBLIC_API ?? '/api/v1';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function listUsers(
  params: ListUsersParams,
): Promise<{ items: User[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    companyId: params.companyId,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  const res = await request<{ data: User[]; meta: PaginationMeta }>(`/users${query}`);
  return { items: res.data, meta: res.meta };
}

export async function getUser(id: string): Promise<User> {
  const res = await request<{ data: User }>(`/users/${id}`);
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await request<{ data: User }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const res = await request<{ data: User }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await request<{ message: string }>(`/users/${id}`, { method: 'DELETE' });
}

// Lightweight lookups for the create/edit form. Adjust the response shape
// (`res.data`) if your /roles and /companies endpoints differ.
export async function listRoles(companyId?: string): Promise<RoleRef[]> {
  const query = buildQuery({ companyId, limit: 100 });
  const res = await request<{ data: RoleRef[] }>(`/roles${query}`);
  return res.data;
}

export async function listCompanies(search?: string): Promise<CompanyRef[]> {
  const query = buildQuery({ search, limit: 50 });
  const res = await request<{ data: CompanyRef[] }>(`/companies${query}`);
  return res.data;
}

export { ApiError };