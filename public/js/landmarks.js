// Low-poly models of Dam square and the old centre: Royal Palace, Nationaal Monument, Nieuwe Kerk, De Bijenkorf, Oude Kerk.
// Built in local metres with +z as the front, then placed and rotated from shared/landmarks.js.
import * as THREE from 'three';
import { LANDMARK_MODELS } from '/shared/landmarks.js';
import { facadeTexture } from './world.js';

const SANDSTONE = '#cbbd96', STONE = '#d9d3c5', BRICK = '#7a3f2b', OLDBRICK = '#86654a', SLATE = '#454c52', COPPER = '#5c8f74', LEAD = '#5d6264', GOLD = '#e0b530';

// Collects flat-shaded triangles with vertex colours and facade uvs (4 m x 3.2 m per window bay).
class Builder {
  constructor(bay = [4, 3.2]) { this.pos = []; this.col = []; this.uv = []; this.c = new THREE.Color(); this.bay = bay; }
  tri(a, b, c, color, uvs = [[0.01, 0.01], [0.01, 0.01], [0.01, 0.01]]) {
    const k = this.c.set(color);
    for (const [p, t] of [[a, uvs[0]], [b, uvs[1]], [c, uvs[2]]]) { this.pos.push(p[0], p[1], p[2]); this.col.push(k.r, k.g, k.b); this.uv.push(t[0], t[1]); }
  }
  quad(a, b, c, d, color, uvs) { this.tri(a, b, c, color, uvs ? [uvs[0], uvs[1], uvs[2]] : undefined); this.tri(a, c, d, color, uvs ? [uvs[0], uvs[2], uvs[3]] : undefined); }
  // vertical walls around a ring of [x, z] points, optionally with windows
  walls(ring, y0, y1, color, windows = true) {
    let run = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const [bw, bh] = this.bay;
      const uvs = windows ? [[run / bw, y0 / bh], [(run + len) / bw, y0 / bh], [(run + len) / bw, y1 / bh], [run / bw, y1 / bh]] : null;
      this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], color, uvs);
      run += len;
    }
  }
  cap(ring, y, color) { const v = ring.map(p => new THREE.Vector2(p[0], p[1])); for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(v, [])) this.tri([v[i].x, y, v[i].y], [v[j].x, y, v[j].y], [v[k].x, y, v[k].y], color); }
  box(x0, x1, z0, z1, y0, y1, color, roof = color, windows = true) {
    const r = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    this.walls(r, y0, y1, color, windows); this.cap(r, y1, roof);
  }
  // pitched roof over a rectangle, ridge along x (or z when alongZ)
  gable(x0, x1, z0, z1, y, h, roof, wall, alongZ = false) {
    if (!alongZ) {
      const zm = (z0 + z1) / 2;
      this.quad([x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm], roof);
      this.quad([x0, y, z1], [x1, y, z1], [x1, y + h, zm], [x0, y + h, zm], roof);
      this.tri([x0, y, z0], [x0, y + h, zm], [x0, y, z1], wall); this.tri([x1, y, z0], [x1, y + h, zm], [x1, y, z1], wall);
    } else {
      const xm = (x0 + x1) / 2;
      this.quad([x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0], roof);
      this.quad([x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0], roof);
      this.tri([x0, y, z0], [xm, y + h, z0], [x1, y, z0], wall); this.tri([x0, y, z1], [xm, y + h, z1], [x1, y, z1], wall);
    }
  }
  // n-sided prism / frustum / spire around (cx, cz)
  ring(cx, cz, r, n, rot = 0) { return Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; }); }
  frustum(cx, cz, r0, r1, y0, y1, n, color, windows = false) {
    const a = this.ring(cx, cz, r0, n, Math.PI / n), b = this.ring(cx, cz, r1, n, Math.PI / n);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (r1 < 0.01) this.tri([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [cx, y1, cz], color);
      else this.quad([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [b[j][0], y1, b[j][1]], [b[i][0], y1, b[i][1]], color, windows ? [[i, y0 / this.bay[1]], [i + 1, y0 / this.bay[1]], [i + 1, y1 / this.bay[1]], [i, y1 / this.bay[1]]] : null);
    }
    if (r1 >= 0.01) this.cap(b, y1, color);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    return g;
  }
}

// window bay size (width, storey height) per landmark: palaces and churches have much bigger windows than houses
const BAYS = { paleis: [5, 5.2], monument: [4, 3.2], nieuwekerk: [7, 10], bijenkorf: [5, 4.2], oudekerk: [7, 9] };

const BUILD = {
  paleis(b) {
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
  },
  monument(b) {
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
  },
  nieuwekerk(b) {
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
  },
  bijenkorf(b) {
    b.box(-27.5, 27.5, -35, 35, 0, 25, BRICK, '#4a3a32');
    b.box(-27.8, 27.8, -35.3, 35.3, 0, 4.5, '#b9a98a', '#b9a98a', false); // stone ground floor
    b.box(-28, 28, -35.5, 35.5, 24, 25.5, '#c9bb9b', '#4a3a32', false); // cornice
    b.box(-24, 24, -31, 31, 25.5, 29, '#6a3626', '#3e3430'); // set-back top floor
    b.frustum(-24, 31, 7.5, 7.5, 0, 31, 8, BRICK, true); // corner tower on Dam / Damrak
    b.frustum(-24, 31, 8, 8, 30, 31.5, 8, '#c9bb9b');
    b.frustum(-24, 31, 6, 4, 31.5, 34, 8, COPPER);
  },
  oudekerk(b) {
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
  },
};

// The "de Bijenkorf" lettering on the facades.
function signTexture() {
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

export function buildLandmarks(scene) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: facadeTexture() });
  const picks = [];
  for (const l of LANDMARK_MODELS) {
    const b = new Builder(BAYS[l.id]);
    BUILD[l.id](b);
    const mesh = new THREE.Mesh(b.geometry(), mat);
    mesh.userData.pick = { kind: 'scenery', name: l.name, ex: l.ex };
    const group = new THREE.Group();
    group.add(mesh);
    if (l.id === 'bijenkorf') {
      const sm = new THREE.MeshBasicMaterial({ map: signTexture(), transparent: true, depthWrite: false });
      const front = new THREE.Mesh(new THREE.PlaneGeometry(26, 4.9), sm); front.position.set(4, 19, 35.6);
      const side = new THREE.Mesh(new THREE.PlaneGeometry(26, 4.9), sm); side.position.set(-27.8, 19, 0); side.rotation.y = -Math.PI / 2;
      group.add(front, side);
    }
    group.position.set(l.x, 0, l.z);
    group.rotation.y = l.rot;
    scene.add(group);
    picks.push(mesh);
  }
  return picks;
}
