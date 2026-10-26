# AmsterScape

An Old School RuneScape-style MMO set in the real streets of Amsterdam. You spawn on the forecourt of **Amsterdam Centraal**, and the world is built from live OpenStreetMap data: canals, bridges, canal houses, parks, red bike lanes and trees.

Plays in any browser (desktop or phone) and installs as an app (PWA) from the browser menu.

## How it plays

- **Classic feel:** 600 ms game ticks, click-to-walk with tile pathfinding, right-click menus ("Talk-to", "Trade with", "Take"), chatbox NPC dialogues, 28-slot inventory, worn equipment, skills with the original XP curve, run energy, minimap and compass.
- **Accounts:** pick a name and password and design a simple character, just like the old days.
- **Ghost mode (default):** if you're not physically there, you roam as a translucent ghost. Ghosts can walk anywhere, chat, talk to NPCs, use shops and banks, and trade with other players.
- **Real-life mode:** tap the 👻 orb by the minimap. Your character follows your phone's GPS. Only real-life players can:
  - pick up items lying around the city (fixed spawns at landmarks plus treasure that appears near you as you walk),
  - challenge other real-life players nearby to a **duel** (loser drops their coins and respawns at Centraal as a ghost).
  - Walking earns **Exploring** XP, and visiting landmarks (Dam, Rembrandtplein, Vondelpark, ...) gives a bonus.
- **Privacy:** real-life players are only visible to other real-life players, so ghosts can't track people around the city. Set `REAL_VISIBLE_TO_GHOSTS=1` to change that.
- **Map:** the 🗺️ button opens Google Maps (map, satellite and Street View) at your character's position.

NPCs include the Gemeente Gids (tutorial and starter kit), Haring Henk, Kaas Kees, Stroopwafel Sanne, Wapensmid Willem at De Waag, Bloemen Bep at the Bloemenmarkt, bankers at Centraal and Dam, a Fietsendief, Rembrandt and some ducks.

## Run it

```bash
npm install
npm start            # http://localhost:3000, real OpenStreetMap data via Overpass
npm run dev          # offline test map (FAKE_MAP=1), no internet needed
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP/WebSocket port |
| `DATA_DIR` | `./data` | Player accounts (`players.json`) and cached map chunks |
| `FAKE_MAP` | unset | `1` uses a generated test map instead of OpenStreetMap |
| `OVERPASS_URLS` | public mirrors | Comma-separated Overpass API endpoints |
| `REAL_VISIBLE_TO_GHOSTS` | unset | `1` lets ghosts see real-life players |

## Deploy

GPS only works on **HTTPS**, so host it behind TLS. Any Node host with WebSocket support works (Fly.io, Railway, Render, a VPS with Caddy). A `Dockerfile` is included; mount a volume at `/data` so accounts survive restarts.

```bash
docker build -t amsterscape .
docker run -p 3000:3000 -v amsterscape-data:/data amsterscape
```

## Layout

- `server/index.js`: HTTP, WebSocket, the game tick, combat, trading, GPS handling
- `server/content.js`: NPCs, shops, dialogues, item spawns and landmarks (real coordinates)
- `server/mapdata.js`: Overpass fetch, OSM to game-geometry conversion, chunk cache
- `server/db.js`: JSON account store with scrypt password hashing
- `shared/`: projection (1 tile = 1 metre), item definitions, XP formulas
- `public/js/`: Three.js renderer, world builder and pathfinding, UI

## Known limits

- GPS can be spoofed. The server rejects impossible jumps, but serious anti-cheat would need more.
- Accounts live in a JSON file; move to a database for large player counts.
- Map data © OpenStreetMap contributors (ODbL). Fan tribute, not affiliated with Jagex.
