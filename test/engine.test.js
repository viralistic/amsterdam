// End-to-end tests for the core engine: run with `npm test`. Starts a real server in offline map mode
// and drives it with headless bot clients.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Bot } from './bot.js';
import { toTile, toLatLon } from '../shared/geo.js';
import { REGIONS } from '../shared/regions.js';

const PORT = 3400 + Math.floor(Math.random() * 400);
let server;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amsescape-test-'));
const uniq = () => 'T' + Math.random().toString(36).slice(2, 9);
const sleep = ms => new Promise(r => setTimeout(r, ms));

before(async () => {
  server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT, FAKE_MAP: '1', DATA_DIR: dataDir, LOGIN_LIMIT: '1000' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', d => { if (String(d).includes('running')) resolve(); });
    server.stderr.on('data', d => process.stderr.write(d));
    server.on('exit', c => reject(new Error('server exited ' + c)));
  });
});
after(() => server.kill());

const newBot = async (name = uniq()) => new Bot(PORT).connect({ create: true, name, pass: 'secret123', look: {} });

test('accounts: create, duplicate name, wrong password, login', async () => {
  const name = uniq();
  const a = await newBot(name);
  a.close();
  await assert.rejects(new Bot(PORT).connect({ create: true, name, pass: 'secret123' }), /taken/);
  await assert.rejects(new Bot(PORT).connect({ name, pass: 'wrongpass' }), /Invalid/);
  await assert.rejects(new Bot(PORT).connect({ create: true, name: 'bad name!!', pass: 'secret123' }), /Usernames/);
  const b = await new Bot(PORT).connect({ name, pass: 'secret123' });
  assert.equal(b.state.name, name);
  b.close();
});

test('walking follows a valid path and rejects teleport paths', async () => {
  const b = await newBot();
  await b.ticks(1);
  const { x, z } = b.state.you;
  b.send({ t: 'walk', path: [[x + 1, z], [x + 2, z], [x + 3, z]] });
  await b.ticks(5);
  assert.deepEqual([b.state.you.x, b.state.you.z], [x + 3, z]);
  b.send({ t: 'walk', path: [[x + 50, z]] });
  await b.ticks(3);
  assert.equal(b.state.you.x, x + 3, 'a 50-tile jump must be ignored');
  b.close();
});

test('dialogue gives the starter kit once', async () => {
  const b = await newBot();
  await b.ticks(1);
  const guide = b.npc('Gemeente Gids');
  b.send({ t: 'act', kind: 'npc', id: guide.id, action: 'talk' });
  let opts = null;
  for (let i = 0; i < 20 && !opts; i++) {
    const m = await b.wait(m => m.t === 'dlg');
    if (m.opts) opts = m.opts; else b.send({ t: 'dlg' });
  }
  b.send({ t: 'dlg', opt: opts.findIndex(o => /starting gear/.test(o)) });
  for (let i = 0; i < 10; i++) { const m = await b.wait(m => m.t === 'dlg' || m.t === 'inv'); if (m.t === 'inv') break; b.send({ t: 'dlg' }); }
  await b.ticks(1);
  assert.equal(b.count('coins'), 25);
  assert.equal(b.count('bronze_dagger'), 1);
  b.close();
});

test('shops: buy and sell', async () => {
  const b = await newBot();
  await b.ticks(1);
  b.say('::give coins 100');
  const henk = b.npc('Haring Henk');
  b.say(`::tele ${henk.x + 1} ${henk.z}`);
  await b.ticks(2);
  b.send({ t: 'act', kind: 'npc', id: henk.id, action: 'trade' });
  await b.wait(m => m.t === 'shop');
  b.send({ t: 'shop', op: 'buy', id: 'herring', qty: 2 });
  await b.ticks(2);
  assert.equal(b.count('herring'), 2);
  assert.equal(b.count('coins'), 100 - 24);
  b.send({ t: 'shop', op: 'sell', slot: b.slotOf('herring'), qty: 1 });
  await b.ticks(2);
  assert.equal(b.count('herring'), 1);
  assert.equal(b.count('coins'), 100 - 24 + 4);
  b.close();
});

test('bank: deposit and withdraw', async () => {
  const b = await newBot();
  await b.ticks(1);
  b.say('::give coins 500');
  const banker = (b.state.ents || []).find(e => e.n === 'Bankier');
  b.say(`::tele ${banker.x + 1} ${banker.z}`);
  await b.ticks(2);
  b.send({ t: 'act', kind: 'npc', id: banker.id, action: 'bank' });
  await b.wait(m => m.t === 'bank');
  b.send({ t: 'bank', op: 'dep', slot: b.slotOf('coins'), qty: 'all' });
  const bank = await b.wait(m => m.t === 'bank');
  assert.equal(bank.items.find(i => i.id === 'coins').q, 500);
  b.send({ t: 'bank', op: 'wd', slot: 0, qty: 200 });
  await b.wait(m => m.t === 'bank');
  await b.ticks(1);
  assert.equal(b.count('coins'), 200);
  b.close();
});

test('trading moves items both ways after two confirmations', async () => {
  const a = await newBot(), b = await newBot();
  await a.ticks(2);
  a.say('::give coins 50'); b.say('::give herring 1');
  await a.ticks(2);
  const pb = a.player(b.state.name);
  a.send({ t: 'act', kind: 'player', id: pb.id, action: 'trade' });
  await b.waitMsg(/wishes to trade/);
  b.send({ t: 'act', kind: 'player', id: a.state.id, action: 'trade' });
  await a.wait(m => m.t === 'trade');
  a.send({ t: 'trade', op: 'offer', slot: a.slotOf('coins'), qty: 50 });
  b.send({ t: 'trade', op: 'offer', slot: b.slotOf('herring'), qty: 1 });
  await a.ticks(1);
  for (let round = 0; round < 2; round++) { a.send({ t: 'trade', op: 'accept' }); b.send({ t: 'trade', op: 'accept' }); await a.ticks(1); }
  await a.ticks(1);
  assert.equal(b.count('coins'), 50);
  assert.equal(a.count('herring'), 1);
  a.close(); b.close();
});

test('real-life mode via GPS and duels between real players', async () => {
  const a = await newBot(), b = await newBot();
  const at = toLatLon(0, 0);
  a.send({ t: 'gps', lat: at.lat, lon: at.lon, acc: 5 });
  b.send({ t: 'gps', lat: at.lat + 0.00003, lon: at.lon, acc: 5 });
  await a.ticks(2);
  assert.equal(a.state.you.real, true);
  const pb = a.player(b.state.name);
  a.send({ t: 'act', kind: 'player', id: pb.id, action: 'challenge' });
  await b.waitMsg(/wishes to duel/);
  b.send({ t: 'act', kind: 'player', id: a.state.id, action: 'challenge' });
  await a.waitMsg(/duelling/);
  for (const bot of [a, b]) { bot.say('::xp attack 13000000'); bot.say('::xp strength 13000000'); }
  const result = await Promise.race([a.waitMsg(/defeated|dead/, 60000), b.waitMsg(/defeated|dead/, 60000)]);
  assert.match(result.text, /defeated|dead/);
  a.close(); b.close();
});

test('Wilderness: PvP between ghosts, skull and item loss', async () => {
  const wild = REGIONS.find(r => r.id === 'wilderness').area;
  const cx = Math.round((wild.x0 + wild.x1) / 2), cz = Math.round((wild.z0 + wild.z1) / 2);
  const a = await newBot(), b = await newBot();
  for (const bot of [a, b]) bot.say(`::tele ${cx} ${cz}`);
  await a.wait(m => m.t === 'region' && m.wild > 0);
  // strong enough to win quickly, close enough in combat level to be allowed to attack
  a.say('::xp attack 37300'); a.say('::xp strength 37300'); a.say('::give mithril_scimitar 1');
  await a.ticks(2);
  a.send({ t: 'inv', op: 'wield', slot: a.slotOf('mithril_scimitar') });
  for (const item of ['iron_sword', 'gouda', 'tulip', 'bike_bell', 'herring']) b.say(`::give ${item} 1`);
  await a.ticks(3);
  const pb = a.player(b.state.name);
  b.send({ t: 'style', retaliate: false });
  a.send({ t: 'act', kind: 'player', id: pb.id, action: 'attack' });
  await a.waitMsg(/skulled/);
  await b.waitMsg(/dead/, 60000);
  await b.ticks(2);
  const kept = (b.state.inv || []).filter(Boolean).map(s => s.id).sort();
  assert.equal(kept.length, 3, 'unskulled victim keeps 3 items');
  assert.ok(kept.includes('iron_sword') && kept.includes('bike_bell') && kept.includes('gouda'), 'keeps the most valuable');
  await a.ticks(2);
  const loot = (a.state.items || []).map(i => i.i);
  assert.ok(loot.includes('tulip') && loot.includes('herring'), 'killer sees the dropped loot');
  a.close(); b.close();
});

test('cannot attack players outside the Wilderness', async () => {
  const a = await newBot(), b = await newBot();
  await a.ticks(2);
  const pb = a.player(b.state.name);
  a.send({ t: 'act', kind: 'player', id: pb.id, action: 'attack' });
  await a.waitMsg(/only attack other players in the Wilderness/);
  a.close(); b.close();
});

test('combat styles and quest list messages', async () => {
  const b = await newBot();
  b.send({ t: 'style', style: 'aggressive' });
  const st = await b.wait(m => m.t === 'style');
  assert.equal(st.style, 'aggressive');
  b.send({ t: 'quests' });
  const q = await b.wait(m => m.t === 'quests');
  assert.ok(Array.isArray(q.list));
  b.close();
});
