// Stand-in for the ws package: the page's WebSocket override connects straight to this server object.
export class WebSocketServer {
  constructor() { this.handlers = {}; globalThis.__amsWss = this; }
  on(ev, f) { this.handlers[ev] = f; return this; }
}
export default { WebSocketServer };
