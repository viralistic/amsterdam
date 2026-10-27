// oudekerk: hand-built landmark model. Local metres, +z is the front facade (south, Oudekerksplein), y up.
// Gothic basilica: a high nave and choir with polygonal apse, a short transept, rows of side chapels with their
// own gables, little "kosterhuisjes" built between the buttresses, and the west tower: brick base, lead-clad
// octagonal stages with clock faces and balconies, open bell lanterns and a slender spire to 67 m.
import { GOLD } from './builder.js';
import { gothicKit } from './nieuwekerk.js';

const BR = '#94674a', BR2 = '#84593f', TBR = '#8b5a40', SAND = '#cfc29e', SAND2 = '#b9ab86', GLASS = '#323f50', DOOR = '#4b3020';
const ROOF = '#525a61', ROOF2 = '#4a5158', RIDGE = '#30353a';
const LEADC = '#6b7377', LEAD2 = '#5a6165', LEAD3 = '#7d8589', DARK = '#202428', DIAL = '#1f2d4c', BRONZE = '#9c7a3c';

export default function build(b, THREE) {
  const K = gothicKit(b, THREE, [BR, BR2, TBR, ROOF, ROOF2]);
  const { face, wall, buttress, fbox, ribbon, roof, fan, frust, pinnacle, ring, poly, Q, T } = K;
  const XW = -30.5, XT0 = 4, XT1 = 14, CX = 30, NW = 7, CZ = 19, TZ = 20, CHZ = 14;
  const HC = 10, GH = 5, HN = 19, HR = 31, HA = 10, HL = 13.5;
  const R = { col: ROOF, alt: ROOF2, ridge: RIDGE };
  const W = o => ({ frame: SAND, ...o });

  const plinth = (f, s0, s1) => fbox(f, s0, s1, 0, 0.18, 0, 0.8, SAND2, SAND2);
  const cornice = (f, s0, s1, y) => fbox(f, s0, s1, 0, 0.28, y - 0.4, y, SAND);

  // ---- side chapels with transverse gables along the nave (6 bays a side) ----
  const BW = (XT0 - XW) / 6;
  const housesS = [1, 2, 3, 4], housesN = [2, 3];
  for (const sg of [1, -1]) {
    const z = sg * CZ, houses = sg > 0 ? housesS : housesN;
    for (let i = 0; i < 6; i++) {
      const x0 = XW + i * BW, x1 = x0 + BW, f = face(x0, z, x1, z, (x0 + x1) / 2, 0), m = BW / 2;
      const low = houses.includes(i);
      const wins = [W({ s: m, w: 3.4, y0: low ? 8 : 3.6, ys: low ? 10.3 : 8, lights: i % 2 ? 3 : 2 })];
      if (sg > 0 && i === 0) wins[0] = W({ s: m, w: 3.4, y0: 6.6, ys: 9.6, lights: 2 });
      if (sg > 0 && i === 0) wins.push({ s: m, w: 2.2, y0: 0, ys: 2.6, lights: 0, glass: DOOR, dp: 0.7, band: 0.45, sill: false });
      wall(f, [[0, 0], [BW, 0], [BW, HC], [m, HC + GH], [0, HC]], BR, wins);
      ribbon(f, [[-0.15, HC - 0.1], [m, HC + GH + 0.25], [BW + 0.15, HC - 0.1]], 0.45, 0.25, SAND);
      const ap = f.P(m, 0, 0.15); pinnacle(ap[0], ap[2], HC + GH - 0.2, 0.2, 1.8, SAND, SAND);
      roof('z', sg > 0 ? NW : -CZ, sg > 0 ? CZ : -NW, x0, x1, HC, GH, { ...R, ov: 0.3, v0: sg < 0 ? 0.35 : 0, v1: sg > 0 ? 0.35 : 0, bands: 3 });
    }
    const fs = face(XW, z, XT0, z);
    plinth(fs, 0, XT0 - XW);
    for (let i = 1; i < 6; i++) {
      buttress(fs, i * BW, 0.9, [[4.5, 1.0], [HC - 0.6, 0.65]], BR2);
      const p = fs.P(i * BW, 0, 0.35); pinnacle(p[0], p[2], HC - 0.2, 0.3, 3.0, SAND, SAND);
    }
    buttress(fs, 0.5, 1.0, [[4.5, 1.0], [HC - 0.6, 0.65]], BR2);
    // west end of the chapel rows
    const fw = face(XW, sg * NW, XW, z, 0, 0);
    wall(fw, [[0, 0], [CZ - NW, 0], [CZ - NW, HC], [0, HC]], BR, [W({ s: 6, w: 3.0, y0: 3.6, ys: 7.4, lights: 2 })]);
    plinth(fw, 0, CZ - NW); cornice(fw, 0, CZ - NW, HC);
    // nave clerestory above the chapel roofs
    const fn = face(XW, sg * NW, XT0, sg * NW);
    wall(fn, [[0, HC], [XT0 - XW, HC], [XT0 - XW, HN], [0, HN]], BR, [0, 1, 2, 3, 4, 5].map(i => W({ s: BW * (i + 0.5), w: 2.2, y0: 15.7, ys: 17, lights: 2, band: 0.2 })));
    cornice(fn, 0, XT0 - XW, HN);

    // ---- choir: lean-to chapels and clerestory ----
    const fc = face(XT1, sg * CHZ, CX, sg * CHZ), L = CX - XT1;
    wall(fc, [[0, 0], [L, 0], [L, HA], [0, HA]], BR, [1, 3, 5].map(k => W({ s: L * k / 6, w: 3.0, y0: 3.6, ys: 7, lights: 2 })));
    plinth(fc, 0, L); cornice(fc, 0, L, HA);
    for (const s of [L / 3, L * 2 / 3]) buttress(fc, s, 0.9, [[4.5, 1.0], [HA - 0.6, 0.65]], BR2);
    const fe = face(CX, sg * NW, CX, sg * CHZ, 0, 0);
    wall(fe, [[0, 0], [CHZ - NW, 0], [CHZ - NW, HA], [0, HL]], BR, [W({ s: 3.5, w: 2.4, y0: 3.6, ys: 7, lights: 2 })]);
    plinth(fe, 0, CHZ - NW);
    ribbon(fe, [[CHZ - NW + 0.2, HA], [-0.1, HL]], 0.4, 0.25, SAND);
    const sl = (HL - HA) / (CHZ - NW), eo = 0.45;
    Q([XT1, HA - eo * sl, sg * (CHZ + eo)], [CX + 0.3, HA - eo * sl, sg * (CHZ + eo)], [CX + 0.3, HL + 0.1, sg * NW], [XT1, HL + 0.1, sg * NW], ROOF);
    Q([XT1, HA - eo * sl, sg * (CHZ + eo)], [CX + 0.3, HA - eo * sl, sg * (CHZ + eo)], [CX + 0.3, HA - eo * sl - 0.3, sg * (CHZ + eo)], [XT1, HA - eo * sl - 0.3, sg * (CHZ + eo)], RIDGE);
    const fq = face(XT1, sg * NW, CX, sg * NW);
    wall(fq, [[0, HL - 1], [L, HL - 1], [L, HN], [0, HN]], BR, [1, 3, 5].map(k => W({ s: L * k / 6, w: 2.4, y0: 14.6, ys: 16.6, lights: 2, band: 0.2 })));
    cornice(fq, 0, L, HN);

    // ---- transept arms ----
    const fg = face(XT0, sg * TZ, XT1, sg * TZ, 9, 0);
    const twins = [W({ s: 5, w: 6, y0: 6.2, ys: 13.4, lights: 4, dp: 0.65, band: 0.35 })];
    if (sg > 0) twins.push({ s: 5, w: 2.6, y0: 0, ys: 2.9, lights: 0, glass: DOOR, dp: 0.8, band: 0.5, sill: false });
    wall(fg, [[0, 0], [10, 0], [10, HN], [5, HR], [0, HN]], BR, twins, [[5, 23.6, 1.35]]);
    plinth(fg, 0, 10); cornice(fg, 0, 1.6, HN); cornice(fg, 8.4, 10, HN);
    ribbon(fg, [[-0.1, HN], [5, HR + 0.3], [10.1, HN]], 0.6, 0.3, SAND);
    const ap = fg.P(5, HR, 0.15); pinnacle(ap[0], ap[2], HR - 0.4, 0.26, 3, SAND, GOLD);
    for (const s of [0.55, 9.45]) {
      buttress(fg, s, 1.1, [[6, 0.95], [HN - 1.5, 0.65]], BR2);
      const p = fg.P(s, 0, 0.3); pinnacle(p[0], p[2], HN - 0.4, 0.38, 4);
    }
    for (const [x, hi] of [[XT0, 1], [XT1, 0]]) {
      const ft = face(x, sg * NW, x, sg * TZ, 9, 0);
      const tw = hi ? [W({ s: 6.5, w: 2.6, y0: 12, ys: 15.4, lights: 2, band: 0.22 })]
        : [W({ s: 10, w: 2.6, y0: 3.6, ys: 9, lights: 2 }), W({ s: 3.5, w: 2.4, y0: 14.6, ys: 16.6, lights: 2, band: 0.2 })];
      wall(ft, [[0, 0], [13, 0], [13, HN], [0, HN]], BR, tw);
      cornice(ft, 0, 13, HN); plinth(ft, 12, 13);
      buttress(ft, 12.45, 1.1, [[6, 0.95], [HN - 1.5, 0.65]], BR2);
    }
  }
  roof('z', -TZ, TZ, XT0, XT1, HN, HR - HN, { ...R, ov: 0.5 });

  // ---- apse: 5/8 polygon around (CX, 0) with tall windows, buttresses and a fan roof ----
  const angs = [90, 45, 0, -45, -90].map(a => a * Math.PI / 180), pv = (r, a) => [CX + Math.cos(a) * r, Math.sin(a) * r];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = pv(NW, angs[i]), [bx, bz] = pv(NW, angs[i + 1]), f = face(ax, az, bx, bz, CX, 0);
    wall(f, [[0, 0], [f.len, 0], [f.len, HN], [0, HN]], BR, [W({ s: f.len / 2, w: 2.5, y0: 4.2, ys: 14.2, lights: 2, band: 0.25 })]);
    plinth(f, 0, f.len); cornice(f, 0, f.len, HN);
    fbox(f, 0, f.len, 0, 0.12, 3.0, 3.3, SAND);
  }
  for (let i = 1; i < 4; i++) {
    const a = angs[i], tx = -Math.sin(a), tz = Math.cos(a), [vx, vz] = pv(NW, a);
    const f = face(vx - tx * 0.55, vz - tz * 0.55, vx + tx * 0.55, vz + tz * 0.55, CX, 0);
    buttress(f, 0.55, 1.1, [[7, 1.4], [13, 1.05], [HN - 1.2, 0.7]], BR2);
    const p = f.P(0.55, 0, 0.4); pinnacle(p[0], p[2], HN - 0.3, 0.36, 4.2);
  }
  const ov = 0.55, sl = (HR - HN) / NW, er = NW + ov, ey = HN - ov * sl;
  roof('x', XW, CX, -NW, NW, HN, HR - HN, { ...R, ov, v0: 0.3, v1: 0 });
  const rp = angs.map((a, i) => { const r = i === 0 || i === 4 ? er : er / Math.cos(Math.PI / 8); return [CX + Math.cos(a) * r, ey, Math.sin(a) * r]; });
  fan(rp, [CX, HR, 0], ROOF, ROOF2);
  for (let i = 0; i < 4; i++) Q(rp[i], rp[i + 1], [rp[i + 1][0], ey - 0.35, rp[i + 1][2]], [rp[i][0], ey - 0.35, rp[i][2]], RIDGE);
  frust(CX, 0, 0.18, 0, HR, HR + 2, 4, GOLD);
  for (const sg of [1, -1]) for (const x of [-24, -13, -2, 19, 25]) K.dormer(x, sg, NW, HN, sl, ROOF2, RIDGE, GLASS);
  // nave west gable (mostly behind the tower)
  { const f = face(XW, NW, XW, -NW); poly(f, [[0, HC - 1], [14, HC - 1], [14, HN], [7, HR], [0, HN]], 0, BR); ribbon(f, [[-0.1, HN], [7, HR + 0.3], [14.1, HN]], 0.6, 0.3, SAND); }
  // small roof turret over the crossing
  {
    const x = 9, y = HR - 1.5;
    frust(x, 0, 0.9, 0.9, y, HR + 2.2, 6, LEADC, false);
    frust(x, 0, 1.15, 1.15, HR + 2.2, HR + 2.45, 6, LEAD2);
    frust(x, 0, 1.05, 0, HR + 2.45, HR + 7, 6, LEADC);
    frust(x, 0, 0.18, 0.18, HR + 7.1, HR + 7.5, 4, GOLD);
  }

  // ---- kosterhuisjes: small houses tucked between the chapel buttresses ----
  const HB = ['#7b4630', '#8e5a3e', '#6e4636', '#835035'], HRF = ['#7c3f2c', '#4f575e', '#8a4a32', '#5b4038'];
  const house = (x0, x1, sg, h, k, style) => {
    const z0 = sg * (CZ - 0.05), z1 = sg * 22.8, w = x1 - x0, xm = (x0 + x1) / 2, gh = style === 'step' ? 2.2 : 1.7;
    const fr = face(x0, z1, x1, z1, xm, 0);
    const top = style === 'step'
      ? [[w, h], [w * 0.8, h], [w * 0.8, h + gh * 0.5], [w * 0.62, h + gh * 0.5], [w * 0.62, h + gh], [w * 0.38, h + gh], [w * 0.38, h + gh * 0.5], [w * 0.2, h + gh * 0.5], [w * 0.2, h]]
      : [[w, h], [w / 2, h + gh]];
    poly(fr, [[0, 0], [w, 0], ...top, [0, h]], 0, HB[k]);
    for (const fs of [face(x0, z0, x0, z1, x1, sg * 21), face(x1, z0, x1, z1, x0, sg * 21)]) poly(fs, [[0, 0], [fs.len, 0], [fs.len, h], [0, h]], 0, HB[k]);
    const ye = h - 0.2, ya = h + (style === 'step' ? gh * 0.85 : gh);
    for (const s2 of [-1, 1]) Q([xm + s2 * (w / 2 + 0.2), ye, z1], [xm + s2 * (w / 2 + 0.2), ye, z0], [xm, ya, z0], [xm, ya, z1], HRF[k]);
    const wnd = (s, y, ww, hh) => { fbox(fr, s - ww / 2 - 0.12, s + ww / 2 + 0.12, 0, 0.07, y - 0.12, y + hh + 0.12, '#efe9dc'); fbox(fr, s - ww / 2, s + ww / 2, 0, 0.09, y, y + hh, GLASS); };
    wnd(w * 0.68, 1.0, 1.1, 1.3); wnd(w * 0.3, h - 2.1, 0.9, 1.2); wnd(w * 0.7, h - 2.1, 0.9, 1.2); wnd(w / 2, h + 0.25, 0.5, 0.65);
    fbox(fr, w * 0.27 - 0.5, w * 0.27 + 0.5, 0, 0.09, 0, 2.1, k % 2 ? '#2e4a3c' : DOOR);
    fbox(fr, w * 0.27 - 0.6, w * 0.27 + 0.6, 0, 0.12, 2.1, 2.25, '#efe9dc');
    fbox(fr, -0.05, w + 0.05, 0, 0.16, h - 0.2, h, '#efe9dc');
    fbox(fr, -0.05, w + 0.05, 0, 0.1, 0, 0.35, '#5a4a3e');
  };
  [[1, 4.6, 0, 'gable'], [2, 5.3, 1, 'step'], [3, 4.3, 2, 'gable'], [4, 5.0, 3, 'step']].forEach(([i, h, k, st]) => house(XW + i * BW + 0.5, XW + (i + 1) * BW - 0.5, 1, h, k, st));
  [[2, 4.8, 3, 'step'], [3, 4.4, 0, 'gable']].forEach(([i, h, k, st]) => house(XW + i * BW + 0.5, XW + (i + 1) * BW - 0.5, -1, h, k, st));

  // ---- west tower ----
  const TX = -35, TH = 4.9, TB = 25;
  {
    const faces = [face(TX - TH, TH, TX - TH, -TH, TX, 0), face(TX - TH, TH, TX + TH, TH, TX, 0), face(TX - TH, -TH, TX + TH, -TH, TX, 0)];
    faces.forEach((f, i) => {
      const wins = [W({ s: TH, w: 2.3, y0: 7.6, ys: 11.6, lights: 2 }),
        { s: TH - 1.5, w: 1.4, y0: 16.6, ys: 20.6, lights: 0, glass: DARK, frame: SAND, band: 0.22 },
        { s: TH + 1.5, w: 1.4, y0: 16.6, ys: 20.6, lights: 0, glass: DARK, frame: SAND, band: 0.22 }];
      if (i === 0) wins.push({ s: TH, w: 2.6, y0: 0, ys: 3.0, lights: 0, glass: DOOR, dp: 0.9, band: 0.55, sill: false });
      wall(f, [[0, 0], [2 * TH, 0], [2 * TH, TB], [0, TB]], TBR, wins);
      for (const s of [TH - 1.5, TH + 1.5]) for (let y = 17.2; y < 20.4; y += 0.55) ribbon(f, [[s - 0.62, y], [s + 0.62, y]], 0.12, -0.3, LEAD2); // louvres
      plinth(f, 0, 2 * TH);
      for (const y of [6, 15]) fbox(f, 0, 2 * TH, 0, 0.14, y, y + 0.35, SAND);
      fbox(f, -0.3, 2 * TH + 0.3, 0, 0.45, TB - 0.7, TB, SAND);
      for (const s of [0.55, 2 * TH - 0.55]) buttress(f, s, 1.1, [[6, 1.0], [15, 0.75], [TB - 1.5, 0.45]], BR2);
      if (i === 0) ribbon(f, [[TH - 2, 4.9], [TH, 6.0], [TH + 2, 4.9]], 0.35, 0.2, SAND);
    });
    // parapet with corner pinnacles
    const sq = [[TX - TH - 0.3, -TH - 0.3], [TX + TH + 0.3, -TH - 0.3], [TX + TH + 0.3, TH + 0.3], [TX - TH - 0.3, TH + 0.3]];
    for (let i = 0; i < 4; i++) {
      const a = sq[i], c = sq[(i + 1) % 4], f = face(a[0], a[1], c[0], c[1], TX, 0);
      fbox(f, 0, f.len, -0.3, 0, TB, TB + 0.25, SAND);
      for (let s = 0.6; s < f.len - 0.4; s += 0.55) fbox(f, s - 0.09, s + 0.09, -0.2, 0, TB + 0.25, TB + 1.0, SAND2);
      fbox(f, 0, f.len, -0.3, 0, TB + 1.0, TB + 1.2, SAND);
      frust(a[0], a[1], 0.5, 0.5, TB - 1, TB + 1.8, 8, SAND2, false);
      frust(a[0], a[1], 0.6, 0.6, TB + 1.8, TB + 2.05, 8, SAND);
      frust(a[0], a[1], 0.55, 0, TB + 2.05, TB + 4.3, 8, LEADC);
      frust(a[0], a[1], 0.08, 0, TB + 4.3, TB + 4.9, 4, GOLD);
    }
    // lead roof deck behind the parapet
    Q([TX - TH, TB + 0.1, -TH], [TX + TH, TB + 0.1, -TH], [TX + TH, TB + 0.1, TH], [TX - TH, TB + 0.1, TH], LEAD2);
  }

  // octagonal stages; faces 1, 3, 5, 7 point south, west, north, east
  const octFaces = (r, cx = TX) => { const rg = ring(cx, 0, r, 8); return rg.map((p, i) => face(p[0], p[1], rg[(i + 1) % 8][0], rg[(i + 1) % 8][1], cx, 0)); };
  const railing = (r, y, h = 0.95, col = LEAD3) => {
    const rg = ring(TX, 0, r, 8);
    for (let i = 0; i < 8; i++) {
      const a = rg[i], c = rg[(i + 1) % 8], f = face(a[0], a[1], c[0], c[1], TX, 0);
      fbox(f, 0, f.len, -0.08, 0.04, y + h - 0.12, y + h, col);
      for (let s = 0.35; s < f.len - 0.1; s += 0.42) Q(f.P(s - 0.05, y, 0), f.P(s + 0.05, y, 0), f.P(s + 0.05, y + h, 0), f.P(s - 0.05, y + h, 0), col);
      frust(a[0], a[1], 0.1, 0.1, y, y + h + 0.2, 4, col, true);
    }
  };
  const clock = (f, s, y, r) => {
    const pts = K.circle(s, y, r, 14);
    poly(f, pts, 0.08, DIAL);
    ribbon(f, K.circle(s, y, r + 0.08, 14), 0.2, 0.1, GOLD, true);
    for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; ribbon(f, [[s + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72], [s + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], h % 3 ? 0.08 : 0.16, 0.11, GOLD); }
    ribbon(f, [[s, y], [s + r * 0.35, y + r * 0.45]], 0.13, 0.13, GOLD);
    ribbon(f, [[s, y], [s - r * 0.12, y - r * 0.72]], 0.09, 0.13, GOLD);
    poly(f, [[s - r - 0.3, y + r + 0.25], [s + r + 0.3, y + r + 0.25], [s, y + r + 1.0]], 0.06, LEAD3); // little pediment
  };
  // open lantern: floor, corner posts, pointed arches and a dark interior (with a bell)
  const lantern = (r, y0, y1, post, bell = 0) => {
    frust(TX, 0, r * 0.9, r * 0.9, y0, y0 + 0.1, 8, LEAD2);
    const pr = ring(TX, 0, r, 8);
    for (const [px, pz] of pr) frust(px, pz, post, post, y0, y1, 4, LEADC, false, Math.PI / 4);
    octFaces(r).forEach(f => {
      const m = f.len / 2;
      poly(f, [[0, y1 - m * 1.25], [m * 0.3, y1 - m * 0.55], [m, y1 - 0.2], [f.len - m * 0.3, y1 - m * 0.55], [f.len, y1 - m * 1.25], [f.len, y1], [0, y1]], 0, LEADC);
      ribbon(f, [[0.1, y1 - m * 1.25], [m * 0.3, y1 - m * 0.55], [m, y1 - 0.2], [f.len - m * 0.3, y1 - m * 0.55], [f.len - 0.1, y1 - m * 1.25]], 0.12, 0.04, LEAD3);
    });
    frust(TX, 0, r * 0.82, r * 0.82, y1 - 0.15, y1, 8, DARK); // ceiling
    frust(TX, 0, 0.22, 0.22, y0, y1, 4, DARK, false); // bell frame
    if (bell) {
      frust(TX, 0, bell, bell * 0.5, y0 + 1.4, y0 + 1.4 + bell * 1.3, 8, BRONZE);
      frust(TX, 0, bell * 0.5, 0.01, y0 + 1.4 + bell * 1.3, y0 + 1.4 + bell * 1.6, 8, BRONZE);
      frust(TX, 0, bell * 1.08, bell * 1.08, y0 + 1.25, y0 + 1.45, 8, BRONZE);
      for (const sx of [-1, 1]) Q([TX + sx * r * 0.5, y0 + 0.3, -0.12], [TX + sx * r * 0.5, y0 + 0.3, 0.12], [TX + sx * r * 0.5, y1 - 0.4, 0.12], [TX + sx * r * 0.5, y1 - 0.4, -0.12], DARK);
      Q([TX - r * 0.6, y1 - 0.6, 0], [TX + r * 0.6, y1 - 0.6, 0], [TX + r * 0.6, y1 - 0.3, 0], [TX - r * 0.6, y1 - 0.3, 0], DARK);
    }
  };
  {
    // stage 1: closed lead octagon with the clocks
    const r1 = 4.4, y1a = TB + 0.1, y1b = TB + 8.6;
    frust(TX, 0, r1, r1, y1a, y1b, 8, LEADC, false);
    octFaces(r1).forEach((f, i) => {
      const m = f.len / 2;
      fbox(f, 0, 0.18, 0, 0.1, y1a, y1b, LEAD3); // corner battens
      if (i % 2 === 1 && i !== 7) clock(f, m, y1a + 4.4, 1.25);
      else if (i % 2 === 0) { poly(f, K.arch(m, 1.2, y1a + 2.6, y1a + 5.2, 1, 3), 0.05, DARK); ribbon(f, K.arch(m, 1.2, y1a + 2.6, y1a + 5.2, 1, 3, 0.12).slice(1), 0.16, 0.07, LEAD3); }
    });
    frust(TX, 0, r1 + 0.25, r1 + 0.25, y1b, y1b + 0.4, 8, LEAD3);
    frust(TX, 0, r1 + 0.7, r1 + 0.7, y1b + 0.4, y1b + 0.65, 8, LEAD2);
    railing(r1 + 0.6, y1b + 0.65);
    // stage 2: tall open bell lantern
    const r2 = 3.3, y2a = y1b + 0.65, y2b = y2a + 6.8;
    lantern(r2, y2a, y2b, 0.24, 1.1);
    frust(TX, 0, r2 + 0.3, r2 + 0.3, y2b, y2b + 0.5, 8, LEAD3);
    frust(TX, 0, r2 + 0.65, r2 + 0.65, y2b + 0.5, y2b + 0.72, 8, LEAD2);
    railing(r2 + 0.55, y2b + 0.72, 0.85);
    // stage 3: smaller open lantern
    const r3 = 2.35, y3a = y2b + 0.72, y3b = y3a + 4.6;
    lantern(r3, y3a, y3b, 0.18, 0.7);
    frust(TX, 0, r3 + 0.25, r3 + 0.25, y3b, y3b + 0.45, 8, LEAD3);
    frust(TX, 0, r3 + 0.25, 1.5, y3b + 0.45, y3b + 1.3, 8, LEADC, false);
    // stage 4: closed little lantern with round openings
    const r4 = 1.45, y4a = y3b + 1.3, y4b = y4a + 2.8;
    frust(TX, 0, r4, r4, y4a, y4b, 8, LEADC, false);
    octFaces(r4).forEach(f => poly(f, K.circle(f.len / 2, y4a + 1.4, 0.36, 6), 0.04, DARK));
    frust(TX, 0, r4 + 0.2, r4 + 0.2, y4b, y4b + 0.35, 8, LEAD3);
    // ogee cap and spire to 67 m
    frust(TX, 0, r4 + 0.1, 0.95, y4b + 0.35, y4b + 1.4, 8, LEADC, false);
    frust(TX, 0, 0.95, 0.62, y4b + 1.4, y4b + 2.2, 8, LEADC, false);
    frust(TX, 0, 0.62, 0, y4b + 2.2, 65.6, 8, LEADC);
    frust(TX, 0, 0.3, 0.3, 65.8, 66.3, 6, GOLD);
    frust(TX, 0, 0.05, 0.05, 66.3, 67.8, 4, GOLD, false);
    Q([TX, 67.0, -0.04], [TX + 1.0, 67.0, -0.04], [TX + 1.0, 67.5, -0.04], [TX, 67.5, -0.04], GOLD); // weathercock
  }
  void T;
}
