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
  let root, bubble, btn, requestVersion=0, pending;
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
      <p class="faris-guidance">${vl('AI learning guide · Check important answers against your course.','مرشد تعلم بالذكاء الاصطناعي · راجع الإجابات المهمة في المسار.')}</p>
      <div class="msg" role="status" aria-live="polite" dir="auto">${escapeHtml(state.msg)}</div>
      <div class="actions"></div>
      <div class="faris-suggestions"><button type="button" data-prompt="bfs">${vl('Explain BFS vs DFS','اشرح البحث بالعرض والعمق')}</button><button type="button" data-prompt="booking">${vl('How do I book?','كيف أحجز موعداً؟')}</button></div>
      <form class="ask"><input id="faris-q" type="text" maxlength="300" aria-label="${t("askFaris")}" placeholder="${t("askFaris")}" autocomplete="off"><button class="link" type="submit">${vl('Send','إرسال')}</button></form>`;
    wireVoice();
    bubble.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{const input=bubble.querySelector('#faris-q');input.value=b.dataset.prompt==='bfs'?vl('Explain BFS and DFS with an example','اشرح البحث بالعرض والعمق مع مثال'):vl('How do I book tuition or a meeting?','كيف أحجز درساً خاصاً أو اجتماعاً؟');input.focus();});
    const actions = bubble.querySelector(".actions");
    if (state.link) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = `${t("openLesson")}: ${state.link.title}`;
      b.onclick = () => { window.App && window.App.openLesson(state.link.id); }; actions.appendChild(b);
    }
    for (const a of state.actions) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = a.label; b.onclick = a.run; actions.appendChild(b);
    }
    const c = document.createElement("button"); c.className = "link"; c.textContent = t("close"); c.onclick = () => { requestVersion++;pending?.abort();pending=null;state.open = false; render();btn.focus(); }; actions.appendChild(c);
    if(pending){const cancel=document.createElement('button');cancel.className='link';cancel.textContent=vl('Cancel reply','إلغاء الرد');cancel.onclick=()=>{requestVersion++;pending.abort();pending=null;say(vl('Reply cancelled. Ask another question whenever you are ready.','تم إلغاء الرد. يمكنك طرح سؤال آخر.'));};actions.prepend(cancel);}
    bubble.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const q = bubble.querySelector("#faris-q").value.trim();
      if (!q) return;
      if (/^\d{6}$/.test(q)) { say(t("farisNoPin")); return; }
      const version=++requestVersion;
      pending?.abort();pending=new AbortController();
      stopVoice();
      say(t("farisThinking"));
      bubble.querySelector(".ask button").disabled=true;
      try {
        const response = await fetch("/api/faris/ask", { signal:AbortSignal.any([pending.signal,AbortSignal.timeout(45000)]), method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, ...window.App?.getContext?.() }) });
        if(!response.ok)throw new Error('reply_failed');
        const r=await response.json();
        if(version!==requestVersion)return;
        pending=null;
        state.msg = r.text || t("errNet");
        state.link = r.lessonId ? { id: r.lessonId, title: r.lessonTitle } : null;
        state.actions = []; render(); if(window.VoicePanel?.autoRead())window.VoicePanel.speak(state.msg);
      } catch { if(version===requestVersion){pending=null;say(t("errNet"));} }
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
    btn.onclick = () => { if(state.open){requestVersion++;pending?.abort();pending=null;}if(!state.msg)state.msg=t('farisHello');state.open = !state.open; state.pulse = false; render(); };
    root.append(bubble, btn);
    document.body.appendChild(root);
  }

  window.Faris = { mount, say, draw, hide: () => { requestVersion++;pending?.abort();pending=null;stopVoice(); state.msg="";state.link=null;state.open=false; if (root) root.hidden = true; }, show: () => { if (root) root.hidden = false; }, isOpen: () => state.open, rerender: render };
})();
