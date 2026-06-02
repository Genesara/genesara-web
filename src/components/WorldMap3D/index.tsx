import { memo, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Color, type Mesh } from 'three';
import type { RecalledNode, Terrain } from '@/api/types';
import { detectWebGL } from '../CharacterViewer/webgl';
import { axialToWorld, terrainColor, terrainElevation, terrainLabel } from './terrain';

interface Props {
  nodes: RecalledNode[];
  currentNode: number | null;
  tick: number;
  loading?: boolean;
}

const FIT_RADIUS = 5.5;
const SCALE_MIN = 0.25;
const SCALE_MAX = 2.2;
const FADE_INTO = new Color('#15161a');
const ACCENT = '#c8a35e';

interface TileData {
  node: RecalledNode;
  x: number;
  z: number;
  height: number;
  size: number;
  color: Color;
  colorHex: string;
  isCurrent: boolean;
}

interface Layout {
  tiles: TileData[];
  scale: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Centre the recalled nodes on the origin and scale the whole grid to a fixed
// radius so a single static camera always frames it, regardless of how much the
// agent has explored. Tile colour fades toward the background with sighting age.
function useLayout(nodes: RecalledNode[], currentNode: number | null, tick: number): Layout {
  return useMemo(() => {
    if (nodes.length === 0) return { tiles: [], scale: 1 };

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
      const color = new Color(terrainColor(n.terrain)).lerp(FADE_INTO, 0.5 * (1 - freshness));
      const elev = terrainElevation(n.terrain);
      return {
        node: n,
        x: (x - cx) * scale,
        z: (z - cz) * scale,
        height: scale * (0.22 + elev * 0.95),
        size: scale,
        color,
        colorHex: `#${color.getHexString()}`,
        isCurrent: currentNode != null && n.nodeId === currentNode,
      };
    });

    return { tiles, scale };
  }, [nodes, currentNode, tick]);
}

type HoverFn = (node: RecalledNode | null, ev?: PointerEvent) => void;

function HexTile({ tile, onHover }: { tile: TileData; onHover: HoverFn }) {
  const r = tile.size * 0.92;
  return (
    <mesh
      position={[tile.x, tile.height / 2, tile.z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(tile.node, e.nativeEvent);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(tile.node, e.nativeEvent);
      }}
      onPointerOut={() => onHover(null)}
    >
      <cylinderGeometry args={[r, r, tile.height, 6]} />
      <meshStandardMaterial color={tile.color} roughness={0.92} metalness={0.04} flatShading />
    </mesh>
  );
}

// Pulsing pin + ground ring over the agent's current node.
function CurrentMarker({ tile }: { tile: TileData }) {
  const pin = useRef<Mesh>(null);
  useFrame((state) => {
    if (!pin.current) return;
    const t = state.clock.elapsedTime;
    pin.current.position.y = tile.height + tile.size * (0.55 + Math.sin(t * 2.4) * 0.08);
  });
  const s = tile.size;
  return (
    <group position={[tile.x, 0, tile.z]}>
      <mesh ref={pin} position={[0, tile.height + s * 0.55, 0]} rotation={[Math.PI, 0, 0]}>
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

function Scene({ layout, onHover }: { layout: Layout; onHover: HoverFn }) {
  const current = layout.tiles.find((t) => t.isCurrent);
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cfcabe', '#0E0F12', 0.4]} />
      <directionalLight position={[4, 9, 5]} intensity={0.9} color="#E8E5DE" />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color={ACCENT} />

      {/* Catch-plane so gaps read as backdrop, not see-through. */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#0a0b0d" />
      </mesh>

      <group>
        {layout.tiles.map((tile) => (
          <HexTile key={tile.node.nodeId} tile={tile} onHover={onHover} />
        ))}
        {current && <CurrentMarker tile={current} />}
      </group>

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

function WorldMap3DImpl({ nodes, currentNode, tick, loading }: Props) {
  const webglOk = useMemo(() => detectWebGL(), []);
  const layout = useLayout(nodes, currentNode, tick);
  const [hover, setHover] = useState<{ node: RecalledNode; x: number; y: number } | null>(null);

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
          camera={{ position: [0, 9.2, 6.0], fov: 38, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          style={{ background: 'transparent' }}
        >
          <Scene layout={layout} onHover={onHover} />
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
