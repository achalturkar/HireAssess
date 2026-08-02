export type ScoreBand = 'High' | 'Moderate' | 'Low';
export type ScoreStage = 'Outstanding' | 'Strong Fit' | 'Good Fit' | 'Potential Fit' | 'Needs Development';

export interface CandidateRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssessmentRef {
  id: string;
  name: string;
  level?: string;
  description?: string;
  durationMinutes?: number;
  client?: {
    name?: string;
  };
}

export interface TraitScore {
  trait: string;
  score: number;
  band: ScoreBand;
  stage?: ScoreStage;
}

export interface ResultReport {
  overall: { score: number; band: ScoreBand; stage?: ScoreStage };
  traits: TraitScore[];
  generatedAt: string;
}

export interface AssessmentResult {
  id: string;
  attemptId: string;
  overallScore: number;
  traitScores: Record<string, number>;
  report: ResultReport;
  createdAt: string;
  candidate?: CandidateRef;
}

export interface QuestionAnswerPair {
  question: {
    id: string;
    category?: string;
    type?: string;
    question?: string; // LIKERT
    scenario?: string; // SITUATIONAL_JUDGEMENT / analytical-style
    options?: { id: string; text: string; score?: number }[];
    items?: { id: string; text: string; category?: string }[]; // FORCED_CHOICE
  } | null;
  answer: {
    id?: string;
    questionId: string;
    questionType?: string;
    answer?: unknown;
    score?: number | null;
    category?: string;
  } | null;
}

export interface CandidateResultBundle {
  candidate?: CandidateRef;
  assessment?: AssessmentRef;
  overallScore: number;
  traitScores: Record<string, number>;
  report: ResultReport;
  questions: QuestionAnswerPair[];
  attemptId?: string;
  startedAt?: string;
  submittedAt?: string;
  assignment?: {
    assignedTo?: string;
    client?: string;
    description?: string;
  };
  remainingTimeSeconds?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResultsParams {
  page?: number;
  limit?: number;
  candidateId?: string;
  assessmentId?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'overallScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}