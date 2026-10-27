// rangedguild: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    // round stone guild tower with a conical roof
    b.frustum(-12, -6, 9, 9, 0, 11, 8, '#8c8270', true);
    b.frustum(-12, -6, 9.6, 9.6, 11, 12, 8, '#7a7060');
    for (let i = 0; i < 16; i += 2) {
      const a = i / 16 * Math.PI * 2, x = -12 + Math.cos(a) * 9.2, z = -6 + Math.sin(a) * 9.2;
      b.box(x - 0.8, x + 0.8, z - 0.8, z + 0.8, 12, 13.2, '#7a7060', '#7a7060', false);
    }
    b.frustum(-12, -6, 8.6, 0.01, 12, 22, 8, '#7a3a28');
    b.box(-13.5, -10.5, 2.4, 3.2, 0, 3.4, '#4a3018', '#4a3018', false); // door
    // archery range: grass, targets on stands, shooting line
    b.box(1, 24, -21, 7, 0.02, 0.06, '#5e7a22', '#5e7a22', false);
    b.box(1, 24, 4, 4.4, 0.06, 0.1, '#e8e2d0', '#e8e2d0', false);
    for (const x of [5, 10.5, 16, 21.5]) {
      b.box(x - 1.4, x - 1.1, -19, -18.7, 0, 2.4, '#5a3e22', '#5a3e22', false);
      b.box(x + 1.1, x + 1.4, -19, -18.7, 0, 2.4, '#5a3e22', '#5a3e22', false);
      b.frustum(x, -18.6, 1.45, 1.45, 0.4, 0.7, 8, '#c8a050');
      const z = -18.4;
      for (const [r, c, dz] of [[1.4, '#d8c890', 0], [1.15, '#111111', 0.02], [0.9, '#2050c0', 0.04], [0.62, '#d02020', 0.06], [0.32, '#f2d040', 0.08]]) b.disc(x, 1.7, z + dz, r, 12, c);
    }
    // wooden fence round the grounds, open at the front
    const post = (x, z) => b.box(x - 0.12, x + 0.12, z - 0.12, z + 0.12, 0, 1.3, '#6a4a2a', '#6a4a2a', false);
    for (let x = -25; x <= 25; x += 2.5) { post(x, -22); }
    for (let z = -22; z <= 22; z += 2.5) { post(-25, z); post(25, z); }
    b.box(-25, 25, -22.05, -21.95, 0.9, 1.05, '#7a5a34', '#7a5a34', false);
    b.box(-25.05, -24.95, -22, 22, 0.9, 1.05, '#7a5a34', '#7a5a34', false);
    b.box(24.95, 25.05, -22, 22, 0.9, 1.05, '#7a5a34', '#7a5a34', false);
  
}
