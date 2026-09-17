(function () {
  let recognition,
    cleanupListener,
    statusElement,
    readText = "",
    queue = [],
    generation = 0;
  let chatLanguage="en";
  const L = (en, ar) => (chatLanguage === "ar" ? ar : en);
  const language = () => chatLanguage;
  let selected = "",
    rate = 1,
    auto = false;
  function stop() {
    generation++;
    recognition?.abort();
    recognition = null;
    queue = [];
    window.speechSynthesis?.cancel();
  }
  function speak(text = readText) {
    stop();
    const synthesis = window.speechSynthesis;
    if (!synthesis) return;
    const voices = synthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith(language()));
    const voice = voices.find((v) => v.voiceURI === selected) || voices[0];
    if (!voice) {
      if (statusElement)
        statusElement.textContent = L(
          "No English voice is installed on this device. Add one in your device speech settings.",
          "لا يوجد صوت عربي مثبت على الجهاز. أضف صوتاً عربياً من إعدادات النطق في جهازك.",
        );
      return;
    }
    const version = generation;
    queue = String(text).match(/[^.!?؟\n]+[.!?؟\n]?/g) || [String(text)];
    queue = queue.flatMap(
      (part) => part.match(/.{1,180}(?:\s|$)|.{1,180}/gu) || [],
    );
    function next() {
      if (version !== generation || !queue.length) {
        if (statusElement && version === generation)
          statusElement.textContent = L("Finished reading.", "انتهت القراءة.");
        return;
      }
      const utterance = new SpeechSynthesisUtterance(queue.shift());
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      utterance.onend = next;
      utterance.onerror = () => {
        if (version === generation && statusElement)
          statusElement.textContent = L(
            "Audio stopped. You can try Read aloud again.",
            "توقف الصوت. يمكنك محاولة القراءة مجدداً.",
          );
      };
      synthesis.speak(utterance);
    }
    if (statusElement)
      statusElement.textContent = L(
        "Reading aloud…",
        "تجري القراءة بصوت عالٍ…",
      );
    next();
  }
  function mount(container, text, lang) {
    chatLanguage=lang==='ar'?'ar':'en';
    stop();
    cleanupListener?.();
    readText = text;
    const panel = document.createElement("section");
    panel.className = "faris-voice";
    panel.innerHTML = `<div class="faris-settings" hidden><div class="voice-options"><label>${L("Voice", "الصوت")}<select data-voice aria-label="${L("Reading voice", "صوت القراءة")}"></select></label><label>${L("Speed", "السرعة")}<select data-speed><option value="0.8">0.8×</option><option value="1">1×</option><option value="1.2">1.2×</option></select></label><label><input type="checkbox" data-auto>${L("Read replies automatically", "قراءة الردود تلقائياً")}</label></div><p>${L("Type in English or Arabic. For dictation, choose EN or ع above. Review your words before sending. AI answers can be imperfect.","اكتب بالعربية أو الإنجليزية. للإملاء، اختر ع أو EN أعلاه. راجع كلماتك قبل الإرسال. قد تحتوي إجابات الذكاء الاصطناعي على أخطاء.")}</p></div><p class="voice-status" role="status" data-status></p>`;
    container.querySelector('.faris-head').after(panel);
    const settings=panel.querySelector('.faris-settings');
    container.querySelector('[data-settings]').onclick=e=>{settings.hidden=!settings.hidden;e.currentTarget.setAttribute('aria-expanded',String(!settings.hidden));};
    statusElement = panel.querySelector("[data-status]");
    const select = panel.querySelector("[data-voice]"),
      mic = container.querySelector("[data-mic]"),
      read = container.querySelector("[data-read]");
    const micIcon=mic.innerHTML;
    function populate() {
      const voices =
        window.speechSynthesis
          ?.getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith(language())) || [];
      select.replaceChildren();
      for (const v of voices) {
        const o = document.createElement("option");
        o.value = v.voiceURI;
        o.textContent = `${v.name} · ${v.lang}`;
        select.append(o);
      }
      if (voices.some((v) => v.voiceURI === selected)) select.value = selected;
      else selected = voices[0]?.voiceURI || "";
      select.disabled = !voices.length;
      read.disabled = false;
      statusElement.textContent = "";
    }
    populate();
    window.speechSynthesis?.addEventListener("voiceschanged", populate);
    cleanupListener = () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", populate);
    select.onchange = () => {
      selected = select.value;
      stop();
    };
    panel.querySelector("[data-speed]").value = String(rate);
    panel.querySelector("[data-speed]").onchange = (e) => {
      rate = Number(e.target.value);
    };
    panel.querySelector("[data-auto]").checked = auto;
    panel.querySelector("[data-auto]").onchange = (e) => {
      auto = e.target.checked;
    };
    read.onclick = () => {if(window.speechSynthesis?.speaking){stop();statusElement.textContent="";}else speak();};
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    mic.disabled = !Recognition;
    mic.title = Recognition
      ? ""
      : L(
          "Dictation is not supported in this browser.",
          "الإملاء غير مدعوم في هذا المتصفح.",
        );
    mic.onclick = () => {
      if (recognition) {
        stop();
        mic.innerHTML=micIcon;statusElement.textContent="";
        return;
      }
      if (!sessionStorage.getItem("rasid.voiceConsent")) {
        if (
          !confirm(
            L(
              "Your browser may send audio to its speech provider. Rasid does not save recordings. Continue?",
              "قد يرسل المتصفح الصوت إلى مزود التعرف على الكلام. لا يحفظ راصد التسجيلات. هل تريد المتابعة؟",
            ),
          )
        )
          return;
        sessionStorage.setItem("rasid.voiceConsent", "1");
      }
      stop();
      const r = new Recognition();
      recognition = r;
      r.lang = language() === "ar" ? "ar-AE" : "en-GB";
      r.continuous = false;
      r.interimResults = true;
      mic.innerHTML = "■";
      mic.setAttribute("aria-label",L("Stop listening","إيقاف الاستماع"));
      statusElement.textContent = L("Listening…", "جارٍ الاستماع…");
      r.onresult = (e) => {
        const input = container.querySelector("#faris-q");
        if (input)
          input.value = Array.from(e.results)
            .map((result) => result[0].transcript)
            .join(" ")
            .slice(0, 300);
      };
      r.onerror = (e) => {
        statusElement.textContent =
          e.error === "not-allowed"
            ? L(
                "Microphone permission was denied. You can type instead.",
                "لم يُسمح باستخدام الميكروفون. يمكنك الكتابة.",
              )
            : L(
                "No speech detected or recognition unavailable. Please try again or type.",
                "لم يتم التعرف على الكلام أو أن الخدمة غير متاحة. حاول مجدداً أو اكتب.",
              );
      };
      r.onend = () => {
        if(statusElement.textContent===L("Listening…", "جارٍ الاستماع…"))statusElement.textContent=L("Review your words, then send.","راجع كلماتك ثم أرسل.");
        if (recognition === r) recognition = null;
        mic.innerHTML = micIcon;
        mic.setAttribute("aria-label",L("Dictate","إملاء صوتي"));
      };
      try {
        r.start();
      } catch {
        recognition = null;
        mic.innerHTML = micIcon;
        mic.setAttribute("aria-label",L("Dictate","إملاء صوتي"));
        statusElement.textContent = L(
          "Could not start dictation.",
          "تعذر بدء الإملاء.",
        );
      }
    };
  }
  window.VoicePanel = {
    mount,
    stop,
    speak,
    autoRead: () => auto,
    cleanup: () => {
      stop();
      cleanupListener?.();
      cleanupListener = null;
    },
  };
})();
