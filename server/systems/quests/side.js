// Short side quests (Fietsje Kwijt, Stroopwafel Spoed, Tulpenkoorts) and the daily challenge board on the Dam.
export default function side(api, lib) {
  const { tile, getQ, setQ, msg } = api;

  // ================================================================ Fietsje Kwijt
  {
    const ID = 'fiets_kwijt';
    const st = p => getQ(p, ID);
    api.quest({
      id: ID, name: 'Fietsje Kwijt', points: 1,
      start: 'I can start this quest by talking to Student Sem on the Leidseplein.',
      journal: lib.journal(['Student Sem lost his bike. One of approximately 800,000 in this city.'], [
        { at: 1, todo: ['Sem parked his bike "somewhere around the Leidseplein". It is pink, with tulips in the basket and an Ajax sticker. I have his key.', 'I should search the bikes around the square.'], done: 'I found Sem\'s pink bike near the Leidseplein.' },
        { at: 2, todo: ['I should tell Sem where his bike is.'] },
      ]),
    });
    lib.npc({ name: 'Student Sem', dlg: 'sem', at: tile(52.36438, 4.88245), wander: 2, look: lib.L(0, 3, 2, 7, 5), eq: { head: 'beanie', feet: 'sneakers' }, chatter: ['Where did I park it...', 'Fiets? Fiets?!'], ex: 'A student. He has lost his bike. Again.' }, {
      start: [{ act: p => ['s0', 's1', 's2'][st(p)] || 'done' }],
      s0: [
        { npc: 'Bro. BRO. I lost my fiets. I parked it last night after a party and now I have a lecture in twenty minutes.' },
        { player: 'What does it look like?' },
        { npc: 'Pink. Basket full of tulips. And an Ajax sticker on the mudguard. You cannot miss it. Except I missed it. Many times.' },
        { opts: [["I'll look for it.", 'yes'], ['Have you tried the bike depot?', 'depot']] },
      ],
      depot: [{ npc: 'The fietsdepot? If the Gemeente took it, I need fifty euros and a day off. I have neither. Please?' }, { opts: [["Fine, I'll look.", 'yes'], ['Good luck.', 'end']] }],
      yes: [
        { npc: 'Legend! Here is my key. The bikes are all around the square. Check the stickers!' },
        { act: p => { setQ(p, ID, 1); lib.give(p, 'sem_fietssleutel'); return null; } },
        { item: 'sem_fietssleutel', npc: 'Sem gives you his bike key. It has a pink keyring.' },
      ],
      s1: [{ npc: 'Pink, tulips, Ajax sticker. Not Feyenoord. NEVER Feyenoord.' }, { act: p => { if (!lib.has(p, 'sem_fietssleutel')) lib.give(p, 'sem_fietssleutel'); return 'end'; } }],
      s2: [
        { npc: 'You found it?! You are a hero. A fietsheld. Take this, I was going to spend it on a kapsalon, but you deserve it more.' },
        { act: p => { lib.take(p, 'sem_fietssleutel'); api.completeQuest(p, ID, { xp: { agility: 500, exploring: 400 }, coins: 300 }); return 'end'; } },
      ],
      done: [{ npc: 'I bought a bell. And a second lock. And a GPS tracker. And I still forget where I park.' }],
    });
    const bikes = [
      [52.36455, 4.88200, 'A pink bike with tulips in the basket... and a PSV sticker. Close, but no.'],
      [52.36420, 4.88300, 'A black omafiets with tulips in the basket and a Feyenoord sticker. Sem would rather walk.'],
      [52.36470, 4.88280, 'A pink bike, tulips in the basket, an Ajax sticker on the mudguard. This is it!', true],
      [52.36405, 4.88215, 'A pink bike with an empty basket and an Ajax sticker. Somebody took the tulips? No, this lock does not fit.'],
      [52.36445, 4.88330, 'A rusty bike with no saddle, no chain and no hope.'],
    ];
    for (const [la, lo, text, right] of bikes) api.spawnObject({ type: 'q_bike', ...tile(la, lo), rot: Math.random() * 6, data: { bike: { text, right } } });
    lib.on('q_bike', 'Search', (p, obj) => {
      const b = obj.data.bike;
      if (!b) return false;
      if (st(p) !== 1) return msg(p, 'One of approximately 800,000 bicycles in Amsterdam.');
      if (!b.right) return msg(p, b.text);
      if (!lib.has(p, 'sem_fietssleutel')) return msg(p, 'This must be Sem\'s bike, but you need his key to check the lock.');
      setQ(p, ID, 2);
      msg(p, `${b.text} The key fits the lock perfectly.`, 'level');
    });
  }

  // ================================================================ Stroopwafel Spoed
  {
    const ID = 'stroopwafel_spoed';
    const st = p => getQ(p, ID);
    const LIMIT = 500; // ticks (5 minutes)
    const d = p => lib.qdata(p, ID);
    api.quest({
      id: ID, name: 'Stroopwafel Spoed', points: 1,
      start: 'I can start this quest by talking to Bakker Bertus at the Albert Cuyp market.',
      journal: lib.journal(['Bakker Bertus has a delivery for his Oma Truus.'], [
        { at: 1, todo: ['I must bring the box of fresh stroopwafels to Oma Truus in the Sarphatipark before they go cold (about five minutes)!', 'If they go cold, Bertus will bake a new batch.'], done: 'I delivered warm stroopwafels to Oma Truus in the Sarphatipark.' },
        { at: 2, todo: ['I should tell Bakker Bertus his oma got her stroopwafels.'] },
      ]),
    });
    lib.npc({ name: 'Bakker Bertus', dlg: 'bertus', at: tile(52.35590, 4.89310), look: lib.L(0, 0, 3, 0, 5, { topC: '#f4f4f4' }), chatter: ['Verse stroopwafels!', 'Warm from the iron!'], ex: 'A baker with flour up to his elbows.' }, {
      start: [{ act: p => ['s0', 's1', 's2'][st(p)] || 'done' }],
      s0: [
        { npc: 'Stroopwafels, made on the spot! Two thin waffles, syrup in the middle, since 1784 in Gouda. And since 8 this morning on the Albert Cuyp.' },
        { npc: 'Say, could you do me a favour? My Oma Truus sits in the Sarphatipark every day, just east of the market. She wants her stroopwafels warm.' },
        { opts: [['I can deliver them!', 'yes'], ['Not now.', 'end']] },
      ],
      yes: [{ act: p => { start(p); return null; } }, { item: 'stroopwafel_doos', npc: 'Bertus hands you a warm box. "Hup, hup! Before they go cold! Five minutes!"' }],
      s1: [
        { if: p => lib.has(p, 'stroopwafel_doos') && api.tick < d(p).until, then: 's1go', else: 's1redo' },
      ],
      s1go: [{ npc: 'What are you doing here? Go! Sarphatipark, east of the market! They are getting colder by the second!' }],
      s1redo: [{ npc: 'Cold already? Or lost? Ach. Here is a fresh box. Run this time!' }, { act: p => { start(p); return 'end'; } }],
      s2: [
        { npc: 'Oma called me! She says you were very polite and the stroopwafels were perfect. Here, for your trouble.' },
        { act: p => { api.completeQuest(p, ID, { xp: { cooking: 400, agility: 300 }, items: [['stroopwafel', 5]], coins: 200 }); return 'end'; } },
      ],
      done: [{ npc: 'Want a stroopwafel? I always have one spare. For you, always.' }],
    });
    function start(p) {
      setQ(p, ID, 1);
      while (lib.has(p, 'stroopwafel_doos')) lib.take(p, 'stroopwafel_doos');
      lib.give(p, 'stroopwafel_doos');
      d(p).until = api.tick + LIMIT;
      api.touch();
    }
    lib.npc({ name: 'Oma Truus', dlg: 'truus', at: tile(52.35430, 4.89640), look: lib.L(1, 0, 0, 3, 5, { topC: '#8a5a7a' }), chatter: ['Waar blijft die jongen?', 'Kom, eendjes, kom.'], ex: 'Oma Truus, feeding the ducks in the Sarphatipark.' }, {
      start: [{ act: p => st(p) === 1 && lib.has(p, 'stroopwafel_doos') ? (api.tick <= d(p).until ? 'warm' : 'cold') : 'chat' }],
      warm: [
        { npc: 'Oh! Are those from my Bertus? And still warm! What a darling you are. Come, sit. No? Busy busy, you young people.' },
        { act: p => { lib.take(p, 'stroopwafel_doos'); setQ(p, ID, 2); return null; } },
        { npc: "Tell Bertus he's a good boy. And that he should call more often." },
      ],
      cold: [{ npc: 'Ach, these are cold, dear. You can not put a cold stroopwafel on your coffee. Go back to Bertus, he will make new ones.' }, { act: p => { lib.take(p, 'stroopwafel_doos'); return 'end'; } }],
      chat: [{ npc: 'I have fed these ducks for forty years. They are spoiled rotten. Like my grandchildren.' }],
    });
  }

  // ================================================================ Tulpenkoorts
  {
    const ID = 'tulpenkoorts';
    const st = p => getQ(p, ID);
    api.quest({
      id: ID, name: 'Tulpenkoorts', points: 1,
      start: 'I can start this quest by talking to Handelaar Hendrik at the Bloemenmarkt. I will need 5 tulips.',
      journal: lib.journal(['Handelaar Hendrik is trading tulips like it is 1637.'], [
        { at: 1, todo: ['Hendrik will trade a legendary Semper Augustus bulb for 5 tulips. Bloemen Bep sells tulips, right here on the Bloemenmarkt.'] },
      ]),
    });
    lib.npc({ name: 'Handelaar Hendrik', dlg: 'hendrik', at: tile(52.36640, 4.89235), look: lib.L(0, 0, 4, 5, 5, { topC: '#4a2a1a' }), eq: { head: 'flat_cap' }, chatter: ['Bulbs! Rare bulbs! Prices only go up!', 'Invest in tulips!'], ex: 'A tulip trader with a very old-fashioned collar.' }, {
      start: [{ act: p => ['s0', 's1'][st(p)] || 'done' }],
      s0: [
        { npc: 'Psst. Want to get rich? Tulips! In 1637, one bulb of Semper Augustus was worth more than a canal house. And prices can only go up!' },
        { player: 'Only up? Are you sure?' },
        { npc: 'Absolutely. Five ordinary tulips, and I will trade you a genuine Semper Augustus bulb. The investment of the century! The 17th century.' },
        { opts: [["Deal! I'll bring five tulips.", 'yes'], ['That sounds like a bubble.', 'bubble']] },
      ],
      bubble: [{ npc: 'A bubble? Nonsense. Bubbles are for soap. Tulips are forever. Five tulips?' }, { opts: [['Oh, alright.', 'yes'], ['No thanks.', 'end']] }],
      yes: [{ act: p => { setQ(p, ID, 1); return null; } }, { npc: 'Excellent! Bep sells tulips, right over there. Hurry, before the market... I mean, before I change my mind.' }],
      s1: [{ if: p => lib.hasOrMissing(p, 'tulip', 5), then: 'trade', else: 'wait' }],
      wait: [{ npc: p => `You have ${lib.exists('tulip') ? api.invCount(p, 'tulip') : 0} tulips. I need five. Bep sells them, right over there.` }],
      trade: [
        { act: p => { lib.take(p, 'tulip', 5); return null; } },
        { npc: 'Five tulips! Here is your Semper Augustus, the rarest bulb in all of Holland. Congratulations, you are now very rich.' },
        { npc: '*A boy runs past shouting: "The tulip market has crashed! Bulbs are worthless!"*' },
        { npc: '...Well. Every investment carries a risk. Pleasure doing business! No refunds!' },
        { act: p => { api.completeQuest(p, ID, { xp: { farming: 400, exploring: 200 }, items: [['semper_augustus', 1]], text: ['A valuable lesson about bubbles'] }); return 'end'; } },
      ],
      done: [{ npc: 'Have you heard about bitcoin? No? Never mind. Very risky. Not like tulips.' }],
    });
  }

  // ================================================================ Daily challenge board
  const DAAN = tile(52.37332, 4.89292);
  const BOARD = tile(52.37336, 4.89310);
  const DELIVER = [['logs', 10, 'woodcutting'], ['raw_shrimps', 10, 'fishing'], ['copper_ore', 8, 'mining'], ['tin_ore', 8, 'mining'], ['tulip', 5, 'farming'], ['herring', 4, 'cooking'],
    ['bones', 8, 'prayer'], ['oak_logs', 6, 'woodcutting'], ['raw_trout', 6, 'fishing'], ['iron_ore', 6, 'mining'], ['flax', 10, 'crafting'], ['shrimps', 8, 'cooking'], ['bronze_bar', 5, 'smithing'], ['stroopwafel', 5, 'cooking']];
  const XPS = [['woodcutting', 1500], ['fishing', 1500], ['mining', 1500], ['cooking', 1500], ['agility', 1000], ['firemaking', 1200], ['crafting', 1200], ['smithing', 1200], ['thieving', 1000], ['exploring', 2000]];
  const PLACES = [['the Westerkerk', 52.3745, 4.884], ['the Magere Brug', 52.3633, 4.9024], ['the Vondelpark', 52.358, 4.8686], ['NEMO', 52.3739, 4.9123], ['Rembrandtplein', 52.3664, 4.8965],
    ['the Albert Cuyp market', 52.3557, 4.8936], ['the Noordermarkt', 52.3794, 4.8857], ['the Bloemenmarkt', 52.3667, 4.8916], ['Waterlooplein', 52.3675, 4.902], ['the Rijksmuseum', 52.3600, 4.8852], ['Artis', 52.3663, 4.9163], ["A'DAM Toren", 52.3841, 4.9019]];
  const dayKey = () => new Date().toISOString().slice(0, 10);
  const seeded = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
  let cache = null;
  function todaysTasks() {
    const day = dayKey();
    if (cache?.day === day) return cache.tasks;
    const r = seeded('amsescape-' + day);
    const pick = arr => arr[Math.floor(r() * arr.length)];
    const del = DELIVER.filter(([id]) => lib.exists(id));
    const types = ['kill', 'xp', 'visit', ...(del.length ? ['deliver'] : [])];
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    const tasks = types.slice(0, 3).map(t => {
      if (t === 'deliver') { const [id, n, skill] = pick(del); return { t, id, need: n, text: `Deliver ${n} x ${lib.lname(id)} to Daan`, coins: 150 + n * 15, xp: [skill, 300] }; }
      if (t === 'kill') { const n = pick([8, 10, 12, 15]); return { t, need: n, text: `Defeat ${n} monsters anywhere`, coins: 250, xp: ['hitpoints', 400] }; }
      if (t === 'xp') { const [skill, n] = pick(XPS); return { t, skill, need: n, text: `Gain ${n.toLocaleString()} ${skill[0].toUpperCase() + skill.slice(1)} XP`, coins: 300, xp: [skill, 250] }; }
      const [name, la, lo] = pick(PLACES); return { t, place: name, at: tile(la, lo), need: 1, text: `Visit ${name}`, coins: 200, xp: ['exploring', 500] };
    });
    cache = { day, tasks };
    return tasks;
  }
  function state(p) {
    const s = lib.qdata(p, 'daily');
    if (s.day !== dayKey()) { s.day = dayKey(); s.kills = 0; s.visited = 0; s.claimed = [false, false, false]; s.bonus = false; s.base = { ...p.rec.xp }; api.touch(); }
    return s;
  }
  function progress(p, task) {
    const s = state(p);
    if (task.t === 'deliver') return Math.min(task.need, lib.exists(task.id) ? api.invCount(p, task.id) : 0);
    if (task.t === 'kill') return Math.min(task.need, s.kills || 0);
    if (task.t === 'xp') return Math.min(task.need, Math.floor((p.rec.xp[task.skill] || 0) - (s.base?.[task.skill] ?? p.rec.xp[task.skill] ?? 0)));
    return s.visited ? 1 : 0;
  }
  function showBoard(p) {
    const s = state(p);
    const tasks = todaysTasks();
    api.send(p, { t: 'qdaily', date: s.day, bonus: s.bonus, tokens: lib.exists('uitdagingsmunt') ? api.invCount(p, 'uitdagingsmunt') + ((p.rec.bank || []).find(b => b.id === 'uitdagingsmunt')?.q || 0) : 0,
      tasks: tasks.map((t, i) => { const have = progress(p, t); return { text: t.text, have, need: t.need, done: have >= t.need, claimed: s.claimed[i], reward: `${t.coins} coins, ${t.xp[1]} ${t.xp[0]} XP` }; }) });
  }
  api.onNpcDeath((npc, killer) => {
    if (!killer?.rec || !npc.def.combat) return;
    const s = state(killer); s.kills = (s.kills || 0) + 1;
  });
  api.onPlayerTick(p => {
    if (api.tick % 5) return;
    const s = state(p);
    const task = todaysTasks().find(t => t.t === 'visit');
    if (!task || p.inside) return;
    if (!s.visited && api.cheb(p.x, p.z, task.at.x, task.at.z) <= 30) { s.visited = 1; api.touch(); msg(p, `Daily challenge: you visited ${task.place}! Claim your reward from Daan on the Dam.`, 'level'); }
  });
  api.onLogin(p => state(p));
  api.spawnObject({ type: 'q_noticeboard', ...BOARD });
  lib.on('q_noticeboard', 'Read', p => showBoard(p));
  function claim(p) {
    const s = state(p);
    const tasks = todaysTasks();
    let got = 0;
    tasks.forEach((t, i) => {
      if (s.claimed[i] || progress(p, t) < t.need) return;
      if (t.t === 'deliver' && !api.invRemove(p, t.id, t.need)) return;
      s.claimed[i] = true; got++;
      api.giveOrDrop(p, 'coins', t.coins); api.addXp(p, t.xp[0], t.xp[1]);
      msg(p, `Challenge complete: ${t.text}. You receive ${t.coins} coins and ${t.xp[1]} ${t.xp[0]} XP.`, 'level');
    });
    if (!s.bonus && s.claimed.every(Boolean)) { s.bonus = true; api.giveOrDrop(p, 'coins', 500); lib.give(p, 'uitdagingsmunt', 1); msg(p, 'All three daily challenges done! Bonus: 500 coins and a challenge token.', 'level'); }
    api.touch();
    return got;
  }
  lib.npc({ name: 'Uitdager Daan', dlg: 'daan', at: DAAN, wander: 1, look: lib.L(0, 2, 1, 4, 5, { topC: '#e0b530' }), eq: { feet: 'sneakers' }, chatter: ['New challenges every day!', 'Who is up for a challenge?'], ex: 'Daan runs the daily challenge board. Every day something new.' }, {
    start: [
      { npc: 'Hoi! Uitdager Daan. Every day I pin three new challenges on the board. Do them, and come back for your reward.' },
      { opts: [['Show me today\'s challenges.', 'show'], ['I want to claim my rewards.', 'claim'], ['What can I do with challenge tokens?', 'tokens'], ['Bye.', 'end']] },
    ],
    show: [{ act: p => { showBoard(p); return 'stop'; } }],
    claim: [{ act: p => claim(p) ? 'claimed' : 'nothing' }],
    claimed: [{ npc: 'Lekker bezig! Well done. See you tomorrow?' }],
    nothing: [{ npc: 'Nothing to claim yet. Check the board to see how far along you are. Items to deliver must be in your inventory.' }],
    tokens: [
      { npc: 'Finish all three challenges in a day and you earn a token. I trade 3 tokens for 5 golden stroopwafels, or 15 tokens for the Challenger cape.' },
      { opts: [['3 tokens for 5 golden stroopwafels.', 'buy_sw'], ['15 tokens for the Challenger cape.', 'buy_cape'], ['Maybe later.', 'end']] },
    ],
    buy_sw: [{ act: p => { if (!api.invRemove(p, 'uitdagingsmunt', 3)) return 'poor'; lib.give(p, 'gouden_stroopwafel', 5); return 'thanks'; } }],
    buy_cape: [{ act: p => { if (!api.invRemove(p, 'uitdagingsmunt', 15)) return 'poor'; lib.give(p, 'uitdagings_cape', 1); return 'thanks'; } }],
    poor: [{ npc: 'You need more tokens for that. Keep at it!' }],
    thanks: [{ npc: 'Alsjeblieft! Earned with sweat and determination.' }],
  });
}
