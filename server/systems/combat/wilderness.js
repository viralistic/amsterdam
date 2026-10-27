// The Wilderness in Zuidoost: a fictional, exaggerated game zone of fantasy creatures and ruins.
// Borderlands (1-10), Industrial district (11-20) with ambush spots, Central danger zone (21-40), the haunted metro
// tunnels (interiors with their own Wilderness level), the hidden lair of The Concrete Colossus, the Gaasperplas
// Leviathan, safe border outposts with banks, warning signs and escape routes.
import { MONSTERS } from './monsters.js';

const MX = 34500, MZ = 30000; // metro tunnel interiors
const LX = 35400, LZ = 30000; // the hidden lair

export function registerWilderness(api, U) {
  const T = api.tile;
  const S = (key, lat, lon, n = 1, r = 5) => U.scatter(MONSTERS, key, T(lat, lon), n, r);

  // ================= border outposts (just outside the Wilderness) with bank booths
  const outposts = {
    west: { name: 'Fort Duivendrecht', at: T(52.31509, 4.93429) },
    north: { name: 'Noorderpost', at: T(52.33041, 4.96755) },
  };
  api.shop('cb_outpost', { name: 'Grenspost Proviand', stock: ['herring', 'stroopwafel', 'gouda', 'broodje_kaas', 'bronze_arrow', 'iron_arrow'] });
  api.dialog('cb_grenswachter', {
    start: [
      { npc: 'Halt! Beyond this outpost lies the Wilderness. Fantasy monsters, ruins and other adventurers who want your stuff.' },
      { opts: [['What are the rules out there?', 'rules'], ['Any supplies for sale?', 'shop'], ['How do I get out quickly?', 'escape'], ['Bye.', 'end']] },
    ],
    rules: [
      { player: 'What are the rules out there?' },
      { npc: 'The deeper you go, the higher the Wilderness level. Other players of your own mode can attack you if your combat levels are close enough.' },
      { npc: 'Die out there and you keep only your three most valuable items. Attack someone first and you get skulled: then you keep nothing.' },
      { npc: 'Above level 20 your teleports stop working. Bank your valuables here first. There is a booth right behind me.' },
      { goto: 'start2' },
    ],
    escape: [
      { player: 'How do I get out quickly?' },
      { npc: 'Look for the green emergency exits in the ruins. They lead back to an outpost. The metro tunnels have stairs at every station too.' },
      { goto: 'start2' },
    ],
    shop: [{ act: 'shop' }],
    start2: [{ opts: [['What are the rules out there?', 'rules'], ['Any supplies for sale?', 'shop'], ['How do I get out quickly?', 'escape'], ['Bye.', 'end']] }],
  });
  for (const [k, o] of Object.entries(outposts)) {
    const { x, z } = o.at;
    const away = k === 'west' ? [-1, 0] : [0, -1]; // direction away from the Wilderness
    api.spawnObject({ type: 'bank_booth', x: x + away[0] * 4 + (k === 'north' ? 0 : 0), z: z + away[1] * 4 + (k === 'west' ? 0 : 0) });
    api.spawnObject({ type: 'bank_booth', x: x + away[0] * 4 + (k === 'north' ? 1 : 0), z: z + away[1] * 4 + (k === 'west' ? 1 : 0) });
    api.spawnObject({ type: 'cb_outpost_flag', x: x + 2, z: z + 2, data: { text: `${o.name}: a safe outpost on the edge of the Wilderness. Bank, supplies and a guard who has seen it all.` } });
    api.spawnNpc({ name: 'Grenswachter', at: { x: x - away[0] * 0, z }, wander: 2, look: { g: k === 'west' ? 0 : 1, skin: k === 'west' ? 4 : 1, hair: 2, top: 5, legs: 5, topC: '#5a4a2a' }, eq: { weapon: 'steel_longsword', head: 'iron_helm', shield: 'wooden_shield' }, talk: 'cb_grenswachter', shop: 'cb_outpost', ex: 'Guards the border of the Wilderness. Has a very stern moustache.' });
  }

  // ================= warning signs along the border
  const WARN = 'WARNING! Beyond this point is the Wilderness (a fictional game zone). Other players can attack you and you can lose your items. Fantasy monsters roam the ruins. Teleports fail above level 20. Bank first!';
  for (const o of Object.values(outposts)) api.spawnObject({ type: 'cb_wild_sign', x: o.at.x + 4, z: o.at.z + 4, data: { text: WARN } });
  for (const [lat, lon] of [[52.31560, 4.93490], [52.31450, 4.93490], [52.31420, 4.93495], [52.32990, 4.96700], [52.32990, 4.96820], [52.32990, 4.95000], [52.32990, 4.98500], [52.30000, 4.93495]]) {
    const t = T(lat, lon);
    api.spawnObject({ type: 'cb_wild_sign', x: t.x, z: t.z, data: { text: WARN } });
  }

  // ================= Borderlands (1-10): introductory enemies among the ruins
  S('cb_marsh_imp', 52.31689, 4.93745, 4);
  S('cb_marsh_imp', 52.32857, 4.96902, 3);
  S('cb_ruin_rat', 52.31240, 4.93598, 3);
  S('cb_ruin_rat', 52.32929, 4.96314, 3);
  S('cb_rubble_goblin', 52.31869, 4.93965, 4);
  S('cb_rubble_goblin', 52.32678, 4.97636, 3);
  const ruins = T(52.31824, 4.93891);
  for (const [dx, dz, type, rot] of [[-8, -6, 'cb_ruin_pillar', 0], [-4, -9, 'cb_ruin_pillar', 0], [6, -7, 'cb_ruin_wall', 0], [9, 4, 'cb_ruin_pillar', 0], [-10, 5, 'cb_ruin_wall', Math.PI / 2], [2, 10, 'cb_ruin_pillar', 0]]) api.spawnObject({ type, x: ruins.x + dx, z: ruins.z + dz, rot });

  // ================= Industrial district (11-20): stronger enemies and ambush spots
  S('cb_rust_jackal', 52.31779, 4.94479, 4);
  S('cb_rust_jackal', 52.32363, 4.97342, 3);
  S('cb_scrap_ogre', 52.30970, 4.94773, 2);
  S('cb_scrap_ogre', 52.32228, 4.96461, 2);
  const ambushes = [[52.31330, 4.94552], [52.32048, 4.94846], [52.32273, 4.97049]].map(([lat, lon]) => {
    const at = T(lat, lon);
    for (const [dx, dz] of [[0, 0], [2, 1], [-1, 2]]) api.spawnObject({ type: 'cb_ambush_rubble', x: at.x + dx, z: at.z + dz });
    return { at, lurkers: U.pool(MONSTERS, 'cb_rubble_lurker', 3), ready: 0, idle: 0 };
  });
  api.onPlayerTick(p => {
    if (p.inside || !p.wild || p.wild < 9 || p.wild > 22 || !U.alive(p)) return;
    for (const a of ambushes) {
      if (api.tick < a.ready || api.cheb(p.x, p.z, a.at.x, a.at.z) > 3) continue;
      a.ready = api.tick + 150; a.idle = 0;
      a.lurkers.forEach((n, i) => { const ang = i / 3 * Math.PI * 2; U.summon(n, Math.round(p.x + Math.cos(ang) * 2), Math.round(p.z + Math.sin(ang) * 2), p, false); api.say(n, 'n', i ? 'Grrrah!' : 'AMBUSH!'); });
      U.fx(a.at.x, a.at.z, 'rubble', { r: 3 });
      api.msg(p, 'Rubble lurkers burst out of the debris around you. It\'s an ambush!', 'warn');
    }
  });
  api.onTick(() => {
    for (const a of ambushes) {
      const active = a.lurkers.filter(n => !U.isParked(n));
      if (!active.length) continue;
      if (active.some(n => n.target)) { a.idle = 0; continue; }
      if (++a.idle > 25) { active.forEach(U.park); a.idle = 0; }
    }
  });

  // ================= escape routes: emergency hatches lead back to the nearest outpost
  const hatches = [[52.31509, 4.94405, 'west'], [52.32408, 4.96902, 'north'], [52.30880, 4.95140, 'west']];
  for (const [lat, lon, to] of hatches) { const t = T(lat, lon); api.spawnObject({ type: 'cb_escape_hatch', x: t.x, z: t.z, data: { to } }); }
  api.objectAction('cb_escape_hatch', 'Escape', (p, o) => {
    if (U.stunned(p)) return;
    const dest = outposts[o.data.to].at;
    api.msg(p, 'You pull open the hatch and start climbing through the escape tunnel...');
    api.startAction(p, {
      first: 3, every: 1, anim: 'pick', obj: o,
      step: pl => {
        api.teleport(pl, dest.x + 1, dest.z + 1);
        api.msg(pl, `You crawl out of the tunnel at ${outposts[o.data.to].name}. Safe!`);
        return false;
      },
    });
  });

  // ================= Central danger zone (21-40): strong enemies, high-value drops
  S('cb_concrete_troll', 52.31060, 4.95433, 3);
  S('cb_concrete_troll', 52.31599, 4.97636, 2);
  S('cb_shadow_warg', 52.31689, 4.95727, 3);
  S('cb_mist_witch', 52.30431, 4.96314, 2, 4);
  // deep Wilderness guards around the hidden lair
  S('cb_concrete_troll', 52.30880, 4.97049, 2, 4);
  S('cb_revenant_knight', 52.30700, 4.97150, 1);

  // ================= the Gaasperplas Leviathan (lake beast, overworld boss on the west shore)
  const levAt = T(52.30750, 4.98958);
  const lev = U.spawn(MONSTERS, 'cb_leviathan', levAt);
  lev.def.combat = {
    ...lev.def.combat,
    special: {
      chance: 0.3,
      run(npc, t) {
        const near = [...api.players.values()].filter(p => !p.inside && api.cheb(p.x, p.z, npc.x, npc.z) <= 7 && U.alive(p));
        if (Math.random() < 0.5) {
          api.say(npc, 'n', '*SPLAAASH*');
          U.fx(npc.x, npc.z, 'wave', { r: 7 });
          for (const p of near) U.strike(npc, p, { maxHit: 16, chance: 0.75 });
          return true;
        }
        if (!npc.dive && npc.hp < npc.def.combat.hp * 0.7) {
          api.say(npc, 'n', '*blub blub*');
          U.fx(npc.x, npc.z, 'splash');
          npc.dive = { until: api.tick + 5, x: npc.x, z: npc.z };
          npc.target = null; npc.x = U.PARK.x - 200; npc.z = U.PARK.z;
          for (const p of near) { if (p.target === npc) p.target = null; api.msg(p, 'The Leviathan dives under the water!'); }
          return true;
        }
        return false;
      },
    },
  };
  api.onTick(() => {
    if (lev.dive && lev.dive.until <= api.tick) {
      const d = lev.dive;
      lev.dive = lev.dead ? lev.dive : null;
      if (lev.dead) return;
      lev.x = levAt.x + api.rand(-3, 3); lev.z = levAt.z + api.rand(-3, 3);
      lev.hp = Math.min(lev.def.combat.hp, lev.hp + 20);
      U.fx(lev.x, lev.z, 'splash');
      api.say(lev, 'n', 'RRROOOAAAR!');
      const victim = [...api.players.values()].find(p => !p.inside && api.cheb(p.x, p.z, d.x, d.z) <= 12 && U.alive(p));
      if (victim) { lev.target = victim; U.strike(lev, victim, { dmg: api.rand(8, 20) }); }
    }
  });
  api.onNpcDeath(npc => { if (npc === lev) lev.dive = null; });

  // ================= metro tunnels: three interiors with rising Wilderness levels, revenants and a shortcut
  const st = {
    arena: T(52.3121, 4.9471), // Bijlmer ArenA (Industrial district)
    ganzen: T(52.3116, 4.9689), // Ganzenhoef (Central danger zone)
    gaasper: T(52.3108, 4.9917), // Gaasperplas: the deep tunnel's escape to a lower level
  };
  const seg = (i, wild, name) => {
    const x0 = MX + i * 120;
    const plat = { x0, z0: MZ, x1: x0 + 30, z1: MZ + 16 };
    const tun = { x0: x0 + 30, z0: MZ + 4, x1: x0 + 100, z1: MZ + 12 };
    api.interior({
      id: 'cb_metro' + (i + 1), name, wild,
      rooms: [
        { ...plat, floor: '#5a5a5e', wall: '#3a3c44', h: 4, doors: [['e', 4, 8]] },
        { ...tun, floor: '#2a2622', wall: '#33302c', h: 3.5, doors: [['w', 0, 8]] },
      ],
      floors: [['#c9a227', [x0 + 2, MZ + 3, x0 + 28, MZ + 3, x0 + 28, MZ + 3.6, x0 + 2, MZ + 3.6]], ['#463a30', [x0 + 30, MZ + 7, x0 + 100, MZ + 7, x0 + 100, MZ + 9, x0 + 30, MZ + 9]]],
    });
    return { plat, tun, start: { x: x0 + 6, z: MZ + 9 }, end: { x: x0 + 96, z: MZ + 8 } };
  };
  const m1 = seg(0, 22, 'Metro tunnels (Bijlmer ArenA)');
  const m2 = seg(1, 32, 'Metro tunnels (Ganzenhoef)');
  const m3 = seg(2, 44, 'Metro tunnels (deep)');
  const metro = [[m1, st.arena], [m2, st.ganzen], [m3, st.gaasper]];
  metro.forEach(([m, s], i) => {
    api.spawnObject({ type: 'cb_metro_entrance', x: s.x, z: s.z, data: { to: { x: m.start.x, z: m.start.z, inside: true, msg: 'You descend into the haunted metro tunnels. Ghostly announcements echo in the dark...' } } });
    api.spawnObject({ type: 'cb_metro_exit', x: m.start.x - 3, z: m.start.z, data: { to: { x: s.x + 2, z: s.z + 2, inside: false } } });
    api.spawnObject({ type: 'sign', x: m.start.x + 2, z: MZ + 2, data: { text: `Station ${['Bijlmer ArenA', 'Ganzenhoef', 'Gaasperplas'][i]}. Wilderness level ${[22, 32, 44][i]}. Stairs lead up to the street: the quickest way out.` } });
    if (i < 2) {
      const next = metro[i + 1][0];
      api.spawnObject({ type: 'cb_metro_passage', x: m.end.x, z: m.end.z, rot: -Math.PI / 2, data: { to: { x: next.tun.x0 + 4, z: next.end.z, inside: true, msg: 'You walk deeper into the tunnel. It gets colder...' } } });
      api.spawnObject({ type: 'cb_metro_passage', x: next.tun.x0 + 1, z: next.end.z, rot: Math.PI / 2, data: { to: { x: m.end.x - 3, z: m.end.z, inside: true, msg: 'You walk back towards the lighter part of the tunnel.' } } });
    }
  });
  // revenants
  const R = (key, m, dx, dz) => U.spawn(MONSTERS, key, { x: m.tun.x0 + dx, z: MZ + dz }, { wander: 4 });
  for (const dx of [12, 28, 46, 62]) R('cb_revenant', m1, dx, 8);
  for (const dx of [10, 26, 44]) R('cb_revenant', m2, dx, 7);
  for (const dx of [18, 54]) R('cb_revenant_conductor', m2, dx, 9);
  R('cb_revenant_conductor', m2, 66, 8);
  for (const dx of [14, 36, 58]) R('cb_revenant_knight', m3, dx, 8);
  for (const dx of [24, 48]) R('cb_revenant_conductor', m3, dx, 7);

  // agility shortcut: a collapsed side tunnel from the first section straight to the deep section (Agility 52)
  api.spawnObject({ type: 'cb_tunnel_crawl', x: m1.tun.x0 + 36, z: m1.tun.z0 + 1, data: { to: { x: m3.tun.x0 + 30, z: m3.tun.z0 + 2 }, level: 52, xp: 40 } });
  api.spawnObject({ type: 'cb_tunnel_crawl', x: m3.tun.x0 + 30, z: m3.tun.z0 + 1, data: { to: { x: m1.tun.x0 + 36, z: m1.tun.z0 + 2 }, level: 52, xp: 40 } });

  // ================= the hidden lair: The Concrete Colossus
  const lair = { x0: LX, z0: LZ, x1: LX + 50, z1: LZ + 44 };
  api.interior({
    id: 'cb_lair', name: 'The Hidden Lair', wild: 50,
    rooms: [{ ...lair, floor: '#4a463e', wall: '#2c2a26', h: 8 }],
    floors: [['#5c574c', [LX + 12, LZ + 10, LX + 38, LZ + 10, LX + 38, LZ + 34, LX + 12, LZ + 34]]],
  });
  const lairEnt = T(52.30745, 4.97269);
  api.spawnObject({ type: 'cb_lair_entrance', x: lairEnt.x, z: lairEnt.z, data: { to: { x: LX + 25, z: LZ + 40, inside: true, msg: 'You climb down through the crack. The ground trembles with every breath of something enormous.' } } });
  api.spawnObject({ type: 'ladder_up', x: LX + 25, z: LZ + 42, data: { to: { x: lairEnt.x + 2, z: lairEnt.z + 2, inside: false } } });
  for (const [dx, dz] of [[6, 6], [44, 6], [6, 38], [44, 38], [16, 22], [34, 22]]) api.spawnObject({ type: 'cb_ruin_pillar', x: LX + dx, z: LZ + dz });

  const col = U.spawn(MONSTERS, 'cb_colossus', { x: LX + 25, z: LZ + 20 });
  const golems = U.pool(MONSTERS, 'cb_rubble_golem', 3);
  const inLair = p => p.inside && p.x > lair.x0 && p.x < lair.x1 && p.z > lair.z0 && p.z < lair.z1;
  const lairPlayers = () => [...api.players.values()].filter(p => inLair(p) && U.alive(p));
  const shielded = () => golems.some(g => !U.isParked(g) && !g.dead);
  const debris = [];
  const baseCombat = { ...col.def.combat };
  let lairEmpty = 0;
  const reset = () => { col.phase2 = false; col.enraged = false; col.def.combat.speed = baseCombat.speed; golems.forEach(U.park); };
  col.def.combat = {
    ...baseCombat,
    special: {
      chance: 0.4,
      run(npc, t) {
        const ps = lairPlayers();
        if (!npc.phase2 && npc.hp < npc.def.combat.hp * 0.6) {
          npc.phase2 = true;
          api.say(npc, 'n', 'RISE, MY STONES!');
          golems.forEach((g, i) => U.summon(g, LX + 15 + i * 10, LZ + 30, U.pick(ps) || t, true));
          for (const p of ps) api.msg(p, 'The Colossus tears off chunks of itself. While the rubble golems live, it is shielded!', 'warn');
          return true;
        }
        if (!npc.enraged && npc.hp < npc.def.combat.hp * 0.25) {
          npc.enraged = true; npc.def.combat.speed = 4;
          api.say(npc, 'n', 'ENOUGH! I WILL BURY YOU!');
          return true;
        }
        const r = Math.random();
        if (r < 0.4) { // falling debris on every player: move or be crushed
          api.say(npc, 'n', '*the ceiling cracks*');
          for (const p of ps.slice(0, 6)) {
            const o = api.spawnObject({ type: 'cb_debris', x: p.x, z: p.z });
            debris.push({ o, at: api.tick + 3 });
            api.msg(p, 'Debris starts to fall from the ceiling above you!', 'warn');
          }
          return true;
        }
        if (r < 0.75) { // ground slam around the Colossus
          api.say(npc, 'n', 'CRUMBLE!');
          U.fx(npc.x, npc.z, 'slam', { r: 2 });
          for (const p of ps) if (api.cheb(p.x, p.z, npc.x, npc.z) <= 2) U.strike(npc, p, { maxHit: 28, chance: 0.9 });
          return true;
        }
        // hurl a slab at the furthest player
        const far = ps.sort((a, b) => api.cheb(b.x, b.z, npc.x, npc.z) - api.cheb(a.x, a.z, npc.x, npc.z))[0];
        if (far && api.cheb(far.x, far.z, npc.x, npc.z) > 2) {
          api.say(npc, 'n', '*hurls a slab of concrete*');
          U.fx(far.x, far.z, 'rock', { fromX: npc.x, fromZ: npc.z });
          U.strike(npc, far, { maxHit: 24, chance: 0.8 });
          return true;
        }
        return false;
      },
    },
  };
  api.onHit(ctx => {
    if (ctx.defender !== col || !shielded()) return;
    ctx.dmg = 0;
    if (api.players.has(ctx.attacker?.id) && !(ctx.attacker.cbShieldMsg > api.tick)) { ctx.attacker.cbShieldMsg = api.tick + 10; api.msg(ctx.attacker, 'The Colossus is shielded by its rubble golems. Destroy them first!'); }
  });
  api.onTick(() => {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (api.tick < d.at) continue;
      U.fx(d.o.x, d.o.z, 'debris');
      for (const p of lairPlayers()) if (api.cheb(p.x, p.z, d.o.x, d.o.z) <= 1) U.hurt(p, api.rand(22, 38), 'You are crushed by falling concrete!');
      api.removeObject(d.o);
      debris.splice(i, 1);
    }
    if (lairPlayers().length) lairEmpty = 0;
    else if (++lairEmpty === 40 && !col.dead) { col.hp = col.def.combat.hp; reset(); }
    if (col.dead && (col.phase2 || col.enraged)) reset();
  });
  api.onNpcDeath((npc, killer) => {
    if (npc !== col || !killer) return;
    reset();
    const s = api.playerStore(killer, 'combat');
    s.kc = s.kc || {};
    s.kc.colossus = (s.kc.colossus || 0) + 1;
    api.msg(killer, `Your Concrete Colossus kill count is: ${s.kc.colossus}.`);
    for (const p of api.players.values()) if (p !== killer) api.msg(p, `${killer.name} has defeated The Concrete Colossus in the depths of the Wilderness!`, 'level');
  });

  return { outposts, metro: { m1, m2, m3, stations: st }, lair, col, lev, ambushes, lairEnt };
}
