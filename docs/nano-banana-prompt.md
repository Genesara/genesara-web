# Nano Banana — character & equipment prompt template

Parametric prompt template for Google's Gemini 2.5 Flash Image ("Nano Banana"),
used to generate 2D reference art that feeds into image-to-3D pipelines
(Meshy, Tripo, Rodin) for the Genesara 3D agent viewer's mesh catalog.

The output of this prompt is **not** end-user art — it is intermediate
reference imagery for 3D mesh reconstruction.

## Pipeline

```
Nano Banana prompt → 2D PNG (T-pose, neutral backdrop)
   → Meshy / Tripo image-to-3D → raw GLB
   → Blender cleanup + Mixamo auto-rig → rigged GLB
   → gltf-transform (Meshopt + KTX2) → final GLB
   → public/models/<path>.glb + manifest.json entry
```

## Base character prompt (T-pose for image-to-3D)

Copy verbatim, substitute placeholders from the token tables below.

```
A photorealistic full-body front-facing T-pose reference of a single adult human,
intended as input for image-to-3D mesh reconstruction.

SUBJECT
- Race: {RACE_FRAGMENT}
- Body type: {BODY_FRAGMENT}
- Head/face: variant {HEAD_INDEX} — {HEAD_FRAGMENT}
- Hair: {HAIR_FRAGMENT}, color tone {HAIR_TONE}
- Skin tone: {SKIN_TONE}
- Eye color: {EYE_TONE}
- Age range: 24–40
- Expression: neutral, mouth closed, jaw relaxed, eyes open and forward
- Wearing: minimal neutral skin-tight base layer in matte off-white (#E8E5DE),
  no patterns, no logos, no jewelry, no shoes, no headwear — this is a base
  character intended for equipment overlay

POSE (strict)
- T-pose: arms fully extended horizontally at shoulder height, palms down,
  fingers relaxed and slightly spread
- Legs straight, feet shoulder-width apart, toes pointing forward
- Spine vertical, shoulders level, hips level
- Standing directly facing the camera, head level (not tilted)

FRAMING
- Full body visible from top of head to soles of feet with 8% margin
- Single subject, centered, 1:1 aspect ratio
- 50mm equivalent lens, no perspective distortion
- Subject occupies vertical center of frame

LIGHTING
- Three-point studio lighting: soft key from front-right at 30°,
  fill from front-left, low rim from behind
- Neutral white temperature (~5500K), low contrast, no harsh shadows
- No cast shadow on floor

BACKGROUND
- Solid neutral off-white seamless backdrop (#F2EFE9)
- No props, no text, no logos, no environmental detail
- Background fully separable for chroma-key extraction

STYLE
- Photorealistic, sharp focus on the figure, fine pore and skin texture
- No stylization, no painterly effect, no anime, no fantasy embellishment
- The aesthetic is grounded human anthropology reference — like a
  high-end character lineup photo for a film or game production bible

NEGATIVE
- no weapons, no equipment, no accessories, no tattoos, no scars
- no facial hair unless specified, no exaggerated proportions
- no clothing detail beyond the neutral base layer
- no shadows on the floor, no environmental reflections
```

## Token tables

Values match the source-of-truth definitions in `src/3d/races.ts`,
`src/3d/types.ts`, and `src/components/CharacterViewer/rarityMaterial.ts`.

### `{RACE_FRAGMENT}` — phenotype steer

| Race            | Fragment                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `human_steppe`  | Steppe-dwelling human, weathered sun-darkened skin, broad cheekbones, lean wind-shaped features, slight squint from glare, hair typically dark and coarse |
| `human_coastal` | Coastal human, sun-warmed olive skin, balanced symmetric features, medium-set eyes, hair typically medium-brown to chestnut                               |
| `human_alpine`  | Alpine human, pale cool-toned skin acclimated to altitude, slight rosacea across the cheekbones, taller leaner frame, hair often lighter and finer        |

### `{BODY_FRAGMENT}`

| Shape     | Fragment                                                                              |
| --------- | ------------------------------------------------------------------------------------- |
| `lean`    | Slender build, narrow shoulders, low body fat, visible collarbones, lean limbs        |
| `average` | Balanced anatomical proportions, average muscle mass, medium frame                    |
| `heavy`   | Broader build, thicker torso and limbs, higher body mass, fuller shoulders and hips   |

### `{HEAD_FRAGMENT}` — index 0–7

| Idx | Fragment                                                       |
| --- | -------------------------------------------------------------- |
| 0   | oval face, rounded jaw, soft chin, wide-set eyes               |
| 1   | square jaw, wider forehead, prominent brow ridge               |
| 2   | narrow face, sharp angular jaw, high cheekbones                |
| 3   | round face, full cheeks, small chin                            |
| 4   | heart-shaped face, pointed chin, wider temples                 |
| 5   | long face, narrow chin, vertical proportions                   |
| 6   | broad flat face, low brow, strong nose bridge                  |
| 7   | diamond face, prominent cheekbones, narrow jaw and forehead    |

### `{HAIR_FRAGMENT}` — index 0–8

| Idx | Fragment                                                         |
| --- | ---------------------------------------------------------------- |
| 0   | shaved bald, no hair                                             |
| 1   | very short crop, close to the scalp, fade on the sides           |
| 2   | short tousled hair, 4–6cm length, natural part                   |
| 3   | medium length with side fringe falling over one brow             |
| 4   | medium combed-back style, behind the ears                        |
| 5   | shoulder-length straight hair, parted center                     |
| 6   | long flowing hair past the shoulders, slight wave                |
| 7   | topknot / pulled-up bun, sides cropped close                     |
| 8   | braided hair gathered at the nape                                |

### `{HAIR_TONE}` / `{SKIN_TONE}` / `{EYE_TONE}` — pass hex values

Pass hex straight from `RACE_CONFIGS[race].hairPalette[i]` / `skinPalette[i]` /
`eyePalette[i]` in `src/3d/races.ts`. Phrase for Nano Banana as e.g.
`"hair color tone #2C1A0F (dark espresso)"` — the parenthetical natural-language
descriptor anchors the hex.

## Equipment item prompt (separate template)

Drop the anatomy block and swap to:

```
A photorealistic 3D-reference render of a single {ITEM_CATEGORY} item suitable
for image-to-3D mesh reconstruction. The item is photographed in isolation
on a solid neutral off-white seamless backdrop (#F2EFE9), centered, 1:1 aspect.

ITEM
- Type: {SLOT_AND_ARCHETYPE}    e.g. "single-handed sword, MAIN_HAND slot"
- Identity: {ITEM_ID} — {ITEM_DESCRIPTION}
- Rarity tier: {RARITY} — {RARITY_MATERIAL_HINT}
- Pose: oriented for 3D reconstruction — show full silhouette, no foreshortening
- Scale: filling 80% of the frame vertically

LIGHTING / STYLE / NEGATIVE: same as character base template
```

### `{RARITY_MATERIAL_HINT}` — matches `rarityMaterial.ts`

| Rarity      | Hint                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `COMMON`    | weathered iron and worn leather, matte finish, dull `#5A554C` tones, signs of field use           |
| `UNCOMMON`  | tarnished bronze and hardened leather, subtle olive tones `#6B6A4A`                               |
| `RARE`      | polished bronze with copper accents `#8A6E3F`, embossed detail                                    |
| `EPIC`      | gilded bronze with relief work `#A78248`, faint engraving                                         |
| `LEGENDARY` | warm gold `#C8A35E` with high mirror polish, restrained ornament — atelier-grade craftsmanship    |

## v1 batch plan (~48 images)

Drive from a script that iterates the token tables:

```
# Base body archetypes (3)
for body in lean, average, heavy:
  → body_{body}.png

# Head variants (8)
for i in 0..7:
  → head_{i}.png

# Hair variants (9)
for i in 0..8:
  → hair_{i}.png

# Slot defaults — "starting wardrobe" (12)
for slot in HELMET, CHEST, PANTS, BOOTS, GLOVES, AMULET,
            RING_LEFT, RING_RIGHT, BRACELET_LEFT, BRACELET_RIGHT,
            MAIN_HAND, OFF_HAND:
  → equipment/{slot}/_default.png   (rarity=COMMON, archetype=generic)

# Mock fixture items (~15) — see src/mocks/fixtures.ts
for itemId,slot,rarity in fixtures.loadouts:
  → equipment/{slot}/{itemId}.png

# Idle animation (~1) — not Nano Banana; pull from Mixamo library directly.
```

## Notes

- **Character consistency across the catalog**: Nano Banana accepts reference
  image input. Generate one "master reference" body first per race, then pass
  it as a consistency reference when generating heads and hairs so they sit on
  a coherent anatomical base.
- **Adapting for agent portrait thumbnails** (different downstream use): swap
  the FRAMING block to `head-and-shoulders 3/4 portrait, eyes meeting camera,
  neutral expression with hint of presence, head turned 15° left`. Keep all
  other blocks unchanged.
- The neutral `#E8E5DE` base layer matches the page's `--text` token so the
  generated body looks like it belongs in the design system even before
  equipment overlays.
- Race differentiation in v1 is mostly through palette + PRNG bias, not
  through anatomically distinct meshes (per [Question 7][q7]). The race
  fragments above are intentionally subtle.

[q7]: ../AGENTS.md
