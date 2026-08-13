export interface Permission {
  id: string;
  key: string;
  module: string;
  action: string;
  description?: string | null;   
}

export interface PermissionModuleGroup {
  module: string;
  permissions: Permission[];
}

/** Groups a flat permission list into { module, permissions[] } buckets, sorted by module name. */
export function groupPermissionsByModule(permissions: Permission[]): PermissionModuleGroup[] {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    const bucket = map.get(p.module) ?? [];
    bucket.push(p);
    map.set(p.module, bucket);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, perms]) => ({
      module,
      permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
    }));
}