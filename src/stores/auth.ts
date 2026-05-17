import { create } from 'zustand';
import { auth as creds } from '@/api/client';
import { players } from '@/api/players';

interface AuthState {
  jwt: string | null;
  plrToken: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  jwt: creds.jwt(),
  plrToken: creds.plrToken(),
  loading: false,
  error: null,

  async login(username, password) {
    set({ loading: true, error: null });
    try {
      const { token } = await players.login(username, password);
      creds.setJwt(token);
      const { apiToken } = await players.myApiToken();
      creds.setPlr(apiToken);
      set({ jwt: token, plrToken: apiToken, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : (e as { message?: string }).message ?? 'login failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  async register(username, password) {
    set({ loading: true, error: null });
    try {
      const reg = await players.register(username, password);
      // Auto-login so we have a JWT for REST calls.
      const { token } = await players.login(username, password);
      creds.setSession(token, reg.apiToken);
      set({ jwt: token, plrToken: reg.apiToken, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : (e as { message?: string }).message ?? 'register failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  logout() {
    creds.clear();
    set({ jwt: null, plrToken: null, error: null });
  },
}));
