# Engine requests from the gathering pack

## 1. Map lookups for placing objects (official API)
`server/systems/gathering/terrain.js` imports `getChunk` from `server/mapdata.js` (read only) to rasterize water,
buildings and parks, so trees avoid houses and fishing spots sit in water next to a quay. Please expose this
officially so packs don't rely on internals, e.g.:
```js
api.mapCell(x, z)        // -> { water, building, green } or null when the chunk is not loaded
api.loadMap(x, z, r)     // -> Promise, loads the chunks around a point (getChunk under the hood)
```

## 2. Tool shapes in the player's hands
Axes and pickaxes are wieldable (`slot: 'weapon'`, with `tool: 'axe' | 'pickaxe'` on the item def) but
`model.js` draws every melee weapon as a blade. Suggested patch in `buildModel` weapon branch:
if `w.tool === 'axe'` draw a short handle with a wedge head, if `w.tool === 'pickaxe'` a handle with a curved
crossbar head (both in `w.metal`). Nice to have: `gather()` could put the tool id on the action
(`p.action.tool`) and the tick entity (`tl`), so the axe / pickaxe / net / rod shows in hand while skilling
even when it is only carried in the inventory, as in OSRS.

## 3. Per-player object appearance
Farming patches are per player. The pack sends `{ t: 'gath:farm', patches }` and draws an overlay on the
shared patch object (client `frameHooks`). A generic engine feature would help other packs too:
`api.objectView(p, obj, { model?, params?, name?, actions? })` sent only to that player, so right-click
options could also change per player (now the patch always shows Rake / Harvest|Pick / Inspect).
