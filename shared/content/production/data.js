// Production pack data tables: levels, experience and materials, mostly straight from Old School RuneScape.
// Shared by the item definitions (../production.js), the server systems and the client icons.

// ---------------------------------------------------------------- Metals and smithing
export const METALS = {
  bronze: { name: 'Bronze', color: '#9c6a33', light: '#e8a868', dark: '#6a4420', base: 1, xp: 12.5, req: 1, bar: 8 },
  iron: { name: 'Iron', color: '#8f8f8f', light: '#d0d0d4', dark: '#5e5e62', base: 15, xp: 25, req: 1, bar: 28 },
  steel: { name: 'Steel', color: '#c4c4cc', light: '#f4f4fa', dark: '#7a7a84', base: 30, xp: 37.5, req: 5, bar: 100 },
  mithril: { name: 'Mithril', color: '#4f55b0', light: '#8c94ec', dark: '#2c3070', base: 50, xp: 50, req: 20, bar: 300 },
  adamant: { name: 'Adamant', color: '#4e7a52', light: '#86b88a', dark: '#2c4a30', base: 70, xp: 62.5, req: 30, bar: 640 },
  rune: { name: 'Rune', color: '#4aa6b8', light: '#9ae4f2', dark: '#2a6070', base: 85, xp: 75, req: 40, bar: 5000 },
};
export const METAL_IDS = Object.keys(METALS);

// Furnace: ores -> bar. chance < 1 means the ore can be too impure (iron).
export const SMELT = [
  { bar: 'bronze_bar', level: 1, xp: 6.2, ores: { copper_ore: 1, tin_ore: 1 } },
  { bar: 'iron_bar', level: 15, xp: 12.5, ores: { iron_ore: 1 }, chance: 0.5 },
  { bar: 'silver_bar', level: 20, xp: 13.7, ores: { silver_ore: 1 } },
  { bar: 'steel_bar', level: 30, xp: 17.5, ores: { iron_ore: 1, coal: 2 } },
  { bar: 'gold_bar', level: 40, xp: 22.5, ores: { gold_ore: 1 } },
  { bar: 'mithril_bar', level: 50, xp: 30, ores: { mithril_ore: 1, coal: 4 } },
  { bar: 'adamant_bar', level: 70, xp: 37.5, ores: { adamantite_ore: 1, coal: 6 } },
  { bar: 'rune_bar', level: 85, xp: 50, ores: { runite_ore: 1, coal: 8 } },
];

// Anvil items: level = metal base + offset (max 99), bars used, how many you get.
export const SMITH_KINDS = [
  { kind: 'dagger', off: 0, bars: 1 },
  { kind: 'sword', off: 4, bars: 1 },
  { kind: 'scimitar', off: 5, bars: 2 },
  { kind: 'arrowtips', off: 5, bars: 1, make: 15 },
  { kind: 'longsword', off: 6, bars: 2 },
  { kind: 'full_helm', off: 7, bars: 2 },
  { kind: 'kiteshield', off: 12, bars: 3 },
  { kind: 'platelegs', off: 16, bars: 3 },
  { kind: 'platebody', off: 18, bars: 5 },
];
// Ids that already exist as base items keep their id.
const REUSE = { bronze_dagger: 'bronze_dagger', iron_sword: 'iron_sword', steel_longsword: 'steel_longsword', mithril_scimitar: 'mithril_scimitar', iron_full_helm: 'iron_helm' };
export const smithId = (metal, kind) => REUSE[`${metal}_${kind}`] || `${metal}_${kind}`;

// Equipment bonuses per tier (bronze, iron, steel, mithril, adamant, rune).
export const GEAR_STATS = {
  dagger: { att: [4, 6, 9, 13, 18, 28], str: [3, 5, 8, 12, 17, 27], speed: 4 },
  sword: { att: [6, 10, 14, 21, 27, 40], str: [5, 9, 13, 20, 26, 39], speed: 4 },
  scimitar: { att: [7, 11, 16, 26, 33, 45], str: [6, 10, 15, 25, 32, 44], speed: 4 },
  longsword: { att: [8, 12, 18, 28, 36, 50], str: [7, 11, 17, 27, 35, 49], speed: 5 },
  full_helm: { def: [4, 5, 9, 13, 19, 30] },
  kiteshield: { def: [7, 10, 15, 22, 31, 46] },
  platelegs: { def: [8, 11, 17, 24, 33, 51] },
  platebody: { def: [15, 21, 32, 46, 65, 82] },
};
export const SLOT_OF = { dagger: 'weapon', sword: 'weapon', scimitar: 'weapon', longsword: 'weapon', full_helm: 'head', kiteshield: 'shield', platelegs: 'legs', platebody: 'body' };
export const KIND_NAME = { dagger: 'dagger', sword: 'sword', scimitar: 'scimitar', longsword: 'longsword', full_helm: 'full helm', kiteshield: 'kiteshield', platelegs: 'platelegs', platebody: 'platebody', arrowtips: 'arrowtips' };

// ---------------------------------------------------------------- Firemaking
export const LOGS = {
  logs: { level: 1, xp: 40, shafts: 15, shaftLevel: 1, shaftXp: 5 },
  oak_logs: { level: 15, xp: 60, shafts: 30, shaftLevel: 15, shaftXp: 10 },
  elm_logs: { level: 20, xp: 75, shafts: 30, shaftLevel: 20, shaftXp: 12 },
  willow_logs: { level: 30, xp: 90, shafts: 45, shaftLevel: 30, shaftXp: 15 },
  maple_logs: { level: 45, xp: 135, shafts: 60, shaftLevel: 45, shaftXp: 20 },
  yew_logs: { level: 60, xp: 202.5, shafts: 75, shaftLevel: 60, shaftXp: 25 },
  magic_logs: { level: 75, xp: 303.8, shafts: 90, shaftLevel: 75, shaftXp: 30 },
};

// ---------------------------------------------------------------- Cooking
// stop = level at which you stop burning on a fire / on a range.
export const FOOD = [
  { raw: 'raw_shrimps', cooked: 'shrimps', level: 1, xp: 30, stop: [34, 33], burnt: 'burnt_fish' },
  { raw: 'raw_anchovies', cooked: 'anchovies', level: 1, xp: 30, stop: [34, 33], burnt: 'burnt_fish' },
  { raw: 'raw_beef', cooked: 'cooked_meat', level: 1, xp: 30, stop: [31, 31], burnt: 'burnt_meat' },
  { raw: 'raw_chicken', cooked: 'cooked_chicken', level: 1, xp: 30, stop: [31, 31], burnt: 'burnt_meat' },
  { raw: 'potato', cooked: 'baked_potato', level: 7, xp: 15, stop: [40, 40], burnt: 'burnt_potato', rangeOnly: true },
  { raw: 'raw_bird_meat', cooked: 'roast_bird_meat', level: 11, xp: 62.5, stop: [44, 44], burnt: 'burnt_meat' },
  { raw: 'raw_trout', cooked: 'trout', level: 15, xp: 70, stop: [50, 49], burnt: 'burnt_fish' },
  { raw: 'raw_rabbit', cooked: 'roast_rabbit', level: 16, xp: 72.5, stop: [51, 51], burnt: 'burnt_meat' },
  { raw: 'raw_pike', cooked: 'pike', level: 20, xp: 80, stop: [64, 64], burnt: 'burnt_fish' },
  { raw: 'raw_salmon', cooked: 'salmon', level: 25, xp: 90, stop: [58, 58], burnt: 'burnt_fish' },
  { raw: 'raw_eel', cooked: 'eel', level: 28, xp: 95, stop: [60, 58], burnt: 'burnt_fish' },
  { raw: 'raw_lobster', cooked: 'lobster', level: 40, xp: 120, stop: [74, 74], burnt: 'burnt_fish' },
  { raw: 'raw_swordfish', cooked: 'swordfish', level: 45, xp: 140, stop: [86, 86], burnt: 'burnt_fish' },
  { raw: 'raw_shark', cooked: 'shark', level: 80, xp: 210, stop: [99, 94], burnt: 'burnt_fish' },
  { raw: 'seaweed', cooked: 'soda_ash', level: 1, xp: 0, stop: [1, 1], burnt: null },
];

// ---------------------------------------------------------------- Crafting
export const SPIN = [
  { from: 'wool', to: 'ball_of_wool', level: 1, xp: 2.5 },
  { from: 'flax', to: 'bow_string', level: 10, xp: 15 },
];
export const POTTERY = [
  { unfired: 'unfired_pot', fired: 'pot', level: 1, xp: 6.3, fireXp: 6.3 },
  { unfired: 'unfired_bowl', fired: 'bowl', level: 8, xp: 18, fireXp: 15 },
];
export const GLASSBLOW = [
  { item: 'beer_glass', level: 1, xp: 17.5 },
  { item: 'vial', level: 33, xp: 35 },
  { item: 'fishbowl', level: 42, xp: 50 },
  { item: 'unpowered_orb', level: 46, xp: 52.5 },
];
export const LEATHER = [
  { item: 'leather_gloves', level: 1, xp: 13.8, mat: 'leather' },
  { item: 'leather_boots', level: 7, xp: 16.3, mat: 'leather' },
  { item: 'leather_cowl', level: 9, xp: 18.5, mat: 'leather' },
  { item: 'leather_vambraces', level: 11, xp: 22, mat: 'leather' },
  { item: 'leather_vest', level: 14, xp: 25, mat: 'leather' },
  { item: 'leather_chaps', level: 18, xp: 27, mat: 'leather' },
  { item: 'hardleather_body', level: 28, xp: 35, mat: 'hard_leather' },
];
export const TAN = [
  { from: 'cowhide', to: 'leather', cost: 1 },
  { from: 'cowhide', to: 'hard_leather', cost: 3 },
];
export const GEMS = [
  { uncut: 'uncut_sapphire', cut: 'sapphire', level: 20, xp: 50, color: '#2448e0' },
  { uncut: 'uncut_emerald', cut: 'emerald', level: 27, xp: 67.5, color: '#18a040' },
  { uncut: 'uncut_ruby', cut: 'ruby', level: 34, xp: 85, color: '#d01020' },
  { uncut: 'uncut_diamond', cut: 'diamond', level: 43, xp: 107.5, color: '#e8f4ff' },
];
export const GEM_COLOR = Object.fromEntries(GEMS.map(g => [g.cut, g.color]));
export const JEWELLERY = [
  { item: 'gold_ring', mould: 'ring_mould', gem: null, level: 5, xp: 15, value: 350 },
  { item: 'sapphire_ring', mould: 'ring_mould', gem: 'sapphire', level: 20, xp: 40, value: 900 },
  { item: 'emerald_ring', mould: 'ring_mould', gem: 'emerald', level: 27, xp: 55, value: 1275 },
  { item: 'ruby_ring', mould: 'ring_mould', gem: 'ruby', level: 34, xp: 70, value: 2025 },
  { item: 'diamond_ring', mould: 'ring_mould', gem: 'diamond', level: 43, xp: 85, value: 3525 },
  { item: 'gold_amulet', mould: 'amulet_mould', gem: null, level: 8, xp: 30, value: 350 },
  { item: 'sapphire_amulet', mould: 'amulet_mould', gem: 'sapphire', level: 24, xp: 65, value: 900 },
  { item: 'emerald_amulet', mould: 'amulet_mould', gem: 'emerald', level: 31, xp: 70, value: 1275 },
  { item: 'ruby_amulet', mould: 'amulet_mould', gem: 'ruby', level: 50, xp: 85, value: 2025 },
  { item: 'diamond_amulet', mould: 'amulet_mould', gem: 'diamond', level: 70, xp: 100, value: 3525 },
];

// ---------------------------------------------------------------- Fletching
export const BOWS = [
  { log: 'logs', unstrung: 'shortbow_u', bow: 'shortbow', level: 5, xp: 5 },
  { log: 'oak_logs', unstrung: 'oak_shortbow_u', bow: 'oak_shortbow', level: 20, xp: 16.5 },
  { log: 'willow_logs', unstrung: 'willow_longbow_u', bow: 'willow_longbow', level: 40, xp: 41.5 },
  { log: 'maple_logs', unstrung: 'maple_shortbow_u', bow: 'maple_shortbow', level: 50, xp: 50 },
];
// arrowtips + headless arrows -> arrows (15 per action); xp is per arrow.
export const ARROWS = [
  { tips: 'bronze_arrowtips', arrow: 'bronze_arrow', level: 1, xp: 1.3 },
  { tips: 'iron_arrowtips', arrow: 'iron_arrow', level: 15, xp: 2.5 },
  { tips: 'steel_arrowtips', arrow: 'steel_arrow', level: 30, xp: 5 },
  { tips: 'mithril_arrowtips', arrow: 'mithril_arrow', level: 45, xp: 7.5 },
  { tips: 'adamant_arrowtips', arrow: 'adamant_arrow', level: 60, xp: 10 },
  { tips: 'rune_arrowtips', arrow: 'rune_arrow', level: 75, xp: 12.5 },
];

// ---------------------------------------------------------------- Herblore
export const HERBS = [
  { grimy: 'grimy_guam', clean: 'guam_leaf', level: 3, xp: 2.5, unf: 'guam_potion_unf', name: 'Guam', color: '#5aa83a' },
  { grimy: 'grimy_marrentill', clean: 'marrentill', level: 5, xp: 3.8, unf: 'marrentill_potion_unf', name: 'Marrentill', color: '#3e9a5a' },
  { grimy: 'grimy_tarromin', clean: 'tarromin', level: 11, xp: 5, unf: 'tarromin_potion_unf', name: 'Tarromin', color: '#7aa02a' },
  { grimy: 'grimy_harralander', clean: 'harralander', level: 20, xp: 6.3, unf: 'harralander_potion_unf', name: 'Harralander', color: '#a0a030' },
  { grimy: 'grimy_ranarr', clean: 'ranarr_weed', level: 25, xp: 7.5, unf: 'ranarr_potion_unf', name: 'Ranarr', color: '#2a8a6a' },
];
// boost: { skill: [flat, fraction] }, negative for drains. restore: prayer points / run energy.
export const POTIONS = [
  { id: 'attack_potion', name: 'Attack potion', unf: 'guam_potion_unf', sec: 'eye_of_newt', level: 3, xp: 25, color: '#3ab0d8', boost: { attack: [3, 0.1] }, value: 14 },
  { id: 'tulip_tonic', name: 'Tulip tonic', unf: 'marrentill_potion_unf', sec: 'tulip', level: 5, xp: 37.5, color: '#e84a6a', energy: 20, heal: 2, value: 30 },
  { id: 'strength_potion', name: 'Strength potion', unf: 'tarromin_potion_unf', sec: 'limpwurt_root', level: 12, xp: 50, color: '#4ab84a', boost: { strength: [3, 0.1] }, value: 50 },
  { id: 'jenever_brew', name: 'Jenever brew', unf: 'harralander_potion_unf', sec: 'crushed_juniper', level: 22, xp: 62.5, color: '#e8dca0', boost: { attack: [2, 0.12], strength: [2, 0.12], defence: [-1, -0.08] }, value: 80 },
  { id: 'defence_potion', name: 'Defence potion', unf: 'ranarr_potion_unf', sec: 'white_berries', level: 30, xp: 75, color: '#d8b830', boost: { defence: [3, 0.1] }, value: 120 },
  { id: 'prayer_potion', name: 'Prayer potion', unf: 'ranarr_potion_unf', sec: 'snape_grass', level: 38, xp: 87.5, color: '#30c8a0', prayer: [7, 0.25], value: 300 },
];
export const doseId = (base, n) => n === 3 ? base : `${base}${n}`;

// ---------------------------------------------------------------- Prayer
export const BONES = { bones: 4.5, big_bones: 15, dragon_bones: 72 };
export const ALTAR_BONUS = 3.5; // Nieuwe Kerk altar

// drain = OSRS drain effect per tick (resistance 60 + 2 x prayer bonus). occ = slots it occupies (overlap = conflict).
export const PRAYERS = [
  { id: 'thick_skin', name: 'Thick Skin', level: 1, drain: 1, occ: ['def'], def: 0.05, desc: '+5% Defence' },
  { id: 'burst_of_strength', name: 'Burst of Strength', level: 4, drain: 1, occ: ['str'], str: 0.05, desc: '+5% Strength' },
  { id: 'clarity_of_thought', name: 'Clarity of Thought', level: 7, drain: 1, occ: ['att'], att: 0.05, desc: '+5% Attack' },
  { id: 'sharp_eye', name: 'Sharp Eye', level: 8, drain: 1, occ: ['att', 'str', 'rng'], rng: 0.05, desc: '+5% Ranged' },
  { id: 'mystic_will', name: 'Mystic Will', level: 9, drain: 1, occ: ['att', 'str', 'rng'], mag: 0.05, desc: '+5% Magic' },
  { id: 'rock_skin', name: 'Rock Skin', level: 10, drain: 6, occ: ['def'], def: 0.1, desc: '+10% Defence' },
  { id: 'superhuman_strength', name: 'Superhuman Strength', level: 13, drain: 6, occ: ['str'], str: 0.1, desc: '+10% Strength' },
  { id: 'improved_reflexes', name: 'Improved Reflexes', level: 16, drain: 6, occ: ['att'], att: 0.1, desc: '+10% Attack' },
  { id: 'rapid_heal', name: 'Rapid Heal', level: 22, drain: 2, occ: ['heal'], desc: '2x Hitpoints restore rate' },
  { id: 'hawk_eye', name: 'Hawk Eye', level: 26, drain: 6, occ: ['att', 'str', 'rng'], rng: 0.1, desc: '+10% Ranged' },
  { id: 'mystic_lore', name: 'Mystic Lore', level: 27, drain: 6, occ: ['att', 'str', 'rng'], mag: 0.1, desc: '+10% Magic' },
  { id: 'steel_skin', name: 'Steel Skin', level: 28, drain: 12, occ: ['def'], def: 0.15, desc: '+15% Defence' },
  { id: 'ultimate_strength', name: 'Ultimate Strength', level: 31, drain: 12, occ: ['str'], str: 0.15, desc: '+15% Strength' },
  { id: 'incredible_reflexes', name: 'Incredible Reflexes', level: 34, drain: 12, occ: ['att'], att: 0.15, desc: '+15% Attack' },
  { id: 'protect_from_magic', name: 'Protect from Magic', level: 37, drain: 12, occ: ['ov'], protect: 'magic', desc: 'Blocks monster magic; -40% from players' },
  { id: 'protect_from_missiles', name: 'Protect from Missiles', level: 40, drain: 12, occ: ['ov'], protect: 'ranged', desc: 'Blocks monster ranged; -40% from players' },
  { id: 'protect_from_melee', name: 'Protect from Melee', level: 43, drain: 12, occ: ['ov'], protect: 'melee', desc: 'Blocks monster melee; -40% from players' },
  { id: 'eagle_eye', name: 'Eagle Eye', level: 44, drain: 12, occ: ['att', 'str', 'rng'], rng: 0.15, desc: '+15% Ranged' },
  { id: 'mystic_might', name: 'Mystic Might', level: 45, drain: 12, occ: ['att', 'str', 'rng'], mag: 0.15, desc: '+15% Magic' },
];
export const PRAYER_BY_ID = Object.fromEntries(PRAYERS.map(p => [p.id, p]));
export const prayerIcon = id => 'pi_' + id;
