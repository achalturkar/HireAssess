import type { TraitReportEntry } from "@/src/lib/typess";
import { bandStyles } from "@/src/lib/format";

export function TraitBar({ trait, score, band }: TraitReportEntry) {
  const styles = bandStyles[band];
  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{trait}</span>
        <span className={`font-mono text-sm ${styles.fg}`}>{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/50">
        <div
          className={`h-full rounded-full ${styles.fg.replace("text-", "bg-")}`}
          style={{ width: `${Math.max(2, score)}%` }}
        />
      </div>
    </div>
  );
}