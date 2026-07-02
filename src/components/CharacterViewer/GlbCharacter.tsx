import { Fragment, useEffect, useMemo } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AnimationMixer,
  Box3,
  Color,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Object3D,
} from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { EquipmentInstance, EquipSlot, Loadout, Rarity } from '@/api/types';
import type { Appearance } from '@/3d/types';
import {
  characterFiles,
  hairFile,
  IDLE_ANIM,
  mainHandProp,
  offHandProp,
  type PropConfig,
} from '@/3d/parts';
import { RARITY_TINT } from './rarityMaterial';

// Realistic-proportioned character assembled from Quaternius universal-rig
// parts (see src/3d/parts.ts). Four skinned sub-scenes — head, hair, peasant
// outfit, ranger outfit — share one skeleton layout and play the same
// Idle_Loop clip through per-scene mixers ticked together, so they stay in
// sync. Equipment maps to real mesh parts:
//   empty slot    → peasant (underclothes) part visible
//   occupied slot → ranger (armored) part visible
//   HELMET        → hood on, hair off
//   hands         → weapon props attached to the hand bones
// Jewelry gets small rarity-tinted primitives at the bones.

// Character stands ~1.85 units incl. hair; match the procedural figure.
const MODEL_HEIGHT = 1.85;
const FIGURE_HEIGHT = 1.72;

interface Props {
  appearance: Appearance;
  loadout: Loadout | null;
}

type SlotIndex = Partial<Record<EquipSlot, EquipmentInstance>>;

export function GlbCharacter({ appearance, loadout }: Props) {
  const slotIndex = useMemo(() => {
    const idx: SlotIndex = {};
    if (!loadout) return idx;
    for (const s of loadout.equipment.slots) {
      if (s.instance) idx[s.slotId] = s.instance;
    }
    return idx;
  }, [loadout]);

  const files = characterFiles(appearance.gender);
  const head = useGLTF(files.head);
  const peasant = useGLTF(files.peasant);
  const ranger = useGLTF(files.ranger);
  const hair = useGLTF(hairFile(appearance.gender, appearance.hairIndex));
  const idle = useGLTF(IDLE_ANIM);

  // Clone every sub-scene so concurrent viewers never share skeleton state.
  const scenes = useMemo(
    () => ({
      head: cloneSkinned(head.scene),
      peasant: cloneSkinned(peasant.scene),
      ranger: cloneSkinned(ranger.scene),
      hair: cloneSkinned(hair.scene),
    }),
    [head.scene, peasant.scene, ranger.scene, hair.scene],
  );

  // One mixer per sub-scene, all playing the same clip, ticked in one place —
  // created together on mount so phases line up.
  const mixers = useMemo(() => {
    const clip = idle.animations[0];
    if (!clip) return [];
    return Object.values(scenes).map((scene) => {
      const mixer = new AnimationMixer(scene);
      mixer.clipAction(clip).play();
      mixer.update(0); // pose immediately; avoids a 1-frame T-pose flash
      return mixer;
    });
  }, [scenes, idle.animations]);

  useFrame((_, delta) => {
    for (const m of mixers) m.update(delta);
  });

  // Per-slot part visibility + shadows.
  useEffect(() => {
    const has = (slot: EquipSlot) => !!slotIndex[slot];
    const partVisible = (name: string, outfit: 'peasant' | 'ranger'): boolean => {
      if (name.includes('Head_Hood')) return has('HELMET');
      if (name.includes('Acc_Pauldron') || name.includes('Body_Belt')) return has('CHEST');
      if (name.includes('Arms_Bracer')) return has('GLOVES');
      const equippedLook = outfit === 'ranger';
      if (name.includes('_Body')) return equippedLook === has('CHEST');
      if (name.includes('_Legs')) return equippedLook === has('PANTS');
      if (name.includes('_Feet')) return equippedLook === has('BOOTS');
      if (name.includes('_Arms')) return equippedLook === has('GLOVES');
      return true;
    };
    for (const outfit of ['peasant', 'ranger'] as const) {
      scenes[outfit].traverse((o) => {
        if (o instanceof Mesh) {
          o.visible = partVisible(o.name, outfit);
          o.castShadow = true;
        }
      });
    }
    scenes.head.traverse((o) => { if (o instanceof Mesh) o.castShadow = true; });
    scenes.hair.traverse((o) => {
      if (o instanceof Mesh) {
        o.visible = !has('HELMET');
        o.castShadow = true;
      }
    });
  }, [scenes, slotIndex]);

  // Seeded skin/hair tinting. Materials are shared across clones, so swap in
  // per-instance clones before coloring. Subtle lerp keeps the painted
  // texture readable.
  useEffect(() => {
    // Skin stays subtle — the head and hands use different base textures and
    // a strong multiplier makes them diverge. Hair takes the full seed color.
    const skin = new Color('#FFFFFF').lerp(new Color(appearance.skinColor), 0.25);
    const hairC = new Color(appearance.hairColor);
    for (const scene of Object.values(scenes)) {
      scene.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        const mat = o.material as MeshStandardMaterial;
        if (!mat?.name) return;
        if (mat.name.startsWith('MI_Superhero') || mat.name.startsWith('MI_Regular')) {
          const m = mat.clone();
          m.color.copy(skin);
          o.material = m;
        } else if (mat.name.startsWith('MI_Hair')) {
          const m = mat.clone();
          m.color.copy(hairC);
          o.material = m;
        }
      });
    }
  }, [scenes, appearance.skinColor, appearance.hairColor]);

  const bones = useMemo(() => {
    const map: Record<string, Object3D> = {};
    scenes.peasant.traverse((o) => { map[o.name] = o; });
    return map;
  }, [scenes]);

  const scale = (FIGURE_HEIGHT / MODEL_HEIGHT) * appearance.heightScale;

  return (
    <group scale={scale}>
      <primitive object={scenes.head} />
      <primitive object={scenes.hair} />
      <primitive object={scenes.peasant} />
      <primitive object={scenes.ranger} />
      <Attachments slotIndex={slotIndex} bones={bones} />
    </group>
  );
}

// ── Bone attachments (weapons + jewelry) ────────────────────────────────────
// Attached to the peasant scene's bones (always loaded); all sub-scenes play
// the same clip so any skeleton tracks the visible body.

function intoBone(bones: Record<string, Object3D>, name: string, el: React.ReactNode) {
  const bone = bones[name];
  return bone ? <Fragment key={name}>{createPortal(el, bone)}</Fragment> : null;
}

function Attachments({ slotIndex, bones }: { slotIndex: SlotIndex; bones: Record<string, Object3D> }) {
  const out: React.ReactNode[] = [];

  const main = slotIndex.MAIN_HAND;
  if (main) {
    out.push(
      <Fragment key={`mh:${main.itemId}`}>
        {intoBone(bones, 'hand_r',
          <HandProp config={mainHandProp(main.itemId)} side="right" />)}
      </Fragment>,
    );
  }
  const off = slotIndex.OFF_HAND;
  if (off) {
    out.push(
      <Fragment key={`oh:${off.itemId}`}>
        {intoBone(bones, 'hand_l',
          <HandProp config={offHandProp(off.itemId)} side="left" />)}
      </Fragment>,
    );
  }

  const amulet = slotIndex.AMULET;
  if (amulet) {
    out.push(
      <Fragment key="amulet">
        {intoBone(bones, 'spine_03',
          <mesh position={[0, 0.18, 0.13]} castShadow>
            <sphereGeometry args={[0.025, 12, 10]} />
            <JewelMat rarity={amulet.rarity} />
          </mesh>)}
      </Fragment>,
    );
  }

  for (const slot of ['RING_LEFT', 'RING_RIGHT'] as const) {
    const inst = slotIndex[slot];
    if (!inst) continue;
    out.push(
      <Fragment key={slot}>
        {intoBone(bones, slot === 'RING_LEFT' ? 'hand_l' : 'hand_r',
          <mesh position={[0, 0.05, 0]} castShadow>
            <torusGeometry args={[0.016, 0.006, 6, 12]} />
            <JewelMat rarity={inst.rarity} />
          </mesh>)}
      </Fragment>,
    );
  }

  for (const slot of ['BRACELET_LEFT', 'BRACELET_RIGHT'] as const) {
    const inst = slotIndex[slot];
    if (!inst) continue;
    out.push(
      <Fragment key={slot}>
        {intoBone(bones, slot === 'BRACELET_LEFT' ? 'lowerarm_l' : 'lowerarm_r',
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.025, 12, 1]} />
            <JewelMat rarity={inst.rarity} />
          </mesh>)}
      </Fragment>,
    );
  }

  return <>{out}</>;
}

function JewelMat({ rarity }: { rarity: Rarity }) {
  const t = RARITY_TINT[rarity];
  return <meshStandardMaterial color={t.color} metalness={t.metalness} roughness={t.roughness} />;
}

// Loads a prop GLB, normalizes its longest axis to config.length (the source
// FBX units vary), and grips it at the bone origin.
function HandProp({ config, side }: { config: PropConfig; side: 'left' | 'right' }) {
  const { scene } = useGLTF(config.file);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const size = new Box3().setFromObject(c).getSize(new Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    c.scale.multiplyScalar(config.length / longest);
    c.traverse((o) => { if (o instanceof Mesh) o.castShadow = true; });
    return c;
  }, [scene, config.length]);

  // Hand bones point +Y along the fingers; the props' long axis is +Z in the
  // source meshes — pitch it onto +Y so the blade runs past the fingertips.
  void side;
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0.01]}>
      <primitive object={obj} />
    </group>
  );
}
