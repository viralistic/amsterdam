// Quest 1: Welkom in Amsterdam. A tutorial chain at Amsterdam Centraal: walking, talking, woodcutting, fishing,
// cooking, banking and the ghost / real-life modes.
const ID = 'welkom';
const AXES = [['bronze_axe', 1, 1], ['iron_axe', 1, 2], ['steel_axe', 6, 3], ['mithril_axe', 21, 4], ['adamant_axe', 31, 5], ['rune_axe', 41, 6]];

export default function welkom(api, lib) {
  const { tile, getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);

  api.quest({
    id: ID, name: 'Welkom in Amsterdam', points: 1,
    start: 'I can start this quest by talking to Wegwijzer Wim, in front of Amsterdam Centraal.',
    journal: lib.journal(['Wegwijzer Wim is teaching me the basics of life in Amsterdam.'], [
      { at: 1, todo: ['I should chop some logs from the training elm next to Wim.', 'Right-click the tree and choose Chop down. I need an axe.'], done: 'I chopped some logs from the training elm.' },
      { at: 2, todo: ['I should catch some raw shrimps with a small net at the fishing spot by the harbour, a few steps from Wim.'], done: 'I caught raw shrimps in the harbour.' },
      { at: 3, todo: ['I should cook the shrimps on the kookplaat next to Wim.', 'If I burn them, I can just catch some more.'], done: 'I cooked some shrimps on the kookplaat.' },
      { at: 4, todo: ['I should store the cooked shrimps in the bank. The Bankier stands just west of Wim.', 'Then I should tell Wim.'], done: 'I put shrimps safely in the bank.' },
      { at: 5, todo: ['Wim wants to tell me about ghosts and real-life mode. I should talk to him.'], done: 'Wim explained ghosts and real-life mode.' },
    ]),
  });

  const WIM = tile(52.37796, 4.90046);
  lib.npc({ name: 'Wegwijzer Wim', dlg: 'wim', at: WIM, look: lib.L(0, 1, 2, 9, 5, { topC: '#e2001a' }), eq: { head: 'flat_cap', feet: 'sneakers' }, chatter: ['Nieuw in de stad? Talk to me!', 'Welkom in Amsterdam!'], ex: 'Works for the tourist office. Has never once been lost.' }, {
    start: [{ act: p => ['s0', 's1', 's2', 's3', 's4', 's5'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Hallo! Welkom in Amsterdam! You look like someone who just stepped off the train with no idea where anything is.' },
      { player: 'Is it that obvious?' },
      { npc: "You're standing in a cycle lane. Don't worry, I'm Wim. I teach new arrivals how to survive here. Want a quick tour?" },
      { opts: [['Yes please, teach me!', 'begin'], ['How do I walk around?', 'walk'], ['Not right now.', 'end']] },
    ],
    walk: [
      { npc: 'Click on the ground to walk. Right-click on anything to see what you can do with it: talk, trade, chop, attack...' },
      { npc: "The little boot near the minimap makes you run. And don't stop in the bike lane. Ever." },
      { opts: [['Okay, teach me the rest!', 'begin'], ['Thanks, bye.', 'end']] },
    ],
    begin: [
      { npc: 'First lesson: everybody in this city needs firewood for the stove and something to put on it. Lekker.' },
      { act: p => { setQ(p, ID, 1); if (!lib.hasAny(p, AXES.map(a => a[0]))) lib.give(p, 'bronze_axe'); return null; } },
      { item: 'bronze_axe', npc: 'Wim hands you a bronze axe. "Gemeente property, so be nice to it."' },
      { npc: 'See that elm by the bike racks? Right-click it and Chop down. Bring me some logs.' },
    ],
    s1: [
      { if: p => lib.hasOrMissing(p, 'logs'), then: 's1done', else: 's1wait' },
    ],
    s1wait: [
      { npc: "No logs yet? The training elm is right next to me. Right-click it and choose 'Chop down'." },
      { if: p => !lib.hasAny(p, AXES.map(a => a[0])), then: 's1axe', else: 'end' },
    ],
    s1axe: [{ npc: "Lost your axe already? Here's another one. That's coming out of my lunch budget." }, { act: p => { lib.give(p, 'bronze_axe'); return 'end'; } }],
    s1done: [
      { npc: 'Logs! Beautiful. You can sell those, burn them, or build a tiny canal house. Keep them for now.' },
      { npc: "Next: food. The harbour is full of shrimps. Take this small net and fish at the spot by the water, east of here." },
      { act: p => { setQ(p, ID, 2); if (!lib.has(p, 'small_net')) lib.give(p, 'small_net'); return null; } },
      { item: 'small_net', npc: 'Wim gives you a small net. It smells like it has done this before.' },
    ],
    s2: [{ if: p => lib.hasOrMissing(p, 'raw_shrimps'), then: 's2done', else: 's2wait' }],
    s2wait: [
      { npc: 'The fishing spot is in the harbour, just east of me. Right-click the bubbles and choose Net.' },
      { if: p => !lib.has(p, 'small_net') && lib.exists('small_net'), then: 's2net', else: 'end' },
    ],
    s2net: [{ npc: 'And take a net this time. Here.' }, { act: p => { lib.give(p, 'small_net'); return 'end'; } }],
    s2done: [
      { npc: "Raw shrimps! Don't eat them like that, you're not a seagull. Cook them on my kookplaat, right here." },
      { npc: 'Right-click the kookplaat and choose Cook. Or use the shrimps on it.' },
      { act: p => { setQ(p, ID, 3); return null; } },
    ],
    s3: [{ if: p => lib.hasOrMissing(p, 'shrimps') || lib.inBank(p, 'shrimps'), then: 's3done', else: 's3wait' }],
    s3wait: [{ npc: 'Cook your raw shrimps on the kookplaat next to me. Burnt ones are for the seagulls. Catch more if you need to.' }],
    s3done: [
      { npc: 'Perfectly cooked! Now, you never know when you need a snack, so store them somewhere safe: the bank.' },
      { npc: 'The Bankier stands just west of here, by the station. Talk to him, open your bank and deposit the shrimps. Then come back.' },
      { act: p => { setQ(p, ID, 4); return null; } },
    ],
    s4: [{ if: p => !lib.exists('shrimps') || lib.inBank(p, 'shrimps'), then: 's4done', else: 's4wait' }],
    s4wait: [{ npc: "I don't see shrimps in your bank yet. Talk to the Bankier, choose to access your account, and click the shrimps in your inventory to deposit them." }],
    s4done: [
      { npc: 'Safe and sound in the bank. Your bank is the same everywhere in the city, so you can grab them from any Bankier.' },
      { act: p => { setQ(p, ID, 5); return null; } },
      { goto: 's5' },
    ],
    s5: [
      { npc: "Last lesson, and it's an important one. Right now you are a ghost." },
      { player: 'A WHAT?' },
      { npc: "Relax. When you're not really here, you drift around the city as a ghost. Ghosts can walk anywhere, chat, trade, train and do quests." },
      { npc: "But a ghost can't pick up things lying in the street. Your ghostly fingers go right through them." },
      { npc: 'Turn on real-life mode with the eye orb by the minimap, and your character follows your phone around the real Amsterdam.' },
      { npc: 'Real adventurers find treasure in the streets and can duel other real players nearby. Mind the trams, though.' },
      { npc: 'Quick quiz, then. What can a ghost NOT do?' },
      { opts: [['Chat with other players.', 'q_wrong'], ['Pick up treasure lying in the street.', 'q_right'], ['Walk anywhere in the city.', 'q_wrong'], ['Do quests.', 'q_wrong']] },
    ],
    q_wrong: [{ npc: 'Nee, nee! Ghosts can do that just fine. Listen carefully, I am a professional.' }, { goto: 's5quiz' }],
    s5quiz: [{ npc: 'Again: what can a ghost NOT do?' }, { opts: [['Chat with other players.', 'q_wrong'], ['Pick up treasure lying in the street.', 'q_right'], ['Walk anywhere in the city.', 'q_wrong']] }],
    q_right: [
      { npc: 'Precies! You learn faster than most tourists. Most of them are still looking for the Eiffel Tower.' },
      { npc: "That's my tour done. Here's something to wear so people know you're new. And a little pocket money." },
      { act: p => {
        api.completeQuest(p, ID, { xp: { woodcutting: 150, fishing: 150, cooking: 150, exploring: 300 }, items: [['iamsterdam_shirt', 1]], coins: 250, text: ['Access to the whole city!'] });
        return 'end';
      } },
    ],
    sdone: [
      { npc: 'Hoi again! Everything going well? Remember: look left, right, and then left again for bikes.' },
      { opts: [['Any tips on where to go next?', 'tips'], ['Bye, Wim.', 'end']] },
    ],
    tips: [
      { npc: 'Stadsgids Saskia on the Dam gives tours of the canal ring. The Hofmaarschalk at the Royal Palace looked worried today, too.' },
      { npc: "And there's a challenge board on the Dam with new tasks every day." },
    ],
  });

  // tutorial objects
  const tree = api.spawnObject({ type: 'q_tut_tree', ...tile(52.37800, 4.90068) });
  const spot = api.spawnObject({ type: 'q_tut_fishspot', ...tile(52.37776, 4.90098) });
  api.spawnObject({ type: 'q_tut_stove', ...tile(52.37790, 4.90055) });

  lib.on('q_tut_tree', 'Chop down', (p, obj) => {
    if (!lib.exists('logs')) return msg(p, 'The tree seems to be made of cardboard today. (Logs are not available in this world yet.)');
    const tools = AXES.filter(([id]) => lib.exists(id)).map(([id, level, power]) => ({ id, level, power }));
    api.gather(p, obj, {
      skill: 'woodcutting', level: 1, xp: 25, item: 'logs', tools: tools.length ? tools : undefined,
      toolMsg: 'You need an axe to chop this tree. Wim has spares.', anim: 'chop', startMsg: 'You swing your axe at the training elm.',
      successMsg: 'You get some logs.', deplete: 0.3, respawn: 8, depleteMsg: 'The training elm is now a stump. It grows back quickly, the Gemeente insists.',
      chance: level => Math.min(0.9, 0.55 + level * 0.02),
    });
  });
  lib.on('q_tut_fishspot', 'Net', (p, obj) => {
    if (!lib.exists('raw_shrimps')) return msg(p, 'The shrimps are on strike. (Raw shrimps are not available in this world yet.)');
    api.gather(p, obj, {
      skill: 'fishing', level: 1, xp: 10, item: 'raw_shrimps', tools: lib.exists('small_net') ? [{ id: 'small_net', level: 1, power: 1 }] : undefined,
      toolMsg: 'You need a small net to catch shrimps here.', anim: 'fish', startMsg: 'You cast out your net...', successMsg: 'You catch some shrimps.',
      chance: level => Math.min(0.9, 0.5 + level * 0.02),
    });
  });

  function cook(p) {
    if (!lib.exists('raw_shrimps') || !lib.exists('shrimps')) return msg(p, 'The kookplaat sputters. (Cooking is not available in this world yet.)');
    if (!api.hasItem(p, 'raw_shrimps')) return msg(p, 'You have nothing to cook. Raw shrimps would do nicely.');
    msg(p, 'You put the shrimps on the kookplaat.');
    api.startAction(p, {
      first: 2, every: 4, anim: 'cook', name: 'cooking',
      step: pl => {
        if (!api.invRemove(pl, 'raw_shrimps', 1)) return false;
        const burn = Math.max(0.05, 0.35 - api.lv(pl, 'cooking') * 0.03);
        if (Math.random() < burn && lib.exists('burnt_fish')) { api.invAdd(pl, 'burnt_fish', 1); msg(pl, 'You accidentally burn the shrimps.'); }
        else { api.invAdd(pl, 'shrimps', 1); api.addXp(pl, 'cooking', 30); msg(pl, 'The shrimps are now nicely cooked.'); }
        return api.hasItem(pl, 'raw_shrimps');
      },
    });
  }
  lib.on('q_tut_stove', 'Cook', p => cook(p));
  api.onUse((p, u) => {
    if (u.kind !== 'obj' || u.obj.type !== 'q_tut_stove') return false;
    if (u.item.id === 'raw_shrimps') cook(p);
    else msg(p, "Wim's kookplaat is only licensed for shrimps.");
    return true;
  });

  // a sign for the lost
  api.spawnObject({ type: 'sign', ...tile(52.37802, 4.90036), data: { text: 'WELKOM IN AMSTERDAM! New here? Talk to Wegwijzer Wim, right next to this sign. Fietsers hebben altijd voorrang (cyclists always have right of way).' } });
  return { tree, spot };
}
