import { api } from './client';
import type { ApiTokenResponse, LoginResponse, RegisterResponse } from './types';

export const players = {
  register(username: string, password: string) {
    return api.post<RegisterResponse>(
      '/api/players',
      { username, password },
      { authed: false },
    );
  },

  login(username: string, password: string) {
    return api.post<LoginResponse>(
      '/api/players/login',
      { username, password },
      { authed: false },
    );
  },

  myApiToken() {
    return api.get<ApiTokenResponse>('/api/me/api-token');
  },

  rotateApiToken() {
    return api.post<ApiTokenResponse>('/api/me/api-token/rotate');
  },
};
