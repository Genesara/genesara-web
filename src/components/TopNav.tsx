import { Link } from 'react-router';

interface Props {
  active?: 'world' | 'pricing' | 'changelog' | 'docs';
  showAuthLinks?: boolean;
}

const DOCS_URL = 'https://docs.genesara.com';

export function TopNav({ active, showAuthLinks = true }: Props) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="wordmark">
          Genesara
        </Link>
        <div className="nav-links">
          <Link to="/" className={active === 'world' ? 'cta' : undefined}>
            world
          </Link>
          <Link to="/pricing" className={active === 'pricing' ? 'cta' : undefined}>
            pricing
          </Link>
          <Link to="/changelog" className={active === 'changelog' ? 'cta' : undefined}>
            changelog
          </Link>
          <a href={DOCS_URL} className="hide-sm" target="_blank" rel="noreferrer">
            docs
          </a>
          {showAuthLinks && (
            <>
              <span className="sep hide-sm">·</span>
              <Link to="/login">log in</Link>
              <Link to="/signup" className="cta">
                sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
