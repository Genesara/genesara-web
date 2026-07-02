import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Mesh } from 'three';
import type { AgentPresence, BuildingSummary, Loadout, NpcPresence } from '@/api/types';
import { deriveAppearance } from '@/3d/appearance';
import { GlbCharacter } from '../CharacterViewer/GlbCharacter';
import { hasCenterpiece } from './decorations';
import { resourcePropFor, type NodePresence } from './presence';
import { AXIAL_NEIGHBOURS, TERRAIN_GLB, TILE_RADIUS_K, type TileData } from './terrain';

// Live look-around overlay: KayKit resource piles, NPC totems colored by
// aggression, and miniature GlbCharacter figures for agents — the same
// rigged, idle-animated model the character viewer panel renders, scaled to
// the tile and stood on a base disc (gold = the player's own agent).
// Everything sits on the tile's flat top; counts are capped per tile — the
// full lists live in the tooltip. Scenery only: no raycast, so the tile
// underneath keeps answering the pointer.

const ACCENT = '#c8a35e';
const PAPER = '#cfcabe';

// Aggression → totem color, from the terrain palette (no new tokens).
const NPC_COLOR: Record<string, { color: string; emissive: number }> = {
  HOSTILE: { color: '#7a4a32', emissive: 0.5 },
  TERRITORIAL: { color: '#c8a35e', emissive: 0.18 },
  PASSIVE: { color: '#8f897a', emissive: 0 },
};

const noRaycast: Mesh['raycast'] = () => {};

// Deterministic per-node angle so markers don't jump between polls.
function baseAngle(nodeId: number): number {
  return ((nodeId * 2654435761) % 360) * (Math.PI / 180);
}

function ResourcePiles({ tile, items }: { tile: TileData; items: string[] }) {
  const { nodes, materials } = useGLTF(TERRAIN_GLB);
  const r = tile.size;
  const a0 = baseAngle(tile.node.nodeId);
  return (
    <>
      {items.slice(0, 3).map((itemId, i) => {
        const prop = resourcePropFor(itemId);
        const geo = (nodes[`prop_${prop}`] as Mesh | undefined)?.geometry;
        if (!geo) return null;
        const a = a0 + i * 0.55;
        const scale = r * (prop === 'sack' ? 1.5 : 1);
        return (
          <mesh
            key={itemId}
            geometry={geo}
            material={materials.atlas}
            position={[tile.x + 0.68 * r * Math.cos(a), tile.height, tile.z + 0.68 * r * Math.sin(a)]}
            rotation={[0, a0 + i, 0]}
            scale={scale}
            castShadow
            receiveShadow
            raycast={noRaycast}
          />
        );
      })}
    </>
  );
}

// Engine BuildingType → terrain.glb mesh. WOODEN_WALL / GATE / CAMPFIRE are
// composed in code instead (palisade ring, gate piece, rock ring + flame).
const BUILDING_MODEL: Record<string, string> = {
  SHELTER: 'bld_home_A',
  SMOKEHOUSE: 'bld_home_B',
  FORGE: 'bld_blacksmith',
  WORKBENCH: 'bld_lumbermill',
  ALCHEMY_TABLE: 'bld_church',
  BREWERY: 'bld_tavern',
  TRADING_POST: 'bld_market',
  WATCHTOWER: 'bld_tower_A',
  STABLE: 'bld_barracks',
  MINE: 'bld_mine',
  WELL: 'bld_well',
  FARM_PLOT: 'bld_grain',
  ROAD: 'bld_dirt',
  BRIDGE: 'bld_bridge',
  STORAGE_CHEST: 'prop_crate_A_big',
};

// KayKit construction-stage models, picked by build progress. Adjacent tiles
// carry no progress (fog-of-war) — they sit at the middle stage.
function stageModel(b: BuildingSummary): string {
  const frac =
    b.progressSteps != null && b.totalSteps ? b.progressSteps / b.totalSteps : 0.5;
  return frac < 0.34 ? 'bld_stage_A' : frac < 0.67 ? 'bld_stage_B' : 'bld_stage_C';
}

// Fences stretch a touch past their edge so perimeter segments of adjacent
// walled tiles visually join across the inter-tile gap.
const FENCE_OVERLAP = 1.08;

// Wooden palisade for WOODEN_WALL / GATE nodes, region-aware: walled tiles
// that touch merge into one compound. An edge gets a fence only when the
// neighbour across it is NOT walled (a perimeter edge) — shared interior
// edges render nothing, so a ring of walled tiles reads as a single
// enclosure instead of six self-fenced cells. The gate's doorway lands on a
// perimeter edge of its tile (preferring the camera-facing one): door piece
// + stubs while closed, stubs with a passable gap while open.
function PalisadeRing({
  tile,
  gate,
  walled,
}: {
  tile: TileData;
  gate: BuildingSummary | undefined;
  walled: Set<string>;
}) {
  const { nodes, materials } = useGLTF(TERRAIN_GLB);
  const fenceGeo = (nodes.bld_fence as Mesh).geometry;
  const gateGeo = (nodes.bld_fence_gate as Mesh).geometry;
  const R = tile.size * TILE_RADIUS_K;

  const { q, r } = tile.node;
  const perimeter: number[] = [];
  for (let k = 0; k < 6; k++) {
    const [dq, dr] = AXIAL_NEIGHBOURS[k];
    if (!walled.has(`${q + dq},${r + dr}`)) perimeter.push(k);
  }
  // k=1 → edge normal at 90° = +z, toward the camera.
  const gateEdge = gate ? (perimeter.includes(1) ? 1 : perimeter[0]) : undefined;

  // KayKit authored the fence pieces already sitting on the +z hex edge
  // (z ≈ 0.87, one apothem from the origin), so every piece anchors at the
  // TILE CENTRE and a yaw of π/2 − θ swings it onto the edge whose midpoint
  // sits at angle θ. Local +x stays the edge tangent.
  const segments = [];
  for (const k of perimeter) {
    const theta = Math.PI / 6 + (Math.PI / 3) * k;
    const yaw = Math.PI / 2 - theta;
    if (k === gateEdge && gate) {
      segments.push(
        <group key="gate-edge" position={[tile.x, tile.height, tile.z]} rotation={[0, yaw, 0]}>
          {/* stubs leave a doorway; the door piece fills it while closed */}
          {[-1, 1].map((side) => (
            <mesh
              key={`stub-${side}`}
              geometry={fenceGeo}
              material={materials.atlas}
              position={[side * 0.32 * R, 0, 0]}
              scale={[0.36 * R, R, R]}
              castShadow
              raycast={noRaycast}
            />
          ))}
          {gate.isOpen !== true && (
            <mesh
              geometry={gateGeo}
              material={materials.atlas}
              scale={R}
              castShadow
              raycast={noRaycast}
            />
          )}
        </group>,
      );
    } else {
      segments.push(
        <mesh
          key={`fence-${k}`}
          geometry={fenceGeo}
          material={materials.atlas}
          position={[tile.x, tile.height, tile.z]}
          rotation={[0, yaw, 0]}
          scale={[FENCE_OVERLAP * R, R, R]}
          castShadow
          raycast={noRaycast}
        />,
      );
    }
  }
  return <>{segments}</>;
}

function Campfire({ x, y, z, size }: { x: number; y: number; z: number; size: number }) {
  const { nodes, materials } = useGLTF(TERRAIN_GLB);
  const rockGeo = (nodes.prop_rock_single_B as Mesh).geometry;
  const s = size;
  return (
    <group position={[x, y, z]} raycast={noRaycast}>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3;
        return (
          <mesh
            key={i}
            geometry={rockGeo}
            material={materials.atlas}
            position={[0.07 * s * Math.cos(a), 0, 0.07 * s * Math.sin(a)]}
            rotation={[0, a, 0]}
            scale={0.45 * s}
            castShadow
            raycast={noRaycast}
          />
        );
      })}
      <mesh position={[0, 0.07 * s, 0]} raycast={noRaycast}>
        <coneGeometry args={[0.045 * s, 0.13 * s, 5]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

// Building slots: first at the tile centre (pushed back on centerpiece
// tiles), the rest on the back-left arc — agent minis own the front.
const BUILDING_SLOTS: [number, number][] = [
  [0, -Math.PI / 2],
  [0.42, (5 * Math.PI) / 6],
  [0.42, (7 * Math.PI) / 6],
];

function Buildings({
  tile,
  buildings,
  walled,
}: {
  tile: TileData;
  buildings: BuildingSummary[];
  walled: Set<string>;
}) {
  const { nodes, materials } = useGLTF(TERRAIN_GLB);
  const wall = buildings.find((b) => b.type === 'WOODEN_WALL');
  const gate = buildings.find((b) => b.type === 'GATE');
  const campfire = buildings.find((b) => b.type === 'CAMPFIRE');
  const structures = buildings.filter(
    (b) => b.type !== 'WOODEN_WALL' && b.type !== 'GATE' && b.type !== 'CAMPFIRE',
  );
  const centered = hasCenterpiece(tile.node.terrain);
  const r = tile.size;
  return (
    <>
      {(wall || gate) && <PalisadeRing tile={tile} gate={gate} walled={walled} />}
      {campfire && (
        <Campfire
          x={tile.x + 0.4 * r * Math.cos(-Math.PI / 6)}
          y={tile.height}
          z={tile.z + 0.4 * r * Math.sin(-Math.PI / 6)}
          size={r}
        />
      )}
      {structures.slice(0, 3).map((b, i) => {
        const model =
          b.status === 'UNDER_CONSTRUCTION' ? stageModel(b) : BUILDING_MODEL[b.type];
        const geo = (nodes[model ?? 'bld_home_A'] as Mesh | undefined)?.geometry;
        if (!geo) return null;
        const [slotD, slotA] = BUILDING_SLOTS[i];
        const d = (i === 0 && centered ? 0.45 : slotD) * r;
        const scale = (structures.length > 1 ? 0.6 : 0.85) * r;
        return (
          <mesh
            key={`${b.type}:${i}`}
            geometry={geo}
            material={materials.atlas}
            position={[tile.x + d * Math.cos(slotA), tile.height, tile.z + d * Math.sin(slotA)]}
            rotation={[0, ((tile.node.nodeId + i) % 6) * (Math.PI / 3), 0]}
            scale={scale}
            castShadow
            receiveShadow
            raycast={noRaycast}
          />
        );
      })}
    </>
  );
}

function NpcTotems({ tile, npcs }: { tile: TileData; npcs: NpcPresence[] }) {
  const s = tile.size;
  const a0 = baseAngle(tile.node.nodeId) + Math.PI;
  return (
    <>
      {npcs.slice(0, 4).map((npc, i) => {
        const look = NPC_COLOR[npc.aggression] ?? NPC_COLOR.PASSIVE;
        const a = a0 + i * 0.45;
        return (
          <mesh
            key={npc.id}
            position={[
              tile.x + 0.5 * s * Math.cos(a),
              tile.height + 0.1 * s,
              tile.z + 0.5 * s * Math.sin(a),
            ]}
            castShadow
            raycast={noRaycast}
          >
            <coneGeometry args={[0.07 * s, 0.2 * s, 4]} />
            <meshStandardMaterial
              color={look.color}
              emissive={look.color}
              emissiveIntensity={look.emissive}
              roughness={0.55}
            />
          </mesh>
        );
      })}
    </>
  );
}

// The GlbCharacter group renders ~1.72 units tall (see FIGURE_HEIGHT there);
// scale it so a mini stands at ~0.8 of the tile pitch — reads like a unit
// figure next to the KayKit trees (~1.0) without towering over them.
const MINI_HEIGHT_K = 0.8 / 1.72;

function CharacterMini({
  agentId,
  race,
  loadout,
  x,
  y,
  z,
  size,
  yaw,
  own,
}: {
  agentId: string;
  race: string;
  loadout: Loadout | null;
  x: number;
  y: number;
  z: number;
  size: number;
  yaw: number;
  own: boolean;
}) {
  const appearance = useMemo(() => deriveAppearance(agentId, race), [agentId, race]);
  return (
    <group position={[x, y, z]} raycast={noRaycast}>
      {/* Tabletop-style base disc — ownership reads at any zoom. */}
      <mesh position={[0, 0.012 * size, 0]} raycast={noRaycast}>
        <cylinderGeometry args={[0.13 * size, 0.15 * size, 0.024 * size, 24]} />
        <meshStandardMaterial
          color={own ? ACCENT : PAPER}
          emissive={own ? ACCENT : '#000000'}
          emissiveIntensity={own ? 0.3 : 0}
          roughness={0.55}
        />
      </mesh>
      <group rotation={[0, yaw, 0]} scale={MINI_HEIGHT_K * size} position={[0, 0.024 * size, 0]}>
        <GlbCharacter appearance={appearance} loadout={loadout} />
      </group>
    </group>
  );
}

export interface OwnAgent {
  agentId: string;
  race: string;
  loadout: Loadout | null;
}

function AgentMinis({
  tile,
  agents,
  ownAgent,
}: {
  tile: TileData;
  agents: AgentPresence[];
  ownAgent: OwnAgent | null;
}) {
  // Centerpiece tiles (mountains, hills) push minis to the rim.
  const dist = (hasCenterpiece(tile.node.terrain) ? 0.62 : 0.38) * tile.size;
  return (
    <>
      {/* The player's own agent, standing in front of the marker ring,
          facing the camera — same model + equipment as the viewer panel. */}
      {tile.isCurrent && ownAgent && (
        <CharacterMini
          agentId={ownAgent.agentId}
          race={ownAgent.race}
          loadout={ownAgent.loadout}
          x={tile.x + dist * Math.cos(Math.PI / 2)}
          y={tile.height}
          z={tile.z + dist * Math.sin(Math.PI / 2)}
          size={tile.size}
          yaw={0}
          own
        />
      )}
      {agents.slice(0, 4).map((agent, i) => {
        const a = Math.PI / 2 + (i + 1) * 0.55;
        return (
          <CharacterMini
            key={agent.id}
            agentId={agent.id}
            race={agent.race}
            loadout={null}
            x={tile.x + dist * Math.cos(a)}
            y={tile.height}
            z={tile.z + dist * Math.sin(a)}
            size={tile.size}
            yaw={(i + 1) * 0.55 - Math.PI / 6}
            own={false}
          />
        );
      })}
    </>
  );
}

export function PresenceLayer({
  tiles,
  presence,
  ownAgent,
}: {
  tiles: TileData[];
  presence: Map<number, NodePresence>;
  ownAgent: OwnAgent | null;
}) {
  // Walled-region membership ("q,r" keys) — PalisadeRing unions adjacent
  // walled tiles into one compound by skipping shared interior edges.
  const walled = useMemo(() => {
    const set = new Set<string>();
    for (const t of tiles) {
      const p = presence.get(t.node.nodeId);
      if (p?.buildings.some((b) => b.type === 'WOODEN_WALL' || b.type === 'GATE')) {
        set.add(`${t.node.q},${t.node.r}`);
      }
    }
    return set;
  }, [tiles, presence]);

  return (
    <>
      {tiles.map((tile) => {
        const p = presence.get(tile.node.nodeId);
        if (!p && !tile.isCurrent) return null;
        return (
          <group key={tile.node.nodeId}>
            {p && p.buildings.length > 0 && (
              <Buildings tile={tile} buildings={p.buildings} walled={walled} />
            )}
            {p && p.resources.length > 0 && <ResourcePiles tile={tile} items={p.resources} />}
            {p && p.npcs.length > 0 && <NpcTotems tile={tile} npcs={p.npcs} />}
            {(tile.isCurrent || (p && p.agents.length > 0)) && (
              // Own Suspense: character GLBs are heavier than terrain.glb —
              // tiles and props must not blank while the rigs stream in.
              <Suspense fallback={null}>
                <AgentMinis tile={tile} agents={p?.agents ?? []} ownAgent={ownAgent} />
              </Suspense>
            )}
          </group>
        );
      })}
    </>
  );
}
