import type { CompanyOption } from '@/src/types/company';
import { authFetch } from './http';

export async function listCompanies(token: string | null): Promise<CompanyOption[]> {
  const json = await authFetch('/companies?limit=200&sortBy=name&sortOrder=asc', token, { method: 'GET' });
  return (json.data.data as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }));
}