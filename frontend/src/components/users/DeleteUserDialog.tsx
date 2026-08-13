'use client';

import { useState } from 'react';
import type { User } from '@/src/types/user';
import { ApiError } from '@/src/lib/api/http';

interface DeleteUserDialogProps {
  user: User | null;
  onCancel: () => void;
  onConfirm: (user: User) => Promise<void>;
}

export function DeleteUserDialog({ user, onCancel, onConfirm }: DeleteUserDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(user as User);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this user.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close" onClick={submitting ? undefined : onCancel} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)]">
          Delete {user.firstName} {user.lastName}?
        </h3>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          They'll lose access immediately. This is a soft delete — their record is kept but marked inactive.
        </p>
        {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Deleting…' : 'Delete user'}
          </button>
        </div>
      </div>
    </div>
  );
}