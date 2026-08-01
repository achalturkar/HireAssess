'use client';

import { Search } from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationsMenu } from './notifications-menu';
import { ProfileMenu } from './profile-menu';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <Breadcrumbs />

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search candidates, tests, clients…"
            className="h-9 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-900"
          />
        </div>
        <ThemeToggle />
        <NotificationsMenu />
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <ProfileMenu />
      </div>
    </header>
  );
}
