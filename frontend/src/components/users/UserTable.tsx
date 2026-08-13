'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { User } from '@/src/types/user';

interface UserTableProps {
  users: User[];
  showCompanyColumn: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSortChange: (sortBy: 'firstName' | 'lastName' | 'email' | 'createdAt') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Low-opacity fills instead of solid light-mode colors (bg-emerald-100 etc.)
// so the badge reads correctly whether --surface is light or dark.
const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  SUSPENDED: 'bg-amber-500/15 text-amber-400',
  INACTIVE: 'bg-[var(--surface-muted)] text-[var(--muted)]',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        statusStyles[status] ?? statusStyles.INACTIVE
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  label: string;
  field: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: 'firstName' | 'lastName' | 'email' | 'createdAt') => void;
}) {
  const active = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className={`flex items-center gap-1 text-left text-[11px] font-medium uppercase tracking-wide transition-colors ${
        active ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
      {active && <span className="text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );
}

export function UserTable({
  users,
  showCompanyColumn,
  canUpdate,
  canDelete,
  currentUserId,
  onEdit,
  onDelete,
  onSortChange,
  sortBy,
  sortOrder,
}: UserTableProps) {
  if (!users.length) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] m-4 rounded-lg py-16 text-center">
        <p className="text-[13.5px] font-medium text-[var(--foreground)]">No users match your filters</p>
        <p className="mt-1 text-[13px] text-[var(--muted)]">Try a different search term, or invite a new user.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full text-left">
        <thead>
          <tr
            className="text-[11px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <th className="px-5 py-3 font-medium">
              <SortHeader label="Name" field="firstName" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
            </th>
            <th className="px-5 py-3 font-medium">
              <SortHeader label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
            </th>
            <th className="px-5 py-3 font-medium">Role</th>
            {showCompanyColumn && <th className="px-5 py-3 font-medium">Company</th>}
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">
              <SortHeader label="Created" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
            </th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isSuperAdminRow = user.role?.isSuperAdmin;
            return (
              <tr key={user.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[11px] font-semibold text-[var(--primary)]">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <span className="text-[13.5px] font-medium text-[var(--foreground)]">
                      {user.firstName} {user.lastName}
                    </span>
                    {isSelf && <span className="text-[11px] text-[var(--muted)]">(you)</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-[var(--muted)]">{user.email}</td>
                <td className="px-5 py-3 text-[13px] text-[var(--muted)]">{user.role?.name ?? '—'}</td>
                {showCompanyColumn && (
                  <td className="px-5 py-3 text-[13px] text-[var(--muted)]">{user.company?.name ?? '—'}</td>
                )}
                <td className="px-5 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-5 py-3 text-[12.5px] text-[var(--muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      disabled={!canUpdate}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      aria-label={`Edit ${user.firstName} ${user.lastName}`}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    {!isSelf && !isSuperAdminRow && (
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        disabled={!canDelete}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        aria-label={`Delete ${user.firstName} ${user.lastName}`}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}