// Mirror of the Genesara engine REST surface.
// Server is the authority for these shapes — when they change there,
// they change here.

// ── Enums ────────────────────────────────────────────────────────────────────

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type EquipSlot =
  | 'HELMET' | 'CHEST' | 'PANTS' | 'BOOTS' | 'GLOVES'
  | 'AMULET' | 'RING_LEFT' | 'RING_RIGHT'
  | 'BRACELET_LEFT' | 'BRACELET_RIGHT'
  | 'MAIN_HAND' | 'OFF_HAND';

export type ItemCategory = 'RESOURCE' | 'EQUIPMENT' | 'KEY';

export type SkillCategory =
  | 'GATHERING' | 'CRAFTING' | 'COMBAT' | 'ATHLETICS' | 'SURVIVAL'
  | 'KNOWLEDGE' | 'STEALTH' | 'SOCIAL' | 'ANIMAL' | 'CLASS_LOCKED';

export type AgentClass =
  | 'SOLDIER' | 'HEAVY_SOLDIER' | 'STEALTH_SOLDIER' | 'COMMANDER'
  | 'SCOUT'   | 'RANGER'        | 'SNIPER'          | 'PATHFINDER'
  | 'HUNTER'  | 'BEASTMASTER'   | 'TRAPPER'         | 'POACHER'
  | 'ARTISAN' | 'SMITH'         | 'CHEF'            | 'JEWELER'
  | 'ENGINEER'| 'TECHNICIAN'    | 'ARTILLERIST'     | 'ARCHITECT'
  | 'MEDIC'   | 'SURGEON'       | 'APOTHECARY'      | 'FIELD_MEDIC'
  | 'MERCHANT'| 'NEGOTIATOR'    | 'SMUGGLER'        | 'CARAVAN_MASTER'
  | 'RESEARCHER' | 'SCHOLAR'    | 'ALCHEMIST'       | 'NATURALIST';

export type Terrain =
  | 'FOREST' | 'BIRCH_FOREST' | 'RAINFOREST' | 'PLAINS' | 'MEADOW' | 'HILLS'
  | 'DESERT' | 'SALT_FLATS' | 'ICE_TUNDRA' | 'GLACIER' | 'VOLCANIC'
  | 'COASTAL' | 'RIVER_DELTA' | 'WETLANDS' | 'SWAMP' | 'OCEAN'
  | 'MOUNTAIN' | 'ALPINE' | 'CLIFFSIDE' | 'CANYON'
  | 'ANCIENT_RUINS' | 'CURSED_LAND' | 'SACRED_GROVE' | 'CRYSTAL_CAVES' | 'BLIGHTED'
  | 'FOREST_EDGE' | 'FOOTHILLS' | 'SHORELINE'
  | 'DIRT_PATH' | 'GRAVEL_ROAD' | 'WOODEN_BRIDGE' | 'STONE_BRIDGE' | 'TRADE_ROUTE';

export type Biome =
  | 'FOREST' | 'PLAINS' | 'MOUNTAIN' | 'COASTAL'
  | 'SWAMP'  | 'RUINS'  | 'DESERT'   | 'TUNDRA' | 'OCEAN';

// ── Stats / detail ──────────────────────────────────────────────────────────

export interface Pool {
  current: number;
  max: number;
}

// Back-compat alias — AgentCard.tsx and AgentDetailPage.tsx still import Gauge.
export type Gauge = Pool;

export interface AgentGauges {
  hp: Pool;
  stamina: Pool;
  mana: Pool;
  hunger: Pool;
  thirst: Pool;
  sleep: Pool;
}

export interface PublicStats {
  tick: number;
  tickIntervalMs: number;
  onlineAgents: number;
  totalAgents: number;
}

export interface AgentSummary {
  agentId: string;
  name: string;
  classId: AgentClass | null;
  race: string;
  level: number;
  xpCurrent: number;
  xpToNext: number;
  gauges: AgentGauges | null;
  locationNodeId: number | null;
  spawned: boolean;
  lastActiveAt: string | null;
}

// Back-compat alias — AgentCard.tsx, mocks, and existing imports.
export type Agent = AgentSummary;

export interface AgentAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  perception: number;
  intelligence: number;
  luck: number;
}

export interface AgentDetail {
  agentId: string;
  name: string;
  race: string;
  classId: AgentClass | null;
  level: number;
  xp: { current: number; toNext: number };
  attributes: AgentAttributes;
  unspentAttributePoints: number;
  gauges: AgentGauges | null;
  location: number | null;
  safeNode: number | null;
  tick: number;
  authority: number;
  fame: number;
  pendingClassChoice: AgentClass[];
  pendingEvolutionChoice: AgentClass[];
}

// ── Skills ──────────────────────────────────────────────────────────────────

export interface SkillEntry {
  id: string;
  displayName: string;
  category: SkillCategory;
  xp: number;
  level: number;
  recommendCount: number;
}

export interface Skills {
  slotCount: number;
  slotsFilled: number;
  slots: { slotIndex: number; skill: SkillEntry | null }[];
  unslotted: SkillEntry[];
  chosenPerks: { skillId: string; milestone: number; perkId: string }[];
  pendingPerkChoices: { skillId: string; milestone: number; options: string[] }[];
}

// ── Inventory / loadout ─────────────────────────────────────────────────────

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  rarity: Rarity;
}

export interface EquipmentInstance {
  instanceId: string;
  itemId: string;
  category: ItemCategory;
  rarity: Rarity;
  durabilityCurrent: number;
  durabilityMax: number;
  creatorAgentId: string | null;
}

export interface ItemInstance {
  instanceId: string;
  itemId: string;
  category: ItemCategory;
  rarity: Rarity;
  gateInstanceId?: string;
}

export interface Loadout {
  stackable: InventoryEntry[];
  instances: ItemInstance[];
  equipment: {
    slots: { slotId: EquipSlot; instance: EquipmentInstance | null }[];
    stash: EquipmentInstance[];
  };
}

// ── Map / relationships / events ────────────────────────────────────────────

export interface RecalledNode {
  nodeId: number;
  regionId: number;
  q: number;
  r: number;
  terrain: Terrain;
  biome: Biome | null;
  firstSeenTick: number;
  lastSeenTick: number;
}

export interface RelationshipEntry {
  agentId: string;
  agentName: string | null;
  score: number;
  lastChangedAtTick: number;
}

export interface Relationships {
  authority: number;
  fame: number;
  entries: RelationshipEntry[];
}

export interface AgentEvent {
  id: string;
  seq: number;
  type: string;
  tick: number;
  payload: unknown;
}

// ── Auth responses ──────────────────────────────────────────────────────────

export interface RegisterResponse {
  playerId: string;
  apiToken: string;
  // The engine returns `token` on register too per the brief; older mocks
  // may not include it, so it's optional.
  token?: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiTokenResponse {
  apiToken: string;
}

export interface CreateAgentResponse {
  agentId: string;
}

// ── RFC 7807 ────────────────────────────────────────────────────────────────

export interface ProblemFieldError {
  field: string;
  message: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ProblemFieldError[];
}
