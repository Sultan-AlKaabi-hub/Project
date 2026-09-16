(function () {
  let timer;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function cleanup() {
    clearInterval(timer);
    timer = null;
  }
  function register({ S, VIEWS, api, topbar, $, toast }) {
    I18N.en.lab = "AI discovery lab";
    I18N.ar.lab = "مختبر اكتشاف الذكاء الاصطناعي";
    const L = (en, ar) => (S.lang === "ar" ? ar : en);
    VIEWS.lab = async () => {
      cleanup();
      const email = S.user.email;
      const data = await api("/api/lab");
      if (S.view !== "lab" || S.user?.email !== email) return;
      let mode = "bfs",
        step = 0,
        frames = AlgorithmModel.trace(mode),
        threshold = 0.6;
      const positions = {
        A: [290, 50],
        B: [155, 135],
        C: [425, 135],
        D: [65, 230],
        E: [235, 230],
        F: [465, 230],
        G: [265, 330],
        H: [505, 330],
      };
      $("#main").innerHTML =
        topbar(
          L("AI discovery lab", "مختبر اكتشاف الذكاء الاصطناعي"),
          L(
            "Explore. Predict. Explain. Build understanding by doing.",
            "استكشف. توقع. اشرح. ابنِ فهمك بالتجربة.",
          ),
        ) +
        `
   <section class="lab-hero"><div><span class="eyebrow">RASID / ${L("LEARN BY DOING", "تعلم بالممارسة")}</span><h2>${L("Make the invisible visible.", "شاهد ما يحدث داخل الخوارزمية.")}</h2><p>${L("From your first search to model evaluation. Every control changes a real calculation.", "من أول بحث إلى تقييم النماذج. كل أداة تحكم تغير حساباً فعلياً.")}</p><div class="row"><a class="btn" href="#search-lab">01 · ${L("Search", "البحث")}</a><a class="btn" href="#model-lab">02 · ${L("Evaluate", "التقييم")}</a><a class="btn" href="#lab-assessment">03 · ${L("Practice", "التطبيق")}</a></div></div><div class="lab-orbit" aria-hidden="true"><i></i><i></i><i></i><b>AI</b></div></section>
   <section class="lab-panel" id="search-lab"><div class="portal-row"><div><span class="eyebrow">01 / ${L("BEGINNER → EXPERT", "من المبتدئ إلى الخبير")}</span><h2>${L("Two ways to explore a graph", "طريقتان لاستكشاف الرسم البياني")}</h2></div><label>${L("Algorithm", "الخوارزمية")}<select id="search-mode"><option value="bfs">BFS · ${L("Breadth-first", "البحث بالعرض")}</option><option value="dfs">DFS · ${L("Depth-first", "البحث بالعمق")}</option></select></label></div>
   <p>${L("Start at A. Neighbours are explored alphabetically. Follow the frontier to see why the visit order changes.", "ابدأ من A. تُستكشف العقد المجاورة أبجدياً. تابع قائمة الانتظار لترى سبب اختلاف ترتيب الزيارات.")}</p>
   <div class="lab-columns"><div><svg class="search-graph" viewBox="0 0 580 390" role="img" aria-label="${L("Eight nodes: A connects to B and C; B to D and E; C to F; E to G; F to H.", "ثماني عقد: A متصلة بـB وC، وB بـD وE، وC بـF، وE بـG، وF بـH.")}">${Object.entries(
     AlgorithmModel.graph,
   )
     .flatMap(([n, adj]) =>
       adj
         .filter((k) => n < k)
         .map(
           (k) =>
             `<line x1="${positions[n][0]}" y1="${positions[n][1]}" x2="${positions[k][0]}" y2="${positions[k][1]}"/>`,
         ),
     )
     .join("")}${Object.entries(positions)
     .map(
       ([n, [x, y]]) =>
         `<g data-node="${n}"><circle cx="${x}" cy="${y}" r="25"/><text x="${x}" y="${y + 6}" text-anchor="middle">${n}</text></g>`,
     )
     .join(
       "",
     )}</svg><div class="lab-legend"><span class="visited">● ${L("Visited", "تمت الزيارة")}</span><span class="current">● ${L("Current", "الحالية")}</span><span class="waiting">○ ${L("Waiting", "قيد الانتظار")}</span></div></div>
   <div class="trace-panel"><h3 id="frontier-title"></h3><div id="frontier" class="node-list" dir="ltr"></div><h3>${L("Visit order", "ترتيب الزيارة")}</h3><div id="visited" class="node-list" dir="ltr"></div><p id="trace-status" role="status" aria-live="polite"></p><div class="row"><button class="btn" id="step-back">${L("Back", "السابق")}</button><button class="btn primary" id="step-next">${L("Next step", "الخطوة التالية")}</button><button class="btn" id="trace-play">${L("Play", "تشغيل")}</button><button class="btn ghost" id="trace-reset">${L("Reset", "إعادة")}</button></div><p class="sub" id="trace-explain"></p><details><summary>${L("Why it works + complexity", "كيف تعمل + التعقيد")}</summary><p>${L("BFS uses a FIFO queue; DFS uses a LIFO stack. With adjacency lists, both take O(V + E) time and O(V) memory. BFS finds the shortest number of edges in an unweighted graph. DFS does not guarantee the shortest path.", "يستخدم BFS طابوراً يدخل فيه العنصر أولاً ويخرج أولاً، ويستخدم DFS مكدساً يدخل فيه العنصر أخيراً ويخرج أولاً. باستخدام قوائم التجاور، يستغرق كلاهما O(V + E) زمناً وO(V) ذاكرة. يجد BFS أقل عدد من الحواف في الرسم غير الموزون، بينما لا يضمن DFS أقصر مسار.")}</p><pre dir="ltr" id="search-code"></pre></details></div></div></section>
   <section class="lab-panel" id="model-lab"><span class="eyebrow">02 / ${L("INTERMEDIATE", "المتوسط")}</span><h2>${L("A model is a set of trade-offs", "النموذج يوازن بين نتائج مختلفة")}</h2><p>${L("This fictional classifier predicts whether a message needs human review. Lower the threshold to catch more positives, at the cost of extra false alarms.", "يتوقع هذا المصنف الافتراضي ما إذا كانت الرسالة تحتاج إلى مراجعة بشرية. خفّض العتبة لاكتشاف إيجابيات أكثر مع احتمال زيادة الإنذارات الخاطئة.")}</p><label for="threshold">${L("Decision threshold", "عتبة القرار")} <output id="threshold-value">0.60</output></label><input id="threshold" type="range" min="0" max="100" value="60" aria-describedby="threshold-help"><p id="threshold-help" class="sub">${L("A score at or above the threshold predicts positive. These eight labelled examples are synthetic.", "الدرجة التي تساوي العتبة أو تتجاوزها تعطي توقعاً إيجابياً. هذه الأمثلة الثمانية افتراضية.")}</p><div class="lab-columns"><div class="confusion" id="confusion"></div><div><div class="lab-metrics" id="model-metrics" aria-live="polite"></div><details><summary>${L("Inspect all eight examples", "افحص الأمثلة الثمانية")}</summary><div id="model-data"></div></details></div></div></section>
   <section class="lab-panel" id="lab-assessment"><span class="eyebrow">03 / ${L("APPLY YOUR KNOWLEDGE", "طبّق معرفتك")}</span><h2>${L("More than choosing an answer", "أكثر من اختيار إجابة")}</h2><p>${L("Order nodes, calculate a result and explain a decision. This practice is separate from course certificates; you can retry to learn.", "رتب العقد واحسب النتيجة واشرح القرار. هذا تدريب مستقل عن شهادات المسار ويمكنك إعادته للتعلم.")}</p><form id="lab-form"><div class="lab-questions">${data.questions.map((q, i) => `<fieldset><legend>${i + 1}. ${esc(q.q)}</legend><span class="pill">${L(q.level, { beginner: "مبتدئ", intermediate: "متوسط", expert: "خبير" }[q.level])}</span>${q.type === "order" ? `<p class="sub">${L("Use the arrow buttons to reorder. Keyboard and touch supported.", "استخدم أزرار الأسهم للترتيب. تدعم لوحة المفاتيح واللمس.")}</p><ol id="order-list">${q.items.map((n) => `<li data-value="${n}"><b>${n}</b><button type="button" class="btn small" data-move="-1" aria-label="${L("Move up", "نقل للأعلى")} ${n}">↑</button><button type="button" class="btn small" data-move="1" aria-label="${L("Move down", "نقل للأسفل")} ${n}">↓</button></li>`).join("")}</ol>` : `<label class="sr-label" for="answer-${q.id}">${esc(q.q)}</label><input id="answer-${q.id}" name="${q.id}" type="text" ${q.type === "number" ? 'inputmode="decimal"' : ""} maxlength="120" required autocomplete="off">`}</fieldset>`).join("")}</div><label for="reflection"><strong>${L("Written reflection · not automatically graded", "تأمل كتابي · لا يصحح آلياً")}</strong><p>${L("A support team cannot review many false alarms, but missing an urgent message is costly. Which threshold would you choose, and what evidence would you check before launch?", "لا يستطيع فريق الدعم مراجعة إنذارات خاطئة كثيرة، لكن تفويت رسالة عاجلة مكلف. أي عتبة تختار، وما الأدلة التي تفحصها قبل الإطلاق؟")}</p></label><textarea id="reflection" maxlength="1200" rows="4" placeholder="${L("Explain your reasoning…", "اشرح تفكيرك…")}"></textarea><p class="sub">${L("Self-review: name the trade-off; cite precision/recall; test on representative data; keep a human review path. Your reflection is saved with this practice attempt.", "راجع إجابتك: سمّ المفاضلة، واذكر الدقة والاسترجاع، واختبر بيانات ممثلة، وأبقِ مساراً للمراجعة البشرية. يُحفظ تأملك مع هذه المحاولة.")}</p><button class="btn primary" type="submit">${L("Check my understanding", "تحقق من فهمي")}</button><div id="lab-result" role="status"></div></form><details><summary>${L("Recent practice attempts", "المحاولات الأخيرة")}</summary><div id="lab-history">${data.attempts.map((a) => `<p>${new Date(a.at).toLocaleString(S.lang === "ar" ? "ar-AE" : "en-GB")} · ${a.score}/${a.total}</p>`).join("") || L("Your first attempt starts here.", "ابدأ محاولتك الأولى هنا.")}</div></details></section>`;
      function draw() {
        const f = frames[step];
        document.querySelectorAll("[data-node]").forEach((g) => {
          const n = g.dataset.node;
          g.setAttribute(
            "class",
            n === f.current
              ? "current"
              : f.visited.includes(n)
                ? "visited"
                : f.frontier.includes(n)
                  ? "waiting"
                  : "",
          );
        });
        $("#frontier-title").textContent =
          mode === "bfs"
            ? L(
                "Queue · next node on the left",
                "الطابور · العقدة التالية على اليسار",
              )
            : L("Stack · top on the left", "المكدس · القمة على اليسار");
        $("#frontier").innerHTML =
          f.frontier.map((n) => `<span>${n}</span>`).join("") || "∅";
        $("#visited").innerHTML =
          f.visited.map((n) => `<span>${n}</span>`).join("") || "—";
        $("#trace-status").textContent = L(
          `Step ${step} of 8${f.current ? ` · Visiting ${f.current}` : ""}`,
          `الخطوة ${step} من 8${f.current ? ` · زيارة ${f.current}` : ""}`,
        );
        $("#step-back").disabled = step === 0;
        $("#step-next").disabled = step === 8;
        $("#trace-explain").textContent =
          mode === "bfs"
            ? L(
                "Explore the nearest layer first. Route to H: A → C → F → H.",
                "استكشف الطبقة الأقرب أولاً. المسار إلى H هو A ← C ← F ← H.",
              )
            : L(
                "Explore one branch before returning to the next. Watch how G is visited before C.",
                "استكشف فرعاً قبل العودة إلى التالي. لاحظ زيارة G قبل C.",
              );
        $("#search-code").textContent =
          mode === "bfs"
            ? "frontier = queue([A])\nwhile frontier not empty:\n  node = dequeue()\n  visit(node)\n  enqueue unseen neighbours"
            : "frontier = stack([A])\nwhile frontier not empty:\n  node = pop()\n  visit(node)\n  push unseen neighbours\n  (reverse alphabetical order)";
      }
      function pause() {
        cleanup();
        $("#trace-play").textContent = L("Play", "تشغيل");
      }
      $("#search-mode").onchange = (e) => {
        pause();
        mode = e.target.value;
        step = 0;
        frames = AlgorithmModel.trace(mode);
        draw();
      };
      $("#step-next").onclick = () => {
        pause();
        step = Math.min(8, step + 1);
        draw();
      };
      $("#step-back").onclick = () => {
        pause();
        step = Math.max(0, step - 1);
        draw();
      };
      $("#trace-reset").onclick = () => {
        pause();
        step = 0;
        draw();
      };
      $("#trace-play").onclick = () => {
        if (timer) return pause();
        if (step === 8) step = 0;
        $("#trace-play").textContent = L("Pause", "إيقاف مؤقت");
        timer = setInterval(() => {
          if (S.view !== "lab" || document.hidden) {
            pause();
            return;
          }
          step++;
          draw();
          if (step >= 8) pause();
        }, 1000);
      };
      draw();
      function model() {
        const r = AlgorithmModel.classify(threshold),
          percent = (n) => (n === null ? "—" : `${Math.round(n * 100)}%`);
        $("#threshold-value").textContent = threshold.toFixed(2);
        $("#confusion").innerHTML = [
          ["tp", L("True positives", "إيجابيات صحيحة")],
          ["fp", L("False positives", "إيجابيات خاطئة")],
          ["fn", L("False negatives", "سلبيات خاطئة")],
          ["tn", L("True negatives", "سلبيات صحيحة")],
        ]
          .map(
            ([k, label]) =>
              `<div class="${k}"><strong>${r[k]}</strong><span>${label}</span></div>`,
          )
          .join("");
        $("#model-metrics").innerHTML = [
          ["precision", L("Precision", "الدقة الإيجابية")],
          ["recall", L("Recall", "الاسترجاع")],
          ["accuracy", L("Accuracy", "الصحة الكلية")],
        ]
          .map(
            ([k, label]) =>
              `<div><strong>${percent(r[k])}</strong><span>${label}</span></div>`,
          )
          .join("");
        $("#model-data").innerHTML =
          `<table class="campus-table"><thead><tr><th>${L("Score", "الدرجة")}</th><th>${L("Actual", "الفعلية")}</th><th>${L("Predicted", "المتوقعة")}</th></tr></thead><tbody>${AlgorithmModel.samples.map((s) => `<tr><td>${s.score.toFixed(2)}</td><td>${s.actual ? "+" : "−"}</td><td>${s.score >= threshold ? "+" : "−"}</td></tr>`).join("")}</tbody></table>`;
      }
      $("#threshold").oninput = (e) => {
        threshold = Number(e.target.value) / 100;
        model();
      };
      model();
      $("#order-list").onclick = (e) => {
        const b = e.target.closest("[data-move]");
        if (!b) return;
        const li = b.closest("li"),
          other =
            Number(b.dataset.move) < 0
              ? li.previousElementSibling
              : li.nextElementSibling;
        if (other) {
          if (Number(b.dataset.move) < 0) li.parentNode.insertBefore(li, other);
          else li.parentNode.insertBefore(other, li);
          b.focus();
        }
      };
      $("#lab-form").onsubmit = async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('[type="submit"]');
        button.disabled = true;
        try {
          const answers = Object.fromEntries(new FormData(e.target));
          answers.order = [...$("#order-list").children].map(
            (n) => n.dataset.value,
          );
          const result = await api("/api/lab/assess", {
            answers,
            reflection: $("#reflection").value,
          });
          if (S.view !== "lab") return;
          $("#lab-result").innerHTML =
            `<h3>${L("Practice result", "نتيجة التدريب")}: ${result.score}/${result.total}</h3><ol>${result.review.map((r) => `<li class="${r.correct ? "answer-good" : "answer-review"}"><b>${r.correct ? L("Correct", "صحيح") : L("Review", "راجع")}</b> · ${esc(r.explanation)}</li>`).join("")}</ol><p>${L("Written reflections are saved for self-review; they are not included in the score.", "تُحفظ التأملات الكتابية للمراجعة الذاتية ولا تدخل في الدرجة.")}</p>`;
          const row = document.createElement("p");
          row.textContent = `${new Date().toLocaleString()} · ${result.score}/${result.total}`;
          $("#lab-history").prepend(row);
          $("#lab-result").scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "center",
          });
        } catch (err) {
          toast(Portal.error(err));
        } finally {
          button.disabled = false;
        }
      };
    };
  }
  window.Lab = { register, cleanup };
})();
