// Faris answers only from today's lessons and their definitions. Keyword match first; Claude when available.
import Anthropic from "@anthropic-ai/sdk";
import { load } from "./db.js";
import { aiAvailable } from "./pipeline/generate.js";

const STOP = new Set("the a an of to in on for and or is are was were what who how why when where does do did about with from by this that it its ما هو هي ماذا كيف لماذا من في على عن هل مع الى إلى أن ان و أو او هذا هذه ذلك".split(" "));

function tokens(s) {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

export function searchLessons(question, level, lang, limit = 3) {
  const db = load();
  const q = tokens(question);
  if (!q.length) return [];
  const scored = db.lessons.slice(0, 60).map((l) => {
    const hay = tokens(`${l.title_en} ${l.title_ar} ${l.levels[level]?.[lang] || ""} ${l.levels.expert.en} ${(l.terms || []).map((t) => `${t.term_en} ${t.term_ar} ${t.def_ar} ${t.def_en}`).join(" ")}`);
    const set = new Set(hay);
    const score = q.reduce((n, w) => n + (set.has(w) ? 1 : 0), 0);
    return { l, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.l);
}

export async function answer(question, { level = "beginner", lang = "ar" } = {}) {
  const hits = searchLessons(question, level, lang);
  const notFound = lang === "ar"
    ? "لم أجد جواباً في دروس اليوم. جرّب سؤالاً عن أحد الدروس المعروضة."
    : "I found no answer in today's lessons. Try asking about one of the lessons shown.";
  if (!hits.length) return { text: notFound, lessonId: null };

  const best = hits[0];
  const termHit = (best.terms || []).find((t) => tokens(question).some((w) => t.term_en.toLowerCase().includes(w) || t.term_ar.includes(w)));

  if (aiAvailable()) {
    try {
      const c = new Anthropic();
      const context = hits.map((l) => `LESSON ${l.id}\nTitle: ${lang === "ar" ? l.title_ar : l.title_en}\nText: ${l.levels[level][lang]}\nTerms: ${(l.terms || []).map((t) => `${t.term_ar} / ${t.term_en}: ${lang === "ar" ? t.def_ar : t.def_en}`).join("; ")}`).join("\n\n");
      const stream = c.messages.stream({
        model: process.env.RASID_MODEL || "claude-opus-5",
        max_tokens: 600,
        output_config: { effort: "low" },
        system: `You are Faris (فارس), a friendly pixel knight inside a learning app. Answer ONLY from the lessons provided. If the answer is not in them, say so in one sentence. Reply in ${lang === "ar" ? "Modern Standard Arabic" : "English"}, 2-3 short sentences, plain words, no jargon. Never ask for passwords, PINs or codes.`,
        messages: [{ role: "user", content: `${context}\n\nQuestion: ${question}` }]
      });
      const msg = await stream.finalMessage();
      if (msg.stop_reason !== "refusal") {
        const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
        if (text) return { text, lessonId: best.id };
      }
    } catch (e) { console.warn(`[faris] Claude failed: ${e.message}`); }
  }

  // Extractive answer: definition if a term matched, else the level text of the best lesson.
  if (termHit) {
    const def = lang === "ar" ? termHit.def_ar : termHit.def_en;
    return { text: `${lang === "ar" ? termHit.term_ar : termHit.term_en}: ${def}`, lessonId: best.id };
  }
  const text = best.levels[level][lang] || best.levels.beginner[lang];
  const first = text.split(/(?<=[.!؟?])\s/).slice(0, 2).join(" ");
  return { text: first, lessonId: best.id };
}
