import { create } from 'zustand';
import { ApiError } from '@/api/client';
import { players } from '@/api/players';

const JWT_KEY = 'genesara.jwt';
const PLR_KEY = 'genesara.plr';

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // ignore — private mode, etc.
  }
}

function readError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.detail ?? e.title ?? fallback;
  if (e instanceof Error) return e.message;
  return fallback;
}

interface AuthState {
  jwt: string | null;
  plrToken: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  handle401: () => void;
  setApiToken: (token: string) => void;
}

export const useAuth = create<AuthState>((set) => ({
  jwt: readSession(JWT_KEY),
  plrToken: readSession(PLR_KEY),
  loading: false,
  error: null,

  async login(username, password) {
    set({ loading: true, error: null });
    try {
      const { token } = await players.login(username, password);
      writeSession(JWT_KEY, token);
      set({ jwt: token });
      const { apiToken } = await players.myApiToken();
      writeSession(PLR_KEY, apiToken);
      set({ plrToken: apiToken, loading: false });
    } catch (e) {
      const message = readError(e, 'login failed');
      set({ loading: false, error: message });
      throw e;
    }
  },

  async register(username, password) {
    set({ loading: true, error: null });
    try {
      const reg = await players.register(username, password);
      // Engine returns `token` on register per the new brief; older mocks
      // may not, so fall back to a login round-trip.
      let token = reg.token;
      if (!token) {
        token = (await players.login(username, password)).token;
      }
      writeSession(JWT_KEY, token);
      writeSession(PLR_KEY, reg.apiToken);
      set({ jwt: token, plrToken: reg.apiToken, loading: false });
    } catch (e) {
      const message = readError(e, 'register failed');
      set({ loading: false, error: message });
      throw e;
    }
  },

  logout() {
    writeSession(JWT_KEY, null);
    writeSession(PLR_KEY, null);
    set({ jwt: null, plrToken: null, error: null });
  },

  handle401() {
    writeSession(JWT_KEY, null);
    writeSession(PLR_KEY, null);
    set({ jwt: null, plrToken: null });
  },

  setApiToken(token) {
    writeSession(PLR_KEY, token);
    set({ plrToken: token });
  },
}));
