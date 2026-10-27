// Johan Cruijff ArenA: a safe PvP arena (pvp + safeDeath interior) with a seasonal ranking, kill streaks,
// a leaderboard window and a tournament every 30 minutes that rewards the top fighter.
const AX = 35600, AZ = 30000;
const HALF_HOUR = 30 * 60_000, TOURNEY_MS = 10 * 60_000, WEEK = 7 * 24 * 3600_000;

export function registerArena(api, U) {
  const lobby = { x0: AX, z0: AZ, x1: AX + 30, z1: AZ + 20 };
  const pit = { x0: AX + 40, z0: AZ, x1: AX + 90, z1: AZ + 36 };
  const lobbySpawn = { x: AX + 8, z: AZ + 10 };
  api.interior({ id: 'cb_arena_lobby', name: 'Johan Cruijff ArenA', rooms: [{ ...lobby, floor: '#5a5a62', wall: '#c81e2e', h: 4 }] });
  api.interior({
    id: 'cb_arena', name: 'ArenA pitch (safe PvP)', pvp: true, safeDeath: true, respawn: lobbySpawn, wild: 1,
    rooms: [{ ...pit, floor: '#3f7a2a', wall: '#d8d8dc', h: 2.5 }],
    floors: [
      ['#f2f2f2', [AX + 64.7, AZ + 1, AX + 65.3, AZ + 1, AX + 65.3, AZ + 35, AX + 64.7, AZ + 35]],
      ['#4a8a32', [AX + 44, AZ + 4, AX + 52, AZ + 4, AX + 52, AZ + 32, AX + 44, AZ + 32]],
      ['#4a8a32', [AX + 58, AZ + 4, AX + 72, AZ + 4, AX + 72, AZ + 32, AX + 58, AZ + 32]],
      ['#4a8a32', [AX + 78, AZ + 4, AX + 86, AZ + 4, AX + 86, AZ + 32, AX + 78, AZ + 32]],
    ],
  });
  const gate = api.tile(52.3142, 4.9419);
  api.spawnObject({ type: 'cb_arena_gate', x: gate.x, z: gate.z, data: { to: { x: lobbySpawn.x, z: lobbySpawn.z, inside: true, msg: 'You walk through the players\' tunnel into the Johan Cruijff ArenA. The crowd roars!' } } });
  api.spawnObject({ type: 'sign', x: gate.x + 3, z: gate.z + 2, data: { text: 'JOHAN CRUIJFF ArenA - Safe PvP arena. Fight anyone on the pitch without losing items. Tournaments every 30 minutes. Check the leaderboard inside!' } });
  api.spawnObject({ type: 'exit', x: AX + 2, z: AZ + 10, rot: Math.PI / 2, data: { to: { x: gate.x, z: gate.z + 2, inside: false } } });
  api.spawnObject({ type: 'cb_arena_door', x: AX + 29, z: AZ + 10, rot: -Math.PI / 2, data: { to: { x: AX + 44, z: AZ + 18, inside: true, msg: 'You run out onto the pitch. Anyone here can attack you, but nobody loses items.' } } });
  api.spawnObject({ type: 'exit', x: AX + 41, z: AZ + 18, rot: Math.PI / 2, data: { to: { x: AX + 26, z: AZ + 10, inside: true } } });
  api.spawnObject({ type: 'cb_arena_board', x: AX + 15, z: AZ + 2 });
  api.spawnObject({ type: 'bank_booth', x: AX + 20, z: AZ + 2 });
  api.spawnObject({ type: 'bank_booth', x: AX + 21, z: AZ + 2 });
  api.spawnNpc({ name: 'ArenA Steward', at: { x: AX + 12, z: AZ + 6 }, wander: 2, look: { g: 1, skin: 3, hair: 1, top: 5, legs: 5, topC: '#c81e2e' }, eq: { cape: 'ajax_cape' }, talk: 'cb_steward', ex: 'Runs the ArenA rankings. Has seen every kind of fighting style. Mostly bad ones.' });

  // ---- ranking data (world store)
  const W = api.worldStore('combat');
  const A = W.arena ??= { season: 0, players: {}, history: [], tourney: { slot: 0, active: false, scores: {} }, pending: {} };
  A.pending ??= {}; A.history ??= []; A.tourney ??= { slot: 0, active: false, scores: {} };
  const seasonOf = t => Math.floor(t / WEEK);
  const rows = () => Object.entries(A.players).map(([key, r]) => ({ key, ...r })).sort((a, b) => b.pts - a.pts || b.k - a.k);
  const checkSeason = () => {
    const s = seasonOf(api.now());
    if (A.season === s) return;
    if (A.season && Object.keys(A.players).length) {
      A.history.unshift({ season: A.season, top: rows().slice(0, 3).map(r => ({ name: r.name, pts: r.pts, k: r.k })) });
      A.history = A.history.slice(0, 5);
      for (const p of api.players.values()) api.msg(p, `A new ArenA season has started! Last season's champion: ${A.history[0].top[0]?.name || 'nobody'}.`, 'level');
    }
    A.season = s; A.players = {};
    api.touch();
  };
  checkSeason();
  const rec = p => (A.players[p.key] ??= { name: p.name, k: 0, d: 0, pts: 0, streak: 0, best: 0 });
  const recent = new Map(); // "killer>victim" -> time, to stop kill farming
  const inPit = p => api.interiorAt(p.x, p.z)?.id === 'cb_arena';

  api.onDeath((p, killer) => {
    if (!inPit(p) || !killer?.rec || killer === p) return;
    checkSeason();
    const k = rec(killer), v = rec(p);
    const pair = killer.key + '>' + p.key;
    const farmed = recent.get(pair) > api.now() - 3 * 60_000;
    recent.set(pair, api.now());
    const pts = farmed ? 1 : 10 + Math.min(10, v.streak) * 2;
    k.k++; k.pts += pts; k.streak++; k.best = Math.max(k.best, k.streak); k.name = killer.name;
    v.d++; v.streak = 0;
    const t = A.tourney;
    if (t.active && !farmed) { const s = (t.scores[killer.key] ??= { name: killer.name, k: 0 }); s.k++; }
    api.msg(killer, `You defeated ${p.name} in the ArenA: +${pts} ranking points${farmed ? ' (repeat kill)' : ''}. Streak: ${k.streak}.`, 'duel');
    if (k.streak === 5 || k.streak === 10) for (const v2 of api.players.values()) if (v2.region === 'int_cb_arena' || v2.region === 'int_cb_arena_lobby') api.msg(v2, `${killer.name} is on a ${k.streak}-kill streak in the ArenA!`, 'duel');
    api.touch();
  });

  // ---- the region: friendly message instead of the Wilderness warning, and the board update
  api.onRegionChange((p, r, old) => {
    if (r.id === 'int_cb_arena') {
      p.cbWarned = p.warnedWild; p.warnedWild = true;
      api.msg(p, 'ArenA pitch: anyone here may attack you, but you keep all your items when you die.', 'duel');
    } else if (old === 'int_cb_arena') p.warnedWild = p.cbWarned || false;
  });

  // ---- leaderboard window
  const board = p => {
    checkSeason();
    const all = rows();
    const me = A.players[p.key];
    const t = A.tourney, now = api.now();
    const nextSlot = (Math.floor(now / HALF_HOUR) + 1) * HALF_HOUR;
    api.send(p, {
      t: 'combat:arena', season: A.season, seasonEnds: (A.season + 1) * WEEK,
      top: all.slice(0, 10).map(r => ({ name: r.name, k: r.k, d: r.d, pts: r.pts, best: r.best })),
      you: me ? { rank: all.findIndex(r => r.key === p.key) + 1, ...me } : null,
      tourney: { active: t.active, endsAt: t.active ? t.endsAt : 0, nextAt: t.active ? 0 : nextSlot, top: Object.values(t.scores).sort((a, b) => b.k - a.k).slice(0, 5), last: t.last || null },
      history: A.history,
    });
  };
  api.objectAction('cb_arena_board', 'Check', board);
  api.command('arena', board);
  api.dialogAction('cb_arena_board', p => { board(p); return 'stop'; });
  api.dialog('cb_steward', {
    start: [
      { npc: 'Welkom in de Johan Cruijff ArenA! Out on the pitch, anyone can fight anyone. Nobody loses their items here, only their pride.' },
      { opts: [['Show me the rankings.', 'board'], ['How do tournaments work?', 'tour'], ['How do I earn points?', 'pts'], ['Bye.', 'end']] },
    ],
    board: [{ act: 'cb_arena_board' }],
    tour: [
      { player: 'How do tournaments work?' },
      { npc: 'Every half hour a ten-minute tournament starts. Whoever scores the most kills on the pitch wins coins, bonus ranking points and the champion cape.' },
      { npc: '"Every disadvantage has its advantage," Johan used to say. Losing means you get to stand up again and try once more.' },
      { goto: 'start2' },
    ],
    pts: [
      { player: 'How do I earn points?' },
      { npc: 'Ten points per kill, plus a bonus for ending someone\'s kill streak. Beating the same player over and over earns almost nothing. Seasons last a week.' },
      { goto: 'start2' },
    ],
    start2: [{ opts: [['Show me the rankings.', 'board'], ['How do tournaments work?', 'tour'], ['Bye.', 'end']] }],
  });

  // ---- tournaments: every 30 minutes, 10 minutes long; the winner gets coins, points and the champion cape
  const broadcast = (text, kind = 'duel') => { for (const p of api.players.values()) api.msg(p, text, kind); };
  const reward = (key, name) => {
    const p = [...api.players.values()].find(q => q.key === key);
    if (!p) { (A.pending[key] ??= []).push(name); return; }
    deliver(p);
  };
  const deliver = p => {
    api.giveOrDrop(p, 'coins', 5000);
    const r = rec(p); r.pts += 25;
    const owned = api.hasItem(p, 'arena_champion_cape') || p.rec.equip.cape?.id === 'arena_champion_cape' || p.rec.bank.some(b => b.id === 'arena_champion_cape');
    if (!owned) api.giveOrDrop(p, 'arena_champion_cape', 1);
    api.msg(p, 'You won the ArenA tournament! You receive 5,000 coins, 25 bonus ranking points' + (owned ? '.' : ' and the ArenA champion cape!'), 'level');
  };
  api.onLogin(p => {
    const list = A.pending[p.key];
    if (!list) return;
    delete A.pending[p.key];
    for (let i = 0; i < list.length; i++) deliver(p);
  });
  const startTourney = (slot, ms = TOURNEY_MS) => {
    const t = A.tourney;
    Object.assign(t, { slot, active: true, scores: {}, endsAt: api.now() + ms, announced: slot });
    broadcast('The ArenA tournament has begun! Most kills on the pitch in the next ' + Math.round(ms / 60000) + ' minutes wins. Go to the Johan Cruijff ArenA!');
  };
  const endTourney = () => {
    const t = A.tourney;
    t.active = false;
    const top = Object.entries(t.scores).sort((a, b) => b[1].k - a[1].k)[0];
    if (!top) { t.last = null; broadcast('The ArenA tournament has ended without any kills. Nobody wins.'); return; }
    t.last = { name: top[1].name, k: top[1].k };
    broadcast(`The ArenA tournament is over! ${top[1].name} wins with ${top[1].k} kill${top[1].k > 1 ? 's' : ''}.`, 'level');
    reward(top[0], top[1].name);
    api.touch();
  };
  api.onTick(tick => {
    if (tick % 5) return;
    checkSeason();
    const now = api.now(), t = A.tourney;
    const slot = Math.floor(now / HALF_HOUR) * HALF_HOUR;
    if (t.active) { if (now >= t.endsAt) endTourney(); return; }
    if (t.slot !== slot && now < slot + TOURNEY_MS && !t.manual) { startTourney(slot, slot + TOURNEY_MS - now); return; }
    const next = slot + HALF_HOUR;
    if (now >= next - 5 * 60_000 && t.warned !== next) { t.warned = next; broadcast('The next ArenA tournament starts in 5 minutes at the Johan Cruijff ArenA (safe PvP, no item loss)!'); }
  });
  if (api.DEV) api.command('arenatourney', (p, [op, secs]) => {
    if (op === 'start') { A.tourney.manual = false; startTourney(A.tourney.slot, (+secs || 60) * 1000); }
    else if (op === 'end') { A.tourney.endsAt = 0; }
  });

  return { lobby, pit, gate, lobbySpawn };
}
