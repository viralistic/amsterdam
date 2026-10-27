// Smithing at Westergasfabriek: smelt ore into bars at the furnace, hammer bars into gear on the anvils.
import { METALS, METAL_IDS, SMELT, SMITH_KINDS, smithId } from '../../../shared/content/production/data.js';
import { tooLow, lower, repeat } from './util.js';

export default function smithing(api, P) {
  const ORE_IDS = new Set(SMELT.flatMap(s => Object.keys(s.ores)));

  function smeltMenu(p, obj, ore) {
    const opts = SMELT.filter(s => api.ITEMS[s.bar] && (!ore || s.ores[ore]));
    api.makeMenu(p, { title: 'What would you like to smelt?', options: opts.map(s => ({ item: s.bar, s })), onPick: (pl, o, qty) => smelt(pl, obj, o.s, qty) });
  }

  function smelt(p, obj, s, qty) {
    if (tooLow(api, p, 'smithing', s.level, `smelt ${lower(api, s.bar).replace(' bar', '')}`)) return;
    const missing = () => Object.entries(s.ores).find(([id, n]) => api.invCount(p, id) < n);
    const miss = missing();
    if (miss) {
      const need = Object.entries(s.ores).map(([id, n]) => `${n > 1 ? n + ' ' : 'one '}${lower(api, id)}`).join(' and ');
      return api.msg(p, `You need ${need} to make ${lower(api, s.bar).startsWith('i') ? 'an' : 'a'} ${lower(api, s.bar)}.`);
    }
    repeat(api, p, {
      qty, every: 4, anim: 'cook', obj, name: 'smithing',
      step: pl => {
        if (Object.entries(s.ores).some(([id, n]) => api.invCount(pl, id) < n)) return false;
        for (const [id, n] of Object.entries(s.ores)) api.invRemove(pl, id, n);
        if (s.chance && Math.random() >= s.chance) { api.msg(pl, 'The ore is too impure and you fail to refine it.'); return true; }
        api.invAdd(pl, s.bar, 1);
        api.addXp(pl, 'smithing', s.xp);
        api.msg(pl, `You retrieve a bar of ${lower(api, s.bar).replace(' bar', '')}.`);
        return true;
      },
    });
  }

  function anvilMenu(p, obj, metal) {
    if (!api.hasItem(p, 'hammer')) return api.msg(p, 'You need a hammer to work the metal with.');
    if (!metal) {
      // the best bar you can work with, like OSRS picks the bar you clicked
      metal = [...METAL_IDS].reverse().find(m => api.hasItem(p, `${m}_bar`) && api.lv(p, 'smithing') >= METALS[m].base) || METAL_IDS.find(m => api.hasItem(p, `${m}_bar`));
      if (!metal) return api.msg(p, "You don't have any bars to smith with.");
    }
    const M = METALS[metal];
    api.makeMenu(p, {
      title: `What would you like to make? (${M.name} bars: ${api.invCount(p, metal + '_bar')})`,
      options: SMITH_KINDS.map(k => {
        const level = Math.min(99, M.base + k.off);
        return { item: smithId(metal, k.kind), label: `${k.make ? k.make + ' ' : ''}${api.ITEMS[smithId(metal, k.kind)].name.replace(M.name + ' ', '')} (${k.bars} bar${k.bars > 1 ? 's' : ''}, lvl ${level})`, k, level };
      }),
      onPick: (pl, o, qty) => smith(pl, obj, metal, o.k, o.level, qty),
    });
  }

  function smith(p, obj, metal, k, level, qty) {
    const M = METALS[metal], bar = `${metal}_bar`, id = smithId(metal, k.kind);
    if (tooLow(api, p, 'smithing', level, `make ${api.ITEMS[id].stack ? '' : 'a '}${lower(api, id)}`)) return;
    if (api.invCount(p, bar) < k.bars) return api.msg(p, `You don't have enough bars to make ${k.make ? 'arrowtips' : 'a ' + lower(api, id)}.`);
    repeat(api, p, {
      qty, every: 5, anim: 'smith', obj, name: 'smithing',
      step: pl => {
        if (!api.hasItem(pl, 'hammer')) { api.msg(pl, 'You need a hammer to work the metal with.'); return false; }
        if (api.invCount(pl, bar) < k.bars) return false;
        api.invRemove(pl, bar, k.bars);
        api.invAdd(pl, id, k.make || 1);
        api.addXp(pl, 'smithing', M.xp * k.bars);
        api.msg(pl, `You hammer the ${metal} and make ${k.make ? 'some ' : 'a '}${lower(api, id)}.`);
        return true;
      },
    });
  }

  api.objectAction('furnace', 'Smelt', (p, obj) => smeltMenu(p, obj, null));
  api.objectAction('anvil', 'Smith', (p, obj) => anvilMenu(p, obj, null));
  P.useHandlers.push((p, u) => {
    if (u.kind !== 'obj') return false;
    if (u.obj.type === 'furnace' && ORE_IDS.has(u.item.id)) { smeltMenu(p, u.obj, u.item.id); return true; }
    if (u.obj.type === 'anvil') {
      const metal = METAL_IDS.find(m => u.item.id === `${m}_bar`);
      if (metal) anvilMenu(p, u.obj, metal);
      else api.msg(p, u.item.id.endsWith('_bar') ? "You can't smith that bar into anything." : 'You need a metal bar to smith on an anvil.');
      return true;
    }
    return false;
  });
}
