// monument: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    for (const [r, y] of [[9, 0], [7.6, 0.5], [6.2, 1]]) b.frustum(0, 0, r, r, y, y + 0.5, 12, '#c9c2b2');
    b.frustum(0, 0, 2.3, 1.7, 1.5, 23, 4, '#ece7dc');
    b.frustum(0, 0, 1.9, 1.9, 23, 23.6, 4, '#d8d2c4');
    for (const [x, z] of [[-2.6, 2.4], [2.6, 2.4]]) b.frustum(x, z, 0.9, 0.7, 1.5, 4.8, 6, '#9a948a'); // figures at the base
    for (let i = 0; i < 10; i++) {
      // curved wall behind the pillar
      const a0 = Math.PI * (i / 10), a1 = Math.PI * ((i + 1) / 10);
      const p = a => [Math.cos(a) * 11, -Math.sin(a) * 8 - 1];
      const [x0, z0] = p(a0), [x1, z1] = p(a1);
      b.quad([x0, 0, z0], [x1, 0, z1], [x1, 3.2, z1], [x0, 3.2, z0], '#d8d2c4');
      b.quad([x0, 3.2, z0], [x1, 3.2, z1], [x1 * 0.93, 3.2, z1 * 0.93], [x0 * 0.93, 3.2, z0 * 0.93], '#c9c2b2');
    }
  
}
