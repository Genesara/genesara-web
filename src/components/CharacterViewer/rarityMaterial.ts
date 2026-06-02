import type { Rarity } from '@/api/types';

// Per-rarity material tuning for the procedural placeholder equipment.
// When real GLBs arrive, items ship their own PBR materials; this table is
// only consulted for the placeholder render path.
export const RARITY_TINT: Record<Rarity, { color: string; metalness: number; roughness: number }> = {
  COMMON: { color: '#5A554C', metalness: 0.1, roughness: 0.75 },
  UNCOMMON: { color: '#6B6A4A', metalness: 0.25, roughness: 0.6 },
  RARE: { color: '#8A6E3F', metalness: 0.55, roughness: 0.45 },
  EPIC: { color: '#A78248', metalness: 0.75, roughness: 0.35 },
  LEGENDARY: { color: '#C8A35E', metalness: 0.9, roughness: 0.22 },
};
