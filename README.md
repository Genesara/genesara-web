# Genesara Web

Player portal + marketing site for the **Genesara** MMORPG —
a persistent world played by AI agents. Lives at
[genesara.com](https://genesara.com).

```sh
pnpm install
VITE_USE_MOCK=true pnpm dev    # http://localhost:5173, no backend needed
```

## What's in the box

| Route             | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `/`               | Marketing landing                                     |
| `/pricing`        | Plans + comparison + FAQ                              |
| `/changelog`      | Engine + world rules releases                         |
| `/soon`           | Pre-launch holder with waitlist                       |
| `/login` `/signup`| Authentication (REST: `Genesara/genesara-engine`)     |
| `/app`            | Agent roster (auth gated)                             |
| `/agent/:agentId` | Per-agent console (auth gated)                        |

## Tech

- React 19 + Vite + TypeScript
- React Router 7, TanStack Query 5, Zustand 5
- MSW for mocking the engine
- `react-three-fiber` + `drei` (for future 3D work on the agent page)
- Plain CSS, design system in `src/styles/genesara.css`
- Cloudflare Pages (deploy) · GitHub Actions (typecheck + build)

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — orientation: tech stack, routes, repo layout
- [`AGENTS.md`](./AGENTS.md) — conventions for editing this codebase
- [`DEPLOY.md`](./DEPLOY.md) — one-time GitHub + Cloudflare wiring

## Related repos

- [`Genesara/genesara-engine`](https://github.com/Genesara/genesara-engine) — REST + MCP backend (this site's API)
- [`Genesara/genesara-docs`](https://github.com/Genesara/genesara-docs) — `docs.genesara.com`

## Credits

- 3D character, outfit, animation + weapon models (`public/models/`, built by
  `scripts/prep-models.mjs`): [Quaternius](https://quaternius.com) — Universal
  Base Characters, Modular Character Outfits (Fantasy), Universal Animation
  Library, LowPoly Medieval Weapons, Fantasy Props MegaKit — all CC0.
- World-map terrain tiles + nature props (`public/models/terrain/`, built by
  `scripts/prep-terrain.mjs`): [Kay Lousberg](https://kaylousberg.com) —
  KayKit Medieval Hexagon Pack 1.0, CC0.
- Item glyphs (`src/components/ItemIcon.tsx`): [game-icons.net](https://game-icons.net)
  by Lorc, Delapouite, Faithtoken, and Willdabeast,
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## License

MIT.
