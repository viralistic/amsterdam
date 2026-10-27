// Client UI for the combat pack: hazard and special-attack effects, direct-damage hitsplats, the ArenA
// leaderboard window and small per-frame animations of combat objects.
import * as THREE from 'three';
import { registry } from '../../registry.js';

const fx = []; // { obj, t0, dur, step(t, obj) }
const add = (obj, dur, step) => { const r = registry.ctx?.renderer; if (!r) return; r.scene.add(obj); fx.push({ obj, t0: performance.now(), dur, step }); };
const mat = (color, opacity = 0.8) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

function ring(x, z, r, color, y = 0.1) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.6, 1, 24).rotateX(-Math.PI / 2), mat(color, 0.7));
  m.position.set(x + 0.5, y, z + 0.5);
  add(m, 700, (t, o) => { const s = 0.3 + t * r; o.scale.set(s, 1, s); o.material.opacity = 0.7 * (1 - t); });
}
function puff(x, z, color, size = 0.6, rise = 2.5, dur = 900, n = 5, spread = 0.4) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), mat(color, 0.55));
    const ox = (Math.random() - 0.5) * spread * 2, oz = (Math.random() - 0.5) * spread * 2;
    m.position.set(x + 0.5 + ox, 0.3, z + 0.5 + oz);
    const d = dur * (0.7 + Math.random() * 0.6);
    add(m, d, (t, o) => { o.position.y = 0.3 + t * rise; o.scale.setScalar(0.5 + t * 1.4); o.material.opacity = 0.55 * (1 - t); });
  }
}
function cloud(x, z, r, color) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), mat(color, 0.4));
  m.position.set(x + 0.5, 0.8, z + 0.5);
  add(m, 1100, (t, o) => { o.scale.set(r * t + 0.5, (r * t + 0.5) * 0.4, r * t + 0.5); o.material.opacity = 0.45 * (1 - t); });
}
function stars(id) {
  const r = registry.ctx?.renderer, ent = r?.ents.get('p' + id);
  if (!ent?.model) return;
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), mat('#ffe040', 1)); s.position.set(Math.cos(i * 2.1) * 0.35, 0, Math.sin(i * 2.1) * 0.35); g.add(s); }
  add(g, 2800, (t, o) => { const p = ent.model.group.position; o.position.set(p.x, (ent.model.height || 2) + 0.25, p.z); o.rotation.y = t * 12; });
}
function rockFly(fx0, fz0, x, z) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), new THREE.MeshLambertMaterial({ color: '#8a867a', flatShading: true }));
  add(m, 600, (t, o) => { o.position.set(fx0 + 0.5 + (x - fx0) * t, 4 + Math.sin(t * Math.PI) * 3 - t * 3.5, fz0 + 0.5 + (z - fz0) * t); o.rotation.x = t * 8; });
}

registry.msgHandlers['combat:fx'] = m => {
  const { x, z, kind } = m;
  switch (kind) {
    case 'steam': puff(x, z, '#f2f2f2', 0.45, 3, 1000, 7, 0.25); registry.sfx?.('steam'); break;
    case 'vent_warn': puff(x, z, '#d8d8d8', 0.18, 0.6, 500, 3, 0.2); break;
    case 'gas': cloud(x, z, m.r || 4, '#8ad05a'); puff(x, z, '#a8e07a', 0.6, 1.5, 1000, 6, m.r || 2); break;
    case 'heat': ring(x, z, m.r || 10, '#ff8a20', 0.3); break;
    case 'slam': ring(x, z, (m.r || 1) * 2 + 2, '#c8b890'); puff(x, z, '#a89a7a', 0.35, 0.8, 600, 6, (m.r || 1)); registry.sfx?.('slam'); break;
    case 'wave': ring(x, z, m.r || 6, '#5ad0ff'); puff(x, z, '#c8f0ff', 0.4, 1.8, 800, 8, 2); break;
    case 'splash': puff(x, z, '#8ac8f0', 0.3, 1.5, 700, 6, 0.6); break;
    case 'rubble': puff(x, z, '#8a7a5a', 0.4, 1.2, 800, 8, m.r || 2); break;
    case 'debris': puff(x, z, '#9a968a', 0.45, 1, 800, 8, 1); registry.sfx?.('slam'); break;
    case 'summon': puff(x, z, '#b070ff', 0.35, 2, 900, 6, 0.5); break;
    case 'rock': rockFly(m.fromX, m.fromZ, x, z); break;
    case 'stun': stars(m.id); break;
  }
};

// direct damage (steam vents, falls, debris): reuse the engine's hitsplat
registry.msgHandlers['combat:splat'] = (m, ctx) => { ctx.renderer?.hit(m.id, m.d, m.hp, m.mhp, null, null, 'p'); };

// ---- ArenA leaderboard
const ago = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; };
registry.msgHandlers['combat:arena'] = (m, ctx) => {
  const esc = ctx.esc, now = Date.now();
  const td = 'style="padding:2px 6px;text-align:right"', tl = 'style="padding:2px 6px;text-align:left"';
  const row = (r, i) => `<tr${m.you && r.name === ctx.S.name ? ' style="color:#ffff00"' : ''}><td ${td}>${i + 1}</td><td ${tl}>${esc(r.name)}</td><td ${td}>${r.pts}</td><td ${td}>${r.k}</td><td ${td}>${r.d}</td><td ${td}>${r.best || 0}</td></tr>`;
  const t = m.tourney;
  const tour = t.active
    ? `<p style="color:#ff981f"><b>Tournament in progress!</b> Ends in ${ago(t.endsAt - now)}.</p>${t.top.length ? `<p>${t.top.map((s, i) => `${i + 1}. ${esc(s.name)} (${s.k})`).join(' &nbsp; ')}</p>` : '<p>No kills yet. Get out there!</p>'}`
    : `<p>Next tournament starts in <b>${ago(t.nextAt - now)}</b>.${t.last ? ` Last winner: <b>${esc(t.last.name)}</b> (${t.last.k} kills).` : ''}</p>`;
  const hist = (m.history || []).map(h => `<li>Season ${h.season}: ${h.top.map(r => esc(r.name) + ' (' + r.pts + ')').join(', ') || 'nobody'}</li>`).join('');
  ctx.openWindow('ArenA Leaderboard', `
    <div class="cb-arena" style="font-size:13px;line-height:1.35">
      <p><b>Season ${m.season}</b> &middot; ends in ${ago(m.seasonEnds - now)}</p>
      ${tour}
      <table style="width:100%;border-collapse:collapse;margin:6px 0">
        <tr style="color:#ff981f"><th ${td}>#</th><th ${tl}>Name</th><th ${td}>Pts</th><th ${td}>Kills</th><th ${td}>Deaths</th><th ${td}>Streak</th></tr>
        ${m.top.length ? m.top.map(row).join('') : '<tr><td colspan="6" style="padding:6px">Nobody has fought this season yet.</td></tr>'}
      </table>
      ${m.you ? `<p>You: rank <b>${m.you.rank}</b>, ${m.you.pts} points, ${m.you.k} kills, ${m.you.d} deaths.</p>` : '<p>You have not fought in the ArenA this season.</p>'}
      ${hist ? `<p style="color:#ff981f;margin-top:6px">Past champions</p><ul style="margin:0;padding-left:18px">${hist}</ul>` : ''}
    </div>`);
};

// ---- per-frame: effects, animated objects, and the ArenA label instead of a Wilderness level
let lastLabel = '';
registry.frameHooks.push((now, ctx) => {
  const r = ctx.renderer;
  if (!r) return;
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i], t = (performance.now() - f.t0) / f.dur;
    if (t >= 1) { r.scene.remove(f.obj); f.obj.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); fx.splice(i, 1); continue; }
    f.step(t, f.obj);
  }
  for (const o of r.objs.values()) o.root.userData.cbAnim?.(performance.now());
  const inArena = ctx.S.region?.id === 'int_cb_arena';
  if (inArena) {
    const w = document.getElementById('wild-level');
    if (w && lastLabel !== w.innerHTML) { w.innerHTML = `${ctx.iconImg('arena_champion_cape', 'ico orb-ico')}<span>ArenA<br><small>Safe PvP</small></span>`; lastLabel = w.innerHTML; }
  } else lastLabel = '';
});
