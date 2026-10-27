// Firemaking: tinderbox on logs (or the logs' Light option). The fire burns for a minute or two, then leaves ashes.
import { LOGS } from '../../../shared/content/production/data.js';
import { tooLow, lower, pair } from './util.js';

export default function firemaking(api, P) {
  const fires = new Set();
  P.fires = fires;

  const fireAt = (x, z) => api.objectsNear(x, z, 0).some(o => o.type === 'fire' || OBST.has(o.type));
  const OBST = new Set(['cooking_range', 'market_stove', 'snack_fryer', 'furnace', 'anvil', 'altar', 'royal_altar', 'water_fountain']);

  function light(p, logId) {
    const L = LOGS[logId];
    if (!L) return false;
    if (!api.hasItem(p, 'tinderbox')) { api.msg(p, 'You need a tinderbox to light a fire.'); return true; }
    if (tooLow(api, p, 'firemaking', L.level, `burn ${lower(api, logId)}`)) return true;
    if (p.inside) { api.msg(p, "You can't light a fire in here. Imagine the insurance claim."); return true; }
    if (fireAt(p.x, p.z)) { api.msg(p, "You can't light a fire here."); return true; }
    api.msg(p, 'You attempt to light the logs.');
    const x0 = p.x, z0 = p.z;
    api.startAction(p, {
      first: 2, every: 3, anim: 'craft', name: 'firemaking',
      step: pl => {
        if (!api.hasItem(pl, logId) || pl.x !== x0 || pl.z !== z0) return false;
        if (fireAt(pl.x, pl.z)) { api.msg(pl, "You can't light a fire here."); return false; }
        const lvl = api.lv(pl, 'firemaking');
        const chance = Math.min(1, 0.4 + (lvl - L.level) * 0.025 + (lvl >= 43 ? 0.1 : 0));
        if (Math.random() >= chance) return true;
        api.invRemove(pl, logId, 1);
        spawnFire(pl.x, pl.z, pl.id);
        api.addXp(pl, 'firemaking', L.xp);
        api.msg(pl, 'The fire catches and the logs begin to burn.');
        stepAside(pl);
        return false;
      },
    });
    return true;
  }

  function spawnFire(x, z, owner, ticks = api.rand(100, 200)) {
    const o = api.spawnObject({ type: 'fire', x, z, rot: Math.random() * Math.PI * 2, data: { owner, until: api.tick + ticks } });
    fires.add(o);
    return o;
  }
  P.spawnFire = spawnFire;

  // OSRS players step west after lighting a fire, or east/south/north if that tile is taken.
  function stepAside(p) {
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
      if (fireAt(p.x + dx, p.z + dz)) continue;
      p.path = [[p.x + dx, p.z + dz]];
      return;
    }
  }

  api.onTick(tick => {
    for (const o of fires) {
      if (tick < o.data.until) continue;
      fires.delete(o);
      api.removeObject(o);
      api.dropGround('ashes', 1, o.x, o.z, 120_000, o.data.owner ? { owner: o.data.owner } : {});
    }
  });

  P.useHandlers.push((p, u) => {
    const m = pair(u, 'tinderbox', id => !!LOGS[id]);
    return m ? light(p, m.b) : false;
  });
  P.itemOps.Light = (p, slot, item) => (LOGS[item.id] ? light(p, item.id) : false);
}
