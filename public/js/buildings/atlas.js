// Texture atlas for the generic building generator (public/js/buildings.js).
// 512 x 1024 canvas, ~40 px per metre, NearestFilter for crisp OSRS-style pixels. Vertex colours multiply it.
// - full-width bands (u repeats along a wall, one band = one storey; transparent background, alpha-tested):
//   A: classic brick-block storey (white-framed sash windows), A2: arched small-pane windows,
//   B: modern ribbon windows, G: shop-front ground storey (4 m), ROOF: tile courses.
// - 64 x 104 px cells for the canal-house pieces (windows, doors, shop fronts, awnings, ...).
import * as THREE from 'three';

const W = 512, H = 1024;
const CELL_Y = 608, CW = 64, CH = 104;
export const BAND = { A: [0, 128], A2: [128, 256], B: [256, 384], G: [384, 544], ROOF: [544, 576] };
export const C = {
  WHITE: 0, SASH: 1, PANES: 2, PLAIN: 3, ARCH: 4, SHUT_G: 5, SHUT_R: 6, DOOR: 7,
  HATCH: 8, SHOP: 9, AWN_R: 10, AWN_G: 11, AWN_B: 12, BASEMENT: 13, GWIN: 14, OCULUS: 15,
  SIGN: 16, SHOPDOOR: 17, AWN_Y: 18,
};
// uv rect [u0, v0, u1, v1] (v0 = bottom) of a cell's content
export function cell(k) {
  const x = (k % 8) * CW + 2, y = CELL_Y + Math.floor(k / 8) * CH + 2;
  return [x / W, 1 - (y + CH - 4) / H, (x + CW - 4) / W, 1 - y / H];
}
// [v0, v1] of a band (v0 = bottom)
export function band(name) { const [y0, y1] = BAND[name]; return [1 - y1 / H + 0.5 / H, 1 - y0 / H - 0.5 / H]; }
// a texel that is pure white: plain vertex-coloured surfaces
const wc = cell(C.WHITE);
export const WHITE_UV = [(wc[0] + wc[2]) / 2, (wc[1] + wc[3]) / 2];

const GLASS = '#1d2530', GLASS2 = '#33414f', FRAME = '#f6f4ee', STONE = '#dcd6c8';

let tex = null;
export function atlasTexture() {
  if (tex) return tex;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, W, H);
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // glass with a light diagonal reflection streak
  const glass = (x, y, w, h) => {
    R(GLASS, x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = GLASS2; g.beginPath();
    g.moveTo(x + w * 0.55, y); g.lineTo(x + w * 0.8, y); g.lineTo(x + w * 0.2, y + h); g.lineTo(x - w * 0.05, y + h); g.fill();
    g.restore();
  };
  // white-framed window: rows x cols panes, optional transom
  const window = (x, y, w, h, cols, rows, fw = 5, frame = FRAME, transom = 0) => {
    R(frame, x, y, w, h);
    glass(x + fw, y + fw, w - 2 * fw, h - 2 * fw);
    const ix = x + fw, iy = y + fw, iw = w - 2 * fw, ih = h - 2 * fw;
    const bar = Math.max(2, Math.round(fw * 0.6));
    for (let i = 1; i < cols; i++) R(frame, Math.round(ix + iw * i / cols - bar / 2), iy, bar, ih);
    for (let i = 1; i < rows; i++) R(frame, ix, Math.round(iy + ih * i / rows - bar / 2), iw, bar);
    if (transom) R(frame, ix, Math.round(iy + ih * transom - 2), iw, 4);
  };

  // ---- band A: classic block storey, 4 bays of 128 px (3.2 m)
  for (let b = 0; b < 4; b++) {
    const x = b * 128, y = BAND.A[0];
    R(STONE, x + 34, y + 8, 60, 7); // lintel
    window(x + 38, y + 15, 52, 82, 2, 1, 5, FRAME, 0.32);
    R(STONE, x + 33, y + 97, 62, 6); // sill
  }
  // ---- band A2: arched small-pane windows with keystone
  for (let b = 0; b < 4; b++) {
    const x = b * 128 + 38, y = BAND.A2[0] + 12, w = 52, h = 86;
    g.save(); g.beginPath(); g.moveTo(x - 4, y + h); g.lineTo(x - 4, y + 26); g.arc(x + w / 2, y + 26, w / 2 + 4, Math.PI, 0); g.lineTo(x + w + 4, y + h); g.closePath(); g.clip();
    R(STONE, x - 4, y - 6, w + 8, h + 6);
    g.restore();
    g.save(); g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + 26); g.arc(x + w / 2, y + 26, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip();
    window(x, y, w, h, 3, 4, 5);
    g.restore();
    R('#cfc6b3', x + w / 2 - 4, y - 6, 8, 10); // keystone
    R(STONE, x - 5, y + h, w + 10, 6);
  }
  // ---- band B: modern ribbon windows with dark mullions
  {
    const y = BAND.B[0];
    R('#45494d', 0, y + 22, W, 76);
    for (let x = 0; x < W; x += 64) glass(x + 4, y + 26, 56, 68);
    R('#8a8f94', 0, y + 98, W, 4); // sill line
  }
  // ---- band G: shop-front ground storey (160 px = 4 m), frames white (tinted per building)
  for (let b = 0; b < 4; b++) {
    const x = b * 128, y = BAND.G[0];
    R(FRAME, x + 4, y + 10, 120, 150);
    R('#d8d8d8', x + 8, y + 14, 112, 24); // fascia (sign band)
    for (let k = 0; k < 5; k++) R('#9a9a9a', x + 22 + k * 18, y + 22, 10, 8); // "letters"
    glass(x + 10, y + 44, 108, 98);
    R(FRAME, x + 62, y + 44, 4, 98);
    R('#bdbdbd', x + 8, y + 142, 112, 18); // kick panel
  }
  // ---- roof tiles: courses every 4 px, staggered joints
  {
    const y0 = BAND.ROOF[0];
    R('#ffffff', 0, y0, W, 32);
    for (let r = 0; r < 8; r++) {
      R('#a9a9a9', 0, y0 + r * 4 + 3, W, 1);
      for (let x = (r % 2) * 4; x < W; x += 8) R('#cdcdcd', x, y0 + r * 4, 1, 3);
    }
  }

  // ---- cells
  const at = k => [(k % 8) * CW + 2, CELL_Y + Math.floor(k / 8) * CH + 2, CW - 4, CH - 4];
  const cellDo = (k, fn) => { const [x, y, w, h] = at(k); g.save(); fn(x, y, w, h); g.restore(); };
  cellDo(C.WHITE, (x, y, w, h) => R('#ffffff', x - 2, y - 2, w + 4, h + 4));
  cellDo(C.SASH, (x, y, w, h) => { window(x, y, w, h - 6, 2, 1, 6, FRAME, 0.34); R(STONE, x, y + h - 6, w, 6); });
  cellDo(C.PANES, (x, y, w, h) => { window(x, y, w, h - 6, 3, 4, 6, FRAME); R(FRAME, x, Math.round(y + (h - 6) / 2 - 2), w, 5); R(STONE, x, y + h - 6, w, 6); });
  cellDo(C.PLAIN, (x, y, w, h) => { window(x, y, w, h - 6, 1, 2, 6, FRAME); R(STONE, x, y + h - 6, w, 6); });
  cellDo(C.ARCH, (x, y, w, h) => {
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip();
    window(x, y, w, h - 6, 2, 3, 6, FRAME); R(STONE, x, y + h - 6, w, 6);
  });
  const shutters = (k, paint) => cellDo(k, (x, y, w, h) => {
    const sw = Math.round(w / 4);
    window(x + sw, y, w - 2 * sw, h - 6, 2, 2, 4, FRAME);
    for (const sx of [x, x + w - sw]) paint(sx, y, sw, h - 6);
    R(STONE, x, y + h - 6, w, 6);
  });
  shutters(C.SHUT_G, (x, y, w, h) => { R('#24452f', x, y, w, h); for (let yy = y + 3; yy < y + h; yy += 7) R('#2f5a3d', x + 2, yy, w - 4, 3); });
  shutters(C.SHUT_R, (x, y, w, h) => { // red/white hourglass shutters with a green border
    R('#1f4a30', x, y, w, h);
    for (const [y0, y1] of [[y + 2, y + h / 2 - 1], [y + h / 2 + 1, y + h - 2]]) {
      R('#efe9de', x + 2, y0, w - 4, y1 - y0);
      g.fillStyle = '#a3221c'; g.beginPath();
      g.moveTo(x + 2, y0); g.lineTo(x + w - 2, y0); g.lineTo(x + w / 2, (y0 + y1) / 2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x + 2, y1); g.lineTo(x + w - 2, y1); g.lineTo(x + w / 2, (y0 + y1) / 2); g.closePath(); g.fill();
    }
  });
  cellDo(C.DOOR, (x, y, w, h) => { // tinted door: fanlight on top, two raised panels
    R('#e9e9e9', x, y, w, h);
    R('#202830', x + 4, y + 4, w - 8, 22);
    g.strokeStyle = '#e9e9e9'; g.lineWidth = 3;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + w / 2, y + 26); g.lineTo(x + 4 + (w - 8) * i / 4, y + 4); g.stroke(); }
    R('#bdbdbd', x, y + 26, w, 4);
    for (const [px, py, pw, ph] of [[8, 36, 20, 30], [w - 28, 36, 20, 30], [8, 72, 20, 22], [w - 28, 72, 20, 22]]) { R('#b5b5b5', x + px, y + py, pw, ph); R('#d6d6d6', x + px + 3, y + py + 3, pw - 6, ph - 6); }
    R('#f0d070', x + w - 14, y + 66, 4, 4); // knob
  });
  cellDo(C.SHOPDOOR, (x, y, w, h) => { R('#e9e9e9', x, y, w, h); glass(x + 7, y + 7, w - 14, h - 34); R('#c8c8c8', x + 7, y + h - 24, w - 14, 17); });
  cellDo(C.HATCH, (x, y, w, h) => { // wooden hoist doors
    R('#d9d9d9', x, y, w, h);
    for (let xx = x + 6; xx < x + w; xx += 8) R('#b4b4b4', xx, y, 1, h);
    R('#7a7a7a', x + w / 2 - 1, y, 2, h);
    R('#a0a0a0', x, y + h * 0.3, w, 3); R('#a0a0a0', x, y + h * 0.7, w, 3);
  });
  cellDo(C.SHOP, (x, y, w, h) => { // tinted wooden shop front frame
    R('#eeeeee', x, y, w, h);
    for (let i = 0; i < 3; i++) glass(x + 5 + i * (w - 10) / 3 + 1, y + 5, (w - 10) / 3 - 2, 16);
    glass(x + 5, y + 25, w - 10, h - 45);
    R('#c4c4c4', x + 5, y + h - 16, w - 10, 11);
  });
  const awning = (k, col) => cellDo(k, (x, y, w, h) => {
    for (let i = 0; i < 6; i++) R(i % 2 ? '#f4f0e6' : col, x + i * w / 6, y, Math.ceil(w / 6), h - 10);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f4f0e6' : col; g.beginPath(); g.moveTo(x + i * w / 6, y + h - 10); g.lineTo(x + (i + 1) * w / 6, y + h - 10); g.lineTo(x + (i + 0.5) * w / 6, y + h); g.fill(); }
  });
  awning(C.AWN_R, '#b3261e'); awning(C.AWN_G, '#2f6b3a'); awning(C.AWN_B, '#24497a'); awning(C.AWN_Y, '#d9a21b');
  cellDo(C.BASEMENT, (x, y, w, h) => { R('#b9b4aa', x, y, w, h); glass(x + 5, y + 5, w - 10, h - 10); for (let i = 1; i < 5; i++) R('#2a2a2a', x + i * w / 5 - 1, y + 5, 3, h - 10); });
  cellDo(C.GWIN, (x, y, w, h) => window(x, y, w, h, 2, 2, 6, FRAME));
  cellDo(C.OCULUS, (x, y, w, h) => {
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
    g.fillStyle = STONE; g.beginPath(); g.ellipse(cx, cy, w / 2, h / 2, 0, 0, 7); g.fill();
    g.fillStyle = FRAME; g.beginPath(); g.ellipse(cx, cy, w / 2 - 5, h / 2 - 5, 0, 0, 7); g.fill();
    g.fillStyle = GLASS; g.beginPath(); g.ellipse(cx, cy, w / 2 - 10, h / 2 - 10, 0, 0, 7); g.fill();
    R(FRAME, cx - 2, y + 8, 4, h - 16); R(FRAME, x + 8, cy - 2, w - 16, 4);
    void r;
  });
  cellDo(C.SIGN, (x, y, w, h) => { // sign board, tinted; dark letters
    R('#f0f0f0', x, y, w, h); R('#c8c8c8', x + 3, y + 3, w - 6, h - 6);
    for (let i = 0; i < 4; i++) R('#2a2a2a', x + 8 + i * 12, y + h * 0.3, 8, h * 0.4);
  });

  tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}
