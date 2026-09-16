// Turn one news item into three leveled Arabic+English lessons and quiz questions.
// Primary: Claude (needs ANTHROPIC_API_KEY or `ant auth login`). Fallback: free translation + template questions.
import Anthropic from "@anthropic-ai/sdk";

export const LEVELS = ["beginner", "intermediate", "expert"];
const MODEL = process.env.RASID_MODEL || "claude-opus-5";

let client = null;
function getClient() {
  if (client) return client;
  try { client = new Anthropic(); } catch { client = null; }
  return client;
}
export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.RASID_FORCE_AI);
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title_ar", "levels", "questions", "terms"],
  properties: {
    title_ar: { type: "string" },
    levels: {
      type: "object", additionalProperties: false, required: LEVELS,
      properties: Object.fromEntries(LEVELS.map((l) => [l, {
        type: "object", additionalProperties: false, required: ["ar", "en"],
        properties: { ar: { type: "string" }, en: { type: "string" } }
      }]))
    },
    questions: {
      type: "object", additionalProperties: false, required: LEVELS,
      properties: Object.fromEntries(LEVELS.map((l) => [l, {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object", additionalProperties: false,
          required: ["q_ar", "q_en", "choices_ar", "choices_en", "answer"],
          properties: {
            q_ar: { type: "string" }, q_en: { type: "string" },
            choices_ar: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            choices_en: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            answer: { type: "integer", minimum: 0, maximum: 2 }
          }
        }
      }]))
    },
    terms: {
      type: "array", maxItems: 3,
      items: { type: "object", additionalProperties: false, required: ["term_en", "term_ar", "def_ar", "def_en"],
        properties: { term_en: { type: "string" }, term_ar: { type: "string" }, def_ar: { type: "string" }, def_en: { type: "string" } } }
    }
  }
};

const SYSTEM = `You write short learning lessons in Modern Standard Arabic (and an English twin) for an app that teaches non-technical Arabic speakers about artificial intelligence news. Rules:
- Beginner: 3 very plain sentences. No jargon. Assume the reader has never heard of AI.
- Intermediate: one short paragraph (4-6 sentences) with context on why this matters.
- Expert: a full summary (6-9 sentences): what happened, who, why it matters, and what could come next.
- Every level must be faithful to the article. Never invent facts. If the snippet is thin, say what is known and keep it short.
- Questions: 3 multiple-choice questions per level, 3 choices each, exactly one correct. Each question must be answerable from that level's text. Distractors must be plausible but clearly wrong.
- Terms: up to 3 AI or military terms that appear in the lesson, each with a one-sentence definition.
- Arabic must read naturally (not word-for-word translation). English is the twin, same meaning.`;

export async function generateWithClaude(article, catLabelEn) {
  const c = getClient();
  if (!c) throw new Error("no client");
  const stream = c.messages.stream({
    model: MODEL,
    max_tokens: 6000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: `Category: ${catLabelEn}\nTitle: ${article.title}\nSource: ${article.source}\nPublished: ${article.published}\nSnippet: ${article.snippet || "(no snippet)"}\nURL: ${article.url}\n\nProduce the JSON described by the schema.`
    }]
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("refused");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

// ---------- Fallback: no API key ----------
async function translate(text) {
  if (!text) return "";
  const chunks = text.match(/[^]{1,450}(?:\s|$)/g) || [text];
  const out = [];
  for (const ch of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(ch)}&langpair=en|ar`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const j = await r.json();
      const t = j?.responseData?.translatedText;
      out.push(t && !/QUERY LENGTH|MYMEMORY WARNING/i.test(t) ? t : ch);
    } catch { out.push(ch); }
  }
  return out.join(" ");
}

function sentences(text) {
  return (text || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20);
}

export async function generateFallback(article, catLabelEn, catLabelAr, otherTitles = []) {
  const sents = sentences(article.snippet);
  const beginnerEn = [
    `This is news about artificial intelligence, which means computers that can learn and make decisions.`,
    `The headline says: "${article.title}".`,
    `It was reported by ${article.source} in the ${catLabelEn} category.`
  ].join(" ");
  const interEn = [beginnerEn, ...sents.slice(0, 2), `Stories like this show how AI is changing ${catLabelEn === "Civilian" ? "daily life and business" : "defense and security"}.`].join(" ");
  const expertEn = [`Headline: ${article.title}.`, ...sents.slice(0, 5), `Source: ${article.source}, published ${new Date(article.published).toDateString()}.`, `Watch for follow-up reports on how this develops and who responds.`].join(" ");

  const [title_ar, bAr, iAr, eAr] = await Promise.all([
    translate(article.title), translate(beginnerEn), translate(interEn), translate(expertEn)
  ]);

  const distractors = otherTitles.filter((t) => t !== article.title).slice(0, 2);
  while (distractors.length < 2) distractors.push(distractors.length ? "A new smartphone camera review" : "A recipe for a traditional dish");
  const distractorsAr = await Promise.all(distractors.map(translate));

  const mk = (qEn, qAr, correctEn, correctAr, wrongEn, wrongAr) => {
    const answer = Math.floor(Math.random() * 3);
    const cEn = [...wrongEn]; cEn.splice(answer, 0, correctEn);
    const cAr = [...wrongAr]; cAr.splice(answer, 0, correctAr);
    return { q_en: qEn, q_ar: qAr, choices_en: cEn, choices_ar: cAr, answer };
  };
  const q1 = mk("What is this lesson mainly about?", "عمّ يتحدث هذا الدرس بشكل أساسي؟", article.title, title_ar, distractors, distractorsAr);
  const q2 = mk("Which category does this news belong to?", "إلى أي فئة تنتمي هذه الأخبار؟", catLabelEn, catLabelAr,
    ["Sports results", "Weather forecast"], ["نتائج رياضية", "توقعات الطقس"]);
  const q3 = mk("Who reported this story?", "من نشر هذا الخبر؟", article.source, article.source,
    ["A cooking magazine", "A sports channel"], ["مجلة طبخ", "قناة رياضية"]);
  const qs = [q1, q2, q3];

  return {
    title_ar,
    levels: { beginner: { en: beginnerEn, ar: bAr }, intermediate: { en: interEn, ar: iAr }, expert: { en: expertEn, ar: eAr } },
    questions: { beginner: qs, intermediate: qs, expert: qs },
    terms: [{ term_en: "artificial intelligence", term_ar: "الذكاء الاصطناعي",
      def_ar: "برامج حاسوبية تتعلم من البيانات وتتخذ قرارات أو تنتج نصوصاً وصوراً.",
      def_en: "Computer programs that learn from data and make decisions or produce text and images." }]
  };
}

export async function generate(article, cat, otherTitles) {
  if (aiAvailable()) {
    try { return { ...(await generateWithClaude(article, cat.en)), engine: "claude" }; }
    catch (e) { console.warn(`[gen] Claude failed for "${article.title}": ${e.message}. Using fallback.`); }
  }
  return { ...(await generateFallback(article, cat.en, cat.ar, otherTitles)), engine: "fallback" };
}
