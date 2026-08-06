'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { resetPassword } from '@/src/auth/auth-service';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Password reset token is missing. Please use the link from your email.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword, confirmPassword);
      setMessage('Your password has been changed. Redirecting to login…');
      setTimeout(() => router.push('/login'), 1600);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to change password. Please try again.');
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
              Set a new password
            </h1>
            <p className="text-[13.5px] text-[#8891B8] mt-1.5">
              Create a secure password and sign in again.
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
              <label className="text-[12px] text-[#8891B8]">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="New password"
                  className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pr-9 pl-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565F8C] hover:text-[#AAB2D4] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-[#8891B8]">Confirm password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm password"
                  className="w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] pr-9 pl-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
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
              disabled={loading || !token}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Changing password…
                </>
              ) : (
                'Change password'
              )}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-[#565F8C] mt-6">
            Back to{' '}
            <Link href="/login" className="text-[#3FDCC0] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B0F26] text-[#F2F4FA]">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
