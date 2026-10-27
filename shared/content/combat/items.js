// Combat pack items: monster uniques, Westergasfabriek materials, Wilderness and boss uniques,
// agility (marks of grace, graceful outfit) and thieving (coin pouches, stall loot).
export const ITEMS = {
  // ---- agility
  mark_of_grace: { name: 'Mark of grace', value: 1, stack: true, ex: 'A token of appreciation from the rooftop runners of Amsterdam.' },
  graceful_hood: { name: 'Graceful hood', value: 1, slot: 'head', def: 3, color: '#3f8f7a', hat: 'cowl', ex: 'Light as a seagull feather.' },
  graceful_cape: { name: 'Graceful cape', value: 1, slot: 'cape', def: 3, color: '#3f8f7a', ex: 'It flutters nicely when you jump over canals.' },
  graceful_top: { name: 'Graceful top', value: 1, slot: 'body', def: 4, color: '#3f8f7a', ex: 'Breathable, quick-drying and very Noord.' },
  graceful_legs: { name: 'Graceful legs', value: 1, slot: 'legs', def: 4, color: '#2f6f5e', ex: 'Stretchy trousers for hopping across houseboats.' },
  graceful_boots: { name: 'Graceful boots', value: 1, slot: 'feet', def: 2, color: '#e8efe6', ex: 'Grippy soles. Rooftop approved.' },

  // ---- thieving
  coin_pouch: { name: 'Coin pouch', value: 1, stack: true, ops: ['Open-all'], ex: 'A pouch of coins. Not yours, technically.' },
  market_silk: { name: 'Market fabric', value: 60, ex: 'A roll of colourful fabric from the Albert Cuyp.' },
  shears: { name: 'Shears', value: 2, ex: 'For shearing sheep. Or very ambitious hedges.' },

  // ---- overworld monster drops
  golden_acorn: { name: 'Golden acorn', value: 2500, ex: 'The Vondelpark Squirrel was hoarding this. Of course it was.' },
  boar_tusk: { name: 'Boar tusk', value: 120, ex: 'A curved tusk from a wild boar of the Amsterdamse Bos.' },
  fox_fur: { name: 'Fox fur', value: 90, ex: 'Soft, red and slightly smelly.' },
  bosrover_bandana: { name: 'Bosrover bandana', value: 300, slot: 'head', def: 2, att: 1, color: '#8a1c1c', hat: 'cap', ex: 'Worn by the bandits of the Amsterdamse Bos.' },

  // ---- Westergasfabriek dungeon
  scrap_metal: { name: 'Scrap metal', value: 25, ex: 'Rusty bits of an old gasworks machine.' },
  brass_gear: { name: 'Brass gear', value: 450, ex: 'A finely cut brass gear. Rare crafting material.' },
  gas_essence: { name: 'Gas essence', value: 300, stack: true, ex: 'The glowing remains of a gas wraith, sealed in a bubble.' },
  steam_core: { name: 'Steam core', value: 2500, ex: 'The still-warm heart of a steam golem. Rare crafting material.' },
  steamforged_helm: { name: 'Steamforged helm', value: 15000, slot: 'head', def: 16, str: 2, metal: '#b08a3a', req: 40, skill: 'defence', ex: 'Brass, steam and stubbornness. Needs 40 Defence.' },
  gashouder_maul: { name: 'Gashouder maul', value: 60000, slot: 'weapon', att: 44, str: 68, twoHanded: true, speed: 6, req: 50, metal: '#6d6152', ex: 'A riveted maul ripped from the Gashouder Golem. Needs 50 Attack.' },
  gasbaby: { name: 'Gasbaby', value: 1, tradeable: false, ex: 'A tiny, friendly cloud of gas. Pet of the Gashouder Golem.' },

  // ---- Wilderness (Zuidoost)
  ancient_shard: { name: 'Ancient shard', value: 500, stack: true, ex: 'A shard of an ancient, forgotten city. Only found in the Wilderness.' },
  revenant_ether: { name: 'Revenant ether', value: 180, stack: true, ex: 'Ghostly fuel. It hums in the metro tunnels.' },
  ancient_emblem: { name: 'Ancient emblem', value: 50000, ex: 'An emblem from the old ruins of the Wilderness. Collectors pay well.' },
  revenant_blade: { name: 'Revenant blade', value: 150000, slot: 'weapon', att: 62, str: 60, req: 60, metal: '#7ac8b8', ex: 'A ghostly scimitar from the metro tunnels. Needs 60 Attack.' },
  leviathan_scale: { name: 'Leviathan scale', value: 8000, ex: 'A slimy, shimmering scale from the beast of the Gaasperplas.' },
  tidal_trident: { name: 'Tidal trident', value: 90000, slot: 'weapon', style: 'magic', att: 2, mag: 22, provides: 'water_rune', req: 50, skill: 'magic', orb: '#2ad0d0', ex: 'Provides endless water runes. Needs 50 Magic.' },
  gaaspje: { name: 'Gaaspje', value: 1, tradeable: false, ex: 'A baby lake beast. It fits in your bath tub. For now.' },
  colossus_crusher: { name: 'Colossus crusher', value: 400000, slot: 'weapon', att: 72, str: 96, twoHanded: true, speed: 6, req: 70, metal: '#a49e90', ex: 'A slab of living concrete on a rebar handle. Needs 70 Attack.' },
  little_colossus: { name: 'Little Colossus', value: 1, tradeable: false, ex: 'A pocket-sized Concrete Colossus. Pet of the hidden lair.' },

  // ---- Johan Cruijff ArenA
  arena_champion_cape: { name: 'ArenA champion cape', value: 1, tradeable: false, slot: 'cape', att: 3, str: 3, def: 3, color: '#c9a227', ex: 'Awarded to the winners of the ArenA tournaments.' },
};
