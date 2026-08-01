import type {
  AssessmentResult,
  CandidateResultDetail,
  ResultsListQuery,
  ResultsListResponse,
} from "./typess";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

/**
 * Your controller wraps responses via success(res, { message, data, meta }).
 * Adjust ApiEnvelope / unwrap() here if your response.js util differs.
 */
interface ApiEnvelope<T> {
  message: string;
  data: T;
  meta?: ResultsListResponse["meta"];
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include", // adjust if you auth via bearer token instead
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

function toQueryString(query: ResultsListQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const assessmentResultsApi = {
  list: async (query: ResultsListQuery): Promise<ResultsListResponse> => {
    const envelope = await request<AssessmentResult[]>(
      `/assessment-results${toQueryString(query)}`
    );
    return {
      items: envelope.data,
      meta: envelope.meta ?? { page: 1, limit: envelope.data.length, total: envelope.data.length, totalPages: 1 },
    };
  },

  getById: async (id: string): Promise<AssessmentResult> => {
    const envelope = await request<AssessmentResult>(`/assessment-results/${id}`);
    return envelope.data;
  },

  getByAttemptId: async (attemptId: string): Promise<AssessmentResult> => {
    const envelope = await request<AssessmentResult>(`/assessment-results/attempt/${attemptId}`);
    return envelope.data;
  },

  getCandidateResult: async (attemptId: string): Promise<CandidateResultDetail> => {
    const envelope = await request<CandidateResultDetail>(
      `/assessment-results/candidate/${attemptId}`
    );
    return envelope.data;
  },
};