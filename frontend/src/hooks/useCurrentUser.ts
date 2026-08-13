import { useMemo } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
  companyId: string | null;
  role: {
    id: string;
    name: string;
    isSuperAdmin: boolean;
    isCompanyAdmin: boolean;
  };
  permissions: string[]; // flat list of permission keys, e.g. "roles.create"
}

/**
 * Reads the current session user. This assumes the app already stores the
 * decoded user (id, companyId, role, permissions) in localStorage under
 * "currentUser" after login — replace the read with your real auth context
 * / SWR hook if that's where session state actually lives.
 */
export function useCurrentUser(): CurrentUser | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
      return null;
    }
  }, []);
}

export function useCan(permissionKey: string): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  if (user.role.isSuperAdmin) return true;
  return user.permissions.includes(permissionKey);
}