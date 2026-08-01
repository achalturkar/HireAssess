import type { AssessmentReport, CandidateSummary } from "@/src/lib/typess";
import { BandBadge } from "@/src/components/ui/badges";
import { formatDate } from "@/src/lib/format";

const bandMessage: Record<AssessmentReport["overall"]["band"], string> = {
  High: "You're showing strong readiness across most leadership competencies.",
  Moderate: "You're building solid ground — a few areas are ready now, others are close.",
  Low: "This is a starting point. The breakdown below shows exactly where to focus next.",
};

export function CandidateReportHeader({
  candidate,
  report,
  generatedAt,
}: {
  candidate: CandidateSummary;
  report: AssessmentReport;
  generatedAt: string;
}) {
  return (
    <header className="border-b border-line pb-8">
      <p className="font-mono text-xs uppercase tracking-widest text-amber">Your Readiness Report</p>
      <h1 className="mt-1 font-display text-3xl text-ink">
        {candidate.firstName}, here's how you scored
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">{bandMessage[report.overall.band]}</p>

      <div className="mt-6 flex items-center gap-4">
        <div className="font-mono text-5xl text-ink">{report.overall.score}</div>
        <div>
          <BandBadge band={report.overall.band} />
          <p className="mt-1 text-xs text-ink-muted">Generated {formatDate(generatedAt)}</p>
        </div>
      </div>
    </header>
  );
}