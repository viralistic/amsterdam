// Server logic for the "combat" content pack. See docs/ENGINE.md.
// Monsters across Amsterdam, the Westergasfabriek dungeon, the Wilderness in Zuidoost, the Johan Cruijff ArenA,
// agility courses and thieving. The modules live in server/systems/combat/.
import { makeUtil } from './combat/util.js';
import { registerWorld } from './combat/world.js';
import { registerWestergas } from './combat/westergas.js';
import { registerWilderness } from './combat/wilderness.js';
import { registerArena } from './combat/arena.js';
import { registerAgility } from './combat/agility.js';
import { registerThieving } from './combat/thieving.js';

export default function register(api) {
  const U = makeUtil(api);
  const parts = {
    world: registerWorld(api, U),
    westergas: registerWestergas(api, U),
    wilderness: registerWilderness(api, U),
    arena: registerArena(api, U),
    agility: registerAgility(api, U),
    thieving: registerThieving(api, U),
  };

  // ::kc shows your boss kill counts
  api.command('kc', p => {
    const kc = api.playerStore(p, 'combat').kc || {};
    api.msg(p, `Boss kills: Gashouder Golem ${kc.gashouder || 0}, Concrete Colossus ${kc.colossus || 0}.`);
  });

  // dev helper: ::cbtele <place> jumps to a combat-pack location (offline test mode only)
  if (api.DEV) {
    const W = parts.wilderness;
    const places = {
      vondel: api.tile(52.3585, 4.8700), farm: api.tile(52.3267, 4.8908), bos: api.tile(52.3165, 4.8350), bandits: api.tile(52.3050, 4.8262),
      westergas: { x: api.tile(52.3858, 4.8745).x, z: api.tile(52.3858, 4.8745).z + 2 }, gasboss: { x: 34104, z: 30016 },
      outpost: W.outposts.west.at, borderlands: api.tile(52.31689, 4.93745), industrial: api.tile(52.31779, 4.94479), central: api.tile(52.31060, 4.95433),
      metro: { x: W.metro.stations.arena.x + 2, z: W.metro.stations.arena.z + 2 }, lair: { x: W.lairEnt.x + 2, z: W.lairEnt.z + 2 }, colossus: { x: 35425, z: 30038 },
      leviathan: api.tile(52.30750, 4.98900), ambush: { x: W.ambushes[0].at.x + 7, z: W.ambushes[0].at.z }, hatch: api.tile(52.31509, 4.94420), metro2: { x: W.metro.m2.start.x, z: W.metro.m2.start.z }, metro3: { x: W.metro.m3.start.x, z: W.metro.m3.start.z }, arena: { x: parts.arena.gate.x, z: parts.arena.gate.z + 2 }, pit: { x: 35660, z: 30018 },
      adam: { x: parts.agility.ground.x + 1, z: parts.agility.ground.z + 1 }, gracht: { x: parts.agility.gracht.x - 1, z: parts.agility.gracht.z }, market: api.tile(52.35567, 4.8930), zuidas: api.tile(52.3385, 4.8730),
    };
    // ::cbnpc Name_with_underscores teleports next to the nearest living NPC with that name
    api.command('cbnpc', (p, args) => {
      const name = args.join(' ').replace(/_/g, ' ').toLowerCase();
      const n = api.npcs.filter(n => !n.dead && n.name.toLowerCase() === name && !(n.x > 37000 && n.z > 33000)).sort((a, b) => api.cheb(a.x, a.z, p.x, p.z) - api.cheb(b.x, b.z, p.x, p.z))[0];
      if (!n) return api.msg(p, 'No such NPC.');
      api.teleport(p, n.x + 1, n.z, { inside: !!api.interiorAt(n.x, n.z) });
    });
    // ::cbhp <hp> sets the hit points of the nearest monster (boss testing)
    api.command('cbhp', (p, [hp]) => { const n = api.npcs.filter(n => !n.dead && n.def.combat && api.cheb(n.x, n.z, p.x, p.z) < 30).sort((a, b) => api.cheb(a.x, a.z, p.x, p.z) - api.cheb(b.x, b.z, p.x, p.z))[0]; if (n) { n.hp = Math.max(1, +hp || 1); api.msg(p, `${n.name} now has ${n.hp} hp.`); } });
    api.command('cbtele', (p, [k]) => {
      const t = places[k];
      if (!t) return api.msg(p, 'Places: ' + Object.keys(places).join(', '));
      api.teleport(p, t.x, t.z, { inside: !!api.interiorAt(t.x, t.z) });
    });
  }
}
