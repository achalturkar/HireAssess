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
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';

const menus = [
  { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
    { name: 'Client', href: '/company/clients', icon: Users },
  { name: 'Users', href: '/company/users', icon: Users },
  { name: 'Roles', href: '/company/roles', icon: ShieldCheck },
  { name: 'Candidates', href: '/company/candidates', icon: Contact },
  { name: 'Question Bank', href: '/company/question-bank', icon: BookOpen },
  { name: 'Assessments', href: '/company/assessments', icon: ClipboardList },
  { name: 'Schedules', href: '/company/schedules', icon: CalendarClock },
  { name: 'Reports', href: '/company/reports', icon: BarChart3 },
  { name: 'Settings', href: '/company/settings', icon: Settings },
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
    <div className="flex h-full flex-col bg-[#0E1226]">
      {/* Logo row */}
      <div className={`flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/[0.08] ${collapsed ? 'justify-center px-0' : ''}`}>
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
        <button onClick={onCloseMobile} className="ml-auto md:hidden text-[#8891B8] hover:text-white" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
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
                active ? 'bg-[#3FDCC0]/[0.12] text-[#3FDCC0]' : 'text-[#AAB2D4] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-[#3FDCC0]' : 'text-[#6C76A6] group-hover:text-white'} />
              {!collapsed && <span className="truncate">{menu.name}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3FDCC0]" />}
            </Link>
          );
        })}
      </nav>

      {/* Company badge + collapse toggle */}
      <div className="shrink-0 border-t border-white/[0.08] p-3">
        {!collapsed && user?.company?.name && (
          <div className="px-2 py-2 mb-1">
            <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
              Company
            </p>
            <p className="text-[13px] text-[#F2F4FA] truncate mt-0.5">{user.company.name}</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[12px] text-[#8891B8] hover:bg-white/[0.05] hover:text-white transition-colors"
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
        className={`hidden md:block shrink-0 border-r border-white/[0.08] transition-[width] duration-200 ${
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