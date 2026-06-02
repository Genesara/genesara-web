import type { EquipSlot } from '@/api/types';
import type { Appearance, CatalogManifest } from './types';

let cachedManifest: Promise<CatalogManifest> | null = null;

export async function loadManifest(): Promise<CatalogManifest> {
  if (!cachedManifest) {
    cachedManifest = fetch('/models/manifest.json', { cache: 'force-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`manifest fetch failed: ${r.status}`);
        return r.json() as Promise<CatalogManifest>;
      })
      .catch((err) => {
        cachedManifest = null;
        throw err;
      });
  }
  return cachedManifest;
}

// itemId → mesh asset URL.
// Resolution order:
//   1. exact itemId mapped in manifest.equipment
//   2. slot-default for the slot (also used for empty slots)
//   3. null (renderer falls back to procedural placeholder)
export function resolveItemMesh(
  manifest: CatalogManifest,
  slotId: EquipSlot,
  itemId: string | null,
): string | null {
  if (itemId) {
    const entry = manifest.equipment.find((e) => e.itemId === itemId);
    if (entry) return entry.meshKey;
    if (import.meta.env.DEV) {
      console.warn(`[3d/manifest] unmapped itemId="${itemId}" in slot=${slotId}; using slot-default`);
    }
  }
  return manifest.slotDefaults[slotId] ?? null;
}

export function resolveBodyMesh(
  manifest: CatalogManifest,
  appearance: Appearance,
): string | null {
  return manifest.baseMeshes.bodies[appearance.bodyShape] ?? null;
}

export function resolveHeadMesh(
  manifest: CatalogManifest,
  appearance: Appearance,
): string | null {
  const heads = manifest.baseMeshes.heads;
  const idx = Math.max(0, Math.min(heads.length - 1, appearance.headIndex));
  return heads[idx] ?? null;
}

export function resolveHairMesh(
  manifest: CatalogManifest,
  appearance: Appearance,
): string | null {
  const hairs = manifest.baseMeshes.hairs;
  const idx = Math.max(0, Math.min(hairs.length - 1, appearance.hairIndex));
  return hairs[idx] ?? null;
}

export function resolveIdleAnim(manifest: CatalogManifest): string | null {
  return manifest.idleAnim;
}
