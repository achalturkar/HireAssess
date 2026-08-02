'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  ClipboardList,
  Building2,
  Users,
  Layers,
  Clock,
  ListChecks,
  MessagesSquare,
  Shuffle,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { listClients } from '@/src/lib/api/clients';
import type { Client } from '@/src/types/client';
import type { Assessment, AssessmentFormValues, AssessmentLevel } from '@/src/types/assessment';
import type { CompanyRef } from '@/src/types/user';

interface AssessmentFormModalProps {
  mode: 'create' | 'edit';
  assessment: Assessment | null;
  companies: CompanyRef[];
  isSuperAdmin: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: AssessmentFormValues) => void;
}

const LEVELS: { value: AssessmentLevel; label: string; style: string }[] = [
  { value: 'ENTRY', label: 'Entry', style: 'bg-[#3FDCC0]/15 text-[#3FDCC0] border-[#3FDCC0]/30' },
  { value: 'MID', label: 'Mid', style: 'bg-[#F2AE55]/15 text-[#F2AE55] border-[#F2AE55]/30' },
  { value: 'TOP', label: 'Top', style: 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30' },
];

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

export default function AssessmentFormModal({
  mode,
  assessment,
  companies,
  isSuperAdmin,
  submitting,
  error,
  onClose,
  onSubmit,
}: AssessmentFormModalProps) {
  const { accessToken } = useAuth();

  const [values, setValues] = useState<AssessmentFormValues>({
    companyId: assessment?.companyId ?? '',
    clientId: assessment?.clientId ?? '',
    name: assessment?.name ?? '',
    level: assessment?.level ?? '',
    likertCount: String(assessment?.likertCount ?? 0),
    sjqCount: String(assessment?.sjqCount ?? 0),
    forcedChoiceCount: String(assessment?.forcedChoiceCount ?? 0),
    analyticalCount: String(assessment?.analyticalCount ?? 0),
    logicalReasoningCount: String(assessment?.logicalReasoningCount ?? 0),
    durationMinutes: assessment ? String(assessment.durationMinutes) : '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClientsLoading(true);
      setClientsError(null);
      try {
        const res = await listClients(
          { page: 1, limit: 200, status: 'ACTIVE', sortBy: 'name', sortOrder: 'asc' },
          accessToken
        );
        if (!cancelled) setAllClients(res.items);
      } catch {
        if (!cancelled) setClientsError('Could not load clients.');
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const clientOptions = useMemo(() => {
    if (mode === 'create' && isSuperAdmin && values.companyId) {
      return allClients.filter((c) => c.companyId === values.companyId);
    }
    return allClients;
  }, [allClients, mode, isSuperAdmin, values.companyId]);

  const totalQuestions =
    (Number(values.likertCount) || 0) +
    (Number(values.sjqCount) || 0) +
    (Number(values.forcedChoiceCount) || 0) +
    (Number(values.analyticalCount) || 0) +
    (Number(values.logicalReasoningCount) || 0);

  const set = (field: keyof AssessmentFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!values.name.trim() || values.name.trim().length < 2) {
      setValidationError('Assessment name must be at least 2 characters.');
      return;
    }
    if (mode === 'create' && isSuperAdmin && !values.companyId) {
      setValidationError('Select a company for this assessment.');
      return;
    }
    if (!values.clientId) {
      setValidationError('Select a client for this assessment.');
      return;
    }
    if (!values.level) {
      setValidationError('Select an assessment level.');
      return;
    }
    if (!values.durationMinutes || Number(values.durationMinutes) < 1) {
      setValidationError('Duration must be at least 1 minute.');
      return;
    }
    if (totalQuestions <= 0) {
      setValidationError(
        'Add at least one question (Likert, SJQ, Forced Choice, Analytical, or Logical Reasoning).'
      );
      return;
    }

    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
              <ClipboardList size={16} />
            </span>
            <h2 className="text-[15px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
              {mode === 'create' ? 'Create assessment' : 'Edit assessment'}
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
            {(error || validationError || clientsError) && (
              <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-[13px] px-3.5 py-2.5">
                {validationError || error || clientsError}
              </div>
            )}

            <Field label="Assessment name" icon={ClipboardList}>
              <input
                value={values.name}
                onChange={set('name')}
                placeholder="e.g. Sales Manager Screening"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {mode === 'create' && isSuperAdmin && (
                <Field label="Company" icon={Building2}>
                  <select
                    value={values.companyId}
                    onChange={(e) => setValues((v) => ({ ...v, companyId: e.target.value, clientId: '' }))}
                    className={inputClass}
                  >
                    <option value="">Select company…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Client" icon={Users}>
                <select
                  value={values.clientId}
                  onChange={set('clientId')}
                  disabled={clientsLoading || mode === 'edit'}
                  className={`${inputClass} disabled:opacity-60`}
                >
                  <option value="">{clientsLoading ? 'Loading clients…' : 'Select client…'}</option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Level" icon={Layers}>
                <select value={values.level} onChange={set('level')} className={inputClass}>
                  <option value="">Select level…</option>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Duration (minutes)" icon={Clock}>
                <input
                  type="number"
                  min={1}
                  value={values.durationMinutes}
                  onChange={set('durationMinutes')}
                  placeholder="60"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-[#8891B8] flex items-center justify-between">
                <span>Question composition</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    totalQuestions > 0
                      ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]'
                      : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {totalQuestions} total
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Likert" icon={ListChecks}>
                  <input
                    type="number"
                    min={0}
                    value={values.likertCount}
                    onChange={set('likertCount')}
                    className={inputClass}
                  />
                </Field>
                <Field label="SJQ" icon={MessagesSquare}>
                  <input
                    type="number"
                    min={0}
                    value={values.sjqCount}
                    onChange={set('sjqCount')}
                    className={inputClass}
                  />
                </Field>
                <Field label="Forced choice" icon={Shuffle}>
                  <input
                    type="number"
                    min={0}
                    value={values.forcedChoiceCount}
                    onChange={set('forcedChoiceCount')}
                    className={inputClass}
                  />
                </Field>
                <Field label="Analytical" icon={ClipboardList}>
                  <input
                    type="number"
                    min={0}
                    value={values.analyticalCount}
                    onChange={set('analyticalCount')}
                    className={inputClass}
                  />
                </Field>
                <Field label="Logical reasoning" icon={Building2}>
                  <input
                    type="number"
                    min={0}
                    value={values.logicalReasoningCount}
                    onChange={set('logicalReasoningCount')}
                    className={inputClass}
                  />
                </Field>
              </div>
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
              {mode === 'create' ? 'Create assessment' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}