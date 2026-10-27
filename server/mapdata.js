// Fetches OpenStreetMap data for 256x256 m chunks via Overpass, converts it to compact local-metre geometry and caches it.
import fs from 'node:fs';
import path from 'node:path';
import { CHUNK, toTile, toLatLon } from '../shared/geo.js';
import { DATA_DIR } from './db.js';
import { insideLandmark } from '../shared/landmarks.js';

// v2: street furniture (sf: benches, lamps, bike racks, bins, bollards)
const VERSION = 2;
const CACHE_DIR = path.join(DATA_DIR, 'chunks');
const FAKE = process.env.FAKE_MAP === '1';
const MIRRORS = (process.env.OVERPASS_URLS || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter').split(',');

const mem = new Map(); // key -> chunk data
const inflight = new Map(); // key -> promise
let active = 0;
const waiting = [];

fs.mkdirSync(CACHE_DIR, { recursive: true });

export async function getChunk(cx, cz) {
  const key = `${cx}_${cz}`;
  if (mem.has(key)) return mem.get(key);
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const file = path.join(CACHE_DIR, `v${VERSION}_${key}.json`);
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    if (!data) {
      data = FAKE ? fakeChunk(cx, cz) : convert(cx, cz, await throttled(() => overpass(cx, cz)));
      if (!FAKE) fs.writeFileSync(file, JSON.stringify(data));
    }
    mem.set(key, data);
    return data;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function throttled(fn) {
  if (active >= 2) await new Promise(r => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
}

function bbox(cx, cz) {
  const nw = toLatLon(cx * CHUNK, cz * CHUNK);
  const se = toLatLon((cx + 1) * CHUNK, (cz + 1) * CHUNK);
  return `${se.lat.toFixed(6)},${nw.lon.toFixed(6)},${nw.lat.toFixed(6)},${se.lon.toFixed(6)}`;
}

async function overpass(cx, cz) {
  const bb = bbox(cx, cz);
  const q = `[out:json][timeout:60];(
way["building"](${bb});
way["natural"="water"](${bb});relation["natural"="water"](${bb});
way["waterway"="riverbank"](${bb});way["landuse"~"^(basin|reservoir|harbour)$"](${bb});
way["leisure"~"^(park|garden|playground|pitch)$"](${bb});relation["leisure"="park"](${bb});
way["landuse"~"^(grass|meadow|forest|village_green|recreation_ground|cemetery|allotments)$"](${bb});
way["natural"~"^(wood|scrub|grassland)$"](${bb});
way["highway"](${bb});way["area:highway"](${bb});way["place"="square"](${bb});way["amenity"="parking"](${bb});
way["man_made"~"^(bridge|pier)$"](${bb});way["railway"~"^(rail|tram|light_rail|platform)$"](${bb});
node["natural"="tree"](${bb});
${FURNITURE_QUERY(bb)}
);out geom;`;
  let lastErr;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AmsEscape/0.1' }, signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const r1 = v => Math.round(v * 10) / 10;

export function convert(cx, cz, osm) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const flat = geom => {
    const out = [];
    for (const g of geom) { const t = toTile(g.lat, g.lon); out.push(r1(t.x - x0), r1(t.z - z0)); }
    return out;
  };
  const out = { cx, cz, ok: true, b: [], w: [], g: [], p: [], ba: [], r: [], rl: [], t: [], sf: emptyFurniture() };
  const furn = [];
  for (const el of osm.elements || []) {
    const tg = el.tags || {};
    if (el.type === 'node') {
      if (tg.natural === 'tree') { const t = toTile(el.lat, el.lon); out.t.push(r1(t.x - x0), r1(t.z - z0)); }
      const kind = furnitureKind(tg);
      if (kind) { const t = toTile(el.lat, el.lon); furn.push({ kind, x: t.x - x0, z: t.z - z0, tg }); }
      continue;
    }
    if (el.type === 'way' && tg.amenity === 'bicycle_parking' && el.geometry?.length > 1) {
      // bicycle parking areas: one rack along the longest edge
      const g = el.geometry.map(p => { const t = toTile(p.lat, p.lon); return [t.x - x0, t.z - z0]; });
      let best = null;
      for (let i = 0; i < g.length - 1; i++) { const l = Math.hypot(g[i + 1][0] - g[i][0], g[i + 1][1] - g[i][1]); if (!best || l > best.l) best = { l, i }; }
      const [a, b] = [g[best.i], g[best.i + 1]];
      const cxm = g.reduce((s, p) => s + p[0], 0) / g.length, czm = g.reduce((s, p) => s + p[1], 0) / g.length;
      furn.push({ kind: 'bike', x: cxm, z: czm, tg, along: Math.atan2(b[0] - a[0], b[1] - a[1]), len: best.l });
      if (tg.amenity === 'bicycle_parking' && !tg.building) continue;
    }
    let rings;
    if (el.type === 'relation') {
      rings = assembleRings((el.members || []).filter(m => m.type === 'way' && m.geometry).map(m => m.geometry)).map(flat);
    } else if (el.geometry) {
      const g = el.geometry;
      const closed = g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon;
      if (tg.highway && !(closed && tg.area === 'yes') && !tg['area:highway']) {
        if (tg.tunnel && tg.tunnel !== 'no' && tg.tunnel !== 'building_passage') continue;
        const bridge = tg.bridge && tg.bridge !== 'no' ? 1 : 0;
        const passage = tg.tunnel === 'building_passage' || tg.covered === 'yes' ? 1 : 0;
        out.r.push([tg.highway, bridge, passage, flat(g)]);
        continue;
      }
      if (tg.railway && !closed && tg.railway !== 'platform') {
        if (tg.tunnel && tg.tunnel !== 'no') continue;
        out.rl.push([tg.railway, flat(g)]);
        continue;
      }
      if (!closed) continue;
      rings = [flat(g)];
      if (tg.building && tg.building !== 'no' && tg.building !== 'roof' && !tg['building:part']) {
        const r = rings[0];
        if (r[0] < 0 || r[1] < 0 || r[0] >= CHUNK || r[1] >= CHUNK) continue; // owned by the chunk holding its first node
        out.b.push([buildingHeight(tg), el.id % 997, r]);
        continue;
      }
    } else continue;
    if (!rings.length) continue;
    if (tg.natural === 'water' || tg.waterway === 'riverbank' || ['basin', 'reservoir', 'harbour'].includes(tg.landuse)) out.w.push(rings);
    else if (tg.leisure || ['grass', 'meadow', 'forest', 'village_green', 'recreation_ground', 'cemetery', 'allotments'].includes(tg.landuse) || ['wood', 'scrub', 'grassland'].includes(tg.natural)) out.g.push(rings);
    else if (tg.man_made === 'bridge') out.ba.push(rings);
    else out.p.push(rings);
  }
  placeFurniture(out, furn);
  fillFurniture(out);
  return out;
}

function buildingHeight(tg) {
  const h = parseFloat(tg.height);
  if (h > 0) return Math.min(h, 90);
  const lv = parseFloat(tg['building:levels']);
  if (lv > 0) return Math.min(lv * 3.2 + 2, 90);
  if (tg.building === 'church' || tg.building === 'cathedral') return 24;
  if (tg.building === 'train_station') return 20;
  if (['shed', 'kiosk', 'garage', 'hut'].includes(tg.building)) return 3;
  return 13; // typical canal house
}

// Joins multipolygon member ways into closed rings.
function assembleRings(ways) {
  const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
  const open = ways.filter(w => w.length > 1).map(w => w.slice());
  const rings = [];
  while (open.length) {
    let cur = open.pop();
    for (let guard = 0; !same(cur[0], cur[cur.length - 1]) && guard < 10000; guard++) {
      const end = cur[cur.length - 1];
      const i = open.findIndex(w => same(w[0], end) || same(w[w.length - 1], end));
      if (i < 0) break;
      const w = open.splice(i, 1)[0];
      cur = cur.concat(same(w[0], end) ? w.slice(1) : w.slice(0, -1).reverse());
    }
    if (cur.length >= 4) rings.push(cur);
  }
  return rings;
}

const WALKABLE = new Set(['footway', 'pedestrian', 'living_street', 'residential', 'path', 'cycleway', 'service', 'tertiary', 'unclassified', 'steps']);

// A random street point near (x, z), used to drop treasure where people can actually walk.
export function randomWalkPoint(x, z, minR, maxR) {
  const pts = [];
  const cx0 = Math.floor((x - maxR) / CHUNK), cx1 = Math.floor((x + maxR) / CHUNK);
  const cz0 = Math.floor((z - maxR) / CHUNK), cz1 = Math.floor((z + maxR) / CHUNK);
  for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) {
    const c = mem.get(`${cx}_${cz}`);
    if (!c?.ok) continue;
    for (const [kind, bridge, , co] of c.r) {
      if (bridge || !WALKABLE.has(kind)) continue;
      for (let i = 0; i < co.length; i += 2) {
        const px = Math.round(co[i] + cx * CHUNK), pz = Math.round(co[i + 1] + cz * CHUNK);
        const d = Math.hypot(px - x, pz - z);
        if (d >= minR && d <= maxR) pts.push({ x: px, z: pz });
      }
    }
  }
  return pts.length ? pts[Math.floor(Math.random() * pts.length)] : null;
}

// ---------------------------------------------------------------- street furniture (atmosphere pack)
// Compact output, local chunk metres:
//   sf.be benches [x, z, yaw], sf.la lamps [x, z], sf.bi bike racks [x, z, yaw, bikes], sf.wb waste baskets [x, z], sf.bo bollards [x, z]
// Models face +z; yaw turns that front towards the nearest street.
function FURNITURE_QUERY(bb) {
  return `node["amenity"~"^(bench|bicycle_parking|waste_basket)$"](${bb});way["amenity"="bicycle_parking"](${bb});
node["highway"="street_lamp"](${bb});node["barrier"="bollard"](${bb});node["leisure"="picnic_table"](${bb});`;
}

const emptyFurniture = () => ({ be: [], la: [], bi: [], wb: [], bo: [] });
const CAP = { be: 250, la: 900, bi: 400, wb: 250, bo: 1500 };

function furnitureKind(tg) {
  if (tg.amenity === 'bench' || tg.leisure === 'picnic_table') return 'bench';
  if (tg.highway === 'street_lamp') return 'lamp';
  if (tg.amenity === 'bicycle_parking') return 'bike';
  if (tg.amenity === 'waste_basket') return 'bin';
  if (tg.barrier === 'bollard') return 'bollard';
  return null;
}

const ROAD_HALF = { motorway: 6, trunk: 5.5, primary: 5, secondary: 4.5, tertiary: 3.5, unclassified: 3, residential: 3, living_street: 2.5, service: 2, pedestrian: 2.5, footway: 1.25, path: 1, cycleway: 1.25, steps: 1.25, track: 1.5 };
const inChunk = (x, z) => x >= 0 && z >= 0 && x < CHUNK && z < CHUNK;
const r2 = v => Math.round(v * 100) / 100;

// Nearest point on any street: { d, yaw (facing it), along (street direction) }.
function nearestStreet(out, x, z, maxD = 25) {
  let best = null;
  for (const [kind, , , co] of out.r) {
    for (let i = 0; i < co.length - 2; i += 2) {
      const ax = co[i], az = co[i + 1], bx = co[i + 2], bz = co[i + 3];
      if (Math.min(ax, bx) > x + maxD || Math.max(ax, bx) < x - maxD || Math.min(az, bz) > z + maxD || Math.max(az, bz) < z - maxD) continue;
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
      const px = ax + vx * t, pz = az + vz * t, d = Math.hypot(px - x, pz - z);
      if (!best || d < best.d) best = { d, kind, yaw: Math.atan2(px - x, pz - z), along: Math.atan2(vx, vz) };
    }
  }
  return best;
}

function ringContains(r, x, z) {
  let c = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], zi = r[i + 1], xj = r[j], zj = r[j + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// Spatial lookups for "is this spot in a canal / inside a house / in a park?"
function areaIndex(out) {
  const box = r => { let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity; for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i]); b = Math.max(b, r[i]); c = Math.min(c, r[i + 1]); d = Math.max(d, r[i + 1]); } return [a, b, c, d]; };
  const polys = list => list.map(rings => ({ rings, bb: rings.map(box).reduce((p, q) => [Math.min(p[0], q[0]), Math.max(p[1], q[1]), Math.min(p[2], q[2]), Math.max(p[3], q[3])]) }));
  const water = polys(out.w), green = polys(out.g), houses = polys(out.b.map(b => [b[2]]));
  const hit = (list, x, z, m = 0) => list.some(({ rings, bb }) => x >= bb[0] - m && x <= bb[1] + m && z >= bb[2] - m && z <= bb[3] + m &&
    (m ? [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]] : [[0, 0]]).some(([dx, dz]) => rings.reduce((c, r) => c ^ ringContains(r, x + dx, z + dz), false)));
  return { inWater: (x, z, m) => hit(water, x, z, m), inHouse: (x, z, m) => hit(houses, x, z, m), inPark: (x, z) => hit(green, x, z) };
}

function placeFurniture(out, furn) {
  const sf = out.sf;
  for (const f of furn) {
    if (!inChunk(f.x, f.z)) continue;
    const x = r1(f.x), z = r1(f.z);
    if (f.kind === 'lamp') sf.la.push(x, z);
    else if (f.kind === 'bin') sf.wb.push(x, z);
    else if (f.kind === 'bollard') sf.bo.push(x, z);
    else if (f.kind === 'bench') {
      const dir = parseFloat(f.tg.direction);
      const s = nearestStreet(out, f.x, f.z);
      // OSM direction is the compass bearing the sitter looks at; +z is south in tile space
      const yaw = Number.isFinite(dir) ? Math.atan2(Math.sin(dir * Math.PI / 180), -Math.cos(dir * Math.PI / 180)) : s ? s.yaw : 0;
      sf.be.push(x, z, r2(yaw));
    } else if (f.kind === 'bike') {
      const cap = parseInt(f.tg.capacity, 10);
      const s = nearestStreet(out, f.x, f.z);
      const yaw = f.along !== undefined ? f.along + Math.PI / 2 : s ? s.yaw : 0;
      const n = Math.max(2, Math.min(14, Number.isFinite(cap) ? Math.round(cap * 0.7) : f.len ? Math.round(f.len / 0.7) : 6));
      sf.bi.push(x, z, r2(yaw), n);
    }
  }
}

// Many chunks have few or no furniture nodes in OpenStreetMap: line their streets with lamps, Amsterdammertjes,
// parked bikes, benches and bins so every neighbourhood looks lived in. Deterministic, so caches stay stable.
function fillFurniture(out) {
  const sf = out.sf;
  const need = { la: sf.la.length < 8, bo: sf.bo.length < 2 * 12, bi: sf.bi.length < 4 * 3, be: sf.be.length < 3 * 2, wb: sf.wb.length < 2 * 2 };
  if (!Object.values(need).some(Boolean)) return;
  const idx = areaIndex(out);
  const hsh = (a, b) => { let h = (Math.round(a * 7) * 374761393 + Math.round(b * 13) * 668265263 + out.cx * 9973 + out.cz * 7919) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const free = (x, z, m = 0.6) => inChunk(x, z) && !idx.inWater(x, z, m) && !idx.inHouse(x, z, m);
  const LAMP = new Set(['primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'pedestrian']);
  const BOLL = new Set(['residential', 'living_street', 'unclassified', 'tertiary']);
  const BIKE = new Set(['residential', 'living_street', 'pedestrian', 'footway', 'unclassified', 'tertiary']);
  const PATH = new Set(['footway', 'path', 'pedestrian', 'cycleway']);
  for (const [kind, bridge, passage, co] of out.r) {
    if (bridge || passage) continue;
    const half = ROAD_HALF[kind] || 1.5;
    let run = 0;
    for (let i = 0; i < co.length - 2; i += 2) {
      const ax = co[i], az = co[i + 1], bx = co[i + 2], bz = co[i + 3];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.5) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
      for (let s = 0; s < len; s += 1) {
        const at = run + s, px = ax + ux * s, pz = az + uz * s;
        if (!inChunk(px, pz)) continue;
        const h = hsh(px, pz);
        const side = hsh(Math.floor(at / 120), kind.length) < 0.5 ? 1 : -1;
        if (need.la && LAMP.has(kind) && at % 32 < 1) {
          const off = half + 0.9, x = px + nx * off * side, z = pz + nz * off * side;
          if (free(x, z) && sf.la.length < CAP.la * 2) sf.la.push(r1(x), r1(z));
        }
        if (need.bo && BOLL.has(kind) && at % 47 < 1 && h < 0.6) {
          const off = half + 0.4;
          for (let k = 0; k < 4; k++) {
            const x = px + ux * k * 1.6 - nx * off * side, z = pz + uz * k * 1.6 - nz * off * side;
            if (free(x, z, 0.3) && sf.bo.length < CAP.bo * 2) sf.bo.push(r1(x), r1(z));
          }
        }
        if (need.bi && BIKE.has(kind) && at % 61 < 1 && h < 0.75) {
          const off = half + 1.1, x = px - nx * off * side, z = pz - nz * off * side;
          if (free(x, z, 1) && sf.bi.length < CAP.bi * 4) sf.bi.push(r1(x), r1(z), r2(Math.atan2(nx * side, nz * side)), 2 + Math.floor(h * 6));
        }
        if ((need.be || need.wb) && PATH.has(kind) && at % 38 < 1 && idx.inPark(px, pz)) {
          const off = half + 0.8, x = px + nx * off * side, z = pz + nz * off * side;
          if (need.be && free(x, z, 0.8) && sf.be.length < CAP.be * 3) sf.be.push(r1(x), r1(z), r2(Math.atan2(-nx * side, -nz * side)));
          const bx2 = x + ux * 1.6, bz2 = z + uz * 1.6;
          if (need.wb && h < 0.5 && free(bx2, bz2, 0.3) && sf.wb.length < CAP.wb * 2) sf.wb.push(r1(bx2), r1(bz2));
        }
        if (need.wb && kind === 'pedestrian' && at % 70 < 1) {
          const x = px + nx * (half + 0.5) * side, z = pz + nz * (half + 0.5) * side;
          if (free(x, z, 0.3) && sf.wb.length < CAP.wb * 2) sf.wb.push(r1(x), r1(z));
        }
      }
      run += len;
    }
  }
}

// Offline stand-in for Overpass (FAKE_MAP=1): canals, bridges, canal houses, trees and street furniture.
// Landmarks (plus a 20 m margin) stay clear, and the Dam and Stationsplein are open paved squares.
const SQUARES = [{ ...toTile(52.3731, 4.8926), r: 90 }, { x: 0, z: 0, r: 60 }];
function keepOut(wx, wz) {
  if (insideLandmark(wx, wz, 20)) return true;
  return SQUARES.some(q => Math.hypot(wx - q.x, wz - q.z) < q.r);
}

function fakeChunk(cx, cz) {
  const out = { cx, cz, ok: true, fake: true, b: [], w: [], g: [], p: [], ba: [], r: [], rl: [], t: [] };
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const blocked = (x, z) => keepOut(x + x0, z + z0);
  const rect = (x, z, w, h) => [x, z, x + w, z, x + w, z + h, x, z + h, x, z];
  // free stretches [a, b] of a line from a to b, sampled every 2 m; free(t) tests one point
  const runs = (a, b, free) => {
    const res = [];
    let st = null;
    for (let t = a; t <= b + 1e-6; t += 2) {
      if (free(t)) { if (st === null) st = t; }
      else if (st !== null) { if (t - 2 - st >= 2) res.push([st, t - 2]); st = null; }
    }
    if (st !== null && b - st >= 2) res.push([st, b]);
    return res;
  };
  const hRoad = (kind, bridge, z, a = 0, b = CHUNK) => { for (const [p, q] of runs(a, b, t => !blocked(t, z))) out.r.push([kind, bridge, 0, [p, z, q, z]]); };
  const vRoad = (kind, bridge, x, a = 0, b = CHUNK) => { for (const [p, q] of runs(a, b, t => !blocked(x, t))) out.r.push([kind, bridge, 0, [x, p, x, q]]); };
  const rectFree = (x, z, w, h) => [[x, z], [x + w, z], [x, z + h], [x + w, z + h], [x + w / 2, z + h / 2]].every(([a, b]) => !blocked(a, b));
  let seed = (cx * 7919 + cz * 104729) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (const cz0 of [60, 190]) {
    for (const [a, b] of runs(-2, CHUNK + 2, t => !blocked(t, cz0) && !blocked(t, cz0 + 7) && !blocked(t, cz0 + 14))) out.w.push([rect(a, cz0, b - a, 14)]);
    hRoad('residential', 0, cz0 - 4); hRoad('footway', 0, cz0 + 18);
    for (const bx of [40, 170]) vRoad('residential', 1, bx, cz0 - 4, cz0 + 18);
    for (let x = 4; x < CHUNK; x += 9) for (const [tx, tz] of [[x, cz0 - 1.5], [x + 4, cz0 + 15.5]]) if (!blocked(tx, tz)) out.t.push(tx, tz);
    for (let x = 14; x < CHUNK - 10; x += 8.5) {
      if (Math.abs(x - 40) < 8 || Math.abs(x - 170) < 8) continue;
      for (const bz of [cz0 - 22, cz0 + 22]) {
        const h = 10 + Math.floor(rnd() * 8), sd = Math.floor(rnd() * 997);
        if (rectFree(x, bz, 8, 14)) out.b.push([h, sd, rect(x, bz, 8, 14)]);
      }
    }
  }
  vRoad('tertiary', 0, 40); vRoad('cycleway', 0, 46); vRoad('tertiary', 0, 170);
  if ((cx + cz) % 2 === 0 && rectFree(90, 100, 60, 60)) out.g.push([rect(90, 100, 60, 60)]);
  if (rectFree(-10, -10, 30, 30)) out.p.push([rect(-10, -10, 30, 30)]);
  // street furniture: lamps and Amsterdammertjes along the quays, benches facing the water, bikes everywhere
  const sf = out.sf = emptyFurniture();
  const nearBridge = x => Math.abs(x - 40) < 5 || Math.abs(x - 170) < 5;
  for (const cz0 of [60, 190]) {
    for (let x = 8.5; x < CHUNK; x += 18) if (!nearBridge(x)) sf.la.push(x, cz0 - 0.8);
    for (let x = 26.5; x < CHUNK; x += 36) if (!nearBridge(x)) sf.la.push(x, cz0 + 20.5);
    for (const bx of [40, 170]) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { sf.bo.push(bx + s * (4 + k * 1.6), cz0 - 0.5); sf.bo.push(bx + s * (4 + k * 1.6), cz0 + 14.6); }
    for (let x = 100; x < 112; x += 1.6) sf.bo.push(x, cz0 - 0.5);
    for (const x of [21.5, 75.5, 129.5, 210.5]) { sf.be.push(x, cz0 + 15.4, 3.14); sf.wb.push(x + 1.8, cz0 + 15.3); }
    for (const [x, n] of [[60, 6], [120, 4], [200, 8]]) sf.bi.push(x, cz0 - 6.9, 0, n);
    sf.bi.push(52, cz0 + 20.6, 3.14, 5);
  }
  if (out.g.length) {
    for (const [x, z, a] of [[100, 104, 0], [120, 104, 0], [140, 104, 0], [100, 156, 3.14], [120, 156, 3.14], [140, 156, 3.14]]) sf.be.push(x, z, a);
    sf.wb.push(110, 103.5, 130, 156.5);
    sf.la.push(91, 101, 149, 101, 91, 159, 149, 159);
  }
  for (const [k, n] of [['be', 3], ['la', 2], ['bi', 4], ['wb', 2], ['bo', 2]]) {
    const keep = [];
    for (let i = 0; i < sf[k].length; i += n) if (!blocked(sf[k][i], sf[k][i + 1])) keep.push(...sf[k].slice(i, i + n));
    sf[k] = keep;
  }
  // the open squares: paved discs ringed by lamps, with benches and bins facing inwards
  for (const q of SQUARES) {
    const lx = q.x - x0, lz = q.z - z0;
    if (lx + q.r < 0 || lx - q.r > CHUNK || lz + q.r < 0 || lz - q.r > CHUNK) continue;
    const ring = [];
    for (let i = 0; i <= 32; i++) { const a = i / 32 * Math.PI * 2; ring.push(r1(lx + Math.cos(a) * q.r), r1(lz + Math.sin(a) * q.r)); }
    out.p.push([ring]);
    const n = Math.round(q.r * Math.PI * 2 / 24);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, x = lx + Math.cos(a) * (q.r - 4), z = lz + Math.sin(a) * (q.r - 4);
      if (!inChunk(x, z) || insideLandmark(x + x0, z + z0, 2)) continue;
      if (i % 2) sf.la.push(r1(x), r1(z));
      else {
        sf.be.push(r1(x), r1(z), r2(Math.atan2(-Math.cos(a), -Math.sin(a))));
        if (i % 4 === 0) sf.wb.push(r1(x + Math.sin(a) * 1.6), r1(z - Math.cos(a) * 1.6));
      }
    }
  }
  return out;
}
