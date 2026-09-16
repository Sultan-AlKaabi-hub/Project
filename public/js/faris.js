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
  let root, bubble, btn, recognition, requestVersion=0;
  const vl=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  function stopVoice(){ recognition?.abort(); recognition=null; window.speechSynthesis?.cancel(); }
  function wireVoice(){
    const controls=document.createElement('div');controls.className='voice-controls';
    const speak=document.createElement('button');speak.type='button';speak.className='btn small';speak.textContent=vl('Read aloud','قراءة بصوت عالٍ');speak.disabled=!window.speechSynthesis;
    speak.onclick=()=>{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(state.msg);utterance.lang=document.documentElement.lang==='ar'?'ar-AE':'en-GB';const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.startsWith(utterance.lang.slice(0,2)));if(voice)utterance.voice=voice;window.speechSynthesis.speak(utterance);};
    const mic=document.createElement('button');mic.type='button';mic.className='btn small';mic.textContent=vl('Dictate','إملاء صوتي');
    const status=document.createElement('p');status.className='voice-status';status.setAttribute('role','status');
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    mic.disabled=!Speech;if(!Speech)status.textContent=vl('Dictation is unavailable in this browser. You can type instead.','الإملاء غير متاح في هذا المتصفح. يمكنك الكتابة.');
    mic.onclick=()=>{
      if(recognition){stopVoice();mic.textContent=vl('Dictate','إملاء صوتي');return;}
      if(!sessionStorage.getItem('rasid.voiceConsent')){
        if(!confirm(vl('Your browser may send audio to its speech provider. Rasid does not save recordings. Continue with dictation?','قد يرسل المتصفح الصوت إلى مزود خدمة التعرف على الكلام. لا يحفظ راصد التسجيلات. هل تريد متابعة الإملاء؟')))return;
        sessionStorage.setItem('rasid.voiceConsent','1');
      }
      window.speechSynthesis?.cancel();recognition=new Speech();recognition.lang=document.documentElement.lang==='ar'?'ar-AE':'en-GB';recognition.continuous=false;recognition.interimResults=false;
      mic.textContent=vl('Stop listening','إيقاف الاستماع');status.textContent=vl('Listening… Review the text, then press Send.','جارٍ الاستماع… راجع النص ثم اضغط إرسال.');
      recognition.onresult=e=>{const input=bubble.querySelector('#faris-q');if(input){input.value=e.results[0][0].transcript.slice(0,300);input.focus();}};
      recognition.onerror=()=>{status.textContent=vl('Microphone unavailable or permission denied. Please type your question.','الميكروفون غير متاح أو لم يُسمح باستخدامه. اكتب سؤالك.');};
      recognition.onend=()=>{recognition=null;mic.textContent=vl('Dictate','إملاء صوتي');};
      try{recognition.start();}catch{recognition=null;status.textContent=vl('Could not start dictation.','تعذر بدء الإملاء.');}
    };
    const stop=document.createElement('button');stop.type='button';stop.className='btn small';stop.textContent=vl('Stop audio','إيقاف الصوت');stop.onclick=()=>{stopVoice();mic.textContent=vl('Dictate','إملاء صوتي');status.textContent='';};
    controls.append(speak,mic,stop);bubble.append(controls,status);
  }

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
      <form class="ask"><input id="faris-q" type="text" maxlength="300" aria-label="${t("askFaris")}" placeholder="${t("askFaris")}" autocomplete="off"><button class="link" type="submit">${t("send")}</button></form>`;
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
        state.actions = []; render();
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
