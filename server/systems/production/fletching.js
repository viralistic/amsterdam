// Fletching: knife on logs, stringing bows, feathering shafts and tipping arrows.
import { LOGS, BOWS, ARROWS } from '../../../shared/content/production/data.js';
import { tooLow, lower, repeat, pair, swapOne, an } from './util.js';

export default function fletching(api, P) {
  function knifeMenu(p, log) {
    const L = LOGS[log];
    const opts = [{ item: 'arrow_shaft', label: `${L.shafts} arrow shafts`, shafts: true }];
    for (const b of BOWS.filter(b => b.log === log)) opts.push({ item: b.unstrung, b, label: `${api.ITEMS[b.unstrung].name} (lvl ${b.level})` });
    api.makeMenu(p, {
      title: 'What would you like to make?', options: opts,
      onPick: (pl, o, qty) => {
        const lvl = o.shafts ? L.shaftLevel : o.b.level;
        if (tooLow(api, pl, 'fletching', lvl, `fletch ${o.shafts ? 'arrow shafts from ' + lower(api, log) : an(lower(api, o.b.unstrung).replace(' (u)', ''))}`)) return;
        repeat(api, pl, {
          qty, every: 3, anim: 'craft', name: 'fletching',
          step: q => {
            if (!api.hasItem(q, log) || !api.hasItem(q, 'knife')) return false;
            if (o.shafts) {
              if (!api.canAdd(q, 'arrow_shaft', 1) && !api.hasItem(q, 'arrow_shaft')) return false;
              api.invRemove(q, log, 1);
              api.invAdd(q, 'arrow_shaft', L.shafts);
              api.addXp(q, 'fletching', L.shaftXp);
              api.msg(q, `You carefully cut the ${lower(api, log)} into ${L.shafts} arrow shafts.`);
            } else {
              swapOne(api, q, log, o.b.unstrung);
              api.addXp(q, 'fletching', o.b.xp);
              api.msg(q, `You carefully cut the wood into ${an(lower(api, o.b.unstrung).replace(' (u)', ''))}.`);
            }
            return true;
          },
        });
      },
    });
  }

  P.useHandlers.push((p, u) => {
    if (u.kind !== 'item') return false;
    let m;
    if ((m = pair(u, 'knife', id => !!LOGS[id] && !!api.ITEMS[id]))) { knifeMenu(p, m.b); return true; }
    if ((m = pair(u, 'bow_string', id => BOWS.some(b => b.unstrung === id)))) {
      const b = BOWS.find(x => x.unstrung === m.b);
      if (tooLow(api, p, 'fletching', b.level, `string ${an(lower(api, b.bow))}`)) return true;
      repeat(api, p, {
        qty: Math.min(api.invCount(p, 'bow_string'), api.invCount(p, b.unstrung)), every: 2, anim: 'craft', name: 'fletching',
        step: pl => {
          if (!api.hasItem(pl, 'bow_string') || !api.hasItem(pl, b.unstrung)) return false;
          api.invRemove(pl, 'bow_string', 1);
          swapOne(api, pl, b.unstrung, b.bow);
          api.addXp(pl, 'fletching', b.xp);
          api.msg(pl, `You add a string to the bow.`);
          return true;
        },
      });
      return true;
    }
    if ((m = pair(u, 'feather', 'arrow_shaft'))) {
      repeat(api, p, {
        qty: 10, every: 2, anim: 'craft', name: 'fletching',
        step: pl => {
          const n = Math.min(15, api.invCount(pl, 'feather'), api.invCount(pl, 'arrow_shaft'));
          if (n <= 0) return false;
          api.invRemove(pl, 'feather', n); api.invRemove(pl, 'arrow_shaft', n);
          api.invAdd(pl, 'headless_arrow', n);
          api.addXp(pl, 'fletching', n);
          api.msg(pl, `You attach feathers to ${n} arrow shaft${n > 1 ? 's' : ''}.`);
          return true;
        },
      });
      return true;
    }
    if ((m = pair(u, id => ARROWS.some(a => a.tips === id), 'headless_arrow'))) {
      const a = ARROWS.find(x => x.tips === m.a);
      if (tooLow(api, p, 'fletching', a.level, `make ${lower(api, a.arrow)}s`)) return true;
      repeat(api, p, {
        qty: 10, every: 2, anim: 'craft', name: 'fletching',
        step: pl => {
          const n = Math.min(15, api.invCount(pl, a.tips), api.invCount(pl, 'headless_arrow'));
          if (n <= 0) return false;
          api.invRemove(pl, a.tips, n); api.invRemove(pl, 'headless_arrow', n);
          api.invAdd(pl, a.arrow, n);
          api.addXp(pl, 'fletching', a.xp * n);
          api.msg(pl, `You attach ${lower(api, a.tips).replace('arrowtips', 'heads')} to ${n} arrow${n > 1 ? 's' : ''}.`);
          return true;
        },
      });
      return true;
    }
    return false;
  });
}
