// Herblore at the Hortus Botanicus: clean herbs, make unfinished potions, add secondaries, drink potions.
// Levels come from XP, so potion boosts are kept on the player and applied in combat (see prayer.js combat hook).
import { HERBS, POTIONS, doseId } from '../../../shared/content/production/data.js';
import { tooLow, lower, repeat, pair, swapOne } from './util.js';

const DOSE = {};
for (const pt of POTIONS) for (const n of [3, 2, 1]) DOSE[doseId(pt.id, n)] = { pt, n };

export default function herblore(api, P) {
  const unfLevel = unf => Math.min(...POTIONS.filter(x => x.unf === unf).map(x => x.level));

  // ---------------------------------------------------------------- cleaning
  P.itemOps.Clean = (p, slot, item) => {
    const h = HERBS.find(x => x.grimy === item.id);
    if (!h) return false;
    if (tooLow(api, p, 'herblore', h.level, `clean this herb`)) return true;
    if (p.cleanAt > Date.now() - 500) return true;
    p.cleanAt = Date.now();
    p.rec.inv[slot] = { id: h.clean, q: 1 }; p.invDirty = true;
    api.addXp(p, 'herblore', h.xp);
    api.msg(p, `You clean the dirt from the ${lower(api, h.clean)}.`);
    return true;
  };

  // ---------------------------------------------------------------- boosts
  // p.prodBoost = { attack, strength, defence } in levels; each drifts back to 0 by one level a minute, like OSRS.
  P.boost = p => (p.prodBoost ??= { attack: 0, strength: 0, defence: 0 });
  function applyBoost(p, skill, flat, frac) {
    const b = P.boost(p), base = api.lv(p, skill);
    const amt = Math.floor(flat + base * frac) * (flat < 0 ? 1 : 1);
    if (amt >= 0) b[skill] = Math.max(b[skill], amt); else b[skill] = Math.min(b[skill], amt);
    p.prodBoostTick = api.tick;
  }
  api.onPlayerTick(p => {
    const b = p.prodBoost;
    if (!b || (api.tick - (p.prodBoostTick || 0)) % 100 !== 99) return;
    let changed = false;
    for (const k in b) if (b[k]) { b[k] -= Math.sign(b[k]); changed = true; }
    if (changed) P.sendPrayer?.(p);
  });

  // ---------------------------------------------------------------- drinking
  P.itemOps.Drink = (p, slot, item) => {
    const d = DOSE[item.id];
    if (!d) return false;
    if (p.drinkAt > Date.now() - 1700) return true;
    p.drinkAt = Date.now();
    const { pt, n } = d;
    p.rec.inv[slot] = { id: n > 1 ? doseId(pt.id, n - 1) : 'vial', q: 1 }; p.invDirty = true;
    p.atk += 2;
    api.msg(p, `You drink some of your ${pt.name.toLowerCase()}.`);
    for (const [skill, [flat, frac]] of Object.entries(pt.boost || {})) applyBoost(p, skill, flat, frac);
    if (pt.prayer) {
      const max = api.lv(p, 'prayer');
      p.rec.prayer = Math.min(max, (p.rec.prayer || 0) + Math.floor(pt.prayer[0] + max * pt.prayer[1]));
    }
    if (pt.energy) p.rec.energy = Math.min(10000, p.rec.energy + pt.energy * 100);
    if (pt.heal) p.rec.hp = Math.min(api.lv(p, 'hitpoints'), p.rec.hp + pt.heal);
    if (pt.id === 'jenever_brew') api.say(p, 'p', 'Proost!');
    if (pt.id === 'tulip_tonic') api.msg(p, 'You feel refreshed, and you smell like a spring morning in the Keukenhof.');
    api.msg(p, n > 1 ? `You have ${n - 1} dose${n - 1 > 1 ? 's' : ''} of potion left.` : 'You have finished your potion.');
    P.sendPrayer?.(p);
    return true;
  };

  // ---------------------------------------------------------------- mixing
  P.useHandlers.push((p, u) => {
    if (u.kind !== 'item') return false;
    let m;
    if ((m = pair(u, id => HERBS.some(h => h.clean === id), 'vial_of_water'))) {
      const h = HERBS.find(x => x.clean === m.a);
      const lvl = unfLevel(h.unf);
      if (tooLow(api, p, 'herblore', lvl, `make this potion`)) return true;
      repeat(api, p, {
        qty: Math.min(api.invCount(p, h.clean), api.invCount(p, 'vial_of_water')), every: 2, anim: 'craft', name: 'herblore',
        step: pl => {
          if (!api.hasItem(pl, h.clean) || !api.hasItem(pl, 'vial_of_water')) return false;
          api.invRemove(pl, h.clean, 1);
          swapOne(api, pl, 'vial_of_water', h.unf);
          api.msg(pl, `You put the ${lower(api, h.clean)} into the vial of water.`);
          return true;
        },
      });
      return true;
    }
    if ((m = pair(u, id => HERBS.some(h => h.grimy === id), 'vial_of_water'))) { api.msg(p, 'You should clean the herb first.'); return true; }
    const pt = POTIONS.find(x => pair(u, x.unf, x.sec));
    if (pt) {
      if (tooLow(api, p, 'herblore', pt.level, `make ${pt.name.toLowerCase().startsWith('a') ? 'an' : 'a'} ${pt.name.toLowerCase()}`)) return true;
      repeat(api, p, {
        qty: Math.min(api.invCount(p, pt.unf), api.invCount(p, pt.sec)), every: 2, anim: 'craft', name: 'herblore',
        step: pl => {
          if (!api.hasItem(pl, pt.unf) || !api.hasItem(pl, pt.sec)) return false;
          api.invRemove(pl, pt.sec, 1);
          swapOne(api, pl, pt.unf, pt.id);
          api.addXp(pl, 'herblore', pt.xp);
          api.msg(pl, `You mix the ${lower(api, pt.sec)} into your potion.`);
          return true;
        },
      });
      return true;
    }
    if ((m = pair(u, 'pestle_and_mortar', 'juniper_berries'))) {
      repeat(api, p, {
        qty: api.invCount(p, 'juniper_berries'), every: 2, anim: 'craft', name: 'herblore',
        step: pl => {
          if (!api.hasItem(pl, 'juniper_berries') || !api.hasItem(pl, 'pestle_and_mortar')) return false;
          swapOne(api, pl, 'juniper_berries', 'crushed_juniper');
          api.msg(pl, 'You grind the juniper berries to a fragrant powder.');
          return true;
        },
      });
      return true;
    }
    // combining doses, OSRS style
    const a = DOSE[u.item.id], b = u.target && DOSE[u.target.id];
    if (a && b && a.pt === b.pt) {
      const total = a.n + b.n;
      const first = Math.min(3, total), rest = total - first;
      p.rec.inv[u.targetSlot] = { id: doseId(a.pt.id, first), q: 1 };
      p.rec.inv[u.slot] = rest ? { id: doseId(a.pt.id, rest), q: 1 } : { id: 'vial', q: 1 };
      p.invDirty = true;
      api.msg(p, 'You combine the potions.');
      return true;
    }
    return false;
  });
}
