'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/src/lib/auth-context';
import { getInitials, cn } from '@/src/lib/utils';
import Link from 'next/link';

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
          {getInitials(user.name)}
        </div>
      </button>
      {open && (
        <div
          className={cn(
            'absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-card animate-fade-in',
            'dark:border-slate-800 dark:bg-slate-900',
          )}
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-status-low hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
