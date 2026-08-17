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

export default function ClientConfirmDialog({
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40 p-5">
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed">{description}</p>
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
            className="rounded-lg border border-[var(--border)] text-[var(--muted)] text-[13.5px] font-medium py-2.5 px-4 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}