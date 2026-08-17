'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Mail,
  ClipboardList,
  CircleCheck,
  CircleX,
  Download,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  ListChecks,
  Award,
    Eye,

} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useAuth } from '@/src/auth/AuthProvider';
import { ScoreBadge, ScoreStageBadge, bandFor, stageFor } from '@/src/components/layout/company/result/scoreDisplay';
import { getCandidateResult, downloadCandidateReportPdf, downloadCandidateCertificatePdf, ApiError } from '@/src/lib/api/assessment-results';
import type { CandidateResultBundle, ScoreBand, TraitScore } from '@/src/types/assessment-result';

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const BAND_COLOR: Record<ScoreBand, string> = {
  High: '#3FDCC0',
  Moderate: '#F2AE55',
  Low: '#FF6B6B',
};

const SECTION_THEME = {
  behavioral: { accent: '#3FDCC0', soft: 'rgba(63,220,192,0.14)' },
  analytical: { accent: '#6CB4FF', soft: 'rgba(108,180,255,0.14)' },
  logical: { accent: '#7C5BFF', soft: 'rgba(124,91,255,0.14)' },
};

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

function getAnswerType(qa: CandidateResultBundle['questions'][number]): string | undefined {
  if (qa.answer?.questionType) return String(qa.answer.questionType).toUpperCase();
  if (qa.question?.type) return String(qa.question.type).toUpperCase();
  if (qa.question?.question) return 'LIKERT';
  if (qa.question?.items) return 'FORCED_CHOICE';
  if (qa.question?.scenario) return 'SITUATIONAL_JUDGEMENT';
  return undefined;
}

function getSectionQuestions(bundle: CandidateResultBundle, types: string[]) {
  return bundle.questions.filter((qa) => {
    const type = getAnswerType(qa);
    return type ? types.includes(type) : false;
  });
}

function sectionCategories(bundle: CandidateResultBundle, types: string[]) {
  return new Set(
    getSectionQuestions(bundle, types)
      .map((qa) => qa.question?.category)
      .filter((category): category is string => Boolean(category)),
  );
}

function averageScore(questions: CandidateResultBundle['questions']) {
  const scored = questions.filter((qa) => typeof qa.answer?.score === 'number');
  if (!scored.length) return 0;
  const total = scored.reduce((sum, qa) => sum + (qa.answer?.score ?? 0), 0);
  return Math.round(total / scored.length);
}

function classifyTraits(bundle: CandidateResultBundle) {
  const analyticalCats = sectionCategories(bundle, ['ANALYTICAL']);
  const logicalCats = sectionCategories(bundle, ['LOGICAL_REASONING', 'LOGICAL']);

  const behavioral: TraitScore[] = [];
  const analytical: TraitScore[] = [];
  const logical: TraitScore[] = [];

  for (const t of bundle.report.traits) {
    if (analyticalCats.has(t.trait)) analytical.push(t);
    else if (logicalCats.has(t.trait)) logical.push(t);
    else behavioral.push(t);
  }

  return { behavioral, analytical, logical };
}

function questionText(q: CandidateResultBundle['questions'][number]['question']): string {
  if (!q) return 'Question no longer available';
  const maybeQuestion = q as { question?: string; scenario?: string; prompt?: string; text?: string };
  return maybeQuestion.question ?? maybeQuestion.scenario ?? maybeQuestion.prompt ?? maybeQuestion.text ?? '—';
}

function answerText(
  question: CandidateResultBundle['questions'][number]['question'],
  answer: CandidateResultBundle['questions'][number]['answer'],
): string {
  if (!answer || answer.answer === undefined || answer.answer === null) return 'Not answered';
  const raw = answer.answer as Record<string, unknown>;

  if (typeof raw === 'object' && raw !== null && 'answer' in raw && typeof raw.answer === 'number') {
    return `${raw.answer} / 5`;
  }
  if (typeof raw === 'object' && raw !== null && 'selectedOption' in raw) {
    const options = (question as { options?: { id: string; text: string }[] } | null)?.options ?? [];
    const selectedOption = String(raw.selectedOption ?? '');
    const match = options.find((o) => o.id === selectedOption);
    return match?.text ?? selectedOption;
  }
  if (typeof raw === 'object' && raw !== null && ('most' in raw || 'least' in raw)) {
    const items = (question as { items?: { id: string; text: string }[] } | null)?.items ?? [];
    const most = items.find((i) => i.id === (raw as { most?: string }).most)?.text;
    const least = items.find((i) => i.id === (raw as { least?: string }).least)?.text;
    return `Most: ${most ?? '—'} · Least: ${least ?? '—'}`;
  }
  if (typeof raw === 'object' && raw !== null) return JSON.stringify(raw);
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '—';
}

function formatTimestamp(value?: string) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatTraitList(traits: { trait: string; score: number }[]) {
  if (!traits.length) return 'No trait data available';
  if (traits.length === 1) return traits[0].trait;
  if (traits.length === 2) return `${traits[0].trait} and ${traits[1].trait}`;
  return `${traits.slice(0, -1).map((t) => t.trait).join(', ')} and ${traits[traits.length - 1].trait}`;
}

function getSummaryText(score: number, band: string, topTraits: TraitScore[], bottomTraits: TraitScore[]) {
  const strengths = formatTraitList(topTraits);
  const weaknesses = formatTraitList(bottomTraits);
  if (!topTraits.length || !bottomTraits.length) {
    return `The candidate completed this assessment with an overall score of ${score}. Review the detailed trait breakdown for the strongest and weakest areas.`;
  }
  if (score >= 80) {
    return `This is a strong result (${band}). The candidate demonstrates clear strengths in ${strengths}. Keep reinforcing those areas while focusing improvement on ${weaknesses}.`;
  }
  if (score >= 60) {
    return `A solid performance (${band}) with strengths in ${strengths}. The largest growth opportunities are in ${weaknesses}.`;
  }
  if (score >= 40) {
    return `A moderate performance (${band}). Strengths include ${strengths}, but development is needed in ${weaknesses} to raise the overall score.`;
  }
  return `The overall performance is lower than expected (${band}). Prioritize improvement in ${weaknesses} while building on strengths such as ${strengths}.`;
}

// Generic, trait-keyed improvement tips with a sensible fallback. Not a
// real content system — swap this for a CMS-backed lookup or per-trait
// copy table whenever one exists.
const IMPROVEMENT_TIPS: Record<string, string> = {
  'Conflict Resolution': 'Practice naming the underlying issue before offering a solution, and involve both sides in shaping the resolution.',
  'Leadership and Influence': 'Set clearer expectations up front and follow through visibly on commitments to build trust.',
  'Communication and Feedback': 'Adopt a consistent feedback cadence (e.g. weekly 1:1s) and check for understanding before moving on.',
  'Emotional Intelligence & Empathy': 'Pause to acknowledge how a person feels before addressing the task at hand.',
  'Emotional Intelligence and Empathy': 'Pause to acknowledge how a person feels before addressing the task at hand.',
  'Resilience and Stress Management': 'Build in short recovery breaks during high-pressure periods rather than pushing through continuously.',
  'Resilience & Stress Management': 'Build in short recovery breaks during high-pressure periods rather than pushing through continuously.',
  'Adaptability & Change Management': 'Communicate the "why" behind changes early to reduce resistance from the team.',
  'Adaptability and Change Management': 'Communicate the "why" behind changes early to reduce resistance from the team.',
  'Problem Solving & Decision Making': 'Slow down at the framing stage — write out 2-3 options before committing to one.',
  'Decision Making and Problem Solving': 'Slow down at the framing stage — write out 2-3 options before committing to one.',
  'Delegation and Team Empowerment': 'Delegate outcomes, not just tasks, and resist the urge to take work back at the first sign of difficulty.',
  'Delegation & Team Empowerment': 'Delegate outcomes, not just tasks, and resist the urge to take work back at the first sign of difficulty.',
  'Accountability and Integrity': 'Default to naming mistakes early and proactively, before being asked.',
  'Accountability & Integrity': 'Default to naming mistakes early and proactively, before being asked.',
  'Strategic Thinking and Vision': 'Connect day-to-day decisions explicitly back to longer-term goals when communicating with the team.',
  'Data Interpretation & Metrics': 'Practice stating the "so what" after reading a number, not just the number itself.',
  'Process Logic & Scheduling': 'Break multi-step processes into an explicit sequence before executing, rather than working step-by-step live.',
};

function getImprovementTip(trait: string) {
  return IMPROVEMENT_TIPS[trait] ?? `Focus on structured practice and feedback specifically around ${trait.toLowerCase()} over the next review cycle.`;
}

/* ------------------------------------------------------------------ */
/* Chart building blocks                                               */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score, size = 132, stage }: { score: number; size?: number; stage?: string }) {
  const band = bandFor(score);
  const label = stage ?? stageFor(score);
  const data = [{ name: 'score', value: score, fill: BAND_COLOR[band] }];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="74%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={Math.max(10, size * 0.09)}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--border)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.22 }}>
          {score}
        </span>
        <span className="text-[var(--muted)] uppercase tracking-wide" style={{ fontSize: Math.max(9, size * 0.075) }}>
          {label} · /100
        </span>
      </div>
    </div>
  );
}

function ScoreBandLegend() {
  const stages = [
    { label: 'Needs Development', range: '0–49', color: '#FF6B6B', width: '50%' },
    { label: 'Potential Fit', range: '50–59', color: '#F2AE55', width: '10%' },
    { label: 'Good Fit', range: '60–79', color: '#6CB4FF', width: '20%' },
    { label: 'Strong Fit', range: '80–89', color: '#3FDCC0', width: '10%' },
    { label: 'Outstanding', range: '90–100', color: '#0EB673', width: '10%' },
  ];

  return (
    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12px] text-[var(--muted)]">
      <p className="uppercase tracking-[0.24em] text-[var(--muted)] text-[11px] mb-3">Score stage guide</p>
      <div className="rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex h-3">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className="h-full"
              style={{ width: stage.width, minWidth: 0, backgroundColor: stage.color }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-5 text-center">
        {stages.map((stage) => (
          <div key={stage.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <p className="text-[12px] text-[var(--foreground)] font-semibold leading-none">{stage.label}</p>
            </div>
            <p className="text-[11px] text-[var(--muted)]">{stage.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraitBarsChart({ traits }: { traits: TraitScore[] }) {
  const data = [...traits].sort((a, b) => b.score - a.score);
  const height = Math.max(140, data.length * 42 + 20);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }} barCategoryGap={14}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis type="category" dataKey="trait" width={190} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'var(--surface-muted)' }}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--muted)' }}
          formatter={(value, _name, props) => {
            const score = typeof value === 'number' ? value : Number(value ?? 0);
            const band = props?.payload?.[0]?.payload?.band ?? '';
            return [`${score} · ${band}`, 'Score'];
          }}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {data.map((t) => (
            <Cell key={t.trait} fill={BAND_COLOR[t.band]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function WeakAreas({ traits }: { traits: TraitScore[] }) {
  const weak = [...traits].filter((t) => t.band === 'Low').sort((a, b) => a.score - b.score);
  if (!weak.length) return null;
  return (
    <div className="mt-5 rounded-xl border border-[#FF6B6B]/25 bg-[#FF6B6B]/[0.06] p-4">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#FF6B6B] mb-2.5">
        <TrendingDown size={12} />
        Needs development
      </p>
      <ul className="space-y-1.5">
        {weak.map((t) => (
          <li key={t.trait} className="text-[12.5px] text-[#F2D5D5] leading-relaxed">
            <span className="font-medium text-[var(--foreground)]">{t.trait}</span> — scored {t.score}/100. The candidate needs to
            work on this point before this can be considered a strength.
          </li>
        ))}
      </ul>
    </div>
  );
}

function TraitSection({
  title,
  description,
  traits,
  soft,
  emptyMessage,
  maxTraits,
}: {
  title: string;
  description: string;
  traits: TraitScore[];
  soft: string;
  emptyMessage: string;
  maxTraits?: number;
}) {
  const shown = maxTraits ? traits.slice(0, maxTraits) : traits;
  const hasData = shown.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6" style={{ boxShadow: `inset 0 0 0 1px ${soft}` }}>
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 max-w-md">{description}</p>
      </div>
      {hasData ? (
        <>
          <TraitBarsChart traits={shown} />
          <WeakAreas traits={shown} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-[13px] text-[var(--muted)]">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function QuestionDistributionCard({ bundle }: { bundle: CandidateResultBundle }) {
  const behavioralCount = getSectionQuestions(bundle, ['LIKERT', 'SITUATIONAL_JUDGEMENT', 'FORCED_CHOICE']).length;
  const analyticalCount = getSectionQuestions(bundle, ['ANALYTICAL']).length;
  const logicalCount = getSectionQuestions(bundle, ['LOGICAL_REASONING', 'LOGICAL']).length;
  const total = behavioralCount + analyticalCount + logicalCount;
  const attempted = bundle.questions.filter((qa) => qa.answer && qa.answer.answer !== undefined && qa.answer.answer !== null).length;

  const data = [
    { name: 'Behavioral', value: behavioralCount, color: SECTION_THEME.behavioral.accent },
    { name: 'Analytical', value: analyticalCount, color: SECTION_THEME.analytical.accent },
    { name: 'Logical', value: logicalCount, color: SECTION_THEME.logical.accent },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            Question distribution
          </h2>
          <p className="text-[12.5px] text-[var(--muted)] mt-1">{total} questions across all sections</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3.5 py-2">
          <ListChecks size={13} className="text-[var(--primary)]" />
          <span className="text-[12.5px] text-[var(--foreground)]">
            {attempted} / {bundle.questions.length} attempted
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-[13px] text-[var(--muted)]">No questions recorded for this attempt.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--foreground)' }}
                  formatter={(value, name) => {
                    const count = typeof value === 'number' ? value : Number(value ?? 0);
                    return [`${count} questions`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-3">
            {[
              { name: 'Behavioral', value: behavioralCount, color: SECTION_THEME.behavioral.accent },
              { name: 'Analytical', value: analyticalCount, color: SECTION_THEME.analytical.accent },
              { name: 'Logical', value: logicalCount, color: SECTION_THEME.logical.accent },
            ].map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3.5 py-2.5">
                <span className="flex items-center gap-2.5 text-[13px] text-[var(--foreground)]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="text-[13px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {d.value} · {total ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StrengthsAndWeaknesses({ traits }: { traits: TraitScore[] }) {
  const sorted = [...traits].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 5);
  const weaknesses = [...sorted].reverse().slice(0, 5);

  if (!traits.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-[15px] font-semibold text-[var(--foreground)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Strengths &amp; Growth Areas
      </h2>
      <p className="text-[12.5px] text-[var(--muted)] mb-5">Top-performing traits versus the areas most in need of development</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--primary)] mb-3">
            <TrendingUp size={12} />
            Top strengths
          </p>
          <ResponsiveContainer width="100%" height={Math.max(140, strengths.length * 38 + 10)}>
            <BarChart data={strengths} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }} barCategoryGap={10}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="trait" width={170} tick={{ fill: 'var(--muted)', fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-muted)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--foreground)' }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={16} fill="#3FDCC0" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weaknesses */}
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#FF6B6B] mb-3">
            <TrendingDown size={12} />
            Growth areas
          </p>
          <ResponsiveContainer width="100%" height={Math.max(140, weaknesses.length * 38 + 10)}>
            <BarChart data={weaknesses} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }} barCategoryGap={10}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="trait" width={170} tick={{ fill: 'var(--muted)', fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-muted)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--foreground)' }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={16} fill="#FF6B6B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tips for improvement */}
      <div className="mt-6 rounded-xl border border-[#F2AE55]/25 bg-[#F2AE55]/[0.06] p-4">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#F2AE55] mb-3">
          <Lightbulb size={12} />
          Tips to improve
        </p>
        <ul className="space-y-2.5">
          {weaknesses.map((t) => (
            <li key={t.trait} className="text-[12.5px] text-[#F2F0DE] leading-relaxed">
              <span className="font-medium text-[var(--foreground)]">{t.trait}:</span> {getImprovementTip(t.trait)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const attemptId = params.id;

  const [bundle, setBundle] = useState<CandidateResultBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidateResult(attemptId, accessToken);
      setBundle(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load this result.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, accessToken]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const traitBuckets = useMemo(() => (bundle ? classifyTraits(bundle) : null), [bundle]);

  async function handleDownload(kind: 'report' | 'certificate') {
    if (!accessToken || !bundle) return;
    const setDownloading = kind === 'report' ? setDownloadingReport : setDownloadingCertificate;
    setDownloading(true);
    try {
      const blob =
        kind === 'report'
          ? await downloadCandidateReportPdf(bundle.attemptId ?? attemptId, accessToken)
          : await downloadCandidateCertificatePdf(bundle.attemptId ?? attemptId, accessToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const candidateName = bundle.candidate
        ? `${bundle.candidate.firstName ?? 'Candidate'} ${bundle.candidate.lastName ?? ''}`.trim()
        : 'Candidate';
      const safeName = candidateName.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
      link.href = url;
      link.download = kind === 'report' ? `${safeName}_Assessment_report.pdf` : `${safeName}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-7 overflow-x-auto">
      <button onClick={() => router.push('/company/results')} className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft size={13} />
        Back to results
      </button>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--muted)]">
          <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
          <p className="text-[13.5px] mt-3">Loading result…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="w-11 h-11 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center mb-3">
            <AlertTriangle size={20} />
          </span>
          <p className="text-[14px] text-[var(--foreground)] font-medium">Couldn&apos;t load this result</p>
          <p className="text-[13px] text-[var(--muted)] mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && bundle && traitBuckets && (
        <>
          {/* Header card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 overflow-x-auto">
            <div className="min-w-[760px] grid gap-6 xl:grid-cols-[1.75fr_minmax(320px,0.95fr)] items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center text-[14px] font-semibold shrink-0">
                    {bundle.candidate ? initials(bundle.candidate.firstName, bundle.candidate.lastName) : '?'}
                  </div>
                  <div>
                    <h1 className="text-[18px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {bundle.candidate ? `${bundle.candidate.firstName} ${bundle.candidate.lastName}` : 'Unknown candidate'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12.5px] text-[var(--muted)]">
                      {bundle.candidate?.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail size={11} /> {bundle.candidate.email}
                        </span>
                      )}
                      {bundle.assessment?.name && (
                        <span className="flex items-center gap-1.5">
                          <ClipboardList size={11} /> {bundle.assessment.name}
                        </span>
                      )}
                    </div>
                    {bundle.assessment?.description && (
                      <p className="mt-4 text-[13px] leading-6 text-[var(--muted)] max-w-2xl">{bundle.assessment.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Assessment</p>
                    <p className="text-[13px] text-[var(--foreground)]">{bundle.assessment?.name ?? 'Unknown assessment'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Client</p>
                    <p className="text-[13px] text-[var(--foreground)]">{bundle.assessment?.client?.name ?? 'Unassigned'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Questions</p>
                    <p className="text-[13px] text-[var(--foreground)]">{bundle.questions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Duration</p>
                    <p className="text-[13px] text-[var(--foreground)]">
                      {bundle.assessment?.durationMinutes ? `${bundle.assessment.durationMinutes} min` : 'Unknown'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Started</p>
                    <p className="text-[13px] text-[var(--foreground)]">{formatTimestamp(bundle.startedAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] text-[var(--muted)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] mb-2">Submitted</p>
                    <p className="text-[13px] text-[var(--foreground)]">{formatTimestamp(bundle.submittedAt)}</p>
                  </div>
                </div>

                {(() => {
                  const sortedTraits = [...bundle.report.traits].sort((a, b) => b.score - a.score);
                  const topTraits = sortedTraits.slice(0, 3);
                  const bottomTraits = [...sortedTraits].slice(-3).reverse();
                  return (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-[12.5px] text-[var(--muted)]">
                      <p className="uppercase tracking-[0.24em] text-[var(--muted)] text-[11px] mb-3">Performance summary</p>
                      <p className="text-[13px] leading-6 text-[var(--foreground)]">
                        {getSummaryText(bundle.overallScore, bundle.report.overall.band, topTraits, bottomTraits)}
                      </p>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px] text-[var(--muted)]">
                  {bundle.attemptId && (
                    <p>
                      <span className="font-semibold text-[var(--foreground)]">Attempt ID:</span> {bundle.attemptId}
                    </p>
                  )}
                  {bundle.assignment?.assignedTo && (
                    <p>
                      <span className="font-semibold text-[var(--foreground)]">Assigned to:</span> {bundle.assignment.assignedTo}
                    </p>
                  )}
                </div>
              </div>

              {/* Overall score as a circular gauge out of 100 */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Overall score
                </p>
                <ScoreGauge score={bundle.overallScore} size={140} stage={bundle.report.overall.stage} />
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={bundle.overallScore} band={bundle.report.overall.band} />
                  <ScoreStageBadge stage={bundle.report.overall.stage ?? stageFor(bundle.overallScore)} />
                </div>
                <ScoreBandLegend />
              </div>
            </div>
          </div>

          {/* Downloads — its own card, separate from the header content above */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[12px] text-[var(--muted)]">Review and download the full candidate report below.</div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleDownload('certificate')}
                disabled={downloadingCertificate}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--primary)]/40 bg-transparent px-4 py-2 text-[12.5px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloadingCertificate ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                {downloadingCertificate ? 'Preparing…' : 'Download certificate'}
              </button>
              <button
                type="button"
                onClick={() => handleDownload('report')}
                disabled={downloadingReport}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloadingReport ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloadingReport ? 'Preparing…' : 'Download report'}
              </button>
            </div>
          </div>

          {/* Question distribution */}
          <QuestionDistributionCard bundle={bundle} />

          {/* Strengths & weaknesses + tips */}
          <StrengthsAndWeaknesses traits={bundle.report.traits} />

          {/* Behavioral Assessment — always rendered, same treatment as Analytical/Logical */}
          <TraitSection
            title="Behavioral Assessment"
            description="Self-assessment, situational judgement, and forced-choice traits — the candidate's day-to-day working style."
            traits={traitBuckets.behavioral}
            soft={SECTION_THEME.behavioral.soft}
            emptyMessage="No behavioral questions were included in this attempt."
            maxTraits={10}
          />

          {/* Analytical Assessment — same card structure as Behavioral */}
          <TraitSection
            title="Analytical Assessment"
            description="Data interpretation and quantitative reasoning traits."
            traits={traitBuckets.analytical}
            soft={SECTION_THEME.analytical.soft}
            emptyMessage="No analytical questions were included in this attempt."
          />

          {/* Logical Assessment — same card structure as Behavioral */}
          <TraitSection
            title="Logical Assessment"
            description="Process logic, sequencing, and structured reasoning traits."
            traits={traitBuckets.logical}
            soft={SECTION_THEME.logical.soft}
            emptyMessage="No logical reasoning questions were included in this attempt."
          />

        {/* Question-by-question review */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Question-by-question review
                </h2>
                <p className="text-[12.5px] text-[var(--muted)] mt-0.5">{bundle.questions.length} questions</p>
              </div>
              {!showQuestions && bundle.questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowQuestions(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors shrink-0"
                >
                  <Eye size={13} />
                  View questions
                </button>
              )}
            </div>

            {showQuestions ? (
              <div className="divide-y divide-[var(--border)]">
                {bundle.questions.map((qa, i) => {
                  const answered = Boolean(qa.answer && qa.answer.answer !== undefined && qa.answer.answer !== null);
                  const questionId = qa.question?.id ?? qa.answer?.questionId ?? `question-${i + 1}`;
                  return (
                    <div key={questionId} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-[var(--muted)]">
                          {answered ? <CircleCheck size={15} className="text-[var(--primary)]" /> : <CircleX size={15} className="text-[#FF6B6B]" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                              Question {i + 1}
                              {qa.question?.category ? ` · ${qa.question.category}` : ''}
                            </p>
                            {typeof qa.answer?.score === 'number' && (
                              <span className="text-[11px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                                score: {qa.answer.score}
                              </span>
                            )}
                          </div>
                          <p className="text-[13.5px] text-[var(--foreground)] mt-1.5 leading-relaxed">{questionText(qa.question)}</p>
                          <p className="text-[13px] text-[var(--muted)] mt-1.5">{answerText(qa.question, qa.answer)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {bundle.questions.length === 0 && (
                  <p className="px-6 py-8 text-center text-[13px] text-[var(--muted)]">No questions recorded for this attempt.</p>
                )}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] text-[var(--muted)]">
                  {bundle.questions.length > 0
                    ? 'Click "View questions" to load the full question-by-question breakdown.'
                    : 'No questions recorded for this attempt.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}