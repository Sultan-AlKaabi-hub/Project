// Faris answers from the AI curriculum (and with Claude when a key is present). Never from the open internet.
import Anthropic from "@anthropic-ai/sdk";
import { searchCurriculum } from "./curriculum.js";
import { aiAvailable } from "./pipeline/generate.js";

export async function answer(question, { lang = "ar" } = {}) {
  const hits = searchCurriculum(question, lang, 3);
  const notFound = lang === "ar" ? "لم أجد جواباً في دروس المسار. جرّب سؤالاً عن أحد المواضيع في الدروس." : "I found no answer in the course lessons. Try asking about one of the lesson topics.";
  if (!hits.length) return { text: notFound, lessonId: null, lessonTitle: null };
  const best = hits[0];
  if (aiAvailable()) {
    try {
      const c = new Anthropic();
      const context = hits.map((h) => `LESSON ${h.lesson.id} (${h.module.title[lang]} / ${h.lesson.title[lang]}):\n${h.lesson.body[lang]}`).join("\n\n");
      const stream = c.messages.stream({ model: process.env.RASID_MODEL || "claude-opus-5", max_tokens: 600, output_config: { effort: "low" },
        system: `You are Faris (فارس), a friendly pixel wizard inside a learning app about AI. Answer ONLY from the lessons provided. If the answer is not in them, say so in one sentence. Reply in ${lang === "ar" ? "Modern Standard Arabic" : "English"}, 2-3 short sentences, plain words. Never ask for passwords, PINs or codes.`,
        messages: [{ role: "user", content: `${context}\n\nQuestion: ${question}` }] });
      const msg = await stream.finalMessage();
      if (msg.stop_reason !== "refusal") { const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim(); if (text) return { text, lessonId: best.lesson.id, lessonTitle: best.lesson.title[lang] }; }
    } catch (e) { console.warn(`[faris] Claude failed: ${e.message}`); }
  }
  const first = best.lesson.body[lang].split(/(?<=[.!؟?])\s/).slice(0, 2).join(" ");
  return { text: first, lessonId: best.lesson.id, lessonTitle: best.lesson.title[lang] };
}
