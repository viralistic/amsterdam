// Builds a single-player version of AmsEscape that runs entirely in the browser: the real game server
// (offline test map) and the client in one page. Output: dist-web/index.html and dist-web/app.js.
// Usage: npm install && npm run build:web
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist-web');
const shim = name => path.join(ROOT, 'web', 'shims', name + '.js');
const SHIMS = { fs: shim('fs'), path: shim('path'), http: shim('http'), url: shim('url'), util: shim('util'), crypto: shim('crypto'), ws: shim('ws') };

const LOADER = `for (const f of fs.readdirSync(sysDir).filter(f => f.endsWith('.js')).sort()) {
  try {
    const mod = await import(pathToFileURL(path.join(sysDir, f)).href);
    await mod.default?.(api);
  } catch (e) { console.error(\`System \${f} failed to load:\`, e); }
}`;

const plugin = {
  name: 'amsescape-web',
  setup(b) {
    // node built-ins and ws become browser shims
    b.onResolve({ filter: /^(node:)?(fs|path|http|url|util|crypto)$|^ws$/ }, a => ({ path: SHIMS[a.path.replace('node:', '')] }));
    // the client's absolute module paths, as the server would serve them
    b.onResolve({ filter: /^\/(shared|js)\// }, a => ({ path: a.path.startsWith('/shared/') ? path.join(ROOT, a.path) : path.join(ROOT, 'public', a.path) }));
    // content systems are found with readdir + dynamic import on the server; bundle them statically instead
    b.onLoad({ filter: /server[\\/]index\.js$/ }, a => {
      let src = fs.readFileSync(a.path, 'utf8');
      if (!src.includes(LOADER)) throw new Error('systems loader in server/index.js changed; update web/build.mjs');
      const sys = fs.readdirSync(path.join(ROOT, 'server', 'systems')).filter(f => f.endsWith('.js')).sort();
      const imports = sys.map((f, i) => `import * as __sys${i} from './systems/${f}';`).join('\n');
      src = src.replace(LOADER, `for (const [f, mod] of [${sys.map((f, i) => `['${f}', __sys${i}]`).join(', ')}]) {
  try { await mod.default?.(api); } catch (e) { console.error(\`System \${f} failed to load:\`, e); }
}`);
      return { contents: imports + '\n' + src, loader: 'js', resolveDir: path.dirname(a.path) };
    });
  },
};

fs.mkdirSync(OUT, { recursive: true });
await esbuild.build({
  charset: 'ascii',
  entryPoints: [path.join(ROOT, 'web', 'boot.js')],
  bundle: true, format: 'esm', target: 'es2022', minify: true, legalComments: 'none',
  outfile: path.join(OUT, 'app.js'),
  banner: { js: "globalThis.AMSESCAPE_PREVIEW = true; globalThis.process ??= { env: { FAKE_MAP: '1', DATA_DIR: '/data', LOGIN_LIMIT: '1000', PORT: '0' }, argv: [], on() {}, exit() {} };" },
  plugins: [plugin],
  logLevel: 'warning',
});

// the page: index.html with the stylesheet inlined and the bundle instead of the import map and main.js
// non-ASCII characters are escaped (entities in HTML, \hex escapes in CSS) so the page renders the same whatever charset it is served with
let html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8').replace(/[^\x00-\x7f]/g, c => `&#${c.codePointAt(0)};`);
const css = fs.readFileSync(path.join(ROOT, 'public', 'style.css'), 'utf8').replace(/[^\x00-\x7f]/g, c => `\\${c.codePointAt(0).toString(16)} `);
html = html
  .replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, '')
  .replace(/<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\s*/g, '')
  .replace(/<meta name="(theme-color|apple-mobile-web-app-capable)"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="\/style.css">/, `<style>\n${css}\nhtml, body { height: 100%; background: #000; }\n</style>`)
  .replace(/<script type="importmap">.*?<\/script>\s*/s, '')
  .replace(/<\/head>\s*<body>\s*/i, '\n')
  .replace(/<script type="module" src="\/js\/main.js"><\/script>\s*<\/body>\s*<\/html>\s*$/i, '<script type="module" src="app.js"></script>\n')
  .replace('<p class="foot">', '<p class="foot">Single-player preview: the game server runs in this page, on the offline test map. ');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('dist-web:', fs.readdirSync(OUT).map(f => `${f} ${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0)} KB`).join(', '));
