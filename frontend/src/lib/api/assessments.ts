import type {
  Assessment,
  AssessmentLevel,
  AssessmentStatus,
  PaginationMeta,
} from "@/src/types/assessment";

const API_BASE =
  process.env.NEXT_PUBLIC_API || 
  "http://localhost:5000/api/v1";

class ApiError extends Error {
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

// Same double-wrapped envelope as /clients and /companies:
// { success, message: "Success", data: { message: "...", data: T, meta? } }
type Envelope<T> = ApiResponse<{ message: string; data: T; meta?: PaginationMeta }>;

async function request<T>(
  path: string,
  accessToken: string | null | undefined,
  init?: RequestInit
): Promise<T> {
  if (!accessToken) {
    // Calling an authenticated endpoint without a token would otherwise send
    // "Authorization: Bearer undefined" and fail with a confusing 401/403.
    // Fail fast with a clear message instead.
    throw new ApiError("You must be signed in to do this.", 401);
  }

  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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

function buildQuery(
  params: Record<string, string | number | boolean | undefined>
) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") {
      qs.set(k, String(v));
    }
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Backend mounts this router at /api/v1/assessment (singular) — confirmed
// working via direct testing, unlike /clients, /roles, /candidates which
// are plural. Keep every call below on this one constant.
const BASE_PATH = "/assessment";

export interface ListAssessmentsParams {
  page: number;
  limit: number;
  search?: string;
  clientId?: string;
  level?: AssessmentLevel | "";
  status?: AssessmentStatus | "";
  includeDeleted?: boolean;
  sortBy?: "name" | "level" | "durationMinutes" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/* -------------------------------------------------------------------------- */
/*                                   LIST                                     */
/* -------------------------------------------------------------------------- */

export async function listAssessments(
  params: ListAssessmentsParams,
  accessToken: string | null
): Promise<{ items: Assessment[]; meta: PaginationMeta }> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    clientId: params.clientId,
    level: params.level,
    status: params.status,
    includeDeleted: params.includeDeleted,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request<Envelope<Assessment[]>>(`${BASE_PATH}${query}`, accessToken);

  return {
    items: res.data.data,
    meta: res.data.meta as PaginationMeta,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  GET ONE                                   */
/* -------------------------------------------------------------------------- */

export async function getAssessment(
  id: string,
  accessToken: string | null
): Promise<Assessment> {
  const res = await request<Envelope<Assessment>>(`${BASE_PATH}/${id}`, accessToken);
  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

export interface AssessmentPayload {
  companyId?: string;
  clientId: string;
  name: string;
  level: AssessmentLevel;
  likertCount?: number;
  sjqCount?: number;
  forcedChoiceCount?: number;
  analyticalCount?: number;
  logicalReasoningCount?: number;
  durationMinutes: number;
}

export async function createAssessment(
  payload: AssessmentPayload,
  accessToken: string | null
): Promise<Assessment> {
  const res = await request<Envelope<Assessment>>(BASE_PATH, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                   */
/* -------------------------------------------------------------------------- */

export async function updateAssessment(
  id: string,
  payload: Partial<Omit<AssessmentPayload, "companyId">> & { status?: AssessmentStatus },
  accessToken: string | null
): Promise<Assessment> {
  const res = await request<Envelope<Assessment>>(`${BASE_PATH}/${id}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

export async function deleteAssessment(
  id: string,
  accessToken: string | null
): Promise<void> {
  await request<ApiResponse<{ message: string }>>(`${BASE_PATH}/${id}`, accessToken, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/*                                  ACTIVATE                                  */
/* -------------------------------------------------------------------------- */

export async function activateAssessment(
  id: string,
  accessToken: string | null
): Promise<Assessment> {
  const res = await request<Envelope<Assessment>>(`${BASE_PATH}/${id}/activate`, accessToken, {
    method: "POST",
  });

  return res.data.data;
}

/* -------------------------------------------------------------------------- */
/*                                INACTIVATE                                  */
/* -------------------------------------------------------------------------- */

export async function inactivateAssessment(
  id: string,
  accessToken: string | null
): Promise<Assessment> {
  const res = await request<Envelope<Assessment>>(`${BASE_PATH}/${id}/inactivate`, accessToken, {
    method: "POST",
  });

  return res.data.data;
}

export { ApiError };