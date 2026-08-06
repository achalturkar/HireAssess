'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';

function titleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || 'dashboard';
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CompanyNavbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 md:px-6 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <button onClick={onOpenMobileMenu} className="md:hidden text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Open menu">
        <Menu size={22} />
      </button>

      <h1 className="text-[15px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
        {titleFromPath(pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg pl-2 pr-2.5 py-1.5 hover:bg-[var(--surface-muted)] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-[12px] font-semibold flex items-center justify-center shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {initials || '—'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] text-[var(--foreground)] leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-[var(--muted)] leading-tight">{user?.role?.name}</p>
            </div>
            <ChevronDown size={14} className={`text-[#8891B8] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-[13px] font-medium text-[var(--foreground)] truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[12px] text-[var(--muted)] truncate">{user?.email}</p>
              </div>
              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors">
                <Settings size={16} />
                Account settings
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#FF6B6B] hover:bg-[#FF6B6B]/[0.08] transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}