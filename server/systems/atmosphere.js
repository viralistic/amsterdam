// Server logic for the "atmosphere" pack. Weather and daylight are computed on each client from real time, so
// everybody sees the same sky without any server state. Two chat commands let players preview the atmosphere:
//   ::time 22 | ::time auto       force the Amsterdam hour shown on your client
//   ::weather rain|mist|clear|auto
export default function register(api) {
  api.command('time', (p, [h]) => {
    if (!h || h === 'auto') { api.send(p, { t: 'atmo', hour: null }); return api.msg(p, 'The sky follows the real Amsterdam clock again.'); }
    const hour = Number(h);
    if (!Number.isFinite(hour) || hour < 0 || hour >= 24) return api.msg(p, 'Usage: ::time 0-23 or ::time auto');
    api.send(p, { t: 'atmo', hour });
    api.msg(p, `You imagine it is ${String(Math.floor(hour)).padStart(2, '0')}:00 in Amsterdam.`);
  });
  api.command('weather', (p, [w]) => {
    const kinds = ['rain', 'mist', 'clear'];
    if (!w || w === 'auto') { api.send(p, { t: 'atmo', weather: null }); return api.msg(p, 'The weather is back to its usual Dutch self.'); }
    if (!kinds.includes(w)) return api.msg(p, 'Usage: ::weather rain|mist|clear|auto');
    api.send(p, { t: 'atmo', weather: w });
    api.msg(p, w === 'rain' ? 'Typical. It starts to rain.' : w === 'mist' ? 'A mist rolls in off the IJ.' : 'The clouds part.');
  });
}
