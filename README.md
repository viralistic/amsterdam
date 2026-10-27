# AmsEscape

An Old School RuneScape-style MMO set in the real streets of Amsterdam. You spawn on the forecourt of **Amsterdam Centraal**, and the world is built from live OpenStreetMap data: canals, bridges, canal houses, parks, red bike lanes, trees and street furniture.

Plays in any browser (desktop or phone) and installs as an app (PWA) from the browser menu.

## How it plays

- **Classic feel:** 600 ms game ticks, click-to-walk with tile pathfinding, right-click menus, chatbox dialogues, 28-slot inventory, 11 equipment slots, all OSRS skills with the original XP curve, run energy, prayer, minimap and compass.
- **Accounts:** pick a name and password and design a simple character, just like the old days.
- **Ghost mode (default):** if you're not physically there, you roam as a translucent ghost. Ghosts can walk anywhere, chat, skill, fight monsters, quest, trade and use shops, banks and the Grand Exchange.
- **Real-life mode:** tap the ghost orb by the minimap. Your character follows your phone's GPS. Only real-life players can pick up items lying around the city and duel other real-life players nearby. Walking earns **Exploring** XP.
- **Privacy:** real-life players are only visible to other real-life players. Set `REAL_VISIBLE_TO_GHOSTS=1` to change that.

## The city

- **Regions:** Centraal (tutorial and transport hub), Dam (Grand Exchange), Vondelpark (early skilling), NEMO (crafting), Rijksmuseum (dungeon quest), Westergasfabriek (smithing and a dungeon), Amsterdamse Bos (woodcutting and hunting), Artis, Hortus, Jordaan, De Pijp, Noord and more. The Wilderness is a fictionalised Zuidoost with fantasy monsters only.
- **Landmarks:** hand-built models of Amsterdam Centraal, the Royal Palace, Nationaal Monument, Nieuwe Kerk, De Bijenkorf, Oude Kerk, Westerkerk and the Rijksmuseum at their real positions, plus the Kaliber Ranged Guild and Artis zoo. Ordinary buildings become canal houses with step, neck, bell and spout gables.
- **Atmosphere:** day and night follow the real sun over Amsterdam, weather is shared by all players, canals are animated, street lamps glow at night. Original chiptune music per region, synthesised sound effects and ambience (gulls, trams, church bells on the hour).

## Content

- **Gathering:** Woodcutting (street trees up to magic trees), Mining, Fishing (canals, Amstel, IJ, Gaasperplas), Hunter, Farming patches.
- **Production:** Firemaking, Cooking, Smithing, Crafting, Fletching, Herblore, Prayer. Stations at NEMO, Westergasfabriek, the Albert Cuyp and the churches.
- **Combat:** monsters across the city, the Westergasfabriek dungeon and its golem boss, the Wilderness with outposts, metro tunnels and the Concrete Colossus, PvP and tournaments in the Johan Cruijff ArenA.
- **Agility and Thieving:** A'DAM Toren rooftop course, canal shortcuts, market stalls and pickpocketing.
- **Quests:** nine quests (Welkom in Amsterdam, Grachtengordel Ontdekken, De Gestolen Kroon, De Nachtwacht Ontwaakt, De Toren van de Westerkerk, Het Betoverde Bos, Uitvinders van NEMO, De Amsterdam, Het Hart van Zuidoost), side quests and a daily task board.
- **Economy:** Grand Exchange on the Dam, banks, shops with stock, OV-chipkaart travel by train, metro and ferry, OV-fiets bikes, a collection log, an Amsterdam Diary, hiscores, friends and private messages, reporting and moderation.

## Run it

```bash
npm install
npm start            # http://localhost:3000, real OpenStreetMap data via Overpass
npm run dev          # offline test map (FAKE_MAP=1), no internet needed
npm run bake-map     # pre-download the canal belt so nobody waits on Overpass
npm test             # engine tests (websocket bots)
npm run check        # content check: duplicate ids, missing icons and models
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP/WebSocket port |
| `DATA_DIR` | `./data` | Accounts (`players.json`), world state (`world.json`) and cached map chunks |
| `FAKE_MAP` | unset | `1` uses a generated test map instead of OpenStreetMap and enables dev commands |
| `OVERPASS_URLS` | public mirrors | Comma-separated Overpass API endpoints |
| `REAL_VISIBLE_TO_GHOSTS` | unset | `1` lets ghosts see real-life players |
| `ADMINS` | unset | Comma-separated account names allowed to mute, kick and ban |

In test mode chat commands help with testing: `::tele x z`, `::give item_id qty`, `::xp skill amount`, `::quest id stage`, `::heal`, `::pos`, `::time 22`, `::weather rain`.

## Deploy

GPS only works on **HTTPS**, so host it behind TLS. Any Node host with WebSocket support works (Fly.io, Railway, Render, a VPS with Caddy). A `Dockerfile` is included; mount a volume at `/data` so accounts survive restarts.

```bash
docker build -t amsescape .
docker run -p 3000:3000 -v amsescape-data:/data amsescape
```

## Layout

- `server/index.js`: HTTP, WebSocket, the game tick and the plug-in API (see `docs/ENGINE.md`)
- `server/systems/<pack>.js`: content packs (gathering, production, combat, quests, economy)
- `server/content.js`, `server/mapdata.js`, `server/db.js`: base NPCs and shops, OpenStreetMap conversion, storage
- `shared/`: projection (1 tile = 1 metre), items, objects, regions, landmarks, and each pack's content data
- `public/js/`: Three.js renderer, world builder, UI; `landmarks/` holds one file per hand-built building, `content/` the client side of each pack
- `public/dev/viewer.html`: model viewer for landmarks and the canal-house generator (`docs/LANDMARKS.md`)

## Known limits

- GPS can be spoofed. The server rejects impossible jumps, but serious anti-cheat would need more.
- Accounts live in JSON files; move to a database for large player counts.
- The server trusts client paths, so a modified client can walk through walls (quest progress is still checked server-side).
- Map data © OpenStreetMap contributors (ODbL). Fan tribute, not affiliated with Jagex; all models, art and music are original.
