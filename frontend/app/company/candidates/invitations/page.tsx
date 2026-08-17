'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, RefreshCw, Ban, Link2, Check, Clock } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import CreateInvitationModal from '@/src/components/layout/company/candidate/candidate-invitations/CreateInvitationModal';
import InvitationConfirmDialog from '@/src/components/layout/company/candidate/candidate-invitations/InvitationConfirmDialog';
import {
  listInvitations,
  createInvitation,
  resendInvitation,
  expireInvitation,
  ApiError,
} from '@/src/lib/api/candidateinvitations';
import type { CandidateInvitation, InvitationStatus, PaginationMeta } from '@/src/types/candidateinvitation';

const PAGE_SIZE = 10;

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: InvitationStatus }) {
  const styles: Record<InvitationStatus, string> = {
    SENT: 'bg-[#F2AE55]/15 text-[#F2AE55]',
    STARTED: 'bg-[#5B8CFF]/15 text-[#5B8CFF]',
    COMPLETED: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
    EXPIRED: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function CandidateInvitationsPage() {
  const { accessToken } = useAuth();

  const [invitations, setInvitations] = useState<CandidateInvitation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvitationStatus | ''>('');
  const [candidateFilter, setCandidateFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [expireTarget, setExpireTarget] = useState<CandidateInvitation | null>(null);
  const [expiring, setExpiring] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listInvitations(
        {
          page,
          limit: PAGE_SIZE,
          status,
          candidateName: candidateFilter.trim() || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        accessToken
      );
      setInvitations(res.items);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [page, status, candidateFilter, accessToken]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const handleCreate = async (values: { candidateId: string; expiresInHours: string }) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const hours = parseInt(values.expiresInHours, 10);
      await createInvitation(
        {
          candidateId: values.candidateId,
          expiresInHours: Number.isFinite(hours) && hours > 0 ? hours : undefined,
        },
        accessToken
      );
      setBanner({ text: 'Invitation sent to the candidate.', tone: 'success' });
      setCreateOpen(false);
      setPage(1);
      fetchInvitations();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (invitation: CandidateInvitation) => {
    setResendingId(invitation.id);
    try {
      await resendInvitation(invitation.id, {}, accessToken);
      setBanner({ text: 'Invitation resent with a fresh link.', tone: 'success' });
      fetchInvitations();
    } catch (err) {
      setBanner({ text: err instanceof ApiError ? err.message : 'Failed to resend invitation.', tone: 'error' });
    } finally {
      setResendingId(null);
    }
  };

  const handleExpire = async () => {
    if (!expireTarget) return;
    setExpiring(true);
    try {
      await expireInvitation(expireTarget.id, accessToken);
      setBanner({ text: 'Invitation marked as expired.', tone: 'success' });
      setExpireTarget(null);
      fetchInvitations();
    } catch (err) {
      setBanner({ text: err instanceof ApiError ? err.message : 'Failed to expire invitation.', tone: 'error' });
      setExpireTarget(null);
    } finally {
      setExpiring(false);
    }
  };

  const copyLink = async (invitation: CandidateInvitation) => {
    const url = `${window.location.origin}/invite/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setBanner({ text: 'Could not copy link to clipboard.', tone: 'error' });
    }
  };

  const rangeLabel = useMemo(() => {
    if (meta.total === 0) return '0 invitations';
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `${start}–${end} of ${meta.total}`;
  }, [meta]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Assessment Access
          </p>
          <h1
            className="text-[26px] font-semibold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Candidate Invitations
          </h1>
          <p className="text-[13.5px] text-[var(--muted)] mt-1">Send, track, and manage assessment invite links</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          Invite candidate
        </button>
      </div>

      {/* Banner */}
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
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <Search size={15} />
          </span>
          <input
            value={candidateFilter}
            onChange={(e) => {
              setCandidateFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search by candidate name or email…"
            className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] pl-9 pr-3 py-2.5 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InvitationStatus | '');
            setPage(1);
          }}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none focus:border-[#3FDCC0]/50 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="STARTED">Started</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Expires</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  Loading invitations…
                </td>
              </tr>
            )}

            {!loading && loadError && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#FF6B6B]">
                  {loadError}
                </td>
              </tr>
            )}

            {!loading && !loadError && invitations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  No invitations match these filters.
                </td>
              </tr>
            )}

            {!loading &&
              !loadError &&
              invitations.map((inv, i) => {
                const isTerminal = inv.status === 'COMPLETED' || inv.status === 'EXPIRED';
                return (
                  <tr key={inv.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                            i % 2 === 0 ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
                          }`}
                        >
                          {inv.candidate ? initials(inv.candidate.firstName, inv.candidate.lastName) : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] text-[var(--foreground)] truncate">
                            {inv.candidate ? `${inv.candidate.firstName} ${inv.candidate.lastName}` : 'Unknown candidate'}
                          </p>
                          <p className="text-[11.5px] text-[var(--muted)] truncate">{inv.candidate?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} className="text-[var(--muted)]" />
                        {formatDateTime(inv.expiresAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatDateTime(inv.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyLink(inv)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                          aria-label="Copy invitation link"
                          title="Copy invitation link"
                        >
                          {copiedId === inv.id ? <Check size={13} className="text-[#3FDCC0]" /> : <Link2 size={13} />}
                        </button>
                        {inv.status === 'SENT' && (
                          <button
                            onClick={() => handleResend(inv)}
                            disabled={resendingId === inv.id}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10 transition-colors disabled:opacity-40"
                            aria-label="Resend invitation"
                            title="Resend invitation"
                          >
                            <RefreshCw size={13} className={resendingId === inv.id ? 'animate-spin' : ''} />
                          </button>
                        )}
                        {!isTerminal && (
                          <button
                            onClick={() => setExpireTarget(inv)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                            aria-label="Expire invitation"
                            title="Expire invitation"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)]">
          <p className="text-[12px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {rangeLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || loading}
              className="px-2.5 h-7 rounded-md flex items-center justify-center text-[12.5px] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-[12.5px] text-[var(--muted)] px-2" style={{ fontFamily: 'var(--font-mono)' }}>
              {meta.page} / {Math.max(1, meta.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={meta.page >= meta.totalPages || loading}
              className="px-2.5 h-7 rounded-md flex items-center justify-center text-[12.5px] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateInvitationModal
          accessToken={accessToken}
          submitting={submitting}
          error={formError}
          onClose={() => {
            if (!submitting) setCreateOpen(false);
          }}
          onSubmit={handleCreate}
        />
      )}

      {expireTarget && (
        <InvitationConfirmDialog
          title="Expire this invitation?"
          description={`${
            expireTarget.candidate ? `${expireTarget.candidate.firstName} ${expireTarget.candidate.lastName}` : 'This candidate'
          }'s invite link will stop working immediately. You can send a new invitation afterward.`}
          confirmLabel="Expire invitation"
          submitting={expiring}
          onConfirm={handleExpire}
          onCancel={() => setExpireTarget(null)}
        />
      )}
    </div>
  );
}