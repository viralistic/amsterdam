// Cooking on fires, ranges, the Albert Cuyp market stoves and the snack bar fryer near Centraal.
import { FOOD } from '../../../shared/content/production/data.js';
import { tooLow, lower, repeat, swapOne } from './util.js';

const COOKERS = ['fire', 'cooking_range', 'market_stove', 'snack_fryer'];
const BY_RAW = Object.fromEntries(FOOD.map(f => [f.raw, f]));

export default function cooking(api, P) {
  // Chance to cook successfully: rises from about half at the level requirement to always at the stop-burn level.
  P.cookChance = (lvl, f, onFire) => {
    const stop = f.stop[onFire ? 0 : 1];
    if (!f.burnt || lvl >= stop) return 1;
    const base = onFire ? 0.5 : 0.55;
    return Math.min(1, base + (1 - base) * (lvl - f.level) / Math.max(1, stop - f.level));
  };

  function cookMenu(p, obj, only) {
    const raws = only ? [only] : FOOD.filter(f => api.ITEMS[f.raw] && api.hasItem(p, f.raw)).map(f => f.raw);
    if (!raws.length) return api.msg(p, "You don't have anything to cook.");
    api.makeMenu(p, {
      title: 'What would you like to cook?',
      options: raws.map(r => ({ item: BY_RAW[r].cooked, raw: r })),
      onPick: (pl, o, qty) => cook(pl, obj, BY_RAW[o.raw], qty),
    });
  }

  function cook(p, obj, f, qty) {
    const onFire = obj.type === 'fire';
    if (f.rangeOnly && onFire) return api.msg(p, `You need a proper range to cook ${lower(api, f.raw)}.`);
    if (tooLow(api, p, 'cooking', f.level, `cook ${lower(api, f.raw)}`)) return;
    repeat(api, p, {
      qty, every: 4, first: 1, anim: 'cook', obj, name: 'cooking',
      step: pl => {
        if (!api.hasItem(pl, f.raw)) { if (qty > 1) api.msg(pl, `You have run out of ${lower(api, f.raw)} to cook.`); return false; }
        if (!api.objects.has(obj.id)) return false;
        if (!f.burnt) { // seaweed burns down into soda ash
          swapOne(api, pl, f.raw, f.cooked);
          api.msg(pl, 'You burn the seaweed into soda ash.');
          return true;
        }
        if (Math.random() < P.cookChance(api.lv(pl, 'cooking'), f, onFire)) {
          swapOne(api, pl, f.raw, f.cooked);
          api.addXp(pl, 'cooking', f.xp);
          api.msg(pl, f.cooked === 'baked_potato' ? 'You bake the potato.' : obj.type === 'snack_fryer' ? `You deep-fry the ${lower(api, f.raw).replace('raw ', '')}. Lekker!` : `You cook the ${lower(api, f.raw).replace('raw ', '')}.`);
        } else {
          swapOne(api, pl, f.raw, f.burnt);
          api.msg(pl, `You accidentally burn the ${lower(api, f.raw).replace('raw ', '')}.`);
        }
        return true;
      },
    });
  }

  for (const t of COOKERS) api.objectAction(t, 'Cook', (p, obj) => cookMenu(p, obj, null));
  P.useHandlers.push((p, u) => {
    if (u.kind !== 'obj' || !COOKERS.includes(u.obj.type)) return false;
    const f = BY_RAW[u.item.id];
    if (!f) { api.msg(p, "You can't cook that."); return true; }
    cookMenu(p, u.obj, f.raw);
    return true;
  });
}
