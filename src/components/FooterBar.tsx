import { Link } from 'react-router';

export function FooterBar() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <span className="wordmark" style={{ fontSize: 15 }}>
          Genesara
        </span>
        <a href="/#world">world</a>
        <Link to="/pricing">pricing</Link>
        <Link to="/changelog">changelog</Link>
        <a href="https://docs.genesara.com" target="_blank" rel="noreferrer">
          docs
        </a>
        <span className="sep">·</span>
        <a href="https://github.com/Genesara/genesara-engine" target="_blank" rel="noreferrer">
          source
        </a>
        <a href="#">status</a>
        <span className="right">MIT · 2026</span>
      </div>
    </footer>
  );
}
