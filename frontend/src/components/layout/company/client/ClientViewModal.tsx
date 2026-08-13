'use client';

import { useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Globe,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Pencil,
} from 'lucide-react';
import type { Client, ClientStatus } from '@/src/types/client';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    ACTIVE: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
    INACTIVE: 'bg-[#565F8C]/20 text-[#8891B8]',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** A label/value pair used throughout the detail sections below. Renders
 *  nothing when the value is empty, so sections never show blank rows. */
function Field({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value?: string | null;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
}) {
  if (!value) return null;
  const content = (
    <p className="flex items-center gap-1.5 text-[13.5px] text-[#F2F4FA]">
      {Icon && <Icon size={12} className="text-[#565F8C] shrink-0" />}
      <span className="truncate">{value}</span>
    </p>
  );
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-[#565F8C] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:text-[#3FDCC0] transition-colors">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.1em] text-[#3FDCC0] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
      {children}
    </p>
  );
}

export default function ClientViewModal({
  client,
  isSuperAdmin,
  onClose,
  onEdit,
}: {
  client: Client;
  isSuperAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addressLines = [client.addressLine1, client.addressLine2].filter(Boolean);
  const cityStatePostal = [client.city, client.state, client.postalCode].filter(Boolean).join(', ');
  const hasAddress = addressLines.length > 0 || cityStatePostal || client.country;
  const hasContact = client.contactName || client.contactEmail || client.contactPhone;
  const hasTax = client.gstNumber || client.panNumber;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#161C3A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt=""
                className="w-12 h-12 rounded-full object-cover shrink-0 bg-white/[0.06]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0 bg-[#3FDCC0]/15 text-[#3FDCC0]">
                {initials(client.name)}
              </div>
            )}
            <div className="min-w-0">
              <h2
                className="text-[18px] font-semibold text-[#F2F4FA] truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {client.name}
              </h2>
              <p className="text-[12px] text-[#565F8C] truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                {client.clientCode}
                {client.industry ? ` · ${client.industry}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={client.status} />
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-white/[0.06] text-[#AAB2D4] hover:text-[#3FDCC0] transition-colors"
              >
                <Globe size={11} />
                Visit website
              </a>
            )}
          </div>

          {isSuperAdmin && (
            <div>
              <SectionTitle>Company</SectionTitle>
              <Field label="Assessment partner" value={client.company?.name ?? '—'} icon={Building2} />
            </div>
          )}

          {hasContact && (
            <div>
              <SectionTitle>Contact</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact name" value={client.contactName} />
                <Field label="Email" value={client.contactEmail} icon={Mail} href={client.contactEmail ? `mailto:${client.contactEmail}` : undefined} />
                <Field label="Phone" value={client.contactPhone} icon={Phone} href={client.contactPhone ? `tel:${client.contactPhone}` : undefined} />
                <Field label="Website" value={client.website} icon={Globe} href={client.website ?? undefined} />
              </div>
            </div>
          )}

          {hasAddress && (
            <div>
              <SectionTitle>Address</SectionTitle>
              <p className="flex items-start gap-1.5 text-[13.5px] text-[#F2F4FA] leading-relaxed">
                <MapPin size={12} className="text-[#565F8C] shrink-0 mt-0.5" />
                <span>
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {(cityStatePostal || client.country) && (
                    <span className="block text-[#AAB2D4]">
                      {[cityStatePostal, client.country].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
              </p>
            </div>
          )}

          {hasTax && (
            <div>
              <SectionTitle>Tax details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="GST number" value={client.gstNumber} icon={FileText} />
                <Field label="PAN number" value={client.panNumber} icon={FileText} />
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Timeline</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Created" value={formatDate(client.createdAt)} icon={Calendar} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-[#AAB2D4] hover:bg-white/[0.06] transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2 hover:bg-[#3FDCC0]/90 transition-colors"
          >
            <Pencil size={13} strokeWidth={2.5} />
            Edit client
          </button>
        </div>
      </div>
    </div>
  );
}