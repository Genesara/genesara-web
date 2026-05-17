# Agent rules — house style for genesara-web

Read this before making non-trivial changes. Companion to
[`CLAUDE.md`](./CLAUDE.md), which is the orientation doc.

## Don't break the design system

- All visual tokens (colors, fonts, spacing, hairlines) live in
  `src/styles/genesara.css`. Do **not** invent new colors, fonts, shadows,
  or border radii. If you need something new, lift it from the original
  prototype under `design/project/`. If it's not in any prototype, ask.
- Per-page CSS files in `src/styles/` are one-to-one with the inline `<style>`
  blocks from the design prototypes. When a design changes, update the CSS
  file and the corresponding component together.
- No utility-class libraries (no Tailwind, no CSS-in-JS frameworks). Plain
  classnames + CSS files. The codebase relies on global cascade — embrace it.

## Don't add a UI framework

The user explicitly rejected Quasar / Material / Chakra. The design is dense
and idiosyncratic; component libraries fight it. If you're tempted to install
one, build the primitive instead — it's almost always 20 lines of CSS.

## Match the engine contract exactly

The REST shapes in `src/api/types.ts` mirror what the engine returns. The
canonical reference is `../genesara-player-template/api-integration.md`. When
the engine changes, update `types.ts` first, then ripple through the call
sites (TypeScript will tell you where).

## Mocks must mirror reality

`src/mocks/handlers.ts` exists so dev works without the engine. Every mock
endpoint must return the same shape, status codes, and error contracts as
the real engine. If a real endpoint returns 204, the mock returns 204 — not
200 with an empty body.

When adding a new endpoint:
1. Add the type to `src/api/types.ts`.
2. Add the call to the right module under `src/api/`.
3. Add the mock to `src/mocks/handlers.ts`.

## Read the design transcripts before refactoring a page

The Claude Design chats under `design/chats/` capture *why* a page looks the
way it does — what the user accepted, what they rejected, which iterations
they vetoed. Read the relevant chat before you refactor a page's structure,
or you'll re-introduce something they explicitly rejected.

## Three.js is not yet wired

`react-three-fiber` and `drei` are installed but no real 3D scene exists yet.
The agent detail page uses SVG stand-ins marked with `TODO(r3f)`. When you
build the real character viewer or world map:

- Keep the surrounding panel chrome (`.panel`, `.panel-head`, `.model-stage`)
  intact — that's design.
- The 3D canvas should occupy the same box the SVG occupies today.
- Don't auto-rotate the model unless the user has confirmed they want it
  (designer originally specced "slow turntable").

## Tests

There is no test suite in this initial scaffold. When the surface stabilises,
add Playwright for the auth → roster → create-agent → detail happy path. Use
the MSW mocks as the fixture source — no need for a separate test backend.

## CI is correctness-only

`.github/workflows/ci.yml` runs `pnpm typecheck` and `pnpm build`. It does
not deploy — Cloudflare Pages does that, triggered by the GitHub push. Don't
add a deploy step to CI; you'll create a race.

## Commits

- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `style:`).
- No "Co-Authored-By: Claude" trailers.
- Never bypass hooks (`--no-verify`) without explicit user instruction.

## When in doubt, port verbatim

The prototypes under `design/project/` are the source of truth for what the
UI should look like. If you're unsure how to render something, copy the
HTML/CSS/JS from the prototype and adapt minimally. Don't redesign in flight.
