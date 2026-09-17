// Live AI news per category. Two kinds of sources, merged and sorted by time:
//  1. Direct RSS feeds from named news sites (filtered by keywords).
//  2. Google News search feeds (aggregates Reuters, AP, Bloomberg, Defense One, SCMP, etc.).
// No API key needed. Results are cached for 10 minutes for the live feed screen.
import Parser from "rss-parser";
import {newsApiArticles,newsApiStatus} from "./newsapi.js";

export const CATEGORIES = [
  { id: "civilian", ar: "مدني", en: "Civilian",
    query: '"artificial intelligence" OR "AI" (company OR health OR education OR OpenAI OR Google OR Anthropic) -military',
    keywords: ["ai", "artificial intelligence", "machine learning", "chatbot", "openai", "anthropic", "gemini", "llm"],
    feeds: [
      { name: "MIT Technology Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
      { name: "The Verge", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
      { name: "VentureBeat", url: "https://venturebeat.com/category/ai/feed/" }
    ] },
  { id: "us_military", ar: "الجيش الأمريكي", en: "US Military",
    query: '"artificial intelligence" (Pentagon OR "US military" OR "U.S. Army" OR DARPA OR "Department of Defense")',
    keywords: ["ai", "artificial intelligence", "autonomous", "machine learning", "algorithm"],
    feeds: [
      { name: "Defense One", url: "https://www.defenseone.com/rss/technology/" },
      { name: "Breaking Defense", url: "https://breakingdefense.com/feed/" },
      { name: "DefenseScoop", url: "https://defensescoop.com/feed/" }
    ] },
  { id: "russia_military", ar: "الجيش الروسي", en: "Russian Military",
    query: '"artificial intelligence" (Russia OR Russian) (military OR army OR drone OR defense)',
    keywords: ["russia", "russian", "kremlin", "moscow"],
    feeds: [
      { name: "The Moscow Times", url: "https://www.themoscowtimes.com/rss/news" },
      { name: "Defense One", url: "https://www.defenseone.com/rss/threats/" }
    ] },
  { id: "china_military", ar: "الجيش الصيني", en: "Chinese Military",
    query: '"artificial intelligence" (China OR Chinese OR PLA) (military OR army OR defense)',
    keywords: ["china", "chinese", "pla", "beijing", "taiwan"],
    feeds: [
      { name: "South China Morning Post", url: "https://www.scmp.com/rss/4/feed" },
      { name: "Defense One", url: "https://www.defenseone.com/rss/threats/" }
    ] },
  { id: "other", ar: "مناطق أخرى", en: "Other Regions",
    query: '"artificial intelligence" (EU OR Europe OR "Middle East" OR Saudi OR UAE OR NATO OR Israel OR India) (military OR government OR policy)',
    keywords: ["ai", "artificial intelligence"],
    feeds: [
      { name: "Euractiv", url: "https://www.euractiv.com/sections/digital/feed/" },
      { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
      { name: "Arab News", url: "https://www.arabnews.com/rss.xml" }
    ] }
];

const parser = new Parser({ timeout: 12000, headers: { "User-Agent": "Rasid/0.1 (+student project)", accept: "application/rss+xml, application/xml, text/xml, */*" } });

function stripHtml(s = "") {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
const norm = (it, category, sourceName) => ({
  category,
  title: (it.title || "").trim(),
  source: sourceName,
  url: it.link,
  published: it.isoDate || it.pubDate || new Date().toISOString(),
  snippet: stripHtml(it.contentSnippet || it.content || it.summary || "").slice(0, 600)
});

async function googleNews(cat, limit) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(cat.query + " when:3d")}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, limit).map((it) => {
    const m = /^(.*)\s-\s([^-]+)$/.exec(it.title || "");
    const n = norm(it, cat.id, (m ? m[2] : it.creator || "News").trim());
    n.title = (m ? m[1] : it.title || "").trim();
    n.via = "Google News";
    return n;
  });
}

async function directFeed(cat, feed, limit) {
  const f = await parser.parseURL(feed.url);
  const kw = cat.keywords;
  const needsAi = !["civilian", "us_military"].includes(cat.id);
  return (f.items || [])
    .filter((it) => {
      const t = `${it.title || ""} ${it.contentSnippet || ""}`.toLowerCase();
      const hit = kw.some((k) => new RegExp(`\\b${k}\\b`, "i").test(t));
      const ai = /\b(ai|artificial intelligence|machine learning|autonomous|algorithm|drone)\b/i.test(t);
      return hit && (!needsAi || ai);
    })
    .slice(0, limit)
    .map((it) => norm(it, cat.id, feed.name));
}

const cache = new Map(); // category -> { at, items }
const TTL = 10 * 60 * 1000;

export async function fetchCategory(cat, limit = 8, { fresh = false } = {}) {
  const c = cache.get(cat.id);
  if (!fresh && c && Date.now() - c.at < TTL) return c.items;
  const jobs = [newsApiArticles(cat.id),googleNews(cat, limit).catch((e) => { console.warn(`[news] google/${cat.id}: ${e.message}`); return []; }),
    ...cat.feeds.map((f) => directFeed(cat, f, 4).catch((e) => { console.warn(`[news] ${f.name}: ${e.message}`); return []; }))];
  const results = (await Promise.all(jobs)).flat();
  const seen = new Set();
  const items = results
    .filter((a) => { const k = a.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60); return a.title && a.url && !seen.has(a.url) && !seen.has(k) && seen.add(a.url) && seen.add(k); })
    .filter((a) => Date.now() - new Date(a.published).getTime() < 7 * 24 * 3600 * 1000)
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, limit * 2);
  cache.set(cat.id, { at: Date.now(), items });
  return items;
}

export async function fetchAll(opts) {
  const out = {};
  for (const cat of CATEGORIES) {
    try { out[cat.id] = await fetchCategory(cat, 8, opts); }
    catch (e) { console.warn(`[news] ${cat.id} failed: ${e.message}`); out[cat.id] = []; }
  }
  return out;
}

export function sourceList() {
  return CATEGORIES.map((c) => ({ id: c.id, ar: c.ar, en: c.en, sources: [...(c.id === "civilian" && newsApiStatus().enabled ? ["NewsAPI (publisher headlines)"] : []), "Google News (Reuters, AP, Bloomberg, and others)", ...c.feeds.map((f) => f.name)] }));
}
