// Quest 7: Uitvinders van NEMO. Help Professor Fenna Fluks build a pocket teleporter: pedal power, laser-cut
// gears, a gear-train puzzle and final assembly. Reward: the (mostly working) prototype teleporter.
const ID = 'nemo_uitvinders';
const X = 30600, Z = 30000;
const MISFIRE = [[52.3731, 4.8926, 'the Dam'], [52.3664, 4.8965, 'Rembrandtplein'], [52.358, 4.8686, 'the Vondelpark'], [52.3557, 4.8936, 'the Albert Cuyp market'], [52.3794, 4.8857, 'the Noordermarkt']];

export default function nemo(api, lib) {
  const { tile, getQ, setQ, msg } = api;
  const st = p => getQ(p, ID);
  const NEEDS = [['iron_bar', 1], ['logs', 2], ['hammer', 1]];
  const BENCH = [['logs', 2], ['hammer', 1]];
  const benchText = () => BENCH.filter(([id]) => lib.exists(id)).map(([id, n]) => `${n} x ${lib.lname(id)}`).join(', ');
  const needText = () => NEEDS.filter(([id]) => lib.exists(id)).map(([id, n]) => `${n} x ${lib.lname(id)}`).join(', ');

  api.quest({
    id: ID, name: 'Uitvinders van NEMO', points: 2,
    start: 'I can start this quest by talking to Professor Fluks outside NEMO. I will need an iron bar, two logs and a hammer.',
    journal: lib.journal(['Professor Fenna Fluks of NEMO is building a pocket teleporter. She needs an assistant.'], [
      { at: 1, todo: ['I should charge the empty battery on the dynamo bike in the energy lab (east of the workshop). Pedal!'], done: 'I charged the battery with genuine pedal power.' },
      { at: 2, todo: () => [`I should cut a set of gears on the laser cutter in the workshop. It needs ${lib.exists('iron_bar') ? 'an iron bar' : 'some metal'}.`], done: 'I cut a set of gears on the laser cutter.' },
      { at: 3, todo: ['I should test the gear train on the gearbox in the workshop.'], done: 'I worked out the gear train on the test gearbox.' },
      { at: 4, todo: () => [`I should assemble the teleporter at the workbench, with the charged battery, the gears and: ${benchText() || 'nothing else'}.`], done: 'I assembled the prototype teleporter.' },
      { at: 5, todo: ['I should show the prototype to Professor Fluks.'] },
    ]),
  });

  // ---------------------------------------------------------------- interior
  const R = (x0, z0, x1, z1, floor, wall, h = 4) => ({ x0: X + x0, z0: Z + z0, x1: X + x1, z1: Z + z1, floor, wall, h });
  const at = (x, z) => ({ x: X + x, z: Z + z });
  lib.buildInterior({
    id: 'nemo', name: 'NEMO Werkplaats',
    rooms: [R(0, 0, 21, 15, '#c8ccd0', '#2f8a6a', 4), R(23, 0, 35, 15, '#2a2e36', '#2a5a8a', 4)],
    open: [[X + 22, Z + 6, X + 22, Z + 8]], gaps: [[X + 10, Z + 16]],
    deco: [['#e8c020', [X + 0, Z + 14, X + 22, Z + 14, X + 22, Z + 15, X + 0, Z + 15]], ['#d84a2a', [X + 9, Z + 9, X + 13, Z + 9, X + 13, Z + 13, X + 9, Z + 13]], ['#40a060', [X + 26, Z + 3, X + 32, Z + 3, X + 32, Z + 8, X + 26, Z + 8]]],
  });
  const door = tile(52.37360, 4.91170);
  lib.entrance({ ...door, to: at(10, 14), quest: ID, stage: 1, lockedMsg: 'A sign says: "Werkplaats - staff only". Professor Fluks might let you in.', msg: 'You enter the NEMO workshop. It smells of solder and coffee.' });
  lib.exit({ ...at(10, 16), to: tile(52.37355, 4.91168), msg: 'You step back out onto the NEMO square.' });
  api.spawnObject({ type: 'q_workbench', ...at(8, 2) });
  api.spawnObject({ type: 'q_lasercutter', ...at(16, 2) });
  api.spawnObject({ type: 'q_gearbox', ...at(19, 9), rot: -Math.PI / 2 });
  api.spawnObject({ type: 'q_chain_machine', ...at(4, 8), rot: Math.PI / 2 });
  api.spawnObject({ type: 'q_bike_dynamo', ...at(29, 5) });
  api.spawnObject({ type: 'q_bookcase', ...at(1, 1) });
  api.spawnObject({ type: 'q_crate', ...at(34, 14) }); api.spawnObject({ type: 'q_crate', ...at(33, 14) });

  // ---------------------------------------------------------------- NPCs
  const fluks = {
    start: [{ act: p => ['s0', 's1', 's2', 's3', 's4', 's5'][st(p)] || 'sdone' }],
    s0: [
      { npc: 'Hallo! Professor Fenna Fluks, inventor, NEMO science museum. Do you like science? Explosions? Controlled explosions?' },
      { opts: [['I love science!', 'love'], ['What are you inventing?', 'love'], ['Not really.', 'end']] },
    ],
    love: [
      { npc: 'I am building a pocket teleporter! Step in, press the button, and poof, you are somewhere else. Usually where you wanted to go.' },
      { npc: 'But my assistant left to work for a bank. Something about "a stable income". Would you help me build it?' },
      { opts: [["I'd love to help!", 'yes'], ['Usually?', 'usually']] },
    ],
    usually: [{ npc: "Ninety percent of the time! Ninety-five on a good day. The other times you end up in a different square. It's fine. Amsterdam is small." }, { opts: [["Alright, I'll help.", 'yes'], ['No thanks.', 'end']] }],
    yes: [
      { npc: () => `Fantastisch! You will need ${needText() || 'nothing special'}. The workshop is right behind me.` },
      { npc: 'First: power. Take this battery to the dynamo bike in the energy lab and pedal. Green energy! Leg energy!' },
      { act: p => { setQ(p, ID, 1); if (!lib.has(p, 'lege_accu') && !lib.has(p, 'volle_accu')) lib.give(p, 'lege_accu'); return null; } },
      { item: 'lege_accu', npc: 'Professor Fluks gives you an empty battery.' },
    ],
    s1: [{ npc: 'Pedal the dynamo bike in the energy lab, east side of the workshop. Lost the battery? Here, I have spares.' }, { act: p => { if (!lib.has(p, 'lege_accu') && !lib.has(p, 'volle_accu')) lib.give(p, 'lege_accu'); return 'end'; } }],
    s2: [{ npc: () => `Full battery! Now gears. The laser cutter in the workshop will cut them from ${lib.exists('iron_bar') ? 'an iron bar' : 'scrap metal'}. Do not look into the laser with your remaining eye.` }],
    s3: [{ npc: 'Lovely gears. Before we build, test the gear train on the gearbox. Physics first, explosions later.' }],
    s4: [{ npc: () => `Everything ready? Assemble it on my workbench. You need the charged battery, the gears${benchText() ? ', and ' + benchText() : ''}.` }],
    s5: [
      { if: p => lib.has(p, 'prototype_teleporteur'), then: 's5ok', else: 's5lost' },
    ],
    s5lost: [{ npc: 'Where is the prototype? Assemble it on the workbench! Or did you teleport it away already?' }],
    s5ok: [
      { npc: 'It works? It WORKS! Look at the little lights! Do you hear that humming? That is the sound of the future.' },
      { npc: 'Keep it. Field testing is very important. Right-click it to teleport back to NEMO. And if you end up somewhere else, just write it down.' },
      { act: p => { for (const it of ['tandwielen', 'volle_accu', 'lege_accu']) while (lib.has(p, it)) lib.take(p, it); api.completeQuest(p, ID, { xp: { crafting: 2500, smithing: 1200, agility: 600 }, coins: 750, text: ['Prototype teleporter (keep it!)'] }); return 'end'; } },
    ],
    sdone: [
      { npc: 'My favourite assistant! How is the teleporter? Any limbs missing? No? Excellent data.' },
      { if: p => !lib.has(p, 'prototype_teleporteur') && !(p.rec.bank || []).some(b => b.id === 'prototype_teleporteur'), then: 'replace', else: 'end' },
    ],
    replace: [{ npc: 'You lost the prototype? I built another one. Here. Try not to teleport it into the IJ.' }, { act: p => { lib.give(p, 'prototype_teleporteur'); return 'end'; } }],
  };
  lib.npc({ name: 'Professor Fluks', dlg: 'fluks', at: tile(52.37352, 4.91150), wander: 2, look: lib.L(1, 0, 7, 5, 5, { topC: '#f4f4f4' }), eq: { feet: 'sneakers' }, chatter: ['Eureka! No wait, false alarm.', 'Science!'], ex: 'An inventor with singed eyebrows.' }, fluks);
  api.spawnNpc({ name: 'Professor Fluks', talk: 'q_fluks', at: at(12, 4), wander: 3, look: lib.L(1, 0, 7, 5, 5, { topC: '#f4f4f4' }), eq: { feet: 'sneakers' }, ex: 'An inventor with singed eyebrows.' });
  lib.npc({ name: 'Robbie', dlg: 'robbie', at: at(15, 11), wander: 4, model: 'q_robot', chatter: ['Bliep bloep.', 'CALCULATING...', 'Ik ben een robot.'], ex: 'NEMO\'s helper robot. Runs on stroopwafels, allegedly.' }, {
    start: [
      { npc: 'BLIEP. HELLO HUMAN. I AM ROBBIE. I ASSIST WITH SCIENCE.' },
      { opts: [['Any hints about gears?', 'gears'], ['What powers you?', 'power'], ['Bye, Robbie.', 'end']] },
    ],
    gears: [{ npc: 'NEIGHBOURING GEARS TURN IN OPPOSITE DIRECTIONS. A BIG GEAR TURNING A SMALL GEAR MAKES THE SMALL ONE SPIN FASTER. TEETH DIVIDED BY TEETH. BLOEP.' }],
    power: [{ npc: 'SOLAR PANELS ON THE ROOF. AND ONE (1) STROOPWAFEL PER HOUR. THE STROOPWAFEL IS NOT STRICTLY NECESSARY.' }],
  });

  // ---------------------------------------------------------------- objects
  lib.on('q_bike_dynamo', 'Pedal', (p, obj) => {
    if (st(p) !== 1) return msg(p, st(p) > 1 ? 'You pedal a bit for fun. The lights flicker.' : 'You pedal a bit. A light bulb glows. Neat.');
    if (!lib.has(p, 'lege_accu')) return msg(p, 'You need an empty battery to charge. Professor Fluks has one.');
    if (p.rec.energy < 1000) return msg(p, 'You are too tired to pedal. Rest a little first.');
    msg(p, 'You climb on the bike and start pedalling. The meter creeps up...');
    let n = 0;
    api.startAction(p, { first: 1, every: 2, anim: 'craft', obj, name: 'pedal', step: pl => {
      n++;
      pl.rec.energy = Math.max(0, pl.rec.energy - 300);
      api.addXp(pl, 'agility', 15);
      if (n < 5) { msg(pl, `Charge: ${n * 20}%`); return pl.rec.energy > 0; }
      api.invRemove(pl, 'lege_accu', 1); lib.give(pl, 'volle_accu'); setQ(pl, ID, 2);
      msg(pl, 'Charge: 100%! The battery is full.', 'level');
      return false;
    } });
  });
  lib.on('q_lasercutter', 'Use', p => {
    if (st(p) !== 2) return msg(p, st(p) > 2 ? 'You already have your gears.' : 'Best not to touch the laser cutter unsupervised.');
    if (!lib.hasOrMissing(p, 'iron_bar')) return msg(p, 'You need an iron bar to cut gears from.');
    lib.take(p, 'iron_bar');
    lib.give(p, 'tandwielen'); setQ(p, ID, 3); api.addXp(p, 'smithing', 300);
    api.startDialog(p, null, { start: [{ item: 'tandwielen', npc: 'ZZZZZT. The laser traces three perfect gears out of the metal: big, medium and small.' }] }, 'Laser cutter');
  });
  lib.on('q_gearbox', 'Solve', p => {
    if (st(p) !== 3) return msg(p, st(p) > 3 ? 'The gear train turns smoothly.' : 'A board full of pegs for gears.');
    if (!lib.has(p, 'tandwielen')) return msg(p, 'You need the gears from the laser cutter.');
    api.startDialog(p, null, {
      start: [
        { npc: 'The motor turns clockwise. The teleporter dial must ALSO turn clockwise. Gears are placed in a single row, each touching the next.' },
        { npc: 'How many gears do you put in the row (motor gear included)?' },
        { opts: [['2 gears', 'w1'], ['3 gears', 'q2'], ['4 gears', 'w1']] },
      ],
      w1: [{ npc: 'You spin the motor. The dial turns the wrong way and Robbie beeps sadly. (Hint: each gear turns the opposite way from its neighbour.)' }],
      q2: [
        { npc: 'Clockwise, anticlockwise, clockwise. The dial turns the right way!' },
        { npc: 'Now speed. The big motor gear has 40 teeth, the dial gear has 10 teeth. One turn of the motor turns the dial how many times?' },
        { opts: [['A quarter turn', 'w2'], ['Once', 'w2'], ['Four times', 'ok'], ['Forty times', 'w2']] },
      ],
      w2: [{ npc: 'The dial spins at the wrong speed and the whole rig rattles. (Hint: divide the teeth of the big gear by the teeth of the small gear.)' }],
      ok: [{ npc: '40 divided by 10: four turns! The dial whirs at exactly the right speed. Robbie plays a little victory tune.' }, { act: pl => { setQ(pl, ID, 4); api.addXp(pl, 'crafting', 300); return null; } }],
    }, 'Gearbox');
  });
  lib.on('q_workbench', 'Assemble', p => {
    if (st(p) !== 4) return msg(p, st(p) > 4 ? 'Nothing left to assemble.' : 'The workbench is covered in screws, wires and coffee cups.');
    const missing = [['volle_accu', 1], ['tandwielen', 1], ...BENCH].filter(([id, n]) => !lib.hasOrMissing(p, id, n));
    if (missing.length) return msg(p, `You still need: ${missing.map(([id, n]) => `${n} x ${lib.lname(id)}`).join(', ')}.`);
    if (!lib.exists('prototype_teleporteur')) return;
    api.startAction(p, { first: 2, every: 3, anim: 'craft', name: 'assemble', step: pl => {
      pl.qasm = (pl.qasm || 0) + 1;
      if (pl.qasm < 3) { msg(pl, ['You build a casing from the logs...', 'You fit the gears and tap them into place with the hammer...'][pl.qasm - 1]); return true; }
      pl.qasm = 0;
      if (!lib.take(pl, 'volle_accu') || !lib.take(pl, 'tandwielen') || !lib.take(pl, 'logs', 2)) { msg(pl, 'Something is missing.'); return false; }
      lib.give(pl, 'prototype_teleporteur'); setQ(pl, ID, 5); api.addXp(pl, 'crafting', 800);
      msg(pl, 'You connect the battery. The prototype teleporter hums into life!', 'level');
      return false;
    } });
  });
  lib.on('q_chain_machine', 'Start', p => {
    api.startDialog(p, null, { start: [
      { npc: 'You push the first domino. Click-click-click... a marble rolls down a ramp, spins a toy windmill, which pulls a string, which tips a bucket...' },
      { npc: '...which squeezes a rubber duck. KWAK! A little flag pops up: "WETENSCHAP!" Robbie applauds.' },
    ] }, 'Chain reaction');
  });

  // ---------------------------------------------------------------- the reward item
  const home = tile(52.37355, 4.91168);
  api.itemOp('Teleport', (p, slot) => {
    if (p.rec.inv[slot]?.id !== 'prototype_teleporteur') return false;
    if (!api.canTeleport(p)) return;
    const d = lib.qdata(p, ID);
    if ((d.tpAt || 0) > api.now()) return msg(p, `The prototype is still recharging. (${Math.ceil((d.tpAt - api.now()) / 1000)} seconds)`);
    d.tpAt = api.now() + 120_000;
    if (Math.random() < 0.12) {
      const [la, lo, name] = MISFIRE[api.rand(0, MISFIRE.length - 1)];
      const t = tile(la, lo);
      api.teleport(p, t.x, t.z, { inside: false });
      return msg(p, `BZZT-POP! Oeps. The prototype misfires and you land on ${name}. Professor Fluks will want to hear about this.`, 'warn');
    }
    api.teleport(p, home.x, home.z, { inside: false });
    msg(p, 'WHOOSH! You teleport to NEMO. Your hair stands on end.');
  });
  api.itemOp('Check', (p, slot) => {
    if (p.rec.inv[slot]?.id !== 'prototype_teleporteur') return false;
    const d = lib.qdata(p, ID);
    msg(p, (d.tpAt || 0) > api.now() ? `Recharging: ${Math.ceil((d.tpAt - api.now()) / 1000)} seconds left.` : 'The display reads: "READY. Destination: NEMO. Accuracy: probably."');
  });
}
