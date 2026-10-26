// Fetches OpenStreetMap data for 256x256 m chunks via Overpass, converts it to compact local-metre geometry and caches it.
import fs from 'node:fs';
import path from 'node:path';
import { CHUNK, toTile, toLatLon } from '../shared/geo.js';
import { DATA_DIR } from './db.js';

const VERSION = 1;
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
);out geom;`;
  let lastErr;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AmsterScape/0.1' }, signal: AbortSignal.timeout(90_000) });
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
  const out = { cx, cz, ok: true, b: [], w: [], g: [], p: [], ba: [], r: [], rl: [], t: [] };
  for (const el of osm.elements || []) {
    const tg = el.tags || {};
    if (el.type === 'node') {
      if (tg.natural === 'tree') { const t = toTile(el.lat, el.lon); out.t.push(r1(t.x - x0), r1(t.z - z0)); }
      continue;
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

// Offline stand-in for Overpass (FAKE_MAP=1): canals, bridges, canal houses and trees.
function fakeChunk(cx, cz) {
  const out = { cx, cz, ok: true, fake: true, b: [], w: [], g: [], p: [], ba: [], r: [], rl: [], t: [] };
  const rect = (x, z, w, h) => [x, z, x + w, z, x + w, z + h, x, z + h, x, z];
  let seed = (cx * 7919 + cz * 104729) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (const cz0 of [60, 190]) {
    out.w.push([rect(-2, cz0, CHUNK + 4, 14)]);
    out.r.push(['residential', 0, 0, [0, cz0 - 4, CHUNK, cz0 - 4]], ['footway', 0, 0, [0, cz0 + 18, CHUNK, cz0 + 18]]);
    for (const bx of [40, 170]) out.r.push(['residential', 1, 0, [bx, cz0 - 4, bx, cz0 + 18]]);
    for (let x = 4; x < CHUNK; x += 9) out.t.push(x, cz0 - 1.5, x + 4, cz0 + 15.5);
    for (let x = 14; x < CHUNK - 10; x += 8.5) {
      if (Math.abs(x - 40) < 8 || Math.abs(x - 170) < 8) continue;
      out.b.push([10 + Math.floor(rnd() * 8), Math.floor(rnd() * 997), rect(x, cz0 - 22, 8, 14)]);
      out.b.push([10 + Math.floor(rnd() * 8), Math.floor(rnd() * 997), rect(x, cz0 + 22, 8, 14)]);
    }
  }
  out.r.push(['tertiary', 0, 0, [40, 0, 40, CHUNK]], ['cycleway', 0, 0, [46, 0, 46, CHUNK]], ['tertiary', 0, 0, [170, 0, 170, CHUNK]]);
  if ((cx + cz) % 2 === 0) out.g.push([rect(90, 100, 60, 60)]);
  out.p.push([rect(-10, -10, 30, 30)]);
  return out;
}
