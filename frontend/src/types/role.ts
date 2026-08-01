import type { PaginationMeta, CompanyRef } from '@/src/types/user';

export interface RolePermissionRef {
  id: string;
  key: string;
  module: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  companyId: string | null;
  isCompanyAdmin: boolean;
  isSuperAdmin: boolean;
  isSystem: boolean;
  permissions: RolePermissionRef[];
  createdAt: string;
  updatedAt: string;
  company?: CompanyRef | null;
}

export interface RoleFormValues {
  name: string;
  description: string;
  companyId: string;
  permissionIds: string[];
}

export type { PaginationMeta, CompanyRef };