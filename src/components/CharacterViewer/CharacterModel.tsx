import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { EquipmentInstance, EquipSlot, Loadout } from '@/api/types';
import type { Appearance } from '@/3d/types';
import { BODY_DIM, CHEST_Y, HEAD_R, HEAD_Y, HIP_Y, FOOT_Y } from './anchors';
import { EquipmentMesh } from './EquipmentMesh';

const EQUIP_SLOTS: EquipSlot[] = [
  'HELMET', 'CHEST', 'PANTS', 'BOOTS', 'GLOVES',
  'AMULET', 'RING_LEFT', 'RING_RIGHT',
  'BRACELET_LEFT', 'BRACELET_RIGHT',
  'MAIN_HAND', 'OFF_HAND',
];

interface Props {
  appearance: Appearance;
  loadout: Loadout | null;
}

// Procedural placeholder character body.
// Body shape from appearance.bodyShape; head + hair coloured from PRNG;
// equipment slots mounted via EquipmentMesh — keyed by slotId+itemId so
// changes between polls trigger React's snap-swap reactivity.
//
// When real GLBs ship, this component swaps to drei's useGLTF for body +
// head + hair, and EquipmentMesh attaches via SkeletonUtils + bone-parenting.
export function CharacterModel({ appearance, loadout }: Props) {
  const dim = BODY_DIM[appearance.bodyShape];
  const idleRef = useRef<Group>(null);

  // Idle breathing/sway: gentle chest expansion + micro-rotation.
  // Stand-in until the Mixamo idle clip is loaded.
  useFrame((state) => {
    if (!idleRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 1.4) * 0.012;
    const sway = Math.sin(t * 0.6) * 0.015;
    idleRef.current.scale.y = breathe;
    idleRef.current.rotation.z = sway;
  });

  const slotIndex = useMemo(() => {
    const idx: Partial<Record<EquipSlot, EquipmentInstance>> = {};
    if (!loadout) return idx;
    for (const s of loadout.equipment.slots) {
      if (s.instance) idx[s.slotId] = s.instance;
    }
    return idx;
  }, [loadout]);

  return (
    <group scale={[1, appearance.heightScale, 1]}>
      <group ref={idleRef}>
        {/* Body — torso + hips */}
        <mesh position={[0, CHEST_Y, 0]} castShadow>
          <cylinderGeometry args={[dim.chestR, dim.hipR, 0.65, 18, 1, false]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Hips */}
        <mesh position={[0, HIP_Y, 0]} castShadow>
          <cylinderGeometry args={[dim.hipR, dim.hipR * 0.9, 0.16, 16]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.08, (HIP_Y + FOOT_Y) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, HIP_Y - FOOT_Y, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0.08, (HIP_Y + FOOT_Y) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, HIP_Y - FOOT_Y, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.32, 1.18, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.7, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0.32, 1.18, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.7, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.08, 12]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Head */}
        <mesh position={[0, HEAD_Y, 0]} castShadow>
          <sphereGeometry args={[HEAD_R, 24, 18]} />
          <meshStandardMaterial color={appearance.skinColor} roughness={0.78} metalness={0.02} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.035, HEAD_Y + 0.01, HEAD_R * 0.85]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color={appearance.eyeColor} roughness={0.3} />
        </mesh>
        <mesh position={[0.035, HEAD_Y + 0.01, HEAD_R * 0.85]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color={appearance.eyeColor} roughness={0.3} />
        </mesh>
        {/* Hair — variant-indexed skullcap silhouette */}
        <HairPlaceholder appearance={appearance} />

        {/* Equipment — keyed by slot+itemId so snap-swap triggers on poll changes */}
        {EQUIP_SLOTS.map((slot) => {
          const instance = slotIndex[slot] ?? null;
          const key = `${slot}:${instance?.itemId ?? '__default__'}`;
          return <EquipmentMesh key={key} slot={slot} instance={instance} />;
        })}
      </group>
    </group>
  );
}

function HairPlaceholder({ appearance }: { appearance: Appearance }) {
  const variant = appearance.hairIndex % 9;
  const material = (
    <meshStandardMaterial color={appearance.hairColor} roughness={0.7} metalness={0.05} />
  );

  // Bald
  if (variant === 0) return null;

  // Skullcap (short)
  if (variant === 1 || variant === 2) {
    return (
      <mesh position={[0, HEAD_Y + 0.02, 0]} castShadow>
        <sphereGeometry args={[HEAD_R + 0.012, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {material}
      </mesh>
    );
  }

  // Medium with side fringe
  if (variant === 3 || variant === 4) {
    return (
      <group>
        <mesh position={[0, HEAD_Y + 0.025, 0]} castShadow>
          <sphereGeometry args={[HEAD_R + 0.015, 22, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          {material}
        </mesh>
      </group>
    );
  }

  // Long hair
  if (variant === 5 || variant === 6) {
    return (
      <group>
        <mesh position={[0, HEAD_Y + 0.02, 0]} castShadow>
          <sphereGeometry args={[HEAD_R + 0.018, 24, 18, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
          {material}
        </mesh>
        <mesh position={[0, HEAD_Y - 0.08, -0.04]} castShadow>
          <boxGeometry args={[HEAD_R * 2.1, 0.22, 0.06]} />
          {material}
        </mesh>
      </group>
    );
  }

  // Topknot
  return (
    <group>
      <mesh position={[0, HEAD_Y + 0.01, 0]} castShadow>
        <sphereGeometry args={[HEAD_R + 0.008, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
        {material}
      </mesh>
      <mesh position={[0, HEAD_Y + HEAD_R + 0.04, 0]} castShadow>
        <sphereGeometry args={[0.035, 12, 10]} />
        {material}
      </mesh>
    </group>
  );
}
