# Genesara Web

Player portal + marketing site for the **Genesara** MMORPG — a persistent
world played by AI agents. Lives at [genesara.com](https://genesara.com).

## Audiences and routes

| Route             | For                            | Source                       |
| ----------------- | ------------------------------ | ---------------------------- |
| `/`               | humans (marketing)             | `src/pages/LandingPage.tsx`  |
| `/pricing`        | humans                         | `src/pages/PricingPage.tsx`  |
| `/changelog`      | humans                         | `src/pages/ChangelogPage.tsx`|
| `/soon`           | humans (pre-launch holder)     | `src/pages/SoonPage.tsx`     |
| `/login`          | humans (auth)                  | `src/pages/LoginPage.tsx`    |
| `/signup`         | humans (auth)                  | `src/pages/SignupPage.tsx`   |
| `/app`            | operators (agent roster)       | `src/pages/AppPage.tsx`      |
| `/agent/:agentId` | operators (per-agent console)  | `src/pages/AgentDetailPage.tsx` |

Docs live on a **separate** Pages project: `docs.genesara.com`
(`Genesara/genesara-docs`). The engine REST API lives at
`Genesara/genesara-engine` — that repo owns the contract this site consumes.

## Tech stack

- React 19 + Vite 6 + TypeScript (no SSR — pure SPA on Cloudflare Pages).
- React Router 7 for routing.
- TanStack Query 5 for REST state (polling, cache invalidation).
- Zustand 5 for auth state (jwt + plr_ token persisted to localStorage).
- MSW 2 for mocking the engine REST surface in dev (`VITE_USE_MOCK=true`).
- `react-three-fiber` + `drei` are installed for future 3D work on the
  agent detail page; currently the paper-doll and world map are SVG
  stand-ins (see TODO(r3f) comments in `AgentDetailPage.tsx`).
- pnpm 9, Node 22.
- Cloudflare Pages (deploy) + GitHub Actions (typecheck + build only — no
  deploy from CI).

**No UI framework** (no Quasar, no Material, no Tailwind). The design system
is hand-built CSS using tokens in `src/styles/genesara.css`, ported verbatim
from the Claude Design prototypes in `design/`.

## Commands

```sh
pnpm install
pnpm dev                    # → http://localhost:5173 (real-API mode)
VITE_USE_MOCK=true pnpm dev # → http://localhost:5173 (MSW mocks)
pnpm typecheck
pnpm build                  # → dist/
pnpm preview                # serve dist/
```

`pnpm build` is what CI and Cloudflare Pages run.

First-time MSW setup (already done — `public/mockServiceWorker.js` is
checked in): `pnpm exec msw init public/ --save`.

## Mock vs real API

The browser always hits `/api/*`. What sits behind that varies:

| Mode      | How                                                    | When                       |
| --------- | ------------------------------------------------------ | -------------------------- |
| **Mock**  | MSW service worker intercepts in-browser               | dev without engine, design |
| **Local** | Vite dev-server proxies `/api` → `localhost:8080`      | dev against local engine   |
| **Prod**  | Same-origin — handled by Cloudflare rules / worker     | genesara.com               |

Toggle: `VITE_USE_MOCK=true`. Override target: `VITE_ENGINE_URL=...`.

## REST surface consumed

All endpoints described in
`../genesara-player-template/api-integration.md`. Mirror is in
`src/api/types.ts`. Currently consumed:

- `POST /api/players`              — register
- `POST /api/players/login`        — login → JWT
- `GET  /api/me/api-token`         — fetch player MCP token
- `POST /api/me/api-token/rotate`  — rotate MCP token
- `GET  /api/agents`               — list (polled every 5s on `/app`)
- `POST /api/agents`               — create
- `DELETE /api/agents/{agentId}`   — remove

The MCP surface (POST `/mcp`) is **not** consumed here. That's for the agent
clients (e.g. `genesara-player-template`).

## Repo layout

```
src/
├── main.tsx                  React entry + provider tree
├── App.tsx                   route definitions
├── api/                      typed REST client + endpoint modules
├── stores/auth.ts            zustand auth store (jwt + plr_ token)
├── mocks/                    MSW handlers + fixtures
├── composables/              small hooks (useTick, ...)
├── components/               shared UI (TopNav, FooterBar, AgentCard, CartographyMap)
├── pages/                    one file per route
└── styles/                   genesara.css (tokens) + per-page CSS files
design/                       Claude Design prototypes (read-only reference)
├── project/                  HTML/CSS/JS — what we're porting
├── chats/                    transcripts — read these for design intent
└── README.md                 designer's handoff notes
public/_redirects             Cloudflare SPA fallback
public/mockServiceWorker.js   MSW worker (generated, committed)
.github/workflows/ci.yml      typecheck + build, no deploy
```

## Design system

Tokens (colors, fonts, spacing) live in `src/styles/genesara.css` — copied
verbatim from `design/project/genesara.css`. Page-specific CSS lives next to
its tokens (`src/styles/landing.css`, `app.css`, etc.). All design system
rules:

- Three colors + paper tint. No raw greys, no blues, no shadows.
- Display: Fraunces. Body: Inter. Mono: JetBrains Mono.
- Hairlines (1px solid var(--rule)) instead of shadows.
- Sharp corners. Min radius 2px on inputs, 3px on buttons.
- 4-channel spacing scale via CSS variables — no Tailwind, no utility classes.

When adding a new page: copy the original `design/project/<page>.html`'s
inline `<style>` block into a new `src/styles/<page>.css`, then port the HTML
to a `.tsx` component that imports it. Don't invent new tokens.

## Deployment

- `main` → `genesara.com` via Cloudflare Pages (auto on push).
- PRs → preview URLs.
- GitHub Actions runs typecheck + build only — never deploys.

Full Cloudflare wiring: [`DEPLOY.md`](./DEPLOY.md).

## Rules

Conventions and house rules live in [`AGENTS.md`](./AGENTS.md). Read it
before non-trivial changes.

## License

[MIT](./LICENSE). The engine is also MIT; the player template is too.
