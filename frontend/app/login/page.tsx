'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Users,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Building2,
} from 'lucide-react';
import BrandMark from '@/src/components/ui/BrandMark';
import PublicNav from '@/src/components/ui/publicnav';

import PublicRoute from '@/src/auth/PublicRoute';
import { login } from '@/src/auth/auth-service';
import { ApiError } from '@/src/lib/api';

const SIDE_TRAITS = [
  { label: 'Problem solving', score: 92 },
  { label: 'Integrity', score: 88 },
  { label: 'Communication', score: 65 },
];

function traitColor(score: number) {
  if (score >= 85) return { from: '#3FDCC0', to: '#63e8d1', text: '#3FDCC0' };
  if (score >= 70) return { from: '#F2AE55', to: '#f7c47f', text: '#F2AE55' };
  return { from: '#FF6B6B', to: '#ff9494', text: '#FF6B6B' };
}

const SIDE_HIGHLIGHTS = [
  { icon: ClipboardList, title: 'Role-specific assessments', color: '#3FDCC0' },
  { icon: Users, title: 'Invite & track candidates', color: '#818CF8' },
  { icon: BarChart3, title: 'Trait-scored reports', color: '#F2AE55' },
  { icon: ShieldCheck, title: 'Role-based access', color: '#F472B6' },
];

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDisplayError = (err: unknown): string => {
    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err);
        if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        return err;
      }
      return err;
    }
    if (err instanceof Error && typeof err.message === 'string') {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        return err.message;
      }
    }
    if (typeof err === 'object' && err !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      if (typeof anyErr.message === 'string') return anyErr.message;
      if (typeof anyErr.toString === 'function') return anyErr.toString();
    }
    return 'An error occurred while signing in. Please try again.';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const session = await login(email, password);

      let target = '/dashboard';
      if (session.user.role.isSuperAdmin) target = '/super-admin/dashboard';
      else if (session.user.role.isCompanyAdmin) target = '/company/dashboard';

      // Hard navigation on purpose: router.replace()+refresh() left the
      // target route reading stale auth state for a beat, causing a
      // flash back to /login before landing on the right dashboard.
      // A full navigation guarantees the new route picks up the fresh
      // session immediately.
      window.location.href = target;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.status === 422) {
          setError(formatDisplayError(err.message) || 'Please check the email and password fields.');
        } else {
          setError(formatDisplayError(err.message) || 'An error occurred while signing in. Please try again.');
        }
      } else {
        setError(formatDisplayError(err));
      }
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0B0F26] overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 18% 8%, rgba(63,220,192,0.14) 0%, transparent 60%), radial-gradient(50% 45% at 88% 92%, rgba(242,174,85,0.10) 0%, transparent 60%)',
        }}
      />
      <style>{`
        @keyframes sidebar-fill { from { width: 0%; } to { width: var(--target-width); } }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(63,220,192,0.35); }
          70% { box-shadow: 0 0 0 8px rgba(63,220,192,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,220,192,0); }
        }
        .badge-ring { animation: ringPulse 2.4s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .badge-ring { animation: none; }
        }
      `}</style>

      <div className="relative shrink-0 [&_a]:text-[#F2F4FA] [&_svg]:text-[#F2F4FA]">
        <PublicNav />
      </div>

      <div className="relative flex-1 min-h-0 grid lg:grid-cols-2 overflow-hidden">
        {/* Left: compact info / branding panel */}
        <div className="hidden lg:flex flex-col justify-center px-10 xl:px-14 py-6 border-r border-white/[0.06] relative overflow-hidden min-h-0">
          <div
            className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: '#3FDCC0' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-8 h-56 w-56 rounded-full opacity-[0.12] blur-3xl"
            style={{ background: '#F2AE55' }}
          />

          <div className="relative max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10.5px] text-[#8891B8] mb-3.5">
              <Sparkles size={12} className="text-[#3FDCC0]" />
              Assessment platform
            </div>

            <h2
              className="text-[24px] xl:text-[28px] font-semibold tracking-tight leading-[1.15] text-[#F2F4FA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Hiring decisions,{' '}
              <span className="bg-gradient-to-r from-[#3FDCC0] to-[#F2AE55] bg-clip-text text-transparent">
                backed by data.
              </span>
            </h2>
            <p className="text-[13px] text-[#8891B8] mt-2.5 leading-relaxed">
              Build assessments, invite candidates, and review trait-level reports the moment
              a candidate submits.
            </p>

            {/* Feature highlights — compact 2x2 grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {SIDE_HIGHLIGHTS.map(({ icon: Icon, title, color }) => (
                <div key={title} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <span
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: `${color}22`, color }}
                  >
                    <Icon size={13} />
                  </span>
                  <p className="text-[11.5px] font-medium text-[#F2F4FA] leading-tight">{title}</p>
                </div>
              ))}
            </div>

            {/* Mini live scorecard */}
            <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#161C3A] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Sample report
                </p>
                <span className="flex items-center gap-1 rounded-full bg-[#3FDCC0]/12 text-[#3FDCC0] text-[10px] font-semibold px-2 py-0.5">
                  <BarChart3 size={10} />
                  Ready
                </span>
              </div>
              <div className="space-y-2">
                {SIDE_TRAITS.map((trait, i) => {
                  const c = traitColor(trait.score);
                  return (
                    <div key={trait.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#AAB2D4]">{trait.label}</span>
                        <span style={{ color: c.text, fontFamily: 'var(--font-mono)' }}>{trait.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            // @ts-expect-error custom property for keyframe
                            '--target-width': `${trait.score}%`,
                            background: `linear-gradient(to right, ${c.from}, ${c.to})`,
                            animation: `sidebar-fill 0.8s ease-out ${i * 0.1}s both`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Register company / assessment callout */}
            <div className="mt-4 rounded-xl border border-[#3FDCC0]/20 bg-[#3FDCC0]/[0.06] px-3.5 py-3 flex items-center gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
                <Building2 size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-[#F2F4FA] leading-tight">
                  Want to register your company?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#3FDCC0] hover:underline mt-1"
                >
                  Contact us
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: login form */}
        <div className="flex items-center justify-center px-4 py-4 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[360px]">
            <Link href="/" className="flex flex-col items-center mb-4 group lg:hidden" aria-label="Go to homepage">
              <span className="badge-ring w-9 h-9 rounded-xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-2 transition-transform group-hover:scale-105 group-active:scale-95">
                <BrandMark size={18} />
              </span>
              <h1
                className="text-[18px] font-semibold text-[#F2F4FA] tracking-tight group-hover:text-[#3FDCC0] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome back
              </h1>
              <p className="text-[12px] text-[#8891B8] mt-1">Sign in to your HireAssess account</p>
            </Link>

            {/* Desktop heading (no logo, since navbar already shows it) */}
            <div className="hidden lg:block mb-4 text-center">
              <h1
                className="text-[21px] font-semibold text-[#F2F4FA] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome back
              </h1>
              <p className="text-[12.5px] text-[#8891B8] mt-1">Sign in to your HireAssess account</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] px-5 py-5 space-y-3"
            >
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[12.5px] px-3 py-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11.5px] text-[#8891B8]">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pl-8 pr-3 py-2 text-[13px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] text-[#8891B8]">Password</label>
                  <Link href="/forgot-password" className="text-[11.5px] text-[#3FDCC0] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pl-8 pr-8 py-2 text-[13px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565F8C] hover:text-[#AAB2D4] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-[12px] text-[#8891B8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border border-white/[0.16] bg-[#0B0F26] accent-[#3FDCC0] cursor-pointer"
                />
                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:brightness-[1.08] active:scale-[0.99] transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[12px] text-[#565F8C] mt-3.5">
              Need help?{' '}
              <Link href="/contact" className="text-[#3FDCC0] hover:underline">
                Contact us
              </Link>
            </p>

            {/* Mobile-only register callout (hidden on desktop since it's in the left panel) */}
            <div className="lg:hidden mt-3.5 rounded-xl border border-[#3FDCC0]/20 bg-[#3FDCC0]/[0.06] px-3.5 py-2.5 flex items-center gap-2.5">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
                <Building2 size={13} />
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-[#F2F4FA] leading-tight">
                  Want to register your company?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3FDCC0] hover:underline"
                >
                  Contact us
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginContent />
    </PublicRoute>
  );
}