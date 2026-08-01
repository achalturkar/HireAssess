"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assessmentResultsApi } from "@/src/lib/api-client";
import type { AssessmentResult } from "@/src/lib/typess";
import { BandBadge } from "@/src/components/ui/badges";
import { TraitRadar } from "@/src/components/ui/traitRadar";
import { TraitBar } from "@/src/components/ui/traitBar";
import { candidateName, formatDate } from "@/src/lib/format";

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assessmentResultsApi
      .getById(params.id)
      .then(setResult)
      .catch((err) => setError(err.message ?? "Could not load this result"));
  }, [params.id]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="rounded-md border border-band-low bg-band-low-bg px-3 py-2 text-sm text-band-low">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-lg bg-paper-raised" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/results" className="text-sm text-pine underline underline-offset-4">
        ← Back to roster
      </Link>

      <header className="mt-4 flex items-start justify-between border-b border-line pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Readiness Scorecard</p>
          <h1 className="font-display text-3xl text-ink">{candidateName(result.candidate)}</h1>
          <p className="mt-1 text-sm text-ink-muted">{result.candidate?.email}</p>
          <p className="mt-1 text-xs text-ink-muted">Assessed {formatDate(result.createdAt)}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-4xl text-ink">{result.overallScore}</div>
          <BandBadge band={result.report.overall.band} />
        </div>
      </header>

      <section className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-lg border border-line bg-paper-raised p-4">
          <TraitRadar traits={result.report.traits} />
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Competency breakdown</h2>
          <div className="mt-2 divide-y divide-line/60">
            {result.report.traits.map((t) => (
              <TraitBar key={t.trait} {...t} />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10 flex justify-end">
        <Link
          href={`/candidate/results/${result.attemptId}`}
          className="rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper-raised hover:bg-pine-strong"
        >
          View candidate-facing report
        </Link>
      </div>
    </main>
  );
}