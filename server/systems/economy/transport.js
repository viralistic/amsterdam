// Public transport: NS trains, GVB metro and free IJ ferries, paid with an OV-chipkaart balance, plus OV-fiets
// bike rental. Travel is a teleport, so real-life players (who must really go there) are refused by api.canTeleport.
import { STATIONS, METRO_STOPS, METRO_LINES, FERRIES, OVFIETS } from '../../../shared/content/economy/places.js';
import { fmt } from './common.js';

const CARD_PRICE = 75, BIKE_FEE = 40, FINE = 50;
const TOPUPS = [50, 100, 250, 1000];

export default function transport(api, E) {
  const at = s => api.tile(s.lat, s.lon);
  const balance = p => E.ps(p).ov || 0;
  const setBalance = (p, n) => { E.ps(p).ov = Math.max(0, Math.round(n)); api.touch(); };
  const hasCard = p => api.hasItem(p, 'ov_chipkaart');
  const wapen = p => { let t = 0; for (const s of [...p.rec.inv, p.rec.equip.cape]) { const w = s && api.ITEMS[s.id]?.wapen; if (w > t) t = w; } return t; };
  E.wapen = wapen;
  const dist = (a, b) => { const A = at(a), B = at(b); return Math.hypot(A.x - B.x, A.z - B.z); };
  const discount = p => wapen(p) >= 1 ? 0.9 : 1;
  const fareNs = (p, a, b) => Math.round((12 + dist(a, b) / 100) * discount(p));
  const fareMetro = (p, a, b) => Math.round((4 + dist(a, b) / 250) * discount(p));
  const nsById = Object.fromEntries(STATIONS.map(s => [s.id, s]));
  const metroById = Object.fromEntries(METRO_STOPS.map(s => [s.id, s]));

  // ---- world objects
  for (const s of STATIONS) {
    const t = at(s);
    api.spawnObject({ type: 'ns_gate', x: t.x, z: t.z, data: { station: s.id } });
    api.spawnObject({ type: 'ns_gate', x: t.x + 1, z: t.z, data: { station: s.id } });
    api.spawnObject({ type: 'ns_machine', x: t.x - 3, z: t.z, rot: 0, data: { station: s.id } });
    api.spawnObject({ type: 'station_sign', x: t.x + 3, z: t.z + 1, data: { text: `${s.name}. NS trains to: ${STATIONS.filter(o => o !== s).map(o => o.name.replace('Amsterdam ', '')).join(', ')}.${s.wild ? ' WARNING: this station is in the Wilderness!' : ''}` } });
  }
  for (const s of METRO_STOPS) {
    const t = at(s);
    api.spawnObject({ type: 'metro_entrance', x: t.x, z: t.z, data: { stop: s.id } });
    api.spawnObject({ type: 'gvb_machine', x: t.x + 2, z: t.z, data: { stop: s.id } });
  }
  for (const f of FERRIES) {
    const t = at(f);
    api.spawnObject({ type: 'ferry_pier', x: t.x, z: t.z, rot: f.id === 'f_centraal' ? Math.PI : 0, data: { ferry: f.id } });
  }
  for (const r of OVFIETS) {
    const t = api.tile(r.lat, r.lon);
    api.spawnObject({ type: 'ovfiets_rack', x: t.x, z: t.z, data: { at: r.at } });
  }

  // NPCs at Centraal
  const cs = at(nsById.centraal);
  const L = (g, skin, hair, top, legs, topC) => ({ g, skin, hair, top, legs, topC });
  api.spawnNpc({ name: 'NS Conducteur', type: 'ns_conducteur', at: { x: cs.x + 2, z: cs.z + 2 }, look: L(0, 2, 0, 1, 5, '#003082'), eq: { head: 'flat_cap' }, talk: 'ns_conducteur', ex: 'Knows every delay by heart. "Door een seinstoring..."', chatter: ['Instappen alstublieft!', 'Check in! Check out!', 'Due to a signal failure...'] });
  const mc = at(metroById.centraal);
  api.spawnNpc({ name: 'GVB Medewerker', type: 'gvb_medewerker', at: { x: mc.x + 1, z: mc.z + 2 }, look: L(1, 4, 3, 1, 5, '#1a1a1a'), talk: 'gvb_medewerker', ex: 'Works for the GVB. Has seen things on the night bus.' });
  const fc = at(FERRIES[0]);
  api.spawnNpc({ name: 'Pontschipper', type: 'pontschipper', at: { x: fc.x + 3, z: fc.z }, look: L(0, 0, 5, 1, 5, '#e8e8f0'), eq: { head: 'flat_cap' }, talk: 'pontschipper', wander: 1, ex: 'Steers the IJ ferry. Has rescued 400 bikes from the water.', chatter: ['Pont vertrekt!', 'Free ferry, free ferry!'] });

  // ---- OV-chipkaart
  function buyCard(p) {
    if (hasCard(p)) return api.msg(p, 'You already have an OV-chipkaart.');
    if (!api.canAdd(p, 'ov_chipkaart', 1)) return api.msg(p, "You don't have enough inventory space.");
    if (!api.invRemove(p, 'coins', CARD_PRICE)) return api.msg(p, `An OV-chipkaart costs ${CARD_PRICE} coins.`);
    api.invAdd(p, 'ov_chipkaart', 1);
    api.msg(p, `You buy an OV-chipkaart for ${CARD_PRICE} coins. Your balance is ${fmt(balance(p))} coins. Top it up at any ticket machine.`);
    E.emit(p, 'card');
  }
  function topUpDialog(p, machine) {
    if (!hasCard(p)) {
      return api.startDialog(p, null, {
        start: [{ npc: `You need an OV-chipkaart first. Buy one for ${CARD_PRICE} coins?` }, { opts: [['Yes, buy a card.', 'buy'], ['No thanks.', 'end']] }],
        buy: [{ act: pl => { buyCard(pl); return 'end'; } }],
      }, machine);
    }
    const sc = { start: [{ npc: () => `Saldo: ${fmt(balance(p))} coins. How much would you like to top up?` }, { opts: [...TOPUPS.map(n => [`${n} coins`, 't' + n]), ['Cancel', 'end']] }] };
    for (const n of TOPUPS) sc['t' + n] = [{ act: pl => {
      if (!api.invRemove(pl, 'coins', n)) { api.msg(pl, "You don't have enough coins."); return 'end'; }
      setBalance(pl, balance(pl) + n);
      api.msg(pl, `*piep* You top up ${n} coins. Your new balance is ${fmt(balance(pl))} coins.`);
      return 'end';
    } }];
    api.startDialog(p, null, sc, machine);
  }
  const checkBalance = p => api.msg(p, hasCard(p) ? `*piep* Saldo: ${fmt(balance(p))} coins.` : "You don't have an OV-chipkaart.");
  for (const type of ['ns_machine', 'gvb_machine']) {
    const label = api.OBJECT_TYPES[type].name;
    api.objectAction(type, 'Top-up', p => topUpDialog(p, label));
    api.objectAction(type, 'Buy-card', p => buyCard(p));
    api.objectAction(type, 'Check-balance', p => checkBalance(p));
  }
  api.itemOp('Check-balance', (p, slot, item) => item.id === 'ov_chipkaart' ? checkBalance(p) : false);

  // ---- travel
  function travel(p, kind, from, to, fare) {
    const label = { ns: 'train', metro: 'metro', ferry: 'ferry' }[kind];
    if (!api.canTeleport(p)) return;
    if (fare > 0) {
      if (!hasCard(p)) return api.msg(p, 'You need an OV-chipkaart to travel. Buy one at a ticket machine.');
      if (balance(p) < fare) return api.msg(p, `*PIEP PIEP* Your balance is too low (${fmt(balance(p))} coins, the fare is ${fare}). Top up at a ticket machine.`, 'warn');
      api.msg(p, `*piep* You check in at ${from.name}.`);
    }
    if (p.ecoRide) E.stopRide?.(p, true);
    const t = at(to);
    api.teleport(p, t.x, t.z + 2, { inside: false });
    api.send(p, { t: 'eco_travel', kind, to: to.name });
    if (fare > 0) {
      setBalance(p, balance(p) - fare);
      E.store.fares = (E.store.fares || 0) + fare;
      api.msg(p, `*piep* You check out at ${to.name}. Fare: ${fare} coins. Remaining balance: ${fmt(balance(p))} coins.`);
    } else api.msg(p, `The ferry glides across the IJ to ${to.name}.`);
    if (to.wild) api.msg(p, 'WARNING: Bijlmer ArenA station lies in the Wilderness. Other players can attack you here!', 'warn');
    E.emit(p, kind, { from: from.id, to: to.id });
  }

  // Dialogue options in pages of five, so long lists fit the chatbox.
  function menu(p, title, who, entries) {
    const sc = {};
    const pages = [];
    for (let i = 0; i < entries.length; i += 5) pages.push(entries.slice(i, i + 5));
    pages.forEach((page, i) => {
      const opts = page.map((e, j) => [e.label, `e${i}_${j}`]);
      if (i < pages.length - 1) opts.push(['More destinations...', 'p' + (i + 1)]);
      opts.push(['Cancel', 'end']);
      sc[i ? 'p' + i : 'start'] = [...(i ? [] : [{ npc: title }]), { opts }];
      page.forEach((e, j) => { sc[`e${i}_${j}`] = [{ act: pl => { e.fn(pl); return 'stop'; } }]; });
    });
    api.startDialog(p, null, sc, who);
  }

  api.objectAction('ns_gate', 'Travel', (p, obj) => {
    const from = nsById[obj.data.station];
    menu(p, `Where would you like to go? (Saldo: ${hasCard(p) ? fmt(balance(p)) + ' coins' : 'no card'})`, 'NS', STATIONS.filter(s => s !== from).map(s => {
      const fare = fareNs(p, from, s);
      return { label: `${s.name.replace('Amsterdam ', '')} (${fare} coins)${s.wild ? ' - Wilderness!' : ''}`, fn: pl => { api.closeIface(pl); travel(pl, 'ns', from, s, fare); } };
    }));
  });
  api.objectAction('metro_entrance', 'Travel', (p, obj) => {
    const from = metroById[obj.data.stop];
    const lines = METRO_LINES.filter(l => l.stops.includes(from.id));
    const stopsFor = line => line.stops.filter(id => id !== from.id).map(id => metroById[id]).map(s => {
      const fare = fareMetro(p, from, s);
      return { label: `${s.name} (${fare} coins)${s.wild ? ' - Wilderness!' : ''}`, fn: pl => { api.closeIface(pl); travel(pl, 'metro', from, s, fare); } };
    });
    if (lines.length === 1) return menu(p, `${lines[0].name}. Where to?`, 'GVB Metro', stopsFor(lines[0]));
    menu(p, `Metro ${from.name}. Which line?`, 'GVB Metro', lines.map(l => ({ label: l.name, fn: pl => menu(pl, `${l.name}. Where to?`, 'GVB Metro', stopsFor(l)) })));
  });
  const timetable = (p, kind, id) => {
    const lines = kind === 'ns' ? [`Intercity and Sprinter to: ${STATIONS.filter(s => s.id !== id).map(s => s.name).join(', ')}.`]
      : METRO_LINES.filter(l => l.stops.includes(id)).map(l => `${l.name}: ${l.stops.map(s => metroById[s].name).join(' - ')}`);
    api.startDialog(p, null, { start: lines.map(npc => ({ npc })) }, kind === 'ns' ? 'Timetable' : 'GVB Metro');
  };
  api.objectAction('ns_gate', 'Timetable', (p, obj) => timetable(p, 'ns', obj.data.station));
  api.objectAction('metro_entrance', 'Timetable', (p, obj) => timetable(p, 'metro', obj.data.stop));
  api.objectAction('ferry_pier', 'Board', (p, obj) => {
    const from = FERRIES.find(f => f.id === obj.data.ferry);
    menu(p, 'Free GVB ferry. Where to?', 'Pontschipper', FERRIES.filter(f => f !== from).map(f => ({ label: f.name, fn: pl => { api.closeIface(pl); travel(pl, 'ferry', from, f, 0); } })));
  });

  // ---- OV-fiets rental and riding
  const riders = new Set();
  const broadcastRiders = () => { const ids = [...riders]; for (const pl of api.players.values()) api.send(pl, { t: 'eco_riders', ids }); };
  function startRide(p) {
    if (p.real) return api.msg(p, 'You are in real-life mode. Please put your phone away while cycling!');
    if (p.inside) return api.msg(p, "You can't ride a bike indoors.");
    if (p.wild) return api.msg(p, "The Wilderness is no place for a rental bike. It'd be stolen in seconds.");
    p.ecoRide = true; riders.add(p.id);
    p.run = true; api.send(p, { t: 'run', on: true });
    api.msg(p, 'You hop on your OV-fiets. Trrring trrring!');
    broadcastRiders();
    E.emit(p, 'bike');
  }
  function stopRide(p, quiet) {
    if (!p.ecoRide) return;
    p.ecoRide = false; riders.delete(p.id);
    if (!quiet) api.msg(p, 'You get off your bike.');
    broadcastRiders();
  }
  E.stopRide = stopRide;
  const nearRack = p => api.objectsNear(p.x, p.z, 10).some(o => o.type === 'ovfiets_rack');

  api.itemOp('Ride', (p, slot, item) => {
    if (item.id !== 'ov_fiets') return false; // chained option: leave other packs' 'Ride' items alone
    if (!p.ecoRide) return startRide(p);
    stopRide(p);
    // the parkeerboete joke: parking on the busiest squares gets you a fine from the handhaving
    if (['dam', 'centraal', 'wallen'].includes(p.region) && !nearRack(p) && Math.random() < 0.5) giveFine(p);
  });
  api.objectAction('ovfiets_rack', 'Rent', p => {
    if (api.hasItem(p, 'ov_fiets')) return api.msg(p, 'You already have an OV-fiets. One is enough, even in Amsterdam.');
    if (E.ps(p).fines > 0) return api.msg(p, `You have ${E.ps(p).fines} unpaid parkeerboete(s). Pay them first (50 coins each, use the fine or talk to a Handhaver).`, 'warn');
    if (!hasCard(p)) return api.msg(p, 'You need an OV-chipkaart to rent an OV-fiets.');
    const fee = wapen(p) >= 2 ? 0 : BIKE_FEE;
    if (balance(p) < fee) return api.msg(p, `Renting an OV-fiets costs ${fee} coins. Your balance is only ${fmt(balance(p))} coins.`);
    if (!api.canAdd(p, 'ov_fiets', 1)) return api.msg(p, "You don't have enough inventory space.");
    setBalance(p, balance(p) - fee);
    E.store.bikeFees = (E.store.bikeFees || 0) + fee;
    api.invAdd(p, 'ov_fiets', 1);
    api.msg(p, fee ? `*piep* You rent an OV-fiets for ${fee} coins. Remaining balance: ${fmt(balance(p))} coins. Select 'Ride' to cycle.` : 'Your Amsterdams Wapen cape gets you a free OV-fiets. Select \'Ride\' to cycle.');
  });
  api.objectAction('ovfiets_rack', 'Return', p => {
    if (!api.hasItem(p, 'ov_fiets')) return api.msg(p, "You don't have an OV-fiets to return.");
    stopRide(p, true);
    api.invRemove(p, 'ov_fiets', 1);
    api.msg(p, 'You park the OV-fiets in the rack. Bedankt en tot ziens!');
  });

  api.onPlayerTick(p => {
    if (!p.ecoRide) return;
    if (!api.hasItem(p, 'ov_fiets')) return stopRide(p, true);
    if (p.inside || p.wild || p.real) { stopRide(p, true); return api.msg(p, p.wild ? 'You get off your bike: it is not safe to ride in the Wilderness.' : 'You get off your bike.'); }
    p.rec.energy = 10000; // pedalling is free
    // a bike is faster than running: one extra step per tick
    if (p.run && p.path.length) {
      const [tx, tz] = p.path[0];
      p.x += Math.sign(tx - p.x); p.z += Math.sign(tz - p.z);
      if (p.x === tx && p.z === tz) p.path.shift();
    }
  });
  api.onLogin(p => api.send(p, { t: 'eco_riders', ids: [...riders] }));
  api.onLogout(p => { if (riders.delete(p.id)) broadcastRiders(); });
  api.onDeath(p => stopRide(p, true));

  // ---- parkeerboetes
  function giveFine(p) {
    const s = E.ps(p);
    s.fines = (s.fines || 0) + 1;
    api.giveOrDrop(p, 'parkeerboete', 1);
    api.say(p, 'p', 'Huh?');
    api.msg(p, `A Handhaver appears out of nowhere: "Fout geparkeerd! That is a parkeerboete of ${FINE} coins." You can't rent another OV-fiets until it's paid.`, 'warn');
  }
  function payFine(p) {
    const s = E.ps(p);
    if (!(s.fines > 0)) { api.invRemove(p, 'parkeerboete', api.invCount(p, 'parkeerboete')); return api.msg(p, 'You have no unpaid fines.'); }
    if (!api.invRemove(p, 'coins', FINE)) return api.msg(p, `You need ${FINE} coins to pay the fine.`);
    s.fines--;
    E.store.fines = (E.store.fines || 0) + FINE;
    api.invRemove(p, 'parkeerboete', 1);
    api.touch();
    api.msg(p, `You pay the parkeerboete. ${s.fines ? `${s.fines} fine(s) left.` : 'The Gemeente thanks you for your contribution.'}`);
  }
  api.itemOp('Pay-fine', (p, slot, item) => item.id === 'parkeerboete' ? payFine(p) : false);
  const hh = api.tile(52.37285, 4.8915);
  api.spawnNpc({ name: 'Handhaver', type: 'handhaver', at: hh, wander: 8, look: L(1, 2, 0, 5, 5, '#1c2b4a'), eq: { head: 'flat_cap' }, talk: 'handhaver', actions: ['Pay-fine'], ex: 'Municipal enforcement. Loves a badly parked bike.', chatter: ['Fiets van de stoep, alstublieft!', 'Ik zie alles.'] });
  api.npcAction('handhaver', 'Pay-fine', p => payFine(p));
  api.dialogAction('pay_fine', p => { payFine(p); return 'end'; });

  // ---- dialogues
  api.dialog('ns_conducteur', {
    start: [
      { npc: 'Goedemiddag! Travelling by train? Hold your OV-chipkaart against the check-in gate and choose a station.' },
      { opts: [['How do I get a card?', 'card'], ['Where can I go?', 'where'], ['What about bikes?', 'bike'], ['Bye.', 'end']] },
    ],
    card: [{ player: 'How do I get a card?' }, { npc: `The yellow NS machines sell OV-chipkaarten for ${CARD_PRICE} coins. Top it up there too. Fares come off your balance when you check out.` }, { goto: 'start' }],
    where: [{ player: 'Where can I go?' }, { npc: 'Sloterdijk, Zuid, Amstel, RAI... and Bijlmer ArenA, but that one is in the Wilderness. Bring friends. Or don\'t bring valuables.' }, { goto: 'start' }],
    bike: [{ player: 'What about bikes?' }, { npc: `OV-fiets racks stand by the big stations. ${BIKE_FEE} coins a ride, charged to your card. Do not park it on the Dam. The Handhaving is watching.` }, { goto: 'start' }],
  });
  api.dialog('gvb_medewerker', {
    start: [
      { npc: 'Metro? Line 52 runs north to south under the city, line 54 goes to Bijlmer, and line 50 rings around the west.' },
      { npc: 'Check in at the metro entrance with your OV-chipkaart. Fares are cheaper than the train. The ferries behind the station are free!' },
    ],
  });
  api.dialog('pontschipper', {
    start: [
      { npc: 'The pont across the IJ is free, day and night. Buiksloterweg for the EYE and the A\'DAM Toren, NDSM for the wharf.' },
      { opts: [['Take me across.', 'go'], ['Bye.', 'end']] },
    ],
    go: [{ act: p => { menu(p, 'Where to?', 'Pontschipper', FERRIES.slice(1).map(f => ({ label: f.name, fn: pl => { api.closeIface(pl); travel(pl, 'ferry', FERRIES[0], f, 0); } }))); return 'stop'; } }],
  });
  api.dialog('handhaver', {
    start: [
      { npc: () => 'Goedendag. Handhaving. Everything in order here?' },
      { if: p => E.ps(p).fines > 0, then: 'owe', else: 'fine' },
    ],
    owe: [{ npc: p => `According to my records you owe ${E.ps(p).fines} parkeerboete(s) of ${FINE} coins.` }, { opts: [['Pay one now.', 'pay'], ['Later.', 'end']] }],
    pay: [{ act: 'pay_fine' }],
    fine: [{ player: 'Everything is fine.' }, { npc: 'Good. Remember: bikes in the racks, not on the Dam.' }],
  });
}
