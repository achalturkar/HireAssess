import { InputHTMLAttributes, forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300', className)} {...props} />
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div>
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm',
        'placeholder:text-slate-400 transition-colors',
        'focus:border-indigo-500 focus:outline-none',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
        error && 'border-status-low focus:border-status-low',
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-status-low">{error}</p>}
  </div>
));
Input.displayName = 'Input';
