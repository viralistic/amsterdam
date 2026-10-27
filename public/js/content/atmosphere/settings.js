// "Sound & display" settings tab and the old-school world map overview of the regions.
import { registry } from '../../registry.js';
import { REGIONS, regionAt } from '/shared/regions.js';
import { CHUNK } from '/shared/geo.js';
import { atmo, settings, saveSettings, css, amsParts, playerPos } from './common.js';
import { sfx } from './audio.js';

css('atmo-settings-css', `
#tab-atmo .as-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; font-size: 12px; color: #ff981f; }
#tab-atmo .as-row span { width: 74px; }
#tab-atmo .as-row input[type=range] { flex: 1; min-width: 0; accent-color: #ff981f; }
#tab-atmo .as-row input[type=checkbox] { accent-color: #ff981f; }
#tab-atmo .as-info { font-size: 11px; color: #c8b896; margin: 6px 0; line-height: 1.4; }
#tab-atmo button.stone { width: 100%; margin-top: 6px; }
.atmo-map { position: relative; }
.atmo-map canvas { width: 100%; display: block; background: #d8c8a0; border: 2px solid #000; cursor: grab; touch-action: none; image-rendering: auto; }
.atmo-map .am-tools { display: flex; gap: 4px; margin: 6px 0 4px; }
.atmo-map .am-tools button { flex: 1; min-width: 0; padding: 4px; }
.atmo-map .am-info { min-height: 32px; font-size: 12px; color: #ff981f; }
.atmo-map .am-legend { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #c8b896; margin-top: 4px; }
.atmo-map .am-legend i { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; vertical-align: -1px; }
`);

const SLIDERS = [['master', 'Master'], ['music', 'Music'], ['sfx', 'Effects'], ['amb', 'Ambience'], ['brightness', 'Brightness', 0.6, 1.6]];
let el = null;
function draw() {
  if (!el) return;
  el.innerHTML = `
    ${SLIDERS.map(([k, label, min = 0, max = 1]) => `<label class="as-row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="0.05" value="${settings[k]}" data-k="${k}"></label>`).join('')}
    <label class="as-row"><input type="checkbox" data-c="weather" ${settings.weather ? 'checked' : ''}> Weather (rain and mist)</label>
    <label class="as-row"><input type="checkbox" data-c="daynight" ${settings.daynight ? 'checked' : ''}> Real Amsterdam day and night</label>
    <div class="as-info" id="atmo-clock"></div>
    <button class="stone" id="atmo-map-btn">World map overview</button>`;
  el.querySelectorAll('[data-k]').forEach(s => s.oninput = () => { settings[s.dataset.k] = +s.value; saveSettings(); });
  el.querySelectorAll('[data-c]').forEach(c => c.onchange = () => { settings[c.dataset.c] = c.checked; saveSettings(); });
  el.querySelector('#atmo-map-btn').onclick = () => showWorldMap(registry.ctx);
  clock();
}
function clock() {
  const c = el?.querySelector('#atmo-clock');
  if (!c) return;
  const p = amsParts();
  const L = atmo.light;
  const sky = L.elev > 6 ? 'Daytime' : L.elev > -6 ? (L.hour < 12 ? 'Dawn' : 'Dusk') : 'Night';
  const w = { rain: 'rain', mist: 'mist', clear: 'clear skies' }[L.weather] || 'clear skies';
  c.textContent = `Amsterdam time ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}. ${sky}, ${w}.${atmo.forceHour !== null ? ` (Forced hour ${atmo.forceHour})` : ''}`;
}
setInterval(() => { if (el && !el.hidden) clock(); }, 5000);

registry.tabs.push({ id: 'atmo', icon: 'atmo_settings', title: 'Sound & display', render(e) { el = e; draw(); } });
registry.iconDrawers.atmo_settings = g => {
  g.fillStyle = '#9a9aa2';
  g.fillRect(4, 12, 7, 10);
  g.beginPath(); g.moveTo(10, 12); g.lineTo(19, 4); g.lineTo(19, 30); g.lineTo(10, 22); g.closePath(); g.fill();
  g.fillStyle = '#6a6a72'; g.fillRect(4, 19, 7, 3);
  g.strokeStyle = '#e8d8a0'; g.lineWidth = 2.5;
  for (const r of [6, 11]) { g.beginPath(); g.arc(19, 17, r, -0.9, 0.9); g.stroke(); }
};

// ---- world map
const TYPE_COL = { hub: '#e0b030', city: '#b0603e', park: '#4f8a2a', skilling: '#3a7ab8', wild: '#a02020' };
const TYPE_NAME = { hub: 'Safe hub', city: 'City', park: 'Park', skilling: 'Skilling', wild: 'Wilderness' };
const mid = a => a.kind === 'circle' ? { x: a.x, z: a.z } : { x: (a.x0 + a.x1) / 2, z: (a.z0 + a.z1) / 2 };
// rough outlines of the IJ and the Amstel, in tiles (decoration only)
const IJ = [[-3600, -500], [-1800, -560], [-600, -480], [0, -430], [900, -470], [2000, -600], [3600, -850], [5200, -1000]];
const AMSTEL = [[230, 1200], [380, 1700], [500, 2300], [420, 3000], [380, 3800], [520, 4800], [700, 5600]];

export function showWorldMap(ctx) {
  if (!ctx) return;
  ctx.openWindow('World Map', `<div class="atmo-map"><canvas width="900" height="680"></canvas>
    <div class="am-tools"><button class="stone" data-z="in">Zoom in</button><button class="stone" data-z="out">Zoom out</button><button class="stone" data-z="me">Centre on me</button></div>
    <div class="am-info">Hover or tap a region to see what it is for.</div>
    <div class="am-legend">${Object.entries(TYPE_NAME).map(([k, n]) => `<span><i style="background:${TYPE_COL[k]}"></i>${n}</span>`).join('')}<span><i style="background:#fff"></i>You</span></div></div>`);
  sfx('click');
  const cv = document.querySelector('#window .atmo-map canvas');
  const info = document.querySelector('#window .atmo-map .am-info');
  const g = cv.getContext('2d');
  const me = playerPos(ctx);
  const inside = ctx.S.inside;
  // start with every region in view
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const r of REGIONS) { const a = r.area; const [x0, x1, z0, z1] = a.kind === 'circle' ? [a.x - a.r, a.x + a.r, a.z - a.r, a.z + a.r] : [a.x0, a.x1, a.z0, a.z1]; bx0 = Math.min(bx0, x0); bx1 = Math.max(bx1, x1); bz0 = Math.min(bz0, z0); bz1 = Math.max(bz1, z1); }
  const view = { x: (bx0 + bx1) / 2, z: (bz0 + bz1) / 2, s: Math.min(900 / (bx1 - bx0), 680 / (bz1 - bz0)) * 0.94 }; // s: pixels per tile
  let hover = null;
  const W = cv.width, H = cv.height;
  const sx = x => (x - view.x) * view.s + W / 2, sz = z => (z - view.z) * view.s + H / 2;
  const line = (pts, w, color) => { g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo(sx(x), sz(z)) : g.moveTo(sx(x), sz(z))); g.stroke(); };
  function render() {
    if (!cv.isConnected) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#d8c8a0'; g.fillRect(0, 0, W, H);
    // kilometre grid
    g.strokeStyle = 'rgba(120,96,60,0.25)'; g.lineWidth = 1;
    const step = view.s > 0.3 ? 250 : 1000;
    for (let x = Math.floor((view.x - W / 2 / view.s) / step) * step; x < view.x + W / 2 / view.s; x += step) { g.beginPath(); g.moveTo(sx(x), 0); g.lineTo(sx(x), H); g.stroke(); }
    for (let z = Math.floor((view.z - H / 2 / view.s) / step) * step; z < view.z + H / 2 / view.s; z += step) { g.beginPath(); g.moveTo(0, sz(z)); g.lineTo(W, sz(z)); g.stroke(); }
    line(IJ, Math.max(4, 300 * view.s), '#6a8ab0'); line(AMSTEL, Math.max(2, 60 * view.s), '#6a8ab0');
    // the streets the client has loaded, drawn from the chunk ground textures
    const world = ctx.renderer?.world;
    if (world) { g.imageSmoothingEnabled = view.s < 1; for (const c of world.chunks.values()) if (c.ground && !c.data?.interior) g.drawImage(c.ground, sx(c.cx * CHUNK), sz(c.cz * CHUNK), CHUNK * view.s, CHUNK * view.s); }
    // regions, big ones first so small ones stay on top
    const order = [...REGIONS].sort((a, b) => area(b.area) - area(a.area));
    for (const r of order) {
      const a = r.area, c = TYPE_COL[r.type] || '#888';
      g.fillStyle = c + (r === hover ? '88' : '44'); g.strokeStyle = c; g.lineWidth = r === hover ? 3 : 1.5;
      g.beginPath();
      if (a.kind === 'circle') g.arc(sx(a.x), sz(a.z), Math.max(3, a.r * view.s), 0, Math.PI * 2);
      else g.rect(sx(a.x0), sz(a.z0), (a.x1 - a.x0) * view.s, (a.z1 - a.z0) * view.s);
      g.fill(); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const placed = [];
    for (const r of [...order].reverse()) {
      const m = mid(r.area), x = sx(m.x), y = sz(m.z);
      const size = r.type === 'wild' ? 28 : area(r.area) * view.s * view.s > 9000 ? 24 : 19;
      g.font = `bold ${size}px Georgia, serif`;
      const w = g.measureText(r.name).width;
      if (placed.some(p => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - y) < size) && r !== hover) continue;
      placed.push({ x, y, w });
      g.fillStyle = '#000'; g.fillText(r.name, x + 1.5, y + 1.5);
      g.fillStyle = r.type === 'wild' ? '#ff5040' : '#ffffff'; g.fillText(r.name, x, y);
    }
    if (!inside) {
      const px = sx(me.x), py = sz(me.z);
      g.fillStyle = '#000'; g.fillRect(px - 7, py - 7, 14, 14);
      g.fillStyle = '#fff'; g.fillRect(px - 5, py - 5, 10, 10);
    }
    g.font = 'bold 18px Georgia, serif'; g.textAlign = 'left'; g.fillStyle = '#5a4630';
    g.fillText(view.s > 0.3 ? 'Grid: 250 m' : 'Grid: 1 km', 10, H - 14);
    g.fillText('N ↑', W - 50, 22);
  }
  const area = a => a.kind === 'circle' ? Math.PI * a.r * a.r : (a.x1 - a.x0) * (a.z1 - a.z0);
  const toWorld = e => { const b = cv.getBoundingClientRect(), k = W / b.width; return { x: ((e.clientX - b.left) * k - W / 2) / view.s + view.x, z: ((e.clientY - b.top) * k - H / 2) / view.s + view.z }; };
  const pickRegion = p => { const r = regionAt(p.x, p.z); return r.id === 'amsterdam' ? null : r; };
  const describe = r => { info.innerHTML = r ? `<b>${ctx.esc(r.name)}</b> (${TYPE_NAME[r.type] || r.type}): ${ctx.esc(r.role)}` : 'Amsterdam. Hover or tap a region to see what it is for.'; };
  let drag = null;
  cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, vx: view.x, vz: view.z, moved: false }; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => {
    if (drag) {
      const k = W / cv.getBoundingClientRect().width;
      const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      view.x = drag.vx - dx / view.s; view.z = drag.vz - dy / view.s;
      render(); return;
    }
    const r = pickRegion(toWorld(e));
    if (r !== hover) { hover = r; describe(r); render(); }
  };
  cv.onpointerup = e => { if (drag && !drag.moved) { hover = pickRegion(toWorld(e)); describe(hover); render(); } drag = null; };
  cv.onwheel = e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.25 : 0.8); };
  const zoom = f => { view.s = Math.max(0.03, Math.min(2, view.s * f)); render(); };
  document.querySelectorAll('#window .atmo-map [data-z]').forEach(b => b.onclick = () => {
    if (b.dataset.z === 'in') zoom(1.4); else if (b.dataset.z === 'out') zoom(0.7);
    else { const p = playerPos(ctx); view.x = p.x; view.z = p.z; view.s = Math.max(view.s, 0.25); render(); }
  });
  render();
  atmo.mapView = view;
}
atmo.showWorldMap = () => showWorldMap(registry.ctx);
