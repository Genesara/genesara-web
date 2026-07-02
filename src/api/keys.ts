// Single source of truth for TanStack Query keys.
// SSE invalidations and useQuery call sites both reference these.

export const qk = {
  stats: ['stats'] as const,
  apiToken: ['me', 'apiToken'] as const,
  agents: ['agents'] as const,
  agent: (id: string) => ['agent', id] as const,
  agentSkills: (id: string) => ['agent', id, 'skills'] as const,
  agentInventory: (id: string) => ['agent', id, 'inventory'] as const,
  agentLoadout: (id: string) => ['agent', id, 'loadout'] as const,
  agentMap: (id: string) => ['agent', id, 'map'] as const,
  agentSurroundings: (id: string) => ['agent', id, 'surroundings'] as const,
  agentRelationships: (id: string) => ['agent', id, 'relationships'] as const,
  agentEvents: (id: string) => ['agent', id, 'events'] as const,
};
