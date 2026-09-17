// Sign-in: email + 6-digit PIN, optional Google Authenticator (TOTP), optional passkey (fingerprint / Face ID).
import crypto from "node:crypto";
import QRCode from "qrcode";
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse
} from "@simplewebauthn/server";
import { load, save } from "./db.js";

const RP_NAME = "Rasid";

// ---------- PIN ----------
export function hashPin(pin, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
export function checkPin(pin, stored) {
  if (typeof stored !== "string" || typeof pin !== "string") return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !/^[a-f0-9]{64}$/.test(hash || "")) return false;
  const test = crypto.scryptSync(pin, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}
export const validPin = (p) => typeof p === "string" && /^\d{6}$/.test(p);
export const validCredential = p => validPin(p) || (typeof p === "string" && p.length >= 12 && p.length <= 128 && !/^\d+$/.test(p));
export const validEmail = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;

// ---------- Sessions ----------
export function createSession(email) {
  const db = load();
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions[token] = { email, created: Date.now() };
  save();
  return token;
}
export function getSession(token) {
  if (!token) return null;
  const db = load();
  const s = db.sessions[token];
  if (!s) return null;
  if (Date.now() - s.created > 1000 * 60 * 60 * 24 * 90) { delete db.sessions[token]; save(); return null; }
  return db.users[s.email] || null;
}
export function destroySession(token) {
  const db = load();
  delete db.sessions[token];
  save();
}

// Pending two-step: PIN passed, waiting for the 6-digit authenticator code.
const pending = new Map(); // ticket -> { email, exp }
export function createPending(email) {
  const t = crypto.randomBytes(16).toString("hex");
  pending.set(t, { email, exp: Date.now() + 5 * 60 * 1000 });
  return t;
}
export function takePending(t) {
  const p = pending.get(t);
  if (!p || p.exp < Date.now()) { pending.delete(t); return null; }
  pending.delete(t);
  return p.email;
}

// ---------- TOTP (Google Authenticator) ----------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(str) {
  let bits = 0, value = 0; const out = [];
  for (const ch of str.replace(/=+$/, "").toUpperCase()) {
    const i = B32.indexOf(ch); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export function totp(secret, step = Math.floor(Date.now() / 30000)) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac("sha1", key).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const code = ((h[off] & 0x7f) << 24 | h[off + 1] << 16 | h[off + 2] << 8 | h[off + 3]) % 1_000_000;
  return String(code).padStart(6, "0");
}
export function verifyTotp(secret, code) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  const now = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) => totp(secret, now + d) === String(code));
}
export async function totpSetup(email) {
  const secret = base32Encode(crypto.randomBytes(20));
  const uri = `otpauth://totp/${encodeURIComponent(RP_NAME)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(RP_NAME)}&digits=6&period=30`;
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { secret, qr };
}

// ---------- Passkeys (WebAuthn: fingerprint / Face ID) ----------
export function rp(req) {
  if (process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL) { const origin = new URL(process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL); return {rpID:origin.hostname,origin:origin.origin}; }
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "localhost").split(":")[0];
  const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  return { rpID: host, origin: `${proto}://${req.headers["x-forwarded-host"] || req.headers.host}` };
}

function pruneChallenges(db){for(const [key,value] of Object.entries(db.challenges||{})){if(!value||value.exp<Date.now())delete db.challenges[key];}}
export async function passkeyRegisterOptions(req, user) {
  const { rpID } = rp(req);
  user.webauthnUserID ||= crypto.randomBytes(32).toString("base64url");
  const opts = await generateRegistrationOptions({
    rpName: RP_NAME, rpID,
    userID: Buffer.from(user.webauthnUserID,"base64url"),
    userName: user.email,
    userDisplayName: user.email,
    attestationType: "none",
    excludeCredentials: (user.passkeys || []).map((p) => ({ id: p.id, transports: p.transports })),
    authenticatorSelection: { residentKey: "required", userVerification: "required", authenticatorAttachment: "platform" }
  });
  const db = load();
  pruneChallenges(db);
  db.challenges["register:"+user.email+":"+req.cookies.rasid] = { challenge: opts.challenge, exp: Date.now() + 5 * 60 * 1000 };
  save();
  return opts;
}

export async function passkeyRegisterVerify(req, user, body) {
  const db = load();
  const { rpID, origin } = rp(req);
  const challengeKey="register:"+user.email+":"+req.cookies.rasid;
  const ch = db.challenges[challengeKey];
  delete db.challenges[challengeKey]; save();
  if (!ch || ch.exp < Date.now()) throw new Error("challenge expired");
  const v = await verifyRegistrationResponse({
    response: body, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true
  });
  if (!v.verified || !v.registrationInfo) throw new Error("not verified");
  const { credential } = v.registrationInfo;
  user.passkeys = user.passkeys || [];
  user.passkeys.push({
    id: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports || [],
    created: Date.now(), rpID, name: `Passkey ${user.passkeys.length+1}`, backedUp:v.registrationInfo.credentialBackedUp
  });
  delete db.challenges[challengeKey];
  save();
  return true;
}

export async function passkeyLoginOptions(req, email) {
  const { rpID } = rp(req);
  const db = load();
  const user = db.users[email];
  const opts = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: (user?.passkeys || []).filter(p=>!p.rpID||p.rpID===rpID).map((p) => ({ id: p.id, transports: p.transports }))
  });
  const ticket=crypto.randomBytes(24).toString("base64url");
  pruneChallenges(db);
  db.challenges["login:"+ticket] = {email, challenge: opts.challenge, exp: Date.now() + 5 * 60 * 1000 };
  opts.ticket=ticket;
  save();
  return opts;
}

export async function passkeyLoginVerify(req, email, body, ticket) {
  const db = load();
  const { rpID, origin } = rp(req);
  const user = db.users[email];
  if (!user) throw new Error("no user");
  const challengeKey="login:"+String(ticket);
  const ch = db.challenges[challengeKey];
  delete db.challenges[challengeKey];save();
  if (!ch || ch.email!==email || ch.exp < Date.now()) throw new Error("challenge expired");
  const pk = (user.passkeys || []).find((p) => p.id === body.id);
  if (!pk) throw new Error("unknown passkey");
  const v = await verifyAuthenticationResponse({
    response: body, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
    credential: { id: pk.id, publicKey: Buffer.from(pk.publicKey, "base64url"), counter: pk.counter, transports: pk.transports }
  });
  if (!v.verified) throw new Error("not verified");
  pk.counter = v.authenticationInfo.newCounter;
  pk.lastUsed=Date.now();
  delete db.challenges[challengeKey];
  save();
  return user;
}
