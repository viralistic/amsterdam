// Password hashing for the single-player browser build: accounts never leave this browser, so a plain
// SHA-256 stands in for scrypt. Buffers are represented by a tiny hex wrapper.
class Hex { constructor(hex) { this.hex = hex; } toString() { return this.hex; } }
globalThis.Buffer ??= { from: (s, enc) => new Hex(enc === 'hex' ? s : [...new TextEncoder().encode(String(s))].map(b => b.toString(16).padStart(2, '0')).join('')) };
export const randomBytes = n => new Hex([...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join(''));
export function scrypt(pass, salt, len, cb) {
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pass))
    .then(d => cb(null, new Hex([...new Uint8Array(d)].slice(0, len).map(b => b.toString(16).padStart(2, '0')).join(''))), cb);
}
export const timingSafeEqual = (a, b) => String(a) === String(b);
export default { randomBytes, scrypt, timingSafeEqual };
