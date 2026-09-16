import { hasAI } from "./subjects.js";
const wording = (en, ar) => ({ en, ar });
const questions = [
  {
    id: "order",
    type: "order",
    level: "beginner",
    q: wording(
      "Order the first five BFS visits from A. Neighbours are explored alphabetically.",
      "رتب أول خمس زيارات بالبحث بالعرض بدءاً من A. تُستكشف العقد المجاورة أبجدياً.",
    ),
    items: ["D", "A", "E", "C", "B"],
    answer: ["A", "B", "C", "D", "E"],
    why: wording(
      "BFS visits A, then B and C, then D and E. It expands one distance layer at a time.",
      "يزور البحث بالعرض A ثم B وC ثم D وE. يستكشف طبقة مسافة واحدة في كل مرة.",
    ),
  },
  {
    id: "structure",
    type: "short",
    level: "beginner",
    q: wording(
      "Which data structure gives BFS its first-in, first-out behaviour?",
      "ما بنية البيانات التي تمنح البحث بالعرض سلوك الداخل أولاً يخرج أولاً؟",
    ),
    answer: [
      "queue",
      "fifo queue",
      "طابور",
      "الطابور",
      "صف",
      "صف انتظار",
      "طابور انتظار",
    ],
    why: wording(
      "A queue removes the oldest waiting node first. DFS uses a stack (or the call stack).",
      "يُخرج الطابور أقدم عقدة منتظرة أولاً. يستخدم البحث بالعمق مكدساً أو مكدس الاستدعاءات.",
    ),
  },
  {
    id: "distance",
    type: "number",
    level: "intermediate",
    q: wording(
      "How many edges are in the shortest route from A to H in the graph?",
      "كم حافة في أقصر مسار من A إلى H في الرسم؟",
    ),
    answer: 3,
    why: wording(
      "A → C → F → H contains three edges. BFS finds shortest paths when every edge has equal cost.",
      "المسار A ← C ← F ← H يضم ثلاث حواف. يجد البحث بالعرض أقصر مسار عندما تتساوى تكلفة الحواف.",
    ),
  },
  {
    id: "recall",
    type: "number",
    level: "intermediate",
    q: wording(
      "At threshold 0.60, the model catches 3 of 4 actual positives. What is recall as a percentage?",
      "عند عتبة 0.60 يكتشف النموذج 3 من أصل 4 حالات إيجابية فعلية. ما نسبة الاسترجاع المئوية؟",
    ),
    answer: 75,
    why: wording(
      "Recall = true positives ÷ all actual positives = 3 ÷ 4 = 75%.",
      "الاسترجاع = الإيجابيات الصحيحة ÷ جميع الإيجابيات الفعلية = 3 ÷ 4 = 75%.",
    ),
  },
  {
    id: "complexity",
    type: "short",
    level: "expert",
    q: wording(
      "Using adjacency lists, give the time complexity of a complete BFS traversal in terms of V and E.",
      "باستخدام قوائم التجاور، اكتب التعقيد الزمني لاجتياز كامل بالبحث بالعرض بدلالة V وE.",
    ),
    answer: ["o(v+e)", "v+e", "o(e+v)"],
    why: wording(
      "O(V + E): each vertex is processed once and each adjacency entry is examined. Memory is O(V).",
      "‏O(V + E): تعالج كل عقدة مرة واحدة وتفحص عناصر التجاور. الذاكرة O(V).",
    ),
  },
];
function normalize(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[أإآ]/g, "ا")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, "");
}
export function gradeLab(answers, lang = "en") {
  const language = lang === "ar" ? "ar" : "en";
  const review = questions.map((q) => {
    const supplied = answers?.[q.id];
    const correct =
      q.type === "order"
        ? Array.isArray(supplied) &&
          JSON.stringify(supplied) === JSON.stringify(q.answer)
        : q.type === "number"
          ? normalize(supplied) !== "" &&
            Number(normalize(supplied).replace(/[%٪]/g, "")) === q.answer
          : q.answer.some((a) => normalize(a) === normalize(supplied));
    return { id: q.id, correct, explanation: q.why[language] };
  });
  return {
    score: review.filter((r) => r.correct).length,
    total: questions.length,
    review,
  };
}
export function installLab(app, { db, save, requireUser }) {
  const permit = (req, res, next) =>
    hasAI(req.user)
      ? next()
      : res.status(403).json({ error: "subject_restricted" });
  app.get("/api/lab", requireUser, permit, (req, res) => {
    const lang = req.user.lang === "ar" ? "ar" : "en";
    res.json({
      questions: questions.map(({ id, type, level, q, items }) => ({
        id,
        type,
        level,
        q: q[lang],
        ...(items ? { items } : {}),
      })),
      attempts: (req.user.labAttempts || []).slice(-5),
    });
  });
  app.post("/api/lab/assess", requireUser, permit, (req, res) => {
    const answers = req.body.answers;
    if (
      !answers ||
      Array.isArray(answers) ||
      typeof answers !== "object" ||
      JSON.stringify(answers).length > 3000
    )
      return res.status(400).json({ error: "invalid_request" });
    const reflection =
      typeof req.body.reflection === "string"
        ? req.body.reflection.trim().slice(0, 1200)
        : "";
    const result = gradeLab(answers, req.user.lang);
    req.user.labAttempts = [
      ...(req.user.labAttempts || []),
      { at: Date.now(), score: result.score, total: result.total, reflection },
    ].slice(-20);
    save();
    res.json({ ...result, reflectionSaved: !!reflection });
  });
}
