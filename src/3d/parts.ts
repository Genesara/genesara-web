import type { Gender } from './types';

// Asset map for the Quaternius universal-rig character system
// (public/models, built by scripts/prep-models.mjs — CC0, quaternius.com).
//
// A character is composed of synced sub-scenes on the same 65-joint rig:
// head (cut from the base body) + hair + peasant outfit + ranger outfit.
// The peasant parts are the UNEQUIPPED look per slot; the ranger parts are
// the EQUIPPED look — so gearing up visibly armors the figure.

export interface CharacterFiles {
  head: string;
  peasant: string;
  ranger: string;
}

export function characterFiles(gender: Gender): CharacterFiles {
  return {
    head: `/models/characters/${gender}_head.glb`,
    peasant: `/models/characters/${gender}_peasant.glb`,
    ranger: `/models/characters/${gender}_ranger.glb`,
  };
}

export const IDLE_ANIM = '/models/characters/idle.glb';

const HAIRSTYLES: Record<Gender, string[]> = {
  male: ['hair_buzzed', 'hair_simpleparted', 'hair_long', 'hair_buns'],
  female: ['hair_buzzedfemale', 'hair_simpleparted', 'hair_long', 'hair_buns'],
};

export function hairFile(gender: Gender, hairIndex: number): string {
  const list = HAIRSTYLES[gender];
  return `/models/characters/${list[hairIndex % list.length]}.glb`;
}

// ── Hand props ──────────────────────────────────────────────────────────────
// Weapons come from a cm-scaled FBX conversion, so each prop is normalized to
// `length` (meters along its longest axis) at runtime.

export interface PropConfig {
  file: string;
  length: number;
}

const PROP: Record<string, PropConfig> = {
  sword: { file: '/models/props/sword.glb', length: 1.05 },
  claymore: { file: '/models/props/claymore.glb', length: 1.35 },
  dagger: { file: '/models/props/dagger.glb', length: 0.5 },
  bow: { file: '/models/props/bow_wooden.glb', length: 1.35 },
  hammer: { file: '/models/props/hammer_small.glb', length: 0.75 },
  axe: { file: '/models/props/axe.glb', length: 0.85 },
  spear: { file: '/models/props/spear.glb', length: 1.8 },
  shield: { file: '/models/props/shield_round.glb', length: 0.65 },
  book: { file: '/models/props/book.glb', length: 0.3 },
};

export function mainHandProp(itemId: string): PropConfig {
  const id = itemId.toLowerCase();
  if (id.includes('dagger') || id.includes('knife')) return PROP.dagger;
  if (id.includes('bow')) return PROP.bow;
  if (id.includes('cudgel') || id.includes('club') || id.includes('mace') || id.includes('hammer')) return PROP.hammer;
  if (id.includes('axe')) return PROP.axe;
  if (id.includes('staff') || id.includes('spear') || id.includes('polearm')) return PROP.spear;
  if (id.includes('claymore') || id.includes('greatsword')) return PROP.claymore;
  if (id.includes('book') || id.includes('tome')) return PROP.book;
  return PROP.sword;
}

export function offHandProp(itemId: string): PropConfig {
  const id = itemId.toLowerCase();
  if (id.includes('dagger') || id.includes('knife') || id.includes('blade') || id.includes('sword')) return PROP.dagger;
  if (id.includes('book') || id.includes('tome')) return PROP.book;
  return PROP.shield;
}
