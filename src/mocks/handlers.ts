import { http, HttpResponse } from 'msw';
import type { Agent } from '@/api/types';
import { fixtureAgents } from './fixtures';

const MOCK_JWT = 'mock_jwt_eyJhbGciOi.demo';
const MOCK_PLR = 'plr_demo_8a3f1c0e9b';

const agentsState: Agent[] = JSON.parse(JSON.stringify(fixtureAgents));

const randomId = () =>
  'agt_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const handlers = [
  // ─── Auth ─────────────────────────────────────────────────
  http.post('/api/players', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (!body?.username || !body?.password) {
      return HttpResponse.json({ message: 'username and password required' }, { status: 400 });
    }
    return HttpResponse.json(
      { playerId: 'ply_demo', apiToken: MOCK_PLR },
      { status: 201 },
    );
  }),

  http.post('/api/players/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (!body?.username || !body?.password) {
      return HttpResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({ token: MOCK_JWT });
  }),

  http.get('/api/me/api-token', () => {
    return HttpResponse.json({ apiToken: MOCK_PLR });
  }),

  http.post('/api/me/api-token/rotate', () => {
    const rotated = 'plr_demo_' + Math.random().toString(36).slice(2, 12);
    return HttpResponse.json({ apiToken: rotated });
  }),

  // ─── Agents ───────────────────────────────────────────────
  http.get('/api/agents', () => {
    // Lightly perturb HP each poll so the dashboard feels alive.
    const out = agentsState.map((a) => {
      if (!a.gauges) return a;
      const hp = a.gauges.hp;
      const drift = Math.round((Math.random() - 0.5) * 4);
      return {
        ...a,
        gauges: {
          ...a.gauges,
          hp: { ...hp, current: Math.max(0, Math.min(hp.max, hp.current + drift)) },
        },
        lastActiveAt: a.spawned ? new Date().toISOString() : a.lastActiveAt,
      };
    });
    return HttpResponse.json(out);
  }),

  http.post('/api/agents', async ({ request }) => {
    const body = (await request.json()) as { name: string };
    if (!body?.name?.trim()) {
      return HttpResponse.json({ message: 'name is required' }, { status: 400 });
    }
    const agentId = randomId();
    agentsState.push({
      agentId,
      name: body.name.trim(),
      classId: null,
      race: 'human_steppe',
      level: 1,
      xpCurrent: 0,
      xpToNext: 100,
      gauges: null,
      locationNodeId: null,
      spawned: false,
      lastActiveAt: null,
    });
    return HttpResponse.json({ agentId }, { status: 201 });
  }),

  http.delete('/api/agents/:agentId', ({ params }) => {
    const idx = agentsState.findIndex((a) => a.agentId === params.agentId);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    agentsState.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
