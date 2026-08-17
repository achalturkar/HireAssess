const API_BASE = process.env.NEXT_PUBLIC_API || '/api/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function extractMessage(json: any): { message: string; details?: unknown } {
  const raw = json?.message ?? json?.data?.message ?? json?.error;

  if (typeof raw === 'string') return { message: raw };

  // express-validator style: array of { msg, param, ... }
  if (Array.isArray(raw)) {
    const first = raw[0];
    const msg = typeof first === 'string' ? first : first?.msg || first?.message;
    return {
      message: msg ? `${msg}${raw.length > 1 ? ` (+${raw.length - 1} more)` : ''}` : 'Validation failed',
      details: raw,
    };
  }

  // nested object like { message: { msg: '...' } }
  if (raw && typeof raw === 'object') {
    return { message: raw.msg || raw.message || 'Request failed', details: raw };
  }

  return { message: 'Request failed' };
}

// export async function authFetch(path: string, token: string | null, init?: RequestInit) {
//   const res = await fetch(`${API_BASE}${path}`, {
//     ...init,
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...(init?.headers || {}),
//     },
//   });

//   const json = await res.json().catch(() => null);

//   if (!res.ok) {
//     const { message, details } = extractMessage(json);
//     throw new ApiError(message, res.status, details);
//   }

//   return json;
// }

/**
 * RECONSTRUCTED, NOT THE REAL FILE — I've never been shown the actual
 * src/lib/api/http.ts. This is inferred purely from how users.ts calls
 * authFetch(path, token, init) and reads json.data.data / json.data.meta.
 *
 * If your real http.ts's error handling doesn't unwrap an object
 * `message` field the way extractErrorMessage does below, that's very
 * likely the source of the "[object Object]" text — the same bug already
 * found and fixed in clients.ts, candidateinvitations.ts, and
 * assessment-results.ts. Please paste your real http.ts so I can confirm
 * and patch it exactly instead of guessing.
 */



/**
 * Guarantees a real string, whatever shape the backend's `message` field
 * is in — plain string, nested { message }, or an express-validator-style
 * { errors: [...] } array/object. Never let a non-string reach
 * `new ApiError(...)`: Error's constructor silently coerces it via
 * String(x), and String({}) is literally the text "[object Object]".
 */
function extractErrorMessage(body: any, status: number): string {
  const raw = body?.message;

  if (typeof raw === 'string' && raw.trim()) return raw;

  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message.trim()) return raw.message;
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      const first = raw.errors[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return String(first.msg);
      if (first?.message) return String(first.message);
    }
  }

  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    if (typeof first === 'string') return first;
    if (first?.msg) return String(first.msg);
    if (first?.message) return String(first.message);
  }

  return `Request failed (${status})`;
}

export async function authFetch(path: string, token: string | null, init?: RequestInit) {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    throw new ApiError(extractErrorMessage(body, res.status), res.status);
  }

  return body;
}