import { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

type BadgeTone = 'strong' | 'moderate' | 'low' | 'neutral';

const tones: Record<BadgeTone, string> = {
  strong: 'bg-emerald-50 text-status-strong dark:bg-emerald-500/10',
  moderate: 'bg-amber-50 text-status-moderate dark:bg-amber-500/10',
  low: 'bg-rose-50 text-status-low dark:bg-rose-500/10',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}
      {...props}
    />
  );
}
