'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Check, Copy } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { listPermissions, ApiError } from '@/src/lib/api/permissions';
import type { Permission } from '@/src/types/permission';

// Actions grouped by intent rather than one color per exact verb — the real
// permission set spans ~25 distinct actions (activate, assign, publish,
// export, import, resend, send, cancel, changePassword, download, evaluate,
// forceSubmit, reset, ...), too many for a 1:1 color map to stay meaningful.
const DESTRUCTIVE_ACTIONS = new Set([
  'delete',
  'cancel',
  'inactivate',
  'suspend',
  'reset',
  'forceSubmit',
]);
const CREATE_ACTIONS = new Set([
  'create',
  'activate',
  'publish',
  'assign',
  'send',
  'resend',
  'import',
]);
const NEUTRAL_ACTIONS = new Set(['view', 'download', 'export']);
// everything else (update, changePassword, evaluate, ...) falls to "update" styling

const ACTION_GROUP_STYLES = {
  create: 'bg-[#3FDCC0]/15 text-[#3FDCC0]',
  neutral: 'bg-[#565F8C]/20 text-[#8891B8]',
  update: 'bg-[#F2AE55]/15 text-[#F2AE55]',
  destructive: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
} as const;

function actionStyle(action: string) {
  if (DESTRUCTIVE_ACTIONS.has(action)) return ACTION_GROUP_STYLES.destructive;
  if (CREATE_ACTIONS.has(action)) return ACTION_GROUP_STYLES.create;
  if (NEUTRAL_ACTIONS.has(action)) return ACTION_GROUP_STYLES.neutral;
  return ACTION_GROUP_STYLES.update;
}

// Splits snake_case module names (e.g. "candidate_invitation") into
// title-cased words ("Candidate Invitation") instead of just capitalizing
// the first letter, which mangled multi-word modules.
function moduleLabel(module: string) {
  return module
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Splits camelCase action names (e.g. "forceSubmit", "changePassword") into
// separate words for display, since the badge otherwise reads as one run-on word.
function actionLabel(action: string) {
  return action
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

export default function PermissionsPage() {
  const { accessToken } = useAuth();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const items = await listPermissions(accessToken);
        if (!cancelled) setPermissions(items);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Failed to load permissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // accessToken is included so a fresh session (or logout/login) re-fetches
    // with the right credentials instead of reusing a stale closure.
  }, [accessToken]);

  const filtered = useMemo(() => {
    if (!search) return permissions;
    return permissions.filter((p) =>
      [p.key, p.module, p.action, p.description ?? ''].some((f) => f.toLowerCase().includes(search))
    );
  }, [permissions, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    filtered.forEach((p) => {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([module, items]) => ({
        module,
        permissions: items.sort((a, b) => a.action.localeCompare(b.action)),
      }));
  }, [filtered]);

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // clipboard unavailable — ignore silently
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Access Control
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Permissions
          </h1>
          <p className="text-[13.5px] text-[#8891B8] mt-1">
            Every permission available to assign when building custom roles
          </p>
        </div>
        {!loading && !loadError && (
          <span
            className="shrink-0 rounded-lg bg-[#161C3A] border border-white/[0.08] px-3.5 py-2.5 text-[13px] text-[#AAB2D4]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {permissions.length} total
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565F8C]">
          <Search size={15} />
        </span>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by key, module, or description…"
          className="w-full rounded-lg bg-[#161C3A] border border-white/[0.08] pl-9 pr-3 py-2.5 text-[13.5px] text-[#F2F4FA] placeholder:text-[#565F8C] outline-none focus:border-[#3FDCC0]/50 focus:ring-1 focus:ring-[#3FDCC0]/30 transition-colors"
        />
      </div>

      {/* Content */}
      {loading && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-5 py-10 text-center text-[13px] text-[#565F8C]">
          Loading permissions…
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-5 py-10 text-center text-[13px] text-[#FF6B6B]">
          {loadError}
        </div>
      )}

      {!loading && !loadError && grouped.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#161C3A] px-5 py-10 text-center text-[13px] text-[#565F8C]">
          No permissions match this search.
        </div>
      )}

      {!loading && !loadError && grouped.length > 0 && (
        <div className="space-y-5">
          {grouped.map(({ module, permissions: items }) => (
            <div key={module} className="rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
                <h2 className="text-[14px] font-semibold text-[#F2F4FA]">{moduleLabel(module)}</h2>
                <span
                  className="text-[11px] text-[#565F8C] uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {items.length} permission{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr
                    className="text-[11px] uppercase tracking-wide text-[#565F8C] border-b border-white/[0.06]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <th className="px-5 py-2.5 font-medium">Action</th>
                    <th className="px-5 py-2.5 font-medium">Key</th>
                    <th className="px-5 py-2.5 font-medium">Description</th>
                    <th className="px-5 py-2.5 font-medium text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${actionStyle(
                            p.action
                          )}`}
                        >
                          {actionLabel(p.action)}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 text-[12.5px] text-[#AAB2D4]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {p.key}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-[#8891B8]">{p.description ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleCopy(p.key)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#3FDCC0] hover:bg-[#3FDCC0]/10 transition-colors"
                            aria-label={`Copy ${p.key}`}
                          >
                            {copiedKey === p.key ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}