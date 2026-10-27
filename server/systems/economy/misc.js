// Small things: the canal map, the stroopwafel tin, the hard diary cape teleport and the Kapsalon makeover (a gold sink).
import { REGIONS } from '../../../shared/regions.js';
import { STATIONS, GE_CENTRE } from '../../../shared/content/economy/places.js';
import { sanitizeLook } from '../../../shared/look.js';

const MAKEOVER = 750;

export default function misc(api, E) {
  api.itemOp('View', (p, slot, item) => {
    if (item.id !== 'canal_map') return;
    api.send(p, { t: 'eco_map', here: p.region, regions: REGIONS.map(r => ({ id: r.id, name: r.name, type: r.type, role: r.role })), stations: STATIONS.map(s => s.name) });
  });

  api.itemOp('Take-one', (p, slot, item) => {
    if (item.id !== 'stroopwafel_tin') return;
    const s = E.ps(p);
    const day = Math.floor(Date.now() / 86_400_000);
    if (s.tinDay === day) return api.msg(p, 'The tin is empty. It will be full again tomorrow. Nobody knows how.');
    if (!api.canAdd(p, 'stroopwafel', 1)) return api.msg(p, "You don't have enough inventory space.");
    s.tinDay = day;
    api.invAdd(p, 'stroopwafel', 1);
    api.msg(p, 'You open the tin and find a fresh stroopwafel inside.');
  });

  api.itemOp('Teleport-Dam', (p, slot, item) => {
    if (!api.ITEMS[item.id]?.wapen) return;
    const s = E.ps(p);
    const wait = (s.capeTp || 0) + 10 * 60_000 - Date.now();
    if (wait > 0) return api.msg(p, `The cape needs ${Math.ceil(wait / 60_000)} more minute(s) to recharge.`);
    if (!api.canTeleport(p)) return;
    s.capeTp = Date.now();
    const t = api.tile(GE_CENTRE.lat, GE_CENTRE.lon);
    E.stopRide?.(p, true);
    api.teleport(p, t.x - 3, t.z + 6, { inside: false });
    api.msg(p, 'The three crosses glow, and you find yourself on the Dam.');
  });

  // ---- Kapsalon: change your look for a fee
  const k = api.tile(52.36995, 4.8862);
  api.spawnNpc({ name: 'Kapper Karim', type: 'kapper', at: k, look: { g: 0, skin: 3, hair: 7, top: 5, legs: 5 }, talk: 'kapper', actions: ['Makeover'], ex: 'Runs a kapsalon in the Negen Straatjes. Opinions about your hair included.', chatter: ['Fade? Opscheren?', 'Next!'] });
  const open = p => { api.closeIface(p); p.iface = 'eco_makeover'; p.ecoKapper = true; api.send(p, { t: 'eco_makeover', look: p.rec.look, price: MAKEOVER }); };
  api.npcAction('kapper', 'Makeover', p => open(p));
  api.dialogAction('makeover', p => { open(p); return 'stop'; });
  api.dialog('kapper', {
    start: [
      { npc: `Salaam, welkom! New look? Haircut, new clothes colour, the works. ${MAKEOVER} coins.` },
      { opts: [['Yes, give me a makeover.', 'go'], ['No thanks.', 'end']] },
    ],
    go: [{ act: 'makeover' }],
  });
  api.onMessage('eco_makeover', (p, m) => {
    if (p.iface !== 'eco_makeover') return;
    api.closeIface(p);
    const look = sanitizeLook(m.look);
    if (JSON.stringify(look) === JSON.stringify(sanitizeLook(p.rec.look))) return api.msg(p, 'Karim shrugs: "Same as before? Free of charge then."');
    if (!api.invRemove(p, 'coins', MAKEOVER)) return api.msg(p, `A makeover costs ${MAKEOVER} coins.`);
    E.store.makeovers = (E.store.makeovers || 0) + MAKEOVER;
    p.rec.look = { ...p.rec.look, ...look };
    api.touch();
    api.msg(p, 'Karim works his magic. "Prachtig! You look like a real Amsterdammer now."');
  });
}
