// Shared helpers for the combat pack: forced hits for special attacks, direct damage (hazards), stuns,
// visual effects, parked "pool" NPCs for summons and ambushes, and monster spawning.
const PARK = { x: 37990, z: 33990 }; // far corner of the combat interior allocation, never inside a room

export function makeUtil(api) {
  const U = { PARK };

  // ---- broadcast helpers
  U.near = (x, z, r = 64) => [...api.players.values()].filter(p => api.cheb(p.x, p.z, x, z) <= r);
  U.fx = (x, z, kind, extra = {}) => { for (const v of U.near(x, z)) api.send(v, { t: 'combat:fx', x, z, kind, ...extra }); };
  U.alive = p => api.players.has(p.id) && !(p.deadUntil > api.now());

  // ---- forced attacks: npc._force = { dmg?, maxHit?, chance? } is applied to the next doAttack by that npc
  api.onCombat(ctx => {
    const f = ctx.attacker._force;
    if (!f) return;
    if (f.maxHit != null) ctx.maxHit = f.maxHit;
    if (f.chance != null) ctx.chance = f.chance;
    if (f.dmg != null) ctx.dmg = f.dmg;
  });
  U.strike = (npc, target, force) => {
    if (!U.alive(target)) return;
    npc._force = force;
    try { api.doAttack(npc, target); } finally { npc._force = null; }
  };

  // ---- direct damage without an attacker (steam vents, falls, debris). Shows a hitsplat on every client nearby.
  U.hurt = (p, dmg, text) => {
    if (!U.alive(p)) return 0;
    dmg = Math.max(0, Math.min(Math.floor(dmg), p.rec.hp));
    p.rec.hp -= dmg;
    const mhp = api.lv(p, 'hitpoints');
    for (const v of U.near(p.x, p.z)) api.send(v, { t: 'combat:splat', id: p.id, d: dmg, hp: p.rec.hp, mhp });
    if (text) api.msg(p, text);
    if (p.rec.hp <= 0) api.die(p, null);
    return dmg;
  };

  // ---- stuns: the player is frozen in place and can't act for a few ticks
  U.stun = (p, ticks, text) => {
    p.cbStun = { until: api.tick + ticks, x: p.x, z: p.z };
    p.path = []; p.pending = null; p.target = null; api.stopAction(p);
    U.fx(p.x, p.z, 'stun', { id: p.id, ticks });
    if (text) api.msg(p, text);
  };
  U.stunned = p => p.cbStun && p.cbStun.until > api.tick;
  api.onPlayerTick(p => {
    if (!p.cbStun) return;
    if (p.cbStun.until <= api.tick || p.deadUntil > api.now()) { p.cbStun = null; return; }
    p.x = p.cbStun.x; p.z = p.cbStun.z; p.path = []; p.pending = null; p.target = null;
  });

  // ---- monsters
  U.spawn = (MONSTERS, key, at, extra = {}) => {
    const t = MONSTERS[key];
    if (!t) throw new Error('Unknown monster ' + key);
    return api.spawnNpc({ ...t, type: key, at: { ...at }, home: { ...at }, ...extra });
  };
  U.scatter = (MONSTERS, key, at, n, r = 4, extra = {}) => Array.from({ length: n }, (_, i) => {
    const a = i / n * Math.PI * 2 + 0.7;
    const rr = n === 1 ? 0 : r * (i % 2 ? 0.55 : 1);
    return U.spawn(MONSTERS, key, { x: Math.round(at.x + Math.cos(a) * rr), z: Math.round(at.z + Math.sin(a) * rr) }, extra);
  });

  // ---- pools of parked NPCs used for boss adds and ambushes. They are moved in when needed and parked again later.
  const pooled = [];
  U.pool = (MONSTERS, key, n) => Array.from({ length: n }, () => {
    const i = pooled.length;
    const npc = api.spawnNpc({ ...MONSTERS[key], type: key, at: { x: PARK.x - (i % 40) * 3, z: PARK.z - Math.floor(i / 40) * 3 }, wander: 0 });
    npc.parked = true;
    pooled.push(npc);
    return npc;
  });
  // a pooled NPC that died respawns at its parking spot: make sure it stays there
  api.onTick(() => {
    for (const n of pooled) {
      if (n.dead) n.needPark = true;
      else if (n.needPark) { n.needPark = false; U.park(n); }
    }
  });
  U.summon = (npc, x, z, target, inside) => {
    if (npc.dead) { npc.dead = 0; npc.hp = npc.def.combat.hp; }
    npc.def = { ...npc.def, home: { x, z }, wander: 2 };
    npc.x = x; npc.z = z; npc.inside = !!inside; npc.parked = false;
    npc.hp = npc.def.combat.hp; npc.dmgBy.clear();
    npc.target = target && U.alive(target) ? target : null;
    U.fx(x, z, 'summon');
  };
  U.park = npc => {
    npc.def = { ...npc.def, home: undefined, wander: 0 };
    npc.x = npc.def.at.x; npc.z = npc.def.at.z; npc.target = null; npc.parked = true; npc.inside = true;
    npc.hp = npc.def.combat.hp; npc.dmgBy.clear();
  };
  U.isParked = npc => npc.parked || npc.dead || api.cheb(npc.x, npc.z, PARK.x, PARK.z) < 200;

  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.chance = c => Math.random() < c;
  return U;
}
