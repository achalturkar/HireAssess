import type { PaginationMeta } from '@/src/types/user';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface AttemptCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Question ids the candidate was shown, grouped by category - matches
// the JSON shape stored on ExamAttempt.selectedQuestions, e.g.
//   { likert: ["lk12","lk55"], sjq: ["sj11"], forced: ["fc08"] }
export type SelectedQuestions = Record<string, string[]>;

export interface ExamAttempt {
  id: string;
  companyId: string;
  candidateId: string;
  assessmentId: string;
  startedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  status: AttemptStatus;
  selectedQuestions: SelectedQuestions;
  createdAt: string;
  updatedAt: string;
  candidate?: AttemptCandidateSummary;
}

export interface ListAttemptsParams {
  page?: number;
  limit?: number;
  candidateId?: string;
  assessmentId?: string;
  status?: AttemptStatus | '';
  sortBy?: 'startedAt' | 'submittedAt' | 'expiresAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export type { PaginationMeta };