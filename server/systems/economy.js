// Server logic for the "economy" content pack. See docs/ENGINE.md.
// Grand Exchange, public transport and OV-chipkaart, OV-fiets, banks, shop restocking and prices, collection log,
// Amsterdam Diary, hiscores, friends/PMs, reports and moderation. Each part lives in server/systems/economy/.
import { makeContext } from './economy/common.js';
import ge from './economy/ge.js';
import transport from './economy/transport.js';
import shops from './economy/shops.js';
import achievements from './economy/achievements.js';
import social from './economy/social.js';
import hiscores from './economy/hiscores.js';
import misc from './economy/misc.js';

export default function register(api) {
  const E = makeContext(api);
  for (const part of [ge, transport, shops, achievements, social, hiscores, misc]) part(api, E);
}
