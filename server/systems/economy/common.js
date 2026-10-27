// Shared helpers for the economy pack's server modules.
export const keyOf = name => String(name || '').trim().toLowerCase().replace(/[\s_-]+/g, '_');
export const clean = (s, n = 80) => String(s || '').replace(/[\x00-\x1f<>]/g, '').trim().slice(0, n);
export const fmt = n => Math.round(n).toLocaleString('en-US');

export function makeContext(api) {
  const store = api.worldStore('economy');
  const listeners = {};
  const E = {
    api, store,
    ps: p => api.playerStore(p, 'economy'),
    online: key => { for (const p of api.players.values()) if (p.key === key) return p; return null; },
    account: name => { const key = keyOf(name); const rec = api.allAccounts()[key]; return rec ? { key, rec } : null; },
    admins: new Set(String(process.env.ADMINS || '').split(',').map(keyOf).filter(Boolean)),
    isAdmin: p => E.admins.has(p.key),
    on: (ev, f) => (listeners[ev] ??= []).push(f),
    emit: (p, ev, data) => { for (const f of listeners[ev] || []) { try { f(p, data); } catch (e) { console.error('economy event', ev, e); } } },
    // Puts items in the bank, for when the inventory is full. Returns false if the bank has no room.
    bankAdd(p, id, q) {
      if (q <= 0) return true;
      const bank = p.rec.bank;
      let b = bank.find(b => b.id === id);
      if (!b) { if (bank.length >= 400) return false; b = { id, q: 0 }; bank.push(b); }
      b.q += q;
      api.touch();
      return true;
    },
    // Inventory first, then bank, then the floor.
    deliver(p, id, q) {
      if (q <= 0) return 'none';
      const ITEMS = api.ITEMS;
      if (ITEMS[id].stack) { if (api.invAdd(p, id, q)) return 'inv'; }
      else {
        const n = Math.min(q, api.freeSlots(p));
        if (n > 0) api.invAdd(p, id, n);
        if (n === q) return 'inv';
        q -= n;
      }
      if (E.bankAdd(p, id, q)) return 'bank';
      api.giveOrDrop(p, id, q);
      return 'floor';
    },
    near: (p, x, z, r) => api.cheb(p.x, p.z, x, z) <= r,
  };
  return E;
}
