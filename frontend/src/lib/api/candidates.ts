import type { Candidate, CandidateOption, CandidateStatus, PaginationMeta } from '@/src/types/candidate';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:5000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Pulls a human-readable string out of whatever shape the backend sent.
 * `message` can arrive as a plain string ("Client not found") or as an
 * object (e.g. { message: "Validation failed", errors: [...] } from the
 * validate middleware). Passing an object straight into `Error()` silently
 * stringifies it to "[object Object]" - this guards against that.
 */
function extractErrorMessage(json: any, status: number): string {
  const raw = json?.message ?? json?.data?.message;

  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message.trim()) {
      return raw.message;
    }
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      const first = raw.errors[0];
      if (typeof first === 'string') return first;
      if (first?.message) return String(first.message);
    }
  }

  return `Request failed (${status})`;
}

// Matches AuthProvider's SESSION_STORAGE_KEY. AuthProvider stores ONE
// JSON blob here — { user, accessToken, refreshToken } — NOT a flat
// "accessToken" key. Reading the wrong shape/key was the root cause of
// the candidate picker silently getting an unauthenticated request:
// whenever a caller forgot to pass accessToken explicitly, this fallback
// found nothing and requests went out with no Authorization header at all.
const SESSION_STORAGE_KEY = 'ha_auth';

function fallbackAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.accessToken === 'string' ? parsed.accessToken : null;
  } catch {
    return null;
  }
}

/**
 * Single request helper used by every function below.
 *
 * accessToken is accepted (for consistency with clients.ts / assessments.ts)
 * but NOT required. If it's missing or hasn't hydrated yet, we fall back to
 * the stored session, and if that's empty too we still send the request -
 * the backend is the source of truth for auth and will return a real 401
 * if the user genuinely isn't authenticated. This avoids a false "you must
 * be signed in" error firing on a render race before AuthProvider has
 * finished loading the token.
 *
 * IMPORTANT: this always returns the FULL envelope
 *   { success, message, data: { message, data: T, meta? } }
 * Callers must unwrap json.data.data (and json.data.meta for lists) -
 * never json.data directly.
 */
async function authFetch(
  path: string,
  accessToken?: string | null,
  init?: RequestInit
) {
  const token = accessToken ?? fallbackAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    throw new ApiError(extractErrorMessage(json, res.status), res.status);
  }

  return json;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export interface ListCandidatesParams {
  page: number;
  limit: number;
  search?: string;
  assessmentId?: string;
  clientId?: string;
  status?: CandidateStatus | '';
  includeDeleted?: boolean;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListCandidatesResult {
  items: Candidate[];
  meta: PaginationMeta;
}

export async function listCandidates(
  params: ListCandidatesParams,
  accessToken?: string | null
): Promise<ListCandidatesResult> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.assessmentId) qs.set('assessmentId', params.assessmentId);
  if (params.clientId) qs.set('clientId', params.clientId);
  if (params.status) qs.set('status', params.status);
  if (params.includeDeleted) qs.set('includeDeleted', 'true');
  qs.set('sortBy', params.sortBy || 'createdAt');
  qs.set('sortOrder', params.sortOrder || 'desc');

  const json = await authFetch(`/candidates?${qs.toString()}`, accessToken, { method: 'GET' });
  return {
    items: json.data.data as Candidate[],
    meta: json.data.meta as PaginationMeta,
  };
}

export async function getCandidate(id: string, accessToken?: string | null): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}`, accessToken, { method: 'GET' });
  return json.data.data as Candidate;
}

export interface CandidatePayload {
  assessmentId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export async function createCandidate(
  payload: CandidatePayload,
  accessToken?: string | null
): Promise<Candidate> {
  const json = await authFetch('/candidates', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return json.data.data as Candidate;
}

export async function updateCandidate(
  id: string,
  payload: Partial<Pick<CandidatePayload, 'firstName' | 'lastName' | 'email' | 'phone'>>,
  accessToken?: string | null
): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return json.data.data as Candidate;
}

export async function deleteCandidate(id: string, accessToken?: string | null): Promise<void> {
  await authFetch(`/candidates/${id}`, accessToken, { method: 'DELETE' });
}

export async function startCandidate(id: string, accessToken?: string | null): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}/start`, accessToken, { method: 'POST' });
  return json.data.data as Candidate;
}

export async function completeCandidate(id: string, accessToken?: string | null): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}/complete`, accessToken, { method: 'POST' });
  return json.data.data as Candidate;
}

export async function expireCandidate(id: string, accessToken?: string | null): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}/expire`, accessToken, { method: 'POST' });
  return json.data.data as Candidate;
}

export async function withdrawCandidate(id: string, accessToken?: string | null): Promise<Candidate> {
  const json = await authFetch(`/candidates/${id}/withdraw`, accessToken, { method: 'POST' });
  return json.data.data as Candidate;
}

/**
 * Search candidates for the picker (CandidatePicker / CreateInvitationModal).
 *
 * FIXED: previously used a separate, simpler request() helper that
 * returned the raw envelope and treated `res.data` as the array. The
 * actual envelope is double-nested — `res.data` is `{ message, data, meta }`,
 * not the array itself — so the picker was getting handed an object
 * instead of a list and crashing on `.map()`. Now goes through the same
 * authFetch() as every other function here, and correctly unwraps
 * `json.data.data`.
 */
export interface SearchCandidatesParams {
  search?: string;
  limit?: number;
  clientId?: string;
}

export async function searchCandidates(
  params: SearchCandidatesParams,
  accessToken?: string | null
): Promise<CandidateOption[]> {
  const query = buildQuery({
    search: params.search,
    limit: params.limit ?? 20,
    clientId: params.clientId,
  });

  const json = await authFetch(`/candidates${query}`, accessToken, { method: 'GET' });
  return (json.data.data as Candidate[]).map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    status: c.status,
    // The list endpoint doesn't currently join client details (see
    // candidate.repository.js `list()` — no `include: { client: true }`),
    // so this will be undefined until that's added. CandidatePicker
    // already handles a missing client gracefully (optional chaining),
    // it just won't show the company name under each result yet.
    client: (c as any).client ?? null,
  }));
}