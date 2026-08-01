import type { PaginationMeta } from '@/src/types/user';

export type AssessmentLevel = 'ENTRY' | 'MID' | 'TOP';

export type AssessmentStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface Assessment {
  id: string;
  companyId: string;
  clientId: string;
  name: string;
  level: AssessmentLevel;
  likertCount: number;
  sjqCount: number;
  forcedChoiceCount: number;
  durationMinutes: number;
  status: AssessmentStatus;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentPayload {
  companyId?: string;
  clientId: string;
  name: string;
  level: AssessmentLevel;
  likertCount?: number;
  sjqCount?: number;
  forcedChoiceCount?: number;
  durationMinutes: number;
}

export interface UpdateAssessmentPayload {
  clientId?: string;
  name?: string;
  level?: AssessmentLevel;
  likertCount?: number;
  sjqCount?: number;
  forcedChoiceCount?: number;
  durationMinutes?: number;
  status?: AssessmentStatus;
}

export interface ListAssessmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  level?: AssessmentLevel | '';
  status?: AssessmentStatus | '';
  includeDeleted?: boolean;
  sortBy?: 'name' | 'level' | 'durationMinutes' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Controlled-input form state - every numeric field is a string until
// submit time, matching how AssessmentFormModal.tsx binds its <input>s.
export interface AssessmentFormValues {
  companyId: string;
  clientId: string;
  name: string;
  level: AssessmentLevel | '';
  likertCount: string;
  sjqCount: string;
  forcedChoiceCount: string;
  durationMinutes: string;
}

export type { PaginationMeta };