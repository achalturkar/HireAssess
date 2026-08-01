/**
 * Types mirror the shapes returned by assessment-result.services.js.
 * A few fields (Question, Assessment) weren't fully defined in the
 * backend snippet you shared — they're typed loosely below with a
 * comment so you can tighten them once you confirm the real schema.
 */

export type ScoreBand = "Low" | "Moderate" | "High";

export interface CandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TraitReportEntry {
  trait: string;
  score: number;
  band: ScoreBand;
}

export interface AssessmentReport {
  overall: { score: number; band: ScoreBand };
  traits: TraitReportEntry[];
  generatedAt: string;
}

export interface AssessmentResult {
  id: string;
  attemptId: string;
  overallScore: number;
  traitScores: Record<string, number>;
  report: AssessmentReport;
  createdAt: string;
  candidate?: CandidateSummary;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResultsListResponse {
  items: AssessmentResult[];
  meta: PaginationMeta;
}

export interface ResultsListQuery {
  page?: number;
  limit?: number;
  candidateId?: string;
  assessmentId?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: "overallScore" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/** Matches the {id, category, question, reverseScored, weight} shape
 * from your question bank — adjust field names if your loader differs. */
export interface Question {
  id: string;
  category: string;
  question: string;
  reverseScored?: boolean;
  weight?: number;
}

export interface CandidateAnswer {
  id: string;
  questionId: string;
  score: number | null;
  response?: unknown;
}

export interface QuestionAnswerPair {
  question: Question;
  answer: CandidateAnswer | null;
}

/** Shape is unconfirmed on the backend (result.attempt.assessment) —
 * loosened intentionally; narrow it once you confirm the real fields. */
export interface AssessmentSummary {
  id: string;
  title?: string;
  name?: string;
  [key: string]: unknown;
}

export interface CandidateResultDetail {
  candidate: CandidateSummary;
  assessment: AssessmentSummary;
  overallScore: number;
  traitScores: Record<string, number>;
  report: AssessmentReport;
  questions: QuestionAnswerPair[];
}