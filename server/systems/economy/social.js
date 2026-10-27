// Friends and ignore lists with online status and private messages, player reports, and moderator commands
// for the accounts listed in the ADMINS environment variable.
import { keyOf, clean } from './common.js';

const MAX_FRIENDS = 100, REASONS = ['Offensive language', 'Spamming', 'Scamming', 'Harassment', 'Botting or macroing', 'Real-world trading', 'Offensive name', 'Other'];

export default function social(api, E) {
  const S = p => { const s = E.ps(p); s.friends ??= []; s.ignore ??= []; return s; };
  const ignores = (target, senderKey) => S(target).ignore.some(n => keyOf(n) === senderKey);
  const store = E.store;
  store.reports ??= [];
  store.modlog ??= [];

  function sendFriends(p) {
    const s = S(p);
    api.send(p, {
      t: 'eco_friends',
      friends: s.friends.map(name => { const o = E.online(keyOf(name)); return { name: o?.name || name, online: !!o && !ignores(o, p.key) }; }),
      ignore: s.ignore, reasons: REASONS, admin: E.isAdmin(p),
    });
  }
  E.sendFriends = sendFriends;
  // Everyone who has this player as a friend gets a status update.
  function statusChanged(p, on) {
    for (const o of api.players.values()) {
      if (o === p || !S(o).friends.some(n => keyOf(n) === p.key)) continue;
      if (ignores(p, o.key)) continue;
      api.msg(o, `${p.name} has logged ${on ? 'in' : 'out'}.`);
      sendFriends(o);
    }
  }
  api.onLogin(p => { sendFriends(p); statusChanged(p, true); });
  api.onLogout(p => setTimeout(() => statusChanged(p, false), 0));

  function addTo(p, list, name) {
    const acc = E.account(clean(name, 12));
    if (!acc) return api.msg(p, `Unable to add name - player ${clean(name, 12)} does not exist.`);
    if (acc.key === p.key) return api.msg(p, "You can't add yourself.");
    const s = S(p);
    const arr = s[list];
    if (arr.some(n => keyOf(n) === acc.key)) return api.msg(p, `${acc.rec.name} is already on your ${list === 'friends' ? 'friend' : 'ignore'} list.`);
    if (arr.length >= MAX_FRIENDS) return api.msg(p, 'Your list is full.');
    const other = list === 'friends' ? 'ignore' : 'friends';
    s[other] = s[other].filter(n => keyOf(n) !== acc.key);
    arr.push(acc.rec.name);
    api.touch();
    sendFriends(p);
  }
  function delFrom(p, list, name) {
    const s = S(p);
    s[list] = s[list].filter(n => keyOf(n) !== keyOf(name));
    api.touch();
    sendFriends(p);
  }

  function pm(p, to, text) {
    text = clean(text);
    if (!text) return;
    if (p.rec.flags.muted > Date.now()) return api.msg(p, 'You are muted and cannot send private messages.', 'warn');
    if (Date.now() - (p.ecoLastPm || 0) < 700) return;
    p.ecoLastPm = Date.now();
    const key = keyOf(to);
    const t = E.online(key);
    if (!t || ignores(t, p.key)) return api.msg(p, 'Unable to send message - player unavailable.');
    api.send(t, { t: 'eco_pm', from: p.name, text });
    api.send(p, { t: 'eco_pm', to: t.name, text });
  }

  function report(p, name, reason) {
    const acc = E.account(clean(name, 12));
    if (!acc) return api.msg(p, `There is no player called ${clean(name, 12)}.`);
    if (acc.key === p.key) return api.msg(p, "You can't report yourself.");
    const recent = store.reports.filter(r => r.by === p.name && r.t > Date.now() - 60_000).length;
    if (recent >= 3) return api.msg(p, 'You have sent a lot of reports recently. Please wait a minute.');
    const t = E.online(acc.key);
    store.reports.push({ id: (store.reportNo = (store.reportNo || 0) + 1), by: p.name, name: acc.rec.name, reason: clean(reason, 60) || 'Other', t: Date.now(), x: p.x, z: p.z, region: p.region, online: !!t });
    if (store.reports.length > 500) store.reports.splice(0, store.reports.length - 500);
    api.touch();
    api.msg(p, `Thank you, your report against ${acc.rec.name} has been received.`);
    for (const a of api.players.values()) if (E.isAdmin(a)) api.msg(a, `[Mod] New report: ${p.name} reported ${acc.rec.name} (${clean(reason, 60) || 'Other'}).`, 'warn');
  }

  api.onMessage('eco_social', (p, m) => {
    if (m.op === 'add' && ['friends', 'ignore'].includes(m.list)) return addTo(p, m.list, m.name);
    if (m.op === 'del' && ['friends', 'ignore'].includes(m.list)) return delFrom(p, m.list, String(m.name || ''));
    if (m.op === 'pm') return pm(p, String(m.to || ''), m.text);
    if (m.op === 'report') return report(p, String(m.name || ''), REASONS.includes(m.reason) ? m.reason : 'Other');
    if (m.op === 'refresh') return sendFriends(p);
  });

  api.command('report', (p, args) => {
    if (!args.length) return api.msg(p, 'Usage: ::report name reason (use _ for spaces in names)');
    report(p, args[0].replace(/_/g, ' '), args.slice(1).join(' '));
  });
  api.command('pm', (p, args) => { if (args.length >= 2) pm(p, args[0].replace(/_/g, ' '), args.slice(1).join(' ')); });
  api.command('friend', (p, args) => args[0] && addTo(p, 'friends', args.join(' ')));

  // ---- moderation
  const mod = (name, f) => api.command(name, (p, args) => {
    if (!E.isAdmin(p)) return;
    if (!args[0]) return api.msg(p, `Usage: ::${name} name ...`);
    const acc = E.account(args[0].replace(/_/g, ' '));
    if (!acc) return api.msg(p, `No such player: ${args[0]}`);
    const text = f(p, acc, args.slice(1));
    if (text) { api.msg(p, `[Mod] ${text}`); store.modlog.push({ by: p.name, t: Date.now(), text }); if (store.modlog.length > 300) store.modlog.shift(); api.touch(); }
  });
  const kick = (acc, reason) => { const t = E.online(acc.key); if (t) { api.msg(t, reason, 'warn'); setTimeout(() => t.ws.close(), 100); } return !!t; };
  mod('mute', (p, acc, [min]) => {
    const m = Math.max(1, Math.min(60 * 24 * 30, +min || 60));
    acc.rec.flags ??= {};
    acc.rec.flags.muted = Date.now() + m * 60_000;
    const t = E.online(acc.key);
    if (t) api.msg(t, `You have been muted for ${m} minutes by a moderator.`, 'warn');
    return `${acc.rec.name} is muted for ${m} minutes.`;
  });
  mod('unmute', (p, acc) => { if (acc.rec.flags) delete acc.rec.flags.muted; return `${acc.rec.name} is no longer muted.`; });
  mod('kick', (p, acc) => kick(acc, 'You have been kicked by a moderator.') ? `${acc.rec.name} was kicked.` : `${acc.rec.name} is not online.`);
  mod('ban', (p, acc, [hours]) => {
    if (E.admins.has(acc.key)) return 'You cannot ban another moderator.';
    const h = Math.max(1, Math.min(24 * 365, +hours || 24));
    acc.rec.banned = Date.now() + h * 3_600_000;
    kick(acc, 'Your account has been banned.');
    return `${acc.rec.name} is banned for ${h} hours.`;
  });
  mod('unban', (p, acc) => { delete acc.rec.banned; return `${acc.rec.name} is unbanned.`; });
  api.command('reports', p => {
    if (!E.isAdmin(p)) return;
    api.send(p, { t: 'eco_reports', reports: store.reports.slice(-30).reverse(), modlog: store.modlog.slice(-15).reverse() });
  });
  api.command('modhelp', p => {
    if (!E.isAdmin(p)) return;
    api.msg(p, '[Mod] ::mute name minutes, ::unmute name, ::kick name, ::ban name hours, ::unban name, ::reports');
  });
}
