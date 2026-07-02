import { Component, Suspense, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { Loadout } from '@/api/types';
import type { Appearance } from '@/3d/types';
import { CharacterModel } from './CharacterModel';
import { GlbCharacter } from './GlbCharacter';
import { CameraRig } from './CameraRig';

interface Props {
  appearance: Appearance;
  loadout: Loadout | null;
}

// If a character GLB fails to fetch/parse, fall back to the procedural figure
// rather than blanking the stage.
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// The r3f scene contents — lighting rig + character model + camera control.
// Floating-on-paper presentation (Question 14): transparent background, soft
// 3-point studio lighting, monochromatic environment via hemisphere light.
export function Scene({ appearance, loadout }: Props) {
  const modelRef = useRef<Group>(null);

  return (
    <>
      {/* Studio 3-point lighting — neutral/warm, brought up so the matte skin
          + equipment read on the dark paper. Key front-right, fill front-left,
          warm rim from behind. */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#F2EFE8', '#2A2620', 0.7]} />
      <directionalLight position={[2.5, 3, 3]} intensity={1.7} castShadow={false} color="#F2EEE6" />
      <directionalLight position={[-2.5, 2, 2]} intensity={0.85} color="#B6B2A8" />
      <directionalLight position={[0, 2.5, -3]} intensity={1.0} color="#C8A35E" />
      <pointLight position={[0, 1.0, 2.4]} intensity={0.6} color="#FFF6E8" />

      <group ref={modelRef} position={[0, -0.85, 0]}>
        <ModelBoundary fallback={<CharacterModel appearance={appearance} loadout={loadout} />}>
          <Suspense fallback={null}>
            <GlbCharacter appearance={appearance} loadout={loadout} />
          </Suspense>
        </ModelBoundary>
      </group>

      <CameraRig modelRef={modelRef} />
    </>
  );
}
