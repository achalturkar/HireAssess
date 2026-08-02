import { superAdminMenu } from "@/src/config/super-admin-menu";
import { companyMenu } from "@/src/config/company-menu";

import type { User } from '@/src/types/user';

export function buildMenu(user: User | null) {
  if (!user || !user.role) {
    return [];
  }

  if (user.role.isSuperAdmin) {
    return superAdminMenu.filter((item) => {
      if (item.permission === null) {
        return true;
      }
      return user.permissions.includes(item.permission);
    });
  }

  if (user.role.isCompanyAdmin) {
    return companyMenu.filter((item) => {
      if (item.permission === null) {
        return true;
      }
      return user.permissions.includes(item.permission);
    });
  }

  return [];
}
