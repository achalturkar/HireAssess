import type {
  ExamAttempt,
  QuestionBankItem,
  ResumeExamResponse,
  AttemptStatus,
  AttemptAnswer,
} from "@/src/types/exam-attempt";
import type { PaginationMeta } from "@/src/types/user";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1";

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

type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

/**
 * Admin calls — require a bearer token, same pattern as clients/assessments/roles.
 */
async function authRequest<T>(
  path: string,
  accessToken: string | null | undefined,
  init?: RequestInit
): Promise<T> {
  if (!accessToken) {
    throw new ApiError("You must be signed in to do this.", 401);
  }
  return rawRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Candidate calls — the invitation token IS the credential (per the
 * `/token/:token/...` public routes). No Authorization header at all.
 */
async function tokenRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return rawRequest<T>(path, init);
}

async function rawRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    const msgObj = body?.message;
    const message =
      (typeof msgObj === "object" && msgObj?.message) ||
      (typeof msgObj === "string" ? msgObj : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const BASE = "/exam-attempts";

/* -------------------------------------------------------------------------- */
/*                      ADMIN — authenticated, company-scoped                 */
/* -------------------------------------------------------------------------- */

export interface ListAttemptsParams {
  page: number;
  limit: number;
  candidateId?: string;
  assessmentId?: string;
  status?: AttemptStatus | "";
  sortBy?: "startedAt" | "submittedAt" | "expiresAt" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

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
  const res = await authRequest<Envelope<ExamAttempt[]>>(`${BASE}${query}`, accessToken);
  return { items: res.data.data, meta: res.data.meta as PaginationMeta };
}

export async function getAttempt(id: string, accessToken: string | null): Promise<ExamAttempt> {
  const res = await authRequest<Envelope<ExamAttempt>>(`${BASE}/${id}`, accessToken);
  return res.data.data;
}

export async function expireAttempt(id: string, accessToken: string | null): Promise<ExamAttempt> {
  const res = await authRequest<Envelope<ExamAttempt>>(`${BASE}/${id}/expire`, accessToken, {
    method: "POST",
  });
  return res.data.data;
}

// Raw selected question ids grouped by category (e.g. { likert: [...], sjq: [...], forced: [...] }).
// Not hydrated into full question text — that's only exposed via the
// candidate-facing token route below.
export async function getSelectedQuestions(
  id: string,
  accessToken: string | null
): Promise<Record<string, string[]>> {
  const res = await authRequest<Envelope<Record<string, string[]>>>(
    `${BASE}/${id}/questions`,
    accessToken
  );
  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                    CANDIDATE — public, invitation-token based              */
/* -------------------------------------------------------------------------- */

export async function startAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await tokenRequest<Envelope<ExamAttempt>>(`${BASE}/token/${token}/start`, {
    method: "POST",
  });
  return res.data.data;
}

export async function getAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await tokenRequest<Envelope<ExamAttempt>>(`${BASE}/token/${token}`);
  return res.data.data;
}

export async function submitAttemptByToken(token: string): Promise<ExamAttempt> {
  const res = await tokenRequest<Envelope<ExamAttempt>>(`${BASE}/token/${token}/submit`, {
    method: "POST",
  });
  return res.data.data;
}

export async function getQuestionsByToken(
  token: string
): Promise<Record<string, QuestionBankItem[]>> {
  const res = await tokenRequest<Envelope<Record<string, QuestionBankItem[]>>>(
    `${BASE}/token/${token}/questions`
  );
  return res.data.data;
}

export async function resumeExamByToken(token: string): Promise<ResumeExamResponse> {
  const res = await tokenRequest<Envelope<ResumeExamResponse>>(`${BASE}/token/${token}/resume`);
  return res.data.data;
}

// ASSUMPTION: no answer-saving route was provided (resumeExam reads answers
// via a separate candidate-answer module you haven't shared yet). Guessing
// a token-scoped path consistent with the rest of this router — confirm and
// adjust once that module's routes are available.
// src/lib/api/exam-attempts.ts — only the changed function shown
export async function saveAnswerByToken(
  token: string,
  payload: { questionId: string; questionType: string; category: string; answer: unknown }
): Promise<AttemptAnswer> {
  // Matches candidate-answer.route.js: PUT /candidate-answers/token/:token
  const res = await tokenRequest<Envelope<AttemptAnswer>>(`/candidate-answers/token/${token}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data.data;
}