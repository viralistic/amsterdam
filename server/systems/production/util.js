// Small helpers shared by the production skills.

export const isP = e => !!e?.rec;
export const lower = (api, id) => (api.ITEMS[id]?.name || id).toLowerCase();
export const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
export const cap = s => s[0].toUpperCase() + s.slice(1);

// If u is "item A used on item B" in either order, returns { a: slot of A, b: slot of B, other } or null.
export function pair(u, a, b) {
  if (u.kind !== 'item' || !u.target) return null;
  const x = u.item.id, y = u.target.id;
  const ma = typeof a === 'function' ? a : id => id === a, mb = typeof b === 'function' ? b : id => id === b;
  if (ma(x) && mb(y)) return { a: x, b: y, aSlot: u.slot, bSlot: u.targetSlot };
  if (ma(y) && mb(x)) return { a: y, b: x, aSlot: u.targetSlot, bSlot: u.slot };
  return null;
}

// OSRS-style "make X": runs step(p, n) every few ticks until it returns false or qty is reached.
// step returns false to stop (after doing nothing), true when it made one, or 'retry' to try again without counting.
export function repeat(api, p, { qty = 1, every = 3, first = 1, anim = null, obj = null, name = '', step }) {
  let n = 0;
  api.startAction(p, {
    first, every, anim, obj, name,
    step: pl => {
      const r = step(pl, n);
      if (r === false) return false;
      if (r === 'retry') return true;
      return ++n < qty;
    },
  });
}

// Sends the level requirement message used everywhere. Returns true if the player is too low.
export function tooLow(api, p, skill, level, what) {
  if (api.lv(p, skill) >= level) return false;
  api.msg(p, `You need a${'aeiou'.includes(skill[0]) ? 'n' : ''} ${cap(skill)} level of ${level} to ${what}.`);
  return true;
}

export const has = (api, p, id, q = 1) => api.invCount(p, id) >= q;

// Replace one item in an inventory slot (keeps the item in the same place, like OSRS).
export function swapOne(api, p, fromId, toId) {
  const inv = p.rec.inv;
  const i = inv.findIndex(s => s && s.id === fromId);
  if (i < 0) return false;
  if (api.ITEMS[fromId].stack) { api.invRemove(p, fromId, 1); return api.giveOrDrop(p, toId, 1); }
  if (api.ITEMS[toId]?.stack) { inv[i] = null; p.invDirty = true; api.invAdd(p, toId, 1); return true; }
  inv[i] = { id: toId, q: 1 };
  p.invDirty = true;
  return true;
}
