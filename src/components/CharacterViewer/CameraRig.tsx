import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';

interface Props {
  modelRef: React.RefObject<Group | null>;
}

const AUTO_ROTATE_IDLE_MS = 3000;
const AUTO_ROTATE_SPEED = 0.15; // rad/s
const DRAG_SENSITIVITY = 0.008;

// Y-axis drag-to-rotate + gentle auto-rotate after idle.
// Wraps the model group, not the camera — simpler, no orbit math, no
// "camera lost" failure modes (Question 13 decision).
export function CameraRig({ modelRef }: Props) {
  const { gl } = useThree();
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastInteractionRef = useRef(performance.now());
  const targetRotationRef = useRef(0);

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      lastXRef.current = e.clientX;
      lastInteractionRef.current = performance.now();
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      targetRotationRef.current += dx * DRAG_SENSITIVITY;
      lastInteractionRef.current = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      el.style.cursor = 'grab';
      lastInteractionRef.current = performance.now();
    };
    const onEnter = () => { el.style.cursor = 'grab'; lastInteractionRef.current = performance.now(); };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerenter', onEnter);
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-y';

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerenter', onEnter);
      el.style.cursor = '';
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!modelRef.current) return;
    const idleMs = performance.now() - lastInteractionRef.current;
    if (!draggingRef.current && idleMs > AUTO_ROTATE_IDLE_MS) {
      targetRotationRef.current += AUTO_ROTATE_SPEED * delta;
    }
    // Critically damped easing toward target rotation.
    const current = modelRef.current.rotation.y;
    const lerp = Math.min(1, delta * 12);
    modelRef.current.rotation.y = current + (targetRotationRef.current - current) * lerp;
  });

  return null;
}
