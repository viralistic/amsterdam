// Built-in object models: fallback box, ladders, stairs, doors, signs and bank booths.
import * as THREE from 'three';
import { registry } from './registry.js';

const mat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
const box = (w, h, d, color, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y + h / 2, z); return m; };

Object.assign(registry.objectModels, {
  box: ({ color = '#8a7a5a', w = 0.8, h = 0.8 } = {}) => { const g = new THREE.Group(); g.add(box(w, h, w, color)); return g; },
  ladder: ({ down } = {}) => {
    const g = new THREE.Group();
    if (down) {
      g.add(box(1.2, 0.05, 1.2, '#1a140e'));
      for (const x of [-0.35, 0.35]) g.add(box(0.08, 0.6, 0.08, '#7a5a34', x, 0, 0.45));
      for (let y = 0.15; y < 0.6; y += 0.2) g.add(box(0.7, 0.05, 0.05, '#7a5a34', 0, y, 0.45));
    } else {
      for (const x of [-0.3, 0.3]) g.add(box(0.08, 3, 0.08, '#7a5a34', x, 0, 0));
      for (let y = 0.3; y < 3; y += 0.35) g.add(box(0.6, 0.05, 0.05, '#8a6a40', 0, y, 0));
      g.rotation.x = -0.15;
    }
    return g;
  },
  stairs: ({ down } = {}) => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) g.add(box(2, down ? 0.05 : 0.25 * (i + 1), 0.33, down ? '#2a2420' : '#8a8478', 0, down ? -0.02 : 0, -1 + i * 0.33));
    if (down) g.add(box(2.1, 0.02, 2.1, '#0e0b08'));
    return g;
  },
  door: ({ color = '#5a3a1e' } = {}) => {
    const g = new THREE.Group();
    g.add(box(1.2, 2.2, 0.15, color));
    g.add(box(0.1, 0.1, 0.1, '#d8b040', 0.4, 1.1, 0.1));
    for (const x of [-0.7, 0.7]) g.add(box(0.2, 2.5, 0.25, '#6a6058', x));
    g.add(box(1.6, 0.25, 0.25, '#6a6058', 0, 2.3));
    return g;
  },
  sign: () => {
    const g = new THREE.Group();
    g.add(box(0.1, 1.6, 0.1, '#6a4a2a'));
    g.add(box(0.9, 0.45, 0.06, '#9a7a4a', 0, 1.2));
    return g;
  },
  booth: () => {
    const g = new THREE.Group();
    g.add(box(1, 1.1, 0.8, '#6a4a2a'));
    g.add(box(1, 0.08, 0.9, '#8a6a40', 0, 1.1));
    g.add(box(1, 0.9, 0.08, '#c9a227', 0, 1.2, -0.35));
    return g;
  },
});
