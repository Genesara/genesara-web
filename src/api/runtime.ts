import { api } from './client';
import type { LookAround } from './types';

// REST mirror of the MCP runtime tools (`/api/agent/me/*`). Auth is the
// player API token + X-Agent-Id — the MCP chain, not the portal JWT — so a
// 401 here means a rotated/revoked plr_ token, never a dead session.
export const runtime = {
  lookAround(agentId: string, plrToken: string) {
    return api.request<LookAround>('/api/agent/me/look-around', {
      bearer: plrToken,
      headers: { 'X-Agent-Id': agentId },
      silent401: true,
    });
  },
};
