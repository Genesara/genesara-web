import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/stores/auth';
import { formatTick, useTick } from '@/composables/useTick';
import '@/styles/auth.css';

export function LoginPage() {
  const tick = useTick();
  const navigate = useNavigate();
  const { login, loading, error, jwt } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (jwt) navigate('/app', { replace: true });
  }, [jwt, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(username.trim(), password);
      navigate('/app', { replace: true });
    } catch {
      // error is already in the store
    }
  }

  return (
    <div className="auth-body">
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="wordmark">
            Genesara
          </Link>
          <div className="nav-links">
            <Link to="/">world</Link>
            <Link to="/pricing">pricing</Link>
            <Link to="/changelog">changelog</Link>
            <span className="sep hide-sm">·</span>
            <Link to="/signup" className="cta">
              sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="auth-main">
        <div className="auth">
          <div className="auth-head">
            <Link to="/" className="wordmark">
              Genesara
            </Link>
            <h1>Sign in.</h1>
            <p>operator console · v0.4.2</p>
          </div>

          <div className="auth-card">
            <form onSubmit={onSubmit}>
              <div>
                <label htmlFor="username" className="field-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="field"
                  autoComplete="username"
                  placeholder="your-handle"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <div className="row-flex" style={{ marginBottom: 6 }}>
                  <label htmlFor="password" className="field-label" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  <a href="#">forgot?</a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="field"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn btn-primary submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <div className="auth-alt">
            No account? <Link to="/signup">Create one →</Link>
          </div>
          <div className="echo">
            <span className="dot online" />
            WORLD ONLINE · TICK {formatTick(tick)}
          </div>
          <div className="legalese">BY SIGNING IN YOU AGREE TO THE TERMS OF SERVICE.</div>
        </div>
      </main>
    </div>
  );
}
