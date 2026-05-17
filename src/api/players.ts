import { api } from './client';
import type { ApiTokenResponse, LoginResponse, RegisterResponse } from './types';

export const players = {
  register(username: string, password: string) {
    return api<RegisterResponse>('/api/players', {
      method: 'POST',
      body: { username, password },
      authed: false,
    });
  },

  login(username: string, password: string) {
    return api<LoginResponse>('/api/players/login', {
      method: 'POST',
      body: { username, password },
      authed: false,
    });
  },

  myApiToken() {
    return api<ApiTokenResponse>('/api/me/api-token');
  },

  rotateApiToken() {
    return api<ApiTokenResponse>('/api/me/api-token/rotate', { method: 'POST' });
  },
};
