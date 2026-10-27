# Engine requests from the economy pack

1. **`api.itemOp` should chain handlers per op name.** `reg.itemOps[name] = f` means the last pack to register `Read`,
   `Open`, `Teleport`... wins for every item. Suggested: `(reg.itemOps[name] ??= []).push(f)` and call each until one
   returns `true` (or call the one registered for `def` via an optional `items: [ids]` argument). Economy uses unique op
   names (`View`, `Take-one`, `Pay-fine`, `Teleport-Dam`, `Ride`, `Check-balance`) to avoid collisions meanwhile.
2. **Shops**: when a player sells an item the shop stocks, core should add it to `shop.left[id]` (OSRS behaviour). Economy
   detects sales by watching the inventory while one of *its* shops is open. Also `showShop` in `main.js` overrides `q`
   with 1, so stock counts are not shown; economy patches counts in with an `eco_shopq` message. Suggested patch in
   `showShop`: `m.stock.map(s => ({ ...s, q: s.q ?? 1 }))` and draw `q` only when defined. `invOptions` "Value" while a
   shop is open hardcodes `value * 0.4`; it should ask the server (shop hooks and `sellRate` change it).
3. **Restocking (FYI for other packs)**: economy restocks *every* shop that has `limits` toward its limit every 20 ticks
   (set `restock: false` on a shop to opt out). Dynamic "price rises as stock runs out" pricing applies only to economy's
   shops and shops that set `dynamic: true`.
4. **Player context-menu hook**: a `registry.playerOptions.push((ent, ctx) => [{ label, fn }])` extension point would let
   economy add "Add friend", "Message" and "Report" when right-clicking players (now only in the Friends tab and `::report`).
5. **`api.online(nameOrKey)`** and `api.keyOf(name)` helpers: economy loops over `api.players` and copies `keyOf`.
6. **Collection log categories**: other packs may set `clog: 'Bosses' | 'Wilderness' | ... ` (any category name) or
   `clog: false` on an item to place or hide it in the collection log. Without it, economy categorises by drop tables
   (boss / Wilderness / rare 1-in-50+) and by owning pack.
7. `drawPreview` in `model.js` binds to the first canvas it ever sees (the login designer), so it cannot be reused;
   economy's Kapsalon window renders its own preview with `buildModel`.
8. Chat kind `pm` is styled by economy's injected CSS; style.css could own `.pm` for consistency.
