import { memo, Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Color, type Mesh } from 'three';
import type { LookAround, RecalledNode, Terrain } from '@/api/types';
import { detectWebGL } from '../CharacterViewer/webgl';
import {
  AXIAL_NEIGHBOURS,
  axialToWorld,
  MEMORY_FADE_COLOR,
  terrainColor,
  terrainElevation,
  terrainLabel,
  TILE_RADIUS_K,
  type FogAnchor,
  type HoverFn,
  type TileData,
} from './terrain';
import { placeProps } from './decorations';
import { TerrainProps, TerrainTiles } from './TerrainMeshes';
import { buildingLabel, buildPresence, resourceLabel } from './presence';
import { PresenceLayer, type OwnAgent } from './PresenceLayer';
import { FogClouds } from './FogClouds';

interface Props {
  nodes: RecalledNode[];
  currentNode: number | null;
  tick: number;
  loading?: boolean;
  /** Live look-around overlay (npcs, agents, resources) — optional. */
  surroundings?: LookAround | null;
  /** Renders the player's agent as a character mini on its tile. */
  ownAgent?: OwnAgent | null;
}

const FIT_RADIUS = 5.5;
const SCALE_MIN = 0.25;
const SCALE_MAX = 2.2;
const FADE_INTO = new Color(MEMORY_FADE_COLOR);
const ACCENT = '#c8a35e';

interface Layout {
  tiles: TileData[];
  scale: number;
  /** Unexplored hexes bordering the recall — fog-of-war cloud anchors. */
  fog: FogAnchor[];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Centre the recalled nodes on the origin and scale the whole grid to a fixed
// radius so a single static camera always frames it, regardless of how much the
// agent has explored. Tile colour fades toward the background with sighting age.
function useLayout(nodes: RecalledNode[], currentNode: number | null, tick: number): Layout {
  return useMemo(() => {
    if (nodes.length === 0) return { tiles: [], scale: 1, fog: [] };

    const raw = nodes.map((n) => {
      const [x, z] = axialToWorld(n.q, n.r, 1);
      return { n, x, z };
    });
    const cx = raw.reduce((s, p) => s + p.x, 0) / raw.length;
    const cz = raw.reduce((s, p) => s + p.z, 0) / raw.length;
    const maxDist = Math.max(
      1,
      ...raw.map((p) => Math.hypot(p.x - cx, p.z - cz)),
    );
    const scale = clamp(FIT_RADIUS / (maxDist + 1), SCALE_MIN, SCALE_MAX);

    const maxAge = Math.max(1, ...raw.map((p) => Math.max(0, tick - p.n.lastSeenTick)));

    const tiles: TileData[] = raw.map(({ n, x, z }) => {
      const age = Math.max(0, tick - n.lastSeenTick);
      const freshness = 1 - age / maxAge; // 1 = just seen, 0 = oldest memory
      const fade = 0.5 * (1 - freshness);
      const color = new Color(terrainColor(n.terrain)).lerp(FADE_INTO, fade);
      const elev = terrainElevation(n.terrain);
      return {
        node: n,
        x: (x - cx) * scale,
        z: (z - cz) * scale,
        height: scale * (0.22 + elev * 0.95),
        size: scale,
        color,
        colorHex: `#${color.getHexString()}`,
        fade,
        isCurrent: currentNode != null && n.nodeId === currentNode,
      };
    });

    // Fog-of-war frontier: every empty hex touching a recalled tile gets a
    // cloud anchor, so unexplored space reads as fog instead of darkness.
    const occupied = new Set(nodes.map((n) => `${n.q},${n.r}`));
    const fog: FogAnchor[] = [];
    for (const n of nodes) {
      for (const [dq, dr] of AXIAL_NEIGHBOURS) {
        const fq = n.q + dq;
        const fr = n.r + dr;
        const key = `${fq},${fr}`;
        if (occupied.has(key)) continue;
        occupied.add(key); // dedupe — one anchor per frontier hex
        const [ax, az] = axialToWorld(fq, fr, 1);
        const seed =
          (Math.imul((fq * 73856093) ^ (fr * 19349663), 2654435761) >>> 0) / 4294967296;
        fog.push({ x: (ax - cx) * scale, z: (az - cz) * scale, seed });
      }
    }

    return { tiles, scale, fog };
  }, [nodes, currentNode, tick]);
}

// Pulsing pin + ground ring over the agent's current node. `clearance`
// lifts the pin above whatever decoration sits on the tile (mountains,
// tree clusters) so it never spawns inside a prop.
function CurrentMarker({ tile, clearance }: { tile: TileData; clearance: number }) {
  const pin = useRef<Mesh>(null);
  const base = tile.height + clearance;
  useFrame((state) => {
    if (!pin.current) return;
    const t = state.clock.elapsedTime;
    pin.current.position.y = base + tile.size * (0.55 + Math.sin(t * 2.4) * 0.08);
  });
  const s = tile.size;
  return (
    <group position={[tile.x, 0, tile.z]}>
      <mesh ref={pin} position={[0, base + s * 0.55, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[s * 0.16, s * 0.36, 4]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, tile.height + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[s * 0.62, s * 0.78, 6]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function Scene({
  layout,
  presence,
  ownAgent,
  onHover,
}: {
  layout: Layout;
  presence: ReturnType<typeof buildPresence>;
  ownAgent: OwnAgent | null;
  onHover: HoverFn;
}) {
  const current = layout.tiles.find((t) => t.isCurrent);
  const propLayout = useMemo(
    () =>
      placeProps(
        layout.tiles.map((t) => ({
          nodeId: t.node.nodeId,
          terrain: t.node.terrain,
          x: t.x,
          z: t.z,
          height: t.height,
          radius: t.size * TILE_RADIUS_K,
          fade: t.fade,
          colorHex: t.colorHex,
        })),
      ),
    [layout.tiles],
  );
  return (
    <>
      {/* Warm key with soft shadows + paper-tone sky fill + gold rim; fog
          melts the far rim of the memory into the backdrop. */}
      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#d6d0c2', '#141210', 0.65]} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.6}
        color="#f3e9d4"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={2}
        shadow-camera-far={28}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.55} color={ACCENT} />
      <fog attach="fog" args={['#0a0b0d', 17, 40]} />

      {/* Catch-plane so gaps read as backdrop, not see-through. */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#0a0b0d" />
      </mesh>

      <Suspense fallback={null}>
        <TerrainTiles tiles={layout.tiles} onHover={onHover} />
        <TerrainProps placements={propLayout.placements} />
        <FogClouds anchors={layout.fog} size={layout.scale} />
        <PresenceLayer tiles={layout.tiles} presence={presence} ownAgent={ownAgent} />
        {current && (
          <CurrentMarker
            tile={current}
            clearance={Math.max(
              propLayout.clearanceByNode.get(current.node.nodeId) ?? 0,
              // Buildings on the current tile reach roughly a tile-pitch up;
              // float the pin above the rooflines.
              (presence.get(current.node.nodeId)?.buildings.some(
                (b) => b.type !== 'WOODEN_WALL' && b.type !== 'GATE' && b.type !== 'CAMPFIRE',
              )
                ? 0.9
                : 0) * current.size,
            )}
          />
        )}
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={5}
        maxDistance={26}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.15}
      />
    </>
  );
}

// Flat-top hexagon points for the no-WebGL SVG fallback.
function svgHexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function FallbackSvg({
  layout,
  currentNode,
  tick,
}: {
  layout: Layout;
  currentNode: number | null;
  tick: number;
}) {
  const k = 240 / FIT_RADIUS; // world units → svg px
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="500" fill="#0a0b0d" />
      {layout.tiles.map((t) => {
        const cx = 400 + t.x * k;
        const cy = 250 + t.z * k;
        const n = t.node;
        const isCur = currentNode != null && n.nodeId === currentNode;
        return (
          <polygon
            key={n.nodeId}
            points={svgHexPoints(cx, cy, t.size * k * 0.92)}
            fill={t.colorHex}
            stroke={isCur ? ACCENT : '#2B2A26'}
            strokeWidth={isCur ? 2 : 0.8}
          >
            <title>
              {`${terrainLabel(n.terrain)} · node.${n.nodeId} · region.${n.regionId} · q${n.q} r${n.r}` +
                `${n.biome ? ' · ' + n.biome.toLowerCase() : ''}` +
                ` · seen ${Math.max(0, tick - n.lastSeenTick).toLocaleString()} ticks ago` +
                ` · discovered tick ${n.firstSeenTick.toLocaleString()}` +
                `${isCur ? ' · you are here' : ''}`}
            </title>
          </polygon>
        );
      })}
    </svg>
  );
}

function WorldMap3DImpl({ nodes, currentNode, tick, loading, surroundings, ownAgent }: Props) {
  const webglOk = useMemo(() => detectWebGL(), []);
  const layout = useLayout(nodes, currentNode, tick);
  const presence = useMemo(() => buildPresence(surroundings), [surroundings]);
  const [hover, setHover] = useState<{ node: RecalledNode; x: number; y: number } | null>(null);
  const hoverPresence = hover ? presence.get(hover.node.nodeId) : undefined;

  const onHover: HoverFn = (node, ev) => {
    if (!node || !ev) return setHover(null);
    setHover({ node, x: ev.offsetX, y: ev.offsetY });
  };

  // Terrains present, most-common first, capped for a tidy legend.
  const legend = useMemo(() => {
    const counts = new Map<Terrain, number>();
    for (const n of nodes) counts.set(n.terrain, (counts.get(n.terrain) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([t]) => t);
  }, [nodes]);

  if (loading && nodes.length === 0) {
    return (
      <div className="world-canvas">
        <div className="world-empty">recalling terrain…</div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="world-canvas">
        <div className="world-empty">
          no terrain recalled yet
          <span>this agent hasn't explored — its map memory is empty</span>
        </div>
      </div>
    );
  }

  return (
    <div className="world-canvas" onMouseLeave={() => setHover(null)}>
      {webglOk ? (
        <Canvas
          shadows
          camera={{ position: [0, 9.2, 6.0], fov: 38, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          style={{ background: 'transparent' }}
        >
          <Scene layout={layout} presence={presence} ownAgent={ownAgent ?? null} onHover={onHover} />
        </Canvas>
      ) : (
        <FallbackSvg layout={layout} currentNode={currentNode} tick={tick} />
      )}

      <div className="world-legend">
        {legend.map((t) => (
          <span className="item" key={t}>
            <span className="swatch" style={{ background: terrainColor(t) }} />
            {terrainLabel(t)}
          </span>
        ))}
        <span className="item">
          <span className="swatch" style={{ background: ACCENT, borderColor: ACCENT }} />
          current
        </span>
      </div>

      <div
        className={`world-tip${hover ? ' show' : ''}`}
        style={hover ? { left: hover.x, top: hover.y } : undefined}
      >
        {hover && (
          <>
            <div className="terrain">{terrainLabel(hover.node.terrain)}</div>
            <div className="coord">
              node.{hover.node.nodeId} · region.{hover.node.regionId} · q{hover.node.q} r
              {hover.node.r}
              {hover.node.biome ? ` · ${hover.node.biome.toLowerCase()}` : ''}
            </div>
            <div className="agents">
              seen {Math.max(0, tick - hover.node.lastSeenTick).toLocaleString()} ticks ago ·
              discovered tick {hover.node.firstSeenTick.toLocaleString()}
              {hover.node.nodeId === currentNode ? ' · you are here' : ''}
            </div>
            {hoverPresence && hoverPresence.buildings.length > 0 && (
              <div className="coord">
                buildings: {hoverPresence.buildings.map(buildingLabel).join(', ')}
              </div>
            )}
            {hoverPresence && hoverPresence.resources.length > 0 && (
              <div className="coord">
                resources:{' '}
                {hoverPresence.resources
                  .map((id) => {
                    const qty = hoverPresence.quantities?.get(id);
                    return qty != null ? `${resourceLabel(id)} ×${qty}` : resourceLabel(id);
                  })
                  .join(', ')}
              </div>
            )}
            {hoverPresence && hoverPresence.npcs.length > 0 && (
              <div className="coord">
                npcs:{' '}
                {hoverPresence.npcs
                  .map((n) => `${n.displayName.toLowerCase()} (${n.aggression.toLowerCase()})`)
                  .join(', ')}
              </div>
            )}
            {hoverPresence && hoverPresence.agents.length > 0 && (
              <div className="coord">
                agents:{' '}
                {hoverPresence.agents.map((a) => `${a.name.toLowerCase()} lv.${a.level}`).join(', ')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Memoised: the cockpit re-renders on every poll/SSE tick and on every
// floating-window drag frame; props here are referentially stable between
// those, so memo keeps the WebGL scene from re-reconciling needlessly.
export const WorldMap3D = memo(WorldMap3DImpl);
