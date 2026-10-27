// Collection log (first time you obtain each tracked item) and the Amsterdam Diary (easy/medium/hard tasks with
// Amsterdams Wapen cape rewards from the Stadsarchivaris).
import { CONTENT_PACKS, BASE_ITEM_IDS, SKILLS } from '../../../shared/items.js';
import { REGIONS } from '../../../shared/regions.js';

const CATS = ['Bosses', 'Wilderness', 'Rare drops', 'Clue scrolls', 'Quests', 'Skilling', 'Combat', 'Treasure', 'Amsterdam'];
const TREASURE = ['kings_crown', 'canal_ring', 'ajax_cape', 'bike_key', 'bike_bell', 'tulip', 'clogs', 'leather_jacket', 'mithril_scimitar'];
const SKIP = new Set(['coins', 'ov_fiets', 'parkeerboete']);

export default function achievements(api, E) {
  const { ITEMS } = api;

  // ---------------------------------------------------------------- collection log
  let log = null; // { cats: [{ name, items }], of: { id: cat } }
  function buildLog() {
    const of = {};
    const put = (id, cat, force) => { if (!ITEMS[id] || SKIP.has(id)) return; if (force || !of[id]) of[id] = cat; };
    const owner = {};
    for (const [pack, mod] of Object.entries(CONTENT_PACKS)) for (const id of Object.keys(mod.ITEMS || {})) owner[id] = pack;
    // categories from monster drop tables: bosses, Wilderness monsters, rare drops
    for (const n of api.npcs) {
      const d = n.def.drops;
      if (!d || typeof d !== 'object') continue;
      const wild = api.wildLevel(n.def.at.x, n.def.at.z) > 0 || api.interiorAt(n.def.at.x, n.def.at.z)?.wild;
      const ids = [...(d.table || []).map(r => r[1]), ...(d.rare || []).map(r => r[1]), ...(d.always || []).map(r => r[0])].filter(id => id && owner[id] === 'combat');
      if (n.def.combat?.boss) for (const id of ids) put(id, 'Bosses', true);
      else if (wild) for (const id of ids) put(id, 'Wilderness');
      for (const [oneIn, id] of d.rare || []) if (oneIn >= 50 && owner[id]) put(id, n.def.combat?.boss ? 'Bosses' : 'Rare drops');
    }
    for (const [id, pack] of Object.entries(owner)) {
      const def = ITEMS[id];
      if (def.clog === false) { delete of[id]; continue; }
      if (typeof def.clog === 'string') { of[id] = def.clog; continue; }
      if (/clue|casket|treasure_trail/.test(id)) { put(id, 'Clue scrolls', true); continue; }
      if (pack === 'quests') put(id, 'Quests');
      else if (pack === 'gathering' || pack === 'production') put(id, 'Skilling');
      else if (pack === 'combat') put(id, /wild|bijlmer|zuidoost/.test(id) ? 'Wilderness' : 'Combat');
      else if (pack === 'economy') put(id, 'Amsterdam');
      else if (pack === 'atmosphere') put(id, 'Amsterdam');
    }
    for (const id of TREASURE) if (BASE_ITEM_IDS.includes(id)) put(id, 'Treasure');
    const names = [...new Set([...CATS, ...Object.values(of)])];
    const cats = names.map(name => ({ name, items: Object.keys(of).filter(id => of[id] === name).sort((a, b) => ITEMS[a].value - ITEMS[b].value) })).filter(c => c.items.length);
    log = { cats, of };
  }
  const clog = p => (E.ps(p).clog ??= {});
  const sendLog = p => { if (!log) buildLog(); api.send(p, { t: 'eco_clog', cats: log.cats, got: clog(p) }); };
  E.clogCount = p => Object.keys(clog(p)).filter(id => log?.of[id]).length;

  api.onPlayerTick(p => {
    if (!log) buildLog();
    const got = clog(p);
    let fresh = null;
    const check = s => {
      if (!s || got[s.id] || !log.of[s.id]) return;
      got[s.id] = Date.now();
      (fresh ??= []).push(s.id);
    };
    for (const s of p.rec.inv) check(s);
    for (const s of Object.values(p.rec.equip)) check(s);
    if (!fresh) return;
    for (const id of fresh) api.msg(p, `New item added to your collection log: ${ITEMS[id].name}`, 'level');
    api.send(p, { t: 'eco_clog_new', ids: fresh, got });
    api.touch();
    E.emit(p, 'clog');
  });

  // ---------------------------------------------------------------- Amsterdam Diary
  const sumLv = p => SKILLS.reduce((s, k) => s + api.lv(p, k), 0);
  const maxLv = p => Math.max(...SKILLS.filter(s => s !== 'hitpoints').map(s => api.lv(p, s)));
  const questsDone = p => Object.keys(p.rec.quests || {}).filter(id => api.questDone(p, id)).length;
  const D = p => {
    const d = (E.ps(p).diary ??= {});
    d.done ??= {}; d.regions ??= {}; d.kills ??= 0; d.bosses ??= 0; d.claimed ??= {}; d.ev ??= {};
    return d;
  };
  const visitable = REGIONS.filter(r => r.type !== 'wild').map(r => r.id);
  const TASKS = [
    // easy
    { id: 'dam', tier: 'easy', text: 'Visit Dam Square.', check: (p, d) => d.regions.dam },
    { id: 'vondel', tier: 'easy', text: 'Take a stroll in the Vondelpark.', check: (p, d) => d.regions.vondelpark },
    { id: 'cuyp', tier: 'easy', text: 'Visit the Albert Cuypmarkt.', check: (p, d) => d.regions.albertcuyp },
    { id: 'card', tier: 'easy', text: 'Buy an OV-chipkaart.', check: (p, d) => d.ev.card },
    { id: 'ferry', tier: 'easy', text: 'Take the free ferry across the IJ.', check: (p, d) => d.ev.ferry },
    { id: 'offer', tier: 'easy', text: 'Place an offer on the Grand Exchange.', check: (p, d) => d.ev.ge_offer },
    { id: 'kill1', tier: 'easy', text: 'Defeat any monster.', check: (p, d) => d.kills >= 1 },
    { id: 'lvl10', tier: 'easy', text: 'Reach level 10 in any skill.', check: p => maxLv(p) >= 10 },
    // medium
    { id: 'train', tier: 'medium', text: 'Travel by NS train.', check: (p, d) => d.ev.ns },
    { id: 'metro', tier: 'medium', text: 'Ride the GVB metro.', check: (p, d) => d.ev.metro },
    { id: 'bike', tier: 'medium', text: 'Rent an OV-fiets and ride it.', check: (p, d) => d.ev.bike },
    { id: 'trade', tier: 'medium', text: 'Complete a trade on the Grand Exchange.', check: (p, d) => d.ev.ge_trade },
    { id: 'artis', tier: 'medium', text: 'Visit Artis, the Rijksmuseum and the Westergasfabriek.', check: (p, d) => d.regions.artis && d.regions.rijksmuseum && d.regions.westergasfabriek },
    { id: 'noord', tier: 'medium', text: 'Visit Amsterdam-Noord.', check: (p, d) => d.regions.noord },
    { id: 'kill25', tier: 'medium', text: 'Defeat 25 monsters.', check: (p, d) => d.kills >= 25 },
    { id: 'quest1', tier: 'medium', text: 'Complete a quest.', check: p => questsDone(p) >= 1 },
    { id: 'total150', tier: 'medium', text: 'Reach a total level of 150.', check: p => sumLv(p) >= 150 },
    // hard
    { id: 'wild', tier: 'hard', text: 'Take the train to Bijlmer ArenA in the Wilderness.', check: (p, d) => d.ev.bijlmer },
    { id: 'allregions', tier: 'hard', text: `Visit every named region of Amsterdam (${visitable.length}).`, check: (p, d) => visitable.every(id => d.regions[id]), progress: (p, d) => `${visitable.filter(id => d.regions[id]).length}/${visitable.length}` },
    { id: 'boss', tier: 'hard', text: 'Defeat a boss.', check: (p, d) => d.bosses >= 1 },
    { id: 'kill250', tier: 'hard', text: 'Defeat 250 monsters.', check: (p, d) => d.kills >= 250, progress: (p, d) => `${d.kills}/250` },
    { id: 'lvl50', tier: 'hard', text: 'Reach level 50 in any skill.', check: p => maxLv(p) >= 50 },
    { id: 'quest5', tier: 'hard', text: 'Complete 5 quests.', check: p => questsDone(p) >= 5, progress: p => `${questsDone(p)}/5` },
    { id: 'clog30', tier: 'hard', text: 'Fill 30 slots of your collection log.', check: p => E.clogCount(p) >= 30, progress: p => `${E.clogCount(p)}/30` },
  ];
  const TIERS = ['easy', 'medium', 'hard'];
  const CAPE = { easy: 'amsterdams_wapen_1', medium: 'amsterdams_wapen_2', hard: 'amsterdams_wapen_3' };
  const tierDone = (d, tier) => TASKS.filter(t => t.tier === tier).every(t => d.done[t.id]);

  function sendDiary(p) {
    const d = D(p);
    api.send(p, { t: 'eco_diary', tasks: TASKS.map(t => ({ id: t.id, tier: t.tier, text: t.text, done: !!d.done[t.id], progress: t.progress && !d.done[t.id] ? t.progress(p, d) : null })), claimed: d.claimed });
  }
  E.sendDiary = sendDiary;

  function evaluate(p) {
    const d = D(p);
    let changed = false;
    for (const t of TASKS) {
      if (d.done[t.id]) continue;
      let ok = false;
      try { ok = !!t.check(p, d); } catch { ok = false; }
      if (!ok) continue;
      d.done[t.id] = Date.now(); changed = true;
      api.msg(p, `Well done! You have completed ${t.tier === 'easy' ? 'an' : 'a'} ${t.tier} task in the Amsterdam Diary: ${t.text}`, 'level');
      if (tierDone(d, t.tier)) api.msg(p, `Congratulations! You have completed all of the ${t.tier} tasks in the Amsterdam Diary. Speak to the Stadsarchivaris at the Stadsarchief (Vijzelstraat) to claim your reward.`, 'level');
    }
    if (changed) { api.touch(); sendDiary(p); }
  }

  for (const ev of ['card', 'ferry', 'ge_offer', 'ge_trade', 'ns', 'metro', 'bike']) E.on(ev, (p, data) => {
    const d = D(p);
    d.ev[ev] = true;
    if (ev === 'ns' && data?.to === 'bijlmer') d.ev.bijlmer = true;
    evaluate(p);
  });
  E.on('clog', p => evaluate(p));
  api.onRegionChange((p, r) => { D(p).regions[r.id] = true; evaluate(p); });
  api.onNpcDeath((npc, killer) => {
    if (!killer?.rec) return;
    const d = D(killer);
    d.kills++;
    if (npc.def.combat?.boss) d.bosses++;
    evaluate(killer);
  });
  api.onPlayerTick(p => { if ((api.tick + p.id) % 10 === 0) evaluate(p); });
  api.onLogin(p => { D(p).regions[p.region] = true; sendLog(p); sendDiary(p); });

  // ---- rewards from the Stadsarchivaris
  function claim(p) {
    const d = D(p);
    let gave = 0;
    for (const tier of TIERS) {
      if (!tierDone(d, tier)) continue;
      const id = CAPE[tier];
      const owned = api.hasItem(p, id) || p.rec.equip.cape?.id === id || p.rec.bank.some(b => b.id === id);
      if (d.claimed[tier] && owned) continue;
      if (!api.canAdd(p, id, 1)) { api.msg(p, "You don't have enough inventory space."); break; }
      api.invAdd(p, id, 1);
      if (!d.claimed[tier]) {
        d.claimed[tier] = Date.now();
        if (tier === 'easy') api.giveOrDrop(p, 'stroopwafel_tin', 1);
        if (tier === 'medium') api.giveOrDrop(p, 'coins', 5000);
        if (tier === 'hard') api.giveOrDrop(p, 'coins', 25000);
      }
      gave++;
    }
    api.touch();
    sendDiary(p);
    return gave;
  }
  const sa = api.tile(52.36370, 4.8913);
  api.spawnNpc({ name: 'Stadsarchivaris', type: 'stadsarchivaris', at: sa, look: { g: 1, skin: 0, hair: 5, top: 4, legs: 5, topC: '#5a2d2d' }, talk: 'stadsarchivaris', actions: ['Diary'], ex: 'Keeper of the Stadsarchief. Has every document since 1275, alphabetised.' });
  api.npcAction('stadsarchivaris', 'Diary', p => { sendDiary(p); api.send(p, { t: 'eco_diary_open' }); });
  api.dialogAction('diary_claim', p => claim(p) ? 'claimed' : 'nothing');
  api.dialog('stadsarchivaris', {
    start: [
      { npc: 'Welkom in het Stadsarchief. I keep the Amsterdam Diary: proof of everything a true Amsterdammer has done.' },
      { opts: [['I would like to claim a reward.', 'claim'], ['What are the rewards?', 'rewards'], ['Show me my diary.', 'show'], ['Bye.', 'end']] },
    ],
    claim: [{ act: 'diary_claim' }],
    claimed: [{ npc: 'Here you are: the Amsterdams Wapen. Wear it with pride. Heldhaftig, Vastberaden, Barmhartig!' }],
    nothing: [{ npc: 'You have nothing to claim right now. Finish all the tasks of a tier first. Lost a cape? Come back without one and I will replace it.' }],
    rewards: [
      { player: 'What are the rewards?' },
      { npc: 'Easy: the Amsterdams Wapen cape, 10% off train and metro fares, and a stroopwafel tin.' },
      { npc: 'Medium: a better cape, free OV-fiets rental and 5,000 coins. Hard: the full coat of arms, which can take you to the Dam once every ten minutes, and 25,000 coins.' },
      { goto: 'start' },
    ],
    show: [{ act: p => { sendDiary(p); api.send(p, { t: 'eco_diary_open' }); return 'end'; } }],
  });

  api.command('diary', p => { sendDiary(p); api.send(p, { t: 'eco_diary_open' }); });
  api.command('clog', p => { sendLog(p); api.send(p, { t: 'eco_clog_open' }); });
  api.onMessage('eco_ach', (p, m) => { if (m.op === 'diary') sendDiary(p); if (m.op === 'clog') sendLog(p); });
}
