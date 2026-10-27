// paleis: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    b.box(-40, 40, -28.5, 28.5, 0, 26, SANDSTONE, LEAD);
    b.box(-40, 40, -28.5, 28.5, 0, 1.5, '#a99c7a', LEAD, false); // plinth
    b.box(-15, 15, 28.5, 31, 0, 28, SANDSTONE, LEAD); // central front section
    b.gable(-15, 15, 26, 31, 28, 6, LEAD, SANDSTONE, true);
    b.box(-15, 15, -31, -28.5, 0, 28, SANDSTONE, LEAD);
    b.gable(-15, 15, -31, -26, 28, 6, LEAD, SANDSTONE, true);
    b.box(-38, 38, -26.5, 26.5, 26, 27.5, LEAD, LEAD, false);
    b.frustum(0, 0, 6, 6, 27.5, 36, 8, SANDSTONE, true); // cupola drum
    b.frustum(0, 0, 6.6, 2.2, 36, 41, 8, COPPER); // dome
    b.frustum(0, 0, 1.8, 1.8, 41, 44, 8, STONE);
    b.frustum(0, 0, 2.1, 0.01, 44, 47, 8, COPPER);
    b.frustum(0, 0, 0.25, 0.25, 47, 49.5, 4, GOLD);
    for (const x of [-9, -3, 3, 9]) b.box(x - 0.5, x + 0.5, 31, 31.6, 1.5, 3.5, '#5a4a30', '#5a4a30', false); // doors
  
}
