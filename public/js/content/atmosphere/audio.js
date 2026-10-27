// Procedural WebAudio: one AudioContext, master/music/effects/ambience buses, synth helpers and the sound effects.
// Every sound here is synthesised from oscillators and noise; there are no audio files.
import { settings, onSettings, atmo } from './common.js';

export const A = { ctx: null, master: null, music: null, sfx: null, amb: null, noiseBuf: null, pinkBuf: null };
const MAX_VOICES = 48; // sound effects alive at once
let voices = 0;

function create() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  A.ctx = ctx;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
  comp.connect(ctx.destination);
  A.master = ctx.createGain(); A.master.connect(comp);
  for (const b of ['music', 'sfx', 'amb']) { A[b] = ctx.createGain(); A[b].connect(A.master); }
  // 3 s of white and of pink-ish noise, reused by every noise voice
  const n = ctx.sampleRate * 3;
  A.noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  A.pinkBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const w = A.noiseBuf.getChannelData(0), p = A.pinkBuf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1;
    w[i] = x;
    b0 = 0.99765 * b0 + x * 0.099046; b1 = 0.963 * b1 + x * 0.2965164; b2 = 0.57 * b2 + x * 1.0526913;
    p[i] = (b0 + b1 + b2 + x * 0.1848) * 0.18;
  }
  applyVolumes();
  for (const f of readyHooks) { try { f(); } catch (e) { console.error(e); } }
}

const readyHooks = [];
export const onAudioReady = f => { readyHooks.push(f); if (A.ctx) f(); };

// Browsers only allow audio after a user gesture.
function gesture() {
  try {
    if (!A.ctx) create();
    if (A.ctx && A.ctx.state === 'suspended' && !document.hidden) A.ctx.resume();
  } catch (e) { console.error('audio', e); }
}
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, gesture, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (!A.ctx) return;
  if (document.hidden) A.ctx.suspend(); else A.ctx.resume();
});

export const ready = () => !!A.ctx && A.ctx.state === 'running';
export const now = () => A.ctx.currentTime;

const vol = v => v * v; // perceptual slider curve
export function applyVolumes() {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  A.master.gain.setTargetAtTime(vol(settings.master), t, 0.05);
  A.music.gain.setTargetAtTime(vol(settings.music) * 0.55, t, 0.05);
  A.sfx.gain.setTargetAtTime(vol(settings.sfx) * 0.9, t, 0.05);
  A.amb.gain.setTargetAtTime(vol(settings.amb) * 0.8, t, 0.05);
}
onSettings(applyVolumes);

export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const note = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };

// An output node for one sound: gain (and pan) into a bus. Disconnects itself when done.
export function out(bus, gain = 1, pan = 0, life = 3) {
  const ctx = A.ctx;
  const g = ctx.createGain();
  g.gain.value = gain;
  let head = g;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(bus); head = p; }
  else g.connect(bus);
  setTimeout(() => { try { g.disconnect(); if (head !== g) head.disconnect(); } catch {} }, life * 1000 + 200);
  return g;
}

// Oscillator voice with an attack/decay envelope. o: { type, f1 (glide target), vol, attack, filter, q, detune, vib }
export function tone(dest, freq, t, dur, o = {}) {
  const ctx = A.ctx;
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.glide || dur));
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  const v = o.vol ?? 0.2, a = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  if (o.sustain) { g.gain.setValueAtTime(v, t + Math.max(a, dur - (o.release ?? 0.08))); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
  else g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, dur));
  let node = osc;
  if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.ftype || 'lowpass'; f.frequency.value = o.filter; f.Q.value = o.q ?? 0.7; osc.connect(f); node = f; }
  node.connect(g); g.connect(dest);
  let lfo;
  if (o.vib) { lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = o.vibRate || 5.5; lg.gain.value = freq * o.vib; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.05); }
  osc.start(t); osc.stop(t + dur + 0.05);
  osc.onended = () => { try { g.disconnect(); node.disconnect(); } catch {} };
  return osc;
}

// Filtered noise burst. o: { vol, attack, ftype, freq, f1, q, pink, rate }
export function noise(dest, t, dur, o = {}) {
  const ctx = A.ctx;
  const src = ctx.createBufferSource();
  src.buffer = o.pink ? A.pinkBuf : A.noiseBuf;
  if (o.rate) src.playbackRate.value = o.rate;
  const f = ctx.createBiquadFilter();
  f.type = o.ftype || 'bandpass';
  f.frequency.setValueAtTime(o.freq || 1000, t);
  if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const v = o.vol ?? 0.3, a = o.attack ?? 0.003;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, dur));
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t, Math.random() * 2, dur + 0.05);
  src.onended = () => { try { g.disconnect(); f.disconnect(); } catch {} };
  return src;
}

// Struck bell: inharmonic partials with long decays.
export function bell(dest, freq, t, dur = 3, v = 0.2, partials = [[0.5, 0.5], [1, 1], [1.19, 0.45], [1.5, 0.35], [2, 0.4], [2.52, 0.2], [3.01, 0.15], [4.1, 0.08]]) {
  for (const [r, a] of partials) tone(dest, freq * r, t, dur * (1.15 - Math.min(0.8, r * 0.18)), { vol: v * a, attack: 0.004 });
  noise(dest, t, 0.03, { vol: v * 0.4, ftype: 'highpass', freq: 3000 });
}

const rnd = (a, b) => a + Math.random() * (b - a);
const N = note;

// Plays a little score: [[beat, midi | name | [chord], beats, voice?]], voices: lead, harm, bass
function score(dest, t, bpm, notes, v = 1) {
  const b = 60 / bpm;
  for (const [at, n, len, voice = 'lead'] of notes) {
    for (const m of [].concat(n)) {
      const f = mtof(typeof m === 'string' ? N(m) : m), tt = t + at * b, d = len * b;
      if (voice === 'lead') { tone(dest, f, tt, d + 0.25, { type: 'square', vol: 0.07 * v, filter: 2600, attack: 0.01 }); tone(dest, f * 2, tt, d * 0.8, { type: 'triangle', vol: 0.04 * v }); }
      else if (voice === 'harm') tone(dest, f, tt, d + 0.3, { type: 'triangle', vol: 0.09 * v, attack: 0.02 });
      else if (voice === 'bass') tone(dest, f, tt, d + 0.1, { type: 'triangle', vol: 0.16 * v, attack: 0.01 });
      else if (voice === 'bell') bell(dest, f, tt, d + 1, 0.05 * v);
    }
  }
}

export const SFX = {
  hit(d, t) {
    noise(d, t, 0.14, { vol: 0.55, ftype: 'lowpass', freq: 1400, f1: 250 });
    tone(d, 160, t, 0.18, { vol: 0.45, f1: 50 });
  },
  miss(d, t) { noise(d, t, 0.22, { vol: 0.22, ftype: 'bandpass', freq: 2600, f1: 600, q: 1.4, attack: 0.04 }); },
  death(d, t) {
    [67, 63, 60, 55, 48].forEach((m, i) => tone(d, mtof(m), t + i * 0.24, 0.4, { type: 'square', vol: 0.07, filter: 1400 }));
    tone(d, 98, t + 1.2, 1.6, { type: 'triangle', vol: 0.25, f1: 49 });
    noise(d, t + 1.2, 1.2, { vol: 0.15, ftype: 'lowpass', freq: 600, f1: 80, pink: true, attack: 0.1 });
  },
  levelup(d, t) {
    score(d, t, 150, [
      [0, 'G4', 0.5], [0.5, 'C5', 0.5], [1, 'E5', 0.5], [1.5, 'G5', 0.5], [2, 'E5', 0.5], [2.5, 'G5', 0.5],
      [3, 'C6', 2.5], [3, ['E5', 'G5'], 2.5, 'harm'], [0, 'C3', 1, 'bass'], [1, 'G3', 1, 'bass'], [2, 'E3', 1, 'bass'], [3, 'C3', 2.5, 'bass'],
    ]);
  },
  quest(d, t) {
    score(d, t, 120, [
      [0, 'Bb4', 0.5], [0.5, 'D5', 0.5], [1, 'F5', 1], [2, 'Bb5', 1.5], [3.5, 'A5', 0.5], [4, 'G5', 0.5], [4.5, 'F5', 0.5], [5, 'Eb5', 0.5], [5.5, 'D5', 0.5],
      [6, 'C5', 1], [7, 'D5', 0.5], [7.5, 'Eb5', 0.5], [8, 'D5', 4],
      [0, ['D4', 'F4'], 2, 'harm'], [2, ['D5', 'F5'], 2, 'harm'], [4, ['Eb4', 'G4'], 2, 'harm'], [6, ['F4', 'A4'], 2, 'harm'], [8, ['F4', 'Bb4'], 4, 'harm'],
      [0, 'Bb2', 2, 'bass'], [2, 'D3', 2, 'bass'], [4, 'Eb3', 2, 'bass'], [6, 'F3', 2, 'bass'], [8, 'Bb2', 4, 'bass'],
      [8, 'Bb5', 4, 'bell'],
    ]);
  },
  chop(d, t) {
    noise(d, t, 0.08, { vol: 0.6, ftype: 'bandpass', freq: rnd(900, 1300), q: 3 });
    tone(d, rnd(180, 230), t, 0.09, { type: 'triangle', vol: 0.3, f1: 120 });
  },
  mine(d, t) {
    const k = rnd(0.95, 1.06);
    [[1870, 0.12, 0.3], [2810, 0.08, 0.22], [4120, 0.05, 0.15]].forEach(([f, v, l]) => tone(d, f * k, t, l, { vol: v }));
    noise(d, t, 0.04, { vol: 0.45, ftype: 'highpass', freq: 2500 });
    noise(d, t + 0.02, 0.15, { vol: 0.12, ftype: 'lowpass', freq: 700, pink: true }); // falling grit
  },
  fish(d, t) {
    noise(d, t, 0.45, { vol: 0.35, ftype: 'bandpass', freq: 1800, f1: 350, q: 0.8, attack: 0.01 });
    tone(d, 380, t + 0.05, 0.12, { vol: 0.12, f1: 900 });
    tone(d, 520, t + 0.18, 0.1, { vol: 0.08, f1: 1100 });
  },
  splash(d, t) { SFX.fish(d, t); },
  fire(d, t) {
    for (let i = 0; i < 7; i++) noise(d, t + rnd(0, 0.6), rnd(0.01, 0.03), { vol: rnd(0.15, 0.45), ftype: 'highpass', freq: rnd(1500, 5000) });
    noise(d, t, 0.7, { vol: 0.08, ftype: 'lowpass', freq: 500, pink: true, attack: 0.1 });
  },
  cook(d, t) {
    const n = noise(d, t, 0.9, { vol: 0.16, ftype: 'highpass', freq: 3800, attack: 0.05, q: 0.5 });
    for (let i = 0; i < 5; i++) noise(d, t + rnd(0, 0.8), 0.02, { vol: 0.2, ftype: 'highpass', freq: 6000 });
    return n;
  },
  smith(d, t) {
    const k = rnd(0.98, 1.03);
    [[820, 0.16, 0.9], [1243, 0.11, 0.7], [1760, 0.09, 0.5], [2390, 0.06, 0.4], [3150, 0.04, 0.3]].forEach(([f, v, l]) => tone(d, f * k, t, l, { vol: v }));
    noise(d, t, 0.03, { vol: 0.5, ftype: 'highpass', freq: 2000 });
  },
  craft(d, t) {
    noise(d, t, 0.05, { vol: 0.25, ftype: 'bandpass', freq: rnd(1500, 2500), q: 2 });
    tone(d, rnd(500, 700), t, 0.06, { type: 'triangle', vol: 0.1 });
  },
  pray(d, t) {
    for (const [m, dl] of [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36]]) tone(d, mtof(m), t + dl, 1.8, { type: 'sine', vol: 0.08, attack: 0.25 });
    tone(d, mtof(60), t, 2.2, { type: 'triangle', vol: 0.06, attack: 0.4 });
  },
  eat(d, t) {
    for (let i = 0; i < 3; i++) noise(d, t + i * 0.16 + rnd(0, 0.03), 0.08, { vol: 0.35, ftype: 'lowpass', freq: rnd(900, 1600), q: 2 });
  },
  drink(d, t) {
    for (let i = 0; i < 3; i++) tone(d, rnd(300, 420), t + i * 0.22, 0.12, { vol: 0.15, f1: rnd(600, 800) });
  },
  bank(d, t) {
    noise(d, t, 0.06, { vol: 0.3, ftype: 'lowpass', freq: 900 });
    bell(d, mtof(84), t + 0.05, 0.9, 0.08);
    bell(d, mtof(91), t + 0.17, 1.1, 0.06);
  },
  door(d, t) {
    tone(d, 95, t, 0.55, { type: 'sawtooth', vol: 0.07, f1: 150, filter: 700, q: 6, attack: 0.08, vib: 0.03, vibRate: 13 });
    noise(d, t + 0.5, 0.18, { vol: 0.45, ftype: 'lowpass', freq: 400, pink: true });
    tone(d, 70, t + 0.5, 0.2, { vol: 0.3, f1: 45 });
  },
  coins(d, t) {
    for (let i = 0; i < 5; i++) { const tt = t + i * rnd(0.04, 0.08); tone(d, rnd(3800, 5200), tt, 0.12, { vol: 0.05 }); tone(d, rnd(2400, 3000), tt, 0.09, { vol: 0.04 }); }
  },
  click(d, t) { tone(d, 1900, t, 0.025, { type: 'square', vol: 0.025, filter: 3000 }); },
  teleport(d, t) {
    tone(d, 300, t, 0.9, { type: 'triangle', vol: 0.12, f1: 1800, glide: 0.8, vib: 0.04, vibRate: 9 });
    noise(d, t, 0.9, { vol: 0.12, ftype: 'bandpass', freq: 600, f1: 5000, attack: 0.3 });
  },
  attack(d, t) { noise(d, t, 0.12, { vol: 0.12, ftype: 'bandpass', freq: 1800, f1: 900, attack: 0.03 }); },
  pick(d, t) { noise(d, t, 0.07, { vol: 0.2, ftype: 'bandpass', freq: 2500, q: 1.5 }); },
  farm(d, t) { noise(d, t, 0.15, { vol: 0.25, ftype: 'lowpass', freq: 700, pink: true }); },
};

// Plays a sound effect by id. opts: { vol, pan, bus }
export function sfx(id, opts = {}) {
  atmo.log.push(id); if (atmo.log.length > 60) atmo.log.shift();
  if (!ready() || !SFX[id] || voices >= MAX_VOICES) return false;
  voices++;
  setTimeout(() => voices--, 1500);
  try { SFX[id](out(opts.bus || A.sfx, opts.vol ?? 1, opts.pan || 0, 8), A.ctx.currentTime + 0.01); } catch (e) { console.error('sfx', id, e); }
  return true;
}
export { rnd };
