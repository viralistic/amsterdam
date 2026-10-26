// World content: NPCs, shops, dialogues, item spawns and landmarks, all placed at real Amsterdam coordinates.
import { toTile } from '../shared/geo.js';
import { LANDMARK_MODELS } from '../shared/landmarks.js';
import { ENCLOSURES, ZOO_CENTER, ZOO_ENTRANCE } from '../shared/zoo.js';

const T = (lat, lon) => { const t = toTile(lat, lon); return { x: Math.round(t.x), z: Math.round(t.z) }; };

export const SPAWN = T(52.378, 4.9); // Stationsplein, in front of Amsterdam Centraal

// The ranged guild stands where Club Kaliber is in the Jordaan. RG(dx, dz) is relative to the guild's centre.
const guild = LANDMARK_MODELS.find(l => l.id === 'rangedguild');
export const RG = (dx, dz) => {
  const c = Math.cos(guild.rot), s = Math.sin(guild.rot);
  return { x: Math.round(guild.x + dx * c + dz * s), z: Math.round(guild.z - dx * s + dz * c) };
};

const L = (g, skin, hair, top, legs) => ({ g, skin, hair, top, legs });

export const NPCS = [
  // Around Centraal (the "Lumbridge" of Amsterdam)
  { name: 'Gemeente Gids', at: T(52.37806, 4.90012), look: L(1, 0, 3, 9, 5), talk: 'guide', wander: 1 },
  { name: 'Lost Tourist', at: T(52.37792, 4.89975), look: L(0, 5, 4, 10, 2), talk: 'tourist', wander: 6, chatter: ['Where is ze coffeeshop?', 'So many bicycles!', 'Is this ze Eiffel tower?'] },
  { name: 'Haring Henk', at: T(52.37788, 4.90058), look: L(0, 0, 5, 6, 1), talk: 'henk', shop: 'haring' },
  { name: 'Bankier', at: T(52.37818, 4.89958), look: L(0, 1, 0, 5, 5), talk: 'banker', bank: true },
  { name: 'Fietsendief', at: T(52.3772, 4.8985), look: L(0, 2, 7, 5, 5), talk: 'thief', wander: 8, chatter: ['Nice bike you got there...', 'Psst!'] },
  { name: 'Eend', at: T(52.3775, 4.8992), model: 'duck', talk: 'duck', wander: 5, chatter: ['Kwak!'] },
  // Dam
  { name: 'Kaas Kees', at: T(52.3729, 4.8932), look: L(0, 0, 4, 3, 1), talk: 'kees', shop: 'kaas' },
  { name: 'Stroopwafel Sanne', at: T(52.37322, 4.8938), look: L(1, 0, 2, 11, 1), talk: 'sanne', shop: 'zoet' },
  { name: 'Bankier', at: T(52.3734, 4.8922), look: L(1, 3, 0, 5, 5), talk: 'banker', bank: true },
  // Nieuwmarkt (De Waag)
  { name: 'Wapensmid Willem', at: T(52.3727, 4.9001), look: L(0, 1, 6, 10, 5), talk: 'willem', shop: 'wapens' },
  // Bloemenmarkt
  { name: 'Bloemen Bep', at: T(52.3668, 4.8916), look: L(1, 0, 4, 2, 6), talk: 'bep', shop: 'bloemen' },
  // Rembrandtplein
  { name: 'Rembrandt', at: T(52.3664, 4.8965), look: L(0, 0, 2, 5, 5), talk: 'rembrandt' },
  // Leidseplein
  { name: 'Straatmuzikant', at: T(52.3641, 4.8828), look: L(0, 3, 0, 4, 8), talk: 'muzikant', chatter: ['♪ Tulpen uit Amsterdam ♪', '♪ Aan de Amsterdamse grachten ♪'] },
  // Vondelpark
  { name: 'Eend', at: T(52.358, 4.8686), model: 'duck', talk: 'duck', wander: 6, chatter: ['Kwak!'] },
  { name: 'Hardloper', at: T(52.3585, 4.8700), look: L(1, 2, 3, 9, 5), talk: 'runner', wander: 12, chatter: ['*puff* *puff*'] },

  // Albert Heijn general stores (blue uniform)
  ...[[52.37790, 4.89915], [52.37270, 4.89050], [52.36870, 4.90100], [52.37780, 4.88220], [52.36180, 4.89070], [52.35770, 4.88080]]
    .map(([lat, lon], i) => ({ name: 'AH Medewerker', at: T(lat, lon), look: { ...L(i % 2, i % 6, (i * 3) % 8, 1, 5), topC: '#00a0e2' }, talk: 'ah', shop: 'ah' })),

  // clothing stores
  { name: 'Kalverstraat Kleding', at: T(52.37000, 4.89160), look: L(1, 0, 3, 11, 5), talk: 'kleding', shop: 'kalverstraat' },
  { name: 'Boetiek Bo', at: T(52.37070, 4.88480), look: L(1, 1, 6, 4, 5), talk: 'boetiek', shop: 'negenstraatjes' },
  { name: 'Marktkoopman Mo', at: T(52.35575, 4.89420), look: L(0, 3, 0, 7, 1), talk: 'markt', shop: 'markt', chatter: ['Jassen! Jassen! Regenjassen!', 'Twee voor een tientje!'] },

  // magic stores
  { name: 'Tovenaar Teun', at: T(52.36760, 4.90190), look: { ...L(0, 0, 5, 1, 1), topC: '#2c3a8c' }, eq: { head: 'wizard_hat', legs: 'wizard_skirt', weapon: 'staff' }, talk: 'teun', shop: 'runes' },
  { name: 'Heks Hennie', at: T(52.37540, 4.90010), look: { ...L(1, 5, 7, 5, 5), topC: '#2a2a2a' }, eq: { head: 'wizard_hat', weapon: 'staff_of_fire' }, talk: 'hennie', shop: 'staffs', chatter: ['Hehehe...', 'Eye of newt, tail of herring...'] },
  { name: 'Magiër Mila', at: T(52.37930, 4.88600), look: { ...L(1, 2, 3, 1, 1), topC: '#5a2d6b' }, eq: { head: 'wizard_hat' }, talk: 'mila', shop: 'magicmix' },

  // ranged guild (Jordaan)
  { name: 'Boogschutter Bram', at: RG(-6, 14), look: L(0, 0, 2, 2, 10), eq: { weapon: 'willow_longbow', head: 'leather_cowl' }, talk: 'bram', shop: 'bows' },
  { name: 'Leerbewerker Lotte', at: RG(6, 14), look: L(1, 0, 1, 10, 10), eq: { body: 'leather_vest' }, talk: 'lotte', shop: 'leather' },
  { name: 'Wedstrijdjury', at: RG(0, 17), look: L(0, 1, 5, 6, 5), eq: { head: 'flat_cap' }, talk: 'judge' },

  // Artis zoo: a keeper at the gate and the animals in their enclosures
  { name: 'Dierenverzorger Dirk', at: { x: Math.round(ZOO_CENTER.x + ZOO_ENTRANCE.x + 4), z: Math.round(ZOO_CENTER.z + ZOO_ENTRANCE.z - 3) }, look: { ...L(0, 0, 3, 2, 10), topC: '#3a5a2a' }, eq: { head: 'flat_cap', feet: 'leather_boots' }, talk: 'zookeeper' },
  ...ENCLOSURES.flatMap(e => Array.from({ length: e.count }, (_, i) => {
    const a = i / e.count * Math.PI * 2, r = Math.min(4, e.radius) * (i % 2 ? 0.5 : 1);
    return {
      name: e.name.replace(/ves$/, 'f').replace(/s$/, ''), model: e.animal, ex: e.ex,
      at: { x: Math.round(e.cx + Math.cos(a) * r), z: Math.round(e.cz + Math.sin(a) * r) },
      home: { x: Math.round(e.cx), z: Math.round(e.cz) }, wander: Math.max(1, e.radius),
      ...(e.animal === 'parrot' ? { talk: 'parrot', chatter: ['Squawk!', 'Lekker!', 'Stroopwafel! Squawk!'] } : {}),
      ...(e.animal === 'wolf' ? { chatter: ['Awoooo!'] } : {}),
    };
  })),
];

export const SHOPS = {
  haring: { name: "Henk's Haringhandel", stock: ['herring', 'bitterbal', 'poffertjes'] },
  kaas: { name: "Kees' Kaaswinkel", stock: ['gouda', 'clogs', 'orange_shirt'] },
  zoet: { name: "Sanne's Stroopwafels", stock: ['stroopwafel', 'poffertjes'] },
  wapens: { name: "Willem's Wapenhandel", stock: ['bronze_dagger', 'iron_sword', 'steel_longsword', 'mithril_scimitar', 'wooden_shield', 'iron_helm', 'leather_jacket'] },
  bloemen: { name: "Bep's Bloemen", stock: ['tulip'] },
  ah: { name: 'Albert Heijn', general: true, stock: ['bread', 'broodje_kaas', 'kroket', 'chocomel', 'stroopwafel', 'gouda', 'bucket', 'hammer', 'tinderbox'] },
  kalverstraat: { name: 'Kalverstraat Kleding', stock: ['denim_jeans', 'black_jeans', 'hoodie', 'striped_shirt', 'orange_shirt', 'sneakers', 'beanie'] },
  negenstraatjes: { name: 'Boetiek Bo (De 9 Straatjes)', stock: ['summer_dress', 'leather_jacket', 'red_trousers', 'flat_cap', 'leather_boots', 'raincoat'] },
  markt: { name: 'Albert Cuyp Kledingkraam', stock: ['raincoat', 'beanie', 'sneakers', 'denim_jeans', 'clogs', 'orange_shirt'] },
  runes: { name: "Teun's Runenwinkel", stock: ['air_rune', 'water_rune', 'earth_rune', 'fire_rune', 'mind_rune', 'chaos_rune'] },
  staffs: { name: "Hennie's Staven & Gewaden", stock: ['staff', 'staff_of_air', 'staff_of_water', 'staff_of_earth', 'staff_of_fire', 'wizard_hat', 'wizard_robe', 'wizard_skirt'] },
  magicmix: { name: "Mila's Magische Molen", stock: ['air_rune', 'mind_rune', 'water_rune', 'staff', 'wizard_hat', 'wizard_robe'] },
  bows: { name: "Bram's Bogen & Pijlen", stock: ['shortbow', 'oak_shortbow', 'willow_longbow', 'maple_shortbow', 'bronze_arrow', 'iron_arrow', 'steel_arrow', 'mithril_arrow'] },
  leather: { name: "Lotte's Leer", stock: ['leather_cowl', 'leather_vest', 'leather_boots'] },
};

// Dialogue scripts. Each node is a list of steps: {npc}, {player}, {opts: [[label, node]]}, {act}, {goto}.
export const DIALOGS = {
  guide: {
    start: [
      { npc: 'Goeiedag, avonturier! Welcome to Amsterdam. Greatest city in the world. Well, after Lumbridge.' },
      { opts: [['How do I get around?', 'move'], ["What's this ghost business?", 'ghost'], ['Can I have some starting gear?', 'kit'], ['Goodbye.', 'end']] },
    ],
    move: [
      { player: 'How do I get around?' },
      { npc: 'Click to walk, just like the old days. Right-click on people and things to see all your options.' },
      { npc: 'Click the boot by your minimap to run. The map button opens a real map of where you are.' },
      { goto: 'start2' },
    ],
    ghost: [
      { player: "What's this ghost business?" },
      { npc: "When you're not physically here, you roam the city as a ghost. Ghosts can walk anywhere, chat and trade." },
      { npc: "But ghosts can't pick things up and can't fight. Their hands pass right through everything." },
      { npc: 'Press the eye orb by your minimap to enter real-life mode. Your character will follow your phone, wherever you walk.' },
      { npc: 'Real adventurers find loot lying in the streets and can challenge other real players nearby to a duel!' },
      { goto: 'start2' },
    ],
    kit: [{ player: 'Can I have some starting gear?' }, { act: 'starter' }],
    kityes: [{ npc: "Here's a bronze dagger, some stroopwafels and a few coins. Don't spend it all on bitterballen." }, { goto: 'start2' }],
    kitno: [{ npc: "I've already given you a starter kit. Don't be greedy, this isn't Zuidas." }, { goto: 'start2' }],
    start2: [{ opts: [['How do I get around?', 'move'], ["What's this ghost business?", 'ghost'], ['Can I have some starting gear?', 'kit'], ['Goodbye.', 'end']] }],
  },
  tourist: {
    start: [
      { npc: 'Excuse me! Do you know where ze coffeeshop is?' },
      { opts: [['Try the canals, follow the smell.', 'canal'], ["Sorry, I'm a ghost.", 'ghost'], ['No idea.', 'end']] },
    ],
    canal: [{ player: 'Try the canals, follow the smell.' }, { npc: 'Ze smell... ah! Zank you! I will also look out for bicycles, yes?' }, { player: 'Always look out for bicycles.' }],
    ghost: [{ player: "Sorry, I'm a ghost." }, { npc: 'AAAAH! A GHOST! ...Wait. Do ghosts know where ze coffeeshop is?' }],
  },
  henk: {
    start: [
      { npc: "Hollandse Nieuwe! Fresh herring! You hold it by the tail and drop it in. Like this. *gulp*" },
      { opts: [["Let's see what you've got.", 'shop'], ['Raw fish? No thanks.', 'no']] },
    ],
    shop: [{ act: 'shop' }],
    no: [{ player: 'Raw fish? No thanks.' }, { npc: 'Suit yourself. More for me.' }],
  },
  kees: {
    start: [{ npc: 'Kaas! Gouda, Edam, Leerdammer... want to buy some?' }, { opts: [['Yes please.', 'shop'], ['No thanks.', 'end']] }],
    shop: [{ act: 'shop' }],
  },
  sanne: {
    start: [{ npc: 'Warm stroopwafels! Put one on your coffee and wait thirty seconds. Trust me.' }, { opts: [['I\'ll take a look.', 'shop'], ['Maybe later.', 'end']] }],
    shop: [{ act: 'shop' }],
  },
  willem: {
    start: [{ npc: "Welcome to the Waag. Back in my day they weighed cheese here. Now I sell weapons. Times change." }, { opts: [['Show me your weapons.', 'shop'], ['Who would I even fight?', 'fight'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
    fight: [{ player: 'Who would I even fight?' }, { npc: 'Other adventurers, of course! But only those who are really here, in the flesh. Ghosts are no fun to hit.' }],
  },
  bep: {
    start: [{ npc: 'Tulips! Lovely tulips! Only slightly cheaper than in 1637.' }, { opts: [['Let me see.', 'shop'], ['No thanks.', 'end']] }],
    shop: [{ act: 'shop' }],
  },
  banker: {
    start: [{ npc: 'Good day, how may I help you?' }, { opts: [["I'd like to access my bank account, please.", 'bank'], ['Never mind.', 'end']] }],
    bank: [{ act: 'bank' }],
  },
  thief: {
    start: [
      { npc: 'Psst. Wanna buy a bike bell? Totally legit. 50 coins.' },
      { opts: [["Sure, here's 50 coins.", 'buy'], ['Is that my bike bell?', 'mine'], ['No thanks.', 'end']] },
    ],
    buy: [{ player: "Sure, here's 50 coins." }, { act: 'buybell' }],
    sold: [{ npc: 'Pleasure doing business. You never saw me.' }],
    broke: [{ npc: "You don't have 50 coins. Come back when you're less broke." }],
    mine: [{ player: 'Is that my bike bell?' }, { npc: "...Whose bike? I don't see any bike. I've never seen a bike in my life." }],
  },
  duck: { start: [{ npc: 'Kwak!' }, { player: '...' }, { npc: 'KWAK!' }] },
  rembrandt: {
    start: [{ npc: 'I am Rembrandt van Rijn. Hold still, I am painting you.' }, { player: 'How long will it take?' }, { npc: 'Oh, about two years. Also, your nose is a bit big. Not my fault.' }],
  },
  muzikant: {
    start: [{ npc: '♪ Tulpen uit Amsterdam ♪ Got a few coins for a poor musician?' }, { opts: [["Here's 5 coins.", 'tip'], ['Sorry, no.', 'end']] }],
    tip: [{ player: "Here's 5 coins." }, { act: 'tip' }],
    thanks: [{ npc: 'Dank je wel! This next one is for you. ♪ Aan de Amsterdamse grachten ♪' }],
    poor: [{ npc: "You don't have 5 coins? Here, I'd give you some, but I don't have any either." }],
  },
  runner: { start: [{ npc: "*puff* Can't talk... *puff* ...doing a lap of the park... *puff*" }] },
  parrot: { start: [{ npc: 'Squawk! Polly wil een stroopwafel!' }, { player: 'Sorry, I ate them all.' }, { npc: 'SQUAWK!' }] },
  zookeeper: {
    start: [{ npc: "Welkom in Artis! Founded in 1838, the oldest zoo in the Netherlands. Mind the fences, the animals don't like visitors in their enclosures." }, { opts: [['Which animals do you have?', 'animals'], ['Can I feed them?', 'feed'], ['Bye.', 'end']] }],
    animals: [{ player: 'Which animals do you have?' }, { npc: 'Penguins, monkeys, gorillas, flamingos, parrots, wolves, lions, zebras, elephants, giraffes and camels. Follow the paths and you will find them all.' }],
    feed: [{ player: 'Can I feed them?' }, { npc: 'Absolutely not. Especially not the stroopwafels. The parrot has a problem.' }],
  },
  ah: {
    start: [{ npc: 'Goedendag! Welkom bij Albert Heijn. Heeft u een bonuskaart?' }, { opts: [["Let's see what you sell.", 'shop'], ['Do you buy things too?', 'buy'], ["No bonuskaart, sorry.", 'nokaart']] }],
    shop: [{ act: 'shop' }],
    buy: [{ player: 'Do you buy things too?' }, { npc: "We're a general store, so we'll buy almost anything. Not for much, mind you." }, { act: 'shop' }],
    nokaart: [{ player: 'No bonuskaart, sorry.' }, { npc: "Then you pay full price. That's what we call 'tourist price'." }],
  },
  kleding: { start: [{ npc: 'Hoi! Looking for something to wear on the Kalverstraat? Everyone else is.' }, { opts: [['Show me your clothes.', 'shop'], ['Just browsing.', 'end']] }], shop: [{ act: 'shop' }] },
  boetiek: { start: [{ npc: "Welcome to the Negen Straatjes. Everything here is handmade, vintage, or both." }, { opts: [['Show me.', 'shop'], ['Too fancy for me.', 'end']] }], shop: [{ act: 'shop' }] },
  markt: { start: [{ npc: 'Kijken, kijken, niet kopen? No, no, you buy! Best prices on the whole Albert Cuyp!' }, { opts: [["Alright, let's see.", 'shop'], ['No thanks.', 'end']] }], shop: [{ act: 'shop' }] },
  teun: {
    start: [{ npc: "Ah, a budding wizard. Runes, runes, runes! Air, water, earth, fire, and the mind and chaos runes that power them." }, { opts: [['I want to buy some runes.', 'shop'], ['How does magic work?', 'how'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
    how: [{ player: 'How does magic work?' }, { npc: 'Wield a staff and carry runes. In a duel, your staff casts the strongest spell you know and have runes for.' }, { npc: 'Wind Strike needs an air and a mind rune. A staff of air gives you endless air runes. Heks Hennie on the Zeedijk sells those.' }],
  },
  hennie: { start: [{ npc: 'Hehehe. Staffs, robes and pointy hats, dearie. Very fashionable on the Zeedijk.' }, { opts: [["Let's see them.", 'shop'], ['Are you a witch?', 'witch']] }], shop: [{ act: 'shop' }], witch: [{ player: 'Are you a witch?' }, { npc: "I'm a licensed independent magic retailer, thank you very much." }] },
  mila: { start: [{ npc: 'Welkom in de Magische Molen. A little bit of everything for the Jordaan wizard.' }, { opts: [['Show me.', 'shop'], ['Bye.', 'end']] }], shop: [{ act: 'shop' }] },
  bram: {
    start: [{ npc: 'Welcome to the Kaliber Ranged Guild! Bows, arrows, the lot. Wield a bow, put arrows in your quiver, and let fly.' }, { opts: [["I'd like to buy something.", 'shop'], ['How does ranged combat work?', 'how'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
    how: [{ player: 'How does ranged combat work?' }, { npc: 'Wield a bow and wield your arrows too. Each shot uses an arrow. Better arrows hit harder, better bows hit more often.' }],
  },
  lotte: { start: [{ npc: 'Leather armour, made right here in the guild. Light enough to run in, tough enough to stop a stray arrow. Mostly.' }, { opts: [['Show me.', 'shop'], ['Bye.', 'end']] }], shop: [{ act: 'shop' }] },
  judge: {
    start: [{ npc: 'Welcome to the archery competition! 10 coins for 10 shots at the targets. The better you shoot, the bigger the prize.' }, { opts: [["I'll have a go.", 'play'], ['What do I win?', 'prize'], ['No thanks.', 'end']] }],
    play: [{ player: "I'll have a go." }, { act: 'archery' }],
    prize: [{ player: 'What do I win?' }, { npc: 'Ranged experience, and coins for a good score. A bullseye is worth 100 points. Bring your own bow!' }, { goto: 'start2' }],
    start2: [{ opts: [["I'll have a go.", 'play'], ['No thanks.', 'end']] }],
    nobow: [{ npc: "You'll need to wield a bow first. Bram sells them, just over there." }],
    broke: [{ npc: "It's 10 coins to enter. Come back when you've got them." }],
    started: [{ npc: 'Right, the targets are ready. Take your time... but not too much time.' }],
  },
};

// Fixed ground item spawns. Only real-life players standing there can take them.
export const SPAWNS = [
  { item: 'herring', q: [1, 1], at: T(52.3779, 4.9008), respawn: 120 },
  { item: 'coins', q: [5, 25], at: T(52.37775, 4.89955), respawn: 100 },
  { item: 'coins', q: [10, 60], at: T(52.3731, 4.8926), respawn: 150 }, // Dam
  { item: 'kings_crown', q: [1, 1], at: T(52.37325, 4.8915), respawn: 6000 }, // Royal Palace
  { item: 'tulip', q: [1, 1], at: T(52.3666, 4.8918), respawn: 100 }, // Bloemenmarkt
  { item: 'bronze_dagger', q: [1, 1], at: T(52.3725, 4.9003), respawn: 300 }, // Nieuwmarkt
  { item: 'stroopwafel', q: [1, 1], at: T(52.3557, 4.8936), respawn: 100 }, // Albert Cuyp
  { item: 'canal_ring', q: [1, 1], at: T(52.3633, 4.9024), respawn: 3000 }, // Magere Brug
  { item: 'clogs', q: [1, 1], at: T(52.3745, 4.884), respawn: 400 }, // Westerkerk
  { item: 'poffertjes', q: [1, 1], at: T(52.358, 4.8686), respawn: 120 }, // Vondelpark
  { item: 'ajax_cape', q: [1, 1], at: T(52.3142, 4.9419), respawn: 2000 }, // Johan Cruijff ArenA
  { item: 'leather_jacket', q: [1, 1], at: T(52.3739, 4.9123), respawn: 1500 }, // NEMO
  { item: 'bike_key', q: [1, 1], at: T(52.3841, 4.9019), respawn: 300 }, // A'DAM Toren
];

// Visiting these in real-life mode grants Exploring xp once.
export const LANDMARKS = [
  { name: 'Amsterdam Centraal', at: T(52.3789, 4.9003) },
  { name: 'Dam Square', at: T(52.3731, 4.8926) },
  { name: 'Nieuwmarkt', at: T(52.3726, 4.9003) },
  { name: 'Rembrandtplein', at: T(52.3664, 4.8965) },
  { name: 'Leidseplein', at: T(52.3641, 4.8828) },
  { name: 'Museumplein', at: T(52.3573, 4.8811) },
  { name: 'Vondelpark', at: T(52.358, 4.8686) },
  { name: 'Westerkerk', at: T(52.3745, 4.884) },
  { name: 'Bloemenmarkt', at: T(52.3667, 4.8916) },
  { name: 'Magere Brug', at: T(52.3633, 4.9024) },
  { name: 'Albert Cuypmarkt', at: T(52.3557, 4.8936) },
  { name: 'NEMO', at: T(52.3739, 4.9123) },
  { name: 'Waterlooplein', at: T(52.3675, 4.902) },
  { name: 'Noordermarkt', at: T(52.3794, 4.8857) },
  { name: "A'DAM Toren", at: T(52.3841, 4.9019) },
  { name: 'Johan Cruijff ArenA', at: T(52.3142, 4.9419) },
];

// Treasure that appears near real-life players to reward walking around.
const TREASURE = [
  [30, 'coins', 5, 40], [8, 'coins', 50, 200], [12, 'stroopwafel'], [10, 'herring'], [8, 'bitterbal'], [8, 'tulip'],
  [6, 'gouda'], [5, 'bike_key'], [4, 'bike_bell'], [4, 'clogs'], [3, 'orange_shirt'], [3, 'bronze_dagger'],
  [2, 'iron_helm'], [2, 'wooden_shield'], [1.5, 'iron_sword'], [0.6, 'steel_longsword'], [0.3, 'canal_ring'], [0.15, 'mithril_scimitar'],
];
const TREASURE_TOTAL = TREASURE.reduce((s, t) => s + t[0], 0);

export function rollTreasure() {
  let r = Math.random() * TREASURE_TOTAL;
  for (const [w, item, lo = 1, hi = lo] of TREASURE) {
    if ((r -= w) <= 0) return { item, q: lo + Math.floor(Math.random() * (hi - lo + 1)) };
  }
  return { item: 'coins', q: 10 };
}
