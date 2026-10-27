// Prayer: burying bones, church altars, the prayer book with drain, protection prayers and overhead icons.
// Also hosts the combat hook that applies prayer and potion boosts (levels are XP-based, so boosts live here).
import { BONES, ALTAR_BONUS, PRAYERS, PRAYER_BY_ID, prayerIcon } from '../../../shared/content/production/data.js';
import { isP, lower, repeat } from './util.js';

const STYLE_BOOST = { accurate: [3, 0, 0], aggressive: [0, 3, 0], defensive: [0, 0, 3], controlled: [1, 1, 1] };
const roll = (att, def) => att > def ? 1 - (def + 2) / (2 * (att + 1)) : att / (2 * (def + 1));

export default function prayer(api, P) {
  const store = p => api.playerStore(p, 'production');
  const active = p => (p.prodPray ??= new Set());

  P.sendPrayer = p => {
    const b = p.prodBoost || {};
    api.send(p, { t: 'prod:prayer', on: [...active(p)], quick: store(p).quick || [], quickOn: !!p.prodQuickOn, boosts: { attack: b.attack || 0, strength: b.strength || 0, defence: b.defence || 0 } });
  };

  function setOverhead(p) {
    const ov = [...active(p)].map(id => PRAYER_BY_ID[id]).find(pr => pr.protect);
    const mine = p.overhead && String(p.overhead).startsWith('pi_');
    if (ov) p.overhead = prayerIcon(ov.id);
    else if (mine) p.overhead = null;
  }

  function deactivateAll(p, silent) {
    if (!active(p).size) return;
    active(p).clear();
    p.prodQuickOn = false;
    setOverhead(p);
    if (!silent) P.sendPrayer(p);
  }

  function activate(p, id, on) {
    const pr = PRAYER_BY_ID[id];
    if (!pr) return false;
    const set = active(p);
    if (on === undefined) on = !set.has(id);
    if (!on) { set.delete(id); setOverhead(p); return true; }
    if (api.lv(p, 'prayer') < pr.level) { api.msg(p, `You need a Prayer level of ${pr.level} to use ${pr.name}.`); return false; }
    if ((p.rec.prayer || 0) <= 0) { api.msg(p, 'You need to recharge your Prayer at an altar.'); return false; }
    for (const other of [...set]) if (other !== id && PRAYER_BY_ID[other].occ.some(o => pr.occ.includes(o))) set.delete(other);
    set.add(id);
    setOverhead(p);
    return true;
  }

  api.onMessage('prod:prayer', (p, m) => {
    activate(p, String(m.id));
    if (!active(p).size) p.prodQuickOn = false;
    P.sendPrayer(p);
  });
  api.onMessage('prod:quick', p => {
    const quick = (store(p).quick || []).filter(id => PRAYER_BY_ID[id]);
    if (p.prodQuickOn) { for (const id of quick) active(p).delete(id); p.prodQuickOn = false; setOverhead(p); P.sendPrayer(p); return; }
    if (!quick.length) { api.msg(p, "You haven't selected any quick-prayers. Use the Setup button in the Prayer tab."); P.sendPrayer(p); return; }
    let any = false;
    for (const id of quick) any = activate(p, id, true) || any;
    p.prodQuickOn = any;
    P.sendPrayer(p);
  });
  api.onMessage('prod:setquick', (p, m) => {
    const ids = Array.isArray(m.ids) ? m.ids.map(String).filter(id => PRAYER_BY_ID[id]) : [];
    // keep only one prayer per conflicting slot, the last one picked wins
    const out = [];
    for (const id of ids) { for (let i = out.length - 1; i >= 0; i--) if (PRAYER_BY_ID[out[i]].occ.some(o => PRAYER_BY_ID[id].occ.includes(o))) out.splice(i, 1); out.push(id); }
    store(p).quick = out.slice(0, 8);
    P.sendPrayer(p);
  });
  api.onMessage('prod:state', p => P.sendPrayer(p));

  api.onLogin(p => P.sendPrayer(p));
  api.onDeath(p => { deactivateAll(p, true); p.prodBoost = null; P.sendPrayer(p); });

  // drain: OSRS drain counter, resistance 60 + 2 x prayer bonus
  api.onPlayerTick(p => {
    const set = p.prodPray;
    if (!set?.size) return;
    if ((p.rec.prayer || 0) <= 0) { deactivateAll(p); api.msg(p, 'You have run out of Prayer points, you can recharge at an altar.'); return; }
    let drain = 0;
    for (const id of set) drain += PRAYER_BY_ID[id].drain;
    p.prodDrain = (p.prodDrain || 0) + drain;
    const resist = 60 + 2 * (api.bonuses(p).pray || 0);
    while (p.prodDrain > resist) { p.prodDrain -= resist; p.rec.prayer = Math.max(0, (p.rec.prayer || 0) - 1); }
    if (set.has('rapid_heal') && api.tick % 100 === 50 && p.rec.hp < api.lv(p, 'hitpoints')) p.rec.hp++;
  });

  // ---------------------------------------------------------------- combat effects
  const pmult = (p, key) => { let m = 0; for (const id of p?.prodPray || []) m = Math.max(m, PRAYER_BY_ID[id][key] || 0); return m; };
  const boost = (p, skill) => p?.prodBoost?.[skill] || 0;
  const touched = e => isP(e) && (e.prodPray?.size || (e.prodBoost && (e.prodBoost.attack || e.prodBoost.strength || e.prodBoost.defence)));
  const eff = (p, skill, key, boosted) => {
    const base = api.lv(p, skill);
    return boosted ? Math.floor((base + boost(p, skill)) * (1 + pmult(p, key))) : base;
  };

  api.onCombat(ctx => {
    const a = ctx.attacker, d = ctx.defender, kind = ctx.style?.kind || 'melee';
    if (!touched(a) && !touched(d)) return;
    const atkRoll = boosted => {
      if (!isP(a)) { const c = a.def.combat; return (c.att + 8) * ((c.attBonus || 0) + 64); }
      const b = api.bonuses(a), sb = STYLE_BOOST[a.rec.style || 'controlled'];
      if (kind === 'ranged') return (eff(a, 'ranged', 'rng', boosted) + 8) * (b.rng + 64);
      if (kind === 'magic') return (eff(a, 'magic', 'mag', boosted) + 9) * (b.mag + 64);
      return (eff(a, 'attack', 'att', boosted) + sb[0] + 8) * (b.att + 64);
    };
    const defRoll = boosted => {
      if (!isP(d)) {
        const c = d.def.combat;
        return kind === 'magic' ? ((c.mag ?? c.def) + 9) * ((c.defBonus || 0) + 64) : (c.def + 9) * ((c.defBonus || 0) + 64);
      }
      const b = api.bonuses(d), sb = STYLE_BOOST[d.rec.style || 'controlled'];
      const dl = eff(d, 'defence', 'def', boosted) + sb[2];
      if (kind === 'magic') return (Math.floor(eff(d, 'magic', 'mag', boosted) * 0.7 + dl * 0.3) + 9) * (b.def + (b.mag || 0) + 64);
      return (dl + 9) * (b.def + 64);
    };
    const r0 = roll(atkRoll(false), defRoll(false)), r1 = roll(atkRoll(true), defRoll(true));
    if (r0 > 0) ctx.chance = Math.max(0, Math.min(1, ctx.chance * r1 / r0));
    if (isP(a) && kind !== 'magic') {
      const b = api.bonuses(a);
      const mh = boosted => kind === 'ranged'
        ? Math.floor(0.5 + (eff(a, 'ranged', 'rng', boosted) + 8) * (b.rstr + 64) / 640)
        : Math.floor(0.5 + (eff(a, 'strength', 'str', boosted) + STYLE_BOOST[a.rec.style || 'controlled'][1] + 8) * (b.str + 64) / 640);
      ctx.maxHit = Math.max(0, ctx.maxHit + mh(true) - mh(false));
    }
  });

  // protection prayers: monsters do nothing, players do 40% less
  api.onHit(ctx => {
    const d = ctx.defender;
    if (!isP(d) || !d.prodPray?.size || !ctx.dmg) return;
    const kind = ctx.style?.kind || 'melee';
    const prot = [...d.prodPray].some(id => PRAYER_BY_ID[id].protect === kind);
    if (!prot) return;
    ctx.dmg = isP(ctx.attacker) ? Math.floor(ctx.dmg * 0.6) : 0;
  });

  // ---------------------------------------------------------------- bones
  P.itemOps.Bury = (p, slot, item) => {
    const xp = BONES[item.id];
    if (!xp) return false;
    if (p.buryAt > Date.now() - 1100) return true;
    p.buryAt = Date.now();
    p.rec.inv[slot] = null; p.invDirty = true;
    p.anim = 'pick'; p.animUntil = api.tick + 1;
    api.addXp(p, 'prayer', xp);
    api.msg(p, 'You dig a hole in the ground...');
    api.msg(p, 'You bury the bones.');
    return true;
  };

  // ---------------------------------------------------------------- altars
  for (const type of ['altar', 'royal_altar']) {
    api.objectAction(type, 'Pray-at', (p, obj) => {
      const max = api.lv(p, 'prayer');
      p.anim = 'pray'; p.animUntil = api.tick + 2;
      if ((p.rec.prayer || 0) >= max) return api.msg(p, 'You already have full Prayer points.');
      p.rec.prayer = max;
      api.msg(p, 'You recharge your Prayer points.');
    });
  }
  P.useHandlers.push((p, u) => {
    if (u.kind !== 'obj' || (u.obj.type !== 'altar' && u.obj.type !== 'royal_altar')) return false;
    const id = u.item.id;
    if (!BONES[id]) { api.msg(p, 'Nothing interesting happens.'); return true; }
    if (u.obj.type === 'altar') { api.msg(p, "The koster frowns. 'Offerings are made at the royal altar of the Nieuwe Kerk, on the Dam.'"); return true; }
    repeat(api, p, {
      qty: api.invCount(p, id), every: 3, first: 1, anim: 'pray', obj: u.obj, name: 'prayer',
      step: pl => {
        if (!api.hasItem(pl, id)) return false;
        api.invRemove(pl, id, 1);
        api.addXp(pl, 'prayer', BONES[id] * ALTAR_BONUS);
        api.msg(pl, `The gods are very pleased with your ${lower(api, id)}.`);
        return true;
      },
    });
    return true;
  });
}
