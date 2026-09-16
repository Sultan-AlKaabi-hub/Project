// Demo mode: the whole course runs in the browser with progress saved on this device (localStorage).
// Used automatically on GitHub Pages or any static host. The Node server provides the full version
// (accounts, fingerprint sign-in, Google Authenticator, live news with the in-app reader, Claude-powered Faris).
(function () {
  const enabled = /github\.io$/.test(location.hostname) || location.protocol === "file:" || /[?&]static=1/.test(location.search);
  const LEVELS = ["beginner", "intermediate", "expert"];
  const NEXT = { beginner: "intermediate", intermediate: "expert", expert: null };
  const PASS = 4, SIZE = 5;
  const KEY = "rasid.local";

  function loadState() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
  let S = loadState();
  const user = () => S.user;
  const C = () => window.CURRICULUM;
  const all = () => LEVELS.flatMap((lv) => C()[lv].modules.map((m) => ({ ...m, level: lv })));
  const modById = (id) => all().find((m) => m.id === id);
  const lessonById = (id) => { for (const m of all()) { const l = m.lessons.find((x) => x.id === id); if (l) return { lesson: l, module: m }; } return null; };
  const li = (lv) => LEVELS.indexOf(lv);
  const st = (id) => { const u = user(); u.course = u.course || { modules: {} }; u.course.modules[id] = u.course.modules[id] || { read: [], passed: false, attempts: 0, needsReread: false }; return u.course.modules[id]; };
  const rid = () => Math.random().toString(16).slice(2, 14);

  const publicUser = (u) => ({ email: u.email, name: u.name || u.email.split("@")[0], lang: u.lang || "ar", level: u.level || null, placed: Boolean(u.level), totpEnabled: false, passkeys: 0, badges: u.badges || [], expertDone: Boolean(u.expertDone), isAdmin: false, demo: true });

  function modSummary(m, lang) {
    const u = user(), s = st(m.id);
    const read = m.lessons.filter((l) => s.read.includes(l.id)).length;
    const locked = li(m.level) > li(u.level || "beginner");
    return { id: m.id, level: m.level, icon: m.icon, title: m.title[lang], desc: m.desc[lang], skills: m.skills[lang], lessons: m.lessons.length, read, passed: s.passed, attempts: s.attempts, locked,
      quizReady: !locked && read === m.lessons.length && !s.needsReread, needsReread: s.needsReread,
      status: s.passed ? "passed" : locked ? "locked" : s.needsReread ? "failed" : read === m.lessons.length ? "quiz" : read > 0 ? "in_progress" : "new",
      certId: s.certId || null, lastScore: s.lastScore ?? null, firstLesson: m.lessons[0].id };
  }
  function levelSummary(lv, lang) {
    const u = user();
    const modules = C()[lv].modules.map((m) => modSummary({ ...m, level: lv }, lang));
    const passed = modules.filter((m) => m.passed).length;
    return { id: lv, modules, passed, total: modules.length, complete: passed === modules.length, locked: li(lv) > li(u.level || "beginner") };
  }
  function courseSummary(lang) {
    const u = user();
    const levels = LEVELS.map((lv) => levelSummary(lv, lang));
    const cur = levels.find((l) => l.id === (u.level || "beginner"));
    const certs = (u.certs || []).map((ct) => { const m = modById(ct.moduleId); return { ...ct, title: m ? m.title[lang] : ct.moduleId, icon: m?.icon }; }).reverse();
    return { level: u.level || "beginner", levels, next: cur.modules.find((m) => !m.passed) || null, lessonsRead: Object.values((u.course || { modules: {} }).modules).reduce((n, s) => n + s.read.length, 0), certs, modulesPassed: levels.reduce((n, l) => n + l.passed, 0), expertDone: Boolean(u.expertDone) };
  }
  const notSignedIn = () => Object.assign(new Error("not signed in"), { code: "not_signed_in" });
  const fail = (code, status = 400) => Object.assign(new Error(code), { code, status });

  async function handle(path, body, method) {
    const [p, qs] = path.split("?");
    const q = Object.fromEntries(new URLSearchParams(qs || ""));
    const u = user(); const lang = u?.lang || localStorage.getItem("rasid.lang") || "ar";
    const need = () => { if (!u) throw notSignedIn(); };

    if (p === "/api/me") return { user: u ? publicUser(u) : null };
    if (p === "/api/auth/signup" || p === "/api/auth/login") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail("bad_email");
      if (!/^\d{6}$/.test(String(body.pin || ""))) throw fail("bad_pin");
      if (p === "/api/auth/login") { if (!S.user || S.user.email !== email || S.user.pin !== body.pin) throw fail("wrong", 401); return { user: publicUser(S.user) }; }
      if (S.user && S.user.email !== email) { /* one local account per device: replace */ }
      S.user = S.user && S.user.email === email ? S.user : { email, pin: body.pin, lang: body.lang === "en" ? "en" : "ar", level: null, badges: [], course: { modules: {} }, certs: [] };
      saveState(S); return { user: publicUser(S.user) };
    }
    if (p === "/api/auth/logout") { return { ok: true }; }
    if (p === "/api/account") { S = {}; saveState(S); return { ok: true }; }
    if (p === "/api/auth/pin/reset-request") return { sent: true, devCode: "000000" };
    if (p === "/api/auth/pin/reset") { if (S.user && S.user.email === String(body.email).toLowerCase() && /^\d{6}$/.test(body.pin)) { S.user.pin = body.pin; saveState(S); return { user: publicUser(S.user) }; } throw fail("bad_code", 401); }
    if (p.startsWith("/api/auth/passkey") || p.startsWith("/api/security/")) throw fail("demo_only");
    if (p === "/api/settings") { need(); if (body.lang === "ar" || body.lang === "en") u.lang = body.lang; if (typeof body.name === "string") u.name = body.name.trim().slice(0, 60); saveState(S); return { user: publicUser(u) }; }
    if (p === "/api/reset") { need(); u.level = null; u.badges = []; u.expertDone = false; u.course = { modules: {} }; delete u.activeQuiz; delete u.activePlacement; saveState(S); return { user: publicUser(u) }; }
    if (p === "/api/status") return { lessons: 0, lastUpdate: null, engine: "demo", updating: false, updates: [], apk: false };
    if (p === "/api/sources") return { sources: [] };

    if (p === "/api/course") { need(); return { user: publicUser(u), lang, course: courseSummary(lang) }; }
    if (p.startsWith("/api/course/module/")) { need(); const m = modById(p.split("/").pop()); if (!m) throw fail("not_found", 404); const s = st(m.id); return { ...modSummary(m, lang), lessonList: m.lessons.map((l) => ({ id: l.id, title: l.title[lang], read: s.read.includes(l.id) })) }; }
    if (p.startsWith("/api/course/lesson/") && p.endsWith("/done")) {
      need(); const id = p.split("/")[4]; const hit = lessonById(id); if (!hit) throw fail("not_found", 404);
      const s = st(hit.module.id); if (!s.read.includes(id)) s.read.push(id);
      if (s.needsReread) { s.rereadSince = s.rereadSince || []; if (!s.rereadSince.includes(id)) s.rereadSince.push(id); if (hit.module.lessons.every((l) => s.rereadSince.includes(l.id))) { s.needsReread = false; s.rereadSince = []; } }
      saveState(S); return { module: modSummary(hit.module, lang), course: courseSummary(lang) };
    }
    if (p.startsWith("/api/course/lesson/")) {
      need(); const hit = lessonById(p.split("/").pop()); if (!hit) throw fail("not_found", 404);
      const { module: m, lesson: l } = hit; const s = st(m.id); const i = m.lessons.indexOf(l);
      return { id: l.id, moduleId: m.id, moduleTitle: m.title[lang], level: m.level, icon: m.icon, title: l.title[lang], body: l.body[lang], bodyEn: l.body.en, read: s.read.includes(l.id), index: i + 1, count: m.lessons.length, nextId: m.lessons[i + 1]?.id || null, locked: li(m.level) > li(u.level || "beginner") };
    }
    if (p.startsWith("/api/course/quiz/")) {
      need(); const m = modById(p.split("/").pop()); if (!m) throw fail("not_found", 404);
      const sum = modSummary(m, lang); if (!sum.quizReady) throw fail("not_ready");
      const idx = m.quiz.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, SIZE);
      u.activeQuiz = { moduleId: m.id, idx }; saveState(S);
      return { moduleId: m.id, title: m.title[lang], passMark: PASS, questions: idx.map((i, n) => ({ n, q: m.quiz[i].q[lang], choices: m.quiz[i].choices[lang] })) };
    }
    if (p === "/api/course/quiz") {
      need(); const a = u.activeQuiz; if (!a) throw fail("no_quiz");
      const m = modById(a.moduleId); const answers = body.answers || [];
      const review = a.idx.map((qi, n) => { const qq = m.quiz[qi]; return { q: qq.q[lang], choices: qq.choices[lang], chosen: answers[n], answer: qq.answer, correct: answers[n] === qq.answer }; });
      const score = review.filter((r) => r.correct).length, passed = score >= PASS;
      const s = st(m.id); s.attempts++; s.lastScore = score;
      let levelUp = null, expertDone = false, certId = null;
      if (passed) {
        s.passed = true; s.needsReread = false;
        if (!s.certId) { s.certId = rid(); u.certs = u.certs || []; u.certs.push({ id: s.certId, moduleId: m.id, level: m.level, score, total: review.length, date: new Date().toISOString() }); }
        certId = s.certId;
        const lv = levelSummary(m.level, lang);
        if (lv.complete && m.level === (u.level || "beginner")) { u.badges = u.badges || []; if (!u.badges.includes(m.level)) u.badges.push(m.level); if (NEXT[m.level]) { u.level = NEXT[m.level]; levelUp = u.level; } else { u.expertDone = true; expertDone = true; } }
      } else { s.needsReread = true; s.rereadSince = []; }
      delete u.activeQuiz; saveState(S);
      return { moduleId: m.id, moduleTitle: m.title[lang], score, total: review.length, passed, review, levelUp, expertDone, certId, level: u.level || "beginner", lessonIds: m.lessons.map((l) => l.id), user: publicUser(u), course: courseSummary(lang) };
    }
    if (p === "/api/placement" && method === "GET") {
      need(); const items = [];
      for (const lv of LEVELS) for (const m of C()[lv].modules.slice().sort(() => Math.random() - 0.5).slice(0, 2)) items.push({ level: lv, moduleId: m.id, qi: Math.floor(Math.random() * m.quiz.length) });
      u.activePlacement = items; saveState(S);
      return { questions: items.map((it, n) => { const m = modById(it.moduleId); const qq = m.quiz[it.qi]; return { n, q: qq.q[lang], choices: qq.choices[lang], title: m.title[lang] }; }) };
    }
    if (p === "/api/placement") {
      need(); let level = "beginner", score = 0;
      if (!body.skipped && u.activePlacement) { u.activePlacement.forEach((it, i) => { if (modById(it.moduleId).quiz[it.qi].answer === (body.answers || [])[i]) score++; }); level = score >= 5 ? "expert" : score >= 3 ? "intermediate" : "beginner"; }
      u.level = level; delete u.activePlacement; u.badges = u.badges || [];
      for (const lv of LEVELS) if (li(lv) < li(level)) { for (const m of C()[lv].modules) { const s = st(m.id); s.passed = true; s.byPlacement = true; } if (!u.badges.includes(lv)) u.badges.push(lv); }
      saveState(S); return { level, score, user: publicUser(u), course: courseSummary(lang) };
    }
    if (p === "/api/faris/ask") {
      need(); const STOP = new Set("the a an of to in on for and or is are was were what who how why ما هو هي ماذا كيف لماذا من في على عن هل مع إلى أن و أو هذا هذه".split(" "));
      const tok = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
      const qt = tok(body.question); let best = null;
      for (const m of all()) for (const l of m.lessons) { const hay = new Set(tok(`${m.title.ar} ${m.title.en} ${l.title.ar} ${l.title.en} ${l.body.ar} ${l.body.en}`)); const sc = qt.reduce((n, w) => n + (hay.has(w) ? 1 : 0), 0); if (sc && (!best || sc > best.sc)) best = { sc, m, l }; }
      if (!best) return { text: lang === "ar" ? "لم أجد جواباً في دروس المسار. جرّب سؤالاً عن أحد المواضيع في الدروس." : "I found no answer in the course lessons. Try asking about one of the lesson topics.", lessonId: null, lessonTitle: null };
      return { text: best.l.body[lang].split(/(?<=[.!؟?])\s/).slice(0, 2).join(" "), lessonId: best.l.id, lessonTitle: best.l.title[lang] };
    }
    if (p === "/api/faris/report") return { ok: true };
    if (p === "/api/news") {
      // Best effort in demo mode: Google News through a public RSS-to-JSON bridge (no key). Falls back to an empty list.
      const queries = { civilian: '"artificial intelligence" -military', us_military: '"artificial intelligence" Pentagon', russia_military: '"artificial intelligence" Russia military', china_military: '"artificial intelligence" China military', other: '"artificial intelligence" Europe OR "Middle East"' };
      const rss = `https://news.google.com/rss/search?q=${encodeURIComponent((queries[q.category] || queries.civilian) + " when:3d")}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const j = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`).then((r) => r.json());
        const items = (j.items || []).slice(0, 15).map((it) => { const m = /^(.*)\s-\s([^-]+)$/.exec(it.title || ""); return { title: m ? m[1] : it.title, source: m ? m[2] : "News", url: it.link, published: it.pubDate, snippet: (it.description || "").replace(/<[^>]+>/g, "").slice(0, 200), via: "Google News", icon: null, demo: true }; });
        return { category: q.category, fetchedAt: new Date().toISOString(), items };
      } catch { return { category: q.category, fetchedAt: new Date().toISOString(), items: [] }; }
    }
    if (p === "/api/article") throw fail("demo_only", 404);
    throw fail("not_found", 404);
  }

  window.LocalAPI = {
    enabled,
    async call(path, body, method) { try { return await handle(path, body, method || (body ? "POST" : "GET")); } catch (e) { if (!e.code) e.code = "error"; throw e; } },
    certificateUrl: (id) => `certificate.html?id=${id}`,
    state: () => S
  };
})();
