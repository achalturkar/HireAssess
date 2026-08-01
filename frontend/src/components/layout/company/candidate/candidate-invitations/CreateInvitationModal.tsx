'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CandidatePicker from '../CandidatePicker';
import type { CandidateOption } from '@/src/types/candidate';

interface Props {
  accessToken?: string | null;
  submitting: boolean;
  error: string | null;
  initialCandidate?: CandidateOption | null; // pre-select when arriving from an "Invite" link on the candidate page
  onClose: () => void;
  onSubmit: (values: { candidateId: string; expiresInHours: string }) => void;
}

const inputClass =
  'w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass = 'block text-[11.5px] font-medium text-[#AAB2D4] mb-1.5';

export default function CreateInvitationModal({
  accessToken,
  submitting,
  error,
  initialCandidate = null,
  onClose,
  onSubmit,
}: Props) {
  const [candidateId, setCandidateId] = useState(initialCandidate?.id ?? '');
  const [expiresInHours, setExpiresInHours] = useState('72');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isValid = Boolean(candidateId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ candidateId, expiresInHours });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#060819]/70 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-0.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              New invitation
            </p>
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Invite a candidate
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-2.5 text-[12.5px] text-[#FF6B6B]">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Candidate</label>
            <CandidatePicker
              accessToken={accessToken}
              value={candidateId}
              onChange={(id) => setCandidateId(id)}
              initialCandidate={initialCandidate}
              disabled={submitting}
            />
            <p className="text-[11px] text-[#565F8C] mt-1">
              Only one active invitation is allowed per candidate.
            </p>
          </div>

          <div>
            <label className={labelClass}>Expires in (hours)</label>
            <input
              type="number"
              min={1}
              max={720}
              className={inputClass}
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              placeholder="72"
              disabled={submitting}
            />
            <p className="text-[11px] text-[#565F8C] mt-1">Defaults to 72 hours if left blank.</p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending…' : 'Send invitation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-white/[0.1] text-[#AAB2D4] text-[13.5px] font-medium py-2.5 px-4 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}