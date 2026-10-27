// Server logic for the "gathering" content pack: Woodcutting, Mining, Fishing, Hunter, Farming, flax and the
// shops that sell the tools. See docs/ENGINE.md. Tables live in shared/content/gathering/data.js, placements in
// server/systems/gathering/places.js.
import { TREE_AREAS, ROCK_AREAS, SPOT_GROUPS, FLAX_FIELD, PATCHES, PEOPLE } from './gathering/places.js';
import { prepare, snap, used } from './gathering/terrain.js';
import { setupResources } from './gathering/resources.js';
import { setupHunter } from './gathering/hunter.js';
import { setupFarming } from './gathering/farming.js';
import { SHOPS, DIALOGS, NPCS } from './gathering/npcs.js';

export default function register(api) {
  const G = { treeAreas: TREE_AREAS, spotGroups: [], patches: [], stats: {} };

  for (const [id, def] of Object.entries(SHOPS)) api.shop(id, def);
  for (const [id, script] of Object.entries(DIALOGS)) api.dialog(id, script);
  setupResources(api, G);
  setupHunter(api, G);
  setupFarming(api, G);

  // Everything is spawned once the map chunks around it are known, so trees avoid houses and fishing spots sit in water.
  const allPoints = [
    ...TREE_AREAS.flatMap(a => [...a.pts, ...(a.extra || []).flatMap(e => e.pts)]),
    ...ROCK_AREAS.flatMap(a => a.rocks.flatMap(r => r[1])),
    ...SPOT_GROUPS.flatMap(g => g.cands), FLAX_FIELD.at, ...PATCHES.map(p => p.at), ...Object.values(PEOPLE),
  ];
  const count = (k, n = 1) => { G.stats[k] = (G.stats[k] || 0) + n; };

  G.ready = prepare(allPoints, 70).then(() => {
    // patches first (they are big), then rocks, trees, the rest
    for (const pt of PATCHES) {
      const t = snap(pt.at, { radius: 12, spacing: 2 });
      if (!t) { count('skipped'); continue; }
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) used.add((t.x + dx) + ',' + (t.z + dz));
      G.patches.push(api.spawnObject({ type: pt.type, x: t.x, z: t.z, data: { key: pt.key, name: pt.name } }));
      count('patches');
    }
    for (const area of ROCK_AREAS) for (const [type, pts] of area.rocks) for (const p of pts) {
      const t = snap(p, { mode: area.shore ? 'shore' : 'land', radius: area.shore ? 30 : 10, spacing: 0 });
      if (!t) { count('skipped'); continue; }
      api.spawnObject({ type, x: t.x, z: t.z, data: { area: area.id } });
      count('rocks');
    }
    for (const area of TREE_AREAS) {
      for (const grp of [{ type: area.type, pts: area.pts, shore: area.shore, green: area.green }, ...(area.extra || [])]) for (const p of grp.pts) {
        const t = snap(p, { mode: grp.shore ? 'shore' : 'land', radius: grp.shore ? 18 : 14, spacing: 1, green: grp.green ?? area.green })
          || (grp.shore && snap(p, { radius: 10, spacing: 1 }));
        if (!t) { count('skipped'); continue; }
        api.spawnObject({ type: grp.type, x: t.x, z: t.z, rot: Math.round(Math.random() * 3) * Math.PI / 2, data: { area: area.id } });
        count('trees');
      }
    }
    SPOT_GROUPS.forEach((g, gi) => {
      const seen = new Set(), cands = [];
      for (const c of g.cands) {
        const t = snap(c, { mode: 'water', radius: 70, spacing: 0, reserve: false });
        if (!t || seen.has(t.x + ',' + t.z)) continue;
        seen.add(t.x + ',' + t.z); cands.push(t);
      }
      const group = { id: gi, type: g.type, cands, spots: [] };
      for (const c of [...cands].sort(() => Math.random() - 0.5).slice(0, g.active)) group.spots.push({ obj: api.spawnObject({ type: g.type, x: c.x, z: c.z, data: { group: gi } }) });
      G.spotGroups.push(group);
      count('spots', group.spots.length);
    });
    for (let i = 0; i < FLAX_FIELD.cols; i++) for (let j = 0; j < FLAX_FIELD.rows; j++) {
      const t = snap({ x: FLAX_FIELD.at.x + i * 2, z: FLAX_FIELD.at.z + j * 2 }, { radius: 8, spacing: 0 });
      if (t) { api.spawnObject({ type: 'flax_plant', x: t.x, z: t.z }); count('flax'); }
    }
    for (const n of NPCS) {
      const at = snap(PEOPLE[n.key], { radius: 10, spacing: 0, reserve: false }) || PEOPLE[n.key];
      const { key, ...def } = n;
      api.spawnNpc({ ...def, at: { x: at.x, z: at.z } });
    }
    for (const [k, text] of [['sign_hortus', 'Hortus Botanicus - Taxus baccata (yew). Kappen alleen met vergunning van de Gemeente. Felling by permit only.'],
      ['sign_bos', 'Het Betoverde Bos. Toegang op eigen risico. The trees here remember everything.']]) {
      const t = snap(PEOPLE[k], { radius: 8, spacing: 0 });
      if (t) api.spawnObject({ type: 'sign', x: t.x, z: t.z, data: { text } });
    }
    console.log('[gathering] spawned', JSON.stringify(G.stats));
  }).catch(e => console.error('[gathering] spawn failed', e));

  // dev helper: ::gfind <object type part> teleports you next to the nearest matching gathering object
  api.command('gfind', (p, [what = 'tree']) => {
    if (!api.DEV) return;
    let best = null, bd = Infinity;
    for (const o of api.objects.values()) {
      if (!o.type.includes(what)) continue;
      const d = Math.hypot(o.x - p.x, o.z - p.z);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return api.msg(p, 'Nothing found.');
    api.msg(p, `${best.type} at ${best.x} ${best.z} (${Math.round(bd)} m away)`);
    api.teleport(p, best.x + 2, best.z + 2);
  });
}
