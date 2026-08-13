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

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Menu items grouped by what they're used for, rather than one flat list —
// each group gets its own small uppercase label (hidden when collapsed).
const menuGroups: { label: string; items: { name: string; href: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Workspace',
    items: [{ name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Engagement',
    items: [
      { name: 'Clients', href: '/company/clients', icon: Users },
      { name: 'Candidates', href: '/company/candidates', icon: Contact },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { name: 'Assessments', href: '/company/assessments', icon: ClipboardList },
      { name: 'Results', href: '/company/results', icon: BarChart3 },
      // { name: 'Question Bank', href: '/company/question-bank', icon: BookOpen },
      // { name: 'Schedules', href: '/company/schedules', icon: CalendarClock },
      // { name: 'Reports', href: '/company/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Organization',
    items: [
      { name: 'Company Profile', href: '/company/profile', icon: UserCircle },
      { name: 'Users', href: '/company/users', icon: Users },
      { name: 'Roles', href: '/company/roles', icon: ShieldCheck },
      { name: 'Settings', href: '/company/settings', icon: Settings },
    ],
  },
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
  const companyName = user?.company?.name;

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
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p
                className="px-3 mb-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {group.label}
              </p>
            ) : (
              <div className="mx-3 mb-2 border-t border-[var(--border)] first:border-t-0 first:mt-0" />
            )}
            <div className="space-y-1">
              {group.items.map((menu) => {
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
                      active
                        ? 'bg-[var(--primary)]/[0.12] text-[var(--primary)]'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'} />
                    {!collapsed && <span className="truncate">{menu.name}</span>}
                    {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Company badge + collapse toggle */}
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        {companyName && (
          <div className={`flex items-center gap-2.5 px-2 py-2 mb-1 ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 bg-[var(--primary)]/15 text-[var(--primary)]">
              {initials(companyName)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Company
                </p>
                <p className="text-[13px] text-[var(--foreground)] truncate mt-0.5">{companyName}</p>
              </div>
            )}
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