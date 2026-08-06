'use client';

import { useEffect, useState } from 'react';
import { Building2, Camera, Mail, MapPin, Phone, Save } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { getCompany, updateCompany } from '@/src/lib/api/companies';

const MAX_LOGO_SIZE_BYTES = 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

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

export default function CompanyPage() {
  const { user, accessToken } = useAuth();
  const companyId = user?.company?.id;

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

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
        setLogoPreview(data.logoUrl ?? null);
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

  const handleLogoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      setLogoError(null);
      return;
    }

    const validationError = getLogoValidationError(file);
    if (validationError) {
      setLogoFile(null);
      setLogoError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(objectUrl);
    setLogoError(null);
  };

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

      const updated = await updateCompany(companyId, payload, accessToken);
      setForm({
        name: updated.name ?? '',
        slug: updated.slug ?? '',
        contactEmail: updated.contactEmail ?? '',
        contactPhone: updated.contactPhone ?? '',
        address: updated.address ?? '',
        primaryColor: updated.primaryColor ?? '',
      });
      setLogoPreview(updated.logoUrl ?? null);
      setLogoFile(null);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
            Company Profile
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Your company details
          </h1>
          <p className="text-[13.5px] text-[#8891B8] mt-1">Update branding, contact info, and company logo.</p>
        </div>
      </div>

      {banner && (
        <div className={`rounded-xl border px-4 py-3 text-[13px] ${banner.tone === 'success' ? 'bg-[#3FDCC0]/10 border-[#3FDCC0]/25 text-[#3FDCC0]' : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/25 text-[#FF6B6B]'}`}>
          {banner.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-[#161C3A] p-6 space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:max-w-[240px]">
            <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0F1330] p-5 text-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="mx-auto h-24 w-24 rounded-xl object-cover border border-white/[0.08]" />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-[#3FDCC0]/10 text-[#3FDCC0]">
                  <Building2 size={30} />
                </div>
              )}
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#3FDCC0]/25 bg-[#3FDCC0]/10 px-3 py-2 text-[13px] font-medium text-[#3FDCC0] hover:bg-[#3FDCC0]/20 transition-colors">
                <Camera size={14} />
                Upload logo
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoSelection} />
              </label>
              <p className="mt-2 text-[12px] text-[#8891B8]">PNG, JPG, WEBP, or SVG up to 1 MB.</p>
              {logoError && <p className="mt-2 text-[12px] text-[#FF6B6B]">{logoError}</p>}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Company name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" required />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Slug</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Contact email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]" />
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Contact phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]" />
                  <input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Primary color</label>
                <input value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} placeholder="#3FDCC0" className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] px-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#AAB2D4] mb-1.5">Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-[#565F8C]" />
                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={4} className="w-full rounded-lg bg-[#0F1330] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] outline-none focus:border-[#3FDCC0]/50" />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="submit" disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-[#3FDCC0] px-4 py-2.5 text-[13.5px] font-semibold text-[#0B0F26] transition-colors hover:bg-[#3FDCC0]/90 disabled:opacity-60">
                <Save size={14} />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
