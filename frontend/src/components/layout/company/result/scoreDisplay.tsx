import type { ScoreBand, ScoreStage } from '@/src/types/assessment-result';

const BAND_STYLES: Record<ScoreBand, string> = {
  High: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
  Moderate: 'bg-[#F2AE55]/15 text-[#F2AE55]',
  Low: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
};

const BAND_BAR: Record<ScoreBand, string> = {
  High: 'bg-[#3FDCC0]',
  Moderate: 'bg-[#F2AE55]',
  Low: 'bg-[#FF6B6B]',
};

export function bandFor(score: number): ScoreBand {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

export function stageFor(score: number): ScoreStage {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Strong Fit';
  if (score >= 60) return 'Good Fit';
  if (score >= 50) return 'Potential Fit';
  return 'Needs Development';
}

export function ScoreBadge({ score, band }: { score: number; band?: ScoreBand }) {
  const resolvedBand = band ?? bandFor(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${BAND_STYLES[resolvedBand]}`}
    >
      {score}
      <span className="opacity-70">·</span>
      {resolvedBand}
    </span>
  );
}

export function ScoreStageBadge({ stage }: { stage: ScoreStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#F2F4FA]">
      {stage}
    </span>
  );
}

export function TraitBar({ trait, score, band }: { trait: string; score: number; band?: ScoreBand }) {
  const resolvedBand = band ?? bandFor(score);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12.5px] text-[#AAB2D4]">{trait}</span>
        <span className="text-[11.5px] text-[#8891B8]" style={{ fontFamily: 'var(--font-mono)' }}>
          {score}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${BAND_BAR[resolvedBand]} transition-all duration-300`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}