export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface AttemptCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clientId?: string;
  clientName?: string;
}

export interface ExamAttempt {
  id: string;
  companyId: string;
  candidateId: string;
  assessmentId: string;
  startedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  status: AttemptStatus;
  selectedQuestions: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  remainingSeconds: number;
  remainingMinutes: number;
  remainingTime: string;
  candidate?: AttemptCandidateSummary;
}

// Shape returned by GET /exam-attempts/token/:token/questions.
// `options` is left loose — its structure differs by question type
// (likert scale points vs. SJQ choices vs. forced-choice quad statements)
// and the backend passes it through as raw JSON from questionBank.
export interface QuestionBankItem {
  id: string;
  questionCode?: string;
  type: string;
  category: string;
  questionText: string;
  options: unknown;
  difficulty?: string;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  questionType?: string;
  category?: string;
  answer: unknown;
  score?: number | null;
}

export interface ResumeExamResponse {
  candidate: AttemptCandidateSummary;
  // Backend bug: repository.findById selects `title` on Assessment, which
  // doesn't exist on the model (only `name` does) — this will be undefined
  // until that's fixed server-side.
  assessment: {
    id: string;
    name?: string;
    title?: string;
    durationMinutes: number;
    description?: string;
  };
  attempt: {
    id: string;
    status: AttemptStatus;
    startedAt: string | null;
    expiresAt: string | null;
    remainingSeconds: number;
    remainingMinutes: number;
    remainingTime: string;
  };
  selectedQuestions: Record<string, string[]>;
  answers: AttemptAnswer[];
  progress: {
    answered: number;
    total: number;
    percentage: number;
  };
}