'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Camera, Mail, MapPin, Phone, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { getCompany, updateCompany } from '@/src/lib/api/companies';

const MAX_LOGO_SIZE_BYTES = 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:5000/api/v1';

// The API base includes a path suffix like "/api/v1" — uploaded files are
// served from the origin, not under that path, so it has to be stripped
// before a relative logoUrl ("uploads/companies/xyz.png") is joined to it.
const FILE_ORIGIN = API_BASE.replace(/\/api(\/v\d+)?\/?$/, '');

/**
 * Resolves whatever shape `logoUrl` comes back from the API in — a bare
 * relative path, a path with a leading slash, or a full URL — into
 * something an <img> tag can actually load. A relative path dropped
 * straight into `src` resolves against the *frontend's* origin, not the
 * API server, and 404s with no visible error, which is why logos have
 * looked "broken" without ever showing a console error.
 */
function resolveLogoUrl(logoUrl?: string | null): string | null {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('blob:') || logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  return `${FILE_ORIGIN}/${logoUrl.replace(/^\/+/, '')}`;
}

function getLogoValidationError(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const hasAllowedExtension = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extension || '');
  const hasAllowedMime = ALLOWED_LOGO_TYPES.includes(file.type);
  if (!hasAllowedExtension || !hasAllowedMime) {
    return 'Only JPG, PNG, WEBP, or SVG images are allowed.';
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return 'Logo image must be 1 MB or smaller.';
  }
  return null;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[12px] font-medium text-[#AAB2D4]">{children}</span>
      {hint && <span className="text-[11px] text-[#565F8C]">{hint}</span>}
    </label>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] p-6">
      <div className="mb-5">
        <p
          className="text-[10.5px] uppercase tracking-[0.14em] text-[#3FDCC0]/80 mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {eyebrow}
        </p>
        <h2 className="text-[16px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        {description && <p className="text-[12.5px] text-[#8891B8] mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const inputClasses =
  'w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none transition-colors focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 disabled:opacity-50 disabled:cursor-not-allowed';

export default function CompanyProfilePage() {
  const { user, accessToken } = useAuth();
  const companyId = user?.company?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    primaryColor: '',
  });

  // savedLogoUrl: what the server has on file, resolved to a loadable URL.
  // localPreviewUrl: an object URL for a file picked but not yet saved.
  // removeLogo: user asked to clear the logo on next save.
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!companyId || !accessToken) {
      setLoading(false);
      return;
    }

    const loadCompany = async () => {
      setLoading(true);
      try {
        const data = await getCompany(companyId, accessToken);
        setForm({
          name: data.name ?? '',
          slug: data.slug ?? '',
          contactEmail: data.contactEmail ?? '',
          contactPhone: data.contactPhone ?? '',
          address: data.address ?? '',
          primaryColor: data.primaryColor ?? '',
        });
        setSavedLogoUrl(resolveLogoUrl(data.logoUrl));
      } catch (err) {
        setBanner({
          tone: 'error',
          text: err instanceof Error ? err.message : 'Could not load company profile.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [companyId, accessToken]);

  // Object URLs are only valid for the lifetime of the page — revoke the
  // previous one whenever it's replaced or the component unmounts, or
  // each newly picked file leaks memory.
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const applyFile = (file: File | null) => {
    if (!file) return;
    const validationError = getLogoValidationError(file);
    if (validationError) {
      setLogoError(validationError);
      return;
    }
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLogoFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setRemoveLogo(false);
    setLogoError(null);
  };

  const handleLogoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    applyFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleRemoveLogo = () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLogoFile(null);
    setLocalPreviewUrl(null);
    setSavedLogoUrl(null);
    setRemoveLogo(true);
    setLogoError(null);
  };

  const displayedLogo = localPreviewUrl ?? savedLogoUrl;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !accessToken) return;

    setSaving(true);
    setBanner(null);
    try {
      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('slug', form.slug.trim());
      if (form.contactEmail.trim()) payload.append('contactEmail', form.contactEmail.trim());
      if (form.contactPhone.trim()) payload.append('contactPhone', form.contactPhone.trim());
      if (form.address.trim()) payload.append('address', form.address.trim());
      if (form.primaryColor.trim()) payload.append('primaryColor', form.primaryColor.trim());
      if (logoFile) payload.append('logo', logoFile);
      if (removeLogo && !logoFile) payload.append('removeLogo', 'true');

      const updated = await updateCompany(companyId, payload, accessToken);
      setForm({
        name: updated.name ?? '',
        slug: updated.slug ?? '',
        contactEmail: updated.contactEmail ?? '',
        contactPhone: updated.contactPhone ?? '',
        address: updated.address ?? '',
        primaryColor: updated.primaryColor ?? '',
      });
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
      setLogoFile(null);
      setRemoveLogo(false);
      setSavedLogoUrl(resolveLogoUrl(updated.logoUrl));
      setBanner({ tone: 'success', text: 'Company profile updated successfully.' });
    } catch (err) {
      setBanner({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Could not update company profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const swatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(form.primaryColor.trim())
    ? form.primaryColor.trim()
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Company Profile
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Your company details
          </h1>
          <p className="text-[13.5px] text-[#8891B8] mt-1">Update branding, contact info, and company logo.</p>
        </div>
      </div>

      {banner && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13px] ${
            banner.tone === 'success'
              ? 'bg-[#3FDCC0]/10 border-[#3FDCC0]/25 text-[#3FDCC0]'
              : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/25 text-[#FF6B6B]'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100 ml-3">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding */}
        <SectionCard
          eyebrow="Identity"
          title="Branding"
          description="Your logo appears on candidate reports, invitation emails, and the assessment portal."
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Logo drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`group relative shrink-0 rounded-2xl border border-dashed p-1 transition-colors ${
                dragActive ? 'border-[#3FDCC0] bg-[#3FDCC0]/5' : 'border-white/[0.12] bg-[#0F1330]'
              }`}
            >
              <div
                className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                  backgroundColor: '#0B0F26',
                }}
              >
                {displayedLogo ? (
                  // object-contain (not cover) so non-square logos never get
                  // cropped — the checkerboard behind shows through any
                  // transparent padding instead of hiding it under a crop.
                  <img src={displayedLogo} alt="Company logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#3FDCC0]">
                    {form.name ? (
                      <span className="text-[22px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                        {initialsFromName(form.name)}
                      </span>
                    ) : (
                      <Building2 size={26} />
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#0B0F26]/0 text-transparent transition-all group-hover:bg-[#0B0F26]/70 group-hover:text-[#F2F4FA]"
                  aria-label="Upload logo"
                >
                  <Camera size={16} />
                  <span className="text-[11px] font-medium">Change</span>
                </button>
              </div>

              {displayedLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#161C3A] text-[#8891B8] shadow-sm transition-colors hover:text-[#FF6B6B]"
                  aria-label="Remove logo"
                  title="Remove logo"
                >
                  <X size={12} />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoSelection}
              />
            </div>

            <div className="flex-1 space-y-2 pt-1">
              <p className="text-[13px] text-[#AAB2D4]">
                Drag an image onto the logo, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-[#3FDCC0] hover:underline"
                >
                  browse your files
                </button>
                .
              </p>
              <p className="text-[12px] text-[#565F8C]">PNG, JPG, WEBP, or SVG · up to 1 MB · square logos display best</p>
              {logoError && <p className="text-[12px] text-[#FF6B6B]">{logoError}</p>}
              {logoFile && !logoError && (
                <p className="text-[12px] text-[#3FDCC0]">
                  "{logoFile.name}" selected — save changes to upload.
                </p>
              )}
              {removeLogo && !logoFile && (
                <p className="text-[12px] text-[#F2AE55]">Logo will be removed when you save.</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Company details */}
        <SectionCard eyebrow="Details" title="Company information">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Company name</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClasses}
                disabled={loading}
                required
              />
            </div>
            <div>
              <FieldLabel hint="Used in your portal URL">Slug</FieldLabel>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className={inputClasses}
                disabled={loading}
              />
            </div>
            <div>
              <FieldLabel>Contact email</FieldLabel>
              <div className="relative">
                <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]" />
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className={`${inputClasses} pl-9`}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Contact phone</FieldLabel>
              <div className="relative">
                <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]" />
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  className={`${inputClasses} pl-9`}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <FieldLabel hint="Used on reports & the portal">Primary color</FieldLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white/20"
                  style={{ backgroundColor: swatch ?? '#0F1330' }}
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#3FDCC0"
                  className={`${inputClasses} pl-9`}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Address */}
        <SectionCard eyebrow="Location" title="Address">
          <div className="relative">
            <MapPin size={14} className="pointer-events-none absolute left-3 top-3 text-[#565F8C]" />
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={4}
              className={`${inputClasses} pl-9`}
              disabled={loading}
              placeholder="Street, city, state, postal code, country"
            />
          </div>
        </SectionCard>

        {/* Save bar */}
        <div className="flex items-center justify-end gap-3 rounded-2xl border border-white/[0.08] bg-[#161C3A] px-6 py-4">
          {loading && (
            <span className="mr-auto flex items-center gap-2 text-[12.5px] text-[#565F8C]">
              <Loader2 size={13} className="animate-spin" />
              Loading company profile…
            </span>
          )}
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3FDCC0] px-5 py-2.5 text-[13.5px] font-semibold text-[#0B0F26] transition-colors hover:bg-[#3FDCC0]/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}