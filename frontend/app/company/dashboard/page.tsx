'use client';

import { Users, Contact, ClipboardList, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';

export default function CompanyDashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
          Company Overview
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-[13.5px] text-[#8891B8] mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Users" value="25" icon={Users} color="teal" />
        <Card title="Candidates" value="150" icon={Contact} color="amber" />
        <Card title="Assessments" value="12" icon={ClipboardList} color="teal" />
        <Card title="Completed Tests" value="98" icon={CheckCircle2} color="amber" />
      </div>

      {/* Logged-in user */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h2 className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Your Account
          </h2>
        </div>
        <dl className="divide-y divide-white/[0.06]">
          <Row label="Name" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '—'} />
          <Row label="Email" value={user?.email || '—'} />
          <Row label="Role" value={user?.role?.name || '—'} />
          <Row
            label="Status"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  user?.status === 'ACTIVE' ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
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

function Card({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'teal' | 'amber';
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] p-5">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${
          color === 'teal' ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#F2AE55]/15 text-[#F2AE55]'
        }`}
      >
        <Icon size={17} />
      </div>
      <p className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-[12.5px] text-[#8891B8] mt-1">{title}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <dt className="text-[13px] text-[#8891B8]">{label}</dt>
      <dd className="text-[13.5px] text-[#F2F4FA]">{value}</dd>
    </div>
  );
}