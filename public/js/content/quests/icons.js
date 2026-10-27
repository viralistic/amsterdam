// 36x32 pixel-art icons for quest items and rewards (the engine adds outline and shadow).
import { registry } from '../../registry.js';

const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };

const paper = (g, c = '#e8dcb8', dark = '#c8b890') => { poly(g, [[8, 4], [28, 4], [28, 28], [8, 28]], c); poly(g, [[22, 28], [28, 22], [28, 28]], dark); };
const scribbles = (g, c = '#6a5a3a', ys = [10, 14, 18, 22]) => { for (const y of ys) line(g, [[11, y], [25, y]], 1, c); };
const key = (g, c, dark) => { ell(g, 10, 16, 6, 6, c); ell(g, 10, 16, 2.5, 2.5, 'rgba(0,0,0,0)'); g.clearRect(8, 14, 4, 4); rect(g, 15, 14, 16, 4, c); rect(g, 25, 18, 3, 5, dark); rect(g, 29, 18, 2, 4, dark); };
const cape = (g, c, dark, trim) => { poly(g, [[12, 4], [24, 4], [30, 29], [6, 29]], c); poly(g, [[18, 4], [24, 4], [30, 29], [18, 29]], dark); rect(g, 11, 3, 14, 3, trim || dark); };
const shirt = (g, c, dark) => { const pts = [[11, 5], [15, 7], [21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [10, 29], [10, 14], [7, 16], [3, 10]]; poly(g, pts, c); g.save(); g.beginPath(); g.rect(18, 0, 18, 32); g.clip(); poly(g, pts, dark); g.restore(); };
const chest = (g, c, dark, trim) => { rect(g, 5, 13, 26, 15, c); poly(g, [[5, 13], [8, 7], [28, 7], [31, 13]], dark); rect(g, 5, 18, 26, 2, trim); rect(g, 16, 15, 4, 6, trim); };
const battery = (g, c, fill) => { rect(g, 8, 8, 20, 20, '#3a3a40'); rect(g, 14, 5, 8, 3, '#8a8a90'); rect(g, 10, 10 + (16 - fill), 16, fill, c); };

Object.assign(registry.iconDrawers, {
  iamsterdam_shirt: g => { shirt(g, '#d2122e', '#a80e24'); rect(g, 12, 15, 2, 6, '#f4f4f4'); rect(g, 15, 15, 10, 2, '#f4f4f4'); rect(g, 15, 19, 10, 2, '#f4f4f4'); },
  grachtenkaart: g => { paper(g, '#e8e0c0'); line(g, [[9, 12], [16, 9], [27, 13]], 2, '#4a7ab8'); line(g, [[9, 17], [17, 14], [27, 18]], 2, '#4a7ab8'); line(g, [[9, 22], [18, 19], [27, 23]], 2, '#4a7ab8'); ell(g, 22, 24, 2.5, 2.5, '#d82020'); },
  grachten_cape: g => { cape(g, '#1f3f7a', '#162e5a', '#d8b040'); line(g, [[10, 20], [18, 17], [27, 21]], 1.5, '#7aa8e0'); },
  paleispas: g => { rect(g, 6, 9, 24, 16, '#f4f0e0'); rect(g, 6, 9, 24, 4, '#ff7a00'); ell(g, 13, 19, 3, 3, '#d8b040'); line(g, [[19, 18], [27, 18]], 1, '#6a5a3a'); line(g, [[19, 21], [25, 21]], 1, '#6a5a3a'); },
  gastenboek_blad: g => { paper(g); scribbles(g); line(g, [[11, 24], [21, 24]], 1.5, '#2a8a3a'); },
  ge_bonnetje: g => { poly(g, [[11, 3], [25, 3], [25, 27], [22, 29], [19, 27], [16, 29], [13, 27], [11, 29]], '#f4f4ec'); scribbles(g, '#5a5a5a', [8, 12, 16]); line(g, [[13, 21], [23, 21]], 1.5, '#2a8a3a'); },
  verbrande_brief: g => { poly(g, [[7, 5], [27, 4], [29, 15], [26, 20], [28, 27], [18, 25], [12, 29], [7, 24]], '#d8c8a0'); poly(g, [[20, 4], [27, 4], [29, 15], [24, 12]], '#3a2a1a'); poly(g, [[7, 22], [12, 29], [7, 29]], '#3a2a1a'); scribbles(g, '#4a3a2a', [11, 15, 19]); },
  moseszaal_sleutel: g => key(g, '#7a7a80', '#4a4a50'),
  oranje_sjerp: g => { poly(g, [[6, 6], [12, 4], [30, 24], [26, 29]], '#ff7a00'); poly(g, [[6, 6], [9, 5], [28, 27], [26, 29]], '#d85a00'); ell(g, 13, 11, 3, 3, '#e0b530'); },
  depot_sleutel: g => key(g, '#d8b040', '#a07a20'),
  nw_kippenklauw: g => { line(g, [[18, 26], [18, 14]], 3, '#e0b530'); line(g, [[18, 14], [10, 6]], 2, '#e0b530'); line(g, [[18, 14], [18, 4]], 2, '#e0b530'); line(g, [[18, 14], [26, 6]], 2, '#e0b530'); ell(g, 18, 27, 4, 2, '#a07a20'); },
  nw_trommel: g => { ell(g, 18, 22, 12, 5, '#8a2a2a'); rect(g, 6, 12, 24, 10, '#a83a2a'); ell(g, 18, 12, 12, 5, '#e8dcc0'); for (const x of [9, 15, 21, 27]) line(g, [[x, 14], [x + 3, 22]], 1, '#e0b530'); line(g, [[4, 3], [14, 10]], 2, '#6a4a2a'); },
  nw_vaandel: g => { line(g, [[8, 30], [8, 2]], 2, '#6a4a2a'); poly(g, [[9, 3], [31, 6], [27, 13], [31, 20], [9, 18]], '#e8d070'); poly(g, [[9, 8], [29, 10], [28, 14], [9, 13]], '#3a5aa8'); },
  nw_kruithoorn: g => { poly(g, [[6, 24], [10, 10], [22, 6], [30, 8], [24, 12], [14, 16], [12, 26]], '#d8c8a0'); poly(g, [[22, 6], [30, 8], [27, 10]], '#5a4a3a'); rect(g, 5, 23, 8, 4, '#8a6a3a'); },
  nachtwacht_hoed: g => { ell(g, 18, 22, 15, 5, '#16161a'); poly(g, [[11, 21], [12, 9], [24, 9], [25, 21]], '#202024'); rect(g, 11, 17, 14, 3, '#c81e1e'); ell(g, 27, 10, 3, 6, '#f4f0e8'); },
  ruytenburch_partizaan: g => { line(g, [[4, 30], [24, 10]], 2.5, '#6a4a2a'); poly(g, [[24, 10], [33, 1], [27, 13]], '#e0c870'); poly(g, [[20, 10], [26, 6], [28, 14], [23, 16]], '#c8a850'); ell(g, 18, 16, 2, 2, '#f4f0e8'); },
  bladmuziek: g => { paper(g, '#f4f0e0'); for (const y of [9, 15, 21]) for (let i = 0; i < 5; i++) line(g, [[10, y + i], [26, y + i]], 0.5, '#5a5a5a'); for (const [x, y] of [[12, 10], [16, 12], [20, 13], [24, 14]]) ell(g, x, y, 1.5, 1.2, '#1a1a1a'); ell(g, 18, 22, 6, 4, 'rgba(216,32,32,0.6)'); },
  crypte_sleutel: g => key(g, '#2a2a30', '#1a1a1e'),
  westerkerk_psalter: g => { rect(g, 8, 5, 21, 24, '#3a5aa8'); rect(g, 8, 5, 4, 24, '#2a4a88'); rect(g, 28, 7, 2, 20, '#f4f0e0'); rect(g, 18, 10, 2, 12, '#e0b530'); rect(g, 14, 13, 10, 2, '#e0b530'); },
  maandauw: g => { poly(g, [[14, 6], [22, 6], [22, 11], [26, 16], [26, 28], [10, 28], [10, 16], [14, 11]], '#cfe8f8'); rect(g, 11, 17, 14, 10, '#6ad0ff'); rect(g, 14, 3, 8, 3, '#8a6a3a'); ell(g, 15, 20, 2, 3, '#e8f8ff'); },
  betoverde_tak: g => { line(g, [[5, 27], [30, 6]], 3.5, '#6a4a2a'); line(g, [[15, 18], [12, 9]], 2, '#6a4a2a'); ell(g, 12, 8, 3, 2, '#4f8a34'); ell(g, 30, 6, 3, 2, '#4f8a34'); for (const [x, y] of [[20, 10], [9, 20], [25, 18]]) rect(g, x, y, 2, 2, '#8ad8ff'); },
  zwijnen_slagtand: g => { poly(g, [[8, 28], [12, 16], [20, 8], [30, 4], [24, 12], [16, 20], [12, 29]], '#ece8d8'); poly(g, [[20, 8], [30, 4], [26, 8]], '#b8b0d0'); ell(g, 10, 28, 3, 2, '#6a4a5a'); },
  elfenkring_cape: g => { cape(g, '#2f7a3a', '#225a2a', '#8affc0'); ell(g, 14, 18, 2, 1.5, '#c83a2a'); ell(g, 22, 22, 2, 1.5, '#e8e0d0'); },
  lege_accu: g => battery(g, '#d84a2a', 2),
  volle_accu: g => { battery(g, '#40d060', 16); poly(g, [[19, 11], [14, 19], [18, 19], [16, 26], [22, 17], [18, 17]], '#f8f040'); },
  tandwielen: g => { for (const [x, y, r, c] of [[12, 18, 8, '#c8c8d0'], [25, 12, 6, '#e0b530'], [26, 25, 4, '#a8a8b0']]) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ell(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.8, 1.8, c); } ell(g, x, y, r - 1, r - 1, c); ell(g, x, y, r / 3, r / 3, '#3a3a40'); } },
  blauwdruk: g => { rect(g, 5, 6, 26, 20, '#2a5aa8'); for (let x = 8; x < 30; x += 4) line(g, [[x, 7], [x, 25]], 0.5, '#5a8ad8'); line(g, [[10, 20], [16, 11], [24, 16], [27, 10]], 1.2, '#f4f4f4'); ell(g, 16, 11, 2, 2, '#f4f4f4'); },
  prototype_teleporteur: g => { rect(g, 9, 6, 18, 23, '#5a5a62'); rect(g, 11, 8, 14, 8, '#1a2a3a'); ell(g, 18, 12, 4, 3, '#30d0ff'); for (const [x, c] of [[12, '#d84a2a'], [18, '#e8c020'], [24, '#40d060']]) ell(g, x, 21, 2, 2, c); line(g, [[23, 6], [27, 1]], 1.5, '#8a8a90'); ell(g, 27, 1.5, 1.5, 1.5, '#ff4a2a'); },
  scheepsplank: g => { poly(g, [[3, 22], [28, 6], [33, 10], [8, 27]], '#b08050'); line(g, [[6, 23], [29, 8]], 1, '#8a5a30'); ell(g, 8, 23, 1, 1, '#5a5a5a'); ell(g, 29, 9, 1, 1, '#5a5a5a'); },
  voc_kist: g => { chest(g, '#6a4a2a', '#5a3a1a', '#a0a0a8'); g.font = 'bold 7px monospace'; g.fillStyle = '#e0b530'; g.fillText('VOC', 9, 27); },
  voc_jas: g => { shirt(g, '#1c2a4a', '#141e38'); for (const y of [12, 17, 22]) { ell(g, 16, y, 1.3, 1.3, '#d8b040'); ell(g, 20, y, 1.3, 1.3, '#d8b040'); } rect(g, 3, 9, 4, 3, '#d8b040'); rect(g, 29, 9, 4, 3, '#d8b040'); },
  schaduwspoor: g => { ell(g, 18, 18, 11, 7, '#2a2438'); ell(g, 12, 13, 4, 3, '#3a2a4a'); ell(g, 25, 23, 3, 2, '#3a2a4a'); for (const [x, y] of [[15, 17], [21, 15], [19, 21]]) rect(g, x, y, 2, 2, '#c040ff'); },
  hart_scherf: g => { poly(g, [[12, 6], [26, 10], [22, 26], [10, 22]], '#d83a3a'); poly(g, [[12, 6], [26, 10], [18, 14]], '#f86a5a'); poly(g, [[18, 14], [22, 26], [10, 22]], '#a82a2a'); },
  hart_van_zuidoost: g => { ell(g, 12, 13, 7, 7, '#e83a3a'); ell(g, 24, 13, 7, 7, '#e83a3a'); poly(g, [[5, 15], [31, 15], [18, 29]], '#e83a3a'); ell(g, 11, 11, 3, 2, '#ff9a8a'); poly(g, [[18, 16], [31, 15], [18, 29]], '#c82a2a'); line(g, [[9, 17], [14, 17], [16, 13], [19, 21], [21, 17], [27, 17]], 1.2, '#ffe060'); },
  draakschub_schild: g => { poly(g, [[6, 5], [30, 5], [30, 17], [18, 30], [6, 17]], '#2a4a2a'); poly(g, [[18, 5], [30, 5], [30, 17], [18, 30]], '#1e3a1e'); for (const [x, y] of [[11, 10], [18, 10], [25, 10], [14, 16], [22, 16], [18, 22]]) poly(g, [[x - 3, y], [x, y - 3], [x + 3, y], [x, y + 3]], '#6a8a3a'); },
  sem_fietssleutel: g => { key(g, '#c8c8d0', '#8a8a90'); ell(g, 10, 16, 3, 3, '#d86a9a'); },
  stroopwafel_doos: g => { rect(g, 5, 10, 26, 16, '#f4e0b0'); rect(g, 5, 10, 26, 4, '#d84a2a'); ell(g, 18, 20, 7, 4, '#c0843a'); line(g, [[13, 18], [23, 22]], 1, '#94602a'); line(g, [[23, 18], [13, 22]], 1, '#94602a'); },
  semper_augustus: g => { ell(g, 18, 22, 8, 7, '#c8a878'); poly(g, [[14, 17], [18, 6], [22, 17]], '#e8d0a8'); line(g, [[13, 29], [23, 29]], 2, '#8a6a4a'); line(g, [[18, 6], [20, 2]], 1.5, '#4a8a2a'); for (const x of [15, 18, 21]) line(g, [[x, 18], [x, 27]], 1, '#f4f0f0'); },
  uitdagingsmunt: g => { ell(g, 18, 17, 11, 11, '#a07a10'); ell(g, 18, 16, 11, 11, '#f2c83a'); ell(g, 18, 16, 7, 7, '#d8a820'); poly(g, [[18, 10], [20, 15], [25, 15], [21, 18], [22, 23], [18, 20], [14, 23], [15, 18], [11, 15], [16, 15]], '#fff2a0'); },
  gouden_stroopwafel: g => { ell(g, 18, 19, 14, 9, '#a07a10'); ell(g, 18, 17, 14, 9, '#f2c83a'); for (let x = 8; x < 30; x += 4) line(g, [[x, 10], [x + 6, 24]], 1, '#c8981a'); ell(g, 13, 14, 4, 1.5, '#fff2a0'); },
  uitdagings_cape: g => { cape(g, '#e0b530', '#b8901a', '#f4f0e0'); poly(g, [[18, 12], [20, 17], [25, 17], [21, 20], [22, 25], [18, 22], [14, 25], [15, 20], [11, 17], [16, 17]], '#fff2a0'); },
});
