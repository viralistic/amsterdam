// The Westergasfabriek industrial dungeon: four rooms under the old gasworks with clockwork enemies, steam vent
// hazards, scrap heaps with rare crafting materials and the mid-game boss "De Gashouder Golem".
import { MONSTERS } from './monsters.js';

const X = 34000, Z = 30000;
export const WESTERGAS = {
  hall: { x0: X, z0: Z, x1: X + 30, z1: Z + 22 },
  pipes: { x0: X + 30, z0: Z + 8, x1: X + 62, z1: Z + 14 },
  machines: { x0: X + 62, z0: Z, x1: X + 100, z1: Z + 30 },
  boss: { x0: X + 100, z0: Z, x1: X + 136, z1: Z + 32 },
  start: { x: X + 4, z: Z + 11 },
};

export function registerWestergas(api, U) {
  const W = WESTERGAS;
  const inRoom = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  api.interior({
    id: 'cb_westergas', name: 'Westergasfabriek dungeon',
    rooms: [
      { ...W.hall, floor: '#4c4842', wall: '#6e3b2a', h: 4.5, doors: [['e', 9, 4]] },
      { ...W.pipes, floor: '#3f3d3a', wall: '#5e3426', h: 3.5, doors: [['w', 1, 4], ['e', 1, 4]] },
      { ...W.machines, floor: '#46423c', wall: '#6e3b2a', h: 5, doors: [['w', 9, 4], ['e', 13, 4]] },
      { ...W.boss, floor: '#35322e', wall: '#4b5157', h: 7, doors: [['w', 13, 4]] },
    ],
    floors: [['#2e3a2a', [X + 108, Z + 6, X + 128, Z + 6, X + 128, Z + 26, X + 108, Z + 26]]],
  });

  // ---- entrance and exit
  const door = api.tile(52.3858, 4.8745);
  api.spawnObject({ type: 'cb_westergas_entrance', x: door.x, z: door.z, data: { to: { x: W.start.x, z: W.start.z, inside: true, msg: 'You squeeze through the rusted door into the old gasworks. It smells of oil and something worse.' } } });
  api.spawnObject({ type: 'sign', x: door.x + 3, z: door.z + 1, data: { text: 'WESTERGASFABRIEK - GASHOUDER. Gesloten wegens spoken. Recommended combat level: 40+. Bring food. The steam vents do not care about your feelings.' } });
  api.spawnObject({ type: 'exit', x: X + 2, z: Z + 11, rot: Math.PI / 2, data: { to: { x: door.x, z: door.z + 2, inside: false } } });

  // ---- props
  for (const [x, z] of [[X + 8, Z + 3], [X + 20, Z + 3], [X + 8, Z + 19], [X + 20, Z + 19]]) api.spawnObject({ type: 'cb_gas_tank', x, z });
  for (const [x, z] of [[X + 66, Z + 4], [X + 66, Z + 24], [X + 80, Z + 4], [X + 94, Z + 26]]) api.spawnObject({ type: 'cb_pipes', x, z });
  api.spawnObject({ type: 'cb_gas_tank', x: X + 90, z: Z + 6 });
  const scraps = [[X + 26, Z + 18], [X + 74, Z + 26], [X + 96, Z + 3], [X + 84, Z + 15]].map(([x, z]) => api.spawnObject({ type: 'cb_scrap_pile', x, z }));
  api.spawnObject({ type: 'cb_workbench', x: X + 14, z: Z + 20 });

  // ---- monsters
  U.spawn(MONSTERS, 'cb_automaton', { x: X + 12, z: Z + 8 });
  U.spawn(MONSTERS, 'cb_automaton', { x: X + 18, z: Z + 14 });
  U.spawn(MONSTERS, 'cb_automaton', { x: X + 24, z: Z + 9 });
  U.spawn(MONSTERS, 'cb_automaton', { x: X + 58, z: Z + 11 }, { wander: 1 });
  U.spawn(MONSTERS, 'cb_gas_wraith', { x: X + 70, z: Z + 10 });
  U.spawn(MONSTERS, 'cb_gas_wraith', { x: X + 78, z: Z + 21 });
  U.spawn(MONSTERS, 'cb_gas_wraith', { x: X + 90, z: Z + 12 });
  U.spawn(MONSTERS, 'cb_steam_golem', { x: X + 84, z: Z + 7 });
  U.spawn(MONSTERS, 'cb_steam_golem', { x: X + 88, z: Z + 22 });

  // ---- steam vents: each erupts every 8 ticks (staggered) and scalds anyone next to it
  const vents = [];
  [[X + 35, Z + 10], [X + 40, Z + 12], [X + 45, Z + 10], [X + 50, Z + 12], [X + 55, Z + 10], [X + 70, Z + 16], [X + 92, Z + 18]]
    .forEach(([x, z], i) => vents.push({ o: api.spawnObject({ type: 'cb_steam_vent', x, z }), phase: (i * 3) % 8, boss: false }));
  [[X + 104, Z + 4], [X + 132, Z + 4], [X + 104, Z + 28], [X + 132, Z + 28], [X + 118, Z + 16]]
    .forEach(([x, z], i) => vents.push({ o: api.spawnObject({ type: 'cb_steam_vent', x, z }), phase: (i * 2) % 6, boss: true }));
  api.objectAction('cb_steam_vent', 'Inspect', (p, o) => api.msg(p, o.x > X + 100 ? 'This vent is connected to the Gashouder Golem. It erupts when the golem is under pressure.' : 'It erupts every few seconds. Time your run past it.'));

  // ---- scrap heaps
  api.objectAction('cb_scrap_pile', 'Search', (p, o) => {
    if (U.stunned(p)) return;
    api.msg(p, 'You start rummaging through the scrap...');
    api.startAction(p, {
      first: 3, every: 4, anim: 'pick', obj: o,
      step: pl => {
        if (api.isDepleted(o)) return false;
        if (!api.freeSlots(pl) && !api.hasItem(pl, 'gas_essence')) { api.msg(pl, 'Your inventory is too full to hold any more.'); return false; }
        const r = Math.random();
        const item = r < 0.04 ? 'brass_gear' : r < 0.06 ? 'gas_essence' : r < 0.5 ? 'scrap_metal' : r < 0.6 ? (api.ITEMS.coal ? 'coal' : 'scrap_metal') : null;
        if (item && api.canAdd(pl, item, 1)) {
          api.invAdd(pl, item, 1);
          api.msg(pl, item === 'brass_gear' ? 'You find a perfectly good brass gear!' : `You find some ${api.ITEMS[item].name.toLowerCase()}.`);
          if (api.SKILLS.includes('crafting')) api.addXp(pl, 'crafting', item === 'brass_gear' ? 25 : 4);
        }
        if (U.chance(0.18)) { api.deplete(o, api.rand(40, 80)); api.msg(pl, 'There is nothing useful left in this heap.'); return false; }
        return true;
      },
    });
  });

  // ---- the workbench: steam core + 3 brass gears + 2 gas essence + hammer -> steamforged helm (Crafting 40)
  api.objectAction('cb_workbench', 'Craft', p => {
    const need = [['steam_core', 1], ['brass_gear', 3], ['gas_essence', 2]];
    if (api.lv(p, 'crafting') < 40) return api.msg(p, 'You need a Crafting level of 40 to assemble steamforged armour.');
    if (!api.hasItem(p, 'hammer')) return api.msg(p, 'You need a hammer to work the brass.');
    if (!need.every(([id, q]) => api.hasItem(p, id, q))) return api.msg(p, 'To forge a steamforged helm you need a steam core, 3 brass gears and 2 gas essence.');
    for (const [id, q] of need) api.invRemove(p, id, q);
    api.invAdd(p, 'steamforged_helm', 1);
    api.addXp(p, 'crafting', 350);
    p.anim = 'smith'; p.animUntil = api.tick + 3;
    api.msg(p, 'You hammer the gears around the steam core and forge a steamforged helm!', 'level');
  });

  // ================= De Gashouder Golem
  const center = { x: X + 118, z: Z + 16 };
  const boss = U.spawn(MONSTERS, 'cb_gashouder_golem', center);
  const puffs = U.pool(MONSTERS, 'cb_gas_puff', 3);
  const inBoss = p => p.inside && inRoom(W.boss, p.x, p.z);
  const bossPlayers = () => [...api.players.values()].filter(p => inBoss(p) && U.alive(p));
  let empty = 0;

  boss.def.combat = {
    ...boss.def.combat,
    special: {
      chance: 0.35,
      run(npc, t) {
        if (!npc.phase2 && npc.hp < npc.def.combat.hp / 2) {
          npc.phase2 = true;
          api.say(npc, 'n', 'PRESSURE CRITICAL! VENTING!');
          U.fx(npc.x, npc.z, 'gas', { r: 5 });
          puffs.forEach((pf, i) => { const a = i / puffs.length * Math.PI * 2; U.summon(pf, Math.round(npc.x + Math.cos(a) * 4), Math.round(npc.z + Math.sin(a) * 4), U.pick(bossPlayers()) || t, true); });
          for (const p of bossPlayers()) api.msg(p, 'The Gashouder Golem vents gas clouds and its steam vents start erupting!', 'warn');
          return true;
        }
        const roll = Math.random();
        if (roll < 0.45) {
          api.say(npc, 'n', '*WHOOOSH*');
          U.fx(npc.x, npc.z, 'gas', { r: 4 });
          for (const p of bossPlayers()) if (api.cheb(p.x, p.z, npc.x, npc.z) <= 4) U.strike(npc, p, { maxHit: 12, chance: 0.85 });
          return true;
        }
        if (roll < 0.8 && api.cheb(t.x, t.z, npc.x, npc.z) <= 1) {
          api.say(npc, 'n', 'SLAM!');
          U.fx(t.x, t.z, 'slam', { r: 1 });
          U.strike(npc, t, { dmg: api.rand(10, 22) });
          if (U.alive(t)) U.stun(t, 3, 'The slam knocks you off your feet!');
          return true;
        }
        if (npc.phase2) {
          api.say(npc, 'n', 'HEAT... WAVE...');
          U.fx(npc.x, npc.z, 'heat', { r: 18 });
          for (const p of bossPlayers()) U.hurt(p, api.rand(2, 6), 'A wave of heat scorches you.');
          return true;
        }
        return false;
      },
    },
  };
  // shrugs off a reset when everyone leaves
  api.onTick(tick => {
    const ps = bossPlayers();
    if (ps.length) empty = 0; else if (++empty === 30 && !boss.dead) { boss.hp = boss.def.combat.hp; boss.phase2 = false; puffs.forEach(U.park); }
    if (boss.dead) { boss.phase2 = false; for (const pf of puffs) if (!U.isParked(pf)) U.park(pf); }
    // vents
    for (const v of vents) {
      if (v.boss && !boss.phase2) continue;
      const cycle = v.boss ? 6 : 8, at = (tick + v.phase) % cycle;
      if (at === cycle - 1) U.fx(v.o.x, v.o.z, 'vent_warn');
      if (at !== 0) continue;
      U.fx(v.o.x, v.o.z, 'steam');
      for (const p of api.players.values()) if (p.inside && api.cheb(p.x, p.z, v.o.x, v.o.z) <= 1) U.hurt(p, api.rand(3, v.boss ? 9 : 7), 'You are scalded by a jet of steam!');
    }
  });
  api.onNpcDeath((npc, killer) => {
    if (npc !== boss || !killer) return;
    for (const p of bossPlayers()) api.msg(p, 'The Gashouder Golem collapses with a long, sad hiss.', 'level');
    const st = api.playerStore(killer, 'combat');
    st.kc = st.kc || {};
    st.kc.gashouder = (st.kc.gashouder || 0) + 1;
    api.msg(killer, `Your Gashouder Golem kill count is: ${st.kc.gashouder}.`);
  });
  return { boss, scraps };
}
