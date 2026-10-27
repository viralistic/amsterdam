// Overworld monsters: Vondelpark, the Riekermolen farm and Amstelpark, the Amsterdamse Bos, canal-ring sewer rats,
// pickpockets and city guards. Includes sheep shearing and the farmer's shop.
import { MONSTERS } from './monsters.js';

export function registerWorld(api, U) {
  const T = api.tile;
  const S = (key, lat, lon, n = 1, r = 4, extra) => U.scatter(MONSTERS, key, T(lat, lon), n, r, extra);

  // ---- Vondelpark
  S('cb_goose', 52.3592, 4.8722, 4, 5);
  S('cb_goose', 52.3566, 4.8625, 3, 4);
  S('cb_pigeon', 52.3609, 4.8778, 4, 4);
  S('cb_pigeon', 52.3580, 4.8686, 3, 5);
  S('cb_park_rat', 52.3575, 4.8700, 3, 4);
  S('cb_park_rat', 52.3560, 4.8600, 2, 3);
  S('cb_squirrel', 52.3570, 4.8650, 1);

  // ---- the farm by the Riekermolen and the Amstelpark petting farm
  S('cb_cow', 52.3264, 4.8902, 5, 7);
  S('cb_chicken', 52.3271, 4.8916, 5, 4);
  S('cb_sheep', 52.3262, 4.8914, 4, 5);
  S('cb_chicken', 52.3316, 4.8917, 3, 3);
  S('cb_sheep', 52.3312, 4.8930, 2, 3);
  const farm = T(52.3267, 4.8910);
  for (const [dx, dz] of [[-3, 2], [-4, 2], [6, -3]]) api.spawnObject({ type: 'cb_hay', x: farm.x + dx, z: farm.z + dz });
  const cows = T(52.3264, 4.8902);
  api.spawnObject({ type: 'cb_trough', x: cows.x + 2, z: cows.z - 6 });
  api.spawnNpc({ name: 'Boer Bart', at: farm, wander: 2, look: { g: 0, skin: 0, hair: 3, top: 2, legs: 1, topC: '#7a5a2a' }, eq: { head: 'flat_cap', feet: 'clogs' }, talk: 'cb_farmer', shop: 'cb_farm', ex: 'A farmer from the Riekerpolder. Smells of hay and coffee.' });
  api.shop('cb_farm', { name: "Boer Bart's Boerderijwinkel", stock: ['shears', 'bucket', 'gouda'], limits: { shears: 10 } });
  api.dialog('cb_farmer', {
    start: [
      { npc: "Goeiedag! Welcome to the farm by the Riekermolen. Rembrandt painted that windmill, you know. Didn't pay for the view either." },
      { opts: [['Can I buy something?', 'shop'], ['How do I get wool?', 'wool'], ['Can I kill your cows?', 'cows'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
    wool: [{ player: 'How do I get wool?' }, { npc: 'Buy a pair of shears from me and use them on a sheep. Gently! They are Texelaars, very proud animals.' }],
    cows: [{ player: 'Can I kill your cows?' }, { npc: "Everyone asks that. Go on then, they're for adventurers anyway. Cowhide for leather, beef for the pan. Leave the windmill alone." }],
  });

  // sheep shearing: the sheep turns into a shorn sheep for a while
  const shear = (p, npc) => {
    if (!api.hasItem(p, 'shears')) return api.msg(p, 'You need a pair of shears to shear this sheep.');
    if (npc.shornUntil > api.tick) return api.msg(p, 'This sheep has already been shorn. Give it some time.');
    if (!api.ITEMS.wool) return api.msg(p, 'The wool falls apart in your hands. (Wool is not available yet.)');
    if (!api.canAdd(p, 'wool', 1)) return api.msg(p, "You don't have enough inventory space.");
    p.anim = 'craft'; p.animUntil = api.tick + 2;
    if (U.chance(0.15)) { api.say(npc, 'n', 'Bèèèh!'); return api.msg(p, 'The sheep manages to get away from you!'); }
    api.invAdd(p, 'wool', 1);
    api.msg(p, 'You get some wool.');
    api.say(npc, 'n', 'Baa!');
    npc.shornUntil = api.tick + 60;
    npc.def = { ...npc.def, model: 'cb_sheep_shorn' };
  };
  api.npcAction('cb_sheep', 'Shear', shear);
  api.onUse((p, u) => {
    if (u.kind !== 'npc' || u.item.id !== 'shears' || u.npc.def.type !== 'cb_sheep') return false;
    shear(p, u.npc); return true;
  });
  api.onTick(tick => {
    if (tick % 10) return;
    for (const n of api.npcs) if (n.shornUntil && n.shornUntil <= tick) { n.shornUntil = 0; n.def = { ...n.def, model: 'cb_sheep' }; }
  });

  // ---- Amsterdamse Bos
  S('cb_boar', 52.3170, 4.8350, 4, 6);
  S('cb_boar', 52.3100, 4.8450, 3, 5);
  S('cb_fox', 52.3250, 4.8300, 3, 6);
  S('cb_fox', 52.3330, 4.8500, 2, 5);
  S('cb_bosrover', 52.3050, 4.8250, 4, 5);
  S('cb_bosrover_boss', 52.3046, 4.8245, 1);
  const camp = T(52.3050, 4.8250);
  api.spawnObject({ type: 'sign', x: camp.x + 9, z: camp.z - 6, data: { text: 'BOSROVERS KAMP. Joggers keep out. This means you, Hardloper.' } });

  // ---- canal ring sewer rats (they climb out of the drains along the canals)
  for (const [lat, lon] of [[52.3700, 4.8835], [52.3665, 4.8880], [52.3640, 4.8930], [52.3705, 4.8895], [52.3745, 4.8875]]) S('cb_sewer_rat', lat, lon, 2, 3);

  // ---- city: fantasy pickpockets on the Damrak and guards around the Museumplein
  S('cb_zakkenroller', 52.3762, 4.8968, 2, 6);
  S('cb_stadswacht', 52.3582, 4.8815, 2, 6);
}
