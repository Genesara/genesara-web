import type { EquipSlot } from '@/api/types';
import type { Appearance } from '@/3d/types';

// Parametric proportion / skeleton system for the procedural figure.
//
// Everything is computed in HEAD-UNITS (1 unit = 1 head height) following the
// ~7.5-head artistic canon, then mapped to world space so the total standing
// height stays ≈ FIGURE_HEIGHT regardless of how many heads tall the agent is.
// That keeps the existing camera framing (Scene.tsx) untouched while letting
// proportions vary per agent.
//
// Feet rest at y = 0; the figure grows upward. Scene.tsx offsets the whole
// group so the mid-body sits on the camera axis.
//
// When real Mixamo-rigged GLBs land, equipment attaches via bone-parenting
// using SOCKET_BY_SLOT instead; these anchors are the procedural fallback.

export type Vec3 = [number, number, number];

// Target world height of the standing figure (matches the old layout box).
const FIGURE_HEIGHT = 1.72;

export interface Joint {
  pos: Vec3;
  /** Local girth radius at this joint, world units. */
  r: number;
}

export interface Skeleton {
  /** World height of one head, used for any head-relative sizing. */
  headUnit: number;

  // Core landmarks (world space).
  headCenter: Vec3;
  headTop: Vec3;
  headR: number; // mean cranium radius
  headRX: number; // half-width
  headRZ: number; // half-depth
  jaw: number; // 0..1 angularity

  neck: Joint;
  chest: Joint; // sternum / upper torso center
  waist: Joint;
  pelvis: Joint;

  shoulderL: Joint;
  shoulderR: Joint;
  elbowL: Joint;
  elbowR: Joint;
  wristL: Joint;
  wristR: Joint;
  handL: Vec3;
  handR: Vec3;
  forearmMidL: Vec3;
  forearmMidR: Vec3;

  hipL: Joint;
  hipR: Joint;
  kneeL: Joint;
  kneeR: Joint;
  ankleL: Joint;
  ankleR: Joint;
  footL: Vec3;
  footR: Vec3;

  /** Half the chest width (deltoid to deltoid mid), for equipment sizing. */
  chestHalfW: number;
  hipHalfW: number;
}

function mid(a: Vec3, b: Vec3, t = 0.5): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Builds the full skeleton from the seeded build params. Pure + deterministic.
export function buildSkeleton(appearance: Appearance): Skeleton {
  const b = appearance.build;
  const u = FIGURE_HEIGHT / b.heads; // world units per head

  // ── Vertical landmarks, in head-units from the ground ───────────────────
  // Canon: head occupies the top head-unit; crotch ≈ mid-height; legs ≈ 50%.
  const totalH = b.heads * u;
  const groundY = 0;
  const headTopY = totalH;
  const headCenterY = totalH - 0.5 * u; // center of the top head
  const chinY = totalH - 1.0 * u;
  const neckY = chinY - 0.06 * u;
  const shoulderY = totalH - 1.55 * u;
  const chestY = totalH - 2.1 * u;
  const waistY = totalH - 3.1 * u;
  const pelvisY = totalH - 3.55 * u; // hip joints / crotch line
  const kneeY = pelvisY * 0.46; // knee sits a touch above mid-leg
  const ankleY = 0.55 * u;
  const elbowY = shoulderY - 1.45 * u;
  const wristY = shoulderY - 2.75 * u;

  // ── Lateral spans (half-widths), head-units → world ─────────────────────
  const shoulderHalf = 1.02 * u * b.shoulderWidth;
  const chestHalf = 0.78 * u * b.torsoMass;
  const waistHalf = 0.62 * u * b.waist;
  const hipHalf = 0.82 * u * b.hipWidth;

  // ── Girths (radii) ──────────────────────────────────────────────────────
  const limb = b.limbThickness;
  const rUpperArm = 0.2 * u * limb;
  const rForeArm = 0.15 * u * limb;
  const rWrist = 0.11 * u * limb;
  const rThigh = 0.3 * u * limb;
  const rKnee = 0.21 * u * limb;
  const rAnkle = 0.14 * u * limb;

  // ── A-pose: arms splayed out + slight forward, elbows out then wrists in ─
  const splay = b.armSplay; // radians from vertical
  const sx = shoulderHalf; // shoulder x
  // elbow drifts outward by splay, wrist continues but tucks slightly forward.
  const elbowX = sx + Math.sin(splay) * (shoulderY - elbowY);
  const wristX = elbowX + Math.sin(splay * 0.75) * (elbowY - wristY) - 0.03 * u;
  const wristZ = 0.06 * u; // hands slightly ahead of the body plane
  const handDrop = 0.16 * u;

  // Contrapposto: shift hips/torso slightly, drop one shoulder a touch.
  const shift = b.weightShift * hipHalf;
  const legGap = 0.34 * u; // stance ≈ shoulder-width-ish at the feet

  const headCenter: Vec3 = [shift * 0.4, headCenterY, 0];

  const shoulderL: Joint = { pos: [-sx + shift * 0.3, shoulderY + Math.abs(shift) * 0.2, 0], r: rUpperArm * 1.15 };
  const shoulderR: Joint = { pos: [sx + shift * 0.3, shoulderY - Math.abs(shift) * 0.2, 0], r: rUpperArm * 1.15 };
  const elbowL: Joint = { pos: [-elbowX + shift * 0.2, elbowY, wristZ * 0.5], r: rForeArm * 1.2 };
  const elbowR: Joint = { pos: [elbowX + shift * 0.2, elbowY, wristZ * 0.5], r: rForeArm * 1.2 };
  const wristL: Joint = { pos: [-wristX + shift * 0.1, wristY, wristZ], r: rWrist };
  const wristR: Joint = { pos: [wristX + shift * 0.1, wristY, wristZ], r: rWrist };
  const handL: Vec3 = [wristL.pos[0] - 0.01 * u, wristY - handDrop, wristZ + 0.01 * u];
  const handR: Vec3 = [wristR.pos[0] + 0.01 * u, wristY - handDrop, wristZ + 0.01 * u];

  const hipL: Joint = { pos: [-hipHalf * 0.55 + shift, pelvisY, 0], r: rThigh };
  const hipR: Joint = { pos: [hipHalf * 0.55 + shift, pelvisY, 0], r: rThigh };
  const kneeL: Joint = { pos: [-legGap, kneeY, 0.01 * u], r: rKnee };
  const kneeR: Joint = { pos: [legGap, kneeY, 0.01 * u], r: rKnee };
  const ankleL: Joint = { pos: [-legGap, ankleY, 0], r: rAnkle };
  const ankleR: Joint = { pos: [legGap, ankleY, 0], r: rAnkle };
  const footL: Vec3 = [-legGap, groundY + 0.02 * u, 0.16 * u];
  const footR: Vec3 = [legGap, groundY + 0.02 * u, 0.16 * u];

  return {
    headUnit: u,
    headCenter,
    headTop: [headCenter[0], headTopY, 0],
    headR: 0.5 * u,
    headRX: 0.42 * u * b.headWidth,
    headRZ: 0.5 * u,
    jaw: b.jaw,

    neck: { pos: [shift * 0.4, neckY, 0], r: 0.26 * u },
    chest: { pos: [shift * 0.3, chestY, 0], r: chestHalf },
    waist: { pos: [shift * 0.5, waistY, 0], r: waistHalf },
    pelvis: { pos: [shift, pelvisY + 0.2 * u, 0], r: hipHalf },

    shoulderL, shoulderR, elbowL, elbowR, wristL, wristR, handL, handR,
    forearmMidL: mid(elbowL.pos, wristL.pos),
    forearmMidR: mid(elbowR.pos, wristR.pos),

    hipL, hipR, kneeL, kneeR, ankleL, ankleR, footL, footR,

    chestHalfW: chestHalf,
    hipHalfW: hipHalf,
  };
}

// Per-slot equipment anchor (position) derived from the skeleton. Equipment
// meshes also read the skeleton directly for sizing; this is the mount point.
export function slotAnchor(s: Skeleton, slot: EquipSlot): Vec3 {
  switch (slot) {
    case 'HELMET': return s.headCenter;
    case 'CHEST': return s.chest.pos;
    case 'PANTS': return s.pelvis.pos;
    case 'BOOTS': return [0, 0, 0];
    case 'GLOVES': return [0, 0, 0];
    case 'AMULET': return [s.neck.pos[0], s.neck.pos[1] - 0.18 * s.headUnit, s.headRZ * 0.7];
    case 'RING_LEFT': return s.handL;
    case 'RING_RIGHT': return s.handR;
    case 'BRACELET_LEFT': return s.forearmMidL;
    case 'BRACELET_RIGHT': return s.forearmMidR;
    case 'MAIN_HAND': return s.handR;
    case 'OFF_HAND': return s.handL;
  }
}
