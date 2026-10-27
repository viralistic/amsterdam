// Gathering tables shared by the server system and the item / object definitions.
// Levels, xp and respawn times follow Old School RuneScape; success chances use the OSRS "low/high out of 256"
// interpolation: chance = (1 + floor(low * (99 - L) / 98 + high * (L - 1) / 98 + 0.5)) / 256.

export const METALS = {
  bronze: '#9c6a33', iron: '#8f8f8f', steel: '#c4c4cc', mithril: '#4f55b0', adamant: '#4a7a52', rune: '#3fa6b8',
};

// Axes: woodcutting level, wield requirement (attack), success multiplier on the tree's low/high values.
export const AXES = [
  { id: 'bronze_axe', metal: 'bronze', level: 1, att: 1, mult: 1.0, value: 16, bonus: [4, 5] },
  { id: 'iron_axe', metal: 'iron', level: 1, att: 1, mult: 1.5, value: 56, bonus: [6, 7] },
  { id: 'steel_axe', metal: 'steel', level: 6, att: 5, mult: 2.0, value: 200, bonus: [9, 11] },
  { id: 'mithril_axe', metal: 'mithril', level: 21, att: 20, mult: 2.5, value: 520, bonus: [13, 15] },
  { id: 'adamant_axe', metal: 'adamant', level: 31, att: 30, mult: 3.0, value: 1280, bonus: [17, 20] },
  { id: 'rune_axe', metal: 'rune', level: 41, att: 40, mult: 3.5, value: 12800, bonus: [26, 29] },
];

// Pickaxes: like OSRS, a better pickaxe swings more often (ticks between attempts).
export const PICKAXES = [
  { id: 'bronze_pickaxe', metal: 'bronze', level: 1, att: 1, every: 8, value: 1, bonus: [4, 5] },
  { id: 'iron_pickaxe', metal: 'iron', level: 1, att: 1, every: 7, value: 140, bonus: [5, 7] },
  { id: 'steel_pickaxe', metal: 'steel', level: 6, att: 5, every: 6, value: 500, bonus: [8, 11] },
  { id: 'mithril_pickaxe', metal: 'mithril', level: 21, att: 20, every: 5, value: 1300, bonus: [12, 15] },
  { id: 'adamant_pickaxe', metal: 'adamant', level: 31, att: 30, every: 4, value: 3200, bonus: [17, 19] },
  { id: 'rune_pickaxe', metal: 'rune', level: 41, att: 40, every: 3, value: 32000, bonus: [26, 29] },
];

// Trees. deplete = chance per log that the tree turns into a stump. respawn in ticks (600 ms).
export const TREES = {
  tree_normal: { name: 'Tree', level: 1, xp: 25, log: 'logs', low: 64, high: 200, deplete: 1, respawn: [25, 45], ex: 'A young street tree, planted by the Gemeente.' },
  tree_oak: { name: 'Oak', level: 15, xp: 37.5, log: 'oak_logs', low: 32, high: 100, deplete: 1 / 8, respawn: [14, 25], ex: 'A sturdy old oak. The Vondelpark is full of them.' },
  tree_willow: { name: 'Willow', level: 30, xp: 67.5, log: 'willow_logs', low: 16, high: 50, deplete: 1 / 8, respawn: [14, 25], ex: 'A weeping willow, dipping its branches in the Amstel.' },
  tree_elm: { name: 'Elm', level: 35, xp: 85, log: 'elm_logs', low: 12, high: 38, deplete: 1 / 8, respawn: [30, 50], ex: 'An Amsterdamse iep. The canal ring has more elms than any city in Europe.' },
  tree_maple: { name: 'Maple tree', level: 45, xp: 100, log: 'maple_logs', low: 8, high: 25, deplete: 1 / 8, respawn: [59, 80], ex: 'Its leaves turn a fiery red in autumn.' },
  tree_yew: { name: 'Yew', level: 60, xp: 175, log: 'yew_logs', low: 4, high: 12.5, deplete: 1 / 8, respawn: [99, 140], ex: 'An ancient yew, part of the Hortus collection since the 1600s.' },
  tree_magic: { name: 'Magic tree', level: 75, xp: 250, log: 'magic_logs', low: 2, high: 6, deplete: 1 / 8, respawn: [199, 260], quest: 'betoverde_bos', ex: 'The bark hums softly. This tree is very old, and very much awake.' },
};

// Rocks. Every rock empties after one ore, like OSRS.
export const ROCKS = {
  rock_clay: { name: 'Clay rocks', level: 1, xp: 5, ore: 'clay', low: 128, high: 400, respawn: 2, fleck: '#d8c48a', ex: 'Soft, sticky clay.' },
  rock_copper: { name: 'Copper rocks', level: 1, xp: 17.5, ore: 'copper_ore', low: 100, high: 350, respawn: 4, fleck: '#c8742e', ex: 'This rock contains copper.' },
  rock_tin: { name: 'Tin rocks', level: 1, xp: 17.5, ore: 'tin_ore', low: 100, high: 350, respawn: 4, fleck: '#c9c9c0', ex: 'This rock contains tin.' },
  rock_iron: { name: 'Iron rocks', level: 15, xp: 35, ore: 'iron_ore', low: 96, high: 350, respawn: 9, fleck: '#8a4428', ex: 'This rock contains iron.' },
  rock_silver: { name: 'Silver rocks', level: 20, xp: 40, ore: 'silver_ore', low: 25, high: 200, respawn: 100, fleck: '#eef0f6', ex: 'This rock contains silver.' },
  rock_coal: { name: 'Coal rocks', level: 30, xp: 50, ore: 'coal', low: 16, high: 100, respawn: 50, fleck: '#141414', ex: 'This rock contains coal. The Westergasfabriek burned tonnes of it.' },
  rock_gold: { name: 'Gold rocks', level: 40, xp: 65, ore: 'gold_ore', low: 7, high: 75, respawn: 100, fleck: '#f2c230', ex: 'This rock contains gold.' },
  rock_mithril: { name: 'Mithril rocks', level: 55, xp: 80, ore: 'mithril_ore', low: 4, high: 50, respawn: 200, fleck: '#5a64d0', ex: 'This rock contains mithril.' },
  rock_adamantite: { name: 'Adamantite rocks', level: 70, xp: 95, ore: 'adamantite_ore', low: 2, high: 25, respawn: 400, fleck: '#4f9a5a', ex: 'This rock contains adamantite.' },
  rock_runite: { name: 'Runite rocks', level: 85, xp: 125, ore: 'runite_ore', low: 1, high: 18, respawn: 1200, fleck: '#3cc8dc', ex: 'This rock contains runite. Everybody in the Wilderness knows about it.' },
};

export const GEMS = [[32, 'uncut_sapphire'], [16, 'uncut_emerald'], [8, 'uncut_ruby'], [3, 'uncut_diamond']];

export const FISH = {
  raw_shrimps: { level: 1, xp: 10, low: 48, high: 256 },
  raw_anchovies: { level: 15, xp: 40, low: 24, high: 128 },
  raw_trout: { level: 20, xp: 50, low: 32, high: 192 },
  raw_pike: { level: 25, xp: 60, low: 16, high: 96 },
  raw_eel: { level: 28, xp: 65, low: 10, high: 80 },
  raw_salmon: { level: 30, xp: 70, low: 16, high: 96 },
  raw_lobster: { level: 40, xp: 90, low: 6, high: 95 },
  raw_swordfish: { level: 50, xp: 100, low: 4, high: 48 },
  raw_shark: { level: 76, xp: 110, low: 3, high: 40 },
};

// Fishing methods per spot kind: action label -> tool, bait and fish (best fish first).
export const SPOTS = {
  fish_canal: { name: 'Fishing spot', ex: 'Something is moving under the murky canal water.', methods: {
    Net: { tool: 'small_net', fish: ['raw_anchovies', 'raw_shrimps'], verb: 'cast out your net' },
    Bait: { tool: 'fishing_rod', bait: 'fishing_bait', fish: ['raw_pike'], verb: 'cast out your line' },
  } },
  fish_pond: { name: 'Fishing spot', ex: 'Ripples on the pond. The ducks are watching.', methods: {
    Bait: { tool: 'fishing_rod', bait: 'fishing_bait', fish: ['raw_eel', 'raw_pike'], verb: 'cast out your line' },
  } },
  fish_river: { name: 'Fishing spot', ex: 'Fish are jumping in the Amstel current.', methods: {
    Lure: { tool: 'fly_fishing_rod', bait: 'feather', fish: ['raw_salmon', 'raw_trout'], verb: 'cast out your fly' },
    Bait: { tool: 'fishing_rod', bait: 'fishing_bait', fish: ['raw_pike'], verb: 'cast out your line' },
  } },
  fish_harbour: { name: 'Fishing spot', ex: 'Deep, salty water off the IJ quays.', methods: {
    Cage: { tool: 'lobster_pot', fish: ['raw_lobster'], verb: 'attempt to catch a lobster' },
    Harpoon: { tool: 'harpoon', fish: ['raw_swordfish'], verb: 'start harpooning' },
  } },
  fish_shark: { name: 'Fishing spot', ex: 'Large dark shapes circle beneath the Gaasperplas. How did they get in here?', methods: {
    Harpoon: { tool: 'harpoon', fish: ['raw_shark'], verb: 'start harpooning' },
  } },
};

// Hunter: creatures per region. A trap only catches something in a matching hunting ground.
export const CREATURES = {
  bird_snare: [
    { region: 'vondelpark', name: 'Halsbandparkiet', level: 1, xp: 34, loot: [['raw_bird_meat', 1, 1], ['feather', 5, 10]], ex: 'A bright green parakeet' },
    { region: 'amstelpark', name: 'Groene specht', level: 9, xp: 61, loot: [['raw_bird_meat', 1, 1], ['feather', 6, 12]], ex: 'A green woodpecker' },
    { region: 'amstelpark', name: 'IJsvogel', level: 19, xp: 95, loot: [['raw_bird_meat', 1, 1], ['feather', 8, 15]], ex: 'A kingfisher' },
  ],
  box_trap: [
    { region: 'bos', name: 'Konijn', level: 27, xp: 90, loot: [['raw_rabbit', 1, 1]], ex: 'A wild rabbit' },
  ],
};

// Farming. stage = minutes per growth stage (real time).
export const CROPS = {
  potato_seed: { patch: 'allotment', name: 'potatoes', level: 1, seeds: 3, plantXp: 8, harvestXp: 9, produce: 'potato', stages: 4, stage: 1.5, color: '#4f8a2a' },
  onion_seed: { patch: 'allotment', name: 'onions', level: 5, seeds: 3, plantXp: 9.5, harvestXp: 10.5, produce: 'onion', stages: 4, stage: 1.5, color: '#7ab04a' },
  cabbage_seed: { patch: 'allotment', name: 'cabbages', level: 7, seeds: 3, plantXp: 10, harvestXp: 11.5, produce: 'cabbage', stages: 4, stage: 2, color: '#5aa05a' },
  guam_seed: { patch: 'herb', name: 'guam', level: 9, seeds: 1, plantXp: 11, harvestXp: 12.5, produce: 'grimy_guam', stages: 4, stage: 2, color: '#4a9a3a' },
  marrentill_seed: { patch: 'herb', name: 'marrentill', level: 14, seeds: 1, plantXp: 13.5, harvestXp: 15, produce: 'grimy_marrentill', stages: 4, stage: 2, color: '#5a9a6a' },
  tarromin_seed: { patch: 'herb', name: 'tarromin', level: 19, seeds: 1, plantXp: 16, harvestXp: 18, produce: 'grimy_tarromin', stages: 4, stage: 2.5, color: '#6aa040' },
  harralander_seed: { patch: 'herb', name: 'harralander', level: 26, seeds: 1, plantXp: 21.5, harvestXp: 24, produce: 'grimy_harralander', stages: 4, stage: 2.5, color: '#8a9a3a' },
  ranarr_seed: { patch: 'herb', name: 'ranarr', level: 32, seeds: 1, plantXp: 27, harvestXp: 30.5, produce: 'grimy_ranarr', stages: 4, stage: 3, color: '#3a8a5a' },
};

// osrs-style success chance out of 256, interpolated between level 1 and 99
export function osrsChance(low, high, level) {
  const L = Math.max(1, Math.min(99, level));
  return Math.min(1, (1 + Math.floor(low * (99 - L) / 98 + high * (L - 1) / 98 + 0.5)) / 256);
}
