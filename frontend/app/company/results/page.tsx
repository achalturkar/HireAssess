"use client";

import { useEffect, useState } from "react";
import { assessmentResultsApi } from "@/src/lib/api-client";
import type { AssessmentResult, PaginationMeta, ResultsListQuery } from "@/src/lib/typess";
import { ResultsFilters } from "@/src/components/admin/resultsFilters";
import { ResultsTable } from "@/src/components/admin/resultsTable";
import { Pagination } from "@/src/components/admin/pagination";

const DEFAULT_QUERY: ResultsListQuery = { page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" };

export default function ResultsListPage() {
  const [query, setQuery] = useState<ResultsListQuery>(DEFAULT_QUERY);
  const [items, setItems] = useState<AssessmentResult[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    assessmentResultsApi
      .list(query)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load results");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber">Readiness Roster</p>
        <h1 className="font-display text-3xl text-ink">Assessment results</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every completed leadership-readiness assessment, scored across ten competencies.
        </p>
      </header>

      <div className="flex gap-8">
        <ResultsFilters query={query} onChange={setQuery} />

        <section className="flex-1">
          {error && (
            <p className="mb-4 rounded-md border border-band-low bg-band-low-bg px-3 py-2 text-sm text-band-low">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-paper-raised" />
              ))}
            </div>
          ) : (
            <>
              <ResultsTable items={items} />
              {meta && <Pagination meta={meta} onPageChange={(page) => setQuery((q) => ({ ...q, page }))} />}
            </>
          )}
        </section>
      </div>
    </main>
  );
}