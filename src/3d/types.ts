import type { EquipSlot } from '@/api/types';

export type RaceId = 'human_steppe' | 'human_coastal' | 'human_alpine';

export const RACES: RaceId[] = ['human_steppe', 'human_coastal', 'human_alpine'];

export const DEFAULT_RACE: RaceId = 'human_steppe';

export type BodyShape = 'lean' | 'average' | 'heavy';

export const BODY_SHAPES: BodyShape[] = ['lean', 'average', 'heavy'];

export interface Appearance {
  raceId: RaceId;
  authoredRaceId: RaceId;
  headIndex: number;
  hairIndex: number;
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  bodyShape: BodyShape;
  heightScale: number;
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
