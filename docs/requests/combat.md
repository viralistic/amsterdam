# Engine requests from the combat pack

All of these have workarounds in `server/systems/combat/util.js`; core support would make them cleaner.

1. **Stuns.** Thieving failures and the Gashouder Golem's slam stun players. Core has no stun, so the pack snaps the
   player back to the stun tile every tick (`onPlayerTick`), which can show one tile of rubber-banding.
   Suggested patch: `p.stunUntil` (tick). Skip `movePlayer`, `tryPending` and `playerCombat` while `p.stunUntil > tickNo`,
   and refuse `walk`/`act` with "You're stunned!". Expose `api.stun(p, ticks)`.
2. **Direct damage with a hitsplat** (steam vents, falling debris, agility falls). The pack lowers `p.rec.hp` itself and sends
   `{t:'combat:splat'}`, which the client feeds to `renderer.hit`. Suggested: `api.hurt(entity, dmg, source?)`, which pushes to
   `tickHits` and calls `die`/`npcDie`.
3. **Forced attacks for specials.** `api.doAttack(a, d, { dmg?, maxHit?, chance?, style?, proj? })`, so a special can choose
   its damage and projectile. The workaround sets `npc._force` and applies it in an `onCombat` hook.
   The projectile can't be changed that way.
4. **Temporary NPCs.** `api.removeNpc(npc)` now exists. The pack still uses parked pools (x 37990 z 33990) for boss adds and ambushes, because a pooled NPC keeps its id and respawns. It can switch over later.
5. **Model override for one NPC** (sheared sheep). `npcEnt` reads `n.def.model`, so the pack copies `n.def` per NPC.
   Suggested: `m: n.model || n.def.model`.
6. **Shops with a custom currency.** `api.shop(id, { currency: 'mark_of_grace' })` would replace the dialogue-based graceful
   shop.
