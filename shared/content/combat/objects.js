// Combat pack world objects: dungeon props and hazards, Wilderness signs and entrances, the ArenA,
// agility obstacles and thieving stalls. Client models live in public/js/content/combat/objects.js.
const stall = (name, goods, ex) => ({
  name, actions: ['Steal-from'], ex, model: 'cb_stall', params: { goods }, size: [2, 1], blocks: true, reach: 1,
  depleted: { name, actions: [], ex: 'Someone has helped themselves already.', model: 'cb_stall', params: { goods: 'empty' } },
});
const obstacle = (name, action, model, ex, extra = {}) => ({ name, actions: [action], ex, model, params: {}, ...extra });

export const OBJECTS = {
  // ---- Westergasfabriek
  cb_westergas_entrance: { name: 'Gashouder entrance', actions: ['Enter'], ex: 'A rusted door into the old gasworks. Something clanks inside.', model: 'cb_gas_door', params: {}, size: [2, 1], blocks: true },
  cb_steam_vent: { name: 'Steam vent', actions: ['Inspect'], ex: 'A cracked pipe that vents scalding steam every few seconds. Keep moving.', model: 'cb_vent', params: {} },
  cb_pipes: { name: 'Gas pipes', actions: [], ex: 'Ancient pipes, still hissing.', model: 'cb_pipes', params: {}, size: [1, 3], blocks: true },
  cb_gas_tank: { name: 'Gas tank', actions: [], ex: 'A dented pressure tank. Do not smoke here.', model: 'cb_tank', params: {}, size: [2, 2], blocks: true },
  cb_scrap_pile: {
    name: 'Scrap heap', actions: ['Search'], ex: 'Old machine parts. Some of them might be useful.', model: 'cb_scrap', params: {}, reach: 1,
    depleted: { name: 'Scrap heap', actions: [], ex: 'Picked clean, for now.', model: 'cb_scrap', params: { empty: true } },
  },
  cb_workbench: { name: 'Machinist workbench', actions: ['Craft'], ex: 'A heavy bench with a vice. Brass parts are assembled here.', model: 'cb_bench', params: {}, size: [2, 1], blocks: true },

  // ---- Wilderness
  cb_wild_sign: { name: 'Warning sign', actions: ['Read'], ex: 'A warning sign. Read it.', model: 'cb_warnsign', params: {} },
  cb_ruin_pillar: { name: 'Ruined pillar', actions: [], ex: 'All that is left of a fantasy city that never was.', model: 'cb_ruin', params: { kind: 'pillar' }, blocks: true },
  cb_ruin_wall: { name: 'Crumbling wall', actions: [], ex: 'Overgrown ruins from an older age.', model: 'cb_ruin', params: { kind: 'wall' }, size: [3, 1], blocks: true },
  cb_ambush_rubble: { name: 'Suspicious rubble', actions: [], ex: 'Something shifts underneath.', model: 'cb_rubble', params: {} },
  cb_escape_hatch: { name: 'Emergency exit', actions: ['Escape'], ex: 'A rusty hatch with a green running-man sign. It leads back to the border.', model: 'cb_hatch', params: {} },
  cb_metro_entrance: { name: 'Metro entrance', actions: ['Descend'], ex: 'Stairs down into the haunted metro tunnels.', model: 'cb_metro', params: {}, size: [2, 2] },
  cb_metro_exit: { name: 'Station stairs', actions: ['Climb-up'], ex: 'Back up to daylight.', model: 'stairs', params: {}, size: [2, 2] },
  cb_metro_passage: { name: 'Dark tunnel', actions: ['Walk-through'], ex: 'The tunnel continues into the dark. It gets colder further in.', model: 'cb_tunnelmouth', params: {}, size: [2, 1] },
  cb_tunnel_crawl: { name: 'Collapsed tunnel', actions: ['Squeeze-through'], ex: 'A narrow crawlspace through the rubble. Agility 52 needed.', model: 'cb_agi', params: { kind: 'crawl' } },
  cb_lair_entrance: { name: 'Collapsed bunker', actions: ['Climb-down'], ex: 'A crack in the concrete. Something huge breathes below.', model: 'cb_bunker', params: {}, size: [3, 3] },
  cb_debris: { name: 'Falling debris', actions: [], ex: 'Move!', model: 'cb_debris_mark', params: {} },
  cb_outpost_flag: { name: 'Outpost banner', actions: ['Read'], ex: 'The banner of a safe border outpost.', model: 'cb_flag', params: {} },

  // ---- Johan Cruijff ArenA
  cb_arena_gate: { name: 'ArenA entrance', actions: ['Enter'], ex: 'The players\' tunnel of the Johan Cruijff ArenA. Safe PvP inside!', model: 'cb_arena_gate', params: {}, size: [3, 1], blocks: true },
  cb_arena_board: { name: 'Leaderboard', actions: ['Check'], ex: 'Rankings of the ArenA fighters.', model: 'cb_board', params: {}, size: [2, 1], blocks: true },
  cb_arena_door: { name: 'Pitch gate', actions: ['Enter'], ex: 'Through here to the pitch. Everyone inside can fight, nobody loses items.', model: 'door', params: { color: '#c81e2e' } },

  // ---- agility
  cb_agi_ladder: obstacle('Maintenance ladder', 'Climb', 'cb_agi', 'A ladder up the side of the building.', { params: { kind: 'ladder' } }),
  cb_agi_beam: obstacle('Window-cleaning beam', 'Balance', 'cb_agi', 'A narrow steel beam. Do not look down.', { params: { kind: 'beam' } }),
  cb_agi_gap: obstacle('Gap', 'Jump', 'cb_agi', 'A gap between two roofs.', { params: { kind: 'gap' } }),
  cb_agi_swing: obstacle('Over the Edge swing', 'Swing', 'cb_agi', 'The famous swing at the top of the A\'DAM Toren.', { params: { kind: 'swing' }, size: [2, 2] }),
  cb_agi_wall: obstacle('Low wall', 'Climb-over', 'cb_agi', 'A low wall.', { params: { kind: 'wall' } }),
  cb_agi_rope: obstacle('Zipline', 'Slide', 'cb_agi', 'A steel cable down to the lower roof.', { params: { kind: 'rope' } }),
  cb_agi_drop: obstacle('Roof edge', 'Jump-down', 'cb_agi', 'The way down. Bend your knees.', { params: { kind: 'drop' } }),
  cb_agi_bikerack: obstacle('Bike rack', 'Climb-over', 'cb_agi', 'Hundreds of bikes, all locked to each other.', { params: { kind: 'bikerack' }, size: [1, 1] }),
  cb_agi_railing: obstacle('Canal railing', 'Balance', 'cb_agi', 'A narrow railing along the water.', { params: { kind: 'railing' } }),
  cb_agi_boat: obstacle('Houseboat', 'Hop', 'cb_agi', 'A houseboat with a very flat roof.', { params: { kind: 'boat' }, size: [2, 1] }),
  cb_agi_fence: obstacle('Loose fence', 'Squeeze-through', 'cb_agi', 'A gap in the fence, big enough for an agile adventurer.', { params: { kind: 'fence' } }),
  cb_agi_stones: obstacle('Stepping stones', 'Cross', 'cb_agi', 'Slippery stones across the water.', { params: { kind: 'stones' } }),
  cb_agi_pipe: obstacle('Drain pipe', 'Squeeze-through', 'cb_agi', 'A wide pipe. It smells exactly how you think.', { params: { kind: 'pipe' } }),

  // ---- thieving (Albert Cuypmarkt)
  cb_stall_stroopwafel: stall('Stroopwafel stall', 'stroopwafel', 'Warm stroopwafels. The smell is irresistible.'),
  cb_stall_cheese: stall('Cheese stall', 'cheese', 'Wheels of Gouda and Edam.'),
  cb_stall_fabric: stall('Fabric stall', 'fabric', 'Rolls of colourful fabric.'),
  cb_stall_fish: stall('Fish stall', 'fish', 'Fresh fish on ice.'),
  cb_stall_gem: stall('Gem stall', 'gem', 'Sparkly. Very well guarded.'),

  // ---- farms
  cb_hay: { name: 'Hay bale', actions: [], ex: 'A bale of hay.', model: 'cb_hay', params: {}, blocks: true },
  cb_trough: { name: 'Water trough', actions: [], ex: 'For the cows.', model: 'cb_trough', params: {}, size: [2, 1], blocks: true },
};
