'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, UserPlus, User, Mail, Phone, Users, ClipboardList } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { listClients } from '@/src/lib/api/clients';
import { listAssessments } from '@/src/lib/api/assessments';
import type { Client } from '@/src/types/client';
import type { Assessment } from '@/src/types/assessment';
import type { Candidate, CandidateFormValues } from '@/src/types/candidate';

interface CandidateFormModalProps {
  mode: 'create' | 'edit';
  candidate: Candidate | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CandidateFormValues) => void;
}

const inputClass =
  'w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors';

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-[#8891B8] flex items-center gap-1.5">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CandidateFormModal({
  mode,
  candidate,
  submitting,
  error,
  onClose,
  onSubmit,
}: CandidateFormModalProps) {
  const { accessToken } = useAuth();

  const [values, setValues] = useState<CandidateFormValues>({
    clientId: candidate?.clientId ?? '',
    assessmentId: candidate?.assessmentId ?? '',
    firstName: candidate?.firstName ?? '',
    lastName: candidate?.lastName ?? '',
    email: candidate?.email ?? '',
    phone: candidate?.phone ?? '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(mode === 'create');
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'create') return;
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const [clientsRes, assessmentsRes] = await Promise.all([
          listClients({ page: 1, limit: 200, status: 'ACTIVE', sortBy: 'name', sortOrder: 'asc' }, accessToken),
          listAssessments(
            { page: 1, limit: 200, status: 'ACTIVE', sortBy: 'name', sortOrder: 'asc' },
            accessToken
          ),
        ]);
        if (!cancelled) {
          setClients(clientsRes.items);
          setAssessments(assessmentsRes.items);
        }
      } catch {
        if (!cancelled) setOptionsError('Could not load clients/assessments.');
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, accessToken]);

  const assessmentOptions = useMemo(
    () => assessments.filter((a) => a.clientId === values.clientId),
    [assessments, values.clientId]
  );

  const set = (field: keyof CandidateFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setValidationError('First and last name are required.');
      return;
    }
    if (!values.email.trim()) {
      setValidationError('Email is required.');
      return;
    }
    if (mode === 'create' && !values.clientId) {
      setValidationError('Select a client.');
      return;
    }
    if (mode === 'create' && !values.assessmentId) {
      setValidationError('Select an assessment.');
      return;
    }

    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
              <UserPlus size={16} />
            </span>
            <h2 className="text-[15px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
              {mode === 'create' ? 'Invite candidate' : 'Edit candidate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {(error || validationError || optionsError) && (
              <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
                {validationError || error || optionsError}
              </div>
            )}

            {mode === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Client" icon={Users}>
                  <select
                    value={values.clientId}
                    onChange={(e) => setValues((v) => ({ ...v, clientId: e.target.value, assessmentId: '' }))}
                    disabled={loadingOptions}
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    <option value="">{loadingOptions ? 'Loading…' : 'Select client…'}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Assessment" icon={ClipboardList}>
                  <select
                    value={values.assessmentId}
                    onChange={set('assessmentId')}
                    disabled={loadingOptions || !values.clientId}
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    <option value="">
                      {!values.clientId ? 'Select a client first' : 'Select assessment…'}
                    </option>
                    {assessmentOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.level})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" icon={User}>
                <input
                  value={values.firstName}
                  onChange={set('firstName')}
                  placeholder="Jane"
                  className={inputClass}
                />
              </Field>
              <Field label="Last name" icon={User}>
                <input value={values.lastName} onChange={set('lastName')} placeholder="Doe" className={inputClass} />
              </Field>
              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  value={values.email}
                  onChange={set('email')}
                  placeholder="jane.doe@example.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone" icon={Phone}>
                <input
                  value={values.phone}
                  onChange={set('phone')}
                  placeholder="+1 555 010 2030"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#AAB2D4] hover:bg-white/[0.05] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {mode === 'create' ? 'Invite candidate' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}