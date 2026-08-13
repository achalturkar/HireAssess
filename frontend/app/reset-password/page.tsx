'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { resetPassword } from '@/src/auth/auth-service';

/* ------------------------------------------------------------------
   Theme tokens — light-value + dark: pair, matching the login page.
------------------------------------------------------------------- */

const pageBg = 'bg-slate-50 dark:bg-[#0B0F26]';
const textPrimary = 'text-slate-900 dark:text-[#F2F4FA]';
const textMuted = 'text-slate-500 dark:text-[#8891B8]';
const textFaint = 'text-slate-400 dark:text-[#565F8C]';
const cardBg = 'bg-white dark:bg-[#161C3A]';
const cardBorder = 'border-slate-200 dark:border-white/[0.08]';
const inputBg = 'bg-slate-50 dark:bg-[#0B0F26]';
const inputBorder = 'border-slate-200 dark:border-white/[0.08]';
const trackBg = 'bg-slate-200 dark:bg-white/[0.08]';

/* ------------------------------------------------------------------
   Password strength — five simple checks, scored 0-5. Same visual
   language (teal/amber/red) as the trait bars on the login page.
------------------------------------------------------------------- */

const REQUIREMENTS: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function strengthMeta(score: number) {
  if (score <= 1) return { label: 'Weak', color: '#FF6B6B' };
  if (score <= 3) return { label: 'Fair', color: '#F2AE55' };
  if (score === 4) return { label: 'Good', color: '#3FDCC0' };
  return { label: 'Strong', color: '#3FDCC0' };
}

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

  const checks = useMemo(
    () => REQUIREMENTS.map((r) => ({ ...r, passed: r.test(newPassword) })),
    [newPassword]
  );
  const score = checks.filter((c) => c.passed).length;
  const strength = strengthMeta(score);
  const showStrength = newPassword.length > 0;

  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = confirmPassword === newPassword && confirmPassword.length > 0;
  const passwordsMismatch = confirmTouched && !passwordsMatch;

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

    if (score < REQUIREMENTS.length) {
      setError('Please meet all password requirements before continuing.');
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
    <div className={`min-h-screen flex flex-col relative overflow-hidden ${pageBg}`}>
      {/* Ambient background glow, same treatment as the login page */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-100"
        style={{
          background:
            'radial-gradient(55% 45% at 15% 10%, rgba(63,220,192,0.14) 0%, transparent 60%), radial-gradient(45% 40% at 90% 90%, rgba(242,174,85,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <Link
            href="/login"
            className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-6 transition-colors ${textFaint} hover:text-slate-700 dark:hover:text-[#AAB2D4]`}
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>

          <div className="flex flex-col items-center mb-7 text-center">
            <span className="badge-ring w-12 h-12 rounded-xl bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4">
              <ShieldCheck size={22} />
            </span>
            <h1
              className={`text-[22px] font-semibold tracking-tight ${textPrimary}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Set a new password
            </h1>
            <p className={`text-[13.5px] mt-1.5 ${textMuted}`}>Create a secure password and sign in again.</p>
          </div>

          <style>{`
            @keyframes ringPulse {
              0% { box-shadow: 0 0 0 0 rgba(63,220,192,0.35); }
              70% { box-shadow: 0 0 0 8px rgba(63,220,192,0); }
              100% { box-shadow: 0 0 0 0 rgba(63,220,192,0); }
            }
            .badge-ring { animation: ringPulse 2.4s ease-out infinite; }
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.9); }
              100% { opacity: 1; transform: scale(1); }
            }
            .pop-in { animation: popIn 0.35s ease-out both; }
            @media (prefers-reduced-motion: reduce) {
              .badge-ring, .pop-in { animation: none; }
            }
          `}</style>

          {message ? (
            /* Success state */
            <div className={`rounded-2xl border ${cardBorder} ${cardBg} px-6 py-8 text-center pop-in`}>
              <span className="mx-auto w-12 h-12 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </span>
              <p className={`text-[15px] font-semibold mb-1.5 ${textPrimary}`}>Password changed</p>
              <p className={`text-[13px] ${textMuted}`}>{message}</p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin text-[#3FDCC0]" />
                <span className={`text-[12px] ${textFaint}`}>Taking you to sign in…</span>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`rounded-2xl border ${cardBorder} ${cardBg} shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] px-6 py-7 space-y-4`}
            >
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`text-[12px] ${textMuted}`}>New password</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textFaint}`}>
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="New password"
                    className={`w-full rounded-lg ${inputBg} border ${inputBorder} pl-9 pr-9 py-2.5 text-[13.5px] ${textPrimary} placeholder:text-slate-400 dark:placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${textFaint} hover:text-slate-600 dark:hover:text-[#AAB2D4]`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength meter */}
                {showStrength && (
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full overflow-hidden ${trackBg}`}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: i < score ? '100%' : '0%',
                              background: strength.color,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                      {checks.map((c) => (
                        <div key={c.label} className="flex items-center gap-1.5">
                          {c.passed ? (
                            <Check size={11} className="text-[#3FDCC0] shrink-0" />
                          ) : (
                            <X size={11} className={`shrink-0 ${textFaint}`} />
                          )}
                          <span className={`text-[11px] ${c.passed ? 'text-[#3FDCC0]' : textFaint}`}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={`text-[12px] ${textMuted}`}>Confirm password</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textFaint}`}>
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm password"
                    className={`w-full rounded-lg ${inputBg} border pl-9 pr-9 py-2.5 text-[13.5px] ${textPrimary} placeholder:text-slate-400 dark:placeholder:text-[#565F8C] outline-none focus:ring-1 transition-colors ${
                      passwordsMismatch
                        ? 'border-[#FF6B6B]/50 focus:border-[#FF6B6B]/60 focus:ring-[#FF6B6B]/20'
                        : `${inputBorder} focus:border-[#3FDCC0]/50 focus:ring-[#3FDCC0]/30`
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {confirmTouched && (
                      passwordsMatch ? (
                        <Check size={14} className="text-[#3FDCC0]" />
                      ) : (
                        <X size={14} className="text-[#FF6B6B]" />
                      )
                    )}
                  </span>
                </div>
                {passwordsMismatch && (
                  <p className="text-[11px] text-[#FF6B6B] mt-1">Passwords don't match yet.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-4 py-2.5 hover:brightness-[1.08] active:scale-[0.99] transition disabled:opacity-60 mt-2"
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
          )}

          {!message && (
            <p className={`text-center text-[12.5px] mt-6 ${textFaint}`}>
              Back to{' '}
              <Link href="/login" className="text-[#3FDCC0] hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={`min-h-screen flex items-center justify-center ${pageBg} ${textPrimary}`}>
          <Loader2 size={18} className="animate-spin text-[#3FDCC0] mr-2" />
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}