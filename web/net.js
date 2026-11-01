// Single-player browser build: the game server runs in this page. The client's WebSocket to /ws and its
// fetches to /api/... are routed straight into the server instead of over the network.
const NativeWebSocket = globalThis.WebSocket, nativeFetch = globalThis.fetch.bind(globalThis);
const later = f => setTimeout(f, 0);

class LocalSocket {
  constructor() {
    this.readyState = 0;
    const client = this;
    const handlers = {};
    // the server's end of the connection, shaped like a ws socket
    this.peer = {
      readyState: 1,
      send(data) { if (client.readyState === 1) later(() => client.onmessage?.({ data: String(data) })); },
      close() { if (this.readyState === 3) return; this.readyState = 3; client.readyState = 3; later(() => { client.onclose?.({}); handlers.close?.(); }); },
      terminate() { this.close(); },
      on(ev, f) { handlers[ev] = f; return this; },
    };
    this.handlers = handlers;
    later(() => {
      const wss = globalThis.__amsWss;
      if (!wss) { this.readyState = 3; this.onclose?.({}); return; }
      wss.handlers.connection?.(this.peer, { headers: {}, socket: { remoteAddress: '127.0.0.1' } });
      this.readyState = 1;
      this.onopen?.({});
    });
  }
  send(data) { if (this.readyState === 1) later(() => this.handlers.message?.(String(data))); }
  close() { this.peer.close(); }
  addEventListener(ev, f) { this['on' + ev] = f; }
}
LocalSocket.CONNECTING = 0; LocalSocket.OPEN = 1; LocalSocket.CLOSING = 2; LocalSocket.CLOSED = 3;

globalThis.WebSocket = function (url, ...rest) {
  return /\/ws$/.test(String(url)) ? new LocalSocket() : new NativeWebSocket(url, ...rest);
};
Object.assign(globalThis.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });

globalThis.fetch = (input, init) => {
  const u = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (!u.pathname.startsWith('/api/') || !globalThis.__amsHttp) return nativeFetch(input, init);
  return new Promise(resolve => {
    let status = 200, headers = {};
    const res = {
      writeHead(s, h) { status = s; Object.assign(headers, h || {}); return this; },
      setHeader(k, v) { headers[k] = v; },
      end(body = '') { resolve(new Response(body, { status, headers })); },
    };
    globalThis.__amsHttp({ url: u.pathname + u.search, method: init?.method || 'GET', headers: {}, socket: { remoteAddress: '127.0.0.1' } }, res);
  });
};
