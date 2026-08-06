import Link from 'next/link';
import {
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
  Brain,
  Calculator,
  Type,
  Fingerprint,
  Puzzle,
  FileEdit,
  Send,
  Timer,
  TrendingUp,
  Code2,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Factory,
  Headset,
  Star,
  Clock3,
  ShieldCheck,
  Award,
  Sparkles,
  FileText,
  Target,
  ThumbsUp,
  AlertTriangle,
  MessageCircleQuestion,
  GraduationCap,
} from 'lucide-react';
import PublicNav from '@/src/components/ui/publicnav';
import FaqAccordion from '@/src/components/ui/FaqAccordion';
import BrandMark from '@/src/components/ui/BrandMark';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HireAssess Assessment Platform",

  description:
    "HireAssess helps organizations create online assessments, invite candidates, evaluate Behavioural and Logical skills, and generate instant reports.",

  keywords: [
    "Online Assessment",
    "Candidate Assessment",
    "Hiring Platform",
    "Behavioural Test",
    "Logical Assessment",
    "Recruitment Software",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "HireAssess - Online Assessment Platform",
    description:
      "Create assessments, invite candidates, evaluate skills, and hire better with HireAssess.",
    url: "https://hireassess.brainhuntventures.com",
    images: [
      {
        url: "/og-home.png",
      },
    ],
  },
};

// Shared color palette reused across sections for consistent, cheerful accents
const PALETTE = [
  '#6366f1', // indigo
  '#ef4444', // red
  '#0ea5e9', // sky
  '#f59e0b', // amber
  '#22c55e', // green
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Custom assessments',
    description:
      'Build role-specific assessments mixing Likert, situational judgement, forced-choice, logical reasoning, analytical, and personality questions — scaled to Entry, Mid, or Top-level roles.',
    color: PALETTE[0],
  },
  {
    icon: Users,
    title: 'Candidate management',
    description:
      'Invite candidates per client, track invitations through every stage, and keep everything scoped to the right company and client.',
    color: PALETTE[4],
  },
  {
    icon: BarChart3,
    title: 'Actionable results',
    description:
      'Every attempt produces trait-level scoring and a structured report your team can act on immediately.',
    color: PALETTE[3],
  },
  {
    icon: Lock,
    title: 'Role-based access',
    description:
      'Fine-grained permissions per module — company admins, super admins, and custom roles all see exactly what they should.',
    color: PALETTE[2],
  },
];

const QUESTION_TYPES = [
  { icon: ListChecks, label: 'Likert scale', description: 'Measures attitude and agreement across role-relevant statements.', color: PALETTE[0] },
  { icon: MessagesSquare, label: 'Situational judgement', description: 'Presents realistic scenarios to score decision-making on the job.', color: PALETTE[1] },
  { icon: Shuffle, label: 'Forced choice', description: 'Pairs traits against each other to reduce social-desirability bias.', color: PALETTE[2] },
  { icon: Brain, label: 'Logical reasoning', description: 'Tests pattern recognition and structured problem-solving.', color: PALETTE[3] },
  { icon: Calculator, label: 'Analytical & numerical', description: 'Checks comfort with data, ratios, and quantitative reasoning.', color: PALETTE[4] },
  { icon: Type, label: 'Verbal reasoning', description: 'Assesses comprehension, inference, and written communication.', color: PALETTE[5] },
  { icon: Fingerprint, label: 'Personality & behavioral', description: 'Surfaces working style, motivators, and behavioral tendencies.', color: PALETTE[6] },
  { icon: Puzzle, label: 'Cognitive ability', description: 'Gauges general problem-solving speed and accuracy under time.', color: PALETTE[7] },
];

const STEPS = [
  {
    icon: FileEdit,
    title: 'Build the assessment',
    description:
      'Mix Likert, situational judgement, forced-choice, logical reasoning, and analytical questions, set scoring weights, and clone templates across role levels.',
    color: PALETTE[0],
  },
  {
    icon: Send,
    title: 'Invite candidates',
    description:
      'Add candidates under the right client and company. Each one gets a private, secure link to complete it on their own time.',
    color: PALETTE[1],
  },
  {
    icon: Timer,
    title: 'Candidates complete it',
    description:
      'A guided, timed experience with progress auto-saved — nothing is lost if a candidate steps away mid-session.',
    color: PALETTE[3],
  },
  {
    icon: TrendingUp,
    title: 'Review scored results',
    description:
      'Trait-level scoring and a structured report land the moment a candidate submits — ready to compare across your shortlist.',
    color: PALETTE[4],
  },
  {
    icon: FileText,
    title: 'Get the full report',
    description:
      'Download a print-ready, colour-coded report with strengths, development areas, and interview-ready follow-up questions for every candidate.',
    color: PALETTE[2],
  },
];

const INDUSTRIES = [
  {
    icon: Code2,
    title: 'Technology',
    description: 'Screen for problem-solving and technical judgement alongside culture fit — not just resumes and take-homes.',
    initials: 'TC',
    color: '#6366f1',
  },
  {
    icon: HeartPulse,
    title: 'Healthcare',
    description: 'Assess situational judgement under pressure, a critical signal for patient-facing and clinical support roles.',
    initials: 'HC',
    color: '#ef4444',
  },
  {
    icon: Landmark,
    title: 'Finance & Banking',
    description: 'Measure integrity, attention to detail, and risk judgement before a hire ever touches client funds.',
    initials: 'FB',
    color: '#0ea5e9',
  },
  {
    icon: ShoppingBag,
    title: 'Retail & Hospitality',
    description: 'Score customer-service instincts at scale, built for seasonal and high-volume hiring pushes.',
    initials: 'RH',
    color: '#f59e0b',
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    description: 'Evaluate safety-consciousness and reliability traits that correlate with floor performance.',
    initials: 'MF',
    color: '#64748b',
  },
  {
    icon: Headset,
    title: 'BPO & Support',
    description: 'Standardize screening across large applicant pools without losing signal on communication quality.',
    initials: 'BP',
    color: '#22c55e',
  },
];

const INDUSTRY_STATS = [
  { value: '6+', label: 'Industries served' },
  { value: '35', label: 'Questions per assessment' },
  { value: '3', label: 'Role levels supported' },
  { value: '5 min', label: 'Avg. time to solve' },
];

const TRUST_STATS = [
  { icon: Award, value: '98%', label: 'Assessment completion rate', color: PALETTE[4] },
  { icon: Clock3, value: '<48h', label: 'Avg. time to shortlist', color: PALETTE[2] },
  { icon: ShieldCheck, value: '30%', label: 'Fewer mis-hires reported', color: PALETTE[0] },
  { icon: Star, value: '4.6/5', label: 'Candidate experience rating', color: PALETTE[3] },
];

const SCORECARD_TRAITS = [
  { label: 'Problem solving', score: 88 },
  { label: 'Communication', score: 91 },
  { label: 'Integrity', score: 95 },
  { label: 'Resilience', score: 68 },
  { label: 'Analytical thinking', score: 74 },
];

// Score → color band: red (low), yellowish-orange (mid), green (high)
function getScoreColors(score: number) {
  if (score >= 85) {
    return {
      barFrom: '#22c55e', // green-500
      barTo: '#4ade80', // green-400
      text: '#16a34a', // green-600
    };
  }
  if (score >= 70) {
    return {
      barFrom: '#f59e0b', // amber-500 (yellowish-orange)
      barTo: '#fbbf24', // amber-400
      text: '#d97706', // amber-600
    };
  }
  return {
    barFrom: '#ef4444', // red-500
    barTo: '#f87171', // red-400
    text: '#dc2626', // red-600
  };
}

// What candidates and hiring teams get inside every generated report
const REPORT_HIGHLIGHTS = [
  {
    icon: Target,
    title: 'Overall score & grade',
    description: 'A single 0–100 score with a clear performance band — Needs development, Moderate, or Strength — so anyone can read it at a glance.',
    color: PALETTE[0],
  },
  {
    icon: BarChart3,
    title: 'Trait-level breakdown',
    description: 'Every competency plotted on a colour-coded 0–100 scale — green, amber, and red bands make strong and weak areas instantly visible.',
    color: PALETTE[2],
  },
  {
    icon: ThumbsUp,
    title: 'Top strengths',
    description: 'The candidate\u2019s highest-scoring traits, ranked and called out, so you know exactly what to lean on from day one.',
    color: PALETTE[4],
  },
  {
    icon: AlertTriangle,
    title: 'Development areas',
    description: 'Lower-scoring traits are flagged with plain-language context on why they matter for the role, not just a bare number.',
    color: PALETTE[1],
  },
  {
    icon: MessageCircleQuestion,
    title: 'Interview-ready questions',
    description: 'Tailored follow-up questions for every development area, ready to drop straight into your next interview or coaching conversation.',
    color: PALETTE[5],
  },
  {
    icon: GraduationCap,
    title: 'Training & coaching plan',
    description: 'A suggested training cycle for each gap — practice cases, mentorship, and review checkpoints — plus guidance on reusing it after each cycle.',
    color: PALETTE[3],
  },
];

const FAQS = [
  {
    question: 'What is HireAssess?',
    answer:
      'HireAssess is an assessment platform for hiring teams. You build role-specific assessments, invite candidates, and get trait-level scoring and structured reports back — so hiring decisions are backed by consistent, comparable data instead of gut feel.',
  },
  {
    question: 'How are candidates actually scored?',
    answer:
      'Each question type — Likert, situational judgement, forced-choice, logical reasoning, analytical, verbal, personality, and cognitive ability — contributes to trait-level scores based on the weights you set when building the assessment. Results are normalized so candidates across different assessments can still be compared fairly.',
  },
  {
    question: 'Can we customize assessments per role or level?',
    answer:
      'Yes. Assessments can be scaled for Entry, Mid, or Top-level roles, and you can clone an existing assessment as a starting point rather than building every one from scratch.',
  },
  {
    question: 'Who can see candidate results?',
    answer:
      'Visibility is controlled by role-based access. Company admins, super admins, and any custom roles you define only see the companies, clients, and results their permissions allow — nothing more.',
  },
  {
    question: 'Do you support multiple companies or clients under one account?',
    answer:
      'Yes. Candidates and assessments are scoped per client and company, so agencies and multi-brand teams can keep everything separated without spinning up separate accounts.',
  },
  {
    question: 'What happens if a candidate loses connection mid-assessment?',
    answer:
      "Progress auto-saves as they go, so a dropped connection or closed tab doesn't cost them their answers — they can pick back up from where they left off.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)] mb-2.5"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Bar-fill keyframe for the hero scorecard — scoped by unique name to avoid collisions */}
      <style>{`
        @keyframes hireassess-fill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
      `}</style>

      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 -top-24 h-96 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_60%)] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto w-full px-6 pt-20 pb-16">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
              {/* Left: copy */}
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--primary)]/15 text-[var(--primary)]">
                    <BrandMark size={28} />
                  </span>
                </div>
                <Eyebrow>Assessment platform</Eyebrow>
                <h1
                  className="text-[38px] sm:text-[52px] font-semibold tracking-tight leading-[1.05]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="text-[var(--foreground)]">Hiring decisions,</span>
                  <br />
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                    backed by data.
                  </span>
                </h1>
                <p className="text-[15.5px] text-[var(--muted)] mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  HireAssess helps your team build, assign, and score candidate assessments so every hire is measured
                  on the same objective bar, every time.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-8">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[13.5px] font-semibold px-6 py-3 hover:opacity-90 transition-opacity"
                  >
                    <LogIn size={16} />
                    Sign in
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-[13.5px] font-medium px-6 py-3 hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <Mail size={16} />
                    Contact us
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mt-9 text-[12.5px] text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[var(--primary)]" />
                    8 question types
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[var(--primary)]" />
                    3 role levels
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[var(--primary)]" />
                    Trait-level scoring
                  </span>
                </div>
              </div>

              {/* Right: signature element — a live-looking candidate scorecard */}
              <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                <div className="absolute -inset-6 bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_70%)] pointer-events-none" />
                <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        Candidate report
                      </p>
                      <p className="text-[14.5px] font-semibold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                        Senior Product Analyst
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--primary)]/12 text-[var(--primary)] text-[11px] font-semibold px-3 py-1.5">
                      <BarChart3 size={12} />
                      Ready
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {SCORECARD_TRAITS.map((trait, i) => {
                      const colors = getScoreColors(trait.score);
                      return (
                        <div key={trait.label}>
                          <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                            <span className="text-[var(--foreground)] font-medium">{trait.label}</span>
                            <span
                              className="font-semibold"
                              style={{ fontFamily: 'var(--font-mono)', color: colors.text }}
                            >
                              {trait.score}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--border)]/60 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                // @ts-expect-error — custom property used by the keyframe above
                                '--target-width': `${trait.score}%`,
                                background: `linear-gradient(to right, ${colors.barFrom}, ${colors.barTo})`,
                                animation: `hireassess-fill 1s ease-out ${i * 0.12}s both`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-[var(--border)]">
                    <span className="text-[11.5px] text-[var(--muted)]">Overall match</span>
                    <span
                      className="text-[19px] font-semibold text-[var(--primary)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      89%
                    </span>
                  </div>

                  {/* Legend for the color bands */}
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[var(--border)] text-[10.5px] text-[var(--muted)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                      85+ Strong
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: '#f59e0b' }} />
                      70–84 Moderate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: '#ef4444' }} />
                      &lt;70 Needs review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust stats strip — colorful icon badges */}
        <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
          <div className="max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST_STATS.map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}1f`, color }}
                >
                  <Icon size={14} />
                </span>
                <p className="text-[22px] font-semibold" style={{ fontFamily: 'var(--font-display)', color }}>
                  {value}
                </p>
                <p className="text-[12px] text-[var(--muted)] leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — connected steps, color-coded nodes */}
        <section id="how-it-works" className="max-w-5xl mx-auto w-full px-6 py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              From assessment to decision, in five steps
            </h2>
          </div>

          <div className="relative">
            <div
              className="hidden sm:block absolute top-5 left-[10%] right-[10%] h-px bg-gradient-to-r from-[#6366f1] via-[#f59e0b] to-[#22c55e] opacity-40"
              aria-hidden="true"
            />

            <div className="grid gap-8 sm:grid-cols-5 sm:gap-4 relative">
              {STEPS.map(({ icon: Icon, title, description, color }, i) => (
                <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <span
                    className="relative z-10 w-10 h-10 rounded-full ring-[6px] ring-[var(--background)] flex items-center justify-center mb-3.5"
                    style={{ background: `${color}22`, color }}
                  >
                    <Icon size={17} />
                  </span>
                  <p
                    className="text-[10.5px] uppercase tracking-[0.12em] mb-1 font-semibold"
                    style={{ fontFamily: 'var(--font-mono)', color }}
                  >
                    Step {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-[14.5px] font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {title}
                  </h3>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's inside your report — colorful cards with corner glow */}
        <section id="report" className="max-w-6xl mx-auto w-full px-6 pb-20 scroll-mt-20">
          <div className="text-center mb-10">
            <Eyebrow>The report you get</Eyebrow>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              One assessment, one deeply descriptive report
            </h2>
            <p className="text-[14px] text-[var(--muted)] mt-3 max-w-xl mx-auto leading-relaxed">
              Every completed attempt turns into a print-ready report — not just a number. Strengths, gaps,
              interview-ready follow-up questions, and a training plan, all in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_HIGHLIGHTS.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6 hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden"
                style={{ borderColor: `${color}30` }}
              >
                <div
                  className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.10] pointer-events-none"
                  style={{ background: color }}
                />
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${color}1f`, color }}
                >
                  <Icon size={18} />
                </span>
                <h3 className="text-[14.5px] font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h3>
                <p className="text-[13px] text-[var(--muted)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Question types — colorful icon badges */}
        <section id="question-types" className="max-w-6xl mx-auto w-full px-6 pb-20 scroll-mt-20">
          <div className="text-center mb-10">
            <Eyebrow>Question library</Eyebrow>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Eight question types, one scoring engine
            </h2>
            <p className="text-[14px] text-[var(--muted)] mt-3 max-w-lg mx-auto leading-relaxed">
              Mix and weight them however the role demands — every response still rolls up into the same comparable
              trait scores.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUESTION_TYPES.map(({ icon: Icon, label, description, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 transition-colors hover:-translate-y-0.5 hover:shadow-sm"
                style={{ borderColor: `${color}25` }}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3.5"
                  style={{ background: `${color}1f`, color }}
                >
                  <Icon size={16} />
                </span>
                <h3 className="text-[13.5px] font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {label}
                </h3>
                <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features — colorful icon badges */}
        <section id="features" className="max-w-5xl mx-auto w-full px-6 pb-20 scroll-mt-20">
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6 transition-colors hover:-translate-y-0.5 hover:shadow-sm"
                style={{ borderColor: `${color}25` }}
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${color}1f`, color }}
                >
                  <Icon size={18} />
                </span>
                <h3 className="text-[15px] font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h3>
                <p className="text-[13.5px] text-[var(--muted)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries — unchanged */}
        <section id="industries" className="max-w-6xl mx-auto w-full px-6 pb-20 scroll-mt-20">
          <div className="text-center mb-8">
            <Eyebrow>Built for every industry</Eyebrow>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Why teams like yours need it
            </h2>
            <p className="text-[14px] text-[var(--muted)] mt-3 max-w-lg mx-auto leading-relaxed">
              Every industry hires for different traits. HireAssess adapts the same scoring engine to what actually
              matters in your field.
            </p>

            {/* Avatar stack + stats counter strip */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-7">
              <div className="flex items-center -space-x-2.5">
                {INDUSTRIES.map(({ initials, color, title }) => (
                  <span
                    key={title}
                    title={title}
                    className="w-9 h-9 rounded-full ring-2 ring-[var(--background)] flex items-center justify-center text-[11px] font-semibold text-white shadow-sm"
                    style={{ background: color, fontFamily: 'var(--font-mono)' }}
                  >
                    {initials}
                  </span>
                ))}
                <span
                  className="w-9 h-9 rounded-full ring-2 ring-[var(--background)] bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center text-[10.5px] font-semibold shadow-sm"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  +
                </span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-5 sm:gap-7">
                {INDUSTRY_STATS.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-[17px] font-semibold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {value}
                    </p>
                    <p className="text-[10.5px] text-[var(--muted)] leading-snug whitespace-nowrap">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRIES.map(({ icon: Icon, title, description, initials, color }) => (
              <div
                key={title}
                className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
              >
                <div
                  className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.10] pointer-events-none"
                  style={{ background: color }}
                />
                <div className="flex items-center justify-between mb-3.5">
                  <span className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                    <Icon size={16} />
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-semibold text-white shadow-sm"
                    style={{ background: color, fontFamily: 'var(--font-mono)' }}
                  >
                    {initials}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h3>
                <p className="text-[14px] text-[var(--muted)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto w-full px-6 pb-20 scroll-mt-20">
          <div className="text-center mb-10">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Common questions
            </h2>
          </div>

          <FaqAccordion items={FAQS} />
        </section>

        {/* CTA band — subtle gradient wash */}
        <section className="max-w-6xl mx-auto w-full px-6 pb-20">
          <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{ background: 'linear-gradient(120deg, #6366f1, #22c55e, #f59e0b)' }}
            />
            <div className="relative">
              <h2 className="text-[19px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Ready to see it in action?
              </h2>
              <p className="text-[14px] text-[var(--muted)] mt-1">
                Sign in to your workspace, or reach out if your team hasn&apos;t been set up yet.
              </p>
            </div>
            <Link
              href="/login"
              className="relative flex items-center gap-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[13.5px] font-semibold px-5 py-3 hover:opacity-90 transition-opacity shrink-0"
            >
              Sign in
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--muted)]">
          <span style={{ fontFamily: 'var(--font-mono)' }}>© {new Date().getFullYear()} HireAssess Brainhunt Ventures. All Right Reserved.</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/#how-it-works" className="hover:text-[var(--foreground)] transition-colors">
              How it works
            </Link>
            <Link href="/#report" className="hover:text-[var(--foreground)] transition-colors">
              Report
            </Link>
            <Link href="/#industries" className="hover:text-[var(--foreground)] transition-colors">
              Industries
            </Link>
            <Link href="/#faq" className="hover:text-[var(--foreground)] transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-[var(--foreground)] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}