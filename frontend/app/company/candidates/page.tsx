'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Users,
  ClipboardList,
  Play,
  CheckCircle2,
  Hourglass,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import CandidateFormModal from '@/src/components/layout/company/candidate/CandidateFormModal';
import CandidateConfirmDialog from '@/src/components/layout/company/candidate/CandidateConfirmDialog';
import {
  listCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  startCandidate,
  completeCandidate,
  expireCandidate,
  withdrawCandidate,
  ApiError,
} from '@/src/lib/api/candidates';
import { listClients } from '@/src/lib/api/clients';
import { listAssessments } from '@/src/lib/api/assessments';
import type { Candidate, CandidateFormValues, CandidateStatus, PaginationMeta } from '@/src/types/candidate';
import type { Client } from '@/src/types/client';
import type { Assessment } from '@/src/types/assessment';
import Link from 'next/link';

const PAGE_SIZE = 10;

type TransitionAction = 'start' | 'complete' | 'expire' | 'withdraw';

const TERMINAL: CandidateStatus[] = ['COMPLETED', 'WITHDRAWN'];

const STATUS_STYLES: Record<CandidateStatus, string> = {
  INVITED: 'bg-[#565F8C]/20 text-[#8891B8]',
  IN_PROGRESS: 'bg-[#F2AE55]/15 text-[#F2AE55]',
  COMPLETED: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
  EXPIRED: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
  WITHDRAWN: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
};

const TRANSITION_META: Record<
  TransitionAction,
  { icon: React.ComponentType<{ size?: number }>; label: string; hoverColor: string; tone: 'default' | 'danger' }
> = {
  start: { icon: Play, label: 'Start', hoverColor: 'hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10', tone: 'default' },
  complete: {
    icon: CheckCircle2,
    label: 'Complete',
    hoverColor: 'hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10',
    tone: 'default',
  },
  expire: {
    icon: Hourglass,
    label: 'Expire',
    hoverColor: 'hover:text-[#F2AE55] hover:bg-[#F2AE55]/10',
    tone: 'danger',
  },
  withdraw: {
    icon: XCircle,
    label: 'Withdraw',
    hoverColor: 'hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10',
    tone: 'danger',
  },
};

function allowedActions(status: CandidateStatus): TransitionAction[] {
  if (TERMINAL.includes(status)) return [];
  const actions: TransitionAction[] = [];
  if (status !== 'IN_PROGRESS') actions.push('start');
  actions.push('complete');
  if (status !== 'EXPIRED') actions.push('expire');
  actions.push('withdraw');
  return actions;
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default function CandidatesPage() {
  const { accessToken } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>('');

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [transitionTarget, setTransitionTarget] = useState<{ candidate: Candidate; action: TransitionAction } | null>(
    null
  );
  const [transitioning, setTransitioning] = useState(false);

  const [banner, setBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listCandidates(
        {
          page,
          limit: PAGE_SIZE,
          search,
          clientId: clientFilter || undefined,
          assessmentId: assessmentFilter || undefined,
          status: statusFilter || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        accessToken
      );
      setCandidates(res.items);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [page, search, clientFilter, assessmentFilter, statusFilter, accessToken]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Client list, used both for the filter bar and to resolve each
  // candidate row's clientId -> name.
  useEffect(() => {
    listClients({ page: 1, limit: 200, sortBy: 'name', sortOrder: 'asc' }, accessToken)
      .then((res) => {
        setClients(res.items);
        setClientsError(null);
      })
      .catch((err) => {
        setClients([]);
        setClientsError(err instanceof ApiError ? err.message : 'Failed to load clients');
      });
  }, [accessToken]);

  // Assessment list, used both for the filter bar and to resolve each
  // candidate row's assessmentId -> name/level.
  useEffect(() => {
    listAssessments({ page: 1, limit: 200, sortBy: 'name', sortOrder: 'asc' }, accessToken)
      .then((res) => {
        setAssessments(res.items);
        setAssessmentsError(null);
      })
      .catch((err) => {
        setAssessments([]);
        setAssessmentsError(err instanceof ApiError ? err.message : 'Failed to load assessments');
      });
  }, [accessToken]);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const assessmentMap = useMemo(() => {
    const map = new Map<string, Assessment>();
    assessments.forEach((a) => map.set(a.id, a));
    return map;
  }, [assessments]);

  const openCreate = () => {
    setFormError(null);
    setActiveCandidate(null);
    setModalMode('create');
  };

  const openEdit = (candidate: Candidate) => {
    setFormError(null);
    setActiveCandidate(candidate);
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setActiveCandidate(null);
    setFormError(null);
  };

  const handleSubmit = async (values: CandidateFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === 'create') {
        const created = await createCandidate(
          {
            clientId: values.clientId,
            assessmentId: values.assessmentId,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
          },
          accessToken
        );
        setBanner({ text: `${created.firstName} ${created.lastName} was invited.`, tone: 'success' });
      } else if (activeCandidate) {
        const updated = await updateCandidate(
          activeCandidate.id,
          {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
          },
          accessToken
        );
        setBanner({ text: `${updated.firstName} ${updated.lastName} was updated.`, tone: 'success' });
      }
      setModalMode(null);
      setActiveCandidate(null);
      fetchCandidates();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCandidate(deleteTarget.id, accessToken);
      setBanner({ text: `${deleteTarget.firstName} ${deleteTarget.lastName} was deleted.`, tone: 'success' });
      setDeleteTarget(null);
      fetchCandidates();
    } catch (err) {
      setBanner({
        text: err instanceof ApiError ? err.message : 'Failed to delete candidate.',
        tone: 'error',
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleTransition = async () => {
    if (!transitionTarget) return;
    setTransitioning(true);
    try {
      const { candidate, action } = transitionTarget;
      const fn = { start: startCandidate, complete: completeCandidate, expire: expireCandidate, withdraw: withdrawCandidate }[
        action
      ];
      await fn(candidate.id, accessToken);
      setBanner({
        text: `${candidate.firstName} ${candidate.lastName}: ${TRANSITION_META[action].label.toLowerCase()}d.`,
        tone: 'success',
      });
      setTransitionTarget(null);
      fetchCandidates();
    } catch (err) {
      setBanner({
        text: err instanceof ApiError ? err.message : 'Failed to update candidate status.',
        tone: 'error',
      });
      setTransitionTarget(null);
    } finally {
      setTransitioning(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (meta.total === 0) return '0 candidates';
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
            Candidate Management
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Candidates
          </h1>
          <p className="text-[13.5px] text-[#8891B8] mt-1">Track invites and assessment progress</p>
        </div>

        <Link
          href="/company/candidates/invitations"
          className="flex items-center gap-1.5 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          Invite candidate
        </Link>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          Create Candidate
        </button>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] flex items-center justify-between ${banner.tone === 'success'
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

      {(clientsError || assessmentsError) && (
        <div className="rounded-xl border px-4 py-3 text-[13px] bg-[#F2AE55]/10 border-[#F2AE55]/25 text-[#F2AE55]">
          {clientsError && <div>Client names may be unavailable: {clientsError}</div>}
          {assessmentsError && <div>Assessment names may be unavailable: {assessmentsError}</div>}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
            <Search size={15} />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full rounded-lg bg-[#161C3A] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
          />
        </div>
        <select
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[#161C3A] border border-white/[0.08] px-3 py-2.5 text-[13px] text-[#AAB2D4] outline-none focus:border-[#3FDCC0]/50 transition-colors"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={assessmentFilter}
          onChange={(e) => {
            setAssessmentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[#161C3A] border border-white/[0.08] px-3 py-2.5 text-[13px] text-[#AAB2D4] outline-none focus:border-[#3FDCC0]/50 transition-colors"
        >
          <option value="">All assessments</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as CandidateStatus | '');
            setPage(1);
          }}
          className="rounded-lg bg-[#161C3A] border border-white/[0.08] px-3 py-2.5 text-[13px] text-[#AAB2D4] outline-none focus:border-[#3FDCC0]/50 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="INVITED">Invited</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="WITHDRAWN">Withdrawn</option>
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
              <th className="px-5 py-3 font-medium">Assessment</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#565F8C]">
                  Loading candidates…
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

            {!loading && !loadError && candidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#565F8C]">
                  No candidates match these filters.
                </td>
              </tr>
            )}

            {!loading &&
              !loadError &&
              candidates.map((c, i) => {
                const actions = allowedActions(c.status);
                const assessment = assessmentMap.get(c.assessmentId);
                const client = clientMap.get(c.clientId);
                return (
                  <tr key={c.id} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${i % 2 === 0 ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
                            }`}
                        >
                          {initials(c.firstName, c.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] text-[#F2F4FA] truncate">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-[11.5px] text-[#565F8C] truncate flex items-center gap-1">
                            <Mail size={10} /> {c.email}
                          </p>
                          {c.phone && (
                            <p className="text-[11.5px] text-[#565F8C] truncate flex items-center gap-1">
                              <Phone size={10} /> {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#AAB2D4]">
                      <span className="flex items-center gap-1.5">
                        <ClipboardList size={12} className="text-[#565F8C]" />
                        {assessment?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#AAB2D4]">
                      <span className="flex items-center gap-1.5">
                        <Users size={12} className="text-[#565F8C]" />
                        {client?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[#8891B8]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {actions.map((action) => {
                          const meta = TRANSITION_META[action];
                          const Icon = meta.icon;
                          return (
                            <button
                              key={action}
                              onClick={() => setTransitionTarget({ candidate: c, action })}
                              className={`w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] transition-colors ${meta.hoverColor}`}
                              aria-label={`${meta.label} ${c.firstName}`}
                              title={meta.label}
                            >
                              <Icon size={13} />
                            </button>
                          );
                        })}
                        <button
                          onClick={() => openEdit(c)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10 transition-colors"
                          aria-label={`Edit ${c.firstName}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                          aria-label={`Delete ${c.firstName}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
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

      {modalMode && (
        <CandidateFormModal
          mode={modalMode}
          candidate={activeCandidate}
          submitting={submitting}
          error={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {deleteTarget && (
        <CandidateConfirmDialog
          title="Delete candidate?"
          description={`This will soft-delete ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email}).`}
          confirmLabel="Delete candidate"
          tone="danger"
          submitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {transitionTarget && (
        <CandidateConfirmDialog
          title={`${TRANSITION_META[transitionTarget.action].label} candidate?`}
          description={`${transitionTarget.candidate.firstName} ${transitionTarget.candidate.lastName} will be marked as ${{ start: 'in progress', complete: 'completed', expire: 'expired', withdraw: 'withdrawn' }[
            transitionTarget.action
            ]
            }.`}
          confirmLabel={TRANSITION_META[transitionTarget.action].label}
          tone={TRANSITION_META[transitionTarget.action].tone}
          submitting={transitioning}
          onConfirm={handleTransition}
          onCancel={() => setTransitionTarget(null)}
        />
      )}
    </div>
  );
}