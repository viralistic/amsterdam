// Inventory icons for the production pack (36x32 pixel art; the engine adds the black outline and drop shadow).
// Every item id is listed literally so scripts/check-content.js can find it.
import { registry } from '../../registry.js';
import { METALS, GEM_COLOR, HERBS, POTIONS } from '/shared/content/production/data.js';

// ---------------------------------------------------------------- drawing helpers
const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const clip = (g, path, fn) => { g.save(); g.beginPath(); path(g); g.clip(); fn(); g.restore(); };
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const t = v => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return '#' + ((t(r) << 16) | (t(gg) << 8) | t(b)).toString(16).padStart(6, '0');
};
const M = id => METALS[id];

// ---------------------------------------------------------------- metal
function bar(g, c) {
  poly(g, [[4, 22], [10, 13], [32, 13], [28, 22]], shade(c, 0.35));
  poly(g, [[4, 22], [28, 22], [28, 27], [4, 27]], c);
  poly(g, [[28, 22], [32, 13], [32, 18], [28, 27]], shade(c, -0.35));
  line(g, [[11, 15], [27, 15]], 1, shade(c, 0.65));
}
function blade(g, m, len, w, curve = 0) {
  const col = m.color, hl = m.light, guard = m.dark;
  const d = [Math.SQRT1_2, -Math.SQRT1_2], p = [Math.SQRT1_2, Math.SQRT1_2], base = [11, 22];
  line(g, [[4.5, 28.5], [10, 23]], 3, '#5a3a1a');
  ell(g, 4, 29, 1.8, 1.8, guard);
  line(g, [[6.5, 19.5], [13.5, 26.5]], 2.5, guard);
  const left = [], right = [], mid = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, bend = curve * t * t;
    const c = [base[0] + d[0] * len * t - p[0] * bend, base[1] + d[1] * len * t - p[1] * bend];
    const hw = w * (t < 0.75 ? 1 : (1 - t) / 0.25);
    left.push([c[0] + p[0] * hw, c[1] + p[1] * hw]); right.push([c[0] - p[0] * hw, c[1] - p[1] * hw]); mid.push([c[0] - p[0] * hw * 0.35, c[1] - p[1] * hw * 0.35]);
  }
  poly(g, [...left, ...right.reverse()], col);
  line(g, mid.slice(0, 9), 1, hl);
}
const dagger = m => g => blade(g, M(m), 13, 2.2);
const sword = m => g => blade(g, M(m), 18, 2.2);
const scimitar = m => g => blade(g, M(m), 20, 2.6, 4);
const longsword = m => g => blade(g, M(m), 23, 2.4);
const helm = m => g => {
  const c = M(m).color;
  ell(g, 18, 14, 11, 11, c); rect(g, 7, 14, 22, 13, c); rect(g, 7, 22, 22, 5, shade(c, -0.3));
  rect(g, 10, 16, 16, 2.5, '#151515'); rect(g, 17, 18, 2, 6, '#151515'); ell(g, 13, 8, 3.5, 2.2, shade(c, 0.5));
};
const platebody = m => g => {
  const c = M(m).color;
  poly(g, [[10, 4], [26, 4], [33, 9], [31, 18], [27, 16], [27, 29], [9, 29], [9, 16], [5, 18], [3, 9]], c);
  poly(g, [[18, 4], [26, 4], [33, 9], [31, 18], [27, 16], [27, 29], [18, 29]], shade(c, -0.25));
  ell(g, 18, 5, 4, 2, '#2a2a2a');
  line(g, [[12, 12], [18, 15], [24, 12]], 1, shade(c, 0.5));
  line(g, [[18, 15], [18, 28]], 1, shade(c, -0.45));
};
const platelegs = m => g => {
  const c = M(m).color, dk = shade(c, -0.3);
  poly(g, [[9, 3], [27, 3], [29, 29], [21, 29], [18, 12], [15, 29], [7, 29]], c);
  poly(g, [[18, 3], [27, 3], [29, 29], [21, 29], [18, 12]], dk);
  rect(g, 9, 3, 18, 3, shade(c, -0.45));
  rect(g, 8, 17, 7, 2, shade(c, 0.4)); rect(g, 21, 17, 7, 2, shade(c, -0.1));
};
const kiteshield = m => g => {
  const c = M(m).color;
  poly(g, [[18, 2], [31, 7], [28, 20], [18, 30], [8, 20], [5, 7]], c);
  poly(g, [[18, 2], [31, 7], [28, 20], [18, 30]], shade(c, -0.25));
  line(g, [[18, 4], [18, 28]], 2, shade(c, 0.5));
  line(g, [[7, 9], [29, 9]], 1.5, shade(c, 0.5));
};
const arrowtips = m => g => {
  const c = M(m).color;
  for (const [x, y] of [[8, 10], [20, 8], [13, 20], [25, 19]]) { poly(g, [[x, y + 8], [x + 3, y], [x + 6, y + 8]], c); poly(g, [[x + 3, y], [x + 6, y + 8], [x + 3, y + 7]], shade(c, -0.3)); }
};
function arrows(g, metal) {
  for (const o of [0, 4, 8]) {
    line(g, [[5 + o, 29], [25 + o, 9 - o * 0.2]], 1.6, '#8a5a2c');
    poly(g, [[25 + o, 9 - o * 0.2], [30 + o, 4 - o * 0.2], [27 + o, 11 - o * 0.2]], metal);
    poly(g, [[5 + o, 29], [3 + o, 25], [8 + o, 27]], '#e8e8e8');
  }
}

// ---------------------------------------------------------------- food
function fish(g, body, back, belly, { len = 13, h = 5.5, spots, tail = true } = {}) {
  if (tail) poly(g, [[8, 16], [2, 9], [4, 16], [2, 23]], back);
  ell(g, 19, 16, len, h, body);
  clip(g, c => c.ellipse(19, 16, len, h, 0, 0, Math.PI * 2), () => { rect(g, 4, 9, 30, h * 0.8, back); rect(g, 4, 17.5, 30, h * 0.8, belly); });
  if (spots) for (const [x, y] of [[14, 14], [19, 13], [24, 15], [16, 17]]) ell(g, x, y, 1, 1, spots);
  rect(g, 27, 14, 2, 2, '#111');
}
const cookedFish = (body, back, belly, o) => g => { fish(g, body, back, belly, o); line(g, [[13, 12], [11, 20]], 1.2, '#5a3010'); line(g, [[19, 11], [17, 21]], 1.2, '#5a3010'); };
function meat(g, c, fat) {
  poly(g, [[5, 18], [9, 9], [20, 6], [30, 10], [32, 19], [26, 26], [12, 27]], c);
  poly(g, [[5, 18], [12, 27], [26, 26], [32, 19], [30, 22], [24, 28], [11, 29]], shade(c, -0.35));
  line(g, [[10, 13], [19, 9], [27, 13]], 1.5, fat);
  ell(g, 16, 18, 2.5, 2, fat);
}
function drumstick(g, c) {
  line(g, [[22, 22], [30, 29]], 3, '#efe8d8'); ell(g, 30.5, 29.5, 2, 1.6, '#efe8d8'); ell(g, 31.5, 28, 1.6, 1.4, '#efe8d8');
  ell(g, 15, 15, 10, 8.5, c); ell(g, 12, 12, 4, 3, shade(c, 0.35)); ell(g, 19, 19, 4, 3, shade(c, -0.3));
}
const shrimps = (c) => g => { for (const [x, y] of [[12, 12], [23, 17], [13, 23]]) { g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 5, 0.3, Math.PI * 1.4); g.stroke(); ell(g, x + 5, y + 1, 2, 2, shade(c, -0.2)); } };

// ---------------------------------------------------------------- crafting
function hide(g, c, dk) { poly(g, [[5, 8], [10, 4], [16, 7], [22, 4], [30, 8], [31, 18], [28, 28], [20, 25], [13, 29], [6, 26], [4, 17]], c); poly(g, [[22, 4], [30, 8], [31, 18], [28, 28], [20, 25], [21, 15]], dk); }
function gemShape(g, c, x = 18, y = 16, s = 1) {
  poly(g, [[x - 10 * s, y - 3 * s], [x - 5 * s, y - 9 * s], [x + 5 * s, y - 9 * s], [x + 10 * s, y - 3 * s], [x, y + 11 * s]], c);
  poly(g, [[x - 10 * s, y - 3 * s], [x + 10 * s, y - 3 * s], [x, y + 11 * s]], shade(c, -0.25));
  poly(g, [[x - 5 * s, y - 9 * s], [x + 5 * s, y - 9 * s], [x + 3 * s, y - 3 * s], [x - 3 * s, y - 3 * s]], shade(c, 0.45));
  rect(g, x - 4 * s, y - 7 * s, 2, 2, '#ffffff');
}
function uncut(g, c) { poly(g, [[7, 18], [11, 8], [22, 6], [30, 14], [27, 25], [14, 27]], shade(c, -0.15)); poly(g, [[11, 8], [22, 6], [24, 15], [13, 17]], shade(c, 0.3)); }
function ring(g, gem) {
  ell(g, 18, 20, 10, 8, '#e0b028');
  g.globalCompositeOperation = 'destination-out'; ell(g, 18, 21, 6.5, 4.5, '#000'); g.globalCompositeOperation = 'source-over';
  ell(g, 12, 22, 1.5, 3, '#fff0a0');
  if (gem) { ell(g, 18, 11, 4.5, 3.8, gem); ell(g, 17, 10, 1.5, 1, '#ffffff'); }
}
function amulet(g, gem) {
  g.strokeStyle = '#e0b028'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(18, 12, 11, 9, 0, Math.PI * 0.05, Math.PI * 0.95, true); g.stroke();
  ell(g, 18, 23, 6, 6, '#e0b028'); ell(g, 18, 23, 4, 4, gem || '#c89818'); ell(g, 16.5, 21.5, 1.4, 1.2, '#ffffff');
}
function bucket(g, fill) {
  g.strokeStyle = '#555'; g.lineWidth = 1.5; g.beginPath(); g.arc(18, 12, 10, Math.PI, 0); g.stroke();
  poly(g, [[7, 11], [29, 11], [26, 29], [10, 29]], '#9a6a38'); rect(g, 7, 14, 22, 2, '#555'); rect(g, 9, 24, 18, 2, '#555');
  ell(g, 18, 11, 11, 2.5, fill || '#5a3a1a');
  if (fill) ell(g, 16, 10.5, 4, 1, shade(fill, 0.4));
}
function vialShape(g, liquid, level = 1) {
  rect(g, 15, 2, 6, 3, '#8a5a2c');
  poly(g, [[15, 5], [21, 5], [21, 10], [26, 16], [26, 28], [10, 28], [10, 16], [15, 10]], '#c8e4ec');
  if (liquid) {
    const top = 28 - Math.max(0.2, level) * 15;
    clip(g, c => { c.moveTo(15, 5); for (const p of [[21, 5], [21, 10], [26, 16], [26, 28], [10, 28], [10, 16], [15, 10]]) c.lineTo(p[0], p[1]); c.closePath(); }, () => { rect(g, 8, top, 20, 30, liquid); rect(g, 8, top, 20, 1.5, shade(liquid, 0.4)); });
  }
  rect(g, 12, 15, 2, 9, '#ffffff');
}
function herbLeaf(g, c) {
  line(g, [[8, 28], [18, 16], [26, 6]], 1.5, shade(c, -0.4));
  for (const [x, y, a] of [[12, 22, -0.6], [17, 16, 0.6], [21, 11, -0.6], [14, 18, 0.9], [23, 8, 0.5]]) {
    g.save(); g.translate(x, y); g.rotate(a); ell(g, 0, -4, 3, 5.5, c); line(g, [[0, 0], [0, -8]], 0.8, shade(c, -0.3)); g.restore();
  }
}
const grimyLeaf = c => g => { herbLeaf(g, shade(c, -0.45)); for (const [x, y] of [[12, 20], [20, 12], [16, 16]]) ell(g, x, y, 2, 1.5, '#4a3a1a'); };
const potion = (c, n) => g => vialShape(g, c, n / 3);
function bowShape(g, wood, long, strung) {
  const [a, b] = long ? [[29, 3], [5, 29]] : [[27, 6], [7, 27]];
  g.strokeStyle = wood; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(4, 4, b[0], b[1]); g.stroke();
  if (strung) line(g, [a, b], 1, '#e8e2d0');
  ell(g, 11, 11, 2.2, 2.2, '#4a3018');
}
function pottery(g, c, bowl) {
  if (bowl) { poly(g, [[4, 14], [32, 14], [27, 25], [9, 25]], c); ell(g, 18, 14, 14, 3.5, shade(c, -0.35)); ell(g, 18, 26, 6, 1.8, shade(c, -0.2)); return; }
  ell(g, 18, 20, 11, 9, c); rect(g, 12, 4, 12, 9, c); ell(g, 18, 4.5, 7, 2.5, shade(c, 0.2)); ell(g, 18, 4.5, 4.5, 1.5, shade(c, -0.5)); ell(g, 14, 18, 3, 4, shade(c, 0.25));
}
function bonesShape(g, c, big) {
  const s = big ? 1.25 : 1;
  const bone = (x0, y0, x1, y1) => { line(g, [[x0, y0], [x1, y1]], 3 * s, c); for (const [x, y] of [[x0, y0], [x1, y1]]) { ell(g, x - 1.5 * s, y - 1, 2.2 * s, 2.2 * s, c); ell(g, x + 1.5 * s, y + 1, 2.2 * s, 2.2 * s, c); } };
  bone(8, 24, 28, 10); bone(9, 9, 26, 25);
  line(g, [[10, 23], [26, 11]], 0.8, shade(c, 0.4));
}

// ---------------------------------------------------------------- prayer icons
function prayerBadge(g, tier, fill) {
  ell(g, 18, 16, 14, 14, ['#6a5a3a', '#8a7a4a', '#c9a227'][tier]);
  ell(g, 18, 16, 12, 12, fill);
}
const PI_DEF = tier => g => { prayerBadge(g, tier, '#2a2a3a'); const c = ['#9aa8c0', '#a89a7a', '#d8dce8'][tier]; poly(g, [[18, 6], [26, 9], [24, 19], [18, 26], [12, 19], [10, 9]], c); poly(g, [[18, 6], [26, 9], [24, 19], [18, 26]], shade(c, -0.25)); if (tier === 1) for (const [x, y] of [[15, 12], [20, 16], [16, 19]]) ell(g, x, y, 1.6, 1.2, '#6a5a40'); };
const PI_STR = tier => g => { prayerBadge(g, tier, '#3a1a1a'); const c = ['#c86040', '#e04030', '#ff2a1a'][tier]; const s = 0.8 + tier * 0.15; g.save(); g.translate(18, 17); g.scale(s, s); rect(g, -7, -6, 14, 11, c); for (const x of [-7, -3.5, 0, 3.5]) rect(g, x, -6, 0.8, 6, shade(c, -0.4)); rect(g, -5, 5, 9, 5, shade(c, -0.2)); poly(g, [[7, -3], [10, 0], [7, 3]], c); g.restore(); };
const PI_ATT = tier => g => { prayerBadge(g, tier, '#1a2a3a'); const c = ['#d8c060', '#f0d040', '#ffe860'][tier]; ell(g, 18, 16, 8, 5, c); ell(g, 18, 16, 3.5, 3.5, '#1a2a3a'); ell(g, 18, 16, 1.6, 1.6, c); for (let i = 0; i <= tier; i++) line(g, [[10 - i * 2, 9 - i], [7 - i * 2, 6 - i]], 1.2, c), line(g, [[26 + i * 2, 9 - i], [29 + i * 2, 6 - i]], 1.2, c); };
const PI_RNG = tier => g => { prayerBadge(g, tier, '#1a3a1a'); const c = ['#6ac04a', '#4ae04a', '#a0ff60'][tier]; ell(g, 18, 16, 9, 5, c); ell(g, 18, 16, 4, 4, '#0e2a0e'); ell(g, 18, 16, 1.8, 1.8, c); line(g, [[9, 16], [6, 13]], 1.2, c); line(g, [[27, 16], [30, 13]], 1.2, c); };
const PI_MAG = tier => g => { prayerBadge(g, tier, '#2a1a3a'); const c = ['#a070d0', '#c080ff', '#e0a0ff'][tier]; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) { const r = a * 1.4; g.lineTo(18 + Math.cos(a) * r * 0.55, 16 + Math.sin(a) * r * 0.55); } g.stroke(); ell(g, 18, 16, 2, 2, '#ffffff'); };
const PI_PROT = kind => g => {
  ell(g, 18, 16, 14, 14, '#c9a227'); ell(g, 18, 16, 12, 12, '#d8d8e0'); ell(g, 18, 16, 10.5, 10.5, '#2a3a5a');
  if (kind === 'magic') { poly(g, [[19, 6], [13, 17], [18, 17], [16, 26], [24, 13], [19, 13]], '#7ac8ff'); poly(g, [[19, 6], [17, 13], [19, 13]], '#ffffff'); }
  if (kind === 'ranged') { line(g, [[10, 24], [25, 9]], 2, '#c8a060'); poly(g, [[25, 9], [27, 6], [28, 10], [24, 12]], '#d8d8e0'); poly(g, [[10, 24], [8, 20], [13, 22]], '#ffffff'); poly(g, [[10, 24], [14, 26], [12, 21]], '#ffffff'); }
  if (kind === 'melee') { line(g, [[11, 23], [24, 10]], 2.6, '#e8e8f0'); poly(g, [[24, 10], [27, 7], [25, 11]], '#e8e8f0'); line(g, [[9, 19], [15, 25]], 2, '#c9a227'); line(g, [[9, 25], [12, 22]], 2.5, '#6a4a2a'); }
};

const D = {
  // bars
  bronze_bar: g => bar(g, M('bronze').color), iron_bar: g => bar(g, M('iron').color), steel_bar: g => bar(g, M('steel').color),
  mithril_bar: g => bar(g, M('mithril').color), adamant_bar: g => bar(g, M('adamant').color), rune_bar: g => bar(g, M('rune').color),
  silver_bar: g => bar(g, '#d0d0dc'), gold_bar: g => bar(g, '#e0b028'),
  // smithed gear (bronze_dagger, iron_sword, steel_longsword, mithril_scimitar and iron_helm are base items)
  bronze_sword: sword('bronze'), bronze_scimitar: scimitar('bronze'), bronze_longsword: longsword('bronze'), bronze_full_helm: helm('bronze'), bronze_kiteshield: kiteshield('bronze'), bronze_platelegs: platelegs('bronze'), bronze_platebody: platebody('bronze'), bronze_arrowtips: arrowtips('bronze'),
  iron_dagger: dagger('iron'), iron_scimitar: scimitar('iron'), iron_longsword: longsword('iron'), iron_kiteshield: kiteshield('iron'), iron_platelegs: platelegs('iron'), iron_platebody: platebody('iron'), iron_arrowtips: arrowtips('iron'),
  steel_dagger: dagger('steel'), steel_sword: sword('steel'), steel_scimitar: scimitar('steel'), steel_full_helm: helm('steel'), steel_kiteshield: kiteshield('steel'), steel_platelegs: platelegs('steel'), steel_platebody: platebody('steel'), steel_arrowtips: arrowtips('steel'),
  mithril_dagger: dagger('mithril'), mithril_sword: sword('mithril'), mithril_longsword: longsword('mithril'), mithril_full_helm: helm('mithril'), mithril_kiteshield: kiteshield('mithril'), mithril_platelegs: platelegs('mithril'), mithril_platebody: platebody('mithril'), mithril_arrowtips: arrowtips('mithril'),
  adamant_dagger: dagger('adamant'), adamant_sword: sword('adamant'), adamant_scimitar: scimitar('adamant'), adamant_longsword: longsword('adamant'), adamant_full_helm: helm('adamant'), adamant_kiteshield: kiteshield('adamant'), adamant_platelegs: platelegs('adamant'), adamant_platebody: platebody('adamant'), adamant_arrowtips: arrowtips('adamant'),
  rune_dagger: dagger('rune'), rune_sword: sword('rune'), rune_scimitar: scimitar('rune'), rune_longsword: longsword('rune'), rune_full_helm: helm('rune'), rune_kiteshield: kiteshield('rune'), rune_platelegs: platelegs('rune'), rune_platebody: platebody('rune'), rune_arrowtips: arrowtips('rune'),
  adamant_arrow: g => arrows(g, M('adamant').color), rune_arrow: g => arrows(g, M('rune').color),

  // food
  shrimps: shrimps('#f08060'), anchovies: g => { for (const y of [10, 17, 24]) { ell(g, 18, y, 11, 2.6, '#7a8a9a'); rect(g, 7, y - 1, 22, 1, '#4a5a6a'); poly(g, [[7, y], [3, y - 3], [3, y + 3]], '#5a6a7a'); } },
  trout: cookedFish('#c08a5a', '#8a5a30', '#e0b080', { spots: '#5a3010' }), salmon: cookedFish('#e88a60', '#a85a3a', '#f8c0a0'),
  pike: cookedFish('#b0a060', '#7a6a30', '#d8c890', { len: 14, h: 4.5 }), eel: g => { line(g, [[4, 22], [10, 14], [18, 20], [26, 12], [32, 16]], 4.5, '#7a4a20'); line(g, [[5, 21], [10, 13.5], [18, 19], [26, 11], [31, 15]], 1.5, '#c8904a'); rect(g, 30, 14, 1.5, 1.5, '#111'); },
  lobster: g => { ell(g, 18, 18, 6, 9, '#e04020'); for (const s of [-1, 1]) { line(g, [[18 + s * 4, 12], [18 + s * 11, 6]], 2.5, '#e04020'); ell(g, 18 + s * 12, 5, 3.5, 2.5, '#e04020'); } poly(g, [[13, 27], [23, 27], [18, 31]], '#c03018'); for (const y of [16, 20, 24]) line(g, [[13, y], [23, y]], 0.8, '#a02010'); },
  swordfish: cookedFish('#b8b8c8', '#7a7a90', '#e0e0e8', { len: 11, h: 5 }), shark: cookedFish('#9aa0a8', '#6a7078', '#d8dce0', { len: 14, h: 6.5 }),
  cooked_meat: g => meat(g, '#8a4a20', '#d8a070'), cooked_chicken: g => drumstick(g, '#c8803a'), roast_bird_meat: g => drumstick(g, '#b06a2a'), roast_rabbit: g => meat(g, '#a05a2a', '#e0b080'),
  baked_potato: g => { ell(g, 18, 18, 13, 9, '#a07040'); ell(g, 16, 15, 7, 4, '#f2e0a0'); ell(g, 16, 14, 3.5, 1.5, '#ffffff'); },
  burnt_fish: g => fish(g, '#3a2a20', '#1a1210', '#4a3a30'), burnt_meat: g => meat(g, '#2a1a10', '#4a3020'), burnt_potato: g => { ell(g, 18, 18, 12, 8, '#2a1e14'); ell(g, 15, 15, 4, 2, '#4a3828'); },

  // animal products and bones
  raw_beef: g => meat(g, '#c83a3a', '#f2d0c0'), raw_chicken: g => drumstick(g, '#f0c8b0'),
  cowhide: g => { hide(g, '#f2f2f2', '#d8d8d8'); for (const [x, y, r] of [[11, 12, 3.5], [22, 17, 4], [14, 22, 3]]) ell(g, x, y, r, r * 0.8, '#2a2a2a'); },
  wool: g => { for (const [x, y, r] of [[12, 18, 6], [20, 13, 7], [24, 21, 6], [16, 23, 5]]) ell(g, x, y, r, r, '#f4f0e4'); for (const [x, y] of [[14, 15], [21, 11], [24, 19]]) ell(g, x, y, 2.5, 1.5, '#ffffff'); },
  bones: g => bonesShape(g, '#ece4d0'), big_bones: g => bonesShape(g, '#e4dac0', true), dragon_bones: g => { bonesShape(g, '#c8d0a8', true); ell(g, 18, 17, 2.5, 2.5, '#7a8a5a'); },
  ashes: g => { ell(g, 18, 22, 13, 6, '#6a6a6a'); ell(g, 17, 19, 9, 5, '#8a8a8a'); ell(g, 15, 17, 4, 2, '#aaaaaa'); },

  // crafting materials and products
  leather: g => hide(g, '#a8784a', '#8a5a34'), hard_leather: g => { hide(g, '#7a4a26', '#5e3618'); line(g, [[9, 12], [27, 12]], 1, '#4a2a10'); line(g, [[9, 20], [27, 20]], 1, '#4a2a10'); },
  leather_gloves: g => { for (const [ox, c] of [[0, '#8a5a34'], [13, '#7a4e2a']]) { rect(g, 4 + ox, 12, 9, 12, c); for (let i = 0; i < 4; i++) rect(g, 4 + ox + i * 2.3, 5 + (i % 3), 2, 8, c); rect(g, 4 + ox, 22, 9, 4, shade(c, -0.3)); } },
  leather_vambraces: g => { for (const ox of [0, 14]) { poly(g, [[5 + ox, 6], [13 + ox, 6], [15 + ox, 28], [3 + ox, 28]], '#8a5a34'); for (const y of [10, 16, 22]) line(g, [[5 + ox, y], [14 + ox, y]], 1, '#4a2a10'); } },
  leather_chaps: g => { poly(g, [[9, 3], [27, 3], [29, 29], [21, 29], [18, 12], [15, 29], [7, 29]], '#8a5a34'); poly(g, [[18, 3], [27, 3], [29, 29], [21, 29], [18, 12]], '#6e4628'); rect(g, 9, 3, 18, 3, '#4a2a10'); },
  hardleather_body: g => { const pts = [[11, 5], [15, 7], [21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [10, 29], [10, 14], [7, 16], [3, 10]]; poly(g, pts, '#6a4022'); clip(g, c => { c.rect(18, 0, 18, 32); }, () => poly(g, pts, '#52301a')); for (const y of [11, 17, 23]) line(g, [[11, y], [25, y]], 1, '#3a2010'); },
  sapphire: g => gemShape(g, GEM_COLOR.sapphire), emerald: g => gemShape(g, GEM_COLOR.emerald), ruby: g => gemShape(g, GEM_COLOR.ruby), diamond: g => gemShape(g, '#d0e4f4'),
  gold_ring: g => ring(g, null), sapphire_ring: g => ring(g, GEM_COLOR.sapphire), emerald_ring: g => ring(g, GEM_COLOR.emerald), ruby_ring: g => ring(g, GEM_COLOR.ruby), diamond_ring: g => ring(g, '#e8f4ff'),
  gold_amulet: g => amulet(g, null), sapphire_amulet: g => amulet(g, GEM_COLOR.sapphire), emerald_amulet: g => amulet(g, GEM_COLOR.emerald), ruby_amulet: g => amulet(g, GEM_COLOR.ruby), diamond_amulet: g => amulet(g, '#e8f4ff'),
  soft_clay: g => { ell(g, 18, 19, 12, 8, '#b08a68'); ell(g, 15, 16, 6, 3.5, '#c8a482'); line(g, [[12, 22], [24, 21]], 1, '#8a6a4a'); },
  unfired_pot: g => pottery(g, '#a89070'), pot: g => pottery(g, '#b8603a'), unfired_bowl: g => pottery(g, '#a89070', true), bowl: g => pottery(g, '#b8603a', true),
  molten_glass: g => { ell(g, 18, 20, 12, 8, '#e87a20'); ell(g, 17, 17, 8, 5, '#ffb040'); ell(g, 15, 15, 3, 2, '#fff0a0'); },
  bucket_of_sand: g => bucket(g, '#e8d090'), bucket_of_water: g => bucket(g, '#3a7ad8'),
  soda_ash: g => { ell(g, 18, 22, 13, 6, '#c8c8c0'); ell(g, 17, 18, 9, 5, '#e8e8e0'); ell(g, 15, 16, 4, 2, '#ffffff'); },
  seaweed: g => { for (const [x, c] of [[11, '#2a6a3a'], [18, '#3a8a4a'], [25, '#2a5a2a']]) line(g, [[x, 29], [x - 3, 22], [x + 2, 15], [x - 2, 8], [x + 1, 3]], 2.5, c); },
  vial: g => vialShape(g, null), vial_of_water: g => vialShape(g, '#5a8ad8', 0.85),
  beer_glass: g => { poly(g, [[11, 4], [25, 4], [23, 29], [13, 29]], '#d8ecf2'); rect(g, 14, 8, 2, 18, '#ffffff'); },
  fishbowl: g => { ell(g, 18, 18, 12, 11, '#c8e4ec'); ell(g, 18, 8, 7, 2, '#a8c8d4'); ell(g, 14, 16, 2.5, 4, '#ffffff'); },
  unpowered_orb: g => { ell(g, 18, 17, 11, 11, '#b8b8c8'); ell(g, 14, 13, 4, 3, '#ffffff'); ell(g, 21, 21, 4, 3, '#8a8a9a'); },
  ball_of_wool: g => { ell(g, 18, 18, 11, 10, '#f0ead8'); for (const a of [0.3, 1.1, 2.0]) { g.save(); g.translate(18, 18); g.rotate(a); g.strokeStyle = '#c8c0a8'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); g.stroke(); g.restore(); } line(g, [[27, 22], [33, 28]], 1.2, '#f0ead8'); },
  bow_string: g => { g.strokeStyle = '#e8e0c0'; g.lineWidth = 1.6; for (const r of [10, 8, 6]) { g.beginPath(); g.ellipse(18, 16, r, r * 0.7, 0.3, 0, Math.PI * 2); g.stroke(); } line(g, [[26, 20], [32, 28]], 1.6, '#e8e0c0'); },
  chisel: g => { line(g, [[6, 28], [17, 17]], 4, '#8a5a2c'); poly(g, [[16, 16], [27, 5], [31, 9], [20, 20]], '#a8a8b0'); poly(g, [[27, 5], [31, 9], [32, 5]], '#e0e0e8'); },
  needle: g => { line(g, [[6, 29], [29, 4]], 1.6, '#c8c8d0'); ell(g, 27, 6, 1.5, 2.5, '#c8c8d0'); g.globalCompositeOperation = 'destination-out'; ell(g, 27, 6, 0.6, 1.2, '#000'); g.globalCompositeOperation = 'source-over'; },
  thread: g => { rect(g, 11, 6, 14, 3, '#8a5a2c'); rect(g, 11, 23, 14, 3, '#8a5a2c'); rect(g, 13, 9, 10, 14, '#e8e0c8'); for (const y of [11, 14, 17, 20]) line(g, [[13, y], [23, y + 1]], 0.8, '#c8bea0'); },
  knife: g => { line(g, [[5, 28], [13, 20]], 3.5, '#4a3018'); poly(g, [[12, 18], [28, 4], [30, 6], [16, 22]], '#c8c8d0'); poly(g, [[12, 18], [28, 4], [27, 8]], '#ececf4'); },
  pestle_and_mortar: g => { poly(g, [[5, 16], [31, 16], [26, 28], [10, 28]], '#a8a8a0'); ell(g, 18, 16, 13, 3.5, '#6a6a62'); line(g, [[16, 18], [27, 4]], 4, '#c8c8c0'); },
  ring_mould: g => { rect(g, 6, 8, 24, 18, '#7a7a82'); rect(g, 6, 22, 24, 4, '#5a5a62'); g.strokeStyle = '#3a3a42'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(18, 16, 5, 4, 0, 0, Math.PI * 2); g.stroke(); },
  amulet_mould: g => { rect(g, 6, 8, 24, 18, '#7a7a82'); rect(g, 6, 22, 24, 4, '#5a5a62'); ell(g, 18, 16, 5, 5, '#3a3a42'); ell(g, 18, 16, 3, 3, '#5a5a62'); },
  glassblowing_pipe: g => { line(g, [[4, 28], [30, 5]], 2.2, '#8a8a92'); line(g, [[4, 28], [10, 23]], 3.5, '#4a3018'); ell(g, 30, 5, 2.5, 2.5, '#6a6a72'); },

  // fletching
  arrow_shaft: g => { for (const o of [0, 4, 8]) line(g, [[4 + o, 29], [26 + o, 7 - o * 0.2]], 1.6, '#a87a48'); },
  headless_arrow: g => { for (const o of [0, 4, 8]) { line(g, [[5 + o, 29], [27 + o, 7 - o * 0.2]], 1.6, '#a87a48'); poly(g, [[5 + o, 29], [3 + o, 25], [8 + o, 27]], '#e8e8e8'); } },
  shortbow_u: g => bowShape(g, '#8a5a2c'), oak_shortbow_u: g => bowShape(g, '#a9773c'), willow_longbow_u: g => bowShape(g, '#c39a5a', true), maple_shortbow_u: g => bowShape(g, '#7a3e1e'),

  // herblore
  guam_leaf: g => herbLeaf(g, HERBS[0].color), marrentill: g => herbLeaf(g, HERBS[1].color), tarromin: g => herbLeaf(g, HERBS[2].color), harralander: g => herbLeaf(g, HERBS[3].color), ranarr_weed: g => herbLeaf(g, HERBS[4].color),
  guam_potion_unf: g => vialShape(g, HERBS[0].color, 0.85), marrentill_potion_unf: g => vialShape(g, HERBS[1].color, 0.85), tarromin_potion_unf: g => vialShape(g, HERBS[2].color, 0.85), harralander_potion_unf: g => vialShape(g, HERBS[3].color, 0.85), ranarr_potion_unf: g => vialShape(g, HERBS[4].color, 0.85),
  eye_of_newt: g => { ell(g, 18, 17, 10, 10, '#f0e8c8'); ell(g, 19, 17, 5, 5, '#d8a020'); ell(g, 20, 17, 2, 4, '#111'); ell(g, 15, 13, 2, 1.5, '#ffffff'); },
  limpwurt_root: g => { line(g, [[10, 6], [16, 16], [14, 28]], 4, '#c8a060'); line(g, [[16, 16], [24, 26]], 2.5, '#c8a060'); line(g, [[16, 16], [26, 12]], 2, '#b08a50'); ell(g, 10, 6, 4, 3, '#4a9a3a'); },
  white_berries: g => { line(g, [[18, 3], [18, 14]], 1.2, '#4a7a2a'); for (const [x, y] of [[13, 16], [20, 15], [16, 22], [23, 21], [10, 22], [19, 27]]) { ell(g, x, y, 3.5, 3.5, '#f4f4f0'); rect(g, x - 1.5, y - 1.5, 1.5, 1.5, '#ffffff'); } },
  snape_grass: g => { for (const [x, l, c] of [[10, 20, '#5a8a3a'], [15, 25, '#6aa04a'], [20, 22, '#4a7a2a'], [25, 18, '#6aa04a']]) poly(g, [[x - 2, 30], [x + 2, 30], [x + 3, 30 - l]], c); },
  juniper_berries: g => { line(g, [[8, 26], [26, 6]], 1.2, '#4a6a3a'); for (const [x, y] of [[12, 18], [18, 13], [22, 19], [15, 24], [24, 11]]) { ell(g, x, y, 3.2, 3.2, '#3a4a8a'); rect(g, x - 1, y - 2, 1.5, 1.5, '#9aa8e0'); } },
  crushed_juniper: g => { ell(g, 18, 22, 13, 6, '#3a4070'); ell(g, 17, 19, 9, 5, '#4a5090'); for (const [x, y] of [[13, 19], [20, 18], [17, 22]]) rect(g, x, y, 1.5, 1.5, '#9aa8e0'); },
  attack_potion: potion(POTIONS[0].color, 3), attack_potion2: potion(POTIONS[0].color, 2), attack_potion1: potion(POTIONS[0].color, 1),
  tulip_tonic: potion(POTIONS[1].color, 3), tulip_tonic2: potion(POTIONS[1].color, 2), tulip_tonic1: potion(POTIONS[1].color, 1),
  strength_potion: potion(POTIONS[2].color, 3), strength_potion2: potion(POTIONS[2].color, 2), strength_potion1: potion(POTIONS[2].color, 1),
  jenever_brew: potion(POTIONS[3].color, 3), jenever_brew2: potion(POTIONS[3].color, 2), jenever_brew1: potion(POTIONS[3].color, 1),
  defence_potion: potion(POTIONS[4].color, 3), defence_potion2: potion(POTIONS[4].color, 2), defence_potion1: potion(POTIONS[4].color, 1),
  prayer_potion: potion(POTIONS[5].color, 3), prayer_potion2: potion(POTIONS[5].color, 2), prayer_potion1: potion(POTIONS[5].color, 1),

  // prayer book (also used as overhead icons)
  pi_thick_skin: PI_DEF(0), pi_rock_skin: PI_DEF(1), pi_steel_skin: PI_DEF(2),
  pi_burst_of_strength: PI_STR(0), pi_superhuman_strength: PI_STR(1), pi_ultimate_strength: PI_STR(2),
  pi_clarity_of_thought: PI_ATT(0), pi_improved_reflexes: PI_ATT(1), pi_incredible_reflexes: PI_ATT(2),
  pi_sharp_eye: PI_RNG(0), pi_hawk_eye: PI_RNG(1), pi_eagle_eye: PI_RNG(2),
  pi_mystic_will: PI_MAG(0), pi_mystic_lore: PI_MAG(1), pi_mystic_might: PI_MAG(2),
  pi_rapid_heal: g => { prayerBadge(g, 1, '#3a1a1a'); ell(g, 14, 13, 4.5, 4.5, '#e02030'); ell(g, 22, 13, 4.5, 4.5, '#e02030'); poly(g, [[9.6, 14.5], [26.4, 14.5], [18, 25]], '#e02030'); rect(g, 17, 9, 2, 8, '#ffffff'); rect(g, 14, 12, 8, 2, '#ffffff'); },
  pi_protect_from_magic: PI_PROT('magic'), pi_protect_from_missiles: PI_PROT('ranged'), pi_protect_from_melee: PI_PROT('melee'),
};

Object.assign(registry.iconDrawers, D);
