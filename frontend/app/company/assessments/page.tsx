'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Building2,
  Users,
  Clock,
  ListChecks,
  MessagesSquare,
  Shuffle,
  Power,
  PowerOff,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import AssessmentFormModal from '@/src/components/layout/company/assessment/AssessmentFormModal';
import AssessmentConfirmDialog from '@/src/components/layout/company/assessment/AssessmentConfirmDialog';
import {
  listAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  activateAssessment,
  inactivateAssessment,
  ApiError,
} from '@/src/lib/api/assessments';
import { listClients } from '@/src/lib/api/clients';
// import { listCompanies } from '@/src/lib/api/users';
import type {
  Assessment,
  AssessmentFormValues,
  AssessmentLevel,
  AssessmentStatus,
  PaginationMeta,
} from '@/src/types/assessment';
import type { Client } from '@/src/types/client';
import type { CompanyRef } from '@/src/types/user';

const PAGE_SIZE = 10;

const LEVEL_STYLES: Record<AssessmentLevel, string> = {
  ENTRY: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  MID: 'bg-[#F2AE55]/15 text-[#F2AE55]',
  TOP: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
};

const STATUS_STYLES: Record<AssessmentStatus, string> = {
  ACTIVE: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  INACTIVE: 'bg-[var(--muted)]/20 text-[var(--muted)]',
  DRAFT: 'bg-[#F2AE55]/15 text-[#F2AE55]',
};

function LevelBadge({ level }: { level: AssessmentLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${LEVEL_STYLES[level]}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export default function AssessmentsPage() {
  const { user: currentUser, accessToken } = useAuth();
  const isSuperAdmin = Boolean(currentUser?.role?.isSuperAdmin);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<AssessmentLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | ''>('');

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRef[]>([]);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState<{ assessment: Assessment; next: AssessmentStatus } | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [banner, setBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listAssessments(
        {
          page,
          limit: PAGE_SIZE,
          search,
          clientId: clientFilter || undefined,
          level: levelFilter || undefined,
          status: statusFilter || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        accessToken
      );
      setAssessments(res.items);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
    // accessToken is included so a fresh session (or logout/login) re-fetches
    // with the right credentials instead of reusing a stale closure.
  }, [page, search, clientFilter, levelFilter, statusFilter, accessToken]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

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

  // useEffect(() => {
  //   if (isSuperAdmin) {
  //     listCompanies()
  //       .then(setCompanies)
  //       .catch(() => setCompanies([]));
  //   }
  // }, [isSuperAdmin]);

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

  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [companies]);

  const openCreate = () => {
    setFormError(null);
    setActiveAssessment(null);
    setModalMode('create');
  };

  const openEdit = (assessment: Assessment) => {
    setFormError(null);
    setActiveAssessment(assessment);
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setActiveAssessment(null);
    setFormError(null);
  };

  const handleSubmit = async (values: AssessmentFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        clientId: values.clientId,
        name: values.name.trim(),
        level: values.level as AssessmentLevel,
        likertCount: Number(values.likertCount) || 0,
        sjqCount: Number(values.sjqCount) || 0,
        forcedChoiceCount: Number(values.forcedChoiceCount) || 0,
        analyticalCount: Number(values.analyticalCount) || 0,
        logicalReasoningCount: Number(values.logicalReasoningCount) || 0,
        durationMinutes: Number(values.durationMinutes),
      };

      if (modalMode === 'create') {
        const created = await createAssessment(
          {
            ...payload,
            companyId: isSuperAdmin ? values.companyId : currentUser?.companyId ?? undefined,
          },
          accessToken
        );
        setBanner({ text: `Assessment "${created.name}" was created.`, tone: 'success' });
      } else if (activeAssessment) {
        const updated = await updateAssessment(activeAssessment.id, payload, accessToken);
        setBanner({ text: `Assessment "${updated.name}" was updated.`, tone: 'success' });
      }
      setModalMode(null);
      setActiveAssessment(null);
      fetchAssessments();
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
      await deleteAssessment(deleteTarget.id, accessToken);
      setBanner({ text: `Assessment "${deleteTarget.name}" was deleted.`, tone: 'success' });
      setDeleteTarget(null);
      fetchAssessments();
    } catch (err) {
      setBanner({
        text: err instanceof ApiError ? err.message : 'Failed to delete assessment.',
        tone: 'error',
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setTogglingStatus(true);
    try {
      if (statusTarget.next === 'ACTIVE') {
        await activateAssessment(statusTarget.assessment.id, accessToken);
      } else {
        await inactivateAssessment(statusTarget.assessment.id, accessToken);
      }
      setBanner({
        text: `Assessment "${statusTarget.assessment.name}" is now ${statusTarget.next.toLowerCase()}.`,
        tone: 'success',
      });
      setStatusTarget(null);
      fetchAssessments();
    } catch (err) {
      setBanner({
        text: err instanceof ApiError ? err.message : 'Failed to update assessment status.',
        tone: 'error',
      });
      setStatusTarget(null);
    } finally {
      setTogglingStatus(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (meta.total === 0) return '0 assessments';
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `${start}–${end} of ${meta.total}`;
  }, [meta]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-[var(--primary)] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Assessment Management
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            Assessments
          </h1>
          <p className="text-[13.5px] text-[var(--muted)] mt-1">
            {isSuperAdmin ? 'Manage assessments across every company' : 'Manage your company’s assessments'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="rounded-2xl bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--foreground)] border border-[var(--border)]">
            <span className="block text-[11px] text-[var(--muted)]">Total assessments</span>
            <span className="text-[20px] font-semibold">{meta.total}</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-semibold px-4 py-2.5 hover:bg-[var(--primary)]/90 transition-colors shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add assessment
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] flex items-center justify-between ${
            banner.tone === 'success'
              ? 'bg-[var(--primary)]/10 border-[var(--primary)]/25 text-[var(--primary)]'
              : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/25 text-[#FF6B6B]'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100 ml-3">
            ✕
          </button>
        </div>
      )}

      {clientsError && (
        <div className="rounded-xl border px-4 py-3 text-[13px] bg-[#F2AE55]/10 border-[#F2AE55]/25 text-[#F2AE55]">
          Client names may be unavailable: {clientsError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <Search size={15} />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by assessment name…"
            className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] pl-9 pr-3 py-2.5 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors"
          />
        </div>
        <select
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value as AssessmentLevel | '');
            setPage(1);
          }}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors"
        >
          <option value="">All levels</option>
          <option value="ENTRY">Entry</option>
          <option value="MID">Mid</option>
          <option value="TOP">Top</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AssessmentStatus | '');
            setPage(1);
          }}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
              <th className="px-5 py-3 font-medium">Assessment</th>
              <th className="px-5 py-3 font-medium">Client</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Company</th>}
              <th className="px-5 py-3 font-medium">Level</th>
              <th className="px-5 py-3 font-medium">Questions</th>
              <th className="px-5 py-3 font-medium">Duration</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  Loading assessments…
                </td>
              </tr>
            )}

            {!loading && loadError && (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} className="px-5 py-10 text-center text-[13px] text-[#FF6B6B]">
                  {loadError}
                </td>
              </tr>
            )}

            {!loading && !loadError && assessments.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  No assessments match these filters.
                </td>
              </tr>
            )}

            {!loading &&
              !loadError &&
              assessments.map((a) => {
                const client = clientMap.get(a.clientId);
                const total =
                    a.likertCount +
                    a.sjqCount +
                    a.forcedChoiceCount +
                    a.analyticalCount +
                    a.logicalReasoningCount;
                return (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
                          <ClipboardList size={14} />
                        </span>
                        <p className="text-[13.5px] text-[var(--foreground)] truncate max-w-[220px]">{a.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[var(--muted)]">
                      <span className="flex items-center gap-1.5">
                        <Users size={12} className="text-[var(--muted)]" />
                        {client?.name ?? '—'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-3 text-[13px] text-[var(--muted)]">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-[var(--muted)]" />
                          {companyMap.get(a.companyId) ?? '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <LevelBadge level={a.level} />
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className="flex flex-wrap items-center gap-2.5 text-[11.5px] text-[var(--muted)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                        title={`${a.likertCount} Likert · ${a.sjqCount} SJQ · ${a.forcedChoiceCount} Forced choice · ${a.analyticalCount} Analytical · ${a.logicalReasoningCount} Logical reasoning`}
                      >
                        <span className="flex items-center gap-1">
                          <ListChecks size={11} /> {a.likertCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessagesSquare size={11} /> {a.sjqCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shuffle size={11} /> {a.forcedChoiceCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList size={11} /> {a.analyticalCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 size={11} /> {a.logicalReasoningCount}
                        </span>
                        <span className="text-[var(--muted)]">({total})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {a.durationMinutes}m
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            setStatusTarget({
                              assessment: a,
                              next: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            })
                          }
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                            a.status === 'ACTIVE'
                              ? 'text-[var(--muted)] hover:text-[#F2AE55] hover:bg-[#F2AE55]/10'
                              : 'text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10'
                          }`}
                          aria-label={a.status === 'ACTIVE' ? `Deactivate ${a.name}` : `Activate ${a.name}`}
                        >
                          {a.status === 'ACTIVE' ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                          aria-label={`Edit ${a.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                          aria-label={`Delete ${a.name}`}
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
      </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)]">
          <p className="text-[12px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {rangeLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || loading}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12.5px] text-[var(--muted)] px-2" style={{ fontFamily: 'var(--font-mono)' }}>
              {meta.page} / {Math.max(1, meta.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={meta.page >= meta.totalPages || loading}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalMode && (
        <AssessmentFormModal
          mode={modalMode}
          assessment={activeAssessment}
          companies={companies}
          isSuperAdmin={isSuperAdmin}
          submitting={submitting}
          error={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {deleteTarget && (
        <AssessmentConfirmDialog
          title="Delete assessment?"
          description={`This will soft-delete "${deleteTarget.name}" and mark it inactive.`}
          confirmLabel="Delete assessment"
          tone="danger"
          submitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {statusTarget && (
        <AssessmentConfirmDialog
          title={statusTarget.next === 'ACTIVE' ? 'Activate assessment?' : 'Deactivate assessment?'}
          description={
            statusTarget.next === 'ACTIVE'
              ? `"${statusTarget.assessment.name}" will be marked active again.`
              : `"${statusTarget.assessment.name}" will be marked inactive.`
          }
          confirmLabel={statusTarget.next === 'ACTIVE' ? 'Activate' : 'Deactivate'}
          tone={statusTarget.next === 'ACTIVE' ? 'default' : 'danger'}
          submitting={togglingStatus}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </div>
  );
}