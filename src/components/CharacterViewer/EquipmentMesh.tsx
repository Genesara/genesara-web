import type { EquipSlot, EquipmentInstance } from '@/api/types';
import { RARITY_TINT } from './rarityMaterial';
import { SOCKET_ANCHOR } from './anchors';

interface Props {
  slot: EquipSlot;
  instance: EquipmentInstance | null;
}

// Procedural placeholder mesh for one equipment slot.
// Mounted whenever the slot is occupied OR empty (slot-default rule).
// Different slot kinds get different procedural silhouettes so the
// composition reads correctly even before authored GLBs land.
export function EquipmentMesh({ slot, instance }: Props) {
  const anchor = SOCKET_ANCHOR[slot];
  const rarity = instance?.rarity ?? 'COMMON';
  const tint = RARITY_TINT[rarity];
  const isDefault = !instance;
  const color = isDefault ? '#3F3A33' : tint.color;
  const metalness = isDefault ? 0.1 : tint.metalness;
  const roughness = isDefault ? 0.8 : tint.roughness;

  return (
    <group position={anchor}>
      <SlotShape slot={slot} color={color} metalness={metalness} roughness={roughness} />
    </group>
  );
}

function SlotShape({
  slot,
  color,
  metalness,
  roughness,
}: {
  slot: EquipSlot;
  color: string;
  metalness: number;
  roughness: number;
}) {
  const material = (
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  );

  switch (slot) {
    case 'HELMET':
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          {material}
        </mesh>
      );
    case 'CHEST':
      return (
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.22, 0.5, 16, 1, true]} />
          {material}
        </mesh>
      );
    case 'PANTS':
      return (
        <mesh castShadow>
          <cylinderGeometry args={[0.21, 0.18, 0.5, 14, 1, true]} />
          {material}
        </mesh>
      );
    case 'BOOTS':
      return (
        <group>
          <mesh position={[-0.08, 0, 0.02]} castShadow>
            <boxGeometry args={[0.11, 0.1, 0.22]} />
            {material}
          </mesh>
          <mesh position={[0.08, 0, 0.02]} castShadow>
            <boxGeometry args={[0.11, 0.1, 0.22]} />
            {material}
          </mesh>
        </group>
      );
    case 'GLOVES':
      return (
        <group>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.14, 0.08]} />
            {material}
          </mesh>
          <mesh position={[-0.66, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.14, 0.08]} />
            {material}
          </mesh>
        </group>
      );
    case 'AMULET':
      return (
        <mesh castShadow>
          <torusGeometry args={[0.05, 0.012, 12, 24]} />
          {material}
        </mesh>
      );
    case 'RING_LEFT':
    case 'RING_RIGHT':
      return (
        <mesh castShadow>
          <torusGeometry args={[0.018, 0.005, 8, 16]} />
          {material}
        </mesh>
      );
    case 'BRACELET_LEFT':
    case 'BRACELET_RIGHT':
      return (
        <mesh castShadow>
          <torusGeometry args={[0.045, 0.008, 10, 24]} />
          {material}
        </mesh>
      );
    case 'MAIN_HAND':
      return (
        <group rotation={[0, 0, -0.3]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.03, 0.6, 0.012]} />
            {material}
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.12, 0.025, 0.02]} />
            {material}
          </mesh>
        </group>
      );
    case 'OFF_HAND':
      return (
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.025, 20]} />
          {material}
        </mesh>
      );
  }
}
