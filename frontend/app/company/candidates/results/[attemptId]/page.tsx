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

function stageForScore(score: number) {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Strong Fit';
  if (score >= 60) return 'Good Fit';
  if (score >= 50) return 'Potential Fit';
  return 'Needs Development';
}

const RANGE_SEGMENTS = [
  { label: 'Needs Development', range: '0–49', color: '#FF6B6B', width: '50%' },
  { label: 'Potential Fit', range: '50–59', color: '#F2AE55', width: '10%' },
  { label: 'Good Fit', range: '60–79', color: '#6CB4FF', width: '20%' },
  { label: 'Strong Fit', range: '80–89', color: '#3FDCC0', width: '10%' },
  { label: 'Outstanding', range: '90–100', color: '#0EB673', width: '10%' },
];

function OverallScoreDisplay({ score }: { score: number }) {
  const stage = stageForScore(score);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);
  const segmentColor = score >= 90 ? '#0EB673' : score >= 80 ? '#3FDCC0' : score >= 60 ? '#6CB4FF' : score >= 50 ? '#F2AE55' : '#FF6B6B';

  return (
    <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-6">
      <div className="grid gap-6 md:grid-cols-[180px_1fr] items-center">
        <div className="relative mx-auto h-[180px] w-[180px]">
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={segmentColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${offset}`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-semibold text-ink">{score}</span>
            <span className="mt-1 text-xs uppercase tracking-[0.24em] text-ink-muted">{stage}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Overall score</p>
            <p className="text-sm text-ink-muted mt-1">This section shows your overall readiness and how your score falls within the assessment bands.</p>
          </div>
          <div className="rounded-full overflow-hidden border border-line bg-white/[0.04]">
            <div className="flex h-3">
              {RANGE_SEGMENTS.map((segment) => (
                <div key={segment.label} className="h-full" style={{ width: segment.width, backgroundColor: segment.color }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
            {RANGE_SEGMENTS.map((segment) => (
              <div key={segment.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
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

      <OverallScoreDisplay score={detail.report.overall.score} />

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