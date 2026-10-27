// Quest 5: De Toren van de Westerkerk. Repair the tower clock, play the carillon, find the key in the imperial
// crown and lay a restless painter to rest in the crypt where Rembrandt was buried in 1669.

const ID = 'westertoren';
const X = 30400, Z = 30000;
const MELODY = ['sol', 'mi', 're', 'do'];

export default function westertoren(api, lib) {
  const { getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const d = p => lib.qdata(p, ID);

  api.quest({
    id: ID, name: 'De Toren van de Westerkerk', points: 2,
    start: 'I can start this quest by talking to Beiaardier Joost outside the Westerkerk, by the Prinsengracht door. I will need a hammer.',
    journal: lib.journal(['The carillon of the Westertoren has fallen silent, and a cold draught rises from under the church floor.'], [
      { at: 1, todo: ['Beiaardier Joost asked me to climb the tower (stairs in the north-west corner of the church) and find out why the clock stopped.', 'I might need a hammer. The Albert Heijn sells them.'], done: 'I repaired the tower clock and found a page of sheet music stuck in the gears.' },
      { at: 2, todo: ['I should play the notes circled on the sheet music on the carillon bells, one floor above the clock, in the right order.'], done: 'I played the melody on the carillon. Something rattled loose high up in the tower.' },
      { at: 3, todo: ['I should climb to the very top of the tower and search the imperial crown.'], done: 'I found an old crypt key inside the imperial crown.' },
      { at: 4, todo: ['I should open the trapdoor in the floor of the church and go down into the crypt.', 'Something restless lives down there.'], done: 'In the crypt I helped a restless painter find his grave.' },
      { at: 5, todo: ['I should tell Beiaardier Joost what happened in the crypt.'] },
    ]),
  });

  // ---------------------------------------------------------------- interior
  const R = (x0, z0, x1, z1, floor, wall, h = 4) => ({ x0: X + x0, z0: Z + z0, x1: X + x1, z1: Z + z1, floor, wall, h });
  const at = (x, z) => ({ x: X + x, z: Z + z });
  const slab = (x, z) => ['#a8a090', [X + x, Z + z, X + x + 1, Z + z, X + x + 1, Z + z + 2, X + x, Z + z + 2]];
  // The church nave itself is the production pack's Westerkerk interior (x 38000-38018, z 30000-30036, door on the
  // Prinsengracht side). This quest adds the tower stairs, a trapdoor and a plaque inside it, and owns the tower and crypt.
  const C = { x0: 38000, z0: 30000, x1: 38018, z1: 30036 };
  const nave = (x, z) => ({ x: C.x0 + x, z: C.z0 + z });
  lib.buildInterior({
    id: 'westertoren', name: 'Westertoren',
    rooms: [
      R(50, 0, 59, 9, '#6a5038', '#7a3f2b', 3.5), // clock room
      R(50, 14, 61, 25, '#6a5038', '#7a3f2b', 4), // bell chamber
      R(52, 32, 59, 39, '#3a5a9a', '#2a4a8a', 1.4), // the crown (open gallery at the top)
    ],
    deco: [['#dce8f0', [X + 52, Z + 32, X + 60, Z + 32, X + 60, Z + 33, X + 52, Z + 33]]],
  });
  lib.buildInterior({ id: 'westerkerk_crypte', name: 'Westerkerk crypt', rooms: [R(0, 50, 25, 69, '#4a4640', '#34302a', 3)], deco: [slab(12, 62), slab(6, 52)] });
  lib.stairs('stairs_up', { ...nave(1, 33), to: at(52, 7), quest: ID, stage: 1, lockedMsg: 'The door to the tower stairs is locked. Beiaardier Joost, outside, has the key.', msg: 'You climb the narrow stairs up the Westertoren. Many, many stairs.' });
  lib.stairs('stairs_down', { ...at(51, 8), to: nave(2, 31), msg: 'You climb back down into the church.' });
  lib.stairs('stairs_up', { ...at(58, 8), to: at(52, 23), msg: 'You climb up to the bell chamber.' });
  lib.stairs('stairs_down', { ...at(51, 24), to: at(56, 7), msg: 'You go down to the clock room.' });
  lib.stairs('ladder_up', { ...at(60, 24), to: at(54, 38), msg: 'You climb a rickety ladder to the very top of the tower. The wind is howling.' });
  lib.stairs('ladder_down', { ...at(53, 39), to: at(59, 23), msg: 'You climb back down to the bells.' });
  api.spawnObject({ type: 'ladder_up', ...at(2, 51), data: { to: { ...nave(3, 24), inside: true, msg: 'You climb out of the crypt into the church.' } } });
  api.spawnObject({ type: 'q_rembrandt_plaque', ...nave(18, 18), rot: -Math.PI / 2 });
  api.spawnObject({ type: 'q_trapdoor', ...nave(3, 22) });
  // crypt chapel: the altar here blesses those who completed the quest
  api.spawnObject({ type: 'q_altar', ...at(20, 52) });
  api.spawnObject({ type: 'q_clockwork', ...at(55, 1) });
  api.spawnObject({ type: 'q_crate', ...at(50, 0) });
  api.spawnObject({ type: 'q_bell_sol', ...at(52, 16) }); api.spawnObject({ type: 'q_bell_mi', ...at(58, 16) });
  api.spawnObject({ type: 'q_bell_re', ...at(55, 20) }); api.spawnObject({ type: 'q_bell_do', ...at(52, 21) });
  api.spawnObject({ type: 'q_crown_lantern', ...at(56, 35) });
  // crypt
  const tombs = [
    { x: 8, z: 56, text: 'TITUS VAN RIJN. 1641 - 1668. Beloved son.', right: false },
    { x: 10, z: 56, text: 'The slab is blank. No name, no date. It lies right beside the grave of Titus.', right: true },
    { x: 16, z: 60, text: 'Here lies HENDRICKJE STOFFELS. Buried in this church in 1663.', right: false },
    { x: 20, z: 64, text: 'Another blank slab, by the far wall. A spider has made it its home.', right: false },
    { x: 4, z: 64, text: 'JAN DE KAASKOPER, merchant, 1702. "He was very Gouda." Someone thought that was funny.', right: false },
  ];
  for (const t of tombs) api.spawnObject({ type: 'q_tomb', ...at(t.x, t.z), data: { tomb: t } });
  for (const [x, z] of [[1, 68], [24, 51], [24, 68], [12, 50]]) api.spawnObject({ type: 'q_candles', ...at(x, z) });

  // ---------------------------------------------------------------- NPCs
  const koster = {
    start: [{ act: p => ['s0', 's1', 's1', 's1', 's1', 's5'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Goedendag. I am Joost, the beiaardier of the Westertoren: I play the carillon. Or I did, until yesterday.' },
      { npc: 'Since yesterday the carillon has been silent. Fifty bells, and not one peep. And there is a cold draught coming up from under the floor.' },
      { opts: [['What can I do?', 'help'], ['Tell me about the church.', 'lore'], ['Bye.', 'end']] },
    ],
    lore: [
      { npc: 'The Westerkerk opened in 1631. The tower is 85 metres, the tallest church tower in the city, with the imperial crown of Maximilian on top.' },
      { npc: 'Rembrandt van Rijn was buried here in 1669. In a rented grave, poor man. Nobody knows exactly where he lies. There is a plaque for him on the wall.' },
      { opts: [['What can I do to help?', 'help'], ['Bye.', 'end']] },
    ],
    help: [
      { npc: 'My knees do not like the tower stairs anymore. Could you climb up and see why the clock stopped? The bells hang on the clock. The tower stairs are inside the church, in the south-west corner. Here is the key.' },
      { npc: 'Take a hammer, the old clockwork sometimes needs a gentle tap. A gentle one!' },
      { act: p => { setQ(p, ID, 1); return null; } },
    ],
    s1: [{ npc: p => [null, 'The tower stairs are in the south-west corner of the church. Bring a hammer!', 'The clock is ticking again! Now the bells... try playing them, they sometimes get stuck.', 'Did something fall from the top? I heard a clang.', 'A key from the crown? That opens the old crypt, under the trapdoor in the church floor. Nobody has been down there in a century.'][st(p)] }],
    s5: [
      { player: 'There was a ghost down in the crypt. A painter, looking for his own grave. He is at peace now.' },
      { npc: 'A painter? Buried here in 1669... You don\'t mean... no. No, that would be silly. Wouldn\'t it?' },
      { npc: 'Whoever he was, thank you. Listen! The carillon is playing again. Take this psalter, it has been blessed under this tower for three hundred years.' },
      { npc: 'And the little altar down in the crypt: pray there whenever you need strength. It will look after you now.' },
      { act: p => {
        for (const it of ['bladmuziek', 'crypte_sleutel']) while (lib.has(p, it)) lib.take(p, it);
        api.completeQuest(p, ID, { xp: { prayer: 3000, crafting: 500 }, items: [['westerkerk_psalter', 1]], coins: 1000, text: ['The crypt altar boosts your prayer'] });
        return 'end';
      } },
    ],
    sdone: [{ npc: 'Hear that? Every quarter of an hour. That is me! The crypt is open to you whenever you want to pray, friend.' }],
  };
  lib.npc({ name: 'Beiaardier Joost', dlg: 'beiaardier', at: api.tile(52.37456, 4.88466), look: lib.L(0, 0, 0, 5, 5, { topC: '#2a2a2a' }), eq: { feet: 'leather_boots' }, wander: 1, chatter: ['Fifty bells and not one peep...'], ex: 'The carillon player of the Westertoren. He jingles with keys.' }, koster);

  lib.npc({ name: 'Geest van de schilder', dlg: 'schildersgeest', at: at(12, 60), home: at(12, 60), wander: 3, model: 'q_painter_ghost', chatter: ['Where... where do I rest?', 'Light... I need more light...'], ex: 'A translucent old man with paint on his fingers.' }, {
    start: [{ act: p => st(p) === 4 ? 'ask' : st(p) >= 5 || api.questDone(p, ID) ? 'peace' : 'boo' }],
    boo: [{ npc: '...' }],
    ask: [
      { npc: 'Ah... a visitor. With a lamp. Hold it a little to the left, would you? The light is all wrong down here.' },
      { player: 'Who are you?' },
      { npc: 'A painter. Once rich, once famous, then poor. When I died, they put me in a rented grave here, in October of 1669. No stone. No name.' },
      { npc: 'I cannot rest until someone finds where I lie. I remember only this: they laid me beside my son, Titus, who went before me by one year.' },
      { npc: 'Read the slabs. Then kneel and pray at the right one.' },
    ],
    peace: [{ npc: 'Thank you, friend. Now go. And remember: light and shadow. Everything is light and shadow.' }],
  });
  const shadeIds = [];
  for (const [x, z] of [[18, 55], [6, 66], [22, 60]]) shadeIds.push(api.spawnNpc({
    name: 'Grafschim', type: 'grafschim', at: at(x, z), wander: 3, model: 'q_shade', ex: 'A shade from the crypt. Cold, grey and grumpy.',
    combat: { lvl: 9, hp: 12, att: 7, str: 7, def: 6, maxHit: 2, aggressive: true, aggroRange: 3, leash: 6, style: 'magic', range: 3, projColor: '#a8d8ff' }, respawn: 30,
    drops: { always: [['bones', 1]], table: [[3, 'coins', 2, 20], [2, null]] },
  }));

  // ---------------------------------------------------------------- objects
  lib.on('q_clockwork', 'Inspect', p => msg(p, st(p) === 1 ? 'A rolled-up piece of paper is wedged between two gears. You will need to tap it loose.' : 'Tick. Tock. Tick. Tock.'));
  lib.on('q_clockwork', 'Repair', p => {
    if (st(p) !== 1) return msg(p, st(p) > 1 ? 'The clock is running perfectly.' : 'Best leave the clockwork alone.');
    if (!lib.hasOrMissing(p, 'hammer')) return msg(p, 'You need a hammer to tap the gears loose. The Albert Heijn sells them.');
    api.startAction(p, { first: 2, every: 3, anim: 'smith', name: 'repair', step: pl => {
      pl.qtaps = (pl.qtaps || 0) + 1;
      if (pl.qtaps < 3) { msg(pl, 'Tink... tink...'); return true; }
      pl.qtaps = 0;
      setQ(pl, ID, 2); lib.give(pl, 'bladmuziek'); api.addXp(pl, 'crafting', 150);
      msg(pl, 'With a gentle tap the gears jump free and the clock starts ticking. A rolled-up page of sheet music falls out.', 'level');
      return false;
    } });
  });
  for (const note of MELODY) {
    lib.on('q_bell_' + note, 'Ring', p => {
      api.say(p, 'p', `*${note.toUpperCase()}*`);
      p.anim = 'attack'; p.animUntil = api.tick + 1;
      if (st(p) !== 2) return msg(p, `DOOOONG. (${note.toUpperCase()})`);
      const seq = (d(p).seq ||= []);
      seq.push(note);
      while (seq.length > MELODY.length) seq.shift();
      msg(p, `DOOOONG. (${note.toUpperCase()}) You have played: ${seq.join(' - ').toUpperCase()}`);
      if (seq.join() === MELODY.join()) {
        d(p).seq = [];
        setQ(p, ID, 3);
        msg(p, 'The whole tower hums along with the melody. Far above you, something rattles loose and clangs against the crown.', 'level');
      } else if (!lib.has(p, 'bladmuziek') && seq.length === 4) msg(p, 'That did not sound right. Maybe the sheet music from the clock would help.');
    });
  }
  lib.on('q_crown_lantern', 'Search', p => {
    if (st(p) === 3 || (st(p) === 4 && !lib.has(p, 'crypte_sleutel'))) {
      if (!api.canAdd(p, 'crypte_sleutel')) return msg(p, 'You need a free inventory slot.');
      lib.give(p, 'crypte_sleutel'); setQ(p, ID, Math.max(4, st(p)));
      return api.startDialog(p, null, { start: [{ item: 'crypte_sleutel', npc: 'Wedged between the golden arches of the crown you find a small black key. A label says: "KRYPT. 1669."' }] });
    }
    msg(p, 'The view from up here is incredible: the canals, the Jordaan, the Anne Frank House just next door.');
  });
  lib.on('q_trapdoor', 'Open', p => {
    if (st(p) < 4) return msg(p, 'The trapdoor is locked with a black iron lock.');
    if (st(p) === 4 && !lib.has(p, 'crypte_sleutel')) return msg(p, 'The trapdoor is locked. You need the crypt key from the tower.');
    msg(p, 'You unlock the trapdoor and climb down into the crypt. It is very cold.');
    api.teleport(p, X + 3, Z + 52, { inside: true });
  });
  lib.on('q_tomb', 'Read', (p, obj) => api.startDialog(p, null, { start: [{ npc: obj.data.tomb.text }] }, 'Tomb slab'));
  lib.on('q_tomb', 'Pray-at', (p, obj) => {
    p.anim = 'pray'; p.animUntil = api.tick + 3;
    if (st(p) !== 4) return msg(p, 'You say a quiet prayer.');
    if (!obj.data.tomb.right) return msg(p, 'You pray, but the ghost of the painter shakes his head sadly. "Not here..."');
    setQ(p, ID, 5);
    api.addXp(p, 'prayer', 500);
    api.startDialog(p, null, { start: [
      { npc: 'You kneel beside the blank slab next to Titus and say a prayer. The cold in the crypt lifts.' },
      { npc: 'The ghost of the painter smiles. "Here. Yes. Beside my boy. Thank you." He fades, and for a moment the crypt is filled with warm, golden light.' },
      { npc: 'Far above, the carillon begins to play.' },
    ] }, 'Crypt');
  });
  lib.on('q_rembrandt_plaque', 'Read', p => api.startDialog(p, null, { start: [
    { npc: 'REMBRANDT HARMENSZ. VAN RIJN. 1606 - 1669. Buried in this church on 8 October 1669.' },
    { npc: 'His exact grave is unknown. His son Titus and his partner Hendrickje Stoffels were also buried in the Westerkerk.' },
  ] }, 'Memorial plaque'));
  lib.on('q_altar', 'Pray-at', p => {
    const max = api.lv(p, 'prayer');
    const bonus = api.questDone(p, ID) ? Math.max(1, Math.floor(max / 10)) : 0;
    p.anim = 'pray'; p.animUntil = api.tick + 3;
    if (p.rec.prayer >= max + bonus) return msg(p, 'You already feel at peace.');
    p.rec.prayer = max + bonus;
    msg(p, bonus ? 'You pray at the crypt altar. The painter\'s light blesses you: your prayer is boosted above its normal level!' : 'You pray at the altar and recharge your prayer points.');
  });
  return { shadeIds };
}
