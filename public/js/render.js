// Three.js scene: OSRS-style orbit camera, interpolated entities, overhead text, hitsplats and picking.
import * as THREE from 'three';
import { World } from './world.js';
import { buildModel, disposeModel, animate } from './model.js';
import { iconCanvas } from './icons.js';
import { buildLandmarks, buildZoo } from './landmarks.js';
import { registry } from './registry.js';
import { OBJECT_TYPES } from '/shared/objects.js';

const TICK = 600;

export class Renderer {
  constructor(canvas, overlay) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    // old-school look: the world fades into a black void at the edge of the draw distance
    const sky = new THREE.Color('#000000');
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, 70, 150);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 260);
    this.hemi = new THREE.HemisphereLight('#dfe8f0', '#5a5040', 1.6);
    this.scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#fff4e0', 1.6);
    sun.position.set(-40, 80, 30);
    this.scene.add(sun);
    this.world = new World(this.scene);
    this.scenery = buildLandmarks(this.scene);
    buildZoo(this.scene);
    this.projectiles = [];
    this.objs = new Map();
    this.lookAt = null; // optional {x, z} to aim the camera somewhere other than the player
    this.yaw = 0; this.pitch = 0.9; this.dist = 19;
    this.focus = new THREE.Vector3();
    this.ents = new Map(); // "p12" -> entity
    this.items = new Map();
    this.itemTex = new Map();
    this.myKey = null;
    this.lastTick = performance.now();
    this.raycaster = new THREE.Raycaster();
    this.marker = null;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---- entities
  applyTick(ents, items, myId) {
    this.lastTick = performance.now();
    this.myKey = 'p' + myId;
    const seen = new Set();
    for (const e of ents) {
      const key = e.k + e.id;
      seen.add(key);
      let ent = this.ents.get(key);
      const sig = JSON.stringify([e.l, e.eq, e.g, e.m, e.sc]);
      if (!ent) {
        ent = { key, data: e, from: { x: e.x, z: e.z }, to: { x: e.x, z: e.z }, rot: 0, walk: 0, dom: null, splats: [], hpUntil: 0 };
        this.ents.set(key, ent);
      } else {
        const cur = this.entPos(ent, 1);
        ent.from = cur;
        ent.to = { x: e.x, z: e.z };
        if (e.tp || Math.abs(cur.x - e.x) > 30 || Math.abs(cur.z - e.z) > 30) ent.from = { x: e.x, z: e.z };
      }
      if (ent.sig !== sig) {
        if (ent.model) { this.scene.remove(ent.model.group); disposeModel(ent.model); }
        ent.model = buildModel(e);
        ent.model.hit.userData.pick = { kind: e.k === 'p' ? 'player' : 'npc', key };
        this.scene.add(ent.model.group);
        ent.sig = sig;
      }
      ent.data = e;
      if (e.k === 'p') { ent.hp = e.hp; ent.mhp = e.mhp; }
    }
    for (const [key, ent] of this.ents) if (!seen.has(key)) this.removeEnt(key, ent);

    const seenI = new Set();
    for (const it of items) {
      seenI.add(it.id);
      let s = this.items.get(it.id);
      if (!s) {
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.iconTexture(it.i), depthWrite: false }));
        s.scale.set(0.9, 0.8, 1);
        s.position.set(it.x + 0.5, 0.4, it.z + 0.5);
        s.userData.pick = { kind: 'ground', id: it.id };
        this.scene.add(s);
        this.items.set(it.id, s);
      }
      s.userData.data = it;
    }
    for (const [id, s] of this.items) if (!seenI.has(id)) { this.scene.remove(s); s.material.dispose(); this.items.delete(id); }
  }

  // ---- world objects (trees, rocks, ladders...): [id, type, x, z, rot, depleted]
  applyObjects(list) {
    const seen = new Set();
    for (const [id, type, x, z, rot, dep] of list) {
      seen.add(id);
      const cur = this.objs.get(id);
      if (cur && cur.dep === dep) continue;
      if (cur) this.removeObj(id);
      const def = OBJECT_TYPES[type] || { name: type, model: 'box' };
      const look = dep && def.depleted ? def.depleted : def;
      const build = registry.objectModels[look.model] || registry.objectModels.box;
      const mesh = build({ ...(look.params || {}), size: def.size }, THREE);
      mesh.position.set(x + 0.5, 0, z + 0.5);
      mesh.rotation.y = rot || 0;
      mesh.traverse(m => { m.userData.pick = { kind: 'obj', id }; });
      // picking uses one invisible box so thin models are easy to click
      const [w, d] = def.size || [1, 1];
      const hitbox = new THREE.Mesh(new THREE.BoxGeometry(w, def.pickHeight || 1.6, d), new THREE.MeshBasicMaterial({ visible: false }));
      hitbox.position.y = (def.pickHeight || 1.6) / 2;
      hitbox.userData.pick = { kind: 'obj', id };
      mesh.add(hitbox);
      this.scene.add(mesh);
      this.objs.set(id, { mesh: hitbox, root: mesh, dep, data: { id, type, x, z, dep, def } });
    }
    for (const id of [...this.objs.keys()]) if (!seen.has(id)) this.removeObj(id);
    const blocked = new Set();
    for (const { data } of this.objs.values()) if (data.def.blocks) { const [w, d] = data.def.size || [1, 1]; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) blocked.add((data.x + i - Math.floor((w - 1) / 2)) + ',' + (data.z + j - Math.floor((d - 1) / 2))); }
    this.world.dynBlocked = blocked;
  }

  removeObj(id) {
    const o = this.objs.get(id);
    if (!o) return;
    this.scene.remove(o.root);
    o.root.traverse(m => { m.geometry?.dispose(); if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.dispose()); });
    this.objs.delete(id);
  }

  removeEnt(key, ent) {
    if (ent.model) { this.scene.remove(ent.model.group); disposeModel(ent.model); }
    ent.dom?.remove();
    for (const s of ent.splats) s.el.remove();
    this.ents.delete(key);
  }

  clear() {
    for (const [key, ent] of this.ents) this.removeEnt(key, ent);
    for (const [, s] of this.items) this.scene.remove(s);
    this.items.clear();
    for (const id of [...this.objs.keys()]) this.removeObj(id);
  }

  iconTexture(id) {
    if (!this.itemTex.has(id)) {
      const t = new THREE.CanvasTexture(iconCanvas(id));
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      this.itemTex.set(id, t);
    }
    return this.itemTex.get(id);
  }

  entPos(ent, t) {
    return { x: ent.from.x + (ent.to.x - ent.from.x) * t, z: ent.from.z + (ent.to.z - ent.from.z) * t };
  }

  say(kind, id, text) {
    const ent = this.ents.get(kind + id);
    if (!ent) return;
    ent.say = text; ent.sayUntil = performance.now() + 4000;
  }

  hit(id, dmg, hp, mhp, from, proj, k = 'p', fk = 'p') {
    const ent = this.ents.get(k + id);
    if (!ent) return;
    const src = from && this.ents.get(fk + from);
    if (proj && src) {
      // arrows and spells fly to the target; the splat shows when they land
      const mesh = proj.kind === 'arrow'
        ? new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.7), new THREE.MeshBasicMaterial({ color: '#7a5030' }))
        : new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: proj.color, transparent: true, opacity: 0.9 }));
      this.scene.add(mesh);
      this.projectiles.push({ mesh, src, dst: ent, t0: performance.now(), dur: 500, done: () => this.hit(id, dmg, hp, mhp, null, null, k) });
      return;
    }
    const el = document.createElement('div');
    el.className = 'splat' + (dmg ? '' : ' miss');
    el.style.backgroundImage = `url(${iconCanvas(dmg ? 'splat' : 'splat_miss').url})`;
    el.textContent = dmg;
    this.overlay.appendChild(el);
    ent.splats.push({ el, until: performance.now() + 1100 });
    ent.hp = hp; ent.mhp = mhp; ent.hpUntil = performance.now() + 6000;
  }

  showMarker(x, y, red) {
    const el = document.createElement('div');
    el.className = 'clickmark' + (red ? ' red' : '');
    el.style.left = x + 'px'; el.style.top = y + 'px';
    this.overlay.appendChild(el);
    setTimeout(() => el.remove(), 400);
  }

  // ---- picking
  pick(sx, sy) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const objs = [];
    for (const e of this.ents.values()) if (e.model) objs.push(e.model.hit);
    for (const s of this.items.values()) objs.push(s);
    objs.push(...this.scenery);
    for (const o of this.objs.values()) objs.push(o.mesh);
    const hits = [];
    const seen = new Set();
    for (const h of this.raycaster.intersectObjects(objs, false)) {
      const p = h.object.userData.pick;
      const id = p.key || (p.kind === 'scenery' ? 's' + p.name : p.kind === 'obj' ? 'o' + p.id : 'g' + p.id);
      if (seen.has(id)) continue;
      seen.add(id);
      if (p.kind === 'scenery') { hits.push({ kind: 'scenery', name: p.name, ex: p.ex }); continue; }
      if (p.kind === 'obj') { const o = this.objs.get(p.id); if (o) hits.push({ kind: 'obj', obj: o.data }); continue; }
      if (p.kind === 'ground') hits.push({ kind: 'ground', item: h.object.userData.data });
      else hits.push({ kind: p.kind, ent: this.ents.get(p.key).data });
    }
    // stacked ground items on the clicked tile
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    let tile = null;
    if (this.raycaster.ray.intersectPlane(plane, pt)) {
      tile = { x: Math.floor(pt.x), z: Math.floor(pt.z) };
      for (const s of this.items.values()) {
        const d = s.userData.data;
        if (d.x === tile.x && d.z === tile.z && !seen.has('g' + d.id)) { seen.add('g' + d.id); hits.push({ kind: 'ground', item: d }); }
      }
    }
    return { hits, tile };
  }

  // ---- frame
  frame(now) {
    const t = Math.min(1, (now - this.lastTick) / TICK);
    const me = this.ents.get(this.myKey);
    for (const ent of this.ents.values()) {
      const p = this.entPos(ent, t);
      const g = ent.model.group;
      g.position.set(p.x + 0.5, 0, p.z + 0.5);
      const dx = ent.to.x - ent.from.x, dz = ent.to.z - ent.from.z;
      const moving = (dx || dz) && t < 1;
      if (dx || dz) ent.rot = Math.atan2(dx, dz);
      let dr = ent.rot - g.rotation.y;
      dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      g.rotation.y += dr * 0.25;
      if (moving) ent.walk += 0.22 * Math.max(1, Math.hypot(dx, dz));
      ent.amt = (ent.amt || 0) + ((moving ? 1 : 0) - (ent.amt || 0)) * 0.2;
      animate(ent.model, ent.walk, ent.amt, now, ent.data.a);
      if (ent.data.g) g.position.y = 0.15 + Math.sin(now / 400 + ent.data.id) * 0.08;
    }
    if (me || this.lookAt) {
      const g = this.lookAt || me.model.group.position;
      this.focus.lerp(new THREE.Vector3(g.x, 1, g.z), 0.35);
      this.world.update(g.x, g.z);
    }
    this.projectiles = this.projectiles.filter(pr => {
      const k = Math.min(1, (now - pr.t0) / pr.dur);
      const a = pr.src.model.group.position, b = pr.dst.model.group.position;
      pr.mesh.position.set(a.x + (b.x - a.x) * k, 1.4 + Math.sin(k * Math.PI) * 1.2, a.z + (b.z - a.z) * k);
      pr.mesh.lookAt(b.x, 1.2, b.z);
      pr.mesh.rotation.z += 0.3;
      if (k < 1) return true;
      this.scene.remove(pr.mesh); pr.mesh.geometry.dispose(); pr.mesh.material.dispose();
      pr.done();
      return false;
    });
    const cp = Math.cos(this.pitch);
    this.camera.position.set(this.focus.x + Math.sin(this.yaw) * cp * this.dist, this.focus.y + Math.sin(this.pitch) * this.dist, this.focus.z + Math.cos(this.yaw) * cp * this.dist);
    this.camera.lookAt(this.focus);
    for (const f of registry.frameHooks) { try { f(now, registry.ctx); } catch (e) { console.error('frame hook', e); } }
    this.gl.render(this.scene, this.camera);
    this.drawOverlays(now);
  }

  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x + 1) / 2 * this.canvas.clientWidth, y: (1 - v.y) / 2 * this.canvas.clientHeight };
  }

  drawOverlays(now) {
    for (const ent of this.ents.values()) {
      const g = ent.model.group.position;
      const top = this.project(g.x, ent.model.height + 0.35, g.z);
      const talking = ent.say && ent.sayUntil > now;
      const showHp = ent.hpUntil > now;
      const icons = (ent.data.sk ? 'skull,' : '') + (ent.data.ov ? ent.data.ov : '');
      if (!top || (!talking && !showHp && !ent.splats.length && !icons)) { if (ent.dom) ent.dom.style.display = 'none'; continue; }
      if (!ent.dom) {
        ent.dom = document.createElement('div');
        ent.dom.className = 'overhead';
        ent.dom.innerHTML = '<div class="ovicons"></div><div class="say"></div><div class="hpbar"><div></div></div>';
        this.overlay.appendChild(ent.dom);
      }
      if (ent.icons !== icons) {
        ent.icons = icons;
        ent.dom.firstChild.innerHTML = icons.split(',').filter(Boolean).map(id => `<img src="${iconCanvas(id).url}" style="width:24px;height:21px;image-rendering:pixelated">`).join('');
      }
      ent.dom.style.display = '';
      ent.dom.style.transform = `translate(${top.x}px, ${top.y}px)`;
      const sayEl = ent.dom.children[1];
      sayEl.textContent = talking ? ent.say : '';
      const bar = ent.dom.lastChild;
      bar.style.display = showHp ? '' : 'none';
      if (showHp) bar.firstChild.style.width = Math.max(0, ent.hp / ent.mhp * 100) + '%';
      const mid = this.project(g.x, ent.model.height * 0.55, g.z);
      ent.splats = ent.splats.filter(s => { if (s.until < now) { s.el.remove(); return false; } return true; });
      ent.splats.forEach((s, i) => { if (mid) s.el.style.transform = `translate(${mid.x + (i % 2 ? 14 : -14) * (i > 0)}px, ${mid.y - i * 10}px)`; });
    }
  }
}
