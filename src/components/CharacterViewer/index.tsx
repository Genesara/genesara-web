import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { Loadout } from '@/api/types';
import { deriveAppearance } from '@/3d/appearance';
import { loadManifest } from '@/3d/manifest';
import type { CatalogManifest } from '@/3d/types';
import { Scene } from './Scene';
import { detectWebGL } from './webgl';

interface Props {
  agentId: string;
  race: string;
  loadout: Loadout | null;
}

// Public entry — handles WebGL detection, manifest preload, loading state,
// and the r3f Canvas. The actual scene is in Scene.tsx.
export function CharacterViewer({ agentId, race, loadout }: Props) {
  const webglOk = useMemo(() => detectWebGL(), []);
  const appearance = useMemo(() => deriveAppearance(agentId, race), [agentId, race]);

  const [manifest, setManifest] = useState<CatalogManifest | null>(null);
  const [manifestError, setManifestError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((m) => { if (!cancelled) setManifest(m); })
      .catch((err) => { if (!cancelled) setManifestError(err); });
    return () => { cancelled = true; };
  }, []);

  if (!webglOk) {
    return (
      <div className="viewer3d viewer3d--unsupported">
        <div className="viewer3d__msg">
          <div className="viewer3d__msg-head">3D viewer unavailable</div>
          <div className="viewer3d__msg-body">
            this browser doesn't expose WebGL. update or switch device to view the model.
          </div>
        </div>
      </div>
    );
  }

  const loading = manifest === null && manifestError === null;

  return (
    <div className="viewer3d">
      <Canvas
        camera={{ position: [0, 0.0, 3.4], fov: 38, near: 0.1, far: 50 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Manifest-driven asset paths arrive here once loaded; until then
              the placeholder still renders (procedural meshes, no GLBs). */}
          {(manifest || manifestError) && (
            <Scene appearance={appearance} loadout={loadout} />
          )}
        </Suspense>
      </Canvas>
      {loading && (
        <div className="viewer3d__loading" aria-label="loading 3d viewer">
          <div className="viewer3d__loading-arc" />
        </div>
      )}
    </div>
  );
}
