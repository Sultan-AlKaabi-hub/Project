import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import {
  installOwnerRecovery,
  ownerRecoveryAvailable,
} from "../server/owner-recovery.js";

test("Owner recovery requires sign-in, exact owner and private code; preserves password, expires, throttles and cannot replay", async (t) => {
  const code = crypto.randomBytes(32).toString("base64url");
  const config = {
    id: "test",
    email: "sultan.3ami@gmail.com",
    digest: crypto.createHash("sha256").update(code).digest("hex"),
    expires: new Date(Date.now() + 60000).toISOString(),
  };
  const owner = { email: config.email, role: "student", pinHash: "unchanged" };
  const student = { email: "student@example.test", role: "student" };
  const db = {
    users: { [owner.email]: owner, [student.email]: student },
    settings: {},
    sessions: {
      current: { email: owner.email },
      other: { email: owner.email },
      student: { email: student.email },
    },
    audit: [],
  };
  assert.equal(
    ownerRecoveryAvailable(db, owner, config, Date.now() + 120000),
    false,
  );
  const app = express();
  app.use(express.json());
  installOwnerRecovery(app, {
    db,
    config,
    saveNow() {},
    publicUser: (u) => ({ email: u.email, role: u.role }),
    requireUser(req, res, next) {
      req.user = db.users[req.headers["x-user"]];
      req.cookies = { rasid: "current" };
      return req.user ? next() : res.sendStatus(401);
    },
  });
  const server = app.listen(0);
  t.after(() => server.close());
  const call = async (email, value) => {
    const r = await fetch(
      `http://localhost:${server.address().port}/api/auth/owner-recovery`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(email ? { "x-user": email } : {}),
        },
        body: JSON.stringify({ code: value }),
      },
    );
    return r.status;
  };
  assert.equal(await call(null, code), 401);
  assert.equal(await call(student.email, code), 403);
  for (let i = 0; i < 5; i++)
    assert.equal(await call(owner.email, "wrong"), 403);
  assert.equal(owner.role, "student");
  assert.equal(await call(owner.email, code), 429);
  db.settings.ownerRecoveryAttempts.until = 0;
  assert.equal(await call(owner.email, code), 200);
  assert.equal(owner.role, "admin");
  assert.equal(owner.pinHash, "unchanged");
  assert.ok(db.sessions.current);
  assert.ok(db.sessions.student);
  assert.equal(db.sessions.other, undefined);
  owner.role = "student";
  assert.equal(await call(owner.email, code), 403);
  assert.ok(!JSON.stringify(db).includes(code));
});
