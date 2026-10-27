// Grand Exchange window: six offer slots, buy/sell offer forms with item search, price guide and collection.
import { registry } from '../../registry.js';

const ge = { slots: [], view: 'offers', form: null, tax: 0.01 };
const $w = () => document.querySelector('#window');
const body = () => document.querySelector('#window .win-body');
const isOpen = () => !$w().hidden && !!body().querySelector('.ge');
const fmt = n => Math.round(n).toLocaleString('en-US');
const short = n => n >= 10_000_000 ? Math.floor(n / 1e6) + 'M' : n >= 100_000 ? Math.floor(n / 1000) + 'K' : fmt(n);

function render(ctx) {
  const { esc, ITEMS, iconImg, send } = ctx;
  if (ge.view === 'form') return renderForm(ctx);
  const cards = ge.slots.map((o, i) => {
    if (!o) return `<div class="ge-slot empty"><div class="ge-h">Empty</div><div class="ge-bb"><button class="ge-btn buy" data-new="buy" data-slot="${i}">Buy</button><button class="ge-btn sell" data-new="sell" data-slot="${i}">Sell</button></div></div>`;
    const pct = Math.round(o.done / o.qty * 100);
    const coll = o.coll.item || o.coll.coins;
    return `<div class="ge-slot ${o.type}"><div class="ge-h">${o.type === 'buy' ? 'Buy' : 'Sell'}</div>
      <div class="ge-it">${iconImg(o.item)}<div><b>${esc(ITEMS[o.item].name)}</b><br><span>${fmt(o.price)} ea</span></div></div>
      <div class="ge-bar ${o.state}"><i style="width:${o.state === 'aborted' ? 100 : pct}%"></i></div>
      <div class="ge-num">${fmt(o.done)}/${fmt(o.qty)}${o.state === 'aborted' ? ' (aborted)' : o.state === 'done' ? ' (done)' : ''}</div>
      ${coll ? `<div class="ge-coll">${o.coll.item ? `${iconImg(o.item, 'ico ge-ci')}<span>${short(o.coll.item)}</span>` : ''}${o.coll.coins ? `${iconImg('coins', 'ico ge-ci')}<span>${short(o.coll.coins)}</span>` : ''}</div>` : ''}
      <div class="ge-bb">${coll || o.state !== 'active' ? `<button class="ge-btn" data-collect="${o.id}">Collect</button>` : ''}${o.state === 'active' ? `<button class="ge-btn abort" data-abort="${o.id}">Abort</button>` : ''}</div></div>`;
  }).join('');
  ctx.openWindow('Grand Exchange', `<div class="ge"><div class="ge-slots">${cards}</div>
    <div class="win-buttons" style="margin-top:8px"><button class="stone" id="ge-collall">Collect all</button><button class="stone" id="ge-prices">Price guide</button></div>
    <p class="note">Buy offers match the cheapest sell offers first; trades happen at the price of the earlier offer. ${Math.round(ge.tax * 100)}% tax on sales. Offers keep trading while you are offline.</p></div>`);
  ctx.S.iface = 'ge';
  const b = body();
  b.querySelectorAll('[data-new]').forEach(el => el.onclick = () => { ge.view = 'form'; ge.form = { type: el.dataset.new, slot: +el.dataset.slot, item: null, qty: 1, price: 0, query: '', touched: false }; render(ctx); });
  b.querySelectorAll('[data-collect]').forEach(el => el.onclick = () => send({ t: 'ge', op: 'collect', id: +el.dataset.collect }));
  b.querySelectorAll('[data-abort]').forEach(el => el.onclick = () => send({ t: 'ge', op: 'abort', id: +el.dataset.abort }));
  b.querySelector('#ge-collall').onclick = () => send({ t: 'ge', op: 'collectall' });
  b.querySelector('#ge-prices').onclick = () => send({ t: 'ge', op: 'prices' });
}

function renderForm(ctx) {
  const { esc, ITEMS, iconImg, send, S } = ctx;
  const f = ge.form;
  const sell = f.type === 'sell';
  const tradeable = id => ITEMS[id] && id !== 'coins' && ITEMS[id].tradeable !== false;
  let pick;
  if (sell) {
    const seen = new Set(), list = [];
    for (const s of S.inv) if (s && tradeable(s.id) && !seen.has(s.id)) { seen.add(s.id); list.push(s.id); }
    pick = list.length ? `<div class="ge-pick">${list.map(id => `<div class="ge-res${f.item === id ? ' on' : ''}" data-item="${id}" title="${esc(ITEMS[id].name)}">${iconImg(id)}</div>`).join('')}</div>` : '<p class="note">You have nothing tradeable in your inventory.</p>';
  } else {
    pick = `<input id="ge-q" class="ge-in wide" placeholder="Search for an item..." value="${esc(f.query)}" autocomplete="off"><div class="ge-pick" id="ge-results"></div>`;
  }
  const have = id => S.inv.reduce((n, s) => n + (s && s.id === id ? s.q : 0), 0);
  ctx.openWindow(sell ? 'Grand Exchange: Sell offer' : 'Grand Exchange: Buy offer', `<div class="ge ge-form">
    ${pick}
    <div class="ge-sel">${f.item ? `${iconImg(f.item)}<div><b>${esc(ITEMS[f.item].name)}</b><br><span id="ge-guide">Guide price: ${f.guide ? fmt(f.guide) : '...'} coins</span>${sell ? `<br><span>You have ${fmt(have(f.item))}</span>` : ''}</div>` : '<span class="note">Choose an item.</span>'}</div>
    <div class="ge-row"><label>Quantity</label><input id="ge-qty" class="ge-in" type="number" min="1" value="${f.qty}"><button class="ge-sm" data-q="1">+1</button><button class="ge-sm" data-q="10">+10</button><button class="ge-sm" data-q="100">+100</button>${sell ? '<button class="ge-sm" data-q="all">All</button>' : '<button class="ge-sm" data-q="1000">+1K</button>'}</div>
    <div class="ge-row"><label>Price each</label><input id="ge-price" class="ge-in" type="number" min="1" value="${f.price || ''}"><button class="ge-sm" data-p="-5">-5%</button><button class="ge-sm" data-p="0">Guide</button><button class="ge-sm" data-p="5">+5%</button></div>
    <div class="ge-total" id="ge-total"></div>
    <div class="win-buttons"><button class="stone" id="ge-ok">Confirm</button><button class="stone" id="ge-back">Back</button></div></div>`);
  ctx.S.iface = 'ge';
  const b = body();
  const qty = b.querySelector('#ge-qty'), price = b.querySelector('#ge-price');
  const total = () => { f.qty = Math.max(1, Math.floor(+qty.value || 1)); f.price = Math.max(0, Math.floor(+price.value || 0)); b.querySelector('#ge-total').textContent = f.item && f.price ? `Total: ${fmt(f.qty * f.price)} coins${sell ? ` (after tax: ${fmt(f.qty * f.price - Math.floor(f.price * ge.tax) * f.qty)})` : ''}` : ''; };
  qty.oninput = total; price.oninput = () => { f.touched = true; total(); };
  b.querySelectorAll('[data-q]').forEach(el => el.onclick = () => { qty.value = el.dataset.q === 'all' ? (f.item ? have(f.item) : 1) : (f.qty === 1 && !f.qtyTouched ? 0 : f.qty) + +el.dataset.q; f.qtyTouched = true; total(); });
  b.querySelectorAll('[data-p]').forEach(el => el.onclick = () => { const d = +el.dataset.p; const base = d ? (f.price || f.guide || 1) : (f.guide || 1); price.value = Math.max(1, d ? Math.round(base * (1 + d / 100)) + (d > 0 ? 0 : 0) : base); f.touched = true; total(); });
  const choose = id => { f.item = id; f.guide = null; f.touched = false; send({ t: 'ge', op: 'guide', item: id }); render(ctx); };
  b.querySelectorAll('.ge-pick [data-item]').forEach(el => el.onclick = () => choose(el.dataset.item));
  if (!sell) {
    const q = b.querySelector('#ge-q'), res = b.querySelector('#ge-results');
    const search = () => {
      f.query = q.value;
      const term = q.value.trim().toLowerCase();
      if (term.length < 2) { res.innerHTML = '<p class="note">Type at least two letters.</p>'; return; }
      const hits = Object.keys(ITEMS).filter(id => tradeable(id) && ITEMS[id].name.toLowerCase().includes(term)).sort((a, c) => ITEMS[a].name.localeCompare(ITEMS[c].name)).slice(0, 24);
      res.innerHTML = hits.map(id => `<div class="ge-res${f.item === id ? ' on' : ''}" data-item="${id}" title="${esc(ITEMS[id].name)}">${iconImg(id)}<span>${esc(ITEMS[id].name)}</span></div>`).join('') || '<p class="note">No items found.</p>';
      res.querySelectorAll('[data-item]').forEach(el => el.onclick = () => choose(el.dataset.item));
    };
    q.oninput = search;
    search();
    if (!f.item) setTimeout(() => q.focus(), 0);
  }
  b.querySelector('#ge-back').onclick = () => { ge.view = 'offers'; render(ctx); };
  b.querySelector('#ge-ok').onclick = () => {
    total();
    if (!f.item) return ctx.chat('Choose an item first.');
    if (!(f.price >= 1)) return ctx.chat('Enter a price.');
    send({ t: 'ge', op: 'place', type: f.type, item: f.item, qty: f.qty, price: f.price, slot: f.slot });
    ge.view = 'offers';
  };
  total();
}

registry.msgHandlers.ge = (m, ctx) => {
  ge.slots = m.slots; ge.tax = m.tax ?? ge.tax;
  if (m.open) { ge.view = 'offers'; render(ctx); return; }
  if (isOpen() && ge.view === 'offers') render(ctx);
};
registry.msgHandlers.ge_guide = (m, ctx) => {
  const f = ge.form;
  if (!f || f.item !== m.item) return;
  f.guide = m.price;
  if (!f.touched) f.price = m.price;
  if (isOpen() && ge.view === 'form') {
    const el = body().querySelector('#ge-guide');
    if (el) el.textContent = `Guide price: ${fmt(m.price)} coins${m.recent?.length ? ` (last: ${m.recent.map(fmt).join(', ')})` : ''}`;
    const pr = body().querySelector('#ge-price');
    if (pr && !f.touched) { pr.value = m.price; pr.dispatchEvent(new Event('input')); f.touched = false; }
  }
};
registry.msgHandlers.ge_prices = (m, ctx) => {
  const { esc, ITEMS, iconImg } = ctx;
  const rows = m.list.map(r => `<tr><td>${iconImg(r.id, 'ico ge-ci')}</td><td>${esc(ITEMS[r.id].name)}</td><td class="r">${fmt(r.price)}</td><td class="r">${fmt(r.n)}</td></tr>`).join('');
  const wasGe = ctx.S.iface === 'ge';
  ctx.openWindow('Grand Exchange price guide', `<div class="eco-pg">${rows ? `<table class="eco-tab"><tr><th></th><th>Item</th><th class="r">Guide price</th><th class="r">Traded</th></tr>${rows}</table>` : '<p class="note">Nothing has been traded yet. Prices fall back to the shop value of each item.</p>'}
    <p class="note">Guide prices are the average of the last 25 trades. Coins removed from the economy by GE tax: ${fmt(m.taxed || 0)}.</p>
    ${wasGe ? '<div class="win-buttons"><button class="stone" id="ge-back2">Back</button></div>' : ''}</div>`);
  if (wasGe) { ctx.S.iface = 'ge'; document.querySelector('#ge-back2').onclick = () => { ge.view = 'offers'; render(ctx); }; }
};
