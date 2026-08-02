'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ListChecks,
  MessagesSquare,
  Shuffle,
  ClipboardList,
  Building2,
} from 'lucide-react';
import CountdownTimer from '@/src/components/layout/exam/examAttempt/countDowntimer';
import ExamQuestionCard from '@/src/components/layout/exam/examAttempt/examQuestionCard';
import {
  resumeExamByToken,
  startAttemptByToken,
  getQuestionsByToken,
  getAttemptByToken,
  submitAttemptByToken,
  saveAnswerByToken,
  ApiError,
} from '@/src/lib/api/exam-attempts';
import type { QuestionBankItem, ResumeExamResponse } from '@/src/types/exam-attempt';

// Keys must match the real API response exactly (case-sensitive):
// { LIKERT: [...], FORCED_CHOICE: [...], SITUATIONAL_JUDGEMENT: [...] }
const GROUP_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  LIKERT: { label: 'Self-assessment', icon: ListChecks },
  SITUATIONAL_JUDGEMENT: { label: 'Situational judgement', icon: MessagesSquare },
  FORCED_CHOICE: { label: 'Forced choice', icon: Shuffle },
  ANALYTICAL: { label: 'Analytical reasoning', icon: ClipboardList },
  LOGICAL_REASONING: { label: 'Logical reasoning', icon: Building2 },
};

const GROUP_ORDER = ['LIKERT', 'SITUATIONAL_JUDGEMENT', 'FORCED_CHOICE', 'ANALYTICAL', 'LOGICAL_REASONING'] as const;

type Phase = 'loading' | 'ready' | 'submitting' | 'submitted' | 'expired' | 'error';

export default function ExamPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resume, setResume] = useState<ResumeExamResponse | null>(null);
  const [questions, setQuestions] = useState<Record<string, QuestionBankItem[]>>({});
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const savingIds = useRef(new Set<string>());

  const loadEverything = useCallback(async () => {
    try {
      // Start is idempotent — calling it when an attempt already exists just
      // returns that attempt (no re-randomized questions), so it's always
      // safe to call first rather than trying resume and guessing whether a
      // failure means "doesn't exist yet" from the HTTP status code alone.
      try {
        await startAttemptByToken(token);
      } catch (startErr) {
        // Invitation-level guards (already completed / already expired) are
        // expected once a candidate has finished or timed out — don't treat
        // those as fatal. Let the resume call below surface the real
        // terminal status (SUBMITTED/EXPIRED) from the attempt itself.
        const msg = startErr instanceof ApiError ? startErr.message.toLowerCase() : '';
        const expected = msg.includes('already') || msg.includes('expired');
        if (!expected) throw startErr;
      }

      const resumeData = await resumeExamByToken(token);

      if (resumeData.attempt.status === 'SUBMITTED') {
        setResume(resumeData);
        setPhase('submitted');
        return;
      }
      if (resumeData.attempt.status === 'EXPIRED') {
        setResume(resumeData);
        setPhase('expired');
        return;
      }

      const questionData = await getQuestionsByToken(token);

      // Defensive: filter out any null/undefined entries. This can happen
      // if a selected question ID doesn't resolve via the loader (bad data,
      // deleted question, etc). Without this, `q.id` below throws and the
      // whole page goes blank for the candidate.
      const safeQuestionData: Record<string, QuestionBankItem[]> = {};
      Object.keys(questionData).forEach((key) => {
        safeQuestionData[key] = (questionData[key] || []).filter(
          (q): q is QuestionBankItem => Boolean(q && q.id)
        );
      });

      const answerMap: Record<string, unknown> = {};
      resumeData.answers.forEach((a) => {
        answerMap[a.questionId] = a.answer;
      });

      setResume(resumeData);
      setQuestions(safeQuestionData);
      setAnswers(answerMap);
      setPhase('ready');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Something went wrong loading your assessment.');
      setPhase('error');
    }
  }, [token]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  // Periodic resync — catches server-side lazy expiry (e.g. tab was closed
  // past the deadline) without relying purely on the client-side countdown.
  useEffect(() => {
    if (phase !== 'ready') return;
    const interval = setInterval(async () => {
      try {
        const latest = await getAttemptByToken(token);
        if (latest.status === 'EXPIRED') {
          setPhase('expired');
        } else if (latest.status === 'SUBMITTED') {
          setPhase('submitted');
        } else {
          setResume((prev) =>
            prev
              ? {
                  ...prev,
                  attempt: {
                    ...prev.attempt,
                    remainingSeconds: latest.remainingSeconds,
                    remainingMinutes: latest.remainingMinutes,
                    remainingTime: latest.remainingTime,
                  },
                }
              : prev
          );
        }
      } catch {
        // Transient network issue — the next interval tick will retry.
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [phase, token]);

  const orderedGroups = useMemo(
    () => GROUP_ORDER.filter((g) => (questions[g]?.length ?? 0) > 0),
    [questions]
  );

  const totalQuestions = useMemo(
    () => orderedGroups.reduce((sum, g) => sum + (questions[g]?.length ?? 0), 0),
    [orderedGroups, questions]
  );
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const handleAnswer = async (groupKey: string, question: QuestionBankItem, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));
    savingIds.current.add(question.id);
    try {
      await saveAnswerByToken(token, {
        questionId: question.id,
        questionType: groupKey,
        category: question.category,
        answer,
      });
    } catch (err) {
      console.error(`Failed to save answer for ${question.id}`, err);
      // The attempt may have expired or been auto-submitted server-side
      // between the last poll and this save — don't let the candidate keep
      // answering into a void, surface the real state.
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (msg.includes('expired')) {
          setPhase('expired');
        } else if (msg.includes('submitted')) {
          setPhase('submitted');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to save your answer. Please check your connection.');
      }
    } finally {
      savingIds.current.delete(question.id);
    }
  };

  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  const handleSubmit = async () => {
    setPhase('submitting');
    try {
      await submitAttemptByToken(token);
      setPhase('submitted');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to submit your assessment.');
      setPhase('ready');
    }
  };

  const handleExpireFromTimer = useCallback(() => {
    // Client-side timer hit zero — submit automatically. The backend's own
    // lazy-expiry will mark it EXPIRED/auto-submit if this request is late.
    submitAttemptByToken(token)
      .then(() => setPhase('submitted'))
      .catch(() => setPhase('expired'));
  }, [token]);

  /* ------------------------------------------------------------------ */

  if (phase === 'loading') {
    return (
      <CenterShell>
        <Loader2 size={22} className="animate-spin text-[#3FDCC0]" />
        <p className="text-[13.5px] text-[#8891B8] mt-4">Loading your assessment…</p>
      </CenterShell>
    );
  }

  if (phase === 'error') {
    return (
      <CenterShell>
        <span className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </span>
        <p className="text-[15px] text-[#F2F4FA] font-medium">We couldn&apos;t load this assessment</p>
        <p className="text-[13.5px] text-[#8891B8] mt-1.5 max-w-sm">{errorMessage}</p>
      </CenterShell>
    );
  }

  if (phase === 'expired') {
    return (
      <CenterShell>
        <span className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </span>
        <p className="text-[15px] text-[#F2F4FA] font-medium">This assessment has expired</p>
        <p className="text-[13.5px] text-[#8891B8] mt-1.5 max-w-sm">
          The time limit was reached. Please contact the company that invited you if you believe this is a mistake.
        </p>
      </CenterShell>
    );
  }

  if (phase === 'submitted') {
    return (
      <CenterShell>
        <span className="w-12 h-12 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center mb-4">
          <CheckCircle2 size={22} />
        </span>
        <p className="text-[15px] text-[#F2F4FA] font-medium">Your assessment has been submitted</p>
        <p className="text-[13.5px] text-[#8891B8] mt-1.5 max-w-sm">
          Thank you{resume?.candidate ? `, ${resume.candidate.firstName}` : ''} — you can close this window now.
        </p>
      </CenterShell>
    );
  }

  // phase === 'ready' | 'submitting'
  return (
    <div className="min-h-screen bg-[#0B0F26]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0B0F26]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
              <ShieldCheck size={14} />
            </span>
            <span className="text-[13.5px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
              {resume?.assessment?.name ?? resume?.assessment?.title ?? 'Assessment'}
            </span>
          </div>
          {resume && (
            <CountdownTimer
              key={resume.attempt.remainingSeconds}
              initialSeconds={resume.attempt.remainingSeconds}
              onExpire={handleExpireFromTimer}
            />
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06]">
          <div
            className="h-full bg-[#3FDCC0] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <p className="text-[12.5px] text-[#565F8C]" style={{ fontFamily: 'var(--font-mono)' }}>
          {answeredCount} of {totalQuestions} answered ({progressPct}%)
        </p>

        {orderedGroups.map((groupKey) => {
          const meta = GROUP_META[groupKey];
          const Icon = meta.icon;
          return (
            <div key={groupKey} className="space-y-4">
              <div className="flex items-center gap-2 pt-2">
                <Icon size={14} />
                <h2
                  className="text-[13px] font-semibold text-[#F2F4FA] uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {meta.label}
                </h2>
              </div>
              {questions[groupKey].map((q, i) => (
                <ExamQuestionCard
                  key={q.id}
                  groupKey={groupKey}
                  question={q}
                  index={i}
                  answer={answers[q.id]}
                  onAnswer={(answer) => handleAnswer(groupKey, q, answer)}
                />
              ))}
            </div>
          );
        })}

        {errorMessage && (
          <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end pt-4 pb-16">
          {!confirmingSubmit ? (
            <button
              onClick={() => setConfirmingSubmit(true)}
              disabled={phase === 'submitting'}
              className="rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold px-6 py-3 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-50"
            >
              Submit assessment
            </button>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#161C3A] px-5 py-4 flex items-center gap-4">
              <p className="text-[13px] text-[#AAB2D4]">
                Submit now? You can&apos;t change answers after this.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmingSubmit(false)}
                  className="rounded-lg px-3.5 py-2 text-[12.5px] text-[#AAB2D4] hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={phase === 'submitting'}
                  className="flex items-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[12.5px] font-semibold px-3.5 py-2 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-50"
                >
                  {phase === 'submitting' && <Loader2 size={13} className="animate-spin" />}
                  Yes, submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F26] flex flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}