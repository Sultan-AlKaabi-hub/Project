import {subjectOf,hasAI} from "./subjects.js";
import { operationsFor } from "./operations.js";
import crypto from "node:crypto";
import { courseSummary } from "./curriculum.js";

export const roleOf = (u) =>
  ["admin", "teacher", "student"].includes(u?.role) ? u.role : "student";
export const canView = (viewer, target) =>
  viewer.email === target.email ||
  roleOf(viewer) === "admin" ||
  (roleOf(viewer) === "teacher" &&
    roleOf(target) === "student" &&
    target.teacherEmail === viewer.email && subjectOf(viewer) === subjectOf(target));
export function migrateRoles(db) {
  // Preserve the legacy administrator once, never make a new registration an administrator.
  if (!db.settings.rolesMigrated) {
    const legacy = process.env.ADMIN_EMAIL
      ? db.users[process.env.ADMIN_EMAIL.trim().toLowerCase()]
      : Object.values(db.users).sort((a, b) => a.created - b.created)[0];
    for (const u of Object.values(db.users))
      u.role = u.role || (u === legacy ? "admin" : "student");
    db.settings.rolesMigrated = true;
  }
  db.bookings ||= [];
  db.slots ||= [];
  db.alerts ||= [];
  db.audit ||= [];
  db.privacyRequests ||= [];
}
export function userSummary(u, lang = "en") {
  const c = courseSummary(u, lang);
  return {
    email: u.email,
    name: u.name || u.email.split("@")[0],
    role: roleOf(u),
    teacherEmail: u.teacherEmail || "",
    level: u.level,
    subject: subjectOf(u), isDemo:Boolean(u.isDemo), created:u.created,
    lastSeen: u.lastSeen || null,
    online: Boolean(u.lastSeen && Date.now() - u.lastSeen < 5 * 60 * 1000),
    modulesPassed: c.modulesPassed,
    totalModules: c.levels.reduce((n, l) => n + l.total, 0),
    lessonsRead: c.lessonsRead,
    next: c.next?.title || null,
    modules: c.levels.flatMap((l) =>
      l.modules.map((m) => ({
        title: m.title,
        status: m.status,
        score: m.lastScore,
        attempts: m.attempts,
      })),
    ),
  };
}
export function installPortal(app, { db, save, requireUser }) {
  const admin = (req, res, next) =>
    roleOf(req.user) === "admin"
      ? next()
      : res.status(403).json({ error: "forbidden" });
  const staff = (req, res, next) =>
    roleOf(req.user) !== "student"
      ? next()
      : res.status(403).json({ error: "forbidden" });
  const clean = (v, n = 300) =>
    typeof v === "string" ? v.trim().slice(0, n) : "";
  const visibleBooking = (u, b) =>
    b.requester === u.email || b.host === u.email;
  const audit = (actor, action, subject) => {
    db.audit.push({ at: Date.now(), actor, action, subject });
    db.audit = db.audit.slice(-2000);
  };
  const notify = (email, kind, booking) => {
    db.alerts.push({
      id: crypto.randomUUID(),
      email,
      kind,
      bookingId: booking?.id,
      at: Date.now(),
      read: false,
    });
    db.alerts = db.alerts.slice(-5000);
  };
  const hostExists = (email) =>
    db.users[email] && roleOf(db.users[email]) !== "student";
  const overlap = (a, b) => a.start < b.end && b.start < a.end;
  const interval = (body) => {
    const start = Date.parse(body.start),
      end = Date.parse(body.end);
    return Number.isFinite(start) &&
      Number.isFinite(end) &&
      start > Date.now() &&
      end - start >= 15 * 60000 &&
      end - start <= 120 * 60000 &&
      start - Date.now() < 366 * 86400000
      ? { start, end }
      : null;
  };
  app.get("/api/people", requireUser, staff, (req, res) =>
    res.json({
      users: Object.values(db.users)
        .filter((u) => canView(req.user, u))
        .map((u) => hasAI(req.user) && hasAI(u) ? userSummary(u, req.user.lang) : ({email:u.email,name:u.name,role:roleOf(u),subject:subjectOf(u),modules:[],modulesPassed:0,totalModules:0,lessonsRead:0})),
    }),
  );
  app.post("/api/admin/people", requireUser, admin, (req, res) => {
    const u = db.users[clean(req.body.email, 200).toLowerCase()];
    if (!u) return res.status(404).json({ error: "not_found" });
    const role = req.body.role;
    const subject = role === "student" ? "ai" : (req.body.subject || subjectOf(u));
    if(!["ai","math","science","arabic","english"].includes(subject))return res.status(400).json({error:"invalid_request"});
    if(u.email === "sultan.3ami@gmail.com" && role !== "admin")return res.status(409).json({error:"owner_protected"});
    if (!["student", "teacher", "admin"].includes(role))
      return res.status(400).json({ error: "bad_role" });
    if (
      roleOf(u) === "admin" &&
      role !== "admin" &&
      Object.values(db.users).filter((x) => roleOf(x) === "admin").length <= 1
    )
      return res.status(409).json({ error: "last_admin" });
    const teacherEmail = clean(req.body.teacherEmail, 200).toLowerCase();
    if (
      teacherEmail &&
      (role !== "student" || roleOf(db.users[teacherEmail]) !== "teacher" || subjectOf(db.users[teacherEmail]) !== "ai")
    )
      return res.status(400).json({ error: "bad_teacher" });
    const oldRole = roleOf(u), oldSubject=subjectOf(u);
    u.role = role; u.subject = subject;
    u.teacherEmail = role === "student" ? teacherEmail : "";
    if (oldRole === "teacher" && (role !== "teacher" || oldSubject !== subject))
      for (const student of Object.values(db.users))
        if (student.teacherEmail === u.email) student.teacherEmail = "";
    if (role === "student" && oldRole !== "student") {
      db.slots = db.slots.filter((s) => s.host !== u.email);
      for (const b of db.bookings)
        if (b.host === u.email && ["pending", "approved"].includes(b.status)) {
          b.status = "cancelled";
          notify(b.requester, "cancelled", b);
        }
    }
    for(const g of db.groups || []) {
      if(g.teacher === u.email && role !== 'teacher') g.teacher = '';
      g.members = g.members.filter(e => db.users[e]?.teacherEmail === g.teacher && roleOf(db.users[e]) === 'student');
    }
    if(role === 'student' && oldRole !== 'student') for(const s of db.classes || []) if(s.host === u.email && s.end > Date.now()) s.status = 'cancelled';
    audit(req.user.email, "role_and_assignment", u.email);
    save();
    res.json({ ok: true });
  });
  app.get("/api/calendar", requireUser, (req, res) =>
    res.json({
      hosts: Object.values(db.users)
        .filter((u) => roleOf(u) !== "student")
        .map((u) => ({
          email: u.email,
          name: u.name || u.email.split("@")[0],
          role: roleOf(u),
        })),
      slots: db.slots.filter(
        (s) =>
          s.start > Date.now() &&
          hostExists(s.host) &&
          !db.bookings.some(
            (b) =>
              b.status === "approved" && b.host === s.host && overlap(b, s),
          ),
      ),
      bookings: db.bookings
        .filter((b) => visibleBooking(req.user, b))
        .sort((a, b) => a.start - b.start),
    }),
  );
  app.get("/api/bookings/:id/calendar", requireUser, (req, res) => {
    const b = db.bookings.find(
      (b) =>
        b.id === req.params.id &&
        b.status === "approved" &&
        visibleBooking(req.user, b),
    );
    if (!b) return res.status(404).json({ error: "not_found" });
    const stamp = (n) =>
      new Date(n)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    const text = (s) =>
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/[\r\n]+/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rasid-appointment.ics"',
    );
    res
      .type("text/calendar")
      .send(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Rasid//Learning Calendar//EN",
          "BEGIN:VEVENT",
          `UID:${b.id}@rasid`,
          `DTSTAMP:${stamp(Date.now())}`,
          `DTSTART:${stamp(b.start)}`,
          `DTEND:${stamp(b.end)}`,
          `SUMMARY:${text(b.topic)}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
          "END:VCALENDAR",
          "",
        ].join("\r\n"),
      );
  });
  app.post("/api/calendar/slots", requireUser, staff, (req, res) => {
    const time = interval(req.body);
    if (!time) return res.status(400).json({ error: "bad_time" });
    if (db.slots.some((s) => s.host === req.user.email && overlap(s, time)))
      return res.status(409).json({ error: "conflict" });
    const slot = { id: crypto.randomUUID(), host: req.user.email, ...time };
    db.slots.push(slot);
    save();
    res.status(201).json({ slot });
  });
  app.delete("/api/calendar/slots/:id", requireUser, staff, (req, res) => {
    const s = db.slots.find(
      (s) => s.id === req.params.id && s.host === req.user.email,
    );
    if (!s) return res.status(404).json({ error: "not_found" });
    if (
      db.bookings.some(
        (b) => b.slotId === s.id && ["pending", "approved"].includes(b.status),
      )
    )
      return res.status(409).json({ error: "slot_in_use" });
    db.slots = db.slots.filter((x) => x !== s);
    save();
    res.json({ ok: true });
  });
  app.post("/api/bookings", requireUser, (req, res) => {
    const s = db.slots.find(
      (s) => s.id === req.body.slotId && s.start > Date.now(),
    );
    if (!s || !hostExists(s.host))
      return res.status(400).json({ error: "bad_slot" });
    if (s.host === req.user.email)
      return res.status(400).json({ error: "own_booking" });
    if (
      db.bookings.some(
        (b) =>
          ["pending", "approved"].includes(b.status) &&
          b.requester === req.user.email &&
          overlap(b, s),
      ) ||
      db.bookings.some(
        (b) => b.host === s.host && b.status === "approved" && overlap(b, s),
      )
    )
      return res.status(409).json({ error: "conflict" });
    const topic = clean(req.body.topic, 160);
    if (!topic) return res.status(400).json({ error: "topic_required" });
    const b = {
      id: crypto.randomUUID(),
      slotId: s.id,
      host: s.host,
      requester: req.user.email,
      start: s.start,
      end: s.end,
      topic,
      status: "pending",
      created: Date.now(),
    };
    db.bookings.push(b);
    notify(s.host, "requested", b);
    audit(req.user.email, "booking_requested", b.id);
    save();
    res.status(201).json({ booking: b });
  });
  app.post("/api/bookings/:id/status", requireUser, (req, res) => {
    const b = db.bookings.find((b) => b.id === req.params.id);
    if (!b || !visibleBooking(req.user, b))
      return res.status(404).json({ error: "not_found" });
    const status = req.body.status;
    if (!["approved", "declined", "cancelled"].includes(status))
      return res.status(400).json({ error: "bad_status" });
    if (
      status !== "cancelled" &&
      (b.host !== req.user.email || roleOf(req.user) === "student")
    )
      return res.status(403).json({ error: "forbidden" });
    if (
      !["pending", "approved"].includes(b.status) ||
      (status !== "cancelled" && b.status !== "pending") ||
      b.start <= Date.now()
    )
      return res.status(409).json({ error: "bad_transition" });
    if (
      status === "approved" &&
      db.bookings.some(
        (x) =>
          x !== b &&
          x.status === "approved" &&
          (x.host === b.host ||
            x.requester === b.requester ||
            x.host === b.requester ||
            x.requester === b.host) &&
          overlap(x, b),
      )
    )
      return res.status(409).json({ error: "conflict" });
    if(status === "approved" && (db.classes||[]).some(s=>s.status!=="cancelled" && overlap(s,b) && [s.host,...s.members].some(e=>e===b.host||e===b.requester))) return res.status(409).json({error:"conflict"});
    if(status === "approved" && (db.absences||[]).some(a=>a.email === b.host && a.status === "approved" && overlap(a,b)))return res.status(409).json({error:"conflict"});
    b.status = status;
    b.updated = Date.now();
    if (status === "approved")
      for (const other of db.bookings)
        if (
          other !== b &&
          other.host === b.host &&
          other.status === "pending" &&
          overlap(other, b)
        ) {
          other.status = "declined";
          notify(other.requester, "declined", other);
        }
    notify(req.user.email === b.host ? b.requester : b.host, status, b);
    audit(req.user.email, `booking_${status}`, b.id);
    save();
    res.json({ booking: b });
  });
  app.get("/api/alerts", requireUser, (req, res) =>
    res.json({
      alerts: db.alerts
        .filter((a) => a.email === req.user.email)
        .slice(-100)
        .reverse(),
    }),
  );
  app.post("/api/alerts/read", requireUser, (req, res) => {
    for (const a of db.alerts) if (a.email === req.user.email) a.read = true;
    save();
    res.json({ ok: true });
  });
  app.post("/api/alerts", requireUser, staff, (req, res) => {
    const target = db.users[clean(req.body.email, 200).toLowerCase()];
    const message = clean(req.body.message, 500);
    if (!target || !canView(req.user, target))
      return res.status(403).json({ error: "forbidden" });
    if (!message) return res.status(400).json({ error: "empty" });
    db.alerts.push({
      id: crypto.randomUUID(),
      email: target.email,
      kind: "message",
      message,
      senderEmail: req.user.email,
      from: req.user.name || req.user.email,
      at: Date.now(),
      read: false,
    });
    save();
    res.json({ ok: true });
  });
  app.get("/api/privacy/export", requireUser, (req, res) => {
    const u = req.user;
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rasid-my-data.json"',
    );
    res.json({
      profile: {
        email: u.email,
        name: u.name,
        lang: u.lang,
        role: roleOf(u),
        created: u.created,
        privacyAcceptedAt: u.privacyAcceptedAt,
      },
      progress: userSummary(u, u.lang),
      learningHub: operationsFor(db,{...u,role:"student"}),
      certificates: u.certs || [],
      bookings: db.bookings.filter((b) => visibleBooking(u, b)),
      alerts: db.alerts.filter((a) => a.email === u.email),
      requests: db.privacyRequests.filter((r) => r.email === u.email),
    });
  });
  app.post("/api/privacy/requests", requireUser, (req, res) => {
    const type = req.body.type,
      note = clean(req.body.note, 500);
    if (
      ![
        "correction",
        "restriction",
        "withdrawal",
        "deletion",
        "question",
      ].includes(type)
    )
      return res.status(400).json({ error: "bad_type" });
    const request = {
      id: crypto.randomUUID(),
      email: req.user.email,
      type,
      note,
      at: Date.now(),
      status: "open",
    };
    db.privacyRequests.push(request);
    audit(req.user.email, "privacy_request", request.id);
    save();
    res.status(201).json({ request });
  });
  app.get("/api/admin/privacy", requireUser, admin, (req, res) =>
    res.json({
      requests: db.privacyRequests,
      audit: db.audit.slice(-100).reverse(),
    }),
  );
  app.post("/api/admin/privacy/:id", requireUser, admin, (req, res) => {
    const r = db.privacyRequests.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "not_found" });
    const response = clean(req.body.response, 500);
    if (!response) return res.status(400).json({ error: "empty" });
    r.status = "resolved";
    r.response = response;
    r.resolvedAt = Date.now();
    db.alerts.push({
      id: crypto.randomUUID(),
      email: r.email,
      kind: "message",
      message: response,
      senderEmail: req.user.email,
      from: req.user.name || req.user.email,
      at: Date.now(),
      read: false,
    });
    audit(req.user.email, "privacy_resolved", r.id);
    save();
    res.json({ ok: true });
  });
}

// Private records are filtered before answering. They never enter an external model context.
export function privateAnswer(question, viewer, db) {
  const ar = viewer.lang !== "en";
  if (/attendance|absence|timetable|inbox|my messages|حضور|غياب|جدول|رسائلي|بريدي/i.test(question)) {
    const d=operationsFor(db,viewer);
    const email=question.match(/[^\s<>]+@[^\s<>]+\.[a-z]{2,}/i)?.[0]?.replace(/[?.!,؛،]+$/, '').toLowerCase();
    const own=/\b(my|me|myself)\b|حضوري|غيابي|رسائلي|جدولي|بريدي/i.test(question);
    const records=d.attendance.filter(a=>(!email||a.email===email)&&(!own||a.email===viewer.email));
    const absences=d.absences.filter(a=>(!email||a.email===email)&&(!own||a.email===viewer.email));
    if(email && !Object.values(db.users).some(u=>u.email===email&&canView(viewer,u))) return {text:ar?'لا توجد سجلات متاحة ضمن صلاحياتك.':'No records are available within your permissions.'};
    const unread=d.messages.filter(m=>m.recipients.includes(viewer.email)&&!m.readBy.includes(viewer.email)).length;
    const upcoming=d.classes.filter(s=>s.status==='scheduled'&&s.end>Date.now()&&(!email||s.members.includes(email))&&(!own||s.host===viewer.email||s.members.includes(viewer.email))).length;
    return {text:ar?`ضمن صلاحياتك: ${records.length} سجل حضور، ${absences.filter(a=>a.status==='pending').length} طلب غياب معلق، ${upcoming} حصص قادمة. لديك ${unread} رسائل غير مقروءة. افتح مركز التعلم للتفاصيل.`:`Within your permissions: ${records.length} attendance records, ${absences.filter(a=>a.status==='pending').length} pending absences, ${upcoming} upcoming classes. You have ${unread} unread messages. Open Learning hub for details.`};
  }

  if (
    /\b(my|pending|upcoming)\b.*(booking|appointment|meeting)|حجوزاتي|مواعيدي|طلباتي|المواعيد القادمة/i.test(
      question,
    )
  ) {
    const bookings = db.bookings.filter(
      (b) =>
        (b.host === viewer.email || b.requester === viewer.email) &&
        b.end > Date.now() &&
        ["pending", "approved"].includes(b.status),
    );
    return {
      text: bookings.length
        ? bookings
            .map(
              (b) =>
                `${b.topic} · ${new Date(b.start).toLocaleString(ar ? "ar-AE" : "en-GB", { timeZone: "Asia/Dubai" })} (UTC+4) · ${ar ? { pending: "بانتظار الموافقة", approved: "تمت الموافقة" }[b.status] : b.status}`,
            )
            .join("\n")
        : ar
          ? "لا توجد مواعيد قادمة. افتح التقويم لاختيار موعد متاح."
          : "No upcoming appointments. Open Calendar to choose an available slot.",
    };
  }
  if (/my (alerts|notifications)|تنبيهاتي|إشعاراتي/i.test(question)) {
    const alerts = db.alerts.filter((a) => a.email === viewer.email && !a.read);
    return {
      text: ar
        ? `لديك ${alerts.length} تنبيهات غير مقروءة. افتح التنبيهات لعرضها.`
        : `You have ${alerts.length} unread alerts. Open Alerts to read them.`,
    };
  }
  if (
    !/progress|score|student|user|online|last seen|where.*(they|am|is)|my level|تقدم|درج|نتائج|نتيجة|طالب|طلاب|مستخدم|متصل|مستوا|وصل|نشاط/i.test(
      question,
    )
  )
    return null;
  let users = Object.values(db.users).filter((u) => canView(viewer, u));
  const email = question
    .match(/[^\s<>]+@[^\s<>]+\.[a-z]{2,}/i)?.[0]
    ?.replace(/[?.!,؛،]+$/, "")
    .toLowerCase();
  if (email) users = users.filter((u) => u.email === email);
  else {
    const named = users.filter(
      (u) => u.name && question.toLowerCase().includes(u.name.toLowerCase()),
    );
    if (named.length) users = named;
    else if (/\b(my|me|myself)\b|تقدمي|درجاتي|مستواي|نتائجي/i.test(question))
      users = users.filter((u) => u.email === viewer.email);
    else if (roleOf(viewer) === "teacher")
      users = users.filter((u) => roleOf(u) === "student");
  }
  if (!users.length)
    return {
      text: ar
        ? "لا توجد سجلات متاحة ضمن صلاحياتك. يحدد المسؤول الطلاب المسندين لكل معلم."
        : "No records are available within your permissions. The admin assigns students to teachers.",
    };
  return {
    text: users
      .map((u) => {
        const s = userSummary(u, viewer.lang);
        const scores = s.modules
          .filter((m) => m.score !== null)
          .map((m) => `${m.title}: ${m.score}/5`)
          .join("، ");
        return ar
          ? `${s.name} (${s.email}) — ${s.modulesPassed}/${s.totalModules} وحدات، ${s.lessonsRead} دروس مقروءة. التالي: ${s.next || "مكتمل"}. النتائج: ${scores || "لا توجد محاولات"}. ${s.online ? "نشط خلال آخر ٥ دقائق" : "غير نشط حالياً"}.`
          : `${s.name} (${s.email}) — ${s.modulesPassed}/${s.totalModules} modules, ${s.lessonsRead} lessons read. Next: ${s.next || "Complete"}. Scores: ${scores || "No attempts"}. ${s.online ? "Active in the last 5 minutes" : "Not recently active"}.`;
      })
      .join("\n\n"),
  };
}
