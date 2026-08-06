'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Contact,
  BookOpen,
  ClipboardList,
  CalendarClock,
  BarChart3,
  Settings,
  ChevronLeft,
  X,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';

const menus = [
  { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
  { name: 'Client', href: '/company/clients', icon: Users },
  { name: 'Assessments', href: '/company/assessments', icon: ClipboardList },
  { name: 'Candidates', href: '/company/candidates', icon: Contact },
  { name: 'Results', href: '/company/results', icon: BarChart3 },
  { name: 'Company Profile', href: '/company/profile', icon: UserCircle },
  { name: 'Question Bank', href: '/company/question-bank', icon: BookOpen },
  { name: 'Schedules', href: '/company/schedules', icon: CalendarClock },
  { name: 'Reports', href: '/company/reports', icon: BarChart3 },
  { name: 'Settings', href: '/company/settings', icon: Settings },
  { name: 'Users', href: '/company/users', icon: Users },
  { name: 'Roles', href: '/company/roles', icon: ShieldCheck },
];

interface CompanySidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function CompanySidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: CompanySidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const content = (
    <div className="flex h-full flex-col bg-[var(--surface)] text-[var(--foreground)]">
      {/* Logo row */}
      <div className={`flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-[var(--border)] ${collapsed ? 'justify-center px-0' : ''}`}>
        <svg width="26" height="26" viewBox="0 0 30 30" fill="none" className="shrink-0">
          <rect x="3" y="12" width="7" height="15" rx="2" fill="#3FDCC0" />
          <rect x="12.5" y="4" width="7" height="23" rx="2" fill="#F2AE55" />
          <rect x="22" y="9" width="5" height="18" rx="2" fill="#3FDCC0" opacity="0.55" />
        </svg>
        {!collapsed && (
          <span className="text-[16px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            HireAssess
          </span>
        )}
        <button onClick={onCloseMobile} className="ml-auto md:hidden text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            Workspace
          </p>
        )}
        {menus.map((menu) => {
          const active = pathname === menu.href;
          const Icon = menu.icon;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={onCloseMobile}
              title={collapsed ? menu.name : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active ? 'bg-[var(--primary)]/[0.12] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={18} className={active ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'} />
              {!collapsed && <span className="truncate">{menu.name}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Company badge + collapse toggle */}
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        {!collapsed && user?.company?.name && (
          <div className="px-2 py-2 mb-1">
            <p className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
              Company
            </p>
            <p className="text-[13px] text-[var(--foreground)] truncate mt-0.5">{user.company.name}</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden md:block sticky top-0 h-screen shrink-0 border-r border-[var(--border)] transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}