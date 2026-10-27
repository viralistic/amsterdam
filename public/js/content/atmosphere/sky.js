// Day/night lighting from the real sun over Amsterdam, weather (rain streaks, mist), street-lamp lights and
// glowing canal-house windows at night.
import * as THREE from 'three';
import { atmo, settings, clamp, smooth, lerp, hash, worldDate, sunPosition, amsParts } from './common.js';

const C = (s) => new THREE.Color(s);
const PAL = {
  skyDay: C('#dfe8f0'), skyNight: C('#5c6fa4'), skyDusk: C('#ffc898'),
  gndDay: C('#5a5040'), gndNight: C('#2c2c3c'),
  sunDay: C('#fff4e0'), sunDusk: C('#ff9a55'), moon: C('#a8bce8'),
  fogDay: C('#000000'), fogNight: C('#02040a'), fogDusk: C('#140a10'),
  mistDay: C('#7a8088'), mistNight: C('#191d24'), rainDay: C('#232a33'), rainNight: C('#07090d'),
};

let S = null; // scene state, set up on first frame
const tmp = new THREE.Color(), tmp2 = new THREE.Color();

function setup(r) {
  const scene = r.scene;
  const hemi = scene.children.find(o => o.isHemisphereLight);
  const sun = scene.children.find(o => o.isDirectionalLight);
  // a few warm point lights follow the street lamps nearest the player at night (fixed count: no shader recompiles)
  const lamps = [];
  for (let i = 0; i < 3; i++) { const l = new THREE.PointLight('#ffb15a', 0, 15, 1.2); l.position.set(0, -50, 0); scene.add(l); lamps.push(l); }
  // rain: short line streaks in a box that follows the camera
  const N = 1400;
  const pos = new Float32Array(N * 6);
  const drops = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { drops[i * 3] = Math.random() * 60 - 30; drops[i * 3 + 1] = Math.random() * 26; drops[i * 3 + 2] = Math.random() * 60 - 30; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#9fb0c4', transparent: true, opacity: 0.5, fog: true, depthWrite: false }));
  rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 5;
  scene.add(rain);
  S = { r, scene, hemi, sun, lamps, rain, drops, N, base: { hemi: hemi?.intensity ?? 1.6, sun: sun?.intensity ?? 1.6, near: scene.fog?.near ?? 70, far: scene.fog?.far ?? 150 }, weather: { rain: 0, mist: 0 }, lastLampPick: 0, lastT: 0 };
}

// ---- weather: the same for everyone, from 25-minute slots of real time
const SLOT = 25 * 60e3;
function weatherAt(ms) {
  const slot = Math.floor(ms / SLOT);
  const h = hash(slot, 9173), h2 = hash(slot, 311);
  const hr = amsParts(new Date(ms)).hour;
  const mistChance = hr >= 4 && hr <= 9 ? 0.28 : 0.08;
  if (h < 0.22) return { kind: 'rain', rain: 0.45 + h2 * 0.55, mist: 0.15 };
  if (h < 0.22 + mistChance) return { kind: 'mist', rain: 0, mist: 0.6 + h2 * 0.4 };
  return { kind: 'clear', rain: 0, mist: 0 };
}
function targetWeather() {
  const f = atmo.forceWeather;
  if (f === 'rain') return { kind: 'rain', rain: 1, mist: 0.15 };
  if (f === 'mist' || f === 'fog') return { kind: 'mist', rain: 0, mist: 1 };
  if (f === 'clear') return { kind: 'clear', rain: 0, mist: 0 };
  if (!settings.weather) return { kind: 'clear', rain: 0, mist: 0 };
  return weatherAt(Date.now());
}

// ---- building windows: buildings.js owns the glow mask (matching its texture atlas) and which windows are lit;
// atmosphere only drives the shared building material's `emissive` colour with the night level.
let windowMat = null;
export function patchBuildings(group) {
  if (windowMat) return;
  group.traverse(o => {
    const m = o.material;
    if (!windowMat && o.isMesh && m?.isMeshLambertMaterial && m.emissiveMap && m.vertexColors && m.side === THREE.DoubleSide) windowMat = m;
  });
}

// ---- per frame
export function skyFrame(now, ctx) {
  const r = ctx?.renderer;
  if (!r) return;
  if (!S || S.r !== r) setup(r);
  const dtw = Math.min(1, (now - (S.lastT || now)) / 1000), dt = Math.min(0.1, dtw); S.lastT = now;
  const L = atmo.light;
  const inside = ctx.S.inside || atmo.region?.type === 'interior';

  // sun
  const date = worldDate();
  const sp = sunPosition(date);
  const elev = settings.daynight || atmo.forceHour !== null ? sp.elev : 35;
  const day = smooth(-5, 12, elev);
  const dusk = elev > -7 && elev < 16 ? clamp(1 - Math.abs(elev - 2) / 12) : 0;
  const lamp = 1 - smooth(-3, 5, elev);
  L.elev = elev; L.day = day; L.dusk = dusk; L.lamp = inside ? 0 : lamp; L.hour = amsParts(date).hour;

  // weather eases towards its target
  const tw = inside ? { kind: 'clear', rain: 0, mist: 0 } : targetWeather();
  const k = 1 - Math.exp(-dtw / (atmo.forceWeather ? 1.5 : 12));
  S.weather.rain = lerp(S.weather.rain, tw.rain, k);
  S.weather.mist = lerp(S.weather.mist, tw.mist, k);
  if (S.weather.rain < 1e-4) S.weather.rain = 0;
  if (S.weather.mist < 1e-4) S.weather.mist = 0;
  L.rain = S.weather.rain; L.mist = S.weather.mist; L.weather = tw.kind;

  const bright = settings.brightness || 1;
  const wet = L.rain * 0.45 + L.mist * 0.2;
  if (inside) {
    if (S.hemi) { S.hemi.color.copy(PAL.skyDay); S.hemi.groundColor.copy(PAL.gndDay); S.hemi.intensity = S.base.hemi * bright; }
    if (S.sun) { S.sun.color.copy(PAL.sunDay); S.sun.intensity = S.base.sun * bright; S.sun.position.set(-40, 80, 30); }
    if (S.scene.fog) { S.scene.fog.color.copy(PAL.fogDay); S.scene.fog.near = S.base.near; S.scene.fog.far = S.base.far; }
    if (S.scene.background?.isColor) S.scene.background.copy(PAL.fogDay);
  } else {
    if (S.hemi) {
      S.hemi.color.copy(PAL.skyNight).lerp(PAL.skyDay, day).lerp(PAL.skyDusk, dusk * 0.35);
      S.hemi.groundColor.copy(PAL.gndNight).lerp(PAL.gndDay, day);
      S.hemi.intensity = lerp(0.85, S.base.hemi, day) * (1 - wet * 0.5) * bright;
    }
    if (S.sun) {
      const sunUp = smooth(-3, 6, elev);
      S.sun.color.copy(PAL.moon).lerp(PAL.sunDay, sunUp).lerp(PAL.sunDusk, dusk * 0.6);
      S.sun.intensity = lerp(0.5, S.base.sun, sunUp) * (1 - wet * 0.75) * bright;
      // light from the sun's real direction (kept a bit above the horizon so faces stay readable); a fixed moon at night
      const e = (sunUp > 0.5 ? Math.max(14, elev) : 50) * Math.PI / 180, a = (sunUp > 0.5 ? sp.az : 200) * Math.PI / 180;
      S.sun.position.set(Math.sin(a) * Math.cos(e) * 100, Math.sin(e) * 100, -Math.cos(a) * Math.cos(e) * 100);
    }
    const fog = S.scene.fog;
    if (fog) {
      tmp.copy(PAL.fogNight).lerp(PAL.fogDay, day).lerp(PAL.fogDusk, dusk * 0.8);
      tmp2.copy(PAL.mistNight).lerp(PAL.mistDay, day);
      tmp.lerp(tmp2, L.mist);
      tmp2.copy(PAL.rainNight).lerp(PAL.rainDay, day);
      tmp.lerp(tmp2, L.rain * (1 - L.mist));
      fog.color.copy(tmp);
      fog.near = lerp(lerp(S.base.near, 58, L.rain), 16, L.mist);
      fog.far = lerp(lerp(S.base.far, 132, L.rain), 78, L.mist);
      if (S.scene.background?.isColor) S.scene.background.copy(tmp);
    }
  }

  // street lamps: move the point lights to the nearest lamps a few times a second
  const focus = r.focus;
  if (now - S.lastLampPick > 300) {
    S.lastLampPick = now;
    const best = [];
    if (L.lamp > 0.02) for (const arr of atmo.lamps.values()) for (let i = 0; i < arr.length; i += 2) {
      const d = (arr[i] - focus.x) ** 2 + (arr[i + 1] - focus.z) ** 2;
      if (d > 900) continue;
      best.push([d, arr[i], arr[i + 1]]);
    }
    best.sort((a, b) => a[0] - b[0]);
    S.lamps.forEach((l, i) => { const b = best[i]; if (b) l.position.set(b[1], 3.6, b[2]); else l.position.set(focus.x, -50, focus.z); l.userData.on = !!b; });
  }
  for (const l of S.lamps) l.intensity = l.userData.on ? L.lamp * 9 * bright : 0;

  if (windowMat) windowMat.emissive.setRGB(1, 0.78, 0.45).multiplyScalar(L.lamp * 0.85);

  // rain streaks
  const rainOn = L.rain > 0.02;
  S.rain.visible = rainOn;
  if (rainOn) {
    const n = Math.floor(S.N * clamp(L.rain));
    const pos = S.rain.geometry.attributes.position.array, dr = S.drops;
    const cx = focus.x, cz = focus.z, vy = 17, wx = 2.2, wz = 1.1;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      dr[j] += wx * dt; dr[j + 1] -= vy * dt; dr[j + 2] += wz * dt;
      if (dr[j + 1] < 0) { dr[j + 1] += 26; dr[j] = Math.random() * 60 - 30; dr[j + 2] = Math.random() * 60 - 30; }
      if (dr[j] > 30) dr[j] -= 60;
      if (dr[j + 2] > 30) dr[j + 2] -= 60;
      const x = cx + dr[j], y = dr[j + 1], z = cz + dr[j + 2], o = i * 6;
      pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
      pos[o + 3] = x - wx * 0.06; pos[o + 4] = y + vy * 0.06; pos[o + 5] = z - wz * 0.06;
    }
    S.rain.geometry.setDrawRange(0, n * 2);
    S.rain.geometry.attributes.position.needsUpdate = true;
    S.rain.material.color.copy(PAL.skyNight).lerp(C('#a8b8c8'), day);
    S.rain.material.opacity = 0.45 + 0.25 * day;
  }
}
