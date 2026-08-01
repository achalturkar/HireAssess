'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  LogIn,
  Mail,
  ClipboardList,
  Users,
  BarChart3,
  Lock,
  ArrowRight,
  ListChecks,
  MessagesSquare,
  Shuffle,
} from 'lucide-react';
import PublicNav from '@/src/components/ui/publicnav';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Custom assessments',
    description:
      'Build role-specific assessments mixing Likert, situational judgement, and forced-choice questions — scaled to Entry, Mid, or Top-level roles.',
  },
  {
    icon: Users,
    title: 'Candidate management',
    description:
      'Invite candidates per client, track invitations through every stage, and keep everything scoped to the right company and client.',
  },
  {
    icon: BarChart3,
    title: 'Actionable results',
    description:
      'Every attempt produces trait-level scoring and a structured report your team can act on immediately.',
  },
  {
    icon: Lock,
    title: 'Role-based access',
    description:
      'Fine-grained permissions per module — company admins, super admins, and custom roles all see exactly what they should.',
  },
];

const QUESTION_TYPES = [
  { icon: ListChecks, label: 'Likert scale' },
  { icon: MessagesSquare, label: 'Situational judgement' },
  { icon: Shuffle, label: 'Forced choice' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F26]">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto w-full px-6 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <span className="w-14 h-14 rounded-2xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
            <ShieldCheck size={26} />
          </span>
        </div>
        <p
          className="text-[11px] uppercase tracking-[0.16em] text-[#3FDCC0] mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Assessment Platform
        </p>
        <h1
          className="text-[38px] sm:text-[46px] font-semibold tracking-tight text-[#F2F4FA] leading-[1.1]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Hiring decisions,
          <br />
          backed by data
        </h1>
        <p className="text-[15px] text-[#8891B8] mt-5 max-w-xl mx-auto leading-relaxed">
          HireAssess helps your team build, assign, and score candidate assessments —
          so every hire is measured on the same objective bar, every time.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-5 py-3 hover:bg-[#3FDCC0]/90 transition-colors"
          >
            <LogIn size={16} />
            Sign in
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-lg border border-white/[0.12] text-[#F2F4FA] text-[13.5px] font-medium px-5 py-3 hover:bg-white/[0.05] transition-colors"
          >
            <Mail size={16} />
            Contact us
          </Link>
        </div>

        {/* Question type strip */}
        <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
          {QUESTION_TYPES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 text-[12.5px] text-[#565F8C]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Icon size={14} className="text-[#3FDCC0]" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-6 py-6 hover:border-[#3FDCC0]/30 transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4">
                <Icon size={18} />
              </span>
              <h3
                className="text-[15px] font-semibold text-[#F2F4FA] mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h3>
              <p className="text-[13.5px] text-[#8891B8] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20">
        <div className="rounded-2xl border border-[#3FDCC0]/25 bg-[#3FDCC0]/[0.06] px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2
              className="text-[19px] font-semibold text-[#F2F4FA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to see it in action?
            </h2>
            <p className="text-[13.5px] text-[#8891B8] mt-1">
              Sign in to your workspace, or reach out if your team hasn&apos;t been set up yet.
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-5 py-3 hover:bg-[#3FDCC0]/90 transition-colors shrink-0"
          >
            Sign in
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-[12px] text-[#565F8C]">
          <span style={{ fontFamily: 'var(--font-mono)' }}>© {new Date().getFullYear()} HireAssess</span>
          <Link href="/contact" className="hover:text-[#AAB2D4] transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}