// Agent detail page — controls + data
// -------------------------------------------------------------------

// ── AGENT DATA ───────────────────────────────────────────────────
const AGENTS = {
  artemis: {
    name: 'Artemis',
    cls: 'RESEARCHER',
    clsLower: 'researcher',
    level: 7,
    location: 'fyrnhold.archive',
    hp: 68, hpMax: 80, stamina: 42, staminaMax: 100, mana: 71, manaMax: 90,
    status: 'online', statusColor: 'var(--friendly)',
    startHex: { col: 4, row: 2 },
    attrs: { STR: [10, 0], DEX: [14, 1], CON: [12, 0], PER: [16, 2], INT: [18, 3], LUCK: [9, 0] },
    skills: [
      ['alchemy', 4, 80], ['herbalism', 3, 60], ['anatomy', 2, 40], ['persuasion', 1, 20]
    ],
    skillsUsed: 4, skillsTotal: 9,
    rep: [['authority', '+218', 'up'], ['fame', '+142', 'up'], ['faction', 'northwood concord', ''], ['rank', 'archivist', '']],
    xp: 2140, xpNext: 3200,
    intent: 'Move to <span class="accent">iron_vein.east</span> and gather ore until stamina &lt; 30.',
    intentWhy: '“the archive paid out — ore funds the next expedition.”',
    equipment: {
      HELMET: { name: 'Scholar\'s Circlet', rarity: 'rare', glyph: 'C',
        stats: [['+INT', '+2', 'up'], ['+PER', '+1', 'up'], ['armor', '4']],
        flavor: 'A thin iron band etched with constellations.', durab: 90 },
      AMULET: { name: 'Amulet of Insight', rarity: 'uncommon', glyph: 'A',
        stats: [['+INT', '+1', 'up'], ['+mana regen', '+1', 'up']],
        flavor: 'A glass eye that does not blink.', durab: 100 },
      CHEST: { name: 'Reinforced Robes', rarity: 'common', glyph: 'R',
        stats: [['armor', '12'], ['weight', '2.4 kg']],
        flavor: 'Warm enough for the archive cold.', durab: 64 },
      GLOVES: { name: 'Apothecary Gloves', rarity: 'common', glyph: 'G',
        stats: [['armor', '3'], ['+alchemy', 'rk 1', 'up']],
        flavor: 'Stained beyond rescue.', durab: 42 },
      PANTS: { name: 'Travel Breeches', rarity: 'common', glyph: 'P',
        stats: [['armor', '6']],
        flavor: 'Pockets within pockets.', durab: 70 },
      BOOTS: { name: 'Walking Boots', rarity: 'common', glyph: 'B',
        stats: [['armor', '2'], ['+stam regen', '+1', 'up']],
        flavor: 'Three soles, replaced twice.', durab: 55 },
      BRACELET_LEFT: { name: 'Copper Charm', rarity: 'common', glyph: 'b',
        stats: [['+LCK', '+1', 'up']],
        flavor: 'A gift, refused once, accepted twice.', durab: 100 },
      BRACELET_RIGHT: { name: 'Sigil Cord', rarity: 'uncommon', glyph: 'b',
        stats: [['+mana regen', '+2', 'up']],
        flavor: 'Knotted by someone who knew the names.', durab: 88 },
      RING_LEFT: null,
      RING_RIGHT: null,
      MAIN_HAND: { name: 'Scribed Quill', rarity: 'uncommon', glyph: 'q',
        stats: [['damage', '3'], ['+scry', 'rk 1', 'up'], ['range', '1']],
        flavor: 'A pen sharp enough to draw ink or blood.', durab: 78 },
      OFF_HAND: null,
    },
    inventory: [
      { glyph: 'ø', name: 'Iron Ore', qty: 12, rarity: 'common' },
      { glyph: 'h', name: 'Wild Herb', qty: 8, rarity: 'common' },
      { glyph: '!', name: 'Lesser Healing', qty: 3, rarity: 'uncommon' },
      { glyph: '!', name: 'Stamina Tonic', qty: 2, rarity: 'uncommon' },
      { glyph: '✶', name: 'Aether Crystal', qty: 1, rarity: 'rare' },
      { glyph: '§', name: 'Concord Cipher', qty: 1, rarity: 'rare' },
      { glyph: 'k', name: 'Bronze Key', qty: 2, rarity: 'common' },
      { glyph: 'p', name: 'Parchment', qty: 14, rarity: 'common' },
      { glyph: 'i', name: 'Ink Vial', qty: 4, rarity: 'common' },
      { glyph: 'f', name: 'Dried Fish', qty: 6, rarity: 'common' },
      { glyph: 'b', name: 'Hardtack', qty: 10, rarity: 'common' },
      { glyph: 't', name: 'Rope (10m)', qty: 1, rarity: 'common' },
      { glyph: '☩', name: 'Cursed Tooth', qty: 1, rarity: 'cursed' },
      { glyph: '✦', name: 'Northwood Sigil', qty: 1, rarity: 'epic' },
    ],
  },

  baldur: {
    name: 'Baldur',
    cls: '???',
    clsLower: 'unrevealed',
    level: 3,
    location: 'hollow_pass.east (last seen)',
    hp: 31, hpMax: 60, stamina: 88, staminaMax: 100, mana: 10, manaMax: 30,
    status: 'offline · 3d ago', statusColor: 'var(--text-dim)',
    startHex: { col: 7, row: 5 },
    attrs: { STR: [15, 2], DEX: [13, 1], CON: [14, 1], PER: [9, 0], INT: [8, 0], LUCK: [11, 0] },
    skills: [
      ['dagger', 2, 40], ['intimidation', 1, 20], ['pickpocket', 1, 20]
    ],
    skillsUsed: 3, skillsTotal: 8,
    rep: [['authority', '−12', 'down'], ['fame', '+8', 'up'], ['faction', 'unaffiliated', ''], ['rank', '—', '']],
    xp: 410, xpNext: 1400,
    intent: '— <em>offline. last queued action unsent.</em>',
    intentWhy: '“parley refused. fled east into the pass.”',
    equipment: {
      HELMET: { name: 'Hooded Cowl', rarity: 'common', glyph: 'h',
        stats: [['armor', '2'], ['+stealth', 'rk 1', 'up']],
        flavor: 'Cheap cloth, but it hides a face.', durab: 38 },
      AMULET: null,
      CHEST: { name: 'Padded Jerkin', rarity: 'common', glyph: 'J',
        stats: [['armor', '8']],
        flavor: 'Patched in three places.', durab: 48 },
      GLOVES: { name: 'Cutter Gloves', rarity: 'uncommon', glyph: 'g',
        stats: [['armor', '2'], ['+pickpocket', 'rk 1', 'up']],
        flavor: 'The fingertips are missing on purpose.', durab: 62 },
      PANTS: { name: 'Marsh Trousers', rarity: 'common', glyph: 'T',
        stats: [['armor', '4'], ['+swamp move', '+1', 'up']],
        flavor: '', durab: 71 },
      BOOTS: { name: 'Soft Soles', rarity: 'common', glyph: 'b',
        stats: [['armor', '1'], ['+stealth', 'rk 1', 'up']],
        flavor: 'Quieter than they should be.', durab: 28 },
      BRACELET_LEFT: null,
      BRACELET_RIGHT: null,
      RING_LEFT: { name: 'Tarnished Band', rarity: 'cursed', glyph: 'r',
        stats: [['+STR', '+1', 'up'], ['-fame', '-1', 'down']],
        flavor: 'Removed from a hand that no longer needed it.', durab: 100 },
      RING_RIGHT: null,
      MAIN_HAND: { name: 'Notched Dagger', rarity: 'common', glyph: 'd',
        stats: [['damage', '7'], ['range', '1'], ['speed', '1.4']],
        flavor: 'Notches along the spine. Eight of them.', durab: 51 },
      OFF_HAND: null,
    },
    inventory: [
      { glyph: 'c', name: 'Copper Coins', qty: 41, rarity: 'common' },
      { glyph: '!', name: 'Cheap Wine', qty: 2, rarity: 'common' },
      { glyph: 'l', name: 'Lockpick', qty: 3, rarity: 'common' },
      { glyph: 'k', name: 'Stolen Key', qty: 1, rarity: 'uncommon' },
      { glyph: 't', name: 'Garrote Wire', qty: 1, rarity: 'uncommon' },
      { glyph: 'h', name: 'Hardtack', qty: 2, rarity: 'common' },
      { glyph: '☩', name: 'Bone Charm', qty: 1, rarity: 'cursed' },
      { glyph: 'p', name: 'Crumpled Map', qty: 1, rarity: 'common' },
    ],
  },

  cassia: {
    name: 'Cassia',
    cls: 'SCOUT',
    clsLower: 'scout',
    level: 12,
    location: 'dunhaven.cartographers',
    hp: 112, hpMax: 120, stamina: 78, staminaMax: 110, mana: 130, manaMax: 130,
    status: 'online · now', statusColor: 'var(--friendly)',
    startHex: { col: 3, row: 3 },
    attrs: { STR: [11, 0], DEX: [15, 2], CON: [13, 1], PER: [17, 3], INT: [16, 2], LUCK: [14, 1] },
    skills: [
      ['cartography', 6, 100], ['tracking', 5, 83], ['survival', 4, 66],
      ['persuasion', 4, 66], ['foraging', 2, 40]
    ],
    skillsUsed: 5, skillsTotal: 10,
    rep: [['authority', '+402', 'up'], ['fame', '+581', 'up'], ['faction', 'northwood concord', ''], ['rank', 'wayfinder', '']],
    xp: 5820, xpNext: 7200,
    intent: 'Survey the <span class="accent">iron_coast.south</span> ridge — three unmapped hexes remain.',
    intentWhy: '“the concord pays per sheet. the ridge is worth four.”',
    equipment: {
      HELMET: { name: 'Tracker\'s Hood', rarity: 'rare', glyph: 'H',
        stats: [['armor', '5'], ['+PER', '+2', 'up'], ['+tracking', 'rk 1', 'up']],
        flavor: 'A hood that hears what the wind hears.', durab: 84 },
      AMULET: { name: 'Compass Pendant', rarity: 'epic', glyph: 'C',
        stats: [['+cartography', 'rk 1', 'up'], ['+orient', 'always', 'up']],
        flavor: 'It points to whatever you most need to find.', durab: 100 },
      CHEST: { name: 'Wayfarer\'s Cloak', rarity: 'rare', glyph: 'W',
        stats: [['armor', '14'], ['+survival', 'rk 1', 'up'], ['weight', '1.8 kg']],
        flavor: 'Lined with greymarsh wool.', durab: 92 },
      GLOVES: { name: 'Surveyor Gloves', rarity: 'uncommon', glyph: 'g',
        stats: [['armor', '3'], ['+DEX', '+1', 'up']],
        flavor: 'Soft enough for the brass instruments.', durab: 77 },
      PANTS: { name: 'Trailwool Breeches', rarity: 'uncommon', glyph: 'p',
        stats: [['armor', '7'], ['+cold resist', '+2', 'up']],
        flavor: '', durab: 81 },
      BOOTS: { name: 'Pathfinder Boots', rarity: 'rare', glyph: 'B',
        stats: [['armor', '4'], ['+move speed', '+1', 'up'], ['+stam regen', '+2', 'up']],
        flavor: 'Worn the long way around twice.', durab: 88 },
      BRACELET_LEFT: { name: 'Concord Cord', rarity: 'uncommon', glyph: 'b',
        stats: [['+authority', '+1', 'up']],
        flavor: '', durab: 94 },
      BRACELET_RIGHT: null,
      RING_LEFT: { name: 'Surveyor\'s Signet', rarity: 'rare', glyph: 'r',
        stats: [['+cartography', 'rk 1', 'up']],
        flavor: 'A small brass disc that fits in the palm.', durab: 100 },
      RING_RIGHT: null,
      MAIN_HAND: { name: 'Bone Shortbow', rarity: 'uncommon', glyph: 'b',
        stats: [['damage', '9'], ['range', '4'], ['+DEX', '+1', 'up']],
        flavor: '', durab: 67 },
      OFF_HAND: { name: 'Quiver (12)', rarity: 'uncommon', glyph: 'q',
        stats: [['arrows', '12'], ['+reload', 'rk 1', 'up']],
        flavor: '', durab: 100 },
    },
    inventory: [
      { glyph: '§', name: 'Map Sheet 14', qty: 1, rarity: 'rare' },
      { glyph: '§', name: 'Map Sheet 15', qty: 1, rarity: 'rare' },
      { glyph: 's', name: 'Silver', qty: 80, rarity: 'common' },
      { glyph: 'c', name: 'Copper Coins', qty: 142, rarity: 'common' },
      { glyph: '!', name: 'Stamina Tonic', qty: 4, rarity: 'uncommon' },
      { glyph: '!', name: 'Lesser Healing', qty: 5, rarity: 'uncommon' },
      { glyph: 't', name: 'Trail Rope', qty: 2, rarity: 'common' },
      { glyph: 'k', name: 'Spike + Pitons', qty: 8, rarity: 'common' },
      { glyph: 'p', name: 'Survey Parchment', qty: 22, rarity: 'common' },
      { glyph: 'i', name: 'Surveyor Ink', qty: 6, rarity: 'common' },
      { glyph: 'f', name: 'Smoked Trail Meat', qty: 12, rarity: 'common' },
      { glyph: '✶', name: 'Star-Chart Fragment', qty: 1, rarity: 'epic' },
    ],
  },
};

// nav order for the prev/next buttons
const AGENT_ORDER = ['artemis', 'baldur', 'cassia'];


// ── TERRAIN ──────────────────────────────────────────────────────
const TERRAIN = {
  MOUNTAIN:      { color: '#4a4438', label: 'mountain',      glyph: '▲', walk: false },
  ALPINE:        { color: '#5a626c', label: 'alpine',        glyph: '▲', walk: true },
  FOOTHILLS:     { color: '#5a4a30', label: 'foothills',     glyph: 'n', walk: true },
  HILLS:         { color: '#6a5530', label: 'hills',         glyph: '⌒', walk: true },
  FOREST_EDGE:   { color: '#3a4a2e', label: 'forest edge',   glyph: '♣', walk: true },
  FOREST:        { color: '#2d4a2d', label: 'forest',        glyph: '♣', walk: true },
  BIRCH_FOREST:  { color: '#4a6a3e', label: 'birch forest',  glyph: '♣', walk: true },
  MEADOW:        { color: '#6e7e3e', label: 'meadow',        glyph: '"', walk: true },
  PLAINS:        { color: '#8a7438', label: 'plains',        glyph: ',', walk: true },
  WETLANDS:      { color: '#3a4838', label: 'wetlands',      glyph: '~', walk: true },
  RIVER_DELTA:   { color: '#3a5868', label: 'river delta',   glyph: '≋', walk: true },
  STONE_BRIDGE:  { color: '#706860', label: 'stone bridge',  glyph: '=', walk: true },
  COASTAL:       { color: '#7a8868', label: 'coastal',       glyph: '~', walk: true },
  SHORELINE:     { color: '#85795a', label: 'shoreline',     glyph: '∿', walk: true },
  OCEAN:         { color: '#1e3a55', label: 'ocean',         glyph: '≈', walk: false },
  ANCIENT_RUINS: { color: '#5a5048', label: 'ancient ruins', glyph: '◫', walk: true },
  DIRT_PATH:     { color: '#5a3a28', label: 'dirt path',     glyph: ':', walk: true },
};

const SHORT = {
  M: 'MOUNTAIN', A: 'ALPINE', Fh: 'FOOTHILLS', H: 'HILLS',
  Fe: 'FOREST_EDGE', F: 'FOREST', B: 'BIRCH_FOREST',
  Md: 'MEADOW', P: 'PLAINS', W: 'WETLANDS', Rd: 'RIVER_DELTA',
  Sb: 'STONE_BRIDGE', C: 'COASTAL', Sh: 'SHORELINE', O: 'OCEAN',
  Ar: 'ANCIENT_RUINS', Dp: 'DIRT_PATH',
};

const MAP_RAW = [
  'M  A  A  A  Fe F  F  C  C  O  O',
  'A  Fh Fh Fe F  B  F  C  Sh O  O',
  'Fh H  H  Fe Md Md P  Sh O  O  O',
  'H  Fh Md Md Sb Md P  Sh O  O  O',
  'H  Md Md W  Rd W  P  C  O  O  O',
  'P  Md Md W  W  P  P  Dp Ar O  O',
  'P  P  Md Md Md P  Dp Dp Ar C  O',
];

// parse map into 2D array of terrain keys
const MAP = MAP_RAW.map(row => row.trim().split(/\s+/).map(c => SHORT[c]));
const MAP_W = MAP[0].length; // 11
const MAP_H = MAP.length;    // 7


// ── BOOTSTRAP ────────────────────────────────────────────────────
let CURRENT;     // current agent obj
let CURRENT_ID;  // current agent id string
let WORLD;       // world map state (positions of all visible agents)

function pickAgent() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id && AGENTS[id]) return id;
  return 'artemis';
}

document.addEventListener('DOMContentLoaded', () => {
  CURRENT_ID = pickAgent();
  CURRENT = AGENTS[CURRENT_ID];
  renderAgent(CURRENT);
  renderEquipment(CURRENT.equipment);
  renderInventory(CURRENT.inventory);
  renderWorld(CURRENT);
  renderLegend();
  bindSlotTooltips();
  bindLogwin();
  setupNav();
  startTickers();
});

function goToAgent(id) {
  location.search = '?id=' + id;
}

function setupNav() {
  const idx = AGENT_ORDER.indexOf(CURRENT_ID);
  const prev = AGENT_ORDER[(idx + AGENT_ORDER.length - 1) % AGENT_ORDER.length];
  const next = AGENT_ORDER[(idx + 1) % AGENT_ORDER.length];
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    if (i === 0) { btn.textContent = '← ' + prev; btn.onclick = () => goToAgent(prev); }
    if (i === 1) { btn.textContent = next + ' →'; btn.onclick = () => goToAgent(next); }
  });
}


// ── RENDER: HEADER + SHEET ───────────────────────────────────────
function renderAgent(a) {
  document.title = a.name + ' — Genesara';
  document.getElementById('crumb-agent').textContent = a.name.toLowerCase();
  document.getElementById('agent-name').textContent = a.name;
  document.getElementById('agent-class').textContent = a.cls;
  document.getElementById('agent-level').textContent = 'Lvl ' + a.level;
  document.getElementById('agent-loc').textContent = a.location;
  const hpPct = Math.round((a.hp / a.hpMax) * 100);
  document.getElementById('hp-bar').style.setProperty('--pct', hpPct + '%');
  document.getElementById('hp-val').textContent = a.hp + ' / ' + a.hpMax;
  const stEl = document.getElementById('agent-status');
  stEl.textContent = a.status;
  stEl.style.color = a.statusColor;
  document.getElementById('logwin-sub').textContent = a.name.toLowerCase() + ' · --follow';

  // ── character sheet vitals ─────────────────────────────
  const sheet = document.querySelector('.sheet');
  // wipe + rebuild from data
  sheet.innerHTML = `
    <h3>vitals</h3>
    <div class="vital"><span class="k">HP</span><span class="bar hp ${a.hp/a.hpMax < 0.4 ? 'low' : ''}"><span style="--pct:${(a.hp/a.hpMax*100).toFixed(0)}%"></span></span><span class="v">${a.hp} / ${a.hpMax}</span></div>
    <div class="vital"><span class="k">STAMINA</span><span class="bar"><span style="--pct:${(a.stamina/a.staminaMax*100).toFixed(0)}%"></span></span><span class="v">${a.stamina} / ${a.staminaMax}</span></div>
    <div class="vital"><span class="k">MANA</span><span class="bar mana"><span style="--pct:${(a.mana/a.manaMax*100).toFixed(0)}%"></span></span><span class="v">${a.mana} / ${a.manaMax}</span></div>

    <h3>attributes</h3>
    <div class="attrs">
      ${Object.entries(a.attrs).map(([k, [v, bonus]]) => `
        <div class="a"><span class="k">${k}</span><span class="v">${v}</span><span class="bonus">${bonus >= 0 ? '+' : ''}${bonus}</span></div>
      `).join('')}
    </div>

    <h3>skills <span class="right">${a.skillsUsed} / ${a.skillsTotal} slots used</span></h3>
    ${a.skills.map(([nm, rk, pct]) => `
      <div class="skill-row"><span class="nm">${nm}</span><span class="bar"><span style="--pct:${pct}%"></span></span><span class="rk">rk ${rk}</span></div>
    `).join('')}

    <h3>reputation</h3>
    <div class="meta-grid">
      ${a.rep.map(([k, v, dir]) => `
        <div class="row"><span class="k">${k}</span><span class="v ${dir}">${v}</span></div>
      `).join('')}
    </div>

    <div class="xp-row">
      <span class="k">XP</span>
      <span class="bar"><span style="--pct:${(a.xp/a.xpNext*100).toFixed(0)}%"></span></span>
      <span class="v">${a.xp.toLocaleString()} / ${a.xpNext.toLocaleString()}</span>
    </div>
  `;

  // activity panel
  document.getElementById('intent-what').innerHTML = a.intent;
  document.getElementById('intent-why').innerHTML = a.intentWhy;
}


// ── RENDER: EQUIPMENT ────────────────────────────────────────────
function renderEquipment(eq) {
  const slots = document.querySelectorAll('#doll .slot');
  let equippedCount = 0;
  slots.forEach(slot => {
    const id = slot.dataset.slot;
    const item = eq[id];
    // clear any old item
    slot.querySelectorAll('.item').forEach(n => n.remove());
    if (item) {
      slot.classList.remove('empty');
      const span = document.createElement('span');
      span.className = 'item rarity-' + item.rarity;
      span.textContent = item.glyph;
      slot.appendChild(span);
      equippedCount++;
    } else {
      slot.classList.add('empty');
    }
  });
  // update header
  const head = document.querySelector('.col-left .panel .panel-head .right');
  if (head) head.textContent = `12 slots · ${equippedCount} equipped`;
}


// ── RENDER: INVENTORY ────────────────────────────────────────────
function renderInventory(items) {
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';
  const CELLS = 32;
  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement('div');
    const item = items[i];
    if (item) {
      cell.className = 'inv-cell rarity-' + item.rarity;
      cell.title = item.name + (item.qty > 1 ? ' ×' + item.qty : '');
      cell.innerHTML = `${item.glyph}<span class="qty">${item.qty > 1 ? item.qty : ''}</span>`;
    } else {
      cell.className = 'inv-cell empty';
    }
    grid.appendChild(cell);
  }
}


// ── TOOLTIPS: EQUIPMENT SLOTS ────────────────────────────────────
function bindSlotTooltips() {
  const tip = document.getElementById('slot-tip');
  document.querySelectorAll('#doll .slot').forEach(slot => {
    slot.addEventListener('mouseenter', e => showSlotTip(slot, tip));
    slot.addEventListener('mousemove', e => positionTip(tip, e));
    slot.addEventListener('mouseleave', () => { tip.classList.remove('show'); });
  });
}

function showSlotTip(slot, tip) {
  const id = slot.dataset.slot;
  const item = CURRENT.equipment[id];
  tip.classList.remove('empty-slot');
  if (!item) {
    tip.classList.add('empty-slot');
    tip.innerHTML = `
      <div class="nm">${prettySlot(id)}</div>
      <div class="rar common">empty slot</div>
      <div class="flavor">— nothing equipped —</div>
    `;
  } else {
    tip.innerHTML = `
      <div class="nm">${item.name}</div>
      <div class="rar ${item.rarity}">${item.rarity} · ${prettySlot(id)}</div>
      <div class="stats">
        ${item.stats.map(([k, v, dir]) => `
          <div class="row"><span class="k">${k}</span><span class="v ${dir || ''}">${v}</span></div>
        `).join('')}
      </div>
      ${item.flavor ? `<div class="flavor">${item.flavor}</div>` : ''}
      <div class="durab">
        <span>durability</span>
        <span class="b"><span style="--pct:${item.durab}%"></span></span>
        <span>${item.durab}%</span>
      </div>
    `;
  }
  tip.classList.add('show');
}

function prettySlot(id) {
  return id.toLowerCase().replace(/_/g, ' ');
}

function positionTip(tip, e) {
  const margin = 14;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = e.clientX + margin;
  let y = e.clientY - th / 2;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - margin;
  if (y < 8) y = 8;
  if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
  tip.style.left = x + 'px';
  tip.style.top  = y + 'px';
}


// ── WORLD MAP ────────────────────────────────────────────────────
// Hex geometry (pointy-top)
const HEX_SIZE = 34;
const HEX_W = Math.sqrt(3) * HEX_SIZE;
const HEX_H = 2 * HEX_SIZE;
const HEX_VS = HEX_H * 0.75;
const HEX_OX = 38;
const HEX_OY = 40;

function hexCenter(col, row) {
  const offset = (row % 2 === 0) ? 0 : HEX_W / 2;
  return {
    x: HEX_OX + col * HEX_W + offset + HEX_W / 2,
    y: HEX_OY + row * HEX_VS + HEX_SIZE,
  };
}

function hexPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i - Math.PI / 2;  // pointy-top start at top
    pts.push((cx + HEX_SIZE * Math.cos(a)).toFixed(2) + ',' + (cy + HEX_SIZE * Math.sin(a)).toFixed(2));
  }
  return pts.join(' ');
}

// adjacency
function neighbors(col, row) {
  const even = (row % 2 === 0);
  const dirs = even
    ? [[-1,-1],[0,-1],[-1,0],[1,0],[-1,1],[0,1]]
    : [[0,-1],[1,-1],[-1,0],[1,0],[0,1],[1,1]];
  return dirs.map(d => ({ col: col + d[0], row: row + d[1] }))
    .filter(p => p.col >= 0 && p.col < MAP_W && p.row >= 0 && p.row < MAP_H);
}

function terrainAt(col, row) {
  if (row < 0 || row >= MAP_H || col < 0 || col >= MAP_W) return null;
  return MAP[row][col];
}

function renderWorld(a) {
  const svg = document.getElementById('world-svg');
  svg.innerHTML = '';

  const NS = 'http://www.w3.org/2000/svg';
  // 1) hex tiles
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'g-hexes');
  for (let r = 0; r < MAP_H; r++) {
    for (let c = 0; c < MAP_W; c++) {
      const tkey = MAP[r][c];
      const t = TERRAIN[tkey];
      const { x, y } = hexCenter(c, r);
      const poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', hexPoints(x, y));
      poly.setAttribute('fill', t.color);
      poly.setAttribute('stroke', '#2B2A26');
      poly.setAttribute('stroke-width', '0.8');
      poly.setAttribute('data-col', c);
      poly.setAttribute('data-row', r);
      poly.style.cursor = 'crosshair';
      g.appendChild(poly);
      // faded glyph in center
      const txt = document.createElementNS(NS, 'text');
      txt.setAttribute('x', x);
      txt.setAttribute('y', y + 4);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-family', 'JetBrains Mono, monospace');
      txt.setAttribute('font-size', '12');
      txt.setAttribute('fill', 'rgba(232,229,222,0.18)');
      txt.setAttribute('pointer-events', 'none');
      txt.textContent = t.glyph;
      g.appendChild(txt);
    }
  }
  svg.appendChild(g);

  // 2) Fyrnhold settlement marker on its hex
  {
    const { x, y } = hexCenter(4, 2);
    const sq = document.createElementNS(NS, 'rect');
    sq.setAttribute('x', x - 7); sq.setAttribute('y', y - 7);
    sq.setAttribute('width', 14); sq.setAttribute('height', 14);
    sq.setAttribute('fill', '#C8A35E');
    sq.setAttribute('pointer-events', 'none');
    svg.appendChild(sq);
  }

  // 3) other agents — render dots
  WORLD = {
    agents: {
      [CURRENT_ID]: { col: a.startHex.col, row: a.startHex.row, primary: true, name: a.name.toLowerCase() },
    },
    others: []
  };
  // friends + hostiles around current
  // Place a few agents relative to the player's startHex.
  const sh = a.startHex;
  const others = [
    { id: 'cassia',  name: 'cassia',  rel: { col: -1, row: +1 }, color: 'var(--friendly)', kind: 'friendly' },
    { id: 'orin',    name: 'orin',    rel: { col: +1, row:  0 }, color: 'var(--friendly)', kind: 'friendly' },
    { id: 'warg-3a', name: 'warg-3a', rel: { col: +2, row: +1 }, color: 'var(--hostile)',  kind: 'hostile' },
    { id: 'myrr',    name: 'myrr',    rel: { col: +1, row: +2 }, color: 'var(--text-dim)', kind: 'neutral' },
  ];
  if (CURRENT_ID === 'cassia') {
    // cassia is in a different region; swap a couple
    others[0] = { id: 'artemis', name: 'artemis', rel: { col: +1, row: -1 }, color: 'var(--friendly)', kind: 'friendly' };
    others[1] = { id: 'orin',    name: 'orin',    rel: { col: +2, row:  0 }, color: 'var(--friendly)', kind: 'friendly' };
  }
  others.forEach(o => {
    const col = sh.col + o.rel.col;
    const row = sh.row + o.rel.row;
    if (col < 0 || col >= MAP_W || row < 0 || row >= MAP_H) return;
    const t = TERRAIN[MAP[row][col]];
    if (!t.walk) return;
    WORLD.others.push({ ...o, col, row });
  });

  drawAgents();
}

function drawAgents() {
  const svg = document.getElementById('world-svg');
  // remove old
  const old = svg.querySelector('#g-agents');
  if (old) old.remove();
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'g-agents');

  // others first (so primary draws on top)
  WORLD.others.forEach(o => {
    const { x, y } = hexCenter(o.col, o.row);
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    dot.setAttribute('r', 5);
    dot.setAttribute('fill', o.color);
    dot.setAttribute('stroke', '#0E0F12');
    dot.setAttribute('stroke-width', '1');
    dot.style.transition = 'all 800ms ease';
    g.appendChild(dot);
  });

  // primary
  const me = WORLD.agents[CURRENT_ID];
  const { x, y } = hexCenter(me.col, me.row);
  const ring = document.createElementNS(NS, 'circle');
  ring.setAttribute('cx', x); ring.setAttribute('cy', y);
  ring.setAttribute('r', 12);
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#C8A35E');
  ring.setAttribute('stroke-width', '1.4');
  ring.setAttribute('id', 'me-ring');
  ring.style.transition = 'all 800ms ease';
  g.appendChild(ring);

  const pawn = document.createElementNS(NS, 'circle');
  pawn.setAttribute('cx', x); pawn.setAttribute('cy', y);
  pawn.setAttribute('r', 6.5);
  pawn.setAttribute('fill', '#E8E5DE');
  pawn.setAttribute('stroke', '#C8A35E');
  pawn.setAttribute('stroke-width', '1.5');
  pawn.setAttribute('id', 'me-pawn');
  pawn.style.transition = 'all 800ms ease';
  g.appendChild(pawn);

  svg.appendChild(g);

  // hex tooltip binding (re-bind every render)
  bindHexHover();
}

function bindHexHover() {
  const tip = document.getElementById('world-tip');
  const canvas = document.getElementById('world-canvas');
  const svg = document.getElementById('world-svg');
  svg.querySelectorAll('#g-hexes polygon').forEach(poly => {
    poly.addEventListener('mouseenter', e => {
      const c = +poly.dataset.col, r = +poly.dataset.row;
      const tkey = MAP[r][c];
      const t = TERRAIN[tkey];
      // figure who's here
      const here = [];
      const me = WORLD.agents[CURRENT_ID];
      if (me.col === c && me.row === r) here.push(`<span class="friendly">${me.name}</span> (you)`);
      WORLD.others.forEach(o => {
        if (o.col === c && o.row === r) here.push(`<span class="${o.kind === 'hostile' ? 'hostile' : (o.kind === 'friendly' ? 'friendly' : '')}">${o.name}</span>`);
      });
      tip.querySelector('.terrain').textContent = t.label.toUpperCase();
      tip.querySelector('.coord').textContent = `${c}, ${r}` + (t.walk ? '' : ' · impassable');
      tip.querySelector('.agents').innerHTML = here.length ? '⚐ ' + here.join(', ') : '';
      tip.classList.add('show');
    });
    poly.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      tip.style.left = (e.clientX - rect.left + 12) + 'px';
      tip.style.top  = (e.clientY - rect.top  - 8) + 'px';
    });
    poly.addEventListener('mouseleave', () => tip.classList.remove('show'));
  });
}

function renderLegend() {
  const legend = document.getElementById('world-legend');
  // sample 6 terrains relevant to this region
  const sample = ['MEADOW', 'FOREST', 'WETLANDS', 'OCEAN', 'MOUNTAIN', 'DIRT_PATH'];
  legend.innerHTML = sample.map(k => `
    <span class="item"><span class="swatch" style="background:${TERRAIN[k].color}"></span>${TERRAIN[k].label}</span>
  `).join('') + `
    <span class="item"><span class="swatch" style="background:var(--friendly); border-color:var(--friendly);"></span>friendly</span>
    <span class="item"><span class="swatch" style="background:var(--hostile); border-color:var(--hostile);"></span>hostile</span>
  `;
}


// ── TICKERS: agent movement + log + tick counter ─────────────────
let TICK_N = 4712389;
function startTickers() {
  // tick counter jitter
  setInterval(() => {
    TICK_N += 1 + Math.floor(Math.random() * 3);
    const s = TICK_N.toLocaleString('en-US');
    const t1 = document.getElementById('sheet-tick'); if (t1) t1.textContent = s;
    const t2 = document.getElementById('map-tick');   if (t2) t2.textContent = 'live · tick ' + s;
  }, 2200);

  // agent action loop
  if (CURRENT.status !== 'offline · 3d ago') {
    setTimeout(takeAction, 3500);
    setInterval(takeAction, 5500);
  }

  // last-action drift
  let lastSecs = 14;
  setInterval(() => {
    lastSecs += 2;
    if (lastSecs > 90) lastSecs = 2;
    const el = document.getElementById('last-action');
    if (el) el.textContent = lastSecs + 's ago';
  }, 2000);
}

function takeAction() {
  const verbs = [
    { v: 'moved',     w: 5, fn: doMove,    cls: '' },
    { v: 'gathered',  w: 2, fn: doGather,  cls: '' },
    { v: 'spoke',     w: 1, fn: doSpoke,   cls: 'muted' },
    { v: 'scryed',    w: 1, fn: doScryed,  cls: '' },
    { v: 'traded',    w: 1, fn: doTraded,  cls: '' },
    { v: 'rested',    w: 1, fn: doRested,  cls: 'muted' },
  ];
  // weighted pick
  const total = verbs.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let pick = verbs[0];
  for (const v of verbs) { r -= v.w; if (r <= 0) { pick = v; break; } }
  const text = pick.fn();
  appendLog(pick.v, pick.cls, text);
  document.getElementById('last-action').textContent = 'now';
}

function doMove() {
  const me = WORLD.agents[CURRENT_ID];
  const nb = neighbors(me.col, me.row).filter(p => {
    const t = TERRAIN[MAP[p.row][p.col]];
    return t.walk;
  });
  if (!nb.length) return 'no path · holding';
  const dest = nb[Math.floor(Math.random() * nb.length)];
  const fromT = TERRAIN[MAP[me.row][me.col]].label;
  const toT   = TERRAIN[MAP[dest.row][dest.col]].label;
  me.col = dest.col; me.row = dest.row;
  // animate pawn
  const { x, y } = hexCenter(me.col, me.row);
  const pawn = document.getElementById('me-pawn');
  const ring = document.getElementById('me-ring');
  if (pawn && ring) {
    pawn.setAttribute('cx', x); pawn.setAttribute('cy', y);
    ring.setAttribute('cx', x); ring.setAttribute('cy', y);
  }
  return `${fromT} → ${toT}`;
}

function doGather() {
  const me = WORLD.agents[CURRENT_ID];
  const t = TERRAIN[MAP[me.row][me.col]];
  const yields = {
    forest: 'wild herb',
    'birch forest': 'birch bark',
    meadow: 'wild herb',
    plains: 'tall grass',
    wetlands: 'reed',
    hills: 'iron ore',
    foothills: 'stone',
    mountain: 'ore',
    alpine: 'rare crystal',
    coastal: 'shell',
    shoreline: 'driftwood',
    'forest edge': 'mushroom',
    'ancient ruins': 'shard',
    'dirt path': '— nothing',
    'river delta': 'clay',
  };
  const got = yields[t.label] || '— nothing';
  const amt = 1 + Math.floor(Math.random() * 3);
  return `${amt} ${got} · ${t.label}`;
}

function doSpoke() {
  const lines = [
    '"the archive paid out."',
    '"northwood concord, hold the line."',
    '"three more sheets and the ridge is mine."',
    '"who painted that flag on the gate?"',
    '"if you see baldur, do not parley."',
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function doScryed() {
  const others = WORLD.others;
  if (!others.length) return 'no target';
  const o = others[Math.floor(Math.random() * others.length)];
  return `${o.name} · faction: ${o.kind === 'hostile' ? 'wild' : 'northwood concord'}`;
}

function doTraded() {
  const items = ['ore', 'herb', 'silver', 'parchment', 'cord'];
  const a = items[Math.floor(Math.random() * items.length)];
  const b = items[Math.floor(Math.random() * items.length)];
  const n1 = 2 + Math.floor(Math.random() * 12);
  const n2 = 4 + Math.floor(Math.random() * 30);
  return `${n1} ${a} ↔ ${n2} ${b}`;
}

function doRested() {
  const gain = 18 + Math.floor(Math.random() * 24);
  return `stamina +${gain}`;
}

function appendLog(verb, cls, body) {
  const body_ = document.getElementById('logwin-body');
  if (!body_) return;
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<span class="ts">${stamp()}</span><span class="v ${cls || ''}">${verb}</span><span class="body">${body}</span>`;
  body_.insertBefore(row, body_.firstChild);
  // cap
  while (body_.children.length > 60) body_.removeChild(body_.lastChild);
}

function stamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}


// ── FLOATING LOG WINDOW ──────────────────────────────────────────
function bindLogwin() {
  const win = document.getElementById('logwin');
  const head = document.getElementById('logwin-head');
  const collapseBtn = document.getElementById('logwin-collapse');

  let dragging = false;
  let offX = 0, offY = 0;

  head.addEventListener('mousedown', (e) => {
    if (e.target.closest('.icon-btn')) return;
    dragging = true;
    win.classList.add('dragging');
    const rect = win.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    // switch to absolute positioning via inset
    win.style.right = 'auto';
    win.style.bottom = 'auto';
    win.style.left = rect.left + 'px';
    win.style.top  = rect.top + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const x = Math.max(8, Math.min(window.innerWidth - win.offsetWidth - 8, e.clientX - offX));
    const y = Math.max(8, Math.min(window.innerHeight - 40, e.clientY - offY));
    win.style.left = x + 'px';
    win.style.top  = y + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    win.classList.remove('dragging');
  });

  collapseBtn.addEventListener('click', () => {
    win.classList.toggle('collapsed');
    collapseBtn.textContent = win.classList.contains('collapsed') ? '▢' : '—';
  });
}
