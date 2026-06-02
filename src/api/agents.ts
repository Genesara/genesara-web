import { api } from './client';
import type {
  AgentDetail,
  AgentEvent,
  AgentSummary,
  CreateAgentResponse,
  InventoryEntry,
  Loadout,
  RecalledNode,
  Relationships,
  Skills,
} from './types';

export const agents = {
  list() {
    return api.get<AgentSummary[]>('/api/agents');
  },

  create(name: string) {
    return api.post<CreateAgentResponse>('/api/agents', { name });
  },

  remove(agentId: string) {
    return api.del<void>(`/api/agents/${agentId}`);
  },

  get(agentId: string) {
    return api.get<AgentDetail>(`/api/agents/${agentId}`);
  },

  skills(agentId: string) {
    return api.get<Skills>(`/api/agents/${agentId}/skills`);
  },

  inventory(agentId: string) {
    return api.get<{ entries: InventoryEntry[] }>(`/api/agents/${agentId}/inventory`);
  },

  loadout(agentId: string) {
    return api.get<Loadout>(`/api/agents/${agentId}/loadout`);
  },

  map(agentId: string) {
    return api.get<{ nodes: RecalledNode[] }>(`/api/agents/${agentId}/map`);
  },

  relationships(agentId: string) {
    return api.get<Relationships>(`/api/agents/${agentId}/relationships`);
  },

  eventsSince(agentId: string, after = 0, limit = 50) {
    return api.get<AgentEvent[]>(
      `/api/agents/${agentId}/events?after=${after}&limit=${limit}`,
    );
  },
};
