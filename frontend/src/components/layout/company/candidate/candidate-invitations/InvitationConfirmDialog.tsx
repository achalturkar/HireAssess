'use client';

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function InvitationConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  submitting = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#060819]/70 backdrop-blur-sm" onClick={submitting ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-2xl shadow-black/40 p-5">
        <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        <p className="text-[13px] text-[#AAB2D4] mt-2 leading-relaxed">{description}</p>
        <div className="flex items-center gap-2.5 mt-5">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={`flex-1 rounded-lg text-[13.5px] font-semibold py-2.5 transition-colors disabled:opacity-50 ${
              tone === 'danger'
                ? 'bg-[#FF6B6B] text-[#2A0E0E] hover:bg-[#FF6B6B]/90'
                : 'bg-[#3FDCC0] text-[#0B0F26] hover:bg-[#3FDCC0]/90'
            }`}
          >
            {submitting ? 'Working…' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-white/[0.1] text-[#AAB2D4] text-[13.5px] font-medium py-2.5 px-4 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}