// Faris: pixel wizard helper. Sprite drawing + speech bubble + question box.
(function () {
  const MAP = window.FARIS_SPRITE.map;
  const COLORS = window.FARIS_SPRITE.colors;

  function draw(canvas, scale) {
    canvas.width = MAP[0].length * scale; canvas.height = MAP.length * scale;
    const ctx = canvas.getContext("2d");
    MAP.forEach((row, y) => [...row].forEach((ch, x) => { if (COLORS[ch]) { ctx.fillStyle = COLORS[ch]; ctx.fillRect(x * scale, y * scale, scale, scale); } }));
  }

  const state = { open: false, msg: "", link: null, actions: [], onAsk: null };
  let root, bubble, btn, requestVersion=0;
  const vl=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  function stopVoice(){ window.VoicePanel?.cleanup(); }
  function wireVoice(){ window.VoicePanel?.mount(bubble,state.msg); }

  function t(k, vars) { return window.T ? window.T(k, vars) : k; }

  function render() {
    if (!root) return;
    bubble.hidden = !state.open;
    btn.classList.toggle("bounce", !state.open && state.pulse);
    if (!state.open) { stopVoice(); return; }
    bubble.innerHTML = `
      <div class="name">${t("farisName")}</div>
      <div class="msg">${escapeHtml(state.msg)}</div>
      <div class="actions"></div>
      <form class="ask"><input id="faris-q" type="text" maxlength="300" aria-label="${t("askFaris")}" placeholder="${t("askFaris")}" autocomplete="off"><button class="link" type="submit">${vl('Send','إرسال')}</button></form>`;
    wireVoice();
    const actions = bubble.querySelector(".actions");
    if (state.link) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = `${t("openLesson")}: ${state.link.title}`;
      b.onclick = () => { window.App && window.App.openLesson(state.link.id); }; actions.appendChild(b);
    }
    for (const a of state.actions) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = a.label; b.onclick = a.run; actions.appendChild(b);
    }
    const c = document.createElement("button"); c.className = "link"; c.textContent = t("close"); c.onclick = () => { state.open = false; render(); }; actions.appendChild(c);
    bubble.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const q = bubble.querySelector("#faris-q").value.trim();
      if (!q) return;
      if (/^\d{6}$/.test(q)) { say(t("farisNoPin")); return; }
      const version=++requestVersion;
      stopVoice();
      say(t("farisThinking"));
      bubble.querySelector(".ask button").disabled=true;
      try {
        const r = await fetch("/api/faris/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, ...window.App?.getContext?.() }) }).then((r) => r.json());
        if(version!==requestVersion)return;
        state.msg = r.text || t("errNet");
        state.link = r.lessonId ? { id: r.lessonId, title: r.lessonTitle } : null;
        state.actions = []; render(); if(window.VoicePanel?.autoRead())window.VoicePanel.speak(state.msg);
      } catch { if(version===requestVersion)say(t("errNet")); }
    };
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function say(msg, { link = null, actions = [], open = true, pulse = false } = {}) {
    state.msg = msg; state.link = link; state.actions = actions; state.open = open; state.pulse = pulse; render();
  }

  function mount() {
    root = document.createElement("div"); root.className = "faris";
    bubble = document.createElement("div"); bubble.className = "bubble"; bubble.hidden = true;
    btn = document.createElement("button"); btn.className = "faris-btn"; btn.setAttribute("aria-label", "Faris");
    const cv = document.createElement("canvas"); draw(cv, 4); btn.appendChild(cv);
    btn.onclick = () => { state.open = !state.open; state.pulse = false; render(); };
    root.append(bubble, btn);
    document.body.appendChild(root);
  }

  window.Faris = { mount, say, draw, hide: () => { requestVersion++;stopVoice(); state.msg="";state.link=null;state.open=false; if (root) root.hidden = true; }, show: () => { if (root) root.hidden = false; }, isOpen: () => state.open, rerender: render };
})();
