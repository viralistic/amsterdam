// Thieving: Albert Cuypmarkt stalls watched by market guards, pickpocketing (tourists, market traders, guards,
// Zuidas businessmen) with a stun on failure, and coin pouches that open into coins.
import { MONSTERS } from './monsters.js';

export function registerThieving(api, U) {
  const T = api.tile;

  // ================= stalls
  const STALLS = {
    cb_stall_stroopwafel: { level: 5, xp: 16, respawn: 5, loot: () => U.chance(0.2) ? 'poffertjes' : 'stroopwafel' },
    cb_stall_cheese: { level: 15, xp: 28, respawn: 8, loot: () => 'gouda' },
    cb_stall_fabric: { level: 20, xp: 24, respawn: 10, loot: () => 'market_silk' },
    cb_stall_fish: { level: 42, xp: 42, respawn: 16, loot: () => U.pick(['herring', 'herring', 'raw_trout', 'raw_salmon', 'raw_shrimps', 'raw_lobster'].filter(id => api.ITEMS[id])) },
    cb_stall_gem: { level: 75, xp: 160, respawn: 30, loot: () => { const r = Math.random(); return [r < 0.6 ? 'uncut_sapphire' : r < 0.85 ? 'uncut_emerald' : r < 0.97 ? 'uncut_ruby' : 'uncut_diamond', 'coins'].find(id => api.ITEMS[id]); } },
  };
  const market = [52.35572, 52.35562]; // north and south side of the street
  const stalls = [['cb_stall_stroopwafel', 4.8906, 0], ['cb_stall_cheese', 4.8918, 1], ['cb_stall_fabric', 4.8930, 0], ['cb_stall_stroopwafel', 4.8942, 1], ['cb_stall_fish', 4.8954, 0], ['cb_stall_gem', 4.8966, 1], ['cb_stall_cheese', 4.8978, 0]]
    .map(([type, lon, side]) => { const t = T(market[side], lon); return api.spawnObject({ type, x: t.x, z: t.z, rot: side ? 0 : Math.PI }); });
  const guards = [4.8912, 4.8948, 4.8972].map(lon => U.spawn(MONSTERS, 'cb_guard', T(52.35567, lon), { wander: 5 }));
  api.spawnObject({ type: 'sign', x: stalls[0].x - 3, z: stalls[0].z + 2, data: { text: 'ALBERT CUYPMARKT. Marktwachten op patrouille. Shoplifters will be chased, hit, and then chased some more.' } });

  for (const type of Object.keys(STALLS)) api.objectAction(type, 'Steal-from', (p, o) => {
    const s = STALLS[type];
    if (U.stunned(p)) return;
    if (api.lv(p, 'thieving') < s.level) return api.msg(p, `You need a Thieving level of ${s.level} to steal from this stall.`);
    if (p.target && !p.target.rec && p.lastCombat > api.tick - 8) return api.msg(p, "You can't steal while you're being chased!");
    const item = s.loot();
    if (!api.canAdd(p, item, 1)) return api.msg(p, "You don't have enough inventory space.");
    // a guard within sight may notice
    const watching = guards.filter(g => !g.dead && !g.target && api.cheb(g.x, g.z, p.x, p.z) <= 6);
    const notice = Math.max(0.08, 0.35 - (api.lv(p, 'thieving') - s.level) * 0.008);
    if (watching.length && Math.random() < notice) {
      const g = U.pick(watching);
      api.say(g, 'n', U.pick(['Hé! Blijf daar af, dief!', 'Stop, thief!', 'Ik zag dat!']));
      g.target = p;
      return api.msg(p, 'A market guard has spotted you stealing!', 'warn');
    }
    p.anim = 'pick'; p.animUntil = api.tick + 2;
    api.invAdd(p, item, 1);
    api.addXp(p, 'thieving', s.xp);
    api.msg(p, `You steal ${/^[aeiou]/i.test(api.ITEMS[item].name) ? 'an' : 'a'} ${api.ITEMS[item].name.toLowerCase()} from the stall.`);
    api.deplete(o, s.respawn);
  });

  // ================= pickpocketing
  const PICK = {
    Toerist: { level: 1, xp: 8, coins: [3, 3], dmg: [1, 1], fail: 'What do you think you are doing? Zis is my holiday money!' },
    Marktkoopman: { level: 25, xp: 36, coins: [15, 25], dmg: [1, 2], fail: 'Hé! Handen thuis!' },
    Marktwacht: { level: 40, xp: 46.8, coins: [25, 35], dmg: [2, 3], fail: 'Thought you could rob a guard? Think again!' },
    Stadswacht: { level: 40, xp: 46.8, coins: [25, 35], dmg: [2, 3], fail: 'Ho ho! Not on my watch.' },
    Zakenman: { level: 55, xp: 84.3, coins: [50, 70], dmg: [2, 5], fail: 'Do you know who I am? I have a meeting at the Zuidas in five minutes!' },
  };
  const tourist = { look: { g: 0, skin: 5, hair: 4, top: 10, legs: 2 }, eq: { head: 'beanie' }, actions: ['Pickpocket'], ex: 'A tourist with a map that is upside down. Their pockets look heavy.', chatter: ['Where is ze Rijksmuseum?', 'Look, a canal! And anuzzer canal!', 'So many bicycles!'] };
  for (const [lat, lon] of [[52.37645, 4.89725], [52.37670, 4.89760], [52.37620, 4.89700], [52.35575, 4.8925], [52.35565, 4.8960]]) api.spawnNpc({ name: 'Toerist', at: T(lat, lon), wander: 6, ...tourist, look: { ...tourist.look, g: Math.round(lat * 1e5) % 2 } });
  for (const [lon, g] of [[4.8924, 0], [4.8936, 1], [4.8960, 0]]) api.spawnNpc({ name: 'Marktkoopman', at: T(52.35567, lon), wander: 3, look: { g, skin: g ? 2 : 3, hair: 5, top: 6, legs: 1 }, eq: { head: 'flat_cap' }, actions: ['Pickpocket'], ex: 'A trader shouting prices. The money belt is right there.', chatter: ['Kijken, kijken, kopen!', 'Drie voor een tientje!', 'Verse stroopwafels!'] });
  for (const [lat, lon] of [[52.33860, 4.87250], [52.33800, 4.87350], [52.33900, 4.87400]]) api.spawnNpc({ name: 'Zakenman', at: T(lat, lon), wander: 6, look: { g: 0, skin: 1, hair: 0, top: 5, legs: 5, topC: '#2a2f3a' }, actions: ['Pickpocket'], ex: 'A Zuidas businessman, on the phone about synergy. His wallet is fatter than his patience.', chatter: ['Let\'s take this offline.', 'Can you circle back on that?', 'Ik zit in een call.'] });

  const pickpocket = (p, npc) => {
    const d = PICK[npc.name];
    if (!d) return;
    if (U.stunned(p)) return api.msg(p, "You're stunned!");
    if (npc.target === p) return api.msg(p, "You can't pickpocket someone who is fighting you!");
    if (api.lv(p, 'thieving') < d.level) return api.msg(p, `You need a Thieving level of ${d.level} to pick the ${npc.name.toLowerCase()}'s pocket.`);
    if (api.invCount(p, 'coin_pouch') >= 28) return api.msg(p, 'You need to empty your coin pouches before you can carry any more.');
    if (!api.canAdd(p, 'coin_pouch', 1)) return api.msg(p, "You don't have enough inventory space.");
    if (p.cbPickAt > api.tick) return;
    p.cbPickAt = api.tick + 2;
    api.msg(p, `You attempt to pick the ${npc.name.toLowerCase()}'s pocket...`);
    p.anim = 'pick'; p.animUntil = api.tick + 2;
    const chance = Math.min(0.95, 0.55 + (api.lv(p, 'thieving') - d.level) * 0.015);
    if (Math.random() < chance) {
      api.invAdd(p, 'coin_pouch', 1);
      const st = api.playerStore(p, 'combat');
      st.pouch = st.pouch || { n: 0, coins: 0 };
      st.pouch.n++; st.pouch.coins += api.rand(...d.coins);
      api.addXp(p, 'thieving', d.xp);
      api.msg(p, `You pick the ${npc.name.toLowerCase()}'s pocket.`);
    } else {
      api.msg(p, `You fail to pick the ${npc.name.toLowerCase()}'s pocket.`);
      api.say(npc, 'n', d.fail);
      U.hurt(p, api.rand(...d.dmg));
      if (U.alive(p)) U.stun(p, 5, "You've been stunned!");
    }
  };
  for (const name of Object.keys(PICK)) api.npcAction(name, 'Pickpocket', pickpocket);

  // ================= coin pouches
  api.itemOp('Open-all', (p, slot, item) => {
    if (item.id !== 'coin_pouch') return;
    const n = api.invCount(p, 'coin_pouch');
    if (!n) return;
    const st = api.playerStore(p, 'combat');
    const pouch = st.pouch || { n: 0, coins: 0 };
    const mine = Math.min(n, pouch.n);
    const coins = (pouch.n ? Math.round(pouch.coins * mine / pouch.n) : 0) + (n - mine) * 8;
    if (!api.canAdd(p, 'coins', coins)) return api.msg(p, "You don't have enough inventory space.");
    api.invRemove(p, 'coin_pouch', n);
    api.invAdd(p, 'coins', Math.max(1, coins));
    st.pouch = { n: 0, coins: 0 };
    api.msg(p, `You open ${n > 1 ? 'all of your coin pouches' : 'the coin pouch'} and find ${Math.max(1, coins)} coins.`);
  });

  return { stalls, guards };
}
