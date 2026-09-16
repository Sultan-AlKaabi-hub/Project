// Rasid front end: one small state machine, views rendered into #main.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const S = { lang: localStorage.getItem("rasid.lang") || "ar", user: null, view: "auth", content: null, lesson: null, quiz: null, result: null, placement: null, tab: "all", online: navigator.onLine, status: null };
  window.T = (k, vars = {}) => { let s = (I18N[S.lang] || I18N.ar)[k] ?? k; for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b); return s; };
  const T = window.T;
  const LEVEL_ICON = { beginner: "●", intermediate: "■", expert: "★" };

  async function api(path, body, method) {
    const r = await fetch(path, { method: method || (body ? "POST" : "GET"), headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { code: j.error, data: j });
    return j;
  }

  function applyLang() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("rasid.lang", S.lang);
    document.title = T("appName");
  }

  let toastTimer;
  function toast(msg) {
    let t = $(".toast"); if (!t) { t = h('<div class="toast"></div>'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---------- shell ----------
  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    lessons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
  };
  ICONS.news = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h13a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M19 7v10"/><path d="M8 9h5M8 13h6"/></svg>';
  const BRAND_DOTS = '<svg class="dots" viewBox="0 0 22 22"><g fill="#7C5CE6"><circle cx="11" cy="4" r="2.4"/><circle cx="4" cy="11" r="2.4"/><circle cx="18" cy="11" r="2.4"/><circle cx="11" cy="18" r="2.4"/><circle cx="11" cy="11" r="2.4" opacity=".5"/></g></svg>';

  function renderShell() {
    const app = $("#app");
    if (!S.user) { app.innerHTML = ""; app.className = ""; return; }
    app.className = "app";
    const nav = [["home", "home"], ["news", "news"], ["lessons", "lessons"], ["quiz", "quiz"], ["progress", "progress"]];
    app.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="brand">${BRAND_DOTS}<span>${T("appName")}</span></div>
        <div class="nav-label">${T("workspace")}</div>
        <nav class="nav">${nav.map(([v, k]) => `<button data-view="${v}" class="${S.view === v ? "active" : ""}">${ICONS[v]}<span>${T(k)}</span></button>`).join("")}</nav>
        <div class="nav-label">${T("manage")}</div>
        <nav class="nav"><button data-view="settings" class="${S.view === "settings" ? "active" : ""}">${ICONS.settings}<span>${T("settings")}</span></button></nav>
        <div class="status-box sunk">
          <div class="t">${T("statusTitle")}</div>
          <div class="row"><span class="dot"></span><b>${S.user.level ? LEVEL_ICON[S.user.level] + " " + T(S.user.level) : T("notPlaced")}</b></div>
          <div class="row"><span class="dot good"></span><span id="status-lessons">${S.content ? `${S.content.progress.done}/${S.content.progress.total}` : "–"} ${T("lessonsDone")}</span></div>
        </div>
      </aside>
      <div class="scrim" id="scrim" hidden></div>
      <main class="main" id="main"></main>`;
    app.querySelectorAll("[data-view]").forEach((b) => (b.onclick = () => { go(b.dataset.view); closeMenu(); }));
    $("#scrim").onclick = closeMenu;
  }
  function renderLangPill() {
    let p = $("#lang-pill"); if (!p) { p = h('<button id="lang-pill" class="lang-pill" aria-label="language"></button>'); document.body.appendChild(p); }
    p.innerHTML = `<span class="${S.lang === "en" ? "on" : ""}">EN</span><span class="sep">|</span><span class="${S.lang === "ar" ? "on" : ""}">ع</span>`;
    p.onclick = async () => { S.lang = S.lang === "ar" ? "en" : "ar"; applyLang(); if (S.user) { try { await api("/api/settings", { lang: S.lang }); } catch {} } S.content = null; go(S.view, S.lastOpts || {}); };
  }
  function closeMenu() { $("#sidebar")?.classList.remove("open"); const s = $("#scrim"); if (s) s.hidden = true; }
  function topbar(title, sub, right = "") {
    return `<div class="topbar"><div class="row"><button class="btn small menu-btn" id="menu-btn" aria-label="menu">☰</button><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div></div><div class="row">${right}</div></div>
      ${S.online ? "" : `<div class="banner">⚠ ${T("offline")}</div>`}`;
  }
  function wireTopbar() { const b = $("#menu-btn"); if (b) b.onclick = () => { $("#sidebar").classList.add("open"); $("#scrim").hidden = false; }; }

  async function go(view, opts = {}) {
    S.view = view; S.lastOpts = opts;
    if (S.user && !S.user.placed && !["settings", "placement"].includes(view)) S.view = "placement";
    if (!S.user) S.view = "auth";
    renderShell();
    const v = VIEWS[S.view];
    if (v) await v(opts);
    renderLangPill();
    wireTopbar();
    window.scrollTo(0, 0);
  }

  // ---------- auth ----------
  const VIEWS = {};
  VIEWS.auth = async (opts) => {
    const app = $("#app"); app.className = "auth-wrap";
    const mode = opts.mode || (sessionStorage.getItem("rasid.intro") ? (localStorage.getItem("rasid.seen") ? "login" : "lang") : "intro");
    if (mode === "intro") {
      app.className = "intro-wrap";
      app.innerHTML = `<div class="intro"><div class="intro-scene" id="scene"></div>
        <div class="intro-text"><div class="logo">${BRAND_DOTS}<span class="word">${T("appName")}</span></div>
        <h1>${T("introTitle")}</h1><p class="sub">${T("introSub")}</p>
        <button class="btn primary big" id="enter">${T("enter")}</button></div></div>`;
      renderLangPill();
      S.intro = Intro.mount($("#scene"));
      $("#enter").onclick = () => { sessionStorage.setItem("rasid.intro", "1"); if (S.intro) { S.intro.unmount(); S.intro = null; } go("auth", { mode: localStorage.getItem("rasid.seen") ? "login" : "lang" }); };
      return;
    }
    if (S.intro) { S.intro.unmount(); S.intro = null; }
    const box = h(`<div class="auth raised"><div class="logo">${BRAND_DOTS}<span class="word">${T("appName")}</span></div><p class="sub" style="text-align:center">${T("tagline")}</p><div id="auth-body"></div></div>`);
    app.innerHTML = ""; app.appendChild(box);
    const body = $("#auth-body");
    const form = (inner) => { body.innerHTML = inner; };

    if (mode === "lang") {
      form(`<h2 style="text-align:center">${T("chooseLang")}</h2><div class="lang-choice"><button class="btn" data-l="ar">العربية</button><button class="btn" data-l="en">English</button></div>`);
      body.querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { S.lang = b.dataset.l; applyLang(); localStorage.setItem("rasid.seen", "1"); go("auth", { mode: "signup" }); }));
      return;
    }
    if (mode === "signup" || mode === "login") {
      const signup = mode === "signup";
      form(`<h2>${signup ? T("createAccount") : T("signIn")}</h2>
        <form class="stack" id="f">
          <div class="field"><label>${T("email")}</label><input id="email" type="email" inputmode="email" autocomplete="email" required><span class="ok" id="email-ok"></span></div>
          <div class="field"><label>${T("pin")}</label><input id="pin" class="pin" type="password" inputmode="numeric" pattern="\\d{6}" maxlength="6" autocomplete="${signup ? "new-password" : "current-password"}" required></div>
          ${signup ? `<div class="field"><label>${T("pinAgain")}</label><input id="pin2" class="pin" type="password" inputmode="numeric" maxlength="6" required><span class="ok" id="pin-ok"></span></div>` : ""}
          <div class="err" id="err"></div>
          <button class="btn primary big" type="submit">${signup ? T("continueBtn") : T("signIn")}</button>
        </form>
        <div class="stack">
          ${signup ? "" : `<button class="btn" id="passkey">${T("usePasskey")}</button><button class="btn ghost" id="forgot">${T("forgotPin")}</button>`}
          <button class="btn ghost" id="switch">${signup ? T("haveAccount") : T("noAccount")}</button>
        </div>`);
      const f = $("#f"), err = $("#err");
      $("#email").oninput = (e) => { $("#email-ok").textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) ? "✓" : ""; };
      if (signup) $("#pin2").oninput = () => { $("#pin-ok").textContent = $("#pin").value.length === 6 && $("#pin").value === $("#pin2").value ? "✓ " + T("pinMatch") : ""; };
      $("#switch").onclick = () => go("auth", { mode: signup ? "login" : "signup" });
      f.onsubmit = async (e) => {
        e.preventDefault(); err.textContent = "";
        const email = $("#email").value.trim(), pin = $("#pin").value;
        if (!/^\d{6}$/.test(pin)) return (err.textContent = T("errBadPin"));
        if (signup && pin !== $("#pin2").value) return (err.textContent = T("errBadPin"));
        try {
          const r = await api(signup ? "/api/auth/signup" : "/api/auth/login", { email, pin, lang: S.lang });
          if (r.needTotp) return go("auth", { mode: "totp", ticket: r.ticket });
          await signedIn(r.user, signup);
        } catch (ex) { err.textContent = { bad_email: T("errBadEmail"), bad_pin: T("errBadPin"), exists: T("errExists"), wrong: T("errWrong") }[ex.code] || T("errNet"); }
      };
      if (!signup) {
        $("#forgot").onclick = () => go("auth", { mode: "reset", email: $("#email").value.trim() });
        $("#passkey").onclick = async () => {
          err.textContent = "";
          const email = $("#email").value.trim();
          if (!email) return (err.textContent = T("errBadEmail"));
          try {
            const opts = await api("/api/auth/passkey/options", { email });
            const resp = await SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: opts });
            const r = await api("/api/auth/passkey/verify", { email, response: resp });
            await signedIn(r.user, false);
          } catch (ex) { err.textContent = ex.code === "no_passkey" ? T("passkeyNone") : (ex.message || T("errNet")); }
        };
      }
      return;
    }
    if (mode === "totp") {
      form(`<h2>${T("twoStepTitle")}</h2><p class="sub">${T("twoStepHint")}</p>
        <form class="stack" id="f"><div class="field"><input id="code" class="pin" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required></div><div class="err" id="err"></div><button class="btn primary big">${T("confirm")}</button></form>
        <button class="btn ghost" id="back">${T("back")}</button>`);
      $("#back").onclick = () => go("auth", { mode: "login" });
      $("#f").onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/auth/totp", { ticket: opts.ticket, code: $("#code").value }); await signedIn(r.user, false); } catch { $("#err").textContent = T("errWrongCode"); } };
      return;
    }
    if (mode === "reset") {
      form(`<h2>${T("forgotPin")}</h2>
        <form class="stack" id="f1"><div class="field"><label>${T("email")}</label><input id="email" type="email" value="${esc(opts.email || "")}" required></div><button class="btn primary big">${T("continueBtn")}</button></form>
        <form class="stack" id="f2" hidden><p class="sub">${T("codeSentTitle")}</p>
          <div class="field"><label>${T("codeField")}</label><input id="code" class="pin" inputmode="numeric" maxlength="6" required></div>
          <div class="field"><label>${T("newPin")}</label><input id="pin" class="pin" type="password" inputmode="numeric" maxlength="6" required></div>
          <div class="err" id="err"></div><button class="btn primary big">${T("resetPin")}</button></form>
        <button class="btn ghost" id="back">${T("back")}</button>`);
      $("#back").onclick = () => go("auth", { mode: "login" });
      $("#f1").onsubmit = async (e) => { e.preventDefault(); const r = await api("/api/auth/pin/reset-request", { email: $("#email").value.trim() }); $("#f1").hidden = true; $("#f2").hidden = false; if (r.devCode) $("#code").value = r.devCode; };
      $("#f2").onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/auth/pin/reset", { email: $("#email").value.trim(), code: $("#code").value, pin: $("#pin").value }); await signedIn(r.user, false); } catch (ex) { $("#err").textContent = ex.code === "bad_pin" ? T("errBadPin") : T("errWrongCode"); } };
    }
  };

  async function signedIn(user, isNew) {
    S.user = user; S.lang = user.lang || S.lang; applyLang();
    Faris.show();
    if (isNew && window.PublicKeyCredential && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      setTimeout(() => offerPasskey(), 800);
    }
    await refresh();
    if (!user.placed) { go("placement"); Faris.say(T("farisHello"), { actions: [{ label: T("start"), run: () => Faris.say(T("farisPlacement")) }] }); }
    else { go("home"); Faris.say(T("farisHello"), { open: false, pulse: true }); }
  }
  async function offerPasskey() {
    const yes = confirm(S.lang === "ar" ? "استخدام البصمة أو الوجه في المرة القادمة؟" : "Use fingerprint or face next time?");
    if (yes) await registerPasskey();
  }
  async function registerPasskey() {
    try {
      const opts = await api("/api/security/passkey/register/options", {});
      const resp = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: opts });
      const r = await api("/api/security/passkey/register/verify", resp);
      S.user.passkeys = r.passkeys; toast("✓ " + T("passkeyAdded"));
    } catch (e) { toast(e.message || T("errNet")); }
  }
  async function refresh() {
    try { S.content = await api("/api/content"); S.user = S.content.user; S.online = true; }
    catch (e) { if (e.message === "Failed to fetch") S.online = false; }
  }

  // ---------- placement ----------
  VIEWS.placement = async () => {
    const m = $("#main");
    m.innerHTML = topbar(T("placementTitle"), T("placementSub")) + `<div class="card q-card" id="pl"><div class="row"><button class="btn primary" id="startq">${T("startQuestions")}</button><button class="btn" id="skip">${T("startBeginner")}</button></div></div>`;
    $("#skip").onclick = () => finishPlacement({ skipped: true });
    $("#startq").onclick = async () => {
      const { questions } = await api("/api/placement");
      runQuestions($("#pl"), questions, async (answers) => finishPlacement({ answers }));
    };
  };
  async function finishPlacement(body) {
    const r = await api("/api/placement", body);
    S.user = r.user; await refresh();
    const m = $("#main");
    m.innerHTML = topbar(T("yourLevel")) + `<div class="card result"><div class="level-badge" style="justify-content:center"><span class="icon">${LEVEL_ICON[r.level]}</span>${T(r.level)}</div><p class="sub" style="margin:14px 0 22px">${T("lessonsAhead")}</p><button class="btn primary big" id="ok">${T("ok")}</button></div>`;
    $("#ok").onclick = () => { go("home"); Faris.say(T("farisPlaced", { level: T(r.level) })); };
  }

  // Generic question runner (placement + quiz). onDone(answers)
  function runQuestions(container, questions, onDone, { quitLabel } = {}) {
    let i = 0; const answers = [];
    const step = () => {
      const q = questions[i];
      container.innerHTML = `<div class="dots">${questions.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>
        <div class="question">${esc(q.q)}</div>
        <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join("")}</div>
        <div class="row" style="margin-top:18px;justify-content:space-between"><button class="btn primary" id="next" disabled>${i === questions.length - 1 ? T("finish") : T("next")}</button>${quitLabel ? `<button class="btn ghost" id="quit">${quitLabel}</button>` : ""}</div>`;
      let sel = null;
      container.querySelectorAll(".choice").forEach((b) => (b.onclick = () => { container.querySelectorAll(".choice").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sel = Number(b.dataset.k); $("#next").disabled = false; }));
      $("#next").onclick = () => { answers.push(sel); i++; if (i < questions.length) step(); else onDone(answers); };
      const qb = $("#quit"); if (qb) qb.onclick = () => { if (confirm(T("quitConfirm"))) go("lessons"); };
    };
    step();
  }

  // ---------- home ----------
  VIEWS.home = async () => {
    await refresh();
    const c = S.content, p = c.progress, pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const engine = c.engine === "claude" ? T("engineClaude") : c.lessons.some((l) => l.engine === "seed") && !c.lastUpdate ? T("engineSeed") : T("engineFallback");
    const quizBtn = p.quizReady ? `<button class="btn primary" id="toquiz">${T("quizReady")}</button>` : `<button class="btn primary" disabled>${p.retryBlocked ? T("quizBlocked") : T("quizLocked")}</button>`;
    $("#main").innerHTML = topbar(T("greeting"), T("greetingSub")) + `
      <div class="hero">
        <div class="card level-card">
          <span class="pill">${T("level")}</span>
          <div class="level-badge"><span class="icon">${LEVEL_ICON[c.level]}</span>${T(c.level)}</div>
          <p class="sub">${T("requiredToday")}: <b>${p.done} ${T("ofFive")} ${p.total}</b></p>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="row" style="margin-top:8px">${quizBtn}<button class="btn" id="tolessons">${T("openLessons")}</button></div>
        </div>
        <div class="card ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--sunk)" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="var(--good)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(pct / 100) * 314} 314" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle" class="num" fill="var(--ink)" font-size="26" font-weight="700">${pct}%</text></svg></div>
      </div>
      <div class="stats">
        <div class="card stat"><span class="n">${S.user.badges.length}</span><span class="l">${T("passed")}</span></div>
        <div class="card stat"><span class="n">${c.lessons.filter((l) => l.read).length}</span><span class="l">${T("read")}</span></div>
        <div class="card stat"><span class="n">${c.lessons.length}</span><span class="l">${T("lessons")}</span></div>
      </div>
      <p class="sub" style="margin-top:16px">${engine}${c.lastUpdate ? ` · ${T("lastUpdate")}: ${new Date(c.lastUpdate).toLocaleString(S.lang === "ar" ? "ar" : "en")}` : ""}</p>`;
    $("#tolessons").onclick = () => go("lessons");
    const q = $("#toquiz"); if (q) q.onclick = () => go("quiz");
  };

  // ---------- live news ----------
  VIEWS.news = async (opts) => {
    await refresh();
    const c = S.content; S.newsTab = S.newsTab || "civilian";
    const m = $("#main");
    m.innerHTML = topbar(`<span class="live"><span class="dot good"></span>${T("news")}</span>`, "", `<button class="btn small" id="fresh">${T("refresh")}</button>`) +
      `<div class="tabs">${c.categories.map((t) => `<button data-t="${t.id}" class="${S.newsTab === t.id ? "active" : ""}">${t.label}</button>`).join("")}</div><div class="lesson-list" id="news"><p class="sub">…</p></div>`;
    m.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { S.newsTab = b.dataset.t; go("news"); }));
    $("#fresh").onclick = () => go("news", { fresh: true });
    let r; try { r = await api(`/api/news?category=${S.newsTab}${opts.fresh ? "&fresh=1" : ""}`); } catch { r = { items: [] }; }
    const list = $("#news"); if (!list) return;
    const fmt = (d) => { const ms = Date.now() - new Date(d).getTime(), h = Math.floor(ms / 3600000); return h < 1 ? (S.lang === "ar" ? "قبل دقائق" : "minutes ago") : h < 24 ? (S.lang === "ar" ? `قبل ${h} س` : `${h}h ago`) : (S.lang === "ar" ? `قبل ${Math.floor(h / 24)} ي` : `${Math.floor(h / 24)}d ago`); };
    list.innerHTML = r.items.length ? r.items.map((it) => `
      <div class="card news-item"><div>
        <p class="t"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a></p>
        <div class="m"><span class="pill muted">${esc(it.source)}</span><span>${fmt(it.published)}</span>${it.via ? `<span>· ${esc(it.via)}</span>` : ""}</div>
        ${it.snippet ? `<p class="snip">${esc(it.snippet.slice(0, 180))}…</p>` : ""}
        <div class="row" style="margin-top:8px">${it.lessonId ? `<button class="btn small primary" data-open="${it.lessonId}">${T("openLessonBtn")}</button>` : ""}<a class="btn small" href="${esc(it.url)}" target="_blank" rel="noopener">${T("readOriginal")}</a></div>
      </div></div>`).join("") + `<p class="sub">${T("fetchedAt")}: ${new Date(r.fetchedAt).toLocaleTimeString(S.lang === "ar" ? "ar" : "en")}</p>` : `<p class="sub">${T("noNews")}</p>`;
    list.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => openLesson(b.dataset.open)));
  };

  // ---------- lessons ----------
  VIEWS.lessons = async () => {
    await refresh();
    const c = S.content, p = c.progress;
    const list = c.lessons.filter((l) => S.tab === "all" || l.category === S.tab);
    $("#main").innerHTML = topbar(T("lessons"), `${T("requiredToday")}: ${p.done} ${T("ofFive")} ${p.total}`,
      p.quizReady ? `<button class="btn primary" id="toquiz">${T("quizReady")}</button>` : `<button class="btn primary" disabled>${p.retryBlocked ? T("quizBlocked") : T("quizLocked")}</button>`) + `
      <div class="tabs">${[{ id: "all", label: T("all") }, ...c.categories].map((t) => `<button data-t="${t.id}" class="${S.tab === t.id ? "active" : ""}">${t.label}</button>`).join("")}</div>
      <div class="lesson-list">${list.map((l) => `
        <button class="card lesson ${l.read ? "done" : ""}" data-id="${l.id}">
          <div><div class="meta"><span class="pill muted">${esc(l.categoryLabel)}</span>${l.required ? `<span class="pill">★ ${T("required")}</span>` : ""}${l.read ? `<span class="pill good">✓ ${T("read")}</span>` : ""}</div>
          <p class="title">${esc(l.title)}</p><p class="prev">${esc(l.preview)}…</p><div class="src">${esc(l.source)} · ${l.date}</div></div>
          <span class="check ${l.read ? "on" : ""}">✓</span>
        </button>`).join("")}</div>`;
    $("#main").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { S.tab = b.dataset.t; go("lessons"); }));
    $("#main").querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => openLesson(b.dataset.id)));
    const q = $("#toquiz"); if (q) q.onclick = () => go("quiz");
    if (!sessionStorage.getItem("rasid.tourLessons")) { sessionStorage.setItem("rasid.tourLessons", "1"); Faris.say(T("farisLessons")); }
  };

  async function openLesson(id, highlight) {
    S.view = "lesson"; renderShell();
    const l = await api(`/api/lesson/${id}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ""}`);
    S.lesson = l;
    // Dotted-underline terms inside text.
    let body = esc(l.text);
    for (const t of l.terms) { const re = new RegExp(esc(t.term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); body = body.replace(re, (m) => `<span class="term" data-term="${esc(t.term)}">${m}</span>`); }
    if (l.highlight) { const re = new RegExp(esc(l.highlight).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); body = body.replace(re, (m) => `<mark>${m}</mark>`); }
    $("#main").innerHTML = topbar(esc(l.title), `${esc(l.categoryLabel)} · ${T(l.level)} · ${l.date}`, `<button class="btn small" id="back">${T("back")}</button>`) + `
      <div class="card reader"><div class="body">${body}</div><div id="def"></div>
        <p class="endmark">— ${T("endOfLesson")} —</p>
        <p class="sub">${T("source")}: ${esc(l.source)} · <a href="${esc(l.url)}" target="_blank" rel="noopener">${T("openSource")}</a></p>
        <div id="gotit" hidden style="margin-top:14px"><button class="btn primary big" id="done">${l.read ? "✓ " + T("read") : T("gotIt")}</button></div>
      </div>`;
    $("#back").onclick = () => go(S.result ? "result" : "lessons");
    $("#main").querySelectorAll(".term").forEach((s) => (s.onclick = () => {
      const t = l.terms.find((x) => x.term === s.dataset.term);
      $("#def").innerHTML = `<div class="def sunk"><span class="t">${esc(t.term)}</span>: ${esc(t.def)} <button class="btn ghost small" id="cd">${T("close")}</button></div>`;
      $("#cd").onclick = () => ($("#def").innerHTML = "");
    }));
    // "Got it" appears only when the end is on screen.
    const end = $(".endmark");
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { $("#gotit").hidden = false; io.disconnect(); } });
    io.observe(end);
    $("#done").onclick = async () => {
      const r = await api(`/api/lesson/${id}/done`, {});
      const left = r.progress.total - r.progress.done;
      if (S.result) { S.result.review.forEach((it) => { if (it.lessonId === id) it.reread = true; }); S.result.retryBlocked = r.progress.retryBlocked; go("result"); return; }
      await refresh(); go("lessons");
      Faris.say(left === 0 ? T("farisAllDone") : T("farisLessonDone", { n: left }), { open: true });
    };
  }
  window.App = { openLesson: (id) => openLesson(id) };

  // ---------- quiz ----------
  VIEWS.quiz = async () => {
    await refresh();
    const p = S.content.progress;
    $("#main").innerHTML = topbar(T("quiz"), T(S.content.level)) + `<div class="card q-card" id="qz"><p>${T("quizIntro")}</p>${p.quizReady ? `<button class="btn primary big" id="start">${T("start")}</button>` : `<button class="btn primary big" disabled>${p.retryBlocked ? T("quizBlocked") : T("quizLocked")}</button><p class="sub" style="margin-top:10px">${p.done} ${T("ofFive")} ${p.total}</p>`}</div>`;
    const s = $("#start"); if (!s) return;
    s.onclick = async () => {
      const { questions } = await api("/api/quiz");
      Faris.say(T("farisQuiz"), { open: false, pulse: true });
      const guard = (e) => { e.preventDefault(); e.returnValue = ""; };
      window.addEventListener("beforeunload", guard);
      runQuestions($("#qz"), questions, async (answers) => {
        window.removeEventListener("beforeunload", guard);
        const r = await api("/api/quiz", { answers });
        S.result = { ...r, retryBlocked: !r.passed }; S.user = r.user; await refresh(); go("result");
      }, { quitLabel: T("quit") });
    };
  };

  VIEWS.result = async () => {
    const r = S.result; if (!r) return go("home");
    const passed = r.passed;
    const head = passed ? (r.previousLevel === "expert" ? T("expertNow") : T("levelUp")) : T("failed");
    const allReread = r.review.filter((i) => !i.correct).every((i) => i.reread);
    $("#main").innerHTML = topbar(head) + `
      <div class="card result"><div class="score">${r.score}/${r.total}</div>
        ${passed ? `<div class="level-badge" style="justify-content:center;margin:10px 0"><span class="icon">${LEVEL_ICON[r.level]}</span>${T(r.level)}</div><button class="btn primary big" id="cont">${T("continueBtn")}</button>`
                 : `<p class="sub">${T("tryAgainHint")}</p><button class="btn primary big" id="retry" ${allReread ? "" : "disabled"}>${T("tryAgain")}</button>`}
      </div>
      ${passed ? "" : `<h2 style="margin-top:24px">${T("reviewTitle")}</h2><div class="stack">${r.review.map((it) => `
        <div class="card review-item"><div class="row" style="justify-content:space-between"><b>${esc(it.q)}</b><span class="mark ${it.correct ? "ok" : "no"}">${it.correct ? "✓" : "✗"}</span></div>
          <p class="sub">${T("yourAnswer")}: ${esc(it.choices[it.chosen] ?? "—")}</p>
          ${it.correct ? "" : `<p><span class="mark ok">✓</span> ${T("correctAnswer")}: <b>${esc(it.choices[it.answer])}</b></p><p class="sub">${esc(it.title)}</p><button class="btn small ${it.reread ? "" : "primary"}" data-reread="${it.lessonId}" data-h="${esc(it.choices[it.answer])}">${it.reread ? "✓ " + T("rereadDone") : T("reread")}</button>`}
        </div>`).join("")}</div>`}`;
    const c = $("#cont"); if (c) c.onclick = () => { const lv = r.level; S.result = null; go("home"); Faris.say(r.previousLevel === "expert" ? T("farisExpert") : T("farisPass", { level: T(lv) })); };
    const rt = $("#retry"); if (rt) rt.onclick = () => { S.result = null; go("quiz"); };
    $("#main").querySelectorAll("[data-reread]").forEach((b) => (b.onclick = () => openLesson(b.dataset.reread, b.dataset.h)));
    if (!passed && !r._said) { r._said = true; Faris.say(T("farisFail", { n: r.total - r.score })); }
  };

  // ---------- progress ----------
  VIEWS.progress = async () => {
    await refresh();
    const u = S.user, levels = ["beginner", "intermediate", "expert"];
    $("#main").innerHTML = topbar(T("progress")) + `<div class="grid">${levels.map((lv) => {
      const passed = u.badges.includes(lv), current = u.level === lv;
      return `<div class="card"><div class="level-badge"><span class="icon">${LEVEL_ICON[lv]}</span>${T(lv)}</div><p style="margin-top:8px"><span class="pill ${passed ? "good" : current ? "" : "muted"}">${passed ? "✓ " + T("passed") : current ? T("level") : "—"}</span></p></div>`;
    }).join("")}</div>
    ${u.expertDone ? `<div class="card" style="margin-top:16px"><h3>${T("expertNow")}</h3><p class="sub">${T("dailyChallenge")}</p></div>` : ""}`;
  };

  // ---------- settings ----------
  VIEWS.settings = async () => {
    const u = S.user;
    let status = null; try { status = await api("/api/status"); } catch {}
    const installable = Boolean(window.deferredInstall);
    $("#main").innerHTML = topbar(T("settings"), u.email) + `
      <div class="card"><div class="setting"><div><h3>${T("language")}</h3></div><div class="row"><button class="btn small ${S.lang === "ar" ? "primary" : ""}" data-lang="ar">العربية</button><button class="btn small ${S.lang === "en" ? "primary" : ""}" data-lang="en">English</button></div></div></div>
      <div class="card" style="margin-top:16px"><h2>${T("security")}</h2>
        <div class="setting"><div><h3>${T("twoStep")}</h3><div class="d">${T("twoStepD")}</div></div><div class="row"><span class="pill ${u.totpEnabled ? "good" : "muted"}">${u.totpEnabled ? T("on") : T("off")}</span><button class="btn small" id="totp">${u.totpEnabled ? T("disable") : T("enable")}</button></div></div>
        <div id="totp-box"></div>
        <div class="setting"><div><h3>${T("passkey")}</h3><div class="d">${T("passkeyD")}</div></div><div class="row"><span class="pill ${u.passkeys ? "good" : "muted"}">${u.passkeys ? T("on") : T("off")}</span><button class="btn small" id="pk">${T("addPasskey")}</button></div></div>
      </div>
      <div class="card install-steps" style="margin-top:16px"><h2>${T("install")}</h2><p class="sub">${T("installD")}</p>
        <div class="row">${installable ? `<button class="btn primary" id="install">${T("installBtn")}</button>` : ""}${status?.apk ? `<a class="btn" href="/apk">${T("downloadApk")}</a>` : ""}</div>
        <p style="margin-top:10px">${T("iosSteps")}</p></div>
      ${u.isAdmin ? `<div class="card" style="margin-top:16px"><div class="setting"><div><h3>${T("adminUpdate")}</h3><div class="d">${T("adminUpdateD")}${status?.lastUpdate ? ` · ${T("lastUpdate")}: ${new Date(status.lastUpdate).toLocaleString()}` : ""} · ${status?.engine === "claude" ? "Claude" : "fallback"}</div></div><button class="btn small" id="upd" ${status?.updating ? "disabled" : ""}>${status?.updating ? T("updating") : T("adminUpdate")}</button></div></div>` : ""}
      <div class="card" style="margin-top:16px"><h2>${T("sourcesTitle")}</h2><p class="sub">${T("sourcesD")}</p><div class="sources" id="sources"></div></div>
      <div class="card" style="margin-top:16px">
        <div class="setting"><div><h3>${T("reportProblem")}</h3></div><button class="btn small" id="report">${T("reportProblem")}</button></div>
        <div class="setting"><div><h3>${T("startOver")}</h3><div class="d">${T("startOverD")}</div></div><button class="btn small" id="reset">${T("startOver")}</button></div>
        <div class="setting"><div><h3>${T("signOut")}</h3></div><button class="btn small" id="logout">${T("signOut")}</button></div>
      </div>`;
    $("#main").querySelectorAll("[data-lang]").forEach((b) => (b.onclick = async () => { S.lang = b.dataset.lang; applyLang(); await api("/api/settings", { lang: S.lang }); go("settings"); }));
    $("#totp").onclick = async () => {
      if (u.totpEnabled) { await api("/api/security/totp/disable", {}); u.totpEnabled = false; return go("settings"); }
      const r = await api("/api/security/totp/setup", {});
      $("#totp-box").innerHTML = `<div class="sunk" style="padding:16px;margin:10px 0"><p>${T("scanQr")}</p><img class="qr" src="${r.qr}" alt="QR"><p><code class="secret">${r.secret}</code></p><form class="row" id="tf"><input class="pin" id="tc" inputmode="numeric" maxlength="6" style="width:160px;padding:10px;border-radius:12px;border:0"><button class="btn primary small">${T("confirm")}</button><span class="err" id="terr"></span></form></div>`;
      $("#tf").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/security/totp/confirm", { code: $("#tc").value }); u.totpEnabled = true; toast("✓ " + T("on")); go("settings"); } catch { $("#terr").textContent = T("errWrongCode"); } };
    };
    $("#pk").onclick = registerPasskey;
    api("/api/sources").then((r) => { const el = $("#sources"); if (el) el.innerHTML = r.sources.map((s) => `<div><b>${S.lang === "ar" ? s.ar : s.en}</b>${s.sources.map(esc).join("<br>")}</div>`).join(""); }).catch(() => {});
    const inst = $("#install"); if (inst) inst.onclick = async () => { window.deferredInstall.prompt(); await window.deferredInstall.userChoice; window.deferredInstall = null; go("settings"); };
    const upd = $("#upd"); if (upd) upd.onclick = async () => { await api("/api/admin/update", {}); toast(T("updateStarted")); go("settings"); };
    $("#report").onclick = async () => { const note = prompt(T("reportProblem")) || ""; await api("/api/faris/report", { screen: S.view, note }); toast(T("reported")); };
    $("#reset").onclick = async () => { if (!confirm(T("startOverConfirm"))) return; const r = await api("/api/reset", {}); S.user = r.user; S.result = null; go("placement"); };
    $("#logout").onclick = async () => { await api("/api/auth/logout", {}); S.user = null; S.content = null; Faris.hide(); go("auth", { mode: "login" }); };
  };

  // ---------- boot ----------
  window.addEventListener("online", () => { S.online = true; go(S.view); });
  window.addEventListener("offline", () => { S.online = false; go(S.view); });
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.deferredInstall = e; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

  (async () => {
    applyLang();
    Faris.mount(); Faris.hide();
    try { const { user } = await api("/api/me"); if (user) { S.user = user; S.lang = user.lang || S.lang; applyLang(); Faris.show(); await refresh(); return go(user.placed ? "home" : "placement"); } }
    catch { S.online = false; }
    go("auth");
  })();
})();
