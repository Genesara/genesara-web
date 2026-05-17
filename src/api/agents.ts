import { api } from './client';
import type { Agent, CreateAgentResponse } from './types';

export const agents = {
  list() {
    return api<Agent[]>('/api/agents');
  },

  create(name: string) {
    return api<CreateAgentResponse>('/api/agents', {
      method: 'POST',
      body: { name },
    });
  },

  remove(agentId: string) {
    return api<void>(`/api/agents/${agentId}`, { method: 'DELETE' });
  },
};
