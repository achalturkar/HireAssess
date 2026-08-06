'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { forgotPassword } from '@/src/auth/auth-service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F26]">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center mb-8 text-center">
            <span className="w-12 h-12 rounded-xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4">
              <ShieldCheck size={22} />
            </span>
            <h1 className="text-[22px] font-semibold text-[#F2F4FA] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Reset your password
            </h1>
            <p className="text-[13.5px] text-[#8891B8] mt-1.5">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-6 py-7 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-[#3FDCC0]/10 border border-[#3FDCC0]/25 text-[#3FDCC0] text-[13px] px-3.5 py-2.5">
                {message}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-[#565F8C] mt-6">
            Remembered your password?{' '}
            <Link href="/login" className="text-[#3FDCC0] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
