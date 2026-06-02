import type { ProblemDetail } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetail | null,
  ) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }

  get title(): string {
    return this.problem?.title ?? this.message;
  }

  get detail(): string | undefined {
    return this.problem?.detail;
  }
}

interface ClientDeps {
  getToken: () => string | null;
  onUnauthorized: () => void;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  authed?: boolean;
  signal?: AbortSignal;
}

let deps: ClientDeps | null = null;

export function installClient(next: ClientDeps): void {
  deps = next;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authed = true, signal } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authed) {
    const token = deps?.getToken() ?? null;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const problem = await tryParseProblem(res);
    if (res.status === 401) deps?.onUnauthorized();
    throw new ApiError(res.status, problem);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function tryParseProblem(res: Response): Promise<ProblemDetail | null> {
  const contentType = res.headers.get('content-type') ?? '';
  try {
    const payload = await res.json();
    if (
      contentType.includes('application/problem+json') ||
      (payload && typeof payload === 'object' && 'title' in payload && 'status' in payload)
    ) {
      return payload as ProblemDetail;
    }
    // Legacy `{ message }` shape — synthesize a ProblemDetail-ish view.
    if (payload && typeof payload === 'object' && 'message' in payload) {
      return {
        type: 'about:blank',
        title: res.statusText || 'Error',
        status: res.status,
        detail: String((payload as { message: unknown }).message),
      };
    }
  } catch {
    // not JSON — fall through
  }
  return null;
}

type CallOpts = { authed?: boolean; signal?: AbortSignal };

export const api = {
  get: <T>(path: string, opts: CallOpts = {}) =>
    request<T>(path, { ...opts }),
  post: <T>(path: string, body?: unknown, opts: CallOpts = {}) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  del: <T>(path: string, opts: CallOpts = {}) =>
    request<T>(path, { method: 'DELETE', ...opts }),
  request,
};

export type Api = typeof api;
