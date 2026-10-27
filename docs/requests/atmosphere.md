# Engine requests from the atmosphere pack

1. **Bug: `public/js/world.js` calls `tileNoise()` but no longer defines it** (lost when buildings moved to
   `buildings.js`). Every chunk build throws, the chunk is marked failed and the world renders black (this is the
   "black ground and sky" seen in headless tests near the Dam). Fix: restore the helper at the bottom of world.js:
   ```js
   // Per-tile brightness jitter gives the ground that chunky old-school tile look.
   function tileNoise(g, size, x0, z0) {
     const img = g.getImageData(0, 0, size, size);
     const d = img.data;
     for (let ty = 0; ty < CHUNK; ty++) for (let tx = 0; tx < CHUNK; tx++) {
       const f = 0.94 + hash(x0 + tx, z0 + ty) * 0.12;
       for (let py = 0; py < PX; py++) for (let pxx = 0; pxx < PX; pxx++) {
         const i = ((ty * PX + py) * size + tx * PX + pxx) * 4;
         d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
       }
     }
     g.putImageData(img, 0, 0);
   }
   ```
2. **`World.unload` disposes every geometry and `material.map` in the chunk group**, so decorators cannot add
   instanced meshes that share geometry/textures across chunks. Atmosphere works around it by keeping its meshes in
   its own scene groups and sweeping them when the chunk disappears. Nicer: a `registry.chunkUnloaders` list (called
   with the chunk in `unload`) or skipping objects flagged `userData.shared`.
3. **Expose the scene lights** (`renderer.hemi`, `renderer.sun`) so the day/night code doesn't have to find them by
   type in `scene.children`.
4. **A chat hook** (`registry.chatHooks.push((text, kind) => {})` called from `chat()`): atmosphere currently watches
   `#chat-lines` with a MutationObserver to play eat/drink/door sounds.
5. Optional: call `registry.sfx?.('xp')` / `('click')` from main.js where it makes sense (xp drops, menu choices).
