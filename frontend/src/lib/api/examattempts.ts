import type {
  ExamAttempt,
  ListAttemptsParams,
  PaginationMeta,
} from '@/src/types/examattempt';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
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

// Same double-wrapped envelope as every other module here:
// { success, message: "Success", data: { message: "...", data: T, meta? } }
type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

/**
 * Pulls a human-readable string out of whatever shape the backend sent.
 * Never let an object reach `Error()` directly - it silently
 * stringifies to "[object Object]".
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

/**
 * Admin-facing request helper - requires accessToken (falls back to
 * localStorage rather than hard-throwing on a render race, same as
 * the other modules).
 */
async function request<T>(
  path: string,
  accessToken: string | null | undefined,
  init?: RequestInit
): Promise<T> {
  const token =
    accessToken ??
    (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

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
 * Public request helper for the candidate-facing token routes - the
 * invitation token itself is the credential, no session required.
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

export async function listAttempts(
  params: ListAttemptsParams,
  accessToken: string | null
): Promise<{ items: ExamAttempt[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    candidateId: params.candidateId,
    assessmentId: params.assessmentId,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request<Envelope<ExamAttempt[]>>(`/exam-attempts${query}`, accessToken);

  return {
    items: res.data.data,
    meta: res.data.meta as PaginationMeta,
  };
}

export async function getAttempt(
  id: string,
  accessToken: string | null
): Promise<ExamAttempt> {
  const res = await request<Envelope<ExamAttempt>>(`/exam-attempts/${id}`, accessToken);
  return res.data.data;
}

export async function expireAttempt(
  id: string,
  accessToken: string | null
): Promise<ExamAttempt> {
  const res = await request<Envelope<ExamAttempt>>(`/exam-attempts/${id}/expire`, accessToken, {
    method: 'POST',
  });
  return res.data.data;
}

/* ------------------------------------------------------------------ */
/*  Public — token is the credential, no session required              */
/* ------------------------------------------------------------------ */

/**
 * Idempotent: safe to call every time the candidate lands on the exam
 * page. Returns the SAME selectedQuestions on every call for the same
 * candidate - it does not re-randomize.
 */
export async function startAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await publicRequest<Envelope<ExamAttempt>>(
    `/exam-attempts/token/${token}/start`,
    { method: 'POST' }
  );
  return res.data.data;
}

/**
 * Read-only rehydrate on page refresh - does NOT create an attempt.
 * Call startAttemptByToken first if this 404s.
 */
export async function getAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await publicRequest<Envelope<ExamAttempt>>(`/exam-attempts/token/${token}`);
  return res.data.data;
}

export async function submitAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await publicRequest<Envelope<ExamAttempt>>(
    `/exam-attempts/token/${token}/submit`,
    { method: 'POST' }
  );
  return res.data.data;
}