import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  type Group,
  type InstancedMesh,
  type Mesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { TERRAIN_GLB, type FogAnchor } from './terrain';

// Fog of war: semi-transparent KayKit cloud banks hovering over the
// unexplored hexes that border the recalled map, so the edge of the agent's
// knowledge reads as rolling fog rather than tiles floating in darkness.
// Two instanced draws (small/big clouds); the whole layer breathes slowly.

const _obj = new Object3D();
const noRaycast: Mesh['raycast'] = () => {};

function CloudLayer({
  geometry,
  material,
  anchors,
  size,
}: {
  geometry: Mesh['geometry'];
  material: MeshStandardMaterial;
  anchors: FogAnchor[];
  size: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    anchors.forEach((a, i) => {
      // seed-derived jitter keeps the bank from reading as a hex grid
      const j1 = a.seed - 0.5;
      const j2 = ((a.seed * 7919) % 1) - 0.5;
      _obj.position.set(
        a.x + j1 * 0.6 * size,
        (0.55 + a.seed * 0.35) * size,
        a.z + j2 * 0.6 * size,
      );
      _obj.rotation.set(0, a.seed * Math.PI * 2, 0);
      _obj.scale.setScalar((0.45 + a.seed * 0.3) * size);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [anchors, size]);
  if (anchors.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, anchors.length]}
      dispose={null}
      raycast={noRaycast}
    />
  );
}

export function FogClouds({ anchors, size }: { anchors: FogAnchor[]; size: number }) {
  const { nodes } = useGLTF(TERRAIN_GLB);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#787f88',
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        roughness: 1,
      }),
    [],
  );
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.05 * size;
    }
  });
  const { small, big } = useMemo(() => {
    const small: FogAnchor[] = [];
    const big: FogAnchor[] = [];
    for (const a of anchors) (a.seed > 0.72 ? big : small).push(a);
    return { small, big };
  }, [anchors]);
  return (
    <group ref={group}>
      <CloudLayer
        geometry={(nodes.prop_cloud_small as Mesh).geometry}
        material={material}
        anchors={small}
        size={size}
      />
      <CloudLayer
        geometry={(nodes.prop_cloud_big as Mesh).geometry}
        material={material}
        anchors={big}
        size={size}
      />
    </group>
  );
}
