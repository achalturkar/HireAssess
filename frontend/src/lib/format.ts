import type { ScoreBand } from "./typess";

/** Mirrors scoreBand() in assessment-result.services.js — keep in sync. */
export function scoreBand(value: number): ScoreBand {
  if (value >= 80) return "High";
  if (value >= 50) return "Moderate";
  return "Low";
}

export const bandStyles: Record<ScoreBand, { fg: string; bg: string }> = {
  High: { fg: "text-band-high", bg: "bg-band-high-bg" },
  Moderate: { fg: "text-band-moderate", bg: "bg-band-moderate-bg" },
  Low: { fg: "text-band-low", bg: "bg-band-low-bg" },
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function candidateName(c?: { firstName: string; lastName: string } | null): string {
  if (!c) return "Unknown candidate";
  return `${c.firstName} ${c.lastName}`.trim();
}