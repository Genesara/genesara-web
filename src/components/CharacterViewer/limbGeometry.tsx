import { useMemo, type ReactNode } from 'react';
import { Quaternion, Vector3, type Euler } from 'three';
import type { Vec3 } from './anchors';

const UP = new Vector3(0, 1, 0);

// Aligns a +Y-major child (capsule/cylinder/cone) to lie along the segment
// a→b, positioned at its midpoint. Returns the props a <group> needs.
export function segmentTransform(a: Vec3, b: Vec3): {
  position: Vec3;
  quaternion: [number, number, number, number];
  length: number;
} {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const dir = new Vector3().subVectors(vb, va);
  const length = dir.length();
  const q = new Quaternion();
  if (length > 1e-6) q.setFromUnitVectors(UP, dir.clone().normalize());
  const mid = new Vector3().addVectors(va, vb).multiplyScalar(0.5);
  return {
    position: [mid.x, mid.y, mid.z],
    quaternion: [q.x, q.y, q.z, q.w],
    length,
  };
}

interface BoneProps {
  a: Vec3;
  b: Vec3;
  /** Radius at the `a` end. */
  rA: number;
  /** Radius at the `b` end (defaults to rA for a uniform capsule). */
  rB?: number;
  children: ReactNode;
}

// Tapered limb: a CapsuleGeometry oriented along a→b. Capsules can't taper, so
// we approximate taper by averaging radii on the capsule and letting the sphere
// joints (rendered separately) sell the wider ends. radialSegments kept ≥ 20.
export function Bone({ a, b, rA, rB = rA, children }: BoneProps) {
  const { position, quaternion, length } = useMemo(() => segmentTransform(a, b), [a, b]);
  const rMean = (rA + rB) * 0.5;
  // Capsule total height includes the two hemispherical caps; subtract them so
  // the cylindrical body spans the joint distance.
  const cyl = Math.max(0.001, length - rMean);
  return (
    <group position={position} quaternion={quaternion}>
      <mesh castShadow scale={[1, 1, 1]}>
        <capsuleGeometry args={[rMean, cyl, 6, 22]} />
        {children}
      </mesh>
    </group>
  );
}

// Sphere joint mass, slightly squashed so it blends into the limb.
export function JointBall({
  at,
  r,
  squashY = 0.85,
  children,
}: {
  at: Vec3;
  r: number;
  squashY?: number;
  children: ReactNode;
}) {
  return (
    <mesh position={at} scale={[1, squashY, 1]} castShadow>
      <sphereGeometry args={[r, 20, 16]} />
      {children}
    </mesh>
  );
}

// Re-export Euler type for callers building rotation tuples without importing three.
export type { Euler };
