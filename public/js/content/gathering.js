// Client-side models, icons and UI for the "gathering" content pack. See docs/ENGINE.md.
// Models: ./gathering/models.js, icons: ./gathering/icons.js. This file animates objects and draws each
// player's own farming patch state, sent by the server as { t: 'gath:farm', patches: [...] }.
import { registry } from '../registry.js';
import { buildPatchOverlay } from './gathering/models.js';
import './gathering/icons.js';

const farm = new Map(); // object id -> patch view for this player

registry.msgHandlers['gath:farm'] = m => {
  for (const v of m.patches || []) farm.set(v.id, v);
};

let lastFarm = 0;
registry.frameHooks.push((now, ctx) => {
  const r = ctx?.renderer;
  if (!r?.objs) return;
  for (const o of r.objs.values()) o.root.userData.tick?.(now);
  if (now - lastFarm < 250) return;
  lastFarm = now;
  for (const [id, o] of r.objs) {
    if (!o.root.userData.farmPatch) continue;
    const v = farm.get(id);
    const sig = v ? JSON.stringify([v.w, v.crop, v.stage, v.comp]) : '';
    if (o.root.userData.farmSig === sig) continue;
    o.root.userData.farmSig = sig;
    const old = o.root.userData.farmOverlay;
    if (old) { o.root.remove(old); old.geometry.dispose(); old.material.dispose(); }
    const mesh = v ? buildPatchOverlay(v) : null;
    o.root.userData.farmOverlay = mesh;
    if (mesh) { mesh.traverse(m => { m.userData.pick = { kind: 'obj', id }; }); o.root.add(mesh); }
  }
});
