import { Renderer } from './render.js';
import { drawPreview } from './model.js';
import { ITEMS, EQUIP_SLOTS, SKILLS, SKILL_ICON, levelForXp, xpForLevel, combatLevel, fmtQty } from '/shared/items.js';
import { SKIN, HAIR, CLOTH, DEFAULT_LOOK } from '/shared/look.js';
import { toLatLon, CHUNK } from '/shared/geo.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

const S = { id: 0, name: '', x: 0, z: 0, inv: [], equip: {}, xp: {}, hp: 10, mhp: 10, en: 100, run: false, real: false, ents: [], items: [], iface: null, trade: null, filter: 'all', chat: [] };
let ws = null, inGame = false, renderer = null;
const send = m => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };

// ======================================================================= login
const look = { ...DEFAULT_LOOK };
let pending = null;

function pane(name) {
  for (const p of document.querySelectorAll('.pane')) p.hidden = p.id !== 'pane-' + name;
  $('#login-msg').textContent = '';
  const first = $(`#pane-${name} input`);
  if (first) setTimeout(() => first.focus(), 0);
  if (name === 'design') drawPreview($('#preview'), look);
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); pane(b.dataset.go); }));

$('#pane-existing').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  connect({ t: 'login', name: f.name.value.trim(), pass: f.pass.value });
});

$('#pane-create').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim(), pass = f.pass.value;
  if (!/^[A-Za-z0-9 _-]{1,12}$/.test(name)) return loginMsg('Usernames are 1-12 letters, numbers, spaces, - or _.');
  if (pass.length < 5) return loginMsg('Passwords must be at least 5 characters long.');
  try {
    const r = await (await fetch('/api/namecheck?n=' + encodeURIComponent(name))).json();
    if (!r.ok) return loginMsg('That username is not available.');
  } catch { return loginMsg('Error connecting to server.'); }
  pending = { name, pass };
  pane('design');
});

const DESIGN = [['Gender', 'g', 2], ['Skin', 'skin', SKIN.length], ['Hair', 'hair', HAIR.length], ['Top', 'top', CLOTH.length], ['Legs', 'legs', CLOTH.length]];
for (const [label, key, n] of DESIGN) {
  const opts = $('#design-opts');
  const prev = document.createElement('button'); prev.textContent = '◀';
  const lab = document.createElement('span'); lab.textContent = label;
  const next = document.createElement('button'); next.textContent = '▶';
  prev.onclick = () => { look[key] = (look[key] + n - 1) % n; drawPreview($('#preview'), look); };
  next.onclick = () => { look[key] = (look[key] + 1) % n; drawPreview($('#preview'), look); };
  opts.append(prev, lab, next);
}
$('#design-accept').onclick = () => { if (pending) connect({ t: 'login', create: true, ...pending, look }); };

function loginMsg(t) { $('#login-msg').textContent = t; }

function connect(loginMessage) {
  loginMsg('Connecting to server...');
  ws?.close();
  const sock = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws = sock;
  sock.onopen = () => sock.send(JSON.stringify(loginMessage));
  sock.onmessage = e => onMessage(JSON.parse(e.data));
  sock.onclose = () => {
    if (ws !== sock) return;
    if (inGame) leaveGame('Connection lost. Please log in again.');
    else if ($('#login-msg').textContent === 'Connecting to server...') loginMsg('Error connecting to server.');
  };
}

function leaveGame(text) {
  inGame = false;
  stopGps(false);
  $('#game').hidden = true;
  $('#login').hidden = false;
  closeWindow(false); hideDialog(); hideMenu();
  renderer?.clear();
  pane('existing');
  loginMsg(text || '');
}

// ======================================================================= messages
function onMessage(m) {
  switch (m.t) {
    case 'err': loginMsg(m.text); ws.close(); ws = null; return;
    case 'init': return enterGame(m);
    case 'tick': return onTick(m);
    case 'msg': return chat(m.text, m.kind, m.from);
    case 'say':
      renderer.say(m.k, m.id, m.text);
      if (m.k === 'p') chat(`<b>${esc(m.name)}:</b> <span>${esc(m.text)}</span>`, 'public', null, true);
      return;
    case 'inv': S.inv = m.inv; return drawInv();
    case 'equip': S.equip = m.equip; drawEquip(); return;
    case 'skills': S.xp = m.xp; return drawSkills();
    case 'run': S.run = m.on; return drawOrbs();
    case 'dlg': return showDialog(m);
    case 'iface': hideDialog(); closeWindow(false); return;
    case 'shop': return showShop(m);
    case 'bank': return showBank(m);
    case 'trade': return showTrade(m);
    case 'death': stopGps(false); return;
  }
}

function enterGame(m) {
  inGame = true;
  Object.assign(S, { id: m.id, name: m.name, x: m.x, z: m.z, inv: m.inv, equip: m.equip, xp: m.xp, hp: m.hp, real: false });
  $('#login').hidden = true;
  $('#game').hidden = false;
  $('#chat-name').textContent = m.name;
  $('#chat-lines').innerHTML = ''; S.chat = [];
  if (!renderer) {
    renderer = new Renderer($('#view'), $('#overlay'));
    requestAnimationFrame(loop);
  }
  renderer.focus.set(m.x + 0.5, 1, m.z + 0.5);
  renderer.resize();
  drawInv(); drawEquip(); drawSkills(); drawOptions(); drawOrbs();
  if (m.isNew) setTimeout(() => chat('Tip: right-click (or long-press) on people to see all options.', 'level'), 1500);
}

function onTick(m) {
  Object.assign(S, { x: m.you.x, z: m.you.z, hp: m.you.hp, mhp: m.you.mhp, en: m.you.en, run: m.you.run, real: m.you.real, ents: m.e, items: m.gi });
  renderer.applyTick(m.e, m.gi, S.id);
  for (const h of m.h) renderer.hit(h.id, h.d, h.hp, h.mhp);
  drawOrbs();
}

// ======================================================================= main loop + camera
const keys = {};
let lastMini = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!inGame) return;
  if (keys.ArrowLeft) renderer.yaw -= 0.035;
  if (keys.ArrowRight) renderer.yaw += 0.035;
  if (keys.ArrowUp) renderer.pitch = Math.min(1.45, renderer.pitch + 0.02);
  if (keys.ArrowDown) renderer.pitch = Math.max(0.35, renderer.pitch - 0.02);
  renderer.frame(now);
  if (now - lastMini > 80) { lastMini = now; drawMinimap(); }
  $('#compass').style.transform = `rotate(${renderer.yaw}rad)`;
}

document.addEventListener('keydown', e => {
  if (!inGame) return;
  if (e.key.startsWith('Arrow')) { keys[e.key] = true; e.preventDefault(); return; }
  if (e.key === 'Escape') { hideMenu(); closeWindow(true); return; }
  const dlg = $('#chat-dialog');
  if (!dlg.hidden && document.activeElement !== $('#chat-text')) {
    if (e.key === ' ') { e.preventDefault(); dlg.click(); return; }
    const n = parseInt(e.key, 10);
    const opt = dlg.querySelectorAll('.opt')[n - 1];
    if (opt) { opt.click(); return; }
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') $('#chat-text').focus();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

$('#chat-text').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const t = e.target.value.trim();
    if (t) send({ t: 'say', text: t });
    e.target.value = '';
    if (matchMedia('(pointer: coarse)').matches) e.target.blur();
  }
});

// ---------------- pointer input on the 3D view (mouse + touch)
const view = $('#view');
const pointers = new Map();
let drag = null, pressTimer = null, pinch = null, lastMouse = { x: 0, y: 0 };

view.addEventListener('contextmenu', e => e.preventDefault());
view.addEventListener('wheel', e => { e.preventDefault(); renderer.dist = Math.max(8, Math.min(70, renderer.dist * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });

view.addEventListener('pointerdown', e => {
  view.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  hideMenu();
  if (pointers.size === 2) {
    clearTimeout(pressTimer);
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: renderer.dist };
    drag = null;
    return;
  }
  drag = { x: e.clientX, y: e.clientY, yaw: renderer.yaw, pitch: renderer.pitch, button: e.button, moved: false, type: e.pointerType, used: false };
  if (e.pointerType === 'touch') pressTimer = setTimeout(() => { if (drag && !drag.moved) { drag.used = true; openMenuAt(e.clientX, e.clientY); } }, 450);
});

view.addEventListener('pointermove', e => {
  lastMouse = { x: e.clientX, y: e.clientY };
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    renderer.dist = Math.max(8, Math.min(70, pinch.dist * pinch.d / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y))));
    return;
  }
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 8 && (drag.type === 'touch' || drag.button === 1)) { drag.moved = true; clearTimeout(pressTimer); }
    if (drag.moved) {
      renderer.yaw = drag.yaw - dx * 0.008;
      renderer.pitch = Math.max(0.35, Math.min(1.45, drag.pitch + dy * 0.006));
    }
    return;
  }
  if (e.pointerType === 'mouse') updateHover(e.clientX, e.clientY);
});

view.addEventListener('pointerup', e => {
  pointers.delete(e.pointerId);
  clearTimeout(pressTimer);
  if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
  const d = drag;
  drag = null;
  if (!d || d.moved || d.used) return;
  if (d.button === 2) return openMenuAt(e.clientX, e.clientY);
  if (d.button === 0) { const opts = optionsAt(e.clientX, e.clientY); opts[0]?.fn(e.clientX, e.clientY); }
});
view.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); drag = null; pinch = null; clearTimeout(pressTimer); });

function updateHover(x, y) {
  const opts = optionsAt(x, y);
  const o = opts[0];
  const more = opts.length - 2;
  $('#hovertext').innerHTML = o && o.label !== 'Cancel' ? `${o.label} ${o.target}${more > 0 ? ` <span style="color:#fff">/ ${more} more option${more > 1 ? 's' : ''}</span>` : ''}` : '';
}

const NPC_EXAMINE = {
  'Gemeente Gids': 'Works for the municipality. Knows every permit by heart.', 'Lost Tourist': 'Has been looking for the coffeeshop since 2019.',
  'Haring Henk': 'Smells faintly of the North Sea.', Bankier: 'Good with money. Better with your money.', Fietsendief: 'Has an unusually large collection of bike bells.',
  Eend: 'A Dutch duck. Kwak.', 'Kaas Kees': 'The big cheese.', 'Stroopwafel Sanne': 'Smells of caramel.', 'Wapensmid Willem': 'Runs a weapon shop in a medieval weigh house.',
  'Bloemen Bep': 'Sells flowers by the canal.', Rembrandt: 'The famous painter. Surprisingly lively for a statue.', Straatmuzikant: 'Plays the same three songs, beautifully.', Hardloper: 'Running laps around the Vondelpark.',
};

function optionsAt(sx, sy) {
  const { hits, tile } = renderer.pick(sx, sy);
  const pre = [], post = [], ex = [];
  for (const h of hits) {
    if (h.kind === 'npc') {
      const e = h.ent, t = `<span class="c-npc">${esc(e.n)}</span>`;
      if (e.talk) pre.push({ label: 'Talk-to', target: t, fn: (x, y) => act('npc', e, 'talk', 1, x, y) });
      if (e.shop) pre.push({ label: 'Trade', target: t, fn: (x, y) => act('npc', e, 'trade', 1, x, y) });
      if (e.bank) pre.push({ label: 'Bank', target: t, fn: (x, y) => act('npc', e, 'bank', 1, x, y) });
      ex.push({ label: 'Examine', target: t, fn: () => chat(NPC_EXAMINE[e.n] || 'A local.') });
    } else if (h.kind === 'ground') {
      const it = h.item, def = ITEMS[it.i];
      const t = `<span class="c-item">${esc(def.name)}${it.q > 1 ? ` (${it.q})` : ''}</span>`;
      pre.push({ label: 'Take', target: t, fn: (x, y) => act('ground', it, 'take', 0, x, y) });
      ex.push({ label: 'Examine', target: t, fn: () => chat(def.ex) });
    } else if (h.kind === 'player' && h.ent.id !== S.id) {
      const e = h.ent, myCb = combatLevel(levelsOf(S.xp));
      const t = `<span class="c-player">${esc(e.n)}</span>${e.g ? ' <span style="color:#9fd0ff">(ghost)</span>' : ''} <span class="c-lvl${e.cb > myCb ? ' red' : ''}">(level-${e.cb})</span>`;
      post.push({ label: 'Challenge', target: t, fn: (x, y) => act('player', e, 'challenge', -1, x, y) });
      post.push({ label: 'Trade with', target: t, fn: (x, y) => act('player', e, 'trade', 1, x, y) });
    }
  }
  const walk = tile ? [{ label: 'Walk here', target: '', fn: (x, y) => walkTo(tile.x, tile.z, x, y) }] : [];
  return [...pre, ...walk, ...post, ...ex, { label: 'Cancel', target: '', fn: () => {} }];
}

function act(kind, ent, action, range, sx, sy) {
  let path = null;
  if (!S.real && range >= 0) path = renderer.world.findPath(S.x, S.z, ent.x, ent.z, range);
  send({ t: 'act', kind, id: ent.id, action, path });
  if (sx !== undefined) renderer.showMarker(sx, sy, true);
}

function walkTo(x, z, sx, sy) {
  if (S.real) return chat("You're in real-life mode: walk in the real world to move! Tap the orb to become a ghost again.");
  const path = renderer.world.findPath(S.x, S.z, x, z, 0);
  if (sx !== undefined) renderer.showMarker(sx, sy, false);
  if (path.length) send({ t: 'walk', path });
}

// ---------------- context menu
function openMenuAt(x, y) { showMenu(x, y, optionsAt(x, y)); }

function showMenu(x, y, opts) {
  const m = $('#ctxmenu');
  m.innerHTML = '<div class="hd">Choose Option</div>';
  for (const o of opts) {
    const d = document.createElement('div');
    d.className = 'it';
    d.innerHTML = `${o.label} ${o.target || ''}`;
    d.addEventListener('pointerup', ev => { ev.stopPropagation(); hideMenu(); o.fn(x, y); });
    m.appendChild(d);
  }
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(2, Math.min(innerWidth - w - 2, x - w / 2)) + 'px';
  m.style.top = Math.max(2, Math.min(innerHeight - h - 2, y - 8)) + 'px';
}
function hideMenu() { $('#ctxmenu').hidden = true; }
$('#ctxmenu').addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hideMenu(); });
$('#ctxmenu').addEventListener('contextmenu', e => e.preventDefault());

// Generic press handling for UI elements: tap/click = default, right-click or long-press = menu.
function pressable(el, getOpts, onDragDrop) {
  let t = null, start = null, used = false;
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('pointerdown', e => {
    hideMenu();
    el.setPointerCapture?.(e.pointerId);
    used = false; start = { x: e.clientX, y: e.clientY, button: e.button };
    if (e.button === 2) { used = true; const o = getOpts(); if (o.length) showMenu(e.clientX, e.clientY, o); return; }
    if (e.pointerType === 'touch') t = setTimeout(() => { used = true; const o = getOpts(); if (o.length) showMenu(e.clientX, e.clientY, o); }, 450);
  });
  el.addEventListener('pointerup', e => {
    clearTimeout(t);
    const st = start;
    start = null;
    if (used || !st || e.button !== 0) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.slot');
    if (onDragDrop && target && target !== el && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6) { onDragDrop(target); return; }
    const o = getOpts();
    if (o.length) o[0].fn();
  });
  el.addEventListener('pointermove', e => { if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clearTimeout(t); });
}

// ======================================================================= chat + dialogs
function chat(text, kind = 'game', from = null, html = false) {
  const line = { text: html ? text : esc(text), kind, from };
  S.chat.push(line);
  if (S.chat.length > 150) S.chat.shift();
  renderChatLine(line);
}

const FILTERS = { all: () => true, game: k => k !== 'public', public: k => k === 'public', trade: k => k === 'tradereq' || k === 'duelreq' || k === 'duel' };
function renderChatLine(line) {
  if (!FILTERS[S.filter](line.kind)) return;
  const box = $('#chat-lines');
  const d = document.createElement('div');
  d.className = line.kind;
  d.innerHTML = line.text;
  if (line.from) d.onclick = () => {
    const e = S.ents.find(e => e.k === 'p' && e.id === line.from);
    if (!e) return chat('That player is not nearby anymore.');
    act('player', e, line.kind === 'tradereq' ? 'trade' : 'challenge', line.kind === 'tradereq' ? 1 : -1);
  };
  const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 20;
  box.appendChild(d);
  while (box.children.length > 150) box.firstChild.remove();
  if (atBottom) box.scrollTop = box.scrollHeight;
}
document.querySelectorAll('#chat-tabs [data-f]').forEach(b => b.onclick = () => {
  S.filter = b.dataset.f;
  document.querySelectorAll('#chat-tabs [data-f]').forEach(x => x.classList.toggle('on', x === b));
  $('#chat-lines').innerHTML = '';
  S.chat.forEach(renderChatLine);
  $('#chatbox').classList.remove('collapsed');
});
$('#chat-toggle').onclick = () => { const c = $('#chatbox').classList.toggle('collapsed'); $('#chat-toggle').textContent = c ? '▴' : '▾'; };

function showDialog(m) {
  const d = $('#chat-dialog');
  S.iface = 'dlg';
  $('#chatbox').classList.remove('collapsed');
  d.hidden = false;
  if (m.opts) {
    d.innerHTML = '<div class="title">Select an Option</div>' + m.opts.map((o, i) => `<div class="opt" data-i="${i}">${esc(o)}</div>`).join('');
    d.onclick = e => { const o = e.target.closest('.opt'); if (o) { e.stopPropagation(); send({ t: 'dlg', opt: +o.dataset.i }); } };
  } else {
    d.innerHTML = `<div class="who">${esc(m.who)}</div><div class="text">${esc(m.text)}</div><div class="cont">Click here to continue</div>`;
    d.onclick = () => send({ t: 'dlg' });
  }
}
function hideDialog() { $('#chat-dialog').hidden = true; if (S.iface === 'dlg') S.iface = null; }

// ======================================================================= side panel
document.querySelectorAll('#side-tabs button').forEach(b => b.onclick = () => {
  const panel = $('#side-panel');
  if (b.classList.contains('on') && !panel.classList.contains('collapsed')) { panel.classList.add('collapsed'); b.classList.remove('on'); return; }
  panel.classList.remove('collapsed');
  document.querySelectorAll('#side-tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== 'tab-' + b.dataset.tab);
});
if (matchMedia('(max-width: 760px)').matches) { $('#side-panel').classList.add('collapsed'); document.querySelector('#side-tabs .on')?.classList.remove('on'); }

function slotHtml(s) {
  if (!s) return '';
  const def = ITEMS[s.id];
  const q = def.stack || s.q > 1 ? fmtQty(s.q) : null;
  return `<span class="em">${def.icon}</span>${q ? `<span class="q" style="color:${q.color}">${q.text}</span>` : ''}`;
}

function invOptions(i) {
  const s = S.inv[i];
  if (!s) return [];
  const def = ITEMS[s.id];
  const t = `<span class="c-item">${esc(def.name)}</span>`;
  const ex = { label: 'Examine', target: t, fn: () => chat(def.stack && s.q > 1 ? `${s.q.toLocaleString()} x ${def.name}.` : def.ex) };
  if (S.iface === 'shop') {
    const price = Math.floor(def.value * 0.4);
    return [{ label: 'Value', target: t, fn: () => chat(`${def.name}: shop will buy for ${price} coins.`) }, ...[1, 5, 10].map(n => ({ label: 'Sell ' + n, target: t, fn: () => send({ t: 'shop', op: 'sell', slot: i, qty: n }) })), ex];
  }
  if (S.iface === 'bank') return [...[1, 5, 10].map(n => ({ label: 'Deposit-' + n, target: t, fn: () => send({ t: 'bank', op: 'dep', slot: i, qty: n }) })), { label: 'Deposit-All', target: t, fn: () => send({ t: 'bank', op: 'dep', slot: i, qty: 'all' }) }, ex];
  if (S.iface === 'trade' && S.trade?.stage === 1) return [...[1, 5, 10].map(n => ({ label: n === 1 ? 'Offer' : 'Offer-' + n, target: t, fn: () => send({ t: 'trade', op: 'offer', slot: i, qty: n }) })), { label: 'Offer-All', target: t, fn: () => send({ t: 'trade', op: 'offer', slot: i, qty: 1e9 }) }, ex];
  const o = [];
  if (def.heal) o.push({ label: 'Eat', target: t, fn: () => send({ t: 'inv', op: 'eat', slot: i }) });
  if (def.slot) o.push({ label: def.slot === 'weapon' || def.slot === 'shield' ? 'Wield' : 'Wear', target: t, fn: () => send({ t: 'inv', op: 'wield', slot: i }) });
  o.push({ label: 'Use', target: t, fn: () => chat('Nothing interesting happens.') });
  o.push({ label: 'Drop', target: t, fn: () => send({ t: 'inv', op: 'drop', slot: i }) });
  o.push(ex);
  return o;
}

const invEl = $('#inv');
for (let i = 0; i < 28; i++) {
  const d = document.createElement('div');
  d.className = 'slot';
  d.dataset.i = i;
  pressable(d, () => invOptions(i), target => { if (target.parentElement === invEl) send({ t: 'inv', op: 'swap', a: i, b: +target.dataset.i }); });
  d.addEventListener('mouseenter', () => { const o = invOptions(i)[0]; $('#hovertext').innerHTML = o ? `${o.label} ${o.target}` : ''; });
  invEl.appendChild(d);
}
function drawInv() { S.inv.forEach((s, i) => { invEl.children[i].innerHTML = slotHtml(s); }); }

const levelsOf = xp => Object.fromEntries(SKILLS.map(s => [s, levelForXp(xp[s] || 0)]));

function drawSkills() {
  const lv = levelsOf(S.xp);
  const total = SKILLS.reduce((a, s) => a + lv[s], 0);
  $('#tab-skills').innerHTML = '<div class="skills">' + SKILLS.map(s => {
    const xp = Math.floor(S.xp[s] || 0), next = lv[s] < 99 ? xpForLevel(lv[s] + 1) : null;
    return `<div class="skill" title="${s[0].toUpperCase() + s.slice(1)} XP: ${xp.toLocaleString()}${next ? `\nNext level at: ${next.toLocaleString()}` : ''}"><span>${SKILL_ICON[s]}</span><span>${lv[s]}/${lv[s]}<span class="xp">${xp.toLocaleString()} xp</span></span></div>`;
  }).join('') + `</div><div class="total">Total level: ${total}<br>Combat level: ${combatLevel(lv)}</div><p class="note">Exploring xp is earned by walking around Amsterdam in real-life mode and discovering landmarks.</p>`;
}

const EQUIP_GRID = [null, 'head', null, 'cape', null, null, 'weapon', 'body', 'shield', null, 'legs', null, null, 'feet', null];
function drawEquip() {
  const el = $('#tab-equip');
  el.innerHTML = '<div class="equip"></div><div class="bonus"></div>';
  const grid = el.firstChild;
  for (const slot of EQUIP_GRID) {
    const d = document.createElement('div');
    if (!slot) { grid.appendChild(d); continue; }
    d.className = 'slot';
    const s = S.equip[slot];
    d.innerHTML = s ? slotHtml(s) : `<span class="lbl">${slot}</span>`;
    if (s) pressable(d, () => {
      const t = `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`;
      return [{ label: 'Remove', target: t, fn: () => send({ t: 'unequip', slot }) }, { label: 'Examine', target: t, fn: () => chat(ITEMS[s.id].ex) }];
    });
    grid.appendChild(d);
  }
  const b = { att: 0, str: 0, def: 0 };
  for (const s of EQUIP_SLOTS) if (S.equip[s]) for (const k in b) b[k] += ITEMS[S.equip[s].id][k] || 0;
  el.lastChild.innerHTML = `Attack bonus: +${b.att}<br>Strength bonus: +${b.str}<br>Defence bonus: +${b.def}`;
}

let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; drawOptions(); });
function drawOptions() {
  const el = $('#tab-options');
  el.innerHTML = `
    <button class="stone opt-btn" id="opt-logout">Logout</button>
    ${installPrompt ? '<button class="stone opt-btn" id="opt-install">Install app</button>' : ''}
    <p class="note"><b>Camera:</b> arrow keys, middle-mouse drag or one-finger drag rotate. Scroll or pinch to zoom.</p>
    <p class="note"><b>Real-life mode</b> uses your phone's GPS. Only other real-life players can see you, so ghosts can never follow you around. Stay aware of traffic and bikes!</p>`;
  $('#opt-logout').onclick = () => { stopGps(true); ws?.close(); ws = null; leaveGame('You have logged out.'); };
  const inst = $('#opt-install');
  if (inst) inst.onclick = () => { installPrompt.prompt(); installPrompt = null; drawOptions(); };
}

// ======================================================================= orbs + minimap
function drawOrbs() {
  const hpOrb = $('#orb-hp b');
  hpOrb.textContent = S.hp;
  hpOrb.style.color = S.hp / S.mhp > 0.66 ? '#00ff00' : S.hp / S.mhp > 0.33 ? '#ffff00' : '#ff3030';
  $('#orb-run b').textContent = S.en;
  $('#orb-run').classList.toggle('on', S.run);
  $('#orb-real').classList.toggle('on', S.real);
  $('#orb-real .ic').textContent = S.real ? '👁️' : '👻';
  $('#orb-real b').textContent = S.real ? 'Real' : gpsWatch !== null ? '...' : 'Ghost';
}
$('#orb-run').onclick = () => send({ t: 'run', on: !S.run });
$('#orb-hp').onclick = () => chat(`Hitpoints: ${S.hp}/${S.mhp}. Eat food to heal.`);
$('#orb-real').onclick = () => (S.real || gpsWatch !== null ? stopGps(true) : askRealMode());
$('#orb-map').onclick = showMap;
$('#compass').onclick = () => { renderer.yaw = 0; };

const mini = $('#minimap');
const mg = mini.getContext('2d');
const MS = 3; // canvas px per tile
function drawMinimap() {
  const W = mini.width, c = W / 2, yaw = renderer.yaw;
  const me = renderer.ents.get('p' + S.id);
  const fx = me ? me.model.group.position.x : S.x + 0.5, fz = me ? me.model.group.position.z : S.z + 0.5;
  mg.setTransform(1, 0, 0, 1, 0, 0);
  mg.fillStyle = '#000'; mg.fillRect(0, 0, W, W);
  mg.save();
  mg.translate(c, c); mg.rotate(yaw); mg.scale(MS, MS); mg.translate(-fx, -fz);
  mg.imageSmoothingEnabled = false;
  for (const ch of renderer.world.chunks.values()) if (ch.ground) mg.drawImage(ch.ground, ch.cx * CHUNK, ch.cz * CHUNK, CHUNK, CHUNK);
  mg.restore();
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const dot = (x, z, color, r = 3) => {
    const dx = (x + 0.5 - fx) * MS, dz = (z + 0.5 - fz) * MS;
    const sx = c + dx * cos - dz * sin, sy = c + dx * sin + dz * cos;
    mg.fillStyle = '#000'; mg.fillRect(sx - r - 1, sy - r - 1, r * 2 + 2, r * 2 + 2);
    mg.fillStyle = color; mg.fillRect(sx - r, sy - r, r * 2, r * 2);
  };
  for (const it of S.items) dot(it.x, it.z, '#ff2020');
  for (const e of S.ents) if (e.k === 'n') dot(e.x, e.z, '#ffff00');
  for (const e of S.ents) if (e.k === 'p' && e.id !== S.id) dot(e.x, e.z, e.g ? '#9fd0ff' : '#ffffff');
  mg.fillStyle = '#fff'; mg.fillRect(c - 3, c - 3, 6, 6);
}
mini.addEventListener('click', e => {
  const r = mini.getBoundingClientRect();
  const k = mini.width / r.width;
  const x = (e.clientX - r.left) * k - mini.width / 2, y = (e.clientY - r.top) * k - mini.width / 2;
  if (Math.hypot(x, y) > mini.width / 2) return;
  const yaw = renderer.yaw, cos = Math.cos(yaw), sin = Math.sin(yaw);
  const dx = (x * cos + y * sin) / MS, dz = (-x * sin + y * cos) / MS;
  walkTo(Math.floor(S.x + 0.5 + dx), Math.floor(S.z + 0.5 + dz));
});

// ======================================================================= real-life mode (GPS)
let gpsWatch = null, gpsLast = null, gpsSent = 0, gpsBeat = null;

function askRealMode() {
  if (store.get('realOk')) return startGps();
  openWindow('Real-life mode', `
    <p>In real-life mode your character follows your phone's GPS. You can pick up items lying around Amsterdam and challenge other real-life players nearby to duels.</p>
    <p class="note">Only other real-life players can see you while you're in this mode. Please watch out for traffic, trams and bikes, and never go somewhere unsafe for loot.</p>
    <div class="win-buttons"><button class="stone" id="real-yes">Enable</button><button class="stone" id="real-no">Cancel</button></div>`);
  $('#real-yes').onclick = () => { store.set('realOk', '1'); closeWindow(false); startGps(); };
  $('#real-no').onclick = () => closeWindow(false);
}

function startGps() {
  if (!('geolocation' in navigator)) return chat('Your device does not support location.', 'warn');
  if (!isSecureContext) return chat('Real-life mode needs a secure (https) connection.', 'warn');
  chat('Locating you...');
  const sendFix = () => { if (gpsLast) { gpsSent = Date.now(); send({ t: 'gps', ...gpsLast }); } };
  gpsWatch = navigator.geolocation.watchPosition(p => {
    gpsLast = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy };
    if (Date.now() - gpsSent > 1000) sendFix();
  }, err => { chat('Could not get your location: ' + err.message, 'warn'); stopGps(true); }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 30000 });
  gpsBeat = setInterval(() => { if (Date.now() - gpsSent > 8000) sendFix(); }, 4000);
  drawOrbs();
}

function stopGps(notify) {
  if (gpsWatch !== null) navigator.geolocation.clearWatch(gpsWatch);
  clearInterval(gpsBeat);
  gpsWatch = null; gpsLast = null;
  if (notify) send({ t: 'mode', real: false });
  if (inGame) drawOrbs();
}

// ======================================================================= windows: shop, bank, trade, map
function openWindow(title, html, onClose) {
  const w = $('#window');
  w.querySelector('.win-title span').textContent = title;
  w.querySelector('.win-body').innerHTML = html;
  w.hidden = false;
  w.querySelector('.x').onclick = () => { closeWindow(true); onClose?.(); };
}
function closeWindow(notify) {
  const w = $('#window');
  if (w.hidden) return;
  w.hidden = true;
  if (notify && S.iface && S.iface !== 'dlg') send({ t: S.iface === 'trade' ? 'trade' : 'close', op: 'decline' });
  if (S.iface !== 'dlg') S.iface = null;
  S.trade = null;
}

function itemGrid(items, getOpts) {
  const grid = document.createElement('div');
  grid.className = 'grid';
  items.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'slot';
    d.innerHTML = slotHtml(s) + (s.price !== undefined ? `<span class="price">${s.price}</span>` : '');
    d.title = s.price !== undefined ? `${ITEMS[s.id].name}: ${s.price} coins` : ITEMS[s.id].name;
    pressable(d, () => getOpts(s, i));
    grid.appendChild(d);
  });
  return grid;
}

function showShop(m) {
  S.iface = 'shop';
  openWindow(m.name, '<p class="note">Click to buy. Right-click or long-press for more options. Click items in your inventory to sell.</p>');
  const body = $('#window .win-body');
  body.appendChild(itemGrid(m.stock.map(s => ({ ...s, q: 1 })), s => {
    const t = `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`;
    return [...[1, 5, 10].map(n => ({ label: 'Buy ' + n, target: t, fn: () => send({ t: 'shop', op: 'buy', id: s.id, qty: n }) })), { label: 'Value', target: t, fn: () => chat(`${ITEMS[s.id].name}: currently costs ${s.price} coins.`) }];
  }));
  showInvTab();
}

function showBank(m) {
  S.iface = 'bank';
  openWindow('The Bank of Amsterdam', '');
  const body = $('#window .win-body');
  if (!m.items.length) body.innerHTML = '<p class="note">Your bank is empty. Click items in your inventory to deposit them.</p>';
  body.appendChild(itemGrid(m.items, (s, i) => {
    const t = `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`;
    return [...[1, 5, 10].map(n => ({ label: 'Withdraw-' + n, target: t, fn: () => send({ t: 'bank', op: 'wd', slot: i, qty: n }) })), { label: 'Withdraw-All', target: t, fn: () => send({ t: 'bank', op: 'wd', slot: i, qty: 'all' }) }];
  }));
  const btn = document.createElement('div');
  btn.className = 'win-buttons';
  btn.innerHTML = '<button class="stone">Deposit inventory</button>';
  btn.firstChild.onclick = () => S.inv.forEach((s, i) => { if (s) send({ t: 'bank', op: 'dep', slot: i, qty: 'all' }); });
  btn.style.marginTop = '10px';
  body.appendChild(btn);
  showInvTab();
}

function showTrade(m) {
  S.iface = 'trade'; S.trade = m;
  const list = items => items.length ? items.map(s => `${esc(ITEMS[s.id].name)}${s.q > 1 ? ' x ' + s.q.toLocaleString() : ''}`).join('<br>') : 'Absolutely nothing!';
  if (m.stage === 1) {
    openWindow(`Trading with: ${m.with}`, `
      <div class="trade"><div><h4>Your offer:</h4><div class="box" id="tr-mine"></div></div><div><h4>${esc(m.with)}'s offer:</h4><div class="box" id="tr-theirs"></div></div></div>
      <div class="trade-status">${m.themAcc ? 'Other player has accepted.' : m.meAcc ? 'Waiting for other player...' : `${esc(m.with)} has ${m.themFree} free inventory slots.`}</div>
      <div class="win-buttons"><button class="stone" id="tr-acc">Accept</button><button class="stone" id="tr-dec">Decline</button></div>`);
    $('#tr-mine').appendChild(itemGrid(m.mine, (s, i) => {
      const t = `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`;
      return [1, 5, 10].map(n => ({ label: n === 1 ? 'Remove' : 'Remove-' + n, target: t, fn: () => send({ t: 'trade', op: 'remove', slot: i, qty: n }) }));
    }));
    $('#tr-theirs').appendChild(itemGrid(m.theirs, s => [{ label: 'Examine', target: `<span class="c-item">${esc(ITEMS[s.id].name)}</span>`, fn: () => chat(ITEMS[s.id].ex) }]));
  } else {
    openWindow(`Trading with: ${m.with}`, `
      <p style="text-align:center;color:#fff">Are you sure you want to make this trade?</p>
      <div class="trade"><div><h4>You are about to give:</h4><div class="box list">${list(m.mine)}</div></div><div><h4>In return you will receive:</h4><div class="box list">${list(m.theirs)}</div></div></div>
      <div class="trade-status">${m.themAcc ? 'Other player has accepted.' : m.meAcc ? 'Waiting for other player...' : ''}</div>
      <div class="win-buttons"><button class="stone" id="tr-acc">Accept</button><button class="stone" id="tr-dec">Decline</button></div>`);
  }
  $('#tr-acc').onclick = () => send({ t: 'trade', op: 'accept' });
  $('#tr-dec').onclick = () => { send({ t: 'trade', op: 'decline' }); };
  showInvTab();
}

function showInvTab() {
  const b = document.querySelector('#side-tabs [data-tab="inv"]');
  if (!b.classList.contains('on') || $('#side-panel').classList.contains('collapsed')) b.click();
}

function showMap() {
  const { lat, lon } = toLatLon(S.x + 0.5, S.z + 0.5);
  const ll = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  openWindow('World Map', `
    <iframe id="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${ll}&z=17&output=embed"></iframe>
    <div class="map-links">
      <a href="#" id="map-sat">Satellite</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${ll}">Open in Google Maps</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll}">Street View here</a>
    </div>`);
  let sat = false;
  $('#map-sat').onclick = e => { e.preventDefault(); sat = !sat; $('#map-frame').src = `https://maps.google.com/maps?q=${ll}&z=17&t=${sat ? 'k' : 'm'}&output=embed`; e.target.textContent = sat ? 'Map' : 'Satellite'; };
}

// ======================================================================= boot
pane('welcome');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

// Debug handle for automated tests and the browser console.
window.__amsterscape = { S, get renderer() { return renderer; } };
