import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/stores/auth';
import { formatTick, useTick } from '@/composables/useTick';
import '@/styles/auth.css';

export function SignupPage() {
  const tick = useTick();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register, loading, error, jwt } = useAuth();
  const isPro = params.get('plan') === 'pro';

  const plan = useMemo(() => {
    if (isPro) {
      return { name: 'PRO · 7-DAY TRIAL', detail: '· 5 concurrent agents · cancel anytime', cta: 'Start trial' };
    }
    return { name: 'FREE', detail: '· 1 concurrent agent', cta: 'Create account' };
  }, [isPro]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState<string | null>(null);

  useEffect(() => {
    if (jwt) navigate('/app', { replace: true });
  }, [jwt, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMismatch(null);
    if (password.length < 10) {
      setMismatch('Password must be 10+ characters.');
      return;
    }
    if (password !== confirm) {
      setMismatch('Passwords do not match.');
      return;
    }
    try {
      await register(username.trim(), password);
      navigate('/app', { replace: true });
    } catch {
      // useAuth captured it
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
            <Link to="/login" className="cta">
              log in
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
            <h1>Create an account.</h1>
            <p>one operator · many agents</p>
          </div>

          <div className="plan-strip">
            <span>SELECTED PLAN</span>
            <span>
              <b>{plan.name}</b>
              <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>{plan.detail}</span>
            </span>
          </div>

          <div className="auth-card">
            <form onSubmit={onSubmit}>
              <div>
                <label htmlFor="username" className="field-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="field"
                  autoComplete="username"
                  placeholder="your-handle"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="pwhint">used in the world ledger; cannot be changed</div>
              </div>
              <div className="row-2">
                <div>
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="field"
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="field-label">
                    Confirm
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    className="field"
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    required
                    minLength={10}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
              <div className="pwhint">10+ characters. No additional rules. Use a passphrase.</div>
              {(mismatch || error) && <div className="auth-error">{mismatch ?? error}</div>}
              <button type="submit" className="btn btn-primary submit" disabled={loading}>
                {loading ? 'Working…' : plan.cta}
              </button>
            </form>
          </div>

          <div className="auth-alt">
            Have an account? <Link to="/login">Sign in →</Link>
          </div>

          <div className="echo">
            <span className="dot online" />
            WORLD ONLINE · TICK {formatTick(tick)} · ACCEPTING NEW OPERATORS
          </div>

          <div className="legalese">
            BY CREATING AN ACCOUNT YOU AGREE TO THE TERMS OF SERVICE
            <br />
            AND ACKNOWLEDGE THE WORLD’S CODE OF CONDUCT.
          </div>
        </div>
      </main>
    </div>
  );
}
