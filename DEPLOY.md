# Deploy guide — one-time setup

Cloudflare Pages auto-deploys on every push to `main`. This file is the
one-time wiring required to get the GitHub → Cloudflare → genesara.com chain
running. Once set up, you never need to touch any of this.

## 1. Create the GitHub repo

In the GitHub UI (or via `gh repo create Genesara/genesara-web --public --source=. --remote=origin --push`):

- **Owner:** `Genesara`
- **Name:** `genesara-web`
- **Description:** "Player portal and marketing site for the Genesara MMORPG"
- **Visibility:** Public
- **Init repo:** leave all three checkboxes off — we already have everything.

## 2. Push the local scaffold

```sh
git init -b main
git add .
git commit -m "feat: initial scaffold"
git remote add origin git@github.com:Genesara/genesara-web.git
git push -u origin main
```

## 3. Connect Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create application → Pages → Connect to Git**.
2. Pick `Genesara/genesara-web`. Authorize the Cloudflare GitHub app for the
   org if prompted.
3. **Build settings:**
   - Framework preset: **Vite**
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Root directory: *(blank)*
   - Node.js version: **22** (set via `engines` in `package.json` — Cloudflare honors it)
   - Environment variables: *(none needed for v1; see § 5)*
4. Save and deploy. First build takes ~60s.

Default Pages URL: `genesara-web.pages.dev`. Verify it works (`/`, `/pricing`,
`/login`) before pointing the apex.

## 4. Wire up the apex domain

Pages project → **Custom domains → Set up a custom domain**.

- Enter `genesara.com`.
- Cloudflare auto-creates the apex A/AAAA records (the zone is already on
  Cloudflare DNS).
- SSL/TLS provisions automatically (~2 minutes).

The sibling `docs.genesara.com` stays on its own Pages project — they are
fully decoupled.

## 5. Mock vs real API

The site talks to the engine through plain `/api/*` fetches:

- **Mock mode (default in dev):** set `VITE_USE_MOCK=true`. MSW intercepts
  every `/api/*` request in the browser. No backend required. Used for local
  development and design review.
- **Real mode (prod + dev-against-engine):** unset `VITE_USE_MOCK`. The dev
  server proxies `/api` to `VITE_ENGINE_URL` (default `http://localhost:8080`).
  In prod the browser hits the same origin (`genesara.com/api/*`) — you'll need
  to add a Cloudflare Worker or rewrite rule that proxies to the real engine
  host once it ships.

Local dev:

```sh
# all-mock (no engine needed)
VITE_USE_MOCK=true pnpm dev

# against a local engine on :8080
pnpm dev

# against staging
VITE_ENGINE_URL=https://engine-staging.genesara.com pnpm dev
```

## 6. SPA fallback

`public/_redirects` ships a `/*  /index.html  200` rule. Cloudflare Pages
serves it as a SPA — any client-side route resolves to `index.html` and React
Router handles it.

## 7. Ongoing operations

- **Edit content:** branch from `main` → PR. Cloudflare Pages auto-builds a
  preview URL on every PR. Merge → prod.
- **Schema changes from the engine:** the player portal does **not** depend
  on the engine's schema.json (that's docs' job). REST contracts live in
  [`src/api/types.ts`](src/api/types.ts) — mirror engine changes there.
- **Pin pnpm version:** Cloudflare reads `packageManager` from `package.json`
  (`pnpm@9.15.0`). Bump intentionally.

## 8. Future hardening

- Add a `_headers` file with CSP + HSTS once the API host is finalized.
- Add a Cloudflare Worker in front of `/api/*` that injects auth or rate-limits
  before the request hits the engine.
- Add Playwright smoke tests to CI (login → create-agent → roster).
- Replace the SVG paper-doll / world map placeholders on `/agent/:id` with
  real Three.js scenes using `react-three-fiber`. Dependencies are already in
  `package.json`.
