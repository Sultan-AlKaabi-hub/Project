// Turn one real article into three leveled Arabic+English lessons, an Arabic version of the article, and topic questions.
// Primary: Claude (ANTHROPIC_API_KEY or `ant auth login`). Fallback: extractive summaries + free translation + fact questions from the text.
import Anthropic from "@anthropic-ai/sdk";
import { translate } from "./article.js";

export const LEVELS = ["beginner", "intermediate", "expert"];
const MODEL = process.env.RASID_MODEL || "claude-opus-5";

let client = null;
function getClient() { if (client) return client; try { client = new Anthropic(); } catch { client = null; } return client; }
export function aiAvailable() { return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.RASID_FORCE_AI); }

const Q = {
  type: "array", minItems: 3, maxItems: 3,
  items: { type: "object", additionalProperties: false, required: ["q_ar", "q_en", "choices_ar", "choices_en", "answer"],
    properties: { q_ar: { type: "string" }, q_en: { type: "string" }, choices_ar: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
      choices_en: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } }, answer: { type: "integer", minimum: 0, maximum: 2 } } }
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["title_ar", "article_ar", "levels", "questions", "terms"],
  properties: {
    title_ar: { type: "string" },
    article_ar: { type: "string" },
    levels: { type: "object", additionalProperties: false, required: LEVELS,
      properties: Object.fromEntries(LEVELS.map((l) => [l, { type: "object", additionalProperties: false, required: ["ar", "en"], properties: { ar: { type: "string" }, en: { type: "string" } } }])) },
    questions: { type: "object", additionalProperties: false, required: LEVELS, properties: Object.fromEntries(LEVELS.map((l) => [l, Q])) },
    terms: { type: "array", maxItems: 3, items: { type: "object", additionalProperties: false, required: ["term_en", "term_ar", "def_ar", "def_en"],
      properties: { term_en: { type: "string" }, term_ar: { type: "string" }, def_ar: { type: "string" }, def_en: { type: "string" } } } }
  }
};

const SYSTEM = `You write learning lessons in Modern Standard Arabic (with an English twin) for an app that teaches non-technical Arabic speakers about artificial intelligence news. You receive the full article text. Rules:
- article_ar: a faithful, complete Arabic rendering of the article (rewrite, not word-for-word), keeping every fact, name and number. Paragraphs separated by blank lines.
- Beginner: 3 very plain sentences about what happened and why a normal person should care. No jargon. Assume the reader has never heard of AI.
- Intermediate: one paragraph (4-6 sentences) with context: who, what, why it matters.
- Expert: a full summary (7-10 sentences): what happened, the actors, the technology involved, implications, and what to watch next.
- Never invent facts. Everything must come from the article.
- Questions: 3 multiple-choice questions per level ABOUT THE CONTENT (the AI technology, the actors, the decisions, the numbers, the consequences). Never ask who published the article or what category it is in. Each question must be answerable from that level's text. 3 choices, exactly one correct, distractors plausible but wrong. Beginner questions simple, expert questions demanding.
- Terms: up to 3 AI or military terms that appear in the lesson, each with a one-sentence definition.
- Arabic must read naturally. English is the twin, same meaning.`;

export async function generateWithClaude(article, catLabelEn, text) {
  const c = getClient();
  if (!c) throw new Error("no client");
  const stream = c.messages.stream({
    model: MODEL, max_tokens: 12000, system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: `Category: ${catLabelEn}\nTitle: ${article.title}\nSource: ${article.source}\nPublished: ${article.published}\nURL: ${article.url}\n\nARTICLE TEXT:\n${(text || article.snippet || "").slice(0, 24000)}\n\nProduce the JSON described by the schema.` }]
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("refused");
  return JSON.parse(msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
}

// ---------- Fallback: extractive summaries and fact questions ----------
const STOP = new Set("the a an of to in on for and or is are was were be been by with as at from that this it its their his her they he she we you our not but have has had will would can could said says also more than about over into after before which who what when where while new one two three".split(" "));
export function sentences(text) {
  return (text || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z"“])/).map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 320 && !/\?$/.test(s));
}
export function keySentences(text, n) {
  const sents = sentences(text);
  if (!sents.length) return [];
  const freq = {};
  for (const s of sents) for (const w of s.toLowerCase().match(/[a-z][a-z'-]+/g) || []) if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const scored = sents.map((s, i) => { const ws = (s.toLowerCase().match(/[a-z][a-z'-]+/g) || []).filter((w) => !STOP.has(w)); const sc = ws.reduce((a, w) => a + freq[w], 0) / Math.sqrt(ws.length + 1); return { s, i, sc: sc * (i < 3 ? 1.3 : 1) }; });
  return scored.sort((a, b) => b.sc - a.sc).slice(0, n).sort((a, b) => a.i - b.i).map((x) => x.s);
}
const JUNK = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|AP Photo|Getty Images|Reuters|Photo|Image|Credit|Rear Adm|Gen|Lt|Col|Mr|Mrs|Ms|Dr|New|One|Two|First|Last|Yes|No|Also|However|Meanwhile|According|Earlier|Later|Now|Here|There|Chief|President|Minister|Secretary|Officials?)$/i;
const entities = (s) => [...new Set((s.replace(/[“”"]/g, "").match(/\b(?:[A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|and|for)?\s*[A-Z][a-zA-Z'’-]+){0,3})\b/g) || [])
  .map((e) => e.trim()).filter((e) => e.length > 4 && !JUNK.test(e) && !/^(The|This|That|These|Those|In|On|At|But|And|For|With|From|After|Before|When|While|It|He|She|They|We|You|A|An|As|By|To|Of|If|So|Or)\b/.test(e)))]
  .sort((a, b) => (b.includes(" ") ? 1 : 0) - (a.includes(" ") ? 1 : 0));
const numbers = (s) => [...new Set(s.match(/\b\d[\d,.]*\s?(?:%|percent|million|billion|thousand|km|miles|years?|days?)?\b/g) || [])].filter((n) => n.length > 1);
const shuffle3 = (correct, wrong) => { const answer = Math.floor(Math.random() * 3); const c = wrong.slice(0, 2); c.splice(answer, 0, correct); return { c, answer }; };
const shorten = (s, n = 140) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);

// pool: { sentences: [...other articles' key sentences], entities: [...], numbers: [...] }
export async function generateFallback(article, cat, text, pool) {
  const full = text && text.length > 300 ? text : (article.snippet || article.title);
  const keys = keySentences(full, 10);
  const pick = (arr, n, avoid = []) => arr.filter((x) => !avoid.includes(x)).sort(() => Math.random() - 0.5).slice(0, n);

  const beginnerEn = [`This article is about ${cat.en === "Civilian" ? "how artificial intelligence is changing everyday life and business" : "artificial intelligence and " + cat.en.toLowerCase() + " matters"}.`, ...keys.slice(0, 2).map((s) => shorten(s, 200))].join(" ");
  const interEn = keys.slice(0, 5).join(" ");
  const expertEn = keys.slice(0, 9).join(" ") + (article.snippet && !full.includes(article.snippet.slice(0, 40)) ? " " + article.snippet : "");

  const fullForAr = full.length <= 7000 ? full : keys.join(" ");
  const tr = async (t) => (await translate(t)) ?? null;
  const title_ar0 = await tr(article.title);
  const [bAr, iAr, eAr, article_ar0] = title_ar0 === null ? [null, null, null, null] : await Promise.all([tr(beginnerEn), tr(interEn), tr(expertEn), tr(fullForAr)]);
  const arMissing = [title_ar0, bAr, iAr, eAr].some((x) => x === null);
  const title_ar = title_ar0 ?? article.title, article_ar = article_ar0 ?? "";

  // Questions about the content.
  const qs = [];
  const arts = { en: [], ar: [] };
  // 1) Which statement appears in the article?
  const own = pick(keys, 1)[0];
  if (own) {
    const wrong = pick(pool.sentences, 2, keys).map((s) => shorten(s));
    while (wrong.length < 2) wrong.push(wrong.length ? "The article is about a new sports stadium." : "The article is about a cooking competition.");
    const { c, answer } = shuffle3(shorten(own), wrong);
    qs.push({ q_en: "Which of these statements is made in this article?", q_ar: "أي العبارات التالية وردت في هذا المقال؟", choices_en: c, answer });
  }
  // 2) Entity cloze
  const entSent = keys.find((s) => entities(s).length && !s.startsWith(entities(s)[0]));
  if (entSent) {
    const ent = entities(entSent)[0];
    const blanked = shorten(entSent.replace(ent, "_____"), 200);
    const wrong = pick(pool.entities.filter((e) => e !== ent && !entSent.includes(e) && !JUNK.test(e) && e.includes(" ") === ent.includes(" ")), 2);
    const generic = ["World Health Organization", "European Space Agency", "International Olympic Committee", "United Nations", "Ministry of Sports"];
    while (wrong.length < 2) { const gsel = generic.find((x) => !wrong.includes(x) && x !== ent); wrong.push(gsel); }
    const { c, answer } = shuffle3(ent, wrong);
    qs.push({ q_en: `Fill in the blank from the article: "${blanked}"`, q_ar: `أكمل الفراغ كما ورد في المقال: "${blanked}"`, choices_en: c, answer });
  }
  // 3) Number cloze or main topic
  const numSent = keys.find((s) => numbers(s).length);
  if (numSent && qs.length < 3) {
    const num = numbers(numSent)[0];
    const blanked = shorten(numSent.replace(num, "_____"), 200);
    const wrong = pick(pool.numbers.filter((n) => n !== num), 2);
    while (wrong.length < 2) wrong.push(wrong.length ? "12" : "300");
    const { c, answer } = shuffle3(num, wrong);
    qs.push({ q_en: `Which number completes this sentence from the article? "${blanked}"`, q_ar: `أي رقم يكمل هذه الجملة من المقال؟ "${blanked}"`, choices_en: c, answer });
  }
  if (qs.length < 3) {
    const words = (t) => new Set(t.toLowerCase().match(/[a-z]{4,}/g) || []);
    const mine = words(article.title);
    const wrong = pick((pool.titles || []).filter((t) => [...words(t)].filter((w) => mine.has(w)).length < 2), 2);
    while (wrong.length < 2) wrong.push(wrong.length ? "A new smartphone camera review" : "A recipe for a traditional dish");
    const { c, answer } = shuffle3(article.title, wrong);
    qs.push({ q_en: "What is this article mainly about?", q_ar: "عمّ يتحدث هذا المقال بشكل أساسي؟", choices_en: c, answer });
  }
  // Arabic choices via translation (cached per string by the translator's chunking; small strings).
  for (const q of qs) { const c = arMissing ? null : await Promise.all(q.choices_en.map((x) => translate(x))); q.choices_ar = c && c.every((x) => x !== null) ? c : q.choices_en; }

  // Level differentiation: beginner gets the topic + statement questions, expert gets the cloze ones. Share when short.
  const byLevel = { beginner: qs, intermediate: qs, expert: qs };
  return {
    title_ar, article_ar, arMissing,
    levels: { beginner: { en: beginnerEn, ar: bAr ?? beginnerEn }, intermediate: { en: interEn, ar: iAr ?? interEn }, expert: { en: expertEn, ar: eAr ?? expertEn } },
    questions: byLevel,
    terms: [{ term_en: "artificial intelligence", term_ar: "الذكاء الاصطناعي", def_ar: "برامج حاسوبية تتعلم من البيانات وتتخذ قرارات أو تنتج نصوصاً وصوراً.", def_en: "Computer programs that learn from data and make decisions or produce text and images." }]
  };
}

export async function generate(article, cat, text, pool) {
  if (aiAvailable()) {
    try { return { ...(await generateWithClaude(article, cat.en, text)), engine: "claude" }; }
    catch (e) { console.warn(`[gen] Claude failed for "${article.title}": ${e.message}. Using fallback.`); }
  }
  return { ...(await generateFallback(article, cat, text, pool)), engine: "fallback" };
}
