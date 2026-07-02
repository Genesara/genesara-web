import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { agents as agentsApi } from '@/api/agents';
import { players } from '@/api/players';
import { runtime } from '@/api/runtime';
import { ApiError } from '@/api/client';
import { qk } from '@/api/keys';
import type {
  AgentDetail,
  EquipmentInstance,
  EquipSlot,
  RelationshipEntry,
} from '@/api/types';
import { useAuth } from '@/stores/auth';
import { useAgentEvents, type ReceivedAgentEvent } from '@/composables/useAgentEvents';
import { formatTick, useStats } from '@/composables/useTick';
import { CharacterViewer } from '@/components/CharacterViewer';
import { ItemIcon } from '@/components/ItemIcon';
import { WorldMap3D } from '@/components/WorldMap3D';
import { FloatingWindow } from '@/components/FloatingWindow';
import '@/styles/app.css';
import '@/styles/agent.css';

const EQUIPMENT_SLOTS = [
  'HELMET',
  'CHEST',
  'PANTS',
  'BOOTS',
  'GLOVES',
  'AMULET',
  'RING_LEFT',
  'RING_RIGHT',
  'BRACELET_LEFT',
  'BRACELET_RIGHT',
  'MAIN_HAND',
  'OFF_HAND',
] as const;

type Slot = (typeof EQUIPMENT_SLOTS)[number];

const ATTR_LABEL: Array<[keyof AgentDetail['attributes'], string]> = [
  ['strength', 'STR'],
  ['dexterity', 'DEX'],
  ['constitution', 'CON'],
  ['perception', 'PER'],
  ['intelligence', 'INT'],
  ['luck', 'LUCK'],
];

function pct(g: { current: number; max: number } | undefined | null) {
  if (!g || g.max === 0) return 0;
  return Math.round((g.current / g.max) * 100);
}

function stanceFor(score: number): 'friendly' | 'hostile' | 'neutral' {
  if (score > 0) return 'friendly';
  if (score < 0) return 'hostile';
  return 'neutral';
}

function formatEvent(ev: ReceivedAgentEvent): { ts: string; verb: string; body: string; muted?: boolean } {
  const verb = ev.type.split('.').slice(-1)[0] ?? ev.type;
  const ts = new Date(ev.receivedAt).toLocaleTimeString();
  const p = (ev.payload ?? {}) as Record<string, unknown>;
  let body: string;
  switch (ev.type) {
    case 'agent.moved':
      body = `node.${p.from ?? '?'} → node.${p.to ?? '?'}`;
      break;
    case 'inventory.changed': {
      const delta = Number(p.delta ?? 0);
      const sign = delta > 0 ? '+' : '';
      body = `${p.itemId ?? 'item'} · ${sign}${delta}`;
      break;
    }
    case 'gauge.changed':
      body = `${p.gauge ?? 'gauge'} ${Number(p.delta ?? 0) >= 0 ? '+' : ''}${p.delta ?? 0}`;
      break;
    case 'relationship.changed':
      body = `${p.agentId ?? 'agent'} · ${Number(p.delta ?? 0) >= 0 ? '+' : ''}${p.delta ?? 0}`;
      break;
    case 'agent.spawned':
      body = `spawned at node.${p.node ?? '?'}`;
      break;
    default:
      try {
        body = JSON.stringify(p);
      } catch {
        body = '';
      }
  }
  return { ts, verb, body };
}

// ── Floating window manager ───────────────────────────────────────────────
type WindowId = 'loadout' | 'skills' | 'inventory' | 'sheet';

interface WinState {
  open: boolean;
  pos: { x: number; y: number };
  z: number;
}

interface WinConfig {
  width: number;
  height: number;
  // Default position is computed from the viewport at open time.
  initial: (vw: number, vh: number) => { x: number; y: number };
}

const WIN_CONFIG: Record<WindowId, WinConfig> = {
  loadout: { width: 420, height: 540, initial: () => ({ x: 300, y: 150 }) },
  skills: { width: 420, height: 460, initial: () => ({ x: 360, y: 180 }) },
  inventory: { width: 400, height: 360, initial: () => ({ x: 420, y: 210 }) },
  sheet: { width: 440, height: 480, initial: () => ({ x: 480, y: 150 }) },
};

const WIN_IDS: WindowId[] = ['loadout', 'skills', 'inventory', 'sheet'];

function useWindowManager() {
  const [state, setState] = useState<Record<WindowId, WinState>>(() => {
    const init = {} as Record<WindowId, WinState>;
    for (const id of WIN_IDS) init[id] = { open: false, pos: { x: 0, y: 0 }, z: 0 };
    return init;
  });
  const topZ = useRef(100);

  const focus = useCallback((id: WindowId) => {
    topZ.current += 1;
    const z = topZ.current;
    setState((s) => ({ ...s, [id]: { ...s[id], z } }));
  }, []);

  const toggle = useCallback((id: WindowId) => {
    setState((s) => {
      const cur = s[id];
      if (cur.open) return { ...s, [id]: { ...cur, open: false } };
      topZ.current += 1;
      const cfg = WIN_CONFIG[id];
      const pos =
        cur.pos.x === 0 && cur.pos.y === 0
          ? cfg.initial(window.innerWidth, window.innerHeight)
          : cur.pos;
      return { ...s, [id]: { open: true, pos, z: topZ.current } };
    });
  }, []);

  const close = useCallback((id: WindowId) => {
    setState((s) => ({ ...s, [id]: { ...s[id], open: false } }));
  }, []);

  const move = useCallback((id: WindowId, pos: { x: number; y: number }) => {
    setState((s) => ({ ...s, [id]: { ...s[id], pos } }));
  }, []);

  return { state, focus, toggle, close, move };
}

export function AgentDetailPage() {
  const { agentId } = useParams();
  const id = agentId ?? '';
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const { data: stats } = useStats();
  const tick = stats?.tick ?? 0;
  const [hoveredSlot, setHoveredSlot] = useState<Slot | null>(null);
  const win = useWindowManager();

  // Lock the page to a single viewport on the cockpit route. Released on
  // unmount and on small viewports (so we don't trap users on tiny screens).
  useEffect(() => {
    function apply() {
      const ok = window.innerWidth >= 1100 && window.innerHeight >= 680;
      document.body.classList.toggle('cockpit-lock', ok);
    }
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      document.body.classList.remove('cockpit-lock');
    };
  }, []);

  const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
  const retry404Aware = (count: number, e: unknown) => !isNotFound(e) && count < 1;

  const detailQuery = useQuery({
    queryKey: qk.agent(id),
    queryFn: () => agentsApi.get(id),
    refetchInterval: (q) => (isNotFound(q.state.error) ? false : 1500),
    enabled: !!id,
    retry: retry404Aware,
  });

  const detailNotFound = isNotFound(detailQuery.error);

  const loadoutQuery = useQuery({
    queryKey: qk.agentLoadout(id),
    queryFn: () => agentsApi.loadout(id),
    enabled: !!id && !detailNotFound,
    retry: retry404Aware,
  });

  const relationshipsQuery = useQuery({
    queryKey: qk.agentRelationships(id),
    queryFn: () => agentsApi.relationships(id),
    enabled: !!id && !detailNotFound,
    retry: retry404Aware,
  });

  const skillsQuery = useQuery({
    queryKey: qk.agentSkills(id),
    queryFn: () => agentsApi.skills(id),
    enabled: !!id && !detailNotFound,
    retry: retry404Aware,
  });

  const mapQuery = useQuery({
    queryKey: qk.agentMap(id),
    queryFn: () => agentsApi.map(id),
    refetchInterval: (q) => (isNotFound(q.state.error) ? false : 5000),
    enabled: !!id && !detailNotFound,
    retry: retry404Aware,
  });

  // Live surroundings via the look_around REST mirror (plr_ token auth).
  // Optional overlay: 401/404/409 (rotated token, unspawned agent) simply
  // leave the map without presence markers, so never retry or surface it.
  const plrToken = useAuth((s) => s.plrToken);
  const placed = detailQuery.data?.location != null;
  const surroundingsQuery = useQuery({
    queryKey: qk.agentSurroundings(id),
    queryFn: () => runtime.lookAround(id, plrToken!),
    refetchInterval: 5000,
    enabled: !!id && !detailNotFound && !!plrToken && placed,
    retry: false,
  });

  // Skip SSE/backfill when the agent is known not to exist.
  const { events } = useAgentEvents(detailNotFound ? undefined : id);

  const agent = detailQuery.data;
  const loadout = loadoutQuery.data;

  // Stable identity — WorldMap3D is memoized and the cockpit re-renders on
  // every poll; detailQuery returns a fresh object each cycle.
  const ownId = agent?.agentId;
  const ownRace = agent?.race;
  const ownAgent = useMemo(
    () => (ownId && ownRace ? { agentId: ownId, race: ownRace, loadout: loadout ?? null } : null),
    [ownId, ownRace, loadout],
  );
  const relationships = relationshipsQuery.data;
  const skills = skillsQuery.data;
  const map = mapQuery.data;

  const slotIndex = useMemo(() => {
    const idx: Partial<Record<EquipSlot, EquipmentInstance>> = {};
    if (!loadout) return idx;
    for (const s of loadout.equipment.slots) {
      if (s.instance) idx[s.slotId] = s.instance;
    }
    return idx;
  }, [loadout]);

  const equippedCount = Object.values(slotIndex).filter(Boolean).length;
  const hoveredInstance = hoveredSlot ? slotIndex[hoveredSlot] : null;

  const resources = loadout?.stackable ?? [];
  const keys = loadout?.instances ?? [];
  const stash = loadout?.equipment.stash ?? [];

  const filledSkills = useMemo(
    () =>
      (skills?.slots ?? [])
        .filter((s) => s.skill)
        .map((s) => ({ ...s.skill!, slotIndex: s.slotIndex })),
    [skills],
  );
  const maxSkillLevel = useMemo(
    () => Math.max(10, ...filledSkills.map((s) => s.level), ...(skills?.unslotted ?? []).map((s) => s.level)),
    [filledSkills, skills],
  );

  const nearby = useMemo(() => {
    const entries = relationships?.entries ?? [];
    return [...entries]
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
      .slice(0, 4);
  }, [relationships]);

  const recentEvents = useMemo(() => events.slice(-40).reverse(), [events]);

  function onLogout() {
    logout();
    navigate('/', { replace: true });
  }

  if (detailQuery.isLoading || (!agent && !detailQuery.error)) {
    return (
      <>
        <DetailHeader agentId={id} onLogout={onLogout} />
        <main style={{ padding: 40, maxWidth: 720, margin: '0 auto', fontFamily: 'var(--mono)' }}>
          <p style={{ color: 'var(--text-dim)' }}>loading agent…</p>
        </main>
      </>
    );
  }

  if (!agent) {
    const is404 = detailQuery.error instanceof ApiError && detailQuery.error.status === 404;
    return (
      <>
        <DetailHeader agentId={id} onLogout={onLogout} />
        <main style={{ padding: 40, maxWidth: 720, margin: '0 auto', fontFamily: 'var(--mono)' }}>
          <p style={{ color: 'var(--text-dim)' }}>
            {is404
              ? 'Agent not found, or not yours.'
              : detailQuery.error instanceof Error
                ? `Failed to load agent: ${detailQuery.error.message}`
                : 'Agent not available.'}
          </p>
        </main>
      </>
    );
  }

  const spawned = agent.location != null;
  const hasPendingChoice =
    agent.pendingClassChoice.length > 0 || agent.pendingEvolutionChoice.length > 0;

  return (
    <div className="cockpit">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            Genesara
          </Link>
          <span className="crumb">
            <Link to="/app">roster</Link>
            <span className="sep">/</span>
            <b>{agent.name.toLowerCase()}</b>
          </span>
          <div className="right">
            <OperatorTokenMenu />
            <button onClick={onLogout}>Log out</button>
          </div>
        </div>
      </header>

      <div className="agent-strip">
        <div className="agent-strip-inner">
          <span className="name">{agent.name}</span>
          <span className="cls">{(agent.classId ?? 'unrevealed').toUpperCase()}</span>
          <span className="lv">Lvl {agent.level}</span>
          <span className="sep">·</span>
          <span className="loc">
            <span className="pre">in </span>
            {agent.location ? `node.${agent.location}` : 'never spawned'}
          </span>
          <span className="sep">·</span>
          {agent.gauges && (
            <span className="hp-mini">
              <span className="kdim">HP</span>
              <span className="bar">
                <span style={{ '--pct': `${pct(agent.gauges.hp)}%` } as React.CSSProperties} />
              </span>
              <span>
                {agent.gauges.hp.current} / {agent.gauges.hp.max}
              </span>
            </span>
          )}
          <span className="sep">·</span>
          <span className={spawned ? 'state-on' : 'state-off'}>
            <span className="kdim">●</span> {spawned ? 'online' : 'offline'}
          </span>
          <span className="strip-tick">tick {formatTick(tick)}</span>
        </div>
      </div>

      {/* ── COCKPIT STAGE — 3 zones, fills remaining viewport ── */}
      <main className="cockpit-stage">
        {/* LEFT RAIL — alarm panel + intent */}
        <section className="rail rail-left">
          <div className="panel rail-panel">
            <div className="panel-head">
              <span>vitals</span>
              <span className="right">{spawned ? 'live' : '—'}</span>
            </div>
            <div className="sheet rail-vitals">
              {agent.gauges ? (
                <>
                  <div className="vital">
                    <span className="k">HP</span>
                    <span className={`bar hp${pct(agent.gauges.hp) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.hp)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.hp.current} / {agent.gauges.hp.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">STAMINA</span>
                    <span className={`bar${pct(agent.gauges.stamina) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.stamina)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.stamina.current} / {agent.gauges.stamina.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">MANA</span>
                    <span className={`bar mana${pct(agent.gauges.mana) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.mana)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.mana.current} / {agent.gauges.mana.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">HUNGER</span>
                    <span className={`bar${pct(agent.gauges.hunger) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.hunger)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.hunger.current} / {agent.gauges.hunger.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">THIRST</span>
                    <span className={`bar${pct(agent.gauges.thirst) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.thirst)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.thirst.current} / {agent.gauges.thirst.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">SLEEP</span>
                    <span className={`bar${pct(agent.gauges.sleep) <= 25 ? ' low' : ''}`}>
                      <span style={{ '--pct': `${pct(agent.gauges.sleep)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.sleep.current} / {agent.gauges.sleep.max}
                    </span>
                  </div>
                </>
              ) : (
                <div className="vital">
                  <span className="k">—</span>
                  <span className="v" style={{ color: 'var(--text-dim)' }}>
                    never spawned
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="panel rail-panel rail-grow">
            <div className="panel-head">
              <span>current intent</span>
              <span className="right">{recentEvents[0]?.type ?? 'idle'}</span>
            </div>
            <div className="activity rail-scroll">
              <div className="intent">
                <div className="lbl">
                  <span className={`dot ${spawned ? 'online' : ''}`} />
                  current intent
                </div>
                {/* TODO(engine): the REST surface does not yet expose live intent. */}
                <div className="what">
                  {spawned
                    ? 'awaiting next directive from the agent runtime.'
                    : 'agent is offline. spawn from your agent client to set an intent.'}
                </div>
                <div className="why">
                  {recentEvents[0]
                    ? `last event · ${recentEvents[0].type}`
                    : 'no recent activity'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER — world map hero */}
        <section className="cockpit-map">
          <div className="panel world cockpit-world">
            <div className="panel-head">
              <span>world view · agent memory</span>
              <span className="right accent">
                live · tick {formatTick(tick)} · {map?.nodes.length ?? 0} recalled
              </span>
            </div>
            <div className="cockpit-world-canvas">
              <WorldMap3D
                nodes={map?.nodes ?? []}
                currentNode={agent.location}
                tick={tick}
                loading={mapQuery.isLoading}
                surroundings={surroundingsQuery.data ?? null}
                ownAgent={ownAgent}
              />
            </div>
          </div>
        </section>

        {/* RIGHT RAIL — relationships + live events */}
        <section className="rail rail-right">
          {hasPendingChoice && (
            <div className="cockpit-alert">
              <span className="dot online" />
              <span className="lbl">action required</span>
              <span className="txt">
                {agent.pendingClassChoice.length > 0 &&
                  `class: ${agent.pendingClassChoice
                    .map((c) => c.replace(/_/g, ' ').toLowerCase())
                    .join(' / ')}`}
                {agent.pendingClassChoice.length > 0 &&
                  agent.pendingEvolutionChoice.length > 0 &&
                  ' · '}
                {agent.pendingEvolutionChoice.length > 0 &&
                  `evolution: ${agent.pendingEvolutionChoice
                    .map((c) => c.replace(/_/g, ' ').toLowerCase())
                    .join(' / ')}`}
              </span>
            </div>
          )}

          <div className="panel rail-panel">
            <div className="panel-head">
              <span>relationships</span>
              <span className="right">top {nearby.length} by impact</span>
            </div>
            <div className="nearby rail-nearby">
              {nearby.length === 0 && (
                <div className="nearby-row" style={{ color: 'var(--text-dim)' }}>
                  no relationships yet
                </div>
              )}
              {nearby.map((entry: RelationshipEntry) => {
                const stance = stanceFor(entry.score);
                const display = entry.agentName ?? entry.agentId;
                const sign = entry.score >= 0 ? '+' : '';
                return (
                  <div className="nearby-row" key={entry.agentId}>
                    <span className={`dot ${stance}`} />
                    <span className="nm">{display.toLowerCase()}</span>
                    <span className="fac">{entry.agentId}</span>
                    <span className={`stat ${stance}`}>
                      {stance} · {sign}
                      {entry.score}
                    </span>
                    <span className="dist">
                      tickΔ {Math.max(0, tick - entry.lastChangedAtTick)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel rail-panel rail-grow">
            <div className="panel-head">
              <span>
                <span className="dot online evt-dot" /> events.tail
              </span>
              <span className="right">{agent.name.toLowerCase()} · --follow</span>
            </div>
            <div className="events-feed rail-scroll">
              {recentEvents.length === 0 && (
                <div className="row" style={{ color: 'var(--text-dim)' }}>
                  <span className="ts">—</span>
                  <span className="v muted">idle</span>
                  <span className="body">waiting for events…</span>
                </div>
              )}
              {recentEvents.map((ev) => {
                const f = formatEvent(ev);
                return (
                  <div className="row" key={ev.id}>
                    <span className="ts">{f.ts}</span>
                    <span className={`v${f.muted ? ' muted' : ''}`}>{f.verb}</span>
                    <span className="body">{f.body}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ── DOCK BAR — window launchers ── */}
      <nav className="dock">
        <div className="dock-launchers">
          {WIN_IDS.map((wid) => (
            <button
              key={wid}
              className={`dock-btn${win.state[wid].open ? ' active' : ''}`}
              onClick={() => win.toggle(wid)}
              aria-pressed={win.state[wid].open}
            >
              {wid}
            </button>
          ))}
        </div>
        <div className="dock-status">
          <span className={spawned ? 'state-on' : 'state-off'}>
            <span className="kdim">●</span> {spawned ? 'online' : 'offline'}
          </span>
          <span className="sep">·</span>
          <span>tick {formatTick(tick)}</span>
        </div>
      </nav>

      {/* ── FLOATING WINDOWS — opened from the dock ── */}
      {win.state.loadout.open && (
        <FloatingWindow
          id="loadout"
          title="loadout"
          subtitle={`12 slots · ${equippedCount} equipped${stash.length > 0 ? ` · ${stash.length} stashed` : ''}`}
          position={win.state.loadout.pos}
          width={WIN_CONFIG.loadout.width}
          height={WIN_CONFIG.loadout.height}
          zIndex={win.state.loadout.z}
          onClose={() => win.close('loadout')}
          onFocus={() => win.focus('loadout')}
          onMove={(p) => win.move('loadout', p)}
        >
          <div className="doll">
            <div className="col-l">
              {(['AMULET', 'CHEST', 'BRACELET_LEFT', 'RING_LEFT'] as Slot[]).map((slot) => (
                <SlotView
                  key={slot}
                  slot={slot}
                  instance={slotIndex[slot]}
                  active={hoveredSlot === slot}
                  onHover={setHoveredSlot}
                />
              ))}
            </div>

            <div className="center">
              <SlotView
                slot="HELMET"
                instance={slotIndex.HELMET}
                className="top"
                active={hoveredSlot === 'HELMET'}
                onHover={setHoveredSlot}
              />
              <div className="model-stage">
                <CharacterViewer
                  agentId={agent.agentId}
                  race={agent.race}
                  loadout={loadout ?? null}
                />
                <div className="model-shadow" />
              </div>
              {!agent.location && (
                <div className="model-microcopy">
                  not spawned · spawn the agent to enter the world
                </div>
              )}
              <SlotView
                slot="BOOTS"
                instance={slotIndex.BOOTS}
                className="bottom-c"
                active={hoveredSlot === 'BOOTS'}
                onHover={setHoveredSlot}
              />
            </div>

            <div className="col-r">
              {(['GLOVES', 'PANTS', 'BRACELET_RIGHT', 'RING_RIGHT'] as Slot[]).map((slot) => (
                <SlotView
                  key={slot}
                  slot={slot}
                  instance={slotIndex[slot]}
                  active={hoveredSlot === slot}
                  onHover={setHoveredSlot}
                />
              ))}
            </div>

            <div className="bottom">
              <SlotView
                slot="MAIN_HAND"
                instance={slotIndex.MAIN_HAND}
                active={hoveredSlot === 'MAIN_HAND'}
                onHover={setHoveredSlot}
              />
              <SlotView
                slot="OFF_HAND"
                instance={slotIndex.OFF_HAND}
                active={hoveredSlot === 'OFF_HAND'}
                onHover={setHoveredSlot}
              />
            </div>
          </div>

          {stash.length > 0 && (
            <div className="stash-strip">
              <span className="stash-lbl">stash</span>
              {stash.map((it) => (
                <span
                  key={it.instanceId}
                  className={`stash-chip rarity-${it.rarity.toLowerCase()}`}
                  title={`${it.itemId} · ${it.category.toLowerCase()} · ${it.rarity} · durability ${it.durabilityCurrent}/${it.durabilityMax}${
                    it.creatorAgentId ? ` · crafted by ${it.creatorAgentId}` : ''
                  } · instance ${it.instanceId}`}
                >
                  <ItemIcon itemId={it.itemId} category={it.category} size={13} />
                  {it.itemId}
                </span>
              ))}
            </div>
          )}

          {hoveredSlot && hoveredInstance && (
            <div className="slot-tip" style={{ position: 'static', display: 'block', margin: '0 22px 16px' }}>
              <strong style={{ color: 'var(--accent)' }}>{hoveredInstance.itemId}</strong>
              <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>
                · {hoveredInstance.rarity}
              </span>
              <div style={{ marginTop: 4 }}>
                durability {hoveredInstance.durabilityCurrent} / {hoveredInstance.durabilityMax}
                {hoveredInstance.creatorAgentId
                  ? ` · crafted by ${hoveredInstance.creatorAgentId}`
                  : ''}
              </div>
              <div style={{ marginTop: 4, color: 'var(--text-dim)', fontSize: 11 }}>
                {hoveredInstance.category.toLowerCase()} · instance {hoveredInstance.instanceId}
              </div>
            </div>
          )}
        </FloatingWindow>
      )}

      {win.state.skills.open && skills && (
        <FloatingWindow
          id="skills"
          title="skills"
          subtitle={`${skills.slotsFilled} / ${skills.slotCount} slots`}
          position={win.state.skills.pos}
          width={WIN_CONFIG.skills.width}
          height={WIN_CONFIG.skills.height}
          zIndex={win.state.skills.z}
          onClose={() => win.close('skills')}
          onFocus={() => win.focus('skills')}
          onMove={(p) => win.move('skills', p)}
        >
          <div className="skills">
            {filledSkills.length === 0 && (
              <div className="skill-empty">no skills slotted yet</div>
            )}
            {filledSkills.map((sk) => (
              <div
                className="skill-row"
                key={sk.id}
                title={`${sk.displayName} · slot ${sk.slotIndex} · id ${sk.id}`}
              >
                <span className="nm">
                  {sk.displayName.toLowerCase()}
                  <span className="cat">
                    {sk.category.replace(/_/g, ' ').toLowerCase()} · {sk.xp.toLocaleString()} xp
                  </span>
                </span>
                <span className="bar">
                  <span
                    style={
                      { '--pct': `${Math.round((sk.level / maxSkillLevel) * 100)}%` } as React.CSSProperties
                    }
                  />
                </span>
                <span className="rk">
                  Lv {sk.level}
                  {sk.recommendCount > 0 && <span className="rec">★{sk.recommendCount}</span>}
                </span>
              </div>
            ))}

            {skills.unslotted.length > 0 && (
              <>
                <h3>unslotted</h3>
                {skills.unslotted.map((sk) => (
                  <div
                    className="skill-row unslotted"
                    key={sk.id}
                    title={`${sk.displayName} · id ${sk.id}`}
                  >
                    <span className="nm">
                      {sk.displayName.toLowerCase()}
                      <span className="cat">
                        {sk.category.replace(/_/g, ' ').toLowerCase()} · {sk.xp.toLocaleString()} xp
                      </span>
                    </span>
                    <span className="bar">
                      <span
                        style={
                          { '--pct': `${Math.round((sk.level / maxSkillLevel) * 100)}%` } as React.CSSProperties
                        }
                      />
                    </span>
                    <span className="rk">
                      Lv {sk.level}
                      {sk.recommendCount > 0 && <span className="rec">★{sk.recommendCount}</span>}
                    </span>
                  </div>
                ))}
              </>
            )}

            {skills.pendingPerkChoices.length > 0 && (
              <div className="perk-note">
                <div className="lbl">
                  <span className="dot online" />
                  perk choices available
                </div>
                {skills.pendingPerkChoices.map((p, i) => (
                  <div className="opt" key={`${p.skillId}-${p.milestone}-${i}`}>
                    <span className="src">
                      {p.skillId} · milestone {p.milestone}
                    </span>
                    <span className="choices">{p.options.join(' / ')}</span>
                  </div>
                ))}
              </div>
            )}

            {skills.chosenPerks.length > 0 && (
              <div className="chosen-perks">
                <h3>perks</h3>
                {skills.chosenPerks.map((p, i) => (
                  <div className="perk" key={`${p.skillId}-${p.milestone}-${i}`}>
                    <span className="nm">{p.perkId}</span>
                    <span className="src">
                      {p.skillId} · m{p.milestone}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FloatingWindow>
      )}

      {win.state.inventory.open && (
        <FloatingWindow
          id="inventory"
          title="inventory"
          subtitle={`${resources.length} resource${resources.length === 1 ? '' : 's'}${
            keys.length > 0 ? ` · ${keys.length} key${keys.length === 1 ? '' : 's'}` : ''
          }`}
          position={win.state.inventory.pos}
          width={WIN_CONFIG.inventory.width}
          height={WIN_CONFIG.inventory.height}
          zIndex={win.state.inventory.z}
          onClose={() => win.close('inventory')}
          onFocus={() => win.focus('inventory')}
          onMove={(p) => win.move('inventory', p)}
        >
          <div className="inv">
            {resources.length === 0 && keys.length === 0 && (
              <div className="skill-empty" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                empty — no resources or keys
              </div>
            )}
            {resources.length > 0 && (
              <div className="inv-grid">
                {resources.map((it) => (
                  <div
                    className={`inv-cell rarity-${it.rarity.toLowerCase()}`}
                    key={it.itemId}
                    title={`${it.itemId} · ${it.rarity} · ×${it.quantity}`}
                  >
                    <ItemIcon itemId={it.itemId} size={22} />
                    <span className="qty">{it.quantity}</span>
                  </div>
                ))}
              </div>
            )}
            {keys.length > 0 && (
              <div className="inv-keys">
                {keys.map((k) => (
                  <div
                    className={`key rarity-${k.rarity.toLowerCase()}`}
                    key={k.instanceId}
                    title={`${k.itemId} · ${k.category.toLowerCase()} · ${k.rarity.toLowerCase()} · instance ${k.instanceId}${
                      k.gateInstanceId ? ` · opens gate ${k.gateInstanceId}` : ''
                    }`}
                  >
                    <span className="ico">
                      <ItemIcon itemId={k.itemId} category={k.category} size={14} />
                    </span>
                    <span className="nm">{k.itemId}</span>
                    <span className="rar">{k.rarity.toLowerCase()}</span>
                    {k.gateInstanceId && (
                      <span className="gate">→ gate {k.gateInstanceId.slice(0, 8)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FloatingWindow>
      )}

      {win.state.sheet.open && (
        <FloatingWindow
          id="sheet"
          title="character sheet"
          subtitle={`tick ${formatTick(agent.tick)}`}
          position={win.state.sheet.pos}
          width={WIN_CONFIG.sheet.width}
          height={WIN_CONFIG.sheet.height}
          zIndex={win.state.sheet.z}
          onClose={() => win.close('sheet')}
          onFocus={() => win.focus('sheet')}
          onMove={(p) => win.move('sheet', p)}
        >
          <div className="sheet">
            <h3>
              attributes
              {agent.unspentAttributePoints > 0 && (
                <span className="right accent">{agent.unspentAttributePoints} unspent</span>
              )}
            </h3>
            <div className="attrs">
              {ATTR_LABEL.map(([key, label]) => {
                const v = agent.attributes[key];
                return (
                  <div className="a" key={key}>
                    <span className="k">{label}</span>
                    <span className="v">{v}</span>
                  </div>
                );
              })}
            </div>

            <h3>standing</h3>
            <div className="meta-grid">
              <div className="row">
                <span className="k">race</span>
                <span className="v">{agent.race.replace(/_/g, ' ')}</span>
              </div>
              <div className="row">
                <span className="k">class</span>
                <span className="v">{(agent.classId ?? 'unrevealed').toLowerCase()}</span>
              </div>
              <div className="row">
                <span className="k">authority</span>
                <span className={`v${agent.authority > 0 ? ' up' : ''}`}>{agent.authority}</span>
              </div>
              <div className="row">
                <span className="k">fame</span>
                <span className={`v${agent.fame > 0 ? ' up' : ''}`}>{agent.fame}</span>
              </div>
              <div className="row">
                <span className="k">safe node</span>
                <span className="v">{agent.safeNode != null ? `node.${agent.safeNode}` : '—'}</span>
              </div>
              <div className="row">
                <span className="k">spawn</span>
                <span className="v">{agent.location != null ? `node.${agent.location}` : 'unspawned'}</span>
              </div>
              <div className="row">
                <span className="k">tick</span>
                <span className="v">{formatTick(agent.tick)}</span>
              </div>
            </div>

            <div className="xp-row">
              <span className="k">XP</span>
              <span className="bar">
                <span
                  style={
                    {
                      '--pct': `${
                        agent.xp.toNext === 0
                          ? 0
                          : Math.round((agent.xp.current / agent.xp.toNext) * 100)
                      }%`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span className="v">
                {agent.xp.current.toLocaleString()} / {agent.xp.toNext.toLocaleString()}
              </span>
            </div>
          </div>
        </FloatingWindow>
      )}
    </div>
  );
}

const DOCS_URL = 'https://docs.genesara.com';

function maskToken(token: string | null): string {
  if (!token) return '—';
  if (token.length <= 8) return token;
  return `${token.slice(0, 4)}${'•'.repeat(Math.max(8, token.length - 8))}${token.slice(-4)}`;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c5 0 9 4 10 6a13 13 0 0 1-3 3.6" />
      <path d="M6.6 7.6C4.4 9 3 11 2 12c1 2 5 6 10 6 1.6 0 3-.3 4.3-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
      <polyline points="21 4 21 10 15 10" />
    </svg>
  );
}

function OperatorTokenMenu() {
  const plrToken = useAuth((s) => s.plrToken);
  const setApiToken = useAuth((s) => s.setApiToken);
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  const rotateMut = useMutation({
    mutationFn: () => players.rotateApiToken(),
    onSuccess: ({ apiToken }) => {
      setApiToken(apiToken);
      setReveal(true);
      setConfirmRotate(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        // Don't close if the rotate modal is mounted (it's portaled outside the wrap).
        if (document.querySelector('.modal-backdrop')) return;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmRotate) setConfirmRotate(false);
        else setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, confirmRotate]);

  async function copy() {
    if (!plrToken) return;
    try {
      await navigator.clipboard.writeText(plrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard permissions denied — ignore
    }
  }

  const display = reveal ? plrToken ?? '—' : maskToken(plrToken);

  return (
    <>
      <span className="token-menu" ref={wrapRef}>
        <button
          className="token-menu-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          API token ▾
        </button>
        {open && (
          <div className="token-menu-pop" role="dialog" aria-label="Operator API token">
            <div className="head">
              <span className="lbl">Operator API token</span>
              <button
                className="x"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="token-box">
              <button
                type="button"
                className={`val${reveal ? '' : ' muted'}${copied ? ' just-copied' : ''}`}
                onClick={copy}
                disabled={!plrToken}
                title={copied ? 'Copied' : 'Click to copy'}
              >
                <code>{display}</code>
                <span className="copy-hint">{copied ? 'copied ✓' : 'click to copy'}</span>
              </button>
              <span className="actions">
                <button
                  className="iconbtn"
                  onClick={() => setReveal((v) => !v)}
                  disabled={!plrToken}
                  title={reveal ? 'Hide token' : 'Reveal token'}
                  aria-label={reveal ? 'Hide token' : 'Reveal token'}
                >
                  <EyeIcon open={reveal} />
                </button>
                <button
                  className="iconbtn"
                  onClick={() => setConfirmRotate(true)}
                  disabled={!plrToken || rotateMut.isPending}
                  title="Rotate token"
                  aria-label="Rotate token"
                >
                  <RotateIcon />
                </button>
              </span>
            </div>
            <p className="hint">
              Pass this to your agent runtime via the MCP client. One token, all agents.
            </p>
            <div className="foot">
              <a className="docs" href={DOCS_URL} target="_blank" rel="noreferrer">
                Setup docs ↗
              </a>
            </div>
          </div>
        )}
      </span>

      {confirmRotate && createPortal(
        <div className="modal-backdrop" onClick={() => !rotateMut.isPending && setConfirmRotate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="rotate-title">
            <h2 id="rotate-title">Rotate token?</h2>
            <p style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
              The current token will stop working immediately. Any running agents using it will need to be reconfigured with the new token.
            </p>
            {rotateMut.error && (
              <div className="auth-error">
                {rotateMut.error instanceof Error ? rotateMut.error.message : 'rotate failed'}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmRotate(false)}
                disabled={rotateMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => rotateMut.mutate()}
                disabled={rotateMut.isPending}
              >
                {rotateMut.isPending ? 'Rotating…' : 'Rotate token'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function DetailHeader({ agentId, onLogout }: { agentId: string; onLogout: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="wordmark">
          Genesara
        </Link>
        <span className="crumb">
          <Link to="/app">roster</Link>
          <span className="sep">/</span>
          <b>{agentId}</b>
        </span>
        <div className="right" style={{ marginLeft: 'auto' }}>
          <button onClick={onLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}

interface SlotProps {
  slot: Slot;
  instance: EquipmentInstance | undefined;
  className?: string;
  active: boolean;
  onHover: (slot: Slot | null) => void;
}

function SlotView({ slot, instance, className, active, onHover }: SlotProps) {
  const equipped = !!instance;
  const label = slot.replace(/_/g, ' ').replace('LEFT', '◐').replace('RIGHT', '◑');
  return (
    <div
      className={`slot ${className ?? ''} ${equipped ? '' : 'empty'} ${active ? 'hover' : ''}`}
      data-slot={slot}
      onMouseEnter={() => equipped && onHover(slot)}
      onMouseLeave={() => onHover(null)}
    >
      {instance && (
        <span className={`item rarity-${instance.rarity.toLowerCase()}`}>
          <ItemIcon itemId={instance.itemId} category={instance.category} size={26} />
        </span>
      )}
      <span className="lbl">{label}</span>
    </div>
  );
}
