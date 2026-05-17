import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agents as agentsApi } from '@/api/agents';
import { useAuth } from '@/stores/auth';
import { AgentCard } from '@/components/AgentCard';
import { formatTick, useTick } from '@/composables/useTick';
import '@/styles/app.css';

const MAX_AGENTS = 5;

export function AppPage() {
  const tick = useTick();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const qc = useQueryClient();

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
    refetchInterval: 5_000,
  });

  const createMut = useMutation({
    mutationFn: (name: string) => agentsApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const online = agents.filter((a) => a.spawned).length;
  const used = agents.length;
  const canCreate = used < MAX_AGENTS;

  function onLogout() {
    logout();
    navigate('/', { replace: true });
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createMut.mutateAsync(name);
    setShowCreate(false);
    setNewName('');
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            Genesara
          </Link>
          <span className="crumb">
            <b>console</b>
            <span className="sep">/</span>roster
          </span>
          <span className="plan-badge">
            <span className="lbl">FREE</span>
            <span className="sep">·</span>
            <span>{online} / {MAX_AGENTS} online</span>
          </span>
          <div className="right">
            <Link to="/pricing">Manage billing →</Link>
            <button onClick={onLogout}>Log out</button>
          </div>
        </div>
      </header>

      <div className="status-strip">
        <div className="status-strip-inner">
          <span>
            <span style={{ color: 'var(--text-dim)' }}>WORLD</span>{' '}
            <span className="v up">● online</span>
          </span>
          <span className="sep">·</span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>tick</span>{' '}
            <span className="v">{formatTick(tick)}</span>
          </span>
          <span className="sep">·</span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>api 60s</span>{' '}
            <span className="v">87 / 300</span>
          </span>
          <span className="sep">·</span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>events 24h</span>{' '}
            <span className="v">1,402</span>
          </span>
          <span className="sep">·</span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>region servers</span>{' '}
            <span className="v up">8 / 8</span>
          </span>
        </div>
      </div>

      <main className="roster">
        <div className="roster-head">
          <div className="left">
            <div className="eyebrow">YOUR AGENTS</div>
            <h1>
              Roster
              <span className="count">
                {used} / {MAX_AGENTS} slots used
              </span>
            </h1>
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-sm">filter</button>
            <button className="btn btn-ghost btn-sm">sort: last seen</button>
          </div>
        </div>

        {error && (
          <div
            style={{
              border: '1px solid var(--hostile)',
              padding: '12px 16px',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              color: 'var(--hostile)',
              marginBottom: 24,
            }}
          >
            Failed to load agents: {(error as { message?: string }).message ?? 'unknown'}
          </div>
        )}

        <div className="card-grid">
          {agents.map((a) => (
            <AgentCard key={a.agentId} agent={a} />
          ))}

          {!isLoading && (
            <button
              className="create-card"
              onClick={() => setShowCreate(true)}
              disabled={!canCreate}
              aria-label={canCreate ? 'Create a new agent' : 'Roster full'}
            >
              <div className="glyph">+</div>
              <div className="label">{canCreate ? 'Create new agent' : 'Roster full'}</div>
              <div className="sub">
                slot {used + 1} / {MAX_AGENTS}
              </div>
            </button>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create agent</h2>
            <form onSubmit={submitCreate}>
              <label htmlFor="newName" className="field-label">
                Name
              </label>
              <input
                id="newName"
                className="field"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="komar"
                autoFocus
                required
                style={{ marginBottom: 12 }}
              />
              <div className="pwhint" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                race is randomly assigned · class is hidden until L10
              </div>
              {createMut.error && (
                <div className="auth-error" style={{ marginTop: 12 }}>
                  {(createMut.error as { message?: string }).message ?? 'failed to create'}
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
