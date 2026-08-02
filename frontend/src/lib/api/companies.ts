import { ApiError } from '@/src/lib/api/assessment-results';
const API_BASE = process.env.NEXT_PUBLIC_API ?? '/api/v1';

interface StatsResponse {
  users: number;
  clients: number;
  candidates: number;
  assessments: number;
  totalAttempts: number;
  completedAttempts: number;
  results: number;
}

export async function getCompanyStats(companyId: string, accessToken: string | null): Promise<StatsResponse> {
  if (!accessToken) throw new ApiError('You must be signed in to do this.', 401);

  const res = await fetch(`${API_BASE}/companies/${companyId}/stats`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    const msg = body?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  // backend response shape: { success, message, data: { message, data } }
  // unwrap to return the inner data payload if present
  return (body?.data && body.data.data) ? body.data.data : body.data;
}

export default { getCompanyStats };
