'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Client, ClientFormValues, CompanyRef } from '@/src/types/client';

interface Props {
  mode: 'create' | 'edit';
  client?: Client | null;
  companies: CompanyRef[];
  isSuperAdmin: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => void;
}

const inputClass =
  'w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass = 'block text-[11.5px] font-medium text-[#AAB2D4] mb-1.5';

const sectionTitleClass =
  'text-[11px] uppercase tracking-[0.12em] text-[#565F8C] mb-3 mt-1';

function empty(v: string | null | undefined) {
  return v ?? '';
}

export default function ClientFormModal({
  mode,
  client,
  companies,
  isSuperAdmin,
  submitting,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ClientFormValues>({
    companyId: client?.companyId ?? '',
    clientCode: empty(client?.clientCode),
    name: empty(client?.name),
    logoUrl: empty(client?.logoUrl),
    website: empty(client?.website),
    industry: empty(client?.industry),
    contactName: empty(client?.contactName),
    contactEmail: empty(client?.contactEmail),
    contactPhone: empty(client?.contactPhone),
    gstNumber: empty(client?.gstNumber),
    panNumber: empty(client?.panNumber),
    addressLine1: empty(client?.addressLine1),
    addressLine2: empty(client?.addressLine2),
    city: empty(client?.city),
    state: empty(client?.state),
    country: empty(client?.country),
    postalCode: empty(client?.postalCode),
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const set = (key: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const isValid =
    values.clientCode.trim() &&
    values.name.trim() &&
    (mode === 'edit' || !isSuperAdmin || values.companyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#060819]/70 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] sticky top-0 bg-[#161C3A] z-10">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-0.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {mode === 'create' ? 'New client' : 'Edit client'}
            </p>
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {mode === 'create' ? 'Add a client' : client?.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {error && (
            <div className="rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-2.5 text-[12.5px] text-[#FF6B6B]">
              {error}
            </div>
          )}

          {/* Basics */}
          <div>
            <p className={sectionTitleClass}>Basics</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Client code</label>
                  <input
                    className={inputClass}
                    value={values.clientCode}
                    onChange={set('clientCode')}
                    placeholder="ACME-01"
                    disabled={submitting}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Client name</label>
                  <input
                    className={inputClass}
                    value={values.name}
                    onChange={set('name')}
                    placeholder="Acme Corp"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              {isSuperAdmin && mode === 'create' && (
                <div>
                  <label className={labelClass}>Company</label>
                  <select
                    className={inputClass}
                    value={values.companyId}
                    onChange={(e) => setValues((v) => ({ ...v, companyId: e.target.value }))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Industry</label>
                  <input
                    className={inputClass}
                    value={values.industry}
                    onChange={set('industry')}
                    placeholder="Manufacturing"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    className={inputClass}
                    value={values.website}
                    onChange={set('website')}
                    placeholder="https://acme.com"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Logo URL</label>
                <input
                  className={inputClass}
                  value={values.logoUrl}
                  onChange={set('logoUrl')}
                  placeholder="https://acme.com/logo.png"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className={sectionTitleClass}>Contact</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Contact name</label>
                <input
                  className={inputClass}
                  value={values.contactName}
                  onChange={set('contactName')}
                  placeholder="Jane Doe"
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contact email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={values.contactEmail}
                    onChange={set('contactEmail')}
                    placeholder="jane@acme.com"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact phone</label>
                  <input
                    className={inputClass}
                    value={values.contactPhone}
                    onChange={set('contactPhone')}
                    placeholder="+1 555 000 0000"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tax IDs */}
          <div>
            <p className={sectionTitleClass}>Tax identifiers</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>GST number</label>
                <input
                  className={inputClass}
                  value={values.gstNumber}
                  onChange={set('gstNumber')}
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className={labelClass}>PAN number</label>
                <input
                  className={inputClass}
                  value={values.panNumber}
                  onChange={set('panNumber')}
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <p className={sectionTitleClass}>Address</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Address line 1</label>
                <input
                  className={inputClass}
                  value={values.addressLine1}
                  onChange={set('addressLine1')}
                  placeholder="Street address"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className={labelClass}>Address line 2</label>
                <input
                  className={inputClass}
                  value={values.addressLine2}
                  onChange={set('addressLine2')}
                  placeholder="Suite, floor, etc."
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    value={values.city}
                    onChange={set('city')}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    className={inputClass}
                    value={values.state}
                    onChange={set('state')}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    className={inputClass}
                    value={values.country}
                    onChange={set('country')}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className={labelClass}>Postal code</label>
                  <input
                    className={inputClass}
                    value={values.postalCode}
                    onChange={set('postalCode')}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 sticky bottom-0 bg-[#161C3A] pb-0.5">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13.5px] font-semibold py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create client' : 'Save changes'}
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