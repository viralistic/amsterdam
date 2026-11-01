// The game server's HTTP handler is called directly by the page's fetch override (see web/boot.js).
export function createServer(handler) {
  globalThis.__amsHttp = handler;
  return { listen(port, cb) { setTimeout(() => cb?.()); return this; }, on() { return this; }, close() {} };
}
export default { createServer };
