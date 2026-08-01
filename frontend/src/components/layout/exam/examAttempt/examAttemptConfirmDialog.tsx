'use client';

import { Loader2 } from 'lucide-react';

interface ExamAttemptConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExamAttemptConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'default',
  submitting,
  onConfirm,
  onCancel,
}: ExamAttemptConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        <div className="px-6 py-5 space-y-2">
          <h2 className="text-[15px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
          <p className="text-[13px] text-[#8891B8]">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#AAB2D4] hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-lg text-[13px] font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 ${
              tone === 'danger'
                ? 'bg-[#FF6B6B] text-[#0B0F26] hover:bg-[#FF6B6B]/90'
                : 'bg-[#3FDCC0] text-[#0B0F26] hover:bg-[#3FDCC0]/90'
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