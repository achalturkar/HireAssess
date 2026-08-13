'use client';

import { useMemo } from 'react';
import type { Permission } from '@/src/types/permission';
import { groupPermissionsByModule } from '@/src/types/permission';

interface PermissionMatrixProps {
  allPermissions: Permission[];
  selectedIds: Set<string>;
  onToggle: (permissionId: string) => void;
  onToggleModule: (moduleKeys: string[], nextState: boolean) => void;
  disabled?: boolean;
}

export function PermissionMatrix({
  allPermissions,
  selectedIds,
  onToggle,
  onToggleModule,
  disabled,
}: PermissionMatrixProps) {
  const groups = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);
  const actionColumns = useMemo(() => {
    const set = new Set<string>();
    allPermissions.forEach((p) => set.add(p.action));
    const order = ['view', 'create', 'update', 'delete', 'manage'];
    return Array.from(set).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [allPermissions]);

  if (!allPermissions.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center text-[13px] text-[var(--muted)]">
        No permissions available to assign.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div
        className="grid grid-cols-[minmax(140px,1fr)_repeat(var(--cols),72px)] border-b border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
        style={{ ['--cols' as string]: actionColumns.length }}
      >
        <div className="px-4 py-2.5" style={{ fontFamily: 'var(--font-mono)' }}>
          Module
        </div>
        {actionColumns.map((action) => (
          <div key={action} className="flex items-center justify-center px-2 py-2.5">
            {action}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {groups.map((group) => {
          const groupIds = group.permissions.map((p) => p.id);
          const groupSelectedCount = groupIds.filter((id) => selectedIds.has(id)).length;
          const allOn = groupSelectedCount === groupIds.length;
          const someOn = groupSelectedCount > 0 && !allOn;

          return (
            <div
              key={group.module}
              className="grid grid-cols-[minmax(140px,1fr)_repeat(var(--cols),72px)] items-center"
              style={{ ['--cols' as string]: actionColumns.length }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggleModule(groupIds, !allOn)}
                className="flex items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-[var(--foreground)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                title={allOn ? `Clear all ${group.module} permissions` : `Grant all ${group.module} permissions`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    allOn ? 'bg-amber-500' : someOn ? 'bg-amber-500/50' : 'bg-[var(--border)]'
                  }`}
                  aria-hidden
                />
                <span className="text-[13px] tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                  {group.module}
                </span>
              </button>

              {actionColumns.map((action) => {
                const perm = group.permissions.find((p) => p.action === action);
                if (!perm) {
                  return (
                    <div key={action} className="flex justify-center px-2 py-2.5 text-[var(--border)]">
                      —
                    </div>
                  );
                }
                const on = selectedIds.has(perm.id);
                return (
                  <div key={action} className="flex justify-center px-2 py-2.5">
                    <button
                      type="button"
                      disabled={disabled}
                      role="switch"
                      aria-checked={on}
                      aria-label={perm.key}
                      title={perm.key}
                      onClick={() => onToggle(perm.id)}
                      className={`relative h-5 w-9 rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 ${
                        on ? 'bg-amber-500' : 'bg-[var(--surface-muted)]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
                          on ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}