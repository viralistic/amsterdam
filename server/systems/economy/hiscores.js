// Classic-style hiscores page at /hiscores: overall and per-skill tables, plus a personal lookup.
import { SKILLS, levelForXp } from '../../../shared/items.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cap = s => s[0].toUpperCase() + s.slice(1);
const n = v => Math.floor(v).toLocaleString('en-US');
const PER_PAGE = 25;

export default function hiscores(api, E) {
  function rows(skill) {
    const out = [];
    for (const rec of Object.values(api.allAccounts())) {
      if (!rec?.xp || rec.banned > Date.now() || rec.flags?.hiscoresHidden) continue;
      if (skill === 'overall') {
        let lvl = 0, xp = 0;
        for (const s of SKILLS) { lvl += levelForXp(rec.xp[s] || 0); xp += rec.xp[s] || 0; }
        out.push({ name: rec.name, lvl, xp, t: rec.created || 0 });
      } else out.push({ name: rec.name, lvl: levelForXp(rec.xp[skill] || 0), xp: rec.xp[skill] || 0, t: rec.created || 0 });
    }
    return out.sort((a, b) => b.lvl - a.lvl || b.xp - a.xp || a.t - b.t);
  }

  const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} - AmsEscape Hiscores</title><style>
body{margin:0;background:#1a140c url() ;font:13px/1.35 Verdana,Arial,sans-serif;color:#2b1d0e}
.top{background:linear-gradient(#3a2c1a,#120d07);text-align:center;padding:14px 8px;border-bottom:3px solid #5a4a2e}
.top h1{margin:0;font:bold 34px Georgia,serif;color:#ffcf2e;text-shadow:3px 3px 0 #000}.top small{color:#ff981f;letter-spacing:3px;font-weight:bold}
.wrap{max-width:860px;margin:14px auto;display:flex;gap:12px;padding:0 8px;flex-wrap:wrap}
.scroll{background:#d8c8a0;border:3px solid #5a4a2e;box-shadow:0 0 0 2px #000;padding:10px}
.side{width:170px}.main{flex:1;min-width:300px}
.side a{display:block;color:#5a2a00;text-decoration:none;padding:2px 4px;font-weight:bold}.side a:hover,.side a.on{background:#b8a478;color:#000}
h2{margin:0 0 8px;font:bold 18px Georgia,serif;color:#5a2a00;text-align:center}
table{width:100%;border-collapse:collapse}th{background:#5a4a2e;color:#ffcf2e;padding:4px;text-align:left}
td{padding:3px 4px;border-bottom:1px solid #b8a478}tr:nth-child(even) td{background:#cfbd92}td.r,th.r{text-align:right}
td a{color:#000;font-weight:bold;text-decoration:none}td a:hover{text-decoration:underline}
form{margin:10px 0 0;text-align:center}input{width:120px;border:1px solid #5a4a2e;background:#efe4c4;padding:3px}button{background:#5a4a2e;color:#ffcf2e;border:1px solid #000;padding:3px 8px;font-weight:bold}
.pg{text-align:center;margin-top:8px}.pg a{color:#5a2a00;font-weight:bold;margin:0 6px}.me td{background:#f2e6a0!important}
.foot{text-align:center;color:#7a6a50;font-size:11px;margin:10px}
</style></head><body><div class="top"><h1>AmsEscape</h1><small>HISCORES</small></div>${body}<p class="foot">AmsEscape Hiscores. Updated live. <a style="color:#ff981f" href="/">Play now</a></p></body></html>`;

  const side = cur => `<div class="side scroll"><h2>Skills</h2>${['overall', ...SKILLS].map(s => `<a href="/hiscores?skill=${s}" class="${s === cur ? 'on' : ''}">${cap(s)}</a>`).join('')}
    <form action="/hiscores"><div>Search by name</div><input name="player" maxlength="12"><button>Search</button></form></div>`;

  api.route('/hiscores', (req, res) => {
    const q = new URL(req.url, 'http://x').searchParams;
    let html;
    const player = (q.get('player') || '').trim();
    if (player) {
      const acc = E.account(player);
      if (!acc || acc.rec.banned > Date.now()) html = page('Not found', `<div class="wrap">${side('')}<div class="main scroll"><h2>Player not found</h2><p style="text-align:center">No hiscores for "${esc(player)}".</p></div></div>`);
      else {
        const tr = ['overall', ...SKILLS].map(s => {
          const list = rows(s), i = list.findIndex(r => r.name === acc.rec.name), r = list[i];
          return `<tr><td><a href="/hiscores?skill=${s}&page=${Math.floor(i / PER_PAGE) + 1}">${cap(s)}</a></td><td class="r">${n(i + 1)}</td><td class="r">${n(r.lvl)}</td><td class="r">${n(r.xp)}</td></tr>`;
        }).join('');
        html = page(acc.rec.name, `<div class="wrap">${side('')}<div class="main scroll"><h2>Personal scores for ${esc(acc.rec.name)}</h2><table><tr><th>Skill</th><th class="r">Rank</th><th class="r">Level</th><th class="r">XP</th></tr>${tr}</table></div></div>`);
      }
    } else {
      const skill = ['overall', ...SKILLS].includes(q.get('skill')) ? q.get('skill') : 'overall';
      const list = rows(skill);
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      const pg = Math.max(1, Math.min(pages, +q.get('page') || 1));
      const hl = (q.get('hl') || '').toLowerCase();
      const tr = list.slice((pg - 1) * PER_PAGE, pg * PER_PAGE).map((r, i) => `<tr class="${r.name.toLowerCase() === hl ? 'me' : ''}"><td class="r">${n((pg - 1) * PER_PAGE + i + 1)}</td><td><a href="/hiscores?player=${encodeURIComponent(r.name)}">${esc(r.name)}</a></td><td class="r">${n(r.lvl)}</td><td class="r">${n(r.xp)}</td></tr>`).join('') || '<tr><td colspan="4">Nobody yet!</td></tr>';
      const nav = pages > 1 ? `<div class="pg">${pg > 1 ? `<a href="/hiscores?skill=${skill}&page=${pg - 1}">&laquo; Previous</a>` : ''} Page ${pg} of ${pages} ${pg < pages ? `<a href="/hiscores?skill=${skill}&page=${pg + 1}">Next &raquo;</a>` : ''}</div>` : '';
      html = page(cap(skill), `<div class="wrap">${side(skill)}<div class="main scroll"><h2>${cap(skill)} Hiscores</h2><table><tr><th class="r">Rank</th><th>Name</th><th class="r">${skill === 'overall' ? 'Total level' : 'Level'}</th><th class="r">XP</th></tr>${tr}</table>${nav}</div></div>`);
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(html);
  });

  api.command('hiscores', (p, args) => api.send(p, { t: 'eco_hiscores', url: `/hiscores?${args[0] ? 'skill=' + encodeURIComponent(args[0]) + '&' : ''}hl=${encodeURIComponent(p.name)}` }));
}
