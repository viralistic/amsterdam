// World object types for the "quests" content pack. Models are registered in public/js/content/quests/models.js.
const O = (name, actions, ex, model, params = {}, extra = {}) => ({ name, actions, ex, model, params, ...extra });

export const OBJECTS = {
  // generic quest furniture
  q_door: O('Door', ['Open'], 'A heavy wooden door.', 'q_door', {}, { blocks: true }),
  q_door_gold: O('Ornate door', ['Open'], 'A gilded door. Very royal, very locked.', 'q_door', { color: '#6a2a1a', trim: '#e0b530' }, { blocks: true }),
  q_hatch: O('Hatch', ['Climb-up'], 'A hatch in the ceiling, reached by a narrow ladder.', 'ladder', {}),
  q_trapdoor: O('Trapdoor', ['Open'], 'A stone slab with an iron ring.', 'q_trapdoor', {}),
  q_crate: O('Crate', ['Search'], 'A dusty wooden crate.', 'q_crate', {}, { blocks: true }),
  q_chest: O('Chest', ['Open'], 'A sturdy chest with iron bands.', 'q_chest', {}, { blocks: true }),
  q_bookcase: O('Bookcase', ['Search'], 'Rows of old books.', 'q_bookcase', {}, { blocks: true }),
  q_desk: O('Desk', ['Search'], 'A writing desk with lots of drawers.', 'q_desk', {}, { blocks: true }),
  q_fireplace: O('Fireplace', ['Search'], 'A marble fireplace. The ashes are still warm.', 'q_fireplace', {}, { blocks: true }),
  q_lectern: O('Logbook', ['Read'], 'The palace visitor logbook on a lectern.', 'q_lectern', {}),
  q_noticeboard: O('Challenge board', ['Read'], 'Today\'s challenges, pinned up with drawing pins.', 'q_noticeboard', {}, { blocks: true }),
  q_banner_red: O('Banner', [], 'A long red banner.', 'q_banner', { color: '#a01c24' }),
  q_banner_orange: O('Banner', [], 'An orange banner with a golden lion.', 'q_banner', { color: '#e06a10' }),
  q_pillar: O('Marble pillar', [], 'Cold, white and very old.', 'q_pillar', {}, { blocks: true }),
  q_candles: O('Candelabra', [], 'Tall candles in a brass stand.', 'q_candles', {}),
  q_barrels: O('Barrels', [], 'Barrels of salted herring and fresh water.', 'q_barrels', {}, { blocks: true }),

  // Welkom in Amsterdam
  q_tut_tree: O('Training elm', ['Chop down'], 'An elm tree the municipality lets beginners practise on.', 'q_tree', { crown: '#4f8a34' }, { blocks: true, depleted: { model: 'q_stump', params: {}, name: 'Tree stump', actions: [], ex: 'It will grow back. Gemeente rules.' } }),
  q_tut_fishspot: O('Fishing spot', ['Net'], 'Little shrimps dart around in the harbour water.', 'q_fishspot', {}),
  q_tut_stove: O('Kookplaat', ['Cook'], 'A camping stove on a market trolley. Good enough for shrimps.', 'q_stove', {}, { blocks: true }),

  // De Gestolen Kroon
  q_throne: O('Throne', ['Sit-on'], 'Not for sitting on. Probably.', 'q_throne', {}, { blocks: true }),
  q_atlas: O('Atlas statue', ['Search'], 'Atlas carries the heavens on his shoulders. Something glints behind his feet.', 'q_atlas', {}, { blocks: true, size: [2, 2] }),
  q_judge_bench: O('Judges\' bench', [], 'The Vierschaar, where the city\'s judges once passed sentence.', 'q_bench', {}, { blocks: true }),
  q_treasure_chest: O('Royal chest', ['Open'], 'The palace treasury chest. Your reward waits inside.', 'q_chest', { color: '#6a2a1a', trim: '#e0b530' }, { blocks: true }),

  // De Nachtwacht Ontwaakt
  q_painting_melkmeisje: O('Painting', ['Inspect', 'Fix plaque'], 'A maid pours milk in a quiet room.', 'q_painting', { scene: 'milk' }, { blocks: true }),
  q_painting_bruidje: O('Painting', ['Inspect', 'Fix plaque'], 'A tender couple in red and gold.', 'q_painting', { scene: 'bride' }, { blocks: true }),
  q_painting_drinker: O('Painting', ['Inspect', 'Fix plaque'], 'A cheerful man raising his glass.', 'q_painting', { scene: 'drinker' }, { blocks: true }),
  q_painting_huisgezin: O('Painting', ['Inspect', 'Fix plaque'], 'A noisy, merry family making music.', 'q_painting', { scene: 'family' }, { blocks: true }),
  q_nachtwacht_frame: O('Empty frame', ['Inspect', 'Restore'], 'A huge empty frame. The Night Watch has walked out of it.', 'q_bigframe', {}, { blocks: true, size: [5, 1] }),
  q_vitrine: O('Display case', ['Search'], 'A glass display case. The militia have rummaged through it.', 'q_vitrine', {}, { blocks: true }),
  q_security_panel: O('Security panel', ['Use'], 'A keypad with four dials. The lasers hum next to it.', 'q_panel', {}, { blocks: true }),
  q_laser_gate: O('Laser grid', ['Pass'], 'Red beams criss-cross the corridor.', 'q_laser', {}, { blocks: true, size: [1, 1] }),
  q_shipmodel: O('Model ship', [], 'A model of the warship William Rex, made in 1698.', 'q_shipmodel', {}, { blocks: true }),
  q_dollhouse: O('Dollhouse', [], 'Petronella Oortman\'s dollhouse. It cost as much as a real canal house.', 'q_dollhouse', {}, { blocks: true }),
  q_ticketdesk: O('Ticket desk', [], 'Closed for the night.', 'q_desk', { color: '#3a3a40' }, { blocks: true }),

  // De Toren van de Westerkerk
  q_clockwork: O('Clockwork', ['Repair', 'Inspect'], 'The tower clock. Something is wedged between the gears.', 'q_clockwork', {}, { blocks: true }),
  q_bell_sol: O('Bell (Sol)', ['Ring'], 'A large carillon bell stamped "SOL".', 'q_bell', { s: 1.0 }, { blocks: true }),
  q_bell_mi: O('Bell (Mi)', ['Ring'], 'A carillon bell stamped "MI".', 'q_bell', { s: 0.85 }, { blocks: true }),
  q_bell_re: O('Bell (Re)', ['Ring'], 'A carillon bell stamped "RE".', 'q_bell', { s: 0.75 }, { blocks: true }),
  q_bell_do: O('Bell (Do)', ['Ring'], 'A small carillon bell stamped "DO".', 'q_bell', { s: 0.65 }, { blocks: true }),
  q_crown_lantern: O('Imperial crown', ['Search'], 'The crown of Emperor Maximilian, on top of the tower. Up close it is enormous.', 'q_crownlantern', {}, { blocks: true }),
  q_tomb: O('Tomb slab', ['Read', 'Pray-at'], 'A worn stone slab in the crypt floor.', 'q_tomb', {}),
  q_altar: O('Altar', ['Pray-at'], 'A simple communion table under the Westertoren.', 'q_altar', {}, { blocks: true }),
  q_organ: O('Organ', [], 'The great organ, with painted shutters.', 'q_organ', {}, { blocks: true, size: [3, 1] }),
  q_rembrandt_plaque: O('Memorial plaque', ['Read'], 'A plaque for Rembrandt van Rijn.', 'q_plaque', {}),

  // Het Betoverde Bos
  q_glowcap: O('Glowing mushrooms', ['Pick'], 'Pale blue mushrooms. They glow when nobody looks.', 'q_glowcap', {}),
  q_ancient_oak: O('Oude Eik', ['Cut branch', 'Inspect'], 'An ancient oak, older than the Bos itself. It hums.', 'q_tree', { crown: '#3a6a2a', big: true }, { blocks: true, size: [2, 2] }),
  q_fairy_ring: O('Fairy ring', ['Perform ritual'], 'A circle of mushrooms in the grass. The air tingles.', 'q_fairyring', {}, { size: [3, 3] }),

  // Uitvinders van NEMO
  q_bike_dynamo: O('Dynamo bike', ['Pedal'], 'A bike on a stand, wired to a battery charger. Very Dutch.', 'q_dynamo', {}, { blocks: true }),
  q_lasercutter: O('Laser cutter', ['Use'], 'Cuts metal into neat shapes. Do not look into the laser.', 'q_lasercutter', {}, { blocks: true }),
  q_gearbox: O('Gearbox', ['Solve'], 'A test rig for gear trains.', 'q_gearbox', {}, { blocks: true }),
  q_workbench: O('Workbench', ['Assemble'], 'Professor Fluks\' workbench, covered in screws and coffee cups.', 'q_workbench', {}, { blocks: true, size: [2, 1] }),
  q_chain_machine: O('Chain reaction', ['Start'], 'Dominoes, marbles, a toy windmill and a rubber duck. All connected.', 'q_chainmachine', {}, { blocks: true, size: [3, 1] }),

  // De Amsterdam
  q_mast: O('Mainmast', ['Hoist sail'], 'The mainmast of the Amsterdam. The sail is furled.', 'q_mast', {}, { blocks: true }),
  q_leak: O('Leak', ['Repair'], 'Water is spraying through a gap in the hull.', 'q_leak', {}),
  q_plank_crate: O('Timber crate', ['Take-plank'], 'Spare oak planks for repairs.', 'q_crate', { color: '#8a6a3a' }, { blocks: true }),
  q_ship_wheel: O('Ship\'s wheel', ['Steer'], 'Actually a whipstaff would be more historical, but this is easier.', 'q_wheel', {}, { blocks: true }),
  q_dragnet: O('Drag net', ['Drag'], 'A heavy net over the side, for hauling up lost cargo.', 'q_dragnet', {}),
  q_cannon: O('Cannon', [], 'A cast-iron cannon. Empty, thankfully.', 'q_cannon', {}, { blocks: true }),

  // Het Hart van Zuidoost
  q_lookout: O('Lookout post', ['Inspect'], 'An old wooden lookout. Black smears cover the ladder.', 'q_lookout', {}, { blocks: true }),
  q_drum_stone: O('Rhythm stone', ['Inspect'], 'A broken stone drum. Shards are missing.', 'q_drumstone', {}, { blocks: true }),

  // side quests
  q_bike: O('Bicycle', ['Search'], 'One of approximately 800,000 bicycles in Amsterdam.', 'q_bike', {}, { blocks: true }),
};
