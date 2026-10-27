// Quest 9: Het Hart van Zuidoost. A Wilderness quest. Fantasy shadow creatures shattered the Heart, an old
// rhythm stone that keeps the neighbourhood's music going. Follow the trail deeper into the (fictional) Wilderness.
// The people of Zuidoost are the quest givers and allies; the threats are fantasy monsters only.
const ID = 'hart_zuidoost';

export default function zuidoost(api, lib) {
  const { tile, getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const shards = p => lib.exists('hart_scherf') ? api.invCount(p, 'hart_scherf') : 0;

  api.quest({
    id: ID, name: 'Het Hart van Zuidoost', points: 3,
    start: 'I can start this quest by talking to Ranger Rosalie at the northern edge of Zuidoost. This quest goes deep into the Wilderness: I could lose items if I die. Combat level 60+ recommended.',
    journal: lib.journal(['Shadow creatures have shattered the Heart of Zuidoost, an ancient rhythm stone. Without it, the music of the neighbourhood is fading.', 'WARNING: this quest takes me into the Wilderness, where I can lose items and other players can attack me.'], [
      { at: 1, todo: ['Ranger Rosalie asked me to check the old lookout post just inside the Wilderness (around level 6), straight south of her.'], done: 'At the lookout I found a trail of shadow.' },
      { at: 2, todo: p => ['The shadow trail leads to the broken rhythm stone, deeper south (around Wilderness level 16). Shadow trolls carry the shards of the Heart.', `Heart shards: ${Math.min(3, shards(p))} of 3.`, shards(p) >= 3 ? 'I should inspect the rhythm stone with the shards.' : 'I should defeat shadow trolls near the stone.'], done: 'I recovered three shards of the Heart from the shadow trolls.' },
      { at: 3, todo: ['The core of the Heart was swallowed by the Gaasperdraak, a swamp dragon lurking further south (around Wilderness level 32). I must defeat it.'], done: 'I defeated the Gaasperdraak and made the Heart whole.' },
      { at: 4, todo: ['I should bring the Heart of Zuidoost back to Ranger Rosalie, outside the Wilderness.'] },
    ]),
  });

  const ROS = tile(52.33150, 4.96500);
  const LOOK = tile(52.32740, 4.96500);
  const STONE = tile(52.32300, 4.96520);
  const LAIR = tile(52.31580, 4.96500);
  lib.npc({ name: 'Ranger Rosalie', dlg: 'rosalie', at: ROS, wander: 2, look: lib.L(1, 4, 0, 2, 10, { topC: '#3a6a2a' }), eq: { head: 'flat_cap', feet: 'leather_boots' }, chatter: ['Stay safe out there.', 'Can you hear the music? It is so quiet lately.'], ex: 'A community ranger who knows every path in Zuidoost.' }, {
    start: [{ act: p => ['s0', 's1', 's2', 's3', 's4'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Hey! Rosalie, buurtranger. Before you head south, you know this is where the Wilderness begins, right? In this game, at least.' },
      { npc: 'Out there it is all fantasy trouble: shadow creatures, monsters, other adventurers looking for a fight. The people around here just want it gone so the music can come back.' },
      { opts: [['What music?', 'music'], ['What happened?', 'what'], ['Bye.', 'end']] },
    ],
    music: [
      { npc: 'Zuidoost is one of the most diverse parts of the country: people with roots in more than 130 countries. Every summer the Bijlmerpark fills up for the Kwakoe festival: music, food, football.' },
      { npc: 'Old stories say a stone drum, the Heart of Zuidoost, keeps the rhythm going under it all. Lately the beat is gone.' },
      { goto: 'what' },
    ],
    what: [
      { npc: 'Shadow creatures crawled out of the swamps and smashed the Heart. I saw them dragging pieces off to the south.' },
      { npc: "I can't go in there. But you could. Fair warning: it's the Wilderness. If you die there, you can lose your stuff. Bring only what you can afford to lose." },
      { opts: [["I'll bring the Heart back.", 'yes'], ['Too dangerous for me.', 'end']] },
    ],
    yes: [
      { npc: 'Respect. Start with the old lookout post, straight south of here, just past the edge. See if the trail starts there.' },
      { act: p => { setQ(p, ID, 1); return null; } },
    ],
    s1: [{ npc: 'The lookout post is straight south of here, just inside the Wilderness.' }],
    s2: [{ npc: p => `${shards(p)} of 3 shards. The trolls hang around the broken rhythm stone, further south. Be careful.` }],
    s3: [{ npc: 'A swamp dragon swallowed the core? Of course it did. Rest, eat, then go and get it. And do not take your best stuff.' }],
    s4: [
      { if: p => lib.has(p, 'hart_van_zuidoost'), then: 'finish', else: 's4lost' },
    ],
    s4lost: [{ npc: 'You beat the dragon, but where is the Heart? If you lost it out there, you will have to take it back from the Gaasperdraak.' }, { act: p => { setQ(p, ID, 3); return 'end'; } }],
    finish: [
      { item: 'hart_van_zuidoost', npc: 'You hand the Heart of Zuidoost to Rosalie. It beats warmly in her hands.' },
      { npc: 'Listen. Can you hear that? Drums. Somewhere a speaker turns on. Somebody is laughing. That is the Heart doing its job.' },
      { npc: 'The dragon left some scales behind, I bet. Our smith made a shield from scales like those once. Here, take it. And the neighbourhood collected this for you.' },
      { act: p => { lib.take(p, 'hart_van_zuidoost'); while (lib.has(p, 'schaduwspoor')) lib.take(p, 'schaduwspoor'); api.completeQuest(p, ID, { xp: { attack: 6000, strength: 6000, defence: 6000, hitpoints: 3000 }, items: [['draakschub_schild', 1]], coins: 15000 }); return 'end'; } },
    ],
    sdone: [{ npc: 'The festival is on again this summer. You are on the guest list for life. Bring friends!' }],
  });

  api.spawnObject({ type: 'q_lookout', ...LOOK });
  api.spawnObject({ type: 'q_drum_stone', ...STONE });
  lib.on('q_lookout', 'Inspect', p => {
    if (st(p) !== 1) return msg(p, 'An old wooden lookout. The view of the Gaasperplas is lovely, if you ignore the monsters.');
    lib.give(p, 'schaduwspoor'); setQ(p, ID, 2);
    api.startDialog(p, null, { start: [{ item: 'schaduwspoor', npc: 'The ladder is smeared with sticky black shadow. You scrape some off. A trail of it leads south, deeper into the Wilderness.' }] }, 'Lookout post');
  });
  lib.on('q_drum_stone', 'Inspect', p => {
    if (st(p) === 2 && shards(p) >= 3) {
      api.invRemove(p, 'hart_scherf', shards(p));
      setQ(p, ID, 3);
      return api.startDialog(p, null, { start: [
        { npc: 'You fit the three shards into the broken stone drum. They glow, but the centre stays dark and empty.' },
        { npc: 'The shadow on the stone forms a picture: a huge swamp dragon, deep in the south, swallowing a glowing red core.' },
      ] }, 'Rhythm stone');
    }
    msg(p, st(p) === 2 ? `The rhythm stone has three holes in it. You have ${shards(p)} shards.` : 'A stone drum, covered in carvings of dancers and musicians.');
  });

  // shadow trolls around the stone
  for (const [dx, dz] of [[-8, -6], [7, -4], [-5, 8], [9, 7]]) api.spawnNpc({
    name: 'Schaduwtrol', type: 'schaduwtrol', at: { x: STONE.x + dx, z: STONE.z + dz }, wander: 5, model: 'q_shadow_troll', ex: 'A troll made of living shadow. It glitters with stolen light.',
    combat: { lvl: 32, hp: 38, att: 28, str: 30, def: 24, maxHit: 5, aggressive: true, aggroRange: 4, leash: 12 }, respawn: 35,
    drops: { always: [['bones', 1]], table: [[4, 'coins', 20, 150], [2, 'coal', 1, 3], [1, 'iron_ore', 1, 2], [3, null]] },
  });
  api.onNpcDeath((npc, killer) => {
    if (npc.def.type !== 'schaduwtrol') return;
    for (const p of lib.playersNear(npc.x, npc.z, 10)) if (st(p) === 2 && shards(p) < 3 && (p === killer || Math.random() < 0.5)) { lib.give(p, 'hart_scherf'); msg(p, `The troll dissolves and leaves a warm shard of the Heart. (${shards(p)}/3)`, 'level'); }
  });

  const dragon = api.spawnNpc({
    name: 'Gaasperdraak', type: 'gaasperdraak', at: LAIR, home: LAIR, wander: 4, model: 'q_swamp_dragon', ex: 'A swamp dragon, green and huge, smelling of rotten reeds. Purely mythical. Hopefully.',
    combat: { lvl: 84, hp: 150, att: 62, str: 60, def: 55, maxHit: 12, speed: 5, aggressive: true, aggroRange: 5, leash: 14, boss: true,
      special: { chance: 0.2, run: (n, t, api2) => {
        api2.say(n, 'n', '*The Gaasperdraak breathes a cloud of swamp fire!*');
        for (const p of lib.playersNear(n.x, n.z, 4)) { if (p.rec.hp <= 0) continue; const hit = Math.min(api2.rand(4, 14), p.rec.hp); p.rec.hp -= hit; msg(p, `You are scorched by swamp fire for ${hit} damage!`, 'warn'); if (p.rec.hp <= 0) api2.die(p, n); }
        return true;
      } } },
    respawn: 150, drops: { always: [['dragon_bones', 1], ['coins', 500]], table: [[4, 'coins', 200, 1500], [2, 'uncut_ruby', 1, 1], [1, 'uncut_diamond', 1, 1], [4, null]], rare: [[64, 'draakschub_schild', 1]] },
  });
  api.onNpcDeath(npc => {
    if (npc !== dragon) return;
    for (const p of lib.playersNear(npc.x, npc.z, 15)) if (st(p) === 3) {
      if (lib.give(p, 'hart_van_zuidoost')) { setQ(p, ID, 4); msg(p, 'The Gaasperdraak collapses and coughs up a glowing core. The shards in your pack fly to it: the Heart of Zuidoost is whole again!', 'level'); }
    }
  });
  return { dragon };
}
