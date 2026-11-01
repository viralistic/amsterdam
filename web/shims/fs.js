// In-memory file system for the browser build. Account and world files are mirrored to localStorage so
// progress survives a reload; everything else (map chunk cache) lives only in memory.
const files = new Map();
const KEEP = /\.json$/;
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const enoent = p => Object.assign(new Error(`ENOENT: no such file, open '${p}'`), { code: 'ENOENT' });
const keep = p => KEEP.test(p) && !p.includes('/chunks/');

export function readFileSync(p) {
  if (files.has(p)) return files.get(p);
  const saved = keep(p) ? ls.get('amsescape:' + p) : null;
  if (saved !== null) { files.set(p, saved); return saved; }
  throw enoent(p);
}
export function writeFileSync(p, data) { files.set(p, String(data)); }
export function renameSync(a, b) {
  if (!files.has(a)) throw enoent(a);
  files.set(b, files.get(a)); files.delete(a);
  if (keep(b)) ls.set('amsescape:' + b, files.get(b));
}
export const existsSync = p => files.has(p);
export const mkdirSync = () => {};
export const readdirSync = () => [];
export function readFile(p, ...args) { const cb = args.pop(); try { cb(null, readFileSync(p)); } catch (e) { cb(e); } }
export function writeFile(p, data, ...args) { writeFileSync(p, data); args.pop()?.(null); }
export default { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, readdirSync, readFile, writeFile };
