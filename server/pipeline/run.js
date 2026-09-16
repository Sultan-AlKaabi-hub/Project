// Daily update: news -> read the real articles -> definitions -> leveled lessons + Arabic article -> required set per level.
import crypto from "node:crypto";
import { load, saveNow, today } from "../db.js";
import { CATEGORIES, fetchAll } from "./fetchNews.js";
import { define, termsIn } from "./wikipedia.js";
import { generate, LEVELS, aiAvailable, keySentences } from "./generate.js";
import { fetchArticle, favicon, translate, translationAvailable } from "./article.js";
import { fileURLToPath } from "node:url";

const LESSON_VERSION = 3;
const idFor = (url) => crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);

function buildPool(db, exceptUrl) {
  const others = db.lessons.filter((l) => l.url !== exceptUrl && l.article?.text).slice(0, 30);
  const sentences = others.flatMap((l) => keySentences(l.article.text, 2));
  const JUNK = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|AP Photo|Getty Images|Reuters|Photo|Image|Credit|Rear Adm|Gen|Lt|Col|Mr|Mrs|Ms|Dr|New|Chief|President|Minister|Secretary|Officials?)$/i;
  const entities = [...new Set(others.flatMap((l) => (l.article.text.match(/\b[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){1,2}\b/g) || []).filter((e) => e.length > 6 && !JUNK.test(e)).slice(0, 6)))];
  const numbers = [...new Set(others.flatMap((l) => (l.article.text.match(/\b\d[\d,.]*\s?(?:%|percent|million|billion)?\b/g) || []).slice(0, 4)))];
  const titles = others.map((l) => l.title_en);
  return { sentences, entities, numbers, titles };
}

async function buildLesson(db, article, cat, log) {
  const read = await fetchArticle(article.url);
  const text = read?.ok ? read.text : (article.snippet || "");
  const gen = await generate(article, cat, text, buildPool(db, article.url));
  const found = termsIn(`${article.title} ${gen.levels.expert.en}`);
  const wiki = [];
  for (const t of found) { const d = await define(t); if (d) wiki.push({ term_en: t, term_ar: d.lang === "ar" ? d.term : t, def: d.text, lang: d.lang, url: d.url }); }
  const finalUrl = read?.url || article.url;
  return {
    id: idFor(article.url), version: LESSON_VERSION,
    date: today(), category: cat.id,
    title_en: article.title, title_ar: gen.title_ar,
    source: read?.site || article.source, url: finalUrl, published: article.published,
    image: read?.image || null, icon: favicon(finalUrl),
    article: { ok: Boolean(read?.ok), text: text, paragraphs: read?.ok ? read.paragraphs : [], text_ar: gen.article_ar || "", words: read?.words || 0 },
    levels: gen.levels, questions: gen.questions, terms: gen.terms || [], wiki, engine: gen.engine, arMissing: Boolean(gen.arMissing)
  };
}

export async function runUpdate({ perCategory = 2, regenerate = 6, log = console.log } = {}) {
  const db = load();
  const started = Date.now();
  const date = today();
  log(`[update] start ${date} engine=${aiAvailable() ? "claude" : "fallback"}`);

  const news = await fetchAll();
  const known = new Set(db.lessons.map((l) => l.id));
  let added = 0, refreshed = 0;

  for (const cat of CATEGORIES) {
    const fresh = (news[cat.id] || []).filter((a) => !known.has(idFor(a.url))).slice(0, perCategory);
    for (const article of fresh) {
      try {
        const lesson = await buildLesson(db, article, cat, log);
        if (!lesson.article.ok && (article.snippet || "").length < 200) { log(`[update] skip (no text): ${article.title.slice(0, 60)}`); continue; }
        db.lessons.unshift(lesson); added++;
        log(`[update] + ${cat.id}: ${article.title.slice(0, 60)} (${lesson.engine}, ${lesson.article.words} words${lesson.image ? ", image" : ""})`);
      } catch (e) { log(`[update] ! ${cat.id}: ${e.message}`); }
    }
  }

  // Upgrade older lessons (built from snippets only) to the new article-based format, a few per run.
  const stale = db.lessons.filter((l) => (l.version || 1) < LESSON_VERSION && l.engine !== "seed").slice(0, regenerate);
  for (const old of stale) {
    const cat = CATEGORIES.find((c) => c.id === old.category);
    try {
      const lesson = await buildLesson(db, { title: old.title_en, source: old.source, url: old.url, published: old.published, snippet: old.levels?.expert?.en || "" }, cat, log);
      lesson.id = old.id; lesson.date = old.date;
      db.lessons[db.lessons.indexOf(old)] = lesson; refreshed++;
      log(`[update] ~ rebuilt: ${old.title_en.slice(0, 60)} (${lesson.article.words} words)`);
    } catch (e) { log(`[update] ! rebuild ${old.id}: ${e.message}`); old.version = LESSON_VERSION; }
  }

  // Catch-up: lessons whose Arabic could not be produced earlier (free translators were rate limited).
  let fixed = 0;
  for (const l of db.lessons.filter((x) => x.arMissing).slice(0, 4)) {
    if (!translationAvailable()) break;
    try {
      const [t, b, i, e] = await Promise.all([translate(l.title_en), translate(l.levels.beginner.en), translate(l.levels.intermediate.en), translate(l.levels.expert.en)]);
      if ([t, b, i, e].some((x) => x === null)) break;
      l.title_ar = t; l.levels.beginner.ar = b; l.levels.intermediate.ar = i; l.levels.expert.ar = e;
      for (const lv of LEVELS) for (const q of l.questions[lv]) { const c = await Promise.all(q.choices_en.map((x) => translate(x))); if (c.every((x) => x !== null)) q.choices_ar = c; }
      const full = l.article?.text || ""; const ar = full && full.length <= 7000 ? await translate(full) : await translate(keySentences(full, 10).join(" "));
      if (ar) l.article.text_ar = ar;
      l.arMissing = false; fixed++;
      log(`[update] ar filled: ${l.title_en.slice(0, 60)}`);
    } catch (e) { log(`[update] ! ar fill ${l.id}: ${e.message}`); break; }
  }
  if (fixed) log(`[update] Arabic filled for ${fixed} lessons`);

  db.lessons = db.lessons.slice(0, 400);
  const req = {};
  for (const level of LEVELS) req[level] = CATEGORIES.map((c) => db.lessons.find((l) => l.category === c.id)?.id).filter(Boolean);
  db.required[date] = req;
  db.settings.lastUpdate = new Date().toISOString();
  db.settings.source = aiAvailable() ? "claude" : "fallback";
  db.updates.unshift({ date, at: db.settings.lastUpdate, added, refreshed, ms: Date.now() - started });
  db.updates = db.updates.slice(0, 60);
  saveNow();
  log(`[update] done: +${added} new, ~${refreshed} rebuilt in ${Date.now() - started}ms`);
  return { added, refreshed, total: db.lessons.length };
}

export function currentRequired(level) {
  const db = load();
  const dates = Object.keys(db.required).sort().reverse();
  for (const d of dates) { const ids = db.required[d]?.[level]; if (ids?.length) return { date: d, ids }; }
  const ids = CATEGORIES.map((c) => db.lessons.find((l) => l.category === c.id)?.id).filter(Boolean);
  return { date: today(), ids };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runUpdate().then((r) => { console.log(r); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}
