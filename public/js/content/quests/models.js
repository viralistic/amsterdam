// Object models for the quest pack: palace, museum, church, workshop and ship furniture. Low-poly, flat-shaded,
// facing +z, standing on y = 0 and centred on their tile.
import * as THREE from 'three';
import { registry } from '../../registry.js';

const mat = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const place = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const bx = (w, h, d, c, x = 0, y = 0, z = 0) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)), x, y + h / 2, z);
const cyl = (rt, rb, h, c, x = 0, y = 0, z = 0, n = 8) => place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), mat(c)), x, y + h / 2, z);
const ball = (r, c, x = 0, y = 0, z = 0, n = 6) => place(new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(3, n - 2)), mat(c)), x, y, z);
const cone = (r, h, c, x = 0, y = 0, z = 0, n = 6) => place(new THREE.Mesh(new THREE.ConeGeometry(r, h, n), mat(c)), x, y + h / 2, z);
const G = (...kids) => { const g = new THREE.Group(); g.add(...kids); return g; };
const glow = (c, x, y, z, w, h, d, opacity = 0.85) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity })), x, y, z);

// small canvas textures for paintings
const texCache = new Map();
function canvasTex(key, draw, w = 64, h = 48) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  texCache.set(key, t); return t;
}
const SCENES = {
  milk: (g, w, h) => { g.fillStyle = '#3a3a30'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c0a0'; g.fillRect(0, 0, w * 0.4, h); g.fillStyle = '#e8d070'; g.fillRect(24, 12, 16, 14); g.fillStyle = '#2a4a9a'; g.fillRect(26, 26, 14, 18); g.fillStyle = '#f0e0c0'; g.beginPath(); g.arc(32, 9, 5, 0, 7); g.fill(); g.fillStyle = '#8a4a2a'; g.fillRect(8, 30, 18, 6); g.fillStyle = '#f4f4f4'; g.fillRect(22, 28, 2, 6); },
  bride: (g, w, h) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h); g.fillStyle = '#c84a1a'; g.fillRect(8, 18, 22, 30); g.fillStyle = '#d8a030'; g.fillRect(32, 16, 22, 32); g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(20, 12, 5, 0, 7); g.arc(42, 10, 5, 0, 7); g.fill(); },
  drinker: (g, w, h) => { g.fillStyle = '#6a6050'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.fillRect(18, 22, 28, 26); g.fillStyle = '#e8b890'; g.beginPath(); g.arc(32, 16, 8, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.fillRect(22, 6, 20, 4); g.fillStyle = '#d8d8c0'; g.fillRect(46, 16, 6, 12); },
  family: (g, w, h) => { g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, w, h); for (const [x, c] of [[8, '#a03020'], [20, '#304a80'], [32, '#e0c060'], [44, '#406030'], [54, '#a03020']]) { g.fillStyle = c; g.fillRect(x - 4, 24, 9, 22); g.fillStyle = '#e8c0a0'; g.beginPath(); g.arc(x, 19, 4, 0, 7); g.fill(); } },
};

Object.assign(registry.objectModels, {
  q_door: ({ color = '#5a3a1e', trim = '#3a2a18' } = {}) => G(bx(1, 2.6, 0.9, '#6a6058', 0, 0, 0), bx(1.04, 2.3, 0.2, color, 0, 0, 0.36), bx(1.04, 2.3, 0.2, color, 0, 0, -0.36), bx(0.12, 0.12, 0.12, '#d8b040', 0.32, 1.1, 0.48), bx(0.12, 0.12, 0.12, '#d8b040', 0.32, 1.1, -0.48), bx(1.06, 0.12, 0.94, trim, 0, 2.3)),
  q_trapdoor: () => G(bx(1, 0.06, 1, '#6a6a68'), place(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 4, 8).rotateX(Math.PI / 2), mat('#2a2a2a')), 0, 0.08, 0)),
  q_crate: ({ color = '#8a6a40' } = {}) => G(bx(0.9, 0.8, 0.9, color), bx(0.94, 0.08, 0.94, '#5a4022', 0, 0.36), bx(0.08, 0.82, 0.94, '#5a4022', 0.3), bx(0.08, 0.82, 0.94, '#5a4022', -0.3)),
  q_chest: ({ color = '#6a4a2a', trim = '#9a9aa0' } = {}) => G(bx(1, 0.55, 0.6, color), place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mat(color)), 0, 0.55, 0), bx(1.04, 0.08, 0.64, trim, 0, 0.25), bx(0.14, 0.18, 0.06, trim, 0, 0.42, 0.31)),
  q_bookcase: () => { const g = G(bx(1, 2.2, 0.45, '#4a3020')); const cols = ['#8a2a2a', '#2a4a8a', '#2a6a3a', '#8a7a2a', '#5a2a6a']; for (let s = 0; s < 4; s++) for (let i = 0; i < 6; i++) g.add(bx(0.13, 0.36, 0.3, cols[(s * 3 + i) % 5], -0.38 + i * 0.15, 0.12 + s * 0.52, 0.1)); return g; },
  q_desk: ({ color = '#6a4428' } = {}) => G(bx(1, 0.08, 0.6, color, 0, 0.72), bx(0.35, 0.72, 0.56, color, -0.3), bx(0.35, 0.72, 0.56, color, 0.3), bx(0.22, 0.02, 0.3, '#f2eee0', 0.1, 0.8), cyl(0.03, 0.03, 0.14, '#2a8a3a', -0.2, 0.8, 0.1, 5)),
  q_fireplace: () => G(bx(1.1, 1.2, 0.5, '#e8e4dc'), bx(0.7, 0.7, 0.3, '#1a1410', 0, 0, 0.12), bx(1.3, 0.12, 0.6, '#d0ccc0', 0, 1.2), ball(0.12, '#ff7a20', 0, 0.12, 0.15, 4), ball(0.08, '#ffc040', 0.12, 0.1, 0.18, 4)),
  q_lectern: () => G(cyl(0.08, 0.12, 1.0, '#5a3a20'), place(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.45).rotateX(0.4), mat('#6a4428')), 0, 1.05, 0), place(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.36).rotateX(0.4), mat('#f2eee0')), 0, 1.1, 0.01)),
  q_noticeboard: () => { const g = G(bx(0.1, 2, 0.1, '#5a3a20', -0.6), bx(0.1, 2, 0.1, '#5a3a20', 0.6), bx(1.4, 1, 0.08, '#a87a48', 0, 0.9)); for (const [x, y, c] of [[-0.35, 1.5, '#f4f0d0'], [0.05, 1.3, '#f8d0d8'], [0.4, 1.55, '#d0e8f8'], [-0.2, 1.05, '#f4f0d0'], [0.3, 1.0, '#f4f0a0']]) g.add(bx(0.32, 0.3, 0.02, c, x, y - 0.15, 0.05)); return g; },
  q_banner: ({ color = '#a01c24' } = {}) => G(bx(0.08, 3.2, 0.08, '#5a4a2a', 0), bx(0.9, 0.06, 0.06, '#d8b040', 0, 3.0), bx(0.8, 1.8, 0.04, color, 0, 1.2, 0.05), cone(0.12, 0.25, '#d8b040', 0, 1.0, 0.07, 4), bx(0.3, 0.3, 0.02, '#e0b530', 0, 2.1, 0.08)),
  q_pillar: () => G(bx(0.9, 0.3, 0.9, '#d8d2c4'), cyl(0.32, 0.36, 4.2, '#ece8de', 0, 0.3, 0, 10), bx(0.9, 0.35, 0.9, '#d8d2c4', 0, 4.5)),
  q_candles: () => { const g = G(cyl(0.05, 0.2, 1.5, '#b8902a', 0, 0, 0, 6), bx(0.8, 0.05, 0.08, '#b8902a', 0, 1.45)); for (const x of [-0.35, 0, 0.35]) { g.add(cyl(0.04, 0.04, 0.3, '#f4f0e0', x, 1.5, 0, 5)); g.add(glow('#ffd060', x, 1.88, 0, 0.06, 0.1, 0.06)); } return g; },
  q_barrels: () => G(cyl(0.3, 0.3, 0.8, '#7a5a34', -0.25, 0, 0), cyl(0.3, 0.3, 0.8, '#6a4a2a', 0.3, 0, 0.1), cyl(0.31, 0.31, 0.05, '#3a3a3a', -0.25, 0.6, 0), cyl(0.31, 0.31, 0.05, '#3a3a3a', 0.3, 0.6, 0.1)),

  // trees and nature
  q_tree: ({ crown = '#4f8a34', big } = {}) => { const k = big ? 1.8 : 1; return G(cyl(0.18 * k, 0.26 * k, 2.2 * k, '#5a3e22', 0, 0, 0, 6), ball(1.1 * k, crown, 0, 2.6 * k, 0, 6), ball(0.8 * k, crown, 0.6 * k, 2.2 * k, 0.3 * k, 5), ball(0.7 * k, crown, -0.6 * k, 2.4 * k, -0.2 * k, 5), ...(big ? [ball(0.15, '#8ad8ff', 0.4, 1.0, 0.4, 4), ball(0.12, '#8ad8ff', -0.5, 1.6, 0.3, 4)] : [])); },
  q_stump: () => G(cyl(0.25, 0.3, 0.35, '#5a3e22', 0, 0, 0, 6), cyl(0.24, 0.24, 0.02, '#c8a070', 0, 0.35, 0, 6)),
  q_fishspot: () => { const g = new THREE.Group(); for (const [x, z, r] of [[0, 0, 0.35], [0.3, 0.2, 0.2], [-0.25, -0.15, 0.25]]) g.add(place(new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 3, 10).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.8 })), x, 0.05, z)); g.add(ball(0.05, '#e8f4ff', 0.1, 0.1, 0.05, 4)); return g; },
  q_stove: () => G(bx(0.9, 0.7, 0.6, '#9a9aa0'), bx(0.08, 0.7, 0.08, '#3a3a40', -0.4, 0, 0.25), bx(0.6, 0.06, 0.4, '#2a2a2a', 0, 0.7), cyl(0.18, 0.15, 0.1, '#1a1a1a', 0, 0.76, 0, 8), ball(0.06, '#ff8a2a', 0, 0.74, 0, 4)),
  q_glowcap: () => { const g = new THREE.Group(); for (const [x, z, s] of [[0, 0, 1], [0.3, 0.2, 0.7], [-0.25, 0.15, 0.8], [0.1, -0.3, 0.6]]) { g.add(cyl(0.04 * s, 0.05 * s, 0.25 * s, '#e8f0f0', x, 0, z, 5)); g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#6ad0ff', emissive: '#2a6aa0', flatShading: true })), x, 0.25 * s, z)); } return g; },
  q_fairyring: () => { const g = new THREE.Group(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(cyl(0.05, 0.06, 0.18, '#f0ece0', Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3, 5)); g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), mat(i % 2 ? '#c83a2a' : '#e8e0d0')), Math.cos(a) * 1.3, 0.18, Math.sin(a) * 1.3)); } g.add(place(new THREE.Mesh(new THREE.CircleGeometry(1.2, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#8affc0', transparent: true, opacity: 0.25 })), 0, 0.03, 0)); return g; },

  // palace
  q_throne: () => G(bx(1, 0.5, 0.9, '#b8902a'), bx(1, 1.6, 0.2, '#b8902a', 0, 0.5, -0.35), bx(0.8, 0.12, 0.7, '#9a1a2a', 0, 0.5, 0.05), bx(0.7, 1.2, 0.05, '#9a1a2a', 0, 0.7, -0.24), cone(0.12, 0.3, '#e0b530', 0, 2.1, -0.35, 4), bx(0.12, 0.4, 0.8, '#b8902a', -0.5, 0.5), bx(0.12, 0.4, 0.8, '#b8902a', 0.5, 0.5)),
  q_atlas: () => G(bx(1.6, 0.8, 1.6, '#8a8a80'), cyl(0.25, 0.3, 1.2, '#4a6a5a', 0, 0.8, 0, 6), ball(0.3, '#4a6a5a', 0, 2.3, 0, 6), bx(1.2, 0.25, 0.3, '#4a6a5a', 0, 1.9), ball(0.2, '#4a6a5a', 0, 2.75, 0.1, 5), ball(0.9, '#5a8a6a', 0, 3.6, -0.1, 8), bx(0.2, 0.2, 0.2, '#e0c040', 0.5, 0.85, 0.65)),
  q_bench: () => G(bx(2.4, 0.9, 0.5, '#e4dcc8'), bx(2.6, 0.12, 0.7, '#cfc6b0', 0, 0.9), bx(0.5, 1.6, 0.4, '#d8d0bc', -0.9, 0, -0.1), bx(0.5, 1.6, 0.4, '#d8d0bc', 0.9, 0, -0.1)),

  // museum
  q_painting: ({ scene = 'milk' } = {}) => {
    const g = G(bx(1.6, 1.4, 0.12, '#b8902a', 0, 0.6), bx(0.06, 0.6, 0.06, '#5a4a3a', -0.5), bx(0.06, 0.6, 0.06, '#5a4a3a', 0.5));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.16), new THREE.MeshLambertMaterial({ map: canvasTex(scene, SCENES[scene]) }));
    g.add(place(pic, 0, 1.3, 0.07)); g.add(bx(0.4, 0.12, 0.02, '#e8e0c8', 0, 0.36, 0.07)); return g;
  },
  q_bigframe: () => { const g = G(bx(5, 3, 0.15, '#b8902a', 0, 0.3), bx(4.6, 2.6, 0.04, '#141210', 0, 0.5, 0.08)); for (const [x, y] of [[-1.6, 1.2], [-0.8, 2.0], [0.4, 1.4], [1.5, 2.1]]) g.add(bx(0.3, 0.4, 0.02, '#3a3020', x, y, 0.11)); return g; },
  q_vitrine: () => G(bx(0.9, 0.8, 0.7, '#2a2a30'), place(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.6, 0.66), new THREE.MeshLambertMaterial({ color: '#cfe8f8', transparent: true, opacity: 0.35 })), 0, 1.1, 0), bx(0.3, 0.12, 0.2, '#d8b040', 0, 0.8), bx(0.9, 0.04, 0.7, '#4a4a50', 0, 1.4)),
  q_panel: () => G(bx(0.12, 1.2, 0.12, '#4a4a50'), bx(0.5, 0.6, 0.12, '#2a2a30', 0, 1.0), ...[-0.15, -0.05, 0.05, 0.15].map(x => bx(0.07, 0.07, 0.04, '#d84a2a', x, 1.3, 0.07)), glow('#40ff60', 0, 1.48, 0.07, 0.3, 0.06, 0.02)),
  q_laser: () => { const g = G(bx(0.12, 2.2, 0.3, '#3a3a40', -0.5), bx(0.12, 2.2, 0.3, '#3a3a40', 0.5)); for (const y of [0.3, 0.7, 1.1, 1.5, 1.9]) g.add(glow('#ff2020', 0, y, 0, 1, 0.03, 0.03)); g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.03).rotateZ(0.6), new THREE.MeshBasicMaterial({ color: '#ff2020' })), 0, 1.1, 0)); return g; },
  q_shipmodel: () => G(bx(1, 0.8, 0.5, '#3a2a20'), bx(0.9, 0.25, 0.3, '#6a3a1a', 0, 0.8), cyl(0.02, 0.02, 1.0, '#4a3020', 0, 1.05, 0, 4), cyl(0.02, 0.02, 0.8, '#4a3020', 0.3, 1.05, 0, 4), bx(0.5, 0.35, 0.02, '#f0e8d8', 0, 1.4), bx(0.35, 0.3, 0.02, '#f0e8d8', 0.3, 1.3)),
  q_dollhouse: () => G(bx(1, 0.6, 0.5, '#3a2a1a'), bx(1, 1.4, 0.45, '#6a3a2a', 0, 0.6), ...[0, 1, 2].flatMap(r => [-0.3, 0, 0.3].map(x => bx(0.25, 0.35, 0.02, ['#d8c8a0', '#a0b8c8', '#c8a8a0'][r], x, 0.68 + r * 0.45, 0.23)))),

  // church
  q_clockwork: () => { const g = G(bx(1, 1.6, 0.6, '#3a3a3a')); for (const [x, y, r] of [[-0.2, 1.0, 0.3], [0.22, 0.7, 0.22], [0.1, 1.35, 0.15]]) g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 10).rotateX(Math.PI / 2), mat('#b8902a')), x, y, 0.33)); g.add(bx(0.2, 0.15, 0.1, '#e8e0d0', 0.3, 1.1, 0.35)); return g; },
  q_bell: ({ s = 1 } = {}) => G(bx(1.2 * s, 0.12, 0.12, '#4a3020', 0, 2.2 * s), bx(0.1, 2.3 * s, 0.1, '#4a3020', -0.55 * s), bx(0.1, 2.3 * s, 0.1, '#4a3020', 0.55 * s), place(new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.45 * s, 0.75 * s, 10, 1, true), mat('#b8862a', { side: THREE.DoubleSide })), 0, 1.6 * s, 0), ball(0.16 * s, '#b8862a', 0, 1.98 * s, 0, 6), ball(0.08 * s, '#5a4a2a', 0, 1.25 * s, 0, 4)),
  q_crownlantern: () => { const g = G(cyl(0.6, 0.7, 0.4, '#2a4a8a', 0, 0, 0, 8)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(bx(0.12, 0.9, 0.12, '#e0b530', Math.cos(a) * 0.6, 0.4, Math.sin(a) * 0.6)); } g.add(ball(0.5, '#2a4a8a', 0, 1.4, 0, 8)); g.add(cyl(0.05, 0.05, 0.5, '#e0b530', 0, 1.8, 0, 4)); g.add(bx(0.4, 0.08, 0.08, '#e0b530', 0, 2.15)); g.add(ball(0.1, '#d82020', 0.3, 0.6, 0.45, 4)); g.add(ball(0.1, '#e8e8f0', -0.3, 0.6, 0.45, 4)); return g; },
  q_tomb: () => G(bx(0.95, 0.06, 1.0, '#8a8478'), bx(0.6, 0.02, 0.1, '#5a5448', 0, 0.06, -0.2), bx(0.4, 0.02, 0.08, '#5a5448', 0, 0.06, 0.05)),
  q_altar: () => G(bx(1.4, 0.9, 0.7, '#e8e0d0'), bx(1.5, 0.08, 0.8, '#c8b890', 0, 0.9), cyl(0.04, 0.06, 0.4, '#d8b040', -0.45, 0.98, 0, 5), cyl(0.04, 0.06, 0.4, '#d8b040', 0.45, 0.98, 0, 5), glow('#ffd060', -0.45, 1.44, 0, 0.05, 0.08, 0.05), glow('#ffd060', 0.45, 1.44, 0, 0.05, 0.08, 0.05), bx(0.3, 0.06, 0.22, '#5a2a1a', 0, 0.98)),
  q_organ: () => { const g = G(bx(3, 1.2, 0.8, '#5a3a20')); for (let i = 0; i < 9; i++) g.add(cyl(0.08, 0.08, 1.2 + Math.abs(i - 4) * -0.15 + 1, '#c8c8d0', -1.2 + i * 0.3, 1.2, 0, 6)); g.add(bx(1.2, 2.0, 0.06, '#2a5a8a', -2.0, 1.0)); g.add(bx(1.2, 2.0, 0.06, '#2a5a8a', 2.0, 1.0)); return g; },
  q_plaque: () => G(bx(0.8, 0.5, 0.06, '#3a3a3a', 0, 1.2), bx(0.66, 0.36, 0.02, '#d8c8a0', 0, 1.27, 0.03)),

  // NEMO
  q_dynamo: () => { const g = G(bx(0.2, 0.5, 0.8, '#4a4a50'), place(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 4, 12).rotateY(Math.PI / 2), mat('#1a1a1a')), 0, 0.6, 0.45), place(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 4, 12).rotateY(Math.PI / 2), mat('#1a1a1a')), 0, 0.6, -0.45), bx(0.06, 0.06, 0.9, '#2a8a6a', 0, 0.85), bx(0.25, 0.06, 0.15, '#1a1a1a', 0, 1.05, -0.3), bx(0.05, 0.3, 0.05, '#2a8a6a', 0, 0.8, 0.35), bx(0.3, 0.05, 0.05, '#1a1a1a', 0, 1.1, 0.4)); g.add(bx(0.4, 0.3, 0.3, '#e8c020', 0.5, 0)); return g; },
  q_lasercutter: () => G(bx(1, 0.9, 0.8, '#d8d8e0'), bx(0.9, 0.3, 0.7, '#2a2a30', 0, 0.9), place(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.6), new THREE.MeshLambertMaterial({ color: '#ff8a20', transparent: true, opacity: 0.5 })), 0, 1.33, 0), glow('#ff2020', 0, 1.0, 0, 0.02, 0.2, 0.02)),
  q_gearbox: () => { const g = G(bx(1, 1.0, 0.4, '#3a6a8a')); for (const [x, y, r, c] of [[-0.28, 1.2, 0.22, '#e8c020'], [0.08, 1.35, 0.15, '#d84a2a'], [0.3, 1.15, 0.12, '#40a060']]) g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 8).rotateX(Math.PI / 2), mat(c)), x, y, 0.1)); return g; },
  q_workbench: () => G(bx(1.9, 0.1, 0.8, '#a8784a', 0, 0.8), bx(0.1, 0.8, 0.7, '#7a5634', -0.85), bx(0.1, 0.8, 0.7, '#7a5634', 0.85), bx(0.3, 0.2, 0.2, '#d84a2a', -0.5, 0.9), cyl(0.06, 0.05, 0.12, '#f4f4f4', 0.4, 0.9, 0.1, 6), bx(0.4, 0.04, 0.3, '#3a6aaa', 0.1, 0.9), bx(0.1, 0.1, 0.4, '#5a5a60', 0.7, 0.9)),
  q_chainmachine: () => { const g = G(bx(3, 0.8, 0.8, '#e8e8e0')); for (let i = 0; i < 8; i++) g.add(bx(0.05, 0.25, 0.14, ['#d84a2a', '#e8c020', '#2a6ad8'][i % 3], -1.3 + i * 0.12, 0.8, 0)); g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.2).rotateZ(-0.3), mat('#8a6a4a')), 0.1, 1.1, 0)); g.add(ball(0.08, '#40a060', -0.3, 1.33, 0, 6)); g.add(cyl(0.05, 0.08, 0.6, '#c8c8c8', 0.9, 0.8, 0, 5)); for (let i = 0; i < 4; i++) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.06).rotateZ(i * Math.PI / 4), mat('#f4f4f4')), 0.9, 1.4, 0.06)); g.add(ball(0.12, '#f8d820', 1.3, 0.92, 0, 5)); return g; },

  // ship
  q_mast: () => G(cyl(0.18, 0.22, 7, '#6a4a2a', 0, 0, 0, 8), bx(3.2, 0.12, 0.12, '#6a4a2a', 0, 4.5), bx(2.6, 0.12, 0.12, '#6a4a2a', 0, 6.3), bx(2.8, 0.35, 0.35, '#e8e0c8', 0, 4.3), bx(0.6, 0.3, 0.6, '#5a3a20', 0, 5.2)),
  q_leak: () => G(bx(0.3, 0.3, 0.06, '#3a2a18', 0, 0.3), ...[0, 1, 2].map(i => glow('#80c0ff', 0.1 * i - 0.1, 0.25 + i * 0.05, 0.12 + i * 0.12, 0.08, 0.06, 0.2, 0.7)), place(new THREE.Mesh(new THREE.CircleGeometry(0.45, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#4a8ad8', transparent: true, opacity: 0.6 })), 0, 0.02, 0.3)),
  q_wheel: () => { const g = G(bx(0.2, 1.0, 0.2, '#5a3a20')); const w = new THREE.Group(); w.add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 4, 12), mat('#7a5634'))); for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.05), mat('#7a5634')); sp.rotation.z = i * Math.PI / 8; w.add(sp); } w.position.set(0, 1.2, 0.15); g.add(w); return g; },
  q_dragnet: () => G(bx(0.1, 1.5, 0.1, '#5a3a20', -0.4), bx(0.1, 1.5, 0.1, '#5a3a20', 0.4), bx(1, 0.1, 0.1, '#5a3a20', 0, 1.4), place(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.04), new THREE.MeshLambertMaterial({ color: '#c8b88a', wireframe: true })), 0, 0.9, 0), ball(0.12, '#e8c8a0', 0, 0.3, 0.1, 4)),
  q_gangplank: () => G(place(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 2.4).rotateX(-0.35), mat('#8a6a40')), 0, 0.42, 0), bx(0.05, 0.9, 0.05, '#5a3a20', -0.45, 0, 0.9), bx(0.05, 0.9, 0.05, '#5a3a20', 0.45, 0, 0.9), bx(0.05, 1.3, 0.05, '#5a3a20', -0.45, 0, -0.9), bx(0.05, 1.3, 0.05, '#5a3a20', 0.45, 0, -0.9)),
  q_cannon: () => G(bx(0.7, 0.35, 0.9, '#5a3a20'), place(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.3, 8).rotateX(Math.PI / 2), mat('#2a2a2e')), 0, 0.55, 0.3), bx(0.08, 0.3, 0.3, '#3a2a18', -0.38, 0, 0.25), bx(0.08, 0.3, 0.3, '#3a2a18', 0.38, 0, 0.25)),

  // Zuidoost
  q_lookout: () => G(bx(0.12, 3, 0.12, '#6a4a2a', -0.6, 0, -0.6), bx(0.12, 3, 0.12, '#6a4a2a', 0.6, 0, -0.6), bx(0.12, 3, 0.12, '#6a4a2a', -0.6, 0, 0.6), bx(0.12, 3, 0.12, '#6a4a2a', 0.6, 0, 0.6), bx(1.6, 0.12, 1.6, '#7a5634', 0, 3), cone(1.2, 0.8, '#5a3a20', 0, 3.6, 0, 4), bx(0.6, 0.05, 0.6, '#1a1a1a', 0.4, 0.02, 0.9)),
  q_drumstone: () => G(cyl(0.6, 0.7, 0.8, '#7a6a5a', 0, 0, 0, 9), cyl(0.58, 0.58, 0.05, '#c8a070', 0, 0.8, 0, 9), bx(0.3, 0.3, 0.3, '#5a4a3a', 0.6, 0, 0.5), ball(0.12, '#ff6a2a', 0, 0.9, 0, 4)),

  q_bike: () => { const g = new THREE.Group(); for (const z of [-0.45, 0.45]) g.add(place(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 4, 12).rotateY(Math.PI / 2), mat('#1a1a1a')), 0, 0.34, z)); g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9).rotateX(0.3), mat('#d86a9a')), 0, 0.55, 0)); g.add(bx(0.05, 0.5, 0.05, '#d86a9a', 0, 0.3, -0.15)); g.add(bx(0.2, 0.05, 0.25, '#2a2a2a', 0, 0.8, -0.15)); g.add(bx(0.5, 0.05, 0.05, '#4a4a4a', 0, 0.95, 0.45)); g.add(bx(0.35, 0.2, 0.3, '#a07a4a', 0, 0.85, 0.6)); return g; },
});
