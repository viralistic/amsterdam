// 36x32 pixel-art inventory icons for every gathering item (outline and drop shadow are added by the engine).
import { registry } from '../../registry.js';
import { METALS } from '/shared/content/gathering/data.js';

const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const clip = (g, fn, inner) => { g.save(); g.beginPath(); fn(); g.clip(); inner(); g.restore(); };

// shade a hex colour: k < 0 darker, k > 0 lighter
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => { const v = (n >> s) & 255; return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); };
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
}

const HANDLE = '#7a5030', HANDLE_HI = '#a87444';

// ---- tools
function axe(g, metal) {
  line(g, [[6, 30], [24, 7]], 3.2, HANDLE);
  line(g, [[6, 29], [23, 7]], 1, HANDLE_HI);
  poly(g, [[19, 9], [22, 3], [30, 4], [33, 11], [31, 18], [25, 15], [23, 12]], metal);
  poly(g, [[30, 4], [33, 11], [31, 18], [29, 16], [31, 10], [28, 5]], shade(metal, 0.45));
  poly(g, [[19, 9], [23, 12], [25, 15], [22, 14]], shade(metal, -0.35));
  rect(g, 21, 7, 3, 3, shade(metal, -0.25));
}
function pickaxe(g, metal) {
  line(g, [[7, 30], [21, 10]], 3.2, HANDLE);
  line(g, [[7, 29], [20, 10]], 1, HANDLE_HI);
  g.strokeStyle = metal; g.lineWidth = 4; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(5, 9); g.quadraticCurveTo(20, 1, 33, 15); g.stroke();
  g.strokeStyle = shade(metal, 0.45); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(6, 7.5); g.quadraticCurveTo(20, 0, 32, 13); g.stroke();
  poly(g, [[3, 10], [6, 7], [7, 11]], shade(metal, -0.3));
  poly(g, [[33, 16], [31, 12], [35, 13]], shade(metal, -0.3));
  rect(g, 18, 6, 4, 4, shade(metal, -0.35));
}

const ICONS = {
  small_net: g => {
    ell(g, 18, 17, 14, 11, '#b8a878');
    clip(g, () => g.ellipse(18, 17, 12.5, 9.5, 0, 0, Math.PI * 2), () => { for (let i = -20; i < 40; i += 4) { line(g, [[i, 4], [i + 14, 30]], 1, '#6a5a38'); line(g, [[i + 14, 4], [i, 30]], 1, '#6a5a38'); } });
    g.strokeStyle = '#d8c898'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(18, 17, 13.5, 10.5, 0, 0, Math.PI * 2); g.stroke();
    ell(g, 31, 8, 2, 2, '#8a6a40');
  },
  fishing_rod: g => {
    line(g, [[4, 30], [31, 3]], 2, '#8a5a2c'); line(g, [[4, 30], [12, 22]], 3.2, '#4a3018');
    ell(g, 11, 24, 3, 3, '#9a9aa2'); ell(g, 11, 24, 1.2, 1.2, '#5a5a62');
    line(g, [[31, 3], [33, 18]], 0.8, '#e8e8e8');
    poly(g, [[32, 18], [35, 19], [33, 22]], '#c8c8d0');
  },
  fly_fishing_rod: g => {
    line(g, [[4, 30], [32, 2]], 1.8, '#c8a060'); line(g, [[4, 30], [11, 23]], 3.2, '#5a3a20');
    ell(g, 10, 25, 3.5, 3.5, '#5a5a62'); ell(g, 10, 25, 1.5, 1.5, '#c9a227');
    g.strokeStyle = '#f0f0e8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(20, 6, 34, 12, 28, 18); g.stroke();
    poly(g, [[27, 18], [31, 19], [28, 22], [25, 20]], '#d84a2a'); line(g, [[26, 21], [24, 24]], 1, '#f2d040');
  },
  harpoon: g => {
    line(g, [[4, 31], [26, 9]], 2.6, '#7a5030');
    line(g, [[5, 30], [25, 9]], 0.8, '#a87444');
    poly(g, [[24, 8], [33, 1], [29, 12]], '#a8a8b0');
    poly(g, [[24, 8], [33, 1], [27, 7]], '#d8d8e0');
    poly(g, [[25, 12], [22, 13], [26, 10]], '#8a8a92'); poly(g, [[22, 9], [21, 6], [25, 8]], '#8a8a92');
    rect(g, 22, 9, 3, 3, '#5a5a62');
  },
  lobster_pot: g => {
    poly(g, [[4, 28], [5, 16], [10, 9], [18, 7], [26, 9], [31, 16], [32, 28]], '#8a6238');
    clip(g, () => { g.moveTo(5, 28); g.lineTo(6, 17); g.lineTo(11, 11); g.lineTo(18, 9); g.lineTo(25, 11); g.lineTo(30, 17); g.lineTo(31, 28); g.closePath(); }, () => {
      for (let x = 2; x < 36; x += 4) rect(g, x, 0, 1.5, 32, '#3a2a18');
      for (const y of [14, 21]) rect(g, 0, y, 36, 1.5, '#3a2a18');
    });
    rect(g, 3, 27, 30, 3, '#6a4828');
    ell(g, 18, 17, 3.5, 3, '#2a1a10');
  },
  fishing_bait: g => {
    for (const [x, y, c] of [[9, 22, '#c87a7a'], [17, 17, '#b86a6a'], [24, 23, '#d08888']]) {
      g.strokeStyle = c; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - 6, y); g.bezierCurveTo(x - 3, y - 6, x + 1, y + 6, x + 6, y - 2); g.stroke();
      ell(g, x + 6, y - 2, 1.6, 1.6, shade(c, -0.25));
    }
    ell(g, 18, 28, 13, 2.5, '#5a3a20');
  },
  feather: g => {
    poly(g, [[29, 3], [33, 6], [22, 21], [12, 28], [9, 26], [15, 17]], '#f4f4f0');
    poly(g, [[29, 3], [33, 6], [22, 21], [13, 27]], '#d4d4d0');
    line(g, [[31, 4], [7, 30]], 1, '#a8a8a0');
    for (const t of [0.3, 0.5, 0.7]) line(g, [[31 - 24 * t, 4 + 26 * t], [29 - 24 * t + 4, 6 + 26 * t - 5]], 0.8, '#e0e0dc');
  },

  // ---- farming tools
  rake: g => {
    line(g, [[5, 31], [25, 9]], 2.4, HANDLE); line(g, [[6, 30], [24, 9]], 0.8, HANDLE_HI);
    line(g, [[19, 3], [33, 15]], 2.5, '#8a8a92');
    for (let i = 0; i < 5; i++) { const x = 20 + i * 3, y = 4 + i * 2.6; line(g, [[x, y], [x - 3, y + 4]], 1.4, '#8a8a92'); }
  },
  seed_dibber: g => {
    poly(g, [[16, 30], [13, 14], [21, 14]], '#9a6a38');
    poly(g, [[16, 30], [17, 14], [21, 14]], '#7a5028');
    rect(g, 10, 9, 14, 5, '#7a5028');
    rect(g, 14, 3, 6, 7, '#a87444');
    rect(g, 15, 3, 2, 7, '#c8945a');
  },
  spade: g => {
    line(g, [[16, 3], [16, 18]], 3, HANDLE); line(g, [[15.5, 3], [15.5, 18]], 0.8, HANDLE_HI);
    rect(g, 11, 2, 10, 3, '#5a3a20');
    poly(g, [[10, 18], [22, 18], [22, 27], [16, 31], [10, 27]], '#8a8a92');
    poly(g, [[16, 18], [22, 18], [22, 27], [16, 31]], '#6a6a72');
    rect(g, 11, 19, 3, 6, '#b8b8c0');
  },
  compost: g => {
    poly(g, [[7, 11], [29, 11], [26, 29], [10, 29]], '#9a6a38');
    rect(g, 7, 14, 22, 2, '#555'); rect(g, 9, 24, 18, 2, '#555');
    ell(g, 18, 11, 11, 3, '#3a2814');
    for (const [x, y] of [[13, 10], [20, 11], [24, 10], [16, 12]]) ell(g, x, y, 2, 1, '#5a4020');
    g.strokeStyle = '#555'; g.lineWidth = 1.5; g.beginPath(); g.arc(18, 12, 10, Math.PI, 0); g.stroke();
  },
  weeds: g => {
    for (const [x, h, c, lean] of [[10, 20, '#8a9a32', -3], [14, 26, '#a8a83a', 1], [18, 22, '#7a8a2a', -1], [22, 25, '#9aa838', 2], [26, 18, '#8a9a32', 4]]) poly(g, [[x - 2, 30], [x + lean, 30 - h], [x + 2, 30]], c);
    ell(g, 18, 30, 11, 2, '#5a4020');
  },

  // ---- produce
  potato: g => { ell(g, 18, 18, 13, 9, '#a87a44', 0.3); ell(g, 15, 15, 7, 4, '#c8985a', 0.3); for (const [x, y] of [[11, 18], [20, 13], [24, 21], [16, 23]]) ell(g, x, y, 1.2, 1, '#6a4a22'); },
  onion: g => { ell(g, 18, 20, 11, 10, '#c88a4a'); ell(g, 15, 17, 5, 6, '#e0aa6a'); poly(g, [[16, 11], [18, 2], [20, 11]], '#6aa83a'); line(g, [[14, 21], [18, 29], [22, 21]], 0.8, '#9a6a34'); poly(g, [[15, 30], [18, 28], [21, 30]], '#e8d8b8'); },
  cabbage: g => { ell(g, 18, 18, 13, 12, '#5a9a4a'); ell(g, 18, 16, 9, 8, '#8ac06a'); ell(g, 17, 14, 4, 3, '#b8e098'); for (const a of [-0.8, 0, 0.8]) line(g, [[18, 18], [18 + Math.sin(a) * 12, 18 + Math.cos(a) * 10]], 0.8, '#3a7a2a'); },
  flax: g => {
    for (const [x, lean] of [[11, -4], [15, -1], [19, 1], [23, 4]]) line(g, [[18, 30], [x + lean, 8]], 1.3, '#7a9a3a');
    for (const [x, y] of [[7, 7], [14, 6], [20, 8], [27, 7]]) { ell(g, x, y, 3, 3, '#5a7ad8'); ell(g, x, y, 1, 1, '#f2e8a0'); }
    rect(g, 14, 22, 8, 3, '#c8a860');
  },

  // ---- hunter
  bird_snare: g => {
    line(g, [[8, 31], [12, 6]], 2.4, '#7a5a34');
    g.strokeStyle = '#e0d6b8'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(12, 7); g.quadraticCurveTo(28, 4, 25, 16); g.stroke();
    g.beginPath(); g.ellipse(24, 22, 6, 5, 0, 0, Math.PI * 2); g.stroke();
    line(g, [[25, 16], [24, 17]], 1.3, '#e0d6b8');
  },
  box_trap: g => {
    poly(g, [[4, 14], [26, 14], [32, 9], [10, 9]], '#a87a48');
    poly(g, [[4, 14], [26, 14], [26, 29], [4, 29]], '#8a6238');
    poly(g, [[26, 14], [32, 9], [32, 24], [26, 29]], '#6a4828');
    for (const x of [8, 13, 18, 23]) rect(g, x, 15, 1, 13, '#5a3e22');
    poly(g, [[27, 15], [31, 12], [31, 22], [27, 26]], '#2a1a10');
    rect(g, 3, 13, 24, 2, '#c8945a');
  },
  raw_bird_meat: g => {
    ell(g, 21, 15, 10, 8, '#e8909a', -0.4); ell(g, 19, 13, 6, 4, '#f4b8be', -0.4);
    line(g, [[13, 21], [6, 28]], 3.5, '#f2e8dc'); ell(g, 5, 29, 2.5, 2, '#f2e8dc'); ell(g, 7, 30, 2, 1.8, '#f2e8dc');
  },
  raw_rabbit: g => {
    ell(g, 19, 17, 12, 8, '#d87a80', 0.15); ell(g, 17, 15, 7, 4, '#eca0a6', 0.15);
    line(g, [[28, 21], [33, 28]], 3, '#d87a80'); line(g, [[9, 21], [4, 27]], 3, '#d87a80');
    ell(g, 33, 29, 2, 1.5, '#f2e8dc'); ell(g, 4, 28, 2, 1.5, '#f2e8dc');
  },
  bird_nest: g => {
    ell(g, 18, 20, 15, 9, '#7a5a30');
    ell(g, 18, 17, 12, 6, '#3a2814');
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; line(g, [[18 + Math.cos(a) * 14, 20 + Math.sin(a) * 8], [18 + Math.cos(a + 0.9) * 14, 20 + Math.sin(a + 0.9) * 8]], 1, i % 2 ? '#a8804a' : '#5a4020'); }
    ell(g, 14, 16, 3, 2.3, '#b8d8e8'); ell(g, 20, 15, 3, 2.3, '#c8e4f0'); ell(g, 13.5, 15.2, 1, 0.7, '#ffffff');
  },
};

// ---- axes and pickaxes
Object.assign(ICONS, {
  bronze_axe: g => axe(g, METALS.bronze), iron_axe: g => axe(g, METALS.iron), steel_axe: g => axe(g, METALS.steel),
  mithril_axe: g => axe(g, METALS.mithril), adamant_axe: g => axe(g, METALS.adamant), rune_axe: g => axe(g, METALS.rune),
  bronze_pickaxe: g => pickaxe(g, METALS.bronze), iron_pickaxe: g => pickaxe(g, METALS.iron), steel_pickaxe: g => pickaxe(g, METALS.steel),
  mithril_pickaxe: g => pickaxe(g, METALS.mithril), adamant_pickaxe: g => pickaxe(g, METALS.adamant), rune_pickaxe: g => pickaxe(g, METALS.rune),
});

// ---- logs: three stacked logs, end grain facing the viewer
function logs(g, bark, end, ring, glow) {
  for (const [x, y] of [[11, 22], [25, 22], [18, 12]]) {
    rect(g, x - 1, y - 5.5, 10, 11, bark);
    rect(g, x - 1, y - 5.5, 10, 2, shade(bark, 0.25));
    rect(g, x - 1, y + 3.5, 10, 2, shade(bark, -0.3));
    ell(g, x + 9, y, 3, 5.5, shade(bark, -0.2));
    ell(g, x - 1, y, 5, 5.5, end);
    g.strokeStyle = ring; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x - 1, y, 3, 3.3, 0, 0, Math.PI * 2); g.stroke();
    ell(g, x - 1, y, 1, 1.1, glow || ring);
  }
}
const LOGS = {
  logs: ['#7a5030', '#c8a070', '#8a6038'], oak_logs: ['#8a6a40', '#d8b480', '#a07a48'], willow_logs: ['#8a7a50', '#e8d4a0', '#b8a070'],
  elm_logs: ['#5a4232', '#c49a78', '#7a5a42'], maple_logs: ['#6a3a1e', '#c87850', '#8a4a28'], yew_logs: ['#5a3424', '#b86a48', '#7a3a22'],
  magic_logs: ['#3a5060', '#7ae0d0', '#2a8a80', '#d8fff4'],
};
for (const [id, c] of Object.entries(LOGS)) ICONS[id] = g => logs(g, ...c);

// ---- ores: a lump of rock with coloured veins, or a solid lump (coal, clay)
function ore(g, rock, fleck, solid) {
  const pts = [[5, 22], [8, 12], [16, 7], [26, 8], [32, 15], [31, 25], [22, 29], [10, 28]];
  poly(g, pts, solid || rock);
  poly(g, [[16, 7], [26, 8], [32, 15], [22, 17], [12, 15]], shade(solid || rock, 0.22));
  poly(g, [[5, 22], [12, 15], [22, 17], [31, 25], [22, 29], [10, 28]], shade(solid || rock, -0.2));
  if (fleck) for (const [x, y, r] of [[14, 12, 2.5], [22, 13, 2], [11, 21, 2.2], [20, 22, 2.8], [27, 19, 1.8], [17, 17, 1.5]]) { ell(g, x, y, r, r * 0.8, fleck); ell(g, x - 0.6, y - 0.6, r * 0.4, r * 0.3, shade(fleck, 0.5)); }
}
const ORES = {
  copper_ore: ['#6a645c', '#c8742e'], tin_ore: ['#6a645c', '#d8d8d0'], iron_ore: ['#6a645c', '#8a4428'], silver_ore: ['#6a645c', '#f0f2f8'],
  gold_ore: ['#6a645c', '#f2c230'], mithril_ore: ['#5a5650', '#5a64d0'], adamantite_ore: ['#5a5650', '#4f9a5a'], runite_ore: ['#5a5650', '#3cc8dc'],
};
for (const [id, [r, f]] of Object.entries(ORES)) ICONS[id] = g => ore(g, r, f);
Object.assign(ICONS, {
  coal: g => ore(g, null, '#3a3a3e', '#1e1e22'),
  clay: g => { ore(g, null, null, '#b89a68'); for (const [x, y] of [[13, 14], [22, 20], [17, 24]]) ell(g, x, y, 2, 1.2, '#9a7c4e'); },
});

// ---- uncut gems: rough faceted stones
function gem(g, c) {
  poly(g, [[8, 18], [12, 9], [22, 6], [29, 12], [28, 23], [18, 28], [10, 25]], c);
  poly(g, [[12, 9], [22, 6], [29, 12], [20, 15]], shade(c, 0.35));
  poly(g, [[8, 18], [12, 9], [20, 15], [16, 20]], shade(c, 0.12));
  poly(g, [[16, 20], [20, 15], [29, 12], [28, 23], [18, 28]], shade(c, -0.3));
  ell(g, 17, 10, 2, 1.2, '#ffffff');
}
const GEMS = { uncut_sapphire: '#2a4ad8', uncut_emerald: '#2aa84a', uncut_ruby: '#c81a2a', uncut_diamond: '#e8f4f8' };
for (const [id, c] of Object.entries(GEMS)) ICONS[id] = g => gem(g, c);

// ---- raw fish
function fish(g, { body, back, belly, len = 13, h = 5.5, spots, tail = '#6a7a88', snout = 0, eye = '#111' }) {
  const cx = 19;
  poly(g, [[cx - len + 2, 16], [cx - len - 5, 9], [cx - len - 3, 16], [cx - len - 5, 23]], tail);
  ell(g, cx, 16, len, h, body);
  clip(g, () => g.ellipse(cx, 16, len, h, 0, 0, Math.PI * 2), () => { rect(g, 0, 16 - h, 36, h * 0.8, back); rect(g, 0, 16 + h * 0.35, 36, h, belly); if (spots) for (const [x, y] of [[12, 14], [16, 17], [20, 13], [24, 16], [14, 19], [9, 16]]) ell(g, x, y, 0.9, 0.8, spots); });
  if (snout) poly(g, [[cx + len - 2, 15], [cx + len + snout, 15.5], [cx + len - 2, 17]], back);
  rect(g, cx + len - 5, 14, 2, 2, eye);
  line(g, [[cx + len - 8, 12.5], [cx + len - 7, 19]], 0.8, shade(body, -0.25));
}
Object.assign(ICONS, {
  raw_shrimps: g => {
    for (const [x, y, s] of [[12, 20, 1], [23, 14, 0.9]]) {
      g.strokeStyle = '#d88a7a'; g.lineWidth = 5 * s; g.lineCap = 'round';
      g.beginPath(); g.arc(x, y, 6 * s, Math.PI * 0.9, Math.PI * 2.3); g.stroke();
      g.strokeStyle = '#f0b0a0'; g.lineWidth = 1.5 * s; g.beginPath(); g.arc(x, y, 6.5 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      line(g, [[x - 6 * s, y + 2], [x - 10 * s, y - 4]], 0.8, '#b86a5a');
    }
  },
  raw_anchovies: g => { for (const [y, o] of [[10, 0], [17, 3], [24, -2]]) { g.save(); g.translate(o, y - 16); fish(g, { body: '#9aaab8', back: '#4a6a88', belly: '#d8e4ec', len: 9, h: 2.6, tail: '#5a7a98' }); g.restore(); } },
  raw_trout: g => fish(g, { body: '#a8a890', back: '#6a7a50', belly: '#e8d8d0', spots: '#3a3a2a', tail: '#7a8a60' }),
  raw_salmon: g => fish(g, { body: '#c8b8b8', back: '#6a7a8a', belly: '#f0c8c0', h: 6, tail: '#7a8a9a' }),
  raw_pike: g => fish(g, { body: '#7a8a48', back: '#4a5a28', belly: '#d8d8a0', len: 14, h: 4.5, spots: '#d8d070', tail: '#5a6a30', snout: 3 }),
  raw_eel: g => {
    g.strokeStyle = '#5a5240'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(4, 24); g.bezierCurveTo(12, 6, 20, 30, 31, 9); g.stroke();
    g.strokeStyle = '#8a8268'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(5, 23); g.bezierCurveTo(12, 8, 20, 28, 30, 10); g.stroke();
    rect(g, 29, 9, 2, 2, '#111');
  },
  raw_lobster: g => {
    ell(g, 18, 18, 6, 9, '#2a4a5a');
    for (let i = 0; i < 4; i++) rect(g, 13, 20 + i * 2.5, 10, 1, '#1a3040');
    poly(g, [[14, 28], [18, 31], [22, 28]], '#2a4a5a');
    for (const s of [-1, 1]) {
      line(g, [[18 + s * 4, 12], [18 + s * 10, 8]], 2, '#2a4a5a');
      ell(g, 18 + s * 12, 6, 4, 3, '#3a5a6a', s * 0.6);
      line(g, [[18 + s * 3, 10], [18 + s * 8, 1]], 0.8, '#6a8a9a');
      for (const y of [17, 21]) line(g, [[18 + s * 5, y], [18 + s * 10, y + 3]], 1, '#2a4a5a');
    }
    rect(g, 15, 11, 1.5, 1.5, '#111'); rect(g, 20, 11, 1.5, 1.5, '#111');
  },
  raw_swordfish: g => fish(g, { body: '#7a8aa8', back: '#3a4a6a', belly: '#c8d0e0', len: 11, h: 5, tail: '#3a4a6a', snout: 9 }),
  raw_shark: g => {
    fish(g, { body: '#7a8590', back: '#4a5560', belly: '#e0e4e8', len: 14, h: 6, tail: '#4a5560' });
    poly(g, [[14, 11], [19, 3], [21, 11]], '#4a5560');
    for (const x of [27, 29]) line(g, [[x, 18], [x + 1, 20]], 0.8, '#f2f2f2');
  },
});

// ---- grimy herbs: a bundle of leaves with dirt
function herb(g, leaf, dark) {
  line(g, [[18, 30], [18, 14]], 1.5, '#5a7a2a');
  for (const [x, y, r, rot] of [[11, 14, 6, -0.7], [25, 14, 6, 0.7], [14, 7, 5, -0.3], [22, 7, 5, 0.3], [18, 18, 5, 0], [12, 22, 4, -1], [24, 22, 4, 1]]) ell(g, x, y, r * 0.5, r, leaf, rot);
  for (const [x, y, rot] of [[11, 14, -0.7], [25, 14, 0.7], [14, 7, -0.3], [22, 7, 0.3]]) line(g, [[x - Math.sin(rot) * 4, y + Math.cos(rot) * 4], [x + Math.sin(rot) * 4, y - Math.cos(rot) * 4]], 0.7, dark);
  for (const [x, y] of [[12, 16], [23, 10], [17, 20], [20, 6], [26, 18], [9, 12], [15, 10]]) ell(g, x, y, 1.4, 1, '#3a2a14');
}
const HERBS = { grimy_guam: ['#4a9a3a', '#2a6a1a'], grimy_marrentill: ['#5a9a6a', '#2a6a3a'], grimy_tarromin: ['#7aa83a', '#4a7a1a'], grimy_harralander: ['#8a9a3a', '#5a6a1a'], grimy_ranarr: ['#3a8a5a', '#1a5a3a'] };
for (const [id, [l, d]] of Object.entries(HERBS)) ICONS[id] = g => herb(g, l, d);

// ---- seeds: a little pile
function seeds(g, c, hl) {
  for (const [x, y] of [[12, 23], [18, 24], [24, 23], [15, 19], [21, 19], [18, 15]]) { ell(g, x, y, 3, 2.2, c, 0.4); ell(g, x - 1, y - 0.8, 1.1, 0.7, hl); }
}
const SEEDS = {
  potato_seed: ['#b8925a', '#e8c890'], onion_seed: ['#3a2a1e', '#7a6a5a'], cabbage_seed: ['#7a9a4a', '#b8d888'],
  guam_seed: ['#5a4a22', '#8ac06a'], marrentill_seed: ['#5a4a2a', '#8ab89a'], tarromin_seed: ['#6a5222', '#b8c870'],
  harralander_seed: ['#6a5a2a', '#c8c060'], ranarr_seed: ['#4a3a20', '#5ac08a'],
};
for (const [id, [c, h]] of Object.entries(SEEDS)) ICONS[id] = g => seeds(g, c, h);

Object.assign(registry.iconDrawers, ICONS);
