/* Learning operations: one compact, bilingual workspace, with server-enforced permissions. */
(function () {
  const words = {
    hub: ["Learning hub", "مركز التعلم"],
    overview: ["Overview", "نظرة عامة"],
    timetable: ["Timetable", "الجدول الدراسي"],
    attendance: ["Attendance", "الحضور"],
    absences: ["Absence requests", "طلبات الغياب"],
    messages: ["Inbox", "البريد الداخلي"],
    resources: ["Resources", "الموارد"],
    groups: ["Groups", "المجموعات"],
    intro: [
      "Classes, communication, and support. Times are shown in UAE time.",
      "الحصص والتواصل والدعم. المواعيد بتوقيت الإمارات.",
    ],
    empty: ["Nothing here yet.", "لا توجد عناصر بعد."],
    create: ["Create", "إنشاء"],
    title: ["Title", "العنوان"],
    start: ["Start (UAE time)", "البداية (بتوقيت الإمارات)"],
    end: ["End (UAE time)", "النهاية (بتوقيت الإمارات)"],
    location: ["Room or meeting link", "القاعة أو رابط الاجتماع"],
    members: ["Students", "الطلاب"],
    save: ["Save", "حفظ"],
    cancel: ["Cancel", "إلغاء"],
    scheduled: ["Scheduled", "مجدولة"],
    cancelled: ["Cancelled", "ملغية"],
    present: ["Present", "حاضر"],
    remote: ["Remote", "عن بعد"],
    late: ["Late", "متأخر"],
    absent: ["Absent", "غائب"],
    excused: ["Excused", "بعذر"],
    pending: ["Awaiting review", "بانتظار المراجعة"],
    approved: ["Approved", "تمت الموافقة"],
    declined: ["Declined", "مرفوض"],
    approve: ["Approve", "موافقة"],
    decline: ["Decline", "رفض"],
    note: [
      "Optional note — avoid medical or sensitive details",
      "ملاحظة اختيارية — تجنب التفاصيل الطبية أو الحساسة",
    ],
    request: ["Request absence", "طلب غياب"],
    all: ["All", "الكل"],
    unread: ["Unread", "غير مقروء"],
    important: ["Important", "مهم"],
    sent: ["Sent", "المرسل"],
    subject: ["Subject", "الموضوع"],
    body: ["Message", "الرسالة"],
    priority: ["Priority", "الأولوية"],
    normal: ["Normal", "عادي"],
    high: ["High", "مهم"],
    urgent: ["Urgent", "عاجل"],
    send: ["Send message", "إرسال رسالة"],
    to: ["Recipients", "المستلمون"],
    read: ["Mark as read", "تحديد كمقروء"],
    url: ["HTTPS address", "رابط HTTPS"],
    submit: ["Submit for review", "إرسال للمراجعة"],
    name: ["Group name", "اسم المجموعة"],
    teacher: ["Teacher", "المعلم"],
    export: ["Export attendance CSV", "تصدير الحضور CSV"],
    upcoming: ["Upcoming classes", "الحصص القادمة"],
    recorded: ["Attendance records", "سجلات الحضور"],
    pendingCount: ["Pending absences", "طلبات الغياب المعلقة"],
    unreadCount: ["Unread messages", "رسائل غير مقروءة"],
    distribution: ["Recorded attendance", "توزيع الحضور المسجل"],
    hint: [
      "Only recorded attendance is counted. Missing records are not marked absent automatically.",
      "تُحتسب سجلات الحضور المدخلة فقط. لا يُسجّل الغياب تلقائياً عند عدم وجود سجل.",
    ],
    class: ["Class", "الحصة"],
    person: ["Student", "الطالب"],
    status: ["Status", "الحالة"],
    checkin: ["Check in", "تسجيل الحضور"],
    classHint: [
      "Check-in opens 15 minutes before class and closes when it ends. Teachers can correct records afterwards.",
      "يفتح تسجيل الحضور قبل الحصة بـ١٥ دقيقة ويغلق عند انتهائها. يمكن للمعلم تصحيح السجلات لاحقاً.",
    ],
    groupHint: [
      "Assign students to a teacher in People & progress first. A group can contain only that teacher’s students.",
      "أسند الطلاب للمعلم في صفحة المستخدمين والتقدم أولاً. تضم المجموعة طلاب ذلك المعلم فقط.",
    ],
    select: ["Choose…", "اختر…"],
    search: ["Search", "بحث"],
    resourceHint: [
      "Shared links require administrator approval. Links open an external website.",
      "تحتاج الروابط المشتركة إلى موافقة المسؤول. تفتح الروابط موقعاً خارجياً.",
    ],
    success: ["Saved", "تم الحفظ"],
    formHint: ["Choose one or more people.", "اختر شخصاً واحداً أو أكثر."],
    reviewHint: [
      "Your assigned teacher or an administrator reviews your request. You cannot approve your own request.",
      "يراجع المعلم المسؤول أو المسؤول طلبك. لا يمكنك الموافقة على طلبك بنفسك.",
    ],
    record: ["Record attendance", "تسجيل الحضور"],
    newClass: ["Schedule a class", "جدولة حصة"],
    newMessage: ["Write a message", "كتابة رسالة"],
    newResource: ["Suggest a resource", "اقتراح مورد"],
    newGroup: ["Create a group", "إنشاء مجموعة"],
    date: ["Date", "التاريخ"],
    clear: ["All dates", "كل التواريخ"],
    noRecords: [
      "No records for this selection.",
      "لا توجد سجلات لهذا الاختيار.",
    ],
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
  function register({ S, VIEWS, api, topbar, $, toast, wireTopbar }) {
    let tab = "overview",
      filter = "all",
      day = "",
      query = "",
      owner = "";
    const L = (k) => words[k]?.[S.lang === "ar" ? 1 : 0] || k;
    I18N.en.hub = words.hub[0];
    I18N.ar.hub = words.hub[1];
    const date = (t) =>
      new Intl.DateTimeFormat(S.lang === "ar" ? "ar-AE" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(t));
    const dateOnly = (t) =>
      new Date(t + 4 * 3600000).toISOString().slice(0, 10);
    const field = (label, input) =>
      `<label class="hub-field"><span>${L(label)}</span>${input}</label>`;
    const input = (name, type = "text", required = true) =>
      `<input name="${name}" type="${type}" ${required ? "required" : ""} maxlength="160">`;
    const select = (name, options) =>
      `<select name="${name}" required><option value="">${L("select")}</option>${options}</select>`;
    const options = (items) =>
      items
        .map(
          ([value, label]) =>
            `<option value="${esc(value)}">${esc(label)}</option>`,
        )
        .join("");
    const button = (label, attrs = "") =>
      `<button class="btn small" ${attrs}>${L(label)}</button>`;
    const badge = (s) => `<span class="hub-badge hub-${s}">${L(s)}</span>`;
    const form = (id, title, body) =>
      `<details class="card portal-section"><summary>${L(title)}</summary><form id="${id}" class="hub-form">${body}${button(id === "message-form" ? "send" : id === "absence-form" ? "request" : id === "resource-form" ? "submit" : "save")}</form></details>`;
    async function act(b, fn) {
      b.disabled = true;
      try {
        await fn();
        toast(L("success"));
        await VIEWS.hub();
      } catch (e) {
        toast(Portal.error(e));
        b.disabled = false;
      }
    }
    VIEWS.hub = async (opts={}) => {
      const current = S.user.email;
      if (owner !== current) {
        owner = current;
        tab = "overview";
        filter = "all";
        day = "";
        query = "";
      }
      if(opts.tab)tab=opts.tab;
      const d = await api("/api/hub");
      if (S.view !== "hub" || S.user?.email !== current) return;
      const admin = S.user.role === "admin",
        staff = d.staff,
        tabs = [
          "overview",
          "timetable",
          "attendance",
          "absences",
          "messages",
          "resources",
          ...(staff ? ["groups"] : []),
        ];
      if (!tabs.includes(tab)) tab = "overview";
      const person = (e) => d.people.find((p) => p.email === e)?.name || e;
      const students = d.people.filter((p) => p.role === "student");
      const checks = (list) =>
        `<fieldset class="hub-choices"><legend>${L("formHint")}</legend>${list.map((p) => `<label><input type="checkbox" name="members" value="${esc(p.email)}"> <span>${esc(p.name)}</span></label>`).join("") || L("empty")}</fieldset>`;
      const classes = d.classes
        .filter((s) => !day || dateOnly(s.start) === day)
        .sort((a, b) => a.start - b.start);
      let body = "";
      if (tab === "overview") {
        const stats = [
          [
            "upcoming",
            d.classes.filter(
              (s) => s.status === "scheduled" && s.end > Date.now(),
            ).length,
          ],
          ["recorded", d.attendance.length],
          [
            "pendingCount",
            d.absences.filter((a) => a.status === "pending").length,
          ],
          [
            "unreadCount",
            d.messages.filter(
              (m) =>
                m.recipients.includes(current) && !m.readBy.includes(current),
            ).length,
          ],
        ];
        body = `<div class="hub-stats">${stats.map(([k, v]) => `<section class="card"><span>${L(k)}</span><strong>${v}</strong></section>`).join("")}</div><section class="card portal-section"><h2>${L("distribution")}</h2><p class="sub">${L("hint")}</p>${[
          "present",
          "remote",
          "late",
          "absent",
          "excused",
        ]
          .map((s) => {
            const n = d.attendance.filter((a) => a.status === s).length;
            return `<div class="hub-bar"><span>${L(s)}</span><progress max="${Math.max(1, d.attendance.length)}" value="${n}" aria-label="${L(s)}"></progress><strong>${n}</strong></div>`;
          })
          .join("")}</section>`;
        body += `<section class="card portal-section"><h2>${L("upcoming")}</h2>${
          d.classes
            .filter((s) => s.status === "scheduled" && s.end > Date.now())
            .sort((a, b) => a.start - b.start)
            .slice(0, 5)
            .map(
              (s) =>
                `<article class="hub-row"><b>${esc(s.title)}</b><span>${date(s.start)}</span><span>${esc(s.location)}</span></article>`,
            )
            .join("") || L("empty")
        }</section>`;
      }
      if (tab === "timetable") {
        body = `<div class="row hub-filter">${field("date", '<input id="hub-day" type="date" value="' + day + '">')}${button("clear", 'id="hub-clear"')}</div>`;
        if (staff)
          body += form(
            "class-form",
            "newClass",
            field("title", input("title")) +
              field("start", input("start", "datetime-local")) +
              field("end", input("end", "datetime-local")) +
              field("location", input("location", "text", false)) +
              checks(students),
          );
        body +=
          classes
            .map(
              (s) =>
                `<article class="card portal-section"><div class="row"><h2>${esc(s.title)}</h2>${badge(s.status)}</div><p>${date(s.start)} — ${date(s.end)}</p><p>${esc(person(s.host))} · ${esc(s.location)}</p>${staff ? `<p>${s.members.map((e) => esc(person(e))).join("، ")}</p>` : ""}${s.status === "scheduled" && (admin || s.host === current) ? button("cancel", `data-class-cancel="${s.id}"`) : ""}</article>`,
            )
            .join("") || L("empty");
      }
      if (tab === "attendance") {
        body = `<p class="sub">${L("classHint")}</p><a class="btn small" href="/api/hub/export">${L("export")}</a>`;
        const eligible = d.classes.filter(
          (s) =>
            s.status === "scheduled" &&
            s.start - 15 * 60000 <= Date.now() &&
            (staff
              ? admin || s.host === current
              : s.end >= Date.now() && s.members.includes(current)),
        );
        body += form(
          "attendance-form",
          "record",
          field(
            "class",
            select(
              "classId",
              options(
                eligible.map((s) => [s.id, s.title + " · " + date(s.start)]),
              ),
            ),
          ) +
            (staff
              ? field(
                  "person",
                  select(
                    "email",
                    options(students.map((p) => [p.email, p.name])),
                  ),
                )
              : "") +
            field(
              "status",
              select(
                "status",
                options(
                  (staff
                    ? ["present", "remote", "late", "absent", "excused"]
                    : ["present", "remote"]
                  ).map((s) => [s, L(s)]),
                ),
              ),
            ),
        );
        body += `<section class="card portal-section">${
          d.attendance
            .slice()
            .sort((a, b) => b.at - a.at)
            .map(
              (a) =>
                `<article class="hub-row"><b>${esc(person(a.email))}</b><span>${esc(d.classes.find((s) => s.id === a.classId)?.title || "")}</span>${badge(a.status)}<small>${date(a.at)}</small></article>`,
            )
            .join("") || L("empty")
        }</section>`;
      }
      if (tab === "absences") {
        body =
          `<p class="sub">${L("reviewHint")}</p>` +
          form(
            "absence-form",
            "request",
            field("start", input("start", "date")) +
              field("end", input("end", "date")) +
              field(
                "note",
                '<textarea name="note" maxlength="500" rows="2"></textarea>',
              ),
          );
        body += d.absences
          .slice()
          .reverse()
          .map(
            (a) =>
              `<article class="card portal-section"><div class="row"><h2>${esc(person(a.email))}</h2>${badge(a.status)}</div><p>${date(a.start)} — ${date(a.end)}</p><p>${esc(a.note)}</p>${a.email === current && ["pending", "approved"].includes(a.status) ? button("cancel", `data-absence="${a.id}" data-status="cancelled"`) : ""}${staff && a.email !== current && a.status === "pending" ? button("approve", `data-absence="${a.id}" data-status="approved"`) + button("decline", `data-absence="${a.id}" data-status="declined"`) : ""}</article>`,
          )
          .join("");
      }
      if (tab === "messages") {
        body = form(
          "message-form",
          "newMessage",
          checks(d.people.filter((p) => p.email !== current)) +
            field("subject", input("subject")) +
            field(
              "priority",
              `<select name="priority">${options(["normal", "high", "urgent"].map((s) => [s, L(s)]))}</select>`,
            ) +
            field(
              "body",
              '<textarea name="body" rows="4" maxlength="3000" required></textarea>',
            ),
        );
        body += `<div class="hub-tabs">${["all", "unread", "important", "sent"].map((k) => button(k, `data-filter="${k}" aria-pressed="${filter === k}"`)).join("")}</div>${field("search", `<input id="hub-search" type="search" value="${esc(query)}">`)}`;
        const messages = d.messages
          .filter((m) =>
            filter === "sent"
              ? m.sender === current
              : m.recipients.includes(current) &&
                (filter !== "unread" || !m.readBy.includes(current)) &&
                (filter !== "important" || m.priority !== "normal"),
          )
          .filter((m) =>
            (m.subject + " " + m.body)
              .toLowerCase()
              .includes(query.toLowerCase()),
          );
        body +=
          messages
            .slice()
            .reverse()
            .map(
              (m) =>
                `<article class="card portal-section"><div class="row"><h2>${esc(m.subject)}</h2>${badge(m.priority)}</div><p class="sub">${esc(person(m.sender))} · ${date(m.at)}</p><p class="hub-message">${esc(m.body)}</p>${m.recipients.includes(current) && !m.readBy.includes(current) ? button("read", `data-read="${m.id}"`) : ""}</article>`,
            )
            .join("") || L("empty");
      }
      if (tab === "resources") {
        body =
          `<p class="sub">${L("resourceHint")}</p>` +
          form(
            "resource-form",
            "newResource",
            field("title", input("title")) +
              field(
                "url",
                '<input name="url" type="url" maxlength="2000" placeholder="https://" required>',
              ),
          );
        body += d.resources
          .map(
            (r) =>
              `<article class="card portal-section"><h2>${esc(r.title)}</h2>${badge(r.status)}<p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></p>${admin && r.status === "pending" ? button("approve", `data-resource="${r.id}" data-status="approved"`) + button("decline", `data-resource="${r.id}" data-status="declined"`) : ""}</article>`,
          )
          .join("");
      }
      if (tab === "groups") {
        if (admin)
          body =
            `<p class="sub">${L("groupHint")}</p>` +
            form(
              "group-form",
              "newGroup",
              field("name", input("name")) +
                field(
                  "teacher",
                  select(
                    "teacher",
                    options(
                      d.people
                        .filter((p) => p.role === "teacher")
                        .map((p) => [p.email, p.name]),
                    ),
                  ),
                ) +
                checks(students),
            );
        body += d.groups
          .map(
            (g) =>
              `<article class="card portal-section"><h2>${esc(g.name)}</h2><p>${esc(person(g.teacher))}</p><p>${g.members.map((e) => esc(person(e))).join("، ") || L("empty")}</p></article>`,
          )
          .join("");
      }
      $("#main").innerHTML =
        topbar(L("hub"), L("intro")) +
        `<nav class="hub-tabs" aria-label="${L("hub")}">${tabs.map((k) => button(k, `data-hub-tab="${k}" aria-pressed="${tab === k}"`)).join("")}</nav><div class="hub-content">${body || L("empty")}</div>`;
      wireTopbar();
      document.querySelectorAll("[data-hub-tab]").forEach(
        (b) =>
          (b.onclick = () => {
            tab = b.dataset.hubTab;
            VIEWS.hub().catch((e) => toast(Portal.error(e)));
          }),
      );
      document.querySelectorAll("[data-filter]").forEach(
        (b) =>
          (b.onclick = () => {
            filter = b.dataset.filter;
            VIEWS.hub().catch((e) => toast(Portal.error(e)));
          }),
      );
      if ($("#hub-search"))
        $("#hub-search").onchange = (e) => {
          query = e.target.value;
          VIEWS.hub().catch((e) => toast(Portal.error(e)));
        };
      if ($("#hub-day"))
        $("#hub-day").onchange = (e) => {
          day = e.target.value;
          VIEWS.hub().catch((e) => toast(Portal.error(e)));
        };
      if ($("#hub-clear"))
        $("#hub-clear").onclick = () => {
          day = "";
          VIEWS.hub().catch((e) => toast(Portal.error(e)));
        };
      const bind = (id, path, transform = (x) => x) => {
        const f = $("#" + id);
        if (f)
          f.onsubmit = (e) => {
            e.preventDefault();
            const fd = new FormData(f),
              data = Object.fromEntries(fd);
            data.members = fd.getAll("members");
            act(e.submitter, () => api("/api/hub/" + path, transform(data)));
          };
      };
      const groupForm = $("#group-form");
      if (groupForm) {
        const teacher = groupForm.elements.teacher;
        teacher.onchange = () => {
          groupForm.querySelectorAll('[name="members"]').forEach((c) => {
            const p = d.people.find((p) => p.email === c.value);
            c.disabled = p?.teacherEmail !== teacher.value;
            c.closest("label").hidden = c.disabled;
            if (c.disabled) c.checked = false;
          });
        };
        teacher.onchange();
      }
      const attendanceForm = $("#attendance-form");
      if (attendanceForm && staff) {
        const selector = attendanceForm.elements.classId;
        selector.onchange = () => {
          const s = d.classes.find((s) => s.id === selector.value);
          attendanceForm.elements.email.innerHTML =
            '<option value="">' +
            L("select") +
            "</option>" +
            options(
              students
                .filter((p) => s?.members.includes(p.email))
                .map((p) => [p.email, p.name]),
            );
        };
        selector.onchange();
      }
      bind("class-form", "classes", (x) => ({
        ...x,
        start: x.start + ":00+04:00",
        end: x.end + ":00+04:00",
      }));
      bind("attendance-form", "attendance");
      bind("absence-form", "absences", (x) => ({
        ...x,
        start: x.start + "T00:00:00+04:00",
        end: x.end + "T23:59:59+04:00",
      }));
      bind("message-form", "messages", (x) => ({
        ...x,
        recipients: x.members,
      }));
      bind("resource-form", "resources");
      bind("group-form", "groups");
      for (const [attr, path, make] of [
        [
          "class-cancel",
          "classes",
          (b) => [b.dataset.classCancel + "/cancel", {}],
        ],
        [
          "absence",
          "absences",
          (b) => [b.dataset.absence, { status: b.dataset.status }],
        ],
        ["read", "messages", (b) => [b.dataset.read + "/read", {}]],
        [
          "resource",
          "resources",
          (b) => [b.dataset.resource, { status: b.dataset.status }],
        ],
      ])
        document.querySelectorAll("[data-" + attr + "]").forEach(
          (b) =>
            (b.onclick = () =>
              act(b, () => {
                const [suffix, payload] = make(b);
                return api("/api/hub/" + path + "/" + suffix, payload);
              })),
        );
    };
  }
  window.LearningHub = { register };
})();
