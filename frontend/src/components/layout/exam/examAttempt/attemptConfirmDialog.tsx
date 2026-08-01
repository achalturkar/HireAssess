'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface AttemptConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AttemptConfirmDialog({
  title,
  description,
  confirmLabel,
  submitting,
  onConfirm,
  onCancel,
}: AttemptConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-3">
          <span className="w-9 h-9 shrink-0 rounded-full bg-[#F2AE55]/15 text-[#F2AE55] flex items-center justify-center">
            <AlertTriangle size={16} />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-[#F2F4FA]">{title}</h2>
            <p className="text-[13px] text-[#8891B8] mt-1.5 leading-relaxed">{description}</p>
          </div>
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
            className="flex items-center gap-2 rounded-lg bg-[#F2AE55] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#F2AE55]/90 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}