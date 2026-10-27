# Engine requests from the production pack

1. **Several handlers per item option.** `api.itemOp(name, f)` keeps one handler per option name, so two packs that both
   use `Drink`, `Bury`, `Clean` or `Light` overwrite each other (whichever loads last wins). Suggested patch in
   `server/index.js`: `itemOp: (name, f) => (reg.itemOps[name] ??= []).push(f)`, and in `invOp`:
   `for (const h of reg.itemOps[name] || []) if (h(p, m.slot, s, def, api) !== false) break;`.
   Production handlers already return `false` for items they don't own.
2. **Options on other packs' items.** Grimy herbs need `ops: ['Clean']` and logs need `ops: ['Light']` (OSRS has both).
   Until gathering adds these, production adds them at load time (server and client) but only when the item has no `ops`.
   Better fix: gathering adds `ops: ['Clean']` to `grimy_*` and `ops: ['Light']` to every `*logs` item.
3. **Equipment slots `hands`, `neck` and `ring`.** Leather gloves, vambraces, rings and amulets exist but can't be worn
   because `EQUIP_SLOTS` has no slot for them. Suggested: add `'neck', 'hands', 'ring'` to `EQUIP_SLOTS` and to
   `EQUIP_GRID` in main.js (OSRS layout: neck under the head, hands left of legs, ring right of legs). Production would then
   set `slot: 'hands'` / `'neck'` / `'ring'` on those items.
4. **Kiteshield and platebody visuals.** `model.js` draws every shield as the round wooden shield. Kiteshields have
   `kite: true` and `metal`; suggested: when `ITEMS[eq.shield].kite`, build a kite-shaped plate (or tint the rim and face
   with `metal`). Platebodies/platelegs already render through `color`.
