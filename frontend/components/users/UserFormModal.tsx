'use client';

import { useEffect, useState } from 'react';
import type { User, RoleRef, CompanyRef, UserStatus } from '@/src/types/user';

interface Props {
  mode: 'create' | 'edit';
  user?: User | null;
  roles: RoleRef[];
  companies: CompanyRef[];
  isSuperAdmin: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleId: string;
    companyId: string;
    password: string;
    status: UserStatus;
  }) => void;
}

const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 1L14 14M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const inputClass =
  'w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass = 'block text-[11.5px] font-medium text-[#AAB2D4] mb-1.5';

export default function UserFormModal({
  mode,
  user,
  roles,
  companies,
  isSuperAdmin,
  submitting,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [roleId, setRoleId] = useState(user?.role?.id ?? '');
  const [companyId, setCompanyId] = useState(user?.companyId ?? '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<UserStatus>(user?.status ?? 'ACTIVE');

  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ firstName, lastName, email, phone, roleId, companyId, password, status });
  };

  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    (mode === 'edit' || email.trim()) &&
    roleId &&
    (mode === 'edit' || !isSuperAdmin || companyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060819]/70 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] sticky top-0 bg-[#161C3A]">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-0.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {mode === 'create' ? 'New user' : 'Edit user'}
            </p>
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {mode === 'create' ? 'Invite a user' : `${user?.firstName} ${user?.lastName}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-2.5 text-[12.5px] text-[#FF6B6B]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jordan"
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Reyes"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@company.com"
              disabled={submitting || mode === 'edit'}
              required={mode === 'create'}
            />
            {mode === 'edit' && (
              <p className="text-[11px] text-[#565F8C] mt-1">Email can&apos;t be changed after creation.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              disabled={submitting}
            />
          </div>

          {isSuperAdmin && mode === 'create' && (
            <div>
              <label className={labelClass}>Company</label>
              <select
                className={inputClass}
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Role</label>
            <select
              className={inputClass}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {mode === 'edit' && (
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                disabled={submitting}
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <label className={labelClass}>Password (optional)</label>
              <input
                type="text"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate and email it"
                disabled={submitting}
              />
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-white/[0.1] text-[#AAB2D4] text-[13.5px] font-medium py-2.5 px-4 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}