// Shared state for the atmosphere pack: saved settings, Amsterdam clock, sun position and small helpers.
import { registry } from '../../registry.js';
import { toTile } from '/shared/geo.js';

const KEY = 'atmo.settings';
const DEFAULTS = { master: 0.8, music: 0.45, sfx: 0.8, amb: 0.7, weather: true, daynight: true, brightness: 1, musicAuto: true, musicOn: true };

const fallbackStore = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
export const store = () => registry.ctx?.store || fallbackStore;
const parse = s => { try { return JSON.parse(s) || {}; } catch { return {}; } };

export const settings = { ...DEFAULTS, ...parse(fallbackStore.get(KEY)) };
const listeners = [];
export const onSettings = f => listeners.push(f);
export function saveSettings() {
  store().set(KEY, JSON.stringify(settings));
  for (const f of listeners) { try { f(settings); } catch (e) { console.error(e); } }
}

// Debug and test handle: registry.atmosphere.forceHour = 22, .forceWeather = 'rain' | 'mist' | 'clear'.
export const atmo = registry.atmosphere = {
  forceHour: null,
  forceWeather: null,
  settings,
  light: { day: 1, lamp: 0, dusk: 0, elev: 30, rain: 0, mist: 0, weather: 'clear' },
  lamps: new Map(), // chunk key -> Float32Array of world x, z pairs (street lamps, for night lighting)
  water: new Map(), // chunk key -> [{ bb, rings }] in world coordinates (for canal ambience)
  log: [],          // last sound ids played, for tests
  region: null,
};

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const tile = (lat, lon) => toTile(lat, lon);

// ---- Amsterdam clock
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
export function amsParts(d = new Date()) {
  const o = {};
  for (const p of fmt.formatToParts(d)) if (p.type !== 'literal') o[p.type] = +p.value;
  return o;
}
function offsetMs(d) {
  const p = amsParts(d);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000;
}
// The moment the world is lit for: now, or today at the forced Amsterdam hour.
export function worldDate() {
  const now = new Date();
  if (atmo.forceHour === null || atmo.forceHour === undefined || !Number.isFinite(+atmo.forceHour)) return now;
  const p = amsParts(now);
  return new Date(Date.UTC(p.year, p.month - 1, p.day) + (+atmo.forceHour) * 3600e3 - offsetMs(now));
}
export function amsHour(d = worldDate()) { const p = amsParts(d); return p.hour + p.minute / 60 + p.second / 3600; }

// Sun elevation and azimuth (degrees, azimuth clockwise from north) over Amsterdam.
export function sunPosition(date, lat = 52.373, lon = 4.893) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  const H = (gmst * 15 + lon) * rad - ra;
  const phi = lat * rad;
  const elev = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H));
  return { elev: elev / rad, az: ((az / rad) + 360) % 360 };
}

// Player position in world tiles (smoothly interpolated when the model exists).
export function playerPos(ctx) {
  const r = ctx?.renderer;
  const me = r?.ents.get(r.myKey);
  if (me?.model) return { x: me.model.group.position.x, z: me.model.group.position.z };
  return { x: (ctx?.S.x || 0) + 0.5, z: (ctx?.S.z || 0) + 0.5 };
}

export function myEntity(ctx) {
  const S = ctx?.S;
  return S?.ents?.find(e => e.k === 'p' && e.id === S.id) || null;
}

// Injects a stylesheet once (the pack may not edit style.css).
export function css(id, text) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = text;
  document.head.appendChild(s);
}

// Chunk lifecycle: our meshes live in our own groups (World.unload would dispose shared geometries),
// so we drop them ourselves once the world forgets the chunk.
const tracked = new Map();
export function trackChunk(chunk, onUnload) {
  if (!tracked.has(chunk)) tracked.set(chunk, []);
  tracked.get(chunk).push(onUnload);
}
export function sweepChunks(world) {
  for (const [c, fns] of tracked) {
    if (world.chunks.get(c.cx + ',' + c.cz) === c) continue;
    for (const f of fns) { try { f(); } catch (e) { console.error(e); } }
    tracked.delete(c);
  }
}
