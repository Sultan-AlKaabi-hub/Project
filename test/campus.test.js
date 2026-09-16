import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  initializeCampus,
  seedCampusDemo,
  coverageFor,
  notifyCoverage,
  campusData,
  installCampus,
} from "../server/campus.js";
import { installPortal, canView } from "../server/portal.js";
import { checkPin } from "../server/auth.js";

const fixture = () => ({
  users: {
    "sultan.3ami@gmail.com": {
      email: "sultan.3ami@gmail.com",
      name: "سلطان",
      role: "admin",
      pinHash: "untouched",
    },
  },
  sessions: {},
  settings: { rolesMigrated: true },
  bookings: [],
  slots: [],
  alerts: [],
  audit: [],
  privacyRequests: [],
});
test("Demo campus is additive, preserves owner, has UAE names and varied progress, and isolates subjects", () => {
  const fresh = fixture();
  fresh.users = {};
  initializeCampus(fresh);
  fresh.users["sultan.3ami@gmail.com"] = { role: "student" };
  initializeCampus(fresh);
  assert.equal(fresh.users["sultan.3ami@gmail.com"].role, "student");
  const db = fixture(),
    now = Date.parse("2026-09-16T08:00:00+04:00");
  assert.equal(seedCampusDemo(db, now), true);
  assert.equal(seedCampusDemo(db, now), false);
  assert.equal(db.users["sultan.3ami@gmail.com"].pinHash, "untouched");
  const students = Object.values(db.users).filter((u) => u.role === "student");
  assert.equal(students.length, 18);
  assert.equal(new Set(students.map((u) => u.level)).size, 3);
  assert.ok(
    students.every(
      (u) => u.subject === "ai" && u.isDemo && /[\u0600-\u06ff]/.test(u.name),
    ),
  );
  const teacher = db.users["khalid.ai@demo.rasid.test"],
    math = db.users["hamdan.math@demo.rasid.test"];
  assert.equal(
    campusData(db, teacher).people.filter((u) => u.role === "student").length,
    9,
  );
  assert.equal(campusData(db, math).people.length, 1);
  assert.equal(campusData(db, math).attendance.length, 0);
  assert.equal(campusData(db, math).classes.length, 0);
  assert.equal(campusData(db, students[0]).people.length, 1);
  assert.equal(
    canView(math, { ...students[0], teacherEmail: math.email }),
    false,
  );
  const real = campusData(db, db.users["sultan.3ami@gmail.com"], "real");
  assert.equal(real.people.length, 1);
});
test("Coverage subtracts approved leave, finds partial-day gaps, ignores pending leave and weekends, and deduplicates alerts", () => {
  const db = fixture();
  initializeCampus(db);
  db.subjects = [{ id: "ai", ar: "الذكاء الاصطناعي", en: "AI", minimum: 1 }];
  const start = Date.parse("2026-09-16T08:00:00+04:00"),
    end = start + 8 * 3600000;
  db.users.t = { email: "t", role: "teacher", subject: "ai" };
  db.shifts = [
    { id: "s", teacher: "t", subject: "ai", day: "2026-09-16", start, end },
  ];
  db.absences = [];
  assert.equal(coverageFor(db, "2026-09-16", 1)[0].short, false);
  db.absences.push({
    email: "t",
    start: start + 3600000,
    end: start + 2 * 3600000,
    status: "pending",
  });
  assert.equal(coverageFor(db, "2026-09-16", 1)[0].short, false);
  db.absences[0].status = "approved";
  assert.equal(coverageFor(db, "2026-09-16", 1)[0].count, 0);
  notifyCoverage(db, start);
  const count = db.alerts.length;
  notifyCoverage(db, start + 60000);
  assert.equal(db.alerts.length, count);
  assert.equal(count, 1);
  assert.equal(coverageFor(db, "2026-09-19", 1)[0].short, false);
  db.absences = [];
  db.shifts[0].end = start + 4 * 3600000;
  assert.equal(coverageFor(db, "2026-09-16", 1)[0].short, true);
});
test("Only admin edits shifts, subject minimums and test access; owner stays admin; assignment respects subjects", async (t) => {
  const db = fixture();
  seedCampusDemo(db);
  const app = express();
  app.use(express.json());
  const requireUser = (req, res, next) => {
    req.user = db.users[req.headers["x-user"]];
    return req.user ? next() : res.sendStatus(401);
  };
  installPortal(app, { db, save() {}, requireUser });
  installCampus(app, { db, save() {}, requireUser });
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const call = async (route, user, body, method = "POST") => {
    const r = await fetch(`http://127.0.0.1:${server.address().port}${route}`, {
      method,
      headers: { "content-type": "application/json", "x-user": user },
      body: method === "GET" ? undefined : JSON.stringify(body || {}),
    });
    return { status: r.status, data: await r.json() };
  };
  const owner = "sultan.3ami@gmail.com",
    teacher = "khalid.ai@demo.rasid.test",
    student = "student01@demo.rasid.test";
  assert.equal((await call("/api/admin/shifts", teacher, {})).status, 403);
  assert.equal(
    (await call("/api/admin/subjects", student, { id: "ai", minimum: 2 }))
      .status,
    403,
  );
  assert.equal(
    (await call("/api/admin/subjects", owner, { id: "ai", minimum: 0 })).status,
    400,
  );
  assert.equal(
    (await call("/api/admin/subjects", owner, { id: "ai", minimum: 2 })).status,
    200,
  );
  assert.equal(
    (await call("/api/admin/people", owner, { email: owner, role: "student" }))
      .status,
    409,
  );
  assert.equal(
    (
      await call("/api/admin/people", owner, {
        email: student,
        role: "student",
        teacherEmail: "hamdan.math@demo.rasid.test",
      })
    ).status,
    400,
  );
  assert.equal((await call("/api/admin/demo-access", student, {})).status, 403);
  const access = await call("/api/admin/demo-access", owner, {});
  assert.equal(access.status, 200);
  assert.equal(access.data.credentials.length, 2);
  for (const c of access.data.credentials)
    assert.equal(checkPin(c.password, db.users[c.email].pinHash), true);
  const data = await call("/api/campus", teacher, null, "GET");
  assert.ok(!JSON.stringify(data.data).includes("student02@demo.rasid.test"));
  const shift = {
    teacher,
    day: "2026-09-17",
    start: "2026-09-17T08:00:00+04:00",
    end: "2026-09-17T16:00:00+04:00",
  };
  assert.equal((await call("/api/admin/shifts", owner, shift)).status, 200);
  assert.equal(
    (
      await call("/api/admin/shifts", owner, {
        ...shift,
        end: "2026-09-17T07:00:00+04:00",
      })
    ).status,
    400,
  );
});
