// Crafting at the NEMO hub: spinning, pottery, glass, leather, gems and jewellery. Also water and sand sources.
import { SPIN, POTTERY, GLASSBLOW, LEATHER, TAN, GEMS, JEWELLERY } from '../../../shared/content/production/data.js';
import { tooLow, lower, repeat, pair, swapOne, an } from './util.js';

const WHEELS = { spinning_wheel: 3, electro_spinner: 2 };
const KILNS = { pottery_oven: 3, plasma_kiln: 2 };

export default function crafting(api, P) {
  // ---------------------------------------------------------------- spinning
  function spinMenu(p, obj, only) {
    const opts = SPIN.filter(s => api.ITEMS[s.from] && (!only || s.from === only));
    api.makeMenu(p, { title: 'What would you like to spin?', options: opts.map(s => ({ item: s.to, s })), onPick: (pl, o, qty) => spin(pl, obj, o.s, qty) });
  }
  function spin(p, obj, s, qty) {
    if (tooLow(api, p, 'crafting', s.level, `spin ${lower(api, s.from)}`)) return;
    if (!api.hasItem(p, s.from)) return api.msg(p, `You need some ${lower(api, s.from)} to spin.`);
    repeat(api, p, {
      qty, every: WHEELS[obj.type] || 3, anim: 'craft', obj, name: 'crafting',
      step: pl => {
        if (!api.hasItem(pl, s.from)) return false;
        swapOne(api, pl, s.from, s.to);
        api.addXp(pl, 'crafting', s.xp);
        api.msg(pl, obj.type === 'electro_spinner' ? `Bzzzt! The electro-spinner makes ${an(lower(api, s.to))}.` : `You spin the ${lower(api, s.from)} into ${an(lower(api, s.to))}.`);
        return true;
      },
    });
  }
  for (const t of Object.keys(WHEELS)) api.objectAction(t, 'Spin', (p, obj) => spinMenu(p, obj, null));

  // ---------------------------------------------------------------- pottery
  function potteryMenu(p, obj) {
    if (!api.hasItem(p, 'soft_clay')) return api.msg(p, 'You need some soft clay to use the wheel. Use clay with a bucket of water to soften it.');
    api.makeMenu(p, {
      title: 'What would you like to make?', options: POTTERY.map(x => ({ item: x.unfired, x })),
      onPick: (pl, o, qty) => {
        if (tooLow(api, pl, 'crafting', o.x.level, `make ${an(lower(api, o.x.fired))}`)) return;
        repeat(api, pl, {
          qty, every: 3, anim: 'craft', obj, name: 'crafting',
          step: q => {
            if (!api.hasItem(q, 'soft_clay')) return false;
            swapOne(api, q, 'soft_clay', o.x.unfired);
            api.addXp(q, 'crafting', o.x.xp);
            api.msg(q, `You make the soft clay into ${an(lower(api, o.x.unfired).replace('unfired ', ''))}.`);
            return true;
          },
        });
      },
    });
  }
  function kilnMenu(p, obj) {
    const opts = POTTERY.filter(x => api.hasItem(p, x.unfired));
    if (!opts.length) return api.msg(p, "You don't have any unfired pottery to put in the oven.");
    api.makeMenu(p, {
      title: 'What would you like to fire in the oven?', options: opts.map(x => ({ item: x.fired, x })),
      onPick: (pl, o, qty) => repeat(api, pl, {
        qty, every: KILNS[obj.type] || 3, anim: 'cook', obj, name: 'crafting',
        step: q => {
          if (!api.hasItem(q, o.x.unfired)) return false;
          swapOne(api, q, o.x.unfired, o.x.fired);
          api.addXp(q, 'crafting', o.x.fireXp);
          api.msg(q, `You remove the ${lower(api, o.x.fired)} from the oven.`);
          return true;
        },
      }),
    });
  }
  api.objectAction('pottery_wheel', 'Form', potteryMenu);
  for (const t of Object.keys(KILNS)) api.objectAction(t, 'Fire', kilnMenu);

  // ---------------------------------------------------------------- water and sand
  function fill(p, obj, pairs, verb) {
    const todo = pairs.filter(([e]) => api.hasItem(p, e));
    if (!todo.length) return api.msg(p, verb === 'sand' ? 'You need an empty bucket to fill with sand.' : 'You need an empty vial or bucket to fill.');
    repeat(api, p, {
      qty: 28, every: 1, first: 1, anim: 'pick', obj, name: 'fill',
      step: pl => {
        const t = pairs.find(([e]) => api.hasItem(pl, e));
        if (!t) return false;
        swapOne(api, pl, t[0], t[1]);
        api.msg(pl, verb === 'sand' ? 'You fill the bucket with sand.' : `You fill the ${lower(api, t[0])} with water.`);
        return true;
      },
    });
  }
  const WATER = [['vial', 'vial_of_water'], ['bucket', 'bucket_of_water']];
  for (const t of ['water_fountain', 'sink']) api.objectAction(t, 'Fill', (p, obj) => fill(p, obj, WATER, 'water'));
  api.objectAction('sandpit', 'Fill bucket', (p, obj) => fill(p, obj, [['bucket', 'bucket_of_sand']], 'sand'));

  // ---------------------------------------------------------------- furnace: glass and jewellery
  function furnaceCraft(p, obj) {
    const opts = [];
    if (api.hasItem(p, 'bucket_of_sand') && api.hasItem(p, 'soda_ash')) opts.push({ item: 'molten_glass', glass: true });
    if (api.hasItem(p, 'gold_bar')) for (const j of JEWELLERY) if (api.hasItem(p, j.mould)) opts.push({ item: j.item, j, label: `${api.ITEMS[j.item].name} (lvl ${j.level})` });
    if (!opts.length) return api.msg(p, api.hasItem(p, 'gold_bar') ? 'You need a ring mould or an amulet mould to craft gold jewellery.' : 'You need a gold bar and a mould, or a bucket of sand and soda ash, to craft at the furnace.');
    api.makeMenu(p, { title: 'What would you like to make?', options: opts, onPick: (pl, o, qty) => (o.glass ? glass(pl, obj, qty) : jewel(pl, obj, o.j, qty)) });
  }
  function glass(p, obj, qty) {
    repeat(api, p, {
      qty, every: 3, anim: 'cook', obj, name: 'crafting',
      step: pl => {
        if (!api.hasItem(pl, 'bucket_of_sand') || !api.hasItem(pl, 'soda_ash')) return false;
        swapOne(api, pl, 'bucket_of_sand', 'bucket');
        swapOne(api, pl, 'soda_ash', 'molten_glass');
        api.addXp(pl, 'crafting', 20);
        api.msg(pl, 'You heat the sand and soda ash in the furnace to make glass.');
        return true;
      },
    });
  }
  function jewel(p, obj, j, qty) {
    if (tooLow(api, p, 'crafting', j.level, `make ${an(lower(api, j.item))}`)) return;
    if (j.gem && !api.hasItem(p, j.gem)) return api.msg(p, `You need ${an(lower(api, j.gem))} to make ${an(lower(api, j.item))}.`);
    repeat(api, p, {
      qty, every: 4, anim: 'cook', obj, name: 'crafting',
      step: pl => {
        if (!api.hasItem(pl, 'gold_bar') || !api.hasItem(pl, j.mould) || (j.gem && !api.hasItem(pl, j.gem))) return false;
        if (j.gem) api.invRemove(pl, j.gem, 1);
        swapOne(api, pl, 'gold_bar', j.item);
        api.addXp(pl, 'crafting', j.xp);
        api.msg(pl, `You make ${an(lower(api, j.item))}.`);
        return true;
      },
    });
  }
  api.objectAction('furnace', 'Craft', furnaceCraft);

  // ---------------------------------------------------------------- tanning
  P.tanMenu = (p, npc) => {
    if (!api.hasItem(p, 'cowhide')) {
      api.startDialog(p, npc, { start: [{ npc: "Bring me cowhides and I'll tan them for you. 1 coin for soft leather, 3 coins for hard leather. Fair price, Amsterdam price." }] });
      return 'stop';
    }
    api.makeMenu(p, {
      title: 'What would you like to tan your cowhides into?', options: TAN.map(t => ({ item: t.to, t, label: `${api.ITEMS[t.to].name} (${t.cost} coin${t.cost > 1 ? 's' : ''})` })),
      onPick: (pl, o, qty) => {
        let n = 0;
        while (n < qty && api.hasItem(pl, 'cowhide')) {
          if (api.invCount(pl, 'coins') < o.t.cost) { api.msg(pl, "You don't have enough coins to tan any more hides."); break; }
          api.invRemove(pl, 'coins', o.t.cost);
          swapOne(api, pl, 'cowhide', o.t.to);
          n++;
        }
        if (n) api.msg(pl, `The tanner tans ${n} cowhide${n > 1 ? 's' : ''} into ${lower(api, o.t.to)} for you.`);
      },
    });
    return 'stop';
  };

  // ---------------------------------------------------------------- item on item
  const store = p => api.playerStore(p, 'production');
  function sew(p, mat) {
    const opts = LEATHER.filter(l => l.mat === mat && api.ITEMS[l.item]);
    api.makeMenu(p, {
      title: 'What would you like to make?', options: opts.map(l => ({ item: l.item, l, label: `${api.ITEMS[l.item].name} (lvl ${l.level})` })),
      onPick: (pl, o, qty) => {
        if (tooLow(api, pl, 'crafting', o.l.level, `make ${lower(api, o.l.item)}`)) return;
        repeat(api, pl, {
          qty, every: 3, anim: 'craft', name: 'crafting',
          step: q => {
            if (!api.hasItem(q, 'needle') || !api.hasItem(q, mat)) return false;
            if (!api.hasItem(q, 'thread')) { api.msg(q, 'You need some thread to sew with.'); return false; }
            swapOne(api, q, mat, o.l.item);
            api.addXp(q, 'crafting', o.l.xp);
            api.msg(q, `You make ${/s$/.test(o.l.item) ? 'some ' + lower(api, o.l.item) : an(lower(api, o.l.item))}.`);
            const st = store(q);
            st.thread = (st.thread || 0) + 1;
            if (st.thread >= 5) { st.thread = 0; api.invRemove(q, 'thread', 1); api.msg(q, 'You use up one of your reels of thread.'); }
            return true;
          },
        });
      },
    });
  }

  P.useHandlers.push((p, u) => {
    if (u.kind === 'obj') {
      const t = u.obj.type, id = u.item.id;
      if (WHEELS[t] && SPIN.some(s => s.from === id)) { spinMenu(p, u.obj, id); return true; }
      if (t === 'pottery_wheel' && id === 'soft_clay') { potteryMenu(p, u.obj); return true; }
      if (KILNS[t] && POTTERY.some(x => x.unfired === id)) { kilnMenu(p, u.obj); return true; }
      if ((t === 'water_fountain' || t === 'sink') && WATER.some(w => w[0] === id)) { fill(p, u.obj, WATER, 'water'); return true; }
      if (t === 'sandpit' && id === 'bucket') { fill(p, u.obj, [['bucket', 'bucket_of_sand']], 'sand'); return true; }
      if (t === 'furnace' && ['bucket_of_sand', 'soda_ash', 'gold_bar', 'ring_mould', 'amulet_mould'].includes(id)) { furnaceCraft(p, u.obj); return true; }
      return false;
    }
    if (u.kind !== 'item') return false;
    let m;
    // clay + water -> soft clay
    if ((m = pair(u, 'clay', id => id === 'bucket_of_water' || id === 'vial_of_water'))) {
      const qty = api.invCount(p, 'clay');
      repeat(api, p, {
        qty, every: 2, anim: 'craft', name: 'crafting',
        step: pl => {
          const w = api.hasItem(pl, 'bucket_of_water') ? 'bucket_of_water' : api.hasItem(pl, 'vial_of_water') ? 'vial_of_water' : null;
          if (!w || !api.hasItem(pl, 'clay')) return false;
          swapOne(api, pl, w, w === 'bucket_of_water' ? 'bucket' : 'vial');
          swapOne(api, pl, 'clay', 'soft_clay');
          api.msg(pl, 'You mix the clay and water. You now have some soft, workable clay.');
          return true;
        },
      });
      return true;
    }
    // glassblowing
    if ((m = pair(u, 'glassblowing_pipe', 'molten_glass'))) {
      api.makeMenu(p, {
        title: 'What would you like to blow?', options: GLASSBLOW.map(g => ({ item: g.item, g, label: `${api.ITEMS[g.item].name} (lvl ${g.level})` })),
        onPick: (pl, o, qty) => {
          if (tooLow(api, pl, 'crafting', o.g.level, `make ${an(lower(api, o.g.item))}`)) return;
          repeat(api, pl, {
            qty, every: 3, anim: 'craft', name: 'crafting',
            step: q => {
              if (!api.hasItem(q, 'molten_glass') || !api.hasItem(q, 'glassblowing_pipe')) return false;
              swapOne(api, q, 'molten_glass', o.g.item);
              api.addXp(q, 'crafting', o.g.xp);
              api.msg(q, `You make ${an(lower(api, o.g.item))}.`);
              return true;
            },
          });
        },
      });
      return true;
    }
    // leather
    if ((m = pair(u, 'needle', id => id === 'leather' || id === 'hard_leather'))) { sew(p, m.b); return true; }
    if (pair(u, 'thread', id => id === 'leather' || id === 'hard_leather')) { api.msg(p, 'You need a needle to sew leather.'); return true; }
    // gem cutting
    if ((m = pair(u, 'chisel', id => GEMS.some(g => g.uncut === id)))) {
      const g = GEMS.find(x => x.uncut === m.b);
      if (tooLow(api, p, 'crafting', g.level, `cut ${an(lower(api, g.cut))}`)) return true;
      repeat(api, p, {
        qty: api.invCount(p, g.uncut), every: 3, anim: 'craft', name: 'crafting',
        step: pl => {
          if (!api.hasItem(pl, g.uncut) || !api.hasItem(pl, 'chisel')) return false;
          swapOne(api, pl, g.uncut, g.cut);
          api.addXp(pl, 'crafting', g.xp);
          api.msg(pl, `You cut the ${lower(api, g.cut)}.`);
          return true;
        },
      });
      return true;
    }
    return false;
  });
}
