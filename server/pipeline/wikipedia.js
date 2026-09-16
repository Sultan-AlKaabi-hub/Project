// One-line definitions from Wikipedia. Arabic first, English fallback. No API key.
const cache = new Map();

async function summary(lang, term) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/ /g, "_"))}`;
  const r = await fetch(url, { headers: { "User-Agent": "Rasid/0.1 (student project)", accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const j = await r.json();
  if (j.type === "disambiguation" || !j.extract) return null;
  const first = j.extract.split(/(?<=[.!؟?])\s/)[0];
  return { term: j.title, lang, text: first.slice(0, 240), url: j.content_urls?.desktop?.page || null };
}

// Small English->Arabic map for terms we search on Arabic Wikipedia.
const AR_TITLES = {
  "artificial intelligence": "ذكاء اصطناعي",
  "machine learning": "تعلم آلي",
  "neural network": "شبكة عصبونية اصطناعية",
  "large language model": "نموذج لغوي كبير",
  "drone": "طائرة بدون طيار",
  "algorithm": "خوارزمية",
  "chatbot": "روبوت محادثة",
  "deep learning": "تعلم عميق",
  "robot": "روبوت",
  "semiconductor": "شبه موصل",
  "autonomous weapon": "سلاح ذاتي التشغيل",
  "cybersecurity": "أمن الحاسوب",
  "data center": "مركز بيانات",
  "computer vision": "رؤية حاسوبية",
  "generative artificial intelligence": "ذكاء اصطناعي توليدي"
};

export async function define(termEn) {
  const key = termEn.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let result = null;
  try {
    const arTitle = AR_TITLES[key];
    if (arTitle) result = await summary("ar", arTitle);
    if (!result) result = await summary("en", termEn);
  } catch (e) { console.warn(`[wiki] ${termEn}: ${e.message}`); }
  cache.set(key, result);
  return result;
}

export const KNOWN_TERMS = Object.keys(AR_TITLES);

// Pick terms that actually appear in a text.
export function termsIn(text) {
  const t = text.toLowerCase();
  return KNOWN_TERMS.filter((k) => t.includes(k)).slice(0, 3);
}
