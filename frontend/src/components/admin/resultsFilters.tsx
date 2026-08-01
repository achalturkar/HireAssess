"use client";

import type { ResultsListQuery } from "@/src/lib/typess";

interface Props {
  query: ResultsListQuery;
  onChange: (next: ResultsListQuery) => void;
}

export function ResultsFilters({ query, onChange }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-line pr-6">
      <h2 className="font-display text-sm uppercase tracking-wide text-ink-muted">Filter roster</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="candidateId">
            Candidate ID
          </label>
          <input
            id="candidateId"
            className="w-full rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
            value={query.candidateId ?? ""}
            onChange={(e) => onChange({ ...query, candidateId: e.target.value || undefined, page: 1 })}
            placeholder="uuid"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="assessmentId">
            Assessment ID
          </label>
          <input
            id="assessmentId"
            className="w-full rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
            value={query.assessmentId ?? ""}
            onChange={(e) => onChange({ ...query, assessmentId: e.target.value || undefined, page: 1 })}
            placeholder="uuid"
          />
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-ink-muted">Overall score range</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              value={query.minScore ?? ""}
              onChange={(e) =>
                onChange({ ...query, minScore: e.target.value ? Number(e.target.value) : undefined, page: 1 })
              }
              placeholder="Min"
            />
            <span className="text-ink-muted">–</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              value={query.maxScore ?? ""}
              onChange={(e) =>
                onChange({ ...query, maxScore: e.target.value ? Number(e.target.value) : undefined, page: 1 })
              }
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="sortBy">
            Sort by
          </label>
          <div className="flex gap-2">
            <select
              id="sortBy"
              className="w-full rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              value={query.sortBy ?? "createdAt"}
              onChange={(e) => onChange({ ...query, sortBy: e.target.value as ResultsListQuery["sortBy"] })}
            >
              <option value="createdAt">Date</option>
              <option value="overallScore">Score</option>
            </select>
            <select
              className="rounded-md border border-line bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              value={query.sortOrder ?? "desc"}
              onChange={(e) => onChange({ ...query, sortOrder: e.target.value as ResultsListQuery["sortOrder"] })}
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </div>

        <button
          className="text-xs text-pine underline decoration-line underline-offset-4 hover:decoration-pine"
          onClick={() => onChange({ page: 1, limit: query.limit, sortBy: "createdAt", sortOrder: "desc" })}
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}