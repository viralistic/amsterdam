// Hunter: bird snares and box traps. Lay a trap from the inventory, wait, then check it.
// Traps catch only in the right hunting grounds (Vondelpark, Amstelpark, Amsterdamse Bos) and collapse if ignored.
import { CREATURES } from '../../../shared/content/gathering/data.js';

const CATCH_RATE = 1 / 14; // chance per tick that something wanders into a set trap
const COLLAPSE = 150; // ticks a sprung trap waits before collapsing
const IDLE = 350; // ticks a set trap waits with nothing around

export function setupHunter(api) {
  const { ITEMS } = api;
  const traps = new Map(); // object id -> trap
  const label = kind => ITEMS[kind].name.toLowerCase();
  const minLevel = kind => Math.min(...CREATURES[kind].map(c => c.level));
  const maxTraps = p => Math.min(5, 1 + Math.floor(api.lv(p, 'hunter') / 20)) + (p.wild ? 1 : 0);
  const online = key => [...api.players.values()].find(q => q.key === key);

  function place(trap, st) {
    if (trap.obj) { api.removeObject(trap.obj); traps.delete(trap.obj.id); }
    trap.st = st; trap.since = api.tick;
    trap.obj = api.spawnObject({ type: `${trap.kind}_${st}`, x: trap.x, z: trap.z, data: { owner: trap.owner } });
    traps.set(trap.obj.id, trap);
  }
  function remove(trap) { api.removeObject(trap.obj); traps.delete(trap.obj.id); }

  api.itemOp('Lay', (p, slot, item) => {
    const kind = item.id;
    if (!CREATURES[kind]) return;
    if (p.inside) return api.msg(p, "You can't lay a trap in here.");
    const need = minLevel(kind);
    if (api.lv(p, 'hunter') < need) return api.msg(p, `You need a Hunter level of ${need} to use ${kind === 'box_trap' ? 'a box trap' : 'a bird snare'}.`);
    const mine = [...traps.values()].filter(t => t.owner === p.key).length;
    if (mine >= maxTraps(p)) return api.msg(p, `You don't have a high enough Hunter level to set up more than ${maxTraps(p)} trap${maxTraps(p) > 1 ? 's' : ''}.`);
    if (api.objectsNear(p.x, p.z, 0).length) return api.msg(p, "You can't lay a trap here.");
    api.stopAction(p);
    p.rec.inv[slot] = null; p.invDirty = true;
    const region = api.regionAt(p.x, p.z).id;
    const trap = { kind, owner: p.key, ownerId: p.id, x: p.x, z: p.z, region, lvl: api.lv(p, 'hunter'), obj: null };
    place(trap, 'set');
    p.anim = 'pick'; p.animUntil = api.tick + 2;
    api.msg(p, kind === 'box_trap' ? 'You set up the box trap.' : 'You set up the bird snare.');
    if (!CREATURES[kind].some(c => c.region === region)) {
      api.msg(p, kind === 'box_trap' ? "There don't seem to be any rabbits around here. Try the Amsterdamse Bos." : "There don't seem to be many birds around here. Try the Vondelpark or the Amstelpark.");
    }
  });

  api.onTick(tick => {
    for (const trap of [...traps.values()]) {
      if (trap.st === 'set') {
        const pool = CREATURES[trap.kind].filter(c => c.region === trap.region && c.level <= trap.lvl);
        if (!pool.length) { if (tick - trap.since > IDLE) collapse(trap); continue; }
        if (tick - trap.since < 6 || Math.random() >= CATCH_RATE) continue;
        const best = pool[pool.length - 1];
        const c = Math.random() < 0.6 ? best : pool[Math.floor(Math.random() * pool.length)];
        const chance = Math.min(0.95, 0.65 + (trap.lvl - c.level) * 0.02);
        trap.creature = c;
        place(trap, Math.random() < chance ? 'caught' : 'failed');
      } else if (tick - trap.since > COLLAPSE) collapse(trap);
    }
  });

  function collapse(trap) {
    remove(trap);
    api.dropGround(trap.kind, 1, trap.x, trap.z, 180_000, { owner: trap.ownerId, forP: trap.ownerId, forUntil: Date.now() + 60_000 });
    const q = online(trap.owner);
    if (q) api.msg(q, `Your ${label(trap.kind)} has collapsed.`);
  }

  const mineOrSay = (p, obj) => {
    const trap = traps.get(obj.id);
    if (!trap) return null;
    if (trap.owner !== p.key) { api.msg(p, "This isn't your trap."); return null; }
    return trap;
  };

  for (const kind of Object.keys(CREATURES)) {
    api.objectAction(`${kind}_caught`, 'Check', (p, obj) => {
      const trap = mineOrSay(p, obj);
      if (!trap) return;
      const c = trap.creature;
      const loot = c.loot.map(([id, lo, hi]) => [id, lo + Math.floor(Math.random() * (hi - lo + 1))]);
      if (ITEMS.bones) loot.push(['bones', 1]);
      const slots = 1 + loot.filter(([id]) => !(ITEMS[id].stack && api.hasItem(p, id))).length; // the trap itself needs a slot too
      if (api.freeSlots(p) < slots) return api.msg(p, "You don't have enough inventory space.");
      remove(trap);
      api.giveOrDrop(p, trap.kind, 1);
      for (const [id, q] of loot) api.giveOrDrop(p, id, q);
      api.addXp(p, 'hunter', c.xp);
      p.anim = 'pick'; p.animUntil = api.tick + 2;
      api.msg(p, `You've caught ${/^[AEIOU]/.test(c.name) ? 'an' : 'a'} ${c.name}${c.ex ? ` (${c.ex.toLowerCase()})` : ''}.`);
    });
    for (const st of ['set', 'failed']) {
      api.objectAction(`${kind}_${st}`, 'Dismantle', (p, obj) => {
        const trap = mineOrSay(p, obj);
        if (!trap) return;
        if (!api.canAdd(p, trap.kind, 1)) return api.msg(p, "You don't have enough inventory space.");
        remove(trap);
        api.invAdd(p, trap.kind, 1);
        p.anim = 'pick'; p.animUntil = api.tick + 2;
        api.msg(p, `You dismantle the ${label(trap.kind)}.`);
      });
    }
  }

  // traps don't outlive their hunter
  api.onLogout(p => {
    for (const trap of [...traps.values()]) if (trap.owner === p.key) { remove(trap); api.giveOrDrop(p, trap.kind, 1); }
  });
}
