import type { EquipSlot } from '@/api/types';
import type { BodyShape } from '@/3d/types';

// Anchor positions for the procedural placeholder model.
// When real Mixamo-rigged GLBs land, equipment instead attaches via
// bone-parenting using SOCKET_BY_SLOT — these placeholder anchors get
// retired. Coordinates assume the body root at y=0, head around y=1.7.

export type Vec3 = [number, number, number];

export const BODY_DIM: Record<BodyShape, { hipR: number; shoulderR: number; chestR: number }> = {
  lean: { hipR: 0.16, shoulderR: 0.21, chestR: 0.19 },
  average: { hipR: 0.19, shoulderR: 0.24, chestR: 0.22 },
  heavy: { hipR: 0.23, shoulderR: 0.27, chestR: 0.26 },
};

export const HEAD_Y = 1.66;
export const HEAD_R = 0.11;
export const NECK_Y = 1.5;
export const CHEST_Y = 1.18;
export const HIP_Y = 0.84;
export const FOOT_Y = 0.05;
export const HAND_Y = 0.96;
export const FOREARM_Y = 1.08;
export const HAND_OFFSET_X = 0.33;
export const FOOT_OFFSET_X = 0.1;

export const SOCKET_ANCHOR: Record<EquipSlot, Vec3> = {
  HELMET: [0, HEAD_Y + 0.03, 0],
  CHEST: [0, CHEST_Y, 0],
  PANTS: [0, HIP_Y - 0.02, 0],
  BOOTS: [0, FOOT_Y, 0],
  GLOVES: [HAND_OFFSET_X, HAND_Y, 0],
  AMULET: [0, NECK_Y - 0.02, 0.08],
  RING_LEFT: [-HAND_OFFSET_X, HAND_Y - 0.02, 0.04],
  RING_RIGHT: [HAND_OFFSET_X, HAND_Y - 0.02, 0.04],
  BRACELET_LEFT: [-HAND_OFFSET_X + 0.02, FOREARM_Y, 0],
  BRACELET_RIGHT: [HAND_OFFSET_X - 0.02, FOREARM_Y, 0],
  MAIN_HAND: [HAND_OFFSET_X + 0.04, HAND_Y - 0.06, 0.06],
  OFF_HAND: [-HAND_OFFSET_X - 0.04, HAND_Y - 0.06, 0.06],
};
