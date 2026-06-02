import type { EquipSlot } from '@/api/types';
import type { SocketName } from './types';

// Mixamo humanoid bone names per equipment slot.
// These are the rigid bone-parent attachment points; the equipment GLB's root
// is set as a child of this bone, with origin matching the natural wear point.
export const SOCKET_BY_SLOT: Record<EquipSlot, SocketName> = {
  HELMET: 'mixamorigHead',
  CHEST: 'mixamorigSpine2',
  PANTS: 'mixamorigHips',
  BOOTS: 'mixamorigLeftFoot',
  GLOVES: 'mixamorigLeftHand',
  AMULET: 'mixamorigNeck',
  RING_LEFT: 'mixamorigLeftHandRing1',
  RING_RIGHT: 'mixamorigRightHandRing1',
  BRACELET_LEFT: 'mixamorigLeftForeArm',
  BRACELET_RIGHT: 'mixamorigRightForeArm',
  MAIN_HAND: 'mixamorigRightHand',
  OFF_HAND: 'mixamorigLeftHand',
};
