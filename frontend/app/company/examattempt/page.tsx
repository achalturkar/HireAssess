'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ListChecks, Ban, Clock, Timer } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import AttemptConfirmDialog from '@/src/components/layout/exam/examAttempt/attemptConfirmDialog';
import SelectedQuestionsModal from '@/src/components/layout/exam/examAttempt/selectedQuestionsModal';
import { listAttempts, expireAttempt, ApiError } from '@/src/lib/api/exam-attempts';
import type { ExamAttempt, AttemptStatus } from '@/src/types/exam-attempt';
import type { PaginationMeta } from '@/src/types/user';

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<AttemptStatus, string> = {
  IN_PROGRESS: 'bg-[#F2AE55]/15 text-[#F2AE55]',
  SUBMITTED: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
  EXPIRED: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
};

function StatusBadge({ status }: { status: AttemptStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExamAttemptsPage() {
  const { accessToken } = useAuth();

  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AttemptStatus | ''>('');

  const [expireTarget, setExpireTarget] = useState<ExamAttempt | null>(null);
  const [expiring, setExpiring] = useState(false);

  const [questionsTarget, setQuestionsTarget] = useState<ExamAttempt | null>(null);

  const [banner, setBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listAttempts(
        { page, limit: PAGE_SIZE, status: statusFilter || undefined, sortBy: 'createdAt', sortOrder: 'desc' },
        accessToken
      );
      setAttempts(res.items);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, accessToken]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const handleExpire = async () => {
    if (!expireTarget) return;
    setExpiring(true);
    try {
      await expireAttempt(expireTarget.id, accessToken);
      setBanner({ text: 'Attempt marked as expired.', tone: 'success' });
      setExpireTarget(null);
      fetchAttempts();
    } catch (err) {
      setBanner({ text: err instanceof ApiError ? err.message : 'Failed to expire attempt.', tone: 'error' });
      setExpireTarget(null);
    } finally {
      setExpiring(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (meta.total === 0) return '0 attempts';
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `${start}–${end} of ${meta.total}`;
  }, [meta]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <p
          className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Assessment Monitoring
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Exam Attempts
        </h1>
        <p className="text-[13.5px] text-[#8891B8] mt-1">Track candidate progress in real time</p>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] flex items-center justify-between ${
            banner.tone === 'success'
              ? 'bg-[#3FDCC0]/10 border-[#3FDCC0]/25 text-[#3FDCC0]'
              : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/25 text-[#FF6B6B]'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100 ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AttemptStatus | '');
            setPage(1);
          }}
          className="rounded-lg bg-[#161C3A] border border-white/[0.08] px-3 py-2.5 text-[13px] text-[#AAB2D4] outline-none focus:border-[#3FDCC0]/50 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wide text-[#565F8C] border-b border-white/[0.08]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Started</th>
              <th className="px-5 py-3 font-medium">Expires</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#565F8C]">
                  Loading attempts…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#FF6B6B]">
                  {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && attempts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#565F8C]">
                  No attempts match this filter.
                </td>
              </tr>
            )}
            {!loading &&
              !loadError &&
              attempts.map((a) => (
                <tr key={a.id} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    {a.candidate ? (
                      <div>
                        <p className="text-[13.5px] text-[#F2F4FA]">
                          {a.candidate.firstName} {a.candidate.lastName}
                        </p>
                        <p className="text-[11.5px] text-[#565F8C]">{a.candidate.email}</p>
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#565F8C]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      {a.status === 'IN_PROGRESS' && (
                        <span
                          className="flex items-center gap-1 text-[11px] text-[#8891B8]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <Timer size={11} />
                          {a.remainingTime}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#8891B8]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatDateTime(a.startedAt)}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#8891B8]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatDateTime(a.expiresAt)}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#8891B8]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatDateTime(a.submittedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setQuestionsTarget(a)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10 transition-colors"
                        aria-label="View selected questions"
                      >
                        <ListChecks size={13} />
                      </button>
                      <button
                        onClick={() => setExpireTarget(a)}
                        disabled={a.status !== 'IN_PROGRESS'}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#F2AE55] hover:bg-[#F2AE55]/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8891B8]"
                        aria-label="Force expire"
                      >
                        <Ban size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.08]">
          <p className="text-[12px] text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
            {rangeLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || loading}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#AAB2D4] border border-white/[0.08] hover:bg-white/[0.05] transition-colors disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12.5px] text-[#AAB2D4] px-2" style={{ fontFamily: 'var(--font-mono)' }}>
              {meta.page} / {Math.max(1, meta.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={meta.page >= meta.totalPages || loading}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#AAB2D4] border border-white/[0.08] hover:bg-white/[0.05] transition-colors disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {expireTarget && (
        <AttemptConfirmDialog
          title="Force-expire this attempt?"
          description={`${expireTarget.candidate?.firstName ?? 'This candidate'}'s attempt will be marked EXPIRED immediately and can no longer be resumed.`}
          confirmLabel="Expire attempt"
          submitting={expiring}
          onConfirm={handleExpire}
          onCancel={() => setExpireTarget(null)}
        />
      )}

      {questionsTarget && (
        <SelectedQuestionsModal attemptId={questionsTarget.id} onClose={() => setQuestionsTarget(null)} />
      )}
    </div>
  );
}