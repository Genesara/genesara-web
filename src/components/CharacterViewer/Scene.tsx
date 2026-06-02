import { useRef } from 'react';
import type { Group } from 'three';
import type { Loadout } from '@/api/types';
import type { Appearance } from '@/3d/types';
import { CharacterModel } from './CharacterModel';
import { CameraRig } from './CameraRig';

interface Props {
  appearance: Appearance;
  loadout: Loadout | null;
}

// The r3f scene contents — lighting rig + character model + camera control.
// Floating-on-paper presentation (Question 14): transparent background, soft
// 3-point studio lighting, monochromatic environment via hemisphere light.
export function Scene({ appearance, loadout }: Props) {
  const modelRef = useRef<Group>(null);

  return (
    <>
      {/* Studio 3-point lighting — neutral white, low contrast.
          Key from front-right, fill from front-left, rim from behind. */}
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#E8E5DE', '#1A1814', 0.45]} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.1} castShadow={false} color="#E8E5DE" />
      <directionalLight position={[-2, 2, 1.5]} intensity={0.5} color="#9A968D" />
      <directionalLight position={[0, 2, -3]} intensity={0.7} color="#C8A35E" />

      <group ref={modelRef} position={[0, -0.85, 0]}>
        <CharacterModel appearance={appearance} loadout={loadout} />
      </group>

      <CameraRig modelRef={modelRef} />
    </>
  );
}
