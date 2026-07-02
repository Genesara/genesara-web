import { useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import {
  Color,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
  type Mesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { TERRAIN_TINTED_PROPS, WATER_TERRAIN, type PlacedProp } from './decorations';
import {
  MEMORY_FADE_COLOR,
  TERRAIN_GLB,
  TILE_RADIUS_K,
  type HoverFn,
  type TileData,
} from './terrain';

// KayKit Medieval Hexagon Pack geometry (see scripts/prep-terrain.mjs).
// Tiles render as two instanced draws (land prism, sunken water tile) with
// per-instance terrain tint; props render as one instanced draw per prop
// type with the original KayKit atlas. Draw calls stay constant no matter
// how many nodes the agent has recalled.
useGLTF.preload(TERRAIN_GLB);

const _obj = new Object3D();
const _color = new Color();
const WHITE = new Color('#ffffff');
const FADE = new Color(MEMORY_FADE_COLOR);

// Props are scenery — only tiles answer the pointer, so the tooltip always
// describes the node, never a tree canopy in front of it.
const noRaycast: Mesh['raycast'] = () => {};

function TileLayer({
  tiles,
  geometry,
  material,
  onHover,
}: {
  tiles: TileData[];
  geometry: BufferGeometry;
  material: Material;
  onHover: HoverFn;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    tiles.forEach((t, i) => {
      const r = t.size * TILE_RADIUS_K;
      // Geometry top sits at y=0 with a unit-deep skirt, so translating to
      // the tile height and y-scaling by the same lands the base at y=0.
      _obj.position.set(t.x, t.height, t.z);
      _obj.rotation.set(0, 0, 0);
      _obj.scale.set(r, t.height, r);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      mesh.setColorAt(i, t.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tiles]);

  const hoverAt = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const tile = e.instanceId != null ? tiles[e.instanceId] : undefined;
    if (tile) onHover(tile.node, e.nativeEvent);
  };

  if (tiles.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, tiles.length]}
      dispose={null}
      castShadow
      receiveShadow
      onPointerOver={hoverAt}
      onPointerMove={hoverAt}
      onPointerOut={() => onHover(null)}
    />
  );
}

export function TerrainTiles({ tiles, onHover }: { tiles: TileData[]; onHover: HoverFn }) {
  const { nodes } = useGLTF(TERRAIN_GLB);
  const landMat = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.9, metalness: 0.05 }),
    [],
  );
  // Faint self-glow keeps water readable in the dark cockpit — at scene
  // light levels a purely lit deep-blue tile collapses to near-black.
  const waterMat = useMemo(
    () =>
      new MeshStandardMaterial({
        roughness: 0.2,
        emissive: '#16283c',
        emissiveIntensity: 0.5,
      }),
    [],
  );

  const { land, water } = useMemo(() => {
    const land: TileData[] = [];
    const water: TileData[] = [];
    for (const t of tiles) (WATER_TERRAIN.has(t.node.terrain) ? water : land).push(t);
    return { land, water };
  }, [tiles]);

  return (
    <>
      <TileLayer
        tiles={land}
        geometry={(nodes.tile_land as Mesh).geometry}
        material={landMat}
        onHover={onHover}
      />
      <TileLayer
        tiles={water}
        geometry={(nodes.tile_water as Mesh).geometry}
        material={waterMat}
        onHover={onHover}
      />
    </>
  );
}

function PropLayer({
  geometry,
  material,
  list,
  terrainTinted,
}: {
  geometry: BufferGeometry;
  material: Material;
  list: PlacedProp[];
  terrainTinted: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    list.forEach((p, i) => {
      _obj.position.set(p.x, p.y, p.z);
      _obj.rotation.set(0, p.rotation, 0);
      _obj.scale.setScalar(p.scale);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      // Terrain-tinted props carry the tile color (fade already baked in);
      // atlas props keep their authored colors and only fade with age.
      if (terrainTinted) mesh.setColorAt(i, _color.set(p.tileColor));
      else mesh.setColorAt(i, _color.copy(WHITE).lerp(FADE, p.fade));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [list, terrainTinted]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, list.length]}
      dispose={null}
      castShadow
      receiveShadow
      raycast={noRaycast}
    />
  );
}

export function TerrainProps({ placements }: { placements: PlacedProp[] }) {
  const { nodes, materials } = useGLTF(TERRAIN_GLB);
  const plainMat = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.92, metalness: 0.04 }),
    [],
  );
  const groups = useMemo(() => {
    const byProp = new Map<string, PlacedProp[]>();
    for (const p of placements) {
      const list = byProp.get(p.prop);
      if (list) list.push(p);
      else byProp.set(p.prop, [p]);
    }
    return [...byProp.entries()];
  }, [placements]);

  return (
    <>
      {groups.map(([prop, list]) => {
        const terrainTinted = TERRAIN_TINTED_PROPS.has(prop);
        return (
          <PropLayer
            key={prop}
            geometry={(nodes[`prop_${prop}`] as Mesh).geometry}
            material={terrainTinted ? plainMat : materials.atlas}
            list={list}
            terrainTinted={terrainTinted}
          />
        );
      })}
    </>
  );
}
