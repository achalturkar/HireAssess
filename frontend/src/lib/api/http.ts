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

export async function authFetch(path: string, token: string | null, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const { message, details } = extractMessage(json);
    throw new ApiError(message, res.status, details);
  }

  return json;
}