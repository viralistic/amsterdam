// oudekerk: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    b.box(-30, 40, -23, 23, 0, 11, OLDBRICK, SLATE); // aisles and side chapels
    b.gable(-30, 40, -23, -7, 11, 7, SLATE, OLDBRICK);
    b.gable(-30, 40, 7, 23, 11, 7, SLATE, OLDBRICK);
    b.box(-30, 40, -11, 11, 0, 17, OLDBRICK, SLATE); // nave
    b.gable(-30, 40, -11, 11, 17, 15, SLATE, OLDBRICK);
    b.frustum(40, 0, 11, 11, 0, 17, 6, OLDBRICK);
    b.frustum(40, 0, 11, 0.01, 17, 30, 6, SLATE);
    // west tower: brick base, then the wooden lanterns and spire
    b.box(-41, -30, -5.5, 5.5, 0, 31, '#7b5c44', '#5a4a3a');
    // clock faces
    for (const z of [-5.6, 5.6]) { b.box(-37, -34, z - 0.05, z + 0.05, 25, 28, '#f2efe6', '#f2efe6', false); b.box(-35.7, -35.3, z - 0.1, z + 0.1, 26.5, 27.8, '#222', '#222', false); }
    b.box(-41.15, -41.05, -1.5, 1.5, 25, 28, '#f2efe6', '#f2efe6', false);
    b.frustum(-35.5, 0, 4.6, 4.2, 31, 39, 8, '#5d4c3c', true);
    b.frustum(-35.5, 0, 4.4, 3.2, 39, 40, 8, SLATE);
    b.frustum(-35.5, 0, 3.0, 2.6, 40, 47, 8, '#5d4c3c', true);
    b.frustum(-35.5, 0, 2.8, 2.0, 47, 48, 8, SLATE);
    b.frustum(-35.5, 0, 1.8, 1.6, 48, 52, 8, '#5d4c3c');
    b.frustum(-35.5, 0, 1.9, 0.01, 52, 66, 8, '#3d4346');
    b.frustum(-35.5, 0, 0.2, 0.2, 66, 67.5, 4, GOLD);
  
}
