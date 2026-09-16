import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import express from "express";
import { gradeLab, installLab } from "../server/lab.js";
import { seedCampusDemo, campusData } from "../server/campus.js";
import {
  enrichDemo,
  localize,
  ensureOwnerExamples,
} from "../server/experience.js";
import { operationsFor } from "../server/operations.js";
import { answer } from "../server/faris.js";

test("Algorithm visualizations compute correct traversal and classifier metrics", () => {
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(
      new URL("../public/js/algorithm-model.js", import.meta.url),
      "utf8",
    ),
    context,
  );
  const model = context.window.AlgorithmModel;
  assert.equal(model.trace("bfs").at(-1).visited.join(""), "ABCDEFGH");
  assert.equal(model.trace("dfs").at(-1).visited.join(""), "ABDEGCFH");
  for (const mode of ["bfs", "dfs"]) {
    const frames = model.trace(mode);
    assert.equal(frames.length, 9);
    for (const f of frames)
      assert.equal(
        new Set([...f.visited, ...f.frontier]).size,
        f.visited.length + f.frontier.length,
      );
  }
  assert.equal(
    JSON.stringify(model.classify(0.6)),
    JSON.stringify({
      tp: 3,
      fp: 1,
      tn: 3,
      fn: 1,
      precision: 0.75,
      recall: 0.75,
      accuracy: 0.75,
    }),
  );
  assert.equal(model.classify(1).precision, null);
  assert.equal(model.classify(0).recall, 1);
});
test("Sample classes, bookings and alerts are bilingual, additive and scoped", () => {
  const db = {
    users: { owner: { email: "owner", role: "admin", lang: "en" } },
    settings: {},
    sessions: {},
    bookings: [],
    slots: [],
    alerts: [],
    audit: [],
  };
  seedCampusDemo(db);
  assert.equal(enrichDemo(db), true);
  const count = db.messages.length;
  assert.equal(enrichDemo(db), false);
  assert.equal(db.messages.length, count);
  const teacher = db.users["khalid.ai@demo.rasid.test"];
  teacher.lang = "en";
  assert.ok(
    operationsFor(db, teacher).classes.every(
      (c) => c.title === "AI foundations",
    ),
  );
  teacher.lang = "ar";
  assert.ok(
    operationsFor(db, teacher).classes.every(
      (c) => c.title === "أساسيات الذكاء الاصطناعي",
    ),
  );
  teacher.lang = "en";
  assert.ok(
    campusData(db, teacher).classes.every(
      (c) => c.location === "Learning studio 1",
    ),
  );
  assert.equal(ensureOwnerExamples(db, teacher), false);
  assert.equal(ensureOwnerExamples(db, db.users.owner), true);
  assert.equal(ensureOwnerExamples(db, db.users.owner), false);
  assert.equal(db.bookings.filter((b) => b.host === "owner").length, 1);
  assert.ok(db.bookings.every((b) => b.isDemo));
  const m = db.messages[0];
  assert.ok(localize(m, "en").body.includes("sample"));
  assert.ok(!/[\u0600-\u06ff]/.test(localize(m, "en").subject));
  assert.deepEqual(localize({ title: "User-written Arabic عنوان" }, "en"), {
    title: "User-written Arabic عنوان",
  });
});
test("Mixed practice is server graded, accepts Arabic digits, saves reflection and blocks other subjects", async (t) => {
  const answers = {
    order: ["A", "B", "C", "D", "E"],
    structure: "queue",
    distance: "٣",
    recall: "٧٥٪",
    complexity: "O(V + E)",
  };
  assert.equal(gradeLab(answers).score, 5);
  assert.equal(
    gradeLab({ ...answers, order: ["A", "B", "C", "E", "D"], recall: "" })
      .score,
    3,
  );
  const db = {
    users: {
      ai: { email: "ai", role: "student", subject: "ai", lang: "en" },
      math: { email: "math", role: "teacher", subject: "math" },
    },
  };
  const app = express();
  app.use(express.json());
  installLab(app, {
    db,
    save() {},
    requireUser(req, res, next) {
      req.user = db.users[req.headers["x-user"]];
      req.user ? next() : res.sendStatus(401);
    },
  });
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}`;
  assert.equal((await fetch(base + "/api/lab")).status, 401);
  assert.equal(
    (await fetch(base + "/api/lab", { headers: { "x-user": "math" } })).status,
    403,
  );
  const questions = await fetch(base + "/api/lab", {
    headers: { "x-user": "ai" },
  }).then((r) => r.json());
  assert.ok(questions.questions.every((q) => !("answer" in q)));
  const r = await fetch(base + "/api/lab/assess", {
    method: "POST",
    headers: { "x-user": "ai", "content-type": "application/json" },
    body: JSON.stringify({
      answers,
      reflection: "I would check false negatives and representative data.",
    }),
  }).then((r) => r.json());
  assert.equal(r.score, 5);
  assert.equal(
    db.users.ai.labAttempts[0].reflection,
    "I would check false negatives and representative data.",
  );
  assert.equal(
    (await answer("Explain BFS", { lang: "en" })).text.includes("queue"),
    true,
  );
});
