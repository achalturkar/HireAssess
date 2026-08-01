import type { PaginationMeta } from '@/src/types/user';

export type CandidateStatus = 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'WITHDRAWN';

export interface ClientRef {
  id: string;
  name: string;
}

export interface CandidateOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  client?: ClientRef | null;
}

export interface ListCandidatesParams {
  search?: string;
  limit?: number;
  clientId?: string;
}

export interface Candidate {
  id: string;
  companyId: string;
  assessmentId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: CandidateStatus;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}


export interface CandidateFormValues {
  clientId: string;
  assessmentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export type { PaginationMeta };