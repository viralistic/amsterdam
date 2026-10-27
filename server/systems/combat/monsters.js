// Reusable monster definitions for the combat pack. Spawned with util.spawn(MONSTERS, key, at).
// Stats follow old-school conventions: lvl, hp, att/str/def levels, maxHit, speed in ticks (4 = 2.4 s).
// Drop ids from other packs (bones, cowhide, ores...) are skipped by the engine until those packs define them.
const RUNES_LOW = [[6, 'air_rune', 4, 12], [5, 'mind_rune', 3, 9], [4, 'earth_rune', 4, 10], [4, 'fire_rune', 3, 8], [3, 'water_rune', 4, 10]];
const SEEDS = [[4, 'potato_seed', 1, 3], [3, 'onion_seed', 1, 3], [3, 'cabbage_seed', 1, 3], [1, 'guam_seed', 1, 1], [0.4, 'ranarr_seed', 1, 1]];
const HERBS = [[4, 'grimy_guam', 1, 1], [3, 'grimy_marrentill', 1, 1], [3, 'grimy_tarromin', 1, 1], [2, 'grimy_harralander', 1, 1], [1, 'grimy_ranarr', 1, 1]];
const GEMS = [[6, 'uncut_sapphire', 1, 1], [3, 'uncut_emerald', 1, 1], [1.5, 'uncut_ruby', 1, 1], [0.5, 'uncut_diamond', 1, 1]];

// combat stat block helper
const cb = (lvl, hp, att, str, def, maxHit, more = {}) => ({ lvl, hp, att, str, def, maxHit, speed: 4, ...more });

export const MONSTERS = {
  // ================= Vondelpark
  cb_pigeon: {
    name: 'Pigeon', model: 'cb_pigeon', wander: 6, respawn: 20, ex: 'A Dam Square veteran. Fears nothing, eats everything.',
    combat: cb(2, 4, 1, 1, 1, 1),
    drops: { always: [['bones', 1]], table: [[5, 'feather', 5, 10], [5, null]] },
  },
  cb_goose: {
    name: 'Angry goose', model: 'cb_goose', wander: 5, respawn: 25, ex: 'A Canada goose with a grudge against everyone.',
    chatter: ['HONK!', 'Hsssss!'],
    combat: cb(6, 9, 6, 6, 3, 2, { aggressive: true, aggroRange: 3 }),
    drops: { always: [['bones', 1]], table: [[6, 'feather', 8, 20], [3, 'raw_bird_meat', 1, 1], [3, null]], rare: [[256, 'golden_acorn', 1]] },
  },
  cb_park_rat: {
    name: 'Park rat', model: 'cb_rat', wander: 5, respawn: 20, ex: 'It lives on dropped patat.',
    combat: cb(3, 5, 2, 2, 2, 1),
    drops: { always: [['bones', 1]], table: [[3, 'coins', 1, 5], [6, null]] },
  },
  cb_squirrel: {
    name: 'Vondelpark Squirrel', model: 'cb_squirrel', wander: 8, respawn: 100, ex: 'The undisputed ruler of the Vondelpark. Do not make eye contact.',
    chatter: ['*chitter*', 'Chk chk chk!'],
    combat: cb(16, 22, 16, 14, 10, 3, { speed: 3, aggressive: true, aggroRange: 2, defBonus: 10 }),
    drops: { always: [['bones', 1]], rolls: 2, table: [[6, 'coins', 8, 40], ...SEEDS, [3, 'oak_logs', 1, 2], [2, null]], rare: [[64, 'golden_acorn', 1], [128, 'bird_nest', 1]] },
  },

  // ================= farms (Riekermolen / Amstelpark)
  cb_cow: {
    name: 'Cow', model: 'cb_cow', wander: 6, respawn: 25, ex: 'Converts grass into milk and cheese. Moo.',
    chatter: ['Moo.', 'Mooooo.'],
    combat: cb(2, 8, 1, 1, 1, 1),
    drops: { always: [['bones', 1], ['cowhide', 1], ['raw_beef', 1]] },
  },
  cb_chicken: {
    name: 'Chicken', model: 'cb_chicken', wander: 4, respawn: 20, ex: 'Yep, definitely a chicken.',
    chatter: ['Bwak!', 'Tok tok tok.'],
    combat: cb(1, 3, 1, 1, 1, 1),
    drops: { always: [['bones', 1], ['raw_chicken', 1]], table: [[5, 'feather', 5, 15], [3, null]] },
  },
  cb_sheep: {
    name: 'Sheep', model: 'cb_sheep', wander: 5, respawn: 25, ex: 'A woolly Texelaar. Use shears to collect its wool.', actions: ['Shear'],
    chatter: ['Baa!', 'Bèèèh.'],
    combat: cb(2, 6, 1, 1, 2, 1),
    drops: { always: [['bones', 1]], table: [[2, 'wool', 1, 1], [5, null]] },
  },

  // ================= Amsterdamse Bos
  cb_boar: {
    name: 'Wild boar', model: 'cb_boar', wander: 6, respawn: 40, ex: 'Tusks first, questions later.',
    combat: cb(14, 20, 12, 13, 10, 3, { aggressive: true, aggroRange: 3 }),
    drops: { always: [['bones', 1]], table: [[3, 'boar_tusk', 1, 1], [3, 'raw_beef', 1, 1], [8, null]], rare: [[128, 'golden_acorn', 1]] },
  },
  cb_fox: {
    name: 'Fox', model: 'cb_fox', wander: 7, respawn: 35, ex: 'A red fox from the Bos. Sneaky.',
    combat: cb(8, 11, 8, 7, 5, 2, { speed: 3 }),
    drops: { always: [['bones', 1]], table: [[3, 'fox_fur', 1, 1], [2, 'raw_rabbit', 1, 1], [6, null]] },
  },
  cb_bosrover: {
    name: 'Bosrover', look: { g: 0, skin: 2, hair: 1, top: 7, legs: 5, topC: '#3a4a2a' }, eq: { weapon: 'iron_sword', head: 'bosrover_bandana' }, wander: 4, respawn: 45,
    ex: 'A bandit of the Amsterdamse Bos. Robs joggers of their energy gels.', chatter: ['Your money or your life!', 'This is our forest!'],
    combat: cb(22, 28, 20, 20, 16, 4, { aggressive: true, aggroRange: 4, attBonus: 10, defBonus: 12 }),
    drops: {
      always: [['bones', 1]], rolls: 1,
      table: [[10, 'coins', 10, 80], [5, 'bronze_arrow', 8, 20], [3, 'iron_arrow', 5, 12], ...RUNES_LOW, [3, 'iron_sword', 1, 1], [2, 'iron_helm', 1, 1], ...HERBS, [2, 'coin_pouch', 1, 3], [4, null]],
      rare: [[40, 'bosrover_bandana', 1], [200, 'uncut_sapphire', 1]],
    },
  },
  cb_bosrover_boss: {
    name: 'Bosrover Hoofdman', look: { g: 0, skin: 1, hair: 6, top: 7, legs: 5, topC: '#2a3a1a' }, eq: { weapon: 'steel_longsword', head: 'bosrover_bandana', shield: 'wooden_shield' }, wander: 3, respawn: 120,
    ex: 'The chief of the forest bandits. Has a very big hat. Well, bandana.', chatter: ['Nobody escapes the Hoofdman!'],
    combat: cb(41, 55, 38, 40, 34, 7, { aggressive: true, aggroRange: 5, attBonus: 25, defBonus: 30 }),
    drops: {
      always: [['bones', 1], ['coins', 150]], rolls: 2,
      table: [[8, 'coins', 50, 250], [4, 'steel_arrow', 10, 25], [3, 'chaos_rune', 3, 8], ...HERBS, ...GEMS, [3, 'steel_longsword', 1, 1], [3, 'coin_pouch', 2, 5]],
      rare: [[8, 'bosrover_bandana', 1], [64, 'golden_acorn', 1]],
    },
  },

  // ================= canal ring and city
  cb_sewer_rat: {
    name: 'Sewer rat', model: 'cb_rat', scale: 1.5, wander: 4, respawn: 25, ex: 'Crawled out of a canal drain. It is the size of a small dog.',
    combat: cb(9, 12, 8, 8, 5, 2, { aggressive: true, aggroRange: 2 }),
    drops: { always: [['bones', 1]], table: [[4, 'coins', 2, 18], [2, 'fishing_bait', 3, 8], [1, 'bike_key', 1, 1], [5, null]], rare: [[500, 'canal_ring', 1]] },
  },
  cb_zakkenroller: {
    name: 'Zakkenroller', look: { g: 0, skin: 0, hair: 7, top: 5, legs: 5, topC: '#2a2a32' }, eq: { head: 'beanie' }, wander: 8, respawn: 50,
    ex: 'A fantasy pickpocket. Has your wallet. Had your wallet. Has it again.', chatter: ['Nice phone you got there...', 'Psst!'],
    combat: cb(14, 16, 12, 11, 8, 3, { aggressive: true, aggroRange: 3, speed: 3 }),
    drops: { always: [['bones', 1]], table: [[8, 'coins', 5, 40], [5, 'coin_pouch', 1, 3], [2, 'bike_bell', 1, 1], [2, 'bike_key', 1, 1], [1, 'canal_ring', 1, 1], [4, null]] },
  },
  cb_guard: {
    name: 'Marktwacht', look: { g: 0, skin: 1, hair: 0, top: 5, legs: 5, topC: '#2c3e6a' }, eq: { weapon: 'iron_sword', head: 'iron_helm', shield: 'wooden_shield' }, wander: 3, respawn: 50,
    ex: 'A market guard. Keeps an eye on the stalls, and on you.', actions: ['Pickpocket'],
    combat: cb(28, 30, 22, 22, 22, 4, { attBonus: 14, defBonus: 20, leash: 16 }),
    drops: { always: [['bones', 1]], table: [[10, 'coins', 5, 45], [4, 'iron_arrow', 5, 15], [2, 'steel_arrow', 3, 8], ...RUNES_LOW, [2, 'iron_helm', 1, 1], [3, null]] },
  },
  cb_stadswacht: {
    name: 'Stadswacht', look: { g: 1, skin: 3, hair: 2, top: 5, legs: 5, topC: '#1e2e50' }, eq: { weapon: 'steel_longsword', head: 'iron_helm' }, wander: 5, respawn: 50,
    ex: 'A fantasy city guard of the Museumkwartier.', actions: ['Pickpocket'],
    combat: cb(32, 34, 26, 26, 24, 5, { attBonus: 16, defBonus: 22 }),
    drops: { always: [['bones', 1]], table: [[10, 'coins', 10, 60], [4, 'steel_arrow', 3, 10], [3, 'chaos_rune', 1, 3], ...RUNES_LOW, [2, null]] },
  },

  // ================= Westergasfabriek dungeon
  cb_automaton: {
    name: 'Rusty Automaton', model: 'cb_automaton', wander: 3, respawn: 30, ex: 'A clockwork worker from the old gasworks. It still thinks it is 1885.',
    chatter: ['*clank*', 'WORK. SHIFT. CONTINUES.', '*whirr*'],
    combat: cb(34, 38, 30, 30, 32, 5, { aggressive: true, aggroRange: 4, defBonus: 35 }),
    drops: {
      always: [['scrap_metal', 1]], table: [[8, 'scrap_metal', 1, 3], [5, 'iron_ore', 1, 2], [5, 'coal', 1, 2], [3, 'iron_bar', 1, 1], [2, 'bronze_bar', 1, 2], [4, 'coins', 20, 90], [3, null]],
      rare: [[24, 'brass_gear', 1]],
    },
  },
  cb_gas_wraith: {
    name: 'Gas Wraith', model: 'cb_wraith', wander: 4, respawn: 30, ex: 'A ghost made of old town gas. Do not light a match.',
    chatter: ['Hssssss...', 'Ssssmell the gassss...'],
    combat: cb(46, 44, 40, 10, 34, 7, { style: 'magic', range: 6, aggressive: true, aggroRange: 5, mag: 45, projColor: '#9ee05a' }),
    drops: {
      always: [['ashes', 1]], table: [[6, 'gas_essence', 1, 3], [6, 'fire_rune', 8, 25], [4, 'air_rune', 10, 30], [3, 'chaos_rune', 2, 6], [3, 'coins', 30, 140], [3, null]],
      rare: [[40, 'brass_gear', 1]],
    },
  },
  cb_steam_golem: {
    name: 'Steam Golem', model: 'cb_steam_golem', wander: 2, respawn: 45, ex: 'Iron plates riveted around a boiling heart.',
    chatter: ['*hiss*', 'PRESSURE... RISING...'],
    combat: cb(68, 80, 58, 62, 64, 10, { speed: 5, aggressive: true, aggroRange: 4, defBonus: 70 }),
    drops: {
      always: [['scrap_metal', 2]], table: [[6, 'coal', 2, 5], [4, 'iron_bar', 1, 3], [3, 'steel_bar', 1, 2], [2, 'mithril_ore', 1, 2], [4, 'coins', 60, 260], [3, 'brass_gear', 1, 1], [3, null]],
      rare: [[16, 'steam_core', 1], [800, 'gasbaby', 1]],
    },
  },
  cb_gashouder_golem: {
    name: 'De Gashouder Golem', model: 'cb_gashouder', scale: 1, wander: 3, respawn: 120, ex: 'The gasholder itself, risen up on riveted legs. The boss of the Westergasfabriek.',
    combat: cb(124, 220, 90, 95, 92, 16, { speed: 5, aggressive: true, aggroRange: 9, leash: 20, boss: true, attBonus: 60, defBonus: 90 }),
    drops: {
      always: [['scrap_metal', 5], ['coins', 800]], rolls: 3,
      table: [[8, 'coins', 400, 2500], [6, 'brass_gear', 1, 3], [5, 'gas_essence', 3, 10], [4, 'steel_bar', 3, 8], [3, 'mithril_bar', 2, 5], [3, 'adamant_bar', 1, 3], [3, 'coal', 10, 25], [3, 'steam_core', 1, 1], ...GEMS],
      rare: [[48, 'gashouder_maul', 1], [32, 'steamforged_helm', 1], [300, 'gasbaby', 1]],
    },
  },

  // ================= Wilderness: Borderlands (levels 1-10)
  cb_marsh_imp: {
    name: 'Marsh imp', model: 'cb_imp', wander: 6, respawn: 25, ex: 'A cackling imp from the wild marshes. Pure fantasy, pure annoyance.',
    chatter: ['Hehehe!', 'Shiny for me?'],
    combat: cb(7, 10, 6, 6, 4, 2, { aggressive: true, aggroRange: 3 }),
    drops: { always: [['ashes', 1]], table: [...RUNES_LOW, [4, 'coins', 3, 20], [2, 'bronze_arrow', 5, 15], [2, 'ancient_shard', 1, 1], [5, null]] },
  },
  cb_ruin_rat: {
    name: 'Ruin rat', model: 'cb_rat', scale: 1.2, wander: 5, respawn: 20, ex: 'A scrawny rat that lives in the fantasy ruins.',
    combat: cb(4, 6, 3, 3, 3, 1, { aggressive: true, aggroRange: 2 }),
    drops: { always: [['bones', 1]], table: [[3, 'coins', 1, 8], [1, 'ancient_shard', 1, 1], [6, null]] },
  },
  cb_rubble_goblin: {
    name: 'Rubble goblin', model: 'cb_goblin', wander: 5, respawn: 30, ex: 'A grey-skinned goblin that collects broken stones. It thinks they are coins.',
    chatter: ['Me rocks!', 'Grrrah!'],
    combat: cb(13, 16, 12, 12, 9, 3, { aggressive: true, aggroRange: 3 }),
    drops: { always: [['bones', 1]], table: [[5, 'coins', 5, 35], [3, 'iron_arrow', 3, 10], [3, 'copper_ore', 1, 2], [3, 'tin_ore', 1, 2], [3, 'ancient_shard', 1, 2], [4, null]], rare: [[128, 'ancient_emblem', 1]] },
  },

  // ================= Wilderness: Industrial district (11-20)
  cb_rust_jackal: {
    name: 'Rust jackal', model: 'cb_jackal', wander: 6, respawn: 30, ex: 'A metal-furred jackal. It squeaks when it runs.',
    combat: cb(28, 30, 26, 24, 20, 5, { speed: 3, aggressive: true, aggroRange: 4 }),
    drops: { always: [['bones', 1]], table: [[5, 'coins', 15, 70], [4, 'scrap_metal', 1, 2], [3, 'iron_ore', 1, 2], [2, 'coal', 1, 3], [3, 'ancient_shard', 1, 3], [3, null]] },
  },
  cb_scrap_ogre: {
    name: 'Scrap ogre', model: 'cb_ogre', wander: 4, respawn: 50, ex: 'A huge ogre wearing a car door as armour.',
    chatter: ['OGRE SMASH CAR.', 'Hrrrng.'],
    combat: cb(53, 64, 46, 52, 40, 9, { speed: 6, aggressive: true, aggroRange: 4, defBonus: 30 }),
    drops: { always: [['big_bones', 1]], table: [[6, 'coins', 50, 300], [4, 'steel_bar', 1, 2], [3, 'mithril_ore', 1, 2], [3, 'iron_bar', 2, 4], [4, 'ancient_shard', 2, 5], ...GEMS, [3, null]], rare: [[96, 'ancient_emblem', 1]] },
  },
  cb_rubble_lurker: {
    name: 'Rubble lurker', model: 'cb_lurker', wander: 3, respawn: 60, leash: 10, ex: 'It was hiding under the rubble. Ambush!',
    combat: cb(35, 36, 32, 30, 24, 6, { aggressive: true, aggroRange: 6, speed: 4 }),
    drops: { always: [['bones', 1]], table: [[5, 'coins', 30, 150], [4, 'chaos_rune', 2, 6], [3, 'ancient_shard', 2, 4], [3, 'coin_pouch', 1, 2], [3, null]] },
  },

  // ================= Wilderness: Central danger zone (21-40)
  cb_concrete_troll: {
    name: 'Concrete troll', model: 'cb_troll', wander: 4, respawn: 60, ex: 'A fantasy troll of living concrete. It regrets nothing.',
    chatter: ['GRAAAH!', 'You... small.'],
    combat: cb(86, 95, 72, 76, 70, 13, { speed: 5, aggressive: true, aggroRange: 5, attBonus: 40, defBonus: 60 }),
    drops: {
      always: [['big_bones', 1], ['ancient_shard', 3]], rolls: 2,
      table: [[8, 'coins', 200, 1200], [5, 'ancient_shard', 3, 10], [4, 'adamantite_ore', 1, 3], [3, 'mithril_bar', 2, 4], [2, 'adamant_bar', 1, 2], [1, 'runite_ore', 1, 1], [1, 'rune_bar', 1, 1], ...GEMS, [3, 'grimy_ranarr', 1, 2], [2, 'ranarr_seed', 1, 1]],
      rare: [[40, 'ancient_emblem', 1]],
    },
  },
  cb_shadow_warg: {
    name: 'Shadow warg', model: 'cb_warg', wander: 6, respawn: 50, ex: 'A wolf made of dusk. Its eyes glow like bike lights.',
    chatter: ['Grrrrr...', 'AWOOO!'],
    combat: cb(74, 72, 66, 68, 54, 12, { speed: 3, aggressive: true, aggroRange: 6, attBonus: 30, defBonus: 40 }),
    drops: { always: [['big_bones', 1]], rolls: 1, table: [[6, 'coins', 150, 900], [5, 'ancient_shard', 2, 8], [3, 'raw_shark', 1, 2], ...GEMS, [2, 'adamant_bar', 1, 1], [3, null]], rare: [[60, 'ancient_emblem', 1]] },
  },
  cb_mist_witch: {
    name: 'Mist witch', model: 'cb_witch', wander: 4, respawn: 50, ex: 'A fantasy sorceress who lives in the fog over the ruins.',
    chatter: ['Ssssleep...', 'The fog sees you.'],
    combat: cb(68, 60, 30, 20, 50, 13, { style: 'magic', range: 8, aggressive: true, aggroRange: 7, mag: 80, projColor: '#b070ff' }),
    drops: { always: [['ashes', 1]], rolls: 2, table: [[6, 'chaos_rune', 5, 20], [6, 'fire_rune', 20, 60], [5, 'air_rune', 20, 60], [4, 'coins', 100, 600], [4, 'ancient_shard', 2, 6], [2, 'wizard_hat', 1, 1], [1, 'staff_of_fire', 1, 1], [2, null]], rare: [[50, 'ancient_emblem', 1]] },
  },
  cb_leviathan: {
    name: 'Gaasperplas Leviathan', model: 'cb_leviathan', wander: 2, respawn: 200, leash: 14, ex: 'The legendary (and entirely fictional) beast of the Gaasperplas lake.',
    combat: cb(172, 260, 110, 110, 105, 20, { style: 'ranged', range: 8, speed: 5, aggressive: true, aggroRange: 8, boss: true, attBonus: 80, defBonus: 110, projColor: '#5ad0ff' }),
    drops: {
      always: [['big_bones', 2], ['ancient_shard', 15]], rolls: 3,
      table: [[8, 'coins', 1500, 6000], [6, 'raw_shark', 3, 8], [5, 'raw_swordfish', 4, 10], [4, 'leviathan_scale', 1, 1], [4, 'ancient_shard', 10, 30], [3, 'runite_ore', 1, 3], [2, 'rune_bar', 1, 2], ...GEMS],
      rare: [[100, 'tidal_trident', 1], [20, 'ancient_emblem', 1], [800, 'gaaspje', 1]],
    },
  },

  // ================= Metro tunnels (revenants)
  cb_revenant: {
    name: 'Metro Revenant', model: 'cb_revenant', wander: 5, respawn: 45, ex: 'The ghost of a fantasy commuter who missed the last metro. In 1977.',
    chatter: ['Mind the gap...', 'Ssstation closed...', 'Inchecken...'],
    combat: cb(52, 50, 48, 46, 40, 8, { aggressive: true, aggroRange: 5, attBonus: 20, defBonus: 30 }),
    drops: {
      always: [['revenant_ether', 3]], rolls: 1,
      table: [[8, 'revenant_ether', 2, 12], [6, 'coins', 100, 600], [4, 'ancient_shard', 2, 6], [3, 'mithril_bar', 1, 2], [2, 'adamantite_ore', 1, 2], ...GEMS, [2, null]],
      rare: [[1200, 'revenant_blade', 1], [80, 'ancient_emblem', 1]],
    },
  },
  cb_revenant_conductor: {
    name: 'Revenant Conductor', model: 'cb_rev_conductor', wander: 4, respawn: 60, ex: 'It still checks tickets. Your OV-chipkaart is not valid in the afterlife.',
    chatter: ['Uw vervoersbewijs, alstublieft.', 'Volgende halte... de dood.'],
    combat: cb(98, 96, 80, 60, 72, 15, { style: 'magic', range: 7, aggressive: true, aggroRange: 6, mag: 90, projColor: '#4af0c0', defBonus: 60 }),
    drops: {
      always: [['revenant_ether', 8]], rolls: 2,
      table: [[8, 'revenant_ether', 5, 25], [6, 'coins', 300, 1500], [5, 'ancient_shard', 4, 12], [3, 'adamant_bar', 1, 2], [2, 'runite_ore', 1, 1], [3, 'chaos_rune', 10, 30], ...GEMS],
      rare: [[800, 'revenant_blade', 1], [40, 'ancient_emblem', 1]],
    },
  },
  cb_revenant_knight: {
    name: 'Revenant Knight', model: 'cb_rev_knight', wander: 3, respawn: 80, ex: 'Armour from a fantasy age, haunting the deepest metro tunnel.',
    chatter: ['NONE SHALL PASS... THE TURNSTILE.'],
    combat: cb(126, 150, 115, 118, 110, 19, { speed: 5, aggressive: true, aggroRange: 6, attBonus: 70, defBonus: 110 }),
    drops: {
      always: [['revenant_ether', 15], ['big_bones', 1]], rolls: 2,
      table: [[8, 'revenant_ether', 10, 40], [6, 'coins', 800, 3500], [5, 'ancient_shard', 6, 18], [3, 'rune_bar', 1, 2], [3, 'runite_ore', 1, 2], [2, 'uncut_diamond', 1, 2], [3, 'adamant_bar', 2, 3]],
      rare: [[300, 'revenant_blade', 1], [24, 'ancient_emblem', 1]],
    },
  },

  // ================= hidden lair
  cb_colossus: {
    name: 'The Concrete Colossus', model: 'cb_colossus', wander: 3, respawn: 200, leash: 20, ex: 'A titan of poured concrete and rebar, slumbering beneath the fantasy ruins. The deepest danger of the Wilderness.',
    combat: cb(268, 450, 170, 175, 170, 30, { speed: 6, aggressive: true, aggroRange: 10, boss: true, attBonus: 120, defBonus: 160 }),
    drops: {
      always: [['big_bones', 3], ['ancient_shard', 40], ['coins', 5000]], rolls: 3,
      table: [[8, 'coins', 3000, 15000], [6, 'ancient_shard', 20, 60], [5, 'runite_ore', 3, 8], [4, 'rune_bar', 2, 5], [4, 'uncut_diamond', 2, 4], [3, 'dragon_bones', 3, 8], [3, 'revenant_ether', 30, 80], [2, 'grimy_ranarr', 5, 12]],
      rare: [[64, 'colossus_crusher', 1], [12, 'ancient_emblem', 1], [400, 'little_colossus', 1]],
    },
  },
  cb_rubble_golem: {
    name: 'Rubble golem', model: 'cb_rubble_golem', wander: 2, respawn: 9999, ex: 'A chunk of the Colossus that walked off on its own. While it lives, the Colossus is shielded.',
    combat: cb(90, 60, 70, 70, 60, 10, { aggressive: true, aggroRange: 10, leash: 20 }),
    drops: { table: [[3, 'ancient_shard', 1, 4], [5, null]] },
  },
  cb_gas_puff: {
    name: 'Gas cloud', model: 'cb_wraith', scale: 0.7, wander: 2, respawn: 9999, ex: 'A small gas wraith squeezed out of the Gashouder Golem.',
    combat: cb(40, 30, 35, 10, 20, 5, { style: 'magic', range: 5, aggressive: true, aggroRange: 10, leash: 20, projColor: '#9ee05a' }),
    drops: { table: [[2, 'gas_essence', 1, 2], [5, null]] },
  },
};
