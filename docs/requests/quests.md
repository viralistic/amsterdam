# Engine requests from the quests pack

## 1. `api.interior` room walls don't block movement
Room walls are 0.5 m thick boxes centred on integer coordinates (`r.x0`, `r.z1`...). In the client collision canvas
(1 px per metre) such a wall covers two pixels at 25% each, so after anti-aliasing they stay above the 128 threshold and
are **walkable**. The quests pack works around it by building interiors from `floors` + one-tile-thick `walls`
(see `server/systems/quests/lib.js` `buildInterior`), but other packs using `rooms` will have walk-through walls.

Suggested fix in `interiorChunk` (server/index.js): make room walls cover whole tiles, e.g.
```js
// horizontal run on the north side: the tile row just outside the room
out.b.push([h, 0, rect(cur, r.z0 - 1, c0, r.z0), col]);   // instead of fixed - t/2 .. fixed + t/2
```
or disable anti-aliasing for the collision canvas (`k.imageSmoothingEnabled` doesn't affect paths; fill with
`Math.floor`/`Math.ceil`-snapped rectangles instead).

## 2. Server-side wall check (optional)
`setPath` only checks step adjacency, so a modified client can walk through interior walls. Quest logic never trusts
position for progress (locked doors and rewards check quest stages server-side), so this is low priority.

## 3. Per-player NPC visibility / instancing (nice to have)
Quest bosses (Kapitein Banninck Cocq, Gaasperdraak, the IJ monster) are shared world NPCs. Everyone near the boss at the
right stage gets credit, which works, but an `npc.visibleTo(p)` hook (or `spawnNpc({ owner })`) would allow private
follower NPCs and per-player cutscenes.

## 4. `api.spawnNpc` returns the NPC but there is no `api.removeNpc`
Temporary quest NPCs (summoned helpers, escorted animals) can't be despawned. A `removeNpc(npc)` that splices the npc
from the list (and stops sending it) would help.
