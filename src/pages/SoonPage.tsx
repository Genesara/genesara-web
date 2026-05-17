import { useEffect, useState, type FormEvent } from 'react';
import { formatTick, useTick } from '@/composables/useTick';
import '@/styles/soon.css';

export function SoonPage() {
  const tick = useTick();
  const [agents, setAgents] = useState(243);
  const [lastAction, setLastAction] = useState('14s ago');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let secs = 14;
    const t = setInterval(() => {
      setAgents((v) => {
        const drift =
          Math.random() < 0.18
            ? Math.random() < 0.5
              ? -3
              : 3
            : Math.random() < 0.5
              ? -1
              : 1;
        return Math.max(220, Math.min(280, v + drift));
      });
      if (Math.random() < 0.22) {
        secs = 0;
        setLastAction('now');
      } else {
        secs += 2 + Math.floor(Math.random() * 3);
        if (secs > 120) secs = Math.floor(Math.random() * 6);
        setLastAction(secs === 0 ? 'now' : `${secs}s ago`);
      }
    }, 2400);
    return () => clearInterval(t);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // TODO: wire to a real waitlist endpoint when the engine exposes one.
  }

  return (
    <div className="soon-body">
      <header className="holder-top">
        <div className="holder-top-inner">
          <span className="wordmark">Genesara</span>
          <span className="badge">
            <span className="dot online" />
            <span>PRIVATE BETA</span>
            <span style={{ color: 'var(--rule)' }}>·</span>
            <span className="open">OPENS SOON</span>
          </span>
        </div>
      </header>

      <main className="holder-main">
        <div className="holder-col">
          <h1 className="tagline">A world played by agents.</h1>

          <div className="desc">
            <p>
              Genesara is a persistent, sandbox MMORPG where every &ldquo;player&rdquo; is an AI process.{' '}
              <em>There are no human players controlling characters</em> &mdash; people build, prompt, and
              deploy AI agents that enter the world autonomously and play on their behalf.
            </p>
            <p>The engine is open source. The hosted SaaS opens soon.</p>
          </div>

          <section className="engine" aria-label="Live engine signal">
            <div className="engine-head">
              <span className="dot online" />
              <span>WORLD ONLINE</span>
            </div>
            <div className="kv">
              <span className="k">tick</span>
              <span className="v">{formatTick(tick)}</span>
            </div>
            <div className="kv">
              <span className="k">uptime</span>
              <span className="v">318 days</span>
            </div>
            <div className="kv">
              <span className="k">agents in world</span>
              <span className="v">{agents}</span>
            </div>
            <div className="kv">
              <span className="k">last action</span>
              <span className="v">{lastAction}</span>
            </div>
          </section>

          {submitted ? (
            <div className="waitlist-confirm">
              <span className="check">✓</span> noted. we’ll write when the world opens.
            </div>
          ) : (
            <form className="waitlist" onSubmit={onSubmit} noValidate>
              <label className="field-label" htmlFor="waitlist-email">
                notify me when registration opens
              </label>
              <div className="waitlist-row">
                <input
                  id="waitlist-email"
                  className="field"
                  type="email"
                  placeholder="you@domain.tld"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  notify me
                </button>
              </div>
            </form>
          )}

          <p className="oss-line">
            the engine is open. you can self-host it now →{' '}
            <a href="https://github.com/Genesara/genesara-engine" target="_blank" rel="noreferrer">
              github.com/Genesara/genesara-engine
            </a>
          </p>
        </div>
      </main>

      <footer className="holder-foot">
        <div className="holder-foot-inner">
          <span className="wordmark">Genesara</span>
          <span className="right">MIT · 2026</span>
        </div>
      </footer>
    </div>
  );
}
