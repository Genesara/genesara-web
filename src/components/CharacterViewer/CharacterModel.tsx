import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { LatheGeometry, Vector2, type Group } from 'three';
import type { EquipmentInstance, EquipSlot, Loadout } from '@/api/types';
import type { Appearance } from '@/3d/types';
import { buildSkeleton, type Skeleton, type Vec3 } from './anchors';
import { Bone, JointBall } from './limbGeometry';
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

// Parametric procedural human. Proportions come from buildSkeleton(appearance)
// in the ~7.5-head canon; every form is driven by the seeded build params so
// the same agentId always yields the same figure, and two agents differ.
//
// When real GLBs ship, this swaps to drei's useGLTF for body/head/hair and
// EquipmentMesh attaches via SkeletonUtils bone-parenting (SOCKET_BY_SLOT).
export function CharacterModel({ appearance, loadout }: Props) {
  const skel = useMemo(() => buildSkeleton(appearance), [appearance]);
  const idleRef = useRef<Group>(null);

  // Idle breathing/sway: gentle chest expansion + micro-rotation about the feet.
  useFrame((state) => {
    if (!idleRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 1.4) * 0.01;
    const sway = Math.sin(t * 0.6) * 0.012;
    idleRef.current.scale.set(1, breathe, 1);
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
    // Pivot at the feet so breathing/sway rotates the figure naturally.
    <group ref={idleRef}>
      <Body skel={skel} appearance={appearance} />

      {/* Equipment renders only when a slot is occupied (bare body otherwise).
          Keyed by slot+itemId so a poll swap re-mounts the piece. */}
      {EQUIP_SLOTS.map((slot) => {
        const instance = slotIndex[slot];
        if (!instance) return null;
        return (
          <EquipmentMesh
            key={`${slot}:${instance.itemId}`}
            slot={slot}
            instance={instance}
            skel={skel}
          />
        );
      })}
    </group>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────

function Body({ skel, appearance }: { skel: Skeleton; appearance: Appearance }) {
  const skin = appearance.skinColor;

  const skinMat = (
    <meshStandardMaterial color={skin} roughness={0.72} metalness={0.02} />
  );
  // helper to spread a fresh skin material into each mesh
  const Skin = () => <meshStandardMaterial color={skin} roughness={0.72} metalness={0.02} />;

  return (
    <group>
      {/* Torso: continuous lathed silhouette (shoulders → chest → waist → hips). */}
      <Torso skel={skel} color={skin} />

      {/* Neck */}
      <Bone a={[skel.neck.pos[0], skel.chest.pos[1] + skel.headUnit * 0.45, 0]} b={skel.neck.pos} rA={skel.neck.r * 1.0} rB={skel.neck.r * 0.95}>
        <Skin />
      </Bone>

      {/* Head */}
      <Head skel={skel} appearance={appearance} />

      {/* Arms: upper + forearm with joint balls. Slight elbow bend baked into
          the skeleton via the elbow drift. */}
      <Arm side="L" skel={skel} render={skinMat} />
      <Arm side="R" skel={skel} render={skinMat} />

      {/* Legs */}
      <Leg side="L" skel={skel} render={skinMat} />
      <Leg side="R" skel={skel} render={skinMat} />
    </group>
  );
}

// Lathed torso: traces the body profile so chest is wider than waist, with a
// pelvis flare. Smooth-shaded for a continuous read.
function Torso({ skel, color }: { skel: Skeleton; color: string }) {
  const geo = useMemo(() => {
    const u = skel.headUnit;
    const yShoulder = skel.shoulderL.pos[1];
    const yChest = skel.chest.pos[1];
    const yWaist = skel.waist.pos[1];
    const yHip = skel.pelvis.pos[1];
    const yCrotch = yHip - 0.55 * u;
    // profile radius is the average of front/side half-widths (lathe is round;
    // a non-uniform group scale below flattens it front-to-back into a torso).
    const pts: Vector2[] = [
      new Vector2(0.001, yCrotch - 0.02 * u),
      new Vector2(skel.hipHalfW * 0.7, yCrotch),
      new Vector2(skel.hipHalfW * 0.92, yHip),
      new Vector2(skel.waist.r * 1.04, yWaist + 0.18 * u),
      new Vector2(skel.waist.r, yWaist),
      new Vector2(skel.chest.r * 0.96, yChest - 0.12 * u),
      new Vector2(skel.chest.r, yChest),
      new Vector2(skel.chest.r * 0.9, yChest + 0.3 * u),
      new Vector2(skel.shoulderL.pos[0] * -0.62, yShoulder - 0.05 * u),
      new Vector2(skel.shoulderL.pos[0] * -0.30, yShoulder + 0.06 * u),
      new Vector2(0.001, yShoulder + 0.1 * u),
    ];
    return new LatheGeometry(pts, 28);
  }, [skel]);

  // Flatten front-to-back so the torso reads as a person, not a barrel.
  return (
    <mesh geometry={geo} scale={[1, 1, 0.62]} castShadow position={[skel.chest.pos[0], 0, 0]}>
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.02} />
    </mesh>
  );
}

function Head({ skel, appearance }: { skel: Skeleton; appearance: Appearance }) {
  const c = skel.headCenter;
  const u = skel.headUnit;
  const skin = appearance.skinColor;
  const Skin = () => <meshStandardMaterial color={skin} roughness={0.72} metalness={0.02} />;
  // jaw 0..1 → chin sharpness; angular jaw = narrower, longer chin.
  const jaw = skel.jaw;
  const faceZ = skel.headRZ * 0.9;

  return (
    <group position={c}>
      {/* Cranium: ellipsoid, slightly taller than wide. */}
      <mesh castShadow scale={[skel.headRX, skel.headRZ * 1.04, skel.headRZ]}>
        <sphereGeometry args={[1, 28, 22]} />
        <Skin />
      </mesh>
      {/* Jaw / chin: a downward taper blended under the cranium. */}
      <mesh
        position={[0, -skel.headRZ * (0.5 + jaw * 0.12), skel.headRZ * 0.06]}
        scale={[skel.headRX * (0.82 - jaw * 0.12), skel.headRZ * (0.6 + jaw * 0.2), skel.headRZ * 0.9]}
        castShadow
      >
        <sphereGeometry args={[1, 22, 18]} />
        <Skin />
      </mesh>
      {/* Brow ridge — subtle landmark across the upper face. */}
      <mesh position={[0, skel.headRZ * 0.16, faceZ * 0.74]} scale={[skel.headRX * 0.82, u * 0.07, u * 0.06]}>
        <sphereGeometry args={[1, 16, 10]} />
        <Skin />
      </mesh>
      {/* Nose */}
      <mesh position={[0, -skel.headRZ * 0.02, faceZ * 0.92]} rotation={[0.5, 0, 0]} castShadow>
        <coneGeometry args={[u * 0.07, u * 0.2, 8]} />
        <Skin />
      </mesh>
      {/* Eyes set into sockets. */}
      <Eye x={-skel.headRX * 0.42} y={skel.headRZ * 0.04} z={faceZ * 0.7} u={u} color={appearance.eyeColor} skin={skin} />
      <Eye x={skel.headRX * 0.42} y={skel.headRZ * 0.04} z={faceZ * 0.7} u={u} color={appearance.eyeColor} skin={skin} />

      <Hair skel={skel} color={appearance.hairColor} variant={appearance.hairIndex % 9} />
    </group>
  );
}

function Eye({ x, y, z, u, color, skin }: { x: number; y: number; z: number; u: number; color: string; skin: string }) {
  return (
    <group position={[x, y, z]}>
      {/* socket recess */}
      <mesh position={[0, 0, -u * 0.02]} scale={[u * 0.12, u * 0.08, u * 0.04]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={skin} roughness={0.8} metalness={0.0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[u * 0.06, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.05} />
      </mesh>
    </group>
  );
}

// Fitted hair sitting flush on the cranium. Variants 0..8 keyed off hairIndex.
function Hair({ skel, color, variant }: { skel: Skeleton; color: string; variant: number }) {
  const u = skel.headUnit;
  const rx = skel.headRX;
  const ry = skel.headRZ * 1.04;
  const rz = skel.headRZ;
  const Mat = () => <meshStandardMaterial color={color} roughness={0.62} metalness={0.06} />;

  // Bald
  if (variant === 0) {
    return (
      <mesh position={[0, ry * 0.42, -rz * 0.05]} scale={[rx * 1.02, ry * 0.6, rz * 1.02]} castShadow>
        <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <Mat />
      </mesh>
    );
  }

  // Short crop — skullcap hugging the top + back.
  if (variant === 1 || variant === 2) {
    return (
      <mesh position={[0, ry * 0.06, -rz * 0.04]} scale={[rx * 1.05, ry * 1.05, rz * 1.06]} castShadow>
        <sphereGeometry args={[1, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <Mat />
      </mesh>
    );
  }

  // Medium — covers down past the ears with a back mass.
  if (variant === 3 || variant === 4) {
    return (
      <group>
        <mesh position={[0, -ry * 0.04, -rz * 0.04]} scale={[rx * 1.07, ry * 1.07, rz * 1.08]} castShadow>
          <sphereGeometry args={[1, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.74]} />
          <Mat />
        </mesh>
        <mesh position={[0, -ry * 0.35, -rz * 0.42]} scale={[rx * 0.95, ry * 0.5, rz * 0.55]} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
          <Mat />
        </mesh>
      </group>
    );
  }

  // Long — a flowing back length.
  if (variant === 5 || variant === 6) {
    return (
      <group>
        <mesh position={[0, -ry * 0.05, -rz * 0.05]} scale={[rx * 1.08, ry * 1.08, rz * 1.1]} castShadow>
          <sphereGeometry args={[1, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.78]} />
          <Mat />
        </mesh>
        <mesh position={[0, -ry * 0.9, -rz * 0.5]} scale={[rx * 0.92, ry * 1.1, rz * 0.4]} castShadow>
          <sphereGeometry args={[1, 18, 16]} />
          <Mat />
        </mesh>
      </group>
    );
  }

  // Topknot / tied-back.
  if (variant === 7) {
    return (
      <group>
        <mesh position={[0, ry * 0.04, -rz * 0.04]} scale={[rx * 1.04, ry * 1.04, rz * 1.05]} castShadow>
          <sphereGeometry args={[1, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <Mat />
        </mesh>
        <mesh position={[0, ry * 1.02, -rz * 0.2]} castShadow>
          <sphereGeometry args={[u * 0.18, 14, 12]} />
          <Mat />
        </mesh>
      </group>
    );
  }

  // Curly / voluminous.
  return (
    <group>
      <mesh position={[0, ry * 0.12, -rz * 0.05]} scale={[rx * 1.18, ry * 1.16, rz * 1.18]} castShadow>
        <sphereGeometry args={[1, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <Mat />
      </mesh>
      <mesh position={[-rx * 0.7, ry * 0.1, -rz * 0.2]} scale={[rx * 0.5, ry * 0.5, rz * 0.5]} castShadow>
        <sphereGeometry args={[1, 14, 12]} />
        <Mat />
      </mesh>
      <mesh position={[rx * 0.7, ry * 0.1, -rz * 0.2]} scale={[rx * 0.5, ry * 0.5, rz * 0.5]} castShadow>
        <sphereGeometry args={[1, 14, 12]} />
        <Mat />
      </mesh>
    </group>
  );
}

// ── Limbs ───────────────────────────────────────────────────────────────────

function Arm({ side, skel, render }: { side: 'L' | 'R'; skel: Skeleton; render: React.ReactNode }) {
  const shoulder = side === 'L' ? skel.shoulderL : skel.shoulderR;
  const elbow = side === 'L' ? skel.elbowL : skel.elbowR;
  const wrist = side === 'L' ? skel.wristL : skel.wristR;
  const hand = side === 'L' ? skel.handL : skel.handR;
  const matKey = () => render;

  return (
    <group>
      <JointBall at={shoulder.pos} r={shoulder.r}>{matKey()}</JointBall>
      <Bone a={shoulder.pos} b={elbow.pos} rA={shoulder.r * 0.85} rB={elbow.r}>{matKey()}</Bone>
      <JointBall at={elbow.pos} r={elbow.r}>{matKey()}</JointBall>
      <Bone a={elbow.pos} b={wrist.pos} rA={elbow.r * 0.92} rB={wrist.r}>{matKey()}</Bone>
      <Hand at={hand} r={wrist.r}>{matKey()}</Hand>
    </group>
  );
}

// Tapered palm mass + a hint of fingers, oriented down the forearm.
function Hand({ at, r, children }: { at: Vec3; r: number; children: React.ReactNode }) {
  return (
    <group position={at}>
      <mesh scale={[r * 1.6, r * 2.2, r * 0.85]} castShadow>
        <sphereGeometry args={[1, 14, 12]} />
        {children}
      </mesh>
      {/* fingers block */}
      <mesh position={[0, -r * 1.9, 0]} scale={[r * 1.4, r * 1.4, r * 0.7]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        {children}
      </mesh>
    </group>
  );
}

function Leg({ side, skel, render }: { side: 'L' | 'R'; skel: Skeleton; render: React.ReactNode }) {
  const hip = side === 'L' ? skel.hipL : skel.hipR;
  const knee = side === 'L' ? skel.kneeL : skel.kneeR;
  const ankle = side === 'L' ? skel.ankleL : skel.ankleR;
  const foot = side === 'L' ? skel.footL : skel.footR;
  const matKey = () => render;

  return (
    <group>
      <JointBall at={hip.pos} r={hip.r}>{matKey()}</JointBall>
      <Bone a={hip.pos} b={knee.pos} rA={hip.r * 0.95} rB={knee.r}>{matKey()}</Bone>
      <JointBall at={knee.pos} r={knee.r}>{matKey()}</JointBall>
      <Bone a={knee.pos} b={ankle.pos} rA={knee.r * 0.92} rB={ankle.r}>{matKey()}</Bone>
      <Foot at={foot} u={skel.headUnit} r={ankle.r}>{matKey()}</Foot>
    </group>
  );
}

// Wedge foot pointing forward with a slight arch.
function Foot({ at, u, r, children }: { at: Vec3; u: number; r: number; children: React.ReactNode }) {
  return (
    <group position={at}>
      <mesh position={[0, 0, u * 0.16]} rotation={[0, 0, 0]} scale={[r * 1.4, r * 1.0, u * 0.55]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        {children}
      </mesh>
      {/* heel */}
      <mesh position={[0, 0, -u * 0.04]} scale={[r * 1.3, r * 1.1, r * 1.3]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        {children}
      </mesh>
    </group>
  );
}
