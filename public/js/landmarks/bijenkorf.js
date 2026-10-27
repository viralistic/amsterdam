// bijenkorf: hand-built landmark model. Local metres, +z is the front facade, y up.
import { SANDSTONE, STONE, BRICK, OLDBRICK, SLATE, COPPER, LEAD, GOLD } from './builder.js';

export default function build(b, THREE, group) {
    b.box(-27.5, 27.5, -35, 35, 0, 25, BRICK, '#4a3a32');
    b.box(-27.8, 27.8, -35.3, 35.3, 0, 4.5, '#b9a98a', '#b9a98a', false); // stone ground floor
    b.box(-28, 28, -35.5, 35.5, 24, 25.5, '#c9bb9b', '#4a3a32', false); // cornice
    b.box(-24, 24, -31, 31, 25.5, 29, '#6a3626', '#3e3430'); // set-back top floor
    b.frustum(-24, 31, 7.5, 7.5, 0, 31, 8, BRICK, true); // corner tower on Dam / Damrak
    b.frustum(-24, 31, 8, 8, 30, 31.5, 8, '#c9bb9b');
    b.frustum(-24, 31, 6, 4, 31.5, 34, 8, COPPER);
  
  const sm = new THREE.MeshBasicMaterial({ map: signTexture(THREE), transparent: true, depthWrite: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(26, 4.9), sm); front.position.set(4, 19, 35.6);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(26, 4.9), sm); side.position.set(-27.8, 19, 0); side.rotation.y = -Math.PI / 2;
  group.add(front, side);
}

// The "de Bijenkorf" lettering on the facades.
function signTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#f4efe2';
  g.font = 'italic bold 70px Georgia, "Times New Roman", serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('de Bijenkorf', 256, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

