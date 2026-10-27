// Animated canals: one plane per chunk just above the ground, masked to the water polygons, with chunky
// low-poly facets that shimmer and drift. Bridges and quay edges are cut out of the mask.
import * as THREE from 'three';
import { atmo, trackChunk } from './common.js';
import { CHUNK } from '/shared/geo.js';

const ROAD_W = { motorway: 12, trunk: 11, primary: 10, secondary: 9, tertiary: 7, unclassified: 6, residential: 6, living_street: 5, service: 4, pedestrian: 5, footway: 2.5, path: 2, cycleway: 2.5, steps: 2.5, track: 3 };
const lin = s => new THREE.Color(s);

export const uniforms = {
  uTime: { value: 0 }, uDay: { value: 1 }, uLamp: { value: 0 }, uRain: { value: 0 },
  uDeep: { value: lin('#2c5480') }, uLight: { value: lin('#6391c0') }, uSpark: { value: lin('#e8f4ff') },
  ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
};

const VERT = `
#include <fog_pars_vertex>
varying vec2 vUv;
varying vec3 vW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = `
uniform sampler2D uMask;
uniform float uTime, uDay, uLamp, uRain;
uniform vec3 uDeep, uLight, uSpark;
varying vec2 vUv;
varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  if (texture2D(uMask, vUv).a < 0.5) discard;
  // facets: each 1.6 m cell is split into two triangles that are shaded flat
  vec2 p = vW.xz / 1.6;
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 id = cell + (f.x + f.y > 1.0 ? vec2(0.66) : vec2(0.33));
  vec2 c = id * 1.6;
  float t = uTime;
  float w = sin(c.x * 0.33 + t * 0.8) * sin(c.y * 0.41 - t * 0.6) + 0.55 * sin((c.x - c.y) * 0.52 + t * 1.25) + 0.25 * sin(c.y * 1.1 + t * 2.1);
  float band = floor(clamp(w * 0.32 + 0.5, 0.0, 0.999) * 4.0) / 3.0;
  vec3 col = mix(uDeep, uLight, band * 0.6);
  // drifting sparkles of sky light, more of them in the rain (raindrop rings)
  float s = h21(id + floor(t * 0.7 + h21(id) * 5.0));
  float thr = mix(0.99, 0.95, uRain);
  if (s > thr) col = mix(col, uSpark, 0.3 * max(uDay, 0.3));
  col *= mix(0.16, 1.0, uDay);
  // warm lamplight caught on the ripples at night (colours are linear here, so keep it small)
  col += vec3(0.014, 0.008, 0.002) * uLamp * band;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const geo = new THREE.PlaneGeometry(CHUNK, CHUNK).rotateX(-Math.PI / 2);

function ringPath(g, r) { g.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]); g.closePath(); }

export function waterDecorator(chunk, d, group, T, ctx) {
  if (!d.w?.length || !ctx?.renderer) return;
  const x0 = chunk.cx * CHUNK, z0 = chunk.cz * CHUNK;
  // remember the canals for the water-lapping ambience
  const box = r => { let a = Infinity, b = -Infinity, c = Infinity, e = -Infinity; for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i]); b = Math.max(b, r[i]); c = Math.min(c, r[i + 1]); e = Math.max(e, r[i + 1]); } return [a + x0, b + x0, c + z0, e + z0]; };
  const key = chunk.cx + ',' + chunk.cz;
  atmo.water.set(key, d.w.map(rings => {
    const bbs = rings.map(box);
    return { bb: bbs.reduce((p, q) => [Math.min(p[0], q[0]), Math.max(p[1], q[1]), Math.min(p[2], q[2]), Math.max(p[3], q[3])]), rings: rings.map(r => r.map((v, i) => v + (i % 2 ? z0 : x0))) };
  }));
  // mask: 1 px per metre
  const cv = document.createElement('canvas');
  cv.width = cv.height = CHUNK;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff';
  for (const rings of d.w) { g.beginPath(); for (const r of rings) ringPath(g, r); g.fill('evenodd'); }
  g.globalCompositeOperation = 'destination-out';
  g.strokeStyle = '#000'; g.lineWidth = 1.6; g.lineJoin = 'round';
  for (const rings of d.w) { g.beginPath(); for (const r of rings) ringPath(g, r); g.stroke(); }
  g.fillStyle = '#000';
  for (const rings of d.ba || []) { g.beginPath(); for (const r of rings) ringPath(g, r); g.fill('evenodd'); }
  g.lineCap = 'round';
  for (const [kind, bridge, , co] of d.r || []) {
    if (!bridge) continue;
    g.lineWidth = (ROAD_W[kind] || 3) + 1;
    g.beginPath(); g.moveTo(co[0], co[1]); for (let i = 2; i < co.length; i += 2) g.lineTo(co[i], co[i + 1]); g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...uniforms, uMask: { value: tex } }, vertexShader: VERT, fragmentShader: FRAG, fog: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x0 + CHUNK / 2, 0.05, z0 + CHUNK / 2);
  mesh.renderOrder = 1;
  const scene = ctx.renderer.scene;
  scene.add(mesh);
  trackChunk(chunk, () => { scene.remove(mesh); mat.dispose(); tex.dispose(); atmo.water.delete(key); });
}

export function waterFrame(now) {
  const L = atmo.light;
  uniforms.uTime.value = now / 1000;
  uniforms.uDay.value = Math.max(L.day * (1 - L.rain * 0.3), 0);
  uniforms.uLamp.value = L.lamp;
  uniforms.uRain.value = L.rain;
}
