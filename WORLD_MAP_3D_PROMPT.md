# Prompt: build the Genesara-style 3D hex world map in this app

> Copy this file into a Claude Code session in the target repo (admin UI /
> world builder) and say: "Implement the world map following
> WORLD_MAP_3D_PROMPT.md". Everything below is the spec; the reference
> implementation is readable on disk.

## Goal

Render a grid/tile hex world map as a 3D scene in the same visual style as
the Genesara player portal: low-poly KayKit terrain tiles with per-terrain
tints, scattered nature props, buildings (including walls/gates and
under-construction states), character minis, atmospheric lighting with soft
shadows, and fog-of-war cloud banks at the edge of the known map. Adapt the
data layer to this app's needs (an admin/builder likely renders the FULL
world rather than one agent's recalled memory, and needs click-to-select /
click-to-edit rather than hover-only).

## Reference implementation (read these first)

All paths on this machine:

- `~/Workspace/Personal/genesara/genesara-web/src/components/WorldMap3D/` —
  the complete map: `index.tsx` (layout, lighting, tooltip),
  `terrain.ts` (palette + axial math), `TerrainMeshes.tsx` (instanced tiles
  + props), `decorations.ts` (terrain→prop scatter), `PresenceLayer.tsx`
  (buildings, walls, minis, NPC totems), `FogClouds.tsx` (fog of war),
  `presence.ts` (overlay view-model).
- `~/Workspace/Personal/genesara/genesara-web/scripts/prep-terrain.mjs` —
  the asset pipeline. Reuse it nearly verbatim.
- KayKit source packs (CC0, by Kay Lousberg) already on disk:
  `~/Workspace/Personal/genesara/genesara-player-template/viewer/public/assets/kaykit-hexagon/`
  (tiles, buildings in 5 colors, nature decoration, fence/wall pieces,
  construction stages, clouds) and `kaykit-forest-nature/` (extra trees).
- Engine terrain enum (33 values):
  `~/Workspace/Personal/agentic-rpg/world/core/src/main/kotlin/dev/gvart/genesara/world/Terrain.kt`

## Stack

React + @react-three/fiber + @react-three/drei + three (no UI framework).
Asset pipeline: `@gltf-transform/core|extensions|functions` + `sharp` as dev
deps, plain Node script. If the target app isn't React, the asset pipeline
and all algorithms still apply; only the component layer changes.

## Asset pipeline (one script → one committed GLB)

Build `public/models/terrain/terrain.glb` (~1.6 MB) containing every mesh,
one node each, consumed at runtime via drei `useGLTF`. Rules that matter:

1. **Orientation**: KayKit hex tiles are pointy-top; the map uses flat-top
   axial (`x = 1.5q`, `z = √3(r + q/2)`). Rotate every mesh +90° about Y
   (vertex on +z → +x).
2. **Tile normalization**: scale x/z by `1/(2/√3)` so the tile circumradius
   is exactly 1; keep Y untouched so the skirt depth stays exactly 1
   (top at y=0, base at y=−1). The runtime then renders a tile with
   `position.y = height, scale = (r, height, r)` and the base lands on y=0.
3. **Props/buildings**: same rotation, uniform `1/(2/√3)` scale on ALL axes
   (preserves authored proportions vs the tile), keep authored origins —
   KayKit props are authored to plant at origin on the tile surface.
4. **Tiles get NO texture** (strip the atlas — per-terrain tint is applied
   at runtime via `instanceColor`; the atlas's green grass would multiply
   against tints and turn muddy). **Props and buildings KEEP the shared
   `hexagons_medieval.png` atlas**, webp-compressed to 512².
5. Mesh naming: `tile_land`, `tile_water`, `prop_<name>`, `bld_<name>`.

Pieces to include — tiles: `hex_grass`, `hex_water` (sunken surface at
−0.2). Nature props: single trees A/B, tree clusters (A medium/large, B
medium), cut trees/stumps, rocks B–E, hills B/C, mountains A/B/C,
waterplants A/B/C, waterlilies A/B, clouds small/big. Resource markers:
`resource_stone`, `resource_lumber`, `sack`, `crate_A_small`, `crate_A_big`.
Buildings (yellow set + neutral specials): home_A/B, blacksmith, lumbermill,
church, tavern, market, tower_A, barracks, mine, well, grain, dirt,
bridge_A, stage_A/B/C, fence_wood_straight, fence_wood_straight_gate.

## Visual style spec

- **Palette**: one muted hex color per terrain type (33-entry table in
  `terrain.ts` — copy it). Three-colors-plus-paper-tints aesthetic: no raw
  greys, no saturated colors, gold accent `#c8a35e`, backdrop `#0a0b0d`.
- **Tiles**: instanced KayKit hex geometry, `TILE_RADIUS_K = 0.96` of the
  hex pitch (slight gap between tiles is intentional), elevation per terrain
  (0..1 table: mountains 1.0 → ocean 0.04) scaling prism height
  `0.22 + elev * 0.95`. White `MeshStandardMaterial` (roughness 0.9),
  per-instance tint. Water tiles: separate instanced mesh, glossier
  (roughness 0.2) + faint emissive `#16283c` ×0.5 so deep blue doesn't
  collapse to black in dark scenes.
- **Lighting rig** (values tuned, copy as-is):
  - `ambientLight` 0.42
  - `hemisphereLight ['#d6d0c2', '#141210'] 0.65` (paper sky / dark ground)
  - key `directionalLight` pos `[6,10,4]`, 1.6, `#f3e9d4`, `castShadow`,
    2048 shadow map, camera box ±9, bias −0.0004
  - gold rim `directionalLight` pos `[-5,4,-3]`, 0.55, accent color
  - scene `fog` `['#0a0b0d', 17, 40]`
  - Canvas: `shadows`, `dpr=[1,2]`, camera pos `[0,9.2,6]` fov 38,
    OrbitControls (no pan, polar clamp ~PI/2.15, distance 5–26).
- **Layout**: center all tiles on origin, scale the whole grid so it fits a
  fixed radius (5.5) — a static camera always frames it. For an admin
  builder with a huge world, consider chunked rendering or a pannable
  camera instead, but keep instancing.

## Architecture (layers, all instanced where counts grow)

1. **Tiles** — two `InstancedMesh`es (land/water). Per-instance matrix
   (position + y-scale = elevation) and `instanceColor` (terrain tint).
   Picking: raycast gives `instanceId` → index into the tile array. In the
   admin app wire `onClick` the same way for select/edit.
2. **Nature props** — deterministic scatter per tile, seeded by node id
   (mulberry32 — same id ⇒ same scatter every render). Terrain→props table
   with count ranges; "centerpiece" terrains (mountain/hills/volcanic) get
   one big centered model. One `InstancedMesh` per prop type. Wide props hug
   the center (ring ≤0.16), small ones scatter ring 0.18–0.55. Density
   auto-caps as tile count grows (`clamp(250/tiles, 0.35, 1)`).
3. **Buildings** — per-type model map (see `BUILDING_MODEL` in
   `PresenceLayer.tsx`). `UNDER_CONSTRUCTION` renders KayKit
   `stage_A/B/C` picked by `progressSteps/totalSteps` (<⅓, <⅔, else).
   CAMPFIRE is composed (3 small rocks + emissive gold cone). FARM_PLOT =
   grain field, ROAD = dirt pad, BRIDGE = bridge model, STORAGE_CHEST = big
   crate. Slots: first building at tile center, rest on the back-left arc;
   scale 0.85·pitch alone, 0.6 when sharing.
4. **Walls/gates — region union algorithm** (this is the part that's easy
   to get wrong):
   - Build a set of walled coords (`"q,r"`) = every tile whose buildings
     include WOODEN_WALL or GATE.
   - For each walled tile, for each of 6 edges (edge k has midpoint at
     angle 30°+60°k; neighbour offsets in matching order:
     `[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]`): if the neighbour across
     the edge is also walled → interior edge, render NOTHING; otherwise
     render a fence on that perimeter edge. Adjacent walled tiles thus merge
     into one compound; a closed ring renders as a single enclosure.
   - Gate doorway goes on a perimeter edge of the gate's tile (prefer the
     camera-facing one, k=1): two fence stubs + door piece when closed,
     stubs with a gap when open.
   - **KayKit fence pieces are authored ALREADY ON the +z hex edge**
     (z ≈ 0.87 = one apothem). Anchor them at the TILE CENTER with yaw
     `π/2 − θ` — do NOT translate to the edge midpoint or they land one
     apothem too far. Stretch fences ~8% in x so segments of adjacent tiles
     visually join across the tile gap.
5. **Character minis** (if the app shows people): reuse the rigged
   character assembly if available; scale so a figure stands ~0.8 of the
   tile pitch, stand it on a small base disc (gold = special/own, paper =
   others). Isolate in a nested `<Suspense>` so heavy character GLBs don't
   blank the terrain while streaming.
6. **Fog of war** (skip for an omniscient admin view, or keep as a "player
   vision preview" toggle): compute the frontier = every EMPTY hex adjacent
   to at least one existing tile (dedupe by coord, seed by coord hash).
   Hover semi-transparent grey clouds there: two instanced draws
   (small/big split by seed), material
   `{color:'#787f88', transparent, opacity:0.4, depthWrite:false}`,
   seed-driven jitter/rotation/scale (clouds must not read as a hex grid),
   whole group bobbing slowly via one `useFrame`.

## Gotchas (each cost real debugging time — don't relearn them)

- Multiply-tinting the KayKit atlas turns colors to mud; tiles untextured +
  `instanceColor`, props textured + white instance color.
- KayKit grass-green hill props clash with tinted tiles — render hills
  UNTEXTURED and tint them with the tile color (a mound of the same
  terrain).
- Tile sides should be the same material as tops — lighting alone darkens
  them; a dedicated dark side material reads as a misaligned band.
- Fence/wall pieces: authored on-edge, anchor at center (see above).
- `dispose={null}` on instanced meshes that share GLTF geometry/materials,
  or remounts (count changes) dispose shared GPU resources.
- Disable raycast (`raycast={() => {}}`) on every overlay mesh (props,
  buildings, minis, clouds) so the TILE keeps answering the pointer and the
  tooltip always describes the cell.
- Memoize the map component and keep its props referentially stable;
  polling parents re-render constantly and will re-reconcile the whole
  scene otherwise.
- Floating markers/pins above a tile must clear whatever stands on it —
  compute clearance from the tallest prop/building on that tile.
- `Suspense` isolation: terrain GLB in one boundary, character GLBs in a
  nested one.

## Verification

Typecheck + build, then drive the real app with Playwright: screenshot the
canvas at default zoom and zoomed-in, hover/click tiles and assert the
tooltip/selection payload, check the console for three.js warnings (0
expected). Use a generated fixture world (~150+ tiles, coherent regions:
mountain range, forest belt, coast band, desert pocket, road) — single-digit
tile fixtures hide layout and performance issues.

## License/credit

All KayKit packs are CC0. Add a credit line: "KayKit Medieval Hexagon Pack
1.0 by Kay Lousberg (kaylousberg.com), CC0."
