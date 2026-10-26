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
};

export const EQUIP_SLOTS = ['head', 'cape', 'weapon', 'body', 'shield', 'legs', 'feet'];
export const SKILLS = ['attack', 'strength', 'defence', 'hitpoints', 'exploring'];
export const SKILL_ICON = { attack: 'iron_sword', strength: 'fist', defence: 'kite', hitpoints: 'heart', exploring: 'compass' };

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
  return Math.floor(0.25 * (lv.defence + lv.hitpoints) + 0.325 * (lv.attack + lv.strength));
}

export function fmtQty(q) {
  if (q >= 10_000_000) return { text: Math.floor(q / 1_000_000) + 'M', color: '#00ff80' };
  if (q >= 100_000) return { text: Math.floor(q / 1000) + 'K', color: '#ffffff' };
  return { text: String(q), color: '#ffff00' };
}
