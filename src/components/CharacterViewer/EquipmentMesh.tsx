import { useMemo } from 'react';
import { LatheGeometry, Vector2 } from 'three';
import type { EquipSlot, EquipmentInstance } from '@/api/types';
import { RARITY_TINT } from './rarityMaterial';
import { slotAnchor, type Skeleton, type Vec3 } from './anchors';
import { Bone } from './limbGeometry';

interface Props {
  slot: EquipSlot;
  instance: EquipmentInstance;
  skel: Skeleton;
}

// Procedural equipment for one OCCUPIED slot. Each piece is shaped + placed to
// sit ON the corresponding body part, tracking the skeleton's body params so a
// broader agent gets a broader chest plate. Empty slots render nothing — the
// caller (CharacterModel) skips unoccupied slots entirely, so the bare body
// shows. Rarity drives the tint (rarityMaterial.ts).
export function EquipmentMesh({ slot, instance, skel }: Props) {
  const tint = RARITY_TINT[instance.rarity];

  const mat = (
    <meshStandardMaterial color={tint.color} metalness={tint.metalness} roughness={tint.roughness} />
  );

  return (
    <SlotShape
      slot={slot}
      itemId={instance.itemId}
      skel={skel}
      mat={mat}
      color={tint.color}
      metalness={tint.metalness}
      roughness={tint.roughness}
    />
  );
}

// Weapon silhouette inferred from the itemId so a longbow reads as a bow, a
// cudgel as a club, etc. Falls back to a generic blade.
type WeaponKind = 'bow' | 'blade' | 'dagger' | 'cudgel' | 'staff';
function weaponKind(itemId: string): WeaponKind {
  const id = itemId.toLowerCase();
  if (id.includes('bow')) return 'bow';
  if (id.includes('dagger') || id.includes('knife')) return 'dagger';
  if (id.includes('cudgel') || id.includes('club') || id.includes('mace') || id.includes('hammer')) return 'cudgel';
  if (id.includes('staff') || id.includes('spear') || id.includes('wand')) return 'staff';
  return 'blade';
}

function SlotShape({
  slot,
  itemId,
  skel,
  mat,
  color,
  metalness,
  roughness,
}: {
  slot: EquipSlot;
  itemId: string;
  skel: Skeleton;
  mat: React.ReactNode;
  color: string;
  metalness: number;
  roughness: number;
}) {
  const u = skel.headUnit;

  switch (slot) {
    case 'HELMET':
      return <Helmet skel={skel} mat={mat} u={u} />;

    case 'CHEST':
      return <Cuirass skel={skel} color={color} metalness={metalness} roughness={roughness} u={u} />;

    case 'PANTS':
      return (
        <group>
          <LegWrap a={skel.hipL.pos} b={midpoint(skel.kneeL.pos, skel.ankleL.pos, 0.35)} rTop={skel.hipL.r} rBot={skel.kneeL.r} mat={mat} />
          <LegWrap a={skel.hipR.pos} b={midpoint(skel.kneeR.pos, skel.ankleR.pos, 0.35)} rTop={skel.hipR.r} rBot={skel.kneeR.r} mat={mat} />
          {/* belt across the hips */}
          <Bone a={[skel.pelvis.pos[0] - skel.hipHalfW, skel.pelvis.pos[1], 0]} b={[skel.pelvis.pos[0] + skel.hipHalfW, skel.pelvis.pos[1], 0]} rA={u * 0.12}>
            {mat}
          </Bone>
        </group>
      );

    case 'BOOTS':
      return (
        <group>
          <Boot ankle={skel.ankleL.pos} knee={skel.kneeL.pos} foot={skel.footL} r={skel.ankleL.r} u={u} mat={mat} />
          <Boot ankle={skel.ankleR.pos} knee={skel.kneeR.pos} foot={skel.footR} r={skel.ankleR.r} u={u} mat={mat} />
        </group>
      );

    case 'GLOVES':
      return (
        <group>
          <Gauntlet hand={skel.handL} wrist={skel.wristL.pos} r={skel.wristL.r} mat={mat} />
          <Gauntlet hand={skel.handR} wrist={skel.wristR.pos} r={skel.wristR.r} mat={mat} />
        </group>
      );

    case 'AMULET': {
      const a = slotAnchor(skel, 'AMULET');
      const chainTop: Vec3 = [skel.neck.pos[0], skel.neck.pos[1] + u * 0.05, skel.headRZ * 0.35];
      return (
        <group>
          <Bone a={chainTop} b={a} rA={u * 0.012}>{mat}</Bone>
          <mesh position={a} castShadow>
            <sphereGeometry args={[u * 0.12, 16, 14]} />
            {mat}
          </mesh>
        </group>
      );
    }

    case 'RING_LEFT':
    case 'RING_RIGHT': {
      const a = slotAnchor(skel, slot);
      return (
        <mesh position={[a[0], a[1] - u * 0.18, a[2]]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[skel.wristL.r * 0.7, u * 0.015, 8, 18]} />
          {mat}
        </mesh>
      );
    }

    case 'BRACELET_LEFT':
    case 'BRACELET_RIGHT': {
      const forearm = slot === 'BRACELET_LEFT' ? skel.forearmMidL : skel.forearmMidR;
      const wrist = slot === 'BRACELET_LEFT' ? skel.wristL : skel.wristR;
      const elbow = slot === 'BRACELET_LEFT' ? skel.elbowL : skel.elbowR;
      // band wrapping the forearm, oriented along it
      return (
        <Bone a={midpoint(forearm, elbow.pos, 0.25)} b={midpoint(forearm, wrist.pos, 0.25)} rA={wrist.r * 1.25}>
          {mat}
        </Bone>
      );
    }

    case 'MAIN_HAND':
      return <MainHand skel={skel} mat={mat} u={u} kind={weaponKind(itemId)} />;

    case 'OFF_HAND': {
      const kind = weaponKind(itemId);
      // A bladed off-hand (dagger/knife) is held; anything else reads as a shield.
      if (kind === 'dagger' || kind === 'blade') {
        return <OffHandBlade skel={skel} mat={mat} u={u} />;
      }
      return <OffHandShield skel={skel} mat={mat} u={u} />;
    }
  }
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function Helmet({ skel, mat, u }: { skel: Skeleton; mat: React.ReactNode; u: number }) {
  const c = skel.headCenter;
  return (
    <group position={c}>
      {/* dome capping the cranium, flush */}
      <mesh scale={[skel.headRX * 1.1, skel.headRZ * 1.12, skel.headRZ * 1.1]} castShadow>
        <sphereGeometry args={[1, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        {mat}
      </mesh>
      {/* brim */}
      <mesh position={[0, skel.headRZ * 0.16, skel.headRZ * 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[skel.headRX * 0.95, u * 0.05, 10, 24, Math.PI * 1.15]} />
        {mat}
      </mesh>
    </group>
  );
}

// Cuirass / coat: a lathed shell that follows the chest→waist taper, flattened
// front-to-back like the torso, slightly larger so it sits over the body.
function Cuirass({
  skel, color, metalness, roughness, u,
}: { skel: Skeleton; color: string; metalness: number; roughness: number; u: number }) {
  const geo = useMemo(() => {
    const yShoulder = skel.shoulderL.pos[1];
    const yChest = skel.chest.pos[1];
    const yWaist = skel.waist.pos[1];
    const yHip = skel.pelvis.pos[1] + 0.1 * u;
    const pad = 1.12;
    const pts: Vector2[] = [
      new Vector2(skel.hipHalfW * 0.85 * pad, yHip),
      new Vector2(skel.waist.r * pad, yWaist),
      new Vector2(skel.chest.r * pad, yChest),
      new Vector2(skel.chest.r * 0.92 * pad, yChest + 0.32 * u),
      new Vector2(skel.shoulderL.pos[0] * -0.5, yShoulder),
      new Vector2(0.001, yShoulder + 0.02 * u),
    ];
    return new LatheGeometry(pts, 26, 0, Math.PI * 2);
  }, [skel, u]);

  return (
    <mesh geometry={geo} scale={[1.04, 1, 0.66]} position={[skel.chest.pos[0], 0, 0]} castShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} side={2} />
    </mesh>
  );
}

// Leg covering wrapping a thigh→shin segment, tapered.
function LegWrap({
  a, b, rTop, rBot, mat,
}: { a: Vec3; b: Vec3; rTop: number; rBot: number; mat: React.ReactNode }) {
  return <Bone a={a} b={b} rA={rTop * 1.12} rB={rBot * 1.12}>{mat}</Bone>;
}

// Boot: shaft over the lower shin + a foot shell pointing forward.
function Boot({
  ankle, knee, foot, r, u, mat,
}: { ankle: Vec3; knee: Vec3; foot: Vec3; r: number; u: number; mat: React.ReactNode }) {
  const shaftTop = midpoint(ankle, knee, 0.42);
  return (
    <group>
      <Bone a={shaftTop} b={ankle} rA={r * 1.25} rB={r * 1.35}>{mat}</Bone>
      {/* foot shell */}
      <group position={foot}>
        <mesh position={[0, 0, u * 0.17]} scale={[r * 1.55, r * 1.15, u * 0.6]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
          {mat}
        </mesh>
        <mesh position={[0, 0, -u * 0.05]} scale={[r * 1.45, r * 1.25, r * 1.45]} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
          {mat}
        </mesh>
      </group>
    </group>
  );
}

// Gauntlet covering the hand + wrist.
function Gauntlet({ hand, wrist, r, mat }: { hand: Vec3; wrist: Vec3; r: number; mat: React.ReactNode }) {
  return (
    <group>
      <Bone a={wrist} b={hand} rA={r * 1.3} rB={r * 1.5}>{mat}</Bone>
      <mesh position={hand} scale={[r * 1.8, r * 2.4, r * 1.0]} castShadow>
        <sphereGeometry args={[1, 14, 12]} />
        {mat}
      </mesh>
    </group>
  );
}

// Weapon gripped in the right hand. Silhouette chosen from the item kind so a
// longbow reads as a bow, a cudgel as a club, a blade as a sword.
function MainHand({ skel, mat, u, kind }: { skel: Skeleton; mat: React.ReactNode; u: number; kind: WeaponKind }) {
  const hand = skel.handR;

  if (kind === 'bow') {
    // Tall D-shaped bow held vertically through the fist, string on the inside.
    return (
      <group position={hand} rotation={[0, 0, 0.12]}>
        {/* the stave: an open torus arc curving away from the body */}
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[u * 1.5, u * 0.05, 8, 40, Math.PI * 1.05]} />
          {mat}
        </mesh>
        {/* bowstring: a thin straight line across the open side */}
        <mesh position={[u * 0.02, 0, 0]} castShadow>
          <cylinderGeometry args={[u * 0.012, u * 0.012, u * 2.55, 6]} />
          <meshStandardMaterial color="#D8CBB0" metalness={0.0} roughness={0.8} />
        </mesh>
        {/* grip wrap */}
        <mesh castShadow>
          <cylinderGeometry args={[u * 0.07, u * 0.07, u * 0.34, 10]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (kind === 'cudgel') {
    return (
      <group position={hand} rotation={[0.25, 0, -0.22]}>
        <mesh position={[0, u * 0.5, 0]} castShadow>
          <cylinderGeometry args={[u * 0.08, u * 0.06, u * 1.4, 12]} />
          {mat}
        </mesh>
        <mesh position={[0, u * 1.2, 0]} castShadow>
          <sphereGeometry args={[u * 0.22, 14, 12]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (kind === 'staff') {
    return (
      <group position={hand} rotation={[0.1, 0, -0.1]}>
        <mesh position={[0, u * 0.8, 0]} castShadow>
          <cylinderGeometry args={[u * 0.05, u * 0.05, u * 2.6, 10]} />
          {mat}
        </mesh>
      </group>
    );
  }

  // blade or dagger — sword silhouette; dagger is shorter.
  const bladeLen = kind === 'dagger' ? u * 0.8 : u * 1.5;
  return (
    <group position={hand} rotation={[0.2, 0, -0.25]}>
      <mesh castShadow>
        <cylinderGeometry args={[u * 0.05, u * 0.05, u * 0.42, 12]} />
        {mat}
      </mesh>
      {/* cross-guard */}
      <mesh position={[0, u * 0.24, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[u * 0.028, u * 0.028, u * 0.32, 8]} />
        {mat}
      </mesh>
      {/* blade */}
      <mesh position={[0, u * 0.26 + bladeLen * 0.5, 0]} scale={[1, 1, 0.32]} castShadow>
        <coneGeometry args={[u * 0.1, bladeLen, 4]} />
        {mat}
      </mesh>
      {/* pommel */}
      <mesh position={[0, -u * 0.24, 0]} castShadow>
        <sphereGeometry args={[u * 0.06, 12, 10]} />
        {mat}
      </mesh>
    </group>
  );
}

// Off-hand bladed weapon (dagger/knife) held in the left hand.
function OffHandBlade({ skel, mat, u }: { skel: Skeleton; mat: React.ReactNode; u: number }) {
  const hand = skel.handL;
  return (
    <group position={hand} rotation={[0.25, 0, 0.22]}>
      <mesh castShadow>
        <cylinderGeometry args={[u * 0.045, u * 0.045, u * 0.3, 10]} />
        {mat}
      </mesh>
      <mesh position={[0, u * 0.17, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[u * 0.022, u * 0.022, u * 0.22, 8]} />
        {mat}
      </mesh>
      <mesh position={[0, u * 0.55, 0]} scale={[1, 1, 0.3]} castShadow>
        <coneGeometry args={[u * 0.08, u * 0.7, 4]} />
        {mat}
      </mesh>
    </group>
  );
}

// Off-hand round buckler/shield carried at the left hand.
function OffHandShield({ skel, mat, u }: { skel: Skeleton; mat: React.ReactNode; u: number }) {
  const hand = skel.handL;
  return (
    <group position={[hand[0] - u * 0.06, hand[1] + u * 0.12, hand[2] + u * 0.12]} rotation={[0, -0.5, 0]}>
      <mesh castShadow scale={[1, 1, 0.22]}>
        <sphereGeometry args={[u * 0.5, 24, 16]} />
        {mat}
      </mesh>
      {/* boss */}
      <mesh position={[0, 0, u * 0.1]} castShadow scale={[1, 1, 0.5]}>
        <sphereGeometry args={[u * 0.13, 14, 12]} />
        {mat}
      </mesh>
    </group>
  );
}

function midpoint(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
