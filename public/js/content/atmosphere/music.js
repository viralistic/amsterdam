// Procedural chiptune music: each track is a key, mode, chord plan and seed; the melody is generated once
// (deterministically) and looped by a look-ahead scheduler. Tracks unlock by visiting their regions.
import { registry } from '../../registry.js';
import { A, ready, tone, noise, mtof, onAudioReady } from './audio.js';
import { atmo, settings, saveSettings, store, css, onSettings } from './common.js';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
};

// chords are scale degrees (0 = tonic). meter: eighth notes per bar (8 = 4/4, 6 = 3/4).
export const TRACKS = [
  { id: 'harbour_lights', name: 'Harbour Lights', where: 'Amsterdam Centraal', regions: ['centraal'], types: ['hub'], root: 60, mode: 'major', bpm: 108, seed: 11, lead: 'square', bass: 'walk', harm: 'arp', drums: 'light', A: [0, 4, 5, 3, 0, 4, 3, 4], B: [3, 0, 5, 4, 3, 0, 1, 4] },
  { id: 'dam_waltz', name: 'Dam Square Waltz', where: 'Dam Square', regions: ['dam'], root: 65, mode: 'major', bpm: 132, meter: 6, seed: 23, lead: 'flute', bass: 'waltz', harm: 'pad', drums: 'none', A: [0, 0, 3, 4, 0, 5, 1, 4], B: [3, 3, 0, 5, 1, 4, 0, 0] },
  { id: 'gable_steps', name: 'Gable Steps', where: 'the city streets', types: ['city'], root: 62, mode: 'dorian', bpm: 96, seed: 37, lead: 'pluck', bass: 'walk', harm: 'pad', drums: 'light', A: [0, 3, 0, 4, 0, 3, 6, 0], B: [5, 3, 0, 4, 5, 3, 4, 4] },
  { id: 'lantern_hour', name: 'Lantern Hour', where: 'the city at night', night: true, root: 57, mode: 'minor', bpm: 76, seed: 41, lead: 'flute', bass: 'root', harm: 'pad', drums: 'none', A: [0, 5, 2, 6, 0, 5, 3, 4], B: [3, 0, 5, 4, 3, 2, 6, 0] },
  { id: 'old_church', name: 'Under the Old Church', where: 'De Wallen', regions: ['wallen', 'westerkerk'], root: 64, mode: 'dorian', bpm: 88, seed: 53, lead: 'pluck', bass: 'root', harm: 'bells', drums: 'none', A: [0, 6, 3, 0, 0, 6, 4, 0], B: [3, 4, 0, 5, 3, 6, 4, 4] },
  { id: 'jordaan_lilt', name: 'Jordaan Lilt', where: 'the Jordaan', regions: ['jordaan', 'albertcuyp', 'pijp'], root: 67, mode: 'major', bpm: 144, meter: 6, seed: 61, lead: 'square', bass: 'waltz', harm: 'arp', drums: 'none', A: [0, 4, 4, 0, 3, 0, 4, 0], B: [3, 3, 0, 5, 1, 4, 0, 0] },
  { id: 'vondel_morning', name: 'Vondel Morning', where: 'the parks', types: ['park'], root: 67, mode: 'major', bpm: 84, seed: 71, lead: 'flute', bass: 'root', harm: 'arp', drums: 'none', A: [0, 3, 0, 4, 5, 3, 1, 4], B: [3, 4, 2, 5, 3, 0, 4, 0] },
  { id: 'menagerie', name: 'Menagerie', where: 'Artis', regions: ['artis'], root: 65, mode: 'mixolydian', bpm: 116, seed: 83, lead: 'pluck', bass: 'bounce', harm: 'arp', drums: 'light', A: [0, 6, 3, 0, 0, 6, 4, 4], B: [3, 3, 0, 0, 6, 6, 4, 0] },
  { id: 'busy_hands', name: 'Busy Hands', where: 'the skilling areas', types: ['skilling'], root: 57, mode: 'dorian', bpm: 104, seed: 97, lead: 'square', bass: 'bounce', harm: 'arp', drums: 'light', A: [0, 3, 6, 4, 0, 3, 6, 0], B: [5, 6, 0, 3, 5, 6, 4, 4] },
  { id: 'gasworks', name: 'Gasworks', where: 'Westergasfabriek', regions: ['westergasfabriek'], root: 52, mode: 'harmonic', bpm: 112, seed: 101, lead: 'square', bass: 'ostinato', harm: 'pad', drums: 'march', A: [0, 0, 5, 4, 0, 0, 3, 4], B: [5, 3, 0, 4, 5, 6, 4, 4] },
  { id: 'across_the_ij', name: 'Across the IJ', where: 'Amsterdam-Noord', regions: ['noord', 'adam', 'scheepvaart', 'nemo'], root: 62, mode: 'mixolydian', bpm: 100, seed: 113, lead: 'flute', bass: 'walk', harm: 'arp', drums: 'light', A: [0, 6, 3, 0, 0, 4, 6, 0], B: [3, 0, 6, 3, 4, 3, 6, 0] },
  { id: 'zuidoost_dusk', name: 'Zuidoost Dusk', where: 'the Wilderness', types: ['wild'], root: 50, mode: 'phrygian', bpm: 126, seed: 127, lead: 'square', bass: 'ostinato', harm: 'pad', drums: 'tense', A: [0, 1, 0, 6, 0, 1, 5, 4], B: [5, 4, 1, 0, 5, 6, 1, 0] },
  { id: 'cellar_damp', name: 'Cellar Damp', where: 'interiors and dungeons', types: ['interior'], root: 52, mode: 'minor', bpm: 70, seed: 131, lead: 'pluck', bass: 'drone', harm: 'pad', drums: 'none', A: [0, 0, 5, 5, 3, 3, 4, 4], B: [5, 3, 0, 6, 5, 3, 4, 0] },
];
const BY_ID = Object.fromEntries(TRACKS.map(t => [t.id, t]));

// ---- melody generation (seeded, so a track always sounds the same)
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const RHYTHM = {
  8: [[2, 2, 2, 2], [3, 1, 2, 2], [2, 1, 1, 4], [1, 1, 2, 1, 1, 2], [2, 2, 4], [3, 1, 4], [1, 1, 1, 1, 2, 2], [2, 1, 1, 2, 2]],
  6: [[2, 2, 2], [3, 1, 2], [2, 1, 1, 2], [4, 2], [1, 1, 2, 2], [2, 4]],
};
const END = { 8: [[4, 4], [2, 2, 4], [6, 2]], 6: [[6], [4, 2], [2, 4]] };

function compose(tr) {
  const r = rng(tr.seed), meter = tr.meter || 8;
  const pick = a => a[Math.floor(r() * a.length)];
  const chordTones = deg => [deg, deg + 2, deg + 4];
  // degrees in scale-step space (7 = octave above tonic)
  const nearestChordTone = (cur, deg, jump) => {
    const opts = [];
    for (const o of [-7, 0, 7]) for (const c of chordTones(deg)) opts.push(c + o);
    opts.sort((a, b) => Math.abs(a - cur - jump) - Math.abs(b - cur - jump));
    return Math.max(-2, Math.min(11, opts[0]));
  };
  const bar = (rh, deg, start, nextDeg, last) => {
    const notes = [];
    let pos = 0, cur = start;
    rh.forEach((len, i) => {
      if (i === 0 || pos % 2 === 0) cur = nearestChordTone(cur, deg, Math.round((r() - 0.5) * 4));
      else cur += r() < 0.5 ? 1 : -1;
      if (last && i === rh.length - 1) cur = nearestChordTone(cur, nextDeg, 0);
      notes.push({ pos, len, deg: cur });
      pos += len;
    });
    return { notes, end: cur };
  };
  const section = (chords, lift) => {
    const rA = pick(RHYTHM[meter]), rB = pick(RHYTHM[meter]), rC = pick(RHYTHM[meter]);
    const bars = [];
    let cur = 4 + lift;
    const make = (i, rh, last) => { const b = bar(rh, chords[i], cur, chords[(i + 1) % 8], last); cur = b.end; return b.notes; };
    bars[0] = make(0, rA); bars[1] = make(1, rB); bars[2] = make(2, rA); bars[3] = make(3, pick(END[meter]), true);
    // answer phrase: repeat the opening, then a new ending that resolves to the tonic
    bars[4] = bars[0]; bars[5] = bars[1]; cur = bars[5][bars[5].length - 1].deg;
    bars[6] = make(6, rC);
    const fin = bar(pick(END[meter]), chords[7], cur, 0, true).notes;
    if (chords[7] === 0) fin[fin.length - 1].deg = cur > 3 ? 7 : 0;
    bars[7] = fin;
    return bars;
  };
  return [...section(tr.A, 0), ...section(tr.B, 2)];
}

const pitch = (tr, deg, oct = 0) => {
  const sc = SCALES[tr.mode];
  const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
  return tr.root + sc[i] + 12 * (o + oct);
};

// ---- instruments
function lead(tr, dest, f, t, d, v) {
  if (tr.lead === 'square') { tone(dest, f, t, d * 0.95, { type: 'square', vol: 0.05 * v, filter: 2200, attack: 0.01, sustain: true, release: 0.06 }); tone(dest, f, t, d * 0.95, { type: 'triangle', vol: 0.05 * v, sustain: true, release: 0.06 }); }
  else if (tr.lead === 'flute') tone(dest, f, t, d * 0.97, { type: 'triangle', vol: 0.13 * v, attack: 0.05, sustain: true, release: 0.1, vib: 0.006, vibRate: 5 });
  else { tone(dest, f, t, Math.max(0.4, d * 1.6), { type: 'triangle', vol: 0.14 * v, attack: 0.004 }); tone(dest, f * 2, t, 0.25, { type: 'sine', vol: 0.04 * v }); }
}
function chordVoice(tr, dest, deg, t, d, step, meter) {
  const notes = [0, 2, 4].map(k => mtof(pitch(tr, deg + k, -1)));
  if (tr.harm === 'pad') { if (step === 0) for (const f of notes) { tone(dest, f, t, d, { type: 'sawtooth', vol: 0.018, filter: 900, attack: 0.3, sustain: true, release: 0.4 }); } }
  else if (tr.harm === 'bells') { if (step === 0 || step === meter / 2) for (const f of notes) tone(dest, f * 2, t, 1.6, { type: 'sine', vol: 0.03 }); }
  else { const f = notes[[0, 1, 2, 1][step % 4]] * 2; tone(dest, f, t, 0.3, { type: 'triangle', vol: 0.035, attack: 0.004 }); }
}
function bassVoice(tr, dest, deg, nextDeg, t, eighth, step, meter) {
  const root = mtof(pitch(tr, deg, -2)), fifth = mtof(pitch(tr, deg + 4, -2));
  const b = (f, d, v = 0.16) => tone(dest, f, t, d, { type: 'triangle', vol: v, attack: 0.008 });
  switch (tr.bass) {
    case 'root': if (step === 0) b(root, eighth * meter * 0.9); else if (step === meter / 2 + (meter === 8 ? 0 : 1)) b(fifth, eighth * 3); break;
    case 'drone': if (step === 0) b(root, eighth * meter, 0.13); break;
    case 'waltz': if (step === 0) b(root, eighth * 1.8); else if (step === 2 || step === 4) tone(dest, mtof(pitch(tr, deg + (step === 2 ? 2 : 4), -1)), t, eighth * 1.2, { type: 'triangle', vol: 0.05 }); break;
    case 'ostinato': b(step % 2 ? root * 2 : root, eighth * 0.9, 0.13); break;
    case 'bounce': if (step % 2 === 0) b(step % 4 === 0 ? root : fifth, eighth * 1.6); break;
    default: { // walking quarters, approaching the next chord
      if (step % 2) break;
      const q = step / 2;
      const f = q === 0 ? root : q === 1 ? mtof(pitch(tr, deg + 2, -2)) : q === 2 ? fifth : mtof(pitch(tr, nextDeg, -2) + (Math.random() < 0.5 ? -1 : 1));
      b(f, eighth * 1.8);
    }
  }
}
function drumVoice(tr, dest, t, step, meter) {
  const kick = () => tone(dest, 130, t, 0.16, { vol: 0.3, f1: 45 });
  const hat = (v = 0.05) => noise(dest, t, 0.03, { vol: v, ftype: 'highpass', freq: 7000 });
  const snare = () => { noise(dest, t, 0.12, { vol: 0.12, ftype: 'bandpass', freq: 1900, q: 0.8 }); tone(dest, 190, t, 0.06, { type: 'triangle', vol: 0.06 }); };
  if (tr.drums === 'light') { if (step === 0) kick(); if (step % 2 === 1) hat(0.03); if (meter === 8 && step === 4) snare(); }
  else if (tr.drums === 'march') { if (step === 0 || step === 4) kick(); if (step === 2 || step === 6) snare(); hat(0.02); }
  else if (tr.drums === 'tense') { if (step === 0 || step === 3 || step === 6) kick(); if (step === 4) snare(); if (step % 2) hat(0.025); }
}

// ---- player
const P = { cur: null, gain: null, step: 0, next: 0, timer: null, comp: null, manual: null };
const LOOK = 0.18;

function schedule() {
  if (!ready() || !P.cur) return;
  const tr = P.cur, meter = tr.meter || 8, eighth = 30 / tr.bpm, bars = P.comp;
  if (P.next < A.ctx.currentTime - 0.5) P.next = A.ctx.currentTime + 0.05; // after a suspend
  while (P.next < A.ctx.currentTime + LOOK) {
    const total = bars.length * meter, s = P.step % total;
    const bi = Math.floor(s / meter), step = s % meter;
    const chords = bi < 8 ? tr.A : tr.B, deg = chords[bi % 8], nextDeg = chords[(bi + 1) % 8];
    const t = P.next;
    for (const n of bars[bi]) if (n.pos === step) lead(tr, P.gain, mtof(pitch(tr, n.deg)), t, n.len * eighth, 1);
    chordVoice(tr, P.gain, deg, t, eighth * meter, step, meter);
    bassVoice(tr, P.gain, deg, nextDeg, t, eighth, step, meter);
    drumVoice(tr, P.gain, t, step, meter);
    P.step++;
    // light swing for the waltzes and the park track
    P.next += eighth * (tr.meter === 6 || tr.id === 'vondel_morning' ? (step % 2 ? 0.9 : 1.1) : 1);
  }
}

export function playTrack(id) {
  const tr = BY_ID[id];
  if (!tr) return;
  unlock(id);
  if (P.cur === tr && P.gain) return;
  stopMusic(1.2);
  P.cur = tr; P.comp = compose(tr); P.step = 0;
  atmo.music = { playing: tr.id };
  drawTab();
  if (!ready()) return; // starts once audio is allowed
  startVoice();
}
function startVoice() {
  if (!P.cur || !A.ctx) return;
  P.gain = A.ctx.createGain();
  P.gain.gain.setValueAtTime(0.0001, A.ctx.currentTime);
  P.gain.gain.exponentialRampToValueAtTime(1, A.ctx.currentTime + 1.5);
  P.gain.connect(A.music);
  P.next = A.ctx.currentTime + 0.1;
  clearInterval(P.timer);
  P.timer = setInterval(() => { try { schedule(); } catch (e) { console.error('music', e); clearInterval(P.timer); } }, 40);
  schedule();
}
export function stopMusic(fade = 0.8) {
  clearInterval(P.timer); P.timer = null;
  const g = P.gain;
  if (g && A.ctx) { g.gain.cancelScheduledValues(A.ctx.currentTime); g.gain.setTargetAtTime(0.0001, A.ctx.currentTime, fade / 4); setTimeout(() => { try { g.disconnect(); } catch {} }, fade * 1000 + 600); }
  P.gain = null; P.cur = null;
  atmo.music = { playing: null };
}
onAudioReady(() => { if (P.cur && !P.gain && settings.musicOn) startVoice(); });

// ---- unlocks
const UKEY = 'atmo.music.unlocked';
let unlocked = null;
function unlocks() { if (!unlocked) { try { unlocked = new Set(JSON.parse(store().get(UKEY) || '[]')); } catch { unlocked = new Set(); } } return unlocked; }
function unlock(id) {
  const u = unlocks();
  if (u.has(id)) return;
  u.add(id);
  store().set(UKEY, JSON.stringify([...u]));
  if (u.size > 1) registry.ctx?.chat(`You have unlocked a new music track: ${BY_ID[id].name}.`, 'level');
}

export function trackFor(region, night) {
  if (!region) return null;
  const id = String(region.id || '');
  const type = region.wild ? 'wild' : region.type;
  const byRegion = TRACKS.find(t => t.regions?.includes(id));
  if (byRegion && type !== 'interior') return byRegion.id;
  if (night && (type === 'city' || type === 'hub')) return 'lantern_hour';
  return (TRACKS.find(t => t.types?.includes(type)) || BY_ID.gable_steps).id;
}

let lastAuto = null;
export function autoMusic(region, night) {
  const id = trackFor(region, night);
  if (!id) return;
  unlock(id);
  if (!settings.musicOn || !settings.musicAuto) { drawTab(); return; }
  if (id !== lastAuto || !P.cur) { lastAuto = id; playTrack(id); }
}
onSettings(() => { if (!settings.musicOn && P.cur) stopMusic(); });

// ---- Music tab
css('atmo-music-css', `
#tab-music .mu-now { color: #ff981f; font-size: 12px; margin: 2px 0 6px; text-align: center; }
#tab-music .mu-list { background: #1e1912; border: 1px solid #000; height: 128px; overflow-y: auto; padding: 3px 5px; }
#tab-music .mu-list div { font-size: 12px; padding: 1px 0; cursor: pointer; color: #ff2a2a; text-shadow: 1px 1px 0 #000; }
#tab-music .mu-list div.on { color: #2ae02a; }
#tab-music .mu-list div.cur { color: #ffff00; }
#tab-music .mu-btns { display: flex; gap: 4px; margin: 4px 0; }
#tab-music .note { margin: 3px 0; }
#tab-music .mu-btns button { flex: 1; min-width: 0; padding: 5px 2px; }
#tab-music .mu-btns button.sel { color: #ffff00; }
#tab-music label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ff981f; }
#tab-music input[type=range] { flex: 1; accent-color: #ff981f; }
`);
let tabEl = null;
function drawTab() {
  if (!tabEl) return;
  const u = unlocks();
  const cur = P.cur?.id;
  tabEl.innerHTML = `
    <div class="mu-now">${cur ? 'Now playing: ' + BY_ID[cur].name : 'Music stopped'}</div>
    <div class="mu-list">${[...TRACKS].sort((a, b) => a.name.localeCompare(b.name)).map(t => `<div data-id="${t.id}" class="${u.has(t.id) ? 'on' : ''} ${t.id === cur ? 'cur' : ''}" title="${u.has(t.id) ? 'Click to play' : 'Unlocked by visiting ' + t.where}">${t.name}</div>`).join('')}</div>
    <div class="note">${u.size} of ${TRACKS.length} tracks unlocked.</div>
    <div class="mu-btns"><button class="stone ${settings.musicAuto ? 'sel' : ''}" data-b="auto">Auto</button><button class="stone ${!settings.musicAuto ? 'sel' : ''}" data-b="manual">Manual</button><button class="stone" data-b="toggle">${P.cur ? 'Stop' : 'Play'}</button></div>
    <label>Volume <input type="range" min="0" max="1" step="0.05" value="${settings.music}" data-v="music"></label>`;
  tabEl.querySelectorAll('.mu-list div').forEach(d => d.onclick = () => {
    if (!u.has(d.dataset.id)) { registry.ctx?.chat(`You haven't unlocked this track yet. It plays in ${BY_ID[d.dataset.id].where}.`); return; }
    settings.musicAuto = false; settings.musicOn = true; saveSettings();
    playTrack(d.dataset.id);
  });
  tabEl.querySelectorAll('[data-b]').forEach(b => b.onclick = () => {
    const k = b.dataset.b;
    if (k === 'auto') { settings.musicAuto = true; settings.musicOn = true; saveSettings(); lastAuto = null; autoMusic(atmo.region, atmo.light.lamp > 0.6); }
    if (k === 'manual') { settings.musicAuto = false; saveSettings(); }
    if (k === 'toggle') {
      if (P.cur) { settings.musicOn = false; saveSettings(); stopMusic(); }
      else { settings.musicOn = true; saveSettings(); const id = settings.musicAuto ? trackFor(atmo.region, atmo.light.lamp > 0.6) : (lastManual() || trackFor(atmo.region)); if (id) playTrack(id); }
    }
    drawTab();
  });
  const sl = tabEl.querySelector('[data-v=music]');
  sl.oninput = () => { settings.music = +sl.value; saveSettings(); };
}
const lastManual = () => [...unlocks()].pop();

registry.tabs.push({ id: 'music', icon: 'atmo_music', title: 'Music player', render(el) { tabEl = el; drawTab(); } });
registry.iconDrawers.atmo_music = g => {
  g.fillStyle = '#e8d8a0';
  g.fillRect(12, 6, 3, 18); g.fillRect(26, 3, 3, 18);
  g.beginPath(); g.moveTo(12, 6); g.lineTo(29, 2); g.lineTo(29, 7); g.lineTo(12, 11); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(10, 25, 5, 4, -0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(24, 22, 5, 4, -0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#b8a060'; g.fillRect(8, 26, 4, 2); g.fillRect(22, 23, 4, 2);
};
atmo.playTrack = playTrack;
atmo.stopMusic = stopMusic;
atmo.tracks = TRACKS;
atmo.compose = id => compose(BY_ID[id]);
