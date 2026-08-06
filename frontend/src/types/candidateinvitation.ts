export type InvitationStatus = 'SENT' | 'STARTED' | 'COMPLETED' | 'EXPIRED';

export interface CandidateRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CandidateInvitation {
  id: string;
  candidateId: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  candidate?: CandidateRef;
}

export interface CreateInvitationPayload {
  candidateId: string;
  expiresInHours?: number;
}

export interface ResendInvitationPayload {
  expiresInHours?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListInvitationsParams {
  page?: number;
  limit?: number;
  candidateId?: string;
  candidateName?: string;
  status?: InvitationStatus | '';
  sortBy?: 'status' | 'expiresAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}