import { http, HttpResponse } from 'msw';
import type {
  Agent,
  AgentDetail,
  AgentEvent,
  Loadout,
  ProblemDetail,
  Skills,
  Relationships,
  InventoryEntry,
  RecalledNode,
} from '@/api/types';
import {
  eventSeqCounters,
  fixtureAgents,
  fixtureDetail,
  fixtureEvents,
  fixtureInventory,
  fixtureLoadout,
  fixtureMap,
  fixtureRelationships,
  fixtureSkills,
  fixtureStats,
} from './fixtures';

const MOCK_JWT = 'mock_jwt_eyJhbGciOi.demo';
const MOCK_PLR = 'plr_demo_8a3f1c0e9b';

const agentsState: Agent[] = JSON.parse(JSON.stringify(fixtureAgents));

const detailState: Record<string, AgentDetail> = JSON.parse(JSON.stringify(fixtureDetail));
const skillsState: Record<string, Skills> = JSON.parse(JSON.stringify(fixtureSkills));
const inventoryState: Record<string, InventoryEntry[]> = JSON.parse(JSON.stringify(fixtureInventory));
const loadoutState: Record<string, Loadout> = JSON.parse(JSON.stringify(fixtureLoadout));
const mapState: Record<string, RecalledNode[]> = JSON.parse(JSON.stringify(fixtureMap));
const relationshipsState: Record<string, Relationships> = JSON.parse(JSON.stringify(fixtureRelationships));
const eventsState: Record<string, AgentEvent[]> = JSON.parse(JSON.stringify(fixtureEvents));

const randomId = () =>
  'agt_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const PROBLEM_HEADERS = { 'Content-Type': 'application/problem+json' };

function problem(status: number, title: string, detail: string, instance?: string): Response {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  return new HttpResponse(JSON.stringify(body), { status, headers: PROBLEM_HEADERS });
}

function notFound(instance: string): Response {
  return problem(404, 'Not Found', 'Agent not found', instance);
}

export const handlers = [
  // ─── Auth ─────────────────────────────────────────────────
  http.post('/api/players', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (!body?.username || !body?.password) {
      return problem(400, 'Bad Request', 'username and password required', '/api/players');
    }
    return HttpResponse.json(
      { playerId: 'ply_demo', apiToken: MOCK_PLR, token: MOCK_JWT },
      { status: 201 },
    );
  }),

  http.post('/api/players/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (!body?.username || !body?.password) {
      return problem(401, 'Unauthorized', 'invalid credentials', '/api/players/login');
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

  // ─── Public stats ─────────────────────────────────────────
  http.get('/api/stats', () => {
    return HttpResponse.json({
      ...fixtureStats,
      onlineAgents: agentsState.filter((a) => a.spawned).length,
      totalAgents: agentsState.length,
    });
  }),

  // ─── Agents (collection) ──────────────────────────────────
  http.get('/api/agents', () => {
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
      return problem(400, 'Bad Request', 'name is required', '/api/agents');
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
    const id = String(params.agentId);
    const idx = agentsState.findIndex((a) => a.agentId === id);
    if (idx === -1) return notFound(`/api/agents/${id}`);
    agentsState.splice(idx, 1);
    delete detailState[id];
    return new HttpResponse(null, { status: 204 });
  }),

  // ─── Agent sub-resources ──────────────────────────────────
  http.get('/api/agents/:agentId', ({ params }) => {
    const id = String(params.agentId);
    const d = detailState[id];
    if (!d) return notFound(`/api/agents/${id}`);
    // Track tick + drift gauges so the page feels alive.
    if (d.gauges) {
      const hp = d.gauges.hp;
      const drift = Math.round((Math.random() - 0.5) * 4);
      d.gauges = {
        ...d.gauges,
        hp: { ...hp, current: Math.max(0, Math.min(hp.max, hp.current + drift)) },
      };
    }
    return HttpResponse.json({ ...d, tick: fixtureStats.tick });
  }),

  http.get('/api/agents/:agentId/skills', ({ params }) => {
    const id = String(params.agentId);
    const s = skillsState[id];
    if (!s) return notFound(`/api/agents/${id}/skills`);
    return HttpResponse.json(s);
  }),

  http.get('/api/agents/:agentId/inventory', ({ params }) => {
    const id = String(params.agentId);
    const entries = inventoryState[id];
    if (!entries) return notFound(`/api/agents/${id}/inventory`);
    return HttpResponse.json({ entries });
  }),

  http.get('/api/agents/:agentId/loadout', ({ params }) => {
    const id = String(params.agentId);
    const l = loadoutState[id];
    if (!l) return notFound(`/api/agents/${id}/loadout`);
    return HttpResponse.json(l);
  }),

  http.get('/api/agents/:agentId/map', ({ params }) => {
    const id = String(params.agentId);
    const nodes = mapState[id];
    if (!nodes) return notFound(`/api/agents/${id}/map`);
    return HttpResponse.json({ nodes });
  }),

  http.get('/api/agents/:agentId/relationships', ({ params }) => {
    const id = String(params.agentId);
    const r = relationshipsState[id];
    if (!r) return notFound(`/api/agents/${id}/relationships`);
    return HttpResponse.json(r);
  }),

  http.get('/api/agents/:agentId/events', ({ params, request }) => {
    const id = String(params.agentId);
    const log = eventsState[id];
    if (!log) return notFound(`/api/agents/${id}/events`);
    const url = new URL(request.url);
    const after = Number(url.searchParams.get('after') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const out = log.filter((e) => e.seq > after).slice(0, limit);
    return HttpResponse.json(out);
  }),

  // ─── SSE stream ───────────────────────────────────────────
  http.get('/api/agents/:agentId/events/stream', async ({ params, request }) => {
    const id = String(params.agentId);
    if (!eventsState[id]) return notFound(`/api/agents/${id}/events/stream`);

    const url = new URL(request.url);
    const after = Number(url.searchParams.get('after') ?? 0);

    const enc = new TextEncoder();
    const TYPES = ['agent.moved', 'inventory.changed', 'gauge.changed', 'relationship.changed'];
    let cancelled = false;
    let wake: (() => void) | null = null;

    function abort() {
      cancelled = true;
      wake?.();
    }
    request.signal.addEventListener('abort', abort);

    function sleep(ms: number): Promise<void> {
      return new Promise<void>((resolve) => {
        const t = setTimeout(() => { wake = null; resolve(); }, ms);
        wake = () => { clearTimeout(t); wake = null; resolve(); };
      });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // 1) Replay missed events first.
          const missed = eventsState[id].filter((e) => e.seq > after);
          for (const ev of missed) {
            if (cancelled) return;
            controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
          }

          // 2) Periodic synthetic stream.
          while (!cancelled) {
            await sleep(3000);
            if (cancelled) break;
            const seq = (eventSeqCounters[id] = (eventSeqCounters[id] ?? 0) + 1);
            const type = TYPES[seq % TYPES.length];
            const ev: AgentEvent = {
              id: `evt_${id}_${seq}`,
              seq,
              type,
              tick: fixtureStats.tick,
              payload: synthPayload(type, id),
            };
            if (cancelled) break;
            eventsState[id].push(ev);
            if (eventsState[id].length > 500) eventsState[id].shift();
            controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
            if (seq % 10 === 0) controller.enqueue(enc.encode(`:ping\n\n`));
          }
        } catch {
          // swallow — controller likely closed by abort
        } finally {
          request.signal.removeEventListener('abort', abort);
          try { controller.close(); } catch { /* already closed */ }
        }
      },
      cancel() {
        abort();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];

function synthPayload(type: string, agentId: string): unknown {
  switch (type) {
    case 'agent.moved':
      return { from: 142000 + Math.floor(Math.random() * 100), to: 142000 + Math.floor(Math.random() * 100) };
    case 'inventory.changed':
      return { itemId: pickItem(agentId), delta: Math.random() > 0.5 ? 1 : -1 };
    case 'gauge.changed':
      return { gauge: 'hp', delta: Math.round((Math.random() - 0.5) * 6) };
    case 'relationship.changed':
      return { agentId: 'warg-3a', delta: Math.round((Math.random() - 0.5) * 6) };
    default:
      return {};
  }
}

function pickItem(agentId: string): string {
  const inv = inventoryState[agentId];
  if (!inv || inv.length === 0) return 'unknown';
  return inv[Math.floor(Math.random() * inv.length)].itemId;
}
