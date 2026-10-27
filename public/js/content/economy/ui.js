// Economy pack windows and effects: deposit box, canal map, Kapsalon makeover, hiscores, mod reports, travel fade,
// shop stock counts, private messages and OV-fiets riders.
import * as THREE from 'three';
import { registry } from '../../registry.js';
import { buildModel, disposeModel } from '../../model.js';
import { SKIN, HAIR, CLOTH } from '/shared/look.js';
import { buildBike } from './models.js';

const body = () => document.querySelector('#window .win-body');
const winOpen = sel => !document.querySelector('#window').hidden && !!body().querySelector(sel);
const fmt = n => Math.round(n).toLocaleString('en-US');

// ---- deposit box
let depInv = null;
function renderDeposit(ctx) {
  const { S, send, esc, ITEMS } = ctx;
  depInv = S.inv;
  const items = [];
  S.inv.forEach((s, i) => { if (s) items.push({ ...s, slot: i }); });
  ctx.openWindow('Bank deposit box', '<div class="eco-dep"><p class="note">Click an item to deposit all of it. Deposit boxes cannot withdraw.</p></div>');
  S.iface = 'eco_deposit';
  const el = body().querySelector('.eco-dep');
  el.appendChild(ctx.itemGrid(items, s => [{ label: 'Deposit-All', target: `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`, fn: () => send({ t: 'eco_dep', op: 'slot', slot: s.slot }) }]));
  const btn = document.createElement('div');
  btn.className = 'win-buttons'; btn.style.marginTop = '10px';
  btn.innerHTML = '<button class="stone" id="dep-inv">Deposit inventory</button><button class="stone" id="dep-worn">Deposit worn items</button>';
  el.appendChild(btn);
  el.querySelector('#dep-inv').onclick = () => send({ t: 'eco_dep', op: 'inv' });
  el.querySelector('#dep-worn').onclick = () => send({ t: 'eco_dep', op: 'worn' });
}
registry.msgHandlers.eco_deposit = (m, ctx) => renderDeposit(ctx);
registry.frameHooks.push((now, ctx) => { if (depInv && ctx.S.inv !== depInv) { if (winOpen('.eco-dep')) renderDeposit(ctx); else depInv = null; } });

// ---- canal map
const TYPE = { hub: 'City centre hubs', city: 'Neighbourhoods', skilling: 'Skilling areas', park: 'Parks', wild: 'Danger' };
registry.msgHandlers.eco_map = (m, ctx) => {
  const { esc } = ctx;
  const groups = Object.keys(TYPE).map(t => {
    const rs = m.regions.filter(r => r.type === t);
    if (!rs.length) return '';
    return `<h4>${TYPE[t]}</h4>${rs.map(r => `<div class="eco-reg${r.id === m.here ? ' here' : ''}${t === 'wild' ? ' wild' : ''}"><b>${esc(r.name)}</b>${r.id === m.here ? ' <i>(you are here)</i>' : ''}<br><span>${esc(r.role)}</span></div>`).join('')}`;
  }).join('');
  ctx.openWindow('Canal map of Amsterdam', `<div class="eco-map">${groups}<h4>NS stations</h4><p class="note">${m.stations.map(esc).join(' &middot; ')}</p><p class="note">GVB ferries cross the IJ for free from behind Centraal.</p></div>`);
};

// ---- Kapsalon makeover, with its own small turntable preview (the designer's one is bound to the login canvas)
let mk = null;
function drawPreview(canvas, look) {
  if (!mk || mk.canvas !== canvas) {
    mk?.gl.dispose();
    const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    gl.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#4a4030', 2.2));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.4); sun.position.set(2, 4, 3); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 20);
    cam.position.set(0, 1.25, 4.4); cam.lookAt(0, 1.0, 0);
    mk = { canvas, gl, scene, cam, model: null };
    const me = mk;
    const spin = t => {
      if (!canvas.isConnected) { if (mk === me) { if (me.model) disposeModel(me.model); me.gl.dispose(); mk = null; } return; }
      if (me.model) { me.model.group.rotation.y = Math.sin(t / 1400) * 0.7; me.gl.render(me.scene, me.cam); }
      requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
  }
  if (mk.model) { mk.scene.remove(mk.model.group); disposeModel(mk.model); }
  mk.model = buildModel({ l: look, eq: {} });
  mk.scene.add(mk.model.group);
}
registry.msgHandlers.eco_makeover = (m, ctx) => {
  const look = { ...m.look };
  const opts = [['Gender', 'g', 2], ['Skin', 'skin', SKIN.length], ['Hair', 'hair', HAIR.length], ['Top', 'top', CLOTH.length], ['Legs', 'legs', CLOTH.length]];
  ctx.openWindow('Kapsalon Karim', `<div class="eco-mk"><canvas id="eco-prev" width="160" height="200"></canvas><div class="eco-mk-opts">${opts.map(([l, k]) => `<button class="ge-sm" data-k="${k}" data-d="-1">&#9664;</button><span>${l}</span><button class="ge-sm" data-k="${k}" data-d="1">&#9654;</button>`).join('')}</div></div>
    <p class="note" style="text-align:center">A new look costs ${fmt(m.price)} coins.</p><div class="win-buttons"><button class="stone" id="mk-ok">Pay and confirm</button><button class="stone" id="mk-no">Cancel</button></div>`);
  ctx.S.iface = 'eco_makeover';
  const cv = body().querySelector('#eco-prev');
  const draw = () => { try { drawPreview(cv, look); } catch (e) { console.warn(e); } };
  draw();
  body().querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const o = opts.find(o => o[1] === b.dataset.k); look[o[1]] = ((look[o[1]] || 0) + +b.dataset.d + o[2]) % o[2]; draw(); });
  body().querySelector('#mk-ok').onclick = () => { ctx.send({ t: 'eco_makeover', look }); ctx.closeWindow(false); };
  body().querySelector('#mk-no').onclick = () => ctx.closeWindow(true);
};

// ---- hiscores (iframe of the /hiscores page)
registry.msgHandlers.eco_hiscores = (m, ctx) => {
  ctx.openWindow('Hiscores', `<iframe class="eco-hs" src="${ctx.esc(m.url)}"></iframe><div class="map-links"><a target="_blank" rel="noopener" href="${ctx.esc(m.url)}">Open in a new tab</a></div>`);
};

// ---- moderator reports
registry.msgHandlers.eco_reports = (m, ctx) => {
  const { esc } = ctx;
  const t = ts => new Date(ts).toLocaleString();
  ctx.openWindow('Player reports', `<div class="eco-pg"><table class="eco-tab"><tr><th>#</th><th>Reported</th><th>By</th><th>Reason</th><th>When</th></tr>${m.reports.map(r => `<tr><td>${r.id}</td><td>${esc(r.name)}</td><td>${esc(r.by)}</td><td>${esc(r.reason)}</td><td>${t(r.t)}</td></tr>`).join('') || '<tr><td colspan="5">No reports.</td></tr>'}</table>
    <h4>Recent moderator actions</h4>${m.modlog.map(l => `<p class="note">${t(l.t)} ${esc(l.by)}: ${esc(l.text)}</p>`).join('') || '<p class="note">None.</p>'}</div>`);
};

// ---- travel fade
registry.msgHandlers.eco_travel = (m, ctx) => {
  const d = document.createElement('div');
  d.className = 'eco-fade';
  d.innerHTML = `<span>${{ ns: 'Travelling by train to', metro: 'Taking the metro to', ferry: 'Crossing the IJ to' }[m.kind] || 'Travelling to'}<br><b>${ctx.esc(m.to)}</b></span>`;
  document.body.appendChild(d);
  registry.sfx?.(m.kind === 'ferry' ? 'ferry' : 'train');
  setTimeout(() => d.remove(), 1700);
};

// ---- shop stock counts (the core shop window shows prices only)
registry.msgHandlers.eco_shopq = (m, ctx) => {
  if (ctx.S.iface !== 'shop') return;
  const slots = document.querySelectorAll('#window .win-body .grid .slot');
  m.q.forEach((q, i) => {
    const s = slots[i];
    if (!s || q === null) return;
    s.querySelector('.q')?.remove();
    const span = document.createElement('span');
    span.className = 'q';
    span.style.color = q ? '#ffff00' : '#ff3030';
    span.textContent = q;
    s.appendChild(span);
  });
};

// ---- private messages in the chatbox
registry.msgHandlers.eco_pm = (m, ctx) => {
  const { esc } = ctx;
  if (m.from) { ctx.chat(`From <b>${esc(m.from)}</b>: ${esc(m.text)}`, 'pm', null, true); registry.sfx?.('pm'); }
  else ctx.chat(`To <b>${esc(m.to)}</b>: ${esc(m.text)}`, 'pm', null, true);
  registry.ecoLastPm = m.from || m.to;
};

// ---- OV-fiets riders get a bike under them
const riders = new Set();
const withBike = new Map();
registry.msgHandlers.eco_riders = m => { riders.clear(); for (const id of m.ids) riders.add('p' + id); };
registry.frameHooks.push((now, ctx) => {
  const r = ctx.renderer;
  if (!r) return;
  for (const [key, bike] of withBike) {
    const ent = r.ents.get(key);
    if (!riders.has(key) || !ent || bike.parent !== ent.model?.group) { bike.parent?.remove(bike); withBike.delete(key); }
  }
  for (const key of riders) {
    if (withBike.has(key)) continue;
    const ent = r.ents.get(key);
    if (!ent?.model?.group) continue;
    const bike = buildBike(new THREE.Group());
    bike.scale.setScalar(1.1);
    ent.model.group.add(bike);
    withBike.set(key, bike);
  }
});
