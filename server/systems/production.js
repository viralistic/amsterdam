// Server logic for the "production" content pack: Firemaking, Cooking, Smithing, Crafting, Fletching, Herblore, Prayer.
// Each skill lives in ./production/<skill>.js; this file wires them to the engine API. See docs/ENGINE.md.
import { HERBS, LOGS } from '../../shared/content/production/data.js';
import firemaking from './production/firemaking.js';
import cooking from './production/cooking.js';
import smithing from './production/smithing.js';
import crafting from './production/crafting.js';
import fletching from './production/fletching.js';
import herblore from './production/herblore.js';
import prayer from './production/prayer.js';
import world from './production/world.js';

export default function register(api) {
  // P is the pack's shared state: one onUse dispatcher and one handler per inventory option.
  const P = { useHandlers: [], itemOps: {} };
  for (const sys of [firemaking, cooking, smithing, crafting, fletching, herblore, prayer, world]) sys(api, P);

  api.onUse((p, u) => {
    for (const h of P.useHandlers) if (h(p, u)) return true;
    return false;
  });
  for (const [name, f] of Object.entries(P.itemOps)) api.itemOp(name, (p, slot, item, def) => { f(p, slot, item, def); });

  // OSRS inventory options on other packs' items: 'Clean' on grimy herbs and 'Light' on logs.
  // Added only when the owning pack did not give the item any options of its own (see docs/requests/production.md).
  const addOp = (id, op) => { const d = api.ITEMS[id]; if (d && !d.ops) d.ops = [op]; };
  for (const h of HERBS) addOp(h.grimy, 'Clean');
  for (const id of Object.keys(LOGS)) addOp(id, 'Light');

  // dev helper: ::prodkit <skill> gives a bundle of materials for testing (FAKE_MAP only)
  if (api.DEV) api.command('prodkit', (p, [what]) => {
    const kits = {
      smith: [['hammer', 1], ['copper_ore', 5], ['tin_ore', 5], ['iron_ore', 5], ['coal', 10], ['bronze_bar', 5], ['gold_bar', 3]],
      craft: [['wool', 3], ['flax', 3], ['clay', 2], ['bucket_of_water', 2], ['needle', 1], ['thread', 5], ['leather', 3], ['chisel', 1], ['uncut_sapphire', 1], ['ring_mould', 1], ['gold_bar', 2], ['sapphire', 1], ['cowhide', 2], ['coins', 100]],
      fletch: [['knife', 1], ['logs', 3], ['bow_string', 2], ['feather', 30], ['bronze_arrowtips', 15]],
      herb: [['grimy_guam', 2], ['vial_of_water', 2], ['eye_of_newt', 2], ['grimy_ranarr', 1], ['snape_grass', 1]],
      cook: [['raw_beef', 3], ['raw_chicken', 2], ['raw_shrimps', 3], ['tinderbox', 1], ['logs', 2]],
      pray: [['bones', 5], ['big_bones', 3], ['dragon_bones', 1]],
    };
    for (const [id, q] of kits[what] || []) if (api.ITEMS[id]) api.invAdd(p, id, q);
    if (!kits[what]) api.msg(p, 'Kits: ' + Object.keys(kits).join(', '));
  });
}
