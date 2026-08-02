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
    const msgObj = body?.message;
    const message =
      (typeof msgObj === 'object' && msgObj?.message) ||
      (typeof msgObj === 'string' ? msgObj : null) ||
      `Request failed (${res.status})`;
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
    const msg = body?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  return await res.blob();
}