// Consistency check for content packs: duplicate ids, missing icons and object models.
// Usage: node scripts/check-content.js
import fs from 'node:fs';
import path from 'node:path';
import { ITEMS, BASE_ITEM_IDS, CONTENT_PACKS } from '../shared/items.js';
import { OBJECT_TYPES } from '../shared/objects.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let problems = 0;
const warn = s => { problems++; console.log('  ' + s); };

console.log('Duplicate item / object ids:');
const owner = Object.fromEntries(BASE_ITEM_IDS.map(id => [id, 'base']));
const objOwner = { ladder_down: 'core', ladder_up: 'core', stairs_down: 'core', stairs_up: 'core', door: 'core', exit: 'core', sign: 'core', bank_booth: 'core' };
for (const [pack, mod] of Object.entries(CONTENT_PACKS)) {
  for (const id of Object.keys(mod.ITEMS || {})) { if (owner[id]) warn(`item ${id} defined by ${owner[id]} and ${pack}`); else owner[id] = pack; }
  for (const id of Object.keys(mod.OBJECTS || {})) { if (objOwner[id]) warn(`object ${id} defined by ${objOwner[id]} and ${pack}`); else objOwner[id] = pack; }
}

// client source text, to see which icons and models are registered
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
const client = walk(path.join(root, 'public/js')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
const has = id => new RegExp(`(\\b|['"])${id}(['"]?\\s*:|['"]\\]\\s*=|\\s*\\([^)]*\\)\\s*\\{)|iconDrawers\\.${id}\\b|objectModels\\.${id}\\b|npcModels\\.${id}\\b`).test(client);

console.log('Items without an icon (they would show as coins):');
for (const [id, def] of Object.entries(ITEMS)) {
  if (owner[id] === 'base') continue;
  const iconId = def.icon || id;
  if (!has(iconId)) warn(`${id} (${owner[id]}) has no icon drawer "${iconId}"`);
}

console.log('Object types whose model is not registered:');
for (const [id, def] of Object.entries(OBJECT_TYPES)) {
  for (const m of [def.model, def.depleted?.model].filter(Boolean)) if (!has(m)) warn(`${id} uses model "${m}" which no client file registers`);
}

console.log(problems ? `${problems} problem(s).` : 'All good.');
process.exit(problems ? 1 : 0);
