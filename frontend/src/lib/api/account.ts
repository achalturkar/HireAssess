import { ApiError } from '@/src/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API ?? '/api/v1';

/**
 * No change-password service/controller was in any of the files shared
 * for this project, so this endpoint is a guess, unlike updateUser and
 * getCompany/updateCompany which now call your real implementations.
 * Confirm the real route + method (and payload shape) against your
 * backend and adjust this function — the AccountSettingsPage below
 * already calls it with { currentPassword, newPassword, confirmPassword },
 * so only this function's internals need to change if the real contract
 * differs.
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(
  payload: ChangePasswordPayload,
  accessToken: string | null
): Promise<void> {
  if (!accessToken) throw new ApiError('You must be signed in to do this.', 401);

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    const msgObj = body?.message;
    const message =
      (typeof msgObj === 'object' && msgObj?.message) ||
      (typeof msgObj === 'string' ? msgObj : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
}