// World object types (trees, rocks, ranges, ladders...). Content packs add theirs in shared/content/*.js.
// Fields: name, actions (right-click options, first is the default), ex (examine text), model (client model id
// from public/js/registry.js objectModels), params (passed to the model builder), blocks (walls you can't walk
// through), size [w, d] in tiles, depleted { model, params, name, actions } shown while it is used up.
import { CONTENT_PACKS } from './items.js';

export const OBJECT_TYPES = {
  ladder_down: { name: 'Ladder', actions: ['Climb-down'], ex: 'It leads down.', model: 'ladder', params: { down: true } },
  ladder_up: { name: 'Ladder', actions: ['Climb-up'], ex: 'It leads up.', model: 'ladder', params: {} },
  stairs_down: { name: 'Staircase', actions: ['Climb-down'], ex: 'Stairs going down.', model: 'stairs', params: { down: true }, size: [2, 2] },
  stairs_up: { name: 'Staircase', actions: ['Climb-up'], ex: 'Stairs going up.', model: 'stairs', params: {}, size: [2, 2] },
  door: { name: 'Door', actions: ['Enter'], ex: 'A sturdy door.', model: 'door', params: {} },
  exit: { name: 'Exit', actions: ['Leave'], ex: 'The way out.', model: 'door', params: { color: '#3a2a1a' } },
  sign: { name: 'Signpost', actions: ['Read'], ex: 'It says something.', model: 'sign', params: {} },
  bank_booth: { name: 'Bank booth', actions: ['Bank'], ex: 'A place to keep your valuables.', model: 'booth', params: {}, blocks: true },
};

for (const pack of Object.values(CONTENT_PACKS)) Object.assign(OBJECT_TYPES, pack.OBJECTS || {});
