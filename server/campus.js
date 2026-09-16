import crypto from "node:crypto";
import {localize, enrichDemo} from './experience.js';
import { hashPin } from "./auth.js";
import { COURSE, LEVELS } from "./curriculum.js";
import { canView, roleOf, userSummary } from "./portal.js";
import { SUBJECTS, subjectOf, hasAI, uaeDay, dayStart } from "./subjects.js";

export function initializeCampus(db) {
  db.subjects ||= SUBJECTS.map((s) => ({ ...s, minimum: 1 }));
  db.shifts ||= [];
  db.settings.coverageNotices ||= {};
  // Only an already existing account is preserved/promoted. Public registration never grants admin.
  if (!db.settings.ownerPreserved) {
    if (db.users["sultan.3ami@gmail.com"])
      db.users["sultan.3ami@gmail.com"].role = "admin";
    // Never promote a later public registration just because it claims this email.
    db.settings.ownerPreserved = true;
  }
}

export function seedCampusDemo(db, now = Date.now()) {
  initializeCampus(db);
  if (db.settings.campusDemoV1) return false;
  const teachers = [
    ["khalid.ai", "خالد الكعبي", "ai"],
    ["noura.ai", "نورة المنصوري", "ai"],
    ["hamdan.math", "حمدان الشامسي", "math"],
    ["fatima.science", "فاطمة المزروعي", "science"],
    ["maryam.arabic", "مريم القاسمي", "arabic"],
    ["saeed.english", "سعيد النعيمي", "english"],
  ];
  const names = [
    "عائشة الكعبي",
    "محمد المنصوري",
    "شيخة الشامسي",
    "زايد المزروعي",
    "حصة القاسمي",
    "راشد النعيمي",
    "لطيفة السويدي",
    "أحمد الظاهري",
    "مريم المهيري",
    "خليفة العامري",
    "ميثاء البلوشي",
    "عبدالله الكتبي",
    "نورة الفلاسي",
    "سالم الرميثي",
    "فاطمة الطنيجي",
    "حمدان الخييلي",
    "شمسة البادي",
    "سيف اليماحي",
  ];
  const make = (email, name, role, subject) => ({
    email,
    name,
    role,
    subject,
    isDemo: true,
    created: now - 60 * 86400000,
    lang: "ar",
    level: "beginner",
    read: {},
    course: { modules: {} },
    badges: [],
    passkeys: [],
    pinHash: hashPin(crypto.randomBytes(32).toString("base64url")),
  });
  for (const [id, name, subject] of teachers) {
    const email = id + "@demo.rasid.test";
    if (!db.users[email])
      db.users[email] = make(email, name, "teacher", subject);
  }
  const modules = LEVELS.flatMap((l) =>
    COURSE[l].modules.map((m) => ({ ...m, level: l })),
  );
  const students = [];
  for (let i = 0; i < names.length; i++) {
    const email = `student${String(i + 1).padStart(2, "0")}@demo.rasid.test`;
    students.push(email);
    if (db.users[email]) continue;
    const u = make(email, names[i], "student", "ai");
    u.teacherEmail = teachers[i % 2][0] + "@demo.rasid.test";
    const completed = i % (modules.length + 1);
    for (let j = 0; j < modules.length; j++) {
      const m = modules[j];
      u.course.modules[m.id] = {
        read:
          j < completed
            ? m.lessons.map((l) => l.id)
            : j === completed
              ? m.lessons.slice(0, i % 3).map((l) => l.id)
              : [],
        passed: j < completed,
        attempts: j < completed ? 1 + (i % 3) : 0,
        lastScore: j < completed ? 4 + (i % 2) : null,
        needsReread: false,
      };
    }
    u.level = modules[Math.min(completed, modules.length - 1)].level;
    u.expertDone = completed === modules.length;
    u.created = now - (15 + i * 3) * 86400000;
    db.users[email] = u;
  }
  for (const k of [
    "classes",
    "attendance",
    "absences",
    "messages",
    "groups",
    "alerts",
  ])
    db[k] ||= [];
  const base = dayStart(uaeDay(now));
  for (let d = -13; d < 14; d++) {
    const stamp = base + d * 86400000,
      day = uaeDay(stamp),
      weekday = new Date(stamp + 14400000).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const [id, , subject] of teachers)
      db.shifts.push({
        id: crypto.randomUUID(),
        teacher: id + "@demo.rasid.test",
        subject,
        day,
        start: stamp + 8 * 3600000,
        end: stamp + 16 * 3600000,
        isDemo: true,
      });
    for (let t = 0; t < 2; t++) {
      const members = students.filter((_, i) => i % 2 === t),
        id = crypto.randomUUID(),
        start = stamp + (10 + t * 2) * 3600000;
      db.classes.push({
        id,
        title: t
          ? "مختبر تطبيقات الذكاء الاصطناعي"
          : "أساسيات الذكاء الاصطناعي",
        host: teachers[t][0] + "@demo.rasid.test",
        members,
        start,
        end: start + 3600000,
        location: "قاعة التعلم " + (t + 1),
        status: "scheduled",
        isDemo: true,
      });
      if (d < 0)
        members.forEach((email, i) =>
          db.attendance.push({
            id: crypto.randomUUID(),
            classId: id,
            email,
            status: [
              "present",
              "present",
              "present",
              "remote",
              "late",
              "absent",
              "excused",
            ][(i + Math.abs(d)) % 7],
            at: start + (i % 4) * 60000,
            isDemo: true,
          }),
        );
    }
  }
  for (let t = 0; t < 2; t++)
    db.groups.push({
      id: crypto.randomUUID(),
      name: t ? "تطبيقات الذكاء الاصطناعي" : "رواد الذكاء الاصطناعي",
      teacher: teachers[t][0] + "@demo.rasid.test",
      members: students.filter((_, i) => i % 2 === t),
      isDemo: true,
    });
  let leaveDay = base + 2 * 86400000;
  while ([0, 6].includes(new Date(leaveDay + 14400000).getUTCDay()))
    leaveDay += 86400000;
  db.absences.push({
    id: crypto.randomUUID(),
    email: "hamdan.math@demo.rasid.test",
    start: leaveDay,
    end: leaveDay + 86399999,
    note: "إجازة تجريبية لإظهار تنبيه التغطية",
    status: "approved",
    at: now,
    isDemo: true,
  });
  db.absences.push({
    id: crypto.randomUUID(),
    email: students[3],
    start: leaveDay,
    end: leaveDay + 86399999,
    note: "طلب تجريبي",
    status: "pending",
    at: now,
    isDemo: true,
  });
  db.settings.campusDemoV1 = true;
  return true;
}

export function coverageFor(db, startDay = uaeDay(), days = 14) {
  const rows = [];
  for (let i = 0; i < days; i++) {
    const at = dayStart(startDay) + i * 86400000,
      day = uaeDay(at),
      weekend = [0, 6].includes(new Date(at + 14400000).getUTCDay());
    for (const subject of db.subjects || []) {
      const start = at + 8 * 3600000,
        end = at + 16 * 3600000;
      const shifts = (db.shifts || []).filter(
        (s) =>
          s.day === day &&
          s.subject === subject.id &&
          roleOf(db.users[s.teacher]) === "teacher" &&
          subjectOf(db.users[s.teacher]) === subject.id,
      );
      const leave = (db.absences || []).filter(
        (a) => a.status === "approved" && a.start < end && a.end > start,
      );
      const points = [
        ...new Set([
          start,
          end,
          ...shifts.flatMap((s) => [
            Math.max(start, s.start),
            Math.min(end, s.end),
          ]),
          ...leave.flatMap((a) => [
            Math.max(start, a.start),
            Math.min(end, a.end),
          ]),
        ]),
      ]
        .filter((p) => p >= start && p <= end)
        .sort((a, b) => a - b);
      let count = Infinity;
      for (let j = 0; j < points.length - 1; j++) {
        const mid = (points[j] + points[j + 1]) / 2;
        count = Math.min(
          count,
          new Set(
            shifts
              .filter(
                (s) =>
                  s.start <= mid &&
                  s.end > mid &&
                  !leave.some(
                    (a) =>
                      a.email === s.teacher && a.start <= mid && a.end > mid,
                  ),
              )
              .map((s) => s.teacher),
          ).size,
        );
      }
      count = Number.isFinite(count) ? count : 0;
      rows.push({
        day,
        subject: subject.id,
        minimum: Math.max(1, subject.minimum || 1),
        count,
        weekend,
        short: !weekend && count < Math.max(1, subject.minimum || 1),
        demo: shifts.some((s) => s.isDemo),
      });
    }
  }
  return rows;
}
export function notifyCoverage(db, now = Date.now()) {
  const rows = coverageFor(db, uaeDay(now), 7).filter((r) => r.short),
    key = uaeDay(now);
  const fingerprint = rows
    .map((r) => r.day + ":" + r.subject + ":" + r.count + "/" + r.minimum)
    .join("|");
  if (db.settings.coverageNotices[key] === fingerprint) return false;
  db.settings.coverageNotices[key] = fingerprint;
  for (const k of Object.keys(db.settings.coverageNotices))
    if (k < uaeDay(now - 14 * 86400000)) delete db.settings.coverageNotices[k];
  if (!rows.length) return true;
  for (const u of Object.values(db.users).filter((u) => roleOf(u) === "admin"))
    db.alerts.push({
      id: crypto.randomUUID(),
      email: u.email,
      kind: "message",
      from: "Rasid · راصد",
      translations:Object.fromEntries(['en','ar'].map(lang=>[lang,{message:(lang==='ar'?'تنبيه تغطية المعلمين (قد يشمل بيانات تجريبية): ':'Teacher coverage alert (may include sample data): ')+rows.map(r=>`${db.subjects.find(s=>s.id===r.subject)[lang]} (${r.day}): ${r.count}/${r.minimum}`).join(' • ')}])),
      message: `Coverage alert (includes test rosters) / تنبيه التغطية (يشمل المناوبات التجريبية): ${rows
        .map((r) => {
          const s = db.subjects.find((s) => s.id === r.subject);
          return `${s.ar} / ${s.en} (${r.day}): ${r.count}/${r.minimum}`;
        })
        .join(
          " • ",
        )}. Check teacher shifts and approved leave / راجع مناوبات المعلمين والإجازات المعتمدة.`,
      at: now,
      read: false,
    });
  db.alerts = db.alerts.slice(-5000);
  return true;
}

export function campusData(db, viewer, mode = "all", day = uaeDay()) {
  const admin = roleOf(viewer) === "admin",
    demo = (u) => mode === "all" || Boolean(u.isDemo) === (mode === "demo");
  const users = Object.values(db.users).filter(
    (u) => canView(viewer, u) && demo(u),
  );
  const emails = new Set(users.map((u) => u.email));
  const people = users.map((u) => ({
    ...(hasAI(viewer) && hasAI(u)
      ? userSummary(u, viewer.lang || "en")
      : {
          email: u.email,
          name: u.name || u.email,
          role: roleOf(u),
          level: null,
          modulesPassed: 0,
          totalModules: 0,
          lessonsRead: 0,
          modules: [],
        }),
    subject: subjectOf(u),
    isDemo: Boolean(u.isDemo),
    created: u.created,
    teacherEmail: u.teacherEmail || "",
  }));
  const classes = (db.classes || [])
    .filter(
      (c) =>
        admin ||
        ((c.subject || "ai") === subjectOf(viewer) &&
          (c.host === viewer.email || c.members.some((e) => emails.has(e)))),
    )
    .map((c) => ({ ...localize(c,viewer.lang), members: c.members.filter((e) => emails.has(e)) }));
  const attendance = (db.attendance || [])
    .filter((a) => emails.has(a.email))
    .map((a) => ({
      ...a,
      start: db.classes.find((c) => c.id === a.classId)?.start || a.at,
    }));
  const absences = (db.absences || []).filter((a) => emails.has(a.email)).map(a=>localize(a,viewer.lang));
  const teachers = Object.values(db.users)
    .filter(
      (u) =>
        roleOf(u) === "teacher" &&
        (admin || u.email === viewer.email) &&
        demo(u),
    )
    .map((u) => ({
      email: u.email,
      name: u.name,
      subject: subjectOf(u),
      isDemo: Boolean(u.isDemo),
    }));
  return {
    people,
    bookings:(db.bookings||[]).filter(b=>b.host===viewer.email||b.requester===viewer.email).map(b=>localize(b,viewer.lang)),
    teachers,
    classes,
    attendance,
    absences,
    subjects: admin
      ? db.subjects
      : db.subjects.filter((s) => s.id === subjectOf(viewer)),
    shifts: db.shifts.filter(
      (s) =>
        (admin || s.teacher === viewer.email) &&
        teachers.some((t) => t.email === s.teacher),
    ),
    coverage: admin
      ? coverageFor(
          {
            ...db,
            shifts: db.shifts.filter((s) =>
              teachers.some((t) => t.email === s.teacher),
            ),
          },
          day,
        )
      : [],
    day,
    mode,
    unread: (db.messages || []).filter(
      (m) =>
        m.recipients.includes(viewer.email) && !m.readBy.includes(viewer.email),
    ).length,
  };
}
export function installCampus(app, { db, save, requireUser }) {
  initializeCampus(db);
  const admin = (req, res, next) =>
    roleOf(req.user) === "admin"
      ? next()
      : res.status(403).json({ error: "forbidden" });
  const audit = (u, action, subject) => {
    db.audit.push({ at: Date.now(), actor: u.email, action, subject });
    db.audit = db.audit.slice(-2000);
  };
  app.get("/api/campus", requireUser, (req, res) => {
    const mode = ["all", "real", "demo"].includes(req.query.mode)
      ? req.query.mode
      : "all";
    const day =
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.day || "") &&
      Number.isFinite(dayStart(req.query.day))
        ? req.query.day
        : uaeDay();
    res.json(campusData(db, req.user, mode, day));
  });
  app.post("/api/admin/subjects", requireUser, admin, (req, res) => {
    const s = db.subjects.find((s) => s.id === req.body.id),
      minimum = Number(req.body.minimum);
    if (!s || !Number.isInteger(minimum) || minimum < 1 || minimum > 100)
      return res.status(400).json({ error: "invalid_request" });
    s.minimum = minimum;
    audit(req.user, "subject_minimum", s.id);
    notifyCoverage(db);
    save();
    res.json({ ok: true });
  });
  app.post("/api/admin/shifts", requireUser, admin, (req, res) => {
    const teacher = db.users[req.body.teacher],
      day = req.body.day,
      start = Date.parse(req.body.start),
      end = Date.parse(req.body.end);
    if (
      roleOf(teacher) !== "teacher" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day || "") ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      uaeDay(start) !== day ||
      uaeDay(end - 1) !== day ||
      end <= start ||
      end - start > 16 * 3600000
    )
      return res.status(400).json({ error: "invalid_request" });
    let s = db.shifts.find((s) => s.teacher === teacher.email && s.day === day);
    if (!s) {
      s = { id: crypto.randomUUID() };
      db.shifts.push(s);
    }
    Object.assign(s, {
      teacher: teacher.email,
      subject: subjectOf(teacher),
      day,
      start,
      end,
      isDemo: Boolean(teacher.isDemo),
    });
    audit(req.user, "shift_saved", s.id);
    notifyCoverage(db);
    save();
    res.json({ ok: true });
  });
  app.delete("/api/admin/shifts/:id", requireUser, admin, (req, res) => {
    db.shifts = db.shifts.filter((s) => s.id !== req.params.id);
    audit(req.user, "shift_removed", req.params.id);
    notifyCoverage(db);
    save();
    res.json({ ok: true });
  });
  app.post("/api/admin/demo-access", requireUser, admin, (req, res) => {
    const users = [
      "khalid.ai@demo.rasid.test",
      "student01@demo.rasid.test",
      "student08@demo.rasid.test",
      "student15@demo.rasid.test",
      "hamdan.math@demo.rasid.test",
    ].map((e) => db.users[e]);
    if (users.some((u) => !u?.isDemo))
      return res.status(409).json({ error: "demo_unavailable" });
    const credentials = users.map((u) => {
      const password = crypto.randomBytes(18).toString("base64url");
      u.pinHash = hashPin(password);
      for (const [id, s] of Object.entries(db.sessions))
        if (s.email === u.email) delete db.sessions[id];
      return { email: u.email, name: u.name, role: u.role, password };
    });
    audit(req.user, "demo_access_generated", "test accounts");
    save();
    res.json({ credentials });
  });
  app.post("/api/admin/seed-demo", requireUser, admin, (req, res) => {
    const added = seedCampusDemo(db);
    enrichDemo(db);
    notifyCoverage(db);
    save();
    res.json({ ok: true, added });
  });
  const tick = () => {
    if (notifyCoverage(db)) save();
  };
  const timer = setInterval(tick, 60000);
  timer.unref();
}
