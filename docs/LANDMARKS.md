# Building and landmark modelling guide

## Files
- `public/js/landmarks/<id>.js`: one hand-built landmark each. `export default function build(b, THREE, group, landmark)`.
  Add flat-shaded, vertex-coloured triangles to the `Builder` `b` (see `public/js/landmarks/builder.js`: `tri quad walls cap box gable frustum ring disc`, `b.bay = [w, h]` sets the window texture repeat for `walls(..., windows=true)`), and/or add your own meshes to `group` (they get the same click/examine behaviour). Keep helpers you write inside your own file.
- `public/js/buildings.js`: the generator for all ordinary OpenStreetMap buildings (canal houses etc.).
- Footprints and placement: `shared/landmarks.js` (`w` along local x, `d` along local z, centred on the origin, front facade at `+z`, rotated to its real bearing). The model must stay inside its footprint (it is solid for collision) and stand on y = 0. 1 unit = 1 metre.

## Look
Old School RuneScape style, original work only: flat shading, vertex colours, chunky low-poly shapes, readable silhouettes from the game camera (high, three-quarter view, 20-60 m away). Make buildings recognisable through **geometry**, not one tiled window texture: recessed or framed windows (arched where the real building has arches), sills, cornices, string courses, pilasters, plinths, entrance arches and steps, gables, dormers, chimneys, roof ridges, tower stages, clock faces, spires, statues as simple blocky figures. Small canvas textures (brick courses, slate) are fine with `NearestFilter`. Use the real colours of each building.

Budgets: a landmark at most ~20k triangles; the generic canal-house generator must stay cheap (aim for under ~150 triangles per house on average, thousands are on screen).

## Viewer
Start a server (`PORT=<port> FAKE_MAP=1 DATA_DIR=<scratch>/data node server/index.js --tag=<you> &`, stop it with `pkill -f -- "--tag=<you>"` in a separate command) and open
`http://localhost:<port>/dev/viewer.html?lm=<id>&yaw=0.6&pitch=0.35&dist=120&y=10` (or `?houses=1` for the canal-house generator).
Screenshot it headless with Playwright (`chromium.launch({ args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] })`, wait for `window.__viewerReady`). Check several angles, including the in-game camera angle (pitch ~0.9, dist ~20-40), and compare against what the real building looks like. Also check it in the game: create an account, `::tele x z` next to it (coordinates in `shared/landmarks.js`, printed by `node -e "import('./shared/landmarks.js').then(m=>console.log(m.LANDMARK_MODELS.map(l=>[l.id,Math.round(l.x),Math.round(l.z)])))"`).
