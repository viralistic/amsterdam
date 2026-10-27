// The Prayer tab: an OSRS-style prayer book, quick-prayer setup and the prayer orb toggle.
import { registry } from '../../registry.js';
import { PRAYERS } from '/shared/content/production/data.js';
import { levelForXp } from '/shared/items.js';

const state = { on: [], quick: [], quickOn: false, boosts: {}, setup: false, pick: [] };
let tabEl = null, lastHead = '';

const css = document.createElement('style');
css.textContent = `
#tab-prayer .pr-head { display: flex; justify-content: space-between; align-items: center; color: #ff981f; font-size: 13px; margin: 2px 2px 6px; }
#tab-prayer .pr-head b { color: #fff; }
#tab-prayer .pr-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; }
#tab-prayer .pr { position: relative; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; }
#tab-prayer .pr img { width: 30px; height: 27px; image-rendering: pixelated; }
#tab-prayer .pr.locked img { filter: grayscale(1) brightness(0.45); }
#tab-prayer .pr.on { background: radial-gradient(circle, rgba(255,240,170,0.55) 0%, rgba(255,210,90,0.25) 55%, rgba(0,0,0,0) 72%); }
#tab-prayer .pr.q { box-shadow: inset 0 0 0 2px #00d0ff; border-radius: 6px; }
#tab-prayer .pr-foot { margin-top: 8px; display: flex; gap: 6px; justify-content: center; }
#tab-prayer .pr-foot button { font-size: 12px; padding: 3px 8px; }
#tab-prayer .pr-note { color: #c8c0a8; font-size: 11px; text-align: center; margin: 6px 2px 0; min-height: 14px; }
#tab-prayer .pr-boost { color: #9fe870; font-size: 11px; text-align: center; margin-top: 4px; }
`;
document.head.appendChild(css);

const prayerLevel = ctx => levelForXp(ctx.S.xp?.prayer || 0);

function head(ctx) {
  return `<span>Prayer points:</span><b>${ctx.S.pr ?? 0} / ${prayerLevel(ctx)}</b>`;
}

function render(el, ctx) {
  tabEl = el;
  if (!ctx?.S) return;
  const lvl = prayerLevel(ctx);
  const sel = state.setup ? state.pick : state.on;
  const b = state.boosts || {};
  const boosts = ['attack', 'strength', 'defence'].filter(k => b[k]).map(k => `${k[0].toUpperCase() + k.slice(1)} ${b[k] > 0 ? '+' : ''}${b[k]}`).join(', ');
  el.innerHTML = `<div class="pr-head">${head(ctx)}</div>
    <div class="pr-grid">${PRAYERS.map(p => `<div class="pr${lvl < p.level ? ' locked' : ''}${sel.includes(p.id) ? (state.setup ? ' q' : ' on') : ''}" data-id="${p.id}" title="${p.name} (level ${p.level})\n${p.desc}">${ctx.iconImg('pi_' + p.id, '')}</div>`).join('')}</div>
    <div class="pr-note">${state.setup ? 'Select your quick-prayers, then press Done.' : 'Click the prayer orb to toggle your quick-prayers.'}</div>
    <div class="pr-foot">${state.setup ? '<button class="stone" data-a="done">Done</button><button class="stone" data-a="cancel">Cancel</button>' : '<button class="stone" data-a="setup">Setup quick-prayers</button>'}</div>
    ${boosts ? `<div class="pr-boost">Potion boosts: ${boosts}</div>` : ''}`;
  lastHead = head(ctx);
  el.querySelectorAll('.pr').forEach(d => d.onclick = () => {
    const id = d.dataset.id, p = PRAYERS.find(x => x.id === id);
    if (state.setup) {
      if (state.pick.includes(id)) state.pick = state.pick.filter(x => x !== id);
      else { state.pick = state.pick.filter(x => !PRAYERS.find(y => y.id === x).occ.some(o => p.occ.includes(o))); state.pick.push(id); }
      return render(el, ctx);
    }
    if (prayerLevel(ctx) < p.level) return ctx.chat(`You need a Prayer level of ${p.level} to use ${p.name}.`);
    ctx.send({ t: 'prod:prayer', id });
  });
  el.querySelectorAll('.pr-foot button').forEach(btn => btn.onclick = () => {
    const a = btn.dataset.a;
    if (a === 'setup') { state.setup = true; state.pick = [...state.quick]; }
    if (a === 'cancel') state.setup = false;
    if (a === 'done') { state.setup = false; state.quick = [...state.pick]; ctx.send({ t: 'prod:setquick', ids: state.pick }); }
    render(el, ctx);
  });
}

function orb() {
  const o = document.getElementById('orb-pray');
  if (o) o.style.boxShadow = state.on.length ? 'inset 0 0 0 2px #7ad8ff, 0 0 6px #7ad8ff' : '';
}

registry.tabs.push({ id: 'prayer', icon: 'sk_prayer', title: 'Prayer', render });

registry.msgHandlers['prod:prayer'] = (m, ctx) => {
  Object.assign(state, { on: m.on || [], quick: m.quick || [], quickOn: !!m.quickOn, boosts: m.boosts || {} });
  orb();
  if (tabEl) render(tabEl, ctx);
};
registry.msgHandlers['orb:prayer'] = (m, ctx) => ctx.send({ t: 'prod:quick' });

// keep the points counter in the header current without rebuilding the whole tab
let lastCheck = 0;
registry.frameHooks.push((now, ctx) => {
  if (!tabEl || now - lastCheck < 250 || !ctx?.S) return;
  lastCheck = now;
  const h = head(ctx);
  if (h === lastHead) return;
  const lvlChanged = !lastHead.endsWith(`/ ${prayerLevel(ctx)}</b>`);
  if (lvlChanged) return render(tabEl, ctx);
  lastHead = h;
  const el = tabEl.querySelector('.pr-head');
  if (el) el.innerHTML = h;
});
