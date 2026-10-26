// Tiny JSON-file account store. Fine for a few thousand players; swap for a real database when it grows.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export const DATA_DIR = process.env.DATA_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'data');
const FILE = path.join(DATA_DIR, 'players.json');
const WORLD_FILE = path.join(DATA_DIR, 'world.json');

let players = {};
let world = {};
let dirty = false;

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try { players = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { players = {}; }
  try { world = JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8')); } catch { world = {}; }
}

// Persistent server-wide state for content systems (e.g. Grand Exchange offers), one namespace each.
export function worldStore(ns) { return (world[ns] ??= {}); }
export const allPlayers = () => players;

export const get = key => players[key];
export function put(key, rec) { players[key] = rec; dirty = true; }
export function touch() { dirty = true; }

export function save() {
  if (!dirty) return;
  for (const [file, data] of [[FILE, players], [WORLD_FILE, world]]) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, file);
  }
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
