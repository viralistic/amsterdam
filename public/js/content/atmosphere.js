// Client side of the "atmosphere" pack: procedural sound effects, music and ambience, real-time day/night and
// weather, animated canals, street furniture, the Music and Sound & display tabs and the world map overview.
// Debug/test handle: registry.atmosphere (forceHour, forceWeather, ringBells(), playTrack(id), showWorldMap(), log).
import { registry } from '../registry.js';
import { atmo, myEntity, sweepChunks } from './atmosphere/common.js';
import { sfx, ready } from './atmosphere/audio.js';
import { autoMusic } from './atmosphere/music.js';
import { ambienceFrame } from './atmosphere/ambience.js';
import { skyFrame, patchBuildings } from './atmosphere/sky.js';
import { waterDecorator, waterFrame } from './atmosphere/water.js';
import { furnitureDecorator, furnitureFrame } from './atmosphere/furniture.js';
import './atmosphere/settings.js';

registry.sfx = id => sfx(id);
atmo.sfx = sfx;

// ---- region changes drive the music
registry.msgHandlers['region:client'] = (m, ctx) => {
  atmo.region = m;
  autoMusic(m, atmo.light.lamp > 0.6);
};
// server-side ::time / ::weather commands (server/systems/atmosphere.js)
registry.msgHandlers.atmo = (m, ctx) => {
  if ('hour' in m) atmo.forceHour = m.hour;
  if ('weather' in m) atmo.forceWeather = m.weather;
};

// ---- world decoration
registry.chunkDecorators.push((chunk, data, group, THREE, ctx) => { patchBuildings(group); });
registry.chunkDecorators.push(waterDecorator);
registry.chunkDecorators.push(furnitureDecorator);

// ---- skilling sounds follow the player's animation, timed to the swing of the arms in model.js
const SWING = 7; // rad/s of the chop/mine/smith arm swing
const EVERY = { fish: 2.6, cook: 1.8, craft: 0.9, pray: 4, pick: 1.2, farm: 1.4, attack: 0 };
let lastAnim = null, lastSwing = -1, lastAt = 0, wasNight = null, lastInside = null, lastCoins = null, lastSweep = 0, lastIface = null, lastTp = 0, started = 0;
function skillSounds(now, ctx) {
  const me = myEntity(ctx);
  const a = me?.a || null;
  if (a !== lastAnim) { lastAnim = a; lastSwing = -1; lastAt = 0; if (a === 'pray') sfx('pray'); if (a === 'cook') { sfx('cook'); lastAt = now; } }
  if (!a) return;
  if (a === 'chop' || a === 'mine' || a === 'smith') {
    // the arm comes down when sin(t * 7) reaches -1
    const k = Math.floor((now / 1000 * SWING - 1.5 * Math.PI) / (2 * Math.PI));
    if (k !== lastSwing) { if (lastSwing !== -1) sfx(a, { vol: 0.8 }); lastSwing = k; }
    return;
  }
  const every = EVERY[a];
  if (every && now - lastAt > every * 1000) { lastAt = now; sfx(a === 'cook' ? 'cook' : a, { vol: 0.8 }); if (a === 'cook' && Math.random() < 0.4) sfx('fire', { vol: 0.5 }); }
}

function stateSounds(now, ctx) {
  const S = ctx.S;
  const door = lastInside !== null && S.inside !== lastInside;
  if (door) { sfx('door'); lastTp = now; }
  lastInside = S.inside;
  const coins = (S.inv || []).reduce((n, s) => n + (s?.id === 'coins' ? s.q : 0), 0);
  if (lastCoins !== null && coins > lastCoins && now - started > 3000) sfx('coins');
  lastCoins = coins;
  if (S.iface !== lastIface) { if (S.iface === 'bank') sfx('bank'); else if (S.iface === 'shop') sfx('coins', { vol: 0.5 }); lastIface = S.iface; }
  const me = myEntity(ctx);
  if (me?.tp && now - lastTp > 1500) { lastTp = now; sfx('teleport'); }
  // music switches between the day and night city tracks
  const night = atmo.light.lamp > 0.6;
  if (wasNight !== null && night !== wasNight && atmo.region) autoMusic(atmo.region, night);
  wasNight = night;
}

// chat lines that deserve a sound
const CHAT_SFX = [[/^You (eat|munch)/i, 'eat'], [/^You drink/i, 'drink'], [/^You (bury|pray)/i, 'pray'], [/door|gate|You (climb|go) (up|down)/i, 'door'], [/^You light/i, 'fire']];
function watchChat() {
  const box = document.getElementById('chat-lines');
  if (!box) return;
  new MutationObserver(list => {
    for (const m of list) for (const n of m.addedNodes) {
      const t = n.textContent || '';
      if (n.className === 'public') continue;
      for (const [re, id] of CHAT_SFX) if (re.test(t)) { if (id) sfx(id, { vol: 0.8 }); break; }
    }
  }).observe(box, { childList: true });
}
watchChat();

// soft clicks on the interface
document.addEventListener('click', e => {
  if (!ready()) return;
  if (e.target.closest?.('#side-tabs button, #side-panel button, #window button, #chat-tabs button, #chat-dialog .opt, #chat-dialog .cont, #ctxmenu .it, .make-it')) sfx('click');
}, true);

registry.frameHooks.push((now, ctx) => {
  if (!ctx) return;
  atmo.ctx = ctx;
  started ||= now;
  skyFrame(now, ctx);
  waterFrame(now);
  furnitureFrame();
  if (now - lastSweep > 2000 && ctx.renderer) { lastSweep = now; sweepChunks(ctx.renderer.world); }
  if (!ready()) return;
  skillSounds(now, ctx);
  stateSounds(now, ctx);
  ambienceFrame(now, ctx);
});
