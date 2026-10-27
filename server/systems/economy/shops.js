// Banks, deposit box and shops: stock limits that restock over time, OSRS-style prices that rise as stock runs
// out (and fall when the shop is full), and a market trader at the Albert Cuyp who buys player goods.
import { BANKS, DEPOSIT_BOX } from '../../../shared/content/economy/places.js';

export default function shops(api, E) {
  const { ITEMS } = api;
  const L = (g, skin, hair, top, legs, topC) => ({ g, skin, hair, top, legs, topC });

  // ---- banks
  for (const b of BANKS) {
    const t = api.tile(b.lat, b.lon);
    api.spawnObject({ type: 'bank_booth', x: t.x, z: t.z, data: { bank: b.name } });
    api.spawnObject({ type: 'bank_booth', x: t.x + 1, z: t.z, data: { bank: b.name } });
  }
  const db = api.tile(DEPOSIT_BOX.lat, DEPOSIT_BOX.lon);
  api.spawnObject({ type: 'deposit_box', x: db.x, z: db.z });
  api.spawnObject({ type: 'deposit_box', x: db.x + 1, z: db.z });

  const depositAll = (p, id) => {
    const n = api.invCount(p, id);
    if (!n) return;
    if (!E.bankAdd(p, id, n)) return api.msg(p, 'Your bank is full.');
    api.invRemove(p, id, n);
  };
  api.objectAction('deposit_box', 'Deposit', (p, obj) => {
    api.closeIface(p);
    p.iface = 'eco_deposit'; p.ecoDepBox = obj;
    api.send(p, { t: 'eco_deposit' });
  });
  api.onMessage('eco_dep', (p, m) => {
    if (p.iface !== 'eco_deposit' || !p.ecoDepBox || api.cheb(p.x, p.z, p.ecoDepBox.x, p.ecoDepBox.z) > 3) return;
    if (m.op === 'slot') { const s = p.rec.inv[+m.slot]; if (s) depositAll(p, s.id); }
    if (m.op === 'inv') for (const s of [...p.rec.inv]) if (s) depositAll(p, s.id);
    if (m.op === 'worn') {
      for (const [slot, s] of Object.entries(p.rec.equip)) {
        if (!s) continue;
        if (!E.bankAdd(p, s.id, s.q || 1)) { api.msg(p, 'Your bank is full.'); break; }
        delete p.rec.equip[slot];
      }
      p.equipDirty = true;
    }
    api.touch();
  });

  // ---- shops of this pack: eco: true turns on dynamic prices
  const kiosk = api.shop('eco_kiosk', { name: 'Station Kiosk', eco: true, stock: ['stroopwafel', 'kroket', 'broodje_kaas', 'chocomel', 'canal_map'], limits: { stroopwafel: 20, kroket: 15, broodje_kaas: 10, chocomel: 20, canal_map: 5 } });
  api.shop('eco_vvv', { name: 'I amsterdam Visitor Centre', eco: true, stock: ['canal_map', 'stroopwafel_tin', 'tulip', 'clogs', 'orange_shirt'], limits: { canal_map: 10, stroopwafel_tin: 2, tulip: 15, clogs: 5, orange_shirt: 5 } });
  api.shop('eco_opkoper', { name: "Joop's Opkoperij", eco: true, general: true, sellRate: 0.55, stock: ['bike_bell', 'bike_key', 'bucket', 'hammer'], limits: { bike_bell: 3, bike_key: 5, bucket: 5, hammer: 3 } });
  void kiosk;

  const T = api.tile;
  api.spawnNpc({ name: 'Kioskhouder', type: 'kioskhouder', at: T(52.37840, 4.9015), look: L(1, 1, 2, 3, 5, '#00418b'), talk: 'eco_kiosk', shop: 'eco_kiosk', ex: 'Sells snacks to people who missed their train.' });
  api.spawnNpc({ name: 'Kioskhouder', type: 'kioskhouder', at: T(52.33910, 4.8745), look: L(0, 3, 1, 3, 5, '#00418b'), talk: 'eco_kiosk', shop: 'eco_kiosk', ex: 'Sells snacks to people in suits.' });
  api.spawnNpc({ name: 'VVV Medewerker', type: 'vvv', at: T(52.37800, 4.89920), look: L(1, 0, 3, 2, 5, '#d4001a'), talk: 'eco_vvv', shop: 'eco_vvv', ex: 'Works at the I amsterdam visitor centre. Has answered "where is the coffeeshop" 10,000 times.' });
  const jt = T(52.35590, 4.89180);
  api.spawnNpc({ name: 'Opkoper Joop', type: 'opkoper', at: { x: jt.x, z: jt.z + 1 }, look: L(0, 0, 5, 10, 1), eq: { head: 'flat_cap' }, talk: 'eco_opkoper', shop: 'eco_opkoper', ex: 'Buys anything. Asks no questions.', chatter: ['Ik koop alles!', 'Goud, zilver, fietsbellen!', 'Beste prijs van de Cuyp!'] });
  api.spawnObject({ type: 'market_stall', x: jt.x, z: jt.z - 1 });
  api.spawnObject({ type: 'market_stall', x: jt.x + 6, z: jt.z - 1 });

  api.dialog('eco_kiosk', { start: [{ npc: 'Stroopwafel for the train? Prices go up when I run low, so be quick.' }, { opts: [['Let me see.', 'shop'], ['No thanks.', 'end']] }], shop: [{ act: 'shop' }] });
  api.dialog('eco_vvv', { start: [{ npc: 'Welcome to Amsterdam! Maps, souvenirs, and a stroopwafel tin that is never empty. Somehow.' }, { opts: [['Show me.', 'shop'], ['Where is the coffeeshop?', 'cs'], ['Bye.', 'end']] }], shop: [{ act: 'shop' }], cs: [{ player: 'Where is the coffeeshop?' }, { npc: '*sigh* Buy a canal map. It has everything on it. Well, almost.' }] });
  api.dialog('eco_opkoper', {
    start: [{ npc: 'Joop koopt alles! I pay better than the supermarket, but the more of something you sell me, the less I pay for it.' }, { opts: [["Let's trade.", 'shop'], ['Where does it all go?', 'where'], ['Bye.', 'end']] }],
    shop: [{ act: 'shop' }],
    where: [{ player: 'Where does it all go?' }, { npc: 'Marktplaats, mostly. Nobody ever asks where my bike bells come from either.' }],
  });

  // ---- dynamic prices (OSRS style). Only for this pack's shops and shops that opt in with dynamic: true.
  const managed = shop => shop.eco || shop.dynamic;
  api.shopPriceHook((shop, id, selling, price) => {
    if (!managed(shop)) return;
    const base = ITEMS[id].value;
    const lim = shop.limits?.[id];
    if (!selling) {
      if (!lim || !shop.left) return;
      const left = shop.left[id] ?? lim;
      const f = left <= lim ? 1 + 0.5 * (lim - left) / lim : Math.max(0.7, 1 - 0.3 * (left - lim) / lim);
      return Math.max(1, Math.ceil(base * (shop.buyRate ?? 1) * f));
    }
    const extra = lim ? Math.max(0, (shop.left?.[id] ?? lim) - lim) : (shop.bought?.[id] || 0);
    const f = Math.max(0.1, 1 - (lim ? 0.08 : 0.04) * extra);
    return Math.floor(base * (shop.sellRate ?? 0.4) * f);
  });

  // Detect items sold to a managed shop (core does not add them to stock) by watching the inventory while it is open.
  const counts = p => { const c = {}; for (const s of p.rec.inv) if (s) c[s.id] = (c[s.id] || 0) + s.q; return c; };
  const sig = shop => JSON.stringify([shop.left, shop.bought]);
  api.onPlayerTick(p => {
    const shop = p.iface === 'shop' ? p.shop : null;
    if (!shop || !managed(shop)) { p.ecoShop = null; return; }
    const now = counts(p);
    if (p.ecoShop?.shop === shop) {
      for (const [id, n] of Object.entries(p.ecoShop.inv)) {
        const sold = n - (now[id] || 0);
        if (sold <= 0 || id === 'coins') continue;
        if (shop.stock.includes(id) && shop.left) shop.left[id] = (shop.left[id] ?? 0) + sold;
        else if (shop.general) (shop.bought ??= {})[id] = (shop.bought[id] || 0) + sold;
      }
    }
    const s = sig(shop);
    if (p.ecoShop?.shop === shop && p.ecoShop.sig !== s) { api.openShop(p, shop); }
    if (p.ecoShop?.shop !== shop || p.ecoShop.sig !== s) sendStock(p, shop);
    p.ecoShop = { shop, inv: now, sig: s };
  });
  const sendStock = (p, shop) => api.send(p, { t: 'eco_shopq', q: shop.stock.map(id => shop.left?.[id] ?? null) });

  // Restock every shop with limits toward its normal stock (set restock: false to opt out).
  api.onTick(tick => {
    if (tick % 20) return;
    for (const shop of Object.values(api.SHOPS)) {
      if (!shop.limits || !shop.left || shop.restock === false) continue;
      for (const [id, lim] of Object.entries(shop.limits)) {
        const left = shop.left[id] ?? lim;
        if (left < lim) shop.left[id] = Math.min(lim, left + Math.max(1, Math.round(lim / 10)));
        else if (left > lim) shop.left[id] = left - 1;
      }
      for (const id of Object.keys(shop.bought || {})) if (--shop.bought[id] <= 0) delete shop.bought[id];
    }
  });
}
