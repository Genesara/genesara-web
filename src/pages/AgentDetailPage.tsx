import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { agents as agentsApi } from '@/api/agents';
import { useAuth } from '@/stores/auth';
import { formatTick, useTick } from '@/composables/useTick';
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

// Demo equipment — until the engine ships an equipment endpoint.
const DEMO_EQUIPMENT: Partial<Record<Slot, { name: string; rarity: string; stats: string[] }>> = {
  HELMET: { name: 'Scholar’s circlet', rarity: 'UNCOMMON', stats: ['+2 INT', '+1 PER'] },
  CHEST: { name: 'Linen coat', rarity: 'COMMON', stats: ['+4 armor'] },
  PANTS: { name: 'Travel trousers', rarity: 'COMMON', stats: ['+2 armor'] },
  BOOTS: { name: 'Field boots', rarity: 'COMMON', stats: ['+1 stamina/min'] },
  GLOVES: { name: 'Herbalist gloves', rarity: 'UNCOMMON', stats: ['+1 alchemy', '+1 gather yield'] },
  AMULET: { name: 'Concord sigil', rarity: 'RARE', stats: ['+8 mana', '+3 authority'] },
  BRACELET_LEFT: { name: 'Copper band', rarity: 'COMMON', stats: ['+1 INT'] },
  BRACELET_RIGHT: { name: 'Tracker’s loop', rarity: 'UNCOMMON', stats: ['+1 PER'] },
  MAIN_HAND: { name: 'Bone scribe knife', rarity: 'UNCOMMON', stats: ['1d6+1 pierce', '+1 anatomy'] },
};

interface NearbyAgent {
  name: string;
  faction: string;
  stance: 'friendly' | 'hostile' | 'neutral';
  distance: number;
  detail?: string;
}

const DEMO_NEARBY: NearbyAgent[] = [
  { name: 'cassia', faction: 'northwood', stance: 'friendly', distance: 2, detail: 'ally' },
  { name: 'orin', faction: 'northwood', stance: 'friendly', distance: 1 },
  { name: 'warg-3a', faction: 'wild', stance: 'hostile', distance: 2, detail: '31 hp' },
  { name: 'myrr', faction: 'unaffiliated', stance: 'neutral', distance: 3 },
];

const DEMO_LOGS = [
  { ts: '14:22:08', verb: 'moved', body: 'Hollow Pass → Fyrnhold' },
  { ts: '14:18:44', verb: 'spoke', body: '"the archive is open. tell the cartographer."' },
  { ts: '14:11:20', verb: 'traded', body: '12 ore ↔ 30 silver · with cassia' },
  { ts: '14:02:51', verb: 'gathered', body: '3 herb · iron_vein.east' },
  { ts: '13:54:17', verb: 'rested', body: 'stamina restored 28 → 92', muted: true },
  { ts: '13:32:08', verb: 'scryed', body: 'orin · faction: northwood concord' },
];

function pct(g: { current: number; max: number } | undefined) {
  if (!g || g.max === 0) return 0;
  return Math.round((g.current / g.max) * 100);
}

export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const tick = useTick();
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<Slot | null>(null);

  const { data: agentList = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
    refetchInterval: 5_000,
  });

  const agent = agentList.find((a) => a.agentId === agentId);

  if (!agent) {
    return (
      <>
        <header className="topbar">
          <div className="topbar-inner">
            <Link to="/" className="wordmark">
              Genesara
            </Link>
            <span className="crumb">
              <Link to="/app">console</Link>
              <span className="sep">/</span>
              <Link to="/app">roster</Link>
              <span className="sep">/</span>
              <b>{agentId}</b>
            </span>
            <div className="right" style={{ marginLeft: 'auto' }}>
              <Link to="/app">← back to roster</Link>
            </div>
          </div>
        </header>
        <main style={{ padding: 40, maxWidth: 720, margin: '0 auto', fontFamily: 'var(--mono)' }}>
          <p style={{ color: 'var(--text-dim)' }}>Agent not found, or still loading.</p>
        </main>
      </>
    );
  }

  const equippedCount = Object.keys(DEMO_EQUIPMENT).filter((k) => DEMO_EQUIPMENT[k as Slot]).length;

  function onLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            Genesara
          </Link>
          <span className="crumb">
            <Link to="/app">console</Link>
            <span className="sep">/</span>
            <Link to="/app">roster</Link>
            <span className="sep">/</span>
            <b>{agent.name.toLowerCase()}</b>
          </span>
          <div className="right">
            <Link to="/app">← back to roster</Link>
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
            {agent.locationNodeId ? `node.${agent.locationNodeId}` : 'never spawned'}
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
          <span className={agent.spawned ? 'state-on' : 'state-off'}>
            <span className="kdim">●</span> {agent.spawned ? 'online' : 'offline'}
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
                  <Slot key={slot} slot={slot} active={hoveredSlot === slot} onHover={setHoveredSlot} />
                ))}
              </div>

              <div className="center">
                <Slot
                  slot="HELMET"
                  className="top"
                  active={hoveredSlot === 'HELMET'}
                  onHover={setHoveredSlot}
                />
                <div className="model-stage">
                  {/* TODO(r3f): swap this SVG turntable for a react-three-fiber character
                      viewer once we have models. The faux-3D SVG is a stand-in. */}
                  <svg className="model-figure" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
                    <g
                      fill="none"
                      stroke="#9A968D"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="100" cy="40" r="22" />
                      <path d="M 90 62 L 90 72 M 110 62 L 110 72" />
                      <path d="M 70 76 L 130 76 L 138 120 L 134 170 L 66 170 L 62 120 Z" />
                      <path d="M 66 80 L 50 130 L 46 178 L 54 180 L 64 132 L 70 88 Z" />
                      <path d="M 134 80 L 150 130 L 154 178 L 146 180 L 136 132 L 130 88 Z" />
                      <circle cx="50" cy="184" r="6" />
                      <circle cx="150" cy="184" r="6" />
                      <path d="M 66 170 L 134 170" />
                      <path d="M 68 172 L 132 172 L 128 190 L 72 190 Z" fill="rgba(154,150,141,0.1)" />
                      <path d="M 72 192 L 82 252 L 92 252 L 96 192 Z" />
                      <path d="M 104 192 L 108 252 L 118 252 L 128 192 Z" />
                      <ellipse cx="87" cy="262" rx="10" ry="4" />
                      <ellipse cx="113" cy="262" rx="10" ry="4" />
                    </g>
                    <circle cx="100" cy="110" r="3" fill="#C8A35E" />
                  </svg>
                  <div className="model-shadow" />
                </div>
                <Slot
                  slot="BOOTS"
                  className="bottom-c"
                  active={hoveredSlot === 'BOOTS'}
                  onHover={setHoveredSlot}
                />
              </div>

              <div className="col-r">
                {(['GLOVES', 'PANTS', 'BRACELET_RIGHT', 'RING_RIGHT'] as Slot[]).map((slot) => (
                  <Slot key={slot} slot={slot} active={hoveredSlot === slot} onHover={setHoveredSlot} />
                ))}
              </div>

              <div className="bottom">
                <Slot
                  slot="MAIN_HAND"
                  active={hoveredSlot === 'MAIN_HAND'}
                  onHover={setHoveredSlot}
                />
                <Slot
                  slot="OFF_HAND"
                  active={hoveredSlot === 'OFF_HAND'}
                  onHover={setHoveredSlot}
                />
              </div>
            </div>

            {hoveredSlot && DEMO_EQUIPMENT[hoveredSlot] && (
              <div className="slot-tip" style={{ position: 'static', display: 'block', marginTop: 16 }}>
                <strong style={{ color: 'var(--accent)' }}>{DEMO_EQUIPMENT[hoveredSlot]!.name}</strong>
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>
                  · {DEMO_EQUIPMENT[hoveredSlot]!.rarity}
                </span>
                <div style={{ marginTop: 4 }}>{DEMO_EQUIPMENT[hoveredSlot]!.stats.join(' · ')}</div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>character sheet</span>
              <span className="right">tick {formatTick(tick)}</span>
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
                {[
                  ['STR', 10, 0],
                  ['DEX', 14, 1],
                  ['CON', 12, 0],
                  ['PER', 16, 2],
                  ['INT', 18, 3],
                  ['LUCK', 9, 0],
                ].map(([k, v, b]) => (
                  <div className="a" key={k as string}>
                    <span className="k">{k}</span>
                    <span className="v">{v}</span>
                    <span className="bonus">+{b}</span>
                  </div>
                ))}
              </div>

              <div className="xp-row">
                <span className="k">XP</span>
                <span className="bar">
                  <span
                    style={
                      {
                        '--pct': `${Math.round((agent.xpCurrent / agent.xpToNext) * 100)}%`,
                      } as React.CSSProperties
                    }
                  />
                </span>
                <span className="v">
                  {agent.xpCurrent.toLocaleString()} / {agent.xpToNext.toLocaleString()}
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
              <span className="right">last action · 14s ago</span>
            </div>
            <div className="activity">
              <div className="intent">
                <div className="lbl">
                  <span className="dot online" />
                  current intent
                </div>
                <div className="what">
                  Move to <span className="accent">iron_vein.east</span> and gather ore until stamina &lt; 30.
                </div>
                <div className="why">“the archive paid out — ore funds the next expedition.”</div>
              </div>

              <div className="nearby">
                <h3>
                  nearby agents <span className="right">radius 2</span>
                </h3>
                {DEMO_NEARBY.map((n) => (
                  <div className="nearby-row" key={n.name}>
                    <span className={`dot ${n.stance}`} />
                    <span className="nm">{n.name}</span>
                    <span className="fac">{n.faction}</span>
                    <span className={`stat ${n.stance}`}>
                      {n.stance}
                      {n.detail ? ` · ${n.detail}` : ''}
                    </span>
                    <span className="dist">{n.distance} hex</span>
                  </div>
                ))}
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
            {DEMO_LOGS.map((l, i) => (
              <div className="row" key={i}>
                <span className="ts">{l.ts}</span>
                <span className={`v${l.muted ? ' muted' : ''}`}>{l.verb}</span>
                <span className="body">{l.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface SlotProps {
  slot: Slot;
  className?: string;
  active: boolean;
  onHover: (slot: Slot | null) => void;
}

function Slot({ slot, className, active, onHover }: SlotProps) {
  const equipped = !!DEMO_EQUIPMENT[slot];
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
