'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  getInvitationByToken,
  startInvitationByToken,
  ApiError,
} from '@/src/lib/api/candidateinvitations';
import type { CandidateInvitation } from '@/src/types/candidateinvitation';

type ViewState = 'loading' | 'error' | 'ready';

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [view, setView] = useState<ViewState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<CandidateInvitation | null>(null);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    setView('loading');
    setLoadError(null);
    try {
      const data = await getInvitationByToken(token);
      setInvitation(data);
      setView('ready');
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'This invitation link could not be verified.'
      );
      setView('error');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoadError('This invitation link is missing a token.');
      setView('error');
      return;
    }
    fetchInvitation();
  }, [token, fetchInvitation]);

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const updated = await startInvitationByToken(token);
      setInvitation(updated);
      // Hard navigation on purpose (matches the pattern used after login) —
      // guarantees the exam page's first load reads fresh invitation state
      // instead of racing a client-side transition.
      // Route matches the nested app/invite/[token]/exam/page.tsx built
      // against the exam-attempts token API — was previously pointing at
      // "/assessment", a route that was never actually built.
      window.location.href = `/invite/${token}/exam`;
    } catch (err) {
      setStartError(
        err instanceof ApiError ? err.message : 'Could not start the assessment. Please try again.'
      );
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F26] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-7 h-7 rounded-md bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
            <ShieldCheck size={14} />
          </span>
          <span
            className="text-[12px] uppercase tracking-[0.14em] text-[#8891B8]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Assessment Invitation
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
          {view === 'loading' && <LoadingBody />}
          {view === 'error' && <ErrorBody message={loadError} onRetry={fetchInvitation} />}
          {view === 'ready' && invitation && (
            <ReadyBody
              invitation={invitation}
              starting={starting}
              startError={startError}
              onStart={handleStart}
            />
          )}
        </div>

        <p className="text-center text-[11.5px] text-[#565F8C] mt-5">
          Trouble with this link? Contact the person who invited you for a fresh one.
        </p>
      </div>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="px-8 py-14 flex flex-col items-center gap-3 text-center">
      <Loader2 size={22} className="text-[#3FDCC0] animate-spin" />
      <p className="text-[13.5px] text-[#8891B8]">Verifying your invitation…</p>
    </div>
  );
}

function ErrorBody({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="px-8 py-12 flex flex-col items-center gap-4 text-center">
      <span className="w-11 h-11 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center">
        <XCircle size={20} />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
          This link isn't working
        </h1>
        <p className="text-[13px] text-[#8891B8] max-w-xs">
          {message ?? 'The invitation could not be found. It may have been mistyped or already used.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 rounded-lg border border-white/[0.08] px-4 py-2 text-[12.5px] font-medium text-[#AAB2D4] hover:bg-white/[0.05] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function ReadyBody({
  invitation,
  starting,
  startError,
  onStart,
}: {
  invitation: CandidateInvitation;
  starting: boolean;
  startError: string | null;
  onStart: () => void;
}) {
  const firstName = invitation.candidate?.firstName ?? 'there';

  if (invitation.status === 'EXPIRED') {
    return (
      <div className="px-8 py-12 flex flex-col items-center gap-4 text-center">
        <span className="w-11 h-11 rounded-full bg-[#F2AE55]/15 text-[#F2AE55] flex items-center justify-center">
          <Clock size={20} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            This invitation has expired
          </h1>
          <p className="text-[13px] text-[#8891B8] max-w-xs">
            Hi {firstName} — this link is no longer active. Ask whoever invited you to send a new one.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.status === 'COMPLETED') {
    return (
      <div className="px-8 py-12 flex flex-col items-center gap-4 text-center">
        <span className="w-11 h-11 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
          <CheckCircle2 size={20} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            You've already completed this
          </h1>
          <p className="text-[13px] text-[#8891B8] max-w-xs">
            Thanks, {firstName} — your responses were submitted. No further action is needed.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.status === 'STARTED') {
    return (
      <div className="px-8 py-10 flex flex-col items-center gap-5 text-center">
        <span className="w-11 h-11 rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] flex items-center justify-center">
          <PlayCircle size={20} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back, {firstName}
          </h1>
          <p className="text-[13px] text-[#8891B8] max-w-xs">
            You've already started this assessment. Pick up where you left off.
          </p>
        </div>
        <a
          href={`/invite/${invitation.token}/exam`}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors"
        >
          Continue assessment
        </a>
      </div>
    );
  }

  // SENT — not yet started
  return (
    <div className="px-8 py-10 flex flex-col items-center gap-5 text-center">
      <span className="w-11 h-11 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
        <Mail size={20} />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
          Hi {firstName}, you've been invited
        </h1>
        <p className="text-[13px] text-[#8891B8] max-w-xs">
          You've been invited to complete an assessment. It's untimed until you begin, so start when
          you're ready and won't be interrupted.
        </p>
      </div>

      {invitation.expiresAt && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#F2AE55] bg-[#F2AE55]/10 border border-[#F2AE55]/25 rounded-full px-3 py-1.5">
          <Clock size={11} />
          Link expires {formatDateTime(invitation.expiresAt)}
        </div>
      )}

      {startError && (
        <div className="w-full flex items-start gap-2 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[12.5px] px-3.5 py-2.5 text-left">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{startError}</span>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-60"
      >
        {starting && <Loader2 size={14} className="animate-spin" />}
        {starting ? 'Starting…' : 'Begin assessment'}
      </button>
    </div>
  );
}