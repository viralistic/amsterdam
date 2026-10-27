// Shared low-poly builder for hand-made landmarks. Each landmark lives in its own file in this folder and exports
// default (b, THREE, group, landmark) => void: add triangles to Builder b (local metres, +z = front, y up)
// and/or extra meshes to group. See docs/LANDMARKS.md.
import * as THREE from 'three';

export const SANDSTONE = '#cbbd96', STONE = '#d9d3c5', BRICK = '#7a3f2b', OLDBRICK = '#86654a', SLATE = '#454c52', COPPER = '#5c8f74', LEAD = '#5d6264', GOLD = '#e0b530';

// Collects flat-shaded triangles with vertex colours and facade uvs (4 m x 3.2 m per window bay).
export class Builder {
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
  // flat disc facing +z (for targets)
  disc(cx, cy, z, r, n, color) {
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      this.tri([cx, cy, z], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z], color);
    }
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

