'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface CandidateConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'default';
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CandidateConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'danger',
  submitting,
  onConfirm,
  onCancel,
}: CandidateConfirmDialogProps) {
  const danger = tone === 'danger';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-3">
          <span
            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
              danger ? 'bg-[#FF6B6B]/15 text-[#FF6B6B]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
            }`}
          >
            <AlertTriangle size={16} />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-[13px] text-[var(--muted)] mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-lg text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 ${
              danger ? 'bg-[#FF6B6B] hover:bg-[#FF6B6B]/90' : 'bg-[#F2AE55] hover:bg-[#F2AE55]/90'
            }`}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}