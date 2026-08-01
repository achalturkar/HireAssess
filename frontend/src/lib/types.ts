// Shared shapes mirroring the Prisma schema — kept in sync manually until
// a generated-types package is wired up between the API and web app.

export type ThemeMode = 'light' | 'dark';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  themeColor: string;
  themeMode: ThemeMode;
  isActive: boolean;
}

export interface ClientAccount {
  id: string;
  companyId: string;
  name: string;
  logoUrl?: string | null;
  industry?: string | null;
  isActive: boolean;
}

export interface Department {
  id: string;
  companyId: string;
  clientId?: string | null;
  name: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
}

export interface Role {
  id: string;
  companyId: string;
  name: string;
  isCompanyAdminRole: boolean;
  permissions: Permission[];
}

export interface AuthUser {
  id: string;
  companyId: string | null;
  clientId?: string | null;
  departmentId?: string | null;
  roleId: string | null;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: string[]; // flattened "module:action"
}

export interface DashboardSummary {
  totalCandidates: number;
  totalTests: number;
  resultsPublished: number;
  resultsPending: number;
  statusDistribution: { strong: number; moderate: number; low: number };
  monthlyTrend: { month: string; candidates: number }[];
}
