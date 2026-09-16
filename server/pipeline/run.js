// Daily update: news -> definitions -> leveled lessons -> required set per level. Fully automatic.
import crypto from "node:crypto";
import { load, save, saveNow, today } from "../db.js";
import { CATEGORIES, fetchAll } from "./fetchNews.js";
import { define, termsIn } from "./wikipedia.js";
import { generate, LEVELS, aiAvailable } from "./generate.js";
import { fileURLToPath } from "node:url";

const idFor = (url) => crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);

export async function runUpdate({ perCategory = 2, log = console.log } = {}) {
  const db = load();
  const started = Date.now();
  const date = today();
  log(`[update] start ${date} engine=${aiAvailable() ? "claude" : "fallback"}`);

  const news = await fetchAll();
  const known = new Set(db.lessons.map((l) => l.id));
  const allTitles = Object.values(news).flat().map((a) => a.title);
  let added = 0;

  for (const cat of CATEGORIES) {
    const fresh = (news[cat.id] || []).filter((a) => !known.has(idFor(a.url))).slice(0, perCategory);
    for (const article of fresh) {
      try {
        const gen = await generate(article, cat, allTitles);
        // Wikipedia definitions for terms found in the expert text
        const found = termsIn(`${article.title} ${gen.levels.expert.en}`);
        const wiki = [];
        for (const t of found) {
          const d = await define(t);
          if (d) wiki.push({ term_en: t, term_ar: d.lang === "ar" ? d.term : t, def: d.text, lang: d.lang, url: d.url });
        }
        db.lessons.unshift({
          id: idFor(article.url),
          date, category: cat.id,
          title_en: article.title, title_ar: gen.title_ar,
          source: article.source, url: article.url, published: article.published,
          levels: gen.levels, questions: gen.questions,
          terms: gen.terms || [], wiki, engine: gen.engine
        });
        added++;
        log(`[update] + ${cat.id}: ${article.title.slice(0, 70)} (${gen.engine})`);
      } catch (e) {
        log(`[update] ! ${cat.id}: ${e.message}`);
      }
    }
  }

  // Keep the library bounded.
  db.lessons = db.lessons.slice(0, 400);

  // Required set per level: newest lesson per category (5 lessons).
  const req = {};
  for (const level of LEVELS) {
    req[level] = CATEGORIES.map((c) => db.lessons.find((l) => l.category === c.id)?.id).filter(Boolean);
  }
  db.required[date] = req;
  db.settings.lastUpdate = new Date().toISOString();
  db.settings.source = aiAvailable() ? "claude" : "fallback";
  db.updates.unshift({ date, at: db.settings.lastUpdate, added, ms: Date.now() - started });
  db.updates = db.updates.slice(0, 60);
  saveNow();
  log(`[update] done: +${added} lessons in ${Date.now() - started}ms`);
  return { added, total: db.lessons.length };
}

// Current required set (falls back to the latest one available).
export function currentRequired(level) {
  const db = load();
  const dates = Object.keys(db.required).sort().reverse();
  for (const d of dates) {
    const ids = db.required[d]?.[level];
    if (ids?.length) return { date: d, ids };
  }
  // Nothing generated yet: derive from whatever lessons exist.
  const ids = CATEGORIES.map((c) => db.lessons.find((l) => l.category === c.id)?.id).filter(Boolean);
  return { date: today(), ids };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runUpdate().then((r) => { console.log(r); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}
