import type { Role, RoleFormValues, PaginationMeta } from '@/src/types/role';
import { authFetch, ApiError } from './http';

export { ApiError };

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

export async function listRoles(token: string | null, params: ListRolesParams): Promise<ListRolesResult> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.companyId) qs.set('companyId', params.companyId);
  qs.set('sortBy', params.sortBy || 'createdAt');
  qs.set('sortOrder', params.sortOrder || 'desc');

  const json = await authFetch(`/roles?${qs.toString()}`, token, { method: 'GET' });
  return {
    items: json.data.data as Role[],
    meta: json.data.meta as PaginationMeta,
  };
}

export async function getRole(token: string | null, id: string): Promise<Role> {
  const json = await authFetch(`/roles/${id}`, token, { method: 'GET' });
  return json.data.data as Role;
}

export async function createRole(
  token: string | null,
  payload: { name: string; description?: string; companyId?: string; permissionIds?: string[] }
): Promise<Role> {
  const json = await authFetch('/roles', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return json.data.data as Role;
}

export async function updateRole(
  token: string | null,
  id: string,
  payload: { name?: string; description?: string; permissionIds?: string[] }
): Promise<Role> {
  const json = await authFetch(`/roles/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return json.data.data as Role;
}

export async function deleteRole(token: string | null, id: string): Promise<void> {
  await authFetch(`/roles/${id}`, token, { method: 'DELETE' });
}