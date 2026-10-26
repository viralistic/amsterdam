// Named game regions of Amsterdam and the Wilderness rules for Zuidoost.
// Regions are checked in order; the first match wins, so smaller places come before the areas around them.
import { toTile } from './geo.js';

const circle = (lat, lon, r) => { const t = toTile(lat, lon); return { kind: 'circle', x: t.x, z: t.z, r }; };
const box = (s, w, n, e) => { const a = toTile(n, w), b = toTile(s, e); return { kind: 'box', x0: a.x, z0: a.z, x1: b.x, z1: b.z }; };

// type: hub (safe city centre), city, skilling, park, wild. role: what the place is for in game terms.
export const REGIONS = [
  { id: 'centraal', name: 'Amsterdam Centraal', type: 'hub', role: 'Arrival point, tutorial and transport', area: circle(52.3789, 4.9003, 260) },
  { id: 'dam', name: 'Dam Square', type: 'hub', role: 'Grand Exchange, banks and meeting point', area: circle(52.3731, 4.8926, 170) },
  { id: 'nemo', name: 'NEMO', type: 'skilling', role: 'Crafting and invention', area: circle(52.3739, 4.9123, 140) },
  { id: 'scheepvaart', name: 'Scheepvaartmuseum', type: 'skilling', role: 'Sailing, fishing and the maritime quest', area: circle(52.3717, 4.9150, 140) },
  { id: 'artis', name: 'Artis', type: 'park', role: 'Zoo and animal knowledge', area: circle(52.3663, 4.9163, 230) },
  { id: 'hortus', name: 'Hortus Botanicus', type: 'skilling', role: 'Herblore and rare plants', area: circle(52.3667, 4.9081, 90) },
  { id: 'rijksmuseum', name: 'Rijksmuseum', type: 'city', role: 'History, artifacts and the museum dungeon', area: circle(52.3600, 4.8852, 140) },
  { id: 'museumplein', name: 'Museumplein', type: 'city', role: 'Open square between the museums', area: circle(52.3573, 4.8811, 220) },
  { id: 'vondelpark', name: 'Vondelpark', type: 'park', role: 'Early-game skilling: oaks, ducks, rabbits and fishing', area: box(52.3550, 4.8580, 52.3620, 4.8800) },
  { id: 'westergasfabriek', name: 'Westergasfabriek', type: 'skilling', role: 'Industrial dungeon, mining and smithing', area: circle(52.3858, 4.8745, 170) },
  { id: 'westerpark', name: 'Westerpark', type: 'park', role: 'Maple trees and mid-level skilling', area: circle(52.3865, 4.8800, 450) },
  { id: 'westerkerk', name: 'Westerkerk', type: 'city', role: 'Prayer and the tower quest', area: circle(52.3745, 4.8840, 70) },
  { id: 'jordaan', name: 'Jordaan', type: 'city', role: 'Ranged Guild, markets and narrow streets', area: box(52.3680, 4.8760, 52.3830, 4.8880) },
  { id: 'wallen', name: 'De Wallen', type: 'city', role: 'The old centre, Oude Kerk and Zeedijk', area: circle(52.3735, 4.8985, 260) },
  { id: 'albertcuyp', name: 'Albert Cuypmarkt', type: 'city', role: 'Food market and player trading', area: box(52.3545, 4.8880, 52.3570, 4.8990) },
  { id: 'pijp', name: 'De Pijp', type: 'city', role: 'Neighbourhood south of the canal ring', area: circle(52.3540, 4.8930, 650) },
  { id: 'adam', name: "A'DAM Toren", type: 'skilling', role: 'Rooftop agility course', area: circle(52.3841, 4.9019, 90) },
  { id: 'noord', name: 'Amsterdam-Noord', type: 'city', role: 'Across the IJ: wharves and ferries', area: box(52.3820, 4.8800, 52.4200, 4.9700) },
  { id: 'oosterpark', name: 'Oosterpark', type: 'park', role: 'Eastern park', area: circle(52.3605, 4.9205, 350) },
  { id: 'amstelpark', name: 'Amstelpark', type: 'park', role: 'Birds, fishing and low-level hunting', area: circle(52.3300, 4.8930, 550) },
  { id: 'amstel', name: 'Amstel riverbanks', type: 'skilling', role: 'Willows and river fishing', area: box(52.3330, 4.8960, 52.3630, 4.9080) },
  { id: 'bos', name: 'Amsterdamse Bos', type: 'skilling', role: 'Woodcutting and hunting', area: box(52.2950, 4.8100, 52.3400, 4.8750) },
  { id: 'grachtengordel', name: 'Canal Ring', type: 'city', role: 'Herengracht, Keizersgracht and Prinsengracht', area: box(52.3600, 4.8780, 52.3800, 4.9050) },
  // Zuidoost is the Wilderness: an exaggerated, fictional version of the area. Danger comes from the game rules, not the people who live there.
  { id: 'wilderness', name: 'Wilderness (Zuidoost)', type: 'wild', role: 'PvP, rare resources and bosses', area: box(52.2850, 4.9350, 52.3300, 5.0100) },
];

const WILD = REGIONS.find(r => r.id === 'wilderness').area;

function inside(a, x, z) {
  if (a.kind === 'circle') return Math.hypot(x - a.x, z - a.z) <= a.r;
  return x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1;
}

export const OUTSIDE = { id: 'amsterdam', name: 'Amsterdam', type: 'city', role: '' };

export function regionAt(x, z) {
  for (const r of REGIONS) if (inside(r.area, x, z)) return r;
  return OUTSIDE;
}

// Wilderness level rises one level per 50 metres in from the edge of Zuidoost, up to 56.
export function wildLevel(x, z) {
  if (!inside(WILD, x, z)) return 0;
  const d = Math.min(x - WILD.x0, WILD.x1 - x, z - WILD.z0, WILD.z1 - z);
  return Math.min(56, 1 + Math.floor(d / 50));
}

export function wildZoneName(level) {
  if (level <= 10) return 'Borderlands';
  if (level <= 20) return 'Industrial district';
  if (level <= 40) return 'Central danger zone';
  return 'Deep Wilderness';
}
