// Asset pipeline for the character viewer models in public/models.
//
// Sources: Quaternius CC0 packs (Universal Base Characters, Modular Character
// Outfits - Fantasy, Universal Animation Library, LowPoly Medieval Weapons,
// Fantasy Props MegaKit), all on one universal 65-joint rig. Run
// scripts/fetch-assets.sh first to populate /tmp/quat.
//
// What this does:
//  - outfits   → strip normal/ORM maps, webp-compress base color, → GLB
//  - heads     → cut the head+neck out of the Superhero full-body mesh
//                (the standard tier has no separate Regular body), keep
//                eyes/eyebrows, → GLB
//  - hair      → same slimming, → GLB
//  - animation → keep only the Idle_Loop clip from the animation library
//  - weapons   → prune the fbx2gltf conversions, → GLB
//
//   node scripts/prep-models.mjs

import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { Accessor, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const SRC = '/tmp/quat';
const OUT = resolve(import.meta.dirname, '../public/models');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const OUTFITS_DIR = `${SRC}/outfits/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits`;
const UBC_DIR = `${SRC}/ubc/Universal Base Characters[Standard]`;
const HAIR_DIR = `${UBC_DIR}/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)`;
const ANIM_GLB = `${SRC}/anims/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb`;

// Drop everything but base color — at the viewer's ~280px stage size the
// normal/ORM maps are invisible and cost megabytes.
function slimMaterials(doc) {
  for (const mat of doc.getRoot().listMaterials()) {
    mat.setNormalTexture(null);
    mat.setOcclusionTexture(null);
    mat.setMetallicRoughnessTexture(null);
    mat.setEmissiveTexture(null);
    mat.setMetallicFactor(0);
    mat.setRoughnessFactor(0.9);
  }
}

async function slimAndWrite(doc, dst, textureSize) {
  slimMaterials(doc);
  await doc.transform(
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80, resize: [textureSize, textureSize] }),
  );
  await io.write(dst, doc);
  console.log(`${dst.split('/models/')[1]}: ${(statSync(dst).size / 1e6).toFixed(2)} MB`);
}

// Rebuild a primitive keeping only triangles whose vertices all satisfy pred.
function cutPrimitive(doc, prim, pred) {
  const pos = prim.getAttribute('POSITION');
  const idx = prim.getIndices();
  const indices = idx.getArray();
  const posArr = pos.getArray();

  const keepVerts = new Map(); // old index → new index
  const newTris = [];
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (tri.every((v) => pred(posArr[v * 3], posArr[v * 3 + 1], posArr[v * 3 + 2]))) {
      newTris.push(tri);
    }
  }
  for (const tri of newTris) {
    for (const v of tri) if (!keepVerts.has(v)) keepVerts.set(v, keepVerts.size);
  }

  const remapAccessor = (acc) => {
    const elementSize = acc.getElementSize();
    const src = acc.getArray();
    const dst = new src.constructor(keepVerts.size * elementSize);
    for (const [oldV, newV] of keepVerts) {
      for (let c = 0; c < elementSize; c++) dst[newV * elementSize + c] = src[oldV * elementSize + c];
    }
    return doc.createAccessor(acc.getName())
      .setType(acc.getType())
      .setArray(dst)
      .setNormalized(acc.getNormalized());
  };

  for (const semantic of prim.listSemantics()) {
    prim.setAttribute(semantic, remapAccessor(prim.getAttribute(semantic)));
  }
  const newIdx = new Uint16Array(newTris.length * 3);
  newTris.forEach((tri, i) => tri.forEach((v, c) => { newIdx[i * 3 + c] = keepVerts.get(v); }));
  prim.setIndices(doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(newIdx));
}

// ── Outfits (ranger + peasant, both genders) ────────────────────────────────
for (const name of ['Male_Ranger', 'Male_Peasant', 'Female_Ranger', 'Female_Peasant']) {
  const doc = await io.read(`${OUTFITS_DIR}/${name}.gltf`);
  await slimAndWrite(doc, `${OUT}/characters/${name.toLowerCase()}.glb`, 1024);
}

// ── Heads: cut from the Superhero full-body mesh ────────────────────────────
// Keep triangles in the head/neck column: above the collar line, near the
// body centerline (excludes the T-pose arms which sit at the same height).
// The pack references some textures with a stray "_png" suffix — alias them.
const UBC_GLTF_DIR = `${UBC_DIR}/Base Characters/Godot - UE`;
for (const gender of ['Male', 'Female']) {
  const json = JSON.parse(readFileSync(`${UBC_GLTF_DIR}/Superhero_${gender}_FullBody.gltf`, 'utf8'));
  for (const img of json.images ?? []) {
    const uri = decodeURIComponent(img.uri ?? '');
    const canonical = uri.replace(/_png\.png$/, '.png');
    if (uri.endsWith('_png.png') && !existsSync(`${UBC_GLTF_DIR}/${uri}`) && existsSync(`${UBC_GLTF_DIR}/${canonical}`)) {
      copyFileSync(`${UBC_GLTF_DIR}/${canonical}`, `${UBC_GLTF_DIR}/${uri}`);
    }
  }
}
for (const gender of ['Male', 'Female']) {
  const doc = await io.read(`${UBC_DIR}/Base Characters/Godot - UE/Superhero_${gender}_FullBody.gltf`);
  for (const mesh of doc.getRoot().listMeshes()) {
    const isBody = mesh.listPrimitives().some((p) => p.getAttribute('POSITION').getCount() > 5000);
    if (!isBody) continue; // eyes/eyebrows pass through whole
    mesh.setName('Head');
    for (const prim of mesh.listPrimitives()) {
      cutPrimitive(doc, prim, (x, y) => y > 1.52 && Math.abs(x) < 0.16);
    }
  }
  await slimAndWrite(doc, `${OUT}/characters/${gender.toLowerCase()}_head.glb`, 512);
}

// ── Hairstyles ──────────────────────────────────────────────────────────────
const HAIRS = ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_BuzzedFemale'];
for (const hair of HAIRS) {
  const doc = await io.read(`${HAIR_DIR}/${hair}.gltf`);
  await slimAndWrite(doc, `${OUT}/characters/${hair.toLowerCase()}.glb`, 256);
}

// ── Idle animation ──────────────────────────────────────────────────────────
{
  const doc = await io.read(ANIM_GLB);
  const root = doc.getRoot();
  // Disposing an Animation leaves its samplers (and their accessors) behind —
  // collect what the kept clip uses and drop every other accessor explicitly.
  const keep = new Set();
  for (const anim of root.listAnimations()) {
    if (anim.getName() !== 'Idle_Loop') { anim.dispose(); continue; }
    for (const s of anim.listSamplers()) { keep.add(s.getInput()); keep.add(s.getOutput()); }
  }
  for (const mesh of root.listMeshes()) mesh.dispose();
  for (const skin of root.listSkins()) skin.dispose();
  for (const acc of root.listAccessors()) {
    if (!keep.has(acc)) acc.dispose();
  }
  await doc.transform(prune());
  await io.write(`${OUT}/characters/idle.glb`, doc);
  console.log(`characters/idle.glb: ${(statSync(`${OUT}/characters/idle.glb`).size / 1e6).toFixed(2)} MB`);
}

// ── Weapons (already GLB via fbx2gltf) + book from the props kit ────────────
const WEAPONS = ['Sword', 'Dagger', 'Bow_Wooden', 'Axe', 'Hammer_Small', 'Spear', 'Shield_Round', 'Claymore'];
for (const w of WEAPONS) {
  const doc = await io.read(`${SRC}/weapons_glb/${w}.glb`);
  await slimAndWrite(doc, `${OUT}/props/${w.toLowerCase()}.glb`, 256);
}
{
  const doc = await io.read(`${SRC}/props/Exports/glTF/Book_Simplified_Single.gltf`);
  await slimAndWrite(doc, `${OUT}/props/book.glb`, 256);
}
