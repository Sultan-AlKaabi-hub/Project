// Shared bilingual portal views. API permissions are enforced again on the server.
(function () {
  const dictionary = {
    announcement:['Announcement','إعلان'],
    owner_protected:["The owner account must remain an administrator.","يجب أن يبقى حساب المالك مسؤولاً."],
    subject_restricted:["This content is restricted to the AI subject.","هذا المحتوى مخصص لمادة الذكاء الاصطناعي."],
    demo_unavailable:["Add the sample campus data first.","أضف بيانات المنصة التجريبية أولاً."],
    time_conflict: ["This time overlaps an existing class, booking, or absence.","يتعارض الوقت مع حصة أو حجز أو طلب غياب موجود."],
    checkin_closed: ["Attendance is not open for this class yet, or the check-in window has ended.","لم يفتح تسجيل الحضور لهذه الحصة أو انتهت فترة التسجيل."],
    already_recorded: ["Attendance is already recorded. Ask your teacher to correct it.","تم تسجيل الحضور. اطلب من معلمك تصحيحه."],
    invalid_request: ["Check the required fields, dates, and assigned students.","تحقق من الحقول المطلوبة والتواريخ والطلاب المسندين."],
    invalid_transition: ["This request has already been reviewed.","تمت مراجعة هذا الطلب بالفعل."],

    previousMonth: ["Previous month", "الشهر السابق"],
    nextMonth: ["Next month", "الشهر التالي"],
    showAll: ["Show all dates", "عرض كل المواعيد"],
    addCalendar: ["Add to my calendar", "إضافة إلى تقويمي"],
    calendar: ["Calendar & bookings", "التقويم والحجوزات"],
    people: ["People & progress", "المستخدمون والتقدم"],
    alerts: ["Alerts", "التنبيهات"],
    privacy: ["Privacy", "الخصوصية"],
    student: ["Student", "طالب"],
    teacher: ["Teacher", "معلم"],
    admin: ["Admin", "مسؤول"],
    pending: ["Awaiting approval", "بانتظار الموافقة"],
    approved: ["Approved", "تمت الموافقة"],
    declined: ["Declined", "مرفوض"],
    cancelled: ["Cancelled", "ملغي"],
    approve: ["Approve", "موافقة"],
    decline: ["Decline", "رفض"],
    cancel: ["Cancel", "إلغاء"],
    save: ["Save", "حفظ"],
    close: ["Close", "إغلاق"],
    all: ["All", "الكل"],
    empty: ["Nothing here yet.", "لا توجد عناصر بعد."],
    requested: ["New booking request", "طلب حجز جديد"],
    message: ["Message", "رسالة"],
    calendarSub: [
      "Your learning time, in one place. All times are UAE time (UTC+4).",
      "وقت تعلمك في مكان واحد. جميع المواعيد بتوقيت الإمارات (UTC+4).",
    ],
    available: ["Available appointments", "المواعيد المتاحة"],
    myBookings: ["My appointments", "مواعيدي"],
    host: ["Host", "صاحب الموعد"],
    topic: ["What would you like to discuss?", "ما الموضوع الذي تريد مناقشته؟"],
    request: ["Request appointment", "طلب موعد"],
    awaiting: [
      "Your request will appear below. Only the host can approve it.",
      "سيظهر طلبك أدناه. الموافقة من صاحب الموعد فقط.",
    ],
    noSlots: [
      "No available times yet. Teachers and admins can publish appointments here.",
      "لا توجد مواعيد متاحة بعد. يمكن للمعلمين والمسؤولين نشر المواعيد هنا.",
    ],
    publish: ["Publish availability", "نشر موعد متاح"],
    start: ["Start (UAE time)", "البداية (بتوقيت الإمارات)"],
    end: ["End (UAE time)", "النهاية (بتوقيت الإمارات)"],
    slotHint: [
      "Choose a time in the next year, lasting 15–120 minutes.",
      "اختر موعداً خلال السنة القادمة بمدة ١٥–١٢٠ دقيقة.",
    ],
    remove: ["Remove slot", "حذف الموعد"],
    peopleSub: [
      "Progress, results, and support. Teachers see only their assigned students.",
      "التقدم والنتائج والدعم. يرى المعلم الطلاب المسندين إليه فقط.",
    ],
    search: ["Search by name or email", "ابحث بالاسم أو البريد"],
    name: ["Name", "الاسم"],
    role: ["Role", "الدور"],
    assigned: ["Assigned teacher", "المعلم المسؤول"],
    none: ["Unassigned", "غير مسند"],
    progress: ["Course progress", "التقدم في المسار"],
    scores: ["Module results", "نتائج الوحدات"],
    active: ["Active within 5 minutes", "نشط خلال ٥ دقائق"],
    inactive: ["Not recently active", "غير نشط حالياً"],
    never: ["No activity recorded", "لا يوجد نشاط مسجل"],
    read: ["Lessons read", "الدروس المقروءة"],
    next: ["Next module", "الوحدة التالية"],
    noAttempts: ["No quiz attempts yet.", "لا توجد محاولات اختبار بعد."],
    send: ["Send alert", "إرسال تنبيه"],
    alertSub: [
      "Booking updates and messages from your learning team.",
      "تحديثات الحجوزات ورسائل فريق التعلم.",
    ],
    markRead: ["Mark all as read", "تحديد الكل كمقروء"],
    unread: ["Unread", "غير مقروء"],
    privacyTitle: ["Your data, your choices", "بياناتك وخياراتك"],
    privacySub: [
      "Clear information about your account and how Rasid uses it.",
      "معلومات واضحة عن حسابك وكيف يستخدم راصد بياناتك.",
    ],
    notice: ["Privacy notice", "إشعار الخصوصية"],
    install: ["Install app", "تثبيت التطبيق"],
    signin: ["Sign in", "تسجيل الدخول"],
    signup: ["Create account", "إنشاء حساب"],
    credential: ["PIN or password", "رمز PIN أو كلمة مرور"],
    credentialHint: [
      "Use a 6-digit PIN, or a 12–128 character password with at least one non-digit.",
      "استخدم رمزاً من ٦ أرقام، أو كلمة مرور من ١٢ إلى ١٢٨ حرفاً تحتوي على حرف واحد غير رقمي على الأقل.",
    ],
    confirmCredential: [
      "Confirm PIN or password",
      "تأكيد الرمز أو كلمة المرور",
    ],
    consent: [
      "I have read the privacy notice and agree to the account and learning data processing described there.",
      "قرأت إشعار الخصوصية وأوافق على معالجة بيانات الحساب والتعلم الموضحة فيه.",
    ],
    biometric: [
      "Face ID / fingerprint is available after you add a passkey in Settings. Rasid does not receive your face or fingerprint.",
      "تتوفر بصمة الوجه أو الإصبع بعد إضافة مفتاح مرور من الإعدادات. لا يستقبل راصد بيانات وجهك أو بصمتك.",
    ],
    installTitle: ["Take Rasid with you", "راصد معك أينما كنت"],
    scan: [
      "Scan to open Rasid on your phone.",
      "امسح الرمز لفتح راصد على هاتفك.",
    ],
    ios: [
      "iPhone / iPad: open this link in Safari → Share → Add to Home Screen → Add.",
      "iPhone / iPad: افتح الرابط في Safari ← مشاركة ← إضافة إلى الشاشة الرئيسية ← إضافة.",
    ],
    android: [
      "Android: open in Chrome → menu ⋮ → Install app or Add to Home Screen.",
      "Android: افتح الرابط في Chrome ← القائمة ⋮ ← تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
    ],
    apk: ["Download Android APK", "تحميل APK لأندرويد"],
    noApk: [
      "An APK is not available yet. You can install the web app using the steps above.",
      "ملف APK غير متاح حالياً. يمكنك تثبيت تطبيق الويب باتباع الخطوات أعلاه.",
    ],
    installNow: ["Install now", "تثبيت الآن"],
    export: ["Download my data", "تنزيل بياناتي"],
    requestType: ["Request type", "نوع الطلب"],
    correction: ["Correct my data", "تصحيح بياناتي"],
    restriction: ["Restrict processing", "تقييد المعالجة"],
    withdrawal: ["Withdraw consent", "سحب الموافقة"],
    deletion: ["Delete my data", "حذف بياناتي"],
    question: ["Privacy question", "استفسار عن الخصوصية"],
    note: [
      "Details (do not include passwords)",
      "التفاصيل (لا تكتب كلمات المرور)",
    ],
    submit: ["Submit request", "إرسال الطلب"],
    sent: [
      "Request received. An admin will review it.",
      "تم استلام الطلب وسيراجعه المسؤول.",
    ],
    requests: ["Privacy requests", "طلبات الخصوصية"],
    resolve: ["Send response and resolve", "إرسال الرد وإغلاق الطلب"],
    response: ["Response to the user", "الرد على المستخدم"],
    open: ["Open", "مفتوح"],
    resolved: ["Resolved", "تمت المعالجة"],
    audit: ["Recent administrative activity", "آخر الإجراءات الإدارية"],
    recovery_unavailable: [
      "Email recovery is not configured or is unavailable. Use your passkey or contact the administrator.",
      "استعادة الحساب بالبريد غير مهيأة أو غير متاحة. استخدم مفتاح المرور أو تواصل مع المسؤول.",
    ],
    saved: ["Saved", "تم الحفظ"],
    forbidden: [
      "You do not have access to this action.",
      "ليست لديك صلاحية لهذا الإجراء.",
    ],
    conflict: [
      "This time conflicts with another appointment. Refresh and choose another time.",
      "يتعارض الموعد مع حجز آخر. حدّث الصفحة واختر موعداً آخر.",
    ],
    bad_time: [
      "Choose a future time lasting 15–120 minutes.",
      "اختر موعداً مستقبلياً بمدة ١٥–١٢٠ دقيقة.",
    ],
    last_admin: [
      "Assign another admin before removing the last admin.",
      "عيّن مسؤولاً آخر قبل إزالة المسؤول الأخير.",
    ],
    bad_teacher: [
      "Choose a teacher for a student account only.",
      "اختر معلماً لحساب طالب فقط.",
    ],
    rate_limited: [
      "Too many attempts. Wait one minute and retry.",
      "محاولات كثيرة. انتظر دقيقة ثم حاول مجدداً.",
    ],
    slot_in_use: [
      "This slot has pending or approved bookings. Cancel them first.",
      "يوجد طلب أو حجز مؤكد لهذا الموعد. ألغِه أولاً.",
    ],
    bad_transition: [
      "This booking has already changed or started. Refresh the page.",
      "تغيرت حالة الحجز أو بدأ الموعد. حدّث الصفحة.",
    ],
    error: [
      "Could not complete the request. Please retry.",
      "تعذر إكمال الطلب. حاول مجدداً.",
    ],
  };
  let ctx;
  const lang = () => (document.documentElement.lang === "ar" ? "ar" : "en");
  const L = (k) => dictionary[k]?.[lang() === "ar" ? 1 : 0] || k;
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
  const date = (n) =>
    new Date(n).toLocaleString(lang() === "ar" ? "ar-AE" : "en-GB", {
      timeZone: "Asia/Dubai",
      dateStyle: "medium",
      timeStyle: "short",
    });
  const dayKey = (n) => new Date(n + 4 * 3600000).toISOString().slice(0, 10);
  function monthGrid(r, S) {
    const now = new Date(Date.now() + 4 * 3600000);
    const month = S.calendarMonth || now.toISOString().slice(0, 7);
    const [year, mo] = month.split("-").map(Number);
    const first = new Date(Date.UTC(year, mo - 1, 1));
    const days = new Date(Date.UTC(year, mo, 0)).getUTCDate();
    const title = first.toLocaleDateString(
      lang() === "ar" ? "ar-AE" : "en-GB",
      { month: "long", year: "numeric", timeZone: "UTC" },
    );
    const labels = Array.from({ length: 7 }, (_, i) =>
      new Date(Date.UTC(2026, 8, 13 + i)).toLocaleDateString(
        lang() === "ar" ? "ar-AE" : "en-GB",
        { weekday: "short", timeZone: "UTC" },
      ),
    );
    return (
      '<section class="card month-card"><div class="portal-row"><h2>' +
      title +
      '</h2><div class="row"><button class="btn small" data-month="-1" aria-label="' +
      L("previousMonth") +
      '">‹</button><button class="btn small" data-month="1" aria-label="' +
      L("nextMonth") +
      '">›</button><button class="btn small ghost" id="calendar-all">' +
      L("showAll") +
      '</button></div></div><div class="month-grid">' +
      labels.map((x) => '<span class="weekday">' + x + "</span>").join("") +
      "<span></span>".repeat(first.getUTCDay()) +
      Array.from({ length: days }, (_, i) => {
        const key = month + "-" + String(i + 1).padStart(2, "0");
        const available = r.slots.some((s) => dayKey(s.start) === key);
        const booked = r.bookings.some(
          (b) =>
            dayKey(b.start) === key &&
            ["pending", "approved"].includes(b.status),
        );
        return (
          '<button class="month-day ' +
          (key === S.calendarDay ? "selected " : "") +
          (key === dayKey(Date.now()) ? "today" : "") +
          '" data-calendar-day="' +
          key +
          '" aria-label="' +
          key +
          (available ? " · " + L("available") : "") +
          (booked ? " · " + L("myBookings") : "") +
          '" aria-pressed="' +
          (key === S.calendarDay) +
          '"><span>' +
          (i + 1) +
          '</span><span class="day-dots">' +
          (available ? '<i class="available-dot"></i>' : "") +
          (booked ? '<i class="booking-dot"></i>' : "") +
          "</span></button>"
        );
      }).join("") +
      '</div><p class="sub calendar-legend">● ' +
      L("available") +
      " · ◆ " +
      L("myBookings") +
      (S.calendarDay ? " · " + S.calendarDay : "") +
      "</p></section>"
    );
  }
  const error = (e) => L(dictionary[e.code] ? e.code : "error");
  const field = (title, inner) =>
    `<label class="portal-field"><span>${L(title)}</span>${inner}</label>`;
  async function action(button, fn) {
    button.disabled = true;
    try {
      await fn();
    } catch (e) {
      ctx.toast(error(e));
    } finally {
      button.disabled = false;
    }
  }
  function noticeHTML(config = {}) {
    const ar = lang() === "ar";
    const parts = ar
      ? [
          [
            "ما نجمعه ولماذا",
            "نستخدم بريدك واسم العرض وبيانات الدخول المشفرة وتقدم الدروس ونتائج الاختبارات وآخر نشاط والحجوزات لتشغيل حسابك والتعلم والدعم. نستخدم ملف جلسة ضرورياً لتسجيل الدخول. لا نجمع موقعك الجغرافي.",
          ],
          [
            "من يرى البيانات",
            "يرى الطالب بياناته؛ ويرى المعلم الطلاب المسندين إليه؛ ويرى المسؤول المستخدمين ونتائجهم. لا يرى تفاصيل الحجز إلا صاحبه ومقدم الطلب. لا يستطيع المعلم تغيير الأدوار.",
          ],
          [
            "مفاتيح المرور والصوت",
            "يعالج جهازك التحقق ببصمة الوجه أو الإصبع؛ نخزن المفتاح العام فقط. قراءة النص اختيارية. الإملاء الصوتي اختياري وقد يرسل الصوت إلى مزود المتصفح لمعالجته. لا نخزن التسجيلات الصوتية. يمكنك إيقاف الإملاء في أي وقت.",
          ],
          [
            "الذكاء الاصطناعي والمزودون",
            "قد تُرسل الأسئلة العامة عن الدروس إلى Anthropic إذا فعّل المشغل الخدمة. لا تُرسل سجلات تقدم المستخدمين ونتائجهم إلى النموذج الخارجي. لا تكتب بيانات حساسة في الأسئلة. تحميل الأخبار والخطوط يتصل بمزوديها. قد تُعالج البيانات خارج الإمارات حسب إعدادات الاستضافة والمزودين.",
          ],
          [
            "الاحتفاظ وخياراتك",
            "تبقى بيانات حسابك ما دام الحساب موجوداً. تنتهي الجلسة بعد ٩٠ يوماً. يمكنك تنزيل بياناتك أو تصحيح اسمك من الإعدادات أو حذف حسابك. الحذف يزيل سجلاتك المرتبطة من قاعدة البيانات النشطة؛ يجب على المشغل إدارة دورات حذف النسخ الاحتياطية. تُحفظ آخر ٢٠٠٠ عملية إدارية.",
          ],
          [
            "حقوقك والتواصل",
            "يمكنك طلب التصحيح أو تقييد المعالجة أو سحب الموافقة أو الحذف من صفحة الخصوصية. سحب الموافقة لا يلغي المعالجة السابقة وقد يؤثر في تشغيل الحساب. يجب مراجعة الطلبات بواسطة المشغل. هذا الإشعار لا يمثل شهادة امتثال قانوني.",
          ],
        ]
      : [
          [
            "What we collect and why",
            "We use your email, display name, hashed sign-in credential, lesson progress, quiz results, last activity, and bookings to run your account, learning, and support. An essential session cookie keeps you signed in. We do not collect physical location.",
          ],
          [
            "Who can see your information",
            "Students see their own records; teachers see assigned students; admins see users and results. Booking details are limited to the requester and host. Teachers cannot change roles.",
          ],
          [
            "Passkeys and voice",
            "Your device handles fingerprint or face verification; we store only the public key. Text-to-speech is optional. Voice dictation is optional and may send audio to your browser provider for processing. Rasid does not store audio recordings. You can stop dictation at any time.",
          ],
          [
            "AI and providers",
            "General course questions may be sent to Anthropic when the operator enables it. User progress and score records are not sent to the external model. Do not include sensitive information in questions. News and fonts contact their respective providers. Processing may occur outside the UAE depending on hosting and provider settings.",
          ],
          [
            "Retention and choices",
            "Account data remains while the account exists. Sessions expire after 90 days. Export your data, correct your name in Settings, or delete your account. Deletion removes associated records from the active database; the operator must manage backup deletion schedules. The latest 2,000 administrative actions are retained.",
          ],
          [
            "Your rights and contact",
            "Use Privacy to request correction, restriction, consent withdrawal, or deletion. Withdrawal does not undo past processing and may affect account operation. The operator reviews these requests. This notice is not a certification of legal compliance.",
          ],
        ];
    return `<p class="eyebrow">${ar ? "إشعار الخصوصية · ١٦ سبتمبر ٢٠٢٦" : "PRIVACY NOTICE · 16 SEPTEMBER 2026"}</p><h2>${L("privacyTitle")}</h2>${parts.map(([title, body]) => `<h3>${title}</h3><p>${body}</p>`).join("")}<p>${ar ? "المشغل" : "Operator"}: ${esc(config.operator || (ar ? "لم يحدد المشغل اسمه بعد" : "Operator identity has not been configured"))}<br>${ar ? "التواصل" : "Contact"}: ${esc(config.contact || (ar ? "استخدم طلب الخصوصية داخل الحساب" : "Use the privacy request form in your account"))}<br>${ar ? "منطقة الاستضافة" : "Hosting region"}: ${esc(config.hostingRegion || (ar ? "لم يحددها المشغل بعد" : "Not yet declared by the operator"))}</p><a href="https://uaelegislation.gov.ae/en/legislations/1972" target="_blank" rel="noopener">${ar ? "قانون حماية البيانات الشخصية الإماراتي" : "UAE Personal Data Protection Law"}</a>`;
  }
  async function dialog(type) {
    const d = document.createElement("dialog");
    d.className = "portal-dialog";
    d.innerHTML = `<button class="btn small dialog-close">${L("close")}</button><div class="dialog-content" aria-live="polite">…</div>`;
    document.body.append(d);
    d.showModal();
    d.querySelector("button").onclick = () => d.close();
    d.onclose = () => d.remove();
    const body = d.querySelector(".dialog-content");
    try {
      if (type === "privacy") {
        const c = await ctx.api("/api/privacy");
        body.innerHTML = noticeHTML(c);
      } else {
        const r = await ctx.api("/api/install");
        body.innerHTML = `<h2>${L("installTitle")}</h2><p>${L("scan")}</p><img class="install-qr" src="${esc(r.qr)}" alt="${L("scan")}"><p class="break-word"><a href="${esc(r.url)}">${esc(r.url)}</a></p><p>${L("ios")}</p><p>${L("android")}</p>${window.deferredInstall ? `<button class="btn primary" id="native-install">${L("installNow")}</button>` : ""}<p>${r.apk ? `<a class="btn" href="/apk">${L("apk")}</a>` : L("noApk")}</p>`;
        const b = body.querySelector("#native-install");
        if (b)
          b.onclick = async () => {
            await window.deferredInstall.prompt();
            await window.deferredInstall.userChoice;
            window.deferredInstall = null;
            b.remove();
          };
      }
    } catch (e) {
      body.textContent = error(e);
    }
  }
  function authExtras(body, signup) {
    const bar = document.createElement("div");
    bar.className = "auth-extras";
    bar.innerHTML = `<div class="row"><button class="btn small" data-dialog="install">↗ ${L("install")}</button><button class="btn small ghost" data-dialog="privacy">${L("notice")}</button></div><p class="sub">${L("biometric")}</p>`;
    body.append(bar);
    bar
      .querySelectorAll("[data-dialog]")
      .forEach((b) => (b.onclick = () => dialog(b.dataset.dialog)));
    if (signup) {
      const label = document.createElement("label");
      label.className = "consent-row";
      label.innerHTML = `<input type="checkbox" id="privacy-consent" required><span>${L("consent")}</span>`;
      body.querySelector("form button[type=submit]").before(label);
    }
  }
  function register(c) {
    ctx = c;
    const { S, VIEWS, api, topbar, $, toast } = ctx;
    for (const [k, v] of Object.entries(dictionary)) {
      I18N.en[k] = v[0];
      I18N.ar[k] = v[1];
    }
    VIEWS.calendar = async () => {
      const main = $("#main");
      main.innerHTML =
        topbar(L("calendar"), L("calendarSub")) + '<div class="card">…</div>';
      let r;
      try {
        r = await api("/api/calendar");
      } catch (e) {
        main.innerHTML =
          topbar(L("calendar")) + `<p role="alert">${error(e)}</p>`;
        return;
      }
      const grid = monthGrid(r, S);
      if (S.calendarDay)
        r.slots = r.slots.filter((s) => dayKey(s.start) === S.calendarDay);
      const hostName = (email) =>
        r.hosts.find((h) => h.email === email)?.name || email;
      main.innerHTML =
        topbar(L("calendar"), L("calendarSub")) +
        grid +
        `<div class="portal-columns"><section class="card"><h2>${L("available")}</h2><p class="sub">${L("awaiting")}</p><form id="book-form" class="stack">${
          r.slots.filter((s) => s.host !== S.user.email).length
            ? `${field(
                "host",
                `<select id="slot" required>${r.slots
                  .filter((s) => s.host !== S.user.email)
                  .map(
                    (s) =>
                      `<option value="${s.id}">${s.isDemo ? (lang() === "ar" ? "[مثال] " : "[Sample] ") : ""}${esc(hostName(s.host))} · ${L(r.hosts.find((h) => h.email === s.host)?.role)} · ${date(s.start)} — ${date(s.end)}</option>`,
                  )
                  .join("")}</select>`,
              )}${field("topic", '<input id="topic" maxlength="160" required>')}<button class="btn primary">${L("request")}</button>`
            : `<p>${L("noSlots")}</p>`
        }</form></section>${
          S.user.role !== "student"
            ? `<section class="card"><h2>${L("publish")}</h2><p class="sub">${L("slotHint")}</p><form id="slot-form" class="stack">${field("start", '<input id="slot-start" type="datetime-local" required>')}${field("end", '<input id="slot-end" type="datetime-local" required>')}<button class="btn primary">${L("publish")}</button></form><div class="stack">${r.slots
                .filter((s) => s.host === S.user.email)
                .map(
                  (s) =>
                    `<div class="portal-row"><span>${date(s.start)}</span><button class="btn small" data-remove="${s.id}">${L("remove")}</button></div>`,
                )
                .join("")}</div></section>`
            : ""
        }</div><section class="card portal-section"><h2>${L("myBookings")}</h2><div class="tabs">${["all", "pending", "approved"].map((k, i) => `<button class="${i ? "" : "active"}" data-filter="${k}">${L(k)}</button>`).join("")}</div><div id="booking-list" class="stack"></div></section>`;
      const bookings = (filter) => {
        const list = r.bookings.filter(
          (b) =>
            (!S.calendarDay || dayKey(b.start) === S.calendarDay) &&
            (filter === "all" || b.status === filter),
        );
        $("#booking-list").innerHTML = list.length
          ? list
              .map(
                (b) =>
                  `<article class="booking-card"><div class="portal-row"><h3>${esc(b.topic)}${Portal.sampleTag(b)}</h3><span class="pill ${b.status === "approved" ? "good" : b.status === "pending" ? "amber" : "muted"}">${L(b.status)}</span></div><p>${date(b.start)} — ${date(b.end)}</p><p class="sub">${esc(hostName(b.host))} · ${esc(b.requester)}</p><div class="row">${b.status === "approved" ? `<a class="btn small" href="/api/bookings/${b.id}/calendar">${L("addCalendar")}</a>` : ""}${b.host === S.user.email && b.status === "pending" && b.start > Date.now() ? `<button class="btn primary small" data-id="${b.id}" data-status="approved">${L("approve")}</button><button class="btn small" data-id="${b.id}" data-status="declined">${L("decline")}</button>` : ""}${["pending", "approved"].includes(b.status) && b.start > Date.now() ? `<button class="btn small ghost" data-id="${b.id}" data-status="cancelled">${L("cancel")}</button>` : ""}</div></article>`,
              )
              .join("")
          : `<p class="sub">${L("empty")}</p>`;
        main.querySelectorAll("[data-status]").forEach(
          (b) =>
            (b.onclick = () =>
              action(b, async () => {
                await api(`/api/bookings/${b.dataset.id}/status`, {
                  status: b.dataset.status,
                });
                await VIEWS.calendar();
              })),
        );
      };
      bookings("all");
      main.querySelectorAll("[data-filter]").forEach(
        (b) =>
          (b.onclick = () => {
            main
              .querySelectorAll("[data-filter]")
              .forEach((x) => x.classList.toggle("active", x === b));
            bookings(b.dataset.filter);
          }),
      );
      if ($("#slot")) {
        const detail = document.createElement("p");
        detail.className = "sub slot-detail";
        const select = $("#slot");
        select.parentElement.after(detail);
        const update = () => {
          detail.textContent = select.selectedOptions[0]?.textContent || "";
        };
        select.onchange = update;
        update();
      }
      if ($("#topic"))
        $("#book-form").onsubmit = (e) => {
          e.preventDefault();
          action(e.submitter, async () => {
            await api("/api/bookings", {
              slotId: $("#slot").value,
              topic: $("#topic").value,
            });
            toast(L("saved"));
            await VIEWS.calendar();
          });
        };
      if ($("#slot-form"))
        $("#slot-form").onsubmit = (e) => {
          e.preventDefault();
          action(e.submitter, async () => {
            await api("/api/calendar/slots", {
              start: $("#slot-start").value + ":00+04:00",
              end: $("#slot-end").value + ":00+04:00",
            });
            await VIEWS.calendar();
          });
        };
      main.querySelectorAll("[data-remove]").forEach(
        (b) =>
          (b.onclick = () =>
            action(b, async () => {
              await api(
                `/api/calendar/slots/${b.dataset.remove}`,
                {},
                "DELETE",
              );
              await VIEWS.calendar();
            })),
      );
      main.querySelectorAll("[data-month]").forEach(
        (b) =>
          (b.onclick = () => {
            const month = S.calendarMonth || dayKey(Date.now()).slice(0, 7);
            const [y, m] = month.split("-").map(Number);
            S.calendarMonth = new Date(
              Date.UTC(y, m - 1 + Number(b.dataset.month), 1),
            )
              .toISOString()
              .slice(0, 7);
            S.calendarDay = null;
            VIEWS.calendar().then(ctx.wireTopbar);
          }),
      );
      main.querySelectorAll("[data-calendar-day]").forEach(
        (b) =>
          (b.onclick = () => {
            S.calendarDay =
              S.calendarDay === b.dataset.calendarDay
                ? null
                : b.dataset.calendarDay;
            VIEWS.calendar().then(ctx.wireTopbar);
          }),
      );
      $("#calendar-all").onclick = () => {
        S.calendarDay = null;
        VIEWS.calendar().then(ctx.wireTopbar);
      };
      ctx.wireTopbar();
    };
    VIEWS.people = async () => {
      const main = $("#main");
      let r;
      try {
        r = await api("/api/people");
      } catch (e) {
        main.innerHTML =
          topbar(L("people")) + `<p role="alert">${error(e)}</p>`;
        return;
      }
      main.innerHTML =
        topbar(L("people"), L("peopleSub")) +
        `<div class="portal-stats"><div class="card"><b>${r.users.filter((u) => u.role === "student").length}</b><span>${L("student")}</span></div><div class="card"><b>${r.users.filter((u) => u.online).length}</b><span>${L("active")}</span></div></div><label class="portal-field"><span>${L("search")}</span><input type="search" id="people-search"></label><div class="portal-row"><label class="portal-field"><span>${L("role")}</span><select id="people-role"><option value="">${L("all")}</option>${["student","teacher","admin"].map(k=>`<option value="${k}">${L(k)}</option>`).join("")}</select></label><label class="portal-field"><span>${L("active")}</span><select id="people-active"><option value="">${L("all")}</option><option value="yes">${L("active")}</option><option value="no">${L("inactive")}</option></select></label></div><div id="people-list" class="stack"></div>`;
      const render = () => {
        const q = $("#people-search").value.toLowerCase(),
          users = r.users.filter((u) =>
            (u.name + " " + u.email).toLowerCase().includes(q) && (!$("#people-role").value || u.role === $("#people-role").value) && (!$("#people-active").value || u.online === ($("#people-active").value === "yes")),
          );
        $("#people-list").innerHTML = users.length
          ? users
              .map(
                (u, i) =>
                  `<article class="card"><div class="portal-row"><div><h2>${esc(u.name)}</h2><p class="sub break-word">${esc(u.email)}</p></div><span class="pill">${L(u.role)}</span></div><p class="sub">${u.online ? L("active") : L("inactive")}${u.lastSeen ? " · " + date(u.lastSeen) : " · " + L("never")}</p><div class="portal-row"><strong>${L("progress")}: ${u.modulesPassed}/${u.totalModules}</strong><span>${L("read")}: ${u.lessonsRead}</span></div><progress max="${u.totalModules}" value="${u.modulesPassed}" aria-label="${L("progress")}"></progress><p>${L("next")}: ${esc(u.next || "—")}</p><details><summary>${L("scores")}</summary>${
                    u.modules
                      .filter((m) => m.score !== null)
                      .map(
                        (m) =>
                          `<p>${esc(m.title)} · <b>${m.score}/5</b> · ${m.attempts} ${lang() === "ar" ? "محاولات" : "attempts"}</p>`,
                      )
                      .join("") || `<p>${L("noAttempts")}</p>`
                  }</details>${
                    S.user.role === "admin"
                      ? `<form class="portal-role-form" data-person="${esc(u.email)}">${field("role", `<select name="role">${["student", "teacher", "admin"].map((k) => `<option value="${k}" ${u.role === k ? "selected" : ""}>${L(k)}</option>`).join("")}</select>`)}${field(
                          "assigned",
                          `<select name="teacherEmail"><option value="">${L("none")}</option>${r.users
                            .filter((t) => t.role === "teacher")
                            .map(
                              (t) =>
                                `<option value="${esc(t.email)}" ${u.teacherEmail === t.email ? "selected" : ""}>${esc(t.name)}</option>`,
                            )
                            .join("")}</select>`,
                        )}<button class="btn small">${L("save")}</button></form>`
                      : ""
                  }<form class="portal-message-form" data-to="${esc(u.email)}"><label for="message-${i}">${L("message")}</label><input id="message-${i}" name="message" maxlength="500" required><button class="btn small">${L("send")}</button></form></article>`,
              )
              .join("")
          : `<div class="card">${L("empty")}</div>`;
        main.querySelectorAll("[data-person]").forEach((f) => {
          f.onsubmit = (e) => {
            e.preventDefault();
            action(e.submitter, async () => {
              await api("/api/admin/people", {
                email: f.dataset.person,
                role: f.elements.role.value,
                teacherEmail:
                  f.elements.role.value === "student"
                    ? f.elements.teacherEmail.value
                    : "",
              });
              const me = await api("/api/me");
              S.user = me.user;
              await ctx.go(S.user.role === "student" ? "home" : "people");
            });
          };
        });
        main.querySelectorAll("[data-to]").forEach((f) => {
          f.onsubmit = (e) => {
            e.preventDefault();
            action(e.submitter, async () => {
              await api("/api/alerts", {
                email: f.dataset.to,
                message: f.elements.message.value,
              });
              f.reset();
              toast(L("saved"));
            });
          };
        });
      };
      render();
      $("#people-search").oninput = render;
      $("#people-role").onchange = render;
      $("#people-active").onchange = render;
    };
    VIEWS.alerts = async () => {
      const main = $("#main");
      try {
        const r = await api("/api/alerts");
        main.innerHTML =
          topbar(
            L("alerts"),
            L("alertSub"),
            `<button class="btn small" id="read-alerts">${L("markRead")}</button>`,
          ) +
          `<div class="stack">${r.alerts.map((a) => `<article class="card ${a.read ? "" : "unread-card"}"><div class="portal-row"><h3>${L(a.kind)}${Portal.sampleTag(a)}</h3>${a.read ? "" : `<span class="pill">${L("unread")}</span>`}</div><p>${esc(a.message || L(a.kind))}</p>${a.from ? `<p>${esc(a.from)}</p>` : ""}<p class="sub">${date(a.at)}</p>${a.bookingId ? `<button class="btn small" data-open-calendar>${L("calendar")}</button>` : ""}</article>`).join("") || `<div class="card">${L("empty")}</div>`}</div>`;
        $("#read-alerts").onclick = (e) =>
          action(e.currentTarget, async () => {
            await api("/api/alerts/read", {});
            await VIEWS.alerts();
          });
        main
          .querySelectorAll("[data-open-calendar]")
          .forEach((b) => (b.onclick = () => ctx.go("calendar")));
      } catch (e) {
        main.innerHTML =
          topbar(L("alerts")) + `<p role="alert">${error(e)}</p>`;
      }
    };
    const alertsView = VIEWS.alerts;
    VIEWS.alerts = async () => {
      await alertsView();
      ctx.wireTopbar();
    };
    VIEWS.privacy = async () => {
      const main = $("#main");
      const config = await api("/api/privacy");
      main.innerHTML =
        topbar(L("privacyTitle"), L("privacySub")) +
        `<div class="portal-columns"><section class="card privacy-copy">${noticeHTML(config)}</section><section class="card"><h2>${L("privacy")}</h2><a class="btn" href="/api/privacy/export">${L("export")}</a><form id="privacy-form" class="stack portal-section">${field("requestType", `<select id="privacy-type">${["correction", "restriction", "withdrawal", "deletion", "question"].map((k) => `<option value="${k}">${L(k)}</option>`).join("")}</select>`)}${field("note", '<textarea id="privacy-note" maxlength="500" rows="4" required></textarea>')}<button class="btn primary">${L("submit")}</button></form><p id="privacy-sent" role="status"></p></section></div><div id="privacy-admin"></div>`;
      $("#privacy-form").onsubmit = (e) => {
        e.preventDefault();
        action(e.submitter, async () => {
          await api("/api/privacy/requests", {
            type: $("#privacy-type").value,
            note: $("#privacy-note").value,
          });
          $("#privacy-form").reset();
          $("#privacy-sent").textContent = L("sent");
        });
      };
      if (S.user.role === "admin") {
        const r = await api("/api/admin/privacy");
        $("#privacy-admin").innerHTML =
          `<section class="card portal-section"><h2>${L("requests")}</h2>${r.requests.map((q) => `<article class="booking-card"><h3>${L(q.type)} · ${L(q.status)}</h3><p>${esc(q.email)} · ${date(q.at)}</p><p>${esc(q.note)}</p>${q.status === "open" ? `<form data-resolve="${q.id}" class="stack">${field("response", '<textarea name="response" rows="2" maxlength="500" required></textarea>')}<button class="btn small">${L("resolve")}</button></form>` : `<p>${esc(q.response)}</p>`}</article>`).join("") || L("empty")}</section><details class="card portal-section"><summary>${L("audit")}</summary>${r.audit.map((a) => `<p>${date(a.at)} · ${esc(a.actor)} · ${esc(a.action)} · ${esc(a.subject)}</p>`).join("")}</details>`;
        main.querySelectorAll("[data-resolve]").forEach(
          (f) =>
            (f.onsubmit = (e) => {
              e.preventDefault();
              action(e.submitter, async () => {
                await api("/api/admin/privacy/" + f.dataset.resolve, {
                  response: f.elements.response.value,
                });
                await VIEWS.privacy();
              });
            }),
        );
      }
    };
    const privacyView = VIEWS.privacy;
    VIEWS.privacy = async () => {
      await privacyView();
      ctx.wireTopbar();
    };
  }
  const sampleTag=r=>r?.isDemo?`<span class="sample-label">${lang()==='ar'?'مثال تجريبي':'Sample'}</span>`:'';
  window.Portal = { register, L, authExtras, dialog, error, sampleTag };
})();
