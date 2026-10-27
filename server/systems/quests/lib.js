// Shared helpers for the quest pack: interiors with solid walls, locked doors, journals, safe item handling.
import { LANDMARK_MODELS } from '../../../shared/landmarks.js';

// NPC look helper: gender, skin, hair, top, legs (+ optional custom colours)
export const L = (g, skin, hair, top, legs, extra = {}) => ({ g, skin, hair, top, legs, ...extra });

// World tile in front of (or around) a hand-built landmark. lx, lz in the landmark's local metres (+z = front).
export function landmarkTile(id, lx, lz) {
  const l = LANDMARK_MODELS.find(m => m.id === id);
  if (!l) return null;
  const c = Math.cos(l.rot), s = Math.sin(l.rot);
  return { x: Math.round(l.x + lx * c + lz * s), z: Math.round(l.z - lx * s + lz * c), rot: l.rot, l };
}
// Just outside the front facade of a landmark, `lateral` metres along it.
export const landmarkFront = (id, lateral = 0, out = 1.5) => { const l = LANDMARK_MODELS.find(m => m.id === id); return landmarkTile(id, lateral, l.d / 2 + out); };

export function makeLib(api) {
  const { ITEMS } = api;
  const exists = id => !!ITEMS[id];
  const name = id => ITEMS[id]?.name || id.replace(/_/g, ' ');
  const lname = id => name(id).toLowerCase();

  // give an item if it exists in this build (other packs may not have defined it yet)
  function give(p, id, q = 1) {
    if (!exists(id)) { api.msg(p, `(The ${id.replace(/_/g, ' ')} isn't available in this world yet.)`, 'warn'); return false; }
    api.giveOrDrop(p, id, q);
    return true;
  }
  const has = (p, id, q = 1) => exists(id) && api.hasItem(p, id, q);
  // a requirement counts as met when the item doesn't exist in this world (so quests stay completable)
  const hasOrMissing = (p, id, q = 1) => !exists(id) || api.hasItem(p, id, q);
  const take = (p, id, q = 1) => !exists(id) || api.invRemove(p, id, q);
  const hasAny = (p, ids) => ids.find(id => has(p, id));
  const inBank = (p, id) => (p.rec.bank || []).some(b => b.id === id && b.q > 0);
  const store = p => api.playerStore(p, 'quests');
  const qdata = (p, id) => (store(p)[id] ??= {});

  // Journal: steps [{ at, todo, done }]. Steps before the current stage are shown in the past tense.
  function journal(intro, steps) {
    return (stage, p) => {
      const out = [...(typeof intro === 'function' ? intro(p) : intro)];
      for (const s of steps) {
        if (stage > s.at && s.done) out.push((typeof s.done === 'function' ? s.done(p) : s.done));
        else if (stage === s.at || (s.upto && stage >= s.at && stage <= s.upto)) { out.push(...[].concat(typeof s.todo === 'function' ? s.todo(p) : s.todo)); break; }
      }
      return out;
    };
  }

  // ---- interiors with one-tile thick walls (so the client collision map really blocks them)
  // rooms: [{ x0, z0, x1, z1, floor, wall, h }] inclusive tile ranges. open: [[x, z]] or [[x0, z0, x1, z1]] extra floor (doorways).
  // gaps: [[x, z]] tiles with floor but no wall, for door objects to sit in. deco: [[color, [x, z, ...]]] floor decoration.
  function buildInterior({ id, name, rooms, open = [], gaps = [], deco = [], walls: extra = [], ...flags }) {
    const floor = new Map();
    const key = (x, z) => x + ',' + z;
    for (const r of rooms) for (let x = r.x0; x <= r.x1; x++) for (let z = r.z0; z <= r.z1; z++) floor.set(key(x, z), r);
    const near = (x, z) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = floor.get(key(x + dx, z + dz)); if (r) return r; } return rooms[0]; };
    const floors = rooms.map(r => [r.floor || '#5a5048', [r.x0, r.z0, r.x1 + 1, r.z0, r.x1 + 1, r.z1 + 1, r.x0, r.z1 + 1]]);
    const rect = a => a.length === 2 ? [a[0], a[1], a[0], a[1]] : a;
    for (const o of [...open, ...gaps]) {
      const [x0, z0, x1, z1] = rect(o);
      const r = near(x0, z0);
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!floor.has(key(x, z))) floor.set(key(x, z), { ...r, gap: true });
      floors.push([r.floor || '#5a5048', [x0, z0, x1 + 1, z0, x1 + 1, z1 + 1, x0, z1 + 1]]);
    }
    let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
    for (const k of floor.keys()) { const [x, z] = k.split(',').map(Number); bx0 = Math.min(bx0, x); bz0 = Math.min(bz0, z); bx1 = Math.max(bx1, x); bz1 = Math.max(bz1, z); }
    // wall tiles: not floor, next to floor
    const wallAt = new Map();
    for (let z = bz0 - 1; z <= bz1 + 1; z++) for (let x = bx0 - 1; x <= bx1 + 1; x++) {
      if (floor.has(key(x, z))) continue;
      let r = null;
      for (let dx = -1; dx <= 1 && !r; dx++) for (let dz = -1; dz <= 1 && !r; dz++) { const f = floor.get(key(x + dx, z + dz)); if (f && !f.gap) r = f; }
      if (!r) for (let dx = -1; dx <= 1 && !r; dx++) for (let dz = -1; dz <= 1 && !r; dz++) r = floor.get(key(x + dx, z + dz));
      if (r) wallAt.set(key(x, z), r);
    }
    // merge horizontal runs of the same colour and height
    const walls = [];
    for (let z = bz0 - 1; z <= bz1 + 1; z++) {
      let run = null;
      for (let x = bx0 - 1; x <= bx1 + 2; x++) {
        const r = wallAt.get(key(x, z));
        const col = r ? r.wall || '#6e6458' : null, h = r ? r.h ?? 3 : 0;
        if (run && (!r || run.col !== col || run.h !== h)) { walls.push([run.x, z, x, z + 1, run.h, run.col]); run = null; }
        if (r && !run) run = { x, col, h };
      }
    }
    for (const [color, pts] of deco) floors.push([color, pts]);
    return api.interior({ id, name, x0: bx0 - 2, z0: bz0 - 2, x1: bx1 + 2, z1: bz1 + 2, rooms: [], floors, walls: [...walls, ...extra], ...flags });
  }

  // A door object inside a wall gap that moves the player to the other side. check(p) -> true or a refusal message.
  function innerDoor({ x, z, rot = 0, type = 'q_door', a, b, check, onPass }) {
    return api.spawnObject({ type, x, z, rot, data: { qdoor: { a, b, check, onPass } } });
  }
  for (const type of ['q_door', 'q_door_gold']) {
    api.objectAction(type, 'Open', (p, obj) => {
      const d = obj.data.qdoor;
      if (!d) return api.msg(p, 'The door is stuck.');
      const da = api.cheb(p.x, p.z, d.a.x, d.a.z), db = api.cheb(p.x, p.z, d.b.x, d.b.z);
      const to = da <= db ? d.b : d.a;
      if (d.check) { const ok = d.check(p, to === d.b); if (ok !== true) return api.msg(p, ok || 'The door is locked.'); }
      api.teleport(p, to.x, to.z);
      d.onPass?.(p);
    });
  }

  // Outside entrance (core door type) and inside exit (core exit type)
  function entrance({ x, z, rot = 0, to, quest, stage = 1, lockedMsg, msg }) {
    return api.spawnObject({ type: 'door', x, z, rot, data: { to: { x: to.x, z: to.z, inside: true, quest, stage, lockedMsg, msg } } });
  }
  function exit({ x, z, rot = 0, to, msg }) {
    return api.spawnObject({ type: 'exit', x, z, rot, data: { to: { x: to.x, z: to.z, inside: false, msg } } });
  }
  function stairs(type, { x, z, rot = 0, to, msg, quest, stage, lockedMsg }) {
    return api.spawnObject({ type, x, z, rot, data: { to: { x: to.x, z: to.z, inside: true, msg, quest, stage, lockedMsg } } });
  }

  // NPC with its own dialogue script
  function npc(def, script) {
    if (script) { const dn = 'q_' + (def.dlg || def.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')); api.dialog(dn, script); def.talk = dn; }
    return api.spawnNpc(def);
  }

  // Players standing in an area (for boss credit)
  const playersNear = (x, z, r) => [...api.players.values()].filter(p => api.cheb(p.x, p.z, x, z) <= r);

  return { exists, name, lname, give, has, hasOrMissing, take, hasAny, inBank, store, qdata, journal, buildInterior, innerDoor, entrance, exit, stairs, npc, playersNear, L };
}
