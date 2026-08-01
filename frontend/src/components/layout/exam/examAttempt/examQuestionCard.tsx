'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { QuestionBankItem } from '@/src/types/exam-attempt';

const LIKERT_POINTS = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
];

interface SjqOption {
  id: string;
  text: string;
  category?: string;
  score?: number;
}

interface ForcedStatement {
  id: string;
  text: string;
  category?: string;
}

// Answer shapes must match the backend validator in
// candidate-answer.services.js exactly:
//   LIKERT                -> { answer: number }        (1-5)
//   SITUATIONAL_JUDGEMENT  -> { selectedOption: string } (question-bank option id)
//   FORCED_CHOICE          -> { most: string, least: string } (both required, must differ)
type LikertAnswer = { answer: number };
type SjqAnswer = { selectedOption: string };
type ForcedChoiceAnswer = { most?: string; least?: string };

// The three question-bank shapes differ per type (see the sample API
// response): LIKERT has `question`, SITUATIONAL_JUDGEMENT has `scenario` +
// `options`, FORCED_CHOICE has `items` (not `options`) and no top-level
// text at all. QuestionBankItem is treated loosely here rather than
// forcing one shared shape onto all three.
type RawQuestion = QuestionBankItem & {
  question?: string;
  scenario?: string;
  questionText?: string;
  options?: SjqOption[];
  items?: ForcedStatement[];
};

interface ExamQuestionCardProps {
  groupKey: 'LIKERT' | 'SITUATIONAL_JUDGEMENT' | 'FORCED_CHOICE' | string;
  question: QuestionBankItem;
  index: number;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
}

export default function ExamQuestionCard({ groupKey, question, index, answer, onAnswer }: ExamQuestionCardProps) {
  const q = question as RawQuestion;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-6 py-5">
      <p
        className="text-[11px] uppercase tracking-wide text-[#565F8C] mb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Question {index + 1}
      </p>

      {groupKey === 'LIKERT' && (
        <LikertBlock question={q} value={(answer as LikertAnswer | undefined)?.answer} onAnswer={onAnswer} />
      )}
      {groupKey === 'SITUATIONAL_JUDGEMENT' && (
        <SjqBlock
          question={q}
          selectedOptionId={(answer as SjqAnswer | undefined)?.selectedOption}
          onAnswer={onAnswer}
        />
      )}
      {groupKey === 'FORCED_CHOICE' && (
        <ForcedChoiceBlock question={q} value={answer as ForcedChoiceAnswer | undefined} onAnswer={onAnswer} />
      )}
      {!['LIKERT', 'SITUATIONAL_JUDGEMENT', 'FORCED_CHOICE'].includes(groupKey) && (
        <p className="text-[13px] text-[#8891B8]">{q.question ?? q.scenario ?? q.questionText ?? '—'}</p>
      )}
    </div>
  );
}

function LikertBlock({
  question,
  value,
  onAnswer,
}: {
  question: RawQuestion;
  value: number | undefined;
  onAnswer: (answer: unknown) => void;
}) {
  return (
    <div>
      <p className="text-[15px] text-[#F2F4FA] mb-4">{question.question}</p>
      <div className="grid grid-cols-5 gap-2">
        {LIKERT_POINTS.map((p) => {
          const selected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onAnswer({ answer: p.value } satisfies LikertAnswer)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors ${
                selected
                  ? 'border-[#3FDCC0] bg-[#3FDCC0]/10 text-[#3FDCC0]'
                  : 'border-white/[0.08] text-[#8891B8] hover:border-white/[0.16]'
              }`}
            >
              <span className="text-[15px] font-semibold">{p.value}</span>
              <span className="text-[10px] text-center leading-tight">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SjqBlock({
  question,
  selectedOptionId,
  onAnswer,
}: {
  question: RawQuestion;
  selectedOptionId: string | undefined;
  onAnswer: (answer: unknown) => void;
}) {
  const options = Array.isArray(question.options) ? question.options : [];
  return (
    <div>
      <p className="text-[15px] text-[#F2F4FA] mb-4 leading-relaxed">{question.scenario}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const selected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAnswer({ selectedOption: opt.id } satisfies SjqAnswer)}
              className={`w-full flex items-center gap-3 text-left rounded-lg border px-4 py-3 transition-colors ${
                selected
                  ? 'border-[#3FDCC0] bg-[#3FDCC0]/10'
                  : 'border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                  selected ? 'border-[#3FDCC0] bg-[#3FDCC0]' : 'border-[#565F8C]'
                }`}
              >
                {selected && <Check size={10} className="text-[#0B0F26]" />}
              </span>
              <span className="text-[13.5px] text-[#F2F4FA]">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ForcedChoiceBlock({
  question,
  value,
  onAnswer,
}: {
  question: RawQuestion;
  value: ForcedChoiceAnswer | undefined;
  onAnswer: (answer: unknown) => void;
}) {
  // Forced-choice statements live in `items`, not `options`.
  const statements = Array.isArray(question.items) ? question.items : [];

  // The backend rejects a save unless BOTH `most` and `least` are present
  // (and different). If we called onAnswer() the instant either side was
  // picked, the very first click would fire a save with only one field set
  // and the API would 400 with "Most and Least are required." — that was
  // the actual bug. So we buffer the in-progress pick locally and only
  // call onAnswer() once the pair is complete.
  const [pending, setPending] = useState<ForcedChoiceAnswer>(value ?? {});

  // Stay in sync if the committed answer changes from outside (e.g. after
  // resuming an in-progress attempt and answers load in from the server).
  useEffect(() => {
    setPending(value ?? {});
  }, [value?.most, value?.least]);

  const mostId = pending.most;
  const leastId = pending.least;

  const commitIfComplete = (next: ForcedChoiceAnswer) => {
    setPending(next);
    if (next.most && next.least && next.most !== next.least) {
      onAnswer(next satisfies ForcedChoiceAnswer);
    }
  };

  const pickMost = (id: string) => {
    commitIfComplete({ most: id, least: leastId === id ? undefined : leastId });
  };
  const pickLeast = (id: string) => {
    commitIfComplete({ least: id, most: mostId === id ? undefined : mostId });
  };

  return (
    <div>
      <p className="text-[13px] text-[#8891B8] mb-4">
        Pick the statement most like you, and the statement least like you.
      </p>
      <div className="space-y-2">
        {statements.map((s) => {
          const isMost = mostId === s.id;
          const isLeast = leastId === s.id;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                isMost ? 'border-[#3FDCC0]/50 bg-[#3FDCC0]/[0.06]' : isLeast ? 'border-[#FF6B6B]/50 bg-[#FF6B6B]/[0.06]' : 'border-white/[0.08]'
              }`}
            >
              <span className="text-[13.5px] text-[#F2F4FA] flex-1">{s.text}</span>
              <button
                type="button"
                onClick={() => pickMost(s.id)}
                className={`text-[11px] font-medium rounded-md px-2.5 py-1.5 shrink-0 transition-colors ${
                  isMost ? 'bg-[#3FDCC0] text-[#0B0F26]' : 'bg-white/[0.05] text-[#8891B8] hover:bg-[#3FDCC0]/15 hover:text-[#3FDCC0]'
                }`}
              >
                Most like me
              </button>
              <button
                type="button"
                onClick={() => pickLeast(s.id)}
                className={`text-[11px] font-medium rounded-md px-2.5 py-1.5 shrink-0 transition-colors ${
                  isLeast ? 'bg-[#FF6B6B] text-[#0B0F26]' : 'bg-white/[0.05] text-[#8891B8] hover:bg-[#FF6B6B]/15 hover:text-[#FF6B6B]'
                }`}
              >
                Least like me
              </button>
            </div>
          );
        })}
      </div>
      {(mostId || leastId) && !(mostId && leastId) && (
        <p className="text-[11px] text-[#8891B8] mt-2.5">
          Pick both a &quot;most&quot; and a &quot;least&quot; to save this answer.
        </p>
      )}
    </div>
  );
}