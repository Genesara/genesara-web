#!/bin/bash
# Downloads the CC0 source packs for the character viewer into /tmp/quat and
# converts the weapon FBX files to GLB. Run before scripts/prep-models.mjs.
#
# Sources (all CC0 by Quaternius, quaternius.com):
#   - Universal Base Characters        → heads + hairstyles
#   - Modular Character Outfits Fantasy → ranger/peasant outfit parts
#   - Universal Animation Library       → Idle_Loop clip
#   - LowPoly Medieval Weapons          → hand props (FBX → GLB via fbx2gltf)
#
# itch.io download URLs are session-generated, so this walks the same flow a
# browser does (free downloads, no account needed).
set -euo pipefail

dl() { # dl <itch-slug> <outfile-prefix>
  local SLUG=$1 OUT=$2 JAR PAGE TOKEN DLPAGE_URL DLPAGE TOKEN2
  JAR=$(mktemp)
  PAGE=$(curl -sL --max-time 20 -c "$JAR" "https://quaternius.itch.io/$SLUG")
  TOKEN=$(echo "$PAGE" | grep -oE 'csrf_token" value="[^"]*"' | sed 's/csrf_token" value="//;s/"$//' | head -1)
  DLPAGE_URL=$(curl -s --max-time 20 -b "$JAR" -X POST "https://quaternius.itch.io/$SLUG/download_url" \
    --data-urlencode "csrf_token=$TOKEN" | python3 -c "import json,sys;print(json.load(sys.stdin)['url'])")
  DLPAGE=$(curl -sL --max-time 20 -b "$JAR" "$DLPAGE_URL")
  TOKEN2=$(echo "$DLPAGE" | grep -oE 'csrf_token" value="[^"]*"' | sed 's/csrf_token" value="//;s/"$//' | head -1)
  for UPID in $(echo "$DLPAGE" | grep -oE 'data-upload_id="[0-9]+"' | grep -oE '[0-9]+' | sort -u); do
    local FURL
    FURL=$(curl -s --max-time 20 -b "$JAR" -X POST "https://quaternius.itch.io/$SLUG/file/$UPID?source=game_download" \
      --data-urlencode "csrf_token=$TOKEN2" | python3 -c "import json,sys;print(json.load(sys.stdin)['url'])")
    echo "downloading $SLUG ($UPID)…"
    curl -s --max-time 900 "$FURL" -o "${OUT}_$UPID.zip"
  done
  rm -f "$JAR"
}

mkdir -p /tmp/quat
cd /tmp/quat

dl universal-base-characters ubc
dl modular-character-outfits-fantasy outfits
dl universal-animation-library anims
dl lowpoly-medieval-weapons weapons

unzip -q -o ubc_*.zip -d ubc
unzip -q -o outfits_*.zip -d outfits
unzip -q -o anims_*.zip -d anims
unzip -q -o weapons_*.zip -d weapons

# Weapons ship FBX-only; convert the set the viewer uses.
mkdir -p weapons_glb fbxconv && cd fbxconv
npm init -y >/dev/null 2>&1 && npm i fbx2gltf >/dev/null 2>&1
node -e "
const convert = require('fbx2gltf');
const files = ['Sword','Dagger','Bow_Wooden','Axe','Hammer_Small','Spear','Shield_Round','Claymore'];
(async () => {
  for (const f of files) {
    await convert('/tmp/quat/weapons/FBX/' + f + '.fbx', '/tmp/quat/weapons_glb/' + f + '.glb', ['--binary']);
    console.log('converted', f);
  }
})();
"
echo "done — now run: node scripts/prep-models.mjs"
