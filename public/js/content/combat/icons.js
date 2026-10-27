// 36x32 pixel-art inventory icons for the combat pack (the engine adds the outline and drop shadow).
import { registry } from '../../registry.js';

const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); };
const hole = (g, x, y, rx, ry) => { g.globalCompositeOperation = 'destination-out'; ell(g, x, y, rx, ry, '#000'); g.globalCompositeOperation = 'source-over'; };
const gear = (g, x, y, r, c, inner) => {
  const pts = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r : r * 0.75; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  poly(g, pts, c);
  if (inner) ell(g, x, y, r * 0.35, r * 0.35, inner); else hole(g, x, y, r * 0.35, r * 0.35);
};

// graceful pieces share one palette
const GR = '#3f8f7a', GD = '#2f6f5e', GL = '#6fc0a8';
// generic weapon blade from bottom-left to top-right
const blade = (g, col, hl, w = 3, len = 22) => { line(g, [[6, 27], [6 + len * 0.7, 27 - len * 0.7]], w, col); line(g, [[7, 25], [5 + len * 0.66, 26 - len * 0.7]], 1, hl); };

Object.assign(registry.iconDrawers, {
  mark_of_grace: g => { ell(g, 18, 16, 11, 11, '#d8a020'); ell(g, 18, 16, 8, 8, '#f2d050'); poly(g, [[18, 8], [21, 15], [28, 16], [21, 18], [18, 25], [15, 18], [8, 16], [15, 15]], '#ffffff'); ell(g, 14, 12, 2, 1.5, '#fff8c0'); },
  graceful_hood: g => { poly(g, [[8, 28], [9, 12], [14, 5], [22, 5], [27, 12], [28, 28], [22, 26], [14, 26]], GR); poly(g, [[12, 26], [12, 14], [18, 9], [24, 14], [24, 26]], '#1a2a24'); rect(g, 13, 5, 10, 2, GL); },
  graceful_cape: g => { poly(g, [[11, 4], [25, 4], [31, 29], [5, 29]], GR); poly(g, [[18, 4], [25, 4], [31, 29], [18, 29]], GD); rect(g, 11, 4, 14, 3, GL); },
  graceful_top: g => { poly(g, [[10, 4], [26, 4], [33, 10], [30, 18], [27, 15], [27, 29], [9, 29], [9, 15], [6, 18], [3, 10]], GR); rect(g, 17, 5, 2, 24, GD); poly(g, [[14, 4], [22, 4], [18, 9]], '#1a2a24'); },
  graceful_legs: g => { poly(g, [[10, 3], [26, 3], [28, 29], [20, 29], [18, 11], [16, 29], [8, 29]], GD); rect(g, 10, 3, 16, 3, GL); line(g, [[12, 8], [11, 27]], 1, GR); line(g, [[24, 8], [25, 27]], 1, GR); },
  graceful_boots: g => { poly(g, [[6, 8], [14, 8], [14, 20], [20, 22], [20, 27], [5, 27]], '#e8efe6'); poly(g, [[18, 6], [26, 6], [26, 18], [32, 20], [32, 25], [17, 25]], '#d8e2d6'); rect(g, 5, 25, 15, 2, GR); rect(g, 17, 23, 15, 2, GR); },
  coin_pouch: g => { poly(g, [[12, 10], [24, 10], [30, 22], [26, 29], [10, 29], [6, 22]], '#8a6a3a'); poly(g, [[13, 6], [23, 6], [21, 11], [15, 11]], '#a8844a'); rect(g, 13, 10, 10, 2, '#d8b040'); ell(g, 18, 20, 4, 3, '#f2c83a'); ell(g, 17, 19, 1.5, 1, '#fff2a0'); },
  market_silk: g => { poly(g, [[5, 12], [27, 6], [31, 20], [9, 26]], '#d82060'); poly(g, [[5, 12], [27, 6], [28, 10], [6, 16]], '#f2c020'); poly(g, [[7, 20], [29, 14], [30, 17], [8, 23]], '#2060d8'); ell(g, 7, 19, 3, 7, '#a81850'); },
  shears: g => { line(g, [[17, 16], [30, 4]], 3, '#c8ccd0'); line(g, [[17, 16], [32, 8]], 3, '#a8acb0'); ell(g, 11, 22, 5, 4, '#c82020'); ell(g, 18, 25, 4, 5, '#c82020'); hole(g, 11, 22, 2.5, 2); hole(g, 18, 25, 2, 2.5); },

  golden_acorn: g => { ell(g, 18, 20, 8, 9, '#e0b020'); ell(g, 15, 17, 2.5, 3, '#fff0a0'); poly(g, [[9, 13], [27, 13], [25, 8], [11, 8]], '#8a6a1a'); rect(g, 17, 3, 2, 6, '#5a4010'); },
  boar_tusk: g => { poly(g, [[6, 28], [10, 24], [18, 14], [26, 6], [30, 4], [24, 12], [14, 24], [9, 29]], '#f2ead0'); line(g, [[10, 26], [25, 9]], 1, '#c8c0a0'); rect(g, 4, 26, 6, 4, '#c8b890'); },
  fox_fur: g => { poly(g, [[4, 14], [12, 8], [26, 7], [33, 12], [30, 22], [20, 26], [8, 24]], '#d0601a'); poly(g, [[26, 7], [33, 12], [30, 18], [25, 14]], '#f4ece0'); poly(g, [[8, 24], [14, 19], [20, 26]], '#a8481a'); },
  bosrover_bandana: g => { poly(g, [[5, 18], [9, 10], [18, 7], [27, 10], [31, 18], [18, 21]], '#8a1c1c'); for (const [x, y] of [[12, 13], [18, 11], [24, 13], [15, 17], [22, 17]]) ell(g, x, y, 1.3, 1.3, '#f2f2f2'); poly(g, [[28, 16], [34, 24], [31, 26], [26, 19]], '#8a1c1c'); },

  scrap_metal: g => { poly(g, [[5, 20], [16, 14], [22, 22], [12, 28]], '#8a5a2e'); poly(g, [[14, 10], [28, 6], [31, 14], [20, 18]], '#6a6e72'); poly(g, [[20, 20], [30, 18], [32, 26], [22, 28]], '#9a6a3a'); ell(g, 24, 10, 1.5, 1.5, '#3a3a3a'); },
  brass_gear: g => { gear(g, 18, 16, 12, '#c89a3a'); ell(g, 14, 11, 3, 2, '#f2d070'); },
  gas_essence: g => { ell(g, 18, 17, 10, 10, '#7ac04a'); ell(g, 18, 17, 7, 7, '#b8f08a'); ell(g, 14, 13, 3, 2, '#f0fff0'); ell(g, 21, 20, 2, 1.5, '#5a9a3a'); },
  steam_core: g => { ell(g, 18, 16, 11, 11, '#4a4e54'); ell(g, 18, 16, 7, 7, '#ff8a1a'); ell(g, 18, 16, 3.5, 3.5, '#ffe060'); for (const a of [0, 1.57, 3.14, 4.71]) rect(g, 18 + Math.cos(a) * 9.5 - 1.5, 16 + Math.sin(a) * 9.5 - 1.5, 3, 3, '#8a8e94'); },
  steamforged_helm: g => { poly(g, [[8, 28], [7, 13], [12, 6], [24, 6], [29, 13], [28, 28]], '#b08a3a'); poly(g, [[18, 6], [24, 6], [29, 13], [28, 28], [18, 28]], '#8a6a2a'); rect(g, 10, 15, 16, 3, '#1a1a1a'); rect(g, 17, 18, 2, 7, '#1a1a1a'); gear(g, 26, 9, 4, '#d8b050', '#8a6a2a'); },
  gashouder_maul: g => { line(g, [[6, 29], [20, 13]], 3, '#5a3a1a'); poly(g, [[14, 9], [24, 1], [33, 10], [24, 18]], '#6d6152'); poly(g, [[24, 1], [33, 10], [29, 13], [21, 5]], '#8a7e6e'); for (const [x, y] of [[20, 9], [24, 13], [27, 6]]) ell(g, x, y, 1.2, 1.2, '#c89a3a'); },
  gasbaby: g => { ell(g, 18, 18, 11, 9, '#8ad05a'); ell(g, 12, 13, 5, 5, '#a8e07a'); ell(g, 24, 13, 5, 5, '#a8e07a'); ell(g, 14, 18, 1.5, 2, '#1a2a10'); ell(g, 22, 18, 1.5, 2, '#1a2a10'); line(g, [[15, 23], [18, 25], [21, 23]], 1.2, '#1a2a10'); },

  ancient_shard: g => { poly(g, [[12, 28], [8, 14], [16, 3], [24, 8], [28, 22], [20, 29]], '#6a5aa8'); poly(g, [[16, 3], [24, 8], [20, 18], [14, 14]], '#9a8ad8'); line(g, [[14, 14], [20, 18], [20, 29]], 1, '#4a3a88'); },
  revenant_ether: g => { poly(g, [[18, 3], [27, 16], [24, 26], [12, 26], [9, 16]], '#3ad8b0'); poly(g, [[18, 7], [23, 16], [18, 23], [13, 16]], '#a8fff0'); ell(g, 16, 12, 1.5, 2, '#ffffff'); },
  ancient_emblem: g => { ell(g, 18, 16, 12, 12, '#c9a227'); ell(g, 18, 16, 9, 9, '#5a4a2a'); poly(g, [[18, 8], [25, 16], [18, 24], [11, 16]], '#c9a227'); ell(g, 18, 16, 2.5, 2.5, '#d82020'); },
  revenant_blade: g => { line(g, [[5, 29], [10, 24]], 3, '#2a4a44'); line(g, [[7, 21], [14, 28]], 2.5, '#4a8a80'); poly(g, [[10, 22], [14, 26], [30, 6], [31, 2], [27, 4]], '#7ac8b8'); line(g, [[13, 23], [28, 5]], 1, '#d8fff8'); },
  leviathan_scale: g => { poly(g, [[18, 3], [30, 12], [26, 27], [10, 27], [6, 12]], '#2a8a8a'); poly(g, [[18, 7], [26, 13], [18, 22]], '#5ad0c8'); line(g, [[18, 6], [18, 25]], 1, '#1a5a5a'); },
  tidal_trident: g => { line(g, [[6, 29], [24, 9]], 2.5, '#3a5a6a'); line(g, [[19, 8], [28, 16]], 2.5, '#2ad0d0'); for (const [x, y] of [[19, 8], [24, 4], [28, 16], [29, 11]]) line(g, [[x, y], [x + 3, y - 4]], 2, '#2ad0d0'); line(g, [[24, 9], [30, 3]], 2.5, '#2ad0d0'); ell(g, 24, 10, 2.5, 2.5, '#a8ffff'); },
  gaaspje: g => { ell(g, 18, 22, 12, 6, '#2e5a86'); poly(g, [[8, 22], [12, 12], [18, 8], [22, 10], [22, 22]], '#2a6a6a'); ell(g, 20, 10, 5, 4, '#2a6a6a'); ell(g, 21, 9, 1.5, 1.5, '#ffe060'); poly(g, [[14, 12], [10, 6], [16, 10]], '#3a8a8a'); },
  colossus_crusher: g => { line(g, [[5, 29], [20, 14]], 3, '#6a3a1e'); poly(g, [[13, 8], [26, 1], [34, 12], [22, 20]], '#a49e90'); poly(g, [[22, 9], [25, 7], [27, 12], [24, 14]], '#ff6a10'); line(g, [[17, 13], [30, 6]], 1, '#7a766c'); },
  little_colossus: g => { rect(g, 11, 6, 14, 12, '#a8a498'); rect(g, 13, 9, 3, 2, '#ff8a20'); rect(g, 20, 9, 3, 2, '#ff8a20'); rect(g, 7, 12, 4, 10, '#8a867a'); rect(g, 25, 12, 4, 10, '#8a867a'); rect(g, 12, 18, 5, 11, '#7a766c'); rect(g, 19, 18, 5, 11, '#7a766c'); },
  arena_champion_cape: g => { poly(g, [[11, 4], [25, 4], [31, 29], [5, 29]], '#c9a227'); rect(g, 15, 4, 6, 25, '#c81e2e'); rect(g, 11, 4, 14, 3, '#f2e080'); ell(g, 18, 16, 3, 3, '#f2f2f2'); },
});
