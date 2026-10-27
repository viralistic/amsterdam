// Quest items and quest rewards for the "quests" content pack. Icons live in public/js/content/quests/icons.js.
// Quest items are untradeable; rewards that need the quest to wear carry `quest`.
const Q = (name, ex, extra = {}) => ({ name, value: 0, ex, tradeable: false, ...extra });

export const ITEMS = {
  // ---- Welkom in Amsterdam
  iamsterdam_shirt: { name: 'I amsterdam shirt', value: 60, slot: 'body', def: 3, color: '#d2122e', stripes: '#f4f4f4', ex: 'I amsterdam. Sometimes I am also lost.' },

  // ---- Grachtengordel Ontdekken
  grachtenkaart: Q('Grachtenkaart', 'A canal ring map with five stamp boxes.'),
  grachten_cape: { name: 'Grachtengordel cape', value: 400, slot: 'cape', def: 3, color: '#1f3f7a', quest: 'grachtengordel', ex: 'Navy blue, like the Herengracht at dusk. Worn by those who know the canal ring.' },

  // ---- De Gestolen Kroon
  paleispas: Q('Paleispas', 'A pass for the Royal Palace, signed by the Hofmaarschalk.'),
  gastenboek_blad: Q('Logbook page', 'Last entry: 23:40, "W. de W., late meeting". Written in green ink.'),
  ge_bonnetje: Q('Torn receipt', 'A Grand Exchange pre-listing: "1 x crown, 25,000 coins". Green ink smudges.'),
  verbrande_brief: Q('Half-burnt letter', '"...the replica is ready on Thursday... nobody ever checks the attic... - W."'),
  moseszaal_sleutel: Q('Moses Hall key', 'A heavy iron key from the Hofdame.'),
  gestolen_kroon: Q('Crown of the Netherlands', 'The real one. Heavier than the decoys on the Dam.', { icon: 'kings_crown' }),
  oranje_sjerp: { name: 'Orange sash', value: 800, slot: 'cape', def: 4, pray: 1, color: '#ff7a00', quest: 'gestolen_kroon', ex: 'Awarded by the palace for services to the crown. Very orange.' },

  // ---- De Nachtwacht Ontwaakt
  depot_sleutel: Q('Depot key', 'Opens the museum depot downstairs.'),
  nw_kippenklauw: Q('Golden claw', 'The chicken claw from the girl in the Night Watch: the emblem of the Kloveniers.'),
  nw_trommel: Q('Militia drum', 'The drum of the drummer at the right of the painting. Still wet.'),
  nw_vaandel: Q('Militia banner', 'The banner carried by the ensign, Jan Visscher Cornelisen.'),
  nw_kruithoorn: Q('Powder horn', 'A musketeer\'s powder horn. Smells of oil paint and gunpowder.'),
  nachtwacht_hoed: { name: 'Captain\'s hat', value: 1500, slot: 'head', def: 6, att: 2, color: '#16161a', hat: 'cap', quest: 'nachtwacht', ex: 'Frans Banninck Cocq\'s broad hat. The varnish is still drying.' },
  ruytenburch_partizaan: { name: 'Ruytenburch partisan', value: 9000, slot: 'weapon', att: 30, str: 32, req: 30, speed: 5, metal: '#e0c870', quest: 'nachtwacht', ex: 'Lieutenant Van Ruytenburch\'s gilded partisan. Painted in 1642, sharpened in 2026.' },

  // ---- De Toren van de Westerkerk
  bladmuziek: Q('Sheet music', 'Four notes are circled: Sol, Mi, Re, Do.'),
  crypte_sleutel: Q('Crypt key', 'A small black key that fell out of the imperial crown on top of the Westertoren.'),
  westerkerk_psalter: { name: 'Westerkerk psalter', value: 1200, slot: 'shield', def: 3, mag: 2, pray: 6, quest: 'westertoren', ex: 'A psalter blessed under the Westertoren. You feel calmer holding it.' },

  // ---- Het Betoverde Bos
  maandauw: Q('Moon dew', 'Dew gathered from glowing mushrooms in the Amsterdamse Bos.', { stack: true }),
  betoverde_tak: Q('Enchanted branch', 'A branch from the Oude Eik. It hums quietly.'),
  zwijnen_slagtand: Q('Corrupted tusk', 'A tusk from the corrupted boar. It\'s cold to the touch.'),
  elfenkring_cape: { name: 'Fairy ring cape', value: 900, slot: 'cape', def: 3, pray: 2, color: '#2f7a3a', quest: 'betoverde_bos', ex: 'Woven from moss by the White Stag\'s friends. The trees trust you now.' },

  // ---- Uitvinders van NEMO
  lege_accu: Q('Empty battery', 'A home-made battery. It needs charging.'),
  volle_accu: Q('Charged battery', 'Full of genuine Dutch pedal power.'),
  tandwielen: Q('Gear set', 'Three precisely cut gears.'),
  blauwdruk: Q('Blueprint', 'Professor Fluks\' plans for a pocket teleporter. Mostly coffee stains.'),
  prototype_teleporteur: { name: 'Prototype teleporter', value: 2000, tradeable: false, ops: ['Teleport', 'Check'], ex: 'Experimental. Professor Fluks says it works "most of the time".' },

  // ---- De Amsterdam
  scheepsplank: Q('Ship plank', 'An oak plank, cut to patch a leak.'),
  voc_kist: Q('VOC chest', 'A sealed chest marked with the VOC monogram. Lost overboard in 1749, apparently.'),
  voc_jas: { name: 'VOC captain\'s coat', value: 1800, slot: 'body', def: 9, color: '#1c2a4a', stripes: '#d8b040', quest: 'de_amsterdam', ex: 'A captain\'s coat from the East India Company replica. Smells of tar and adventure.' },

  // ---- Het Hart van Zuidoost
  schaduwspoor: Q('Shadow trace', 'A sticky black smear left by a shadow creature.'),
  hart_scherf: Q('Heart shard', 'A warm shard of the Heart of Zuidoost. It beats softly.', { stack: true }),
  hart_van_zuidoost: Q('Heart of Zuidoost', 'The Heart, whole again. It beats in time with distant music.'),
  draakschub_schild: { name: 'Dragonscale shield', value: 25000, slot: 'shield', def: 28, req: 40, skill: 'defence', quest: 'hart_zuidoost', ex: 'Made from the scales of the Gaasperdraak. Very hard. Slightly smelly.' },

  // ---- side quests
  sem_fietssleutel: Q('Sem\'s bike key', 'The key to a pink bike with a basket full of tulips. Supposedly.'),
  stroopwafel_doos: Q('Stroopwafel box', 'Fresh stroopwafels for Oma Truus. Hurry, they go cold!'),
  semper_augustus: { name: 'Semper Augustus bulb', value: 1, ex: 'In 1637 this was worth a canal house. Today, about one coin.' },

  // ---- daily challenges
  uitdagingsmunt: { name: 'Challenge token', value: 0, stack: true, tradeable: false, ex: 'Awarded for finishing all three daily challenges. Daan collects these.' },
  gouden_stroopwafel: { name: 'Golden stroopwafel', value: 60, heal: 18, ex: 'Extra syrup, extra gold, extra calories.' },
  uitdagings_cape: { name: 'Challenger cape', value: 500, slot: 'cape', def: 4, color: '#e0b530', tradeable: false, ex: 'Proof that you did your daily chores. Every day.' },
};
