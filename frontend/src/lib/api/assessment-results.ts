import type {
  AssessmentResult,
  CandidateResultBundle,
  ListResultsParams,
  PaginationMeta,
} from '@/src/types/assessment-result';



const API_BASE = process.env.NEXT_PUBLIC_API ?? '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// The backend wraps every response twice: the outer envelope from your
// response util, and — because each controller also passes its own
// { message, data } object into success() — a second layer inside `data`.
// Real shape: { success, message: "Success", data: { message, data: T, meta? } }
type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

/**
 * Guarantees a real string comes out the other end, whatever shape the
 * backend's `message` field is in: a plain string, a nested { message }
 * object, or an express-validator-style { errors: [...] } array. This is
 * the fix for the "[object Object]" bug — `new Error(x)` (and therefore
 * `new ApiError(x, status)`, since it extends Error) silently coerces a
 * non-string `x` via String(x), and String({}) is literally the text
 * "[object Object]". Every call site below must pass this function's
 * return value into `new ApiError(...)`, never `body.message` directly.
 */
function extractErrorMessage(body: any, status: number): string {
  const raw = body?.message;

  if (typeof raw === 'string' && raw.trim()) return raw;

  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message.trim()) return raw.message;
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      const first = raw.errors[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return String(first.msg);
      if (first?.message) return String(first.message);
    }
  }

  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    if (typeof first === 'string') return first;
    if (first?.msg) return String(first.msg);
    if (first?.message) return String(first.message);
  }

  return `Request failed (${status})`;
}

async function request<T>(path: string, accessToken?: string | null, init?: RequestInit): Promise<T> {
  if (!accessToken) {
    throw new ApiError('You must be signed in to do this.', 401);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    const message = extractErrorMessage(body, res.status);
    console.error('Assessment results API request failed', {
      path,
      status: res.status,
      message,
      body,
    });
    throw new ApiError(message, res.status);
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

const BASE = '/assessment-result';

export async function listResults(
  params: ListResultsParams,
  accessToken: string | null,
): Promise<{ items: AssessmentResult[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    candidateId: params.candidateId,
    assessmentId: params.assessmentId,
    minScore: params.minScore,
    maxScore: params.maxScore,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  const res = await request<Envelope<AssessmentResult[]>>(`${BASE}${query}`, accessToken);
  return { items: res.data.data, meta: res.data.meta as PaginationMeta };
}

export async function getResult(id: string, accessToken: string | null): Promise<AssessmentResult> {
  const res = await request<Envelope<AssessmentResult>>(`${BASE}/${id}`, accessToken);
  return res.data.data;
}

export async function getResultByAttempt(
  attemptId: string,
  accessToken: string | null,
): Promise<AssessmentResult> {
  const res = await request<Envelope<AssessmentResult>>(`${BASE}/attempt/${attemptId}`, accessToken);
  return res.data.data;
}

/** Richer bundle used by the detail page — includes the full question/answer breakdown. */
export async function getCandidateResult(
  attemptId: string,
  accessToken: string | null,
): Promise<CandidateResultBundle> {
  const res = await request<Envelope<CandidateResultBundle>>(`${BASE}/candidate/${attemptId}`, accessToken);
  return res.data.data;
}

export async function downloadCandidateReportPdf(
  attemptId: string,
  accessToken: string | null,
): Promise<Blob> {
  if (!accessToken) {
    throw new ApiError('You must be signed in to do this.', 401);
  }

  const res = await fetch(`${API_BASE}${BASE}/candidate/${attemptId}/pdf`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(extractErrorMessage(body, res.status), res.status);
  }

  return await res.blob();
}

/**
 * FIXED: this previously read `process.env.NEXT_PUBLIC_API_BASE_URL`,
 * which doesn't exist in this project — every other function in this file
 * uses NEXT_PUBLIC_API via the API_BASE constant above. The undefined env
 * var stringified to the literal text "undefined" inside the template
 * literal, producing a URL with no protocol/host. The browser then
 * resolved that as a *relative* path against the current page
 * (/company/results/<attemptId>), which is exactly why the network tab
 * showed a request to /company/results/undefined/candidate-results/.../
 * certificate — a Next.js frontend route, not the API — and always 404'd.
 *
 * Also switched the path from the previous `/candidate-results/${id}/certificate`
 * to `${BASE}/candidate/${id}/certificate` (i.e.
 * /assessment-result/candidate/:id/certificate) to mirror
 * downloadCandidateReportPdf's working `/candidate/${id}/pdf` pattern one
 * function above. This part is a convention-based guess, not confirmed
 * against your backend router — if your server actually registers a
 * separate `/candidate-results/:id/certificate` route, revert this path
 * back to that and keep only the API_BASE fix.
 */
export async function downloadCandidateCertificatePdf(
  attemptId: string,
  accessToken: string | null | undefined,
): Promise<Blob> {
  if (!accessToken) {
    throw new ApiError('You must be signed in to do this.', 401);
  }

  const res = await fetch(`${API_BASE}${BASE}/candidate/${attemptId}/certificate`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body ? extractErrorMessage(body, res.status) : 'Failed to download certificate.', res.status);
  }

  return res.blob();
}