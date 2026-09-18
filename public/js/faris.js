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
  const transcript=[];
  let chatLang=document.documentElement.lang;
  const vl=(en,ar)=>chatLang==='ar'?ar:en;
  function stopVoice(){ window.VoicePanel?.cleanup(); }
  function wireVoice(){ window.VoicePanel?.mount(bubble,state.msg,chatLang); }

  function t(k, vars) { return window.T ? window.T(k, vars) : k; }

  function render() {
    if (!root) return;
    bubble.hidden = !state.open;
    btn.classList.toggle("bounce", !state.open && state.pulse);
    if (!state.open) { stopVoice(); return; }
    bubble.innerHTML = `
      <div class="faris-head"><strong>${vl("Faris","فارس")}</strong><button class="faris-icon" data-chat-lang title="${vl('Switch to Arabic','التبديل للإنجليزية')}" aria-label="${vl('Switch to Arabic','التبديل للإنجليزية')}">${chatLang==='ar'?'ع':'EN'}</button><button class="faris-icon" data-read title="${vl('Read aloud / stop','قراءة صوتية / إيقاف')}" aria-label="${vl('Read aloud / stop','قراءة صوتية / إيقاف')}"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button><button class="faris-icon" data-settings aria-expanded="false" aria-label="${vl('Chat settings','إعدادات المحادثة')}">⚙</button><button class="faris-icon" data-close aria-label="${vl('Close chat','إغلاق المحادثة')}">×</button></div>
      <div class="msg" role="status" aria-live="polite" dir="auto">${escapeHtml(state.msg)}</div>
      <div class="actions"></div>
      <form class="ask"><input id="faris-q" dir="auto" type="text" maxlength="4000" aria-label="${vl('Ask Faris','اسأل فارس')}" placeholder="${vl('Ask Faris…','اسأل فارس…')}" autocomplete="off"><button type="button" class="faris-icon" data-mic aria-label="${vl('Dictate','إملاء صوتي')}"><svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg></button><button class="link" type="submit" aria-label="${vl('Send','إرسال')}">↑</button></form>`;
    bubble.dir=chatLang==='ar'?'rtl':'ltr';
    bubble.querySelector('[data-chat-lang]').onclick=()=>{const draft=bubble.querySelector('#faris-q').value;chatLang=chatLang==='ar'?'en':'ar';render();bubble.querySelector('#faris-q').value=draft;};
    bubble.querySelector('[data-close]').onclick=()=>{requestVersion++;pending?.abort();pending=null;state.open=false;render();btn.focus();};
    wireVoice();
    if(window.App?.getContext?.().hasAI !== false||state.response?.route?.intent==="site_guide")window.LearningAI?.enhance(bubble,state.response,chatLang);
    if(window.LearningAI){const message=bubble.querySelector(".msg");message.replaceChildren();window.LearningAI?.textBlock(message,state.msg);}
    const thread=document.createElement('div');thread.className='chat-thread';thread.setAttribute('role','log');thread.setAttribute('aria-label',vl('Conversation','المحادثة'));
    for(const [turnIndex,turn] of transcript.entries()){if(turnIndex===transcript.length-1&&turn.role==='assistant'&&turn.text===state.msg)continue;const item=document.createElement('div');item.className='chat-turn '+turn.role;item.dir='auto';const who=document.createElement('strong');who.textContent=turn.role==='user'?vl('You','أنت'):vl('Faris','فارس');item.append(who);const body=document.createElement('div');if(window.LearningAI)window.LearningAI.textBlock(body,turn.text);else body.textContent=turn.text;item.append(body);thread.append(item);}
    for(const el of [...bubble.querySelectorAll(':scope > .ai-agent-tag,:scope > .msg,:scope > .ai-cards')])thread.append(el);
    bubble.querySelector('.faris-head').after(thread);thread.scrollTop=thread.scrollHeight;
    bubble.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{const input=bubble.querySelector('#faris-q');input.value=b.dataset.prompt==='bfs'?vl('Explain BFS and DFS with an example','اشرح البحث بالعرض والعمق مع مثال'):vl('How do I book tuition or a meeting?','كيف أحجز درساً خاصاً أو اجتماعاً؟');input.focus();});
    const actions = bubble.querySelector(".actions");
    if (state.link) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = `${t("openLesson")}: ${state.link.title}`;
      b.onclick = () => { window.App && window.App.openLesson(state.link.id); }; actions.appendChild(b);
    }
    for (const a of state.actions) {
      const b = document.createElement("button"); b.className = "link"; b.textContent = a.label; b.onclick = a.run; actions.appendChild(b);
    }
    if(pending){const cancel=document.createElement('button');cancel.className='link';cancel.textContent=vl('Cancel reply','إلغاء الرد');cancel.onclick=()=>{requestVersion++;pending.abort();pending=null;say(vl('Reply cancelled. Ask another question whenever you are ready.','تم إلغاء الرد. يمكنك طرح سؤال آخر.'));};actions.prepend(cancel);}
    bubble.querySelector(".ask").onsubmit = async (e) => {
      e.preventDefault();
      const q = bubble.querySelector("#faris-q").value.trim();
      if (!q) return;
      if (/^\d{6}$/.test(q)) { say(t("farisNoPin")); return; }
      transcript.push({role:'user',text:q});if(transcript.length>24)transcript.splice(0,transcript.length-24);
      const version=++requestVersion;
      pending?.abort();pending=new AbortController();
      stopVoice();
      say(t("farisThinking"));
      bubble.querySelector(".ask button[type=submit]").disabled=true;
      try {
        const context={...(window.App?.getContext?.()||{}),conversation:transcript.flatMap((turn,i)=>turn.role==='assistant'&&turn.agent&&turn.agent!=='support'&&transcript[i-1]?.role==='user'?[{question:transcript[i-1].text.slice(0,1000),answer:turn.text.slice(0,2000)}]:[]).slice(-3)};
        let r;
        if(window.LearningAI && context.hasAI!==false){
          let streamed='';
          r=await window.LearningAI.request(q,context,chatLang,{signal:AbortSignal.any([pending.signal,AbortSignal.timeout(75000)]),onRoute:label=>{if(version===requestVersion)bubble.querySelector('.msg').textContent=label+'…';},onDelta:text=>{streamed+=text;if(version===requestVersion){bubble.querySelector('.msg').textContent=streamed;const thread=bubble.querySelector('.chat-thread');if(thread)thread.scrollTop=thread.scrollHeight;}}});
        }else{
          const response=await fetch('/api/faris/ask',{signal:pending.signal,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...context,question:q,lang:chatLang})});
          if(!response.ok)throw new Error('reply_failed');r=await response.json();
        }
        if(version!==requestVersion)return;
        pending=null;
        state.response=r.route?r:null;
        state.msg = r.text || t("errNet");
        transcript.push({role:'assistant',text:state.msg,agent:r.route?.agent});if(transcript.length>24)transcript.splice(0,transcript.length-24);
        chatLang=/[\u0600-\u06ff]/u.test(state.msg)?"ar":"en";
        state.link = r.lessonId ? { id: r.lessonId, title: r.lessonTitle } : null;
        state.actions = []; render(); if(window.VoicePanel?.autoRead())window.VoicePanel.speak(state.msg);
      } catch { if(version===requestVersion){pending=null;say(t("errNet"));} }
    };
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function say(msg, { link = null, actions = [], open = true, pulse = false } = {}) {
    if(!state.open)chatLang=document.documentElement.lang;
    state.response=null;
    state.msg = msg; state.link = link; state.actions = actions; state.open = open; state.pulse = pulse; render();
  }

  function mount() {
    root = document.createElement("div"); root.className = "faris";
    bubble = document.createElement("div"); bubble.className = "bubble"; bubble.hidden = true;
    btn = document.createElement("button"); btn.className = "faris-btn"; btn.setAttribute("aria-label", "Faris");
    const cv = document.createElement("canvas"); draw(cv, 4); btn.appendChild(cv);
    btn.onclick = () => { if(state.open){requestVersion++;pending?.abort();pending=null;}if(!state.msg){chatLang=document.documentElement.lang;state.msg=t('farisHello');}state.open = !state.open; state.pulse = false; render(); };
    root.append(bubble, btn);
    document.body.appendChild(root);
  }

  window.Faris = { mount, say, draw, clear:()=>{requestVersion++;pending?.abort();pending=null;transcript.length=0;say(t('farisHello'));}, close:()=>{stopVoice();state.open=false;render();}, ask: (question)=>{if(!state.open)chatLang=document.documentElement.lang;state.open=true;render();bubble.querySelector("#faris-q").value=question;bubble.querySelector(".ask").requestSubmit();}, hide: () => { requestVersion++;pending?.abort();pending=null;stopVoice(); transcript.length=0;state.msg="";state.response=null;state.link=null;state.open=false; if (root) root.hidden = true; }, show: () => { if (root) root.hidden = false; }, isOpen: () => state.open, rerender: render };
})();
