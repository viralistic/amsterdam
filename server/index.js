// AmsEscape server: static files, chunk API, the 600 ms game tick, and the plug-in API that content systems
// in server/systems/*.js use to add skills, monsters, quests and more. See docs/ENGINE.md.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { ITEMS, EQUIP_SLOTS, SKILLS, SPELLS, levelForXp, xpForLevel, combatLevel } from '../shared/items.js';
import { OBJECT_TYPES } from '../shared/objects.js';
import { REGIONS, regionAt, wildLevel, wildZoneName } from '../shared/regions.js';
import { toTile, toLatLon, cheb, CHUNK } from '../shared/geo.js';
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
const INTERIOR_BASE = 30000; // interiors and dungeons live far away from the real map, like old-school instances
const DEV = process.env.FAKE_MAP === '1'; // offline test mode enables ::tele, ::give and ::xp

db.load();

// ---------------------------------------------------------------- Plug-in registries
const reg = {
  tick: [], playerTick: [], login: [], logout: [], death: [], npcDeath: [], regionChange: [],
  objActions: {}, npcActions: {}, itemOps: {}, useOn: [], dialogActs: {}, messages: {}, commands: {}, routes: {},
  combat: [], hit: [], quests: {}, interiors: [], shopHooks: [],
};

// ---------------------------------------------------------------- HTTP
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const MOUNTS = [['/vendor/three-addons/', 'node_modules/three/examples/jsm/'], ['/vendor/three/', 'node_modules/three/build/'], ['/shared/', 'shared/'], ['/', 'public/']];

const server = http.createServer(async (req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  const m = url.match(/^\/api\/chunk\/(-?\d+)\/(-?\d+)$/);
  if (m) {
    const cx = +m[1], cz = +m[2];
    if (Math.abs(cx) > 200 || Math.abs(cz) > 200) { res.writeHead(400); return res.end(); }
    if (cx * CHUNK > WORLD_LIMIT + 1000 || cz * CHUNK > WORLD_LIMIT + 1000) { // interiors and dungeons, never OpenStreetMap
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      return res.end(JSON.stringify(interiorChunk(cx, cz)));
    }
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
  if (reg.routes[url]) {
    try { return await reg.routes[url](req, res); } catch (e) { console.error(e); res.writeHead(500); return res.end('Error'); }
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
const objects = new Map(); // id -> world object
const objChunks = new Map(); // "cx,cz" -> Set of objects
let nextId = 1, nextGroundId = 1, nextObjId = 1, tickNo = 0;
let tickHits = [];

const npcs = [];
const spawnState = SPAWNS.map(s => ({ def: s, gid: 0, at: 0 }));

const keyOf = name => name.trim().toLowerCase().replace(/[\s_-]+/g, '_');
const validName = n => /^[A-Za-z0-9][A-Za-z0-9 _-]{0,10}[A-Za-z0-9]$|^[A-Za-z0-9]$/.test(n);
const now = () => Date.now();
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function newRecord(name, look, auth) {
  const xp = Object.fromEntries(SKILLS.map(s => [s, 0]));
  xp.hitpoints = 1154;
  return { name, ...auth, look, x: SPAWN.x, z: SPAWN.z, inv: Array(28).fill(null), equip: {}, bank: [], xp, hp: 10, prayer: 1, energy: 10000, flags: {}, quests: {}, data: {}, style: 'controlled', retaliate: true, created: now() };
}

// ---------------------------------------------------------------- Helpers
const send = (p, m) => { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(m)); };
const msg = (p, text, kind = 'game', extra) => send(p, { t: 'msg', text, kind, ...extra });
const lv = (p, s) => levelForXp(p.rec.xp[s] || 0);
const levels = p => Object.fromEntries(SKILLS.map(s => [s, lv(p, s)]));
const cbLevel = p => combatLevel(levels(p));
const sendInv = p => send(p, { t: 'inv', inv: p.rec.inv });
const sendEquip = p => send(p, { t: 'equip', equip: p.rec.equip });
const sendSkills = p => send(p, { t: 'skills', xp: p.rec.xp });
const inRange = (a, b, r) => cheb(a.x, a.z, b.x, b.z) <= r;
const cap = s => s[0].toUpperCase() + s.slice(1);
const isPlayer = e => !!e?.rec;

function canSee(viewer, target) {
  if (viewer === target) return true;
  if (target.real && !viewer.real && !REAL_VISIBLE_TO_GHOSTS) return false;
  return inRange(viewer, target, VIEW);
}

function addXp(p, skill, amount) {
  if (!SKILLS.includes(skill) || !(amount > 0)) return;
  const before = lv(p, skill);
  p.rec.xp[skill] = Math.min(200_000_000, (p.rec.xp[skill] || 0) + amount);
  const after = lv(p, skill);
  send(p, { t: 'xp', skill, amount: Math.round(amount * 10) / 10 });
  if (after > before) {
    const name = cap(skill);
    msg(p, `Congratulations, you just advanced ${after === before + 1 ? 'a' : (after - before)} ${name} level${after > before + 1 ? 's' : ''}. Your ${name} level is now ${after}.`, 'level');
    send(p, { t: 'levelup', skill, level: after });
    if (skill === 'prayer') p.rec.prayer = Math.min(after, (p.rec.prayer || 1) + (after - before));
  }
  p.skillsDirty = true;
}

function freeSlots(p) { return p.rec.inv.filter(s => !s).length; }
function invCount(p, id) { return p.rec.inv.reduce((n, s) => n + (s && s.id === id ? s.q : 0), 0); }
function hasItem(p, id, q = 1) { return invCount(p, id) >= q; }

function canAdd(p, id, q = 1) {
  if (!ITEMS[id]) return false;
  if (ITEMS[id].stack) return p.rec.inv.some(s => s && s.id === id) || freeSlots(p) > 0;
  return freeSlots(p) >= q;
}

function invAdd(p, id, q = 1) {
  if (!canAdd(p, id, q)) return false;
  const inv = p.rec.inv;
  if (ITEMS[id].stack) {
    const s = inv.find(s => s && s.id === id);
    if (s) s.q = Math.min(2_147_483_647, s.q + q); else inv[inv.indexOf(null)] = { id, q };
  } else for (let i = 0; i < q; i++) inv[inv.indexOf(null)] = { id, q: 1 };
  p.invDirty = true;
  return true;
}

// Adds to the inventory, or drops on the ground (owned by the player) if there is no room.
function giveOrDrop(p, id, q = 1) {
  if (invAdd(p, id, q)) return true;
  dropGround(id, q, p.x, p.z, 180_000, { owner: p.id, forP: p.id, forUntil: now() + 60_000 });
  msg(p, `Your inventory is full, so the ${ITEMS[id].name.toLowerCase()} falls to the ground.`);
  return false;
}

function invRemove(p, id, q = 1) {
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
  const b = { att: 0, str: 0, def: 0, rng: 0, rstr: 0, mag: 0, pray: 0 };
  for (const s of Object.values(p.rec.equip)) if (s) for (const k in b) b[k] += ITEMS[s.id]?.[k] || 0;
  return b;
}

function dropGround(item, q, x, z, ms = 180_000, extra = {}) {
  const g = { id: nextGroundId++, item, q, x, z, until: now() + ms, ...extra };
  ground.set(g.id, g);
  return g;
}

// Per-player and server-wide storage for content systems, saved with the account / world file.
const playerStore = (p, ns) => ((p.rec.data ??= {})[ns] ??= {});

// ---------------------------------------------------------------- World objects
const chunkKey = (x, z) => `${Math.floor(x / CHUNK)},${Math.floor(z / CHUNK)}`;

function spawnObject({ type, x, z, rot = 0, data = {} }) {
  if (!OBJECT_TYPES[type]) throw new Error('Unknown object type ' + type);
  const o = { id: nextObjId++, type, x: Math.round(x), z: Math.round(z), rot, data, dep: 0, t: type };
  objects.set(o.id, o);
  const k = chunkKey(o.x, o.z);
  if (!objChunks.has(k)) objChunks.set(k, new Set());
  objChunks.get(k).add(o);
  return o;
}

function removeObject(o) {
  objects.delete(o.id);
  objChunks.get(chunkKey(o.x, o.z))?.delete(o);
}

// Use up an object (tree to stump, rock to empty rock) for a number of ticks.
function deplete(o, ticks) { o.dep = tickNo + Math.max(1, Math.round(ticks)); }
const isDepleted = o => o.dep > tickNo;

function objectsNear(x, z, r) {
  const out = [];
  const c0x = Math.floor((x - r) / CHUNK), c1x = Math.floor((x + r) / CHUNK), c0z = Math.floor((z - r) / CHUNK), c1z = Math.floor((z + r) / CHUNK);
  for (let cx = c0x; cx <= c1x; cx++) for (let cz = c0z; cz <= c1z; cz++) for (const o of objChunks.get(`${cx},${cz}`) || []) if (cheb(o.x, o.z, x, z) <= r) out.push(o);
  return out;
}

// ---------------------------------------------------------------- NPCs
function spawnNpc(def) {
  const n = { id: npcs.length + 1, def, x: def.at.x, z: def.at.z, name: def.name, hp: def.combat?.hp || 0, dead: 0, target: null, atk: 0, dmgBy: new Map(), inside: def.at.x >= INTERIOR_BASE || def.at.z >= INTERIOR_BASE };
  npcs.push(n);
  return n;
}
for (const d of NPCS) spawnNpc(d);

const npcLevel = n => n.def.combat?.lvl || 0;

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

function stepToward(e, tx, tz) {
  e.x += Math.sign(tx - e.x);
  e.z += Math.sign(tz - e.z);
}

function movePlayer(p) {
  if (p.real && !p.inside) {
    if (!p.gps) return;
    const d = cheb(p.x, p.z, p.gps.x, p.gps.z);
    if (d > 60) { p.x = p.gps.x; p.z = p.gps.z; return; }
    for (let i = 0; i < 4 && (p.x !== p.gps.x || p.z !== p.gps.z); i++) stepToward(p, p.gps.x, p.gps.z);
    return;
  }
  if (!p.path.length) {
    if (p.rec.energy < 10000) p.rec.energy = Math.min(10000, p.rec.energy + 8 + Math.floor(lv(p, 'agility') / 6) * 4);
    return;
  }
  const steps = p.run && p.rec.energy >= 67 && p.path.length > 1 ? 2 : 1;
  for (let i = 0; i < steps && p.path.length; i++) {
    const [tx, tz] = p.path[0];
    stepToward(p, tx, tz);
    if (p.x === tx && p.z === tz) p.path.shift();
  }
  if (steps === 2) {
    p.rec.energy = Math.max(0, p.rec.energy - Math.max(30, 67 - lv(p, 'agility') / 3));
    if (p.rec.energy < 67) { p.run = false; send(p, { t: 'run', on: false }); }
  }
}

function teleport(p, x, z, { inside } = {}) {
  p.x = Math.round(x); p.z = Math.round(z);
  p.path = []; p.pending = null; p.target = null; p.action = null;
  if (inside !== undefined) p.inside = !!inside;
  if (!p.inside && p.real && p.gps) { p.x = p.gps.x; p.z = p.gps.z; }
  p.teleported = true;
  updateRegion(p);
}

// Teleport spells and items are blocked deep in the Wilderness, like the old level 20 rule.
function canTeleport(p) {
  if (p.wild > 20) { msg(p, "A magical force stops you from teleporting above level 20 Wilderness."); return false; }
  if (p.real && !p.inside) { msg(p, "You're in real-life mode: you can only travel by actually going there!"); return false; }
  return true;
}

// ---------------------------------------------------------------- Regions & Wilderness
function interiorAt(x, z) { return reg.interiors.find(i => x >= i.x0 && x <= i.x1 && z >= i.z0 && z <= i.z1); }

function updateRegion(p) {
  const inner = interiorAt(p.x, p.z);
  const r = inner ? { id: 'int_' + inner.id, name: inner.name, type: inner.wild ? 'wild' : 'interior' } : regionAt(p.x, p.z);
  const wild = inner ? (inner.wild || 0) : wildLevel(p.x, p.z);
  if (r.id !== p.region || wild !== p.wild) {
    const was = p.region;
    p.region = r.id; p.wild = wild;
    send(p, { t: 'region', id: r.id, name: r.name, type: r.type, role: r.role || '', wild, zone: wild ? wildZoneName(wild) : '' });
    if (was !== r.id) for (const f of reg.regionChange) f(p, r, was);
    if (wild && !p.warnedWild) { p.warnedWild = true; msg(p, 'WARNING: You have entered the Wilderness. Other players of the same mode can attack you here, and you lose items if you die.', 'warn'); }
  }
}

// PvP happens only in the Wilderness, between players of the same mode, within the level range.
function pvpAllowed(a, b) {
  const ia = interiorAt(a.x, a.z);
  if (ia?.pvp && ia === interiorAt(b.x, b.z)) return true; // arenas: anyone inside may fight anyone inside
  if (!a.wild || !b.wild) return false;
  if (a.real !== b.real) return false;
  return Math.abs(cbLevel(a) - cbLevel(b)) <= Math.min(a.wild, b.wild);
}

// ---------------------------------------------------------------- Interfaces & dialogue
function closeIface(p) {
  if (p.trade) cancelTrade(p.trade, `${p.name} declined the trade.`);
  if (p.iface) send(p, { t: 'iface', close: true });
  p.iface = null; p.dlg = null; p.shop = null; p.make = null;
}

// Dialogue scripts: { node: [steps] }. Steps: {npc}, {player} (text or fn(p)), {opts: [[label, node, cond?]]},
// {act: name | fn(p, npc, api) -> node | 'stop' | null}, {goto: node}, {if: fn(p), then: node, else: node}.
function startDialog(p, npc, script, who) {
  closeIface(p);
  const sc = typeof script === 'object' ? script : DIALOGS[script || npc?.def.talk];
  if (!sc) return;
  p.iface = 'dlg';
  p.dlg = { npc, who: who || npc?.name || '', script: sc, node: 'start', i: 0 };
  showDialog(p);
}

function showDialog(p) {
  const d = p.dlg;
  for (let guard = 0; guard < 60; guard++) {
    if (d.node === 'end') return endDialog(p);
    const step = d.script[d.node]?.[d.i];
    if (!step) return endDialog(p);
    if (step.goto) { d.node = step.goto; d.i = 0; continue; }
    if (step.if) { d.node = step.if(p, d.npc, api) ? step.then : step.else; d.i = 0; continue; }
    if (step.act) {
      d.i++;
      const next = typeof step.act === 'function' ? step.act(p, d.npc, api) : dialogAction(p, step.act);
      if (next === 'stop' || p.dlg !== d) return;
      if (next) { d.node = next; d.i = 0; }
      continue;
    }
    if (step.opts) {
      d.opts = step.opts.filter(o => !o[2] || o[2](p, d.npc, api));
      return send(p, { t: 'dlg', opts: d.opts.map(o => o[0]) });
    }
    const isNpc = step.npc !== undefined;
    let text = isNpc ? step.npc : step.player;
    if (typeof text === 'function') text = text(p, d.npc, api);
    if (step.item) return send(p, { t: 'dlg', who: '', side: 'item', item: step.item, text });
    return send(p, { t: 'dlg', who: isNpc ? d.who : p.name, side: isNpc ? 'npc' : 'player', text, npc: d.npc?.id });
  }
  endDialog(p);
}

function endDialog(p) {
  if (p.iface === 'dlg') { p.iface = null; p.dlg = null; send(p, { t: 'iface', close: true }); }
}

function dialogAction(p, act) {
  const npc = p.dlg.npc;
  if (reg.dialogActs[act]) return reg.dialogActs[act](p, npc, api);
  switch (act) {
    case 'shop': openShop(p, npc.def.shop); return 'stop';
    case 'bank': openBank(p); return 'stop';
    case 'starter':
      if (p.rec.flags.starter) return 'kitno';
      if (freeSlots(p) < 5) { msg(p, "You don't have enough inventory space."); return 'end'; }
      p.rec.flags.starter = true;
      invAdd(p, 'bronze_dagger', 1); invAdd(p, 'stroopwafel', 3); invAdd(p, 'coins', 25);
      for (const extra of ['bronze_axe', 'small_net', 'bronze_pickaxe', 'tinderbox']) if (ITEMS[extra]) invAdd(p, extra, 1);
      return 'kityes';
    case 'buybell':
      if (invCount(p, 'coins') < 50) return 'broke';
      if (!canAdd(p, 'bike_bell', 1)) { msg(p, "You don't have enough inventory space."); return 'end'; }
      invRemove(p, 'coins', 50); invAdd(p, 'bike_bell', 1);
      return 'sold';
    case 'tip':
      if (!invRemove(p, 'coins', 5)) return 'poor';
      return 'thanks';
    case 'archery': {
      const w = p.rec.equip.weapon && ITEMS[p.rec.equip.weapon.id];
      if (w?.style !== 'ranged') return 'nobow';
      if (!invRemove(p, 'coins', 10)) return 'broke';
      p.archery = { shots: 10, score: 0, wait: 2, judge: npc };
      return 'started';
    }
  }
  return null;
}

// Shops: { name, stock: [ids], general? , limits?: {id: max per restock} }. Prices may be adjusted by shop hooks.
function shopPrice(shop, id, selling) {
  let price = selling ? Math.floor(ITEMS[id].value * (shop.sellRate ?? 0.4)) : Math.ceil(ITEMS[id].value * (shop.buyRate ?? 1));
  for (const h of reg.shopHooks) price = h(shop, id, selling, price) ?? price;
  return price;
}

function openShop(p, shopId) {
  closeIface(p);
  const shop = typeof shopId === 'object' ? shopId : SHOPS[shopId];
  if (!shop) return;
  p.iface = 'shop'; p.shop = shop;
  sendShop(p);
}

function sendShop(p) {
  const shop = p.shop;
  send(p, { t: 'shop', name: shop.name, stock: shop.stock.map(id => ({ id, price: shopPrice(shop, id, false), q: shop.left?.[id] })) });
}

function openBank(p) {
  closeIface(p);
  p.iface = 'bank';
  send(p, { t: 'bank', items: p.rec.bank });
}

// "What would you like to make?" with item pictures. onPick(p, option, qty) runs when the player chooses.
function makeMenu(p, { title, options, onPick }) {
  closeIface(p);
  p.iface = 'make';
  p.make = { options, onPick };
  send(p, { t: 'make', title: title || 'What would you like to make?', items: options.map(o => ({ id: o.item, label: o.label || ITEMS[o.item]?.name })) });
}

// Repeating skilling action, OSRS style: runs step(p) every few ticks until it returns false or the player moves.
function startAction(p, { first = 1, every = 4, anim = null, step, obj = null, name = '' }) {
  p.action = { wait: first, every, anim, step, obj, name };
  p.anim = anim;
}
function stopAction(p) { p.action = null; p.anim = null; }

// Generic gathering (woodcutting, mining, fishing): see docs/ENGINE.md for the cfg fields.
function gather(p, obj, cfg) {
  const skill = cfg.skill;
  if (isDepleted(obj)) return msg(p, cfg.depletedMsg || 'There is nothing left to gather here right now.');
  if (lv(p, skill) < (cfg.level || 1)) return msg(p, `You need a ${cap(skill)} level of ${cfg.level} to do that.`);
  let tool = null;
  if (cfg.tools?.length) {
    const owned = cfg.tools.filter(t => (hasItem(p, t.id) || p.rec.equip.weapon?.id === t.id) && lv(p, skill) >= (t.level || 1));
    tool = owned.sort((a, b) => (b.power || 0) - (a.power || 0))[0];
    if (!tool) return msg(p, cfg.toolMsg || `You need a suitable tool to do that.`);
  }
  if (cfg.bait && !hasItem(p, cfg.bait)) return msg(p, `You don't have any ${ITEMS[cfg.bait].name.toLowerCase()}.`);
  if (!freeSlots(p) && !(ITEMS[cfg.item]?.stack && hasItem(p, cfg.item))) return msg(p, 'Your inventory is too full to hold any more.');
  if (cfg.startMsg) msg(p, cfg.startMsg);
  startAction(p, {
    first: 2, every: cfg.every || 4, anim: cfg.anim, obj, name: skill,
    step: pl => {
      if (isDepleted(obj) || !objects.has(obj.id)) return false;
      if (cfg.bait && !hasItem(pl, cfg.bait)) { msg(pl, `You have run out of ${ITEMS[cfg.bait].name.toLowerCase()}.`); return false; }
      const level = lv(pl, skill);
      const chance = cfg.chance ? cfg.chance(level, tool) : Math.min(0.95, 0.35 + (level - (cfg.level || 1)) * 0.012 + (tool?.power || 0) * 0.04);
      if (Math.random() >= chance) return true;
      const item = typeof cfg.item === 'function' ? cfg.item(pl, level) : cfg.item;
      if (!item) return true;
      if (!canAdd(pl, item, 1)) { msg(pl, 'Your inventory is too full to hold any more.'); return false; }
      invAdd(pl, item, 1);
      if (cfg.bait) invRemove(pl, cfg.bait, 1);
      addXp(pl, skill, typeof cfg.xp === 'function' ? cfg.xp(item) : cfg.xp);
      if (cfg.successMsg) msg(pl, typeof cfg.successMsg === 'function' ? cfg.successMsg(item) : cfg.successMsg);
      if (cfg.onSuccess) cfg.onSuccess(pl, item, obj);
      if (cfg.deplete && Math.random() < cfg.deplete) {
        deplete(obj, Array.isArray(cfg.respawn) ? rand(cfg.respawn[0], cfg.respawn[1]) : cfg.respawn || 50);
        if (cfg.depleteMsg) msg(pl, cfg.depleteMsg);
        return false;
      }
      return true;
    },
  });
}

// ---------------------------------------------------------------- Quests
function questDef(id) { return reg.quests[id]; }
function getQ(p, id) { return p.rec.quests?.[id] || 0; }
function setQ(p, id, stage) {
  (p.rec.quests ??= {})[id] = stage;
  sendQuests(p);
  db.touch();
}
const questDone = (p, id) => getQ(p, id) >= (questDef(id)?.done ?? 100);
const questPoints = p => Object.values(reg.quests).reduce((n, q) => n + (questDone(p, q.id) ? q.points || 1 : 0), 0);

function sendQuests(p) {
  send(p, { t: 'quests', qp: questPoints(p), list: Object.values(reg.quests).map(q => ({ id: q.id, name: q.name, state: questDone(p, q.id) ? 2 : getQ(p, q.id) > 0 ? 1 : 0 })) });
}

function completeQuest(p, id, { xp = {}, items = [], coins = 0, text = [] } = {}) {
  const q = questDef(id);
  if (!q || questDone(p, id)) return;
  setQ(p, id, q.done ?? 100);
  const lines = [`${q.points || 1} Quest Point${(q.points || 1) > 1 ? 's' : ''}`];
  for (const [s, n] of Object.entries(xp)) { addXp(p, s, n); lines.push(`${n.toLocaleString()} ${cap(s)} XP`); }
  for (const [id2, n] of items) { giveOrDrop(p, id2, n); lines.push(`${n > 1 ? n + ' x ' : ''}${ITEMS[id2].name}`); }
  if (coins) { giveOrDrop(p, 'coins', coins); lines.push(`${coins.toLocaleString()} coins`); }
  lines.push(...text);
  send(p, { t: 'questdone', name: q.name, rewards: lines, qp: questPoints(p) });
  msg(p, `Congratulations! Quest complete: ${q.name}.`, 'level');
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
    for (const s of tr.offer.get(p.id)) if (!invAdd(p, s.id, s.q)) dropGround(s.id, s.q, p.x, p.z, 180_000, { owner: p.id });
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
      if (ITEMS[s.id].tradeable === false) return msg(p, "You can't trade that item.");
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
        const give = (to, items) => { for (const s of items) if (!invAdd(to, s.id, s.q)) dropGround(s.id, s.q, to.x, to.z, 180_000, { owner: to.id }); };
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

// ---------------------------------------------------------------- Combat
// Entities are players (p.rec) or NPCs (n.def.combat). Duels, Wilderness PvP and monster fights share this code.
const hpOf = e => isPlayer(e) ? e.rec.hp : e.hp;
const maxHpOf = e => isPlayer(e) ? lv(e, 'hitpoints') : e.def.combat.hp;
const alive = e => isPlayer(e) ? players.has(e.id) && !(e.deadUntil > now()) : !e.dead;

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
  if (p.target === o) p.target = null;
  if (o.duel?.opp === p) { o.duel = null; if (o.target === p) o.target = null; if (text) msg(o, text); }
}

function say(ent, kind, text) {
  for (const v of players.values()) if (kind === 'n' ? inRange(v, ent, VIEW) : canSee(v, ent)) send(v, { t: 'say', k: kind, id: ent.id, name: ent.name, text });
}

// Works out how a player attacks with what they hold, using up arrows or runes as it goes.
function attackStyle(p, w) {
  if (w?.style === 'ranged') {
    const ammo = p.rec.equip.ammo;
    if (!ammo || ITEMS[ammo.id].slot !== 'ammo') { if (!p.warnedAmmo) { p.warnedAmmo = true; msg(p, 'There is no ammo left in your quiver.'); } return { kind: 'melee' }; }
    ammo.q--;
    if (ammo.q <= 0) { delete p.rec.equip.ammo; msg(p, 'That was your last arrow.'); }
    p.equipDirty = true;
    return { kind: 'ranged', ammo: ammo.id };
  }
  if (w?.style === 'magic') {
    const magic = lv(p, 'magic');
    const has = (id, n) => w.provides === id || invCount(p, id) >= n;
    const spell = SPELLS.find(sp => sp.lvl <= magic && Object.entries(sp.runes).every(([id, n]) => has(id, n)));
    if (!spell) { if (!p.warnedRunes) { p.warnedRunes = true; msg(p, "You don't have enough runes to cast a spell. You bash them with your staff instead."); } return { kind: 'melee' }; }
    for (const [id, n] of Object.entries(spell.runes)) if (w.provides !== id) invRemove(p, id, n);
    return { kind: 'magic', spell };
  }
  return { kind: 'melee' };
}

function weaponOf(e) { return isPlayer(e) && e.rec.equip.weapon ? ITEMS[e.rec.equip.weapon.id] : null; }

function attackRange(e) {
  if (!isPlayer(e)) return e.def.combat.range || 1;
  const w = weaponOf(e);
  const base = w?.style === 'ranged' ? 7 : w?.style === 'magic' ? 10 : 1;
  if (e.duel) return 40; // duellists stand wherever their GPS puts them
  return e.real && !e.inside ? Math.max(base, 6) : base;
}

const STYLE_BOOST = { accurate: [3, 0, 0], aggressive: [0, 3, 0], defensive: [0, 0, 3], controlled: [1, 1, 1] };

function doAttack(a, d) {
  const roll = (att, def) => att > def ? 1 - (def + 2) / (2 * (att + 1)) : att / (2 * (def + 1));
  const ab = isPlayer(a) ? bonuses(a) : null, db2 = isPlayer(d) ? bonuses(d) : null;
  const dc = !isPlayer(d) && d.def.combat;
  const defLvl = isPlayer(d) ? lv(d, 'defence') + STYLE_BOOST[d.rec.style || 'controlled'][2] : dc.def;
  const defBonus = isPlayer(d) ? db2.def : dc.defBonus || 0;
  let style, chance, maxHit, proj = null;
  if (isPlayer(a)) {
    style = attackStyle(a, weaponOf(a));
    const boost = STYLE_BOOST[a.rec.style || 'controlled'];
    if (style.kind === 'ranged') {
      chance = roll((lv(a, 'ranged') + 8) * (ab.rng + 64), (defLvl + 9) * (defBonus + 64));
      maxHit = Math.floor(0.5 + (lv(a, 'ranged') + 8) * (ab.rstr + 64) / 640);
      proj = { kind: 'arrow', color: ITEMS[style.ammo].metal };
    } else if (style.kind === 'magic') {
      const mdef = isPlayer(d) ? Math.floor(lv(d, 'magic') * 0.7 + defLvl * 0.3) : dc.mag ?? dc.def;
      chance = roll((lv(a, 'magic') + 9) * (ab.mag + 64), (mdef + 9) * (defBonus + (db2?.mag || 0) + 64));
      maxHit = style.spell.max;
      proj = { kind: 'spell', color: style.spell.color };
    } else {
      chance = roll((lv(a, 'attack') + boost[0] + 8) * (ab.att + 64), (defLvl + 9) * (defBonus + 64));
      maxHit = Math.floor(0.5 + (lv(a, 'strength') + boost[1] + 8) * (ab.str + 64) / 640);
    }
  } else {
    const c = a.def.combat;
    style = { kind: c.style || 'melee' };
    chance = roll((c.att + 8) * ((c.attBonus || 0) + 64), (defLvl + 9) * (defBonus + 64));
    maxHit = c.maxHit;
    if (style.kind === 'ranged') proj = { kind: 'arrow', color: c.projColor || '#8a8a8e' };
    if (style.kind === 'magic') proj = { kind: 'spell', color: c.projColor || '#a040ff' };
  }
  const ctx = { attacker: a, defender: d, style, chance, maxHit, dmg: null, api };
  for (const h of reg.combat) h(ctx);
  let dmg = ctx.dmg ?? (Math.random() < ctx.chance ? rand(0, Math.max(0, Math.floor(ctx.maxHit))) : 0);
  ctx.dmg = dmg;
  for (const h of reg.hit) h(ctx);
  dmg = Math.max(0, Math.min(Math.floor(ctx.dmg), hpOf(d)));
  if (isPlayer(d)) d.rec.hp -= dmg; else { d.hp -= dmg; if (isPlayer(a)) d.dmgBy.set(a.id, (d.dmgBy.get(a.id) || 0) + dmg); }
  tickHits.push({ target: d, from: a, d: dmg, proj });
  a.anim = 'attack'; a.animUntil = tickNo + 1;
  if (isPlayer(a)) {
    a.lastCombat = tickNo;
    if (style.kind === 'ranged') { addXp(a, 'ranged', dmg * 4); if (dmg) addXp(a, 'hitpoints', dmg * 4 / 3); }
    else if (style.kind === 'magic') { addXp(a, 'magic', style.spell.xp + dmg * 2); if (dmg) addXp(a, 'hitpoints', dmg * 4 / 3); }
    else if (dmg > 0) {
      const st = a.rec.style || 'controlled';
      if (st === 'controlled') for (const s of ['attack', 'strength', 'defence']) addXp(a, s, dmg * 4 / 3);
      else addXp(a, { accurate: 'attack', aggressive: 'strength', defensive: 'defence' }[st], dmg * 4);
      addXp(a, 'hitpoints', dmg * 4 / 3);
    }
  }
  if (isPlayer(d)) {
    d.lastCombat = tickNo;
    if (!d.target && d.rec.retaliate !== false && !d.action && !d.path.length) d.target = a;
    if (isPlayer(a)) d.aggressors.set(a.id, now());
  } else if (!d.target) d.target = a;
  if (hpOf(d) <= 0) {
    if (isPlayer(d)) die(d, a);
    else npcDie(d, a);
    if (a.target === d) a.target = null;
  }
}

function attackTarget(p, t) {
  if (!alive(t)) return false;
  if (isPlayer(t)) {
    if (t === p) return false;
    if (p.duel) return p.duel.opp === t;
    if (!pvpAllowed(p, t)) return false;
    // attacking someone who hasn't attacked you first gets you skulled (not in safe arenas)
    if (!interiorAt(p.x, p.z)?.safeDeath && !(p.aggressors.get(t.id) > now() - 20 * 60_000)) {
      if (!(p.skullUntil > now())) msg(p, 'You have been skulled! You will lose all your items if you die.', 'warn');
      p.skullUntil = now() + 20 * 60_000;
    }
  }
  return true;
}

function playerCombat(p) {
  const t = p.target;
  if (!t) return;
  if (!alive(t) || (isPlayer(t) && !canSee(p, t)) || (!isPlayer(t) && !t.def.combat)) { p.target = null; return; }
  if (isPlayer(t) && !p.duel && !pvpAllowed(p, t)) { p.target = null; return; }
  if (p.duel && p.duel.count > 0) return;
  if (cheb(p.x, p.z, t.x, t.z) > attackRange(p)) {
    if (p.real && !p.inside) { if (++p.chase > 20) { msg(p, 'You need to get closer, in real life!'); p.target = null; } return; }
    if (!p.path.length) stepToward(p, t.x, t.z);
    if (++p.chase > 40) p.target = null;
    return;
  }
  p.chase = 0;
  if (p.atk > 0) return;
  const w = weaponOf(p);
  p.atk = w?.speed || 4;
  doAttack(p, t);
}

function npcCombat(n) {
  const c = n.def.combat;
  const home = n.def.home || n.def.at;
  const t = n.target;
  const leash = (n.def.wander || 3) + (c.leash || 12);
  if (!t || !alive(t) || (isPlayer(t) && (t.inside !== n.inside || cheb(n.x, n.z, home.x, home.z) > leash + 4))) {
    n.target = null;
    if (cheb(n.x, n.z, home.x, home.z) > (n.def.wander || 0)) stepToward(n, home.x, home.z);
    return;
  }
  if (cheb(n.x, n.z, t.x, t.z) > (c.range || 1)) {
    if (cheb(n.x, n.z, home.x, home.z) < leash) stepToward(n, t.x, t.z);
    else n.target = null;
    return;
  }
  if (n.atk > 0) return;
  n.atk = c.speed || 4;
  if (c.special && Math.random() < (c.special.chance || 0.2)) {
    const handled = c.special.run?.(n, t, api);
    if (handled) return;
  }
  doAttack(n, t);
}

function npcAggro(n) {
  const c = n.def.combat;
  if (!c.aggressive || n.target) return;
  const r = c.aggroRange || 4;
  for (const p of players.values()) {
    if (p.inside !== n.inside) continue;
    if (cheb(n.x, n.z, p.x, p.z) > r || !alive(p)) continue;
    if (!p.wild && cbLevel(p) > c.lvl * 2) continue;
    if (p.rec.flags.tolerant?.[n.def.type || n.name] > now()) continue;
    n.target = p;
    if (!p.target && p.rec.retaliate !== false && !p.action) p.target = n;
    return;
  }
}

// Drop tables: { always: [[item, q]], rolls, table: [[weight, item, min, max]], rare: [[oneIn, item, q]] } or fn(n, killer) -> [[item, q]].
function rollDrops(def, n, killer) {
  if (typeof def === 'function') return def(n, killer, api) || [];
  const out = [...(def.always || [])];
  const total = (def.table || []).reduce((s, r) => s + r[0], 0);
  for (let i = 0; i < (def.rolls || 1) && total; i++) {
    let r = Math.random() * total;
    for (const [w, item, lo = 1, hi = lo] of def.table) if ((r -= w) <= 0) { if (item) out.push([item, rand(lo, hi)]); break; }
  }
  for (const [oneIn, item, q = 1] of def.rare || []) if (Math.random() < 1 / oneIn) out.push([item, q]);
  return out;
}

function npcDie(n, killer) {
  const c = n.def.combat;
  n.dead = tickNo + (n.def.respawn || 25);
  n.target = null;
  let top = null, best = -1;
  for (const [pid, d] of n.dmgBy) if (d > best && players.has(pid)) { best = d; top = players.get(pid); }
  if (!top && isPlayer(killer)) top = killer;
  n.dmgBy.clear();
  if (n.def.drops && top) {
    for (const [item, q] of rollDrops(n.def.drops, n, top)) {
      if (!ITEMS[item]) continue;
      dropGround(item, q, n.x, n.z, 180_000, { owner: top.id, forP: top.id, forUntil: now() + 60_000 });
    }
  }
  for (const f of reg.npcDeath) f(n, top, api);
  if (c.boss && top) msg(top, `You have defeated ${n.name}!`, 'level');
}

function respawnNpc(n) {
  n.dead = 0;
  n.hp = n.def.combat?.hp || 0;
  n.x = n.def.at.x; n.z = n.def.at.z;
}

function valueOf(s) { return (ITEMS[s.id]?.value || 0) * (ITEMS[s.id]?.stack ? 1 : 1); }

function die(p, killer) {
  const killerName = killer ? killer.name : '';
  p.target = null; p.action = null; p.anim = null;
  for (const n of npcs) if (n.target === p) n.target = null;
  if (p.duel) {
    const coins = invCount(p, 'coins');
    if (coins > 0) { invRemove(p, 'coins', coins); dropGround('coins', coins, p.x, p.z, 120_000); }
    if (coins) msg(p, `You dropped ${coins} coins where you fell. ${killerName} might grab them!`);
    if (isPlayer(killer)) { msg(killer, `You have defeated ${p.name}!`, 'duel'); killer.rec.hp = lv(killer, 'hitpoints'); }
    endDuel(p, null);
  } else if (interiorAt(p.x, p.z)?.safeDeath) {
    msg(p, 'This is a safe area: you keep all your items.');
  } else if (p.wild) {
    // Wilderness death: keep your 3 most valuable items (none when skulled); the rest stays where you fell
    const all = [];
    for (let i = 0; i < 28; i++) if (p.rec.inv[i]) all.push({ from: 'inv', i, s: p.rec.inv[i] });
    for (const sl of EQUIP_SLOTS) if (p.rec.equip[sl]) all.push({ from: 'eq', sl, s: p.rec.equip[sl] });
    all.sort((a, b) => valueOf(b.s) - valueOf(a.s));
    const keep = p.skullUntil > now() ? 0 : 3;
    const owner = isPlayer(killer) ? killer.id : p.id;
    for (const e of all.slice(keep)) {
      dropGround(e.s.id, e.s.q, p.x, p.z, 300_000, { owner, forP: owner, forUntil: now() + 60_000 });
      if (e.from === 'inv') p.rec.inv[e.i] = null; else delete p.rec.equip[e.sl];
    }
    p.invDirty = p.equipDirty = true;
    msg(p, keep ? 'You kept your 3 most valuable items. The rest lies where you fell.' : 'You were skulled, so you lost everything you carried.', 'warn');
    if (isPlayer(killer)) msg(killer, `You have defeated ${p.name}! Their loot is yours.`, 'level');
  }
  for (const f of reg.death) f(p, killer, api);
  msg(p, 'Oh dear, you are dead!', 'warn');
  p.rec.hp = lv(p, 'hitpoints');
  p.rec.prayer = lv(p, 'prayer');
  p.skullUntil = 0;
  const respawnAt = interiorAt(p.x, p.z)?.respawn || SPAWN;
  p.inside = interiorAt(respawnAt.x, respawnAt.z) !== undefined;
  p.x = respawnAt.x; p.z = respawnAt.z; p.path = []; p.pending = null;
  p.real = false; p.gps = null; p.deadUntil = now() + 3000;
  send(p, { t: 'death' });
  updateRegion(p);
}

function goGhost(p, text) {
  if (!p.real) return;
  p.real = false; p.gps = null;
  if (p.duel) { msg(p.duel.opp, `${p.name} faded away and forfeits the duel.`); endDuel(p, null); }
  if (isPlayer(p.target)) p.target = null;
  msg(p, text);
}

// Archery competition: one shot every two ticks, scored on a five-ring target.
function archeryTick(p) {
  const a = p.archery;
  if (!a) return;
  if (cheb(p.x, p.z, a.judge.x, a.judge.z) > 25) { p.archery = null; msg(p, 'You walked away from the competition.'); return; }
  if (--a.wait > 0) return;
  a.wait = 2;
  const w = weaponOf(p);
  const skill = lv(p, 'ranged') + (w?.rng || 0);
  const r = Math.random() * 100 - Math.min(45, skill * 0.6);
  const [pts, text] = r < 5 ? [100, 'Bullseye!'] : r < 20 ? [50, 'Hit the yellow!'] : r < 40 ? [30, 'Hit the red.'] : r < 60 ? [20, 'Hit the blue.'] : r < 80 ? [10, 'Hit the black.'] : [0, 'Missed the target!'];
  a.score += pts;
  a.shots--;
  msg(p, `${text} (${pts} points, ${a.score} total, ${a.shots} shots left)`);
  if (pts >= 50) say(a.judge, 'n', text);
  addXp(p, 'ranged', pts / 2);
  p.anim = 'attack'; p.animUntil = tickNo + 1;
  if (a.shots > 0) return;
  const prize = Math.floor(a.score / 8);
  msg(p, `The competition is over. You scored ${a.score} points${prize ? ` and win ${prize} coins!` : '.'}`, 'level');
  if (prize) giveOrDrop(p, 'coins', prize);
  say(a.judge, 'n', a.score >= 500 ? 'Outstanding shooting!' : a.score >= 250 ? 'Well done!' : 'Better luck next time.');
  p.archery = null;
}

// ---------------------------------------------------------------- Interaction
function resolveTarget(a) {
  if (a.kind === 'npc') { const n = npcs.find(n => n.id === a.id); return n && !n.dead ? n : null; }
  if (a.kind === 'player') return players.get(a.id);
  if (a.kind === 'ground') return ground.get(a.id);
  if (a.kind === 'obj') return objects.get(a.id);
}

function actionRange(p, a) {
  if (a.action === 'take') return p.real && !p.inside ? REAL_RANGE : 0;
  if (a.action === 'trade' && a.kind === 'player') return 16;
  if (a.action === 'challenge') return 30;
  if (a.action === 'attack') return 9999; // combat handles its own range
  const real = p.real && !p.inside;
  if (a.kind === 'obj') { const t = OBJECT_TYPES[a.type]; return real ? REAL_RANGE : Math.max(1, Math.ceil(Math.max(...(t?.size || [1, 1])) / 2)) + (t?.reach || 0); }
  return real ? REAL_RANGE : 2;
}

function tryPending(p) {
  const a = p.pending;
  if (!a) return;
  const tgt = resolveTarget(a);
  if (!tgt || (a.kind === 'player' && !canSee(p, tgt))) { p.pending = null; return; }
  if (a.kind === 'obj') a.type = tgt.type;
  if (cheb(p.x, p.z, tgt.x, tgt.z) <= actionRange(p, a)) {
    p.pending = null; p.path = [];
    return doAction(p, a, tgt);
  }
  if (p.path.length) return;
  if ((p.real && !p.inside) || a.action === 'challenge') { msg(p, p.real ? 'You need to get closer, in real life!' : "I can't reach that!"); p.pending = null; return; }
  if (++a.ticks > 30) { msg(p, "I can't reach that!"); p.pending = null; return; }
  stepToward(p, tgt.x, tgt.z);
}

function doAction(p, a, tgt) {
  if (a.action === 'use') return useOn(p, a.slot, a.kind === 'obj' ? { kind: 'obj', obj: tgt } : a.kind === 'npc' ? { kind: 'npc', npc: tgt } : { kind: 'player', player: tgt });
  if (a.kind === 'npc') {
    const key = tgt.def.type || tgt.name;
    const custom = reg.npcActions[key]?.[a.action] || reg.npcActions['*']?.[a.action];
    if (custom) return custom(p, tgt, api);
    if (a.action === 'attack' && tgt.def.combat) {
      if (p.duel) return msg(p, "You're busy duelling!");
      p.target = tgt; p.chase = 0;
      return;
    }
    if (a.action === 'talk' && tgt.def.talk) return startDialog(p, tgt);
    if (a.action === 'trade' && tgt.def.shop) return openShop(p, tgt.def.shop);
    if (a.action === 'bank' && tgt.def.bank) return openBank(p);
    return;
  }
  if (a.kind === 'obj') {
    if (isDepleted(tgt) && !OBJECT_TYPES[tgt.type].depleted?.actions?.includes(a.action)) return;
    const h = reg.objActions[tgt.type]?.[a.action] || reg.objActions['*']?.[a.action];
    if (h) return h(p, tgt, api);
    if (a.action === 'Bank') return openBank(p);
    if (tgt.data.to) { // ladders, doors and portals with a destination
      const to = tgt.data.to;
      if (to.quest && getQ(p, to.quest) < (to.stage || 1)) return msg(p, to.lockedMsg || 'It seems to be locked.');
      if (to.msg) msg(p, to.msg);
      return teleport(p, to.x, to.z, { inside: to.inside ?? interiorAt(to.x, to.z) !== undefined });
    }
    if (tgt.data.text) return startDialog(p, null, { start: [{ npc: tgt.data.text }] }, OBJECT_TYPES[tgt.type].name);
    return msg(p, 'Nothing interesting happens.');
  }
  if (a.kind === 'player') {
    if (tgt === p) return;
    if (a.action === 'trade') {
      if (tgt.trade || tgt.duel) return msg(p, 'Other player is busy at the moment.');
      if (request(p, tgt, 'trade')) openTrade(p, tgt);
      return;
    }
    if (a.action === 'attack') {
      if ((!p.wild || !tgt.wild) && !interiorAt(p.x, p.z)?.pvp) return msg(p, 'You can only attack other players in the Wilderness.');
      if (p.real !== tgt.real && !interiorAt(p.x, p.z)?.pvp) return msg(p, p.real ? "You can't hit a ghost from the real world." : "Ghosts can't hurt real-life players.");
      if (!pvpAllowed(p, tgt)) return msg(p, 'Your combat levels are too far apart for this Wilderness level.');
      if (attackTarget(p, tgt)) { p.target = tgt; p.chase = 0; }
      return;
    }
    if (a.action === 'challenge') {
      if (!p.real) return msg(p, 'Ghosts cannot duel. Turn on real-life mode and go there in person!');
      if (!tgt.real) return msg(p, 'That player is a ghost. Your fists would pass right through.');
      if (tgt.duel || tgt.trade) return msg(p, 'Other player is busy at the moment.');
      if (p.duel) return;
      if (request(p, tgt, 'duel')) startDuel(p, tgt);
    }
    return;
  }
  if (a.kind === 'ground' && a.action === 'take') {
    const mine = tgt.owner === p.id;
    if (!p.real && !mine) return msg(p, 'Your ghostly hand passes right through it. Go there in real life to pick it up!');
    if (tgt.forP && tgt.forP !== p.id && tgt.forUntil > now()) return;
    if (!canAdd(p, tgt.item, tgt.q)) return msg(p, "You don't have enough inventory space to hold that item.");
    ground.delete(tgt.id);
    invAdd(p, tgt.item, tgt.q);
    if (tgt.spawn) tgt.spawn.at = tickNo + tgt.spawn.def.respawn;
    db.touch();
  }
}

// Use an inventory item on another item, an object, an NPC or a player.
function useOn(p, slot, target) {
  const s = p.rec.inv[slot];
  if (!s) return;
  for (const h of reg.useOn) if (h(p, { slot, item: s, def: ITEMS[s.id], ...target }, api)) return;
  msg(p, 'Nothing interesting happens.');
}

// ---------------------------------------------------------------- Interiors and dungeons
// def: { id, name, x0, z0, x1, z1, wild?, rooms: [{ x0, z0, x1, z1, floor, wall, h, doors: [[side, offset, width]] }],
//        floors: [[color, [x, z, ...]]], walls: [[x0, z0, x1, z1, h?, color?]] } in world tiles (x0 >= 30000).
function interior(def) {
  def.x0 ??= Math.min(...def.rooms.map(r => r.x0)) - 2; def.z0 ??= Math.min(...def.rooms.map(r => r.z0)) - 2;
  def.x1 ??= Math.max(...def.rooms.map(r => r.x1)) + 2; def.z1 ??= Math.max(...def.rooms.map(r => r.z1)) + 2;
  if (def.x0 < INTERIOR_BASE - 64 || def.z0 < INTERIOR_BASE - 64) throw new Error(`Interior ${def.id} must have x and z of at least ${INTERIOR_BASE}`);
  reg.interiors.push(def);
  return def;
}

function interiorChunk(cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK, x1 = x0 + CHUNK, z1 = z0 + CHUNK;
  const out = { cx, cz, ok: true, interior: true, base: '#0b0906', b: [], w: [], g: [], p: [], ba: [], r: [], rl: [], t: [], fl: [] };
  const L = (x, z) => [x - x0, z - z0];
  const rect = (a, b, c, d) => [...L(a, b), ...L(c, b), ...L(c, d), ...L(a, d), ...L(a, b)];
  for (const def of reg.interiors) {
    if (def.x1 < x0 || def.x0 > x1 || def.z1 < z0 || def.z0 > z1) continue;
    for (const r of def.rooms || []) {
      out.fl.push([r.floor || '#5a5048', rect(r.x0, r.z0, r.x1, r.z1)]);
      const h = r.h ?? 3.5, col = r.wall || '#6e6458', t = 0.5;
      const gaps = { n: [], s: [], e: [], w: [] };
      for (const [side, off, width] of r.doors || []) gaps[side].push([off, off + width]);
      const run = (side, a, b, fixed, horiz) => {
        const cuts = gaps[side].map(([o0, o1]) => [a + o0, a + o1]).sort((u, v) => u[0] - v[0]);
        let cur = a;
        for (const [c0, c1] of [...cuts, [b, b]]) {
          if (c0 > cur) out.b.push([h, 0, horiz ? rect(cur, fixed - t / 2, c0, fixed + t / 2) : rect(fixed - t / 2, cur, fixed + t / 2, c0), col]);
          cur = Math.max(cur, c1);
        }
      };
      run('n', r.x0, r.x1, r.z0, true); run('s', r.x0, r.x1, r.z1, true);
      run('w', r.z0, r.z1, r.x0, false); run('e', r.z0, r.z1, r.x1, false);
    }
    for (const [color, pts] of def.floors || []) { const ring = []; for (let i = 0; i < pts.length; i += 2) ring.push(...L(pts[i], pts[i + 1])); out.fl.push([color, ring]); }
    for (const [a, b, c, d, h = 3.5, color = '#6e6458'] of def.walls || []) out.b.push([h, 0, rect(a, b, c, d), color]);
  }
  return out;
}

// ---------------------------------------------------------------- Messages
function handle(p, m) {
  if (++p.msgCount > 40) return;
  switch (m.t) {
    case 'walk':
      if (p.real && !p.inside) return msg(p, "You're in real-life mode. Walk in the real world to move!");
      if (p.duel) return msg(p, "You can't walk away from a duel!");
      closeIface(p); p.pending = null; p.target = null; stopAction(p);
      setPath(p, m.path);
      return;
    case 'run':
      p.run = !!m.on && p.rec.energy >= 100;
      return send(p, { t: 'run', on: p.run });
    case 'act': {
      if (!['npc', 'player', 'ground', 'obj'].includes(m.kind) || !Number.isInteger(m.id)) return;
      if (p.duel && m.action !== 'attack') return msg(p, "You're busy duelling!");
      closeIface(p); stopAction(p);
      if (m.action !== 'attack') p.target = null;
      p.pending = { kind: m.kind, id: m.id, action: String(m.action).slice(0, 30), ticks: 0 };
      if (m.action === 'use') p.pending.slot = +m.slot;
      p.path = [];
      if ((!p.real || p.inside) && m.path) setPath(p, m.path);
      return tryPending(p);
    }
    case 'useitem': { // item on item
      const a = +m.slot, b = +m.target;
      if (!p.rec.inv[a] || !p.rec.inv[b] || a === b) return;
      closeIface(p); stopAction(p);
      return useOn(p, a, { kind: 'item', targetSlot: b, target: p.rec.inv[b], targetDef: ITEMS[p.rec.inv[b].id] });
    }
    case 'say': {
      const text = String(m.text || '').replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 80);
      if (!text) return;
      if (text.startsWith('::')) { const [cmd, ...args] = text.slice(2).split(/\s+/); if (reg.commands[cmd]) return reg.commands[cmd](p, args, api); if (DEV) return devCommand(p, [cmd, ...args]); return; }
      if (now() - (p.lastSay || 0) < 600) return;
      if (p.rec.flags.muted > now()) return msg(p, 'You are muted.');
      p.lastSay = now();
      return say(p, 'p', text);
    }
    case 'dlg': {
      const d = p.dlg;
      if (!d || p.iface !== 'dlg') return;
      const step = d.script[d.node]?.[d.i];
      if (step?.opts) {
        const o = (d.opts || step.opts)[m.opt];
        if (!o) return;
        d.node = o[1]; d.i = 0;
      } else d.i++;
      return showDialog(p);
    }
    case 'make': {
      const mk = p.make;
      if (!mk || p.iface !== 'make') return;
      const o = mk.options[m.i];
      closeIface(p);
      if (o) mk.onPick(p, o, Math.max(1, Math.min(+m.qty || 1, 28)));
      return;
    }
    case 'close': return closeIface(p);
    case 'inv': return invOp(p, m);
    case 'unequip': {
      const s = p.rec.equip[m.slot];
      if (!s) return;
      if (!canAdd(p, s.id, ITEMS[s.id].stack ? s.q : 1)) return msg(p, "You don't have enough free inventory space to do that.");
      delete p.rec.equip[m.slot];
      invAdd(p, s.id, s.q || 1); p.equipDirty = true;
      return;
    }
    case 'shop': {
      if (p.iface !== 'shop') return;
      const shop = p.shop;
      const qty = Math.max(1, Math.min(+m.qty || 1, 1000));
      if (m.op === 'buy') {
        if (!shop.stock.includes(m.id)) return;
        let n = ITEMS[m.id].stack ? qty : Math.min(qty, freeSlots(p));
        if (shop.left && shop.left[m.id] !== undefined) n = Math.min(n, shop.left[m.id]);
        if (n <= 0) return msg(p, shop.left?.[m.id] === 0 ? 'The shop has run out of stock.' : "You don't have enough inventory space.");
        const cost = shopPrice(shop, m.id, false) * n;
        if (invCount(p, 'coins') < cost) return msg(p, "You don't have enough coins.");
        invRemove(p, 'coins', cost); invAdd(p, m.id, n);
        if (shop.left?.[m.id] !== undefined) { shop.left[m.id] -= n; sendShop(p); }
      } else if (m.op === 'sell') {
        const s = p.rec.inv[m.slot];
        if (!s || s.id === 'coins') return;
        if (ITEMS[s.id].tradeable === false) return msg(p, "You can't sell this item.");
        if (!shop.general && !shop.stock.includes(s.id)) return msg(p, "This shop isn't interested in that item.");
        const id = s.id, n = Math.min(qty, invCount(p, id));
        const price = shopPrice(shop, id, true);
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
    case 'style':
      if (['accurate', 'aggressive', 'defensive', 'controlled'].includes(m.style)) p.rec.style = m.style;
      if (m.retaliate !== undefined) p.rec.retaliate = !!m.retaliate;
      return send(p, { t: 'style', style: p.rec.style, retaliate: p.rec.retaliate !== false });
    case 'quests': return sendQuests(p);
    case 'qjournal': {
      const q = questDef(m.id);
      if (!q) return;
      const stage = getQ(p, q.id);
      const lines = questDone(p, q.id) ? ['QUEST COMPLETE!'] : stage === 0 ? [q.start || 'I have not started this quest yet.'] : (q.journal?.(stage, p) || ['I am working on this quest.']);
      return send(p, { t: 'qjournal', id: q.id, name: q.name, lines });
    }
    default:
      if (reg.messages[m.t]) return reg.messages[m.t](p, m, api);
  }
}

function devCommand(p, [cmd, a, b]) {
  if (cmd === 'tele') { teleport(p, +a, +b, { inside: interiorAt(+a, +b) !== undefined }); return; }
  if (cmd === 'give' && ITEMS[a]) { invAdd(p, a, Math.max(1, +b || 1)); return; }
  if (cmd === 'xp' && SKILLS.includes(a)) { addXp(p, a, +b || 0); return; }
  if (cmd === 'quest' && reg.quests[a]) { setQ(p, a, +b || 0); return; }
  if (cmd === 'heal') { p.rec.hp = lv(p, 'hitpoints'); p.rec.prayer = lv(p, 'prayer'); return; }
  if (cmd === 'pos') { msg(p, `x ${p.x} z ${p.z} region ${p.region} wild ${p.wild}`); return; }
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
    dropGround(s.id, s.q, p.x, p.z, 180_000, { owner: p.id });
    return;
  }
  if (m.op === 'eat' && def.heal) {
    if (now() - (p.lastEat || 0) < 1700) return;
    p.lastEat = now();
    inv[m.slot] = def.leaves ? { id: def.leaves, q: 1 } : null; p.invDirty = true;
    const max = lv(p, 'hitpoints');
    const before = p.rec.hp;
    p.rec.hp = Math.min(max + (def.overheal || 0), p.rec.hp + def.heal);
    p.atk += 2;
    msg(p, `You ${def.drink ? 'drink' : 'eat'} the ${def.name.toLowerCase()}.${p.rec.hp > before ? ' It heals some health.' : ''}`);
    return;
  }
  if (m.op === 'op') { // content-defined option such as Bury, Light, Read
    const name = String(m.name);
    if (!def.ops?.includes(name)) return;
    const h = reg.itemOps[name];
    if (h) h(p, m.slot, s, def, api);
    return;
  }
  if (m.op === 'wield' && def.slot) {
    const skill = def.skill || 'attack';
    if (def.req && lv(p, skill) < def.req) return msg(p, `You need a${'aeiou'.includes(skill[0]) ? 'n' : ''} ${cap(skill)} level of ${def.req} to wield this.`);
    if (def.quest && !questDone(p, def.quest)) return msg(p, `You need to complete ${questDef(def.quest)?.name || 'a quest'} to wear this.`);
    const eq = p.rec.equip;
    // two-handed bows and shields don't mix
    const clash = def.twoHanded ? 'shield' : def.slot === 'shield' && eq.weapon && ITEMS[eq.weapon.id].twoHanded ? 'weapon' : null;
    if (clash && eq[clash]) {
      if (freeSlots(p) < 1) return msg(p, "You don't have enough free inventory space to do that.");
      invAdd(p, eq[clash].id, 1); delete eq[clash];
    }
    const old = eq[def.slot];
    if (def.stack) {
      if (old && old.id === s.id) { old.q += s.q; inv[m.slot] = null; }
      else { eq[def.slot] = { id: s.id, q: s.q }; inv[m.slot] = old || null; }
    } else {
      eq[def.slot] = { id: s.id, q: 1 };
      inv[m.slot] = old || null;
    }
    p.warnedAmmo = p.warnedRunes = false;
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
    if (isPlayer(p.target)) p.target = null;
    p.real = true; p.path = []; p.pending = null; p.inside = false;
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

// ---------------------------------------------------------------- Plug-in API
// Everything a content system needs. Documented in docs/ENGINE.md.
const api = {
  // data
  ITEMS, OBJECT_TYPES, SKILLS, REGIONS, SHOPS, DIALOGS, SPAWN, CHUNK, INTERIOR_BASE, DEV,
  players, npcs, objects, ground, get tick() { return tickNo; }, now,
  // geography
  toTile, toLatLon, cheb, regionAt, wildLevel, interiorAt,
  tile: (lat, lon) => { const t = toTile(lat, lon); return { x: Math.round(t.x), z: Math.round(t.z) }; },
  // messaging
  send, msg, say, rand,
  // stats
  lv, levels, cbLevel, addXp, bonuses, questPoints,
  // inventory
  invAdd, invRemove, invCount, hasItem, freeSlots, canAdd, giveOrDrop, sendInv, dropGround,
  // world
  spawnObject, removeObject, deplete, isDepleted, objectsNear, spawnNpc, respawnNpc, teleport, canTeleport, interior,
  // interfaces
  startDialog, closeIface, openShop, openBank, makeMenu, startAction, stopAction, gather,
  // combat
  doAttack, attackTarget, pvpAllowed, die, hpOf, maxHpOf,
  // quests
  getQ, setQ, questDone, completeQuest, sendQuests,
  // storage
  playerStore, worldStore: db.worldStore, allAccounts: db.allPlayers, touch: db.touch,
  // registration
  onTick: f => reg.tick.push(f),
  onPlayerTick: f => reg.playerTick.push(f),
  onLogin: f => reg.login.push(f),
  onLogout: f => reg.logout.push(f),
  onDeath: f => reg.death.push(f),
  onNpcDeath: f => reg.npcDeath.push(f),
  onRegionChange: f => reg.regionChange.push(f),
  onCombat: f => reg.combat.push(f),
  onHit: f => reg.hit.push(f),
  onUse: f => reg.useOn.push(f),
  objectAction: (type, action, f) => { (reg.objActions[type] ??= {})[action] = f; },
  npcAction: (key, action, f) => { (reg.npcActions[key] ??= {})[action] = f; },
  itemOp: (name, f) => { reg.itemOps[name] = f; },
  dialog: (name, script) => { DIALOGS[name] = script; },
  dialogAction: (name, f) => { reg.dialogActs[name] = f; },
  shop: (id, def) => { SHOPS[id] = def; return def; },
  shopPriceHook: f => reg.shopHooks.push(f),
  quest: def => { reg.quests[def.id] = def; return def; },
  onMessage: (t, f) => { reg.messages[t] = f; },
  command: (name, f) => { reg.commands[name] = f; },
  route: (path, f) => { reg.routes[path] = f; },
};

// Load content systems from server/systems/*.js
const sysDir = path.join(ROOT, 'server', 'systems');
for (const f of fs.readdirSync(sysDir).filter(f => f.endsWith('.js')).sort()) {
  try {
    const mod = await import(pathToFileURL(path.join(sysDir, f)).href);
    await mod.default?.(api);
  } catch (e) { console.error(`System ${f} failed to load:`, e); }
}
for (const sh of Object.values(SHOPS)) if (sh.limits) sh.left = { ...sh.limits };

// ---------------------------------------------------------------- Login
const loginAttempts = new Map();

async function login(ws, ip, m) {
  const fail = text => ws.send(JSON.stringify({ t: 'err', text }));
  const tries = (loginAttempts.get(ip) || []).filter(t => t > now() - 60_000);
  if (tries.length >= (+process.env.LOGIN_LIMIT || 15)) return fail('Too many login attempts. Please wait a minute.');
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
  if (rec.banned > now()) return fail('This account is banned.');
  for (const sk of SKILLS) if (rec.xp[sk] == null) rec.xp[sk] = 0;
  rec.quests ??= {}; rec.data ??= {}; rec.style ??= 'controlled'; rec.prayer ??= levelForXp(rec.xp.prayer);
  const old = online.get(key);
  if (old) { msg(old, 'You have been logged in from another location.', 'warn'); old.ws.close(); disconnect(old); }
  const p = {
    id: nextId++, ws, rec, key, name: rec.name, x: rec.x, z: rec.z, path: [], run: false, pending: null, iface: null,
    real: false, gps: null, duel: null, trade: null, atk: 0, chase: 0, target: null, action: null, anim: null,
    reqs: { trade: new Map(), duel: new Map() }, aggressors: new Map(), msgCount: 0, inside: false, region: null, wild: 0,
  };
  if (p.x >= INTERIOR_BASE || p.z >= INTERIOR_BASE) p.inside = true;
  players.set(p.id, p); online.set(key, p);
  ws.player = p;
  send(p, { t: 'init', id: p.id, name: p.name, x: p.x, z: p.z, look: rec.look, inv: rec.inv, equip: rec.equip, xp: rec.xp, hp: rec.hp, energy: rec.energy, isNew: !!m.create, style: rec.style, retaliate: rec.retaliate !== false, dev: DEV });
  msg(p, 'Welcome to AmsEscape.');
  if (m.create) msg(p, 'Talk to the Gemeente Gids (right next to you) to get started.');
  updateRegion(p);
  sendQuests(p);
  for (const f of reg.login) f(p, api);
}

function disconnect(p) {
  if (!players.has(p.id)) return;
  for (const f of reg.logout) f(p, api);
  if (p.trade) cancelTrade(p.trade, 'Other player has logged out.');
  if (p.duel) { msg(p.duel.opp, `${p.name} has logged out and forfeits the duel.`); endDuel(p, null); }
  // logging out mid-fight in the Wilderness doesn't save you: the account stays in the fight for 10 seconds
  p.rec.x = p.x; p.rec.z = p.z;
  players.delete(p.id);
  if (online.get(p.key) === p) online.delete(p.key);
  for (const n of npcs) if (n.target === p) n.target = null;
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
    if (ws.player) { try { return handle(ws.player, m); } catch (e) { console.error('handle', m.t, e); return; } }
    if (m.t === 'login' && !busy) { busy = true; try { await login(ws, ip, m); } finally { busy = false; } }
  });
  ws.on('close', () => {
    const p = ws.player;
    if (!p) return;
    if (p.wild && p.lastCombat > tickNo - 16) setTimeout(() => disconnect(p), 10_000); // no combat logging
    else disconnect(p);
  });
  ws.on('error', () => {});
});

// ---------------------------------------------------------------- Tick
function npcEnt(n) {
  const c = n.def.combat;
  return { k: 'n', id: n.id, n: n.name, x: n.x, z: n.z, l: n.def.look, eq: n.def.eq, m: n.def.model, sc: n.def.scale, ex: n.def.ex, talk: !!n.def.talk, shop: !!n.def.shop, bank: !!n.def.bank, cb: c ? c.lvl : 0, acts: n.def.actions, a: n.animUntil >= tickNo ? n.anim : null };
}

function tick() {
  tickNo++;
  tickHits = [];
  const t = now();

  for (const s of spawnState) {
    if (s.gid && ground.has(s.gid)) continue;
    if (s.gid) { s.gid = 0; s.at = tickNo + s.def.respawn; }
    if (tickNo < s.at) continue;
    const [lo, hi] = s.def.q;
    s.gid = dropGround(s.def.item, rand(lo, hi), s.def.at.x, s.def.at.z, 1e12, { spawn: s }).id;
  }
  for (const g of ground.values()) if (g.until < t) ground.delete(g.id);

  for (const n of npcs) {
    if (n.dead) { if (tickNo >= n.dead) respawnNpc(n); continue; }
    if (n.atk > 0) n.atk--;
    if (n.def.combat) {
      npcAggro(n);
      if (n.target || cheb(n.x, n.z, (n.def.home || n.def.at).x, (n.def.home || n.def.at).z) > (n.def.wander || 0)) { npcCombat(n); continue; }
      if (n.hp < n.def.combat.hp && tickNo % 10 === 0) n.hp++;
    }
    const w = n.def.wander;
    if (w && Math.random() < 0.12) {
      const nx = n.x + Math.round(Math.random() * 2 - 1), nz = n.z + Math.round(Math.random() * 2 - 1);
      const home = n.def.home || n.def.at;
      if (cheb(nx, nz, home.x, home.z) <= w) { n.x = nx; n.z = nz; }
    }
    if (n.def.chatter && Math.random() < 0.006) say(n, 'n', n.def.chatter[Math.floor(Math.random() * n.def.chatter.length)]);
  }

  for (const f of reg.tick) { try { f(tickNo, api); } catch (e) { console.error('tick hook', e); } }

  for (const p of players.values()) {
    p.msgCount = 0;
    if (p.atk > 0) p.atk--;
    if (p.real && p.gps && t - p.gps.t > 30_000) goGhost(p, 'You lost your GPS signal and fade into a ghost.');
    if (!p.duel) movePlayer(p);
    tryPending(p);
    if ((p.iface === 'shop' || p.iface === 'bank' || p.iface === 'dlg' || p.iface === 'make') && p.path.length) closeIface(p);
    if (p.action && !p.path.length && !p.target) {
      const ac = p.action;
      if (ac.obj && (!objects.has(ac.obj.id) || cheb(p.x, p.z, ac.obj.x, ac.obj.z) > (p.real && !p.inside ? REAL_RANGE : 3))) stopAction(p);
      else if (--ac.wait <= 0) {
        let cont;
        try { cont = ac.step(p); } catch (e) { console.error('action', e); cont = false; }
        if (p.action === ac) { if (cont === false) stopAction(p); else ac.wait = ac.every; }
      }
    }
    updateRegion(p);
    for (const f of reg.playerTick) { try { f(p, api); } catch (e) { console.error('player tick hook', e); } }
  }
  for (const p of players.values()) if (p.duel && p.duel.count > 0) {
    const d = p.duel;
    d.count--;
    if (p.id < d.opp.id) say(p, 'p', d.count ? String(d.count) : 'FIGHT!');
    if (!d.count) p.target = d.opp;
  }
  for (const p of players.values()) {
    if (p.duel && (!players.has(p.duel.opp.id) || !inRange(p, p.duel.opp, 40))) { endDuel(p, 'Your opponent fled the duel.'); continue; }
    playerCombat(p);
  }
  for (const p of players.values()) archeryTick(p);
  for (const p of players.values()) {
    if (tickNo % 100 === 0 && p.rec.hp < lv(p, 'hitpoints')) p.rec.hp++;
    if (p.real && !p.inside && tickNo % 25 === 0 && Math.random() < 0.5) {
      let mine = 0;
      for (const g of ground.values()) if (g.forP === p.id && g.treasure) mine++;
      const spot = mine < 3 && randomWalkPoint(p.x, p.z, 25, 150);
      if (spot) {
        const r = rollTreasure();
        dropGround(r.item, r.q, spot.x, spot.z, 600_000, { forP: p.id, forUntil: Infinity, treasure: true });
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
      if (!canSee(p, o) || o.inside !== p.inside) continue;
      const eq = {};
      for (const s of EQUIP_SLOTS) if (o.rec.equip[s]) eq[s] = o.rec.equip[s].id;
      const anim = o.animUntil >= tickNo ? o.anim : o.action?.anim || null;
      ents.push({ k: 'p', id: o.id, n: o.name, x: o.x, z: o.z, l: o.rec.look, eq, g: o.real ? 0 : 1, cb: cbLevel(o), hp: o.rec.hp, mhp: lv(o, 'hitpoints'), a: anim, sk: o.skullUntil > t ? 1 : 0, ov: o.overhead || null, tp: o.teleported ? 1 : 0 });
    }
    for (const n of npcs) if (!n.dead && inRange(p, n, VIEW)) ents.push(npcEnt(n));
    const items = [];
    for (const g of ground.values()) if (inRange(p, g, VIEW) && (!g.forP || g.forP === p.id || g.forUntil < t)) items.push({ id: g.id, i: g.item, q: g.q, x: g.x, z: g.z });
    const hits = tickHits.filter(h => isPlayer(h.target) ? canSee(p, h.target) : inRange(p, h.target, VIEW)).map(h => ({ k: isPlayer(h.target) ? 'p' : 'n', id: h.target.id, fk: isPlayer(h.from) ? 'p' : 'n', from: h.from?.id, d: h.d, hp: hpOf(h.target), mhp: maxHpOf(h.target), proj: h.proj }));
    const objs = objectsNear(p.x, p.z, VIEW).map(o => [o.id, o.type, o.x, o.z, o.rot, isDepleted(o) ? 1 : 0]);
    const objSig = objs.map(o => o.join(',')).join(';');
    if (objSig !== p.objSig) { p.objSig = objSig; send(p, { t: 'objs', o: objs }); }
    send(p, { t: 'tick', n: tickNo, you: { x: p.x, z: p.z, hp: p.rec.hp, mhp: lv(p, 'hitpoints'), pr: p.rec.prayer, en: Math.floor(p.rec.energy / 100), run: p.run, real: p.real, duel: p.duel ? p.duel.opp.id : 0, inside: p.inside, wild: p.wild, sk: p.skullUntil > t ? 1 : 0, tgt: p.target ? (isPlayer(p.target) ? 'p' : 'n') + p.target.id : null }, e: ents, gi: items, h: hits });
  }
  for (const p of players.values()) p.teleported = false;

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

server.listen(PORT, () => console.log(`AmsEscape running on http://localhost:${PORT}`));

export { api };
