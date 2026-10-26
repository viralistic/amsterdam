// Tiny JSON-file account store. Fine for a few thousand players; swap for a real database when it grows.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export const DATA_DIR = process.env.DATA_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'data');
const FILE = path.join(DATA_DIR, 'players.json');

let players = {};
let dirty = false;

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try { players = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { players = {}; }
}

export const get = key => players[key];
export function put(key, rec) { players[key] = rec; dirty = true; }
export function touch() { dirty = true; }

export function save() {
  if (!dirty) return;
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(players));
  fs.renameSync(tmp, FILE);
  dirty = false;
}

export async function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(pass, salt, 32)).toString('hex');
  return { salt, hash };
}

export async function checkPassword(pass, rec) {
  const hash = await scrypt(pass, rec.salt, 32);
  return crypto.timingSafeEqual(hash, Buffer.from(rec.hash, 'hex'));
}
