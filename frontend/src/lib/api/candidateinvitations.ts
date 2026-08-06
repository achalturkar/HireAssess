import type {
  CandidateInvitation,
  CreateInvitationPayload,
  ResendInvitationPayload,
  ListInvitationsParams,
  PaginationMeta,
} from '@/src/types/candidateinvitation';

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Same double-wrapped envelope as /clients, /assessments, /candidates:
// { success, message: "Success", data: { message: "...", data: T, meta? } }
type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

/**
 * Pulls a human-readable string out of whatever shape the backend sent -
 * `message` can be a plain string or an object (Joi validation errors
 * from the `validate` middleware). Never let an object reach `Error()`
 * directly, it silently stringifies to "[object Object]".
 */
function extractErrorMessage(body: any, status: number): string {
  const raw = body?.message;

  if (typeof raw === 'string' && raw.trim()) return raw;

  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message.trim()) return raw.message;
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      const first = raw.errors[0];
      if (typeof first === 'string') return first;
      if (first?.message) return String(first.message);
      if (first?.msg) return String(first.msg);
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
 * Admin-facing request helper - takes accessToken like clients.ts /
 * candidates.ts do. Falls back to the stored session rather than
 * hard-throwing if the token hasn't hydrated into context yet, so a
 * render race never produces a false "you must be signed in".
 */
async function request<T>(
  path: string,
  accessToken: string | null | undefined,
  init?: RequestInit
): Promise<T> {
  const token = accessToken ?? fallbackAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    throw new ApiError(extractErrorMessage(body, res.status), res.status);
  }

  return body as T;
}

/**
 * Public request helper for the candidate-facing token routes
 * (/token/:token, /token/:token/start, /token/:token/complete) -
 * intentionally unauthenticated, the token itself is the credential.
 */
async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    throw new ApiError(extractErrorMessage(body, res.status), res.status);
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

/* ------------------------------------------------------------------ */
/*  Admin — authenticated, company-scoped                              */
/* ------------------------------------------------------------------ */

export async function listInvitations(
  params: ListInvitationsParams,
  accessToken: string | null
): Promise<{ items: CandidateInvitation[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    candidateId: params.candidateId,
    candidateName: params.candidateName,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // CONFIRMED via runtime 404: router is mounted as `/candidate-invitation`
  // (singular, not plural like /clients or /candidates) — every
  // path below was previously missing the trailing "s" and 404ing.
  const res = await request<Envelope<CandidateInvitation[]>>(
    `/candidate-invitation${query}`,
    accessToken
  );

  // Envelope is double-wrapped: res.data is { message, data, meta },
  // NOT the array itself - the array is res.data.data.
  return {
    items: res.data.data,
    meta: res.data.meta as PaginationMeta,
  };
}

export async function getInvitation(
  id: string,
  accessToken: string | null
): Promise<CandidateInvitation> {
  const res = await request<Envelope<CandidateInvitation>>(
    `/candidate-invitation/${id}`,
    accessToken
  );
  return res.data.data;
}

export async function createInvitation(
  payload: CreateInvitationPayload,
  accessToken: string | null
): Promise<CandidateInvitation> {
  const res = await request<Envelope<CandidateInvitation>>('/candidate-invitation', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data.data;
}

export async function resendInvitation(
  id: string,
  payload: ResendInvitationPayload = {},
  accessToken: string | null
): Promise<CandidateInvitation> {
  const res = await request<Envelope<CandidateInvitation>>(
    `/candidate-invitation/${id}/resend`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return res.data.data;
}

export async function expireInvitation(
  id: string,
  accessToken: string | null
): Promise<CandidateInvitation> {
  const res = await request<Envelope<CandidateInvitation>>(
    `/candidate-invitation/${id}/expire`,
    accessToken,
    { method: 'POST' }
  );
  return res.data.data;
}

/* ------------------------------------------------------------------ */
/*  Public — token is the credential, no session required              */
/* ------------------------------------------------------------------ */

export async function getInvitationByToken(token: string): Promise<CandidateInvitation> {
  const res = await publicRequest<Envelope<CandidateInvitation>>(
    `/candidate-invitation/token/${token}`
  );
  return res.data.data;
}

export async function startInvitationByToken(token: string): Promise<CandidateInvitation> {
  const res = await publicRequest<Envelope<CandidateInvitation>>(
    `/candidate-invitation/token/${token}/start`,
    { method: 'POST' }
  );
  return res.data.data;
}

export async function completeInvitationByToken(token: string): Promise<CandidateInvitation> {
  const res = await publicRequest<Envelope<CandidateInvitation>>(
    `/candidate-invitation/token/${token}/complete`,
    { method: 'POST' }
  );
  return res.data.data;
}