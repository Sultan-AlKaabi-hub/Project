// Rasid front end: one small state machine, views rendered into #main.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const S = { lang: localStorage.getItem("rasid.lang") || "ar", user: null, view: "auth", content: null, lesson: null, quiz: null, result: null, placement: null, tab: "all", online: navigator.onLine, status: null };
  window.T = (k, vars = {}) => { let s = (I18N[S.lang] || I18N.ar)[k] ?? k; for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b); return s; };
  const T = window.T;
  const LEVEL_ICON = { beginner: "●", intermediate: "■", expert: "★" };

  const DEMO = Boolean(window.LocalAPI && window.LocalAPI.enabled);
  const certUrl = (id) => (DEMO ? window.LocalAPI.certificateUrl(id) : `/api/certificate/${id}`);
  async function api(path, body, method) {
    if (DEMO) return window.LocalAPI.call(path, body, method);
    const r = await fetch(path, { signal: AbortSignal.timeout(75000), method: method || (body ? "POST" : "GET"), headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
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
  ICONS.course = ICONS.lessons;
  ICONS.calendar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/></svg>';
  ICONS.alerts = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5zM10 21h4"/></svg>';
  ICONS.people = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></svg>';
  ICONS.privacy = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6"/></svg>';
  ICONS.news = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h13a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M19 7v10"/><path d="M8 9h5M8 13h6"/></svg>';
  const BRAND_DOTS = '<svg class="dots" viewBox="0 0 22 22"><g fill="#7C5CE6"><circle cx="11" cy="4" r="2.4"/><circle cx="4" cy="11" r="2.4"/><circle cx="18" cy="11" r="2.4"/><circle cx="11" cy="18" r="2.4"/><circle cx="11" cy="11" r="2.4" opacity=".5"/></g></svg>';

  function renderShell() {
    S.renderVersion=(S.renderVersion||0)+1; S.mainObserver?.disconnect(); S.lessonObserver?.disconnect(); window.Lab?.cleanup(); if(S.quizGuard){window.removeEventListener("beforeunload",S.quizGuard);S.quizGuard=null;}
    const app = $("#app");
    if (!S.user) { app.innerHTML = ""; app.className = ""; return; }
    app.className = "app";
    let nav = [["home", "home"], ["course", "course"], ["news", "news"], ["progress", "progress"], ["calendar","calendar"], ["hub","hub"], ["alerts","alerts"], ["privacy","privacy"]];
    if(S.user.role !== "student") nav.push(["administration","administration"],["staff","staff"]);
    if(S.user.role === "admin" || (S.user.role === "teacher" && S.user.hasAI !== false)) nav.push(["people","people"]);
    nav.push(["messages","messages"]);
    if(S.user.hasAI !== false)nav.splice(2,0,["lab","lab"]);
    if(S.user.hasAI === false)nav=nav.filter(([v])=>!["course","news","progress","administration"].includes(v));
    app.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="brand">${BRAND_DOTS}<span>${T("appName")}</span></div>
        <div class="nav-label">${T("workspace")}</div>
        <nav class="nav">${nav.map(([v, k]) => `<button data-view="${v}" class="${S.view === v ? "active" : ""}">${ICONS[v] || ICONS.progress}<span>${v === "people" && S.user.role === "teacher" ? (S.lang === "ar" ? "طلابي" : "My students") : v === "administration" && S.user.role === "teacher" ? (S.lang === "ar" ? "التقدم والحضور" : "Progress & attendance") : v === "staff" && S.user.role === "teacher" ? (S.lang === "ar" ? "مناوباتي" : "My shifts") : T(k)}</span></button>`).join("")}</nav>
        <div class="nav-label">${T("manage")}</div>
        <nav class="nav"><button data-view="settings" class="${S.view === "settings" ? "active" : ""}">${ICONS.settings}<span>${T("settings")}</span></button></nav>
        <div class="status-box sunk">
          <div class="t">${T("statusTitle")}</div>
          <div class="row"><span class="dot"></span><b>${S.user.level ? LEVEL_ICON[S.user.level] + " " + T(S.user.level) : T("notPlaced")}</b></div>
          <div class="row"><span class="dot good"></span><span id="status-lessons">${S.course ? `${S.course.modulesPassed}` : "–"} ${T("modulesDone")}</span></div>
        </div>
      </aside>
      <div class="scrim" id="scrim" hidden></div>
      <main class="main" id="main"></main>`;
    app.querySelectorAll("[data-view]").forEach((b) => (b.onclick = () => { go(b.dataset.view); closeMenu(); }));
    $("#scrim").onclick = closeMenu;
    const brand=app.querySelector(".brand");brand.setAttribute("role","button");brand.tabIndex=0;brand.setAttribute("aria-label",S.lang==="ar"?"العودة إلى المقدمة":"Open intro");brand.onclick=()=>go("intro");brand.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go("intro");}};
    S.mainObserver=new MutationObserver(()=>{wireTopbar();window.RasidMotion?.enhance();});S.mainObserver.observe($("#main"),{childList:true});
    api('/api/alerts').then(r=>{const label=app.querySelector('[data-view="alerts"] span');if(label){const count=r.alerts.filter(a=>!a.read).length;label.textContent=T('alerts')+(count?' ('+count+')':'');}}).catch(()=>{});
  }
  function renderLangPill() {
    let p = $("#lang-pill"); if (!p) { p = h('<button id="lang-pill" class="lang-pill" aria-label="language"></button>'); document.body.appendChild(p); }
    p.innerHTML = `<span class="${S.lang === "en" ? "on" : ""}">EN</span><span class="sep">|</span><span class="${S.lang === "ar" ? "on" : ""}">ع</span>`;
    p.onclick = async () => { S.lang = S.lang === "ar" ? "en" : "ar"; applyLang(); Faris.say(T("farisHello"),{open:false}); if (S.user) { try { await api("/api/settings", { lang: S.lang }); } catch {} } S.course = null; if (S.view === "module" && S.module) return openModule(S.module.id); if (["lesson", "quiz", "article"].includes(S.view)) return go("course"); go(S.view, S.lastOpts || {}); };
  }
  function closeMenu() { $("#sidebar")?.classList.remove("open"); const s = $("#scrim"); if (s) s.hidden = true; }
  function topbar(title, sub, right = "") {
    return `<div class="topbar"><div class="row"><button class="btn small menu-btn" id="menu-btn" aria-label="menu">☰</button><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div></div><div class="row">${right}</div></div>
      ${S.online ? "" : `<div class="banner">⚠ ${T("offline")}</div>`}${DEMO && S.view === "news" ? `<div class="banner">ℹ ${T("demoNews")}</div>` : ""}`;
  }
  function wireTopbar() { const b = $("#menu-btn"); if (b) b.onclick = () => { $("#sidebar").classList.add("open"); $("#scrim").hidden = false; }; }

  async function go(view, opts = {}) {
    window.Lab?.cleanup();
    S.view = view; S.lastOpts = opts;
    if (S.intro) { S.intro.unmount(); S.intro=null; }
    if (S.user && !S.user.placed && !["settings", "placement", "calendar", "alerts", "privacy", "people", "hub", "intro", "home", "administration", "staff", "messages", "classes", "lab"].includes(view)) S.view = "placement";
    if (!S.user && view !== "intro") S.view = "auth";
    if(S.user?.hasAI === false && ["course","placement","news","progress","exams","module","quiz","article","lab"].includes(S.view)) S.view="home";
    if(S.view === "intro")Faris.hide();else if(S.user)Faris.show();
    renderShell();
    const v = VIEWS[S.view];
    if (v) { try { await v(opts); } catch(e) { toast(Portal.error(e)); } }
    renderLangPill();
    wireTopbar();
    window.RasidMotion?.enhance();
    document.querySelectorAll(".brand,.logo").forEach(el=>{el.setAttribute("role","button");el.tabIndex=0;el.setAttribute("aria-label",S.lang === "ar" ? "العودة إلى المقدمة" : "Open intro");el.onclick=()=>go("intro");el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go("intro");}};});
    window.scrollTo(0, 0);
  }

  // ---------- auth ----------
  const VIEWS = {};
  VIEWS.intro=()=>VIEWS.auth({mode:"intro"});
  VIEWS.auth = async (opts) => {
    const app = $("#app"); app.className = "auth-wrap";
    const mode = opts.mode || "login";
    if (mode === "intro") {
      app.className = "intro-wrap";
      app.innerHTML = `<div class="intro"><div class="intro-scene" id="scene"></div>
        <div class="intro-text"><div class="logo">${BRAND_DOTS}<span class="word">${T("appName")}</span></div>
        <h1>${T("introTitle")}</h1><p class="sub">${T("introSub")}</p>
        <button class="btn primary big" id="enter">${T("enter")}</button></div></div>`;
      renderLangPill();
      S.intro = Intro.mount($("#scene"));
      $("#enter").onclick = () => { sessionStorage.setItem("rasid.intro", "1"); if (S.intro) { S.intro.unmount(); S.intro = null; } S.user ? go("home") : go("auth", { mode: localStorage.getItem("rasid.seen") ? "login" : "lang" }); };
      return;
    }
    if (S.intro) { S.intro.unmount(); S.intro = null; }
    const box = h(`<div class="auth raised"><div class="logo">${BRAND_DOTS}<span class="word">${T("appName")}</span></div><p class="sub" style="text-align:center">${T("tagline")}</p><div id="auth-body"></div></div>`);
    app.innerHTML = `<div class="auth-landscape" id="auth-landscape" aria-hidden="true"></div><div class="auth-heading"><span class="eyebrow">RASID · راصد</span><h1>${T("introTitle")}</h1><p>${T("introSub")}</p></div>`; app.appendChild(box);
    S.intro=Intro.mount($("#auth-landscape"));
    const body = $("#auth-body");
    const form = (inner) => { body.innerHTML = inner; };

    if (mode === "lang") {
      form(`<h2 style="text-align:center">${T("chooseLang")}</h2><div class="lang-choice"><button class="btn" data-l="ar">العربية</button><button class="btn" data-l="en">English</button></div>`);
      body.querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { S.lang = b.dataset.l; applyLang(); localStorage.setItem("rasid.seen", "1"); go("auth", { mode: "signup" }); }));
      return;
    }
    if (mode === "signup" || mode === "login") {
      const signup = mode === "signup";
      form(`${DEMO ? `<div class="banner">ℹ ${T("demoAuth")}</div>` : ""}<h2>${signup ? T("createAccount") : T("signIn")}</h2>
        <form class="stack" id="f">
          <div class="field"><label for="email">${T("email")}</label><input id="email" type="email" inputmode="email" autocomplete="email" required><span class="ok" id="email-ok"></span></div>
          <div class="field"><label for="pin">${Portal.L("credential")}</label><input id="pin" type="password" minlength="6" maxlength="128" autocomplete="${signup ? "new-password" : "current-password"}" required></div>
          ${signup ? `<div class="field"><label for="pin2">${Portal.L("confirmCredential")}</label><input id="pin2" type="password" maxlength="128" autocomplete="new-password" required><span class="ok" id="pin-ok"></span></div>` : ""}
          <div class="err" id="err"></div>
          <button class="btn primary big" type="submit">${signup ? T("continueBtn") : T("signIn")}</button>
        </form>
        <div class="stack">
          ${signup ? "" : `${DEMO ? "" : `<button class="btn" id="passkey">${T("usePasskey")}</button>`}<button class="btn ghost" id="forgot">${T("forgotPin")}</button>`}
          <button class="btn ghost" id="switch">${signup ? T("haveAccount") : T("noAccount")}</button>
        </div>`);
      Portal.authExtras(body,signup);
      const hint=document.createElement("p");hint.className="sub credential-hint";hint.textContent=Portal.L("credentialHint");$("#pin").after(hint);
      const f = $("#f"), err = $("#err");err.setAttribute("role","alert");
      $("#email").oninput = (e) => { $("#email-ok").textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) ? "✓" : ""; };
      if (signup) $("#pin2").oninput = () => { $("#pin-ok").textContent = $("#pin").value.length >= 6 && $("#pin").value === $("#pin2").value ? "✓ " + T("pinMatch") : ""; };
      $("#switch").onclick = () => go("auth", { mode: signup ? "login" : "signup" });
      f.onsubmit = async (e) => {
        e.preventDefault(); err.textContent = "";
        const email = $("#email").value.trim(), pin = $("#pin").value;
        if (!/^\d{6}$/.test(pin) && !(pin.length>=12 && pin.length<=128 && /\D/.test(pin))) return (err.textContent = Portal.L("credentialHint"));
        if (signup && pin !== $("#pin2").value) return (err.textContent = S.lang === 'ar' ? 'الرمزان أو كلمتا المرور غير متطابقتين.' : 'The PINs or passwords do not match.');
        try {
          const r = await api(signup ? "/api/auth/signup" : "/api/auth/login", { email, pin, lang: S.lang, privacyAccepted: signup ? $("#privacy-consent").checked : undefined });
          if (r.needTotp) return go("auth", { mode: "totp", ticket: r.ticket });
          await signedIn(r.user, signup);
        } catch (ex) { err.textContent = { bad_email: T("errBadEmail"), bad_pin: Portal.L("credentialHint"), exists: T("errExists"), wrong: T("errWrong") }[ex.code] || Portal.error(ex); }
      };
      if (!signup) {
        $("#forgot").onclick = () => go("auth", { mode: "reset", email: $("#email").value.trim() });
        const pkb = $("#passkey"); if (pkb) pkb.onclick = async () => {
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
          <div class="field"><label>${Portal.L("credential")}</label><input id="pin" type="password" minlength="6" maxlength="128" autocomplete="new-password" required></div>
          <div class="err" id="err"></div><button class="btn primary big">${T("resetPin")}</button></form>
        <button class="btn ghost" id="back">${T("back")}</button>`);
      $("#back").onclick = () => go("auth", { mode: "login" });
      $("#f1").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/auth/pin/reset-request", { email: $("#email").value.trim() }); $("#f1").hidden = true; $("#f2").hidden = false; } catch(ex) { toast(Portal.error(ex)); } };
      $("#f2").onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/auth/pin/reset", { email: $("#email").value.trim(), code: $("#code").value, pin: $("#pin").value }); if(r.needTotp) return go("auth", {mode:"totp",ticket:r.ticket}); await signedIn(r.user, false); } catch (ex) { $("#err").textContent = ex.code === "bad_pin" ? T("errBadPin") : T("errWrongCode"); } };
    }
  };

  async function signedIn(user, isNew) {
    if(S.intro){S.intro.unmount();S.intro=null;}
    S.user = user; S.lang = user.lang || S.lang; applyLang();
    Faris.show();
    if (!DEMO && isNew && window.PublicKeyCredential) {
      setTimeout(() => offerPasskey(), 800);
    }
    await refresh();
    if (!user.placed && user.role === "student") { go("home"); Faris.say(T("farisHello"), { actions: [{ label: T("start"), run: () => Faris.say(T("farisPlacement")) }] }); }
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
    if(S.user?.hasAI === false){S.course=null;return;}
    const email=S.user?.email;
    try { const r = await api("/api/course"); if(S.user?.email!==email)return; S.course = r.course; S.user = r.user; S.online = true; }
    catch (e) { if (e.message === "Failed to fetch") S.online = false; }
  }

  // ---------- placement ----------
  VIEWS.placement = async () => {
    const m = $("#main");
    m.innerHTML = topbar(T("placementTitle"), T("placementSub")) + `<div class="card q-card" id="pl"><div class="row"><button class="btn primary" id="startq">${T("startQuestions")}</button><button class="btn" id="skip">${T("startBeginner")}</button></div></div>`;
    $("#skip").onclick = () => finishPlacement({ skipped: true });
    $("#startq").onclick = async () => { const { questions } = await api("/api/placement"); runQuestions($("#pl"), questions, async (answers) => finishPlacement({ answers })); };
  };
  async function finishPlacement(body) {
    const r = await api("/api/placement", body);
    S.user = r.user; S.course = r.course;
    $("#main").innerHTML = topbar(T("yourLevel")) + `<div class="card result"><div class="level-badge" style="justify-content:center"><span class="icon">${LEVEL_ICON[r.level]}</span>${T(r.level)}</div><p class="sub" style="margin:14px 0 22px">${T("modulesAhead", { n: r.course.levels.find((l) => l.id === r.level).total })}</p><button class="btn primary big" id="ok">${T("ok")}</button></div>`;
    $("#ok").onclick = () => { go("course"); Faris.say(T("farisPlaced", { level: T(r.level) })); };
  }

  // Generic question runner (placement + module quiz). onDone(answers)
  function runQuestions(container, questions, onDone, { quitLabel } = {}) {
    let i = 0; const answers = [];
    const step = () => {
      const q = questions[i];
      container.innerHTML = `<div class="dots">${questions.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>
        ${q.title ? `<div class="about"><span class="pill muted">${T("aboutModule")}</span> ${esc(q.title)}</div>` : ""}
        <div class="question">${esc(q.q)}</div>
        <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join("")}</div>
        <div class="row" style="margin-top:18px;justify-content:space-between"><button class="btn primary" id="next" disabled>${i === questions.length - 1 ? T("finish") : T("next")}</button>${quitLabel ? `<button class="btn ghost" id="quit">${quitLabel}</button>` : ""}</div>`;
      let sel = null;
      container.querySelectorAll(".choice").forEach((b) => (b.onclick = () => { container.querySelectorAll(".choice").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sel = Number(b.dataset.k); $("#next").disabled = false; }));
      $("#next").onclick = () => { answers.push(sel); i++; if (i < questions.length) step(); else onDone(answers); };
      const qb = $("#quit"); if (qb) qb.onclick = () => { if (confirm(T("quitConfirm"))) go("course"); };
    };
    step();
  }

  // ---------- home ----------
  VIEWS.home = async () => {
    await refresh();
    const c = S.course, lv = c.levels.find((l) => l.id === c.level), pct = lv.total ? Math.round((lv.passed / lv.total) * 100) : 0;
    $("#main").innerHTML = topbar(T("greeting"), T("greetingSub")) + `
      <div class="hero">
        <div class="card level-card">
          <span class="pill">${T("level")}</span>
          <div class="level-badge"><span class="icon">${LEVEL_ICON[c.level]}</span>${T(c.level)}</div>
          <p class="sub">${T("modulesPassed")}: <b>${lv.passed} ${T("ofFive")} ${lv.total}</b></p>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="row" style="margin-top:8px">${c.next ? `<button class="btn primary" id="cont">${c.next.status === "quiz" ? T("takeQuiz") : T("continueModule")}: ${esc(c.next.title)}</button>` : `<span class="pill good">✓ ${T("levelComplete")}</span>`}<button class="btn" id="tocourse">${T("openCourse")}</button></div>
        </div>
        <div class="card ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--sunk)" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="var(--good)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(pct / 100) * 314} 314" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle" fill="var(--ink)" font-size="26" font-weight="700">${pct}%</text></svg></div>
      </div>
      <div class="stats">
        <div class="card stat"><span class="n">${c.modulesPassed}</span><span class="l">${T("modules")}</span></div>
        <div class="card stat"><span class="n">${c.lessonsRead}</span><span class="l">${T("lessonsRead")}</span></div>
        <div class="card stat"><span class="n">${S.user.badges.length}</span><span class="l">${T("levelsPassed")}</span></div>
      </div>`;
    $("#tocourse").onclick = () => go("course");
    const b = $("#cont"); if (b) b.onclick = () => openModule(c.next.id);
  };

  // ---------- live news ----------
  VIEWS.news = async (opts) => {
    const version=S.renderVersion; await refresh(); if(version!==S.renderVersion)return;
    const c = { categories: ["civilian", "us_military", "russia_military", "china_military", "other"].map((id) => ({ id, label: T("cat_" + id) })) }; S.newsTab = S.newsTab || "civilian";
    const m = $("#main");
    m.innerHTML = topbar(`<span class="live"><span class="dot good"></span>${T("news")}</span>`, "", `<button class="btn small" id="fresh">${T("refresh")}</button>`) +
      `<div class="tabs">${c.categories.map((t) => `<button data-t="${t.id}" class="${S.newsTab === t.id ? "active" : ""}">${t.label}</button>`).join("")}</div><div class="lesson-list" id="news"><p class="sub">…</p></div>`;
    m.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { S.newsTab = b.dataset.t; go("news"); }));
    $("#fresh").onclick = () => go("news", { fresh: true });
    let r; try { r = await api(`/api/news?category=${S.newsTab}${opts.fresh ? "&fresh=1" : ""}`); } catch { r = { items: [] }; }
    const list = $("#news"); if (!list || version!==S.renderVersion) return;
    const fmt = (d) => { const ms = Date.now() - new Date(d).getTime(), h = Math.floor(ms / 3600000); return h < 1 ? (S.lang === "ar" ? "قبل دقائق" : "minutes ago") : h < 24 ? (S.lang === "ar" ? `قبل ${h} س` : `${h}h ago`) : (S.lang === "ar" ? `قبل ${Math.floor(h / 24)} ي` : `${Math.floor(h / 24)}d ago`); };
    list.innerHTML = r.items.length ? r.items.map((it) => `
      <div class="card news-item"><div>
        <p class="t"><a href="#" data-read="${esc(it.url)}">${esc(it.title)}</a></p>
        <div class="m"><span class="pill muted">${it.icon ? `<img class="favicon" src="${esc(it.icon)}" alt="">` : ""}${esc(it.source)}</span><span>${fmt(it.published)}</span>${it.via ? `<span>· ${esc(it.via)}</span>` : ""}</div>
        ${it.snippet ? `<p class="snip">${esc(it.snippet.slice(0, 180))}…</p>` : ""}
        <div class="row" style="margin-top:8px"><button class="btn small primary" data-read="${esc(it.url)}">${T("readHere")}</button><a class="btn ghost small" href="${esc(it.url)}" target="_blank" rel="noopener">${T("readOriginal")}</a></div>
      </div></div>`).join("") + `<p class="sub">${T("fetchedAt")}: ${new Date(r.fetchedAt).toLocaleTimeString(S.lang === "ar" ? "ar" : "en")}</p>` : `<p class="sub">${T("noNews")}</p>`;
    list.querySelectorAll("[data-read]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); if (DEMO) window.open(b.dataset.read, "_blank", "noopener"); else openArticle(b.dataset.read); }));
  };

  const paras = (t) => esc(t).split(/\n\n+|(?<=[.!?\u061F])\s+(?=[A-Z\u0600-\u06FF])/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");

  // In-app reader for any headline: the site is fetched and its text shown here (Arabic by translation).
  async function openArticle(url) {
    S.view = "article"; renderShell(); const version=S.renderVersion;
    $("#main").innerHTML = topbar("…", "", `<button class="btn small" id="back">${T("back")}</button>`) + `<div class="card reader"><p class="sub">${T("farisThinking")}</p></div>`;
    $("#back").onclick = () => go("news");
    let r; try { r = await api(`/api/article?url=${encodeURIComponent(url)}`); } catch (ex) { r = null; }
    if(version!==S.renderVersion)return;
    if (!r) { $("#main").innerHTML = topbar(T("news"), "", `<button class="btn small" id="back">${T("back")}</button>`) + `<div class="card reader"><p>${T("noText")}</p><a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">${T("readOriginal")}</a></div>`; $("#back").onclick = () => go("news"); return; }
    $("#main").innerHTML = topbar(esc(r.title), `${r.icon ? `<img class="favicon" src="${esc(r.icon)}" alt="">` : ""}${esc(r.site)} · ${r.words} ${T("words")}`, `<button class="btn small" id="back">${T("back")}</button>`) + `
      <div class="card reader">${r.image ? `<img class="hero-img" src="${esc(r.image)}" alt="" onerror="this.remove()">` : ""}
        ${r.translated ? `<p class="sub">${r.partial ? T("partialNote") : T("translatedNote")}</p>` : r.translationPending ? `<div class="banner">⏳ ${T("arPending")}</div>` : ""}
        <div class="article-text ${r.translated ? "" : "ltr"}">${paras(r.text)}</div>
        <p style="margin-top:14px"><a class="btn small" href="${esc(r.url)}" target="_blank" rel="noopener">${T("readOriginal")}</a></p></div>`;
    $("#back").onclick = () => go("news");
  }

  // ---------- lessons ----------
  // ---------- course: levels and module cards ----------
  VIEWS.course = async () => {
    const version=S.renderVersion; await refresh(); if(version!==S.renderVersion)return;
    const c = S.course;
    $("#main").innerHTML = topbar(T("course"), T("courseSub")) + c.levels.map((lv) => `
      <section class="level-section ${lv.locked ? "locked" : ""}">
        <div class="level-head"><div class="level-badge"><span class="icon">${LEVEL_ICON[lv.id]}</span>${T(lv.id)}</div>
          <span class="pill ${lv.complete ? "good" : lv.locked ? "muted" : ""}">${lv.complete ? "✓ " + T("levelComplete") : lv.locked ? "🔒 " + T("lockedLevel") : `${lv.passed} / ${lv.total} ${T("modules")}`}</span></div>
        <div class="modules">${lv.modules.map((m, i) => `
          <div class="card module ${m.status}">
            <div class="mod-top"><span class="mod-icon">${m.icon}</span><div><div class="mod-day">${T("module")} ${i + 1}</div><h3>${esc(m.title)}</h3></div>
              ${m.passed ? `<span class="pill good">✓ ${T("passedPill")}</span>` : m.status === "failed" ? `<span class="pill warn">✗ ${T("failedPill")} ${m.lastScore}/5</span>` : m.locked ? `<span class="pill muted">🔒</span>` : ""}</div>
            <p class="mod-desc">${esc(m.desc)}</p>
            <div class="mod-prog"><div class="bar"><i style="width:${Math.round((m.read / m.lessons) * 100)}%"></i></div><span>${m.read} / ${m.lessons} ${T("lessons")}</span></div>
            <div class="chips">${m.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
            <div class="row">${m.locked ? "" : m.status === "failed" ? `<button class="btn primary" data-redo="${m.firstLesson}">${T("redoLessons")} →</button><button class="btn small" data-mod="${m.id}">${T("review")}</button>` : `<button class="btn ${m.passed ? "" : "primary"}" data-mod="${m.id}">${m.passed ? T("review") : m.status === "quiz" ? T("takeQuiz") : m.read ? T("continueModule") : T("startModule")} →</button>`}${m.certId ? `<a class="btn small" href="${certUrl(m.certId)}" target="_blank" rel="noopener">🎓 ${T("viewCertificate")}</a>` : ""}</div>
          </div>`).join("")}</div>
      </section>`).join("");
    $("#main").querySelectorAll("[data-mod]").forEach((b) => (b.onclick = () => openModule(b.dataset.mod)));
    $("#main").querySelectorAll("[data-redo]").forEach((b) => (b.onclick = () => openLesson(b.dataset.redo)));
    if (!sessionStorage.getItem("rasid.tourCourse")) { sessionStorage.setItem("rasid.tourCourse", "1"); Faris.say(T("farisCourse")); }
  };

  async function openModule(id) {
    S.view = "module"; renderShell(); const version=S.renderVersion;
    const m = await api(`/api/course/module/${id}`);
    if(version!==S.renderVersion)return;
    S.module = m;
    $("#main").innerHTML = topbar(`${m.icon} ${esc(m.title)}`, `${T(m.level)} · ${m.read} / ${m.lessons} ${T("lessons")}`, `<button class="btn small" id="back">${T("back")}</button>`) + `
      <div class="card"><p>${esc(m.desc)}</p><div class="chips">${m.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div>
      <div class="lesson-list" style="margin-top:16px">${m.lessonList.map((l, i) => `
        <button class="card lesson ${l.read ? "done" : ""}" data-id="${l.id}"><div><div class="meta"><span class="pill muted">${T("lesson")} ${i + 1}</span>${l.read ? `<span class="pill good">✓ ${T("read")}</span>` : ""}</div><p class="title">${esc(l.title)}</p></div><span class="check ${l.read ? "on" : ""}">✓</span></button>`).join("")}</div>
      <div class="card" style="margin-top:16px"><h3>${T("moduleQuiz")}</h3><p class="sub">${T("quizIntro")}</p>
        ${m.passed ? `<span class="pill good">✓ ${T("passedPill")}</span> ${m.certId ? `<a class="btn small" href="${certUrl(m.certId)}" target="_blank" rel="noopener">🎓 ${T("viewCertificate")}</a>` : ""} ` : m.status === "failed" ? `<div class="banner fail">✗ ${T("failedTitle")} · ${T("lastScore")}: ${m.lastScore}/5 · ${T("rereadHint")}</div>` : ""}
        <button class="btn primary" id="quiz" ${m.quizReady || m.passed ? "" : "disabled"}>${m.passed ? T("retakeQuiz") : m.needsReread ? T("quizBlocked") : m.quizReady ? T("takeQuiz") : T("quizLocked")}</button></div>`;
    $("#back").onclick = () => go("course");
    $("#main").querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => openLesson(b.dataset.id)));
    $("#quiz").onclick = () => startQuiz(m.id);
  }

  async function openLesson(id) {
    S.view = "lesson"; renderShell(); const version=S.renderVersion;
    const l = await api(`/api/course/lesson/${id}`); if(version!==S.renderVersion)return;
    $("#main").innerHTML = topbar(esc(l.title), `${l.icon} ${esc(l.moduleTitle)} · ${T("lesson")} ${l.index} / ${l.count}`, `<button class="btn small" id="back">${T("back")}</button>`) + `
      <div class="card reader"><div class="body">${paras(l.body)}</div>
        ${S.lang === "ar" ? `<details class="en-twin"><summary>English version</summary><div class="article-text ltr">${paras(l.bodyEn)}</div></details>` : ""}
        <p class="endmark">— ${T("endOfLesson")} —</p>
        <div id="gotit" hidden style="margin-top:14px"><button class="btn primary big" id="done">${l.read ? "✓ " + T("read") + (l.nextId ? " · " + T("nextLesson") : "") : T("gotIt")}</button></div>
      </div>`;
    $("#back").onclick = () => openModule(l.moduleId);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { if($("#gotit"))$("#gotit").hidden = false; io.disconnect(); } });
    S.lessonObserver=io;io.observe($(".endmark"));
    $("#done").onclick = async () => {
      const r = await api(`/api/course/lesson/${id}/done`, {});
      S.course = r.course;
      if (r.module.quizReady) { Faris.say(T("farisModuleDone")); openModule(l.moduleId); }
      else if (l.nextId) openLesson(l.nextId);
      else openModule(l.moduleId);
    };
  }
  window.App = { openLesson: (id) => openLesson(id), getContext: () => ({useArticle:S.view==="article"}) };

  async function startQuiz(moduleId) {
    S.view = "quiz"; renderShell(); const version=S.renderVersion;
    let q; try { q = await api(`/api/course/quiz/${moduleId}`); } catch { return openModule(moduleId); }
    if(version!==S.renderVersion)return;
    $("#main").innerHTML = topbar(T("quiz"), esc(q.title)) + `<div class="card q-card" id="qz"></div>`;
    Faris.say(T("farisQuiz"), { open: false, pulse: true });
    const guard = (e) => { e.preventDefault(); e.returnValue = ""; };
    S.quizGuard=guard;window.addEventListener("beforeunload", guard);
    runQuestions($("#qz"), q.questions, async (answers) => {
      window.removeEventListener("beforeunload", guard);
      const r = await api("/api/course/quiz", { answers });
      S.result = r; S.user = r.user; S.course = r.course; go("result");
    }, { quitLabel: T("quit") });
  }

  VIEWS.result = async () => {
    const r = S.result; if (!r) return go("course");
    const head = r.expertDone ? T("expertNow") : r.levelUp ? T("levelUp") : r.passed ? T("modulePassed") : T("failedTitle");
    $("#main").innerHTML = topbar(head, esc(r.moduleTitle)) + `
      <div class="card result ${r.passed ? "pass" : "fail"}"><span class="pill ${r.passed ? "good" : "warn"}" style="font-size:14px">${r.passed ? "✓ " + T("passedPill") : "✗ " + T("failedPill")}</span><div class="score">${r.score}/${r.total}</div>
        ${r.passed && r.certId ? `<p>🎓 ${T("certEarned")}</p><p><a class="btn" href="${certUrl(r.certId)}" target="_blank" rel="noopener">${T("viewCertificate")}</a></p>` : ""}
        ${r.levelUp ? `<div class="level-badge" style="justify-content:center;margin:10px 0"><span class="icon">${LEVEL_ICON[r.levelUp]}</span>${T(r.levelUp)}</div>` : ""}
        ${r.passed ? `<button class="btn primary big" id="cont">${T("continueBtn")}</button>` : `<p class="sub">${T("rereadHint")}</p><button class="btn primary big" id="reread">${T("rereadModule")}</button>`}
      </div>
      <h2 style="margin-top:24px">${T("reviewTitle")}</h2><div class="stack">${r.review.map((it) => `
        <div class="card review-item"><div class="row" style="justify-content:space-between"><b>${esc(it.q)}</b><span class="mark ${it.correct ? "ok" : "no"}">${it.correct ? "✓" : "✗"}</span></div>
          <p class="sub">${T("yourAnswer")}: ${esc(it.choices[it.chosen] ?? "—")}</p>
          ${it.correct ? "" : `<p><span class="mark ok">✓</span> ${T("correctAnswer")}: <b>${esc(it.choices[it.answer])}</b></p>`}
        </div>`).join("")}</div>`;
    const c = $("#cont"); if (c) c.onclick = () => { S.result = null; go("course"); Faris.say(r.expertDone ? T("farisExpert") : r.levelUp ? T("farisPass", { level: T(r.levelUp) }) : T("farisModulePass")); };
    const rr = $("#reread"); if (rr) rr.onclick = () => { S.result = null; openLesson(r.lessonIds[0]); };
    if (!r.passed && !r._said) { r._said = true; Faris.say(T("farisFail", { n: r.total - r.score })); }
  };

  VIEWS.progress = async () => {
    const version=S.renderVersion; await refresh(); if(version!==S.renderVersion)return;
    const c = S.course;
    $("#main").innerHTML = topbar(T("progress")) + `<div class="grid">${c.levels.map((lv) => `
      <div class="card"><div class="level-badge"><span class="icon">${LEVEL_ICON[lv.id]}</span>${T(lv.id)}</div>
        <p style="margin-top:8px"><span class="pill ${lv.complete ? "good" : lv.locked ? "muted" : ""}">${lv.complete ? "✓ " + T("levelComplete") : lv.locked ? "🔒 " + T("lockedLevel") : T("level")}</span></p>
        <div class="bar" style="margin:10px 0"><i style="width:${Math.round((lv.passed / lv.total) * 100)}%"></i></div>
        <ul class="skills">${lv.modules.map((m) => `<li class="${m.passed ? "ok" : ""}">${m.passed ? "✓" : "○"} ${esc(m.title)}</li>`).join("")}</ul></div>`).join("")}</div>
      <div class="card" style="margin-top:16px"><h2>🎓 ${T("certificates")}</h2>${c.certs.length ? `<div class="stack">${c.certs.map((ct) => `<div class="row" style="justify-content:space-between"><span>${ct.icon} <b>${esc(ct.title)}</b> · ${T(ct.level)} · ${ct.score}/${ct.total} · ${new Date(ct.date).toLocaleDateString(S.lang === "ar" ? "ar-EG" : "en-GB")}</span><a class="btn small" href="${certUrl(ct.id)}" target="_blank" rel="noopener">${T("viewCertificate")}</a></div>`).join("")}</div>` : `<p class="sub">${T("noCerts")}</p>`}</div>
      ${c.expertDone ? `<div class="card" style="margin-top:16px"><h3>${T("expertNow")}</h3></div>` : ""}`;
  };


  VIEWS.settings = async () => {
    const version=S.renderVersion;
    const u = S.user;
    let status = null; try { status = await api("/api/status"); } catch {}
    if(version!==S.renderVersion)return;
    const installable = Boolean(window.deferredInstall);
    const demoNote = DEMO ? `<div class="banner">ℹ ${T("demoSettings")}</div>` : "";
    $("#main").innerHTML = topbar(T("settings"), u.email) + demoNote + `
      ${u.ownerRecoveryAvailable ? `<div class="card" style="margin-bottom:16px"><h2>${S.lang === 'ar' ? 'استعادة صلاحية المسؤول' : 'Restore administrator access'}</h2><p>${S.lang === 'ar' ? 'أدخل رمز استعادة المالك الخاص المرسل إليك. تبقى كلمة مرورك الحالية كما هي.' : 'Enter the private owner recovery code provided to you. Your existing password stays unchanged.'}</p><form id="owner-recovery" class="stack"><label>${S.lang === 'ar' ? 'رمز الاستعادة الخاص' : 'Private recovery code'}<input name="code" type="password" autocomplete="off" required maxlength="128" style="width:100%;padding:12px"></label><button class="btn primary">${S.lang === 'ar' ? 'استعادة صلاحية المسؤول' : 'Restore administrator access'}</button><span role="status" id="owner-recovery-status"></span></form></div>` : ''}
      <div class="card"><div class="setting"><div><h3>${T("displayName")}</h3></div><form class="row" id="namef"><input id="name" value="${esc(u.name || "")}" maxlength="60" style="padding:10px 12px;border-radius:12px;border:0;background:var(--sunk);min-width:220px"><button class="btn small primary">${T("save")}</button></form></div>
      <div class="setting"><div><h3>${T("language")}</h3></div><div class="row"><button class="btn small ${S.lang === "ar" ? "primary" : ""}" data-lang="ar">العربية</button><button class="btn small ${S.lang === "en" ? "primary" : ""}" data-lang="en">English</button></div></div></div>
      <div class="card" style="margin-top:16px" ${DEMO ? "hidden" : ""}><h2>${T("security")}</h2>
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
        <div class="setting"><div><h3>${T("deleteAccount")}</h3><div class="d">${T("deleteAccountD")}</div></div><button class="btn small" id="delacc">${T("deleteAccount")}</button></div>
      </div>`;
    $("#main").querySelectorAll("[data-lang]").forEach((b) => (b.onclick = async () => { S.lang = b.dataset.lang; applyLang(); await api("/api/settings", { lang: S.lang }); go("settings"); }));
    if (DEMO) { $("#totp").onclick = () => toast(T("demoOnly")); $("#pk").onclick = () => toast(T("demoOnly")); } else $("#totp").onclick = async () => {
      if (u.totpEnabled) { await api("/api/security/totp/disable", {}); u.totpEnabled = false; return go("settings"); }
      const r = await api("/api/security/totp/setup", {});
      $("#totp-box").innerHTML = `<div class="sunk" style="padding:16px;margin:10px 0"><p>${T("scanQr")}</p><img class="qr" src="${r.qr}" alt="QR"><p><code class="secret">${r.secret}</code></p><form class="row" id="tf"><input class="pin" id="tc" inputmode="numeric" maxlength="6" style="width:160px;padding:10px;border-radius:12px;border:0"><button class="btn primary small">${T("confirm")}</button><span class="err" id="terr"></span></form></div>`;
      $("#tf").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/security/totp/confirm", { code: $("#tc").value }); u.totpEnabled = true; toast("✓ " + T("on")); go("settings"); } catch { $("#terr").textContent = T("errWrongCode"); } };
    };
    if (!DEMO) $("#pk").onclick = registerPasskey;
    $("#namef").onsubmit = async (e) => { e.preventDefault(); const r = await api("/api/settings", { name: $("#name").value }); S.user = r.user; toast("✓ " + T("saved")); };
    const recoveryForm = $("#owner-recovery");
    if(recoveryForm)recoveryForm.onsubmit = async e => {
      e.preventDefault(); const button=recoveryForm.querySelector('button'); button.disabled=true;
      try { const r=await api('/api/auth/owner-recovery',{code:recoveryForm.elements.code.value}); recoveryForm.elements.code.value=''; S.user=r.user; await refresh(); await go('administration'); }
      catch(error) { $('#owner-recovery-status').textContent=error.message === 'rate_limited' ? (S.lang === 'ar' ? 'حاول مجدداً بعد ١٥ دقيقة.' : 'Try again in 15 minutes.') : (S.lang === 'ar' ? 'الرمز غير صحيح أو انتهت صلاحيته.' : 'The recovery code is invalid or expired.'); button.disabled=false; }
    };
    api("/api/sources").then((r) => { const el = $("#sources"); if (el) el.innerHTML = r.sources.map((s) => `<div><b>${S.lang === "ar" ? s.ar : s.en}</b>${s.sources.map(esc).join("<br>")}</div>`).join(""); }).catch(() => {});
    const inst = $("#install"); if (inst) inst.onclick = async () => { window.deferredInstall.prompt(); await window.deferredInstall.userChoice; window.deferredInstall = null; go("settings"); };
    const upd = $("#upd"); if (upd) upd.onclick = async () => { await api("/api/admin/update", {}); toast(T("updateStarted")); go("settings"); };
    $("#report").onclick = async () => { const note = prompt(T("reportProblem")) || ""; await api("/api/faris/report", { screen: S.view, note }); toast(T("reported")); };
    $("#reset").onclick = async () => { if (!confirm(T("startOverConfirm"))) return; const r = await api("/api/reset", {}); S.user = r.user; S.result = null; go("placement"); };
    $("#delacc").onclick = async () => { if (!confirm(T("deleteAccountConfirm"))) return; await api("/api/account", {}, "DELETE"); S.user = null; S.course = null; Faris.hide(); go("auth", { mode: "signup" }); };
    $("#logout").onclick = async () => { await api("/api/auth/logout", {}); S.user = null; S.content = null; S.course=null; S.result=null; Faris.hide(); go("auth", { mode: "login" }); };
  };

  Portal.register({S,VIEWS,api,topbar,$,toast,go,wireTopbar});
  LearningHub.register({S,VIEWS,api,topbar,$,toast,go,wireTopbar});
  Campus.register({S,VIEWS,api,topbar,$,toast,go,wireTopbar,openModule});
  Lab.register({S,VIEWS,api,topbar,$,toast});

  // ---------- boot ----------
  window.addEventListener("online", () => { S.online = true; go(S.view); });
  window.addEventListener("offline", () => { S.online = false; go(S.view); });
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.deferredInstall = e; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  (async () => {
    applyLang();
    Faris.mount(); Faris.hide();
    try { const { user } = await api("/api/me"); if (user) { S.user = user; S.lang = user.lang || S.lang; applyLang(); Faris.show(); await refresh(); return go("home"); } }
    catch { S.online = false; }
    go("auth");
  })();
})();
