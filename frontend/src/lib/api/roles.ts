import type { Role, RoleFormValues, PaginationMeta } from '@/src/types/role';

const API_BASE = process.env.NEXT_PUBLIC_API|| '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.message || json?.data?.message || 'Request failed';
    throw new ApiError(message, res.status);
  }

  return json;
}

export interface ListRolesParams {
  page: number;
  limit: number;
  search?: string;
  companyId?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListRolesResult {
  items: Role[];
  meta: PaginationMeta;
}

export async function listRoles(params: ListRolesParams): Promise<ListRolesResult> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.companyId) qs.set('companyId', params.companyId);
  qs.set('sortBy', params.sortBy || 'createdAt');
  qs.set('sortOrder', params.sortOrder || 'desc');

  const json = await authFetch(`/roles?${qs.toString()}`, { method: 'GET' });
  return {
    items: json.data.data as Role[],
    meta: json.data.meta as PaginationMeta,
  };
}

export async function getRole(id: string): Promise<Role> {
  const json = await authFetch(`/roles/${id}`, { method: 'GET' });
  return json.data.data as Role;
}

export async function createRole(payload: {
  name: string;
  description?: string;
  companyId?: string;
  permissionIds?: string[];
}): Promise<Role> {
  const json = await authFetch('/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return json.data.data as Role;
}

export async function updateRole(
  id: string,
  payload: { name?: string; description?: string; permissionIds?: string[] }
): Promise<Role> {
  const json = await authFetch(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return json.data.data as Role;
}

export async function deleteRole(id: string): Promise<void> {
  await authFetch(`/roles/${id}`, { method: 'DELETE' });
}