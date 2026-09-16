import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  installOperations,
  operationsFor,
  eraseOperations,
} from "../server/operations.js";
import { privateAnswer } from "../server/portal.js";

test("Learning hub enforces roles, private inboxes, approvals, conflicts, attendance and deletion", async (t) => {
  const users = {
    admin: { email: "admin", role: "admin" },
    teacher: { email: "teacher", role: "teacher" },
    other: { email: "other", role: "teacher" },
    student: { email: "student", role: "student", teacherEmail: "teacher" },
    second: { email: "second", role: "student", teacherEmail: "other" },
  };
  const db = { users, bookings: [], alerts: [], audit: [] },
    app = express();
  app.use(express.json());
  installOperations(app, {
    db,
    save() {},
    requireUser(req, res, next) {
      req.user = users[req.headers["x-user"]];
      if (!req.user) return res.sendStatus(401);
      next();
    },
  });
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  t.after(() => server.close());
  const call = async (path, user = "student", body) => {
    const r = await fetch(
      `http://127.0.0.1:${server.address().port}/api/hub${path}`,
      {
        method: body ? "POST" : "GET",
        headers: { "x-user": user, "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    return {
      status: r.status,
      data: r.headers.get("content-type")?.includes("json")
        ? await r.json()
        : await r.text(),
    };
  };
  assert.equal((await call("/groups", "teacher", {})).status, 403);
  assert.equal(
    (
      await call("/groups", "admin", {
        name: "AI 1",
        teacher: "teacher",
        members: ["second"],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/groups", "admin", {
        name: "AI 1",
        teacher: "teacher",
        members: ["student"],
      })
    ).status,
    200,
  );
  assert.equal((await call("", "other")).data.groups.length, 0);
  const interval = {
    start: new Date(Date.now() + 3600000).toISOString(),
    end: new Date(Date.now() + 7200000).toISOString(),
    title: "AI studio",
    members: ["student"],
  };
  assert.equal((await call("/classes", "student", interval)).status, 403);
  assert.equal((await call("/classes", "other", interval)).status, 400);
  const c = await call("/classes", "teacher", interval);
  assert.equal(c.status, 200);
  assert.equal((await call("/classes", "teacher", interval)).status, 409);
  assert.equal((await call("", "second")).data.classes.length, 0);
  assert.equal(
    (
      await call("/attendance", "student", {
        classId: c.data.id,
        status: "present",
      })
    ).status,
    403,
  );
  db.classes[0].start = Date.now() - 20 * 60000;
  db.classes[0].end = Date.now() + 30 * 60000;
  assert.equal(
    (
      await call("/attendance", "student", {
        classId: c.data.id,
        status: "excused",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/attendance", "student", {
        classId: c.data.id,
        status: "present",
      })
    ).status,
    200,
  );
  assert.equal(db.attendance[0].status, "late");
  assert.equal(
    (
      await call("/attendance", "student", {
        classId: c.data.id,
        status: "remote",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/attendance", "other", {
        classId: c.data.id,
        email: "student",
        status: "absent",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/attendance", "teacher", {
        classId: c.data.id,
        email: "student",
        status: "excused",
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("/export", "second")).data.includes("student"),
    false,
  );
  const a = await call("/absences", "student", {
    start: interval.start,
    end: interval.end,
    note: "Appointment",
  });
  assert.equal(a.status, 200);
  assert.equal(
    (await call("/absences/" + a.data.id, "student", { status: "approved" }))
      .status,
    403,
  );
  assert.equal(
    (await call("/absences/" + a.data.id, "other", { status: "approved" }))
      .status,
    403,
  );
  assert.equal(
    (await call("/absences/" + a.data.id, "teacher", { status: "approved" }))
      .status,
    200,
  );
  assert.equal(
    (await call("/absences/" + a.data.id, "admin", { status: "declined" }))
      .status,
    409,
  );
  assert.equal(
    (
      await call("/messages", "student", {
        recipients: ["second"],
        subject: "x",
        body: "x",
        priority: "normal",
      })
    ).status,
    400,
  );
  const m = await call("/messages", "teacher", {
    recipients: ["student"],
    subject: "Support",
    body: "Well done",
    priority: "high",
  });
  assert.equal(m.status, 200);
  assert.equal((await call("", "other")).data.messages.length, 0);
  assert.equal(
    (await call("/messages/" + m.data.id + "/read", "other", {})).status,
    404,
  );
  assert.equal(
    (await call("/messages/" + m.data.id + "/read", "student", {})).status,
    200,
  );
  const r = await call("/resources", "student", {
    title: "Reference",
    url: "https://example.com",
  });
  assert.equal(r.status, 200);
  assert.equal((await call("", "second")).data.resources.length, 0);
  assert.equal(
    (await call("/resources/" + r.data.id, "teacher", { status: "approved" }))
      .status,
    403,
  );
  assert.equal(
    (await call("/resources/" + r.data.id, "admin", { status: "approved" }))
      .status,
    200,
  );
  assert.equal((await call("", "second")).data.resources.length, 1);
  assert.equal(
    (
      await call("/resources", "student", {
        title: "bad",
        url: "javascript:alert(1)",
      })
    ).status,
    400,
  );
  assert.equal(operationsFor(db, users.student).attendance.length, 1);
  assert.ok(
    privateAnswer(
      "my attendance",
      { ...users.student, lang: "en" },
      db,
    ).text.includes("1"),
  );
  assert.ok(
    !privateAnswer(
      "attendance second@example.test",
      { ...users.student, lang: "en" },
      db,
    ).text.includes("Appointment"),
  );
  eraseOperations(db, "student");
  assert.equal(db.attendance.length, 0);
  assert.equal(db.absences.length, 0);
  assert.equal(db.messages.length, 0);
  assert.equal(db.resources.length, 0);
  assert.deepEqual(db.classes[0].members, []);
});
