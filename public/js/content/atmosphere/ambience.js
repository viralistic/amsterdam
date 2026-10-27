// Ambient soundscape: looping beds (canal water, Wilderness wind, gasworks hum, rain, city murmur) and
// one-shot events (birds, gulls, owls, trams, station chimes, church bells on the real hour, cellar drips).
import { A, ready, tone, noise, bell, out, mtof, note, rnd } from './audio.js';
import { atmo, clamp, tile, amsParts, playerPos } from './common.js';
import { LANDMARK_MODELS } from '/shared/landmarks.js';
import { CHUNK } from '/shared/geo.js';

const lm = id => LANDMARK_MODELS.find(l => l.id === id);
const at = (id, lat, lon) => { const l = lm(id); return l ? { x: l.x, z: l.z } : tile(lat, lon); };
const CHURCHES = [
  { name: 'Westerkerk', ...at('westerkerk', 52.37452, 4.88395), pitch: 'G2', carillon: true },
  { name: 'Oude Kerk', ...at('oudekerk', 52.37412, 4.89804), pitch: 'F2', carillon: true },
  { name: 'Nieuwe Kerk', ...at('nieuwekerk', 52.37385, 4.8915), pitch: 'A2' },
  { name: 'Zuiderkerk', ...tile(52.3707, 4.9010), pitch: 'Bb2' },
];
const CENTRAAL = at('centraal', 52.37895, 4.9003);
const GASWORKS = tile(52.3858, 4.8745);
const IJ = { z: tile(52.381, 4.9).z };

// ---- beds: looping noise through filters, faded towards a target level
const beds = {};
function makeBed(name, build) {
  const ctx = A.ctx;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(A.amb);
  const nodes = build(ctx, g);
  beds[name] = { g, nodes, level: 0 };
}
function loopNoise(ctx, pink) {
  const s = ctx.createBufferSource();
  s.buffer = pink ? A.pinkBuf : A.noiseBuf; s.loop = true;
  s.start(0, Math.random() * 2);
  return s;
}
function lfo(ctx, freq, depth, target) {
  const o = ctx.createOscillator(); o.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = depth;
  o.connect(g); g.connect(target); o.start();
  return o;
}
function buildBeds() {
  makeBed('water', (ctx, g) => {
    const n = loopNoise(ctx, true), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 0.6;
    const m = ctx.createGain(); m.gain.value = 0.6; lfo(ctx, 0.23, 0.35, m.gain); lfo(ctx, 0.11, 120, f.frequency);
    n.connect(f); f.connect(m); m.connect(g);
  });
  makeBed('wind', (ctx, g) => {
    const n = loopNoise(ctx, false), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 2.5;
    lfo(ctx, 0.07, 260, f.frequency); lfo(ctx, 0.031, 180, f.frequency);
    const m = ctx.createGain(); m.gain.value = 0.55; lfo(ctx, 0.05, 0.35, m.gain);
    n.connect(f); f.connect(m); m.connect(g);
  });
  makeBed('hum', (ctx, g) => {
    for (const [f0, v, type] of [[50, 0.22, 'sine'], [100, 0.12, 'sine'], [150, 0.05, 'sawtooth'], [201, 0.03, 'triangle']]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f0;
      const og = ctx.createGain(); og.gain.value = v;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      o.connect(lp); lp.connect(og); og.connect(g); o.start();
    }
    const n = loopNoise(ctx, true), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    const ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(f); f.connect(ng); ng.connect(g);
  });
  makeBed('rain', (ctx, g) => {
    const n = loopNoise(ctx, false), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
    const m = ctx.createGain(); m.gain.value = 0.35; n.connect(hp); hp.connect(lp); lp.connect(m); m.connect(g);
  });
  makeBed('city', (ctx, g) => {
    const n = loopNoise(ctx, true), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const m = ctx.createGain(); m.gain.value = 0.45; lfo(ctx, 0.04, 0.15, m.gain);
    n.connect(f); f.connect(m); m.connect(g);
  });
}

// ---- surroundings
function pointInRings(rings, x, z) {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], zi = r[i + 1], xj = r[j], zj = r[j + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
// fraction of sample points around the player that are canal water
function waterNear(x, z) {
  let hits = 0, total = 0;
  for (const [dx, dz] of [[0, 0], [9, 0], [-9, 0], [0, 9], [0, -9], [6, 6], [-6, 6], [6, -6], [-6, -6], [16, 0], [-16, 0], [0, 16], [0, -16]]) {
    total++;
    const px = x + dx, pz = z + dz;
    const list = atmo.water.get(Math.floor(px / CHUNK) + ',' + Math.floor(pz / CHUNK));
    if (!list) continue;
    if (list.some(w => px >= w.bb[0] && px <= w.bb[1] && pz >= w.bb[2] && pz <= w.bb[3] && pointInRings(w.rings, px, pz))) hits++;
  }
  return hits / total;
}
function tramNear(ctx, x, z) {
  const ch = ctx.renderer?.world.chunks.get(Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK));
  if (!ch?.data?.rl) return Infinity;
  const lx = x - ch.cx * CHUNK, lz = z - ch.cz * CHUNK;
  let best = Infinity;
  for (const [kind, co] of ch.data.rl) {
    if (kind === 'rail') continue;
    for (let i = 0; i < co.length; i += 2) best = Math.min(best, Math.hypot(co[i] - lx, co[i + 1] - lz));
  }
  return best;
}

// stereo position of a world point relative to the camera
function panOf(ctx, p, sx, sz) {
  const yaw = ctx.renderer?.yaw || 0;
  const dx = sx - p.x, dz = sz - p.z, d = Math.hypot(dx, dz) || 1;
  return clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.8;
}
const fall = (d, r) => clamp(1 - d / r) ** 1.6;

// ---- one-shot events
function chirp(d, t) {
  const kind = Math.floor(Math.random() * 3);
  const base = rnd(2800, 4600);
  if (kind === 0) for (let i = 0, n = 2 + Math.floor(Math.random() * 4); i < n; i++) tone(d, base, t + i * 0.13, 0.08, { vol: 0.05, f1: base * rnd(1.2, 1.5), glide: 0.07 });
  else if (kind === 1) { tone(d, base * 0.8, t, 0.5, { vol: 0.04, vib: 0.08, vibRate: 28, f1: base, glide: 0.45 }); }
  else for (let i = 0; i < 3; i++) tone(d, base * 1.1, t + i * 0.09, 0.06, { vol: 0.045, f1: base * 0.7, glide: 0.05 });
}
function coo(d, t) { for (const [dt, f] of [[0, 540], [0.35, 500], [0.6, 520]]) tone(d, f, t + dt, 0.28, { vol: 0.05, attack: 0.05, f1: f * 0.92 }); }
function gull(d, t) { for (let i = 0; i < 3; i++) tone(d, 1500, t + i * 0.32, 0.28, { type: 'sawtooth', vol: 0.025, filter: 2400, q: 3, f1: 900, glide: 0.25, attack: 0.03 }); }
function owl(d, t) { for (const [dt, l] of [[0, 0.35], [0.6, 0.2], [0.85, 0.5]]) tone(d, 390, t + dt, l, { vol: 0.07, attack: 0.06, f1: 360, vib: 0.01, vibRate: 7 }); }
function quack(d, t) { for (let i = 0; i < 2; i++) tone(d, 420, t + i * 0.2, 0.13, { type: 'sawtooth', vol: 0.04, filter: 1300, q: 5, f1: 300 }); }
function tramBell(d, t) { for (const dt of [0, 0.28]) bell(d, 1180, t + dt, 0.9, 0.06, [[1, 1], [2.01, 0.5], [2.76, 0.3], [5.4, 0.1]]); }
function stationChime(d, t) {
  ['E5', 'C5', 'G5', 'E5'].forEach((n, i) => tone(d, mtof(note(n)), t + i * 0.42, 1.4, { vol: 0.06, attack: 0.01 }));
  // a muffled, wordless announcement
  for (let i = 0; i < 14; i++) tone(d, rnd(140, 210), t + 2 + i * 0.16, 0.14, { type: 'sawtooth', vol: 0.03, filter: rnd(500, 1100), q: 4, attack: 0.02 });
}
function drip(d, t) { tone(d, rnd(900, 1500), t, 0.12, { vol: 0.07, f1: 500, glide: 0.08 }); }
function clank(d, t) {
  for (const [f, v] of [[310, 0.08], [620, 0.05], [1080, 0.03]]) tone(d, f, t, 1.2, { vol: v });
  noise(d, t, 0.05, { vol: 0.2, ftype: 'lowpass', freq: 900 });
}
function howl(d, t) { tone(d, rnd(250, 330), t, 3, { type: 'triangle', vol: 0.03, attack: 1, f1: rnd(380, 450), glide: 1.6, vib: 0.02, vibRate: 3 }); }
function lap(d, t) { noise(d, t, rnd(0.25, 0.5), { vol: 0.12, ftype: 'bandpass', freq: rnd(300, 650), q: 2, attack: 0.08, pink: true }); }

// Church bells: optional carillon tune, then one strike per hour.
const CARILLON = [['G4', 0], ['B4', 1], ['D5', 2], ['G5', 3], ['F#5', 4.5], ['D5', 5], ['E5', 6], ['C5', 7], ['D5', 8.5]];
function ringChurch(ctx, c, strikes, p) {
  const d = Math.hypot(c.x - p.x, c.z - p.z);
  const v = fall(d, 900);
  if (v <= 0.01) return false;
  const dest = out(A.amb, v * 1.4, panOf(ctx, p, c.x, c.z), 30);
  let t = A.ctx.currentTime + 0.05;
  if (c.carillon) { for (const [n, b] of CARILLON) bell(dest, mtof(note(n)), t + b * 0.32, 2.2, 0.035); t += 3.6; }
  for (let i = 0; i < strikes; i++) bell(dest, mtof(note(c.pitch)), t + i * 2.1, 4.5, 0.11);
  return true;
}
atmo.ringBells = (hour = new Date().getHours()) => {
  const ctx = atmo.ctx;
  if (!ready() || !ctx) return 0;
  const p = playerPos(ctx);
  return CHURCHES.filter(c => ringChurch(ctx, c, (hour % 12) || 12, p)).length;
};

// ---- update (4 Hz)
let built = false, lastUpd = 0, lastBell = '', next = {};
const due = (k, now, min, max) => { if (!next[k]) next[k] = now + rnd(min, max) * 1000 * 0.5; if (now < next[k]) return false; next[k] = now + rnd(min, max) * 1000; return true; };

export function ambienceFrame(now, ctx) {
  if (!ready() || now - lastUpd < 250) return;
  lastUpd = now;
  if (!built) { buildBeds(); built = true; }
  const S = ctx.S, p = playerPos(ctx);
  const reg = atmo.region || S.region || {};
  const type = S.wild || reg.wild ? 'wild' : reg.type || 'city';
  const inside = S.inside || type === 'interior';
  const L = atmo.light;
  const day = L.day;
  const water = inside ? 0 : waterNear(p.x, p.z);
  const target = {
    water: water ? 0.25 + water * 0.9 : 0,
    wind: inside ? 0 : type === 'wild' ? 0.7 : 0.06 + L.rain * 0.15,
    hum: inside ? 0 : fall(Math.hypot(p.x - GASWORKS.x, p.z - GASWORKS.z), 260) * 0.9,
    rain: inside ? 0 : L.rain * 0.8,
    city: inside ? 0 : (type === 'city' || type === 'hub' ? 0.35 : type === 'skilling' ? 0.15 : 0) * (0.5 + 0.5 * day),
  };
  atmo.amb = { ...target, type, inside };
  const t = A.ctx.currentTime;
  for (const [k, b] of Object.entries(beds)) { b.level = target[k] || 0; b.g.gain.setTargetAtTime(b.level, t, 1.2); }

  const fx = (fn, vol, sx, sz, life = 4) => fn(out(A.amb, vol, sx === undefined ? rnd(-0.6, 0.6) : panOf(ctx, p, sx, sz), life), A.ctx.currentTime + 0.02);
  if (inside) {
    if (type === 'interior' && due('drip', now, 2, 7)) fx(drip, 0.8);
    return;
  }
  // birds by day in the parks (and pigeons in the city), owls at night
  if (type === 'park' || type === 'skilling') {
    if (day > 0.3 && L.rain < 0.5 && due('bird', now, 1.5, 5)) fx(chirp, 0.6 + Math.random() * 0.6);
    if (day < 0.2 && due('owl', now, 12, 30)) fx(owl, 0.7);
    if (water > 0.1 && day > 0.3 && due('duck', now, 8, 20)) fx(quack, 0.6);
  } else if ((type === 'city' || type === 'hub') && day > 0.3 && due('pigeon', now, 10, 25)) fx(coo, 0.5);
  if (water > 0.05 && due('lap', now, 0.7, 2.2)) fx(lap, 0.4 + water);
  // gulls over the IJ
  if (Math.abs(p.z - IJ.z) < 500 && p.x > -1500 && p.x < 2500 && day > 0.2 && due('gull', now, 9, 22)) fx(gull, 0.5);
  // trams and station announcements around Centraal
  const dC = Math.hypot(p.x - CENTRAAL.x, p.z - CENTRAAL.z);
  const tram = Math.min(tramNear(ctx, p.x, p.z), dC < 300 ? dC / 6 : Infinity);
  if (tram < 60 && due('tram', now, 14, 40)) fx(tramBell, fall(tram, 70) * 0.9 + 0.1);
  if (dC < 450 && due('chime', now, 45, 100)) fx(stationChime, fall(dC, 500) * 0.7, CENTRAAL.x, CENTRAAL.z, 8);
  if (target.hum > 0.05 && due('clank', now, 4, 12)) fx(clank, target.hum, GASWORKS.x, GASWORKS.z);
  if (type === 'wild' && due('howl', now, 10, 25)) fx(howl, 0.8);
  // church bells on the real hour (and one strike on the half hour)
  const ap = amsParts();
  const key = `${ap.day}-${ap.hour}-${ap.minute < 30 ? 0 : 30}`;
  if ((ap.minute === 0 || ap.minute === 30) && ap.second < 20 && key !== lastBell) {
    lastBell = key;
    for (const c of CHURCHES) ringChurch(ctx, c, ap.minute === 30 ? 1 : (ap.hour % 12) || 12, p);
  }
}
