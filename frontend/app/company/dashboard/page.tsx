'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Contact,
  ClipboardList,
  CheckCircle2,
  Layers,
  Percent,
  ArrowRight,
  Settings as SettingsIcon,
  FileBarChart,
  ShieldCheck,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/src/auth/AuthProvider';
import { getCompanyStats } from '@/src/lib/api/companies';

/* ------------------------------------------------------------------
   Theme tokens — every color pairs a light-mode value with a
   dark: override so the page works whichever mode the toggle in the
   header sets. Assumes Tailwind's class-based dark mode (a `dark`
   class on <html>), which is what a sun/moon toggle almost always
   drives. If your toggle uses something else, swap `useIsDarkMode`
   below for whatever your theme provider exposes.
------------------------------------------------------------------- */

const card = 'bg-white dark:bg-[#161C3A] border border-slate-200 dark:border-white/[0.08]';
const cardBorderB = 'border-slate-200 dark:border-white/[0.08]';
const textPrimary = 'text-slate-900 dark:text-[#F2F4FA]';
const textMuted = 'text-slate-500 dark:text-[#8891B8]';
const textFaint = 'text-slate-400 dark:text-[#565F8C]';
const divide = 'divide-slate-100 dark:divide-white/[0.06]';
const skeleton = 'bg-slate-200 dark:bg-white/[0.06] animate-pulse rounded';

const tealChip = 'bg-[#3FDCC0]/10 dark:bg-[#3FDCC0]/15 text-[#0E8C78] dark:text-[#3FDCC0]';
const amberChip = 'bg-[#F2AE55]/10 dark:bg-[#F2AE55]/15 text-[#A6650F] dark:text-[#F2AE55]';
const tealBadge = 'bg-[#3FDCC0]/10 dark:bg-[#3FDCC0]/15 text-[#0E8C78] dark:text-[#3FDCC0]';
const dangerBadge = 'bg-[#FF6B6B]/10 dark:bg-[#FF6B6B]/15 text-[#C23B3B] dark:text-[#FF6B6B]';

const CHART_COLORS = ['#3FDCC0', '#F2AE55', '#FF6B6B', '#8891B8'];

/* ------------------------------------------------------------------
   Reads the `dark` class off <html> so recharts (which needs real
   hex values, not Tailwind classes, for its inline SVG styles) can
   follow the same toggle everything else uses.
------------------------------------------------------------------- */

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface CompanyStats {
  users?: number;
  clients?: number;
  candidates?: number;
  assessments?: number;
  totalAttempts?: number;
  completedAttempts?: number;
  results?: number;
  // Not returned by getCompanyStats today — wire these up on the backend
  // when available and the two extra charts below will light up on their
  // own, no component changes needed.
  usersByRole?: { name: string; value: number }[];
  clientsByStatus?: { name: string; value: number }[];
}

const QUICK_LINKS: { label: string; href: string; description: string; icon: LucideIcon }[] = [
  { label: 'Clients', href: '/company/clients', description: 'Manage client accounts', icon: Contact },
  { label: 'Users', href: '/company/users', description: 'Team members & roles', icon: Users },
  { label: 'Assessments', href: '/company/assessments', description: 'Create & edit tests', icon: ClipboardList },
  { label: 'Reports', href: '/company/reports', description: 'Results & analytics', icon: FileBarChart },
  { label: 'Settings', href: '/company/settings', description: 'Workspace configuration', icon: SettingsIcon },
];

export default function CompanyDashboardPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = useIsDarkMode();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (!user?.company?.id || !accessToken) return;
        const s = await getCompanyStats(user.company.id, accessToken);
        if (mounted) setStats(s);
      } catch {
        // dashboard falls back to empty/placeholder states below
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.company?.id, accessToken]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const completionRate = useMemo(() => {
    if (!stats?.totalAttempts) return null;
    return Math.round(((stats.completedAttempts ?? 0) / stats.totalAttempts) * 100);
  }, [stats]);

  // Derived entirely from the four counts the existing API already
  // returns — no backend changes required for this chart to be real.
  const compositionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Users', value: stats.users ?? 0 },
      { name: 'Clients', value: stats.clients ?? 0 },
      { name: 'Candidates', value: stats.candidates ?? 0 },
      { name: 'Assessments', value: stats.assessments ?? 0 },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Also derived from existing fields (totalAttempts / completedAttempts).
  const attemptStatusData = useMemo(() => {
    if (!stats?.totalAttempts) return [];
    const completed = stats.completedAttempts ?? 0;
    const pending = Math.max(stats.totalAttempts - completed, 0);
    return [
      { name: 'Completed', value: completed },
      { name: 'Pending', value: pending },
    ].filter((d) => d.value > 0);
  }, [stats]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Company Overview
          </p>
          <h1
            className={`text-[26px] font-semibold tracking-tight `}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className={`text-[13.5px] mt-1 ${textMuted}`}>{today}</p>
        </div>
        {completionRate !== null && (
          <div className={`rounded-2xl px-4 py-3 text-[13px] shrink-0 ${card}`}>
            <span className={`flex items-center gap-1.5 text-[11px] ${textMuted}`}>
              <Percent size={11} /> Completion rate
            </span>
            <span className={`text-[20px] font-semibold ${textPrimary}`}>{completionRate}%</span>
          </div>
        )}
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group rounded-2xl p-4 hover:border-[#3FDCC0]/40 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors ${card}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${tealChip}`}>
              <link.icon size={15} />
            </div>
            <p className={`text-[13px] font-medium flex items-center gap-1 ${textPrimary}`}>
              {link.label}
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className={`text-[11px] mt-0.5 ${textFaint}`}>{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.users} icon={Users} color="teal" loading={loading} />
        <StatCard title="Clients" value={stats?.clients} icon={Contact} color="amber" loading={loading} />
        <StatCard title="Assessments" value={stats?.assessments} icon={ClipboardList} color="teal" loading={loading} />
        <StatCard title="Completed Tests" value={stats?.completedAttempts} icon={CheckCircle2} color="amber" loading={loading} />
      </div>

      {/* Secondary metrics strip */}
      <div className={`rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3 ${card}`}>
        <MiniStat label="Candidates" value={stats?.candidates} loading={loading} />
        <MiniStat label="Total Attempts" value={stats?.totalAttempts} loading={loading} />
        <MiniStat label="Results Recorded" value={stats?.results} loading={loading} />
        <MiniStat
          label="Pending Attempts"
          value={
            stats?.totalAttempts !== undefined
              ? Math.max(stats.totalAttempts - (stats.completedAttempts ?? 0), 0)
              : undefined
          }
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieCard
          title="Workspace Composition"
          description="Share of users, clients, candidates and assessments"
          data={compositionData}
          loading={loading}
          emptyLabel="No workspace data yet."
          isDark={isDark}
        />
        <PieCard
          title="Assessment Attempt Status"
          description="Completed vs. pending across all attempts"
          data={attemptStatusData}
          loading={loading}
          emptyLabel="No assessment attempts recorded yet."
          isDark={isDark}
        />
      </div>

      {/* Company snapshot */}
      <div className={`rounded-2xl overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b flex items-center gap-2.5 ${cardBorderB}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tealChip}`}>
            <Building2 size={15} />
          </div>
          <h2 className={`text-[14px] font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Company Snapshot
          </h2>
        </div>
        <dl className={`divide-y ${divide}`}>
          <Row label="Company" value={user?.company?.name ?? '—'} />
          <Row label="Client accounts" value={loading ? '—' : String(stats?.clients ?? 0)} />
          <Row label="Team members" value={loading ? '—' : String(stats?.users ?? 0)} />
          <Row label="Active assessments" value={loading ? '—' : String(stats?.assessments ?? 0)} />
        </dl>
      </div>

      {/* Logged-in user */}
      <div className={`rounded-2xl overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b flex items-center gap-2.5 ${cardBorderB}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${amberChip}`}>
            <ShieldCheck size={15} />
          </div>
          <h2 className={`text-[14px] font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Your Account
          </h2>
        </div>
        <dl className={`divide-y ${divide}`}>
          <Row label="Name" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '—'} />
          <Row label="Email" value={user?.email || '—'} />
          <Row label="Role" value={user?.role?.name || '—'} />
          <Row
            label="Status"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  user?.status === 'ACTIVE' ? tealBadge : dangerBadge
                }`}
              >
                {user?.status || '—'}
              </span>
            }
          />
          <Row label="Company" value={user?.company?.name ?? '—'} />
        </dl>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Pieces
------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value?: number;
  icon: LucideIcon;
  color: 'teal' | 'amber';
  loading: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${card}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${color === 'teal' ? tealChip : amberChip}`}>
        <Icon size={17} />
      </div>
      {loading ? (
        <div className={`h-[26px] w-14 ${skeleton}`} />
      ) : (
        <p className={`text-[26px] font-semibold tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          {value ?? '—'}
        </p>
      )}
      <p className={`text-[12.5px] mt-1 ${textMuted}`}>{title}</p>
    </div>
  );
}

function MiniStat({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {loading ? (
        <div className={`h-[18px] w-8 ${skeleton}`} />
      ) : (
        <span className={`text-[16px] font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          {value ?? '—'}
        </span>
      )}
      <span className={`text-[11.5px] ${textFaint}`}>{label}</span>
    </div>
  );
}

function PieCard({
  title,
  description,
  data,
  loading,
  emptyLabel,
  isDark,
}: {
  title: string;
  description: string;
  data: { name: string; value: number }[];
  loading: boolean;
  emptyLabel: string;
  isDark: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={`rounded-2xl overflow-hidden ${card}`}>
      <div className={`px-5 py-4 border-b flex items-center gap-2.5 ${cardBorderB}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tealChip}`}>
          <Layers size={15} />
        </div>
        <div>
          <h2 className={`text-[14px] font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
          <p className={`text-[11.5px] ${textFaint}`}>{description}</p>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className={`h-[220px] rounded-xl ${skeleton}`} />
        ) : total === 0 ? (
          <div className={`h-[220px] flex items-center justify-center text-[12.5px] text-center px-6 ${textFaint}`}>
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0B0F26' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: isDark ? '#F2F4FA' : '#0F172A',
                }}
                itemStyle={{ color: isDark ? '#F2F4FA' : '#0F172A' }}
                // formatter={(value: number, name: string) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: isDark ? '#AAB2D4' : '#475569', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <dt className={`text-[13px] ${textMuted}`}>{label}</dt>
      <dd className={`text-[13.5px] ${textPrimary}`}>{value}</dd>
    </div>
  );
}