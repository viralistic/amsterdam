// Woodcutting, mining, fishing and flax picking, plus the Forestry-style "Gemeente Boomplantdag" event.
import { AXES, PICKAXES, TREES, ROCKS, GEMS, FISH, SPOTS, osrsChance } from '../../../shared/content/gathering/data.js';

const an = name => (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name;
const lower = s => s.toLowerCase();

export function setupResources(api, G) {
  const { ITEMS } = api;

  // ------------------------------------------------------------------ woodcutting
  const axeTools = AXES.map(a => ({ id: a.id, level: a.level, power: a.mult }));
  const event = { area: null, until: 0, next: 0, logs: new Map() }; // Boomplantdag
  G.event = event;

  function nestChance(obj) { return (event.area && obj.data.area === event.area.id ? 4 : 1) / 256; }

  function chop(p, obj) {
    const t = TREES[obj.type];
    if (t.quest && !api.questDone(p, t.quest)) {
      api.msg(p, 'The tree shimmers and your axe bounces off the bark with a soft "boing".');
      return api.msg(p, 'An old enchantment protects the trees of the Betoverde Bos. Perhaps the Boswachter knows more.');
    }
    const logName = lower(ITEMS[t.log].name);
    api.gather(p, obj, {
      skill: 'woodcutting', level: t.level, xp: t.xp, item: t.log, tools: axeTools, every: 4, anim: 'chop',
      toolMsg: 'You need an axe that you have the Woodcutting level to use.',
      depletedMsg: 'This tree has been cut down. A new one will grow soon.',
      chance: (lvl, tool) => osrsChance(t.low * tool.power, t.high * tool.power, lvl),
      deplete: t.deplete, respawn: t.respawn,
      startMsg: 'You swing your axe at the tree.',
      successMsg: `You get some ${logName}.`,
      onSuccess: (pl, item, o) => {
        // Forestry-style teamwork: other woodcutters nearby give a small bonus
        let others = 0;
        for (const q of api.players.values()) if (q !== pl && q.action?.name === 'woodcutting' && api.cheb(q.x, q.z, pl.x, pl.z) <= 10) others++;
        let bonus = Math.min(4, others) * 0.03;
        if (event.area && o.data.area === event.area.id && event.until > api.tick) {
          bonus += 0.1;
          event.logs.set(pl.key, (event.logs.get(pl.key) || 0) + 1);
        }
        if (bonus > 0) api.addXp(pl, 'woodcutting', Math.round(t.xp * bonus * 10) / 10);
        if (others && !pl.gathTeamTip) { pl.gathTeamTip = true; api.msg(pl, 'Chopping alongside other woodcutters gives you a small bonus to your experience.'); }
        if (Math.random() < nestChance(o)) {
          api.dropGround('bird_nest', 1, pl.x, pl.z, 180_000, { owner: pl.id, forP: pl.id, forUntil: Date.now() + 60_000 });
          api.msg(pl, "A bird's nest falls out of the tree.", 'level');
        }
      },
      depleteMsg: undefined,
    });
  }
  for (const id of Object.keys(TREES)) api.objectAction(id, 'Chop down', chop);

  function startEvent(area) {
    event.area = area; event.until = api.tick + 500; event.logs = new Map();
    for (const q of api.players.values()) api.msg(q, `[Gemeente] Boomplantdag in ${area.name}! Help the Gemeente thin out the trees for the next 5 minutes: bonus experience and more bird's nests.`, 'level');
  }
  function endEvent() {
    const area = event.area;
    event.area = null;
    for (const [key, n] of event.logs) {
      const q = [...api.players.values()].find(pl => pl.key === key);
      if (!q) continue;
      if (n >= 5) {
        const coins = Math.min(1000, n * 20);
        api.giveOrDrop(q, 'coins', coins);
        api.giveOrDrop(q, 'bird_nest', 1);
        api.msg(q, `[Gemeente] Dank je wel! You chopped ${n} logs for the Boomplantdag in ${area.name}. Here's ${coins} coins and a bird's nest.`, 'level');
      } else api.msg(q, `[Gemeente] The Boomplantdag is over. Chop at least 5 logs next time to earn a reward.`);
    }
  }
  api.onTick(tick => {
    if (!event.next) event.next = tick + 2000 + Math.floor(Math.random() * 2000);
    if (event.area && tick >= event.until) { endEvent(); event.next = tick + 2000 + Math.floor(Math.random() * 2000); }
    if (!event.area && tick >= event.next && api.players.size) {
      const areas = G.treeAreas.filter(a => !a.noEvent);
      if (areas.length) startEvent(areas[Math.floor(Math.random() * areas.length)]);
      else event.next = tick + 2000;
    }
  });
  api.command('boomplantdag', (p, args) => {
    if (!api.DEV) return;
    const area = G.treeAreas.find(a => a.id === args[0]) || G.treeAreas[0];
    startEvent(area);
  });

  // ------------------------------------------------------------------ mining
  function mine(p, obj) {
    const r = ROCKS[obj.type];
    const lvl = api.lv(p, 'mining');
    const owned = PICKAXES.filter(t => (api.hasItem(p, t.id) || p.rec.equip.weapon?.id === t.id) && lvl >= t.level);
    const best = owned.sort((a, b) => a.every - b.every)[0];
    if (!best) return api.msg(p, 'You need a pickaxe to mine this rock. You do not have a pickaxe which you have the Mining level to use.');
    const oreName = lower(ITEMS[r.ore].name).replace(' ore', '');
    api.gather(p, obj, {
      skill: 'mining', level: r.level, xp: r.xp, item: r.ore, tools: [{ id: best.id, level: best.level, power: 1 }], every: best.every, anim: 'mine',
      depletedMsg: 'There is currently no ore available in this rock.',
      chance: lv => osrsChance(r.low, r.high, lv),
      deplete: 1, respawn: r.respawn,
      startMsg: 'You swing your pick at the rock.',
      successMsg: `You manage to mine some ${oreName}.`,
      onSuccess: pl => {
        if (Math.random() < 1 / 256) {
          const total = GEMS.reduce((s, g) => s + g[0], 0);
          let roll = Math.random() * total, gem = GEMS[0][1];
          for (const [w, id] of GEMS) if ((roll -= w) <= 0) { gem = id; break; }
          api.giveOrDrop(pl, gem, 1);
          api.msg(pl, `You just found ${an(lower(ITEMS[gem].name).replace('uncut ', ''))}!`, 'level');
        }
      },
    });
  }
  for (const id of Object.keys(ROCKS)) {
    api.objectAction(id, 'Mine', mine);
    api.objectAction(id, 'Prospect', (p, obj) => {
      const r = ROCKS[obj.type];
      api.msg(p, 'You examine the rock for ores...');
      api.msg(p, r.ore === 'clay' ? 'This rock contains clay.' : `This rock contains ${lower(ITEMS[r.ore].name).replace(' ore', '')}.`);
    });
  }

  // ------------------------------------------------------------------ fishing
  for (const [type, spot] of Object.entries(SPOTS)) {
    for (const [action, m] of Object.entries(spot.methods)) {
      const minLevel = Math.min(...m.fish.map(f => FISH[f].level));
      api.objectAction(type, action, (p, obj) => {
        if (!api.hasItem(p, m.tool)) return api.msg(p, `You need ${an(lower(ITEMS[m.tool].name))} to fish here.`);
        api.gather(p, obj, {
          skill: 'fishing', level: minLevel, xp: item => FISH[item].xp, tools: [{ id: m.tool, level: 1, power: 1 }], bait: m.bait, every: 5, anim: 'fish',
          chance: () => 1,
          item: (pl, lvl) => {
            for (const f of m.fish) if (lvl >= FISH[f].level && Math.random() < osrsChance(FISH[f].low, FISH[f].high, lvl)) return f;
            return null;
          },
          startMsg: `You ${m.verb}.`,
          successMsg: item => /shrimps|anchovies/.test(item) ? `You catch some ${lower(ITEMS[item].name).replace('raw ', '')}.` : `You catch ${an(lower(ITEMS[item].name).replace('raw ', ''))}.`,
        });
      });
    }
  }

  // fishing spots wander between their candidate tiles, like OSRS
  api.onTick(() => {
    for (const g of G.spotGroups) {
      for (const s of g.spots) {
        if (Math.random() >= 1 / 450) continue;
        const free = g.cands.filter(c => !g.spots.some(o => o.obj.x === c.x && o.obj.z === c.z));
        if (!free.length) continue;
        const c = free[Math.floor(Math.random() * free.length)];
        const old = s.obj;
        for (const q of api.players.values()) if (q.action?.obj === old) api.msg(q, 'The fishing spot moves.');
        api.removeObject(old);
        s.obj = api.spawnObject({ type: g.type, x: c.x, z: c.z, data: { group: g.id } });
      }
    }
  });

  // ------------------------------------------------------------------ flax
  api.objectAction('flax_plant', 'Pick', (p, obj) => api.gather(p, obj, {
    skill: 'crafting', level: 1, xp: 0, item: 'flax', every: 3, anim: 'pick', chance: () => 1,
    deplete: 0.2, respawn: [8, 15], depletedMsg: 'Someone has already picked this flax.', successMsg: 'You pick some flax.',
  }));
}
