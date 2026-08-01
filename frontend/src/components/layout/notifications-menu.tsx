'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Notifications are wired to a real endpoint (GET /notifications) once the
// backend exists; the empty state below is what renders honestly until
// then, rather than a list of fabricated sample notifications.
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Bell className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-1 shadow-card animate-fade-in',
            'dark:border-slate-800 dark:bg-slate-900',
          )}
        >
          <div className="px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</div>
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Bell className="h-6 w-6 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">You&apos;re all caught up</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">New activity on your assessments will show up here</p>
          </div>
        </div>
      )}
    </div>
  );
}
