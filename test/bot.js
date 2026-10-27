// Headless test client: connects over WebSocket like a browser and records what the server sends.
import WebSocket from 'ws';

export class Bot {
  constructor(port) { this.port = port; this.msgs = []; this.state = {}; this.waiters = []; }

  connect(login) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:${this.port}/ws`);
      this.ws.on('open', () => this.ws.send(JSON.stringify({ t: 'login', ...login })));
      this.ws.on('message', raw => {
        const m = JSON.parse(raw);
        this.msgs.push(m);
        if (m.t === 'init') { Object.assign(this.state, m); resolve(this); }
        if (m.t === 'err') reject(new Error(m.text));
        if (m.t === 'tick') Object.assign(this.state, { you: m.you, ents: m.e, items: m.gi, hits: m.h });
        if (m.t === 'inv') this.state.inv = m.inv;
        if (m.t === 'equip') this.state.equip = m.equip;
        if (m.t === 'skills') this.state.xp = m.xp;
        if (m.t === 'objs') this.state.objs = m.o;
        for (const w of [...this.waiters]) if (w.pred(m)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.resolve(m); }
      });
      this.ws.on('error', reject);
    });
  }

  send(m) { this.ws.send(JSON.stringify(m)); }
  say(text) { this.send({ t: 'say', text }); }
  close() { this.ws.close(); }

  wait(pred, ms = 8000) {
    return new Promise((resolve, reject) => {
      const w = { pred, resolve };
      this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); reject(new Error('timeout waiting for message')); } }, ms);
    });
  }
  waitMsg(re, ms) { return this.wait(m => m.t === 'msg' && re.test(m.text), ms); }
  async ticks(n = 1) { for (let i = 0; i < n; i++) await this.wait(m => m.t === 'tick'); }
  count(id) { return (this.state.inv || []).reduce((n, s) => n + (s && s.id === id ? s.q : 0), 0); }
  slotOf(id) { return (this.state.inv || []).findIndex(s => s && s.id === id); }
  npc(name) { return (this.state.ents || []).find(e => e.k === 'n' && e.n === name); }
  player(name) { return (this.state.ents || []).find(e => e.k === 'p' && e.n === name); }
}
