// Where everything grows, swims and glitters, at real Amsterdam coordinates (lat, lon).
// Generators work in tiles (1 tile = 1 m). Final tiles are snapped to sensible ground by terrain.js.
import { toTile } from '../../../shared/geo.js';

const T = (lat, lon) => toTile(lat, lon);
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const jit = (p, j) => ({ x: p.x + (rnd() - 0.5) * 2 * j, z: p.z + (rnd() - 0.5) * 2 * j });

// n points along a polyline of [lat, lon], offset sideways by `side` metres (both sides when twoSided)
function along(path, n, { side = 0, twoSided = false, jitter = 2 } = {}) {
  const pts = path.map(([a, b]) => T(a, b));
  const lens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.z - pts[i].z));
  const total = lens.reduce((s, l) => s + l, 0);
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (k + 0.5) / n * total, i = 0;
    while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
    const a = pts[i], b = pts[i + 1], t = d / lens[i];
    const dx = (b.x - a.x) / lens[i], dz = (b.z - a.z) / lens[i];
    const s = twoSided ? (k % 2 ? side : -side) : side;
    out.push(jit({ x: a.x + (b.x - a.x) * t - dz * s, z: a.z + (b.z - a.z) * t + dx * s }, jitter));
  }
  return out;
}

// n points scattered in a disc of r metres around [lat, lon]
function disc(lat, lon, r, n) {
  const c = T(lat, lon), out = [];
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r; out.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d }); }
  return out;
}

// small cluster of rocks: n tiles in a tight blob
function cluster(lat, lon, n, spread = 3) { return disc(lat, lon, spread, n); }

// Canal ring centrelines (west leg NNE-SSW, south leg WNW-ESE).
export const CANALS = {
  prinsengracht: [[52.3812, 4.8862], [52.3770, 4.8836], [52.3725, 4.8822], [52.3680, 4.8818], [52.3650, 4.8840], [52.3628, 4.8905], [52.3615, 4.8990]],
  keizersgracht: [[52.3808, 4.8882], [52.3768, 4.8858], [52.3722, 4.8846], [52.3685, 4.8848], [52.3660, 4.8870], [52.3642, 4.8935], [52.3633, 4.8995]],
  herengracht: [[52.3800, 4.8900], [52.3765, 4.8878], [52.3725, 4.8868], [52.3690, 4.8878], [52.3672, 4.8900], [52.3656, 4.8950], [52.3650, 4.9000]],
  brouwersgracht: [[52.3806, 4.8935], [52.3810, 4.8890], [52.3815, 4.8845]],
  reguliersgracht: [[52.3655, 4.8960], [52.3638, 4.8968], [52.3615, 4.8976]],
};
const AMSTEL = [[52.3633, 4.9024], [52.3605, 4.9042], [52.3570, 4.9055], [52.3535, 4.9063], [52.3495, 4.9068], [52.3455, 4.9066], [52.3400, 4.9055]];
const VONDEL = [[52.3612, 4.8780], [52.3598, 4.8740], [52.3585, 4.8700], [52.3575, 4.8660], [52.3565, 4.8620], [52.3560, 4.8592]];
const WESTERPARK = [[52.3860, 4.8768], [52.3866, 4.8795], [52.3872, 4.8820], [52.3878, 4.8848]];
const BOSBAAN = [[52.3318, 4.8420], [52.3322, 4.8500], [52.3326, 4.8580], [52.3330, 4.8650]];

// ---- woodcutting: each area is also a possible "Gemeente Boomplantdag" location
export const TREE_AREAS = [
  { id: 'jordaan', name: 'de Jordaan', type: 'tree_normal', green: false, pts: [
    ...along([[52.3792, 4.8855], [52.3779, 4.8802]], 10, { side: 7, twoSided: true }), // Westerstraat
    ...along([[52.3806, 4.8853], [52.3797, 4.8806]], 8, { side: 6, twoSided: true }), // Lindengracht
    ...along([[52.3747, 4.8829], [52.3741, 4.8790]], 6, { side: 6, twoSided: true }), // Bloemgracht
    ...along([[52.3702, 4.8842], [52.3694, 4.8806]], 6, { side: 6, twoSided: true }), // Elandsgracht
  ] },
  { id: 'pijp', name: 'De Pijp', type: 'tree_normal', green: true, pts: [
    ...disc(52.3543, 4.8968, 70, 14), // Sarphatipark
    ...along([[52.3585, 4.8908], [52.3530, 4.8930]], 8, { side: 9, twoSided: true }), // Ferdinand Bolstraat
    ...along([[52.3650, 4.8976], [52.3610, 4.8990]], 6, { side: 6, twoSided: true }), // Utrechtsestraat
  ] },
  { id: 'vondelpark', name: 'het Vondelpark', type: 'tree_oak', green: true, pts: [
    ...along(VONDEL, 18, { side: 45, twoSided: true, jitter: 18 }),
    ...along(VONDEL, 12, { side: 0, jitter: 30 }),
  ] },
  { id: 'amstel', name: 'de Amstel', type: 'tree_willow', shore: true, pts: along(AMSTEL, 26, { side: 42, twoSided: true, jitter: 6 }) },
  { id: 'grachten', name: 'de grachtengordel', type: 'tree_elm', shore: true, pts: [
    ...along(CANALS.keizersgracht, 18, { side: 11, twoSided: true, jitter: 3 }),
    ...along(CANALS.prinsengracht, 16, { side: 11, twoSided: true, jitter: 3 }),
    ...along(CANALS.herengracht, 12, { side: 11, twoSided: true, jitter: 3 }),
  ] },
  { id: 'westerpark', name: 'het Westerpark', type: 'tree_maple', green: true, pts: along(WESTERPARK, 24, { side: 28, twoSided: true, jitter: 16 }) },
  { id: 'hortus', name: 'de Hortus Botanicus', type: 'tree_yew', green: true, pts: disc(52.3666, 4.9082, 30, 6) },
  { id: 'bos', name: 'het Amsterdamse Bos', type: 'tree_oak', green: true, pts: disc(52.3245, 4.8480, 140, 12), extra: [
    { type: 'tree_normal', pts: disc(52.3290, 4.8560, 90, 10) },
    { type: 'tree_willow', shore: true, pts: along(BOSBAAN, 8, { side: 40, twoSided: true, jitter: 6 }) },
    { type: 'tree_maple', pts: disc(52.3180, 4.8400, 80, 6) },
  ] },
  { id: 'betoverd', name: 'het Betoverde Bos', type: 'tree_magic', green: true, noEvent: true, pts: disc(52.3105, 4.8330, 35, 5) },
];

// ---- mining
export const ROCK_AREAS = [
  { id: 'westergas', name: 'Westergasfabriek', rocks: [
    ['rock_copper', cluster(52.38645, 4.87265, 6)], ['rock_tin', cluster(52.38625, 4.87315, 6)],
    ['rock_iron', cluster(52.38575, 4.87515, 5)], ['rock_coal', cluster(52.38500, 4.87420, 5)],
    ['rock_silver', cluster(52.38660, 4.87580, 2)], ['rock_clay', cluster(52.38455, 4.87285, 3)],
  ] },
  { id: 'amstelklei', name: 'Amstel banks', shore: true, rocks: [
    ['rock_clay', along([[52.3520, 4.9068], [52.3470, 4.9072]], 4, { side: 38, twoSided: true, jitter: 3 })],
  ] },
  { id: 'wild', name: 'Wilderness', rocks: [
    ['rock_coal', cluster(52.3288, 4.9440, 3)], ['rock_iron', cluster(52.3290, 4.9455, 3)], // wild 1-3
    ['rock_gold', cluster(52.3273, 4.9600, 3)], // wild ~7
    ['rock_mithril', cluster(52.3219, 4.9750, 3)], // wild ~19
    ['rock_adamantite', cluster(52.3165, 4.9700, 3)], // wild ~31
    ['rock_runite', cluster(52.3098, 4.9725, 2)], // wild ~45
  ] },
];

// ---- fishing: each group has a few active spots that hop between candidate tiles
export const SPOT_GROUPS = [
  { type: 'fish_canal', active: 2, cands: along(CANALS.prinsengracht, 8, { jitter: 2 }) },
  { type: 'fish_canal', active: 2, cands: along(CANALS.keizersgracht, 8, { jitter: 2 }) },
  { type: 'fish_canal', active: 1, cands: along(CANALS.herengracht, 6, { jitter: 2 }) },
  { type: 'fish_canal', active: 1, cands: along(CANALS.brouwersgracht, 4, { jitter: 2 }) },
  { type: 'fish_canal', active: 1, cands: along(CANALS.reguliersgracht, 4, { jitter: 2 }) },
  { type: 'fish_pond', active: 3, cands: [...disc(52.3592, 4.8742, 25, 3), ...disc(52.3580, 4.8695, 25, 3), ...disc(52.3568, 4.8638, 20, 2)] },
  { type: 'fish_river', active: 4, cands: along(AMSTEL, 12, { side: 30, twoSided: true, jitter: 4 }) },
  { type: 'fish_harbour', active: 3, cands: [[52.3728, 4.9140], [52.3726, 4.9162], [52.3711, 4.9128], [52.3735, 4.9152], [52.3720, 4.9172]].map(([a, b]) => T(a, b)) }, // Scheepvaartmuseum
  { type: 'fish_harbour', active: 2, cands: [[52.4005, 4.8922], [52.4001, 4.8946], [52.3998, 4.8900], [52.4008, 4.8960]].map(([a, b]) => T(a, b)) }, // NDSM piers
  { type: 'fish_shark', active: 3, cands: [[52.3105, 4.9858], [52.3140, 4.9930], [52.3075, 4.9940], [52.3100, 4.9995], [52.3125, 4.9880]].map(([a, b]) => T(a, b)) }, // Gaasperplas (Wilderness ~24-35)
];

// ---- flax and farming
export const FLAX_FIELD = { at: T(52.38735, 4.87760), cols: 5, rows: 3 }; // near the Westerpark kinderboerderij
export const PATCHES = [
  { key: 'westerpark_1', type: 'allotment_patch', at: T(52.38790, 4.88560), name: 'Volkstuin Westerpark (noord)' },
  { key: 'westerpark_2', type: 'allotment_patch', at: T(52.38780, 4.88600), name: 'Volkstuin Westerpark (zuid)' },
  { key: 'amstelpark_1', type: 'allotment_patch', at: T(52.33050, 4.89620), name: 'Volkstuin Amstelpark (west)' },
  { key: 'amstelpark_2', type: 'allotment_patch', at: T(52.33055, 4.89680), name: 'Volkstuin Amstelpark (oost)' },
  { key: 'hortus_1', type: 'herb_patch', at: T(52.36655, 4.90760), name: 'Hortus kruidentuin (west)' },
  { key: 'hortus_2', type: 'herb_patch', at: T(52.36660, 4.90800), name: 'Hortus kruidentuin (oost)' },
];

// ---- NPCs
export const PEOPLE = {
  bert: T(52.38530, 4.87620), // Bouwmarkt at the Westergasfabriek
  vincent: T(52.35565, 4.89620), // Albert Cuypmarkt
  hanna: T(52.36690, 4.90830), // Hortus Botanicus
  bas: T(52.33000, 4.85600), // Amsterdamse Bos
  sign_hortus: T(52.36640, 4.90840),
  sign_bos: T(52.31120, 4.83420),
};
