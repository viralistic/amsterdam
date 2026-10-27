// Street furniture from the chunk's `sf` arrays (see server/mapdata.js): benches, canal lamps, bike racks full of
// parked bikes, waste bins and the red-brown Amsterdammertje bollards with their three crosses. All instanced.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { atmo, hash, trackChunk } from './common.js';
import { CHUNK } from '/shared/geo.js';

// ---- geometry helpers: coloured, non-indexed parts merged into one model
const col = new THREE.Color();
function part(g, color, tf) {
  g = g.index ? g.toNonIndexed() : g;
  if (tf) tf(g);
  col.set(color);
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.deleteAttribute('uv');
  return g;
}
const box = (w, h, d, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => part(new THREE.BoxGeometry(w, h, d), color, g => { g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); });
const cyl = (rt, rb, h, seg, color, x = 0, y = 0, z = 0) => part(new THREE.CylinderGeometry(rt, rb, h, seg), color, g => g.translate(x, y + h / 2, z));
const merge = parts => { const g = mergeGeometries(parts); g.computeVertexNormals(); return g; };

const WOOD = '#8a5a32', IRON = '#262a26', LAMPGREEN = '#1d2b24', BOLLARD = '#6e2418';

function benchGeo() {
  const p = [];
  for (const z of [-0.14, 0, 0.14]) p.push(box(1.8, 0.04, 0.11, WOOD, 0, 0.45, z));
  for (const [y, z] of [[0.62, -0.25], [0.78, -0.27]]) p.push(box(1.8, 0.11, 0.035, WOOD, 0, y, z, -0.12));
  for (const x of [-0.78, 0.78]) {
    p.push(box(0.05, 0.45, 0.05, IRON, x, 0.225, 0.16), box(0.05, 0.86, 0.05, IRON, x, 0.43, -0.22, -0.12), box(0.05, 0.04, 0.46, IRON, x, 0.42, -0.02));
    p.push(box(0.05, 0.04, 0.3, IRON, x, 0.62, 0.05));
  }
  return merge(p);
}
function lampGeo() {
  return merge([
    cyl(0.13, 0.16, 0.35, 6, LAMPGREEN), cyl(0.06, 0.08, 3.5, 6, LAMPGREEN, 0, 0.35), cyl(0.1, 0.06, 0.12, 6, LAMPGREEN, 0, 3.75),
    cyl(0.16, 0.12, 0.06, 4, LAMPGREEN, 0, 3.86).rotateY(Math.PI / 4),
    part(new THREE.ConeGeometry(0.3, 0.26, 4), LAMPGREEN, g => { g.rotateY(Math.PI / 4); g.translate(0, 4.48, 0); }),
    cyl(0.025, 0.04, 0.16, 4, LAMPGREEN, 0, 4.6),
  ]);
}
// the glass of the lantern, lit at night
const glassGeo = () => part(new THREE.CylinderGeometry(0.24, 0.15, 0.44, 4), '#ffffff', g => { g.rotateY(Math.PI / 4); g.translate(0, 4.14, 0); });
function rackGeo() {
  // one "nietje" hoop, bikes lean against it along local z
  return merge([box(0.035, 0.75, 0.035, '#8a8c90', 0, 0.375, -0.35), box(0.035, 0.75, 0.035, '#8a8c90', 0, 0.375, 0.35), box(0.035, 0.035, 0.74, '#8a8c90', 0, 0.75, 0)]);
}
function bikeGeo() {
  const tyre = '#141414', frame = '#ffffff';
  const wheel = z => part(new THREE.TorusGeometry(0.33, 0.028, 3, 10), tyre, g => { g.rotateY(Math.PI / 2); g.translate(0, 0.35, z); });
  const tube = (y0, z0, y1, z1, w = 0.035) => { const l = Math.hypot(y1 - y0, z1 - z0); return box(w, w, l, frame, 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); };
  return merge([
    wheel(-0.52), wheel(0.52),
    tube(0.35, -0.52, 0.78, -0.18), tube(0.4, 0.05, 0.78, -0.18), tube(0.4, 0.05, 0.85, 0.42), tube(0.35, -0.52, 0.4, 0.05),
    tube(0.35, 0.52, 0.85, 0.42), tube(0.78, -0.18, 0.88, -0.24),
    box(0.11, 0.04, 0.22, '#3a2618', 0, 0.9, -0.24),
    box(0.5, 0.03, 0.03, '#2a2a2a', 0, 0.98, 0.38), tube(0.85, 0.42, 0.98, 0.38, 0.03),
    box(0.16, 0.02, 0.32, frame, 0, 0.72, -0.52), // rear carrier
    box(0.2, 0.05, 0.14, '#3a3a3a', 0, 0.8, 0.6), // front crate holder
  ]);
}
function binGeo() {
  return merge([
    cyl(0.035, 0.035, 1.25, 5, '#55585a'),
    cyl(0.24, 0.21, 0.58, 8, '#3c5a42', 0, 0.48, 0.24),
    cyl(0.26, 0.26, 0.06, 8, '#2c4432', 0, 1.06, 0.24),
  ]);
}
function bollardGeo() {
  const p = [cyl(0.075, 0.095, 0.66, 7, BOLLARD), cyl(0.095, 0.095, 0.06, 7, BOLLARD, 0, 0.66), cyl(0.06, 0.075, 0.08, 7, BOLLARD, 0, 0.72),
    part(new THREE.SphereGeometry(0.075, 7, 4), BOLLARD, g => g.translate(0, 0.84, 0))];
  // three St. Andrew's crosses on front and back
  for (const side of [1, -1]) for (const y of [0.24, 0.38, 0.52]) for (const a of [0.785, -0.785]) p.push(box(0.11, 0.022, 0.012, '#f2eee6', 0, y, side * 0.086, 0, 0, a));
  return merge(p);
}

// ---- shared materials and textures
let M = null;
function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function setup() {
  const lam = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  M = {
    bench: { geo: benchGeo(), mat: lam() }, lamp: { geo: lampGeo(), mat: lam() }, rack: { geo: rackGeo(), mat: lam() },
    bike: { geo: bikeGeo(), mat: lam() }, bin: { geo: binGeo(), mat: lam() }, bollard: { geo: bollardGeo(), mat: lam() },
    glass: { geo: glassGeo(), mat: new THREE.MeshBasicMaterial({ vertexColors: true, color: '#3c444c' }) },
    halo: new THREE.PointsMaterial({ map: glowTexture('rgba(255,236,190,1)', 'rgba(255,170,80,0.45)'), size: 3.4, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: true }),
    pool: { geo: new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), mat: new THREE.MeshBasicMaterial({ map: glowTexture('rgba(255,190,110,0.9)', 'rgba(255,150,60,0.35)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: true }) },
  };
}
const BIKE_COLORS = ['#1b1b1d', '#1b1b1d', '#1b1b1d', '#202a44', '#5a1616', '#33503f', '#cfc5b0', '#6e7076', '#1b1b1d', '#7a3a1a', '#2a5a7a'].map(c => new THREE.Color(c));

export function furnitureDecorator(chunk, d, group, T, ctx) {
  const sf = d.sf;
  if (!sf || !ctx?.renderer) return;
  if (!M) setup();
  const x0 = chunk.cx * CHUNK, z0 = chunk.cz * CHUNK;
  const root = new THREE.Group();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  const owned = [];
  const inst = (kind, n) => { const im = new THREE.InstancedMesh(M[kind].geo, M[kind].mat, n); im.frustumCulled = true; owned.push(im); root.add(im); return im; };
  const finish = im => { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); };
  const place = (im, i, x, z, yaw, sc = 1, y = 0) => { q.setFromAxisAngle(up, yaw); m4.compose(p.set(x, y, z), q, s.setScalar(sc)); im.setMatrixAt(i, m4); };

  // benches
  const nb = (sf.be?.length || 0) / 3;
  if (nb) { const im = inst('bench', nb); for (let i = 0; i < nb; i++) place(im, i, sf.be[i * 3] + x0, sf.be[i * 3 + 1] + z0, sf.be[i * 3 + 2]); finish(im); }
  // lamps: post, glass, halo sprite and a pool of light on the ground
  const nl = (sf.la?.length || 0) / 2;
  if (nl) {
    const post = inst('lamp', nl), glass = inst('glass', nl), pool = inst('pool', nl);
    const world = new Float32Array(nl * 2), halo = new Float32Array(nl * 3);
    for (let i = 0; i < nl; i++) {
      const x = sf.la[i * 2] + x0, z = sf.la[i * 2 + 1] + z0, yaw = hash(Math.round(x * 10), Math.round(z * 10)) * 6.28;
      place(post, i, x, z, yaw); place(glass, i, x, z, yaw); place(pool, i, x, z, 0, 1, 0.07);
      world[i * 2] = x; world[i * 2 + 1] = z;
      halo[i * 3] = x; halo[i * 3 + 1] = 4.14; halo[i * 3 + 2] = z;
    }
    [post, glass, pool].forEach(finish);
    pool.renderOrder = 2;
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(halo, 3)); hg.computeBoundingSphere();
    const pts = new THREE.Points(hg, M.halo); pts.renderOrder = 6;
    root.add(pts);
    owned.push({ dispose: () => hg.dispose() });
    atmo.lamps.set(chunk.cx + ',' + chunk.cz, world);
  }
  // bike racks with parked bikes, one hoop per two bikes
  const nr = (sf.bi?.length || 0) / 4;
  if (nr) {
    let bikes = 0, hoops = 0;
    for (let i = 0; i < nr; i++) { bikes += sf.bi[i * 4 + 3]; hoops += Math.ceil(sf.bi[i * 4 + 3] / 2); }
    const bim = inst('bike', bikes), him = inst('rack', hoops);
    let bi = 0, hi = 0;
    const off = new THREE.Vector3();
    for (let i = 0; i < nr; i++) {
      const cx = sf.bi[i * 4] + x0, cz = sf.bi[i * 4 + 1] + z0, yaw = sf.bi[i * 4 + 2], n = sf.bi[i * 4 + 3];
      const ax = Math.cos(yaw), az = -Math.sin(yaw); // local +x in world
      for (let k = 0; k < n; k++) {
        const h = hash(Math.round(cx * 10) + k * 31, Math.round(cz * 10) - k * 17);
        const along = (k - (n - 1) / 2) * 0.62;
        off.set(cx + ax * along, 0, cz + az * along);
        q.setFromEuler(new THREE.Euler(0, yaw + (h - 0.5) * 0.3 + (h > 0.85 ? Math.PI : 0), (h - 0.5) * 0.16, 'YXZ'));
        m4.compose(p.copy(off), q, s.setScalar(1)); bim.setMatrixAt(bi, m4);
        bim.setColorAt(bi, BIKE_COLORS[Math.floor(h * 997) % BIKE_COLORS.length]);
        bi++;
        if (k % 2 === 0) { place(him, hi++, cx + ax * (along + 0.31), cz + az * (along + 0.31), yaw); }
      }
    }
    finish(bim); finish(him);
    if (bim.instanceColor) bim.instanceColor.needsUpdate = true;
  }
  // bins
  const nw = (sf.wb?.length || 0) / 2;
  if (nw) { const im = inst('bin', nw); for (let i = 0; i < nw; i++) { const x = sf.wb[i * 2] + x0, z = sf.wb[i * 2 + 1] + z0; place(im, i, x, z, hash(Math.round(x * 7), Math.round(z * 7)) * 6.28); } finish(im); }
  // Amsterdammertjes
  const no = (sf.bo?.length || 0) / 2;
  if (no) { const im = inst('bollard', no); for (let i = 0; i < no; i++) { const x = sf.bo[i * 2] + x0, z = sf.bo[i * 2 + 1] + z0; place(im, i, x, z, hash(Math.round(x * 5), Math.round(z * 5)) * 0.6, 0.96 + hash(Math.round(z * 5), Math.round(x * 5)) * 0.08); } finish(im); }

  if (!root.children.length) return;
  const scene = ctx.renderer.scene;
  scene.add(root);
  trackChunk(chunk, () => { scene.remove(root); for (const o of owned) o.dispose(); atmo.lamps.delete(chunk.cx + ',' + chunk.cz); });
}

const dark = new THREE.Color('#3c444c'), warm = new THREE.Color('#ffe2a0');
export function furnitureFrame() {
  if (!M) return;
  const l = atmo.light.lamp;
  M.glass.mat.color.copy(dark).lerp(warm, l);
  M.halo.opacity = l * 0.85;
  M.pool.mat.opacity = l * 0.55;
}
