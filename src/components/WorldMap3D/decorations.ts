import type { Terrain } from '@/api/types';

// Per-terrain decoration: which KayKit props scatter on a tile and how many.
// Terrains absent from this table render bare (meadow, salt flats, roads —
// their tint carries the identity). Props are normalized in terrain.glb to
// tile-circumradius units, so offsets/scales here multiply by the tile's
// world radius at placement time.
interface Decoration {
  props: string[];
  min: number;
  max: number;
  centered?: boolean; // single centerpiece (mountain, hill) instead of a ring scatter
}

const DECORATION: Partial<Record<Terrain, Decoration>> = {
  FOREST: { props: ['tree_single_A', 'tree_single_B', 'trees_A_medium'], min: 2, max: 4 },
  BIRCH_FOREST: { props: ['tree_single_B', 'tree_single_A'], min: 1, max: 3 },
  RAINFOREST: { props: ['trees_A_large', 'trees_B_medium', 'trees_A_medium'], min: 2, max: 3 },
  FOREST_EDGE: { props: ['tree_single_A'], min: 1, max: 2 },
  SACRED_GROVE: { props: ['tree_single_B', 'tree_single_A'], min: 1, max: 2 },
  PLAINS: { props: ['rock_single_B'], min: 0, max: 1 },
  HILLS: { props: ['hill_single_B', 'hill_single_C'], min: 1, max: 1, centered: true },
  FOOTHILLS: { props: ['hill_single_C', 'rock_single_C'], min: 1, max: 2 },
  MOUNTAIN: { props: ['mountain_A', 'mountain_B'], min: 1, max: 1, centered: true },
  ALPINE: { props: ['mountain_C'], min: 1, max: 1, centered: true },
  CLIFFSIDE: { props: ['rock_single_D', 'rock_single_E'], min: 2, max: 3 },
  CANYON: { props: ['rock_single_D', 'rock_single_E'], min: 1, max: 3 },
  VOLCANIC: { props: ['mountain_B'], min: 1, max: 1, centered: true },
  DESERT: { props: ['rock_single_B'], min: 0, max: 2 },
  ICE_TUNDRA: { props: ['rock_single_C'], min: 0, max: 1 },
  GLACIER: { props: ['rock_single_E', 'rock_single_C'], min: 1, max: 2 },
  WETLANDS: { props: ['waterplant_A', 'waterplant_B', 'waterplant_C'], min: 2, max: 4 },
  SWAMP: { props: ['waterplant_B', 'waterplant_C', 'tree_single_A_cut'], min: 2, max: 4 },
  RIVER_DELTA: { props: ['waterlily_A', 'waterlily_B', 'waterplant_A'], min: 1, max: 3 },
  COASTAL: { props: ['waterplant_A', 'rock_single_B'], min: 0, max: 2 },
  SHORELINE: { props: ['rock_single_B'], min: 0, max: 1 },
  ANCIENT_RUINS: { props: ['rock_single_D', 'rock_single_C'], min: 1, max: 2 },
  CURSED_LAND: { props: ['tree_single_B_cut', 'rock_single_D'], min: 1, max: 2 },
  BLIGHTED: { props: ['tree_single_A_cut', 'trees_B_cut'], min: 1, max: 3 },
  CRYSTAL_CAVES: { props: ['rock_single_C', 'rock_single_D', 'rock_single_E'], min: 2, max: 4 },
};

// OCEAN renders with the sunken hex_water tile instead of the land prism.
export const WATER_TERRAIN = new Set<Terrain>(['OCEAN']);

// True when the terrain's decoration is a tile-centre piece (mountain, hill)
// — presence markers move to the rim so they don't spawn inside it.
export function hasCenterpiece(terrain: Terrain): boolean {
  return DECORATION[terrain]?.centered === true;
}

// KayKit hills ship with saturated grass-green tops and dirt skirts that
// clash with the muted per-terrain tints, so they render untextured and
// tinted with the tile color instead — a raised mound of the same terrain.
export const TERRAIN_TINTED_PROPS = new Set(['hill_single_B', 'hill_single_C']);

// Prop heights in tile-circumradius units (from terrain.glb bounds) — used
// to float the current-position marker above whatever sits on the tile.
const PROP_HEIGHT: Record<string, number> = {
  tree_single_A: 0.95,
  tree_single_B: 0.96,
  trees_A_medium: 1.1,
  trees_A_large: 0.79,
  trees_B_medium: 1.0,
  tree_single_A_cut: 0.2,
  tree_single_B_cut: 0.12,
  trees_B_cut: 0.13,
  rock_single_B: 0.12,
  rock_single_C: 0.17,
  rock_single_D: 0.14,
  rock_single_E: 0.17,
  hill_single_B: 0.36,
  hill_single_C: 0.51,
  mountain_A: 1.23,
  mountain_B: 1.53,
  mountain_C: 1.31,
  waterplant_A: 0.1,
  waterplant_B: 0.2,
  waterplant_C: 0.2,
  waterlily_A: 0.01,
  waterlily_B: 0.01,
};

// Wide props hug the tile centre so their footprint stays on the hex.
const BIG_PROPS = new Set([
  'trees_A_medium',
  'trees_A_large',
  'trees_B_medium',
  'trees_B_cut',
  'hill_single_B',
  'hill_single_C',
  'mountain_A',
  'mountain_B',
  'mountain_C',
]);

// Deterministic per-node RNG: same nodeId ⇒ same scatter, every render.
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlacedProp {
  prop: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number; // world units (already multiplied by tile radius)
  fade: number; // 0..1 memory-fade lerp amount, mirrors the tile tint fade
  tileColor: string; // fade-baked tile tint, for TERRAIN_TINTED_PROPS
}

export interface TileForProps {
  nodeId: number;
  terrain: Terrain;
  x: number;
  z: number;
  height: number;
  radius: number;
  fade: number;
  colorHex: string;
}

export interface PropLayout {
  placements: PlacedProp[];
  // Tallest prop top per node, in world units above the tile top.
  clearanceByNode: Map<number, number>;
}

// densityK scales prop counts down as the recalled map grows, keeping total
// instances bounded no matter how much the agent has explored.
export function placeProps(tiles: TileForProps[]): PropLayout {
  const densityK = Math.min(1, Math.max(0.35, 250 / Math.max(1, tiles.length)));
  const placements: PlacedProp[] = [];
  const clearanceByNode = new Map<number, number>();

  for (const tile of tiles) {
    const deco = DECORATION[tile.terrain];
    if (!deco) continue;
    const rand = mulberry32(tile.nodeId * 2654435761);
    const span = deco.max - deco.min;
    const count = Math.round((deco.min + rand() * span) * (deco.centered ? 1 : densityK));
    if (count === 0) continue;

    let clearance = 0;
    for (let i = 0; i < count; i++) {
      const prop = deco.props[Math.floor(rand() * deco.props.length)];
      const big = deco.centered || BIG_PROPS.has(prop);
      const ringMin = big ? 0 : 0.18;
      const ringMax = big ? 0.16 : 0.55;
      const dist = (ringMin + rand() * (ringMax - ringMin)) * tile.radius;
      const angle = rand() * Math.PI * 2;
      const scale = tile.radius * (0.85 + rand() * 0.3);
      placements.push({
        prop,
        x: tile.x + dist * Math.cos(angle),
        y: tile.height,
        z: tile.z + dist * Math.sin(angle),
        rotation: rand() * Math.PI * 2,
        scale,
        fade: tile.fade,
        tileColor: tile.colorHex,
      });
      clearance = Math.max(clearance, scale * (PROP_HEIGHT[prop] ?? 0.5));
    }
    if (clearance > 0) clearanceByNode.set(tile.nodeId, clearance);
  }

  return { placements, clearanceByNode };
}
