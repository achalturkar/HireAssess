import Link from "next/link";
import type { AssessmentResult } from "@/src/lib/typess";
import { candidateName, formatDate, scoreBand } from "@/src/lib/format";
import { BandBadge } from "@/src/components/ui/badges";

export function ResultsTable({ items }: { items: AssessmentResult[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
        <p className="font-display text-lg text-ink">No results match these filters</p>
        <p className="mt-1 text-sm text-ink-muted">Widen the score range or clear a filter to see more of the roster.</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
          <th className="py-2 pr-4 font-medium">Candidate</th>
          <th className="py-2 pr-4 font-medium">Overall</th>
          <th className="py-2 pr-4 font-medium">Band</th>
          <th className="py-2 pr-4 font-medium">Assessed</th>
          <th className="py-2 font-medium" />
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id} className="border-b border-line/70 hover:bg-paper-raised">
            <td className="py-3 pr-4">
              <div className="font-medium text-ink">{candidateName(r.candidate)}</div>
              <div className="text-xs text-ink-muted">{r.candidate?.email}</div>
            </td>
            <td className="py-3 pr-4 font-mono text-ink">{r.overallScore}</td>
            <td className="py-3 pr-4">
              <BandBadge band={r.report?.overall?.band ?? scoreBand(r.overallScore)} />
            </td>
            <td className="py-3 pr-4 text-ink-muted">{formatDate(r.createdAt)}</td>
            <td className="py-3 text-right">
              <Link href={`/results/${r.id}`} className="text-pine underline underline-offset-4 hover:decoration-2">
                View report
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}