export const SKIN = ['#f3cfa6', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#ffe0bd'];
export const HAIR = ['#2b1a0e', '#5a3214', '#a0522d', '#d8b45a', '#f0e2a0', '#8a8a8a', '#c0392b', '#1a1a1a'];
export const CLOTH = ['#7a1f1f', '#1f3f7a', '#2f6b2a', '#c8a23a', '#5a2d6b', '#3a3a3a', '#d9d9d9', '#b5651d', '#2a7a7a', '#ff7a00', '#8b6b4a', '#c43c7a'];
export const DEFAULT_LOOK = { g: 0, skin: 0, hair: 1, top: 0, legs: 1 };

export function sanitizeLook(l) {
  const n = (v, max) => Number.isInteger(v) && v >= 0 && v < max ? v : 0;
  l = l || {};
  return { g: l.g ? 1 : 0, skin: n(l.skin, SKIN.length), hair: n(l.hair, HAIR.length), top: n(l.top, CLOTH.length), legs: n(l.legs, CLOTH.length) };
}
