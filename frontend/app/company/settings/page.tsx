'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  Bell,
  ShieldCheck,
  CreditCard,
  Plug,
  Timer,
  Languages,
  AlertTriangle,
  Check,
  Camera,
  Plus,
  Trash2,
  Mail,
  Copy,
  KeyRound,
  Globe,
  Eye,
  Shuffle,
  Clock,
  CalendarDays,
  Download,
  Archive,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import ClientConfirmDialog from '@/src/components/layout/company/client/ClientConfirmDialog';
import type { CompanySettings } from '@/src/types/settings';

/* ------------------------------------------------------------------
   No settings backend yet — this seeds the page with local defaults
   (using the signed-in user/company where available) and keeps every
   edit in React state. All "Save" actions just update local state and
   show a banner. When a settings API exists, swap DEFAULT_SETTINGS +
   the persist() body below for real GET/PATCH calls — every section
   component already receives values/onChange/onSave as props, so
   nothing else needs to change.
------------------------------------------------------------------- */

function buildDefaultSettings(companyName?: string): CompanySettings {
  return {
    profile: {
      name: companyName ?? 'Your Company',
      domain: '',
      size: '11–50 employees',
      industry: 'Recruiting & Staffing',
    },
    assessmentDefaults: {
      timeLimitMinutes: 45,
      scoringMethod: 'Weighted by difficulty',
      passThreshold: 70,
      shuffleQuestions: true,
      proctoring: true,
      flagTabSwitch: true,
      autoSubmit: true,
    },
    team: [],
    notifications: {
      submissions: true,
      flagged: true,
      weeklyDigest: false,
      productUpdates: false,
    },
    preferences: {
      language: 'English (US)',
      timezone: '(GMT+5:30) Kolkata',
      dateFormat: 'DD/MM/YYYY',
      weekStart: 'Monday',
    },
    security: {
      twoFactor: false,
      sso: false,
      apiKeyMasked: '••••••••••••••••',
    },
    billing: {
      plan: 'Starter',
      cardLabel: 'No card on file',
    },
    integrations: [],
  };
}

/* ------------------------------------------------------------------
   Palette matches the rest of the app (ClientsPage etc):
   bg           #0B0F26   page background
   surface      #161C3A   card / input background
   border       white/[0.08]
   text         #F2F4FA
   muted        #AAB2D4 / #8891B8 / #565F8C (darkest)
   accent       #3FDCC0   teal — primary actions, "on" states
   amber        #F2AE55   secondary — pending/attention states
   danger       #FF6B6B
   fonts        var(--font-mono) for eyebrows/labels, var(--font-display) for headings
------------------------------------------------------------------- */

type SectionKey =
  | 'profile'
  | 'assessments'
  | 'team'
  | 'notifications'
  | 'preferences'
  | 'security'
  | 'billing'
  | 'integrations'
  | 'danger';

const NAV: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Company profile', icon: <Building2 size={15} /> },
  { key: 'assessments', label: 'Assessment defaults', icon: <Timer size={15} /> },
  { key: 'team', label: 'Team & roles', icon: <Users size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'preferences', label: 'Preferences', icon: <Languages size={15} /> },
  { key: 'security', label: 'Security', icon: <ShieldCheck size={15} /> },
  { key: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
  { key: 'integrations', label: 'Integrations', icon: <Plug size={15} /> },
  { key: 'danger', label: 'Danger zone', icon: <AlertTriangle size={15} /> },
];

/* ------------------------------------------------------------------
   Shared primitives, styled to match ClientsPage's inputs/buttons
------------------------------------------------------------------- */

function Card({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <div
      className={`rounded-2xl border bg-[#161C3A] overflow-hidden ${
        tone === 'danger' ? 'border-[#FF6B6B]/25' : 'border-white/[0.08]'
      }`}
    >
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-white/[0.08]">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
        {eyebrow}
      </p>
      <h2 className="text-[17px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h2>
      {description && <p className="text-[13px] text-[#8891B8] mt-1">{description}</p>}
    </div>
  );
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 py-3.5 border-b border-white/[0.06] last:border-b-0">
      <div>
        <p className="text-[13px] font-medium text-[#F2F4FA]">{label}</p>
        {hint && <p className="text-[11.5px] text-[#565F8C] mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function TextInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg bg-[#0B0F26] border border-white/[0.08] px-3 py-2 text-[13px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors ${className}`}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg bg-[#0B0F26] border border-white/[0.08] px-3 py-2 text-[13px] text-[#AAB2D4] outline-none focus:border-[#3FDCC0]/50 transition-colors ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors ${checked ? 'bg-[#3FDCC0]' : 'bg-white/[0.12]'}`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute top-0.5 rounded-full bg-[#0B0F26] transition-transform"
        style={{
          width: 16,
          height: 16,
          left: 3,
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2.5 hover:bg-[#3FDCC0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  icon,
  danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border border-white/[0.08] text-[13px] font-medium px-3.5 py-2 transition-colors ${
        danger ? 'text-[#FF6B6B] hover:bg-[#FF6B6B]/10' : 'text-[#AAB2D4] hover:bg-white/[0.05]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Badge({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'amber' }) {
  const styles = tone === 'accent' ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'bg-[#F2AE55]/15 text-[#F2AE55]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles}`}>
      {children}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/* ------------------------------------------------------------------
   Section components
------------------------------------------------------------------- */

function ProfileSection({
  values,
  onChange,
  onSave,
  saving,
}: {
  values: CompanySettings['profile'];
  onChange: (v: CompanySettings['profile']) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Workspace"
        title="Company profile"
        description="This appears on every assessment invite candidates receive."
      />
      <div className="px-6">
        <div className="flex items-center gap-4 py-4 border-b border-white/[0.06]">
          <div className="w-14 h-14 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center text-[15px] font-semibold shrink-0">
            {initials(values.name || 'C')}
          </div>
          <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#3FDCC0]">
            <Camera size={13} /> Upload logo
          </button>
        </div>
        <Field label="Company name">
          <TextInput value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} />
        </Field>
        <Field label="Careers domain" hint="Candidates see this in their invite email.">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-[#565F8C] shrink-0" />
            <TextInput value={values.domain} onChange={(e) => onChange({ ...values, domain: e.target.value })} />
          </div>
        </Field>
        <Field label="Company size">
          <SelectInput
            value={values.size}
            onChange={(v) => onChange({ ...values, size: v })}
            options={['1–10 employees', '11–50 employees', '51–200 employees', '200+ employees']}
            className="w-full"
          />
        </Field>
        <Field label="Industry">
          <SelectInput
            value={values.industry}
            onChange={(v) => onChange({ ...values, industry: v })}
            options={['Recruiting & Staffing', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Other']}
            className="w-full"
          />
        </Field>
      </div>
      <CardFooter>
        <PrimaryButton onClick={onSave} disabled={saving} icon={<Check size={14} />}>
          {saving ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </CardFooter>
    </Card>
  );
}

function AssessmentDefaultsSection({
  values,
  onChange,
  onSave,
  saving,
}: {
  values: CompanySettings['assessmentDefaults'];
  onChange: (v: CompanySettings['assessmentDefaults']) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Testing"
        title="Assessment defaults"
        description="Applied to every new assessment. Individual tests can still override these."
      />
      <div className="px-6">
        <Field label="Default time limit" hint="Minutes given per assessment.">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-[#565F8C] shrink-0" />
            <TextInput
              type="number"
              value={values.timeLimitMinutes}
              onChange={(e) => onChange({ ...values, timeLimitMinutes: Number(e.target.value) })}
              className="max-w-[100px]"
            />
            <span className="text-[13px] text-[#565F8C]">minutes</span>
          </div>
        </Field>
        <Field label="Scoring method">
          <SelectInput
            value={values.scoringMethod}
            onChange={(v) => onChange({ ...values, scoringMethod: v })}
            options={['Weighted by difficulty', 'Equal weight per question', 'Pass/fail per section']}
            className="w-full"
          />
        </Field>
        <Field label="Pass threshold" hint="Minimum score to auto-advance a candidate.">
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              value={values.passThreshold}
              onChange={(e) => onChange({ ...values, passThreshold: Number(e.target.value) })}
              className="max-w-[100px]"
            />
            <span className="text-[13px] text-[#565F8C]">%</span>
          </div>
        </Field>
        <div className="flex items-center justify-between py-3.5 border-b border-white/[0.06]">
          <div className="flex items-start gap-2.5">
            <Shuffle size={15} className="text-[#565F8C] mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">Shuffle question order</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5">Reduces answer-sharing between candidates.</p>
            </div>
          </div>
          <Toggle checked={values.shuffleQuestions} onChange={(v) => onChange({ ...values, shuffleQuestions: v })} />
        </div>
        <div className="flex items-center justify-between py-3.5 border-b border-white/[0.06]">
          <div className="flex items-start gap-2.5">
            <Eye size={15} className="text-[#565F8C] mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">Webcam proctoring</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5">Records candidates during the assessment for later review.</p>
            </div>
          </div>
          <Toggle checked={values.proctoring} onChange={(v) => onChange({ ...values, proctoring: v })} />
        </div>
        <div className="flex items-center justify-between py-3.5 border-b border-white/[0.06]">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">Flag tab switching</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">Notes it in the report if a candidate leaves the test tab.</p>
          </div>
          <Toggle checked={values.flagTabSwitch} onChange={(v) => onChange({ ...values, flagTabSwitch: v })} />
        </div>
        <div className="flex items-center justify-between py-3.5">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">Auto-submit at time limit</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">Off means candidates can finish late, flagged as overtime.</p>
          </div>
          <Toggle checked={values.autoSubmit} onChange={(v) => onChange({ ...values, autoSubmit: v })} />
        </div>
      </div>
      <CardFooter>
        <PrimaryButton onClick={onSave} disabled={saving} icon={<Check size={14} />}>
          {saving ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </CardFooter>
    </Card>
  );
}

function TeamSection({ members, onInvite, onRemove }: {
  members: CompanySettings['team'];
  onInvite: () => void;
  onRemove: (email: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Access"
        title="Team & roles"
        description="Reviewers can score assessments. Admins can also edit test content and billing."
      />
      <div className="px-6">
        {members.map((m) => (
          <div key={m.email} className="flex items-center justify-between py-3.5 border-b border-white/[0.06] last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center text-[11px] font-semibold shrink-0">
                {initials(m.name)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#F2F4FA]">{m.name}</p>
                <p className="text-[11.5px] text-[#8891B8]">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={m.role === 'Owner' ? 'accent' : 'amber'}>{m.role}</Badge>
              <button
                onClick={() => onRemove(m.email)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                aria-label={`Remove ${m.name}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <CardFooter>
        <div className="flex items-center gap-1.5 text-[12px] text-[#565F8C] mr-auto">
          <Mail size={12} /> Invite by email
        </div>
        <PrimaryButton onClick={onInvite} icon={<Plus size={14} />}>
          Invite teammate
        </PrimaryButton>
      </CardFooter>
    </Card>
  );
}

function NotificationsSection({
  values,
  onChange,
}: {
  values: CompanySettings['notifications'];
  onChange: (v: CompanySettings['notifications']) => void;
}) {
  const rows: { key: keyof CompanySettings['notifications']; label: string; hint: string }[] = [
    { key: 'submissions', label: 'New submission', hint: 'A candidate completes an assessment.' },
    { key: 'flagged', label: 'Flagged responses', hint: 'Proctoring flags unusual activity during a test.' },
    { key: 'weeklyDigest', label: 'Weekly digest', hint: 'A Monday summary of pipeline activity.' },
    { key: 'productUpdates', label: 'Product updates', hint: 'New question types and platform features.' },
  ];
  return (
    <Card>
      <CardHeader eyebrow="Alerts" title="Notifications" description="Choose what's worth an email." />
      <div className="px-6">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between py-3.5 border-b border-white/[0.06] last:border-b-0">
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">{r.label}</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5">{r.hint}</p>
            </div>
            <Toggle checked={values[r.key]} onChange={(v) => onChange({ ...values, [r.key]: v })} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function PreferencesSection({
  values,
  onChange,
  onSave,
  saving,
}: {
  values: CompanySettings['preferences'];
  onChange: (v: CompanySettings['preferences']) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader eyebrow="Locale" title="Preferences" description="How dates, times and language appear across your workspace." />
      <div className="px-6">
        <Field label="Language">
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-[#565F8C] shrink-0" />
            <SelectInput
              value={values.language}
              onChange={(v) => onChange({ ...values, language: v })}
              options={['English (US)', 'English (UK)', 'Hindi', 'Spanish', 'French', 'German']}
              className="w-full"
            />
          </div>
        </Field>
        <Field label="Timezone" hint="Used for scheduling deadlines and reminder emails.">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#565F8C] shrink-0" />
            <SelectInput
              value={values.timezone}
              onChange={(v) => onChange({ ...values, timezone: v })}
              options={[
                '(GMT+5:30) Kolkata',
                '(GMT+0:00) London',
                '(GMT-5:00) New York',
                '(GMT-8:00) Los Angeles',
                '(GMT+9:00) Tokyo',
              ]}
              className="w-full"
            />
          </div>
        </Field>
        <Field label="Date format">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[#565F8C] shrink-0" />
            <SelectInput
              value={values.dateFormat}
              onChange={(v) => onChange({ ...values, dateFormat: v })}
              options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
              className="w-full"
            />
          </div>
        </Field>
        <Field label="Week starts on">
          <SelectInput
            value={values.weekStart}
            onChange={(v) => onChange({ ...values, weekStart: v })}
            options={['Sunday', 'Monday']}
            className="w-full"
          />
        </Field>
      </div>
      <CardFooter>
        <PrimaryButton onClick={onSave} disabled={saving} icon={<Check size={14} />}>
          {saving ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </CardFooter>
    </Card>
  );
}

function SecuritySection({
  values,
  onChange,
}: {
  values: CompanySettings['security'];
  onChange: (v: CompanySettings['security']) => void;
}) {
  return (
    <Card>
      <CardHeader eyebrow="Protection" title="Security" description="Keep the workspace and candidate data locked down." />
      <div className="px-6">
        <div className="flex items-center justify-between py-3.5 border-b border-white/[0.06]">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">Two-factor authentication</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">Require a verification code at sign-in for every teammate.</p>
          </div>
          <Toggle checked={values.twoFactor} onChange={(v) => onChange({ ...values, twoFactor: v })} />
        </div>
        <div className="flex items-center justify-between py-3.5 border-b border-white/[0.06]">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">Single sign-on (SAML)</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">Available on the Enterprise plan.</p>
          </div>
          <Toggle checked={values.sso} onChange={(v) => onChange({ ...values, sso: v })} />
        </div>
        <div className="py-3.5">
          <p className="text-[13px] font-medium text-[#F2F4FA] mb-2">API key</p>
          <div
            className="flex items-center justify-between rounded-lg bg-[#0B0F26] border border-white/[0.08] px-3 py-2 text-[12.5px] text-[#8891B8]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="flex items-center gap-2">
              <KeyRound size={13} /> {values.apiKeyMasked}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(values.apiKeyMasked)}
              className="text-[#3FDCC0]"
              aria-label="Copy API key"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BillingSection({ values }: { values: CompanySettings['billing'] }) {
  return (
    <Card>
      <CardHeader eyebrow="Plan" title="Billing" description="Manage your subscription and payment details." />
      <div className="px-6">
        <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">{values.plan} plan</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">Up to 200 assessment sends per month, unlimited reviewers.</p>
          </div>
          <GhostButton>Change plan</GhostButton>
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-[13px] font-medium text-[#F2F4FA]">Payment method</p>
            <p className="text-[11.5px] text-[#565F8C] mt-0.5">{values.cardLabel}</p>
          </div>
          <GhostButton>Update card</GhostButton>
        </div>
      </div>
    </Card>
  );
}

function IntegrationsSection({ items }: { items: CompanySettings['integrations'] }) {
  return (
    <Card>
      <CardHeader eyebrow="Connections" title="Integrations" description="Link the tools your team already works in." />
      <div className="px-6">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between py-3.5 border-b border-white/[0.06] last:border-b-0">
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">{it.name}</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5">{it.description}</p>
            </div>
            {it.connected ? (
              <Badge tone="accent">
                <Check size={11} /> Connected
              </Badge>
            ) : (
              <GhostButton>Connect</GhostButton>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DangerZoneSection({
  companyName,
  onExport,
  onArchive,
  onDelete,
}: {
  companyName: string;
  onExport: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  return (
    <Card tone="danger">
      <CardHeader eyebrow="Irreversible" title="Danger zone" description="These actions affect your whole workspace. Proceed carefully." />
      <div className="px-6">
        <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
          <div className="flex items-start gap-2.5">
            <Download size={15} className="text-[#565F8C] mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">Export all data</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5 max-w-md leading-relaxed">
                Download every candidate, assessment and result. Large exports are emailed as a download link.
              </p>
            </div>
          </div>
          <GhostButton onClick={onExport} icon={<Download size={13} />}>
            Export
          </GhostButton>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
          <div className="flex items-start gap-2.5">
            <Archive size={15} className="text-[#565F8C] mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#F2F4FA]">Archive workspace</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5 max-w-md leading-relaxed">
                Pauses billing and hides the workspace from your team. Data is kept for 90 days and can be restored.
              </p>
            </div>
          </div>
          <GhostButton onClick={onArchive}>Archive</GhostButton>
        </div>
        <div className="py-4">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle size={15} className="text-[#FF6B6B] mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#FF6B6B]">Delete workspace permanently</p>
              <p className="text-[11.5px] text-[#565F8C] mt-0.5 max-w-md leading-relaxed">
                Deletes {companyName}, every assessment, and all candidate results immediately. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 p-4">
            <p className="text-[11.5px] text-[#F2F4FA] mb-2">
              Type <span style={{ fontFamily: 'var(--font-mono)' }}>{companyName}</span> to confirm.
            </p>
            <div className="flex items-center gap-3">
              <TextInput
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={companyName}
                className="max-w-[240px]"
              />
              <button
                disabled={confirmText !== companyName}
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-lg text-[13px] font-semibold px-4 py-2.5 transition-colors bg-[#FF6B6B] text-[#0B0F26] disabled:bg-white/[0.08] disabled:text-[#565F8C] disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Delete workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */

export default function CompanySettingsPage() {
  const { user: currentUser } = useAuth();

  const [active, setActive] = useState<SectionKey>('profile');
  // currentUser's exact shape depends on your AuthProvider — adjust this
  // field if the company name lives somewhere else on the user object.
  const [settings, setSettings] = useState<CompanySettings>(() => buildDefaultSettings());
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  // Local-only "save" — no backend yet, so this just confirms the state
  // change with a banner. Swap the body for a real PATCH call once a
  // settings API exists; every caller below already passes the right patch.
  const persist = (_patch: Partial<CompanySettings>) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setBanner({ text: 'Settings saved.', tone: 'success' });
    }, 300);
  };

  const handleDeleteWorkspace = () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setDeleteOpen(false);
      setBanner({ text: 'Workspace deletion started.', tone: 'success' });
    }, 300);
  };

  const activeLabel = useMemo(() => NAV.find((n) => n.key === active)?.label ?? '', [active]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
            Company Settings
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            {activeLabel}
          </h1>
          {/* <p className="text-[13.5px] text-[#8891B8] mt-1">Signed in as {currentUser?.name ?? 'you'}</p> */}
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] flex items-center justify-between ${
            banner.tone === 'success'
              ? 'bg-[#3FDCC0]/10 border-[#3FDCC0]/25 text-[#3FDCC0]'
              : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/25 text-[#FF6B6B]'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100 ml-3">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-7">
        {/* Nav */}
        <div className="md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {NAV.map((item) => {
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium whitespace-nowrap text-left transition-colors ${
                    isActive ? 'bg-[#3FDCC0]/15 text-[#3FDCC0]' : 'text-[#AAB2D4] hover:bg-white/[0.05]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active section */}
        <div className="flex-1 min-w-0">
          {active === 'profile' && (
            <ProfileSection
              values={settings.profile}
              onChange={(v) => setSettings({ ...settings, profile: v })}
              onSave={() => persist({ profile: settings.profile })}
              saving={saving}
            />
          )}
          {active === 'assessments' && (
            <AssessmentDefaultsSection
              values={settings.assessmentDefaults}
              onChange={(v) => setSettings({ ...settings, assessmentDefaults: v })}
              onSave={() => persist({ assessmentDefaults: settings.assessmentDefaults })}
              saving={saving}
            />
          )}
          {active === 'team' && (
            <TeamSection
              members={settings.team}
              onInvite={() => setBanner({ text: 'Invite sent.', tone: 'success' })}
              onRemove={(email) =>
                setSettings({ ...settings, team: settings.team.filter((m) => m.email !== email) })
              }
            />
          )}
          {active === 'notifications' && (
            <NotificationsSection
              values={settings.notifications}
              onChange={(v) => {
                setSettings({ ...settings, notifications: v });
                persist({ notifications: v });
              }}
            />
          )}
          {active === 'preferences' && (
            <PreferencesSection
              values={settings.preferences}
              onChange={(v) => setSettings({ ...settings, preferences: v })}
              onSave={() => persist({ preferences: settings.preferences })}
              saving={saving}
            />
          )}
          {active === 'security' && (
            <SecuritySection
              values={settings.security}
              onChange={(v) => {
                setSettings({ ...settings, security: v });
                persist({ security: v });
              }}
            />
          )}
          {active === 'billing' && <BillingSection values={settings.billing} />}
          {active === 'integrations' && <IntegrationsSection items={settings.integrations} />}
          {active === 'danger' && (
            <DangerZoneSection
              companyName={settings.profile.name}
              onExport={() => setBanner({ text: 'Export started — you’ll get an email shortly.', tone: 'success' })}
              onArchive={() => setBanner({ text: 'Workspace archived.', tone: 'success' })}
              onDelete={() => setDeleteOpen(true)}
            />
          )}
        </div>
      </div>

      {deleteOpen && (
        <ClientConfirmDialog
          title="Delete workspace?"
          description={`This permanently deletes "${settings.profile.name}" and all of its assessments and candidate results. This cannot be undone.`}
          confirmLabel="Delete workspace"
          tone="danger"
          submitting={deleting}
          onConfirm={handleDeleteWorkspace}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}