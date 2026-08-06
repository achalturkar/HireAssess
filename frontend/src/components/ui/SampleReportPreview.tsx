'use client';

import { useState } from 'react';
import {
  User,
  FileText,
  PieChart,
  Gauge,
  Scale,
  MessageCircleQuestion,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_BREAKDOWN = [
  { label: 'Analytical', count: 10, pct: 25, color: 'bg-[var(--primary)]' },
  { label: 'Logical', count: 10, pct: 25, color: 'bg-[var(--accent)]' },
  { label: 'Behavioural', count: 20, pct: 50, color: 'bg-[color-mix(in_srgb,var(--primary)_45%,var(--accent))]' },
];

const TRAIT_SCORES = [
  { label: 'Strategic thinking & vision', score: 90 },
  { label: 'Delegation & team empowerment', score: 80 },
  { label: 'Accountability & integrity', score: 53 },
  { label: 'Decision making & problem solving', score: 40 },
  { label: 'Communication & feedback', score: 33 },
  { label: 'Logical reasoning', score: 18 },
];

const STRENGTHS = [
  { label: 'Strategic thinking & vision', score: 90 },
  { label: 'Delegation & team empowerment', score: 80 },
];

const DEVELOPMENT_AREAS = [
  { label: 'Logical reasoning', score: 18 },
  { label: 'Communication & feedback', score: 33 },
  { label: 'Decision making & problem solving', score: 40 },
];

const INTERVIEW_PROMPTS = [
  {
    trait: 'Logical reasoning',
    score: 18,
    question: 'Tell me about a time your logical reasoning was tested at work — what happened, and what would you do differently?',
  },
  {
    trait: 'Communication & feedback',
    score: 33,
    question: 'How do you currently compensate for or manage communication gaps in a fast-paced role?',
  },
];

function scoreTone(score: number) {
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Strength' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Moderate' };
  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', label: 'Development area' };
}

const STEPS = [
  { icon: User, title: 'Candidate summary' },
  { icon: PieChart, title: 'Question breakdown' },
  { icon: Gauge, title: 'Trait scores' },
  { icon: Scale, title: 'Strengths vs. gaps' },
  { icon: MessageCircleQuestion, title: 'Interview guidance' },
];

export default function SampleReportPreview() {
  const [step, setStep] = useState(0);

  return (
    <div>
      {/* Stepper controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {STEPS.map(({ icon: Icon, title }, i) => {
          const active = i === step;
          return (
            <button
              key={title}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium border transition-colors ${
                active
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  active ? 'bg-white/20' : 'bg-[var(--border)]/60'
                }`}
              >
                {i + 1}
              </span>
              <Icon size={13} />
              <span className="hidden sm:inline">{title}</span>
            </button>
          );
        })}
      </div>

      {/* Report "page" mockup */}
      <div className="max-w-2xl mx-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xl px-6 py-7 sm:px-9 sm:py-9 min-h-[380px]">
        <p
          className="text-[10px] uppercase tracking-[0.14em] text-[var(--primary)] mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Step {String(step + 1).padStart(2, '0')} · {STEPS[step].title}
        </p>

        {/* Step 1 — Candidate & assessment summary */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-4 mt-3 mb-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] text-[13px] font-semibold">
                AR
              </span>
              <div>
                <h3 className="text-[16px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Alex Rivera
                </h3>
                <p className="text-[12.5px] text-[var(--muted)]">Assessed for Operations Lead · Level ENTRY · Client Co.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                ['Duration', '40 min'],
                ['Submitted', '8/2/2026'],
                ['Time to solve', '3 min'],
                ['Grade', 'Low'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {label}
                  </p>
                  <p className="text-[13.5px] font-semibold mt-1">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[var(--primary)]/10 px-5 py-4">
              <span className="text-[13px] text-[var(--muted)]">Overall score</span>
              <span className="text-[22px] font-semibold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                38<span className="text-[13px] text-[var(--muted)] font-normal"> / 100</span>
              </span>
            </div>
          </div>
        )}

        {/* Step 2 — Question breakdown */}
        {step === 1 && (
          <div className="mt-3">
            <p className="text-[13px] text-[var(--muted)] mb-5">
              40 questions scored automatically across three constructs — every category maps to a distinct part of
              the candidate&apos;s working style.
            </p>
            <div className="h-3 rounded-full overflow-hidden flex mb-5">
              {CATEGORY_BREAKDOWN.map((c) => (
                <div key={c.label} className={c.color} style={{ width: `${c.pct}%` }} />
              ))}
            </div>
            <div className="space-y-3">
              {CATEGORY_BREAKDOWN.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                    {c.label}
                  </span>
                  <span className="text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {c.count} questions · {c.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Trait scores */}
        {step === 2 && (
          <div className="mt-3 space-y-4">
            <p className="text-[13px] text-[var(--muted)] mb-1">
              Each trait plotted on a 0–100 scale, colour-coded against the ideal profile for the role.
            </p>
            {TRAIT_SCORES.map((t) => {
              const tone = scoreTone(t.score);
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                    <span className="font-medium">{t.label}</span>
                    <span className={`font-semibold ${tone.text}`}>{t.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)]/60 overflow-hidden">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 4 — Strengths vs development areas */}
        {step === 3 && (
          <div className="mt-3 grid sm:grid-cols-2 gap-5">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.08em] mb-3">
                <CheckCircle2 size={13} /> Top strengths
              </p>
              <div className="space-y-2.5">
                {STRENGTHS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3.5 py-2.5">
                    <span className="text-[12.5px]">{s.label}</span>
                    <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-[0.08em] mb-3">
                <AlertTriangle size={13} /> Primary gaps
              </p>
              <div className="space-y-2.5">
                {DEVELOPMENT_AREAS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3.5 py-2.5">
                    <span className="text-[12.5px]">{s.label}</span>
                    <span className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Interview guidance */}
        {step === 4 && (
          <div className="mt-3">
            <p className="text-[13px] text-[var(--muted)] mb-5">
              Every low-scoring trait comes with ready-made interview prompts, so hiring managers know exactly what
              to probe in the next round.
            </p>
            <div className="space-y-3.5">
              {INTERVIEW_PROMPTS.map((p) => (
                <div key={p.trait} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-semibold">{p.trait}</span>
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{p.score}/100</span>
                  </div>
                  <p className="flex items-start gap-2 text-[12.5px] text-[var(--muted)] leading-relaxed">
                    <FileText size={13} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                    {p.question}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}