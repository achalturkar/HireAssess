'use client';

import { cn } from '@/src/lib/utils';

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

// The platform's signature visual: every score in HireAssess — overall,
// per-section, per-client average — renders as this arc rather than a
// generic linear progress bar, so the shape itself becomes recognizable
// as "a HireAssess score" wherever it appears.
export function ScoreRing({ value, size = 88, strokeWidth = 8, label, className }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const tone = clamped >= 70 ? 'text-status-strong' : clamped >= 40 ? 'text-status-moderate' : 'text-status-low';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ '--ring-full': circumference, '--ring-offset': offset } as React.CSSProperties}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className={cn('animate-ring-fill', tone)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-lg font-semibold tabular text-slate-900 dark:text-slate-100">{Math.round(clamped)}</span>
        {label && <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
