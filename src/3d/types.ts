import type { EquipSlot } from '@/api/types';

export type RaceId = 'human_steppe' | 'human_coastal' | 'human_alpine';

export const RACES: RaceId[] = ['human_steppe', 'human_coastal', 'human_alpine'];

export const DEFAULT_RACE: RaceId = 'human_steppe';

export type BodyShape = 'lean' | 'average' | 'heavy';

export const BODY_SHAPES: BodyShape[] = ['lean', 'average', 'heavy'];

// Per-agent body proportions, all seeded from the PRNG. Every value is a
// multiplier on the canonical (~7.5-head) figure built in anchors.ts, so the
// same (agentId, race) pair always produces the same silhouette. `bodyShape`
// sets the base distribution; these multipliers add per-agent jitter on top so
// two "heavy" agents still differ.
export interface Build {
  /** Overall figure height in head-units (canon ≈ 7.5). */
  heads: number;
  /** Shoulder span multiplier (broad ↔ narrow). */
  shoulderWidth: number;
  /** Chest depth/mass multiplier (muscle / barrel). */
  torsoMass: number;
  /** Waist taper multiplier (cinched ↔ thick). */
  waist: number;
  /** Pelvis width multiplier. */
  hipWidth: number;
  /** Arm + leg girth multiplier. */
  limbThickness: number;
  /** Cranium width multiplier. */
  headWidth: number;
  /** Jaw taper toward the chin (0 = soft/round, 1 = angular). */
  jaw: number;
  /** Arm splay from the torso, radians (A-pose openness). */
  armSplay: number;
  /** Contrapposto weight shift, signed fraction of hip width. */
  weightShift: number;
}

export type Gender = 'male' | 'female';

export interface Appearance {
  raceId: RaceId;
  authoredRaceId: RaceId;
  gender: Gender;
  headIndex: number;
  hairIndex: number;
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  bodyShape: BodyShape;
  /** Legacy uniform height multiplier — kept for manifest/back-compat. */
  heightScale: number;
  build: Build;
}

export interface RaceConfig {
  raceId: RaceId;
  headBias: number[];
  hairBias: number[];
  bodyBias: number[];
  skinPalette: string[];
  hairPalette: string[];
  eyePalette: string[];
  heightRange: [number, number];
  /** Head-unit height range for this race (canon ≈ 7.5). */
  headsRange: [number, number];
}

export type SocketName = string;

export interface MeshAssetKey {
  kind: 'base' | 'equipment' | 'anim';
  path: string;
}

export interface EquipmentManifestEntry {
  itemId: string;
  meshKey: string;
}

export interface SlotDefault {
  slotId: EquipSlot;
  meshKey: string;
}

export interface CatalogManifest {
  version: string;
  baseMeshes: {
    bodies: Record<BodyShape, string | null>;
    heads: (string | null)[];
    hairs: (string | null)[];
  };
  slotDefaults: Record<EquipSlot, string | null>;
  equipment: EquipmentManifestEntry[];
  idleAnim: string | null;
}
