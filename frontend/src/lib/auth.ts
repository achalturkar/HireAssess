// Only the piece this page needs. If your project already has
// src/lib/api/auth.ts (very likely, given login/resetPassword live in
// src/auth/auth-service.ts), add this function there instead of using
// this file — don't end up with two competing auth API modules.

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

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Changes the signed-in user's own password. Guessed endpoint:
 * PATCH /auth/change-password — verify this against your actual auth
 * routes and adjust the path/method below if it differs.
 */
export async function changePassword(
  payload: ChangePasswordPayload,
  accessToken: string | null | undefined
): Promise<void> {
  if (!accessToken) {
    throw new ApiError('You must be signed in to do this.', 401);
  }

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    throw new ApiError(extractErrorMessage(body, res.status), res.status);
  }
}