// Production stations, NPCs, shops and interiors placed around Amsterdam.
//  Westergasfabriek (52.3861, 4.8739): furnace + anvils. Albert Cuypmarkt: market stoves, range, butcher. Snack bar near Centraal.
//  NEMO: crafting hub outside + the NEMO Werkplaats interior. Hortus Botanicus: apothecary + fountain.
//  Westerkerk, Oude Kerk, Nieuwe Kerk: church interiors with altars (the Nieuwe Kerk altar gives bonus Prayer xp).
import { LANDMARK_MODELS } from '../../../shared/landmarks.js';
import { RG } from '../../content.js';

// Interiors use x 38000-39999, z 30000-34000 (production allocation).
export const INTERIORS = {
  westerkerk: { x0: 38000, z0: 30000, x1: 38018, z1: 30036 },
  oudekerk: { x0: 38030, z0: 30000, x1: 38050, z1: 30040 },
  nieuwekerk: { x0: 38062, z0: 30000, x1: 38084, z1: 30042 },
  werkplaats: { x0: 38100, z0: 30000, x1: 38126, z1: 30020 },
};

export default function world(api, P) {
  const off = (b, dx, dz) => ({ x: b.x + dx, z: b.z + dz });
  const obj = (type, at, rot = 0, data = {}) => api.spawnObject({ type, x: at.x, z: at.z, rot, data });
  const has = id => !!api.ITEMS[id];
  const stock = ids => ids.filter(has);
  const npc = def => api.spawnNpc({ wander: 1, ...def });
  const L = (g, skin, hair, top, legs, topC) => ({ g, skin, hair, top, legs, ...(topC ? { topC } : {}) });

  // ---------------------------------------------------------------- Westergasfabriek smithy
  const W = api.tile(52.38610, 4.87390); // between the copper/tin mines and the gasworks dungeon door
  P.spots = { smithy: W };
  obj('furnace', W, Math.PI / 2);
  for (const dz of [-2, 0, 2]) obj('anvil', off(W, 5, dz), Math.PI / 2);
  npc({ name: 'Smid Sjaak', at: off(W, -3, 3), look: L(0, 0, 5, 5, 5, '#3a2a1e'), eq: { body: 'iron_platebody' }, talk: 'prod_sjaak', shop: 'prod_smid', chatter: ['*CLANG* *CLANG*', 'The old gasworks make the best furnaces.'] });
  api.shop('prod_smid', { name: 'Westergas Smederij', stock: stock(['hammer', 'bronze_bar', 'iron_bar', 'steel_bar', 'bronze_full_helm', 'bronze_platebody', 'bronze_platelegs', 'bronze_kiteshield', 'iron_platebody', 'iron_platelegs', 'iron_kiteshield', 'coal']) });
  api.dialog('prod_sjaak', {
    start: [
      { npc: "Welkom in de Westergasfabriek! Used to make gas for the whole city. Now we make swords. Much more fun." },
      { opts: [['How do I smith?', 'how'], ["Let's see what you sell.", 'shop'], ['Bye.', 'end']] },
    ],
    how: [
      { player: 'How do I smith?' },
      { npc: 'Smelt ore into bars at the furnace. Copper and tin make bronze. Iron ore is fussy: half of it is too impure to refine. Add coal to iron for steel.' },
      { npc: 'Then take your bars and a hammer to an anvil. Daggers, swords, scimitars, helms, platebodies, the lot. Better metal needs a higher level.' },
      { goto: 'start2' },
    ],
    start2: [{ opts: [["Let's see what you sell.", 'shop'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
  });

  // ---------------------------------------------------------------- Albert Cuypmarkt kitchens
  const A1 = api.tile(52.35572, 4.89150), A2 = api.tile(52.35566, 4.89660), A3 = api.tile(52.35562, 4.89400);
  obj('market_stove', A1); obj('market_stove', A2); obj('cooking_range', A3);
  P.spots.cuyp = A1;
  npc({ name: 'Slager Sem', at: off(A1, 2, 1), look: L(0, 2, 0, 6, 5, '#f2f2f2'), talk: 'prod_sem', shop: 'prod_slager', chatter: ['Verse kip! Rundvlees!', 'Cook it yourself, the stove is free!'] });
  api.shop('prod_slager', { name: "Slagerij Sem (Albert Cuyp)", stock: stock(['raw_beef', 'raw_chicken', 'cooked_meat', 'cooked_chicken', 'tinderbox', 'seaweed']) });
  api.dialog('prod_sem', {
    start: [
      { npc: 'Goedemiddag! Raw meat, cheap. Use it on one of the market stoves and cook it yourself. Burnt is your own fault.' },
      { opts: [["Let's see your meat.", 'shop'], ['How do I stop burning things?', 'burn'], ['Bye.', 'end']] },
    ],
    burn: [{ player: 'How do I stop burning things?' }, { npc: 'Practice! The better your Cooking, the less you burn. A proper range or stove is a bit kinder than a campfire.' }],
    shop: [{ act: 'shop' }],
  });

  // ---------------------------------------------------------------- Snack bar near Centraal
  const S = api.tile(52.37762, 4.89860);
  obj('snack_fryer', S);
  P.spots.snack = S;
  npc({ name: 'Snackbar Sjors', at: off(S, 0, 2), look: L(0, 1, 7, 6, 5, '#d82020'), talk: 'prod_sjors', shop: 'prod_snack', wander: 0, chatter: ['Patatje oorlog!', 'Uit de muur, uit de pan!'] });
  api.shop('prod_snack', { name: "Snackbar 't Stationnetje", stock: stock(['kroket', 'bitterbal', 'cooked_chicken', 'cooked_meat', 'shrimps', 'raw_beef', 'raw_chicken']) });
  api.dialog('prod_sjors', {
    start: [{ npc: "Snackbar 't Stationnetje, open since before the trains were late. Buy something, or use my frituur to fry your own catch." }, { opts: [['Show me the snacks.', 'shop'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
  });

  // ---------------------------------------------------------------- NEMO crafting hub
  const N = api.tile(52.37372, 4.91175);
  P.spots.nemo = N;
  obj('spinning_wheel', N);
  obj('pottery_wheel', off(N, 3, 0));
  obj('pottery_oven', off(N, 6, 0));
  obj('furnace', off(N, 0, 5));
  obj('sink', off(N, 3, 5));
  obj('sandpit', off(N, 6, 5));
  obj('tanning_rack', off(N, -5, 1), Math.PI / 2);
  obj('tanning_rack', off(N, -5, 4), Math.PI / 2);
  npc({ name: 'Leerlooier Lex', at: off(N, -3, 3), look: L(0, 3, 1, 7, 10, '#6a4428'), talk: 'prod_lex', eq: { feet: 'leather_boots' } });
  api.dialog('prod_lex', {
    start: [
      { npc: "Hoi! I'm Lex, the tanner. Cowhide in, leather out. 1 coin for soft leather, 3 for hard. Cheaper than the Negen Straatjes, I promise." },
      { opts: [['Please tan my hides.', 'tan'], ['What do I make with leather?', 'what'], ['Bye.', 'end']] },
    ],
    tan: [{ act: (p, n) => P.tanMenu(p, n) }],
    what: [{ player: 'What do I make with leather?' }, { npc: 'Grab a needle and thread from Ingrid. Use the needle on leather: gloves, boots, cowls, vambraces, bodies and chaps. Hard leather makes a proper body.' }],
  });
  npc({ name: 'Uitvinder Ingrid', at: off(N, 9, 2), look: L(1, 0, 6, 8, 5, '#f2f2f2'), talk: 'prod_ingrid', shop: 'prod_nemo', chatter: ['Science!', 'Who left the soldering iron on?'] });
  api.shop('prod_nemo', { name: 'NEMO Makerspace Supplies', stock: stock(['chisel', 'needle', 'thread', 'knife', 'ring_mould', 'amulet_mould', 'glassblowing_pipe', 'bucket', 'bucket_of_sand', 'soda_ash', 'seaweed', 'hammer', 'tinderbox', 'ball_of_wool']) });
  api.dialog('prod_ingrid', {
    start: [
      { npc: 'Welcome to NEMO, the big green ship of science! Out here we spin, throw pots, blow glass and make jewellery. Inside is the Werkplaats, with the experimental machines.' },
      { opts: [['What can I do here?', 'how'], ['I need tools.', 'shop'], ['Bye.', 'end']] },
    ],
    how: [
      { player: 'What can I do here?' },
      { npc: 'Spin wool or flax on the wheel. Soften clay with a bucket of water, shape it on the wheel, then fire it in the oven.' },
      { npc: 'Fill a bucket at the sandpit on our rooftop beach, add soda ash and melt it in the furnace for glass. A glassblowing pipe turns it into vials and beer glasses.' },
      { npc: 'And a gold bar with a mould in the furnace makes rings and amulets. Cut a gem with a chisel first if you want something sparkly.' },
      { goto: 'start2' },
    ],
    start2: [{ opts: [['I need tools.', 'shop'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
  });

  // NEMO Werkplaats interior
  const WP = INTERIORS.werkplaats;
  api.interior({ id: 'prod_werkplaats', name: 'NEMO Werkplaats', rooms: [{ x0: WP.x0, z0: WP.z0, x1: WP.x1, z1: WP.z1, floor: '#3a6a5a', wall: '#2a8a5a', h: 5 }] });
  const doorOut = off(N, 11, -3);
  obj('door', doorOut, 0, { to: { x: WP.x0 + 13, z: WP.z1 - 2, inside: true } });
  obj('exit', { x: WP.x0 + 13, z: WP.z1 - 1 }, 0, { to: { x: doorOut.x, z: doorOut.z + 1, inside: false } });
  obj('electro_spinner', { x: WP.x0 + 3, z: WP.z0 + 3 });
  obj('plasma_kiln', { x: WP.x0 + 7, z: WP.z0 + 3 });
  obj('pottery_wheel', { x: WP.x0 + 5, z: WP.z0 + 7 });
  obj('wondermachine', { x: WP.x0 + 13, z: WP.z0 + 5 });
  obj('workbench', { x: WP.x0 + 20, z: WP.z0 + 3 });
  obj('workbench', { x: WP.x0 + 20, z: WP.z0 + 9 });
  obj('sink', { x: WP.x0 + 23, z: WP.z0 + 14 });
  npc({ name: 'Professor Proton', at: { x: WP.x0 + 17, z: WP.z0 + 7 }, look: L(0, 0, 4, 6, 5, '#f4f4f4'), talk: 'prod_proton', wander: 3, chatter: ['Eureka! ...no, wait.', 'Mind the plasma.'] });
  api.dialog('prod_proton', {
    start: [
      { npc: "Ah, a visitor! Welcome to the Werkplaats. The electro-spinner and the plasma kiln work faster than the old ones outside. Mostly." },
      { opts: [['What does the Wondermachine do?', 'wonder'], ['Bye.', 'end']] },
    ],
    wonder: [{ player: 'What does the Wondermachine do?' }, { npc: "Put 10 coins in and it makes... something. Wool, clay, glass. Once it made a sapphire! We don't fully understand it. That's what makes it science." }],
  });
  const FACTS = ['A bicycle in Amsterdam is stolen roughly every few minutes.', 'Amsterdam has more bridges than Venice.', 'The canal belt was dug in the 17th century, mostly by hand.', 'Glass is technically a very slow... no, actually it is a solid.', 'Amsterdam is about two metres below sea level in places.'];
  api.objectAction('wondermachine', 'Operate', p => {
    if (!api.invRemove(p, 'coins', 10)) return api.msg(p, 'The machine blinks: INSERT 10 COINS.');
    p.anim = 'craft'; p.animUntil = api.tick + 2;
    const r = Math.random();
    const prize = r < 0.02 && has('uncut_sapphire') ? 'uncut_sapphire' : r < 0.25 ? 'ball_of_wool' : r < 0.45 ? 'soft_clay' : r < 0.6 ? 'molten_glass' : r < 0.75 ? 'bucket_of_sand' : null;
    api.addXp(p, 'crafting', 5);
    if (prize) { api.giveOrDrop(p, prize, 1); api.msg(p, `The Wondermachine whirrs, beeps and spits out ${prize === 'uncut_sapphire' ? 'an uncut sapphire! Wow!' : 'some ' + api.ITEMS[prize].name.toLowerCase() + '.'}`); }
    else api.msg(p, `The Wondermachine prints a science fact: "${FACTS[Math.floor(Math.random() * FACTS.length)]}"`);
  });

  // ---------------------------------------------------------------- Hortus Botanicus apothecary
  const H = api.tile(52.36668, 4.90805);
  P.spots.hortus = H;
  obj('water_fountain', off(H, 3, 2));
  npc({ name: 'Apotheker Anna', at: H, look: L(1, 0, 3, 2, 5, '#e8e8e8'), talk: 'prod_anna', shop: 'prod_apotheek', chatter: ['Kruiden! Fresh herbs and secondaries!', 'Mind the cactus.'] });
  api.shop('prod_apotheek', { name: "Anna's Apotheek (Hortus Botanicus)", stock: stock(['vial', 'vial_of_water', 'pestle_and_mortar', 'eye_of_newt', 'limpwurt_root', 'white_berries', 'snape_grass', 'juniper_berries']) });
  api.dialog('prod_anna', {
    start: [
      { npc: 'Welkom in de Hortus, one of the oldest botanical gardens in the world. In 1706 a single coffee plant from here started half the coffee in Latin America. Now, potions!' },
      { opts: [['How do I make potions?', 'how'], ['What is in a jenever brew?', 'jenever'], ['Show me your ingredients.', 'shop'], ['Bye.', 'end']] },
    ],
    how: [
      { player: 'How do I make potions?' },
      { npc: 'Clean your grimy herbs first. Put a clean herb in a vial of water, you can fill vials at the fountain. Then add the secondary ingredient.' },
      { npc: 'Guam and eye of newt: attack potion. Tarromin and limpwurt: strength. Ranarr with white berries: defence, or with snape grass: prayer.' },
      { npc: 'And my own recipe: marrentill with a tulip makes a tulip tonic, lovely for tired legs.' },
      { goto: 'start2' },
    ],
    jenever: [{ player: 'What is in a jenever brew?' }, { npc: 'Harralander and crushed juniper berries. Grind them with a pestle and mortar. It makes you hit harder, but you will block like a tourist on a bicycle.' }, { goto: 'start2' }],
    start2: [{ opts: [['Show me your ingredients.', 'shop'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
  });

  // ---------------------------------------------------------------- Fletcher by the ranged guild
  npc({ name: 'Pijlenmaker Pim', at: RG(-10, 14), look: L(0, 0, 3, 2, 10), eq: { head: 'leather_cowl' }, talk: 'prod_pim', shop: 'prod_pijlen' });
  api.shop('prod_pijlen', { name: "Pim's Pijlen & Bogen", stock: stock(['knife', 'bow_string', 'feather', 'arrow_shaft', 'headless_arrow', 'bronze_arrowtips', 'iron_arrowtips', 'shortbow_u', 'oak_shortbow_u']) });
  api.dialog('prod_pim', {
    start: [
      { npc: "Bram sells bows, I teach you to make them. Knife on logs for arrow shafts or a bow. String it with a bow string from a spinning wheel." },
      { npc: 'Feathers on shafts make headless arrows, arrowtips from the smithy finish them off. Fifteen at a time, like a professional.' },
      { opts: [['Show me your supplies.', 'shop'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
  });

  // ---------------------------------------------------------------- Churches
  const landmark = id => LANDMARK_MODELS.find(l => l.id === id);
  const front = (l, out) => { const c = Math.cos(l.rot), s = Math.sin(l.rot), lz = l.d / 2 + out; return { x: Math.round(l.x + lz * s), z: Math.round(l.z + lz * c) }; };
  const outsideDir = rot => ({ x: Math.round(Math.sin(rot)), z: Math.round(Math.cos(rot)) });

  function church({ key, name, door, rot, altar, floor, wall, koster }) {
    const R = INTERIORS[key];
    const cx = Math.round((R.x0 + R.x1) / 2);
    api.interior({ id: 'prod_' + key, name, rooms: [{ x0: R.x0, z0: R.z0, x1: R.x1, z1: R.z1, floor, wall, h: 8 }],
      floors: [['#7a2a2a', [cx - 1, R.z0 + 6, cx + 2, R.z0 + 6, cx + 2, R.z1 - 1, cx - 1, R.z1 - 1]]] });
    const dir = outsideDir(rot);
    obj('door', door, rot, { to: { x: cx, z: R.z1 - 3, inside: true } });
    obj('exit', { x: cx, z: R.z1 - 1 }, 0, { to: { x: door.x + dir.x, z: door.z + dir.z, inside: false } });
    obj(altar, { x: cx, z: R.z0 + 3 });
    for (let z = R.z0 + 9; z < R.z1 - 6; z += 3) for (const x of [cx - 5, cx + 5]) obj('church_pew', { x, z }, 0);
    npc({ name: koster.name, at: { x: cx + 3, z: R.z0 + 5 }, look: L(koster.g, 0, koster.hair, 5, 5, '#1a1a1a'), talk: koster.talk, wander: 2 });
    return { cx, R };
  }

  const wk = { x: api.tile(52.37450, 4.88452).x, z: api.tile(52.37450, 4.88452).z };
  church({ key: 'westerkerk', name: 'Westerkerk', door: wk, rot: Math.PI / 2, altar: 'altar', floor: '#8a7a68', wall: '#e4dccc', koster: { name: 'Koster Jan', g: 0, hair: 5, talk: 'prod_jan' } });
  const ok = landmark('oudekerk'), nk = landmark('nieuwekerk');
  church({ key: 'oudekerk', name: 'Oude Kerk', door: front(ok, 1.5), rot: ok.rot, altar: 'altar', floor: '#6a6058', wall: '#c8bca8', koster: { name: 'Koster Kees', g: 0, hair: 0, talk: 'prod_kees' } });
  church({ key: 'nieuwekerk', name: 'Nieuwe Kerk', door: front(nk, 1.5), rot: nk.rot, altar: 'royal_altar', floor: '#8a8078', wall: '#ece4d4', koster: { name: 'Koster Kobus', g: 0, hair: 3, talk: 'prod_kobus' } });
  P.spots.churches = { westerkerk: wk, oudekerk: front(ok, 1.5), nieuwekerk: front(nk, 1.5) };

  const prayerTalk = extra => ({
    start: [
      { npc: extra },
      { opts: [['How do I train Prayer?', 'how'], ['Bye.', 'end']] },
    ],
    how: [
      { player: 'How do I train Prayer?' },
      { npc: 'Bury the bones of the creatures you defeat. Bigger bones please the gods more. Pray at an altar like this one to recharge your Prayer points.' },
      { npc: 'Open your prayer book to call on protection and strength. Offer bones on the royal altar of the Nieuwe Kerk and the gods will be three and a half times as pleased.' },
    ],
  });
  api.dialog('prod_jan', prayerTalk('Welkom in de Westerkerk. Rembrandt is buried here somewhere, nobody is quite sure where. Our tower is the tallest in the city: 85 metres!'));
  api.dialog('prod_kees', prayerTalk("Welkom in de Oude Kerk, Amsterdam's oldest building. We've seen seven centuries of this neighbourhood. Nothing surprises us any more."));
  api.dialog('prod_kobus', prayerTalk('Welkom in de Nieuwe Kerk, where the kings and queens of the Netherlands are inaugurated. Offer your bones on our royal altar.'));
}
