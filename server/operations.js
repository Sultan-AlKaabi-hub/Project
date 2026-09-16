import {subjectOf} from "./subjects.js";
import {localize} from './experience.js';
import crypto from "node:crypto";
import { canView, roleOf } from "./portal.js";

export function operationsFor(db, u) {
  const staff = roleOf(u) !== "student";
  const visible = (email) =>
    Object.hasOwn(db.users, email) && canView(u, db.users[email]);
  const sessions = (db.classes || []).filter(
    (s) => (roleOf(u) === "admin" || (s.subject || "ai") === subjectOf(u)) && (s.host === u.email || s.members.some(visible)),
  );
  return {
    classes: sessions.map((s) => ({
      ...localize(s,u.lang),
      members: s.members.filter(visible),
    })),
    attendance: (db.attendance || []).filter((a) => visible(a.email)),
    absences: (db.absences || []).filter((a) => visible(a.email)).map(a=>localize(a,u.lang)),
    messages: (db.messages || [])
      .filter((m) => m.sender === u.email || m.recipients.includes(u.email))
      .map((m) => ({
        ...localize(m,u.lang),
        recipients: m.sender === u.email ? m.recipients : [u.email],
        readBy: m.sender === u.email ? m.readBy : m.readBy.filter((e) => e === u.email),
      })),
    groups: (db.groups || [])
      .filter(
        (g) =>
          roleOf(u) === "admin" ||
          g.teacher === u.email ||
          g.members.includes(u.email),
      )
      .map((g) => ({ ...localize(g,u.lang), members: g.members.filter(visible) })),
    resources: (db.resources || []).filter(
      (r) =>
        (r.status === "approved" && (r.subject || "ai") === subjectOf(u)) || r.owner === u.email || roleOf(u) === "admin",
    ),
    people: Object.values(db.users)
      .filter(
        (p) =>
          visible(p.email) ||
          (roleOf(u) === "student" &&
            (p.email === u.teacherEmail || roleOf(p) === "admin")),
      )
      .map((p) => ({
        email: p.email,
        name: p.name || p.email,
        role: roleOf(p),
        teacherEmail: staff ? p.teacherEmail || "" : "",
      })),
    staff,
  };
}

export function eraseOperations(db, email) {
  db.classes = (db.classes || [])
    .filter((s) => s.host !== email)
    .map((s) => ({ ...s, members: s.members.filter((e) => e !== email) }));
  db.attendance = (db.attendance || []).filter(
    (a) => a.email !== email && db.classes.some((s) => s.id === a.classId),
  );
  db.absences = (db.absences || [])
    .filter((a) => a.email !== email)
    .map((a) => ({ ...a, reviewer: a.reviewer === email ? "" : a.reviewer }));
  db.messages = (db.messages || [])
    .filter((m) => m.sender !== email)
    .map((m) => ({
      ...m,
      recipients: m.recipients.filter((e) => e !== email),
      readBy: m.readBy.filter((e) => e !== email),
    }))
    .filter((m) => m.recipients.length);
  db.groups = (db.groups || []).map((g) => ({
    ...g,
    teacher: g.teacher === email ? "" : g.teacher,
    members: g.members.filter((e) => e !== email),
  }));
  db.resources = (db.resources || []).filter((r) => r.owner !== email);
}

export function installOperations(app, { db, save, requireUser }) {
  for (const k of [
    "classes",
    "attendance",
    "absences",
    "messages",
    "groups",
    "resources",
  ])
    db[k] ||= [];
  const clean = (v, n = 160) =>
    typeof v === "string" ? v.trim().slice(0, n) : "";
  const isAdmin = (u) => roleOf(u) === "admin";
  const staff = (u) => roleOf(u) !== "student";
  const allowed = (u, email) =>
    Object.hasOwn(db.users, email) && canView(u, db.users[email]);
  const fail = (res, code = 400, error = "invalid_request") =>
    res.status(code).json({ error });
  const audit = (u, action, subject) => {
    db.audit.push({ at: Date.now(), actor: u.email, action, subject });
    db.audit = db.audit.slice(-2000);
  };
  const notify = (email, title, body) => {
    const systemWords=['New class / حصة جديدة','Class cancelled / إلغاء حصة','Absence request / طلب غياب','Absence update / تحديث طلب الغياب','Approved / تمت الموافقة','Declined / مرفوض','New inbox message / رسالة جديدة'];
    const part=(text,lang)=>systemWords.includes(text)?text.split(' / ')[lang==='ar'?1:0]:text;
    db.alerts.push({
      id: crypto.randomUUID(),
      email,
      kind: "message",
      message: title + " — " + body,
      translations:{en:{message:part(title,'en')+' — '+part(body,'en')},ar:{message:part(title,'ar')+' — '+part(body,'ar')}},
      from: "Rasid",
      at: Date.now(),
      read: false,
    });
    db.alerts = db.alerts.slice(-5000);
  };
  const done = (res, u, action, id) => {
    audit(u, action, id);
    save();
    res.json({ ok: true, id });
  };
  const overlap = (a, b) => a.start < b.end && b.start < a.end;
  app.get("/api/hub", requireUser, (req, res) =>
    res.json(operationsFor(db, req.user)),
  );
  app.post("/api/hub/groups", requireUser, (req, res) => {
    if (!isAdmin(req.user)) return fail(res, 403, "forbidden");
    const name = clean(req.body.name),
      teacher = clean(req.body.teacher);
    const members = [
      ...new Set(Array.isArray(req.body.members) ? req.body.members : []),
    ];
    if (
      !name ||
      roleOf(db.users[teacher]) !== "teacher" ||
      !db.users[teacher] ||
      members.length > 500 ||
      members.some(
        (e) =>
          !Object.hasOwn(db.users, e) ||
          roleOf(db.users[e]) !== "student" ||
          db.users[e].teacherEmail !== teacher,
      )
    )
      return fail(res);
    const group = { id: crypto.randomUUID(), name, teacher, members };
    db.groups.push(group);
    done(res, req.user, "group_created", group.id);
  });
  app.post("/api/hub/classes", requireUser, (req, res) => {
    if (!staff(req.user)) return fail(res, 403, "forbidden");
    const title = clean(req.body.title),
      start = Date.parse(req.body.start),
      end = Date.parse(req.body.end),
      location = clean(req.body.location);
    const members = [
      ...new Set(Array.isArray(req.body.members) ? req.body.members : []),
    ];
    if (
      !title ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < Date.now() ||
      start > Date.now() + 366 * 86400000 ||
      end - start < 15 * 60000 ||
      end - start > 8 * 3600000 ||
      !members.length ||
      members.length > 500 ||
      members.some(
        (e) => !allowed(req.user, e) || roleOf(db.users[e]) !== "student",
      )
    )
      return fail(res);
    if((db.absences||[]).some(a=>a.email === req.user.email && a.status === "approved" && a.start < end && a.end > start))return fail(res,409,"time_conflict");
    const people = [req.user.email, ...members],
      interval = { start, end };
    if (
      db.classes.some(
        (s) =>
          s.status !== "cancelled" &&
          overlap(s, interval) &&
          [s.host, ...s.members].some((e) => people.includes(e)),
      ) ||
      db.bookings.some(
        (b) =>
          b.status === "approved" &&
          overlap(b, interval) &&
          (people.includes(b.host) || people.includes(b.requester)),
      )
    )
      return fail(res, 409, "time_conflict");
    const s = {
      id: crypto.randomUUID(),
      title,
      start,
      end,
      location,
      host: req.user.email,
      members,
      subject: subjectOf(req.user),
      status: "scheduled",
    };
    db.classes.push(s);
    for (const email of members) notify(email, "New class / حصة جديدة", title);
    done(res, req.user, "class_created", s.id);
  });
  app.post("/api/hub/classes/:id/cancel", requireUser, (req, res) => {
    const s = db.classes.find((s) => s.id === req.params.id);
    if (
      !s ||
      !staff(req.user) ||
      (!isAdmin(req.user) && s.host !== req.user.email)
    )
      return fail(res, 403, "forbidden");
    s.status = "cancelled";
    for (const email of s.members)
      notify(email, "Class cancelled / إلغاء حصة", s.title);
    done(res, req.user, "class_cancelled", s.id);
  });
  app.post("/api/hub/attendance", requireUser, (req, res) => {
    const s = db.classes.find((s) => s.id === req.body.classId),
      email = clean(req.body.email || req.user.email),
      status = req.body.status;
    if (
      !s ||
      s.status === "cancelled" ||
      !s.members.includes(email) ||
      !allowed(req.user, email)
    )
      return fail(res, 403, "forbidden");
    const manager =
      staff(req.user) && (s.host === req.user.email || isAdmin(req.user));
    if (
      !manager &&
      (email !== req.user.email ||
        Date.now() < s.start - 15 * 60000 ||
        Date.now() > s.end ||
        !["present", "remote"].includes(status))
    )
      return fail(res, 403, "checkin_closed");
    if (manager && Date.now() < s.start - 15 * 60000)
      return fail(res, 400, "checkin_closed");
    if (!["present", "remote", "late", "absent", "excused"].includes(status))
      return fail(res);
    let a = db.attendance.find((a) => a.classId === s.id && a.email === email);
    if (a && !manager) return fail(res, 409, "already_recorded");
    if (!a) {
      a = { id: crypto.randomUUID(), classId: s.id, email };
      db.attendance.push(a);
    }
    Object.assign(a, {
      status: !manager && Date.now() > s.start + 15 * 60000 ? "late" : status,
      at: Date.now(),
    });
    done(res, req.user, "attendance_recorded", a.id);
  });
  app.post("/api/hub/absences", requireUser, (req, res) => {
    const start = Date.parse(req.body.start),
      end = Date.parse(req.body.end),
      note = clean(req.body.note, 500);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end < start ||
      end < Date.now() - 86400000 ||
      end - start > 90 * 86400000 ||
      start > Date.now() + 366 * 86400000
    )
      return fail(res);
    if (
      db.absences.some(
        (a) =>
          a.email === req.user.email &&
          ["pending", "approved"].includes(a.status) &&
          a.start <= end &&
          start <= a.end,
      )
    )
      return fail(res, 409, "time_conflict");
    const a = {
      id: crypto.randomUUID(),
      email: req.user.email,
      start,
      end,
      note,
      status: "pending",
      at: Date.now(),
    };
    db.absences.push(a);
    const reviewers = Object.values(db.users).filter(
      (u) =>
        u.email !== req.user.email &&
        (isAdmin(u) || u.email === req.user.teacherEmail),
    );
    for (const u of reviewers)
      notify(
        u.email,
        "Absence request / طلب غياب",
        req.user.name || req.user.email,
      );
    done(res, req.user, "absence_requested", a.id);
  });
  app.post("/api/hub/absences/:id", requireUser, (req, res) => {
    const a = db.absences.find((a) => a.id === req.params.id),
      status = req.body.status;
    if (!a || !allowed(req.user, a.email)) return fail(res, 403, "forbidden");
    if (
      status === "cancelled" &&
      a.email === req.user.email &&
      ["pending", "approved"].includes(a.status)
    ) {
      a.status = status;
      return done(res, req.user, "absence_cancelled", a.id);
    }
    if (!staff(req.user) || a.email === req.user.email)
      return fail(res, 403, "forbidden");
    if (a.status !== "pending" || !["approved", "declined"].includes(status))
      return fail(res, 409, "invalid_transition");
    Object.assign(a, { status, reviewer: req.user.email });
    notify(
      a.email,
      "Absence update / تحديث طلب الغياب",
      status === "approved" ? "Approved / تمت الموافقة" : "Declined / مرفوض",
    );
    done(res, req.user, "absence_" + status, a.id);
  });
  app.post("/api/hub/messages", requireUser, (req, res) => {
    const recipients = [
        ...new Set(
          Array.isArray(req.body.recipients) ? req.body.recipients : [],
        ),
      ],
      subject = clean(req.body.subject),
      body = clean(req.body.body, 3000),
      priority = req.body.priority;
    const permitted = new Set(
      operationsFor(db, req.user).people.map((p) => p.email),
    );
    if (
      !subject ||
      !body ||
      !recipients.length ||
      recipients.length > 500 ||
      recipients.some((e) => e === req.user.email || !permitted.has(e)) ||
      !["normal", "high", "urgent"].includes(priority)
    )
      return fail(res);
    const m = {
      id: crypto.randomUUID(),
      sender: req.user.email,
      recipients,
      subject,
      body,
      priority,
      at: Date.now(),
      readBy: [],
    };
    db.messages.push(m);
    for (const email of recipients)
      notify(email, subject, "New inbox message / رسالة جديدة");
    done(res, req.user, "message_sent", m.id);
  });
  app.post("/api/hub/messages/:id/read", requireUser, (req, res) => {
    const m = db.messages.find(
      (m) => m.id === req.params.id && m.recipients.includes(req.user.email),
    );
    if (!m) return fail(res, 404, "not_found");
    if (!m.readBy.includes(req.user.email)) m.readBy.push(req.user.email);
    save();
    res.json({ ok: true });
  });
  app.post("/api/hub/resources", requireUser, (req, res) => {
    const title = clean(req.body.title),
      url = clean(req.body.url, 2000);
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return fail(res);
    }
    if (
      !title ||
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password
    )
      return fail(res);
    const r = {
      id: crypto.randomUUID(),
      title,
      url: parsed.href,
      owner: req.user.email,
      subject: subjectOf(req.user),
      status: isAdmin(req.user) ? "approved" : "pending",
    };
    db.resources.push(r);
    done(res, req.user, "resource_submitted", r.id);
  });
  app.post("/api/hub/resources/:id", requireUser, (req, res) => {
    if (!isAdmin(req.user)) return fail(res, 403, "forbidden");
    const r = db.resources.find((r) => r.id === req.params.id);
    if (!r || !["approved", "declined"].includes(req.body.status))
      return fail(res);
    r.status = req.body.status;
    done(res, req.user, "resource_" + r.status, r.id);
  });
  app.get("/api/hub/export", requireUser, (req, res) => {
    const d = operationsFor(db, req.user);
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const rows = [
      ["Class", "Start (UTC)", "Name / email", "Status"],
      ...d.attendance.map((a) => {
        const s = d.classes.find((s) => s.id === a.classId);
        return [
          s?.title || "",
          s ? new Date(s.start).toISOString() : "",
          a.email,
          a.status,
        ];
      }),
    ];
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rasid-attendance.csv"',
    );
    res
      .type("text/csv")
      .send("\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"));
  });
}
