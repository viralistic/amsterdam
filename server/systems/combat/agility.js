// Agility: the A'DAM Toren rooftop course (interior rooftops, marks of grace), the beginner Grachtenhopper course
// along the Prins Hendrikkade, world shortcuts, and the graceful outfit bought with marks of grace.
const RX = 36000, RZ = 30000;

export function registerAgility(api, U) {
  const T = api.tile;
  const obst = new Map(); // object id -> obstacle definition

  // Moves the player along `path` one tile per tick, may fail half-way. Movement is locked while crossing.
  const cross = (p, o, d) => {
    if (U.stunned(p) || p.cbObst) return;
    if (d.level && api.lv(p, 'agility') < d.level) return api.msg(p, `You need an Agility level of ${d.level} to attempt this.`);
    if (p.target && p.lastCombat > api.tick - 6) return api.msg(p, "You can't do that while you're fighting!");
    api.closeIface(p); api.stopAction(p);
    const lvl = api.lv(p, 'agility');
    const failChance = d.fail ? Math.max(0, d.fail - (lvl - (d.level || 1)) * 0.012) : 0;
    const fails = Math.random() < failChance;
    p.cbObst = { d, o, i: 0, fails, failAt: Math.max(1, Math.floor(d.path.length / 2)) };
    p.target = null; p.pending = null; p.path = [];
    p.anim = d.anim || null; p.animUntil = api.tick + d.path.length + 1;
    if (d.start) api.msg(p, d.start);
  };
  api.onPlayerTick(p => {
    const c = p.cbObst;
    if (!c) return;
    p.path = []; p.pending = null; p.target = null;
    if (c.fails && c.i === c.failAt) {
      p.cbObst = null;
      const f = c.d.failTo;
      if (f) api.teleport(p, f.x, f.z, { inside: !!f.inside });
      U.fx(p.x, p.z, 'splash');
      U.hurt(p, api.rand(...(c.d.dmg || [1, 3])), c.d.failMsg || 'You slip and fall!');
      if (c.d.course) p.cbCourse = null;
      return;
    }
    const step = c.d.path[c.i++];
    if (step) {
      if (step[2]) api.teleport(p, step[0], step[1], { inside: !!step[2].inside }); else { p.x = step[0]; p.z = step[1]; }
      if (c.i < c.d.path.length) return;
    }
    p.cbObst = null;
    finish(p, c.d);
  });

  const finish = (p, d) => {
    api.addXp(p, 'agility', d.xp || 0);
    if (d.done) api.msg(p, d.done);
    if (!d.course) return;
    const course = COURSES[d.course];
    const prog = p.cbCourse;
    if (d.index === 0) p.cbCourse = { course: d.course, next: 1 };
    else if (prog?.course === d.course && prog.next === d.index) prog.next++;
    else p.cbCourse = null;
    if (course.marks && Math.random() < course.marks && d.markRoom) {
      const r = d.markRoom;
      const x = api.rand(r.x0 + 2, r.x1 - 2), z = api.rand(r.z0 + 2, r.z1 - 2);
      api.dropGround('mark_of_grace', 1, x, z, 600_000, { owner: p.id, forP: p.id, forUntil: Infinity });
      api.msg(p, 'A Mark of Grace appears on the rooftop.', 'level');
    }
    if (d.index === course.last) {
      if (p.cbCourse?.next === course.last + 1) {
        api.addXp(p, 'agility', course.lapXp);
        const st = api.playerStore(p, 'combat');
        st.laps = st.laps || {};
        st.laps[d.course] = (st.laps[d.course] || 0) + 1;
        api.msg(p, `You complete a lap of the ${course.name}! Lap count: ${st.laps[d.course]}.`, 'level');
        if (course.lapMark && Math.random() < course.lapMark) { api.giveOrDrop(p, 'mark_of_grace', 1); api.msg(p, 'The rooftop runners award you a Mark of Grace.'); }
      }
      p.cbCourse = null;
    }
  };

  const place = (type, x, z, def, rot = 0) => { const o = api.spawnObject({ type, x, z, rot }); obst.set(o.id, def); return o; };
  const line = (x0, z0, x1, z1) => { // tiles from (x0,z0) to (x1,z1), excluding the start
    const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0)), out = [];
    for (let i = 1; i <= n; i++) out.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(z0 + (z1 - z0) * i / n)]);
    return out;
  };
  const COURSES = {
    adam: { name: "A'DAM Toren rooftop course", last: 5, lapXp: 120, marks: 0.12, lapMark: 0.25 },
    gracht: { name: 'Grachtenhopper course', last: 4, lapXp: 40, marks: 0, lapMark: 0 },
  };

  // ================= A'DAM Toren rooftops (interior), level 25
  const roofs = [
    { x0: RX, z0: RZ + 10, x1: RX + 14, z1: RZ + 24 }, // skydeck
    { x0: RX + 24, z0: RZ + 12, x1: RX + 30, z1: RZ + 22 }, // window-cleaning ledge
    { x0: RX + 40, z0: RZ + 8, x1: RX + 54, z1: RZ + 26 }, // antenna platform
    { x0: RX + 64, z0: RZ + 10, x1: RX + 84, z1: RZ + 24 }, // lower roof
    { x0: RX + 94, z0: RZ + 12, x1: RX + 106, z1: RZ + 22 }, // terrace
  ];
  api.interior({
    id: 'cb_adam_roof', name: "A'DAM Toren rooftops",
    rooms: roofs.map((r, i) => ({ ...r, floor: ['#5f6a72', '#7a7e82', '#4e565c', '#6a5e52', '#5a6a58'][i], wall: '#2a2e34', h: 0.9 })),
  });
  const base = T(52.3841, 4.9019);
  const ground = { x: base.x - 4, z: base.z + 9 };
  const fallTo = { x: base.x + 2, z: base.z + 10 };
  const mid = RZ + 17;
  const A = { course: 'adam', level: 25, fail: 0.22, dmg: [3, 7], failTo: fallTo, failMsg: 'You lose your footing and fall all the way down to the street. Ouch!' };
  place('cb_agi_ladder', ground.x, ground.z, { course: 'adam', index: 0, level: 25, xp: 10, anim: 'pick', path: [[ground.x, ground.z - 1], [RX + 4, mid, { inside: true }]], start: 'You climb the maintenance ladder up the side of the tower...', done: 'You reach the skydeck.' });
  place('cb_agi_beam', RX + 13, mid, { ...A, index: 1, xp: 30, path: line(RX + 13, mid, RX + 26, mid), start: 'You step onto the window-cleaning beam...', done: '...and make it across. Don\'t look down.', markRoom: roofs[1] }, Math.PI / 2);
  place('cb_agi_gap', RX + 29, mid, { ...A, index: 2, xp: 35, path: [[RX + 31, mid - 1], [RX + 34, mid - 1], [RX + 37, mid], [RX + 42, mid]], start: 'You take a run-up and leap across the gap...', done: 'You land on the antenna platform.', markRoom: roofs[2] });
  place('cb_agi_swing', RX + 52, mid, { ...A, index: 3, xp: 45, fail: 0.15, path: [[RX + 55, mid - 3], [RX + 58, mid - 5], [RX + 61, mid - 3], [RX + 66, mid]], start: 'You grab the Over the Edge swing and swing out over the IJ!', done: 'Wheee! You let go and land on the lower roof.', markRoom: roofs[3] }, Math.PI / 2);
  place('cb_agi_rope', RX + 83, mid, { ...A, index: 4, xp: 40, path: line(RX + 83, mid, RX + 96, mid), start: 'You clip onto the zipline and slide down...', done: 'You land on the terrace.', markRoom: roofs[4] }, Math.PI / 2);
  place('cb_agi_drop', RX + 105, mid, { course: 'adam', index: 5, xp: 30, path: [[RX + 106, mid], [ground.x + 2, ground.z + 2, { inside: false }]], start: 'You jump down the scaffolding back to street level.' });
  api.spawnObject({ type: 'sign', x: ground.x - 2, z: ground.z, data: { text: "A'DAM TOREN ROOFTOP COURSE. Agility level 25. Climb, balance, jump, swing and slide your way around the tower. Marks of Grace appear on the rooftops." } });

  // ================= Grachtenhopper (beginner, level 1) along the Prins Hendrikkade
  const g = T(52.37690, 4.90220);
  const G = { course: 'gracht', level: 1, fail: 0.08, dmg: [1, 2], failMsg: 'You slip into the canal! Bah, it is cold.' };
  const gp = (dx, dz) => [g.x + dx, g.z + dz];
  place('cb_agi_bikerack', g.x, g.z, { ...G, fail: 0, index: 0, xp: 6, path: [gp(1, 0), gp(2, 0), gp(3, 0)], start: 'You climb over the bike rack. Mind the bells.' }, Math.PI / 2);
  place('cb_agi_railing', g.x + 5, g.z, { ...G, index: 1, xp: 8, failTo: { x: g.x + 8, z: g.z - 2 }, path: line(...gp(5, 0), ...gp(11, 0)), start: 'You balance along the canal railing...' }, Math.PI / 2);
  place('cb_agi_boat', g.x + 13, g.z + 1, { ...G, index: 2, xp: 10, failTo: { x: g.x + 14, z: g.z - 2 }, path: [gp(14, 1), gp(16, 2), gp(18, 1), gp(20, 0)], start: 'You hop onto the houseboat roof and across...' }, Math.PI / 2);
  place('cb_agi_wall', g.x + 22, g.z, { ...G, fail: 0, index: 3, xp: 6, path: [gp(23, 0), gp(24, 0)], start: 'You climb over the low quay wall.' }, Math.PI / 2);
  place('cb_agi_pipe', g.x + 26, g.z, { ...G, fail: 0, index: 4, xp: 8, path: line(...gp(26, 0), ...gp(31, 0)), start: 'You squeeze through the drain pipe...', done: 'You crawl out the other end, slightly damp.' }, Math.PI / 2);
  api.spawnObject({ type: 'sign', x: g.x - 2, z: g.z - 1, data: { text: 'GRACHTENHOPPER - beginner agility course. Climb the bike rack, balance the railing, hop the houseboat, climb the wall and squeeze through the pipe. Then walk back and go again!' } });

  // ================= world shortcuts
  const sc = (type, lat, lon, level, xp, toFn, opts = {}) => { const a = T(lat, lon); place(type, a.x, a.z, { level, xp, fail: opts.fail || 0, dmg: opts.dmg, path: toFn(a), start: opts.start, failTo: opts.failTo }, opts.rot || 0); return a; };
  sc('cb_agi_fence', 52.3600, 4.8590, 5, 8, a => line(a.x, a.z, a.x, a.z + 3), { start: 'You squeeze through the gap in the Vondelpark fence.' });
  sc('cb_agi_stones', 52.3300, 4.8975, 20, 15, a => line(a.x, a.z, a.x + 7, a.z), { fail: 0.15, dmg: [1, 3], start: 'You hop across the slippery stepping stones...', rot: Math.PI / 2 });
  const wg = T(52.3861, 4.8752);
  place('cb_agi_pipe', wg.x, wg.z, { level: 30, xp: 20, path: [[wg.x + 1, wg.z], [34064, 30020, { inside: true }]], start: 'You squeeze into the old gas main. It leads straight into the machine hall of the Westergasfabriek!' }, Math.PI / 2);
  place('cb_agi_pipe', 34066, 30020, { level: 30, xp: 20, path: [[34065, 30020], [wg.x + 1, wg.z + 1, { inside: false }]], start: 'You crawl back out through the gas main.' }, Math.PI / 2);
  sc('cb_agi_wall', 52.31420, 4.94200, 40, 25, a => line(a.x, a.z, a.x - 4, a.z), { start: 'You scramble over the crumbling wall towards the border.', rot: Math.PI / 2 });
  for (const type of ['cb_agi_ladder', 'cb_agi_beam', 'cb_agi_gap', 'cb_agi_swing', 'cb_agi_wall', 'cb_agi_rope', 'cb_agi_drop', 'cb_agi_bikerack', 'cb_agi_railing', 'cb_agi_boat', 'cb_agi_fence', 'cb_agi_stones', 'cb_agi_pipe']) {
    const action = api.OBJECT_TYPES[type].actions[0];
    api.objectAction(type, action, (p, o) => { const d = obst.get(o.id); if (d) cross(p, o, d); else api.msg(p, 'Nothing interesting happens.'); });
  }
  // the metro tunnel shortcut keeps its target in the object data (spawned by the Wilderness module)
  api.objectAction('cb_tunnel_crawl', 'Squeeze-through', (p, o) => {
    const d = o.data;
    cross(p, o, { level: d.level, xp: d.xp, path: [[o.x, o.z + 1], [d.to.x, d.to.z, { inside: true }]], start: 'You squeeze through the collapsed side tunnel...' });
  });

  // ================= graceful outfit: Grietje sells it for marks of grace, and wearing it all restores run energy
  const GRACEFUL = [['graceful_hood', 35], ['graceful_cape', 40], ['graceful_top', 55], ['graceful_legs', 60], ['graceful_boots', 40]];
  api.spawnNpc({ name: 'Grietje', at: { x: ground.x + 4, z: ground.z + 2 }, wander: 2, look: { g: 1, skin: 0, hair: 4, top: 9, legs: 5, topC: '#3f8f7a' }, eq: { head: 'graceful_hood', legs: 'graceful_legs', feet: 'graceful_boots', cape: 'graceful_cape' }, talk: 'cb_grietje', ex: 'Runs across rooftops for fun. Has opinions about your shoes.' });
  const buy = (id, cost) => p => {
    if (api.invCount(p, 'mark_of_grace') < cost) return 'poor';
    if (!api.canAdd(p, id, 1)) { api.msg(p, "You don't have enough inventory space."); return 'end'; }
    api.invRemove(p, 'mark_of_grace', cost); api.invAdd(p, id, 1);
    return 'bought';
  };
  api.dialog('cb_grietje', {
    start: [
      { npc: p => `Hoi! I'm Grietje. I trade graceful clothing for Marks of Grace. You have ${api.invCount(p, 'mark_of_grace')} marks. Wearing the full set makes your run energy come back much faster.` },
      { opts: [['Show me the graceful outfit.', 'menu'], ['Where do I find marks?', 'where'], ['Bye.', 'end']] },
    ],
    where: [{ player: 'Where do I find Marks of Grace?' }, { npc: "On the rooftops of the A'DAM Toren course, right above us. Keep running laps and they'll appear. Agility 25 needed." }, { goto: 'start2' }],
    start2: [{ opts: [['Show me the graceful outfit.', 'menu'], ['Bye.', 'end']] }],
    menu: [{ opts: [...GRACEFUL.map(([id, c]) => [`${api.ITEMS[id].name} (${c} marks)`, 'b_' + id]), ['Never mind.', 'end']] }],
    ...Object.fromEntries(GRACEFUL.map(([id, c]) => ['b_' + id, [{ act: buy(id, c) }]])),
    bought: [{ npc: 'Lekker! Looking very graceful already.' }, { goto: 'menu' }],
    poor: [{ npc: "You don't have enough Marks of Grace for that. Back to the rooftops with you!" }],
  });
  const GSET = GRACEFUL.map(g => g[0]);
  api.onPlayerTick(p => {
    const eq = p.rec.equip;
    if (p.rec.energy >= 10000 || !GSET.every(id => Object.values(eq).some(s => s?.id === id))) return;
    p.rec.energy = Math.min(10000, p.rec.energy + (p.path.length && p.run ? 25 : 12));
  });

  return { obst, ground, roofs, gracht: g };
}
