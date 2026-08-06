'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import BrandMark from '@/src/components/ui/BrandMark';

import PublicRoute from '@/src/auth/PublicRoute';
// import PublicNav from '@/components/layout/PublicNav';
import { login } from '@/src/auth/auth-service';
import { ApiError } from '@/src/lib/api';



const SCORES = [
  { value: 55, color: 'teal' as const },
  { value: 85, color: 'amber' as const },
  { value: 40, color: 'teal' as const },
  { value: 70, color: 'teal' as const },
  { value: 95, color: 'amber' as const },
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
    <div className="relative min-h-screen flex flex-col bg-[#0B0F26] overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 18% 8%, rgba(63,220,192,0.14) 0%, transparent 60%), radial-gradient(50% 45% at 88% 92%, rgba(242,174,85,0.10) 0%, transparent 60%)',
        }}
      />
      <style>{`
        @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(63,220,192,0.35); }
          70% { box-shadow: 0 0 0 10px rgba(63,220,192,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,220,192,0); }
        }
        .bar-fill { transform-origin: bottom; animation: barGrow 0.9s cubic-bezier(.2,.8,.2,1) forwards; }
        .badge-ring { animation: ringPulse 2.4s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bar-fill { animation: none; transform: scaleY(1); }
          .badge-ring { animation: none; }
        }
      `}</style>

      {/* <PublicNav /> */}

      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="flex flex-col items-center mb-7 group" aria-label="Go to homepage">
            <span className="badge-ring w-12 h-12 rounded-xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4 transition-transform group-hover:scale-105 group-active:scale-95">
              <BrandMark size={22} />
            </span>
            <h1
              className="text-[22px] font-semibold text-[#F2F4FA] tracking-tight group-hover:text-[#3FDCC0] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome back
            </h1>
            <p className="text-[13.5px] text-[#8891B8] mt-1.5">Sign in to your HireAssess account</p>

            {/* Tiny brand scorecard strip */}
            <div className="flex items-end gap-1.5 h-6 mt-5" aria-hidden="true">
              {SCORES.map((s, i) => (
                <div
                  key={i}
                  className={`bar-fill w-1.5 rounded-full ${s.color === 'teal' ? 'bg-[#3FDCC0]/70' : 'bg-[#F2AE55]/70'}`}
                  style={{ height: `${s.value}%`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          </Link>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] px-6 py-7 space-y-4"
          >
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] text-[#8891B8]">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] text-[#8891B8]">Password</label>
                <Link href="/forgot-password" className="text-[12px] text-[#3FDCC0] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pl-9 pr-9 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565F8C] hover:text-[#AAB2D4] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-[#8891B8] cursor-pointer select-none">
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
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-4 py-2.5 hover:brightness-[1.08] active:scale-[0.99] transition disabled:opacity-60 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-[#565F8C] mt-6">
            Need help?{' '}
            <Link href="/contact" className="text-[#3FDCC0] hover:underline">
              Contact us
            </Link>
          </p>
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