// Downloads OpenStreetMap data for the whole canal belt ahead of time, so players never wait on Overpass.
// Usage: npm run bake-map            (centre: Centraal, canal ring, Jordaan, De Pijp, Vondelpark, Oost)
//        npm run bake-map -- 52.30 4.85 52.40 4.97   (custom south west north east)
import { getChunk } from '../server/mapdata.js';
import { toTile, CHUNK } from '../shared/geo.js';

const [s, w, n, e] = process.argv.length >= 6 ? process.argv.slice(2, 6).map(Number) : [52.350, 4.865, 52.388, 4.935];
const a = toTile(n, w), b = toTile(s, e);
const cx0 = Math.floor(a.x / CHUNK), cx1 = Math.floor(b.x / CHUNK);
const cz0 = Math.floor(a.z / CHUNK), cz1 = Math.floor(b.z / CHUNK);
const total = (cx1 - cx0 + 1) * (cz1 - cz0 + 1);
console.log(`Baking ${total} chunks of 256 m for ${s},${w} .. ${n},${e}`);

let done = 0, failed = 0;
for (let cz = cz0; cz <= cz1; cz++) {
  for (let cx = cx0; cx <= cx1; cx++) {
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const c = await getChunk(cx, cz);
        ok = true;
        done++;
        console.log(`[${done + failed}/${total}] ${cx},${cz}: ${c.b.length} buildings, ${c.w.length} water, ${c.r.length} ways`);
      } catch (err) {
        console.warn(`  ${cx},${cz} attempt ${attempt + 1} failed: ${err.message}`);
        await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
      }
    }
    if (!ok) failed++;
  }
}
console.log(`Done: ${done} cached, ${failed} failed.`);
process.exit(failed ? 1 : 0);
