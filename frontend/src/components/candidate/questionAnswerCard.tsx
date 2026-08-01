import type { QuestionAnswerPair } from "@/src/lib/typess";

export function QuestionAnswerCard({ question, answer }: QuestionAnswerPair) {
  return (
    <div className="border-b border-line/60 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">{question.category}</p>
          <p className="mt-1 text-sm text-ink">{question.question}</p>
        </div>
        <div className="shrink-0 font-mono text-sm text-ink-muted">
          {answer?.score ?? "—"}
        </div>
      </div>
    </div>
  );
}