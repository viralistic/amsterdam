// Quest 2: Grachtengordel Ontdekken. Stadsgids Saskia on the Dam sends you around the canal ring; five locals
// each ask a riddle about their spot. Stamps are tracked per player.
const ID = 'grachtengordel';
const STOPS = [
  { key: 'dam', place: 'Dam Square', who: 'Stadsgids Saskia' },
  { key: 'wester', place: 'Westerkerk', who: 'Klokkenluider Klaas' },
  { key: 'bloem', place: 'Bloemenmarkt', who: 'Tulpenkweker Tineke' },
  { key: 'mager', place: 'Magere Brug', who: 'Brugwachter Bart' },
  { key: 'rembrandt', place: 'Rembrandtplein', who: 'Nico de Nachtwachtfan' },
];

export default function grachten(api, lib) {
  const { tile, getQ, setQ } = api;
  const st = p => getQ(p, ID);
  const stamps = p => (lib.qdata(p, ID).stamps ??= {});
  const count = p => STOPS.filter(s => stamps(p)[s.key]).length;

  api.quest({
    id: ID, name: 'Grachtengordel Ontdekken', points: 1,
    start: 'I can start this quest by talking to Stadsgids Saskia on Dam Square.',
    journal: (stage, p) => {
      if (stage === 1) return [
        'Stadsgids Saskia gave me a Grachtenkaart. To earn her canal ring certificate I need a stamp from five locals:',
        ...STOPS.map(s => `${stamps(p)[s.key] ? '[stamped] ' : ''}${s.who} at the ${s.place}${stamps(p)[s.key] ? '' : ' - answer their riddle'}`),
        count(p) === STOPS.length ? 'I have all five stamps! I should show the map to Saskia on the Dam.' : `Stamps: ${count(p)} of ${STOPS.length}.`,
        'If I lose the map, Saskia will give me another one.',
      ];
      return ['I am exploring the canal ring.'];
    },
  });

  // riddle helper: correct answer moves on, wrong answers can be retried
  function riddle(key, intro, q, answers, right, fact) {
    const nodes = {
      start: [
        { if: p => st(p) === 1 && !stamps(p)[key], then: 'ask', else: 'chat' },
      ],
      ask: [
        ...intro,
        { if: p => lib.has(p, 'grachtenkaart'), then: 'riddle', else: 'nomap' },
      ],
      nomap: [{ npc: "You'll need a Grachtenkaart for me to stamp. Stadsgids Saskia on the Dam hands them out." }],
      riddle: [{ npc: q }, { opts: answers.map((a, i) => [a, i === right ? 'right' : 'wrong']) }],
      wrong: [{ npc: 'Nee, helaas! Think about it and come back.' }],
      right: [
        { npc: fact },
        { act: p => { stamps(p)[key] = true; api.touch(); api.sendQuests(p); return null; } },
        { item: 'grachtenkaart', npc: p => `You get a stamp on your Grachtenkaart. (${count(p)} of ${STOPS.length})` },
      ],
    };
    return nodes;
  }

  // Saskia (Dam) starts the quest and asks the first riddle herself
  const saskiaRiddle = riddle('dam', [{ npc: "Let's start with my own square. Every good guide knows this one." }],
    'When the Royal Palace on the Dam was built in 1648-1665, what was it?',
    ['A royal palace, obviously.', 'The city hall.', 'A cheese market.', 'A prison for bike thieves.'], 1,
    'Correct! It was built as the city hall, the Stadhuis. It only became a royal palace under Louis Napoleon in 1808.');
  lib.npc({ name: 'Stadsgids Saskia', dlg: 'saskia', at: tile(52.37300, 4.89280), look: lib.L(1, 0, 4, 2, 5, { topC: '#f28c00' }), eq: { head: 'beanie' }, wander: 2, chatter: ['Canal tours! Walking tours! Free tours (tips welcome)!'], ex: 'An official city guide with a bright orange umbrella.' }, {
    start: [{ act: p => st(p) === 0 ? 'intro' : st(p) === 1 ? 'mid' : 'done' }],
    intro: [
      { npc: 'Goedemiddag! Welcome to the Dam, the place where Amsterdam began: a dam in the river Amstel, around 1270.' },
      { npc: 'Do you know the Grachtengordel? The ring of canals built in the 17th century: Herengracht, Keizersgracht, Prinsengracht. UNESCO world heritage!' },
      { opts: [["I'd love to explore it.", 'accept'], ['I only came for the cheese.', 'cheese'], ['Not now.', 'end']] },
    ],
    cheese: [{ npc: 'Then you will love the canal ring. There is a cheese shop on every corner. Some corners have two.' }, { opts: [["Okay, I'll explore it.", 'accept'], ['Not now.', 'end']] }],
    accept: [
      { npc: 'Wonderful! Here is a Grachtenkaart. Find five locals who know their spot, answer their question and they will stamp your map.' },
      { act: p => { setQ(p, ID, 1); lib.give(p, 'grachtenkaart'); return null; } },
      { item: 'grachtenkaart', npc: 'Saskia gives you a Grachtenkaart.' },
      { npc: 'Find Klokkenluider Klaas at the Westerkerk, Tulpenkweker Tineke at the Bloemenmarkt, Brugwachter Bart at the Magere Brug and Nico at Rembrandtplein.' },
      { npc: 'And I am the fifth! So, are you ready for my question?' },
      { opts: [['Ready!', 'riddle'], ['Later.', 'end']] },
    ],
    mid: [
      { if: p => !lib.has(p, 'grachtenkaart'), then: 'lost', else: 'mid2' },
    ],
    lost: [{ npc: 'Lost your map? Happens all the time, the wind on the Dam is merciless. Here is a new one. Your stamps are in my notebook too.' }, { act: p => { lib.give(p, 'grachtenkaart'); return 'mid2'; } }],
    mid2: [
      { if: p => !stamps(p).dam, then: 'riddle', else: 'mid3' },
    ],
    mid3: [
      { if: p => count(p) >= STOPS.length, then: 'finish', else: 'more' },
    ],
    more: [{ npc: p => `You have ${count(p)} of ${STOPS.length} stamps. Still to find: ${STOPS.filter(s => !stamps(p)[s.key]).map(s => `${s.who} at the ${s.place}`).join(', ')}.` }],
    finish: [
      { npc: 'All five stamps! You know the Grachtengordel better than most people who live on it.' },
      { npc: "Here's your certificate, so to speak. Wear it with pride, and please don't fall in the canal. Fifteen thousand bikes are down there already." },
      { act: p => { lib.take(p, 'grachtenkaart'); api.completeQuest(p, ID, { xp: { exploring: 1800, agility: 400 }, items: [['grachten_cape', 1]], coins: 500 }); return 'end'; } },
    ],
    done: [{ npc: 'Ah, my best student! Did you know there are more than 1,500 bridges in Amsterdam? Go count them.' }],
    riddle: saskiaRiddle.riddle, wrong: saskiaRiddle.wrong, right: saskiaRiddle.right,
  });

  lib.npc({ name: 'Klokkenluider Klaas', at: tile(52.37420, 4.88430), look: lib.L(0, 0, 6, 5, 5), eq: { head: 'flat_cap' }, chatter: ['*ding dong*', 'Hear that? That was me.'], ex: 'He looks after the bells of the Westertoren.' }, {
    ...riddle('wester', [{ npc: 'Welcome to the Westerkerk! The tallest church tower in Amsterdam: 85 metres.' }],
      'What sits on top of the Westertoren?',
      ['A golden rooster.', 'A small windmill.', 'The imperial crown of Emperor Maximilian.', 'A giant tulip.'], 2,
      'Exactly! Emperor Maximilian of Austria let Amsterdam use his crown in its coat of arms, in 1489. So the city put it on the tower.'),
    chat: [{ npc: 'The carillon plays every quarter of an hour. Lovely, unless you live next door.' }],
  });
  lib.npc({ name: 'Tulpenkweker Tineke', at: tile(52.36695, 4.89110), look: lib.L(1, 0, 1, 10, 2, { topC: '#d9577e' }), eq: { feet: 'clogs' }, chatter: ['Tulpen! Bollen! Bulbs!'], ex: 'A tulip grower from the bulb fields near Lisse.' }, {
    ...riddle('bloem', [{ npc: 'Welkom op de Bloemenmarkt! Bulbs, tulips, cannabis-shaped fridge magnets...' }],
      'What makes the Bloemenmarkt on the Singel special?',
      ['It only opens on Sundays.', 'The stalls float, on boats in the canal.', 'All flowers are made of cheese.', 'It is underground.'], 1,
      'Yes! It is a floating flower market. In the old days the growers sailed their flowers into town and sold them right from their boats.'),
    chat: [{ npc: 'Bulbs go in the ground in autumn, by the way. Not in your stamppot.' }],
  });
  lib.npc({ name: 'Brugwachter Bart', at: tile(52.36325, 4.90205), look: lib.L(0, 2, 5, 6, 5), eq: { body: 'raincoat' }, chatter: ['Bridge opening! Stay back!'], ex: 'The bridge keeper. He opens the bridge for boats.' }, {
    ...riddle('mager', [{ npc: "The Magere Brug. 'The skinny bridge'. Lit by 1,200 little lamps at night. Romantic, ja?" }],
      'Which river does the Magere Brug cross?',
      ['The IJ.', 'The Amstel.', 'The Rhine.', 'The Singel.'], 1,
      "Correct, the Amstel! The river the whole city is named after: Amstel-dam. They say the bridge was named after two sisters called Mager, but it's probably just because it was so narrow."),
    chat: [{ npc: "If you hear the bell, step back. I've lost three tourists to that bridge. Well, not lost. Inconvenienced." }],
  });
  lib.npc({ name: 'Nico de Nachtwachtfan', dlg: 'nico_nw', at: tile(52.36615, 4.89655), look: lib.L(0, 1, 7, 7, 1), chatter: ['Have you seen the statues? Have you?!'], ex: 'Really, really likes the Night Watch.' }, {
    ...riddle('rembrandt', [{ npc: 'Look at these statues! Twenty-two bronze figures around Rembrandt! Do you know them?' }],
      'Which painting do the bronze statues on Rembrandtplein bring to life?',
      ['The Milkmaid.', 'The Night Watch.', 'The Sunflowers.', 'The Girl with a Pearl Earring.'], 1,
      'De Nachtwacht! Rembrandt painted it in 1642. The real one hangs in the Rijksmuseum. I go and look at it every Tuesday. And Thursday.'),
    chat: [{ npc: 'Did you know the Night Watch is actually a day scene? The varnish turned dark over the centuries. Mind blown.' }],
  });
}
