"use client";

import { useEffect, useMemo, useState } from "react";
import { assessmentResultsApi } from "@/src/lib/api-client";
import type { CandidateResultDetail, QuestionAnswerPair } from "@/src/lib/typess";
import { CandidateReportHeader } from "@/src/components/candidate/candidateReportHeader";
import { QuestionAnswerCard } from "@/src/components/candidate/questionAnswerCard";
import { TraitRadar } from "@/src/components/ui/traitRadar";
import { TraitBar } from "@/src/components/ui/traitBar";

function groupByCategory(pairs: QuestionAnswerPair[]) {
  const groups: Record<string, QuestionAnswerPair[]> = {};
  for (const pair of pairs) {
    const key = pair.question.category;
    (groups[key] ||= []).push(pair);
  }
  return groups;
}

export default function CandidateResultPage({ params }: { params: { attemptId: string } }) {
  const [detail, setDetail] = useState<CandidateResultDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assessmentResultsApi
      .getCandidateResult(params.attemptId)
      .then(setDetail)
      .catch((err) => setError(err.message ?? "Could not load your report"));
  }, [params.attemptId]);

  const grouped = useMemo(() => (detail ? groupByCategory(detail.questions) : {}), [detail]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="rounded-md border border-band-low bg-band-low-bg px-3 py-2 text-sm text-band-low">{error}</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-lg bg-paper-raised" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <CandidateReportHeader
        candidate={detail.candidate}
        report={detail.report}
        generatedAt={detail.report.generatedAt}
      />

      <section className="mt-8 flex justify-center rounded-lg border border-line bg-paper-raised p-4">
        <TraitRadar traits={detail.report.traits} />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink">Where you stand, competency by competency</h2>
        <div className="mt-2 divide-y divide-line/60">
          {detail.report.traits.map((t) => (
            <TraitBar key={t.trait} {...t} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink">Your responses</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Grouped by competency, in case you want to see what shaped each score.
        </p>

        <div className="mt-4 space-y-8">
          {Object.entries(grouped).map(([category, pairs]) => (
            <div key={category}>
              <h3 className="font-mono text-xs uppercase tracking-wide text-amber">{category}</h3>
              <div>
                {pairs.map((pair) => (
                  <QuestionAnswerCard key={pair.question.id} {...pair} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}