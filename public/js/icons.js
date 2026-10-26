// Original pixel-art icons in the old-school inventory style: drawn at 36x32, hard alpha, 1px black outline and a drop shadow.
const W = 36, H = 32;
const cache = new Map();

const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const clipEll = (g, x, y, rx, ry, fn) => { g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.clip(); fn(); g.restore(); };

function coin(g, x, y) {
  ell(g, x, y + 1.5, 6.5, 2.8, '#9a6c08');
  ell(g, x, y, 6.5, 2.8, '#f2c83a');
  ell(g, x - 1.5, y - 0.6, 3, 1.1, '#fff2a0');
}

// Diagonal blade from bottom-left grip to top-right point. curve bends it into a scimitar.
function blade(g, len, w, col, hl, guard, curve = 0) {
  const d = [Math.SQRT1_2, -Math.SQRT1_2], p = [Math.SQRT1_2, Math.SQRT1_2];
  const base = [11, 22];
  line(g, [[4.5, 28.5], [10, 23]], 3, '#5a3a1a');
  ell(g, 4, 29, 1.8, 1.8, guard);
  line(g, [[6.5, 19.5], [13.5, 26.5]], 2.5, guard);
  const left = [], right = [], mid = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, bend = curve * t * t;
    const c = [base[0] + d[0] * len * t - p[0] * bend, base[1] + d[1] * len * t - p[1] * bend];
    const hw = w * (t < 0.75 ? 1 : (1 - t) / 0.25);
    left.push([c[0] + p[0] * hw, c[1] + p[1] * hw]);
    right.push([c[0] - p[0] * hw, c[1] - p[1] * hw]);
    mid.push([c[0] - p[0] * hw * 0.35, c[1] - p[1] * hw * 0.35]);
  }
  poly(g, [...left, ...right.reverse()], col);
  line(g, mid.slice(0, 9), 1, hl);
}


const trousers = (g, c, dark) => { poly(g, [[9, 3], [27, 3], [29, 29], [21, 29], [18, 12], [15, 29], [7, 29]], c); poly(g, [[18, 3], [27, 3], [29, 29], [21, 29], [18, 12]], dark); rect(g, 9, 3, 18, 3, dark); };
const tee = (g, c, dark, long = false) => {
  const pts = long ? [[11, 5], [15, 7], [21, 7], [25, 5], [32, 9], [33, 27], [28, 27], [27, 15], [27, 29], [9, 29], [9, 15], [8, 27], [3, 27], [4, 9]]
    : [[11, 5], [15, 7], [21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [10, 29], [10, 14], [7, 16], [3, 10]];
  poly(g, pts, c);
  g.save(); g.beginPath(); g.rect(18, 0, 18, 32); g.clip(); poly(g, pts, dark); g.restore();
};
function bow(g, wood, long) {
  const [a, b] = long ? [[29, 3], [5, 29]] : [[27, 6], [7, 27]];
  g.strokeStyle = wood; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(4, 4, b[0], b[1]); g.stroke();
  line(g, [a, b], 1, '#e8e2d0');
  ell(g, 11, 11, 2.2, 2.2, '#4a3018');
}
function arrows(g, metal) {
  for (const o of [0, 4, 8]) {
    line(g, [[5 + o, 29], [25 + o, 9 - o * 0.2]], 1.6, '#8a5a2c');
    poly(g, [[25 + o, 9 - o * 0.2], [30 + o, 4 - o * 0.2], [27 + o, 11 - o * 0.2]], metal);
    poly(g, [[5 + o, 29], [3 + o, 25], [8 + o, 27]], '#e8e8e8');
  }
}
function rune(g, color, sym) {
  ell(g, 18, 17, 12, 11, '#6a6a6a');
  ell(g, 18, 16, 12, 11, '#9c9c9c');
  ell(g, 15, 12, 4, 2, '#c4c4c4');
  ({
    air: () => { line(g, [[12, 16], [18, 10], [24, 16], [18, 22], [14, 17]], 2, color); },
    water: () => { poly(g, [[18, 7], [24, 17], [22, 22], [14, 22], [12, 17]], color); },
    earth: () => { poly(g, [[10, 22], [16, 11], [19, 16], [21, 13], [26, 22]], color); },
    fire: () => { poly(g, [[18, 6], [24, 16], [22, 22], [14, 22], [12, 16], [15, 12], [16, 16]], color); },
    mind: () => { ell(g, 18, 16, 6, 6, color); ell(g, 20, 15, 5, 5, '#9c9c9c'); },
    chaos: () => { line(g, [[12, 9], [22, 14], [14, 18], [24, 23]], 2.5, color); },
  })[sym]();
}
function staffIcon(g, orb) {
  line(g, [[5, 30], [27, 8]], 3, '#6a4a2a');
  line(g, [[6, 28], [26, 8]], 1, '#9a7448');
  ell(g, 28, 6, 4, 4, orb);
  ell(g, 27, 5, 1.3, 1.3, '#ffffff');
}

const ICONS = {
  coins: g => { coin(g, 24, 25); coin(g, 24, 22); coin(g, 13, 26); coin(g, 13, 23); coin(g, 13, 20); coin(g, 13, 17); coin(g, 22, 16); },
  herring: g => {
    poly(g, [[8, 16], [2, 9], [4, 16], [2, 23]], '#6f8798');
    ell(g, 19, 16, 13, 5.5, '#a9bccb');
    clipEll(g, 19, 16, 13, 5.5, () => { rect(g, 4, 9, 30, 4.5, '#4c6474'); rect(g, 4, 18, 30, 4, '#dde6ec'); });
    rect(g, 26, 14, 2, 2, '#111');
    line(g, [[22, 12], [24, 19]], 1, '#6f8798');
  },
  bitterbal: g => {
    ell(g, 18, 17, 9, 9, '#7a4a1e');
    ell(g, 16, 15, 6.5, 6.5, '#a8672c');
    ell(g, 14, 13, 2.5, 2, '#d9a060');
    for (const [x, y] of [[20, 20], [13, 19], [22, 13], [17, 22], [24, 17], [11, 15]]) rect(g, x, y, 1, 1, '#4e2c10');
  },
  stroopwafel: g => {
    ell(g, 18, 19, 14, 9, '#6e4216');
    ell(g, 18, 17, 14, 9, '#c0843a');
    clipEll(g, 18, 17, 12, 7.5, () => {
      for (let x = -10; x < 40; x += 4) { line(g, [[x, 6], [x + 14, 30]], 1, '#94602a'); line(g, [[x + 14, 6], [x, 30]], 1, '#94602a'); }
    });
    ell(g, 13, 14, 4, 1.5, '#e8b46a');
  },
  poffertjes: g => {
    for (const [x, y] of [[10, 21], [24, 22], [17, 13]]) {
      ell(g, x, y + 1.5, 7, 4, '#9a5c18');
      ell(g, x, y, 7, 4, '#e2a346');
      ell(g, x, y - 0.5, 3, 1.5, '#fff4e0');
    }
  },
  gouda: g => {
    poly(g, [[4, 16], [24, 7], [33, 13]], '#f6d457');
    poly(g, [[4, 16], [33, 13], [33, 24], [4, 27]], '#e3b02a');
    poly(g, [[4, 25], [33, 22], [33, 24], [4, 27]], '#c7701c');
    for (const [x, y, r] of [[11, 20, 1.8], [19, 18, 1.4], [26, 19, 2], [15, 23, 1.2]]) ell(g, x, y, r, r * 0.8, '#b98714');
  },
  tulip: g => {
    line(g, [[18, 31], [18, 15]], 2, '#2f7a22');
    poly(g, [[18, 29], [9, 18], [12, 17], [18, 24]], '#3f9a2e');
    poly(g, [[18, 27], [27, 19], [25, 17], [18, 22]], '#3f9a2e');
    poly(g, [[10, 5], [14, 10], [18, 4], [22, 10], [26, 5], [26, 13], [22, 18], [14, 18], [10, 13]], '#d8202a');
    poly(g, [[18, 4], [22, 10], [22, 17], [18, 17]], '#a8121c');
    poly(g, [[12, 8], [14, 11], [14, 15], [12, 13]], '#ff6a5a');
  },
  bike_bell: g => {
    ell(g, 17, 23, 12, 3.5, '#76767e');
    g.save(); g.beginPath(); g.rect(0, 0, W, 22); g.clip(); ell(g, 17, 22, 10, 11, '#c3c3cb'); g.restore();
    ell(g, 13, 16, 3, 3.5, '#ffffff');
    rect(g, 27, 21, 7, 2, '#5c5c64');
    ell(g, 17, 10, 2, 2, '#8a8a92');
  },
  bronze_dagger: g => blade(g, 13, 2.2, '#b5733a', '#e8a868', '#8a5a26'),
  iron_sword: g => blade(g, 18, 2.2, '#8a8a8e', '#d0d0d4', '#5e5e62'),
  steel_longsword: g => blade(g, 22, 2.4, '#b6b6c0', '#f0f0f8', '#7a7a84'),
  mithril_scimitar: g => blade(g, 20, 2.6, '#454ca6', '#8c94ec', '#2c3070', 4),
  wooden_shield: g => {
    ell(g, 18, 16, 13.5, 13.5, '#5c5c62');
    ell(g, 18, 16, 11.5, 11.5, '#8a5a2c');
    clipEll(g, 18, 16, 11.5, 11.5, () => { for (const x of [11, 17, 23]) rect(g, x, 2, 1.5, 30, '#64401c'); rect(g, 6, 8, 24, 3, '#a87440'); });
    ell(g, 18, 16, 3, 3, '#a4a4ac');
    ell(g, 17, 15, 1, 1, '#ffffff');
  },
  iron_helm: g => {
    ell(g, 18, 14, 11, 11, '#8a8a92');
    rect(g, 7, 14, 22, 13, '#8a8a92');
    rect(g, 7, 22, 22, 5, '#62626a');
    rect(g, 10, 16, 16, 2.5, '#151515');
    rect(g, 17, 18, 2, 6, '#151515');
    ell(g, 13, 8, 3.5, 2.2, '#cfcfd8');
  },
  orange_shirt: g => {
    poly(g, [[11, 5], [15, 7], [21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [10, 29], [10, 14], [7, 16], [3, 10]], '#ff7a00');
    poly(g, [[21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [21, 29]], '#d65e00');
    ell(g, 18, 6.5, 4, 1.8, '#a84800');
  },
  leather_jacket: g => {
    poly(g, [[11, 5], [15, 7], [21, 7], [25, 5], [32, 9], [33, 27], [28, 27], [27, 15], [27, 29], [9, 29], [9, 15], [8, 27], [3, 27], [4, 9]], '#5a3820');
    poly(g, [[18, 8], [25, 5], [32, 9], [33, 27], [28, 27], [27, 15], [27, 29], [18, 29]], '#45291a');
    poly(g, [[15, 7], [18, 13], [13, 11]], '#7a5030');
    poly(g, [[21, 7], [18, 13], [23, 11]], '#7a5030');
    line(g, [[18, 13], [18, 28]], 1, '#bcbcbc');
  },
  clogs: g => {
    poly(g, [[3, 22], [6, 15], [16, 13], [25, 11], [31, 14], [33, 21], [30, 26], [6, 26]], '#e8c547');
    poly(g, [[3, 22], [33, 21], [30, 26], [6, 26]], '#b8952a');
    ell(g, 24, 13, 5.5, 2, '#7a5a10');
    ell(g, 10, 17, 3, 1.3, '#fff0a8');
  },
  ajax_cape: g => {
    poly(g, [[12, 3], [24, 3], [31, 29], [5, 29]], '#f2f2f2');
    poly(g, [[15, 3], [21, 3], [24, 29], [12, 29]], '#d2122e');
    poly(g, [[24, 3], [31, 29], [26, 29]], '#c8c8c8');
    rect(g, 11, 2, 14, 3, '#9c0c20');
  },
  kings_crown: g => {
    poly(g, [[6, 19], [6, 7], [11, 14], [14, 5], [18, 13], [22, 5], [25, 14], [30, 7], [30, 19]], '#f2c230');
    rect(g, 6, 18, 24, 8, '#d8a420');
    rect(g, 6, 24, 24, 2, '#a87a10');
    ell(g, 12, 21, 2, 2, '#d01020'); ell(g, 18, 21, 2, 2, '#2448e0'); ell(g, 24, 21, 2, 2, '#d01020');
    for (const [x, y] of [[6, 7], [14, 5], [22, 5], [30, 7]]) ell(g, x, y, 1.5, 1.5, '#fff5c0');
  },
  canal_ring: g => {
    ell(g, 18, 20, 10, 8, '#e0b028');
    g.globalCompositeOperation = 'destination-out'; ell(g, 18, 21, 6.5, 4.5, '#000'); g.globalCompositeOperation = 'source-over';
    ell(g, 18, 12, 4.5, 3.5, '#2aa8f0');
    ell(g, 17, 11, 1.5, 1, '#ffffff');
    ell(g, 12, 22, 1.5, 3, '#fff0a0');
  },
  bike_key: g => {
    ell(g, 9, 10, 6.5, 6.5, '#c9a227');
    g.globalCompositeOperation = 'destination-out'; ell(g, 9, 10, 2.5, 2.5, '#000'); g.globalCompositeOperation = 'source-over';
    line(g, [[13, 14], [29, 28]], 3, '#c9a227');
    poly(g, [[24, 24], [27, 21], [29, 23], [26, 26]], '#c9a227');
    poly(g, [[20, 21], [22, 19], [24, 21], [22, 23]], '#c9a227');
    line(g, [[14, 13], [28, 26]], 1, '#f5dc7a');
  },


  // ---- Albert Heijn
  bread: g => { ell(g, 18, 18, 14, 9, '#8a5420'); ell(g, 18, 16, 13, 8, '#c58a42'); for (const x of [11, 17, 23]) line(g, [[x - 2, 13], [x + 2, 19]], 1.2, '#8a5420'); },
  broodje_kaas: g => { ell(g, 18, 22, 13, 6, '#c08040'); poly(g, [[5, 18], [31, 17], [33, 21], [3, 22]], '#f2d040'); ell(g, 18, 15, 13, 7, '#d9a058'); ell(g, 14, 12, 4, 1.5, '#f0c890'); },
  kroket: g => { line(g, [[8, 22], [28, 12]], 9, '#8a4e1e'); line(g, [[9, 20], [27, 11]], 4, '#b8732e'); for (const [x, y] of [[12, 21], [18, 17], [24, 15], [15, 16]]) rect(g, x, y, 1, 1, '#5a3010'); },
  chocomel: g => { poly(g, [[13, 3], [23, 3], [23, 8], [26, 12], [26, 30], [10, 30], [10, 12], [13, 8]], '#6a3a1a'); rect(g, 10, 15, 16, 8, '#f2c83a'); rect(g, 14, 18, 8, 2, '#6a3a1a'); rect(g, 14, 1, 8, 3, '#c8c8c8'); },
  bucket: g => { g.strokeStyle = '#555'; g.lineWidth = 1.5; g.beginPath(); g.arc(18, 12, 10, Math.PI, 0); g.stroke(); poly(g, [[7, 11], [29, 11], [26, 29], [10, 29]], '#9a6a38'); rect(g, 7, 14, 22, 2, '#555'); rect(g, 9, 24, 18, 2, '#555'); ell(g, 18, 11, 11, 2.5, '#5a3a1a'); },
  hammer: g => { line(g, [[8, 29], [22, 11]], 3, '#8a5a2c'); poly(g, [[14, 7], [24, 2], [31, 12], [21, 17]], '#7a7a82'); poly(g, [[21, 3], [24, 2], [31, 12], [28, 13]], '#a8a8b0'); },
  tinderbox: g => { rect(g, 6, 13, 24, 14, '#7a5a3a'); rect(g, 5, 9, 26, 5, '#9a7a52'); rect(g, 16, 15, 4, 3, '#c9a227'); },

  // ---- clothing
  denim_jeans: g => trousers(g, '#3d5f94', '#2a4573'),
  black_jeans: g => trousers(g, '#2c2d34', '#1a1b20'),
  red_trousers: g => trousers(g, '#a02424', '#7a1414'),
  striped_shirt: g => { tee(g, '#f2f2f2', '#d4d4d4'); g.save(); g.beginPath(); g.moveTo(11, 5); for (const p of [[15, 7], [21, 7], [25, 5], [33, 10], [29, 16], [26, 14], [26, 29], [10, 29], [10, 14], [7, 16], [3, 10]]) g.lineTo(p[0], p[1]); g.closePath(); g.clip(); for (let y = 8; y < 30; y += 5) rect(g, 0, y, 36, 2, '#1f3f7a'); g.restore(); },
  raincoat: g => { tee(g, '#f2c80f', '#c9a40a', true); ell(g, 18, 5, 6, 4, '#c9a40a'); for (const y of [13, 18, 23]) rect(g, 17, y, 2, 2, '#3a3a3a'); },
  hoodie: g => { tee(g, '#6b6f77', '#53565d', true); ell(g, 18, 5, 6, 3.5, '#53565d'); rect(g, 12, 19, 12, 5, '#53565d'); line(g, [[16, 8], [16, 14]], 1, '#e0e0e0'); line(g, [[20, 8], [20, 14]], 1, '#e0e0e0'); },
  summer_dress: g => { poly(g, [[13, 3], [23, 3], [24, 13], [32, 29], [4, 29], [12, 13]], '#d9577e'); poly(g, [[18, 3], [23, 3], [24, 13], [32, 29], [18, 29]], '#b23d62'); rect(g, 12, 12, 12, 2, '#f2f2f2'); },
  beanie: g => { g.save(); g.beginPath(); g.rect(0, 0, 36, 22); g.clip(); ell(g, 18, 22, 13, 16, '#b23a2e'); g.restore(); rect(g, 5, 19, 26, 6, '#8a2a20'); ell(g, 18, 5, 3.5, 3.5, '#f2f2f2'); for (const x of [10, 15, 20, 25]) rect(g, x, 19, 1, 6, '#6a1a14'); },
  flat_cap: g => { g.save(); g.beginPath(); g.rect(0, 0, 36, 20); g.clip(); ell(g, 16, 20, 13, 10, '#6a5844'); g.restore(); poly(g, [[22, 17], [34, 19], [30, 23], [20, 21]], '#4a3a2a'); rect(g, 3, 19, 20, 3, '#4a3a2a'); },
  sneakers: g => { poly(g, [[4, 22], [6, 13], [14, 13], [22, 17], [32, 19], [33, 24], [4, 25]], '#f0f0f0'); rect(g, 4, 24, 29, 3, '#9a9aa2'); for (const x of [10, 13, 16]) line(g, [[x, 14], [x + 2, 17]], 1, '#3a6ad8'); },
  leather_boots: g => g.drawImage(iconCanvas('boot'), 0, 0),

  // ---- ranged
  shortbow: g => bow(g, '#8a5a2c'),
  oak_shortbow: g => bow(g, '#a9773c'),
  willow_longbow: g => bow(g, '#c39a5a', true),
  maple_shortbow: g => bow(g, '#7a3e1e'),
  bow_icon: g => bow(g, '#8a5a2c', true),
  bronze_arrow: g => arrows(g, '#b5733a'),
  iron_arrow: g => arrows(g, '#8a8a8e'),
  steel_arrow: g => arrows(g, '#c4c4cc'),
  mithril_arrow: g => arrows(g, '#4a4fb0'),
  leather_cowl: g => { ell(g, 18, 15, 11, 12, '#7a5030'); ell(g, 18, 18, 6, 7, '#2a1a10'); poly(g, [[8, 20], [28, 20], [31, 29], [5, 29]], '#6a4428'); },
  leather_vest: g => { tee(g, '#8a5a34', '#6e4628'); for (const y of [10, 15, 20, 25]) line(g, [[16, y], [20, y + 2]], 1, '#3a2010'); },

  // ---- magic
  staff: g => staffIcon(g, '#7a5a3a'),
  staff_of_air: g => staffIcon(g, '#e4f0f8'),
  staff_of_water: g => staffIcon(g, '#3a7ad8'),
  staff_of_earth: g => staffIcon(g, '#6a8a3a'),
  staff_of_fire: g => staffIcon(g, '#e05a1a'),
  wizard_hat: g => { poly(g, [[18, 2], [26, 23], [10, 23]], '#2c3a8c'); poly(g, [[18, 2], [26, 23], [19, 23]], '#1e2a6a'); ell(g, 18, 24, 15, 4, '#2c3a8c'); ell(g, 16, 14, 1.5, 1.5, '#f2d040'); ell(g, 20, 19, 1.2, 1.2, '#f2d040'); },
  wizard_robe: g => { tee(g, '#2c3a8c', '#1e2a6a', true); rect(g, 17, 7, 2, 22, '#f2d040'); },
  wizard_skirt: g => { poly(g, [[11, 3], [25, 3], [31, 29], [5, 29]], '#2c3a8c'); poly(g, [[18, 3], [25, 3], [31, 29], [18, 29]], '#1e2a6a'); rect(g, 5, 26, 26, 2, '#f2d040'); },
  air_rune: g => rune(g, '#f4f8fc', 'air'),
  water_rune: g => rune(g, '#2a6ad8', 'water'),
  earth_rune: g => rune(g, '#6a4a1a', 'earth'),
  fire_rune: g => rune(g, '#e8501a', 'fire'),
  mind_rune: g => rune(g, '#f08a2a', 'mind'),
  chaos_rune: g => rune(g, '#f2d040', 'chaos'),

  // ---- interface icons
  heart: g => { ell(g, 12, 12, 7, 7, '#d4141c'); ell(g, 24, 12, 7, 7, '#d4141c'); poly(g, [[5.5, 14], [30.5, 14], [18, 29]], '#d4141c'); ell(g, 11, 10, 2.5, 2, '#ff8a80'); },
  boot: g => { poly(g, [[10, 4], [21, 4], [21, 19], [32, 22], [32, 28], [8, 28], [9, 18]], '#7a4e26'); rect(g, 8, 25, 24, 3, '#3a2410'); rect(g, 10, 4, 11, 3, '#a87440'); },
  ghost: g => { poly(g, [[7, 28], [7, 14], [11, 6], [18, 3], [25, 6], [29, 14], [29, 28], [25, 25], [21, 29], [18, 25], [14, 29], [11, 25]], '#e8f2ff'); rect(g, 13, 12, 3, 4, '#223'); rect(g, 21, 12, 3, 4, '#223'); },
  eye: g => { ell(g, 18, 16, 15, 8, '#f4f4f4'); ell(g, 18, 16, 6, 6, '#2a8a3a'); ell(g, 18, 16, 3, 3, '#111'); ell(g, 16, 14, 1.2, 1.2, '#fff'); },
  globe: g => { ell(g, 18, 16, 13, 13, '#2e6fb8'); clipEll(g, 18, 16, 13, 13, () => { poly(g, [[6, 8], [16, 5], [18, 12], [12, 18], [6, 14]], '#4f9a3a'); poly(g, [[20, 16], [30, 14], [28, 26], [22, 28]], '#4f9a3a'); }); ell(g, 13, 10, 3, 2, '#9ccaf5'); },
  fist: g => { rect(g, 9, 9, 18, 15, '#d9a066'); for (const x of [9, 14, 19, 24]) rect(g, x, 9, 1, 8, '#9a6a3a'); rect(g, 9, 17, 18, 1, '#9a6a3a'); rect(g, 13, 24, 11, 6, '#b07a46'); poly(g, [[27, 12], [32, 15], [27, 20]], '#d9a066'); },
  kite: g => { poly(g, [[18, 2], [31, 7], [28, 20], [18, 30], [8, 20], [5, 7]], '#5a6a8a'); poly(g, [[18, 5], [28, 9], [26, 19], [18, 27]], '#3e4c6a'); line(g, [[18, 4], [18, 28]], 2, '#c8c8d0'); },
  compass: g => { ell(g, 18, 16, 13, 13, '#c9a227'); ell(g, 18, 16, 10.5, 10.5, '#f2ead0'); poly(g, [[18, 6], [21, 16], [15, 16]], '#d01020'); poly(g, [[18, 26], [21, 16], [15, 16]], '#3a3a3a'); ell(g, 18, 16, 1.5, 1.5, '#c9a227'); },
  stats: g => { rect(g, 6, 18, 6, 11, '#d8c060'); rect(g, 15, 10, 6, 19, '#d8c060'); rect(g, 24, 4, 6, 25, '#d8c060'); },
  backpack: g => { poly(g, [[9, 9], [27, 9], [29, 29], [7, 29]], '#7a4e26'); poly(g, [[12, 4], [24, 4], [24, 9], [12, 9]], '#5a3618'); rect(g, 10, 15, 16, 10, '#93602e'); rect(g, 17, 15, 2, 4, '#c9a227'); },
  platebody: g => { poly(g, [[10, 4], [26, 4], [33, 9], [31, 18], [27, 16], [27, 29], [9, 29], [9, 16], [5, 18], [3, 9]], '#8a8a92'); poly(g, [[18, 4], [26, 4], [33, 9], [31, 18], [27, 16], [27, 29], [18, 29]], '#6a6a72'); ell(g, 18, 5, 4, 2, '#3a3a3a'); },
  wrench: g => { line(g, [[9, 27], [23, 13]], 4, '#9a9aa2'); ell(g, 25, 10, 6, 6, '#9a9aa2'); g.globalCompositeOperation = 'destination-out'; poly(g, [[25, 4], [31, 10], [26, 12], [23, 9]], '#000'); g.globalCompositeOperation = 'source-over'; },
  splat: g => { poly(g, [[18, 2], [22, 9], [30, 6], [27, 14], [34, 18], [26, 21], [28, 29], [19, 25], [12, 30], [12, 22], [3, 20], [9, 14], [4, 6], [13, 8]], '#b81010'); },
  splat_miss: g => { poly(g, [[18, 2], [22, 9], [30, 6], [27, 14], [34, 18], [26, 21], [28, 29], [19, 25], [12, 30], [12, 22], [3, 20], [9, 14], [4, 6], [13, 8]], '#2a5ab8'); },
};

export function iconCanvas(id) {
  if (cache.has(id)) return cache.get(id);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  (ICONS[id] || ICONS.coins)(g);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (d[i * 4 + 3] >= 110) { solid[i] = 1; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0;
  }
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && solid[y * W + x];
  const outline = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!solid[i] && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) outline[i] = 1;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x;
    if (outline[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
    else if (!solid[i] && x > 0 && y > 0 && (solid[i - W - 1] || outline[i - W - 1])) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 32; d[i * 4 + 3] = 150; }
  }
  g.putImageData(img, 0, 0);
  c.url = c.toDataURL();
  cache.set(id, c);
  return c;
}

export const iconImg = (id, cls = 'ico') => `<img class="${cls}" src="${iconCanvas(id).url}" alt="" draggable="false">`;
