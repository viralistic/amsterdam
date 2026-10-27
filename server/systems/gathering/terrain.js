// Places gathering objects on sensible tiles using the same map chunks the client draws:
// trees and rocks on open land (preferring parks), fishing spots on water next to a quay, willows on river banks.
// Map chunks come from server/mapdata.js (read only). If a chunk can't be loaded in time, the raw coordinate is used.
import { getChunk } from '../../mapdata.js';
import { CHUNK } from '../../../shared/geo.js';

const LAND = 0, WATER = 1, BUILDING = 2, GREEN = 4;
const grids = new Map(); // "cx,cz" -> Uint8Array(CHUNK*CHUNK) of flags
const loaded = new Map(); // "cx,cz" -> Promise<boolean>
const ready = new Set(); // chunks whose own data has been rasterized

const gridOf = (cx, cz, create) => {
  const k = cx + ',' + cz;
  let g = grids.get(k);
  if (!g && create) { g = new Uint8Array(CHUNK * CHUNK); grids.set(k, g); }
  return g;
};

// scanline fill of one polygon (array of flat rings, even-odd rule) in world coordinates, limited to a box
function fill(rings, ox, oz, flag, bx0, bz0, bx1, bz1, clear = false) {
  let zmin = Infinity, zmax = -Infinity;
  for (const r of rings) for (let i = 1; i < r.length; i += 2) { zmin = Math.min(zmin, r[i] + oz); zmax = Math.max(zmax, r[i] + oz); }
  const z0 = Math.max(bz0, Math.floor(zmin)), z1 = Math.min(bz1 - 1, Math.ceil(zmax));
  for (let z = z0; z <= z1; z++) {
    const yc = z + 0.5, xs = [];
    for (const r of rings) {
      const n = r.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = r[i * 2] + ox, az = r[i * 2 + 1] + oz, bx = r[j * 2] + ox, bz = r[j * 2 + 1] + oz;
        if ((az <= yc) !== (bz <= yc)) xs.push(ax + (yc - az) / (bz - az) * (bx - ax));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.max(bx0, Math.round(xs[i])), xb = Math.min(bx1 - 1, Math.round(xs[i + 1]) - 1);
      for (let x = xa; x <= xb; x++) {
        const g = gridOf(Math.floor(x / CHUNK), Math.floor(z / CHUNK), true);
        const idx = (z - Math.floor(z / CHUNK) * CHUNK) * CHUNK + (x - Math.floor(x / CHUNK) * CHUNK);
        if (clear) g[idx] &= ~flag; else g[idx] |= flag;
      }
    }
  }
}

function rasterize(d) {
  const ox = d.cx * CHUNK, oz = d.cz * CHUNK;
  const [x0, z0, x1, z1] = [ox, oz, ox + CHUNK, oz + CHUNK];
  for (const rings of d.g || []) fill(rings, ox, oz, GREEN, x0, z0, x1, z1);
  for (const rings of d.w || []) fill(rings, ox, oz, WATER, x0, z0, x1, z1);
  for (const rings of d.ba || []) fill(rings, ox, oz, WATER, x0, z0, x1, z1, true);
  for (const [, , ring] of d.b || []) fill([ring], ox, oz, BUILDING, x0 - 64, z0 - 64, x1 + 64, z1 + 64);
}

function loadChunk(cx, cz) {
  const k = cx + ',' + cz;
  if (!loaded.has(k)) {
    loaded.set(k, getChunk(cx, cz).then(d => { if (d?.ok) { gridOf(cx, cz, true); rasterize(d); ready.add(k); return true; } return false; }).catch(() => false));
  }
  return loaded.get(k);
}

// Loads every chunk around the given tiles (with a timeout so a slow map server never blocks spawning).
export async function prepare(points, radius = 40, timeoutMs = 45_000) {
  const keys = new Set();
  for (const p of points) for (const dx of [-radius, 0, radius]) for (const dz of [-radius, 0, radius]) keys.add(Math.floor((p.x + dx) / CHUNK) + ',' + Math.floor((p.z + dz) / CHUNK));
  const all = Promise.all([...keys].map(k => { const [cx, cz] = k.split(',').map(Number); return loadChunk(cx, cz); }));
  await Promise.race([all, new Promise(r => setTimeout(r, timeoutMs))]);
}

export function cell(x, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const k = cx + ',' + cz;
  const g = grids.get(k);
  if (!g || !ready.has(k)) return -1; // unknown
  return g[(z - cz * CHUNK) * CHUNK + (x - cx * CHUNK)];
}

const isWater = c => c >= 0 && (c & WATER) && !(c & BUILDING);
const isLand = c => c >= 0 && !(c & WATER) && !(c & BUILDING);
function near(x, z, r, pred) {
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (pred(cell(x + dx, z + dz))) return true;
  return false;
}

// Tiles already taken by a gathering object (shared by all areas so nothing overlaps).
export const used = new Set();
const key = (x, z) => x + ',' + z;
function free(x, z, spacing) {
  for (let dz = -spacing; dz <= spacing; dz++) for (let dx = -spacing; dx <= spacing; dx++) if (used.has(key(x + dx, z + dz))) return false;
  return true;
}

// mode: 'land' (open ground, parks preferred when green), 'shore' (land within 3 m of water), 'water' (water within 2 m of land)
export function snap(p, { mode = 'land', radius = 12, spacing = 1, green = false, reserve = true } = {}) {
  const x0 = Math.round(p.x), z0 = Math.round(p.z);
  if (cell(x0, z0) < 0) { if (reserve) used.add(key(x0, z0)); return { x: x0, z: z0, raw: true }; }
  let best = null, bestScore = Infinity;
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    const d = Math.hypot(dx, dz);
    if (d > radius || d >= bestScore) continue;
    const x = x0 + dx, z = z0 + dz, c = cell(x, z);
    let ok;
    if (mode === 'water') ok = isWater(c) && near(x, z, 2, isLand);
    else if (mode === 'shore') ok = isLand(c) && near(x, z, 3, isWater) && near(x, z, 1, isLand);
    else ok = isLand(c) && !near(x, z, 1, cc => cc >= 0 && (cc & BUILDING));
    if (!ok || !free(x, z, spacing)) continue;
    const score = d + (green && !(c & GREEN) ? 6 : 0);
    if (score < bestScore) { bestScore = score; best = { x, z }; }
  }
  if (!best) return null;
  if (reserve) used.add(key(best.x, best.z));
  return best;
}
