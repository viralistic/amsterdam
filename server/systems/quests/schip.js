// Quest 8: De Amsterdam. The VOC replica at the Scheepvaartmuseum wants to finish the maiden voyage it never
// completed in 1749. Patch leaks, feed the crew, hoist the sail, then sail onto the IJ to drag up lost cargo.
const ID = 'de_amsterdam';
const X = 30800, Z = 30000;
const FISH = ['herring', 'shrimps', 'anchovies', 'trout', 'salmon', 'pike', 'eel', 'lobster', 'swordfish', 'shark'];

export default function schip(api, lib) {
  const { tile, getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const d = p => lib.qdata(p, ID);
  const leaks = p => (d(p).leaks ??= {});
  const nLeaks = p => Object.keys(leaks(p)).length;
  const chests = p => lib.exists('voc_kist') ? api.invCount(p, 'voc_kist') : 0;
  const shipReady = p => nLeaks(p) >= 3 && d(p).fed && d(p).sail;

  api.quest({
    id: ID, name: 'De Amsterdam', points: 2,
    start: 'I can start this quest by talking to Schipper Sjoerd on the quay next to the Scheepvaartmuseum. I will need a hammer and five cooked fish (herring will do).',
    journal: lib.journal(['The replica of the East India ship Amsterdam wants to finish the maiden voyage the original never completed: it ran aground near Hastings in 1749.'], [
      { at: 1, todo: p => [
        'Schipper Sjoerd needs the ship made ready to sail:',
        `${nLeaks(p) >= 3 ? '[done] ' : ''}Patch the leaks on the gun deck with planks from the timber crate and a hammer (${Math.min(3, nLeaks(p))}/3)`,
        `${d(p).fed ? '[done] ' : ''}Bring five cooked fish to Scheepskok Mies on the gun deck`,
        `${d(p).sail ? '[done] ' : ''}Hoist the sail on the mainmast (upper deck)`,
        shipReady(p) ? 'The ship is ready! I should tell Sjoerd on the upper deck.' : '',
      ].filter(Boolean), done: 'I made the Amsterdam ready to sail.' },
      { at: 2, todo: p => ['We are out on the IJ. I should use the drag nets over the side to haul up three VOC chests.', `Chests: ${Math.min(3, chests(p))} of 3.`, d(p).eel ? 'I defeated the IJ monster.' : chests(p) >= 2 ? 'Something huge has the last chest. I may have to fight it.' : ''].filter(Boolean), done: 'I hauled three VOC chests out of the IJ.' },
      { at: 3, todo: ['I should give the chests to Schipper Sjoerd.'] },
    ]),
  });

  // ---------------------------------------------------------------- interiors
  const R = (x0, z0, x1, z1, floor, wall, h) => ({ x0: X + x0, z0: Z + z0, x1: X + x1, z1: Z + z1, floor, wall, h });
  const at = (x, z) => ({ x: X + x, z: Z + z });
  const PLANK = '#a8845a';
  const hull = (x0, x1, col) => [col, [X + x0 + 2, Z - 3, X + x1 - 1, Z - 3, X + x1 + 2, Z + 3, X + x1 + 2, Z + 40, X + x1, Z + 44, X + x0 + 1, Z + 44, X + x0 - 1, Z + 40, X + x0 - 1, Z + 3]];
  lib.buildInterior({
    id: 'schip_amsterdam', name: 'De Amsterdam (VOC ship)',
    rooms: [R(0, 0, 9, 41, PLANK, '#5a3a1e', 1.1), R(14, 0, 23, 41, '#8a6a4a', '#4a3018', 2.4), R(28, 4, 37, 37, '#4a3a2a', '#3a2814', 2.4)],
    gaps: [[X + 10, Z + 20]],
    under: [['#2a5a7a', [X - 6, Z - 8, X + 16, Z - 8, X + 16, Z + 50, X - 6, Z + 50]], hull(0, 9, '#3a2410')],
    deco: [['#c8a060', [X + 3, Z + 0, X + 7, Z + 0, X + 7, Z + 41, X + 3, Z + 41]]],
  });
  lib.buildInterior({
    id: 'schip_ij', name: 'De Amsterdam, on the IJ',
    rooms: [R(50, 0, 59, 41, PLANK, '#5a3a1e', 1.1)],
    under: [['#2a5a8a', [X + 36, Z - 14, X + 74, Z - 14, X + 74, Z + 56, X + 36, Z + 56]], ['#3a6a9a', [X + 40, Z - 10, X + 46, Z - 9, X + 44, Z + 2]], ['#3a6a9a', [X + 66, Z + 20, X + 72, Z + 22, X + 68, Z + 30]], hull(50, 59, '#3a2410')],
    deco: [['#c8a060', [X + 53, Z + 0, X + 57, Z + 0, X + 57, Z + 41, X + 53, Z + 41]]],
  });
  const quay = tile(52.37265, 4.91530);
  api.spawnObject({ type: 'q_gangplank', ...quay, data: { ship: true } });
  lib.on('q_gangplank', 'Board', p => {
    if (st(p) < 1) return msg(p, 'A crew member waves you off. "Talk to Schipper Sjoerd first!"');
    api.teleport(p, X + 8, Z + 20, { inside: true });
    msg(p, 'You walk up the gangplank onto the deck of the Amsterdam.');
  });
  lib.exit({ ...at(10, 20), to: tile(52.37258, 4.91530), msg: 'You walk down the gangplank onto the quay.' });
  lib.stairs('stairs_down', { ...at(7, 25), to: at(16, 26), msg: 'You climb down to the gun deck.' });
  lib.stairs('stairs_up', { ...at(15, 24), to: at(6, 26), msg: 'You climb up to the upper deck.' });
  lib.stairs('ladder_down', { ...at(22, 31), to: at(30, 31), msg: 'You climb down into the hold. It smells of tar and old pepper.' });
  lib.stairs('ladder_up', { ...at(29, 30), to: at(21, 32), msg: 'You climb back up to the gun deck.' });
  // upper deck
  api.spawnObject({ type: 'q_mast', ...at(5, 18), data: { main: true } });
  api.spawnObject({ type: 'q_mast', ...at(5, 7) }); api.spawnObject({ type: 'q_mast', ...at(5, 31) });
  api.spawnObject({ type: 'q_ship_wheel', ...at(5, 38) });
  for (const z of [10, 14, 24, 28]) { api.spawnObject({ type: 'q_cannon', ...at(0, z), rot: -Math.PI / 2 }); api.spawnObject({ type: 'q_cannon', ...at(9, z), rot: Math.PI / 2 }); }
  api.spawnObject({ type: 'q_barrels', ...at(2, 3) }); api.spawnObject({ type: 'q_barrels', ...at(8, 36) });
  // gun deck
  api.spawnObject({ type: 'q_plank_crate', ...at(19, 2) });
  const LEAKS = [[14, 9], [23, 20], [14, 34]];
  LEAKS.forEach(([x, z], i) => api.spawnObject({ type: 'q_leak', ...at(x, z), data: { leak: i } }));
  for (const z of [5, 15, 28, 38]) { api.spawnObject({ type: 'q_cannon', ...at(14, z), rot: -Math.PI / 2 }); api.spawnObject({ type: 'q_cannon', ...at(23, z), rot: Math.PI / 2 }); }
  api.spawnObject({ type: 'q_barrels', ...at(20, 12) });
  // hold
  for (const [x, z] of [[29, 6], [31, 6], [35, 8], [36, 14], [29, 20], [34, 26], [36, 34], [30, 36]]) api.spawnObject({ type: (x + z) % 2 ? 'q_barrels' : 'q_crate', ...at(x, z) });
  // at sea
  api.spawnObject({ type: 'q_mast', ...at(55, 18) }); api.spawnObject({ type: 'q_mast', ...at(55, 7) }); api.spawnObject({ type: 'q_mast', ...at(55, 31) });
  api.spawnObject({ type: 'q_ship_wheel', ...at(55, 38), data: { sea: true } });
  for (const [x, z, r] of [[50, 12, -Math.PI / 2], [59, 16, Math.PI / 2], [50, 26, -Math.PI / 2], [59, 30, Math.PI / 2]]) api.spawnObject({ type: 'q_dragnet', ...at(x, z), rot: r });

  // ---------------------------------------------------------------- NPCs
  const sjoerd = {
    start: [{ act: p => ['s0', 's1', 's2', 's3'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Ahoy! Schipper Sjoerd. Behind me lies the Amsterdam: a replica of a ship of the Dutch East India Company, the VOC.' },
      { npc: 'The real Amsterdam left on her maiden voyage to the East in 1749 and ran aground on the beach at Hastings within a month. She is still stuck in the sand there.' },
      { npc: "And ever since, on stormy nights, chests marked VOC float up in the IJ. The ship knows it. Listen... she creaks. She wants to sail." },
      { opts: [["Let's sail her!", 'yes'], ['A ship that wants things? Spooky.', 'spooky'], ['No thanks, I get seasick.', 'end']] },
    ],
    spooky: [{ npc: "Every sailor knows ships have moods. This one's mood is: 'let me out of this museum'. Will you help?" }, { opts: [['Aye aye!', 'yes'], ['No.', 'end']] }],
    yes: [
      { npc: "Good. My crew went home after the ship started groaning at night. So you'll do the work of thirty men. Easy." },
      { npc: 'Three things. The gun deck leaks: take planks from the timber crate and nail them over the holes. You need a hammer.' },
      { npc: 'The cook, Mies, needs five cooked fish for the crew. That is me and you. We eat a lot.' },
      { npc: 'And hoist the mainsail on the upper deck. Then come and tell me. Go on board over the gangplank.' },
      { act: p => { setQ(p, ID, 1); return null; } },
    ],
    s1: [{ if: shipReady, then: 'sail', else: 's1wait' }],
    s1wait: [{ npc: p => `Leaks patched: ${Math.min(3, nLeaks(p))} of 3. Crew fed: ${d(p).fed ? 'aye' : 'not yet'}. Mainsail: ${d(p).sail ? 'up' : 'still furled'}. Get to work, matroos!` }],
    sail: [
      { npc: 'Leaks patched, bellies full, sail up! Cast off! To the IJ!' },
      { act: p => { setQ(p, ID, 2); api.teleport(p, X + 56, Z + 30, { inside: true }); msg(p, 'The Amsterdam slides away from the quay and out onto the open IJ. The old ship creaks happily.', 'level'); return null; } },
      { npc: 'Use the drag nets over the side. Three chests, then we head home. And watch the water. Something big lives in the IJ.' },
    ],
    s2: [{ if: p => chests(p) >= 3, then: 'home', else: 's2wait' }],
    s2wait: [{ npc: p => `${chests(p)} of 3 chests. Keep dragging! ${chests(p) >= 2 && !d(p).eel ? 'And deal with that monster, it has wrapped itself around our last chest!' : ''}` }],
    home: [
      { npc: 'Three VOC chests! Full sails, back to port!' },
      { act: p => { setQ(p, ID, 3); api.teleport(p, X + 6, Z + 22, { inside: true }); return null; } },
      { npc: 'Home again. Well, more or less where we started. Let us see what is inside... nutmeg, pepper, a letter from 1749 and... a coat!' },
      { goto: 's3' },
    ],
    s3: [
      { if: p => chests(p) >= 3, then: 'finish', else: 's3lost' },
    ],
    s3lost: [{ npc: 'Where are the chests? Did you leave them on the IJ? Go back out with me and drag them up again.' }, { act: p => { setQ(p, ID, 2); api.teleport(p, X + 56, Z + 30, { inside: true }); return null; } }],
    finish: [
      { npc: "The museum gets the spices and the letter. But the captain's coat is yours. You've earned it, kapitein." },
      { act: p => { api.invRemove(p, 'voc_kist', chests(p)); while (lib.has(p, 'scheepsplank')) lib.take(p, 'scheepsplank'); api.completeQuest(p, ID, { xp: { fishing: 3500, agility: 800, strength: 600 }, items: [['voc_jas', 1]], coins: 1500 }); return 'end'; } },
    ],
    sdone: [{ npc: 'The Amsterdam sleeps peacefully at her quay now. Maiden voyage completed, two hundred and seventy-seven years late. Not bad for a Dutch train... I mean ship.' }],
  };
  const look = { look: lib.L(0, 0, 4, 6, 5, { topC: '#1c2a4a' }), eq: { head: 'flat_cap', feet: 'leather_boots' }, ex: 'A skipper with a beard you could lose a herring in.' };
  lib.npc({ name: 'Schipper Sjoerd', dlg: 'sjoerd', at: tile(52.37255, 4.91500), wander: 1, chatter: ['Ahoy!', 'She creaks, you know.'], ...look }, sjoerd);
  api.spawnNpc({ name: 'Schipper Sjoerd', talk: 'q_sjoerd', at: at(5, 36), wander: 1, ...look });
  api.spawnNpc({ name: 'Schipper Sjoerd', talk: 'q_sjoerd', at: at(55, 36), wander: 1, ...look });
  lib.npc({ name: 'Scheepskok Mies', dlg: 'mies', at: at(19, 12), wander: 2, look: lib.L(1, 0, 6, 0, 5, { topC: '#f4f4f4' }), ex: 'The ship\'s cook. She has a ladle and she is not afraid to use it.' }, {
    start: [{ if: p => st(p) === 1 && !d(p).fed, then: 'ask', else: 'chat' }],
    ask: [{ npc: 'Five cooked fish for the crew, you heard the skipper. Herring, shrimps, trout, I am not fussy. Got them?' }, { if: p => FISH.reduce((n, id) => n + (lib.exists(id) ? api.invCount(p, id) : 0), 0) >= 5, then: 'give', else: 'nofish' }],
    nofish: [{ npc: 'That is not five fish. Haring Henk at Centraal sells herring, or catch some yourself.' }],
    give: [
      { act: p => { let need = 5; for (const id of FISH) { while (need > 0 && lib.has(p, id)) { api.invRemove(p, id, 1); need--; } } d(p).fed = 1; api.touch(); api.addXp(p, 'cooking', 250); return null; } },
      { npc: 'Lovely. Fish stew tonight! Well, fish stew every night. It is a ship.' },
    ],
    chat: [{ npc: 'In the old days the crew ate ship\'s biscuit, salted meat and beans. For months. Be grateful for your stroopwafels.' }],
  });
  const eel = api.spawnNpc({
    name: 'Het IJmonster', type: 'ij_eel', at: at(52, 22), home: at(52, 22), wander: 2, model: 'q_giant_eel', ex: 'A giant eel, as long as a tram. It has wrapped itself around the ship\'s rail.',
    combat: { lvl: 34, hp: 45, att: 28, str: 26, def: 22, maxHit: 5, aggressive: false, leash: 6 }, respawn: 40,
    drops: { always: [], table: [[3, 'raw_eel', 1, 3], [2, 'coins', 20, 120], [2, null]] },
  });
  api.onNpcDeath(npc => {
    if (npc !== eel) return;
    for (const p of lib.playersNear(npc.x, npc.z, 15)) if (st(p) === 2 && !d(p).eel) { d(p).eel = 1; api.touch(); msg(p, 'The IJ monster lets go of the ship and sinks into the dark water. The last chest is free!', 'level'); }
  });

  // ---------------------------------------------------------------- objects
  lib.on('q_plank_crate', 'Take-plank', p => {
    if (!api.canAdd(p, 'scheepsplank')) return msg(p, 'You need a free inventory slot.');
    if (api.invCount(p, 'scheepsplank') >= 3) return msg(p, 'You already carry plenty of planks.');
    lib.give(p, 'scheepsplank');
    msg(p, 'You take an oak plank from the crate.');
  });
  lib.on('q_leak', 'Repair', (p, obj) => {
    const i = obj.data.leak;
    if (st(p) !== 1) return msg(p, st(p) > 1 ? 'Your patch is holding nicely.' : 'Water sprays in. Somebody should fix that.');
    if (leaks(p)[i]) return msg(p, 'You already patched this leak.');
    if (!lib.has(p, 'scheepsplank')) return msg(p, 'You need a plank. There is a timber crate on this deck.');
    if (!lib.hasOrMissing(p, 'hammer')) return msg(p, 'You need a hammer to nail the plank in place.');
    api.startAction(p, { first: 2, every: 3, anim: 'smith', obj, name: 'patch', step: pl => {
      if (!lib.take(pl, 'scheepsplank')) return false;
      leaks(pl)[i] = 1; api.touch(); api.addXp(pl, 'crafting', 60);
      msg(pl, `You nail the plank over the leak. (${Math.min(3, nLeaks(pl))}/3 leaks patched)`);
      return false;
    } });
  });
  lib.on('q_mast', 'Hoist sail', (p, obj) => {
    if (st(p) !== 1) return msg(p, 'The sails are fine as they are.');
    if (!obj.data.main) return msg(p, 'Sjoerd wanted the mainsail hoisted: the big mast in the middle of the ship.');
    if (d(p).sail) return msg(p, 'The mainsail is already up.');
    let n = 0;
    msg(p, 'You grab the halyard and heave...');
    api.startAction(p, { first: 2, every: 3, anim: 'craft', obj, name: 'hoist', step: pl => {
      n++; api.addXp(pl, 'strength', 20);
      if (n < 4) { msg(pl, ['Heave!', 'Ho!', 'Heave!'][n - 1]); return true; }
      d(pl).sail = 1; api.touch(); api.addXp(pl, 'agility', 150);
      msg(pl, 'The great mainsail unfurls and fills with wind!', 'level');
      return false;
    } });
  });
  lib.on('q_ship_wheel', 'Steer', p => msg(p, 'You hold the wheel and make engine noises. Sjoerd pretends not to see.'));
  lib.on('q_dragnet', 'Drag', (p, obj) => {
    if (st(p) !== 2) return msg(p, 'You pull up the net. Just weed and a shopping trolley.');
    if (chests(p) >= 3) return msg(p, 'You have three chests. Talk to Sjoerd to sail home.');
    if (chests(p) >= 2 && !d(p).eel) return msg(p, 'Something huge tugs back at the net! The IJ monster has the last chest wrapped in its coils.', 'warn');
    msg(p, 'You lower the drag net into the IJ...');
    api.startAction(p, { first: 3, every: 4, anim: 'fish', obj, name: 'drag', step: pl => {
      if (chests(pl) >= 3 || (chests(pl) >= 2 && !d(pl).eel)) return false;
      api.addXp(pl, 'fishing', 40);
      const r = Math.random();
      if (r < 0.35) {
        if (!api.canAdd(pl, 'voc_kist')) { msg(pl, 'Your inventory is full.'); return false; }
        lib.give(pl, 'voc_kist');
        msg(pl, `You haul up a dripping VOC chest! (${chests(pl)}/3)`, 'level');
        if (chests(pl) === 2 && !d(pl).eel) { api.say(eel, 'n', '*SPLASH*'); msg(pl, 'The water boils. A giant eel rises next to the ship and coils around the last chest!', 'warn'); }
        return false;
      }
      msg(pl, ['Seaweed.', 'An old bike. Of course.', 'A boot.', 'Nothing yet...'][api.rand(0, 3)]);
      return true;
    } });
  });
}
