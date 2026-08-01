import { bandStyles } from "@/src/lib/format";
import type { ScoreBand } from "@/src/lib/typess";

export function BandBadge({ band, score }: { band: ScoreBand; score?: number }) {
  const styles = bandStyles[band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles.fg} ${styles.bg}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {band}
      {score !== undefined && <span className="font-mono">{score}</span>}
    </span>
  );
}