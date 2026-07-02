import type { Color } from 'three';
import type { RecalledNode, Terrain } from '@/api/types';

// Optimized KayKit Medieval Hexagon Pack geometry — built by
// scripts/prep-terrain.mjs, consumed by TerrainMeshes.tsx.
export const TERRAIN_GLB = '/models/terrain/terrain.glb';

// Tile circumradius as a fraction of the hex pitch — slight gap keeps the
// "recalled memory fragments" read the flat-color map had.
export const TILE_RADIUS_K = 0.96;

// Tiles and props fade toward this as their last sighting ages.
export const MEMORY_FADE_COLOR = '#15161a';

export interface TileData {
  node: RecalledNode;
  x: number;
  z: number;
  height: number;
  size: number;
  color: Color;
  colorHex: string;
  fade: number; // 0..1 lerp toward MEMORY_FADE_COLOR already baked into color
  isCurrent: boolean;
}

export type HoverFn = (node: RecalledNode | null, ev?: PointerEvent) => void;

// Axial offsets of the 6 hex neighbours, ordered to match the edge index
// convention used by the palisade renderer: entry k sits across the edge
// whose midpoint is at angle 30° + 60°k (flat-top axial, x = 1.5q).
export const AXIAL_NEIGHBOURS: [number, number][] = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

// World-space anchor for a fog-of-war cloud bank: an unexplored hex position
// adjacent to at least one recalled tile (the frontier of the agent's map
// memory). seed ∈ [0,1) drives per-cloud size/rotation/jitter.
export interface FogAnchor {
  x: number;
  z: number;
  seed: number;
}

// Terrain palette — ported from design/project/agent.js (the TERRAIN table) and
// extended to cover every value in the engine's Terrain enum. Muted, earthy,
// three-colours-plus-tints per the design system. No raw greys, no blues beyond
// the water/ice family the prototype already used.
export const TERRAIN_COLOR: Record<Terrain, string> = {
  MOUNTAIN: '#4a4438',
  ALPINE: '#5a626c',
  CLIFFSIDE: '#6a6258',
  CANYON: '#7a4a32',
  FOOTHILLS: '#5a4a30',
  HILLS: '#6a5530',
  FOREST_EDGE: '#3a4a2e',
  FOREST: '#2d4a2d',
  BIRCH_FOREST: '#4a6a3e',
  RAINFOREST: '#1f3a24',
  SACRED_GROVE: '#3e5a3e',
  MEADOW: '#6e7e3e',
  PLAINS: '#8a7438',
  WETLANDS: '#3a4838',
  SWAMP: '#34402e',
  RIVER_DELTA: '#3a5868',
  STONE_BRIDGE: '#706860',
  WOODEN_BRIDGE: '#5a4030',
  COASTAL: '#7a8868',
  SHORELINE: '#85795a',
  OCEAN: '#1e3a55',
  DESERT: '#9a8048',
  SALT_FLATS: '#8f897a',
  ICE_TUNDRA: '#7a8a92',
  GLACIER: '#8fa0a8',
  VOLCANIC: '#4a2a22',
  ANCIENT_RUINS: '#5a5048',
  CURSED_LAND: '#3a2e3a',
  CRYSTAL_CAVES: '#3a4a5a',
  BLIGHTED: '#4a4030',
  DIRT_PATH: '#5a3a28',
  GRAVEL_ROAD: '#5a5048',
  TRADE_ROUTE: '#6a5238',
};

// Relative elevation per terrain (0..1). Drives hex-prism height so the 3D
// surface reads as terrain — peaks rise, water sinks. Defaulted, not exhaustive.
const ELEVATION: Partial<Record<Terrain, number>> = {
  MOUNTAIN: 1.0,
  VOLCANIC: 0.9,
  ALPINE: 0.8,
  GLACIER: 0.75,
  CLIFFSIDE: 0.7,
  CANYON: 0.6,
  CRYSTAL_CAVES: 0.55,
  HILLS: 0.5,
  FOOTHILLS: 0.45,
  RAINFOREST: 0.38,
  FOREST: 0.34,
  BIRCH_FOREST: 0.34,
  SACRED_GROVE: 0.34,
  FOREST_EDGE: 0.3,
  ANCIENT_RUINS: 0.3,
  CURSED_LAND: 0.26,
  BLIGHTED: 0.24,
  PLAINS: 0.2,
  MEADOW: 0.2,
  DESERT: 0.18,
  SALT_FLATS: 0.14,
  ICE_TUNDRA: 0.18,
  DIRT_PATH: 0.18,
  GRAVEL_ROAD: 0.18,
  TRADE_ROUTE: 0.18,
  STONE_BRIDGE: 0.22,
  WOODEN_BRIDGE: 0.22,
  COASTAL: 0.14,
  SHORELINE: 0.12,
  WETLANDS: 0.12,
  SWAMP: 0.1,
  RIVER_DELTA: 0.1,
  OCEAN: 0.04,
};

const DEFAULT_ELEVATION = 0.2;

export function terrainColor(t: Terrain): string {
  return TERRAIN_COLOR[t] ?? '#5a5048';
}

export function terrainElevation(t: Terrain): number {
  return ELEVATION[t] ?? DEFAULT_ELEVATION;
}

export function terrainLabel(t: Terrain): string {
  return t.toLowerCase().replace(/_/g, ' ');
}

// ── Axial-hex geometry (flat-top) ────────────────────────────────────────────
// Engine nodes carry axial (q, r). Flat-top matches three.js CylinderGeometry's
// default 6-gon orientation (a vertex on +x), so no mesh rotation is needed.
// Returns world-space [x, z]; y is up (the ground plane is XZ).
export function axialToWorld(q: number, r: number, size = 1): [number, number] {
  const x = size * 1.5 * q;
  const z = size * Math.sqrt(3) * (r + q / 2);
  return [x, z];
}
