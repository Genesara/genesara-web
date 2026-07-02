import type {
  Agent,
  AgentDetail,
  AgentEvent,
  AgentPresence,
  BuildingSummary,
  InventoryEntry,
  Loadout,
  LookAround,
  LookAroundNode,
  NpcPresence,
  PublicStats,
  RecalledNode,
  Relationships,
  Skills,
} from '@/api/types';

const now = () => new Date().toISOString();

export const fixtureAgents: Agent[] = [
  {
    agentId: 'artemis',
    name: 'Artemis',
    classId: 'RESEARCHER',
    race: 'human_steppe',
    level: 7,
    xpCurrent: 2140,
    xpToNext: 3200,
    gauges: {
      hp: { current: 68, max: 80 },
      stamina: { current: 42, max: 100 },
      mana: { current: 71, max: 90 },
      hunger: { current: 50, max: 100 },
      thirst: { current: 50, max: 100 },
      sleep: { current: 50, max: 100 },
    },
    locationNodeId: 143616, // artId(0, 0)
    spawned: true,
    lastActiveAt: now(),
  },
  {
    agentId: 'baldur',
    name: 'Baldur',
    classId: null,
    race: 'human_steppe',
    level: 3,
    xpCurrent: 410,
    xpToNext: 1400,
    gauges: {
      hp: { current: 31, max: 60 },
      stamina: { current: 88, max: 100 },
      mana: { current: 10, max: 30 },
      hunger: { current: 50, max: 100 },
      thirst: { current: 50, max: 100 },
      sleep: { current: 50, max: 100 },
    },
    locationNodeId: 142066,
    spawned: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    agentId: 'cassia',
    name: 'Cassia',
    classId: 'SCOUT',
    race: 'human_steppe',
    level: 12,
    xpCurrent: 5820,
    xpToNext: 7200,
    gauges: {
      hp: { current: 112, max: 120 },
      stamina: { current: 78, max: 110 },
      mana: { current: 130, max: 130 },
      hunger: { current: 50, max: 100 },
      thirst: { current: 50, max: 100 },
      sleep: { current: 50, max: 100 },
    },
    locationNodeId: 142077,
    spawned: true,
    lastActiveAt: now(),
  },
];

// ── Live public stats ───────────────────────────────────────────────────────

export const fixtureStats: PublicStats = {
  tick: 4_712_389,
  tickIntervalMs: 1500,
  onlineAgents: 2,
  totalAgents: 3,
};

// Bump tick in the background so /api/stats feels alive.
// HMR-safe: only start once per window.
declare global {
  // eslint-disable-next-line no-var
  var __genesaraTickInterval: ReturnType<typeof setInterval> | undefined;
}
if (typeof window !== 'undefined' && !globalThis.__genesaraTickInterval) {
  globalThis.__genesaraTickInterval = setInterval(() => {
    fixtureStats.tick += 1;
  }, fixtureStats.tickIntervalMs);
}

// ── Per-agent fixture data ──────────────────────────────────────────────────

export const fixtureDetail: Record<string, AgentDetail> = {
  artemis: {
    agentId: 'artemis',
    name: 'Artemis',
    race: 'human_steppe',
    classId: 'RESEARCHER',
    level: 7,
    xp: { current: 2140, toNext: 3200 },
    attributes: {
      strength: 10,
      dexterity: 14,
      constitution: 12,
      perception: 16,
      intelligence: 18,
      luck: 9,
    },
    unspentAttributePoints: 0,
    gauges: fixtureAgents[0].gauges,
    // Current node must exist in fixtureMap.artemis — the map marker keys off it.
    location: 143616, // artId(0, 0)
    safeNode: 142080,
    tick: fixtureStats.tick,
    authority: 14,
    fame: 22,
    pendingClassChoice: [],
    pendingEvolutionChoice: [],
  },
  baldur: {
    agentId: 'baldur',
    name: 'Baldur',
    race: 'human_steppe',
    classId: null,
    level: 3,
    xp: { current: 410, toNext: 1400 },
    attributes: {
      strength: 15,
      dexterity: 11,
      constitution: 14,
      perception: 9,
      intelligence: 8,
      luck: 12,
    },
    unspentAttributePoints: 1,
    gauges: fixtureAgents[1].gauges,
    location: 142066,
    safeNode: 142066,
    tick: fixtureStats.tick,
    authority: 2,
    fame: 0,
    pendingClassChoice: [],
    pendingEvolutionChoice: [],
  },
  cassia: {
    agentId: 'cassia',
    name: 'Cassia',
    race: 'human_steppe',
    classId: 'SCOUT',
    level: 12,
    xp: { current: 5820, toNext: 7200 },
    attributes: {
      strength: 12,
      dexterity: 17,
      constitution: 13,
      perception: 18,
      intelligence: 11,
      luck: 14,
    },
    unspentAttributePoints: 2,
    gauges: fixtureAgents[2].gauges,
    location: 142077,
    safeNode: 142080,
    tick: fixtureStats.tick,
    authority: 38,
    fame: 91,
    pendingClassChoice: [],
    pendingEvolutionChoice: [],
  },
};

export const fixtureSkills: Record<string, Skills> = {
  artemis: {
    slotCount: 6,
    slotsFilled: 3,
    slots: [
      { slotIndex: 0, skill: { id: 'alchemy', displayName: 'Alchemy', category: 'KNOWLEDGE', xp: 1820, level: 6, recommendCount: 2 } },
      { slotIndex: 1, skill: { id: 'foraging', displayName: 'Foraging', category: 'GATHERING', xp: 740, level: 3, recommendCount: 1 } },
      { slotIndex: 2, skill: { id: 'anatomy', displayName: 'Anatomy', category: 'KNOWLEDGE', xp: 510, level: 2, recommendCount: 0 } },
      { slotIndex: 3, skill: null },
      { slotIndex: 4, skill: null },
      { slotIndex: 5, skill: null },
    ],
    unslotted: [
      { id: 'cartography', displayName: 'Cartography', category: 'KNOWLEDGE', xp: 120, level: 1, recommendCount: 0 },
    ],
    chosenPerks: [],
    pendingPerkChoices: [],
  },
  baldur: {
    slotCount: 4,
    slotsFilled: 1,
    slots: [
      { slotIndex: 0, skill: { id: 'athletics', displayName: 'Athletics', category: 'ATHLETICS', xp: 220, level: 2, recommendCount: 0 } },
      { slotIndex: 1, skill: null },
      { slotIndex: 2, skill: null },
      { slotIndex: 3, skill: null },
    ],
    unslotted: [],
    chosenPerks: [],
    pendingPerkChoices: [],
  },
  cassia: {
    slotCount: 8,
    slotsFilled: 4,
    slots: [
      { slotIndex: 0, skill: { id: 'tracking', displayName: 'Tracking', category: 'SURVIVAL', xp: 3210, level: 9, recommendCount: 4 } },
      { slotIndex: 1, skill: { id: 'archery', displayName: 'Archery', category: 'COMBAT', xp: 2860, level: 8, recommendCount: 3 } },
      { slotIndex: 2, skill: { id: 'stealth', displayName: 'Stealth', category: 'STEALTH', xp: 1520, level: 5, recommendCount: 1 } },
      { slotIndex: 3, skill: { id: 'cartography', displayName: 'Cartography', category: 'KNOWLEDGE', xp: 980, level: 4, recommendCount: 2 } },
      { slotIndex: 4, skill: null },
      { slotIndex: 5, skill: null },
      { slotIndex: 6, skill: null },
      { slotIndex: 7, skill: null },
    ],
    unslotted: [
      { id: 'climbing', displayName: 'Climbing', category: 'ATHLETICS', xp: 410, level: 2, recommendCount: 0 },
    ],
    chosenPerks: [],
    pendingPerkChoices: [],
  },
};

export const fixtureInventory: Record<string, InventoryEntry[]> = {
  artemis: [
    { itemId: 'herb_blueleaf', quantity: 8, rarity: 'COMMON' },
    { itemId: 'ore_iron', quantity: 12, rarity: 'COMMON' },
    { itemId: 'parchment', quantity: 3, rarity: 'UNCOMMON' },
  ],
  baldur: [
    { itemId: 'ration_bread', quantity: 2, rarity: 'COMMON' },
  ],
  cassia: [
    { itemId: 'arrow_iron', quantity: 28, rarity: 'COMMON' },
    { itemId: 'pelt_wolf', quantity: 3, rarity: 'UNCOMMON' },
    { itemId: 'map_fragment.iron_coast', quantity: 1, rarity: 'RARE' },
  ],
};

export const fixtureLoadout: Record<string, Loadout> = {
  artemis: {
    stackable: fixtureInventory.artemis,
    instances: [],
    equipment: {
      slots: [
        { slotId: 'HELMET',         instance: { instanceId: 'inst_h1', itemId: 'scholar_circlet', category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 38, durabilityMax: 40, creatorAgentId: null } },
        { slotId: 'CHEST',          instance: { instanceId: 'inst_c1', itemId: 'linen_coat',      category: 'EQUIPMENT', rarity: 'COMMON',   durabilityCurrent: 22, durabilityMax: 30, creatorAgentId: null } },
        { slotId: 'PANTS',          instance: { instanceId: 'inst_p1', itemId: 'travel_trousers', category: 'EQUIPMENT', rarity: 'COMMON',   durabilityCurrent: 24, durabilityMax: 30, creatorAgentId: null } },
        { slotId: 'BOOTS',          instance: { instanceId: 'inst_b1', itemId: 'field_boots',     category: 'EQUIPMENT', rarity: 'COMMON',   durabilityCurrent: 18, durabilityMax: 25, creatorAgentId: null } },
        { slotId: 'GLOVES',         instance: { instanceId: 'inst_g1', itemId: 'herbalist_gloves',category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 19, durabilityMax: 25, creatorAgentId: null } },
        { slotId: 'AMULET',         instance: { instanceId: 'inst_a1', itemId: 'concord_sigil',   category: 'EQUIPMENT', rarity: 'RARE',     durabilityCurrent: 50, durabilityMax: 50, creatorAgentId: null } },
        { slotId: 'RING_LEFT',      instance: null },
        { slotId: 'RING_RIGHT',     instance: null },
        { slotId: 'BRACELET_LEFT',  instance: { instanceId: 'inst_bl', itemId: 'copper_band',     category: 'EQUIPMENT', rarity: 'COMMON',   durabilityCurrent: 28, durabilityMax: 30, creatorAgentId: null } },
        { slotId: 'BRACELET_RIGHT', instance: { instanceId: 'inst_br', itemId: 'trackers_loop',   category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 30, durabilityMax: 35, creatorAgentId: null } },
        { slotId: 'MAIN_HAND',      instance: { instanceId: 'inst_mh', itemId: 'bone_scribe_knife', category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 16, durabilityMax: 20, creatorAgentId: null } },
        { slotId: 'OFF_HAND',       instance: null },
      ],
      stash: [],
    },
  },
  baldur: {
    stackable: fixtureInventory.baldur,
    instances: [],
    equipment: {
      slots: [
        { slotId: 'HELMET',         instance: null },
        { slotId: 'CHEST',          instance: { instanceId: 'inst_bc', itemId: 'leather_jerkin',  category: 'EQUIPMENT', rarity: 'COMMON', durabilityCurrent: 14, durabilityMax: 25, creatorAgentId: null } },
        { slotId: 'PANTS',          instance: null },
        { slotId: 'BOOTS',          instance: null },
        { slotId: 'GLOVES',         instance: null },
        { slotId: 'AMULET',         instance: null },
        { slotId: 'RING_LEFT',      instance: null },
        { slotId: 'RING_RIGHT',     instance: null },
        { slotId: 'BRACELET_LEFT',  instance: null },
        { slotId: 'BRACELET_RIGHT', instance: null },
        { slotId: 'MAIN_HAND',      instance: { instanceId: 'inst_bmh', itemId: 'oak_cudgel',     category: 'EQUIPMENT', rarity: 'COMMON', durabilityCurrent: 18, durabilityMax: 20, creatorAgentId: null } },
        { slotId: 'OFF_HAND',       instance: null },
      ],
      stash: [],
    },
  },
  cassia: {
    stackable: fixtureInventory.cassia,
    instances: [],
    equipment: {
      slots: [
        { slotId: 'HELMET',         instance: { instanceId: 'inst_ch', itemId: 'scouting_hood',   category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 33, durabilityMax: 35, creatorAgentId: null } },
        { slotId: 'CHEST',          instance: { instanceId: 'inst_cc', itemId: 'ranger_cuirass',  category: 'EQUIPMENT', rarity: 'RARE',     durabilityCurrent: 44, durabilityMax: 50, creatorAgentId: null } },
        { slotId: 'PANTS',          instance: { instanceId: 'inst_cp', itemId: 'ranger_breeches', category: 'EQUIPMENT', rarity: 'RARE',     durabilityCurrent: 41, durabilityMax: 50, creatorAgentId: null } },
        { slotId: 'BOOTS',          instance: { instanceId: 'inst_cb', itemId: 'soft_boots',      category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 28, durabilityMax: 30, creatorAgentId: null } },
        { slotId: 'GLOVES',         instance: null },
        { slotId: 'AMULET',         instance: { instanceId: 'inst_ca', itemId: 'wolfbone_pendant',category: 'EQUIPMENT', rarity: 'EPIC',     durabilityCurrent: 60, durabilityMax: 60, creatorAgentId: null } },
        { slotId: 'RING_LEFT',      instance: null },
        { slotId: 'RING_RIGHT',     instance: null },
        { slotId: 'BRACELET_LEFT',  instance: null },
        { slotId: 'BRACELET_RIGHT', instance: null },
        { slotId: 'MAIN_HAND',      instance: { instanceId: 'inst_cmh', itemId: 'yew_longbow',    category: 'EQUIPMENT', rarity: 'RARE',     durabilityCurrent: 38, durabilityMax: 45, creatorAgentId: null } },
        { slotId: 'OFF_HAND',       instance: { instanceId: 'inst_coh', itemId: 'iron_dagger',    category: 'EQUIPMENT', rarity: 'UNCOMMON', durabilityCurrent: 22, durabilityMax: 25, creatorAgentId: null } },
      ],
      stash: [],
    },
  },
};

function ring(center: number, q: number, r: number, terrain: RecalledNode['terrain'], biome: RecalledNode['biome'] = null, tick = fixtureStats.tick): RecalledNode {
  return {
    nodeId: center + q * 10 + r,
    regionId: 142,
    q,
    r,
    terrain,
    biome,
    firstSeenTick: tick - 4000,
    lastSeenTick: tick - Math.floor(Math.random() * 200),
  };
}

// ── Generated recall for artemis ────────────────────────────────────────────
// A radius-7 axial patch (169 nodes) with coherent regions so the 3D map gets
// exercised at realistic scale: mountain range NE, glacier patch N, forest
// belt W, south sea with a coastal rim, swamp pocket SE, desert E, a road
// through the plains heart, and the rare terrains placed as landmarks.
// Fully deterministic (hash, not Math.random) so nodeIds and terrain are
// stable across reloads.

type GenTerrain = RecalledNode['terrain'];
type GenBiome = RecalledNode['biome'];

const ARTEMIS_RADIUS = 7;

const artId = (q: number, r: number) => 142000 + (q + 16) * 100 + (r + 16);

function axialDist(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

function hash2(q: number, r: number): number {
  let h = Math.imul(q + 101, 374761393) + Math.imul(r + 101, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Landmark tiles override their zone.
const LANDMARKS: Record<string, [GenTerrain, GenBiome]> = {
  '-4,1': ['SACRED_GROVE', 'FOREST'],
  '-3,3': ['ANCIENT_RUINS', 'RUINS'],
  '3,-3': ['CRYSTAL_CAVES', 'MOUNTAIN'],
  '1,3': ['CURSED_LAND', 'RUINS'],
  '2,2': ['BLIGHTED', 'RUINS'],
  '2,-6': ['VOLCANIC', 'MOUNTAIN'],
};

function terrainAt(q: number, r: number): [GenTerrain, GenBiome] {
  const landmark = LANDMARKS[`${q},${r}`];
  if (landmark) return landmark;
  const h = hash2(q, r);

  // South sea: w grows toward world +z (south on screen).
  const w = r + q / 2;
  if (w > 5.2) return ['OCEAN', 'OCEAN'];
  if (w > 4.4) return [h < 0.5 ? 'SHORELINE' : 'COASTAL', 'COASTAL'];

  // Swamp pocket between the coast and the plains.
  const dSwamp = axialDist(q - 5, r - 1);
  if (dSwamp <= 1) return ['SWAMP', 'SWAMP'];
  if (dSwamp === 2 && h < 0.6) return [h < 0.3 ? 'WETLANDS' : 'RIVER_DELTA', 'SWAMP'];

  // North-east mountain range with a weathered rim.
  const dMountain = axialDist(q - 4, r + 5);
  if (dMountain <= 1) return [h < 0.45 ? 'ALPINE' : 'MOUNTAIN', 'MOUNTAIN'];
  if (dMountain === 2)
    return [h < 0.4 ? 'MOUNTAIN' : h < 0.7 ? 'CLIFFSIDE' : 'CANYON', 'MOUNTAIN'];
  if (dMountain === 3) return [h < 0.5 ? 'FOOTHILLS' : 'HILLS', 'MOUNTAIN'];

  // Glacier patch north.
  const dGlacier = axialDist(q + 2, r + 4);
  if (dGlacier <= 1) return [h < 0.5 ? 'GLACIER' : 'ICE_TUNDRA', 'TUNDRA'];
  if (dGlacier === 2 && h < 0.4) return ['ICE_TUNDRA', 'TUNDRA'];

  // Desert pocket east.
  if (axialDist(q - 6, r + 2) <= 1) return [h < 0.7 ? 'DESERT' : 'SALT_FLATS', 'DESERT'];

  // Western forest belt, deepening to rainforest at the far edge.
  if (q <= -2) {
    if (q === -2) return [h < 0.6 ? 'FOREST_EDGE' : 'FOREST', 'FOREST'];
    if (q <= -5 && h < 0.45) return ['RAINFOREST', 'FOREST'];
    return [h < 0.7 ? 'FOREST' : 'BIRCH_FOREST', 'FOREST'];
  }

  // East-west road through the heart.
  if (r === 0 && q >= -1 && q <= 4)
    return [h < 0.65 ? 'DIRT_PATH' : 'TRADE_ROUTE', 'PLAINS'];

  return [h < 0.55 ? 'PLAINS' : h < 0.85 ? 'MEADOW' : 'HILLS', 'PLAINS'];
}

function generateArtemisRecall(): RecalledNode[] {
  const out: RecalledNode[] = [];
  for (let q = -ARTEMIS_RADIUS; q <= ARTEMIS_RADIUS; q++) {
    const rMin = Math.max(-ARTEMIS_RADIUS, -q - ARTEMIS_RADIUS);
    const rMax = Math.min(ARTEMIS_RADIUS, -q + ARTEMIS_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      const [terrain, biome] = terrainAt(q, r);
      // Sightings age with distance from the agent's node at (0,0), so the
      // memory fade deepens toward the rim of the recalled patch.
      const age = Math.round(axialDist(q, r) * 160 * (0.5 + hash2(r * 3, q * 5)));
      out.push({
        nodeId: artId(q, r),
        regionId: 142,
        q,
        r,
        terrain,
        biome,
        firstSeenTick: fixtureStats.tick - age - 2500,
        lastSeenTick: fixtureStats.tick - age,
      });
    }
  }
  return out;
}

export const fixtureMap: Record<string, RecalledNode[]> = {
  artemis: generateArtemisRecall(),
  baldur: [
    ring(142000, 0, 0, 'PLAINS', 'PLAINS'),
    ring(142000, 1, 0, 'PLAINS', 'PLAINS'),
    ring(142000, 0, 1, 'PLAINS', 'PLAINS'),
  ],
  cassia: [
    ring(142000, 0, 0, 'COASTAL', 'COASTAL'),
    ring(142000, 1, 0, 'SHORELINE', 'COASTAL'),
    ring(142000, -1, 0, 'CLIFFSIDE', 'MOUNTAIN'),
    ring(142000, 0, 1, 'OCEAN', 'OCEAN'),
    ring(142000, 0, -1, 'HILLS', 'PLAINS'),
    ring(142000, 1, -1, 'STONE_BRIDGE', 'PLAINS'),
    ring(142000, -1, 1, 'WETLANDS', 'SWAMP'),
    ring(142000, 2, 0, 'ANCIENT_RUINS', 'RUINS'),
  ],
};

// ── Look-around fixture (REST mirror of MCP look_around) ────────────────────
// Derives live surroundings from the generated artemis world: sight radius 2
// around the current node at (0,0), per-terrain resource rolls, deterministic
// NPC spawns from the engine fauna catalog, and two agents sharing the tile.
// The real REST mirror doesn't populate npcs/agents yet — the mock populates
// everything so the portal renders the full forward-looking contract.

const SIGHT_RADIUS = 2;

type TerrainKey = RecalledNode['terrain'];

const RESOURCE_POOL: Partial<Record<TerrainKey, string[]>> = {
  FOREST: ['WOOD', 'BERRY', 'HERB', 'MUSHROOM'],
  BIRCH_FOREST: ['WOOD', 'BERRY', 'HERB'],
  RAINFOREST: ['WOOD', 'HERB', 'MUSHROOM'],
  FOREST_EDGE: ['WOOD', 'BERRY'],
  SACRED_GROVE: ['HERB', 'MUSHROOM'],
  PLAINS: ['BERRY', 'HERB', 'FIBER'],
  MEADOW: ['BERRY', 'HERB', 'FIBER'],
  HILLS: ['STONE', 'ORE'],
  FOOTHILLS: ['STONE', 'ORE'],
  MOUNTAIN: ['STONE', 'ORE', 'COAL'],
  ALPINE: ['STONE', 'ORE'],
  CLIFFSIDE: ['STONE'],
  CANYON: ['STONE', 'COAL'],
  VOLCANIC: ['COAL', 'ORE'],
  DESERT: ['SAND', 'SALT'],
  SALT_FLATS: ['SALT', 'SAND'],
  ICE_TUNDRA: ['STONE'],
  GLACIER: ['STONE'],
  WETLANDS: ['CLAY', 'PEAT', 'HERB'],
  SWAMP: ['PEAT', 'CLAY'],
  RIVER_DELTA: ['CLAY', 'FISH'],
  COASTAL: ['FISH', 'SAND'],
  SHORELINE: ['FISH', 'SAND'],
  OCEAN: ['FISH'],
  ANCIENT_RUINS: ['STONE'],
  CRYSTAL_CAVES: ['GEM', 'STONE'],
};

// type / displayName / aggression lifted from the engine's npcs.yaml catalog.
const NPC_POOL: Partial<Record<TerrainKey, [string, string, string][]>> = {
  FOREST: [['GRAY_WOLF', 'Gray Wolf', 'TERRITORIAL'], ['DEER', 'Deer', 'PASSIVE'], ['WILD_BOAR', 'Wild Boar', 'TERRITORIAL']],
  BIRCH_FOREST: [['DEER', 'Deer', 'PASSIVE'], ['RED_FOX', 'Red Fox', 'PASSIVE']],
  RAINFOREST: [['GIANT_SPIDER', 'Giant Spider', 'HOSTILE'], ['BLACK_PANTHER', 'Black Panther', 'TERRITORIAL']],
  FOREST_EDGE: [['GRAY_WOLF', 'Gray Wolf', 'TERRITORIAL'], ['DEER', 'Deer', 'PASSIVE']],
  PLAINS: [['WILD_HORSE', 'Wild Horse', 'PASSIVE'], ['PHEASANT', 'Pheasant', 'PASSIVE']],
  MEADOW: [['DEER', 'Deer', 'PASSIVE'], ['WILD_TURKEY', 'Wild Turkey', 'PASSIVE']],
  HILLS: [['MOUNTAIN_GOAT', 'Mountain Goat', 'TERRITORIAL']],
  FOOTHILLS: [['MOUNTAIN_GOAT', 'Mountain Goat', 'TERRITORIAL'], ['COUGAR', 'Cougar', 'TERRITORIAL']],
  MOUNTAIN: [['MOUNTAIN_GOAT', 'Mountain Goat', 'TERRITORIAL'], ['BROWN_BEAR', 'Brown Bear', 'TERRITORIAL']],
  CANYON: [['COUGAR', 'Cougar', 'TERRITORIAL']],
  DESERT: [['SAND_VIPER', 'Sand Viper', 'HOSTILE'], ['DESERT_JACKAL', 'Desert Jackal', 'HOSTILE']],
  ICE_TUNDRA: [['SNOW_HARE', 'Snow Hare', 'PASSIVE']],
  GLACIER: [['SNOW_HARE', 'Snow Hare', 'PASSIVE']],
  WETLANDS: [['BOG_TURTLE', 'Bog Turtle', 'PASSIVE'], ['SWAMP_PYTHON', 'Swamp Python', 'HOSTILE']],
  SWAMP: [['SWAMP_PYTHON', 'Swamp Python', 'HOSTILE'], ['MONITOR_LIZARD', 'Monitor Lizard', 'TERRITORIAL']],
  RIVER_DELTA: [['RIVER_OTTER', 'River Otter', 'PASSIVE']],
  CURSED_LAND: [['GIANT_RAT', 'Giant Rat', 'HOSTILE']],
  BLIGHTED: [['GIANT_RAT', 'Giant Rat', 'HOSTILE']],
};

const HP_BANDS = ['low', 'mid', 'high'];

// Buildings around artemis's camp at (0,0) — a settled tile (shelter,
// campfire, half-built workbench), infrastructure on the road, a walled +
// gated frontier toward the mountains, a mine at the foothills.
const BUILDINGS_AT: Record<string, BuildingSummary[]> = {
  '0,0': [
    { type: 'SHELTER', status: 'ACTIVE', instanceId: 'bld-shelter-1', hpBand: 'high', builderAgentId: 'agent:artemis' },
    { type: 'CAMPFIRE', status: 'ACTIVE', instanceId: 'bld-campfire-1', hpBand: 'mid', builderAgentId: 'agent:artemis' },
    { type: 'WORKBENCH', status: 'UNDER_CONSTRUCTION', instanceId: 'bld-workbench-1', progressSteps: 2, totalSteps: 6, builderAgentId: 'agent:artemis' },
  ],
  '1,0': [{ type: 'TRADING_POST', status: 'ACTIVE' }],
  '-1,0': [
    { type: 'WELL', status: 'ACTIVE' },
    { type: 'STORAGE_CHEST', status: 'ACTIVE' },
  ],
  '0,1': [{ type: 'FARM_PLOT', status: 'ACTIVE', plantedCrop: 'WHEAT', ticksToRipe: 120 }],
  '1,-1': [{ type: 'FORGE', status: 'UNDER_CONSTRUCTION' }],
  // Walled compound: three adjacent walled tiles render as ONE enclosure
  // (interior edges skipped), gate doorway on the perimeter.
  '2,0': [{ type: 'WOODEN_WALL', status: 'ACTIVE' }],
  '2,-1': [{ type: 'GATE', status: 'ACTIVE', isOpen: false }],
  '2,-2': [
    { type: 'MINE', status: 'ACTIVE' },
    { type: 'WOODEN_WALL', status: 'ACTIVE' },
  ],
  '-1,1': [{ type: 'WATCHTOWER', status: 'ACTIVE' }],
  '-2,0': [{ type: 'BREWERY', status: 'ACTIVE' }],
};

// Fog-of-war: adjacent tiles carry type + status (+ the two at-distance
// fields) only — instance ids and progress are current-tile detail.
function fogStrip(b: BuildingSummary): BuildingSummary {
  return { type: b.type, status: b.status, plantedCrop: b.plantedCrop, isOpen: b.isOpen };
}

function lookAroundNodeFor(n: RecalledNode, isCurrent: boolean): LookAroundNode {
  const h = hash2(n.q * 7, n.r * 13);
  const pool = RESOURCE_POOL[n.terrain] ?? [];
  const resourceCount = pool.length === 0 ? 0 : 1 + Math.floor(h * Math.min(3, pool.length));
  const resources = pool.slice(0, resourceCount);

  const npcs: NpcPresence[] = [];
  const npcPool = NPC_POOL[n.terrain] ?? [];
  if (npcPool.length > 0 && hash2(n.r * 11, n.q * 17) < 0.45) {
    const count = 1 + (hash2(n.q * 19, n.r * 23) < 0.3 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const [type, displayName, aggression] = npcPool[Math.floor(hash2(n.q + i, n.r - i) * npcPool.length)];
      npcs.push({
        id: `npc:${n.nodeId}-${i}`,
        type,
        displayName,
        hpBand: HP_BANDS[Math.floor(hash2(n.r + i, n.q + i) * 3)],
        aggression,
      });
    }
  }

  const agents: AgentPresence[] = isCurrent
    ? [
        { id: 'agent:b2c4e6a8-0000-4000-8000-cassia000001', name: 'Cassia', race: 'human_steppe', level: 9, hpBand: 'high' },
        { id: 'agent:d4f6a8b0-0000-4000-8000-stranger0001', name: 'Warg-3A', race: 'human_steppe', level: 4, hpBand: 'low' },
      ]
    : [];

  const buildings = (BUILDINGS_AT[`${n.q},${n.r}`] ?? []).map((b) =>
    isCurrent ? b : fogStrip(b),
  );

  return {
    id: n.nodeId,
    q: n.q,
    r: n.r,
    biome: n.biome,
    climate: null,
    terrain: n.terrain,
    pvpEnabled: true,
    resources,
    buildings,
    agents,
    npcs,
  };
}

export function fixtureLookAround(agentId: string): LookAround | null {
  if (agentId !== 'artemis') return null;
  const nodes = fixtureMap.artemis;
  const current = nodes.find((n) => n.q === 0 && n.r === 0);
  if (!current) return null;
  const inSight = nodes.filter((n) => n !== current && axialDist(n.q, n.r) <= SIGHT_RADIUS);
  const currentView = lookAroundNodeFor(current, true);
  return {
    currentNode: currentView,
    currentResources: currentView.resources.map((itemId, i) => ({
      itemId,
      quantity: 12 + Math.floor(hash2(i + 1, current.nodeId) * 60),
      initialQuantity: 80,
    })),
    groundItems: [],
    visible: inSight.map((n) => lookAroundNodeFor(n, false)),
    neighbours: nodes.filter((n) => axialDist(n.q, n.r) === 1).map((n) => n.nodeId),
    mounts: [],
  };
}

export const fixtureRelationships: Record<string, Relationships> = {
  artemis: {
    authority: 14,
    fame: 22,
    entries: [
      { agentId: 'cassia', agentName: 'Cassia', score: 42, lastChangedAtTick: fixtureStats.tick - 12 },
      { agentId: 'orin',   agentName: 'Orin',   score: 18, lastChangedAtTick: fixtureStats.tick - 320 },
      { agentId: 'warg-3a', agentName: null,    score: -28, lastChangedAtTick: fixtureStats.tick - 9 },
      { agentId: 'myrr',   agentName: 'Myrr',   score: 3, lastChangedAtTick: fixtureStats.tick - 1100 },
    ],
  },
  baldur: {
    authority: 2,
    fame: 0,
    entries: [
      { agentId: 'artemis', agentName: 'Artemis', score: 12, lastChangedAtTick: fixtureStats.tick - 600 },
    ],
  },
  cassia: {
    authority: 38,
    fame: 91,
    entries: [
      { agentId: 'artemis', agentName: 'Artemis', score: 42, lastChangedAtTick: fixtureStats.tick - 12 },
      { agentId: 'warg-3a', agentName: null,      score: -55, lastChangedAtTick: fixtureStats.tick - 4 },
      { agentId: 'orin',    agentName: 'Orin',    score: 21, lastChangedAtTick: fixtureStats.tick - 410 },
    ],
  },
};

// Seed event history (newest last). Stream handler keeps incrementing seq.
export const fixtureEvents: Record<string, AgentEvent[]> = {
  artemis: [
    { id: 'evt_a1', seq: 1, type: 'agent.spawned', tick: fixtureStats.tick - 4000, payload: { node: 142078 } },
    { id: 'evt_a2', seq: 2, type: 'agent.moved',   tick: fixtureStats.tick - 30,   payload: { from: 142067, to: 142078 } },
    { id: 'evt_a3', seq: 3, type: 'inventory.changed', tick: fixtureStats.tick - 15, payload: { itemId: 'ore_iron', delta: 3 } },
  ],
  baldur: [
    { id: 'evt_b1', seq: 1, type: 'agent.spawned', tick: fixtureStats.tick - 9000, payload: { node: 142066 } },
  ],
  cassia: [
    { id: 'evt_c1', seq: 1, type: 'agent.spawned', tick: fixtureStats.tick - 8000, payload: { node: 142077 } },
    { id: 'evt_c2', seq: 2, type: 'agent.moved',   tick: fixtureStats.tick - 220,  payload: { from: 142078, to: 142077 } },
    { id: 'evt_c3', seq: 3, type: 'relationship.changed', tick: fixtureStats.tick - 4, payload: { agentId: 'warg-3a', delta: -3 } },
  ],
};

// Counter used by the SSE handler to mint new seq numbers per agent.
export const eventSeqCounters: Record<string, number> = Object.fromEntries(
  Object.entries(fixtureEvents).map(([id, evs]) => [id, evs.length ? evs[evs.length - 1].seq : 0]),
);
