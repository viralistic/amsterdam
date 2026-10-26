// AmsterScape server: static files, chunk API and the 600 ms game tick over WebSockets.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { ITEMS, EQUIP_SLOTS, SKILLS, levelForXp, combatLevel } from '../shared/items.js';
import { toTile, cheb } from '../shared/geo.js';
import { sanitizeLook } from '../shared/look.js';
import * as db from './db.js';
import { getChunk, randomWalkPoint } from './mapdata.js';
import { NPCS, SHOPS, DIALOGS, SPAWNS, LANDMARKS, SPAWN, rollTreasure } from './content.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.env.PORT || 3000;
const TICK_MS = 600;
const VIEW = 64; // tiles
const REAL_RANGE = 14; // GPS is fuzzy, so real-life players interact from further away
const REAL_VISIBLE_TO_GHOSTS = process.env.REAL_VISIBLE_TO_GHOSTS === '1';
const WORLD_LIMIT = 20000; // metres from Centraal; real-life mode only works around Amsterdam

db.load();

// ---------------------------------------------------------------- HTTP
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const MOUNTS = [['/vendor/three-addons/', 'node_modules/three/examples/jsm/'], ['/vendor/three/', 'node_modules/three/build/'], ['/shared/', 'shared/'], ['/', 'public/']];

const server = http.createServer(async (req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  const m = url.match(/^\/api\/chunk\/(-?\d+)\/(-?\d+)$/);
  if (m) {
    const cx = +m[1], cz = +m[2];
    if (Math.abs(cx) > 100 || Math.abs(cz) > 100) { res.writeHead(400); return res.end(); }
    try {
      const data = await getChunk(cx, cz);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' });
      res.end(JSON.stringify(data));
    } catch (e) {
      console.warn('chunk', cx, cz, e.message);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ cx, cz, ok: false }));
    }
    return;
  }
  if (url.startsWith('/api/namecheck')) {
    const n = new URL(req.url, 'http://x').searchParams.get('n') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: validName(n) && !db.get(keyOf(n)) }));
  }
  if (url === '/') url = '/index.html';
  for (const [prefix, dir] of MOUNTS) {
    if (!url.startsWith(prefix)) continue;
    const base = path.join(ROOT, dir);
    const file = path.normalize(path.join(base, url.slice(prefix.length)));
    if (!file.startsWith(base)) break;
    return fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  }
  res.writeHead(404); res.end('Not found');
});

// ---------------------------------------------------------------- State
const players = new Map(); // id -> player
const online = new Map(); // account key -> player
const ground = new Map(); // id -> ground item
let nextId = 1, nextGroundId = 1, tickNo = 0;
let tickHits = [];

const npcs = NPCS.map((d, i) => ({ id: i + 1, def: d, x: d.at.x, z: d.at.z, name: d.name }));
const spawnState = SPAWNS.map(s => ({ def: s, gid: 0, at: 0 }));

const keyOf = name => name.trim().toLowerCase().replace(/[\s_-]+/g, '_');
const validName = n => /^[A-Za-z0-9][A-Za-z0-9 _-]{0,10}[A-Za-z0-9]$|^[A-Za-z0-9]$/.test(n);
const now = () => Date.now();

function newRecord(name, look, auth) {
  return { name, ...auth, look, x: SPAWN.x, z: SPAWN.z, inv: Array(28).fill(null), equip: {}, bank: [], xp: { attack: 0, strength: 0, defence: 0, hitpoints: 1154, exploring: 0 }, hp: 10, energy: 10000, flags: {}, created: now() };
}

// ---------------------------------------------------------------- Helpers
const send = (p, m) => { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(m)); };
const msg = (p, text, kind = 'game', extra) => send(p, { t: 'msg', text, kind, ...extra });
const lv = (p, s) => levelForXp(p.rec.xp[s]);
const levels = p => Object.fromEntries(SKILLS.map(s => [s, lv(p, s)]));
const cbLevel = p => combatLevel(levels(p));
const sendInv = p => send(p, { t: 'inv', inv: p.rec.inv });
const sendEquip = p => send(p, { t: 'equip', equip: p.rec.equip });
const sendSkills = p => send(p, { t: 'skills', xp: p.rec.xp });
const inRange = (a, b, r) => cheb(a.x, a.z, b.x, b.z) <= r;

function canSee(viewer, target) {
  if (viewer === target) return true;
  if (target.real && !viewer.real && !REAL_VISIBLE_TO_GHOSTS) return false;
  return inRange(viewer, target, VIEW);
}

function addXp(p, skill, amount) {
  const before = lv(p, skill);
  p.rec.xp[skill] = Math.min(200_000_000, p.rec.xp[skill] + amount);
  const after = lv(p, skill);
  if (after > before) {
    const name = skill[0].toUpperCase() + skill.slice(1);
    msg(p, `Congratulations, you just advanced ${after === before + 1 ? 'a' : (after - before)} ${name} level${after > before + 1 ? 's' : ''}. Your ${name} level is now ${after}.`, 'level');
    send(p, { t: 'levelup', skill, level: after });
  }
  p.skillsDirty = true;
}

function freeSlots(p) { return p.rec.inv.filter(s => !s).length; }
function invCount(p, id) { return p.rec.inv.reduce((n, s) => n + (s && s.id === id ? s.q : 0), 0); }

function canAdd(p, id, q) {
  if (ITEMS[id].stack) return p.rec.inv.some(s => s && s.id === id) || freeSlots(p) > 0;
  return freeSlots(p) >= q;
}

function invAdd(p, id, q) {
  if (!canAdd(p, id, q)) return false;
  const inv = p.rec.inv;
  if (ITEMS[id].stack) {
    const s = inv.find(s => s && s.id === id);
    if (s) s.q = Math.min(2_147_483_647, s.q + q); else inv[inv.indexOf(null)] = { id, q };
  } else for (let i = 0; i < q; i++) inv[inv.indexOf(null)] = { id, q: 1 };
  p.invDirty = true;
  return true;
}

function invRemove(p, id, q) {
  if (invCount(p, id) < q) return false;
  const inv = p.rec.inv;
  for (let i = 0; i < inv.length && q > 0; i++) {
    const s = inv[i];
    if (!s || s.id !== id) continue;
    const take = Math.min(q, s.q);
    s.q -= take; q -= take;
    if (s.q <= 0) inv[i] = null;
  }
  p.invDirty = true;
  return true;
}

function bonuses(p) {
  const b = { att: 0, str: 0, def: 0 };
  for (const s of Object.values(p.rec.equip)) if (s) for (const k in b) b[k] += ITEMS[s.id][k] || 0;
  return b;
}

function dropGround(item, q, x, z, ms = 180_000, extra = {}) {
  const g = { id: nextGroundId++, item, q, x, z, until: now() + ms, ...extra };
  ground.set(g.id, g);
  return g;
}

// ---------------------------------------------------------------- Movement
function setPath(p, path) {
  if (!Array.isArray(path) || path.length > 400) return false;
  let px = p.x, pz = p.z;
  const out = [];
  for (let i = 0; i < path.length; i++) {
    const s = path[i];
    if (!Array.isArray(s) || !Number.isInteger(s[0]) || !Number.isInteger(s[1])) return false;
    if (cheb(px, pz, s[0], s[1]) > (i === 0 ? 3 : 1)) return false;
    out.push([s[0], s[1]]);
    px = s[0]; pz = s[1];
  }
  p.path = out;
  return true;
}

function stepToward(p, tx, tz) {
  p.x += Math.sign(tx - p.x);
  p.z += Math.sign(tz - p.z);
}

function movePlayer(p) {
  if (p.real) {
    if (!p.gps) return;
    const d = cheb(p.x, p.z, p.gps.x, p.gps.z);
    if (d > 60) { p.x = p.gps.x; p.z = p.gps.z; return; }
    for (let i = 0; i < 4 && (p.x !== p.gps.x || p.z !== p.gps.z); i++) stepToward(p, p.gps.x, p.gps.z);
    return;
  }
  if (!p.path.length) {
    if (p.rec.energy < 10000) p.rec.energy = Math.min(10000, p.rec.energy + 8 + Math.floor(lv(p, 'exploring') / 6) * 4);
    return;
  }
  const steps = p.run && p.rec.energy >= 67 && p.path.length > 1 ? 2 : 1;
  for (let i = 0; i < steps && p.path.length; i++) {
    const [tx, tz] = p.path[0];
    stepToward(p, tx, tz);
    if (p.x === tx && p.z === tz) p.path.shift();
  }
  if (steps === 2) {
    p.rec.energy = Math.max(0, p.rec.energy - 67);
    if (p.rec.energy < 67) { p.run = false; send(p, { t: 'run', on: false }); }
  }
}

// ---------------------------------------------------------------- Interfaces
function closeIface(p) {
  if (p.trade) cancelTrade(p.trade, `${p.name} declined the trade.`);
  if (p.iface) send(p, { t: 'iface', close: true });
  p.iface = null; p.dlg = null; p.shop = null;
}

function startDialog(p, npc) {
  closeIface(p);
  p.iface = 'dlg';
  p.dlg = { npc, script: DIALOGS[npc.def.talk], node: 'start', i: 0 };
  showDialog(p);
}

function showDialog(p) {
  const d = p.dlg;
  for (let guard = 0; guard < 50; guard++) {
    if (d.node === 'end') return endDialog(p);
    const step = d.script[d.node]?.[d.i];
    if (!step) return endDialog(p);
    if (step.goto) { d.node = step.goto; d.i = 0; continue; }
    if (step.act) {
      d.i++;
      const next = dialogAction(p, step.act);
      if (next === 'stop') return;
      if (next) { d.node = next; d.i = 0; }
      continue;
    }
    if (step.opts) return send(p, { t: 'dlg', opts: step.opts.map(o => o[0]) });
    const isNpc = step.npc !== undefined;
    return send(p, { t: 'dlg', who: isNpc ? d.npc.name : p.name, side: isNpc ? 'npc' : 'player', text: isNpc ? step.npc : step.player, npc: d.npc.id });
  }
  endDialog(p);
}

function endDialog(p) {
  if (p.iface === 'dlg') { p.iface = null; p.dlg = null; send(p, { t: 'iface', close: true }); }
}

function dialogAction(p, act) {
  const npc = p.dlg.npc;
  switch (act) {
    case 'shop': openShop(p, npc); return 'stop';
    case 'bank': openBank(p); return 'stop';
    case 'starter':
      if (p.rec.flags.starter) return 'kitno';
      if (freeSlots(p) < 5) { msg(p, "You don't have enough inventory space."); return 'end'; }
      p.rec.flags.starter = true;
      invAdd(p, 'bronze_dagger', 1); invAdd(p, 'stroopwafel', 3); invAdd(p, 'coins', 25);
      return 'kityes';
    case 'buybell':
      if (invCount(p, 'coins') < 50) return 'broke';
      if (!canAdd(p, 'bike_bell', 1)) { msg(p, "You don't have enough inventory space."); return 'end'; }
      invRemove(p, 'coins', 50); invAdd(p, 'bike_bell', 1);
      return 'sold';
    case 'tip':
      if (!invRemove(p, 'coins', 5)) return 'poor';
      return 'thanks';
  }
  return null;
}

function openShop(p, npc) {
  closeIface(p);
  const shop = SHOPS[npc.def.shop];
  p.iface = 'shop'; p.shop = shop;
  send(p, { t: 'shop', name: shop.name, stock: shop.stock.map(id => ({ id, price: ITEMS[id].value })) });
}

function openBank(p) {
  closeIface(p);
  p.iface = 'bank';
  send(p, { t: 'bank', items: p.rec.bank });
}

// ---------------------------------------------------------------- Trading
function request(p, t, kind) {
  const map = p.reqs[kind];
  if (map.get(t.id) > now() - 30_000) { map.delete(t.id); return true; }
  t.reqs[kind].set(p.id, now());
  if (kind === 'trade') { msg(p, 'Sending trade offer...'); msg(t, `${p.name} wishes to trade with you.`, 'tradereq', { from: p.id }); }
  else { msg(p, 'Sending duel request...'); msg(t, `${p.name} wishes to duel with you.`, 'duelreq', { from: p.id }); }
  return false;
}

function openTrade(a, b) {
  closeIface(a); closeIface(b);
  const tr = { a, b, offer: new Map([[a.id, []], [b.id, []]]), acc: new Set(), stage: 1 };
  a.trade = b.trade = tr;
  a.iface = b.iface = 'trade';
  sendTrade(tr);
}

function sendTrade(tr) {
  for (const [me, them] of [[tr.a, tr.b], [tr.b, tr.a]]) {
    send(me, { t: 'trade', with: them.name, stage: tr.stage, mine: tr.offer.get(me.id), theirs: tr.offer.get(them.id), meAcc: tr.acc.has(me.id), themAcc: tr.acc.has(them.id), themFree: freeSlots(them) });
  }
}

function cancelTrade(tr, reason) {
  for (const p of [tr.a, tr.b]) {
    for (const s of tr.offer.get(p.id)) if (!invAdd(p, s.id, s.q)) dropGround(s.id, s.q, p.x, p.z);
    p.trade = null; p.iface = null;
    send(p, { t: 'iface', close: true });
    if (reason) msg(p, reason);
  }
}

function slotsNeeded(p, items) {
  let n = 0;
  for (const s of items) n += ITEMS[s.id].stack ? (p.rec.inv.some(i => i && i.id === s.id) ? 0 : 1) : s.q;
  return n;
}

function tradeOp(p, m) {
  const tr = p.trade;
  if (!tr) return;
  const other = tr.a === p ? tr.b : tr.a;
  const mine = tr.offer.get(p.id);
  if (m.op === 'decline') return cancelTrade(tr, `${p.name} declined the trade.`);
  if (m.op === 'offer' || m.op === 'remove') {
    if (tr.stage !== 1) return;
    if (m.op === 'offer') {
      const s = p.rec.inv[m.slot];
      if (!s) return;
      const q = Math.max(1, Math.min(+m.qty || 1, invCount(p, s.id)));
      const id = s.id;
      invRemove(p, id, q);
      const ex = ITEMS[id].stack && mine.find(o => o.id === id);
      if (ex) ex.q += q; else if (ITEMS[id].stack) mine.push({ id, q }); else for (let i = 0; i < q; i++) mine.push({ id, q: 1 });
    } else {
      const o = mine[m.slot];
      if (!o) return;
      const q = Math.max(1, Math.min(+m.qty || 1, o.q));
      if (!canAdd(p, o.id, ITEMS[o.id].stack ? q : 1)) return;
      if (ITEMS[o.id].stack) { o.q -= q; invAdd(p, o.id, q); if (o.q <= 0) mine.splice(m.slot, 1); } else { mine.splice(m.slot, 1); invAdd(p, o.id, 1); }
    }
    tr.acc.clear();
    sendInv(p); p.invDirty = false;
    return sendTrade(tr);
  }
  if (m.op === 'accept') {
    if (tr.stage === 1) {
      if (slotsNeeded(other, mine) > freeSlots(other)) { msg(p, "Other player doesn't have enough inventory space for this trade."); return; }
      if (slotsNeeded(p, tr.offer.get(other.id)) > freeSlots(p)) { msg(p, "You don't have enough inventory space for this trade."); return; }
    }
    tr.acc.add(p.id);
    if (tr.acc.size === 2) {
      if (tr.stage === 1) { tr.stage = 2; tr.acc.clear(); }
      else {
        const give = (to, items) => { for (const s of items) if (!invAdd(to, s.id, s.q)) dropGround(s.id, s.q, to.x, to.z); };
        const aItems = tr.offer.get(tr.a.id), bItems = tr.offer.get(tr.b.id);
        tr.offer.set(tr.a.id, []); tr.offer.set(tr.b.id, []);
        give(tr.b, aItems); give(tr.a, bItems);
        cancelTrade(tr, 'Accepted trade.');
        db.touch();
        return;
      }
    }
    sendTrade(tr);
  }
}

// ---------------------------------------------------------------- Combat (duels between real-life players)
function startDuel(a, b) {
  closeIface(a); closeIface(b);
  a.duel = { opp: b, count: 4 }; b.duel = { opp: a, count: 4 };
  a.atk = 0; b.atk = 1;
  for (const p of [a, b]) msg(p, `You are now duelling ${p.duel.opp.name}. Fight!`, 'duel');
}

function endDuel(p, text) {
  if (!p.duel) return;
  const o = p.duel.opp;
  p.duel = null;
  if (o.duel?.opp === p) { o.duel = null; if (text) msg(o, text); }
}

function say(ent, kind, text) {
  for (const v of players.values()) if (kind === 'n' ? inRange(v, ent, VIEW) : canSee(v, ent)) send(v, { t: 'say', k: kind, id: ent.id, name: ent.name, text });
}

function combatTick(p) {
  const d = p.duel;
  if (!d) return;
  const o = d.opp;
  if (!players.has(o.id) || !o.duel) return endDuel(p, null);
  if (!inRange(p, o, 40)) { endDuel(p, 'Your opponent fled the duel.'); msg(p, 'You fled the duel.'); return; }
  if (d.count > 0) {
    d.count--;
    if (p.id < o.id) say(p, 'p', d.count ? String(d.count) : 'FIGHT!');
    return;
  }
  if (p.atk > 0) { p.atk--; return; }
  const w = p.rec.equip.weapon ? ITEMS[p.rec.equip.weapon.id] : null;
  p.atk = (w?.speed || 4) - 1;
  const pb = bonuses(p), ob = bonuses(o);
  const attRoll = (lv(p, 'attack') + 8) * (pb.att + 64);
  const defRoll = (lv(o, 'defence') + 9) * (ob.def + 64);
  const chance = attRoll > defRoll ? 1 - (defRoll + 2) / (2 * (attRoll + 1)) : attRoll / (2 * (defRoll + 1));
  const maxHit = Math.floor(0.5 + (lv(p, 'strength') + 8) * (pb.str + 64) / 640);
  const dmg = Math.random() < chance ? Math.min(o.rec.hp, Math.floor(Math.random() * (maxHit + 1))) : 0;
  o.rec.hp -= dmg;
  tickHits.push({ target: o, d: dmg });
  if (dmg > 0) { for (const s of ['attack', 'strength', 'defence']) addXp(p, s, dmg * 4 / 3); addXp(p, 'hitpoints', dmg * 4 / 3); }
  if (o.rec.hp <= 0) {
    msg(p, `You have defeated ${o.name}!`, 'duel');
    p.rec.hp = lv(p, 'hitpoints');
    endDuel(p, null);
    die(o, p);
  }
}

function die(p, killer) {
  const coins = invCount(p, 'coins');
  if (coins > 0) { invRemove(p, 'coins', coins); dropGround('coins', coins, p.x, p.z, 120_000); }
  msg(p, 'Oh dear, you are dead!', 'warn');
  if (coins) msg(p, `You dropped ${coins} coins where you fell. ${killer ? killer.name + ' might grab them!' : ''}`);
  p.rec.hp = lv(p, 'hitpoints');
  p.x = SPAWN.x; p.z = SPAWN.z; p.path = []; p.pending = null;
  p.real = false; p.gps = null; p.deadUntil = now() + 10_000;
  send(p, { t: 'death' });
}

function goGhost(p, text) {
  if (!p.real) return;
  p.real = false; p.gps = null;
  if (p.duel) { msg(p.duel.opp, `${p.name} faded away and forfeits the duel.`); endDuel(p, null); }
  msg(p, text);
}

// ---------------------------------------------------------------- Actions
function resolveTarget(a) {
  if (a.kind === 'npc') return npcs.find(n => n.id === a.id);
  if (a.kind === 'player') return players.get(a.id);
  if (a.kind === 'ground') return ground.get(a.id);
}

function actionRange(p, a) {
  if (a.action === 'take') return p.real ? REAL_RANGE : 0;
  if (a.action === 'trade' && a.kind === 'player') return 16;
  if (a.action === 'challenge') return 30;
  return p.real ? REAL_RANGE : 2;
}

function tryPending(p) {
  const a = p.pending;
  if (!a) return;
  const tgt = resolveTarget(a);
  if (!tgt || (a.kind === 'player' && !canSee(p, tgt))) { p.pending = null; return; }
  if (cheb(p.x, p.z, tgt.x, tgt.z) <= actionRange(p, a)) {
    p.pending = null; p.path = [];
    return doAction(p, a, tgt);
  }
  if (p.path.length) return;
  if (p.real || a.action === 'challenge') { msg(p, p.real ? 'You need to get closer, in real life!' : "I can't reach that!"); p.pending = null; return; }
  if (++a.ticks > 30) { msg(p, "I can't reach that!"); p.pending = null; return; }
  stepToward(p, tgt.x, tgt.z);
}

function doAction(p, a, tgt) {
  if (a.kind === 'npc') {
    if (a.action === 'talk' && tgt.def.talk) return startDialog(p, tgt);
    if (a.action === 'trade' && tgt.def.shop) return openShop(p, tgt);
    if (a.action === 'bank' && tgt.def.bank) return openBank(p);
    return;
  }
  if (a.kind === 'player') {
    if (tgt === p) return;
    if (a.action === 'trade') {
      if (tgt.trade || tgt.duel) return msg(p, 'Other player is busy at the moment.');
      if (request(p, tgt, 'trade')) openTrade(p, tgt);
      return;
    }
    if (a.action === 'challenge') {
      if (!p.real) return msg(p, 'Ghosts cannot duel. Turn on real-life mode and go there in person!');
      if (!tgt.real) return msg(p, "That player is a ghost. Your fists would pass right through.");
      if (tgt.duel || tgt.trade) return msg(p, 'Other player is busy at the moment.');
      if (p.duel) return;
      if (request(p, tgt, 'duel')) startDuel(p, tgt);
    }
    return;
  }
  if (a.kind === 'ground' && a.action === 'take') {
    if (!p.real) return msg(p, 'Your ghostly hand passes right through it. Go there in real life to pick it up!');
    if (!canAdd(p, tgt.item, tgt.q)) return msg(p, "You don't have enough inventory space to hold that item.");
    ground.delete(tgt.id);
    invAdd(p, tgt.item, tgt.q);
    if (tgt.spawn) tgt.spawn.at = tickNo + tgt.spawn.def.respawn;
    db.touch();
  }
}

// ---------------------------------------------------------------- Messages
function handle(p, m) {
  if (++p.msgCount > 40) return;
  switch (m.t) {
    case 'walk':
      if (p.real) return msg(p, "You're in real-life mode. Walk in the real world to move!");
      if (p.duel) return msg(p, "You can't walk away from a duel!");
      closeIface(p); p.pending = null;
      setPath(p, m.path);
      return;
    case 'run':
      p.run = !!m.on && p.rec.energy >= 100;
      return send(p, { t: 'run', on: p.run });
    case 'act': {
      if (!['npc', 'player', 'ground'].includes(m.kind) || !Number.isInteger(m.id)) return;
      if (p.duel) return msg(p, "You're busy duelling!");
      closeIface(p);
      p.pending = { kind: m.kind, id: m.id, action: String(m.action), ticks: 0 };
      p.path = [];
      if (!p.real && m.path) setPath(p, m.path);
      return tryPending(p);
    }
    case 'say': {
      const text = String(m.text || '').replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 80);
      if (!text) return;
      if (now() - (p.lastSay || 0) < 600) return;
      p.lastSay = now();
      return say(p, 'p', text);
    }
    case 'dlg': {
      const d = p.dlg;
      if (!d || p.iface !== 'dlg') return;
      const step = d.script[d.node]?.[d.i];
      if (step?.opts) {
        const o = step.opts[m.opt];
        if (!o) return;
        d.node = o[1]; d.i = 0;
      } else d.i++;
      return showDialog(p);
    }
    case 'close': return closeIface(p);
    case 'inv': return invOp(p, m);
    case 'unequip': {
      const s = p.rec.equip[m.slot];
      if (!s) return;
      if (!canAdd(p, s.id, 1)) return msg(p, "You don't have enough free inventory space to do that.");
      delete p.rec.equip[m.slot];
      invAdd(p, s.id, 1); p.equipDirty = true;
      return;
    }
    case 'shop': {
      if (p.iface !== 'shop') return;
      const qty = Math.max(1, Math.min(+m.qty || 1, 1000));
      if (m.op === 'buy') {
        if (!p.shop.stock.includes(m.id)) return;
        const n = ITEMS[m.id].stack ? qty : Math.min(qty, freeSlots(p));
        if (n <= 0) return msg(p, "You don't have enough inventory space.");
        const cost = ITEMS[m.id].value * n;
        if (invCount(p, 'coins') < cost) return msg(p, "You don't have enough coins.");
        invRemove(p, 'coins', cost); invAdd(p, m.id, n);
      } else if (m.op === 'sell') {
        const s = p.rec.inv[m.slot];
        if (!s || s.id === 'coins') return;
        const id = s.id, n = Math.min(qty, invCount(p, id));
        const price = Math.floor(ITEMS[id].value * 0.4);
        if (price > 0 && !canAdd(p, 'coins', 1)) return;
        invRemove(p, id, n);
        if (price > 0) invAdd(p, 'coins', price * n);
      }
      db.touch();
      return;
    }
    case 'bank': {
      if (p.iface !== 'bank') return;
      const bank = p.rec.bank;
      if (m.op === 'dep') {
        const s = p.rec.inv[m.slot];
        if (!s) return;
        const id = s.id, n = Math.min(m.qty === 'all' ? Infinity : Math.max(1, +m.qty || 1), invCount(p, id));
        let b = bank.find(b => b.id === id);
        if (!b) { if (bank.length >= 400) return msg(p, 'Your bank is full.'); b = { id, q: 0 }; bank.push(b); }
        invRemove(p, id, n); b.q += n;
      } else if (m.op === 'wd') {
        const b = bank[m.slot];
        if (!b) return;
        let n = Math.min(m.qty === 'all' ? Infinity : Math.max(1, +m.qty || 1), b.q);
        if (!ITEMS[b.id].stack) n = Math.min(n, freeSlots(p));
        if (n <= 0 || !canAdd(p, b.id, ITEMS[b.id].stack ? n : 1)) return msg(p, "You don't have enough inventory space.");
        invAdd(p, b.id, n); b.q -= n;
        if (b.q <= 0) bank.splice(m.slot, 1);
      }
      send(p, { t: 'bank', items: bank });
      db.touch();
      return;
    }
    case 'trade': return tradeOp(p, m);
    case 'gps': return onGps(p, m);
    case 'mode': if (!m.real) goGhost(p, 'You fade back into a ghost.'); return;
  }
}

function invOp(p, m) {
  const inv = p.rec.inv;
  if (m.op === 'swap') {
    if (inv[m.a] === undefined || inv[m.b] === undefined) return;
    [inv[m.a], inv[m.b]] = [inv[m.b], inv[m.a]];
    p.invDirty = true;
    return;
  }
  const s = inv[m.slot];
  if (!s) return;
  const def = ITEMS[s.id];
  if (m.op === 'drop') {
    inv[m.slot] = null; p.invDirty = true;
    dropGround(s.id, s.q, p.x, p.z);
    return;
  }
  if (m.op === 'eat' && def.heal) {
    if (now() - (p.lastEat || 0) < 1700) return;
    p.lastEat = now();
    inv[m.slot] = null; p.invDirty = true;
    const max = lv(p, 'hitpoints');
    const before = p.rec.hp;
    p.rec.hp = Math.min(max, p.rec.hp + def.heal);
    if (p.duel) p.atk += 2;
    msg(p, `You eat the ${def.name.toLowerCase()}.${p.rec.hp > before ? ' It heals some health.' : ''}`);
    return;
  }
  if (m.op === 'wield' && def.slot) {
    if (def.req && lv(p, 'attack') < def.req) return msg(p, `You need an Attack level of ${def.req} to wield this.`);
    const old = p.rec.equip[def.slot];
    p.rec.equip[def.slot] = { id: s.id, q: 1 };
    inv[m.slot] = old || null;
    p.invDirty = p.equipDirty = true;
  }
}

function onGps(p, m) {
  const lat = +m.lat, lon = +m.lon, acc = +m.acc;
  if (!isFinite(lat) || !isFinite(lon)) return;
  if (p.deadUntil > now()) return;
  if (!(acc <= 60)) {
    if (now() - (p.lastWeak || 0) > 20_000) { p.lastWeak = now(); msg(p, `Your GPS signal is too weak (${Math.round(acc)}m). Try going outside.`); }
    return;
  }
  const t = toTile(lat, lon);
  const x = Math.round(t.x), z = Math.round(t.z);
  if (Math.abs(x) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) {
    if (now() - (p.lastFar || 0) > 30_000) { p.lastFar = now(); msg(p, "You're not in Amsterdam! Real-life mode only works in and around the city.", 'warn'); }
    return;
  }
  const ts = now();
  if (p.gps && p.real) {
    const dt = Math.max(0.5, (ts - p.gps.t) / 1000);
    const d = Math.hypot(x - p.gps.x, z - p.gps.z);
    if (d > 40 && d / dt > 20) return; // faster than a bike: ignore the jump
    const anchor = p.anchor;
    const ad = Math.hypot(x - anchor.x, z - anchor.z);
    if (ad >= 10 && ad / Math.max(1, (ts - anchor.t) / 1000) < 12) { addXp(p, 'exploring', Math.floor(ad * 4)); p.anchor = { x, z, t: ts }; }
    else if (ad >= 10) p.anchor = { x, z, t: ts };
  }
  p.gps = { x, z, t: ts };
  if (!p.real) {
    if (p.trade) cancelTrade(p.trade, null);
    p.real = true; p.path = []; p.pending = null;
    p.x = x; p.z = z; p.anchor = { x, z, t: ts };
    msg(p, 'You materialise in the real world! Walk around to move. Other real-life players nearby can see you.', 'real');
  }
  for (const l of LANDMARKS) {
    if (p.rec.flags['lm_' + l.name] || Math.hypot(x - l.at.x, z - l.at.z) > 45) continue;
    p.rec.flags['lm_' + l.name] = true;
    msg(p, `You discovered ${l.name}!`, 'level');
    addXp(p, 'exploring', 250);
  }
}

// ---------------------------------------------------------------- Login
const loginAttempts = new Map();

async function login(ws, ip, m) {
  const fail = text => ws.send(JSON.stringify({ t: 'err', text }));
  const tries = (loginAttempts.get(ip) || []).filter(t => t > now() - 60_000);
  if (tries.length >= 15) return fail('Too many login attempts. Please wait a minute.');
  tries.push(now()); loginAttempts.set(ip, tries);
  const name = String(m.name || '').trim(), pass = String(m.pass || '');
  if (!validName(name)) return fail('Usernames are 1-12 letters, numbers, spaces, - or _.');
  if (pass.length < 5 || pass.length > 64) return fail('Passwords must be 5-64 characters long.');
  const key = keyOf(name);
  let rec = db.get(key);
  if (m.create) {
    if (rec) return fail('That username is already taken.');
    rec = newRecord(name, sanitizeLook(m.look), await db.hashPassword(pass));
    db.put(key, rec);
  } else if (!rec || !(await db.checkPassword(pass, rec))) return fail('Invalid username or password.');
  if (ws.readyState !== 1) return;
  const old = online.get(key);
  if (old) { msg(old, 'You have been logged in from another location.', 'warn'); old.ws.close(); disconnect(old); }
  const p = {
    id: nextId++, ws, rec, key, name: rec.name, x: rec.x, z: rec.z, path: [], run: false, pending: null, iface: null,
    real: false, gps: null, duel: null, trade: null, atk: 0, reqs: { trade: new Map(), duel: new Map() }, msgCount: 0,
  };
  players.set(p.id, p); online.set(key, p);
  ws.player = p;
  send(p, { t: 'init', id: p.id, name: p.name, x: p.x, z: p.z, look: rec.look, inv: rec.inv, equip: rec.equip, xp: rec.xp, hp: rec.hp, energy: rec.energy, isNew: !!m.create });
  msg(p, 'Welcome to AmsterScape.');
  if (m.create) msg(p, 'Talk to the Gemeente Gids (right next to you) to get started.');
}

function disconnect(p) {
  if (!players.has(p.id)) return;
  if (p.trade) cancelTrade(p.trade, 'Other player has logged out.');
  if (p.duel) { msg(p.duel.opp, `${p.name} has logged out and forfeits the duel.`); endDuel(p, null); }
  p.rec.x = p.x; p.rec.z = p.z;
  players.delete(p.id);
  if (online.get(p.key) === p) online.delete(p.key);
  db.touch();
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
wss.on('connection', (ws, req) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  let busy = false;
  ws.on('message', async raw => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (ws.player) return handle(ws.player, m);
    if (m.t === 'login' && !busy) { busy = true; try { await login(ws, ip, m); } finally { busy = false; } }
  });
  ws.on('close', () => { if (ws.player) disconnect(ws.player); });
  ws.on('error', () => {});
});

// ---------------------------------------------------------------- Tick
function tick() {
  tickNo++;
  tickHits = [];
  const t = now();

  for (const s of spawnState) {
    if (s.gid && ground.has(s.gid)) continue;
    if (s.gid) { s.gid = 0; s.at = tickNo + s.def.respawn; }
    if (tickNo < s.at) continue;
    const [lo, hi] = s.def.q;
    s.gid = dropGround(s.def.item, lo + Math.floor(Math.random() * (hi - lo + 1)), s.def.at.x, s.def.at.z, 1e12, { spawn: s }).id;
  }
  for (const g of ground.values()) if (g.until < t) ground.delete(g.id);

  for (const n of npcs) {
    const w = n.def.wander;
    if (w && Math.random() < 0.12) {
      const nx = n.x + Math.round(Math.random() * 2 - 1), nz = n.z + Math.round(Math.random() * 2 - 1);
      if (cheb(nx, nz, n.def.at.x, n.def.at.z) <= w) { n.x = nx; n.z = nz; }
    }
    if (n.def.chatter && Math.random() < 0.006) say(n, 'n', n.def.chatter[Math.floor(Math.random() * n.def.chatter.length)]);
  }

  for (const p of players.values()) {
    p.msgCount = 0;
    if (p.real && p.gps && t - p.gps.t > 30_000) goGhost(p, 'You lost your GPS signal and fade into a ghost.');
    if (!p.duel) movePlayer(p);
    tryPending(p);
    if ((p.iface === 'shop' || p.iface === 'bank' || p.iface === 'dlg') && p.path.length) closeIface(p);
  }
  for (const p of players.values()) combatTick(p);
  for (const p of players.values()) {
    if (tickNo % 100 === 0 && p.rec.hp < lv(p, 'hitpoints')) p.rec.hp++;
    if (p.real && tickNo % 25 === 0 && Math.random() < 0.5) {
      let mine = 0;
      for (const g of ground.values()) if (g.forP === p.id) mine++;
      const spot = mine < 3 && randomWalkPoint(p.x, p.z, 25, 150);
      if (spot) {
        const r = rollTreasure();
        dropGround(r.item, r.q, spot.x, spot.z, 600_000, { forP: p.id });
        if (!mine) msg(p, 'You sense something shiny nearby... look for red dots on your minimap.');
      }
    }
  }

  for (const p of players.values()) {
    if (p.invDirty) { p.invDirty = false; sendInv(p); if (p.iface === 'bank') send(p, { t: 'bank', items: p.rec.bank }); }
    if (p.equipDirty) { p.equipDirty = false; sendEquip(p); }
    if (p.skillsDirty) { p.skillsDirty = false; sendSkills(p); }
    const ents = [];
    for (const o of players.values()) {
      if (!canSee(p, o)) continue;
      const eq = {};
      for (const s of EQUIP_SLOTS) if (o.rec.equip[s]) eq[s] = o.rec.equip[s].id;
      ents.push({ k: 'p', id: o.id, n: o.name, x: o.x, z: o.z, l: o.rec.look, eq, g: o.real ? 0 : 1, cb: cbLevel(o), hp: o.rec.hp, mhp: lv(o, 'hitpoints') });
    }
    for (const n of npcs) if (inRange(p, n, VIEW)) ents.push({ k: 'n', id: n.id, n: n.name, x: n.x, z: n.z, l: n.def.look, m: n.def.model, talk: !!n.def.talk, shop: !!n.def.shop, bank: !!n.def.bank });
    const items = [];
    for (const g of ground.values()) if (inRange(p, g, VIEW) && (!g.forP || g.forP === p.id)) items.push({ id: g.id, i: g.item, q: g.q, x: g.x, z: g.z });
    const hits = tickHits.filter(h => canSee(p, h.target)).map(h => ({ id: h.target.id, d: h.d, hp: h.target.rec.hp, mhp: lv(h.target, 'hitpoints') }));
    send(p, { t: 'tick', n: tickNo, you: { x: p.x, z: p.z, hp: p.rec.hp, mhp: lv(p, 'hitpoints'), en: Math.floor(p.rec.energy / 100), run: p.run, real: p.real, duel: p.duel ? p.duel.opp.id : 0 }, e: ents, gi: items, h: hits });
  }

  if (tickNo % 50 === 0) {
    for (const p of players.values()) { p.rec.x = p.x; p.rec.z = p.z; }
    db.touch(); db.save();
  }
}

setInterval(tick, TICK_MS);

function shutdown() {
  for (const p of players.values()) { p.rec.x = p.x; p.rec.z = p.z; }
  db.touch(); db.save();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => console.log(`AmsterScape running on http://localhost:${PORT}`));
