import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AssessmentResult } from "@/src/lib/typess";
import { candidateName, formatDate, scoreBand } from "@/src/lib/format";
import { BandBadge } from "@/src/components/ui/badges";

export function ResultsTable({ items }: { items: AssessmentResult[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper-raised/50 py-16 text-center">
        <p className="font-display text-lg text-ink">No results match these filters</p>
        <p className="mt-1 text-sm text-ink-muted">Adjust the search text or clear the filters to see more of the roster.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised/70 shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-paper/60 text-left text-xs uppercase tracking-[0.24em] text-ink-muted">
            <th className="px-4 py-3 font-medium">Candidate</th>
            <th className="px-4 py-3 font-medium">Assessment</th>
            <th className="px-4 py-3 font-medium">Overall</th>
            <th className="px-4 py-3 font-medium">Band</th>
            <th className="px-4 py-3 font-medium">Completed</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const band = r.report?.overall?.band ?? scoreBand(r.overallScore);
            return (
              <tr
                key={r.id}
                className="cursor-pointer border-b border-line/70 transition hover:bg-paper"
                onClick={() => router.push(`/company/results/${r.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{candidateName(r.candidate)}</div>
                  <div className="text-xs text-ink-muted">{r.candidate?.email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted">
                  {"Completed assessment"}
                </td>
                <td className="px-4 py-3 font-mono text-ink">{r.overallScore}</td>
                <td className="px-4 py-3">
                  <BandBadge band={band} />
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/company/results/${r.id}`} className="text-pine underline underline-offset-4 hover:decoration-2">
                    View report
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}