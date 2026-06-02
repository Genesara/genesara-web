import { api } from './client';
import type { PublicStats } from './types';

export const stats = {
  get(): Promise<PublicStats> {
    return api.get<PublicStats>('/api/stats');
  },
};
