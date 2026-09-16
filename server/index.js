import {initializeCampus, seedCampusDemo, installCampus, notifyCoverage} from "./campus.js";
import {subjectOf,hasAI} from "./subjects.js";
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
import * as course from "./curriculum.js";
import QRCode from "qrcode";
import {mailAvailable,sendReset} from "./mail.js";
import { installOperations, eraseOperations } from "./operations.js";
import { installPortal, migrateRoles, roleOf, privateAnswer } from "./portal.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const PORT = Number(process.env.PORT || 3000);
const PASS_MARK = 4;
const NEXT = { beginner: "intermediate", intermediate: "expert", expert: "expert" };

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

// ---------- helpers ----------
const readingContexts = new Map();
setInterval(() => {
  for (const [email, context] of readingContexts) if (context.at < Date.now() - 3600000) readingContexts.delete(email);
}, 60000).unref();
const db = load();
migrateRoles(db); initializeCampus(db);
if(process.env.RASID_SEED_DEMO === "1" || (process.env.NODE_ENV === "production" && process.env.RASID_SEED_DEMO !== "0"))seedCampusDemo(db);
save();
const publicUser = (u) => ({
  email: u.email, name: u.name || u.email.split("@")[0], lang: u.lang || "ar", level: u.level || null, placed: Boolean(u.level),
  totpEnabled: Boolean(u.totp?.enabled), passkeys: (u.passkeys || []).length,
  badges: u.badges || [], expertDone: Boolean(u.expertDone), isAdmin: isAdmin(u), role: roleOf(u), subject:subjectOf(u), hasAI:hasAI(u), isDemo:Boolean(u.isDemo)
});
function isAdmin(u) { return roleOf(u) === "admin"; }
function setCookie(res, token) {
  res.cookie("rasid", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" || Boolean(process.env.RENDER), maxAge: 90 * 24 * 3600 * 1000 });
}
function requireUser(req, res, next) {
  const u = auth.getSession(req.cookies.rasid);
  if (!u) return res.status(401).json({ error: "not signed in" });
  if (!u.lastSeen || Date.now()-u.lastSeen>60000) { u.lastSeen=Date.now(); save(); }
  req.user = u; next();
}

// Same-origin writes, private response caching, and bounded abuse protection.
app.use((req,res,next) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), geolocation=(), microphone=(self)');
  if(req.path.startsWith('/api/')) res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)) {
    const expected=process.env.PUBLIC_ORIGIN || req.protocol+'://'+req.get('host');
    if(req.get('sec-fetch-site')==='cross-site' || (req.get('origin') && req.get('origin')!==expected)) return res.status(403).json({error:'cross_origin'});
  }
  next();
});
const limits=new Map();
app.use('/api', (req,res,next) => {
  if(req.method==='GET') return next();
  const authRequest=req.path.startsWith('/auth/');
  const key=(authRequest?'auth:':'write:')+req.ip;
  const now=Date.now(); let bucket=limits.get(key);
  if(!bucket || bucket.until<now) { bucket={count:0,until:now+60000}; limits.set(key,bucket); }
  if(limits.size>10000) for(const [k,v] of limits) if(v.until<now) limits.delete(k);
  if(++bucket.count>(authRequest?15:60)) { res.setHeader('Retry-After','60'); return res.status(429).json({error:'rate_limited'}); }
  next();
});
app.use(["/api/course","/api/placement","/api/news","/api/article","/api/certificate"],requireUser,(req,res,next)=>hasAI(req.user)?next():res.status(403).json({error:"subject_restricted"}));
installPortal(app,{db,save,requireUser});
installOperations(app,{db,save:()=>{notifyCoverage(db);save();},requireUser});
installCampus(app,{db,save,requireUser});
app.get('/api/install', async (req,res) => {
  const url=process.env.PUBLIC_ORIGIN || req.protocol+'://'+req.get('host');
  res.json({url,qr:await QRCode.toDataURL(url,{width:240,margin:2}),apk:fs.existsSync(path.join(DATA_DIR,'rasid.apk'))});
});
app.get('/api/privacy', (req,res) => res.json({contact:process.env.PRIVACY_CONTACT || null,operator:process.env.PRIVACY_OPERATOR || null,hostingRegion:process.env.HOSTING_REGION || null}));
// ---------- auth ----------
app.post("/api/auth/signup", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { pin } = req.body;
  if (!auth.validEmail(email)) return res.status(400).json({ error: "bad_email" });
  if (!auth.validCredential(pin)) return res.status(400).json({ error: "bad_pin" });
  if (req.body.privacyAccepted !== true) return res.status(400).json({error:"privacy_required"});
  if (db.users[email]) return res.status(409).json({ error: "exists" });
  db.users[email] = { email, role: "student", subject:"ai", privacyAcceptedAt: Date.now(), privacyVersion: "2026-09-16", pinHash: auth.hashPin(pin), created: Date.now(), lang: req.body.lang === "en" ? "en" : "ar", level: null, read: {}, badges: [], passkeys: [] };
  save();
  setCookie(res, auth.createSession(email));
  res.json({ user: publicUser(db.users[email]) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (!u || !auth.validCredential(req.body.pin) || !auth.checkPin(req.body.pin, u.pinHash)) return res.status(401).json({ error: "wrong" });
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

// Recovery codes are delivered by configured SMTP, never logged.
app.post("/api/auth/pin/reset-request", async (req, res) => {
  if(!mailAvailable()) return res.status(503).json({error:"recovery_unavailable"});
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (u) {
    u.resetCode = { code: String(crypto.randomInt(0, 1_000_000)).padStart(6, "0"), exp: Date.now() + 15 * 60 * 1000 };
    save();
    try { await sendReset(email,u.resetCode.code,u.lang); } catch { delete u.resetCode; save(); return res.status(503).json({error:"recovery_unavailable"}); }
  }
  res.json({ sent: true });
});
app.post("/api/auth/pin/reset", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const u = db.users[email];
  if (!u || !u.resetCode || u.resetCode.exp < Date.now() || u.resetCode.code !== String(req.body.code)) return res.status(401).json({ error: "bad_code" });
  if (!auth.validCredential(req.body.pin)) return res.status(400).json({ error: "bad_pin" });
  u.pinHash = auth.hashPin(req.body.pin); delete u.resetCode;
  for(const [token,session] of Object.entries(db.sessions)) if(session.email===email) delete db.sessions[token];
  save();
  if(u.totp?.enabled) return res.json({needTotp:true,ticket:auth.createPending(email)});
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
  if (typeof req.body.name === "string") req.user.name = req.body.name.trim().slice(0, 60);
  save(); res.json({ user: publicUser(req.user) });
});
app.delete("/api/account", requireUser, (req, res) => {
  const email = req.user.email;
  if(email === "sultan.3ami@gmail.com")return res.status(409).json({error:"owner_protected"});
  if(isAdmin(req.user) && Object.values(db.users).filter(isAdmin).length<=1) return res.status(409).json({error:'last_admin'});
  db.bookings=db.bookings.filter(b=>b.requester!==email && b.host!==email);
  db.slots=db.slots.filter(s=>s.host!==email); db.alerts=db.alerts.filter(a=>a.email!==email && a.senderEmail!==email);
  db.reports=(db.reports||[]).filter(r=>r.email!==email); db.privacyRequests=db.privacyRequests.filter(r=>r.email!==email);
  db.audit=db.audit.filter(a=>a.actor!==email && a.subject!==email); delete db.challenges[email];
  for(const u of Object.values(db.users)) if(u.teacherEmail===email) u.teacherEmail='';
  readingContexts.delete(email);
  eraseOperations(db,email);
  db.shifts=db.shifts.filter(s=>s.teacher!==email);
  delete db.users[email];
  for (const [t, sess] of Object.entries(db.sessions)) if (sess.email === email) delete db.sessions[t];
  saveNow(); res.clearCookie("rasid"); res.json({ ok: true });
});
app.post("/api/reset", requireUser, (req, res) => {
  const u = req.user;
  u.level = null; u.read = {}; u.badges = []; u.expertDone = false; u.course = { modules: {} }; delete u.activeQuiz; delete u.review; delete u.activePlacement;
  save(); res.json({ user: publicUser(u) });
});

// ---------- course (the AI curriculum) ----------
app.get("/api/course", requireUser, (req, res) => {
  const u = req.user, lang = u.lang || "ar";
  res.json({ user: publicUser(u), lang, course: course.courseSummary(u, lang), lastUpdate: db.settings.lastUpdate });
});
app.get("/api/course/module/:id", requireUser, (req, res) => {
  const m = course.moduleById(req.params.id); if (!m) return res.status(404).json({ error: "not_found" });
  const u = req.user, lang = u.lang || "ar";
  const sum = course.moduleSummary(u, m, lang);
  const st = course.progress(u).modules[m.id] || { read: [] };
  res.json({ ...sum, lessonList: m.lessons.map((l) => ({ id: l.id, title: l.title[lang], read: st.read.includes(l.id) })) });
});
app.get("/api/course/lesson/:id", requireUser, (req, res) => {
  const hit = course.lessonById(req.params.id); if (!hit) return res.status(404).json({ error: "not_found" });
  const u = req.user, lang = u.lang || "ar";
  const m = hit.module, l = hit.lesson;
  const st = course.progress(u).modules[m.id] || { read: [] };
  const i = m.lessons.indexOf(l);
  res.json({ id: l.id, moduleId: m.id, moduleTitle: m.title[lang], level: m.level, icon: m.icon, title: l.title[lang], body: l.body[lang], bodyEn: l.body.en,
    read: st.read.includes(l.id), index: i + 1, count: m.lessons.length, nextId: m.lessons[i + 1]?.id || null, locked: course.levelIndex(m.level) > course.levelIndex(u.level || "beginner") });
});
app.post("/api/course/lesson/:id/done", requireUser, (req, res) => {
  const hit=course.lessonById(req.params.id);
  if(hit && course.levelIndex(hit.module.level)>course.levelIndex(req.user.level || "beginner")) return res.status(403).json({error:"locked"});
  const moduleId = course.markRead(req.user, req.params.id);
  if (!moduleId) return res.status(404).json({ error: "not_found" });
  const lang = req.user.lang || "ar";
  res.json({ module: course.moduleSummary(req.user, course.moduleById(moduleId), lang), course: course.courseSummary(req.user, lang) });
});
app.get("/api/course/quiz/:moduleId", requireUser, (req, res) => {
  const u = req.user, lang = u.lang || "ar";
  const m = course.moduleById(req.params.moduleId); if (!m) return res.status(404).json({ error: "not_found" });
  const sum = course.moduleSummary(u, m, lang);
  if (!sum.quizReady) return res.status(400).json({ error: "not_ready", module: sum });
  res.json(course.drawQuiz(u, m.id, lang));
});
app.post("/api/course/quiz", requireUser, (req, res) => {
  const r = course.gradeQuiz(req.user, req.body.answers || [], req.user.lang || "ar");
  if (!r) return res.status(400).json({ error: "no_quiz" });
  res.json({ ...r, user: publicUser(req.user), course: course.courseSummary(req.user, req.user.lang || "ar") });
});

// Certificate: a printable page for one passed module (print to PDF from the browser).
app.get("/api/certificate/:id", requireUser, (req, res) => {
  const u = req.user, lang = req.query.lang === "en" ? "en" : (u.lang || "ar");
  const ct = (u.certs || []).find((x) => x.id === req.params.id);
  if (!ct) return res.status(404).type("text/plain").send("Certificate not found");
  const m = course.moduleById(ct.moduleId);
  const name = u.name || u.email.split("@")[0];
  const L = lang === "ar" ? { t: "شهادة إتمام", sub: "تشهد منصة راصد بأن", passed: "قد اجتاز وحدة", level: "المستوى", score: "النتيجة", date: "التاريخ", id: "رقم الشهادة", skills: "المهارات", print: "طباعة / حفظ PDF", lv: { beginner: "مبتدئ", intermediate: "متوسط", expert: "خبير" } }
                          : { t: "Certificate of Completion", sub: "Rasid certifies that", passed: "has passed the module", level: "Level", score: "Score", date: "Date", id: "Certificate ID", skills: "Skills", print: "Print / Save as PDF", lv: { beginner: "Beginner", intermediate: "Intermediate", expert: "Expert" } };
  const date = new Date(ct.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  res.type("html").send(`<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${L.t} · ${esc(m.title[lang])}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=DM+Sans:wght@400;600;700&display=swap">
  <style>
    body{margin:0;background:#ECE9E4;font-family:${lang === "ar" ? '"IBM Plex Sans Arabic"' : '"DM Sans"'},"Segoe UI",sans-serif;color:#26232A;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
    .cert{width:min(860px,100%);background:#F5F2EE;border-radius:28px;padding:48px 56px;box-shadow:12px 12px 30px rgba(70,58,84,.18),-12px -12px 30px rgba(255,255,255,.95);position:relative;border:10px double #E8E1FB}
    .brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:14px;color:#5B3FCB}
    .brand svg{width:22px;height:22px}
    h1{font-size:40px;margin:26px 0 6px;font-weight:700}
    .sub{color:#6E6873;font-size:17px;margin:0}
    .name{font-size:34px;font-weight:700;margin:22px 0 6px;color:#5B3FCB}
    .mod{font-size:26px;font-weight:600;margin:6px 0 18px}
    .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:22px}
    .meta div{background:#E4E0DA;border-radius:14px;padding:12px 14px;box-shadow:inset 3px 3px 6px rgba(70,58,84,.16),inset -3px -3px 6px rgba(255,255,255,.9)}
    .meta b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6E6873;margin-bottom:4px}
    .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.chip{background:#E8E1FB;color:#5B3FCB;border-radius:999px;padding:4px 12px;font-weight:600;font-size:14px}
    .seal{position:absolute;top:36px;inset-inline-end:44px;width:92px;height:92px;border-radius:50%;background:#7C5CE6;color:#fff;display:grid;place-items:center;text-align:center;font-weight:700;font-size:13px;line-height:1.2;box-shadow:6px 6px 14px rgba(70,58,84,.25)}
    .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;gap:12px;flex-wrap:wrap;color:#6E6873;font-size:13px}
    .sig{border-top:1px solid #6E6873;padding-top:6px;min-width:180px;text-align:center}
    .print{margin-top:22px;border:0;background:#7C5CE6;color:#fff;padding:12px 22px;border-radius:14px;font:inherit;font-weight:600;cursor:pointer}
    @media print{body{background:#fff;padding:0}.cert{box-shadow:none}.print{display:none}}
  </style></head><body>
  <div class="cert">
    <div class="brand"><svg viewBox="0 0 22 22"><g fill="#7C5CE6"><circle cx="11" cy="4" r="2.4"/><circle cx="4" cy="11" r="2.4"/><circle cx="18" cy="11" r="2.4"/><circle cx="11" cy="18" r="2.4"/><circle cx="11" cy="11" r="2.4" opacity=".5"/></g></svg>${lang === "ar" ? "راصد" : "Rasid"}</div>
    <div class="seal">${ct.score}/${ct.total}<br>${L.lv[ct.level]}</div>
    <h1>${L.t}</h1><p class="sub">${L.sub}</p>
    <div class="name">${esc(name)}</div>
    <p class="sub">${L.passed}</p>
    <div class="mod">${m.icon} ${esc(m.title[lang])}</div>
    <p class="sub">${esc(m.desc[lang])}</p>
    <div class="chips">${m.skills[lang].map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
    <div class="meta"><div><b>${L.level}</b>${L.lv[ct.level]}</div><div><b>${L.score}</b>${ct.score} / ${ct.total}</div><div><b>${L.date}</b>${date}</div><div><b>${L.id}</b>${ct.id.toUpperCase()}</div></div>
    <div class="foot"><span>${esc(u.email)}</span><span class="sig">${lang === "ar" ? "فارس، مرشد راصد" : "Faris, Rasid guide"}</span></div>
    <button class="print" onclick="window.print()">${L.print}</button>
  </div></body></html>`);
});

// ---------- placement ----------
app.get("/api/placement", requireUser, (req, res) => res.json(course.drawPlacement(req.user, req.user.lang || "ar")));
app.post("/api/placement", requireUser, (req, res) => {
  const r = course.gradePlacement(req.user, req.body.answers || [], Boolean(req.body.skipped));
  res.json({ ...r, user: publicUser(req.user), course: course.courseSummary(req.user, req.user.lang || "ar") });
});

// ---------- live news feed ----------
app.get("/api/news", requireUser, async (req, res) => {
  const catId = String(req.query.category || "civilian");
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return res.status(400).json({ error: "bad_category" });
  const items = await fetchCategory(cat, 10, { fresh: req.query.fresh === "1" });
  res.json({ category: cat.id, fetchedAt: new Date().toISOString(), items: items.map((a) => ({ ...a, icon: favicon(a.url) })) });
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
  readingContexts.set(req.user.email,{title:titleAr || a.title,text,url:a.url,at:Date.now()});
  if(readingContexts.size>500) readingContexts.delete(readingContexts.keys().next().value);
  res.json({ title: titleAr || a.title, titleEn: a.title, translationPending: lang === "ar" && !translated, site: a.site, image: a.image, icon: favicon(a.url), url: a.url, words: a.words, text, textEn: a.text, translated, partial: a.text.length > 7000 && lang === "ar" });
});
app.get("/api/sources", (req, res) => res.json({ sources: sourceList() }));

// ---------- Faris ----------
app.post("/api/faris/ask", requireUser, async (req, res) => {
  const question = String(req.body.question || "").slice(0, 300);
  if (!question.trim()) return res.status(400).json({ error: "empty" });
  if(!hasAI(req.user))return res.json({text:req.user.lang === "en" ? "Your workspace covers your subject schedule, leave requests, inbox and bookings. AI course records are restricted to AI teachers and administrators." : "تضم مساحتك مناوبات مادتك وطلبات الإجازة والبريد والحجوزات. سجلات الذكاء الاصطناعي متاحة لمعلمي المادة والمسؤولين فقط."});
  const privateResult = privateAnswer(question, req.user, db);
  if(privateResult) return res.json(privateResult);
  const r = await farisAnswer(question, { level: req.user.level || "beginner", lang: req.user.lang || "ar", article: req.body.useArticle && readingContexts.get(req.user.email)?.at>Date.now()-3600000 ? readingContexts.get(req.user.email) : null });
  res.json(r);
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

// Never serve the static-demo answer bank from the production server.
app.use((req,res,next)=>{
  let pathname;try{pathname=decodeURIComponent(req.path).replaceAll('\\','/').toLowerCase();}catch{return res.status(400).end();}
  if(/\/(curriculum-data|local-api)\.js$/.test(pathname))return res.status(404).end();
  next();
});
// ---------- static ----------
app.get("/healthz", (req,res) => res.json({ok:true}));
app.use((req,res,next)=>{if(req.path === "/" || req.path.endsWith(".html") || req.path === "/sw.js")res.setHeader("Cache-Control","no-cache");next();});
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
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rasid running at http://localhost:${PORT}  (content engine: ${aiAvailable() ? "Claude" : "fallback, set ANTHROPIC_API_KEY for AI lessons"})`);
  if (process.env.RASID_NEWS_LESSONS) {
    const stale = !db.settings.lastUpdate || db.settings.lastUpdate.slice(0, 10) !== today();
    if (stale) setTimeout(triggerUpdate, 2000);
    cron.schedule("0 6 * * *", triggerUpdate);
  }
});

for(const signal of ["SIGTERM","SIGINT"]) process.on(signal,()=>{saveNow(); server.close(()=>process.exit(0));});
