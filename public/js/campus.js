(function () {
  const text = {
    dataTable: ["View data table", "عرض جدول البيانات"],
    home: ["Your learning campus", "مساحتك التعليمية"],
    welcome: [
      "A clear view of your day. Choose where to go next.",
      "نظرة واضحة على يومك. اختر وجهتك التالية.",
    ],
    directory: ["User directory", "دليل المستخدمين"],
    myStudents: ["My AI students", "طلابي في الذكاء الاصطناعي"],
    admin: ["Administration", "الإدارة"],
    insights: ["Progress & attendance", "التقدم والحضور"],
    staff: ["Teachers & shifts", "المعلمون والمناوبات"],
    messages: ["Messages & alerts", "الرسائل والتنبيهات"],
    classes: ["Classes & calendar", "الحصص والتقويم"],
    coach: ["AI learning studio", "استوديو التعلم الذكي"],
    course: ["AI learning path", "مسار الذكاء الاصطناعي"],
    experiments: ["Book scanner & experiments", "ماسح الكتب والتجارب"],
    agentlab: ["Agent laboratory", "مختبر الوكلاء"],
    lab: ["AI discovery lab", "مختبر اكتشاف الذكاء الاصطناعي"],
    news: ["Live news", "الأخبار المباشرة"],
    exams: ["Exams & results", "الاختبارات والنتائج"],
    appointments: ["Private tuition & meetings", "الدروس الخاصة والاجتماعات"],
    privacy: ["Privacy & account", "الخصوصية والحساب"],
    open: ["Open section", "فتح القسم"],
    demo: ["Test user", "مستخدم تجريبي"],
    demoNotice: [
      "Test data is included and clearly marked. These are fictional accounts, not real learners.",
      "تشمل هذه الشاشة بيانات تجريبية موضحة بعلامة. هذه حسابات وهمية وليست لطلاب حقيقيين.",
    ],
    all: ["All records", "كل السجلات"],
    real: ["Real accounts only", "الحسابات الحقيقية فقط"],
    testOnly: ["Test accounts only", "الحسابات التجريبية فقط"],
    students: ["Students", "الطلاب"],
    teachers: ["Teachers", "المعلمون"],
    progress: ["Average completion", "متوسط الإنجاز"],
    attendance: ["Attendance rate", "نسبة الحضور"],
    notRecorded: ["Not recorded", "غير مسجل"],
    level: ["Level", "المستوى"],
    beginner: ["Beginner", "مبتدئ"],
    intermediate: ["Intermediate", "متوسط"],
    expert: ["Expert", "خبير"],
    student: ["Student", "طالب"],
    teacher: ["Teacher", "معلم"],
    adminRole: ["Administrator", "مسؤول"],
    subject: ["Subject", "المادة"],
    name: ["Name", "الاسم"],
    email: ["Email", "البريد الإلكتروني"],
    role: ["Role", "الدور"],
    assigned: ["Assigned teacher", "المعلم المسؤول"],
    joined: ["Joined", "تاريخ الانضمام"],
    completion: ["Completion", "الإنجاز"],
    score: ["Latest module score", "آخر نتيجة وحدة"],
    search: ["Search name or email", "ابحث بالاسم أو البريد"],
    details: ["View profile", "عرض الملف"],
    save: ["Save changes", "حفظ التغييرات"],
    close: ["Close", "إغلاق"],
    none: ["Unassigned", "غير مسند"],
    empty: ["No records match this view.", "لا توجد سجلات مطابقة."],
    levels: ["Students by level", "الطلاب حسب المستوى"],
    distribution: ["Attendance breakdown", "توزيع الحضور"],
    twoWeeks: ["Last 14 days", "آخر ١٤ يوماً"],
    attention: ["Students needing support", "طلاب يحتاجون إلى دعم"],
    attentionHint: [
      "Late or absent as a share of recorded classes. Missing records are excluded.",
      "التأخر أو الغياب كنسبة من الحصص المسجلة. لا تُحتسب السجلات المفقودة.",
    ],
    present: ["Present", "حاضر"],
    remote: ["Remote", "عن بعد"],
    late: ["Late", "متأخر"],
    absent: ["Absent", "غائب"],
    excused: ["Excused", "بعذر"],
    rate: ["Late / absent rate", "نسبة التأخر / الغياب"],
    modules: ["Module completion", "إنجاز الوحدات"],
    enrollment: ["Student enrollment", "انضمام الطلاب"],
    noAI: ["Your subject workspace", "مساحة مادتك"],
    noAIHint: [
      "Schedules, leave and messages are available here. AI student records belong to AI teachers only.",
      "تتوفر هنا المناوبات والإجازات والرسائل. سجلات طلاب الذكاء الاصطناعي لمعلمي المادة فقط.",
    ],
    shifts: ["Teacher shifts", "مناوبات المعلمين"],
    coverage: ["Subject coverage", "تغطية المواد"],
    coverageHint: [
      "Minimum staff available throughout 08:00–16:00 UAE time, Monday–Friday. Approved leave is deducted. Weekends are not required.",
      "الحد الأدنى للمعلمين المتاحين طوال الفترة ٠٨:٠٠–١٦:٠٠ بتوقيت الإمارات، من الاثنين إلى الجمعة، بعد خصم الإجازات المعتمدة. لا يلزم دوام نهاية الأسبوع.",
    ],
    minimum: ["Minimum teachers", "الحد الأدنى للمعلمين"],
    away: ["Who is away", "من في إجازة"],
    pending: ["Pending", "بانتظار الموافقة"],
    approved: ["Approved", "معتمد"],
    date: ["Start date", "تاريخ البداية"],
    start: ["Shift starts (UAE)", "بداية المناوبة (الإمارات)"],
    end: ["Shift ends (UAE)", "نهاية المناوبة (الإمارات)"],
    editShift: ["Edit teacher shift", "تعديل مناوبة معلم"],
    remove: ["Remove shift", "إزالة المناوبة"],
    leave: ["Leave", "إجازة"],
    short: ["Coverage shortage", "نقص في التغطية"],
    covered: ["Covered", "تغطية مكتملة"],
    directorySub: [
      "Search, compare, and open a profile. Only administrators change roles and assignments.",
      "ابحث وقارن وافتح الملف. تغيير الأدوار والإسناد متاح للمسؤولين فقط.",
    ],
    studentsSub: [
      "Only your assigned AI students appear here. Open a profile to see their progress.",
      "يظهر هنا طلاب الذكاء الاصطناعي المسندون إليك فقط. افتح الملف لعرض التقدم.",
    ],
    send: ["Send alert", "إرسال تنبيه"],
    recipients: ["Send to", "إرسال إلى"],
    everyone: ["Everyone I can message", "كل من يمكنني مراسلته"],
    one: ["One person", "شخص واحد"],
    group: ["A learning group", "مجموعة تعلم"],
    priority: ["Priority", "الأولوية"],
    normal: ["Normal", "عادي"],
    high: ["Important", "مهم"],
    urgent: ["Urgent", "عاجل"],
    title: ["Subject", "عنوان الرسالة"],
    body: ["Message", "الرسالة"],
    inbox: ["Inbox", "الوارد"],
    unread: ["Unread", "غير مقروء"],
    important: ["Important", "مهم"],
    sent: ["Sent", "المرسل"],
    read: ["Mark as read", "تحديد كمقروء"],
    readBy: ["Read by", "قرأها"],
    of: ["of", "من"],
    createTest: ["Generate test sign-ins", "إنشاء بيانات دخول تجريبية"],
    testAccessHint: [
      "Creates new random passwords for the AI test teacher and first test student. Existing sessions for these two test accounts end. Copy the passwords now; they are shown only once.",
      "ينشئ كلمات مرور عشوائية جديدة لمعلم الذكاء الاصطناعي التجريبي وأول طالب تجريبي، وينهي جلساتهما السابقة. انسخ كلمات المرور الآن؛ تُعرض مرة واحدة فقط.",
    ],
    password: ["Password", "كلمة المرور"],
    testCredentials: ["Test account access", "دخول الحسابات التجريبية"],
    seed: ["Add sample campus data", "إضافة بيانات تعليمية تجريبية"],
    insightsHint: [
      "Live calculations from permitted records. Present, remote and late count toward attendance; excused records are excluded.",
      "حسابات مباشرة من السجلات المسموح بها. يُحتسب الحاضر وعن بعد والمتأخر ضمن الحضور وتُستبعد الأعذار.",
    ],
    updated: ["Saved successfully", "تم الحفظ بنجاح"],
    failed: [
      "Unable to complete the request. Check the fields and try again.",
      "تعذر إكمال الطلب. تحقق من الحقول وحاول مجدداً.",
    ],
    quizHint: [
      "Read a module’s lessons to unlock its exam. Your past results stay available.",
      "اقرأ دروس الوحدة لفتح اختبارها. تبقى نتائجك السابقة متاحة.",
    ],
    ready: ["Ready for exam", "جاهز للاختبار"],
    passed: ["Passed", "مجتاز"],
    study: ["Open module", "فتح الوحدة"],
    locked: ["Locked", "مقفل"],
    outOfFive: ["out of 5", "من ٥"],
    allRoles: ["All roles", "كل الأدوار"],
    allSubjects: ["All subjects", "كل المواد"],
    profile: ["Learning profile", "الملف التعليمي"],
    yourDay: ["Today at a glance", "يومك باختصار"],
    manage: ["Manage campus", "إدارة المنصة"],
    next: ["Next 14 days", "الأيام الـ١٤ القادمة"],
    absenceRequests: ["Absence requests", "طلبات الإجازة والغياب"],
    coverageNotice: [
      "Coverage shortages create automatic admin alerts.",
      "تُرسل تنبيهات تلقائية للمسؤول عند نقص التغطية.",
    ],
    shortages: ["Coverage gaps this week", "نقص التغطية هذا الأسبوع"],
  };
  const esc = (v) =>
    String(v ?? "").replace(
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
  const colors = {
    present: "#28685e",
    remote: "#456897",
    late: "#b1841e",
    absent: "#aa4657",
    excused: "#9c91b4",
    beginner: "#a697cf",
    intermediate: "#648fa6",
    expert: "#406a61",
  };
  function register(ctx) {
    const { S, VIEWS, api, topbar, $, go, toast, wireTopbar } = ctx;
    const L = (k) => text[k]?.[S.lang === "ar" ? 1 : 0] || k,
      subject = (s) => s?.[S.lang === "ar" ? "ar" : "en"] || s?.id || "";
    let ownerEmail = "",
      mode = "all",
      startDay = new Date(Date.now() + 14400000).toISOString().slice(0, 10);
    I18N.en.people = "User directory";
    I18N.ar.people = "دليل المستخدمين";
    I18N.en.administration = "Administration";
    I18N.ar.administration = "الإدارة";
    I18N.en.staff = "Teachers & shifts";
    I18N.ar.staff = "المعلمون والمناوبات";
    I18N.en.messages = "Messages & alerts";
    I18N.ar.messages = "الرسائل والتنبيهات";
    const date = (n, time = false) =>
      new Intl.DateTimeFormat(S.lang === "ar" ? "ar-AE" : "en-GB", {
        dateStyle: "medium",
        ...(time ? { timeStyle: "short" } : {}),
        timeZone: "Asia/Dubai",
      }).format(new Date(n));
    const key = (t) => new Date(t + 14400000).toISOString().slice(0, 10),
      time = (t) => new Date(t + 14400000).toISOString().slice(11, 16);
    const field = (label, html) =>
      `<label class="campus-field"><span>${L(label)}</span>${html}</label>`;
    const options = (arr, value = "") =>
      arr
        .map(
          ([id, title]) =>
            `<option value="${esc(id)}" ${id === value ? "selected" : ""}>${esc(title)}</option>`,
        )
        .join("");
    const button = (label, attrs = "", kind = "") =>
      `<button class="btn ${kind}" ${attrs}>${L(label)}</button>`;
    const pill = (label, kind = "") =>
      `<span class="campus-pill ${kind}">${esc(label)}</span>`;
    const avatar = (p) =>
      `<span class="campus-avatar">${esc(
        p.name
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0])
          .join(""),
      )}</span>`;
    const pct = (p) =>
      p.totalModules ? Math.round((p.modulesPassed / p.totalModules) * 100) : 0;
    const measure = (records) => {
      const r = records.filter((a) => a.status !== "excused");
      return r.length
        ? Math.round(
            (r.filter((a) => ["present", "remote", "late"].includes(a.status))
              .length /
              r.length) *
              100,
          )
        : null;
    };
    const rate = (n) => (n === null ? "—" : n + "%");
    async function data() {
      const owner = S.user.email;
      if (ownerEmail !== owner) {
        ownerEmail = owner;
        mode = "all";
      }
      const result = await api("/api/campus?mode=" + mode + "&day=" + startDay);
      if (S.user?.email !== owner) throw new Error("stale_session");
      return result;
    }
    function note(d) {
      return d.people.some((p) => p.isDemo)
        ? `<div class="campus-notice">${L("demoNotice")}</div>`
        : "";
    }
    function filterBar() {
      return `<div class="campus-toolbar">${field(
        "all",
        `<select id="campus-mode">${options(
          ["all", "real", "testOnly"].map((k) => [
            k === "testOnly" ? "demo" : k,
            L(k),
          ]),
          mode,
        )}</select>`,
      )}</div>`;
    }
    function mount(title, sub, html, reload) {
      $("#main").innerHTML = topbar(title, sub) + html;
      wireTopbar();
      const f = $("#campus-mode");
      if (f)
        f.onchange = () => {
          mode = f.value;
          reload();
        };
    }
    async function action(b, fn, reload) {
      b.disabled = true;
      try {
        await fn();
        toast(L("updated"));
        if (reload) await reload();
      } catch (e) {
        toast(Portal.error(e));
        b.disabled = false;
      }
    }
    function modal(title, body) {
      const d = document.createElement("dialog");
      d.className = "campus-dialog";
      d.innerHTML = `<div class="campus-dialog-head"><h2>${title}</h2>${button("close", "data-close")}</div>${body}`;
      document.body.append(d);
      d.querySelector("[data-close]").onclick = () => d.close();
      d.onclose = () => d.remove();
      d.showModal();
      return d;
    }
    const stats = (items) =>
      `<div class="campus-metrics">${items.map(([label, value, kind = ""]) => `<section class="campus-metric ${kind}"><span>${L(label)}</span><strong>${value}</strong></section>`).join("")}</div>`;
    function donut(title, items, center, caption) {
      const total = items.reduce((n, i) => n + i.value, 0);
      let offset = 0;
      return `<section class="campus-panel"><h2>${title}</h2><div class="campus-donut-row"><svg class="campus-donut" viewBox="0 0 140 140" role="img" aria-label="${esc(title + ": " + items.map((i) => i.label + " " + i.value).join(", "))}"><circle cx="70" cy="70" r="52" fill="none" stroke="#eeeaf0" stroke-width="18"/>${items
        .map((i) => {
          const length = total ? (i.value / total) * 326.726 : 0,
            part = `<circle cx="70" cy="70" r="52" fill="none" stroke="${i.color}" stroke-width="18" stroke-dasharray="${length} ${326.726 - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)"/>`;
          offset += length;
          return part;
        })
        .join(
          "",
        )}<text x="70" y="73" text-anchor="middle" class="donut-value">${center}</text><text x="70" y="88" text-anchor="middle" class="donut-caption">${caption}</text></svg><ul class="campus-legend">${items.map((i) => `<li><i style="background:${i.color}"></i><span>${i.label}</span><b>${i.value}</b></li>`).join("")}</ul></div></section>`;
    }
    const table = (headers, rows) =>
      `<div class="campus-table-wrap"><table class="campus-table"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || `<tr><td colspan="${headers.length}">${L("empty")}</td></tr>`}</tbody></table></div>`;
    function trend(d) {
      const today = Date.parse(key(Date.now()) + "T00:00:00+04:00"),
        days = Array.from(
          { length: 14 },
          (_, i) => today - (13 - i) * 86400000,
        ),
        states = ["present", "remote", "late", "absent", "excused"];
      const counts = days.map((t) =>
          states.map(
            (s) =>
              d.attendance.filter(
                (a) => key(a.start) === key(t) && a.status === s,
              ).length,
          ),
        ),
        max = Math.max(1, ...counts.map((c) => c.reduce((a, b) => a + b, 0)));
      return `<section class="campus-panel"><h2>${L("twoWeeks")}</h2><div class="campus-stacked" role="img" aria-label="${L("twoWeeks")}">${counts.map((arr, i) => `<div class="stack-day"><b>${arr.reduce((a, b) => a + b, 0)}</b><div class="stack-column">${arr.map((n, j) => `<span style="height:${(n / max) * 150}px;background:${colors[states[j]]}" title="${L(states[j])}: ${n}"></span>`).join("")}</div><small>${new Date(days[i] + 14400000).getUTCDate()}</small></div>`).join("")}</div><div class="campus-inline-legend">${states.map((s) => `<span><i style="background:${colors[s]}"></i>${L(s)}</span>`).join("")}</div><details><summary>${L("dataTable")}</summary>${table(
        [L("date"), ...states.map(L)],
        counts.map(
          (c, i) =>
            `<tr><td>${date(days[i])}</td>${c.map((n) => `<td>${n}</td>`).join("")}</tr>`,
        ),
      )}</details></section>`;
    }
    function analytics(d) {
      const students = d.people.filter((p) => p.role === "student"),
        average = students.length
          ? Math.round(
              students.reduce((n, p) => n + pct(p), 0) / students.length,
            )
          : 0;
      const attendance = measure(d.attendance);
      const risk = students
        .map((p) => {
          const records = d.attendance.filter(
              (a) => a.email === p.email && a.status !== "excused",
            ),
            late = records.filter((a) => a.status === "late").length,
            absent = records.filter((a) => a.status === "absent").length;
          return {
            p,
            late,
            absent,
            rate: records.length
              ? Math.round(((late + absent) / records.length) * 100)
              : null,
          };
        })
        .filter((x) => x.rate > 0)
        .sort((a, b) => b.rate - a.rate);
      const mods = students[0]?.modules || [];
      return (
        stats([
          ["students", students.length],
          ["teachers", d.teachers.length],
          ["progress", average + "%"],
          ["attendance", rate(attendance)],
        ]) +
        `<div class="campus-two">${donut(
          L("levels"),
          ["beginner", "intermediate", "expert"].map((s) => ({
            label: L(s),
            value: students.filter((p) => p.level === s).length,
            color: colors[s],
          })),
          students.length,
          L("students"),
        )}${donut(
          L("distribution"),
          ["present", "remote", "late", "absent", "excused"].map((s) => ({
            label: L(s),
            value: d.attendance.filter((a) => a.status === s).length,
            color: colors[s],
          })),
          rate(attendance),
          L("attendance"),
        )}${trend(d)}<section class="campus-panel"><h2>${L("attention")}</h2><p class="sub">${L("attentionHint")}</p>${table(
          [L("name"), L("late"), L("absent"), L("rate")],
          risk
            .slice(0, 8)
            .map(
              (x) =>
                `<tr><td>${avatar(x.p)} ${esc(x.p.name)}</td><td>${x.late}</td><td>${x.absent}</td><td>${pill(x.rate + "%", x.rate > 25 ? "danger" : "warn")}</td></tr>`,
            ),
        )}</section><section class="campus-panel module-panel"><h2>${L("modules")}</h2>${
          mods
            .map((m, i) => {
              const n = students.filter(
                (p) => p.modules[i]?.status === "passed",
              ).length;
              return `<div class="campus-bar"><span>${esc(m.title)}</span><progress max="${Math.max(1, students.length)}" value="${n}" aria-label="${esc(m.title)}"></progress><b>${n}/${students.length}</b></div>`;
            })
            .join("") || L("empty")
        }</section><section class="campus-panel"><h2>${L("enrollment")}</h2><div class="campus-enrollment">${Array.from(
          { length: 6 },
          (_, i) => {
            const end = Date.now() - (5 - i) * 14 * 86400000,
              start = end - 14 * 86400000,
              n = students.filter(
                (p) => p.created > start && p.created <= end,
              ).length;
            return `<div><strong>${n}</strong><span style="height:${Math.max(3, n * 15)}px"></span><small>${date(end)}</small></div>`;
          },
        ).join("")}</div></section></div>`
      );
    }
    const icons = {
      coach: "✧",
      admin: "▥",
      directory: "◉",
      staff: "◷",
      messages: "✉",
      classes: "▦",
      course: "✦",
      news: "◈",
      exams: "✓",
      appointments: "◫",
      privacy: "◇",
      insights: "↗",
      lab: "⌘",
    };
    const descriptions = {
      coach: ["Your tutor, practice and project workshop.", "معلمك وتدريباتك وورشة مشاريعك."],
      agentlab: ["Review code, plan learning, simulate a pitch and build an agent.","راجع الكود وخطط للتعلم وحاكِ عرضاً وابنِ وكيلاً."],
      experiments: ["Scan books, program robot routes and train a neural network.","امسح الكتب وبرمج مسارات الروبوت ودرّب شبكة عصبية."],
      lab: ["Animate search algorithms, test a model and practice your reasoning.","حرّك خوارزميات البحث واختبر نموذجاً وتدرّب على الاستدلال."],
      admin: [
        "Campus numbers, progress and attendance.",
        "أرقام المنصة والتقدم والحضور.",
      ],
      directory: [
        "People, roles and learning profiles.",
        "الأشخاص والأدوار والملفات التعليمية.",
      ],
      staff: [
        "Subject coverage, teacher shifts and leave.",
        "تغطية المواد ومناوبات المعلمين والإجازات.",
      ],
      messages: [
        "Write an announcement or read your inbox.",
        "اكتب إعلاناً أو اقرأ رسائلك.",
      ],
      classes: [
        "Plan lessons and organize learning time.",
        "خطط للحصص ونظم وقت التعلم.",
      ],
      course: [
        "Build your AI skills, one module at a time.",
        "طور مهارات الذكاء الاصطناعي خطوة بخطوة.",
      ],
      news: [
        "Read the latest stories with Faris.",
        "اقرأ أحدث الأخبار مع فارس.",
      ],
      exams: [
        "Check readiness and review your results.",
        "تحقق من جاهزيتك وراجع نتائجك.",
      ],
      appointments: [
        "Book tuition or a meeting with the head.",
        "احجز درساً خاصاً أو اجتماعاً مع المسؤول.",
      ],
      privacy: [
        "Your data, security and personal settings.",
        "بياناتك وأمانك وإعداداتك الشخصية.",
      ],
      insights: [
        "Your students’ progress, clearly presented.",
        "تقدم طلابك بصورة واضحة.",
      ],
    };
    VIEWS.home = async () => {
      const d = await data();
      if (S.view !== "home") return;
      const ai = S.user.hasAI !== false,
        admin = S.user.role === "admin",
        staff = S.user.role !== "student",
        cards = [
          ...(admin
            ? [
                ["admin", "administration"],
                ["directory", "people"],
              ]
            : staff
              ? [
                  ...(ai ? [["insights", "administration"]] : []),
                  ...(ai ? [["directory", "people"]] : []),
                ]
              : []),
          ...(staff ? [["staff", "staff"]] : []),
          ["messages", "messages"],
          ["classes", "classes"],
          ...(ai
            ? [
                ["coach", "coach"],
                ["course", "course"],
                ["lab", "lab"],
                ["experiments", "experiments"],
                ["agentlab", "agentlab"],
                ["news", "news"],
                ["exams", "exams"],
              ]
            : []),
          ["appointments", "calendar"],
          ["privacy", "privacy"],
        ];
      mount(
        L("home"),
        L("welcome"),
        (S.user.ownerRecoveryAvailable
          ? `<div class="campus-note"><p>${S.lang === "ar" ? "حساب المالك جاهز لاستعادة صلاحية المسؤول باستخدام الرمز الخاص." : "Your owner account can restore administrator access using your private recovery code."}</p><button class="btn primary" data-campus-go="settings">${S.lang === "ar" ? "استعادة صلاحية المسؤول" : "Restore administrator access"}</button></div>`
          : "") +
          note(d) +
          `<div class="campus-welcome"><div><span class="eyebrow">RASID AI · راصد</span><h2>${esc(S.user.name)}</h2><p>${date(Date.now())} · ${L(S.user.role === "admin" ? "adminRole" : S.user.role)}</p></div><div class="campus-welcome-art" aria-hidden="true"></div></div>` +
          stats([
            staff
              ? [
                  "students",
                  d.people.filter((p) => p.role === "student").length,
                ]
              : [
                  "completion",
                  `${pct(d.people.find((p) => p.email === S.user.email) || {})}%`,
                ],
            [
              "classes",
              d.classes.filter(
                (c) => c.status === "scheduled" && c.end > Date.now(),
              ).length,
            ],
            ["unread", d.unread],
            ...(admin
              ? [
                  [
                    "shortages",
                    d.coverage.slice(0, 35).filter((c) => c.short).length,
                  ],
                ]
              : []),
          ]) +
          `<section class="campus-panel daily-brief"><div class="portal-row"><h2>${S.lang==='ar'?'القادم في مساحتك':'Next in your campus'}</h2><button class="btn small" data-campus-go="calendar">${L('appointments')}</button></div><div class="brief-items">${d.classes.filter(c=>c.status==='scheduled'&&c.end>Date.now()).sort((a,b)=>a.start-b.start).slice(0,3).map(c=>`<button class="brief-item" data-campus-go="classes"><span class="brief-date">${date(c.start,true)}</span><strong>${esc(c.title)}</strong><span>${esc(c.location)} ${Portal.sampleTag(c)}</span></button>`).join('')||`<p>${S.lang==='ar'?'لا توجد حصص قادمة. يمكنك طلب موعد للدعم.':'No upcoming classes. You can request a support appointment.'}</p>`}</div><p class="sub">${S.lang==='ar'?'طلبات المواعيد بانتظار الموافقة':'Appointment requests awaiting approval'}: ${(d.bookings||[]).filter(b=>b.status==='pending'&&b.end>Date.now()).length}</p></section>` +
          `<div class="campus-launchers">${cards.map(([k, v], i) => `<button class="campus-launch" data-campus-go="${v}" style="--tile:${["#3c557b", "#24645f", "#755589", "#a96f42", "#884758"][i % 5]}"><span class="launch-visual" aria-hidden="true"><span>${icons[k]}</span><i></i><i></i><i></i></span><span class="launch-copy"><span class="eyebrow">${L("open")}</span><strong>${k === "directory" && !admin ? L("myStudents") : L(k)}</strong><span>${descriptions[k][S.lang === "ar" ? 1 : 0]}</span><b>${L("open")} ←</b></span></button>`).join("")}</div>`,
        VIEWS.home,
      );
      document
        .querySelectorAll("[data-campus-go]")
        .forEach((b) => (b.onclick = () => go(b.dataset.campusGo)));
    };
    VIEWS.administration = async () => {
      if (S.user.role === "student" || S.user.hasAI === false)
        return go("home");
      const d = await data();
      if (S.view !== "administration") return;
      mount(
        S.user.role === "admin" ? L("admin") : L("insights"),
        L("insightsHint"),
        filterBar() + note(d) + analytics(d),
        VIEWS.administration,
      );
    };
    VIEWS.people = async () => {
      if (S.user.role === "student") return go("home");
      const d = await data();
      if (S.view !== "people") return;
      const admin = S.user.role === "admin";
      mount(
        admin ? L("directory") : L("myStudents"),
        admin ? L("directorySub") : L("studentsSub"),
        filterBar() +
          note(d) +
          `<div class="campus-toolbar">${field("search", '<input id="directory-search" type="search">')}${admin ? field("role", `<select id="directory-role"><option value="">${L("allRoles")}</option>${options(["student", "teacher", "admin"].map((k) => [k, L(k === "admin" ? "adminRole" : k)]))}</select>`) + field("subject", `<select id="directory-subject"><option value="">${L("allSubjects")}</option>${options(d.subjects.map((s) => [s.id, subject(s)]))}</select>`) : ""}</div><section class="campus-panel" id="directory-table"></section>${admin ? `<section class="campus-panel"><h2>${L("testCredentials")}</h2><p class="sub">${L("testAccessHint")}</p>${button("createTest", 'id="demo-access"')}${!d.people.some((p) => p.isDemo) ? button("seed", 'id="seed-demo"') : ""}</section>` : ""}`,
        VIEWS.people,
      );
      const render = () => {
        const q = $("#directory-search").value.toLowerCase(),
          role = $("#directory-role")?.value,
          sub = $("#directory-subject")?.value;
        const people = d.people
          .filter(
            (p) =>
              (admin || p.role === "student") &&
              (!role || p.role === role) &&
              (!sub || p.subject === sub) &&
              (p.name + " " + p.email).toLowerCase().includes(q),
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name, S.lang === "ar" ? "ar" : "en"),
          );
        $("#directory-table").innerHTML = table(
          [
            L("name"),
            L("role"),
            L("subject"),
            L("level"),
            L("completion"),
            L("attendance"),
            L("details"),
          ],
          people.map(
            (p) =>
              `<tr><td><div class="person-cell">${avatar(p)}<div><b>${esc(p.name)}</b><small>${esc(p.email)}</small>${p.isDemo ? pill(L("demo"), "demo") : ""}</div></div></td><td>${L(p.role === "admin" ? "adminRole" : p.role)}</td><td>${subject(d.subjects.find((s) => s.id === p.subject))}</td><td>${p.role === "student" ? L(p.level || "beginner") : "—"}</td><td>${p.role === "student" ? `<div class="table-progress"><progress value="${pct(p)}" max="100"></progress><span>${pct(p)}%</span></div>` : "—"}</td><td>${p.role === "student" ? rate(measure(d.attendance.filter((a) => a.email === p.email))) : "—"}</td><td>${button("details", `data-profile="${esc(p.email)}"`, "small")}</td></tr>`,
          ),
        );
        document.querySelectorAll("[data-profile]").forEach(
          (b) =>
            (b.onclick = () =>
              profile(
                d.people.find((p) => p.email === b.dataset.profile),
                d,
              )),
        );
      };
      $("#directory-search").oninput = render;
      if (admin) {
        $("#directory-role").onchange = render;
        $("#directory-subject").onchange = render;
      }
      render();
      if ($("#demo-access"))
        $("#demo-access").onclick = (e) =>
          action(e.currentTarget, async () => {
            const r = await api("/api/admin/demo-access", {});
            modal(
              L("testCredentials"),
              `<p>${L("testAccessHint")}</p>${r.credentials.map((c) => `<section class="campus-panel"><h3>${esc(c.name)} · ${L(c.role)}</h3>${field("email", `<input readonly value="${esc(c.email)}">`)}${field("password", `<input readonly value="${esc(c.password)}">`)}</section>`).join("")}`,
            );
          });
      if ($("#seed-demo"))
        $("#seed-demo").onclick = (e) =>
          action(
            e.currentTarget,
            () => api("/api/admin/seed-demo", {}),
            VIEWS.people,
          );
    };
    function profile(p, d) {
      const admin = S.user.role === "admin",
        dialog = modal(
          L("profile"),
          `<div class="person-cell">${avatar(p)}<div><h3>${esc(p.name)}</h3><p>${esc(p.email)}</p>${p.isDemo ? pill(L("demo"), "demo") : ""}</div></div><p>${L("joined")}: ${date(p.created || Date.now())}</p>${
            p.role === "student"
              ? stats([
                  ["completion", pct(p) + "%"],
                  ["lab", `${p.labPractice?.bestScore||0}/5 · ${p.labPractice?.attempts||0}`],
                  [
                    "attendance",
                    rate(
                      measure(d.attendance.filter((a) => a.email === p.email)),
                    ),
                  ],
                ]) +
                table(
                  [L("modules"), L("score")],
                  p.modules.map(
                    (m) =>
                      `<tr><td>${esc(m.title)}</td><td>${m.score === null ? "—" : m.score + "/5"}</td></tr>`,
                  ),
                )
              : ""
          }${
            admin
              ? `<form id="profile-edit" class="campus-form">${field(
                  "role",
                  `<select name="role">${options(
                    ["student", "teacher", "admin"].map((k) => [
                      k,
                      L(k === "admin" ? "adminRole" : k),
                    ]),
                    p.role,
                  )}</select>`,
                )}${field(
                  "subject",
                  `<select name="subject">${options(
                    d.subjects.map((s) => [s.id, subject(s)]),
                    p.subject,
                  )}</select>`,
                )}${field(
                  "assigned",
                  `<select name="teacherEmail"><option value="">${L("none")}</option>${options(
                    d.teachers
                      .filter((t) => t.subject === "ai")
                      .map((t) => [t.email, t.name]),
                    p.teacherEmail,
                  )}</select>`,
                )}${button("save")}</form>`
              : ""
          }`,
        );
      const f = dialog.querySelector("form");
      if (f)
        f.onsubmit = (e) => {
          e.preventDefault();
          action(e.submitter, async () => {
            await api("/api/admin/people", {
              email: p.email,
              role: f.elements.role.value,
              subject: f.elements.subject.value,
              teacherEmail:
                f.elements.role.value === "student"
                  ? f.elements.teacherEmail.value
                  : "",
            });
            dialog.close();
            const me = await api("/api/me");
            S.user = me.user;
            await go(S.user.role === "student" ? "home" : "people");
          });
        };
    }
    VIEWS.classes = () => go("hub", { tab: "timetable" });
    VIEWS.exams = async () => {
      if (S.user.hasAI === false) return go("home");
      const r = await api("/api/course");
      mount(
        L("exams"),
        L("quizHint"),
        `<div class="campus-launchers">${r.course.levels
          .flatMap((l) => l.modules)
          .map(
            (m) =>
              `<article class="campus-panel"><h2>${esc(m.title)}</h2>${pill(L(m.passed ? "passed" : m.locked ? "locked" : m.quizReady ? "ready" : "study"), m.passed ? "good" : "")}<p>${L("score")}: ${m.lastScore === null ? "—" : m.lastScore + "/5"}</p><p>${m.read}/${m.lessons} ${S.lang === "ar" ? "دروس مقروءة" : "lessons read"}</p>${button("study", `data-module="${m.id}" ${m.locked ? "disabled" : ""}`)}</article>`,
          )
          .join("")}</div>`,
        VIEWS.exams,
      );
      document
        .querySelectorAll("[data-module]")
        .forEach((b) => (b.onclick = () => ctx.openModule(b.dataset.module)));
    };
    VIEWS.staff = async () => {
      if (S.user.role === "student") return go("home");
      const d = await data();
      if (S.view !== "staff") return;
      const admin = S.user.role === "admin",
        days = Array.from({ length: 14 }, (_, i) =>
          new Date(
            Date.parse(startDay + "T00:00:00+04:00") + i * 86400000 + 14400000,
          )
            .toISOString()
            .slice(0, 10),
        );
      const heads = [
        L("name"),
        ...days.map(
          (day) =>
            `<span title="${day}">${new Intl.DateTimeFormat(S.lang === "ar" ? "ar-AE" : "en-GB", { weekday: "narrow", timeZone: "Asia/Dubai" }).format(new Date(day + "T12:00:00+04:00"))}<br>${day.slice(8)}</span>`,
        ),
      ];
      let html =
        filterBar() +
        note(d) +
        `<div class="campus-toolbar">${field("date", `<input id="roster-start" type="date" value="${startDay}">`)}${button("absenceRequests", 'id="staff-leave"')}</div><section class="campus-panel"><h2>${L("shifts")}</h2>${table(
          heads,
          d.teachers.map(
            (t) =>
              `<tr><th scope="row">${esc(t.name)}<small>${subject(d.subjects.find((s) => s.id === t.subject))}</small></th>${days
                .map((day) => {
                  const s = d.shifts.find(
                      (s) => s.teacher === t.email && s.day === day,
                    ),
                    leave = d.absences.some(
                      (a) =>
                        a.email === t.email &&
                        a.status === "approved" &&
                        a.start < Date.parse(day + "T16:00:00+04:00") &&
                        a.end > Date.parse(day + "T08:00:00+04:00"),
                    );
                  return `<td>${admin ? `<button class="shift-cell ${leave ? "on-leave" : s ? "on-duty" : ""}" data-teacher="${esc(t.email)}" data-day="${day}" aria-label="${esc(t.name)} ${day}">${leave ? L("leave") : s ? time(s.start) : "+"}</button>` : leave ? L("leave") : s ? time(s.start) : "—"}</td>`;
                })
                .join("")}</tr>`,
          ),
        )}</section>`;
      if (admin)
        html += `<section class="campus-panel"><h2>${L("coverage")}</h2><p class="sub">${L("coverageHint")}</p><p>${L("coverageNotice")}</p>${table(
          [L("subject"), ...heads.slice(1)],
          d.subjects.map(
            (s) =>
              `<tr><th scope="row">${subject(s)}<small>${L("minimum")}: ${s.minimum}</small></th>${days
                .map((day) => {
                  const r = d.coverage.find(
                    (r) => r.day === day && r.subject === s.id,
                  );
                  return `<td class="${r?.short ? "coverage-low" : ""}" title="${L(r?.short ? "short" : "covered")}">${r?.weekend ? "·" : (r?.count ?? 0) + "/" + s.minimum}</td>`;
                })
                .join("")}</tr>`,
          ),
        )}<details><summary>${L("minimum")}</summary><div class="campus-subjects">${d.subjects.map((s) => `<form data-minimum="${s.id}"><label>${subject(s)}<input name="minimum" type="number" min="1" max="100" value="${s.minimum}" required></label>${button("save", "", "small")}</form>`).join("")}</div></details></section>`;
      const away = d.absences.filter((a) =>
        ["approved", "pending"].includes(a.status),
      );
      html += `<section class="campus-panel"><h2>${L("away")}</h2><div class="campus-inline-legend">${pill(L("approved"), "good")}${pill(L("pending"), "warn")}</div>${table(
        heads,
        away.map(
          (a) =>
            `<tr><th>${esc(d.people.find((p) => p.email === a.email)?.name || a.email)}</th>${days
              .map((day) => {
                const active =
                  a.start < Date.parse(day + "T23:59:59+04:00") &&
                  a.end >= Date.parse(day + "T00:00:00+04:00");
                return `<td class="${active ? "leave-block " + (a.status === "pending" ? "pending-leave" : "") : ""}">${active ? `<span class="sr-only">${L(a.status)}</span>` : ""}</td>`;
              })
              .join("")}</tr>`,
        ),
      )}</section>`;
      mount(L("staff"), L("next"), html, VIEWS.staff);
      $("#roster-start").onchange = (e) => {
        if (e.target.value) {
          startDay = e.target.value;
          VIEWS.staff();
        }
      };
      $("#staff-leave").onclick = () => go("hub", { tab: "absences" });
      document
        .querySelectorAll("[data-teacher]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              shiftDialog(d, b.dataset.teacher, b.dataset.day)),
        );
      document.querySelectorAll("[data-minimum]").forEach(
        (f) =>
          (f.onsubmit = (e) => {
            e.preventDefault();
            action(
              e.submitter,
              () =>
                api("/api/admin/subjects", {
                  id: f.dataset.minimum,
                  minimum: Number(f.elements.minimum.value),
                }),
              VIEWS.staff,
            );
          }),
      );
    };
    function shiftDialog(d, email, day) {
      const t = d.teachers.find((t) => t.email === email),
        s = d.shifts.find((s) => s.teacher === email && s.day === day),
        dialog = modal(
          L("editShift"),
          `<p>${esc(t.name)} · ${day}</p><form class="campus-form">${field("start", `<input name="start" type="time" value="${s ? time(s.start) : "08:00"}" required>`)}${field("end", `<input name="end" type="time" value="${s ? time(s.end) : "16:00"}" required>`)}${button("save")}</form>${s ? button("remove", 'id="remove-shift"') : ""}`,
        );
      const f = dialog.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault();
        action(
          e.submitter,
          async () => {
            await api("/api/admin/shifts", {
              teacher: email,
              day,
              start: day + "T" + f.elements.start.value + ":00+04:00",
              end: day + "T" + f.elements.end.value + ":00+04:00",
            });
            dialog.close();
          },
          VIEWS.staff,
        );
      };
      if (s)
        dialog.querySelector("#remove-shift").onclick = (e) =>
          action(
            e.currentTarget,
            async () => {
              await api("/api/admin/shifts/" + s.id, {}, "DELETE");
              dialog.close();
            },
            VIEWS.staff,
          );
    }
    let inboxFilter = "inbox";
    VIEWS.messages = async () => {
      const owner = S.user.email,
        d = await api("/api/hub");
      if (S.view !== "messages" || S.user?.email !== owner) return;
      const current = S.user.email,
        people = d.people.filter((p) => p.email !== current);
      const list = d.messages
        .filter((m) =>
          inboxFilter === "sent"
            ? m.sender === current
            : m.recipients.includes(current) &&
              (inboxFilter !== "unread" || !m.readBy.includes(current)) &&
              (inboxFilter !== "important" || m.priority !== "normal"),
        )
        .sort((a, b) => b.at - a.at);
      const html = `<div class="campus-message-grid"><section class="campus-panel"><div class="hub-tabs">${["inbox", "unread", "important", "sent"].map((k) => button(k, `data-inbox="${k}" aria-pressed="${inboxFilter === k}"`, "small")).join("")}</div>${list.map((m) => `<article class="campus-mail"><div class="campus-mail-heading"><h3>${esc(m.subject)}${Portal.sampleTag(m)}</h3>${pill(L(m.priority), m.priority === "urgent" ? "danger" : "")}</div><small>${esc(d.people.find((p) => p.email === m.sender)?.name || m.sender)} · ${date(m.at, true)}</small><p>${esc(m.body)}</p>${m.sender === current ? `<p class="sub">${L("readBy")} ${m.readBy.length} ${L("of")} ${m.recipients.length}</p>` : !m.readBy.includes(current) ? button("read", `data-mail-read="${m.id}"`, "small") : ""}</article>`).join("") || `<p>${L("empty")}</p>`}</section><section class="campus-panel"><h2>${L("send")}</h2><form id="campus-compose" class="campus-compose">${field(
        "recipients",
        `<select name="audience">${options([
          ["one", L("one")],
          ...(d.staff
            ? [
                ["everyone", L("everyone")],
                ["students", L("students")],
                ["teachers", L("teachers")],
                ["group", L("group")],
              ]
            : []),
        ])}</select>`,
      )}${field("name", `<select name="recipient">${options(people.map((p) => [p.email, p.name]))}</select>`)}<label class="campus-field" id="message-group" hidden><span>${L("group")}</span><select name="group">${options(d.groups.map((g) => [g.id, g.name]))}</select></label>${field("priority", `<select name="priority">${options(["normal", "high", "urgent"].map((k) => [k, L(k)]))}</select>`)}${field("title", '<input name="subject" maxlength="160" required>')}${field("body", '<textarea name="body" rows="6" maxlength="3000" required></textarea>')}${button("send", "", "primary")}</form></section></div>`;
      mount(L("messages"), "", html, VIEWS.messages);
      document.querySelectorAll("[data-inbox]").forEach(
        (b) =>
          (b.onclick = () => {
            inboxFilter = b.dataset.inbox;
            VIEWS.messages();
          }),
      );
      document
        .querySelectorAll("[data-mail-read]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              action(
                b,
                () =>
                  api("/api/hub/messages/" + b.dataset.mailRead + "/read", {}),
                VIEWS.messages,
              )),
        );
      const f = $("#campus-compose");
      f.elements.audience.onchange = () => {
        f.elements.recipient.closest("label").hidden =
          f.elements.audience.value !== "one";
        $("#message-group").hidden = f.elements.audience.value !== "group";
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const a = f.elements.audience.value;
        let recipients =
          a === "one"
            ? [f.elements.recipient.value]
            : a === "group"
              ? d.groups.find((g) => g.id === f.elements.group.value)
                  ?.members || []
              : people
                  .filter(
                    (p) =>
                      a === "everyone" ||
                      p.role === (a === "students" ? "student" : "teacher"),
                  )
                  .map((p) => p.email);
        recipients = recipients.filter((x) => x !== current);
        action(
          e.submitter,
          async () => {
            await api("/api/hub/messages", {
              recipients,
              subject: f.elements.subject.value,
              body: f.elements.body.value,
              priority: f.elements.priority.value,
            });
            inboxFilter = "sent";
          },
          VIEWS.messages,
        );
      };
    };
  }
  window.Campus = { register };
})();
