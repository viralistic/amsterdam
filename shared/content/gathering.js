// Shared definitions for the "gathering" content pack: items and world object types.
// Owned by the gathering workstream. See docs/ENGINE.md. Tables (levels, xp, rates) live in ./gathering/data.js.
import { METALS, AXES, PICKAXES, TREES, ROCKS, SPOTS } from './gathering/data.js';

const cap = s => s[0].toUpperCase() + s.slice(1);

export const ITEMS = {
  // ---- woodcutting and mining tools (wieldable, like OSRS)
  ...Object.fromEntries(AXES.map(a => [a.id, {
    name: `${cap(a.metal)} axe`, value: a.value, slot: 'weapon', att: a.bonus[0], str: a.bonus[1], req: a.att > 1 ? a.att : undefined, speed: 5,
    metal: METALS[a.metal], tool: 'axe', ex: a.metal === 'rune' ? 'A powerful axe. The Gemeente would like a word.' : `A woodcutter's axe made of ${a.metal}.`,
  }])),
  ...Object.fromEntries(PICKAXES.map(a => [a.id, {
    name: `${cap(a.metal)} pickaxe`, value: a.value, slot: 'weapon', att: a.bonus[0], str: a.bonus[1], req: a.att > 1 ? a.att : undefined, speed: 5,
    metal: METALS[a.metal], tool: 'pickaxe', ex: `Used for mining. Made of ${a.metal}.`,
  }])),

  // ---- fishing gear
  small_net: { name: 'Small fishing net', value: 5, ex: 'Useful for catching small fish. And shopping trolleys.' },
  fishing_rod: { name: 'Fishing rod', value: 5, ex: 'Useful for bait fishing.' },
  fly_fishing_rod: { name: 'Fly fishing rod', value: 5, ex: 'Useful for fly fishing in the Amstel.' },
  harpoon: { name: 'Harpoon', value: 5, ex: 'Useful for catching really big fish.' },
  lobster_pot: { name: 'Lobster pot', value: 20, ex: 'Useful for catching lobsters.' },
  fishing_bait: { name: 'Fishing bait', value: 3, stack: true, ex: 'For use with a fishing rod. Wriggly.' },
  feather: { name: 'Feather', value: 2, stack: true, ex: 'Used for fly-fishing and fletching arrows.' },

  // ---- logs
  logs: { name: 'Logs', value: 4, wood: '#8a5a2c', ex: 'A number of wooden logs.' },
  oak_logs: { name: 'Oak logs', value: 20, wood: '#a9773c', ex: 'Logs cut from an oak tree.' },
  willow_logs: { name: 'Willow logs', value: 32, wood: '#c39a5a', ex: 'Logs cut from a willow tree.' },
  elm_logs: { name: 'Elm logs', value: 48, wood: '#9a6a48', ex: 'Logs from an Amsterdam elm. Tough, with an interlocking grain.' },
  maple_logs: { name: 'Maple logs', value: 80, wood: '#7a3e1e', ex: 'Logs cut from a maple tree.' },
  yew_logs: { name: 'Yew logs', value: 160, wood: '#6a4a2a', ex: 'Logs cut from a yew tree.' },
  magic_logs: { name: 'Magic logs', value: 320, wood: '#4a6a7a', ex: 'Logs made from magical wood. They tingle.' },

  // ---- ores and gems
  clay: { name: 'Clay', value: 2, ex: 'Some hard dry clay.' },
  copper_ore: { name: 'Copper ore', value: 5, ex: 'This needs refining.' },
  tin_ore: { name: 'Tin ore', value: 5, ex: 'This needs refining.' },
  iron_ore: { name: 'Iron ore', value: 17, ex: 'This needs refining.' },
  silver_ore: { name: 'Silver ore', value: 75, ex: 'This needs refining.' },
  coal: { name: 'Coal', value: 45, ex: 'Hmm, a non-renewable energy source!' },
  gold_ore: { name: 'Gold ore', value: 150, ex: 'This needs refining.' },
  mithril_ore: { name: 'Mithril ore', value: 162, ex: 'This needs refining.' },
  adamantite_ore: { name: 'Adamantite ore', value: 400, ex: 'This needs refining.' },
  runite_ore: { name: 'Runite ore', value: 3200, ex: 'This needs refining.' },
  uncut_sapphire: { name: 'Uncut sapphire', value: 25, ex: 'An uncut sapphire.' },
  uncut_emerald: { name: 'Uncut emerald', value: 50, ex: 'An uncut emerald.' },
  uncut_ruby: { name: 'Uncut ruby', value: 100, ex: 'An uncut ruby.' },
  uncut_diamond: { name: 'Uncut diamond', value: 200, ex: 'An uncut diamond. The Amsterdam diamond cutters would love this.' },

  // ---- raw fish (cooked by the production pack)
  raw_shrimps: { name: 'Raw shrimps', value: 5, ex: 'I should try cooking this.' },
  raw_anchovies: { name: 'Raw anchovies', value: 15, ex: 'I should try cooking this.' },
  raw_trout: { name: 'Raw trout', value: 20, ex: 'I should try cooking this.' },
  raw_salmon: { name: 'Raw salmon', value: 50, ex: 'I should try cooking this.' },
  raw_pike: { name: 'Raw pike', value: 25, ex: 'A snoek, fresh from the canal. I should cook it first.' },
  raw_eel: { name: 'Raw eel', value: 30, ex: 'Paling! Smoked, it is a Volendam classic.' },
  raw_lobster: { name: 'Raw lobster', value: 120, ex: 'I should try cooking this.' },
  raw_swordfish: { name: 'Raw swordfish', value: 200, ex: 'I should try cooking this.' },
  raw_shark: { name: 'Raw shark', value: 300, ex: 'I should try cooking this. Carefully.' },

  // ---- farming
  rake: { name: 'Rake', value: 6, ex: 'Use this to clear weeds.' },
  seed_dibber: { name: 'Seed dibber', value: 6, ex: 'Use this to plant seeds with.' },
  spade: { name: 'Spade', value: 3, ex: 'A slightly muddy spade.' },
  compost: { name: 'Compost', value: 4, ex: 'A bucket of compost. Use it on a farming patch.', leaves: 'bucket' },
  weeds: { name: 'Weeds', value: 1, ex: 'A handful of weeds.' },
  potato_seed: { name: 'Potato seed', value: 1, stack: true, ex: 'Plant three of these in an allotment.' },
  onion_seed: { name: 'Onion seed', value: 1, stack: true, ex: 'Plant three of these in an allotment.' },
  cabbage_seed: { name: 'Cabbage seed', value: 1, stack: true, ex: 'Plant three of these in an allotment.' },
  guam_seed: { name: 'Guam seed', value: 2, stack: true, ex: 'A guam seed. Plant it in a herb patch.' },
  marrentill_seed: { name: 'Marrentill seed', value: 3, stack: true, ex: 'A marrentill seed. Plant it in a herb patch.' },
  tarromin_seed: { name: 'Tarromin seed', value: 5, stack: true, ex: 'A tarromin seed. Plant it in a herb patch.' },
  harralander_seed: { name: 'Harralander seed', value: 8, stack: true, ex: 'A harralander seed. Plant it in a herb patch.' },
  ranarr_seed: { name: 'Ranarr seed', value: 30, stack: true, ex: 'A ranarr seed. Rare and valuable.' },
  potato: { name: 'Potato', value: 1, ex: 'A nice, fresh potato. Patat in the making.' },
  onion: { name: 'Onion', value: 3, heal: 1, ex: 'A strong-smelling onion.' },
  cabbage: { name: 'Cabbage', value: 1, heal: 1, ex: 'Yuck, I don\'t like cabbage. Still, stamppot.' },
  grimy_guam: { name: 'Grimy guam leaf', value: 3, ex: 'I need to clean this herb before I can use it.' },
  grimy_marrentill: { name: 'Grimy marrentill', value: 5, ex: 'I need to clean this herb before I can use it.' },
  grimy_tarromin: { name: 'Grimy tarromin', value: 11, ex: 'I need to clean this herb before I can use it.' },
  grimy_harralander: { name: 'Grimy harralander', value: 15, ex: 'I need to clean this herb before I can use it.' },
  grimy_ranarr: { name: 'Grimy ranarr weed', value: 30, ex: 'I need to clean this herb before I can use it.' },
  flax: { name: 'Flax', value: 5, ex: 'I should use this with a spinning wheel.' },

  // ---- hunter
  bird_snare: { name: 'Bird snare', value: 6, ops: ['Lay'], ex: 'A simple bird catcher.' },
  box_trap: { name: 'Box trap', value: 38, ops: ['Lay'], ex: 'A box with a hinged door. For catching small animals.' },
  raw_bird_meat: { name: 'Raw bird meat', value: 5, ex: 'I should cook this first.' },
  raw_rabbit: { name: 'Raw rabbit', value: 5, ex: 'I should cook this first.' },
  bird_nest: { name: "Bird's nest", value: 50, ops: ['Search'], ex: "A bird's nest. There might be something inside." },
};

const stump = (color, r) => ({ model: 'tree_stump', params: { color, r }, name: 'Tree stump', actions: [], ex: 'This tree has been cut down.' });
const STUMPS = {
  tree_normal: stump('#6a4a2a', 0.35), tree_oak: stump('#5e4428', 0.5), tree_willow: stump('#6e5a3a', 0.45), tree_elm: stump('#4e3a2a', 0.45),
  tree_maple: stump('#5a3a22', 0.45), tree_yew: stump('#4a3020', 0.6), tree_magic: stump('#3a4a5a', 0.5),
};

const empty = { model: 'ore_rock_empty', params: {}, name: 'Rocks', actions: [], ex: 'There is no ore currently available in this rock.' };

const TRAP_EX = { set: 'The trap is set. Now wait quietly...', caught: 'Something is caught in it!', failed: 'The trap has been triggered, but there is nothing in it.' };

export const OBJECTS = {
  ...Object.fromEntries(Object.entries(TREES).map(([id, t]) => [id, {
    name: t.name, actions: ['Chop down'], ex: t.ex, model: id, params: {}, blocks: true, pickHeight: id === 'tree_normal' ? 3 : 4, depleted: STUMPS[id],
  }])),
  ...Object.fromEntries(Object.entries(ROCKS).map(([id, r]) => [id, {
    name: r.name, actions: ['Mine', 'Prospect'], ex: r.ex, model: 'ore_rock', params: { fleck: r.fleck, clay: id === 'rock_clay', seed: id.length }, blocks: true, pickHeight: 1.1, depleted: empty,
  }])),
  ...Object.fromEntries(Object.entries(SPOTS).map(([id, s]) => [id, {
    name: s.name, actions: Object.keys(s.methods), ex: s.ex, model: 'fishing_spot', params: { kind: id }, reach: 2, pickHeight: 0.5,
  }])),
  flax_plant: { name: 'Flax', actions: ['Pick'], ex: 'A flax plant. The blue flowers are lovely.', model: 'flax_plant', params: {}, pickHeight: 1,
    depleted: { model: 'flax_picked', params: {}, name: 'Flax', actions: [], ex: 'Someone has picked this clean.' } },
  ...Object.fromEntries(['set', 'caught', 'failed'].flatMap(st => [
    [`bird_snare_${st}`, { name: 'Bird snare', actions: st === 'set' ? ['Dismantle'] : st === 'caught' ? ['Check'] : ['Dismantle'], ex: TRAP_EX[st], model: 'bird_snare', params: { st }, pickHeight: 0.6 }],
    [`box_trap_${st}`, { name: 'Box trap', actions: st === 'set' ? ['Dismantle'] : st === 'caught' ? ['Check'] : ['Dismantle'], ex: TRAP_EX[st], model: 'box_trap', params: { st }, pickHeight: 0.6 }],
  ])),
  allotment_patch: { name: 'Allotment', actions: ['Rake', 'Harvest', 'Inspect'], ex: 'A volkstuin allotment. Grow potatoes, onions and cabbages here.', model: 'farm_patch', params: { kind: 'allotment' }, size: [3, 3], pickHeight: 0.4 },
  herb_patch: { name: 'Herb patch', actions: ['Rake', 'Pick', 'Inspect'], ex: 'A herb patch in the Hortus. Lovingly labelled in Latin.', model: 'farm_patch', params: { kind: 'herb' }, size: [3, 3], pickHeight: 0.4 },
};
