// Dev viewer for hand-built landmarks and the canal-house generator, with the game's lighting.
// /dev/viewer.html?lm=paleis&yaw=0.6&pitch=0.35&dist=120&y=10   or   ?houses=1   (drag to orbit, wheel to zoom)
import * as THREE from 'three';
import { BUILD, BAYS } from '../js/landmarks.js';
import { Builder } from '../js/landmarks/builder.js';
import { buildBuildings, facadeTexture } from '../js/buildings.js';
import { LANDMARK_MODELS } from '/shared/landmarks.js';

const q = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const gl = new THREE.WebGLRenderer({ canvas, antialias: true });
gl.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000');
scene.fog = new THREE.Fog('#000', 300, 700);
scene.add(new THREE.HemisphereLight('#dfe8f0', '#5a5040', 1.6));
const sun = new THREE.DirectionalLight('#fff4e0', 1.6); sun.position.set(-40, 80, 30); scene.add(sun);
const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 1500);

// ground: paving with a strip of canal in front, like a typical Amsterdam street
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#7d7466' }));
ground.position.y = -0.02; scene.add(ground);

let target = new THREE.Vector3(0, 8, 0), size = 60;
if (q.get('houses')) {
  // a synthetic canal street: narrow deep houses both sides, plus a few irregular and large footprints
  const list = [];
  const rect = (x, z, w, d) => [x, z, x + w, z, x + w, z + d, x, z + d, x, z];
  let x = -60, seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  while (x < 60) { const w = 5 + rnd() * 4; list.push([10 + rnd() * 7, Math.floor(rnd() * 997), rect(x, -22, w, 14 + rnd() * 6)]); x += w; }
  x = -60;
  while (x < 60) { const w = 5 + rnd() * 4; list.push([10 + rnd() * 7, Math.floor(rnd() * 997), rect(x, 8, w, 14 + rnd() * 6)]); x += w; }
  list.push([18, 11, [70, -20, 100, -20, 100, 10, 85, 18, 70, 10, 70, -20]]); // irregular block
  list.push([22, 12, rect(-110, -25, 40, 35)]); // big block
  scene.add(buildBuildings(list, 0, 0));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(240, 12).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#3d6690' }));
  water.position.set(0, 0.01, 1); scene.add(water);
  target.set(0, 6, 0); size = 70;
} else {
  const id = q.get('lm') || 'paleis';
  const l = LANDMARK_MODELS.find(l => l.id === id) || { id, w: 60, d: 40 };
  const b = new Builder(BAYS[id]);
  const group = new THREE.Group();
  BUILD[id]?.(b, THREE, group, l);
  group.add(new THREE.Mesh(b.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, map: facadeTexture() })));
  scene.add(group);
  const box = new THREE.Box3().setFromObject(group);
  box.getCenter(target); target.y = Math.min(target.y, 15);
  size = box.getSize(new THREE.Vector3()).length();
  let tris = 0; group.traverse(o => { if (o.geometry) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  document.getElementById('info').textContent = `${id}: ${Math.round(tris)} triangles`;
}
if (q.get('y')) target.y = +q.get('y');

let yaw = +(q.get('yaw') ?? 0.6), pitch = +(q.get('pitch') ?? 0.35), dist = +(q.get('dist') ?? size * 1.1);
function resize() { gl.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let drag = null;
canvas.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; };
onpointerup = () => { drag = null; };
onpointermove = e => { if (!drag) return; yaw = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.max(0.05, Math.min(1.5, drag.pitch + (e.clientY - drag.y) * 0.006)); };
canvas.onwheel = e => { dist *= e.deltaY > 0 ? 1.1 : 0.9; };
(function frame() {
  requestAnimationFrame(frame);
  cam.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  cam.lookAt(target);
  gl.render(scene, cam);
})();
window.__viewerReady = true;
