// Side-panel tabs: collection log, Amsterdam Diary and friends/ignore list with private messages and reports.
import { registry } from '../../registry.js';

const tabEl = id => document.getElementById('tab-' + id);
const fmt = n => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------- collection log
const clog = { cats: [], got: {}, open: null };
const total = () => clog.cats.reduce((n, c) => n + c.items.length, 0);
const gotIn = c => c.items.filter(id => clog.got[id]).length;

function renderClog(el, ctx) {
  if (!el) return;
  const all = gotIn({ items: clog.cats.flatMap(c => c.items) });
  el.innerHTML = `<div class="eco-th">Collection Log<br><span>${all}/${total()}</span></div>
    <div class="eco-list">${clog.cats.map((c, i) => { const g = gotIn(c); return `<div class="eco-cat${g === c.items.length ? ' full' : g ? ' some' : ''}" data-i="${i}"><span>${ctx.esc(c.name)}</span><b>${g}/${c.items.length}</b></div>`; }).join('') || '<p class="note">Loading...</p>'}</div>
    <p class="note">Items are logged the first time you obtain them.</p>`;
  el.querySelectorAll('.eco-cat').forEach(d => d.onclick = () => openCat(+d.dataset.i, ctx));
}
function openCat(i, ctx) {
  const c = clog.cats[i];
  if (!c) return;
  clog.open = i;
  const { ITEMS, iconImg, esc } = ctx;
  ctx.openWindow(`Collection Log: ${c.name}`, `<div class="eco-clog"><div class="eco-cl-tabs">${clog.cats.map((k, j) => `<button class="ge-sm${j === i ? ' on' : ''}" data-j="${j}">${esc(k.name)}</button>`).join('')}</div>
    <div class="eco-cl-head">${esc(c.name)}: <b>${gotIn(c)}/${c.items.length}</b></div>
    <div class="eco-cl-grid">${c.items.map(id => `<div class="eco-cl-it${clog.got[id] ? ' got' : ''}" title="${esc(ITEMS[id].name)}${clog.got[id] ? ' - obtained ' + new Date(clog.got[id]).toLocaleDateString() : ''}">${iconImg(id)}</div>`).join('')}</div></div>`);
  document.querySelectorAll('.eco-cl-tabs [data-j]').forEach(b => b.onclick = () => openCat(+b.dataset.j, ctx));
}
const clogOpen = () => !document.querySelector('#window').hidden && document.querySelector('#window .eco-clog');
registry.tabs.push({ id: 'eco_clog', icon: 'eco_clog', title: 'Collection Log', render: (el, ctx) => renderClog(el, ctx) });
registry.msgHandlers.eco_clog = (m, ctx) => { clog.cats = m.cats; clog.got = m.got; renderClog(tabEl('eco_clog'), ctx); };
registry.msgHandlers.eco_clog_new = (m, ctx) => { clog.got = m.got; renderClog(tabEl('eco_clog'), ctx); if (clogOpen() && clog.open !== null) openCat(clog.open, ctx); registry.sfx?.('collection'); };
registry.msgHandlers.eco_clog_open = (m, ctx) => openCat(0, ctx);

// ---------------------------------------------------------------- Amsterdam Diary
const diary = { tasks: [], claimed: {}, show: { easy: true, medium: false, hard: false } };
const TIER = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
function renderDiary(el, ctx) {
  if (!el) return;
  const { esc } = ctx;
  el.innerHTML = `<div class="eco-th">Amsterdam Diary</div>${Object.keys(TIER).map(t => {
    const ts = diary.tasks.filter(x => x.tier === t), done = ts.filter(x => x.done).length;
    const state = done === ts.length && ts.length ? 'full' : done ? 'some' : '';
    return `<div class="eco-cat ${state}" data-t="${t}"><span>${TIER[t]}${diary.claimed[t] ? ' &#10003;' : ''}</span><b>${done}/${ts.length}</b></div>
      ${diary.show[t] ? `<div class="eco-tasks">${ts.map(x => `<div class="${x.done ? 'd' : ''}">${esc(x.text)}${x.progress ? ` <i>(${esc(x.progress)})</i>` : ''}</div>`).join('')}</div>` : ''}`;
  }).join('')}<button class="stone opt-btn" id="eco-diary-win">Open diary</button><p class="note">Claim Amsterdams Wapen capes from the Stadsarchivaris on the Vijzelstraat.</p>`;
  el.querySelectorAll('.eco-cat').forEach(d => d.onclick = () => { diary.show[d.dataset.t] = !diary.show[d.dataset.t]; renderDiary(el, ctx); });
  el.querySelector('#eco-diary-win').onclick = () => openDiary(ctx);
}
function openDiary(ctx) {
  const { esc } = ctx;
  ctx.openWindow('Amsterdam Diary', `<div class="eco-diary">${Object.keys(TIER).map(t => {
    const ts = diary.tasks.filter(x => x.tier === t);
    return `<h4>${TIER[t]} <span>${ts.filter(x => x.done).length}/${ts.length}${diary.claimed[t] ? ' - reward claimed' : ''}</span></h4>${ts.map(x => `<p class="${x.done ? 'd' : ''}">${esc(x.text)}${x.progress ? ` <i>(${esc(x.progress)})</i>` : ''}</p>`).join('')}`;
  }).join('')}<p class="note">Rewards: Amsterdams Wapen capes (easy, medium, hard) with combat bonuses, cheaper fares, free OV-fiets rental and a teleport to the Dam.</p></div>`);
}
registry.tabs.push({ id: 'eco_diary', icon: 'eco_diary', title: 'Amsterdam Diary', render: (el, ctx) => renderDiary(el, ctx) });
registry.msgHandlers.eco_diary = (m, ctx) => {
  diary.tasks = m.tasks; diary.claimed = m.claimed;
  renderDiary(tabEl('eco_diary'), ctx);
  if (!document.querySelector('#window').hidden && document.querySelector('#window .eco-diary')) openDiary(ctx);
};
registry.msgHandlers.eco_diary_open = (m, ctx) => openDiary(ctx);

// ---------------------------------------------------------------- friends and ignore
const fr = { friends: [], ignore: [], reasons: [], view: 'friends', pmTo: null, admin: false };
function renderFriends(el, ctx) {
  if (!el) return;
  const { esc, send } = ctx;
  const list = fr.view === 'friends'
    ? fr.friends.map(f => `<div class="eco-fr" data-n="${esc(f.name)}"><span>${esc(f.name)}</span><b class="${f.online ? 'on' : 'off'}">${f.online ? 'Online' : 'Offline'}</b></div>`).join('')
    : fr.ignore.map(n => `<div class="eco-fr" data-n="${esc(n)}"><span>${esc(n)}</span></div>`).join('');
  el.innerHTML = `<div class="eco-ftabs"><button class="ge-sm${fr.view === 'friends' ? ' on' : ''}" data-v="friends">Friends (${fr.friends.length})</button><button class="ge-sm${fr.view === 'ignore' ? ' on' : ''}" data-v="ignore">Ignore (${fr.ignore.length})</button></div>
    <div class="eco-flist">${list || `<p class="note">${fr.view === 'friends' ? 'Your friends list is empty.' : 'You are not ignoring anyone.'}</p>`}</div>
    ${fr.pmTo ? `<div class="eco-pmrow"><span>To ${esc(fr.pmTo)}:</span><input id="eco-pm" maxlength="80" autocomplete="off"></div>` : ''}
    <div class="eco-addrow"><input id="eco-add" maxlength="12" placeholder="Name" autocomplete="off"><button class="ge-sm" id="eco-addb">Add</button><button class="ge-sm" id="eco-rep">Report</button></div>`;
  el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { fr.view = b.dataset.v; renderFriends(el, ctx); });
  el.querySelectorAll('.eco-fr').forEach(d => {
    const name = d.dataset.n;
    const t = `<span class="c-player">${esc(name)}</span>`;
    ctx.pressable(d, () => fr.view === 'friends'
      ? [{ label: 'Message', target: t, fn: () => { fr.pmTo = name; renderFriends(el, ctx); el.querySelector('#eco-pm')?.focus(); } },
        { label: 'Remove', target: t, fn: () => send({ t: 'eco_social', op: 'del', list: 'friends', name }) },
        { label: 'Report', target: t, fn: () => openReport(ctx, name) }]
      : [{ label: 'Unignore', target: t, fn: () => send({ t: 'eco_social', op: 'del', list: 'ignore', name }) }, { label: 'Report', target: t, fn: () => openReport(ctx, name) }]);
  });
  const pm = el.querySelector('#eco-pm');
  if (pm) pm.onkeydown = e => {
    if (e.key === 'Enter') { const text = pm.value.trim(); if (text) send({ t: 'eco_social', op: 'pm', to: fr.pmTo, text }); fr.pmTo = null; renderFriends(el, ctx); }
    if (e.key === 'Escape') { fr.pmTo = null; renderFriends(el, ctx); }
    e.stopPropagation();
  };
  const add = el.querySelector('#eco-add');
  el.querySelector('#eco-addb').onclick = () => { const n = add.value.trim(); if (n) send({ t: 'eco_social', op: 'add', list: fr.view, name: n }); };
  add.onkeydown = e => { if (e.key === 'Enter') el.querySelector('#eco-addb').click(); e.stopPropagation(); };
  el.querySelector('#eco-rep').onclick = () => openReport(ctx, add.value.trim());
}
function openReport(ctx, name = '') {
  const { esc, send } = ctx;
  ctx.openWindow('Report abuse', `<div class="eco-rep"><p>Player name: <input id="rep-name" maxlength="12" value="${esc(name)}" autocomplete="off"></p><p class="note">Choose the rule that was broken:</p>
    <div class="eco-reasons">${fr.reasons.map(r => `<button class="ge-sm" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>`);
  document.querySelectorAll('.eco-reasons [data-r]').forEach(b => b.onclick = () => {
    const n = document.querySelector('#rep-name').value.trim();
    if (!n) return ctx.chat('Enter the name of the player you want to report.');
    send({ t: 'eco_social', op: 'report', name: n, reason: b.dataset.r });
    ctx.closeWindow(false);
  });
}
registry.tabs.push({ id: 'eco_friends', icon: 'eco_friends', title: 'Friends', render: (el, ctx) => renderFriends(el, ctx) });
registry.msgHandlers.eco_friends = (m, ctx) => {
  Object.assign(fr, { friends: m.friends, ignore: m.ignore, reasons: m.reasons, admin: m.admin });
  const el = tabEl('eco_friends');
  if (el && el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return setTimeout(() => registry.msgHandlers.eco_friends(m, ctx), 1500);
  renderFriends(el, ctx);
};
void fmt;

// right-click options on other players
registry.playerOptions.push((e, ctx) => [
  { label: 'Add friend', fn: () => ctx.send({ t: 'eco_social', op: 'add', list: 'friends', name: e.n }) },
  { label: 'Report', fn: () => openReport(ctx, e.n) },
]);
