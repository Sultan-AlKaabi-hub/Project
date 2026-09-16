// Tiny JSON-file database. One file, atomic writes, in-memory cache.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(here, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY = {
  users: {},        // email -> user record
  sessions: {},     // token -> { email, created }
  lessons: [],      // all generated lessons, newest first
  required: {},     // date -> { beginner: [ids], intermediate: [ids], expert: [ids] }
  updates: [],      // pipeline run log
  challenges: {},   // webauthn temp challenges
  settings: { lastUpdate: null, source: null }
};

let cache = null;

export function load() {
  if (cache) return cache;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try { cache = { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) }; }
    catch { cache = structuredClone(EMPTY); }
  } else {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

let writeTimer = null;
export function save() {
  // Debounced atomic write.
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }, 150);
}

export function saveNow() {
  if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export const today = () => new Date().toISOString().slice(0, 10);
