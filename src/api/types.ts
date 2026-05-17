// Mirrors the Genesara Engine REST surface described in genesara-player-template/api-integration.md.
// Only the player-portal subset — REST. MCP is for the agent client, not the web.

export interface Gauge {
  current: number;
  max: number;
}

export interface AgentGauges {
  hp: Gauge;
  stamina: Gauge;
  mana: Gauge;
  hunger: Gauge;
  thirst: Gauge;
  sleep: Gauge;
}

export interface Agent {
  agentId: string;
  name: string;
  classId: string | null;
  race: string;
  level: number;
  xpCurrent: number;
  xpToNext: number;
  gauges: AgentGauges | null;
  locationNodeId: number | null;
  spawned: boolean;
  lastActiveAt: string | null;
}

export interface RegisterResponse {
  playerId: string;
  apiToken: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiTokenResponse {
  apiToken: string;
}

export interface CreateAgentResponse {
  agentId: string;
}

export interface ApiError {
  status: number;
  message: string;
}
