// Quest 4: De Nachtwacht Ontwaakt. The militia of Rembrandt's Night Watch have climbed out of the painting.
// Rijksmuseum interior: gallery puzzle, depot dungeon with artifacts, a security code and a boss fight.
import { landmarkFront } from './lib.js';

const ID = 'nachtwacht';
const X = 30200, Z = 30000;
const PAINTINGS = {
  q_painting_melkmeisje: { title: 'Het Melkmeisje (The Milkmaid)', hint: 'Painted around 1660 by a Delft master famous for his light. Fewer than forty of his paintings survive.', answer: 'Johannes Vermeer' },
  q_painting_bruidje: { title: 'Het Joodse bruidje (The Jewish Bride)', hint: 'Painted around 1665-1669, late in life, by the same man who painted the Night Watch.', answer: 'Rembrandt van Rijn' },
  q_painting_drinker: { title: 'De vrolijke drinker (The Merry Drinker)', hint: 'Painted around 1629 in Haarlem by a master of quick, loose brushstrokes.', answer: 'Frans Hals' },
  q_painting_huisgezin: { title: 'Het vrolijke huisgezin (The Merry Family)', hint: 'Painted in 1668. A messy household in Dutch is still called "een huishouden van Jan ..." after this painter.', answer: 'Jan Steen' },
};
const PAINTERS = ['Johannes Vermeer', 'Rembrandt van Rijn', 'Frans Hals', 'Jan Steen'];
const ARTIFACTS = ['nw_kippenklauw', 'nw_trommel', 'nw_vaandel', 'nw_kruithoorn'];
const CODE = '1642';

export default function nachtwacht(api, lib) {
  const { getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const d = p => lib.qdata(p, ID);
  const artCount = p => ARTIFACTS.filter(a => lib.has(p, a)).length;
  const plaques = p => (d(p).plaques ??= {});
  const plaquesOk = p => Object.entries(PAINTINGS).every(([k, v]) => plaques(p)[k] === v.answer);

  api.quest({
    id: ID, name: 'De Nachtwacht Ontwaakt', points: 3,
    start: 'I can start this quest by talking to Conservator Pronk outside the Rijksmuseum. Combat level 35+ is recommended.',
    journal: lib.journal(['The figures of Rembrandt\'s Night Watch have climbed out of their painting in the Rijksmuseum.'], [
      { at: 1, todo: ['Conservator Pronk let me into the museum. I should talk to Hoofdbewaker Bertha in the entrance hall.'], done: 'Hoofdbewaker Bertha told me what happened.' },
      { at: 2, todo: p => ['The militia swapped the plaques of four paintings in the Gallery of Honour. I should fix them (right-click a painting).', `Plaques correct: ${Object.entries(PAINTINGS).filter(([k, v]) => plaques(p)[k] === v.answer).length} of 4.`], done: 'I fixed the plaques in the Gallery of Honour and found the depot key.' },
      { at: 3, todo: p => [
        'The painted militia are hiding in the depot downstairs (stairs in the west of the entrance hall). They took four artifacts I need to restore the painting:',
        ...ARTIFACTS.map(a => `${lib.has(p, a) ? '[found] ' : ''}${lib.name(a)}`),
        d(p).lasers ? 'I switched off the lasers in front of the Night Watch hall.' : 'The Night Watch hall, north of the gallery, is sealed by lasers. The security room off the gallery needs a four-digit code. Bertha said it is written in a book in the library.',
        artCount(p) === 4 && d(p).lasers ? 'I should place the artifacts at the empty frame in the Night Watch hall.' : '',
      ].filter(Boolean), done: 'I brought the four artifacts to the empty frame of the Night Watch.' },
      { at: 4, todo: ['Captain Frans Banninck Cocq refuses to return to his painting! I must defeat him in the Night Watch hall.'], done: 'I defeated Captain Banninck Cocq, and the militia returned to the canvas.' },
      { at: 5, todo: ['I should tell Conservator Pronk (outside) or Bertha (in the entrance hall) that the Night Watch is back in its frame.'] },
    ]),
  });

  // ---------------------------------------------------------------- interior
  const R = (x0, z0, x1, z1, floor, wall, h = 4) => ({ x0: X + x0, z0: Z + z0, x1: X + x1, z1: Z + z1, floor, wall, h });
  const at = (x, z) => ({ x: X + x, z: Z + z });
  const DEP = '#4a4844', DEPW = '#3a3834';
  lib.buildInterior({
    id: 'rijksmuseum', name: 'Rijksmuseum',
    rooms: [
      R(20, 50, 49, 61, '#d8d0c0', '#ece6d8', 5), // atrium
      R(28, 11, 41, 47, '#7a5a3a', '#6a2a2a', 5), // Gallery of Honour
      R(17, 14, 26, 22, '#3a3a40', '#5a5a60', 3.5), // security room
      R(51, 50, 62, 61, '#6a4a2a', '#8a6a3a', 5), // Cuypers library
      R(22, 0, 47, 9, '#5a4a3a', '#4a1e1e', 6), // Night Watch hall
      R(70, 10, 84, 24, DEP, DEPW, 3), R(86, 10, 100, 24, DEP, DEPW, 3), R(70, 26, 84, 40, DEP, DEPW, 3), R(86, 26, 100, 40, DEP, DEPW, 3), // depot
    ],
    open: [[X + 33, Z + 48, X + 36, Z + 49], [X + 27, Z + 17, X + 27, Z + 18], [X + 50, Z + 54, X + 50, Z + 56],
      [X + 85, Z + 16, X + 85, Z + 18], [X + 77, Z + 25, X + 79, Z + 25], [X + 93, Z + 25, X + 95, Z + 25], [X + 85, Z + 32, X + 85, Z + 34]],
    gaps: [[X + 35, Z + 10], [X + 35, Z + 62]],
    deco: [['#b0a080', [X + 31, Z + 11, X + 39, Z + 11, X + 39, Z + 47, X + 31, Z + 47]], ['#8a2a2a', [X + 33, Z + 11, X + 37, Z + 11, X + 37, Z + 47, X + 33, Z + 47]], ['#c8b890', [X + 30, Z + 53, X + 40, Z + 53, X + 40, Z + 58, X + 30, Z + 58]], ['#8a2a2a', [X + 26, Z + 2, X + 44, Z + 2, X + 44, Z + 7, X + 26, Z + 7]]],
  });
  const front = landmarkFront('rijksmuseum', 0, 1.5);
  lib.entrance({ ...front, to: at(35, 60), quest: ID, stage: 1, lockedMsg: 'The museum is closed tonight. "Talk to Conservator Pronk," says a sign on the door.', msg: 'You slip into the dark museum.' });
  lib.exit({ ...at(35, 62), to: landmarkFront('rijksmuseum', 0, 3.5), msg: 'You step out onto the Museumstraat.' });
  lib.stairs('stairs_down', { ...at(22, 52), to: at(73, 12), quest: ID, stage: 3, lockedMsg: 'The door to the depot stairs is locked. You need the depot key.', msg: 'You go down into the depot. Something is shuffling in the dark...' });
  lib.stairs('stairs_up', { ...at(71, 11), to: at(24, 53), msg: 'You climb back up to the entrance hall.' });

  // decor
  api.spawnObject({ type: 'q_ticketdesk', ...at(44, 57) }); api.spawnObject({ type: 'q_ticketdesk', ...at(45, 57) });
  api.spawnObject({ type: 'q_shipmodel', ...at(27, 56) }); api.spawnObject({ type: 'q_dollhouse', ...at(42, 52) });
  for (const [x, z] of [[21, 60], [48, 60], [21, 51], [48, 51]]) api.spawnObject({ type: 'q_pillar', ...at(x, z) });
  for (const [x, z] of [[52, 50], [54, 50], [56, 50], [58, 50], [60, 50], [62, 52], [62, 54], [62, 56], [62, 58]]) api.spawnObject({ type: 'q_bookcase', ...at(x, z), rot: x === 62 ? -Math.PI / 2 : 0, data: { nw: x === 58 ? 'journal' : 'books' } });
  api.spawnObject({ type: 'q_desk', ...at(56, 57), data: { nw: 'libdesk' } });
  api.spawnObject({ type: 'q_painting_melkmeisje', ...at(29, 18), rot: Math.PI / 2 });
  api.spawnObject({ type: 'q_painting_bruidje', ...at(40, 22), rot: -Math.PI / 2 });
  api.spawnObject({ type: 'q_painting_drinker', ...at(29, 30), rot: Math.PI / 2 });
  api.spawnObject({ type: 'q_painting_huisgezin', ...at(40, 36), rot: -Math.PI / 2 });
  for (const [x, z] of [[29, 42], [40, 42], [40, 13], [29, 24]]) api.spawnObject({ type: 'q_candles', ...at(x, z) });
  api.spawnObject({ type: 'q_security_panel', ...at(20, 15) });
  api.spawnObject({ type: 'q_desk', ...at(23, 15), data: { nw: 'guarddesk' } });
  api.spawnObject({ type: 'q_laser_gate', ...at(35, 10) });
  api.spawnObject({ type: 'q_nachtwacht_frame', ...at(34, 1) });
  for (const [x, z] of [[24, 1], [46, 1], [24, 8], [46, 8]]) api.spawnObject({ type: 'q_candles', ...at(x, z) });
  // depot: crates, vitrines with the artifacts
  for (const [x, z] of [[75, 15], [76, 15], [80, 20], [90, 12], [97, 20], [72, 35], [82, 30], [88, 38], [99, 28]]) api.spawnObject({ type: 'q_crate', ...at(x, z) });
  api.spawnObject({ type: 'q_vitrine', ...at(83, 22), data: { nw: 'nw_kruithoorn' } });
  api.spawnObject({ type: 'q_vitrine', ...at(99, 11), data: { nw: 'nw_trommel' } });
  api.spawnObject({ type: 'q_vitrine', ...at(71, 39), data: { nw: 'nw_vaandel' } });
  api.spawnObject({ type: 'q_vitrine', ...at(99, 39), data: { nw: 'nw_kippenklauw' } });

  // ---------------------------------------------------------------- NPCs
  const curator = {
    start: [{ act: p => ['s0', 's1', 's1', 's1', 's1', 's5'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Oh! Are you with security? No? Even better, security fainted. I am Dr. Pieternella Pronk, curator of the 17th century collection.' },
      { player: 'What happened?' },
      { npc: "Last night at midnight the Night Watch... walked out. Captain Banninck Cocq, his lieutenant, the drummer, the girl with the chicken, all of them!" },
      { npc: 'The frame is empty. The painted militia are running around the museum, rearranging everything and swapping the labels.' },
      { npc: 'Rembrandt painted that in 1642. It has survived a knife attack, an acid attack and being cut down to fit a wall. It will NOT be stolen by its own characters.' },
      { opts: [["I'll get them back into the painting.", 'yes'], ['Have you tried turning it off and on again?', 'joke'], ['Sounds dangerous. No thanks.', 'end']] },
    ],
    joke: [{ npc: "It's a painting. There's no off switch. Believe me, we looked." }, { opts: [["Fine, I'll help.", 'yes'], ['No thanks.', 'end']] }],
    yes: [
      { act: p => { setQ(p, ID, 1); return null; } },
      { npc: 'Thank you! The entrance is right behind me. Hoofdbewaker Bertha is inside, in the entrance hall. She knows the building better than anyone.' },
      { npc: 'Be careful. The militia have muskets. Painted muskets, but still.' },
    ],
    s1: [{ npc: 'Have you got them back in the frame yet? Bertha is in the entrance hall if you need help. Mind the muskets.' }],
    s5: [
      { npc: 'The Night Watch is back in its frame! And... is the captain a bit more to the left than before? Never mind, nobody will notice.' },
      { npc: 'The museum is in your debt. The captain left his hat behind, and his lieutenant dropped this partisan. Take them, we have plenty of history already.' },
      { act: p => {
        for (const a of [...ARTIFACTS, 'depot_sleutel']) while (lib.has(p, a)) lib.take(p, a);
        api.completeQuest(p, ID, { xp: { attack: 2500, strength: 2500, exploring: 1500 }, items: [['nachtwacht_hoed', 1], ['ruytenburch_partizaan', 1]], coins: 3000 });
        return 'end';
      } },
    ],
    sdone: [{ npc: 'Have you seen the painting today? I could swear the captain winked at me. Anyway. Come back any time, the museum is open again.' }],
  };
  lib.npc({ name: 'Conservator Pronk', dlg: 'pronk', at: landmarkFront('rijksmuseum', 4, 3), look: lib.L(1, 0, 3, 5, 5, { topC: '#4a3a5a' }), eq: { feet: 'leather_boots' }, chatter: ['The frame is EMPTY!', 'Oh, Rembrandt, what have you done?'], ex: 'A curator at the end of her tether.' }, curator);

  lib.npc({ name: 'Hoofdbewaker Bertha', at: at(38, 56), wander: 3, look: lib.L(1, 1, 5, 5, 5, { topC: '#1a2a4a' }), eq: { head: 'flat_cap' }, ex: 'Head of security. Has not slept since 1998.' }, {
    start: [{ act: p => ['s1', 's1', 's2', 's3', 's4', 's5'][st(p)] || 'sdone' }],
    s1: [
      { if: p => st(p) === 0, then: 'closed', else: 's1go' },
    ],
    closed: [{ npc: 'The museum is closed. How did you even get in here?' }],
    s1go: [
      { npc: "Pronk sent you? Good. Listen. When the militia walked out, the alarm locked down the Night Watch hall with lasers. Nobody gets in or out." },
      { npc: 'Then the little rascals went through the Gallery of Honour and swapped the name plaques on four paintings. If the director sees that, she will cry.' },
      { npc: 'Fix the plaques first, please. Right-click a painting to inspect it or fix its plaque. The gallery is straight north of here.' },
      { act: p => { setQ(p, ID, 2); return null; } },
    ],
    s2: [{ npc: 'The plaques in the Gallery of Honour! Inspect each painting, then fix its plaque. Vermeer, Rembrandt, Hals and Steen, all mixed up.' }],
    s3: [
      { npc: 'The militia are hiding in the depot downstairs, with the artifacts they took from the painting: the golden claw, the drum, the banner and a powder horn.' },
      { npc: "To get into the Night Watch hall you'll need to switch off the lasers in the security room, west of the gallery. The code is the year the painting was finished." },
      { npc: 'I always forget it, so the night guard wrote it in a book in the library. East of this hall. Third bookcase... or fourth. One of those.' },
    ],
    s4: [{ npc: 'The captain is still out of his frame? Then you will have to convince him. With force, I am afraid.' }],
    s5: [{ npc: "You did it! Go and tell Conservator Pronk, she's outside. Or I can do it... no, she'll want to thank you herself." }, { act: p => { api.startDialog(p, null, curator, 'Conservator Pronk'); return 'stop'; } }],
    sdone: [{ npc: 'Quiet night tonight. Just the way I like it.' }],
  });

  // painted militia in the depot
  const militia = [];
  const mk = (x, z, pike) => militia.push(api.spawnNpc({
    name: pike ? 'Geschilderde piekenier' : 'Geschilderde musketier', type: 'nw_militia', at: at(x, z), wander: 3, model: pike ? 'q_militia_pike' : 'q_militia',
    combat: { lvl: pike ? 24 : 20, hp: pike ? 28 : 24, att: pike ? 20 : 16, str: pike ? 20 : 16, def: 16, maxHit: pike ? 4 : 3, aggressive: true, aggroRange: 3, leash: 8, style: pike ? 'melee' : 'ranged', range: pike ? 1 : 5, projColor: '#3a3a3a' },
    respawn: 40, drops: { always: [], table: [[4, 'coins', 10, 60], [1, 'bones', 1, 1], [3, null]] }, ex: 'A militiaman from the Night Watch. You can see the brushstrokes.',
  }));
  mk(78, 18); mk(92, 16, true); mk(95, 20); mk(76, 32, true); mk(80, 37); mk(92, 30, true); mk(96, 35);

  // bosses
  const captain = api.spawnNpc({
    name: 'Kapitein Banninck Cocq', type: 'nw_captain', at: at(35, 4), home: at(35, 4), wander: 3, model: 'q_captain', ex: 'Captain Frans Banninck Cocq, Lord of Purmerland. Out of his frame and furious about it.',
    combat: { lvl: 66, hp: 95, att: 48, str: 46, def: 42, maxHit: 9, speed: 5, aggressive: false, boss: true, leash: 10,
      special: { chance: 0.22, run: (n, t, api2) => {
        api2.say(n, 'n', 'Schutters... VUUR!');
        const dmg = api2.rand(2, 10);
        for (const p of lib.playersNear(n.x, n.z, 6)) { if (p.rec.hp <= 0) continue; const hit = Math.min(dmg, p.rec.hp); p.rec.hp -= hit; msg(p, `The painted militia fire a volley! You take ${hit} damage.`, 'warn'); if (p.rec.hp <= 0) api2.die(p, n); }
        return true;
      } } },
    respawn: 100, drops: { always: [['coins', 250]], table: [[5, 'coins', 100, 600], [3, null]], rare: [[40, 'ruytenburch_partizaan', 1], [30, 'nachtwacht_hoed', 1]] },
  });
  const lieutenant = api.spawnNpc({
    name: 'Luitenant Van Ruytenburch', type: 'nw_lieutenant', at: at(38, 5), home: at(38, 5), wander: 3, model: 'q_lieutenant', ex: 'Lieutenant Willem van Ruytenburch, dressed head to toe in yellow. He follows the captain everywhere.',
    combat: { lvl: 38, hp: 40, att: 30, str: 28, def: 30, maxHit: 5, aggressive: false, leash: 10 }, respawn: 100,
    drops: { always: [], table: [[1, 'coins', 50, 200]] },
  });
  // the lieutenant helps the captain
  api.onTick(tick => {
    if (tick % 3) return;
    if (captain.target && !lieutenant.dead && !lieutenant.target) lieutenant.target = captain.target;
    if (lieutenant.target && !captain.dead && !captain.target) captain.target = lieutenant.target;
  });
  api.onNpcDeath((npc, killer) => {
    if (npc !== captain) return;
    api.say(npc, 'n', 'Back... to the canvas... we march!');
    for (const p of lib.playersNear(npc.x, npc.z, 15)) if (st(p) === 4) { setQ(p, ID, 5); msg(p, 'The captain fades into brushstrokes and flows back into the frame. The Night Watch is complete again!', 'level'); }
  });

  // ---------------------------------------------------------------- objects
  for (const [type, info] of Object.entries(PAINTINGS)) {
    lib.on(type, 'Inspect', p => api.startDialog(p, null, { start: [{ npc: `${info.title}. ${info.hint}` }, { npc: p2 => `The plaque currently says: "${plaques(p2)[type] || PAINTERS[(Object.keys(PAINTINGS).indexOf(type) + 1) % 4]}".` }] }, 'Painting'));
    lib.on(type, 'Fix plaque', p => {
      if (st(p) < 2) return msg(p, 'A guard would not like you fiddling with the plaques.');
      if (st(p) > 2) return msg(p, 'The plaque is correct now.');
      api.startDialog(p, null, {
        start: [{ npc: `${info.title}. Who painted it?` }, { opts: PAINTERS.map((n, i) => [n, 'p' + i]) }],
        ...Object.fromEntries(PAINTERS.map((n, i) => ['p' + i, [{ act: pl => { plaques(pl)[type] = n; api.touch(); return plaquesOk(pl) ? 'solved' : 'set'; } }]])),
        set: [{ npc: p2 => `You change the plaque. (${Object.entries(PAINTINGS).filter(([k, v]) => plaques(p2)[k] === v.answer).length} of 4 plaques now look right... or do they?)` }],
        solved: [
          { npc: 'As you fix the last plaque, a hidden drawer under the frame clicks open. Inside is a heavy key on a museum lanyard: "DEPOT".' },
          { act: pl => { lib.give(pl, 'depot_sleutel'); setQ(pl, ID, 3); return null; } },
          { item: 'depot_sleutel', npc: 'You take the depot key. The stairs to the depot are in the west of the entrance hall.' },
        ],
      }, 'Painting');
    });
  }
  lib.on('q_bookcase', 'Search', (p, obj) => {
    if (obj.data.nw === 'journal') return api.startDialog(p, null, { start: [
      { npc: 'Between two catalogues you find a guard\'s notebook. On the first page: "Laser code = the year the Night Watch was finished. Rembrandt, for the Kloveniersdoelen."' },
      { npc: 'Below it, in different handwriting: "It\'s 1642, Gerard. Stop writing it down." ' },
    ] }, 'Library');
    if (obj.data.nw === 'books') return msg(p, ['Art history, volume 14 of 92.', 'A catalogue of Delftware. Very blue.', 'A book about the 1885 museum building by Pierre Cuypers, who also built Centraal.', 'A guide to iron spiral staircases. This library has four.'][api.rand(0, 3)]);
    msg(p, 'Dusty old books. Nothing useful.');
  });
  lib.on('q_desk', 'Search', (p, obj) => {
    if (obj.data.nw === 'guarddesk') return msg(p, 'A half-eaten broodje kaas and a note: "Code? Ask Gerard. Gerard doesn\'t remember either."');
    if (obj.data.nw === 'libdesk') return msg(p, 'A reading lamp and a sign: "Silence please."');
    return false;
  });
  lib.on('q_vitrine', 'Search', (p, obj) => {
    const item = obj.data.nw;
    if (!item) return msg(p, 'Empty.');
    if (st(p) !== 3) return msg(p, st(p) > 3 ? 'The case is empty now.' : 'A painted militiaman has hidden something in here. You don\'t know what it is for yet.');
    if (lib.has(p, item)) return msg(p, 'You already took what was in this case.');
    if (!api.canAdd(p, item)) return msg(p, 'You need a free inventory slot.');
    lib.give(p, item);
    msg(p, `You find the ${lib.lname(item)}! (${artCount(p)} of 4 artifacts)`);
  });
  lib.on('q_security_panel', 'Use', p => {
    if (st(p) < 3) return msg(p, 'The panel blinks: "ALARM ACTIVE. ENTER CODE." You have no idea what the code is.');
    if (d(p).lasers) return msg(p, 'The lasers are already off for you.');
    const digits = [['0', '1', '6', '9'], ['2', '4', '6', '8'], ['1', '3', '4', '7'], ['0', '2', '5', '9']];
    const script = { start: [{ npc: 'The panel has four dials. Set the first dial:' }, { goto: 'd0' }] };
    digits.forEach((opts, i) => {
      script['d' + i] = [{ opts: opts.map(o => [o, `s${i}_${o}`]) }];
      for (const o of opts) script[`s${i}_${o}`] = [{ act: pl => { const e = (pl.qcode = (i ? pl.qcode : '') + o); return i < 3 ? 'n' + (i + 1) : e === CODE ? 'ok' : 'bad'; } }];
      if (i < 3) script['n' + (i + 1)] = [{ npc: pl => `Code so far: ${pl.qcode}. Set dial ${i + 2}:` }, { goto: 'd' + (i + 1) }];
    });
    script.ok = [{ npc: 'BEEP. "CODE ACCEPTED." The red beams in front of the Night Watch hall flicker and die.' }, { act: pl => { d(pl).lasers = 1; api.touch(); api.sendQuests(pl); return null; } }];
    script.bad = [{ npc: 'BZZZT! "WRONG CODE." Sirens wail and two sleepy guards march you back to the entrance hall.' }, { act: pl => { api.teleport(pl, X + 35, Z + 58); return null; } }];
    api.startDialog(p, null, script, 'Security panel');
  });
  lib.on('q_laser_gate', 'Pass', p => {
    if (!d(p).lasers) return msg(p, 'The lasers are on. If you touch them, every alarm in the building goes off.');
    const into = p.z > Z + 10;
    api.teleport(p, X + 35, into ? Z + 9 : Z + 11);
    msg(p, into ? 'You step through the dead laser grid into the Night Watch hall.' : 'You step back into the Gallery of Honour.');
  });
  lib.on('q_nachtwacht_frame', 'Inspect', p => msg(p, st(p) >= 5 || api.questDone(p, ID) ? 'The Night Watch: 363 by 437 centimetres of militia, back where they belong.' : 'The canvas is empty except for some shadows and a dog. The dog stayed.'));
  lib.on('q_nachtwacht_frame', 'Restore', p => {
    if (st(p) !== 3) return msg(p, st(p) === 4 ? 'The captain refuses to go back! You must defeat him first.' : 'You have nothing to restore the painting with.');
    if (artCount(p) < 4) return msg(p, `You need all four artifacts. You have ${artCount(p)}.`);
    for (const a of ARTIFACTS) lib.take(p, a);
    setQ(p, ID, 4);
    api.say(captain, 'n', 'Who dares? We are the company of Captain Frans Banninck Cocq!');
    api.startDialog(p, captain, { start: [
      { npc: 'You place the claw, the drum, the banner and the powder horn in the frame. The paint ripples. The drummer, the girl and the musketeers dissolve back into the canvas.' },
      { npc: 'But the captain stands firm. "I have been standing still for 384 years! I will not go back without a fight!"' },
      { npc: 'Defeat Captain Banninck Cocq to return him to his painting.' },
    ] }, 'The Night Watch');
  });
}
