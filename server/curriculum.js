// The AI curriculum: three levels, each a set of modules (skills). A level is passed when every module quiz is passed.
import beginner from "../data/curriculum/beginner.js";
import intermediate from "../data/curriculum/intermediate.js";
import expert from "../data/curriculum/expert.js";
import { load, save } from "./db.js";

export const LEVELS = ["beginner", "intermediate", "expert"];
export const COURSE = { beginner, intermediate, expert };
export const PASS_MARK = 4;
export const QUIZ_SIZE = 5;
const NEXT = { beginner: "intermediate", intermediate: "expert", expert: null };

const allModules = LEVELS.flatMap((lv) => COURSE[lv].modules.map((m) => ({ ...m, level: lv })));
export const moduleById = (id) => allModules.find((m) => m.id === id);
export const lessonById = (id) => { for (const m of allModules) { const l = m.lessons.find((x) => x.id === id); if (l) return { lesson: l, module: m }; } return null; };
export const levelIndex = (lv) => LEVELS.indexOf(lv);

export function progress(u) {
  u.course = u.course || { modules: {} };
  return u.course;
}
function modState(u, id) { const c = progress(u); c.modules[id] = c.modules[id] || { read: [], passed: false, attempts: 0, needsReread: false }; return c.modules[id]; }

export function moduleSummary(u, m, lang) {
  const st = modState(u, m.id);
  const read = m.lessons.filter((l) => st.read.includes(l.id)).length;
  const locked = levelIndex(m.level) > levelIndex(u.level || "beginner");
  return {
    id: m.id, level: m.level, icon: m.icon, title: m.title[lang], desc: m.desc[lang], skills: m.skills[lang],
    lessons: m.lessons.length, read, passed: st.passed, attempts: st.attempts, locked,
    quizReady: !locked && read === m.lessons.length && !st.needsReread, needsReread: st.needsReread,
    status: st.passed ? "passed" : locked ? "locked" : read === m.lessons.length ? "quiz" : read > 0 ? "in_progress" : "new"
  };
}

export function levelSummary(u, lv, lang) {
  const mods = COURSE[lv].modules.map((m) => moduleSummary(u, { ...m, level: lv }, lang));
  const passed = mods.filter((m) => m.passed).length;
  return { id: lv, modules: mods, passed, total: mods.length, complete: passed === mods.length, locked: levelIndex(lv) > levelIndex(u.level || "beginner") };
}

export function courseSummary(u, lang) {
  const levels = LEVELS.map((lv) => levelSummary(u, lv, lang));
  const current = levels.find((l) => l.id === (u.level || "beginner"));
  const next = current.modules.find((m) => !m.passed) || null;
  const lessonsRead = Object.values(progress(u).modules).reduce((n, s) => n + s.read.length, 0);
  return { level: u.level || "beginner", levels, next, lessonsRead, modulesPassed: levels.reduce((n, l) => n + l.passed, 0), expertDone: Boolean(u.expertDone) };
}

export function markRead(u, lessonId) {
  const hit = lessonById(lessonId); if (!hit) return null;
  const st = modState(u, hit.module.id);
  if (!st.read.includes(lessonId)) st.read.push(lessonId);
  if (st.needsReread) {
    st.rereadSince = st.rereadSince || [];
    if (!st.rereadSince.includes(lessonId)) st.rereadSince.push(lessonId);
    if (hit.module.lessons.every((l) => st.rereadSince.includes(l.id))) { st.needsReread = false; st.rereadSince = []; }
  }
  save();
  return hit.module.id;
}

export function drawQuiz(u, moduleId, lang) {
  const m = moduleById(moduleId); if (!m) return null;
  const idx = m.quiz.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE);
  u.activeQuiz = { moduleId, idx, started: Date.now() }; save();
  return { moduleId, title: m.title[lang], passMark: PASS_MARK, questions: idx.map((i, n) => ({ n, q: m.quiz[i].q[lang], choices: m.quiz[i].choices[lang] })) };
}

export function gradeQuiz(u, answers, lang) {
  const a = u.activeQuiz; if (!a) return null;
  const m = moduleById(a.moduleId);
  const review = a.idx.map((qi, n) => { const q = m.quiz[qi]; const chosen = answers[n]; return { q: q.q[lang], choices: q.choices[lang], chosen, answer: q.answer, correct: chosen === q.answer }; });
  const score = review.filter((r) => r.correct).length, passed = score >= PASS_MARK;
  const st = modState(u, m.id); st.attempts++;
  let levelUp = null, expertDone = false;
  if (passed) {
    st.passed = true; st.needsReread = false;
    const lv = levelSummary(u, m.level, lang);
    if (lv.complete && m.level === (u.level || "beginner")) {
      u.badges = u.badges || []; if (!u.badges.includes(m.level)) u.badges.push(m.level);
      if (NEXT[m.level]) { u.level = NEXT[m.level]; levelUp = u.level; } else { u.expertDone = true; expertDone = true; }
    }
  } else { st.needsReread = true; st.rereadSince = []; }
  delete u.activeQuiz; save();
  return { moduleId: m.id, moduleTitle: m.title[lang], score, total: review.length, passed, review, levelUp, expertDone, level: u.level || "beginner", lessonIds: m.lessons.map((l) => l.id) };
}

// Placement: two questions per level, drawn across modules.
export function drawPlacement(u, lang) {
  const items = [];
  for (const lv of LEVELS) {
    const mods = COURSE[lv].modules.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    for (const m of mods) { const qi = Math.floor(Math.random() * m.quiz.length); items.push({ level: lv, moduleId: m.id, qi }); }
  }
  u.activePlacement = items; save();
  return { questions: items.map((it, n) => { const q = moduleById(it.moduleId).quiz[it.qi]; return { n, q: q.q[lang], choices: q.choices[lang], title: moduleById(it.moduleId).title[lang] }; }) };
}
export function gradePlacement(u, answers, skipped) {
  let level = "beginner", score = 0;
  if (!skipped && u.activePlacement) {
    u.activePlacement.forEach((it, i) => { if (moduleById(it.moduleId).quiz[it.qi].answer === answers[i]) score++; });
    level = score >= 5 ? "expert" : score >= 3 ? "intermediate" : "beginner";
  }
  u.level = level; delete u.activePlacement;
  // Levels below the placed level count as passed by placement.
  for (const lv of LEVELS) if (levelIndex(lv) < levelIndex(level)) for (const m of COURSE[lv].modules) { const st = modState(u, m.id); st.passed = true; st.byPlacement = true; }
  u.badges = u.badges || []; for (const lv of LEVELS) if (levelIndex(lv) < levelIndex(level) && !u.badges.includes(lv)) u.badges.push(lv);
  save();
  return { level, score };
}

// Text search over the curriculum for Faris.
const STOP = new Set("the a an of to in on for and or is are was were be by with as at from that this it its what who how why when where ما هو هي ماذا كيف لماذا من في على عن هل مع إلى أن و أو هذا هذه ذلك التي الذي".split(" "));
const tokens = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
export function searchCurriculum(question, lang, limit = 3) {
  const q = tokens(question); if (!q.length) return [];
  const scored = [];
  for (const m of allModules) for (const l of m.lessons) {
    const hay = new Set(tokens(`${m.title.ar} ${m.title.en} ${l.title.ar} ${l.title.en} ${l.body.ar} ${l.body.en} ${m.skills.ar.join(" ")} ${m.skills.en.join(" ")}`));
    const score = q.reduce((n, w) => n + (hay.has(w) ? 1 : 0), 0);
    if (score) scored.push({ score, module: m, lesson: l });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
