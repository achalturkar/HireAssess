import type { Permission } from '@/src/types/permission';
import { authFetch } from './http';

export async function listPermissions(token: string | null): Promise<Permission[]> {
  const json = await authFetch('/permissions', token, { method: 'GET' });
  return json.data.data as Permission[];
}