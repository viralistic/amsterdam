// Pixel-art inventory icons (36x32) for the economy pack, plus its tab icons. Outline and shadow are added by the engine.
import { registry } from '../../registry.js';

const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const ring = (g, x, y, r, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
const cross = (g, x, y, s, c) => { line(g, [[x - s, y - s], [x + s, y + s]], 1.6, c); line(g, [[x + s, y - s], [x - s, y + s]], 1.6, c); };

function bike(g) {
  ring(g, 9, 22, 6, 2, '#1a1a1a'); ring(g, 27, 22, 6, 2, '#1a1a1a');
  ell(g, 9, 22, 1.2, 1.2, '#8a8a8a'); ell(g, 27, 22, 1.2, 1.2, '#8a8a8a');
  line(g, [[9, 22], [16, 22], [24, 12], [13, 12], [9, 22]], 2.4, '#003082');
  line(g, [[16, 22], [12, 9]], 2.2, '#003082');
  line(g, [[24, 12], [27, 22]], 2.2, '#003082');
  line(g, [[23, 12], [22, 7], [26, 6]], 2, '#2a2a2a');
  rect(g, 9, 7, 6, 2, '#2a2a2a');
  poly(g, [[3, 18], [9, 14], [15, 18], [13, 18], [9, 16], [5, 18]], '#ffc917');
  poly(g, [[21, 18], [27, 14], [33, 18], [31, 18], [27, 16], [23, 18]], '#ffc917');
}

function cape(tier) {
  return g => {
    poly(g, [[11, 3], [25, 3], [32, 29], [4, 29]], '#c8102e');
    poly(g, [[18, 3], [25, 3], [32, 29], [18, 29]], '#a00c24');
    poly(g, [[15, 3], [21, 3], [22, 29], [14, 29]], '#141414');
    for (const y of [10, 17, 24]) cross(g, 18, y, 2.2, '#f4f4f4');
    if (tier >= 2) { line(g, [[11, 3], [4, 29]], 1.4, '#e0b530'); line(g, [[25, 3], [32, 29]], 1.4, '#e0b530'); line(g, [[4, 29], [32, 29]], 1.4, '#e0b530'); }
    rect(g, 11, 2, 14, 3, tier >= 2 ? '#e0b530' : '#7a0a1a');
    if (tier >= 3) { poly(g, [[13, 3], [14, -1], [16, 2], [18, -2], [20, 2], [22, -1], [23, 3]], '#f2c230'); ell(g, 18, 0, 1, 1, '#d42a2a'); }
  };
}

Object.assign(registry.iconDrawers, {
  ov_chipkaart: g => {
    poly(g, [[4, 9], [32, 7], [33, 25], [5, 27]], '#2a6fc9');
    poly(g, [[4, 21], [33, 19], [33, 25], [5, 27]], '#ffd200');
    rect(g, 8, 12, 6, 5, '#e8c35a'); rect(g, 10, 12, 1, 5, '#a8832a'); rect(g, 8, 14, 6, 1, '#a8832a');
    // "OV" in white pixels
    rect(g, 18, 11, 4, 1, '#fff'); rect(g, 18, 15, 4, 1, '#fff'); rect(g, 18, 11, 1, 5, '#fff'); rect(g, 21, 11, 1, 5, '#fff');
    rect(g, 23, 11, 1, 3, '#fff'); rect(g, 27, 11, 1, 3, '#fff'); rect(g, 24, 14, 1, 1, '#fff'); rect(g, 26, 14, 1, 1, '#fff'); rect(g, 25, 15, 1, 1, '#fff');
  },
  ov_fiets: bike,
  canal_map: g => {
    poly(g, [[3, 6], [12, 4], [22, 7], [33, 5], [33, 27], [22, 29], [12, 26], [3, 28]], '#e6d6a8');
    poly(g, [[12, 4], [22, 7], [22, 29], [12, 26]], '#d2c08e');
    g.save(); g.beginPath(); g.rect(3, 4, 30, 25); g.clip();
    for (const r of [7, 11, 15]) { g.strokeStyle = '#3a7ad8'; g.lineWidth = 1.6; g.beginPath(); g.arc(18, 6, r, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    g.restore();
    line(g, [[5, 9], [31, 9]], 2.2, '#3a7ad8');
    ell(g, 26, 22, 1.6, 1.6, '#d42a2a');
  },
  stroopwafel_tin: g => {
    rect(g, 6, 12, 24, 14, '#2a4ea8');
    ell(g, 18, 26, 12, 4, '#2a4ea8');
    rect(g, 6, 16, 24, 4, '#f2f2f2');
    for (let x = 8; x < 30; x += 4) ell(g, x, 18, 1, 1, '#2a4ea8');
    ell(g, 18, 12, 12, 4, '#e8e8f0');
    ell(g, 18, 11.5, 9, 2.6, '#c79a4a');
    line(g, [[12, 11], [24, 12]], 0.8, '#8a6020'); line(g, [[13, 13], [23, 10]], 0.8, '#8a6020');
  },
  parkeerboete: g => {
    poly(g, [[7, 3], [29, 4], [28, 30], [6, 29]], '#f4f4ee');
    poly(g, [[7, 3], [29, 4], [29, 10], [7, 9]], '#d42a2a');
    for (const y of [14, 18, 22]) line(g, [[10, y], [25, y + 0.5]], 1, '#3a3a3a');
    cross(g, 22, 26, 1.6, '#141414'); cross(g, 17, 26, 1.6, '#141414'); cross(g, 12, 26, 1.6, '#141414');
  },
  amsterdams_wapen_1: cape(1),
  amsterdams_wapen_2: cape(2),
  amsterdams_wapen_3: cape(3),
  // tab icons
  eco_clog: g => {
    poly(g, [[7, 5], [27, 4], [29, 27], [9, 28]], '#6a3a1a');
    poly(g, [[9, 6], [27, 5], [28, 25], [10, 26]], '#8a5028');
    rect(g, 13, 10, 11, 2, '#e0b530'); rect(g, 14, 15, 9, 1, '#e0b530');
    ell(g, 18, 20, 3, 3, '#e0b530'); ell(g, 18, 20, 1.5, 1.5, '#8a5028');
    line(g, [[9, 28], [28, 27]], 2, '#e8dcc0');
  },
  eco_diary: g => {
    rect(g, 8, 6, 20, 21, '#e6d6a8');
    ell(g, 8, 6, 3, 3, '#c8b078'); ell(g, 28, 27, 3, 3, '#c8b078');
    rect(g, 15, 8, 6, 17, '#141414');
    for (const y of [11, 16.5, 22]) cross(g, 18, y, 1.8, '#f4f4f4');
    rect(g, 9, 8, 6, 17, '#c8102e'); rect(g, 21, 8, 6, 17, '#c8102e');
  },
  eco_friends: g => {
    ell(g, 18, 16, 11, 11, '#f2c230');
    ell(g, 21, 13, 5, 5, '#ffe070');
    rect(g, 13, 11, 3, 4, '#141414'); rect(g, 21, 11, 3, 4, '#141414');
    g.strokeStyle = '#141414'; g.lineWidth = 2; g.beginPath(); g.arc(18, 17, 6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  },
});
