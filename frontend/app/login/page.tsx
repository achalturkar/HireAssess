'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

import PublicRoute from '@/src/auth/PublicRoute';
// import PublicNav from '@/components/layout/PublicNav';
import { login } from '@/src/auth/auth-service';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Invalid email or password. Please try again.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F26]">
      {/* <PublicNav /> */}

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px]">
          <Link
            href="/"
            className="flex flex-col items-center mb-8 group"
            aria-label="Go to homepage"
          >
            <span className="w-12 h-12 rounded-xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4 transition-transform group-hover:scale-105 group-active:scale-95">
              <ShieldCheck size={22} />
            </span>
            <h1
              className="text-[22px] font-semibold text-[#F2F4FA] tracking-tight group-hover:text-[#3FDCC0] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome back
            </h1>
            <p className="text-[13.5px] text-[#8891B8] mt-1.5">Sign in to your HireAssess account</p>
          </Link>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-6 py-7 space-y-4"
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
              <label className="text-[12px] text-[#8891B8]">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-60 mt-2"
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
            Need help? <Link href="/contact" className="text-[#3FDCC0] hover:underline">Contact us</Link>
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