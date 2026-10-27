// nieuwekerk: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    b.box(-36, 30, -9, 9, 0, 19, OLDBRICK, SLATE);
    b.gable(-36, 30, -9, 9, 19, 15, SLATE, OLDBRICK);
    b.box(-8, 8, -15, 15, 0, 19, OLDBRICK, SLATE); // transept
    b.gable(-8, 8, -15, 15, 19, 15, SLATE, OLDBRICK, true);
    b.frustum(36, 0, 9, 9, 0, 19, 6, OLDBRICK); // choir apse
    b.frustum(36, 0, 9, 0.01, 19, 32, 6, SLATE);
    b.frustum(0, 0, 1.8, 1.8, 33, 38, 8, '#3c3c3c'); // crossing turret
    b.frustum(0, 0, 2, 0.01, 38, 47, 8, SLATE);
    b.box(-39, -36, -6, 6, 0, 26, OLDBRICK, OLDBRICK); // west front
    b.gable(-39, -36, -6, 6, 26, 7, SLATE, OLDBRICK);
  
}
