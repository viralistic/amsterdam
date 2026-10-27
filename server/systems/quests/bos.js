// Quest 6: Het Betoverde Bos (id betoverde_bos). The fairy ring in the Amsterdamse Bos is dying. Gather moon dew,
// an enchanted branch and a corrupted tusk, perform the ritual and meet the White Stag. Completing it lets
// players chop magic trees (the gathering pack checks api.questDone(p, 'betoverde_bos')).
const ID = 'betoverde_bos';
const AXES = ['bronze_axe', 'iron_axe', 'steel_axe', 'mithril_axe', 'adamant_axe', 'rune_axe'];

export default function bos(api, lib) {
  const { tile, getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const dew = p => lib.exists('maandauw') ? api.invCount(p, 'maandauw') : 0;
  const ready = p => dew(p) >= 3 && lib.has(p, 'betoverde_tak') && lib.has(p, 'zwijnen_slagtand');

  api.quest({
    id: ID, name: 'Het Betoverde Bos', points: 2,
    start: 'I can start this quest by talking to Boswachter Bas in the Amsterdamse Bos. I need Woodcutting level 15 and an axe.',
    journal: lib.journal(['The old fairy ring in the Amsterdamse Bos is fading, and the animals are acting strangely.'], [
      { at: 1, todo: p => [
        'Boswachter Bas needs three things for a ritual to heal the fairy ring:',
        `${dew(p) >= 3 ? '[done] ' : ''}Three drops of moon dew from glowing mushrooms (${Math.min(3, dew(p))}/3)`,
        `${lib.has(p, 'betoverde_tak') ? '[done] ' : ''}A branch from the Oude Eik, the ancient oak (Woodcutting 15, axe)`,
        `${lib.has(p, 'zwijnen_slagtand') ? '[done] ' : ''}A tusk from the corrupted boar roaming the woods`,
        ready(p) ? 'I have everything. I should go back to Bas.' : 'Eekhoorn Eef, the squirrel, might know where things are.',
      ], done: 'I gathered moon dew, an enchanted branch and a corrupted tusk.' },
      { at: 2, todo: ['Bas told me to perform the ritual at the fairy ring, in the clearing to the south-west.'], done: 'I performed the ritual and the fairy ring began to glow again.' },
      { at: 3, todo: ['The White Stag appeared at the fairy ring. I should talk to it.'] },
    ]),
  });

  const BAS = tile(52.32450, 4.84700);
  const OAK = tile(52.32300, 4.84420);
  const RING = tile(52.32150, 4.84300);
  lib.npc({ name: 'Boswachter Bas', dlg: 'bas', at: BAS, wander: 2, look: lib.L(0, 0, 4, 2, 10, { topC: '#4a6a2a' }), eq: { head: 'flat_cap', feet: 'leather_boots' }, chatter: ['Mind the herons.', 'Something is wrong in these woods...'], ex: 'The forest ranger of the Amsterdamse Bos.' }, {
    start: [{ act: p => ['s0', 's1', 's2', 's2'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Welkom in het Amsterdamse Bos! Planted by hand in the 1930s, by thousands of people who needed work. Every tree here was put in the ground by somebody.' },
      { npc: "But something old was here before the forest. A fairy ring, in the clearing to the south-west. And it's fading. The animals feel it. The boars have gone mad." },
      { opts: [['How can I help?', 'help'], ['Fairy ring? Seriously?', 'serious'], ['Bye.', 'end']] },
    ],
    serious: [{ npc: "I've been a ranger for 30 years. I've seen a heron steal a whole kibbeling from a toddler. I believe in anything now." }, { goto: 'help' }],
    help: [
      { if: p => api.lv(p, 'woodcutting') < 15, then: 'lowlvl', else: 'go' },
    ],
    lowlvl: [{ npc: "You'll need to cut a branch from the Oude Eik, and that old tree doesn't let beginners near it. Come back with Woodcutting level 15." }],
    go: [
      { npc: 'For the healing ritual I need three things. Three drops of moon dew, from the glowing mushrooms near the paths.' },
      { npc: 'A branch from the Oude Eik, the ancient oak just south-west of here. And a tusk from the corrupted boar. Poor thing. It was a lovely boar once.' },
      { npc: 'Bring them to me. And talk to Eef, the squirrel. She sees everything.' },
      { act: p => { setQ(p, ID, 1); return null; } },
    ],
    s1: [{ if: ready, then: 's1done', else: 's1wait' }],
    s1wait: [{ npc: p => `Moon dew: ${Math.min(3, dew(p))} of 3. Branch from the Oude Eik: ${lib.has(p, 'betoverde_tak') ? 'yes' : 'not yet'}. Boar tusk: ${lib.has(p, 'zwijnen_slagtand') ? 'yes' : 'not yet'}.` }],
    s1done: [
      { npc: 'Moon dew, the branch, the tusk. Wonderful. Now the hard part: the ritual. Go to the fairy ring in the clearing to the south-west, stand in it and perform the ritual.' },
      { npc: 'Pour the dew, plant the branch, and lay the tusk down so the sickness can leave it. I would do it myself, but the ring only answers to those who did the work.' },
      { act: p => { setQ(p, ID, 2); return null; } },
    ],
    s2: [{ npc: p => st(p) === 2 ? 'The fairy ring is south-west of here, in the clearing. Perform the ritual there.' : 'The White Stag! I have heard stories, but never... go, talk to it!' }],
    sdone: [{ npc: 'The woods are calm again. And have you noticed? Some trees here shimmer now. Magic trees. They will let you cut them, after what you did.' }],
  });
  lib.npc({ name: 'Eekhoorn Eef', dlg: 'eef', at: tile(52.32380, 4.84560), wander: 4, model: 'q_squirrel', chatter: ['Nootjes!', '*chitter*'], ex: 'A red squirrel with very strong opinions.' }, {
    start: [
      { npc: '*chitter* A big human! Do you have nuts? No? Hmph.' },
      { goto: 'menu' },
    ],
    menu: [
      { opts: [['Where are the glowing mushrooms?', 'shrooms'], ['Where is the corrupted boar?', 'boar'], ['Tell me about the Oude Eik.', 'oak'], ['Bye, Eef.', 'end']] },
    ],
    shrooms: [{ npc: 'Glowy mushrooms grow along the paths around here. Blue ones. Do NOT eat them. My cousin ate one and thought he was a hedgehog for a week.' }, { goto: 'menu' }],
    boar: [{ npc: 'The sick boar stomps around east of the Oude Eik. His eyes glow purple. He ate my winter stash! Bonk him for me.' }, { goto: 'menu' }],
    oak: [{ npc: 'The Oude Eik was here before the humans planted the rest. It hums. It only lets you take a branch if you are strong with an axe. And polite.' }, { goto: 'menu' }],
  });
  const stag = lib.npc({ name: 'Witte Hert', dlg: 'witte_hert', at: { x: RING.x + 3, z: RING.z + 1 }, home: RING, wander: 3, model: 'q_white_stag', ex: 'A white stag with golden antlers. It looks right through you.' }, {
    start: [{ act: p => st(p) === 3 ? 'meet' : api.questDone(p, ID) ? 'after' : 'shy' }],
    shy: [{ npc: '*The white stag looks at you for a long moment, then turns away.*' }],
    meet: [
      { npc: '*The stag lowers its golden antlers. A voice like wind in leaves fills your head.*' },
      { npc: 'Little woodcutter. You healed the ring. The old magic flows through these trees again.' },
      { npc: 'Some of the trees here have always been more than trees. From today, they will allow your axe. Cut them with respect.' },
      { npc: 'And take this. My friends, the mosses, made it for you.' },
      { act: p => {
        for (const it of ['betoverde_tak', 'zwijnen_slagtand']) while (lib.has(p, it)) lib.take(p, it);
        api.completeQuest(p, ID, { xp: { woodcutting: 4000, hunter: 1500, farming: 1000 }, items: [['elfenkring_cape', 1]], coins: 800, text: ['You can now chop magic trees'] });
        return 'end';
      } },
    ],
    after: [{ npc: '*The stag nods at you. The leaves rustle approvingly.*' }],
  });

  // the corrupted boar
  const boar = api.spawnNpc({
    name: 'Verdorven everzwijn', type: 'bos_boar', at: tile(52.32280, 4.84620), wander: 6, model: 'q_boar', ex: 'A wild boar with glowing purple eyes. Something has poisoned it.',
    combat: { lvl: 22, hp: 30, att: 18, str: 20, def: 14, maxHit: 4, aggressive: true, aggroRange: 3, leash: 10 }, respawn: 50,
    drops: { always: [['bones', 1]], table: [[3, 'coins', 10, 50], [2, 'raw_beef', 1, 1], [3, null]] },
  });
  api.onNpcDeath((npc, killer) => {
    if (npc !== boar) return;
    for (const p of lib.playersNear(npc.x, npc.z, 12)) if (st(p) === 1 && !lib.has(p, 'zwijnen_slagtand')) {
      if (lib.give(p, 'zwijnen_slagtand')) msg(p, 'As the boar falls, a cold purple mist leaves its body. You pry off one of its tusks.', 'level');
    }
  });

  // glowing mushrooms along the paths
  for (const [la, lo] of [[52.32410, 4.84510], [52.32350, 4.84700], [52.32250, 4.84360], [52.32200, 4.84580], [52.32460, 4.84380]]) api.spawnObject({ type: 'q_glowcap', ...tile(la, lo) });
  lib.on('q_glowcap', 'Pick', (p, obj) => {
    if (st(p) !== 1) return msg(p, 'The mushrooms glow faintly. You leave them be.');
    if (dew(p) >= 3) return msg(p, 'You already have enough moon dew.');
    const picked = (lib.qdata(p, ID).picked ??= {});
    if (picked[obj.id] > api.tick) return msg(p, 'You already collected the dew from these mushrooms. Try another patch.');
    api.startAction(p, { first: 2, every: 3, anim: 'pick', obj, name: 'dew', step: pl => {
      picked[obj.id] = api.tick + 300;
      if (lib.give(pl, 'maandauw')) { api.addXp(pl, 'farming', 25); msg(pl, `You carefully collect the moon dew from the mushroom caps. (${Math.min(3, dew(pl))}/3)`); }
      return false;
    } });
  });
  api.spawnObject({ type: 'q_ancient_oak', ...OAK });
  lib.on('q_ancient_oak', 'Inspect', p => msg(p, 'The bark is warm and the whole tree hums softly, like a fridge. A very ancient fridge.'));
  lib.on('q_ancient_oak', 'Cut branch', (p, obj) => {
    if (st(p) !== 1) return msg(p, 'You would not dare to cut this tree without a very good reason.');
    if (lib.has(p, 'betoverde_tak')) return msg(p, 'You already have a branch. The tree would not like you taking more.');
    if (api.lv(p, 'woodcutting') < 15) return msg(p, 'You need a Woodcutting level of 15 to cut a branch from the Oude Eik.');
    const axe = AXES.some(a => lib.has(p, a) || p.rec.equip.weapon?.id === a) || !AXES.some(lib.exists);
    if (!axe) return msg(p, 'You need an axe.');
    msg(p, 'You politely ask the tree for a branch, and start cutting...');
    api.startAction(p, { first: 3, every: 4, anim: 'chop', obj, name: 'branch', step: pl => {
      if (Math.random() < 0.4) return true;
      if (lib.give(pl, 'betoverde_tak')) { api.addXp(pl, 'woodcutting', 200); msg(pl, 'A branch comes loose. It hums gently in your hands.', 'level'); }
      return false;
    } });
  });
  api.spawnObject({ type: 'q_fairy_ring', ...RING });
  lib.on('q_fairy_ring', 'Perform ritual', (p, obj) => {
    if (st(p) !== 2) return msg(p, st(p) > 2 || api.questDone(p, ID) ? 'The fairy ring glows warmly.' : 'You feel a tingle, but you do not know any rituals.');
    if (!ready(p)) return msg(p, 'You need three drops of moon dew, the enchanted branch and the corrupted tusk.');
    api.startAction(p, { first: 2, every: 3, anim: 'pray', obj, name: 'ritual', step: pl => {
      pl.qrit = (pl.qrit || 0) + 1;
      if (pl.qrit === 1) { msg(pl, 'You pour the moon dew into the circle. The mushrooms light up one by one.'); return true; }
      if (pl.qrit === 2) { msg(pl, 'You plant the enchanted branch in the centre. Tiny roots wriggle into the soil.'); return true; }
      pl.qrit = 0;
      api.invRemove(pl, 'maandauw', 3);
      msg(pl, 'You lay down the tusk. Purple mist pours out of it and vanishes into the ground. The whole ring blazes with green light!', 'level');
      setQ(pl, ID, 3);
      api.say(stag, 'n', '*A white stag steps out from between the trees.*');
      return false;
    } });
  });
}
