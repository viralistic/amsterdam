// Grand Exchange at Dam Square: 6 offer slots per player, buy/sell offers matched by price then time,
// partial fills, a collection box, aborting, 1% sales tax, and a price guide. Offers live in the world store,
// so they keep trading while their owners are offline.
import { GE_CENTRE } from '../../../shared/content/economy/places.js';
import { fmt } from './common.js';

const SLOTS = 6;
const MAX_TOTAL = 2_147_483_647;
const TAX = 0.01, TAX_CAP = 5_000_000;

export default function ge(api, E) {
  const { ITEMS } = api;
  const st = (E.store.ge ??= { next: 1, offers: {}, trades: {}, taxed: 0, volume: 0 });
  const offersOf = key => Object.values(st.offers).filter(o => o.owner === key);
  const remaining = o => o.qty - o.done;
  const tradeable = id => ITEMS[id] && id !== 'coins' && ITEMS[id].tradeable !== false;

  // ---- price guide: volume-weighted average of the last 25 trades, falling back to the item's value
  function guide(id) {
    const list = st.trades[id];
    if (!list?.length) return ITEMS[id]?.value || 1;
    let q = 0, s = 0;
    for (const [price, n] of list) { q += n; s += price * n; }
    return Math.max(1, Math.round(s / q));
  }
  E.guide = guide;

  function recordTrade(id, price, n) {
    const list = (st.trades[id] ??= []);
    list.push([price, n, Date.now()]);
    if (list.length > 25) list.splice(0, list.length - 25);
    st.volume += price * n;
  }

  function view(o) {
    return { id: o.id, slot: o.slot, type: o.type, item: o.item, price: o.price, qty: o.qty, done: o.done, spent: o.spent, state: o.state, coll: o.coll, t: o.t };
  }

  function sendGe(p, extra = {}) {
    const slots = Array(SLOTS).fill(null);
    for (const o of offersOf(p.key)) slots[o.slot] = view(o);
    api.send(p, { t: 'ge', slots, tax: TAX, ...extra });
  }
  E.sendGe = sendGe;

  function notify(o, text) {
    const p = E.online(o.owner);
    if (p) {
      api.msg(p, text, 'level');
      if (p.iface === 'ge') sendGe(p);
      o.seen = true;
    } else o.seen = false;
  }

  // Executes a fill between a buy and a sell offer at the earlier offer's price.
  function fill(buy, sell, n, price) {
    const tax = Math.min(TAX_CAP, Math.floor(price * TAX) * n);
    buy.done += n; sell.done += n;
    buy.spent += price * n; sell.spent += price * n;
    buy.coll.item += n;
    buy.coll.coins += (buy.price - price) * n; // refund the difference to the buyer
    sell.coll.coins += price * n - tax;
    st.taxed += tax;
    recordTrade(buy.item, price, n);
    for (const o of [buy, sell]) if (remaining(o) <= 0) o.state = 'done';
    const name = ITEMS[buy.item].name;
    notify(buy, `Grand Exchange: Bought ${buy.done}/${buy.qty} x ${name}.`);
    notify(sell, `Grand Exchange: Sold ${sell.done}/${sell.qty} x ${name}${tax ? ` (${fmt(tax)} coins tax)` : ''}.`);
    for (const o of [buy, sell]) { const p = E.online(o.owner); if (p) E.emit(p, 'ge_trade', { type: o.type, item: o.item, n, price }); }
  }

  function match(offer) {
    const isBuy = offer.type === 'buy';
    const cands = Object.values(st.offers)
      .filter(o => o.item === offer.item && o.type !== offer.type && o.state === 'active' && remaining(o) > 0 && o.owner !== offer.owner
        && (isBuy ? o.price <= offer.price : o.price >= offer.price))
      .sort((a, b) => (isBuy ? a.price - b.price : b.price - a.price) || a.t - b.t || a.id - b.id);
    for (const c of cands) {
      if (remaining(offer) <= 0) break;
      const n = Math.min(remaining(offer), remaining(c));
      // the trade happens at the price of the offer that was there first (as in OSRS)
      const first = c.t <= offer.t ? c : offer;
      if (isBuy) fill(offer, c, n, first.price); else fill(c, offer, n, first.price);
    }
    api.touch();
  }

  function place(p, m) {
    const type = m.type === 'buy' ? 'buy' : m.type === 'sell' ? 'sell' : null;
    const item = String(m.item || '');
    const qty = Math.floor(+m.qty), price = Math.floor(+m.price);
    if (!type || !tradeable(item)) return api.msg(p, "You can't trade that item on the Grand Exchange.");
    if (!(qty >= 1) || !(price >= 1) || qty * price > MAX_TOTAL) return api.msg(p, 'That offer is not valid.');
    const mine = offersOf(p.key);
    const used = new Set(mine.map(o => o.slot));
    let slot = Number.isInteger(m.slot) && m.slot >= 0 && m.slot < SLOTS && !used.has(m.slot) ? m.slot : -1;
    if (slot < 0) for (let i = 0; i < SLOTS; i++) if (!used.has(i)) { slot = i; break; }
    if (slot < 0) return api.msg(p, 'All of your Grand Exchange slots are in use.');
    if (type === 'buy') {
      if (!api.invRemove(p, 'coins', qty * price)) return api.msg(p, "You don't have enough coins in your inventory for that offer.");
    } else {
      if (api.invCount(p, item) < qty) return api.msg(p, `You don't have ${qty} x ${ITEMS[item].name} in your inventory.`);
      api.invRemove(p, item, qty);
    }
    const o = { id: st.next++, owner: p.key, ownerName: p.name, slot, type, item, price, qty, done: 0, spent: 0, state: 'active', coll: { item: 0, coins: 0 }, t: Date.now(), seen: true };
    st.offers[o.id] = o;
    api.msg(p, `You place an offer to ${type} ${qty.toLocaleString()} x ${ITEMS[item].name} at ${fmt(price)} coins each.`);
    E.emit(p, 'ge_offer', { type, item });
    match(o);
    sendGe(p);
  }

  function ownOffer(p, id) {
    const o = st.offers[+id];
    return o && o.owner === p.key ? o : null;
  }

  function abort(p, id) {
    const o = ownOffer(p, id);
    if (!o || o.state !== 'active') return;
    const left = remaining(o);
    o.state = 'aborted';
    if (o.type === 'buy') o.coll.coins += left * o.price; else o.coll.item += left;
    api.msg(p, 'Your offer has been aborted. Collect the rest from the slot.');
    api.touch();
    sendGe(p);
  }

  function collect(p, id, quiet) {
    const o = ownOffer(p, id);
    if (!o) return;
    const places = new Set();
    if (o.coll.item) {
      const to = o.type === 'buy' ? o.item : o.item; // sell offers return unsold items
      places.add(E.deliver(p, to, o.coll.item));
      o.coll.item = 0;
    }
    if (o.coll.coins) { places.add(E.deliver(p, 'coins', o.coll.coins)); o.coll.coins = 0; }
    if (o.state !== 'active') delete st.offers[o.id];
    if (!quiet && places.has('bank')) api.msg(p, 'Some of your collected items were sent to your bank.');
    api.touch();
    if (!quiet) sendGe(p);
  }

  function open(p, view = 'offers') {
    api.closeIface(p);
    p.iface = 'ge';
    sendGe(p, { open: true, view });
  }
  E.openGe = open;

  // Price guide window: recently traded items and their guide prices.
  function prices(p) {
    const ids = Object.keys(st.trades).filter(id => ITEMS[id]).sort((a, b) => (st.trades[b].at(-1)?.[2] || 0) - (st.trades[a].at(-1)?.[2] || 0)).slice(0, 40);
    api.send(p, { t: 'ge_prices', list: ids.map(id => ({ id, price: guide(id), n: st.trades[id].reduce((s, t) => s + t[1], 0) })), taxed: st.taxed });
  }

  api.onMessage('ge', (p, m) => {
    if (m.op === 'guide') { const id = String(m.item); if (ITEMS[id]) api.send(p, { t: 'ge_guide', item: id, price: guide(id), value: ITEMS[id].value, recent: (st.trades[id] || []).slice(-5).map(t => t[0]) }); return; }
    if (m.op === 'prices') return prices(p);
    if (p.iface !== 'ge') return api.msg(p, 'You need to be at a Grand Exchange booth to do that.');
    if (m.op === 'place') return place(p, m);
    if (m.op === 'abort') return abort(p, m.id);
    if (m.op === 'collect') return collect(p, m.id);
    if (m.op === 'collectall') { for (const o of offersOf(p.key)) collect(p, o.id, true); return sendGe(p); }
  });

  // ---- world: the GE kiosk and booths on Dam Square, with clerks behind them
  const c = api.tile(GE_CENTRE.lat, GE_CENTRE.lon);
  c.x += 8; // leave the middle of the Dam (and its coin spawn) free
  api.spawnObject({ type: 'ge_kiosk', x: c.x, z: c.z });
  const ring = [[0, -5, Math.PI], [5, 0, Math.PI / 2], [0, 5, 0], [-5, 0, -Math.PI / 2]];
  for (const [dx, dz, rot] of ring) {
    api.spawnObject({ type: 'ge_booth', x: c.x + dx, z: c.z + dz, rot });
  }
  const L = (g, skin, hair, top, legs, topC) => ({ g, skin, hair, top, legs, topC });
  const clerks = [
    { at: [0, -3], look: L(0, 0, 0, 5, 5, '#2a4a2a') }, { at: [3, 0], look: L(1, 3, 3, 5, 5, '#2a4a2a') },
    { at: [0, 3], look: L(0, 4, 7, 5, 5, '#2a4a2a') }, { at: [-3, 0], look: L(1, 1, 6, 5, 5, '#2a4a2a') },
  ];
  for (const k of clerks) api.spawnNpc({ name: 'GE Clerk', type: 'ge_clerk', at: { x: c.x + k.at[0], z: c.z + k.at[1] }, look: k.look, talk: 'ge_clerk', actions: ['Exchange', 'Collect'], ex: 'Works at the Grand Exchange. Has seen a lot of 1-coin lowballs.' });
  api.spawnObject({ type: 'station_sign', x: c.x - 7, z: c.z + 3, data: { text: 'GRAND EXCHANGE - Dam. Buy and sell with every player in Amsterdam, even when they are asleep. Talk to a clerk or use a booth. 1% tax on sales goes to the Gemeente.' } });

  api.objectAction('ge_booth', 'Exchange', p => open(p));
  api.objectAction('ge_booth', 'Collect', p => open(p, 'collect'));
  api.objectAction('ge_booth', 'Price-guide', p => prices(p));
  api.objectAction('ge_kiosk', 'Exchange', p => open(p));
  api.objectAction('ge_kiosk', 'Price-guide', p => prices(p));
  api.npcAction('ge_clerk', 'Exchange', p => open(p));
  api.npcAction('ge_clerk', 'Collect', p => open(p, 'collect'));
  api.dialogAction('ge_open', p => { open(p); return 'stop'; });
  api.dialogAction('ge_prices', p => { api.closeIface(p); prices(p); return 'stop'; });
  api.dialog('ge_clerk', {
    start: [
      { npc: 'Welkom bij de Grand Exchange! Would you like to trade, or check the price guide?' },
      { opts: [['I want to trade.', 'trade'], ['Show me the price guide.', 'guide'], ['How does this work?', 'help'], ['No thanks.', 'end']] },
    ],
    trade: [{ act: 'ge_open' }],
    guide: [{ act: 'ge_prices' }],
    help: [
      { player: 'How does this work?' },
      { npc: 'You put in an offer to buy or sell. When someone else wants the other side of the deal, we match you up. Cheapest sellers first.' },
      { npc: 'You can collect your coins and items whenever you like, even if you were asleep in your houseboat when it sold.' },
      { npc: 'And the Gemeente takes one percent of every sale. Somebody has to pay for all those bike lanes.' },
      { goto: 'start' },
    ],
  });

  // Tell players about offers that changed while they were away.
  api.onLogin(p => {
    const changed = offersOf(p.key).filter(o => !o.seen);
    for (const o of offersOf(p.key)) { o.ownerName = p.name; o.seen = true; }
    if (changed.length) api.msg(p, 'One or more of your Grand Exchange offers have been updated while you were away. Visit the Dam to collect.', 'level');
  });
  api.onPlayerTick(p => {
    if (p.iface === 'ge' && api.cheb(p.x, p.z, c.x, c.z) > 12) api.closeIface(p);
  });
}
