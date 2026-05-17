import type { ApiError } from './types';

const TOKEN_KEY = 'genesara.jwt';
const PLR_KEY = 'genesara.plr';

export const auth = {
  jwt(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  plrToken(): string | null {
    return localStorage.getItem(PLR_KEY);
  },
  setSession(jwt: string, plr: string) {
    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(PLR_KEY, plr);
  },
  setJwt(jwt: string) {
    localStorage.setItem(TOKEN_KEY, jwt);
  },
  setPlr(plr: string) {
    localStorage.setItem(PLR_KEY, plr);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLR_KEY);
  },
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  authed?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authed = true } = opts;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authed) {
    const jwt = auth.jwt();
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let message = res.statusText;
    try {
      const payload = await res.json();
      if (payload && typeof payload === 'object' && 'message' in payload) {
        message = String(payload.message);
      }
    } catch {
      // ignore json parse — keep statusText
    }
    const err: ApiError = { status: res.status, message };
    throw err;
  }

  // Some endpoints (DELETE) return no body but 200.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
