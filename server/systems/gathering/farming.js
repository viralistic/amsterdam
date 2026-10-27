// Farming: per-player volkstuin allotments (Westerpark, Amstelpark) and herb patches (Hortus Botanicus).
// Everyone sees their own patch: state lives in api.playerStore(p, 'gathering').farm and is sent to the client
// as { t: 'gath:farm', patches: [...] } so it can draw weeds and growth stages on the shared patch objects.
// Crops grow in real time, also while you are logged out.
import { CROPS } from '../../../shared/content/gathering/data.js';

const WEED_MS = 4 * 60_000; // an empty patch grows one weed level every 4 minutes
const PATCH_KIND = { allotment_patch: 'allotment', herb_patch: 'herb' };

export function setupFarming(api, G) {
  const { ITEMS } = api;
  const store = p => (api.playerStore(p, 'gathering').farm ??= {});
  const stateOf = (p, obj) => (store(p)[obj.data.key] ??= { w: 3, wt: Date.now(), crop: null, t0: 0, comp: 0, lives: 0 });
  const weedsNow = s => s.crop ? 0 : Math.min(3, s.w + Math.floor((Date.now() - s.wt) / WEED_MS));
  const setWeeds = (s, n) => { s.w = n; s.wt = Date.now(); };
  const stageNow = s => { const c = CROPS[s.crop]; return c ? Math.min(c.stages, Math.floor((Date.now() - s.t0) / (c.stage * 60_000))) : 0; };
  const ready = s => s.crop && stageNow(s) >= CROPS[s.crop].stages;
  const patchName = obj => obj.type === 'herb_patch' ? 'herb patch' : 'allotment';

  function view(p, obj) {
    const s = stateOf(p, obj), c = CROPS[s.crop];
    return { id: obj.id, kind: PATCH_KIND[obj.type], w: weedsNow(s), crop: s.crop, color: c?.color, stage: stageNow(s), stages: c?.stages || 0, comp: s.comp };
  }
  function sync(p, force) {
    const near = G.patches.filter(o => api.cheb(o.x, o.z, p.x, p.z) <= 70);
    const patches = near.map(o => view(p, o));
    const sig = JSON.stringify(patches);
    if (!force && sig === p.gathFarmSig) return;
    p.gathFarmSig = sig;
    api.send(p, { t: 'gath:farm', patches });
  }
  api.onPlayerTick(p => { if ((api.tick + p.id) % 8 === 0) sync(p); });
  api.onLogin(p => { p.gathFarmSig = null; });

  // ---- rake
  function rake(p, obj) {
    const s = stateOf(p, obj);
    if (s.crop) return api.msg(p, "You can't rake a patch with something growing in it.");
    if (!weedsNow(s)) return api.msg(p, 'This patch is already clear of weeds.');
    if (!api.hasItem(p, 'rake')) return api.msg(p, 'You need a rake to clear the weeds.');
    api.startAction(p, {
      first: 2, every: 4, anim: 'farm', obj, name: 'farming',
      step: pl => {
        const st = stateOf(pl, obj);
        const w = weedsNow(st);
        if (!w || st.crop) return false;
        if (!api.hasItem(pl, 'rake')) return false;
        setWeeds(st, w - 1);
        api.giveOrDrop(pl, 'weeds', 1);
        api.addXp(pl, 'farming', 4);
        sync(pl, true);
        if (w - 1 === 0) { api.msg(pl, `You have cleared the ${patchName(obj)} of weeds. It is ready for planting.`); return false; }
        return true;
      },
    });
    api.msg(p, 'You start raking the patch.');
  }
  for (const type of Object.keys(PATCH_KIND)) api.objectAction(type, 'Rake', rake);

  // ---- harvest / pick
  function harvest(p, obj) {
    const s = stateOf(p, obj);
    if (!s.crop) return api.msg(p, weedsNow(s) ? 'This patch is overgrown with weeds. You should rake it first.' : "There's nothing growing in this patch. Use some seeds on it to plant them.");
    if (!ready(s)) return api.msg(p, `The ${CROPS[s.crop].name} are still growing. Be patient, like a Dutch train passenger.`);
    const allot = obj.type === 'allotment_patch';
    if (allot && !api.hasItem(p, 'spade')) return api.msg(p, 'You need a spade to harvest your crops.');
    api.msg(p, allot ? 'You begin to harvest the allotment.' : 'You begin to harvest the herb patch.');
    api.startAction(p, {
      first: 2, every: 3, anim: 'farm', obj, name: 'farming',
      step: pl => {
        const st = stateOf(pl, obj), c = CROPS[st.crop];
        if (!c || !ready(st)) return false;
        if (!api.canAdd(pl, c.produce, 1)) { api.msg(pl, 'You have run out of inventory space.'); return false; }
        api.invAdd(pl, c.produce, 1);
        api.addXp(pl, 'farming', c.harvestXp);
        const lose = Math.max(0.3, 0.75 - api.lv(pl, 'farming') * 0.005);
        if (Math.random() < lose) st.lives--;
        if (st.lives <= 0) {
          st.crop = null; st.comp = 0; setWeeds(st, 0);
          api.msg(pl, `The ${patchName(obj)} is now empty.`);
          sync(pl, true);
          return false;
        }
        return true;
      },
    });
  }
  api.objectAction('allotment_patch', 'Harvest', harvest);
  api.objectAction('herb_patch', 'Pick', harvest);

  // ---- inspect
  function inspect(p, obj) {
    const s = stateOf(p, obj), w = weedsNow(s), c = CROPS[s.crop];
    const lines = [`This is ${obj.type === 'herb_patch' ? 'a herb patch' : 'an allotment'}: ${obj.data.name || ''}.`.replace(': .', '.')];
    lines.push(s.comp ? 'The soil has been treated with compost.' : 'The soil has not been treated.');
    if (c) {
      const st = stageNow(s);
      if (st >= c.stages) lines.push(`The ${c.name} are fully grown and ready to harvest.`);
      else {
        const left = Math.max(1, Math.ceil((s.t0 + c.stages * c.stage * 60_000 - Date.now()) / 60_000));
        lines.push(`The patch has ${c.name} growing in it (stage ${st + 1} of ${c.stages}). Ready in about ${left} minute${left > 1 ? 's' : ''}.`);
      }
    } else if (w) lines.push(`The patch needs weeding${w === 3 ? ', badly' : ''}. Use a rake.`);
    else lines.push(`The patch is empty and weeded. Plant ${obj.type === 'herb_patch' ? 'a herb seed' : 'three seeds'} with a seed dibber.`);
    api.startDialog(p, null, { start: [{ npc: lines.join(' ') }] }, obj.type === 'herb_patch' ? 'Herb patch' : 'Allotment');
  }
  for (const type of Object.keys(PATCH_KIND)) api.objectAction(type, 'Inspect', inspect);

  // ---- use seeds, compost or a spade on a patch
  api.onUse((p, u) => {
    if (u.kind !== 'obj' || !PATCH_KIND[u.obj.type]) return false;
    const obj = u.obj, s = stateOf(p, obj), id = u.item.id, kind = PATCH_KIND[obj.type];
    if (CROPS[id]) {
      const c = CROPS[id];
      if (c.patch !== kind) { api.msg(p, kind === 'herb' ? 'You can only plant herb seeds in a herb patch.' : 'You can only plant allotment seeds in an allotment.'); return true; }
      if (s.crop) { api.msg(p, 'Something is already growing in this patch.'); return true; }
      if (weedsNow(s)) { api.msg(p, 'This patch needs weeding first.'); return true; }
      if (api.lv(p, 'farming') < c.level) { api.msg(p, `You need a Farming level of ${c.level} to plant ${c.name}.`); return true; }
      if (!api.hasItem(p, 'seed_dibber')) { api.msg(p, 'You need a seed dibber to plant seeds.'); return true; }
      if (!api.hasItem(p, id, c.seeds)) { api.msg(p, `You need ${c.seeds} seeds to plant an allotment.`); return true; }
      api.invRemove(p, id, c.seeds);
      s.crop = id; s.t0 = Date.now(); s.lives = 3 + (kind === 'allotment' ? 1 : 0) + s.comp;
      api.addXp(p, 'farming', c.plantXp);
      p.anim = 'farm'; p.animUntil = api.tick + 3;
      api.msg(p, c.seeds > 1 ? `You plant ${c.seeds} ${ITEMS[id].name.toLowerCase()}s in the ${patchName(obj)}.` : `You plant ${ITEMS[id].name.toLowerCase().replace(' seed', '')} seed in the herb patch.`);
      sync(p, true);
      return true;
    }
    if (id === 'compost') {
      if (s.comp) { api.msg(p, 'This patch has already been treated with compost.'); return true; }
      if (weedsNow(s)) { api.msg(p, 'You should rake the weeds away before adding compost.'); return true; }
      if (ready(s)) { api.msg(p, "The crop is fully grown; compost won't help it now."); return true; }
      p.rec.inv[u.slot] = { id: 'bucket', q: 1 }; p.invDirty = true;
      s.comp = 1; if (s.crop) s.lives++;
      api.addXp(p, 'farming', 18);
      p.anim = 'farm'; p.animUntil = api.tick + 3;
      api.msg(p, `You treat the ${patchName(obj)} with compost.`);
      sync(p, true);
      return true;
    }
    if (id === 'spade') {
      if (!s.crop) { api.msg(p, "There's nothing to dig up here."); return true; }
      if (ready(s)) return harvest(p, obj), true;
      s.crop = null; s.comp = 0; setWeeds(s, 0);
      p.anim = 'farm'; p.animUntil = api.tick + 3;
      api.msg(p, 'You dig up the young plants and clear the patch.');
      sync(p, true);
      return true;
    }
    if (id === 'rake') { rake(p, obj); return true; }
    return false;
  });

  // dev helper: ::growpatches finishes every crop instantly
  api.command('growpatches', p => {
    if (!api.DEV) return;
    for (const s of Object.values(store(p))) if (s.crop) s.t0 = 0;
    sync(p, true);
    api.msg(p, 'Your crops shoot up overnight.');
  });
}
