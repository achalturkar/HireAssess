"use client";

import type { ResultsListQuery } from "@/src/lib/typess";

interface Props {
  query: ResultsListQuery;
  onChange: (next: ResultsListQuery) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  bandFilter: "all" | "High" | "Moderate" | "Low";
  onBandChange: (value: "all" | "High" | "Moderate" | "Low") => void;
}

export function ResultsFilters({
  query,
  onChange,
  searchTerm,
  onSearchChange,
  bandFilter,
  onBandChange,
}: Props) {
  return (
    <aside className="w-full max-w-xs shrink-0 rounded-2xl border border-line bg-paper-raised/70 p-5 shadow-sm lg:w-72">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber">Find candidate</p>
          <h2 className="mt-1 font-display text-base text-ink">Filter roster</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="candidateName">
            Search by name
          </label>
          <input
            id="candidateName"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Candidate name"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="bandFilter">
            Band
          </label>
          <select
            id="bandFilter"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
            value={bandFilter}
            onChange={(e) => onBandChange(e.target.value as "all" | "High" | "Moderate" | "Low")}
          >
            <option value="all">All bands</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-ink-muted">Score range</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
              value={query.minScore ?? ""}
              onChange={(e) => onChange({ ...query, minScore: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              placeholder="Min"
            />
            <span className="text-ink-muted">–</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
              value={query.maxScore ?? ""}
              onChange={(e) => onChange({ ...query, maxScore: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
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
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
              value={query.sortBy ?? "createdAt"}
              onChange={(e) => onChange({ ...query, sortBy: e.target.value as ResultsListQuery["sortBy"] })}
            >
              <option value="createdAt">Recent</option>
              <option value="overallScore">Score</option>
            </select>
            <select
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-pine"
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
          onClick={() => {
            onSearchChange("");
            onBandChange("all");
            onChange({ page: 1, limit: query.limit, sortBy: "createdAt", sortOrder: "desc" });
          }}
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}