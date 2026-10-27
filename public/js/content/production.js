// Client-side models, icons and UI for the "production" content pack. See docs/ENGINE.md.
//  ./production/models.js  station models (fire, range, furnace, anvil, wheels, kiln, altars, NEMO machines)
//  ./production/icons.js   inventory icons for every production item and the prayer book icons
//  ./production/prayer.js  the Prayer tab and the prayer orb (quick-prayers)
import { ITEMS } from '/shared/items.js';
import { HERBS, LOGS } from '/shared/content/production/data.js';
import './production/models.js';
import './production/icons.js';
import './production/prayer.js';

// Same as the server: OSRS 'Clean' on grimy herbs and 'Light' on logs, unless their pack gave them options already.
const addOp = (id, op) => { const d = ITEMS[id]; if (d && !d.ops) d.ops = [op]; };
for (const h of HERBS) addOp(h.grimy, 'Clean');
for (const id of Object.keys(LOGS)) addOp(id, 'Light');
