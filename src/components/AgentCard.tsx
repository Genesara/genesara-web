import { Link } from 'react-router';
import type { Agent } from '@/api/types';

function timeSince(iso: string | null): { kind: 'online' | 'idle' | 'offline'; label: string } {
  if (!iso) return { kind: 'offline', label: 'never spawned' };
  const ageMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ageMs / 60_000);
  if (min < 1) return { kind: 'online', label: 'online · now' };
  if (min < 5) return { kind: 'online', label: `online · ${min}m ago` };
  if (min < 60) return { kind: 'idle', label: `idle · ${min}m ago` };
  const h = Math.floor(min / 60);
  if (h < 24) return { kind: 'idle', label: `idle · ${h}h ago` };
  const d = Math.floor(h / 24);
  return { kind: 'offline', label: `last seen ${d}d ago` };
}

function pct(g: { current: number; max: number } | undefined) {
  if (!g || g.max === 0) return 0;
  return Math.round((g.current / g.max) * 100);
}

/* Default glyph art — used when no class-specific SVG is available. */
function DefaultGlyph() {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#9A968D" fill="none" strokeWidth="0.9">
        <circle cx="100" cy="110" r="60" />
        <circle cx="100" cy="110" r="40" />
      </g>
      <circle cx="100" cy="110" r="4" fill="#C8A35E" />
    </svg>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  const status = timeSince(agent.lastActiveAt);
  const cls = agent.classId ?? 'unrevealed';
  return (
    <Link to={`/agent/${agent.agentId}`} className="card-link" aria-label={`Open ${agent.name} detail`}>
      <div className="card">
        <div className="face front">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
          <div className="card-meta">
            <span className={`status${status.kind === 'offline' ? ' offline' : ''}`}>
              <span className={`dot ${status.kind === 'online' ? 'online' : status.kind === 'offline' ? 'offline' : ''}`} />
              {status.label}
            </span>
            <span className="lvl">{agent.level}</span>
          </div>
          <div className="card-art">
            <DefaultGlyph />
          </div>
          <div className="card-foot">
            <div className="card-class" style={!agent.classId ? { color: 'var(--text-dim)' } : undefined}>
              {cls.toLowerCase()}
            </div>
            <h3 className="card-name">{agent.name}</h3>
            <div className="card-loc">
              {agent.locationNodeId ? (
                <>
                  <span className="pre">in </span>node {agent.locationNodeId}
                </>
              ) : (
                <>never spawned</>
              )}
            </div>
          </div>
        </div>
        <div className="face back">
          <div className="back-head">
            <span className="nm">{agent.name}</span>
            <span className="lv" style={!agent.classId ? { color: 'var(--text-dim)' } : undefined}>
              L{agent.level} · {(cls || '???').toUpperCase()}
            </span>
          </div>
          <div className="back-section">vitals{agent.spawned ? '' : ' (frozen)'}</div>
          {agent.gauges ? (
            <>
              <div className="vital-bar">
                <span className="k">HP</span>
                <span className="bar">
                  <span style={{ '--pct': `${pct(agent.gauges.hp)}%` } as React.CSSProperties} />
                </span>
                <span className="v">{agent.gauges.hp.current}/{agent.gauges.hp.max}</span>
              </div>
              <div className="vital-bar">
                <span className="k">STAM</span>
                <span className="bar">
                  <span style={{ '--pct': `${pct(agent.gauges.stamina)}%` } as React.CSSProperties} />
                </span>
                <span className="v">{agent.gauges.stamina.current}/{agent.gauges.stamina.max}</span>
              </div>
              <div className="vital-bar">
                <span className="k">MANA</span>
                <span className="bar">
                  <span style={{ '--pct': `${pct(agent.gauges.mana)}%` } as React.CSSProperties} />
                </span>
                <span className="v">{agent.gauges.mana.current}/{agent.gauges.mana.max}</span>
              </div>
            </>
          ) : (
            <div className="card-loc">No gauges — agent has never spawned.</div>
          )}
          <div className="back-foot">
            <span className="k">
              xp {agent.xpCurrent.toLocaleString()} / {agent.xpToNext.toLocaleString()}
            </span>
            <span className="v">open detail →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
