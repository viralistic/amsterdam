// Server logic for the "quests" content pack. See docs/ENGINE.md.
// Each quest lives in server/systems/quests/<name>.js and gets (api, lib). Interiors use x 30000-33999.
import { makeLib } from './quests/lib.js';
import welkom from './quests/welkom.js';
import grachten from './quests/grachten.js';
import kroon from './quests/kroon.js';
import nachtwacht from './quests/nachtwacht.js';
import westertoren from './quests/westertoren.js';
import bos from './quests/bos.js';
import nemo from './quests/nemo.js';
import schip from './quests/schip.js';
import zuidoost from './quests/zuidoost.js';
import side from './quests/side.js';
import annefrank from './quests/annefrank.js';

const QUESTS = { welkom, grachten, kroon, nachtwacht, westertoren, bos, nemo, schip, zuidoost, side, annefrank };

export default async function register(api) {
  const lib = makeLib(api);
  for (const [name, setup] of Object.entries(QUESTS)) {
    try { setup(api, lib); } catch (e) { console.error(`quest ${name} failed to load:`, e); }
  }
  // fallbacks for shared furniture that no quest claimed
  lib.on('q_crate', 'Search', p => api.msg(p, 'You find nothing of interest.'));
  lib.on('q_desk', 'Search', p => api.msg(p, 'You find some paperclips and an old stroopwafel wrapper.'));
  lib.on('q_bike', 'Search', p => api.msg(p, 'One of approximately 800,000 bicycles in Amsterdam.'));
}
