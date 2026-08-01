'use client';

import { useAuth } from '@/src/auth/AuthProvider';
import { Building, Users, Shield, ClipboardList } from 'lucide-react';

// TODO: replace with real data from your API, e.g.:
//   GET /api/v1/companies?limit=1 -> { total }
//   GET /api/v1/users?limit=1     -> { total }
//   GET /api/v1/roles             -> { total }
//   GET /api/v1/audit-logs?limit=5
const STATS = [
  { label: 'Total Companies', value: '128', delta: '+4 this week', icon: Building, color: 'teal' as const },
  { label: 'Total Users', value: '2,340', delta: '+58 this week', icon: Users, color: 'amber' as const },
  { label: 'Active Roles', value: '19', delta: '2 system roles', icon: Shield, color: 'teal' as const },
  { label: 'Audit Events (24h)', value: '412', delta: 'Steady', icon: ClipboardList, color: 'amber' as const },
];

const RECENT_COMPANIES = [
  { name: 'Northwind Talent', slug: 'northwind-talent', status: 'ACTIVE', users: 42 },
  { name: 'Beacon Robotics', slug: 'beacon-robotics', status: 'ACTIVE', users: 18 },
  { name: 'Fernhill Studios', slug: 'fernhill-studios', status: 'SUSPENDED', users: 7 },
  { name: 'Cobalt & Rye', slug: 'cobalt-rye', status: 'ACTIVE', users: 63 },
];

const RECENT_ACTIVITY = [
  { actor: 'Super Admin', action: 'created role', target: 'Hiring Manager', time: '12 minutes ago' },
  { actor: 'Priya Shah', action: 'invited user', target: 'r.long@beacon.io', time: '48 minutes ago' },
  { actor: 'Super Admin', action: 'suspended company', target: 'Fernhill Studios', time: '2 hours ago' },
  { actor: 'System', action: 'revoked sessions', target: 'user reuse detected', time: '5 hours ago' },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
          Super Admin Overview
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {user?.firstName ?? '—'}
        </h1>
        <p className="text-[13.5px] text-[#8891B8] mt-1">{today} · platform-wide snapshot</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-[#161C3A] p-5">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  s.color === 'teal' ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
                }`}
              >
                <s.icon width={17} height={17} />
              </div>
            </div>
            <p className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {s.value}
            </p>
            <p className="text-[12.5px] text-[#8891B8] mt-1">{s.label}</p>
            <p className="text-[11px] text-[#565F8C] mt-2" style={{ fontFamily: 'var(--font-mono)' }}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent companies */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <h2 className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Recent Companies
            </h2>
            <a href="/dashboard/companies" className="text-[12.5px] text-[#3FDCC0] hover:underline">
              View all
            </a>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
                <th className="px-5 py-2.5 font-medium">Company</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium text-right">Users</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_COMPANIES.map((c) => (
                <tr key={c.slug} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <p className="text-[13.5px] text-[#F2F4FA]">{c.name}</p>
                    <p className="text-[11.5px] text-[#565F8C]">{c.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        c.status === 'ACTIVE'
                          ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]'
                          : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[13.5px] text-[#AAB2D4]">{c.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#161C3A] p-5">
          <h2 className="text-[14px] font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            System Activity
          </h2>
          <ul className="space-y-4">
            {RECENT_ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3FDCC0] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-[#F2F4FA] leading-snug">
                    <span className="font-medium">{a.actor}</span>{' '}
                    <span className="text-[#AAB2D4]">{a.action}</span>{' '}
                    <span className="font-medium">{a.target}</span>
                  </p>
                  <p className="text-[11.5px] text-[#565F8C] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                    {a.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}