import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { agents as agentsApi } from '@/api/agents';
import { players } from '@/api/players';
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

export function AgentDetailPage() {
  const { agentId } = useParams();
  const id = agentId ?? '';
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const { data: stats } = useStats();
  const tick = stats?.tick ?? 0;
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<Slot | null>(null);

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

  // Skip SSE/backfill when the agent is known not to exist.
  const { events } = useAgentEvents(detailNotFound ? undefined : id);

  const agent = detailQuery.data;
  const loadout = loadoutQuery.data;
  const relationships = relationshipsQuery.data;

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

  const nearby = useMemo(() => {
    const entries = relationships?.entries ?? [];
    return [...entries]
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
      .slice(0, 4);
  }, [relationships]);

  const recentEvents = useMemo(() => events.slice(-12).reverse(), [events]);

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

  return (
    <>
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
        </div>
      </div>

      <main className="stage">
        <section className="col-left">
          <div className="panel">
            <div className="panel-head">
              <span>equipment</span>
              <span className="right">12 slots · {equippedCount} equipped</span>
            </div>
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

            {hoveredSlot && hoveredInstance && (
              <div className="slot-tip" style={{ position: 'static', display: 'block', marginTop: 16 }}>
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
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>character sheet</span>
            </div>
            <div className="sheet">
              <h3>vitals</h3>
              {agent.gauges ? (
                <>
                  <div className="vital">
                    <span className="k">HP</span>
                    <span className="bar hp">
                      <span style={{ '--pct': `${pct(agent.gauges.hp)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.hp.current} / {agent.gauges.hp.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">STAMINA</span>
                    <span className="bar">
                      <span style={{ '--pct': `${pct(agent.gauges.stamina)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.stamina.current} / {agent.gauges.stamina.max}
                    </span>
                  </div>
                  <div className="vital">
                    <span className="k">MANA</span>
                    <span className="bar mana">
                      <span style={{ '--pct': `${pct(agent.gauges.mana)}%` } as React.CSSProperties} />
                    </span>
                    <span className="v">
                      {agent.gauges.mana.current} / {agent.gauges.mana.max}
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

              <h3>attributes</h3>
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
          </div>
        </section>

        <section className="col-right">
          <div className="panel world">
            <div className="panel-head">
              <span>world view · top-down · iron_coast</span>
              <span className="right accent">live · tick {formatTick(tick)}</span>
            </div>
            <div className="world-canvas">
              {/* TODO(r3f): replace this static SVG terrain stand-in with a real
                  three-fiber hex grid that streams nodes from the engine. */}
              <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="500" fill="#0E0F12" />
                <g stroke="#2B2A26" strokeWidth="1" fill="#1A1814">
                  {Array.from({ length: 80 }, (_, i) => {
                    const cols = 10;
                    const c = i % cols;
                    const r = Math.floor(i / cols);
                    const W = 70;
                    const H = (W * 2) / Math.sqrt(3);
                    const cx = 50 + c * W + (r % 2 === 0 ? W / 2 : 0);
                    const cy = 50 + r * H * 0.75;
                    const pts = [
                      [0, -H / 2],
                      [W / 2, -H / 4],
                      [W / 2, H / 4],
                      [0, H / 2],
                      [-W / 2, H / 4],
                      [-W / 2, -H / 4],
                    ]
                      .map(([x, y]) => `${cx + x},${cy + y}`)
                      .join(' ');
                    return <polygon points={pts} key={i} />;
                  })}
                </g>
                <circle cx="400" cy="250" r="6" fill="#C8A35E">
                  <animate attributeName="r" values="6;9;6" dur="2.6s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>activity</span>
              <span className="right">authority {agent.authority} · fame {agent.fame}</span>
            </div>
            <div className="activity">
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

              <div className="nearby">
                <h3>
                  relationships{' '}
                  <span className="right">top {nearby.length} by impact</span>
                </h3>
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
          </div>
        </section>
      </main>

      {/* Floating log window */}
      <div className={`logwin ${logCollapsed ? 'collapsed' : ''}`}>
        <div className="logwin-head">
          <span className="title">
            <span className="dot online" />
            events.tail
          </span>
          <span className="sub">{agent.name.toLowerCase()} · --follow</span>
          <span className="actions">
            <button
              className="icon-btn"
              onClick={() => setLogCollapsed((v) => !v)}
              title={logCollapsed ? 'expand' : 'collapse'}
            >
              {logCollapsed ? '+' : '—'}
            </button>
          </span>
        </div>
        {!logCollapsed && (
          <div className="logwin-body">
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
        )}
      </div>
    </>
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
      <span className="lbl">{label}</span>
    </div>
  );
}
