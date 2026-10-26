// Item definitions shared by client and server. Inventory icons are drawn in public/js/icons.js.
export const ITEMS = {
  coins: { name: 'Coins', stack: true, value: 1, ex: 'Lovely money!' },
  herring: { name: 'Herring', value: 12, heal: 6, ex: 'Hollandse Nieuwe. Hold it by the tail.' },
  bitterbal: { name: 'Bitterbal', value: 4, heal: 3, ex: 'Careful, the inside is the temperature of the sun.' },
  stroopwafel: { name: 'Stroopwafel', value: 5, heal: 4, ex: 'Best warmed on top of a cup of coffee.' },
  poffertjes: { name: 'Poffertjes', value: 8, heal: 5, ex: 'Tiny pancakes, mountain of sugar.' },
  gouda: { name: 'Gouda', value: 20, heal: 8, ex: 'A wheel of aged Gouda.' },
  tulip: { name: 'Tulip', value: 6, ex: 'Worth more than a house, in 1637.' },
  bike_bell: { name: 'Bike bell', value: 30, ex: 'Definitely not stolen.' },
  bronze_dagger: { name: 'Bronze dagger', value: 40, slot: 'weapon', att: 4, str: 3, metal: '#9c6a33', ex: 'Short but pointy.' },
  iron_sword: { name: 'Iron sword', value: 180, slot: 'weapon', att: 10, str: 9, metal: '#8f8f8f', ex: 'A decent iron sword.' },
  steel_longsword: { name: 'Steel longsword', value: 650, slot: 'weapon', att: 18, str: 17, req: 5, metal: '#c4c4cc', speed: 5, ex: 'A long steel blade.' },
  mithril_scimitar: { name: 'Mithril scimitar', value: 1600, slot: 'weapon', att: 26, str: 25, req: 20, metal: '#4f55b0', ex: 'A vicious, curved sword.' },
  wooden_shield: { name: 'Wooden shield', value: 50, slot: 'shield', def: 6, ex: 'Made from an old canal boat.' },
  iron_helm: { name: 'Iron full helm', value: 90, slot: 'head', def: 5, metal: '#8f8f8f', ex: 'A full face helmet.' },
  orange_shirt: { name: 'Orange shirt', value: 30, slot: 'body', def: 2, color: '#ff7a00', ex: 'Hup Holland hup!' },
  leather_jacket: { name: 'Leather jacket', value: 120, slot: 'body', def: 8, color: '#4a2f1b', ex: 'Very Amsterdam. Very cool.' },
  clogs: { name: 'Clogs', value: 30, slot: 'feet', def: 2, color: '#e8c547', ex: 'Klompen. Surprisingly comfortable.' },
  ajax_cape: { name: 'Ajax cape', value: 400, slot: 'cape', def: 3, color: '#d2122e', ex: 'Red and white, for the club of the city.' },
  kings_crown: { name: "King's crown", value: 25000, slot: 'head', def: 6, color: '#f2c230', ex: 'Probably should be returned to the palace.' },
  canal_ring: { name: 'Canal ring', value: 2500, ex: 'Someone dropped this off the Magere Brug.' },
  bike_key: { name: 'Bike key', value: 15, ex: 'Opens one of the 800,000 bikes in this city.' },

  // ---- Albert Heijn (general store)
  bread: { name: 'Bread', value: 3, heal: 3, ex: 'A fresh volkoren loaf.' },
  broodje_kaas: { name: 'Broodje kaas', value: 6, heal: 6, ex: 'The Dutch national lunch.' },
  kroket: { name: 'Kroket', value: 5, heal: 5, ex: 'Goes best on a broodje, with mustard.' },
  chocomel: { name: 'Chocomel', value: 3, heal: 2, ex: 'Chocolate milk. Shake well.' },
  bucket: { name: 'Bucket', value: 4, ex: "It's a wooden bucket." },
  hammer: { name: 'Hammer', value: 6, ex: 'Good for hitting things.' },
  tinderbox: { name: 'Tinderbox', value: 3, ex: 'Useful for lighting a fire.' },

  // ---- clothing
  denim_jeans: { name: 'Denim jeans', value: 40, slot: 'legs', def: 1, color: '#33507e', ex: 'Classic blue jeans.' },
  black_jeans: { name: 'Black jeans', value: 45, slot: 'legs', def: 1, color: '#22232a', ex: 'Very Amsterdam-Noord.' },
  red_trousers: { name: 'Red trousers', value: 35, slot: 'legs', def: 1, color: '#8c1c1c', ex: 'Bold.' },
  striped_shirt: { name: 'Striped shirt', value: 35, slot: 'body', def: 1, color: '#1f3f7a', stripes: '#f2f2f2', ex: 'Navy and white, like a canal boat captain.' },
  raincoat: { name: 'Raincoat', value: 55, slot: 'body', def: 3, color: '#f2c80f', ex: "It's Amsterdam. You'll need it." },
  hoodie: { name: 'Hoodie', value: 40, slot: 'body', def: 2, color: '#5b5f66', ex: 'Comfortable and slightly too big.' },
  summer_dress: { name: 'Summer dress', value: 50, slot: 'body', def: 1, color: '#d9577e', dress: true, ex: 'Perfect for a terrace on the Westerstraat.' },
  beanie: { name: 'Beanie', value: 20, slot: 'head', def: 1, color: '#b23a2e', hat: 'beanie', ex: 'Keeps your ears warm on the bike.' },
  flat_cap: { name: 'Flat cap', value: 25, slot: 'head', def: 1, color: '#5a4a38', hat: 'cap', ex: 'Very Jordaan.' },
  sneakers: { name: 'Sneakers', value: 45, slot: 'feet', def: 1, color: '#efefef', ex: 'Fresh and white. Not for long.' },
  leather_boots: { name: 'Leather boots', value: 60, slot: 'feet', def: 3, color: '#3a2618', ex: 'Sturdy boots.' },

  // ---- ranged
  shortbow: { name: 'Shortbow', value: 50, slot: 'weapon', style: 'ranged', twoHanded: true, rng: 8, wood: '#8a5a2c', ex: 'A short wooden bow.' },
  oak_shortbow: { name: 'Oak shortbow', value: 160, slot: 'weapon', style: 'ranged', twoHanded: true, rng: 14, req: 5, skill: 'ranged', wood: '#a9773c', ex: 'A shortbow made of oak.' },
  willow_longbow: { name: 'Willow longbow', value: 320, slot: 'weapon', style: 'ranged', twoHanded: true, rng: 20, req: 20, skill: 'ranged', speed: 6, long: true, wood: '#c39a5a', ex: 'A long bow of willow from the Amstel banks.' },
  maple_shortbow: { name: 'Maple shortbow', value: 640, slot: 'weapon', style: 'ranged', twoHanded: true, rng: 29, req: 30, skill: 'ranged', wood: '#7a3e1e', ex: 'A fine maple shortbow.' },
  bronze_arrow: { name: 'Bronze arrow', value: 1, stack: true, slot: 'ammo', rstr: 7, metal: '#9c6a33', ex: 'Arrows with bronze heads.' },
  iron_arrow: { name: 'Iron arrow', value: 3, stack: true, slot: 'ammo', rstr: 10, metal: '#8f8f8f', ex: 'Arrows with iron heads.' },
  steel_arrow: { name: 'Steel arrow', value: 8, stack: true, slot: 'ammo', rstr: 16, req: 5, skill: 'ranged', metal: '#c4c4cc', ex: 'Arrows with steel heads.' },
  mithril_arrow: { name: 'Mithril arrow', value: 20, stack: true, slot: 'ammo', rstr: 22, req: 20, skill: 'ranged', metal: '#4f55b0', ex: 'Arrows with mithril heads.' },
  leather_cowl: { name: 'Leather cowl', value: 30, slot: 'head', def: 2, rng: 2, color: '#7a5030', hat: 'cowl', ex: 'A hood made of leather.' },
  leather_vest: { name: 'Leather body', value: 80, slot: 'body', def: 6, rng: 4, color: '#7a5030', ex: 'Light armour for archers.' },

  // ---- magic
  staff: { name: 'Staff', value: 30, slot: 'weapon', style: 'magic', att: 2, str: 1, mag: 6, orb: '#7a5a3a', ex: "It's a slightly magical stick." },
  staff_of_air: { name: 'Staff of air', value: 1500, slot: 'weapon', style: 'magic', att: 4, str: 2, mag: 10, provides: 'air_rune', orb: '#d8e8f0', ex: 'A magical staff that provides unlimited air runes.' },
  staff_of_water: { name: 'Staff of water', value: 1500, slot: 'weapon', style: 'magic', att: 4, str: 2, mag: 10, provides: 'water_rune', orb: '#3a7ad8', ex: 'A magical staff that provides unlimited water runes.' },
  staff_of_earth: { name: 'Staff of earth', value: 1500, slot: 'weapon', style: 'magic', att: 4, str: 2, mag: 10, provides: 'earth_rune', orb: '#6a8a3a', ex: 'A magical staff that provides unlimited earth runes.' },
  staff_of_fire: { name: 'Staff of fire', value: 1500, slot: 'weapon', style: 'magic', att: 4, str: 2, mag: 10, provides: 'fire_rune', orb: '#e05a1a', ex: 'A magical staff that provides unlimited fire runes.' },
  wizard_hat: { name: 'Wizard hat', value: 25, slot: 'head', mag: 2, color: '#2c3a8c', hat: 'wizard', ex: 'A silly pointed hat.' },
  wizard_robe: { name: 'Wizard robe top', value: 40, slot: 'body', mag: 3, color: '#2c3a8c', ex: 'I can do magic better in this.' },
  wizard_skirt: { name: 'Wizard robe skirt', value: 30, slot: 'legs', mag: 2, color: '#2c3a8c', dress: true, ex: 'Long and flowing.' },
  air_rune: { name: 'Air rune', value: 4, stack: true, rune: '#d8e8f0', ex: 'One of the four basic elemental runes.' },
  water_rune: { name: 'Water rune', value: 4, stack: true, rune: '#3a7ad8', ex: 'One of the four basic elemental runes.' },
  earth_rune: { name: 'Earth rune', value: 4, stack: true, rune: '#7a5a2a', ex: 'One of the four basic elemental runes.' },
  fire_rune: { name: 'Fire rune', value: 4, stack: true, rune: '#e05a1a', ex: 'One of the four basic elemental runes.' },
  mind_rune: { name: 'Mind rune', value: 3, stack: true, rune: '#e88a2a', ex: 'Used for basic level missile spells.' },
  chaos_rune: { name: 'Chaos rune', value: 90, stack: true, rune: '#e8c83a', ex: 'Used for medium level missile spells.' },
};

// Autocast missile spells, strongest first. A staff casts the best one you have the level and runes for.
export const SPELLS = [
  { name: 'Fire Bolt', lvl: 35, max: 12, xp: 22.5, color: '#ff6a1a', runes: { fire_rune: 4, air_rune: 3, chaos_rune: 1 } },
  { name: 'Earth Bolt', lvl: 29, max: 11, xp: 19.5, color: '#8a6a2a', runes: { earth_rune: 3, air_rune: 2, chaos_rune: 1 } },
  { name: 'Water Bolt', lvl: 23, max: 10, xp: 16.5, color: '#3a7ad8', runes: { water_rune: 2, air_rune: 2, chaos_rune: 1 } },
  { name: 'Wind Bolt', lvl: 17, max: 9, xp: 13.5, color: '#e8f0f8', runes: { air_rune: 2, chaos_rune: 1 } },
  { name: 'Fire Strike', lvl: 13, max: 8, xp: 11.5, color: '#ff6a1a', runes: { fire_rune: 3, air_rune: 2, mind_rune: 1 } },
  { name: 'Earth Strike', lvl: 9, max: 6, xp: 9.5, color: '#8a6a2a', runes: { earth_rune: 2, air_rune: 1, mind_rune: 1 } },
  { name: 'Water Strike', lvl: 5, max: 4, xp: 7.5, color: '#3a7ad8', runes: { water_rune: 1, air_rune: 1, mind_rune: 1 } },
  { name: 'Wind Strike', lvl: 1, max: 2, xp: 5.5, color: '#e8f0f8', runes: { air_rune: 1, mind_rune: 1 } },
];

export const EQUIP_SLOTS = ['head', 'cape', 'ammo', 'weapon', 'body', 'shield', 'legs', 'feet'];
export const SKILLS = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'exploring'];
export const SKILL_ICON = { attack: 'iron_sword', strength: 'fist', defence: 'kite', hitpoints: 'heart', ranged: 'bow_icon', magic: 'wizard_hat', exploring: 'compass' };

export function levelForXp(xp) {
  let pts = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    pts += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    if (Math.floor(pts / 4) > xp) return lvl;
  }
  return 99;
}

export function xpForLevel(level) {
  let pts = 0;
  for (let lvl = 1; lvl < level; lvl++) pts += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
  return Math.floor(pts / 4);
}

export function combatLevel(lv) {
  const melee = 0.325 * (lv.attack + lv.strength);
  const range = 0.325 * Math.floor(1.5 * (lv.ranged || 1));
  const mage = 0.325 * Math.floor(1.5 * (lv.magic || 1));
  return Math.floor(0.25 * (lv.defence + lv.hitpoints) + Math.max(melee, range, mage));
}

export function fmtQty(q) {
  if (q >= 10_000_000) return { text: Math.floor(q / 1_000_000) + 'M', color: '#00ff80' };
  if (q >= 100_000) return { text: Math.floor(q / 1000) + 'K', color: '#ffffff' };
  return { text: String(q), color: '#ffff00' };
}
