// Tiny JSON-file database. One file, atomic writes, in-memory cache.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.RASID_DATA_DIR ? path.resolve(process.env.RASID_DATA_DIR) : path.join(here, "..", "data");
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
    catch (e) { throw new Error(`Cannot read database safely: ${e.message}`); }
  } else {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

let writeTimer = null;

function writeAtomic() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  // Windows scanners can briefly hold the destination open. Keep the previous
  // database intact and retry the atomic rename; never delete it as a fallback.
  for(let attempt=0;;attempt++) {
    try { fs.renameSync(tmp, DB_FILE); return; }
    catch(error) {
      if(process.platform!=='win32' || !['EPERM','EBUSY','EACCES'].includes(error.code) || attempt>=8) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25*(attempt+1));
    }
  }
}
export function save() {
  // Debounced atomic write.
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    writeAtomic();
  }, 150);
}

export function saveNow() {
  if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  writeAtomic();
}

export const today = () => new Date().toISOString().slice(0, 10);
