// Rasid server: static PWA + JSON API + daily content update.
import express from "express";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { load, save, saveNow, today, DATA_DIR } from "./db.js";
import * as auth from "./auth.js";
import { runUpdate, currentRequired } from "./pipeline/run.js";
import { CATEGORIES, fetchCategory, sourceList } from "./pipeline/fetchNews.js";
import { LEVELS, aiAvailable, keySentences } from "./pipeline/generate.js";
import { fetchArticle, favicon, translate } from "./pipeline/article.js";
import { answer as farisAnswer } from "./faris.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const PORT = Number(process.env.PORT || 3000);
const PASS_MARK = 4;
const NEXT = { beginner: "intermediate", intermediate: "expert", expert: "expert" };

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

// ---------- helpers ----------
const db = load();
const publicUser = (u) => ({
  email: u.email, lang: u.lang || "ar", level: u.level || null, placed: Boolean(u.level),
  totpEnabled: Boolean(u.totp?.enabled), passkeys: (u.passkeys || []).length,
  badges: u.badges || [], expertDone: Boolean(u.expertDone), isAdmin: isAdmin(u)
});
function isAdmin(u) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) return u.email === adminEmail.toLowerCase();
  const first = Object.values(db.users).sort((a, b) => a.created - b.created)[0];
  return first?.email === u.email;
}
function setCookie(res, token) {
  res.cookie("rasid", token, { httpOnly: true, sameSite: "lax", maxAge: 90 * 24 * 3600 * 1000 });
}
function requireUser(req, res, next) {
  const u = auth.getSession(req.cookies.rasid);
  if (!u) return res.status(401).json({ error: "not signed in" });
  req.user = u; next();
}
const lessonById = (id) => db.lessons.find((l) => l.id === id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function readSet(u, level) { u.read = u.read || {}; u.read[level] = u.read[level] || {}; return u.read[level]; }

function lessonCard(l, level, lang, read) {
  const cat = CATEGORIES.find((c) => c.id === l.category);
  const text = l.levels[level]?.[lang] || l.levels[level]?.en || "";
  return {
    id: l.id, category: l.category, categoryLabel: lang === "ar" ? cat?.ar : cat?.en,
    title: lang === "ar" ? l.title_ar : l.title_en, source: l.source, date: l.date,
    preview: text.slice(0, 140), read: Boolean(read[l.id]), engine: l.engine,
    image: l.image || null, icon: l.icon || favicon(l.url), arMissing: Boolean(l.arMissing)
  };
}

// ---------- auth ----------
app.post("/api/auth/signup", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { pin } = req.body;
  if (!auth.validEmail(email)) return res.status(400).json({ error: "bad_email" });
  if (!auth.validPin(pin)) return res.status(400).json({ error: "bad_pin" });
  if (db.users[email]) return res.status(409).json({ error: "exists" });
  db.users[email] = { email, pinHash: auth.hashPin(pin), created: Date.now(), lang: req.body.lang === "en" ? "en" : "ar", level: null, read: {}, badges: [], passkeys: [] };
  save();
  setCookie(res, auth.createSession(email));
  res.json({ user: publicUser(db.users[email]) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (!u || !auth.validPin(req.body.pin) || !auth.checkPin(req.body.pin, u.pinHash)) return res.status(401).json({ error: "wrong" });
  if (u.totp?.enabled) return res.json({ needTotp: true, ticket: auth.createPending(email) });
  setCookie(res, auth.createSession(email));
  res.json({ user: publicUser(u) });
});

app.post("/api/auth/totp", (req, res) => {
  const email = auth.takePending(req.body.ticket);
  const u = email && db.users[email];
  if (!u || !auth.verifyTotp(u.totp.secret, req.body.code)) return res.status(401).json({ error: "wrong_code" });
  setCookie(res, auth.createSession(email));
  res.json({ user: publicUser(u) });
});

app.post("/api/auth/logout", (req, res) => { auth.destroySession(req.cookies.rasid); res.clearCookie("rasid"); res.json({ ok: true }); });

// PIN reset: a 6-digit code is "sent" by email. Without SMTP configured it is printed to the server log.
app.post("/api/auth/pin/reset-request", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (u) {
    u.resetCode = { code: String(crypto.randomInt(0, 1_000_000)).padStart(6, "0"), exp: Date.now() + 15 * 60 * 1000 };
    save();
    console.log(`[mail] PIN reset code for ${email}: ${u.resetCode.code}`);
  }
  res.json({ sent: true, devCode: process.env.RASID_DEV_SHOW_CODES && u ? u.resetCode.code : undefined });
});
app.post("/api/auth/pin/reset", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (!u || !u.resetCode || u.resetCode.exp < Date.now() || u.resetCode.code !== String(req.body.code)) return res.status(401).json({ error: "bad_code" });
  if (!auth.validPin(req.body.pin)) return res.status(400).json({ error: "bad_pin" });
  u.pinHash = auth.hashPin(req.body.pin); delete u.resetCode; save();
  setCookie(res, auth.createSession(email));
  res.json({ user: publicUser(u) });
});

// Passkeys (fingerprint / Face ID)
app.post("/api/auth/passkey/options", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!db.users[email]?.passkeys?.length) return res.status(404).json({ error: "no_passkey" });
  res.json(await auth.passkeyLoginOptions(req, email));
});
app.post("/api/auth/passkey/verify", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const u = await auth.passkeyLoginVerify(req, email, req.body.response);
    setCookie(res, auth.createSession(email));
    res.json({ user: publicUser(u) });
  } catch (e) { res.status(401).json({ error: e.message }); }
});
app.post("/api/security/passkey/register/options", requireUser, async (req, res) => res.json(await auth.passkeyRegisterOptions(req, req.user)));
app.post("/api/security/passkey/register/verify", requireUser, async (req, res) => {
  try { await auth.passkeyRegisterVerify(req, req.user, req.body); res.json({ ok: true, passkeys: req.user.passkeys.length }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Google Authenticator
app.post("/api/security/totp/setup", requireUser, async (req, res) => {
  const { secret, qr } = await auth.totpSetup(req.user.email);
  req.user.totp = { secret, enabled: false }; save();
  res.json({ qr, secret });
});
app.post("/api/security/totp/confirm", requireUser, (req, res) => {
  const t = req.user.totp;
  if (!t || !auth.verifyTotp(t.secret, req.body.code)) return res.status(400).json({ error: "wrong_code" });
  t.enabled = true; save(); res.json({ ok: true });
});
app.post("/api/security/totp/disable", requireUser, (req, res) => { delete req.user.totp; save(); res.json({ ok: true }); });

// ---------- me / settings ----------
app.get("/api/me", (req, res) => {
  const u = auth.getSession(req.cookies.rasid);
  res.json({ user: u ? publicUser(u) : null });
});
app.post("/api/settings", requireUser, (req, res) => {
  if (req.body.lang === "ar" || req.body.lang === "en") req.user.lang = req.body.lang;
  save(); res.json({ user: publicUser(req.user) });
});
app.post("/api/reset", requireUser, (req, res) => {
  const u = req.user;
  u.level = null; u.read = {}; u.badges = []; u.expertDone = false; delete u.activeQuiz; delete u.review;
  save(); res.json({ user: publicUser(u) });
});

// ---------- content ----------
function requiredFor(level) {
  const { date, ids } = currentRequired(level);
  return { date, ids: ids.filter(lessonById) };
}
function progressFor(u, level) {
  const req = requiredFor(level);
  const read = readSet(u, level);
  const done = req.ids.filter((id) => read[id]).length;
  const retryBlocked = Boolean(u.review?.wrong?.length) && u.review.wrong.some((id) => !u.review.reread?.includes(id));
  return { date: req.date, requiredIds: req.ids, done, total: req.ids.length, quizReady: req.ids.length > 0 && done === req.ids.length && !retryBlocked, retryBlocked };
}

app.get("/api/content", requireUser, (req, res) => {
  const u = req.user, lang = u.lang || "ar", level = u.level || "beginner";
  const prog = progressFor(u, level);
  const read = readSet(u, level);
  const lessons = db.lessons.slice(0, 40).map((l) => ({ ...lessonCard(l, level, lang, read), required: prog.requiredIds.includes(l.id) }));
  lessons.sort((a, b) => (b.required - a.required) || (a.read - b.read));
  res.json({
    user: publicUser(u), level, lang, progress: prog,
    categories: CATEGORIES.map((c) => ({ id: c.id, label: lang === "ar" ? c.ar : c.en })),
    lessons, lastUpdate: db.settings.lastUpdate, engine: db.settings.source,
    review: u.review || null
  });
});

app.get("/api/lesson/:id", requireUser, (req, res) => {
  const l = lessonById(req.params.id);
  if (!l) return res.status(404).json({ error: "not_found" });
  const u = req.user, lang = u.lang || "ar", level = u.level || "beginner";
  const cat = CATEGORIES.find((c) => c.id === l.category);
  res.json({
    id: l.id, category: l.category, categoryLabel: lang === "ar" ? cat?.ar : cat?.en, level,
    title: lang === "ar" ? l.title_ar : l.title_en, source: l.source, url: l.url, date: l.date,
    text: l.levels[level]?.[lang] || l.levels[level]?.en, textEn: l.levels[level]?.en,
    terms: (l.terms || []).map((t) => ({ term: lang === "ar" ? t.term_ar : t.term_en, termEn: t.term_en, def: lang === "ar" ? t.def_ar : t.def_en })),
    wiki: l.wiki || [], read: Boolean(readSet(u, level)[l.id]),
    image: l.image || null, icon: l.icon || favicon(l.url), arMissing: Boolean(l.arMissing),
    article: l.article ? { ok: l.article.ok, words: l.article.words, text: lang === "ar" && l.article.text_ar ? l.article.text_ar : l.article.text, textEn: l.article.text, isTranslated: lang === "ar" && Boolean(l.article.text_ar) } : null,
    highlight: req.query.highlight ? String(req.query.highlight) : null
  });
});

app.post("/api/lesson/:id/done", requireUser, (req, res) => {
  const u = req.user, level = u.level || "beginner";
  if (!lessonById(req.params.id)) return res.status(404).json({ error: "not_found" });
  readSet(u, level)[req.params.id] = Date.now();
  if (u.review?.wrong?.includes(req.params.id)) {
    u.review.reread = u.review.reread || [];
    if (!u.review.reread.includes(req.params.id)) u.review.reread.push(req.params.id);
  }
  save();
  res.json({ progress: progressFor(u, level), review: u.review || null });
});

// ---------- placement ----------
function q(l, level, lang, idx) {
  const src = l.questions[level][idx];
  return { lessonId: l.id, level, idx, title: lang === "ar" ? l.title_ar : l.title_en, q: lang === "ar" ? src.q_ar : src.q_en, choices: lang === "ar" ? src.choices_ar : src.choices_en };
}
app.get("/api/placement", requireUser, (req, res) => {
  const lang = req.user.lang || "ar";
  const items = [];
  for (const level of LEVELS) {
    const pool = requiredFor(level).ids.map(lessonById).filter((l) => l?.questions?.[level]?.length);
    const chosen = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    for (const l of chosen) items.push(q(l, level, lang, Math.floor(Math.random() * l.questions[level].length)));
  }
  req.user.activePlacement = items.map((i) => ({ lessonId: i.lessonId, level: i.level, idx: i.idx }));
  save();
  res.json({ questions: items.map((i, n) => ({ n, q: i.q, choices: i.choices, title: i.title })) });
});
app.post("/api/placement", requireUser, (req, res) => {
  const u = req.user;
  let level = "beginner", score = 0;
  if (!req.body.skipped && u.activePlacement) {
    const answers = req.body.answers || [];
    u.activePlacement.forEach((p, i) => { const l = lessonById(p.lessonId); if (l && l.questions[p.level][p.idx].answer === answers[i]) score++; });
    level = score >= 5 ? "expert" : score >= 3 ? "intermediate" : "beginner";
  }
  u.level = level; delete u.activePlacement; save();
  res.json({ level, score, user: publicUser(u), progress: progressFor(u, level) });
});

// ---------- level-up quiz ----------
app.get("/api/quiz", requireUser, (req, res) => {
  const u = req.user, level = u.level || "beginner", lang = u.lang || "ar";
  const prog = progressFor(u, level);
  if (!prog.quizReady) return res.status(400).json({ error: "not_ready", progress: prog });
  const items = prog.requiredIds.map(lessonById).filter((l) => l?.questions?.[level]?.length)
    .map((l) => q(l, level, lang, Math.floor(Math.random() * l.questions[level].length)));
  u.activeQuiz = { level, items: items.map((i) => ({ lessonId: i.lessonId, idx: i.idx })), started: Date.now() };
  save();
  res.json({ level, passMark: PASS_MARK, questions: items.map((i, n) => ({ n, lessonId: i.lessonId, q: i.q, choices: i.choices, title: i.title })) });
});
app.post("/api/quiz", requireUser, (req, res) => {
  const u = req.user, lang = u.lang || "ar";
  const quiz = u.activeQuiz;
  if (!quiz) return res.status(400).json({ error: "no_quiz" });
  const answers = req.body.answers || [];
  const review = quiz.items.map((it, i) => {
    const l = lessonById(it.lessonId); const src = l.questions[quiz.level][it.idx];
    const chosen = answers[i];
    return { lessonId: it.lessonId, title: lang === "ar" ? l.title_ar : l.title_en, q: lang === "ar" ? src.q_ar : src.q_en,
      choices: lang === "ar" ? src.choices_ar : src.choices_en, chosen, answer: src.answer, correct: chosen === src.answer };
  });
  const score = review.filter((r) => r.correct).length;
  const passed = score >= PASS_MARK;
  delete u.activeQuiz;
  let newLevel = quiz.level;
  if (passed) {
    u.badges = u.badges || [];
    if (!u.badges.includes(quiz.level)) u.badges.push(quiz.level);
    delete u.review;
    if (quiz.level === "expert") u.expertDone = true; else newLevel = NEXT[quiz.level];
    u.level = newLevel;
  } else {
    const wrong = review.filter((r) => !r.correct).map((r) => r.lessonId);
    u.review = { wrong, reread: [] };
  }
  save();
  res.json({ score, total: review.length, passed, review, level: newLevel, previousLevel: quiz.level, user: publicUser(u), progress: progressFor(u, newLevel) });
});

// ---------- live news feed ----------
app.get("/api/news", requireUser, async (req, res) => {
  const catId = String(req.query.category || "civilian");
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return res.status(400).json({ error: "bad_category" });
  const items = await fetchCategory(cat, 10, { fresh: req.query.fresh === "1" });
  const lessonFor = (url) => db.lessons.find((l) => l.url === url);
  res.json({ category: cat.id, fetchedAt: new Date().toISOString(), items: items.map((a) => { const l = lessonFor(a.url); return { ...a, lessonId: l?.id || null, image: l?.image || null, icon: favicon(a.url) }; }) });
});
// Read any headline inside the app: fetch + extract on demand (cached). Arabic via free translation.
app.get("/api/article", requireUser, async (req, res) => {
  const url = String(req.query.url || "");
  if (!/^https?:\/\//.test(url)) return res.status(400).json({ error: "bad_url" });
  const a = await fetchArticle(url);
  if (!a || !a.ok) return res.status(404).json({ error: "no_text", url: a?.url || url });
  const lang = req.user.lang || "ar";
  let text = a.text, translated = false;
  if (lang === "ar") { const t = await translate(a.text.length <= 7000 ? a.text : keySentences(a.text, 10).join(" ")); if (t) { text = t; translated = true; } }
  const titleAr = lang === "ar" ? await translate(a.title) : null;
  res.json({ title: titleAr || a.title, titleEn: a.title, translationPending: lang === "ar" && !translated, site: a.site, image: a.image, icon: favicon(a.url), url: a.url, words: a.words, text, textEn: a.text, translated, partial: a.text.length > 7000 && lang === "ar" });
});
app.get("/api/sources", (req, res) => res.json({ sources: sourceList() }));

// ---------- Faris ----------
app.post("/api/faris/ask", requireUser, async (req, res) => {
  const question = String(req.body.question || "").slice(0, 300);
  if (!question.trim()) return res.status(400).json({ error: "empty" });
  const r = await farisAnswer(question, { level: req.user.level || "beginner", lang: req.user.lang || "ar" });
  const l = r.lessonId && lessonById(r.lessonId);
  res.json({ ...r, lessonTitle: l ? (req.user.lang === "en" ? l.title_en : l.title_ar) : null });
});
app.post("/api/faris/report", requireUser, (req, res) => {
  db.reports = db.reports || [];
  db.reports.unshift({ email: req.user.email, screen: String(req.body.screen || ""), note: String(req.body.note || "").slice(0, 500), at: new Date().toISOString() });
  db.reports = db.reports.slice(0, 200); save();
  res.json({ ok: true });
});

// ---------- status / admin ----------
let updating = false;
app.get("/api/status", (req, res) => {
  res.json({ lessons: db.lessons.length, lastUpdate: db.settings.lastUpdate, engine: aiAvailable() ? "claude" : "fallback", updating, updates: db.updates.slice(0, 10), apk: fs.existsSync(path.join(DATA_DIR, "rasid.apk")) });
});
app.post("/api/admin/update", requireUser, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: "admin_only" });
  if (updating) return res.json({ started: false, updating: true });
  triggerUpdate();
  res.json({ started: true });
});
async function triggerUpdate() {
  if (updating) return;
  updating = true;
  try { await runUpdate(); } catch (e) { console.error("[update] failed:", e.message); } finally { updating = false; }
}

app.get("/apk", (req, res) => {
  const f = path.join(DATA_DIR, "rasid.apk");
  if (fs.existsSync(f)) return res.download(f, "rasid.apk");
  res.status(404).type("text/plain").send("No APK built yet. See README: build one with PWABuilder (https://www.pwabuilder.com) from this site's URL and save it as data/rasid.apk.");
});

// ---------- static ----------
app.get("/vendor/webauthn.js", (req, res) => res.sendFile(path.join(ROOT, "node_modules/@simplewebauthn/browser/dist/bundle/index.umd.min.js")));
app.use(express.static(path.join(ROOT, "public"), { extensions: ["html"] }));
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(ROOT, "public", "index.html")));

// ---------- boot ----------
function seedIfEmpty() {
  if (db.lessons.length) return;
  const seedFile = path.join(ROOT, "data", "seed.json");
  if (!fs.existsSync(seedFile)) return;
  const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  db.lessons = seed.lessons.map((l) => ({ ...l, date: today(), engine: "seed" }));
  db.required[today()] = Object.fromEntries(LEVELS.map((lv) => [lv, CATEGORIES.map((c) => db.lessons.find((l) => l.category === c.id)?.id).filter(Boolean)]));
  saveNow();
  console.log(`[seed] loaded ${db.lessons.length} example lessons`);
}

seedIfEmpty();
app.listen(PORT, () => {
  console.log(`Rasid running at http://localhost:${PORT}  (content engine: ${aiAvailable() ? "Claude" : "fallback, set ANTHROPIC_API_KEY for AI lessons"})`);
  if (!process.env.RASID_NO_UPDATE) {
    const live = db.lessons.filter((l) => l.engine !== 'seed');
    const stale = !db.settings.lastUpdate || db.settings.lastUpdate.slice(0, 10) !== today() || live.length < 5 || live.some((l) => (l.version || 1) < 2);
    if (stale) setTimeout(triggerUpdate, 2000);
    cron.schedule("0 6 * * *", triggerUpdate);
  }
});
