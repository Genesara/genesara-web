import type {
  Agent,
  AgentDetail,
  AgentEvent,
  InventoryEntry,
  Loadout,
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
    locationNodeId: 142078,
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
    location: 142078,
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

export const fixtureMap: Record<string, RecalledNode[]> = {
  artemis: [
    ring(142000, 0, 0, 'PLAINS', 'PLAINS'),
    ring(142000, 1, 0, 'HILLS', 'PLAINS'),
    ring(142000, -1, 0, 'FOREST_EDGE', 'FOREST'),
    ring(142000, 0, 1, 'MEADOW', 'PLAINS'),
    ring(142000, 0, -1, 'BIRCH_FOREST', 'FOREST'),
    ring(142000, 1, -1, 'FOOTHILLS', 'PLAINS'),
    ring(142000, -1, 1, 'DIRT_PATH', 'FOREST'),
  ],
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
