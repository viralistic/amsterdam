// Artis zoo, laid out like the classic old-school zoo map: fenced enclosures ringed by dirt paths.
// Local metres around the zoo centre: +x east, +z south.
import { toTile } from './geo.js';

const C = toTile(52.3663, 4.9163);
export const ZOO_CENTER = { x: C.x, z: C.z };
export const ZOO_BOUNDS = [-125, 100, -75, 50]; // x0, x1, z0, z1
export const ZOO_ENTRANCE = { x: -125, z: 25 }; // gate on the Plantage Kerklaan side

const oct = (cx, cz, w, h, cut = 0.3) => {
  const hw = w / 2, hh = h / 2, k = Math.min(hw, hh) * cut;
  return [[cx - hw + k, cz - hh], [cx + hw - k, cz - hh], [cx + hw, cz - hh + k], [cx + hw, cz + hh - k], [cx + hw - k, cz + hh], [cx - hw + k, cz + hh], [cx - hw, cz + hh - k], [cx - hw, cz - hh + k]];
};
const rect = (cx, cz, w, h) => [[cx - w / 2, cz - h / 2], [cx + w / 2, cz - h / 2], [cx + w / 2, cz + h / 2], [cx - w / 2, cz + h / 2]];

export const GROUND = { snow: '#dfe4e8', dirt: '#5e4a2a', sand: '#c9b46c', grass: '#557021', water: '#3d6690', rock: '#7c776c' };

export const ENCLOSURES = [
  { name: 'Penguins', animal: 'penguin', count: 5, ground: 'snow', poly: oct(-89, 8, 25, 38, 0.2), pond: rect(-94, 18, 10, 12), ex: 'Black and white, and very busy.' },
  { name: 'Monkeys', animal: 'monkey', count: 4, ground: 'grass', poly: oct(-58, -22, 38, 38), palms: [[-64, -28], [-52, -16], [-60, -12], [-50, -30]], ex: 'They seem to be plotting something.' },
  { name: 'Gorillas', animal: 'gorilla', count: 2, ground: 'dirt', poly: oct(-46, 14, 38, 28), ex: 'Big, strong and surprisingly gentle.' },
  { name: 'Flamingos', animal: 'flamingo', count: 6, ground: 'grass', poly: oct(-15, -11, 34, 44, 0.45), pond: rect(-15, -11, 8, 38), ex: 'They are pink because of the shrimp they eat.' },
  { name: 'Parrots', animal: 'parrot', count: 3, ground: 'dirt', poly: oct(-16, -59, 25, 12, 0.5), palms: [[-22, -59]], ex: 'Squawk!' },
  { name: 'Wolves', animal: 'wolf', count: 3, ground: 'dirt', poly: oct(12, -46, 38, 30, 0.25), ex: 'A small pack of grey wolves.' },
  { name: 'Lions', animal: 'lion', count: 2, ground: 'sand', poly: rect(26, -20, 16, 20), ex: 'The king of the zoo. Currently napping.' },
  { name: 'Zebras', animal: 'zebra', count: 2, ground: 'sand', poly: rect(26, 6, 16, 20), ex: 'Black with white stripes, or white with black stripes?' },
  { name: 'Elephants', animal: 'elephant', count: 2, ground: 'dirt', poly: oct(67, -28, 47, 50, 0.2), pond: rect(78, -40, 12, 10), ex: 'Huge, grey and never forgets a face.' },
  { name: 'Giraffes', animal: 'giraffe', count: 3, ground: 'grass', poly: oct(67, 23, 47, 34, 0.2), pond: rect(54, 16, 12, 9), ex: 'They can see you from all the way over there.' },
  { name: 'Camels', animal: 'camel', count: 2, ground: 'sand', poly: rect(10, 31, 42, 16), ex: 'One hump. Technically a dromedary.' },
];

// Extra walkways joining the rings around the enclosures, plus the path from the gate.
export const PATHS = [
  [[-125, 25], [-100, 30], [-70, 32], [-30, 34], [-10, 44], [40, 44], [90, 44]],
  [[-100, -15], [-80, -45], [-40, -48], [-16, -45], [-5, -62], [40, -64], [90, -60]],
  [[3, -70], [3, 45]],
  [[40, -60], [40, 44]],
];

const world = ([x, z]) => [x + C.x, z + C.z];
for (const e of ENCLOSURES) {
  e.world = e.poly.map(world);
  if (e.pond) e.pondWorld = e.pond.map(world);
  const xs = e.poly.map(p => p[0]), zs = e.poly.map(p => p[1]);
  e.cx = (Math.min(...xs) + Math.max(...xs)) / 2 + C.x;
  e.cz = (Math.min(...zs) + Math.max(...zs)) / 2 + C.z;
  e.radius = Math.floor(Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) / 2) - 3;
}
export const PATHS_WORLD = PATHS.map(p => p.map(world));
const [bx0, bx1, bz0, bz1] = ZOO_BOUNDS;
export const ZOO_BOUNDS_WORLD = [bx0 + C.x, bx1 + C.x, bz0 + C.z, bz1 + C.z];

export function insideZoo(x, z) {
  const [x0, x1, z0, z1] = ZOO_BOUNDS_WORLD;
  return x >= x0 && x <= x1 && z >= z0 && z <= z1;
}
