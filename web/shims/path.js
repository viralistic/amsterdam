// Minimal POSIX path module for the browser build.
export function normalize(p) {
  const abs = p.startsWith('/'), out = [];
  for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
  return (abs ? '/' : '') + out.join('/');
}
export const join = (...a) => normalize(a.filter(Boolean).join('/'));
export const resolve = (...a) => { let p = ''; for (const s of a) p = s.startsWith('/') ? s : p + '/' + s; return normalize(p.startsWith('/') ? p : '/' + p); };
export const dirname = p => { const n = normalize(p); const i = n.lastIndexOf('/'); return i <= 0 ? '/' : n.slice(0, i); };
export const basename = p => p.slice(p.lastIndexOf('/') + 1);
export const extname = p => { const b = basename(p), i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : ''; };
export const sep = '/';
export default { normalize, join, resolve, dirname, basename, extname, sep };
