'use client';

import { useState } from 'react';

interface GeneratedPasswordDialogProps {
  email: string | null;
  password: string | null;
  onClose: () => void;
}

export function GeneratedPasswordDialog({ email, password, onClose }: GeneratedPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!email || !password) return null;

  function handleCopy() {
    navigator.clipboard?.writeText(password!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)]">User created</h3>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          A welcome email was sent to <span className="font-medium text-[var(--foreground)]">{email}</span>. Here's
          the generated password in case they need it directly — it won't be shown again.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
          <code className="flex-1 truncate text-[13px] text-[var(--foreground)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {password}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[12px] font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-[#0B0F26] hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}