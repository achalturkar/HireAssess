'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import CandidatePicker from '@/src/components/layout/company/candidate/CandidatePicker';
import { ScoreBadge } from '@/src/components/layout/company/result/scoreDisplay';
import { listResults, ApiError } from '@/src/lib/api/assessment-results';
import { listAssessments } from '@/src/lib/api/assessments';
import type { AssessmentResult, PaginationMeta } from '@/src/types/assessment-result';
import type { Assessment } from '@/src/types/assessment';

const PAGE_SIZE = 10;

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AssessmentResultsPage() {
  const { accessToken } = useAuth();

  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [candidateId, setCandidateId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [minScoreInput, setMinScoreInput] = useState('');
  const [maxScoreInput, setMaxScoreInput] = useState('');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [maxScore, setMaxScore] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Debounce the score-range inputs before they hit the query
  useEffect(() => {
    const t = setTimeout(() => {
      const min = minScoreInput.trim() ? Number(minScoreInput) : undefined;
      const max = maxScoreInput.trim() ? Number(maxScoreInput) : undefined;
      setMinScore(Number.isFinite(min as number) ? min : undefined);
      setMaxScore(Number.isFinite(max as number) ? max : undefined);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [minScoreInput, maxScoreInput]);

  useEffect(() => {
    listAssessments({ page: 1, limit: 200, sortBy: 'name', sortOrder: 'asc' }, accessToken)
      .then((res) => setAssessments(res.items))
      .catch(() => setAssessments([]));
  }, [accessToken]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listResults(
        {
          page,
          limit: PAGE_SIZE,
          candidateId: candidateId || undefined,
          assessmentId: assessmentId || undefined,
          minScore,
          maxScore,
          sortBy: 'createdAt',
          sortOrder,
        },
        accessToken,
      );
      setResults(res.items);
      setMeta(res.meta);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load results';
      console.error('Assessment results page failed to load', {
        message,
        error: err,
        page,
        candidateId,
        assessmentId,
        minScore,
        maxScore,
        sortOrder,
        accessToken: accessToken ? '[present]' : '[missing]',
      });
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [page, candidateId, assessmentId, minScore, maxScore, sortOrder, accessToken]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const rangeLabel = useMemo(() => {
    if (meta.total === 0) return '0 results';
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `${start}–${end} of ${meta.total}`;
  }, [meta]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <p
          className="text-[11px] uppercase tracking-[0.14em] text-[var(--primary)] mb-1.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Scoring &amp; Reports
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
          Assessment Results
        </h1>
        <p className="text-[13.5px] text-[var(--muted)] mt-1">Review scored outcomes for completed attempts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[240px]">
          <CandidatePicker
            accessToken={accessToken}
            value={candidateId}
            placeholder="Filter by candidate…"
            onChange={(id) => {
              setCandidateId(id);
              setPage(1);
            }}
          />
        </div>
        <select
          value={assessmentId}
          onChange={(e) => {
            setAssessmentId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors h-[42px]"
        >
          <option value="">All assessments</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <div className="relative w-24">
            <input
              type="number"
              min={0}
              max={100}
              value={minScoreInput}
              onChange={(e) => setMinScoreInput(e.target.value)}
              placeholder="Min"
              className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors h-[42px]"
            />
          </div>
          <span className="text-[var(--muted)] text-[12px]">–</span>
          <div className="relative w-24">
            <input
              type="number"
              min={0}
              max={100}
              value={maxScoreInput}
              onChange={(e) => setMaxScoreInput(e.target.value)}
              placeholder="Max"
              className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]/50 transition-colors h-[42px]"
            />
          </div>
        </div>
        <button
          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 h-[42px] px-3 rounded-lg border border-[var(--border)] text-[12.5px] text-[var(--muted)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          <SlidersHorizontal size={13} />
          {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-5 py-3 font-medium">Overall</th>
              <th className="px-5 py-3 font-medium">Top traits</th>
              <th className="px-5 py-3 font-medium">Scored</th>
              <th className="px-5 py-3 font-medium text-right">Report</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  Loading results…
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

            {!loading && !loadError && results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
                  No results match these filters.
                </td>
              </tr>
            )}

            {!loading &&
              !loadError &&
              results.map((r, i) => {
                const topTraits = [...r.report.traits].sort((a, b) => b.score - a.score).slice(0, 3);
                return (
                  <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                            i % 2 === 0 ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
                          }`}
                        >
                          {r.candidate ? initials(r.candidate.firstName, r.candidate.lastName) : '?'}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/company/candidates/${r.candidate?.id ?? ''}`} className="text-[13.5px] text-[var(--foreground)] truncate hover:text-[var(--primary)] transition-colors">
                            {r.candidate ? `${r.candidate.firstName} ${r.candidate.lastName}` : 'Unknown candidate'}
                          </Link>
                          <p className="text-[11.5px] text-[var(--muted)] truncate">{r.candidate?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <ScoreBadge score={r.overallScore} band={r.report.overall.band} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {topTraits.length === 0 && <span className="text-[12px] text-[var(--muted)]">—</span>}
                        {topTraits.map((t) => (
                          <span
                            key={t.trait}
                            className="text-[11px] text-[var(--muted)] bg-[var(--surface-muted)] rounded-full px-2 py-1"
                            title={`${t.trait}: ${t.score}`}
                          >
                            {t.trait}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/company/results/${r.attemptId}`}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                      >
                        <FileText size={13} />
                        View
                      </Link>
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
    </div>
  );
}