# AmsEscape engine guide (for content packs)

AmsEscape is a custom multiplayer game: Node.js server (`server/index.js`), Three.js browser client (`public/js`), shared
data (`shared/`). The world is real Amsterdam: **1 tile = 1 metre**, `+x` east, `+z` south, tile (0,0) is in front of
Amsterdam Centraal. Convert real places with `api.tile(lat, lon)` (server) or `toTile(lat, lon)` from `/shared/geo.js`.

Content is split into **packs**. Each pack owns exactly three entry files and may create more files next to them:

| Layer | File | Purpose |
| --- | --- | --- |
| shared | `shared/content/<pack>.js` | `export const ITEMS = {}` and `export const OBJECTS = {}` (object types) |
| server | `server/systems/<pack>.js` | `export default function register(api) { ... }` |
| client | `public/js/content/<pack>.js` | registers models, icons, tabs, message handlers on `registry` |

Packs: `gathering`, `production`, `combat`, `quests`, `economy`, `atmosphere`. Extra files must live in
`shared/content/<pack>/`, `server/systems/<pack>/` and `public/js/content/<pack>/` and be imported from your entry file
(the server only auto-loads `server/systems/*.js`, so put helpers in the subfolder).

**Do not edit core files** (`server/index.js`, `shared/items.js`, `shared/objects.js`, `public/js/main.js`,
`render.js`, `world.js`, `model.js`, `icons.js`, `style.css`, `index.html`) or other packs' files. If you truly need an
engine change, write it in `docs/requests/<pack>.md` (what and why, with a suggested patch) and work around it meanwhile.
Exception: the `atmosphere` pack also owns `server/mapdata.js` for street furniture.

Don't run `git` commands that change anything (no commit, checkout, stash, reset). The lead merges and commits.

## Style

Old School RuneScape look, but **original art only** (never copy Jagex assets): flat-shaded low-poly models
(`MeshLambertMaterial({ flatShading: true })`), chunky proportions, limited palettes. Item icons are 36x32 pixel art with
hard edges; the engine adds the black outline and drop shadow. Dialogue has Amsterdam humour; Dutch words are welcome.
Treat real places and people respectfully: Zuidoost is the Wilderness only as a fictional, exaggerated game zone
(monsters are fantasy creatures, never residents), and the Anne Frank House must never become a combat or loot location.

## Shared data

### Items (`ITEMS`)
`{ name, value, ex, stack?, heal?, drink?, leaves? (item left after eating, e.g. a vial), slot?, att/str/def/rng/rstr/mag/pray?,
req?, skill? (wield requirement skill, default attack), twoHanded?, style? ('ranged'|'magic' for weapons), speed? (ticks, default 4),
ops? (extra inventory options e.g. ['Bury']), tradeable? (default true), quest? (quest id needed to wear), icon?, color?, metal?, wood? }`

Equipment slots: head, cape, ammo, weapon, body, shield, legs, feet. Visual fields used by player models: `color` (body/legs/feet/cape),
`metal` (weapons, helms), `hat` ('beanie'|'cap'|'cowl'|'wizard'), `dress`, `stripes`.

**Never redefine an existing id** (base items in `shared/items.js` or another pack's). Run `node scripts/check-content.js`.

### Canonical item ids (who defines what)
Other packs may reference these ids before they exist; the owner must define them.
- **gathering**: `bronze_axe iron_axe steel_axe mithril_axe adamant_axe rune_axe bronze_pickaxe iron_pickaxe steel_pickaxe mithril_pickaxe adamant_pickaxe rune_pickaxe small_net fishing_rod fly_fishing_rod harpoon lobster_pot fishing_bait feather logs oak_logs willow_logs maple_logs yew_logs magic_logs elm_logs copper_ore tin_ore iron_ore coal silver_ore gold_ore mithril_ore adamantite_ore runite_ore clay uncut_sapphire uncut_emerald uncut_ruby uncut_diamond raw_shrimps raw_anchovies raw_trout raw_salmon raw_pike raw_eel raw_lobster raw_swordfish raw_shark grimy_guam grimy_marrentill grimy_tarromin grimy_harralander grimy_ranarr potato_seed onion_seed cabbage_seed guam_seed ranarr_seed rake seed_dibber spade compost potato onion cabbage bird_snare box_trap raw_bird_meat raw_rabbit bird_nest flax`
- **production**: `bronze_bar iron_bar steel_bar silver_bar gold_bar mithril_bar adamant_bar rune_bar` + smithed gear `<metal>_{sword,scimitar,platebody,platelegs,full_helm,kiteshield}` for metal in bronze iron steel mithril adamant rune (reuse existing ids where they exist: `bronze_dagger iron_sword steel_longsword mithril_scimitar iron_helm`), cooked food `shrimps anchovies trout salmon pike eel lobster swordfish shark cooked_meat cooked_chicken burnt_fish burnt_meat`, animal products `raw_beef raw_chicken cowhide wool bones big_bones dragon_bones ashes`, crafting `leather hard_leather leather_gloves leather_vambraces sapphire emerald ruby diamond gold_ring sapphire_ring gold_amulet soft_clay pot molten_glass vial vial_of_water bucket_of_sand ball_of_wool bow_string chisel needle thread knife pestle_and_mortar ring_mould amulet_mould`, fletching `arrow_shaft headless_arrow bronze_arrowtips iron_arrowtips steel_arrowtips mithril_arrowtips shortbow_u oak_shortbow_u willow_longbow_u maple_shortbow_u`, herblore `guam_leaf marrentill tarromin harralander ranarr_weed guam_potion_unf eye_of_newt limpwurt_root attack_potion strength_potion defence_potion prayer_potion`
- **combat**: monster-unique drops, `mark_of_grace`, graceful outfit, Wilderness/boss uniques, `coin_pouch`
- **quests**: quest items and quest rewards
- **economy**: `ov_chipkaart`, `ov_fiets`, GE related items

### Object types (`OBJECTS`)
`{ name, actions: ['Chop down', ...], ex, model, params, blocks?, size? [w, d], reach? (extra interaction range), pickHeight?, depleted?: { model, params, name, actions, ex } }`
`model` is a client model id registered in `registry.objectModels`. Core models: `box ladder stairs door sign booth`.
Core object types: `ladder_down ladder_up stairs_down stairs_up door exit sign bank_booth`.

## Server API (`register(api)`)

Spawning and world
- `api.tile(lat, lon)` → `{x, z}`; `api.spawnObject({ type, x, z, rot, data })` → object `{ id, type, x, z, data, dep }`
- `api.deplete(obj, ticks)`, `api.isDepleted(obj)`, `api.removeObject(obj)`, `api.objectsNear(x, z, r)`
- Objects with `data.to = { x, z, inside?, quest?, stage?, lockedMsg?, msg? }` teleport on their first action (ladders, doors). `data.text` shows a sign.
- `api.spawnNpc(def)` → npc. def: `{ name, type?, at: {x,z}, home?, wander?, look?|model?, scale?, eq?, talk? (dialogue name), shop?, bank?, chatter?: [], ex?, actions?: ['Pickpocket'], combat?, drops?, respawn? (ticks) }`
  - `combat: { lvl, hp, att, str, def, mag?, maxHit, speed? (4), style? ('melee'|'ranged'|'magic'), range? (1), aggressive?, aggroRange?, attBonus?, defBonus?, leash?, boss?, projColor?, special?: { chance, run(npc, target, api) → true if it replaced the normal attack } }`
  - `drops: { always: [[item, q]], rolls?, table: [[weight, item, min, max]] (item null = nothing), rare: [[oneIn, item, q]] }` or `fn(npc, killer, api) → [[item, q]]`. Drops go on the ground owned by the killer (ghosts can take their own drops).
- `api.teleport(p, x, z, { inside })`, `api.canTeleport(p)` (blocks above Wilderness 20 and real-life players).
- `api.interior({ id, name, wild?, rooms: [{ x0, z0, x1, z1, floor, wall, h, doors: [[side 'n'|'s'|'e'|'w', offset, width]] }], floors?: [[color, [x,z,...]]], walls?: [[x0,z0,x1,z1,h,color]] })`
  Interiors must use **x >= 30000 and z >= 30000**. Allocations: quests x 30000-33999, combat x 34000-37999, production x 38000-39999, economy x 40000-41999 (z 30000-34000 for all).
  Real-life players entering an interior stop following GPS until they leave.

Players and items
- `api.msg(p, text, kind?)` kinds: game, warn, level, real, duel; `api.send(p, obj)`; `api.say(entity, 'p'|'n', text)`
- `api.lv(p, skill)`, `api.addXp(p, skill, amount)`, `api.cbLevel(p)`, `api.bonuses(p)`
- `api.invAdd(p, id, q)`, `api.invRemove(p, id, q)`, `api.invCount(p, id)`, `api.hasItem(p, id, q)`, `api.freeSlots(p)`, `api.canAdd(p, id, q)`, `api.giveOrDrop(p, id, q)`, `api.dropGround(id, q, x, z, ms, extra)`
- `p.rec` is the saved account: `inv` (28 slots of `{id,q}` or null), `equip`, `bank`, `xp`, `hp`, `prayer`, `flags`, `quests`.
  Store your own saved data in `api.playerStore(p, '<pack>')` and server-wide data in `api.worldStore('<pack>')`.
- `p.real` (real-life GPS mode), `p.inside`, `p.wild` (Wilderness level), `p.region` (region id), `p.target`, `p.action`.

Interaction hooks
- `api.objectAction(type, action, (p, obj, api) => ...)`; `api.npcAction(npcTypeOrName, action, (p, npc, api) => ...)`
- `api.itemOp(opName, (p, slot, item, def, api) => ...)` for items with `ops: [opName]`
- `api.onUse((p, u, api) => handled)`; `u = { slot, item, def, kind: 'item'|'obj'|'npc'|'player', targetSlot?, target?, targetDef?, obj?, npc?, player? }`. Return true if handled.
- `api.gather(p, obj, { skill, level, xp, item (id or fn(p, level)), tools: [{ id, level, power }], toolMsg, bait?, chance?(level, tool), every? (ticks), deplete? (chance per success), respawn? (ticks or [min,max]), anim, startMsg, successMsg, depleteMsg, onSuccess? })`
- `api.startAction(p, { first, every, anim, obj?, step: p => boolean })` repeating skilling action (stops when the player moves). Anims: chop mine fish smith cook craft pray pick farm attack.
- `api.makeMenu(p, { title, options: [{ item, label? , ...anything }], onPick(p, option, qty) })`

Dialogue, shops, quests
- `api.dialog(name, script)` then NPC `talk: name`, or `api.startDialog(p, npc, nameOrScript, whoLabel?)`.
  Script = `{ start: [steps], other: [steps] }`. Steps: `{ npc: text|fn(p) }`, `{ player: text|fn }`, `{ item: id, npc: text }` (item box),
  `{ opts: [[label, node, condFn?]] }`, `{ act: name|fn(p, npc, api) → node|'stop'|null }`, `{ goto: node }`, `{ if: fn(p, npc, api), then, else }`. Node `end` closes.
- `api.dialogAction(name, fn)` named acts. Built-in acts: `shop`, `bank`.
- `api.shop(id, { name, stock: [ids], general?, limits?: {id: n}, buyRate?, sellRate? })`, NPC `shop: id`, `api.openShop(p, id)`, `api.shopPriceHook(fn)`.
- `api.quest({ id, name, points, start: 'How to start', journal: (stage, p) => [lines], done: 100 })`; `api.getQ(p, id)`, `api.setQ(p, id, stage)`, `api.questDone(p, id)`, `api.completeQuest(p, id, { xp: {skill: n}, items: [[id, q]], coins, text: [] })`, `api.questPoints(p)`.

Combat and events
- `api.onCombat(ctx => ...)` before the roll: `ctx = { attacker, defender, style: {kind}, chance, maxHit, dmg (set to force), api }`
- `api.onHit(ctx => ...)` after rolling: change `ctx.dmg` (protection prayers).
- `api.onNpcDeath((npc, killer, api) => ...)`, `api.onDeath((p, killer, api) => ...)`, `api.onLogin`, `api.onLogout`, `api.onTick((tick, api) => ...)`, `api.onPlayerTick((p, api) => ...)`, `api.onRegionChange((p, region, oldId) => ...)`
- Players have `p.overhead` (an icon id shown above the head, e.g. a protection prayer) and `p.rec.prayer` (prayer points).
- `api.onMessage(type, (p, msg, api) => ...)` custom client→server messages; `api.command(name, (p, args, api) => ...)` chat commands `::name`; `api.route('/path', (req, res) => ...)` HTTP pages.

## Client registry (`public/js/registry.js`)
```js
import * as THREE from 'three';
import { registry } from '../registry.js';
registry.objectModels.oak_tree = (params, THREE) => group; // facing +z, base on y=0, centred on the tile
registry.npcModels.cow = (group, mats, parts, THREE, helpers) => heightInMetres; // helpers: mat seg blob pivot quad neckHead
registry.iconDrawers.oak_logs = g => { ... };            // 36x32 canvas, drawn before outline/shadow
registry.tabs.push({ id: 'prayer', icon: 'sk_prayer', title: 'Prayer', render(el, ctx) {} });
registry.msgHandlers.myType = (m, ctx) => {};            // server api.send(p, { t: 'myType', ... })
registry.chunkDecorators.push((chunk, data, group, THREE, ctx) => {});
registry.frameHooks.push((now, ctx) => {});
registry.sfx = id => {};                                 // sound effects (atmosphere pack)
```
`ctx` = `{ S (client state: inv, equip, xp, x, z, wild, region...), send, chat, openWindow(title, html), closeWindow, iconImg(id, cls), showMenu, esc, ITEMS, OBJECT_TYPES, renderer, store, drawInv, levelsOf, pressable, itemGrid }`.
Icon helpers for drawing live in `public/js/icons.js` (not exported); write your own small helpers in your file.
For quadruped animals, `parts.legs = [pivots]` gets a walk cycle; `parts.custom = (phase, amount, now, anim) => {}` overrides animation.

## Testing your pack
```bash
# start your own server (unique port + data dir; the trailing tag lets you stop only your own server)
cd /home/user/amsterdam && PORT=32xx FAKE_MAP=1 DATA_DIR=/tmp/<your scratch>/data node server/index.js --tag=<pack> &
# stop it in a SEPARATE command (a command line that mentions the tag would kill its own shell):
pkill -f -- "--tag=<pack>"
node scripts/check-content.js   # duplicate ids, missing items/objects/models/icons
```
Ports: gathering 3201, production 3202, combat 3203, quests 3204, economy 3205, atmosphere 3206. Never kill other processes.
In FAKE_MAP mode the map is generated (canals and houses), not real Amsterdam, but coordinates are real.
Dev chat commands: `::tele x z`, `::give item_id qty`, `::xp skill amount`, `::quest id stage`, `::heal`, `::pos`.
Headless browser (Playwright is preinstalled: `require('playwright')`, `chromium.launch({ args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] })`).
`window.__amsescape` exposes `{ S, renderer }`; `renderer.project(x, y, z)` gives screen coords, `renderer.objs` / `renderer.ents` hold objects/entities.
Create an account through the UI (`text=New User`, fill `#pane-create input[name=name|pass]`, submit, click `#design-accept`).
Type commands with `#chat-text` + Enter. Right-click → `#ctxmenu .it` (dispatch `pointerup` to choose). Save screenshots in your scratchpad.
