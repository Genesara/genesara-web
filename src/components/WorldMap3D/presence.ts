import type { AgentPresence, BuildingSummary, LookAround, NpcPresence } from '@/api/types';

// View model for the live look-around overlay, keyed by nodeId. Built once
// per poll and consumed by both the 3D presence layer and the hover tooltip.
export interface NodePresence {
  npcs: NpcPresence[];
  agents: AgentPresence[];
  buildings: BuildingSummary[];
  resources: string[]; // item ids (sight-range contract: no quantities)
  /** itemId → quantity, current node only. */
  quantities: Map<string, number> | null;
  isCurrent: boolean;
}

export function buildPresence(la: LookAround | null | undefined): Map<number, NodePresence> {
  const out = new Map<number, NodePresence>();
  if (!la) return out;
  out.set(la.currentNode.id, {
    npcs: la.currentNode.npcs,
    agents: la.currentNode.agents,
    buildings: la.currentNode.buildings,
    resources: la.currentNode.resources,
    quantities: new Map(la.currentResources.map((r) => [r.itemId, r.quantity])),
    isCurrent: true,
  });
  for (const n of la.visible) {
    out.set(n.id, {
      npcs: n.npcs,
      agents: n.agents,
      buildings: n.buildings,
      resources: n.resources,
      quantities: null,
      isCurrent: false,
    });
  }
  return out;
}

export function buildingLabel(b: BuildingSummary): string {
  const name = b.type.toLowerCase().replace(/_/g, ' ');
  if (b.status === 'UNDER_CONSTRUCTION') {
    const progress =
      b.progressSteps != null && b.totalSteps != null ? ` ${b.progressSteps}/${b.totalSteps}` : '';
    return `${name} (building${progress})`;
  }
  if (b.type === 'GATE' && b.isOpen != null) return `${name} (${b.isOpen ? 'open' : 'closed'})`;
  if (b.plantedCrop) return `${name} (${b.plantedCrop.toLowerCase()})`;
  return name;
}

// Item id → prop mesh in terrain.glb. Anything unmapped renders as a crate.
const RESOURCE_PROP: Record<string, string> = {
  WOOD: 'resource_lumber',
  PLANK: 'resource_lumber',
  STONE: 'resource_stone',
  ORE: 'resource_stone',
  COAL: 'resource_stone',
  GOLD: 'resource_stone',
  GEM: 'resource_stone',
  CLAY: 'resource_stone',
  SAND: 'resource_stone',
  SALT: 'resource_stone',
  PEAT: 'resource_stone',
  BERRY: 'sack',
  HERB: 'sack',
  MUSHROOM: 'sack',
  FIBER: 'sack',
  FISH: 'sack',
  WHEAT: 'sack',
  POTATO: 'sack',
  TOMATO: 'sack',
  CORN: 'sack',
};

export function resourcePropFor(itemId: string): string {
  return RESOURCE_PROP[itemId] ?? 'crate_A_small';
}

export function resourceLabel(itemId: string): string {
  return itemId.toLowerCase().replace(/_/g, ' ');
}
