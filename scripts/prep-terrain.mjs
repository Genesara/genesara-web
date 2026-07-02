// Asset pipeline for the world-map terrain in public/models/terrain.
//
// Source: KayKit Medieval Hexagon Pack 1.0 (CC0 by Kay Lousberg,
// kaylousberg.com). The pack is checked into the sibling player-template
// repo, so this reads straight from there — override with
//   node scripts/prep-terrain.mjs /path/to/kaykit-hexagon
//
// What this does:
//  - tiles  → hex_grass + hex_water geometry, rotated from KayKit's
//             pointy-top orientation to our flat-top axial grid, x/z
//             normalized to circumradius 1 (skirt depth stays 1 so the
//             runtime can scale Y by tile height and land the base at
//             y=0), texture stripped — per-terrain tint is applied at
//             runtime via instanceColor.
//  - props  → trees / rocks / hills / mountains / water plants, same
//             rotation + uniform 1/circumradius scale so authored
//             proportions vs the tile survive, KayKit atlas kept
//             (webp-compressed) so props render in their original colors.
//
// Output: public/models/terrain/terrain.glb with one node per piece
// (tile_land, tile_water, prop_<name>), consumed by useGLTF at runtime.

import { mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const PACK = resolve(
  process.argv[2] ??
    '../genesara-player-template/viewer/public/assets/kaykit-hexagon',
);
const OUT_DIR = resolve(import.meta.dirname, '../public/models/terrain');
const OUT = `${OUT_DIR}/terrain.glb`;

// KayKit hex tiles are pointy-top with circumradius 2/sqrt(3); our grid is
// flat-top with circumradius 1 (see WorldMap3D/terrain.ts axialToWorld).
const CIRCUMRADIUS = 2 / Math.sqrt(3);
const S = 1 / CIRCUMRADIUS;

const TILES = [
  { name: 'tile_land', file: 'tiles/base/hex_grass.gltf' },
  { name: 'tile_water', file: 'tiles/base/hex_water.gltf' },
];

// [subdir of decoration/, model name]
const PROPS = [
  ['nature', 'tree_single_A'],
  ['nature', 'tree_single_B'],
  ['nature', 'trees_A_medium'],
  ['nature', 'trees_A_large'],
  ['nature', 'trees_B_medium'],
  ['nature', 'tree_single_A_cut'],
  ['nature', 'tree_single_B_cut'],
  ['nature', 'trees_B_cut'],
  ['nature', 'rock_single_B'],
  ['nature', 'rock_single_C'],
  ['nature', 'rock_single_D'],
  ['nature', 'rock_single_E'],
  ['nature', 'hill_single_B'],
  ['nature', 'hill_single_C'],
  ['nature', 'mountain_A'],
  ['nature', 'mountain_B'],
  ['nature', 'mountain_C'],
  ['nature', 'waterplant_A'],
  ['nature', 'waterplant_B'],
  ['nature', 'waterplant_C'],
  ['nature', 'waterlily_A'],
  ['nature', 'waterlily_B'],
  // fog-of-war banks over unexplored frontier hexes
  ['nature', 'cloud_small'],
  ['nature', 'cloud_big'],
  // node-resource markers for the look-around overlay
  ['props', 'resource_stone'],
  ['props', 'resource_lumber'],
  ['props', 'sack'],
  ['props', 'crate_A_small'],
  ['props', 'crate_A_big'],
];

// Engine BuildingType → KayKit model. Yellow set (matches the gold accent);
// neutral set carries the special pieces: construction stages, wooden
// fence/gate for WOODEN_WALL + GATE, grain field, dirt pad, bridge.
// [output name, path relative to pack root]
const BUILDINGS = [
  ['home_A', 'buildings/yellow/building_home_A_yellow.gltf'],
  ['home_B', 'buildings/yellow/building_home_B_yellow.gltf'],
  ['blacksmith', 'buildings/yellow/building_blacksmith_yellow.gltf'],
  ['lumbermill', 'buildings/yellow/building_lumbermill_yellow.gltf'],
  ['church', 'buildings/yellow/building_church_yellow.gltf'],
  ['tavern', 'buildings/yellow/building_tavern_yellow.gltf'],
  ['market', 'buildings/yellow/building_market_yellow.gltf'],
  ['tower_A', 'buildings/yellow/building_tower_A_yellow.gltf'],
  ['barracks', 'buildings/yellow/building_barracks_yellow.gltf'],
  ['mine', 'buildings/yellow/building_mine_yellow.gltf'],
  ['well', 'buildings/yellow/building_well_yellow.gltf'],
  ['grain', 'buildings/neutral/building_grain.gltf'],
  ['dirt', 'buildings/neutral/building_dirt.gltf'],
  ['bridge', 'buildings/neutral/building_bridge_A.gltf'],
  ['stage_A', 'buildings/neutral/building_stage_A.gltf'],
  ['stage_B', 'buildings/neutral/building_stage_B.gltf'],
  ['stage_C', 'buildings/neutral/building_stage_C.gltf'],
  ['fence', 'buildings/neutral/fence_wood_straight.gltf'],
  ['fence_gate', 'buildings/neutral/fence_wood_straight_gate.gltf'],
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Pull every primitive out of a source file, baked through its node's world
// transform, then rotated 90° about Y (pointy-top → flat-top) and scaled.
// Returns flat arrays ready to re-accessor into the output doc.
async function extract(file, { uniformScale }) {
  const doc = await io.read(`${PACK}/${file}`);
  const node = doc
    .getRoot()
    .listNodes()
    .find((n) => n.getMesh());
  if (!node) throw new Error(`${file}: no mesh node`);
  const m = node.getWorldMatrix();

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const nrm = prim.getAttribute('NORMAL');
    const uv = prim.getAttribute('TEXCOORD_0');
    const idx = prim.getIndices();
    const base = positions.length / 3;
    const p = [0, 0, 0];
    const n = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, p);
      // node world transform (column-major)
      let x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      let y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      let z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
      // rotate +90° about Y: vertex on +z moves to +x
      [x, z] = [z, -x];
      positions.push(x * S, uniformScale ? y * S : y, z * S);

      nrm.getElement(i, n);
      let nx = m[0] * n[0] + m[4] * n[1] + m[8] * n[2];
      let ny = m[1] * n[0] + m[5] * n[1] + m[9] * n[2];
      let nz = m[2] * n[0] + m[6] * n[1] + m[10] * n[2];
      [nx, nz] = [nz, -nx];
      // inverse-transpose of diag(S, 1, S) for the tiles' non-uniform scale
      if (!uniformScale) {
        nx /= S;
        nz /= S;
      }
      const len = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / len, ny / len, nz / len);

      if (uv) {
        uv.getElement(i, n);
        uvs.push(n[0], n[1]);
      }
    }
    for (let i = 0; i < idx.getCount(); i++) indices.push(base + idx.getScalar(i));
  }
  return { positions, normals, uvs, indices };
}

function addMesh(out, buffer, name, data, material, keepUv) {
  const prim = out
    .createPrimitive()
    .setMaterial(material)
    .setAttribute(
      'POSITION',
      out
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(data.positions))
        .setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      out
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(data.normals))
        .setBuffer(buffer),
    )
    .setIndices(
      out
        .createAccessor()
        .setType('SCALAR')
        .setArray(new Uint16Array(data.indices))
        .setBuffer(buffer),
    );
  if (keepUv && data.uvs.length > 0) {
    prim.setAttribute(
      'TEXCOORD_0',
      out
        .createAccessor()
        .setType('VEC2')
        .setArray(new Float32Array(data.uvs))
        .setBuffer(buffer),
    );
  }
  const mesh = out.createMesh(name).addPrimitive(prim);
  return out.createNode(name).setMesh(mesh);
}

const out = new Document();
const buffer = out.createBuffer();
const scene = out.createScene('terrain');
out.getRoot().setDefaultScene(scene);

// Untextured: the runtime replaces this with its own tinted materials.
const tileMaterial = out
  .createMaterial('tile')
  .setBaseColorFactor([1, 1, 1, 1])
  .setMetallicFactor(0)
  .setRoughnessFactor(0.95);

const atlasPng = await sharp(
  `${PACK}/decoration/nature/hexagons_medieval.png`,
).png().toBuffer();
const atlasTexture = out
  .createTexture('hexagons_medieval')
  .setImage(atlasPng)
  .setMimeType('image/png');
const atlasMaterial = out
  .createMaterial('atlas')
  .setBaseColorTexture(atlasTexture)
  .setMetallicFactor(0)
  .setRoughnessFactor(0.95);

for (const { name, file } of TILES) {
  const data = await extract(file, { uniformScale: false });
  scene.addChild(addMesh(out, buffer, name, data, tileMaterial, false));
}
for (const [dir, prop] of PROPS) {
  const data = await extract(`decoration/${dir}/${prop}.gltf`, {
    uniformScale: true,
  });
  scene.addChild(addMesh(out, buffer, `prop_${prop}`, data, atlasMaterial, true));
}
for (const [name, path] of BUILDINGS) {
  const data = await extract(path, { uniformScale: true });
  scene.addChild(addMesh(out, buffer, `bld_${name}`, data, atlasMaterial, true));
}

await out.transform(
  dedup(),
  prune(),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 80,
    resize: [512, 512],
  }),
);

mkdirSync(OUT_DIR, { recursive: true });
await io.write(OUT, out);
console.log(`terrain.glb: ${(statSync(OUT).size / 1e3).toFixed(0)} kB`);
