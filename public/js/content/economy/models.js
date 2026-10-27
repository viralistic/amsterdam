// Low-poly world models for the economy pack: Grand Exchange, station furniture, ferries, OV-fiets racks and more.
import * as THREE from 'three';
import { registry } from '../../registry.js';

// fresh materials per mesh: the renderer disposes them when an object leaves view
const mat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
const box = (g, w, h, d, color, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y + h / 2, z); g.add(m); return m; };
const cyl = (g, r0, r1, h, n, color, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, n), mat(color)); m.position.set(x, y + h / 2, z); g.add(m); return m; };

// A small canvas texture with big letters, for signs.
const texCache = new Map();
function label(text, bg, fg, w = 128, h = 64) {
  const k = [text, bg, fg, w, h].join('|');
  if (texCache.has(k)) return new THREE.MeshLambertMaterial({ map: texCache.get(k) });
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = `bold ${Math.floor(h * 0.62)}px Verdana, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(k, t);
  return new THREE.MeshLambertMaterial({ map: t });
}
const panel = (g, w, h, m, x, y, z, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); return p; };

export function buildBike(g = new THREE.Group()) {
  const wheel = z => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 5, 12), mat('#1a1a1a')); w.rotation.y = Math.PI / 2; w.position.set(0, 0.36, z); g.add(w); };
  wheel(-0.52); wheel(0.52);
  box(g, 0.06, 0.06, 0.9, '#003082', 0, 0.62, 0);
  const down = box(g, 0.06, 0.06, 0.62, '#003082', 0, 0.45, 0.2); down.rotation.x = 0.7;
  box(g, 0.06, 0.5, 0.06, '#003082', 0, 0.36, -0.25);
  box(g, 0.2, 0.05, 0.25, '#222', 0, 0.86, -0.28);
  box(g, 0.06, 0.45, 0.06, '#2a2a2a', 0, 0.55, 0.48);
  box(g, 0.55, 0.05, 0.05, '#2a2a2a', 0, 1.0, 0.48);
  box(g, 0.12, 0.04, 0.4, '#ffc917', 0, 0.72, 0.55);
  box(g, 0.12, 0.04, 0.4, '#ffc917', 0, 0.72, -0.55);
  box(g, 0.32, 0.12, 0.26, '#003082', 0, 0.74, 0.62); // front crate
  return g;
}

Object.assign(registry.objectModels, {
  ge_kiosk: () => {
    const g = new THREE.Group();
    cyl(g, 1.55, 1.45, 0.25, 8, '#8a7a5a');
    cyl(g, 1.25, 1.25, 1.0, 8, '#2f4a2f', 0, 0.25);
    cyl(g, 1.4, 1.4, 0.1, 8, '#c9a227', 0, 1.25);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; box(g, 0.12, 1.6, 0.12, '#c9a227', Math.cos(a) * 1.2, 1.35, Math.sin(a) * 1.2); }
    cyl(g, 1.75, 0.2, 1.1, 8, '#5c8f74', 0, 2.95);
    cyl(g, 1.8, 1.75, 0.12, 8, '#c9a227', 0, 2.85);
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), mat('#f2c230')); ball.position.y = 4.15; g.add(ball);
    cyl(g, 0.5, 0.5, 1.6, 6, '#d9d3c5', 0, 1.35);
    const sign = label('GE', '#2f4a2f', '#f2c230');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; panel(g, 0.7, 0.35, sign, Math.sin(a) * 0.51, 2.3, Math.cos(a) * 0.51, a); }
    return g;
  },
  ge_booth: () => {
    const g = new THREE.Group();
    box(g, 1, 1.05, 0.8, '#2f4a2f');
    box(g, 1.05, 0.08, 0.95, '#c9a227', 0, 1.05, 0.05);
    box(g, 1, 0.12, 0.8, '#1f321f', 0, 0, 0);
    box(g, 0.08, 1.1, 0.08, '#c9a227', -0.48, 1.1, -0.35); box(g, 0.08, 1.1, 0.08, '#c9a227', 0.48, 1.1, -0.35);
    box(g, 1.04, 0.3, 0.1, '#2f4a2f', 0, 2.1, -0.35);
    panel(g, 0.9, 0.26, label('EXCHANGE', '#2f4a2f', '#f2c230', 256, 64), 0, 2.25, -0.29);
    box(g, 0.3, 0.04, 0.2, '#e8e2d0', 0.15, 1.13, 0.1);
    return g;
  },
  ns_machine: () => {
    const g = new THREE.Group();
    box(g, 0.7, 1.7, 0.45, '#003082');
    box(g, 0.72, 0.35, 0.47, '#ffc917', 0, 1.7);
    box(g, 0.42, 0.32, 0.05, '#1a2a3a', 0, 1.15, 0.22);
    box(g, 0.16, 0.12, 0.06, '#e8e8e8', -0.15, 0.75, 0.23);
    box(g, 0.12, 0.12, 0.06, '#d42a8a', 0.18, 0.78, 0.23); // card reader
    panel(g, 0.6, 0.28, label('NS', '#ffc917', '#003082'), 0, 1.87, 0.24);
    return g;
  },
  gvb_machine: () => {
    const g = new THREE.Group();
    box(g, 0.7, 1.6, 0.45, '#d8d8dc');
    box(g, 0.72, 0.3, 0.47, '#0063a6', 0, 1.6);
    box(g, 0.42, 0.3, 0.05, '#1a2a3a', 0, 1.08, 0.22);
    box(g, 0.12, 0.12, 0.06, '#d42a8a', 0.18, 0.72, 0.23);
    panel(g, 0.6, 0.26, label('GVB', '#0063a6', '#ffffff'), 0, 1.75, 0.24);
    return g;
  },
  ov_gate: () => {
    const g = new THREE.Group();
    for (const x of [-0.42, 0.42]) {
      box(g, 0.18, 1.0, 0.8, '#b8b8c0', x, 0, 0);
      box(g, 0.2, 0.06, 0.82, '#5a5a62', x, 1.0, 0);
    }
    box(g, 0.14, 0.12, 0.14, '#ffc917', -0.42, 1.06, 0.25); box(g, 0.08, 0.06, 0.08, '#d42a8a', -0.42, 1.18, 0.25);
    const glass = new THREE.MeshLambertMaterial({ color: '#9fd0e0', transparent: true, opacity: 0.5 });
    for (const x of [-0.2, 0.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.7, 0.04), glass); p.position.set(x, 0.75, 0); g.add(p); }
    return g;
  },
  metro_sign: () => {
    const g = new THREE.Group();
    box(g, 1.2, 0.08, 1.4, '#2a2a2e', 0, 0, 0.2);
    box(g, 0.9, 0.04, 1.1, '#0e0e10', 0, 0.05, 0.25);
    for (let i = 0; i < 4; i++) box(g, 0.9, 0.04, 0.2, '#4a4a50', 0, 0.06 - i * 0.0, 0.0 + i * 0.22);
    box(g, 0.1, 2.6, 0.1, '#d8d8d8', -0.75, 0, -0.5);
    box(g, 0.62, 0.62, 0.12, '#e2001a', -0.75, 2.6, -0.5);
    const m = label('M', '#e2001a', '#ffffff', 64, 64);
    panel(g, 0.56, 0.56, m, -0.75, 2.91, -0.43);
    panel(g, 0.56, 0.56, m, -0.75, 2.91, -0.57, Math.PI);
    for (const x of [-0.5, 0.5]) box(g, 0.05, 0.9, 1.2, '#8a8a90', x, 0.05, 0.2);
    return g;
  },
  ferry: () => {
    const g = new THREE.Group();
    box(g, 3, 0.2, 3, '#7a5a34', 0, 0, 0);
    for (let i = -1; i <= 1; i++) box(g, 3, 0.02, 0.06, '#5a4024', 0, 0.2, i);
    for (const x of [-1.4, 1.4]) box(g, 0.08, 0.9, 3, '#e8e8e8', x, 0.2, 0);
    box(g, 0.1, 2.2, 0.1, '#e8e8e8', 1.3, 0.2, -1.3);
    panel(g, 0.9, 0.45, label('VEER', '#0063a6', '#ffffff'), 1.3, 2.2, -1.24);
    // the pont, moored in front of the pier
    const hull = new THREE.Group(); hull.position.set(0, -0.15, 3.4); g.add(hull);
    box(hull, 3.6, 0.55, 3.2, '#f2f2f2');
    box(hull, 3.62, 0.15, 3.22, '#0063a6', 0, 0.35);
    box(hull, 3.4, 0.05, 3.0, '#5a5a62', 0, 0.55);
    box(hull, 0.9, 1.1, 0.9, '#f2f2f2', 1.25, 0.6, 0);
    box(hull, 0.95, 0.08, 0.95, '#0063a6', 1.25, 1.7, 0);
    box(hull, 0.92, 0.3, 0.92, '#9fd0e0', 1.25, 1.2, 0);
    return g;
  },
  ovfiets_rack: () => {
    const g = new THREE.Group();
    box(g, 3, 0.08, 0.1, '#8a8a90', 0, 0.3, -0.5);
    for (const x of [-1.4, 1.4]) box(g, 0.08, 1.1, 0.08, '#8a8a90', x, 0, -0.5);
    box(g, 3, 0.5, 0.06, '#003082', 0, 1.05, -0.52);
    panel(g, 1.6, 0.4, label('OV-fiets', '#003082', '#ffc917', 256, 64), 0, 1.3, -0.48);
    for (const x of [-1, 0, 1]) { const b = buildBike(); b.position.x = x; b.scale.setScalar(0.9); g.add(b); }
    return g;
  },
  deposit_box: () => {
    const g = new THREE.Group();
    box(g, 0.14, 0.7, 0.14, '#3a3a3e');
    box(g, 0.75, 0.75, 0.6, '#2a4a3a', 0, 0.7);
    box(g, 0.78, 0.1, 0.63, '#c9a227', 0, 1.45);
    box(g, 0.45, 0.06, 0.05, '#0a0a0a', 0, 1.2, 0.3);
    box(g, 0.2, 0.2, 0.04, '#c9a227', 0, 0.9, 0.3);
    return g;
  },
  station_sign: () => {
    const g = new THREE.Group();
    for (const x of [-0.7, 0.7]) box(g, 0.08, 2.0, 0.08, '#8a8a90', x);
    box(g, 1.6, 0.42, 0.06, '#003082', 0, 1.7);
    box(g, 1.6, 0.06, 0.07, '#ffffff', 0, 1.74);
    box(g, 1.6, 0.06, 0.07, '#ffffff', 0, 1.98);
    return g;
  },
  market_stall: () => {
    const g = new THREE.Group();
    box(g, 2, 0.9, 0.9, '#7a5a34');
    box(g, 2, 0.06, 0.9, '#a07a4a', 0, 0.9);
    const goods = ['#d42a2a', '#f2c230', '#2f6b2a', '#e88a2a', '#8a8a90'];
    goods.forEach((c, i) => box(g, 0.3, 0.2, 0.3, c, -0.8 + i * 0.4, 0.96, 0.1));
    for (const x of [-0.95, 0.95]) for (const z of [-0.4, 0.4]) box(g, 0.06, 2.1, 0.06, '#5a4024', x, 0, z);
    for (let i = 0; i < 6; i++) { const s = box(g, 2.0 / 6, 0.06, 1.2, i % 2 ? '#f2f2f2' : '#c8102e', -1 + 1 / 6 + i * 2 / 6, 2.1, 0.1); s.rotation.x = -0.2; }
    return g;
  },
});
