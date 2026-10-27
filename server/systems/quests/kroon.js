// Quest 3: De Gestolen Kroon. A political mystery inside the Royal Palace on the Dam: interview the court,
// collect three clues, accuse the culprit, fight the hired burglar in the attic and recover the crown.
import { landmarkFront } from './lib.js';

const ID = 'gestolen_kroon';
const X = 30000, Z = 30000; // interior origin (quests allocation)

export default function kroon(api, lib) {
  const { getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const d = p => lib.qdata(p, ID);
  const clues = ['gastenboek_blad', 'ge_bonnetje', 'verbrande_brief'];
  const hasClues = p => clues.every(c => lib.has(p, c));
  const interviewed = p => ['k', 'h', 'w'].filter(k => d(p)['i_' + k]).length;

  api.quest({
    id: ID, name: 'De Gestolen Kroon', points: 2,
    start: 'I can start this quest by talking to the Hofmaarschalk in front of the Royal Palace on the Dam.',
    journal: lib.journal(['The crown of the Netherlands has been stolen from the Royal Palace.'], [
      { at: 1, todo: ['The Hofmaarschalk gave me a palace pass. I should go inside and talk to Suppoost Gerrit in the Vierschaar, the entrance hall.'], done: 'I talked to Suppoost Gerrit, who told me nobody broke in: it was an inside job.' },
      { at: 2, todo: p => [
        'I need to interview the three people with access to the treasury and find evidence:',
        `${d(p).i_k ? '[done] ' : ''}Kamerheer Constantijn, in the Burgerzaal`,
        `${d(p).i_h ? '[done] ' : ''}Hofdame Henriette, in the Throne Room (east)`,
        `${d(p).i_w ? '[done] ' : ''}Wethouder Willemijn de Wit, in the Mayor's Chamber (east)`,
        `Clues found: ${clues.filter(c => lib.has(p, c)).length} of 3. Gerrit mentioned the logbook in the Vierschaar.`,
        hasClues(p) ? 'I have enough evidence. I should tell the Hofmaarschalk who did it.' : 'Rooms in the west wing may hide more.',
      ], done: 'I collected the evidence and unmasked Wethouder De Wit as the thief.' },
      { at: 3, todo: ['The letter said "nobody ever checks the attic". The Hofmaarschalk unlocked the attic hatch in the north-east corner of the Burgerzaal.', 'I should search the attic, near the Atlas statue.'], done: 'In the attic I dealt with the hired burglar.' },
      { at: 4, todo: ['I should search behind the feet of the Atlas statue in the attic.'], done: 'I found the real crown behind the Atlas statue.' },
      { at: 5, todo: ['I should return the crown to the Hofmaarschalk.'], done: 'I returned the crown to the Hofmaarschalk.' },
      { at: 6, todo: ['The Hofmaarschalk opened the treasury (Schatkamer) north of the Burgerzaal for me. My reward is in the royal chest.'] },
    ]),
  });

  // ---------------------------------------------------------------- interior
  const R = (x0, z0, x1, z1, floor, wall, h = 4) => ({ x0: X + x0, z0: Z + z0, x1: X + x1, z1: Z + z1, floor, wall, h });
  const circle = (cx, cz, r, n = 16) => Array.from({ length: n }, (_, i) => [X + cx + Math.cos(i / n * Math.PI * 2) * r, Z + cz + Math.sin(i / n * Math.PI * 2) * r]).flat();
  const MARBLE = '#d8d2c2', WALLW = '#ece4d2', WOOD = '#6a5038';
  lib.buildInterior({
    id: 'paleis', name: 'Royal Palace',
    rooms: [
      R(40, 44, 59, 53, '#c4b8a0', WALLW, 4), // Vierschaar (entrance)
      R(30, 20, 69, 39, MARBLE, WALLW, 5), // Burgerzaal
      R(14, 20, 28, 29, '#8a6a4a', '#d8ccb0'), // Schepenzaal
      R(14, 31, 28, 39, '#7a5a3a', '#d0c4a8'), // Moseszaal
      R(71, 20, 85, 29, '#8a6a4a', '#d8ccb0'), // Burgemeesterskamer
      R(71, 31, 85, 39, '#9a2a2a', '#e4d4a8'), // Troonzaal
      R(42, 10, 57, 18, '#5a3a2a', '#c8b070', 4), // Schatkamer
      R(95, 0, 112, 12, WOOD, '#5a4a3a', 3), // attic
    ].map(r => r),
    open: [[X + 48, Z + 40, X + 51, Z + 43], [X + 29, Z + 24, X + 29, Z + 25], [X + 70, Z + 24, X + 70, Z + 25], [X + 70, Z + 35, X + 70, Z + 36]],
    gaps: [[X + 29, Z + 35], [X + 49, Z + 19], [X + 50, Z + 54]],
    deco: [
      ['#3a5a7a', circle(40, 30, 6)], ['#3a5a7a', circle(59, 30, 6)], ['#1a2a4a', circle(49.5, 30, 3.2)],
      ['#c8b070', circle(38, 28, 2, 7)], ['#c8b070', circle(42, 32, 2.5, 7)], ['#c8b070', circle(57, 29, 3, 7)], ['#c8b070', circle(61, 32, 1.5, 6)],
      ['#e0c040', circle(49.5, 30, 0.8, 5)], ['#a8a090', [X + 47, Z + 44, X + 53, Z + 44, X + 53, Z + 47, X + 47, Z + 47]],
      ['#b02020', [X + 49, Z + 20, X + 51, Z + 20, X + 51, Z + 39, X + 49, Z + 39]],
    ],
  });
  const at = (x, z) => ({ x: X + x, z: Z + z });
  const out = landmarkFront('paleis', 0, 2);
  lib.entrance({ x: out.x, z: out.z, rot: out.rot, to: at(50, 52), quest: ID, stage: 1, lockedMsg: 'A guard blocks the door. "The palace is closed today. Talk to the Hofmaarschalk."', msg: 'You show your palace pass and step inside.' });
  lib.exit({ ...at(50, 54), to: landmarkFront('paleis', 0, 4), msg: 'You step back out onto the Dam.' });
  // decor
  for (const [x, z] of [[33, 23], [33, 36], [66, 23], [66, 36], [44, 23], [55, 23], [44, 36], [55, 36]]) api.spawnObject({ type: 'q_pillar', ...at(x, z) });
  for (const [x, z] of [[31, 21], [68, 38], [31, 38]]) api.spawnObject({ type: 'q_candles', ...at(x, z) });
  for (const [x, z] of [[36, 20], [62, 20], [76, 31], [80, 31]]) api.spawnObject({ type: 'q_banner_orange', ...at(x, z) });
  api.spawnObject({ type: 'q_judge_bench', ...at(50, 45) });
  api.spawnObject({ type: 'q_banner_red', ...at(44, 44) }); api.spawnObject({ type: 'q_banner_red', ...at(56, 44) });
  api.spawnObject({ type: 'q_throne', ...at(84, 35), rot: -Math.PI / 2 });
  api.spawnObject({ type: 'q_candles', ...at(84, 32) }); api.spawnObject({ type: 'q_candles', ...at(84, 38) });
  api.spawnObject({ type: 'q_lectern', ...at(56, 51), data: { kroon: 'logbook' } });
  api.spawnObject({ type: 'q_desk', ...at(18, 21), data: { kroon: 'receipt' } });
  api.spawnObject({ type: 'q_bookcase', ...at(24, 20) }); api.spawnObject({ type: 'q_bookcase', ...at(26, 20) });
  api.spawnObject({ type: 'q_fireplace', ...at(18, 39), data: { kroon: 'letter' } });
  api.spawnObject({ type: 'q_desk', ...at(82, 21), data: { kroon: 'wdesk' } });
  api.spawnObject({ type: 'q_bookcase', ...at(76, 20) });
  for (const [x, z] of [[44, 11], [55, 11]]) api.spawnObject({ type: 'q_candles', ...at(x, z) });
  api.spawnObject({ type: 'q_treasure_chest', ...at(49, 12) });
  api.spawnObject({ type: 'q_banner_orange', ...at(46, 10) }); api.spawnObject({ type: 'q_banner_orange', ...at(53, 10) });
  // attic
  lib.stairs('q_hatch', { ...at(67, 21), to: at(97, 10), quest: ID, stage: 3, lockedMsg: 'The attic hatch is padlocked. Only the Hofmaarschalk has the key.', msg: 'You climb up into the dusty attic.' });
  lib.stairs('ladder_down', { ...at(96, 11), to: at(66, 22), msg: 'You climb back down into the Burgerzaal.' });
  api.spawnObject({ type: 'q_atlas', ...at(109, 3) });
  for (const [x, z] of [[100, 2], [101, 2], [104, 9], [111, 10], [98, 5]]) api.spawnObject({ type: 'q_crate', ...at(x, z), data: { kroon: 'crate' } });

  // locked doors
  lib.innerDoor({ ...at(29, 35), rot: Math.PI / 2, a: at(28, 35), b: at(30, 35), check: (p, entering) => !entering || lib.has(p, 'moseszaal_sleutel') || st(p) > 2 || 'The door to the Moses Hall is locked. Someone at court must have a key.' });
  lib.innerDoor({ ...at(49, 19), type: 'q_door_gold', a: at(49, 18), b: at(49, 20), check: (p, entering) => entering || st(p) >= 6 || 'The treasury is locked tight. Only the Hofmaarschalk can open it.' });

  // ---------------------------------------------------------------- NPCs
  const hofmaarschalk = {
    start: [{ act: p => ['s0', 's1', 's2', 's3', 's4', 's5', 's6'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Ah, an adventurer. Thank goodness. I am the Hofmaarschalk, the Marshal of the Royal Household. We have a... situation.' },
      { player: 'What kind of situation?' },
      { npc: 'The crown. The real crown of the Netherlands. It was in the treasury last night and this morning it is gone. Poof.' },
      { opts: [['Gone? Like, stolen?', 's0b'], ["Isn't there a crown lying around on the Dam?", 's0decoy'], ['Not my problem.', 'end']] },
    ],
    s0decoy: [
      { npc: "*sigh* That's a decoy. We leave a few brass ones around the square to confuse thieves. People keep picking them up and wearing them." },
      { npc: 'The real one is heavier, older and considerably less shiny. Now, about the theft...' },
      { goto: 's0b' },
    ],
    s0b: [
      { npc: 'Stolen, yes. Quietly. No broken windows, no forced locks. Which means it was someone inside the palace.' },
      { npc: 'The press must not hear of this. Will you investigate? Discreetly?' },
      { opts: [["I'll find your crown.", 's0yes'], ['I need to think about it.', 'end']] },
    ],
    s0yes: [
      { act: p => { setQ(p, ID, 1); lib.give(p, 'paleispas'); return null; } },
      { item: 'paleispas', npc: 'The Hofmaarschalk hands you a palace pass.' },
      { npc: 'Go inside and speak to Suppoost Gerrit in the Vierschaar, the hall just behind the entrance. He was on duty last night.' },
    ],
    s1: [{ npc: 'Suppoost Gerrit is in the Vierschaar, just inside the front door. Go on, discreetly!' }, { act: p => { if (!lib.has(p, 'paleispas')) lib.give(p, 'paleispas'); return 'end'; } }],
    s2: [
      { if: p => hasClues(p) && interviewed(p) === 3, then: 'accuse', else: 's2wait' },
    ],
    s2wait: [{ npc: p => `Any progress? You have spoken to ${interviewed(p)} of the 3 suspects and found ${clues.filter(c => lib.has(p, c)).length} of 3 pieces of evidence. I need proof before I accuse anyone.` }],
    accuse: [
      { npc: 'You look like someone who has solved a mystery. So? Who took the crown?' },
      { opts: [['Kamerheer Constantijn.', 'wrong_k'], ['Hofdame Henriette.', 'wrong_h'], ['Wethouder Willemijn de Wit.', 'right'], ['A pigeon.', 'wrong_p']] },
    ],
    wrong_k: [{ npc: 'Constantijn? He faints when he sees a parking ticket. Look at your evidence again.' }],
    wrong_h: [{ npc: 'Henriette has served three queens and a king. She would sooner steal her own teeth. Think again.' }],
    wrong_p: [{ npc: "The pigeons are suspects in many crimes against this palace. But not this one." }],
    right: [
      { player: 'The logbook shows a "W. de W." here at 23:40. The receipt is a Grand Exchange listing for a crown. And the letter about a replica is signed W. All in green ink.' },
      { npc: 'And Wethouder De Wit signs everything with that ridiculous green pen. Of course. She wanted to sell the crown and leave a replica!' },
      { npc: "She's not going anywhere. But where is the crown? The letter says 'nobody ever checks the attic'." },
      { npc: "Here, I'll unlock the attic hatch. It's in the north-east corner of the Burgerzaal. Be careful up there." },
      { act: p => { setQ(p, ID, 3); return null; } },
    ],
    s3: [{ npc: 'The attic hatch is in the north-east corner of the Burgerzaal. Search near the Atlas statue.' }],
    s4: [{ npc: "You chased off a burglar? Splendid! Now search behind Atlas, the crown must be close." }],
    s5: [
      { if: p => lib.has(p, 'gestolen_kroon'), then: 's5yes', else: 's5no' },
    ],
    s5no: [{ npc: 'You found it, you say? Then where is it? Go back to the Atlas statue in the attic.' }],
    s5yes: [
      { item: 'gestolen_kroon', npc: 'You hand over the Crown of the Netherlands.' },
      { act: p => { lib.take(p, 'gestolen_kroon'); setQ(p, ID, 6); return null; } },
      { npc: "The real crown! Heavy, old, and only slightly dusty. The nation owes you a debt it will never officially acknowledge." },
      { npc: 'I have unlocked the treasury, just north of the Burgerzaal. Take what is in the royal chest. You have earned it.' },
    ],
    s6: [{ npc: 'The treasury door is open for you. Your reward is in the royal chest, just north of the Burgerzaal.' }],
    sdone: [
      { npc: 'Our discreet hero! The crown is back where it belongs, and Wethouder De Wit is now in charge of the municipal pigeon census.' },
    ],
  };
  const hofLook = { look: lib.L(0, 0, 0, 5, 5, { topC: '#1c1c2a' }), eq: { feet: 'leather_boots' }, ex: 'The Marshal of the Royal Household. Very proper. Very stressed.' };
  lib.npc({ name: 'Hofmaarschalk', dlg: 'hofmaarschalk', at: landmarkFront('paleis', 4, 3), ...hofLook }, hofmaarschalk);
  api.spawnNpc({ name: 'Hofmaarschalk', talk: 'q_hofmaarschalk', at: at(52, 37), wander: 1, ...hofLook });

  lib.npc({ name: 'Suppoost Gerrit', at: at(45, 48), wander: 2, look: lib.L(0, 2, 5, 5, 5, { topC: '#2a3a5a' }), eq: { head: 'flat_cap' }, chatter: ['No running in the Vierschaar.'], ex: 'Palace attendant. Has worked nights here for thirty years.' }, {
    start: [{ act: p => st(p) === 1 ? 'brief' : st(p) === 2 ? 'hint' : 'chat' }],
    brief: [
      { npc: 'The Hofmaarschalk sent you? Good. Sit down. No wait, not on the judges\' bench. This is the Vierschaar: in the old days death sentences were pronounced right here.' },
      { npc: 'Last night, nobody broke in. I would have seen. But three people have keys to the treasury corridor: the Kamerheer, the Hofdame and that Wethouder, the alderman for heritage.' },
      { npc: 'Everyone who enters at night signs the logbook on the lectern over there. Read it. And talk to all three of them.' },
      { act: p => { setQ(p, ID, 2); return null; } },
    ],
    hint: [{ npc: 'Have you read the logbook on the lectern? And talked to the Kamerheer, the Hofdame and the Wethouder?' }, { npc: 'Oh, and I found tulip petals on the stairs this morning. Somebody went to the Bloemenmarkt. Or somebody is very romantic.' }],
    chat: [{ npc: "This hall was built to impress the people of Amsterdam. The city was the richest in the world in 1655. And it wanted everyone to know." }],
  });
  lib.npc({ name: 'Kamerheer Constantijn', at: at(58, 26), wander: 3, look: lib.L(0, 0, 3, 5, 5, { topC: '#3a2a4a' }), ex: 'The chamberlain. He is sweating slightly.' }, {
    start: [{ act: p => st(p) === 2 ? 'iv' : 'chat' }],
    iv: [
      { npc: "An investigator? Oh dear oh dear. I didn't do it! I mean, do what? Nothing happened. Did something happen?" },
      { player: 'Where were you last night?' },
      { npc: "I locked the treasury corridor at ten o'clock, like every night, and went home to my cat. You can ask the cat." },
      { npc: "The spare key hangs in the Mayor's Chamber, for emergencies. The Wethouder uses that office these days. She asked me twice this week whether the attic was ever inspected. Odd question." },
      { act: p => { d(p).i_k = 1; api.touch(); return null; } },
    ],
    chat: [{ npc: 'Did you know this floor shows the whole world? The two hemispheres and the heavens. Amsterdam at the centre of everything, naturally.' }],
  });
  lib.npc({ name: 'Hofdame Henriette', at: at(79, 36), wander: 2, look: lib.L(1, 0, 6, 5, 5, { topC: '#5a1a3a' }), eq: { body: 'summer_dress' }, ex: 'Lady-in-waiting. She has seen it all, twice.' }, {
    start: [{ act: p => st(p) === 2 ? 'iv' : 'chat' }],
    iv: [
      { npc: "Young person, I have served this house for forty years. If you're here about the crown, I'll be brief, I have a balcony wave to rehearse." },
      { npc: 'Around midnight I saw candlelight in the Moses Hall, the room where the city council used to meet. Nobody should be in there at night.' },
      { npc: 'Here, take my key to the Moses Hall. The door is on the west side of the Burgerzaal. Bring it back. Eventually.' },
      { act: p => { d(p).i_h = 1; if (!lib.has(p, 'moseszaal_sleutel')) lib.give(p, 'moseszaal_sleutel'); api.touch(); return null; } },
      { item: 'moseszaal_sleutel', npc: 'The Hofdame gives you a heavy iron key.' },
    ],
    chat: [{ npc: 'Wave from the wrist, not from the elbow. Like screwing in a lightbulb. That is the royal wave.' }],
  });
  lib.npc({ name: 'Wethouder De Wit', at: at(79, 24), wander: 2, look: lib.L(1, 1, 2, 4, 5, { topC: '#2a5a3a' }), ex: 'The alderman for heritage. She is twirling a green fountain pen.' }, {
    start: [{ act: p => st(p) === 2 ? 'iv' : st(p) > 2 ? 'caught' : 'chat' }],
    iv: [
      { npc: "I'm terribly busy. Heritage doesn't preserve itself, you know. Well, actually it does, mostly. What do you want?" },
      { player: 'Where were you last night?' },
      { npc: "At home in Amstelveen, of course. Watching a documentary about... replicas. Of furniture. Old furniture." },
      { npc: '*She twirls a green fountain pen between her fingers and smiles a bit too widely.*' },
      { act: p => { d(p).i_w = 1; api.touch(); return null; } },
    ],
    caught: [{ npc: "I want to speak to my lawyer. And my pen back. Wait, I still have my pen. Never mind." }],
    chat: [{ npc: 'Did you know the palace stands on 13,659 wooden piles? Every child learns that number. I find it very... valuable.' }],
  });
  lib.npc({ name: 'Paleisduif', dlg: 'paleisduif', at: at(103, 6), model: 'q_pigeon', wander: 4, chatter: ['Roekoe!', 'Roe-koe-koe.'], ex: 'A palace pigeon. Possibly royal. Definitely rude.' }, {
    start: [{ npc: 'Roekoe.' }, { player: 'Did you see who hid the crown?' }, { npc: 'Roe... koe... *the pigeon looks pointedly at the Atlas statue*' }],
  });
  const burglar = api.spawnNpc({
    name: 'Gemaskerde inbreker', at: at(106, 5), wander: 3, look: lib.L(0, 2, 7, 5, 5, { topC: '#1a1a1a' }), eq: { head: 'beanie', weapon: 'bronze_dagger' },
    combat: { lvl: 12, hp: 20, att: 10, str: 9, def: 8, maxHit: 2, aggressive: true, aggroRange: 3, leash: 8 }, respawn: 30,
    drops: { always: [], table: [[3, 'coins', 5, 40], [1, 'bike_key', 1, 1], [4, null]] }, ex: "A masked burglar, hired by someone with a green pen.",
  });
  api.onNpcDeath((npc, killer) => {
    if (npc !== burglar) return;
    for (const p of lib.playersNear(npc.x, npc.z, 12)) if (st(p) === 3) { setQ(p, ID, 4); msg(p, 'The burglar drops a slip of paper: "Behind Atlas. Collect Friday. - W." You should search the Atlas statue.', 'level'); }
  });

  // ---------------------------------------------------------------- objects
  lib.on('q_lectern', 'Read', (p, obj) => {
    if (obj.data.kroon !== 'logbook') return msg(p, 'Nothing of interest.');
    if (st(p) === 2 && !lib.has(p, 'gastenboek_blad')) {
      lib.give(p, 'gastenboek_blad');
      return api.startDialog(p, null, { start: [{ npc: 'The last entry, at 23:40, reads: "W. de W. - late meeting." Written in green ink. You tear out the page as evidence.' }] }, 'Palace logbook');
    }
    api.startDialog(p, null, { start: [{ npc: 'Visitors: "Dhr. Jansen, plumber, 09:10." "School class 4B, 10:30 (sorry about the vase)." "W. de W., 23:40" (page torn out).' }] }, 'Palace logbook');
  });
  lib.on('q_desk', 'Search', (p, obj) => {
    if (obj.data.kroon === 'receipt') {
      if (st(p) === 2 && !lib.has(p, 'ge_bonnetje')) { lib.give(p, 'ge_bonnetje'); return msg(p, 'Under a pile of council minutes you find a torn receipt: a Grand Exchange listing for "1 x crown, 25,000 coins". The ink is green.'); }
      return msg(p, 'Council minutes from 1662. Riveting.');
    }
    if (obj.data.kroon === 'wdesk') return msg(p, 'The drawers are full of green fountain pens. At least forty of them.');
    return false;
  });
  lib.on('q_fireplace', 'Search', (p, obj) => {
    if (obj.data.kroon !== 'letter') return msg(p, 'Just ash.');
    if (st(p) === 2 && !lib.has(p, 'verbrande_brief')) { lib.give(p, 'verbrande_brief'); return msg(p, 'In the warm ashes you find a half-burnt letter: "...the replica is ready on Thursday... nobody ever checks the attic... - W."'); }
    msg(p, 'Cold ashes and a smell of burnt paper.');
  });
  lib.on('q_crate', 'Search', (p, obj) => {
    if (obj.data.kroon) return msg(p, ['Old curtains.', 'A box of spare chandelier crystals.', 'A portrait of a very cross burgomaster.', 'Pigeon feathers. Lots of them.'][api.rand(0, 3)]);
    return false;
  });
  lib.on('q_atlas', 'Search', p => {
    if (st(p) === 3) return msg(p, 'You hear footsteps behind you. Someone is up here with you! Deal with them first.');
    if (st(p) === 4) {
      if (!api.canAdd(p, 'gestolen_kroon')) return msg(p, 'You need a free inventory slot.');
      lib.give(p, 'gestolen_kroon'); setQ(p, ID, 5);
      return api.startDialog(p, null, { start: [{ item: 'gestolen_kroon', npc: 'Wrapped in an old Ajax towel behind the feet of Atlas, you find the Crown of the Netherlands!' }] });
    }
    if (st(p) === 5 && !lib.has(p, 'gestolen_kroon')) { lib.give(p, 'gestolen_kroon'); return msg(p, 'You find the crown where you left it. Careless!'); }
    msg(p, 'Atlas looks tired. He has held up the heavens since 1665.');
  });
  lib.on('q_throne', 'Sit-on', p => msg(p, 'A guard coughs loudly. You decide not to.'));
  lib.on('q_treasure_chest', 'Open', p => {
    if (st(p) === 6) {
      api.completeQuest(p, ID, { xp: { thieving: 1500, exploring: 2500, defence: 800 }, items: [['oranje_sjerp', 1]], coins: 2500, text: ['The thanks of a grateful (but discreet) nation'] });
      lib.take(p, 'paleispas'); for (const c of [...clues, 'moseszaal_sleutel']) while (lib.has(p, c)) lib.take(p, c);
      return;
    }
    msg(p, api.questDone(p, ID) ? 'The chest is empty now. The Hofmaarschalk keeps the rest for the next hero.' : 'It is locked.');
  });
  api.onUse((p, u) => {
    if (u.kind !== 'npc' || u.npc.name !== 'Hofmaarschalk' || u.item.id !== 'kings_crown') return false;
    api.startDialog(p, u.npc, { start: [{ npc: "Ah, one of our decoys from the Dam. Brass, I'm afraid. Keep it, it suits you. Just don't try to pawn it at the Grand Exchange." }] });
    return true;
  });
}
