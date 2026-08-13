// services/role.service.ts
//
// Thin wrapper around the /roles, /permissions and /companies endpoints.
// Named to mirror the backend's role.service.js. Assumes cookie-based auth
// (credentials: 'include') — swap for a bearer header here if your app uses
// one; every call in this feature goes through this one function so there's
// a single place to change it.

import type { Role, RolePermissionRef, RoleFormValues, PaginationMeta, CompanyRef } from '@/src/types/role';

const API_BASE = process.env.NEXT_PUBLIC_API ?? '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Request-shape type, not a data model — kept local to the service rather
// than in types/role.ts alongside your DTOs.
export interface RoleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RoleListResult {
  items: Role[];
  meta: PaginationMeta;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body;
}

function buildQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// export async function listRoles(query: RoleListQuery): Promise<RoleListResult> {
//   const res = await request<{ data: Role[]; meta: PaginationMeta }>(`/roles${buildQuery(query)}`);
//   return { items: res.data, meta: res.meta };
// }

export async function getRole(id: string): Promise<Role> {
  const res = await request<{ data: Role }>(`/roles/${id}`);
  return res.data;
}

export async function createRole(payload: RoleFormValues): Promise<Role> {
  const res = await request<{ data: Role }>(`/roles`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateRole(
  id: string,
  payload: Partial<Omit<RoleFormValues, 'companyId'>>
): Promise<Role> {
  const res = await request<{ data: Role }>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteRole(id: string): Promise<void> {
  await request<{ message: string }>(`/roles/${id}`, { method: 'DELETE' });
}

// Assumption: a simple, unpaginated list endpoint for the permission catalog,
// mirroring permission.repository.js#listPermissions. Adjust the path/shape
// if your API differs.
export async function listPermissions(): Promise<RolePermissionRef[]> {
  const res = await request<{ data: RolePermissionRef[] }>(`/permissions`);
  return res.data;
}

// Assumption: only reachable/used for super admins, to populate the company
// filter + the "create role in company X" picker.
export async function listCompanies(): Promise<CompanyRef[]> {
  const res = await request<{ data: CompanyRef[] }>(`/companies?limit=200`);
  return res.data;
}