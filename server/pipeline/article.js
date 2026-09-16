// Read the real article behind a headline: resolve redirects, extract the main text and the lead image.
// Also: free English -> Arabic translation (unofficial Google endpoint first, MyMemory as fallback).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const cache = new Map(); // url -> article

function decodeEntities(s = "") {
  return s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&[a-z]+;/g, " ");
}
const clean = (s) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return { html: await r.text(), url: r.url };
}

// Google News RSS links are encoded. Decode them the way Google's own page does: read the signature and
// timestamp from the interstitial page, then ask the batchexecute endpoint for the real URL.
const resolved = new Map();
export async function resolveUrl(url) {
  if (!/news\.google\.com/.test(url)) return url;
  if (resolved.has(url)) return resolved.get(url);
  let out = null;
  try {
    const id = (url.match(/\/articles\/([^?/]+)/) || [])[1];
    const { html } = await get(url);
    const sg = (html.match(/data-n-a-sg="([^"]+)"/) || [])[1];
    const ts = (html.match(/data-n-a-ts="([^"]+)"/) || [])[1];
    if (id && sg && ts) {
      const inner = JSON.stringify(["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "US:en", null, 180, null, null, null, null, null, 0, null, null, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, null, 0], id, Number(ts), sg]);
      const body = "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]]));
      const r = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": UA }, body, signal: AbortSignal.timeout(15000) });
      const txt = await r.text();
      const line = txt.split("\n").find((l) => l.includes("garturlres") || l.includes("Fbv4je"));
      if (line) { const outer = JSON.parse(line); const payload = JSON.parse(outer[0][2]); const real = payload[1]; if (typeof real === "string" && /^https?:/.test(real)) out = real; }
    }
    if (!out) { const m = html.match(/data-n-au="([^"]+)"/); if (m) out = decodeEntities(m[1]); }
  } catch (e) { console.warn("[article] resolve failed:", e.message); }
  resolved.set(url, out);
  return out;
}

function meta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i");
  const m = html.match(re) || html.match(re2);
  return m ? decodeEntities(m[1]) : null;
}

export function extract(html, url) {
  const image = meta(html, "og:image") || meta(html, "twitter:image");
  const site = meta(html, "og:site_name") || new URL(url).hostname.replace(/^www\./, "");
  const title = meta(html, "og:title") || clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const description = meta(html, "og:description") || meta(html, "description") || "";
  let body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ");
  // Prefer <article>, else the container with the most paragraph text.
  const articles = [...body.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
  let scope = articles.sort((a, b) => b.length - a.length)[0] || body;
  const paras = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1]))
    .filter((p) => p.length > 60 && !/cookie|subscribe|newsletter|sign up|all rights reserved|©/i.test(p));
  const text = paras.join("\n\n");
  return { title, description, image, site, paragraphs: paras, text, words: text.split(/\s+/).length };
}

export async function fetchArticle(url) {
  if (cache.has(url)) return cache.get(url);
  let out = null;
  try {
    const real = await resolveUrl(url);
    if (real) {
      const { html, url: finalUrl } = await get(real);
      const a = extract(html, finalUrl);
      if (a.words > 80) out = { ...a, url: finalUrl, ok: true };
      else out = { ...a, url: finalUrl, ok: false };
    }
  } catch (e) { out = { ok: false, error: e.message }; }
  cache.set(url, out);
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return out;
}

export const favicon = (url) => { try { return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`; } catch { return null; } };

// ---------- translation (free endpoints, rate limited; returns null when nothing works) ----------
const tcache = new Map();
const blocked = { gtx: 0, mm: 0 }; // timestamp until which an endpoint is skipped after a 429
async function gtx(text) {
  if (Date.now() < blocked.gtx) throw new Error("gtx cooling down");
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
  if (r.status === 429) { blocked.gtx = Date.now() + 15 * 60 * 1000; throw new Error("gtx 429"); }
  if (!r.ok) throw new Error(`gtx ${r.status}`);
  const j = await r.json();
  return j[0].map((x) => x[0]).join("");
}
async function mymemory(text) {
  if (Date.now() < blocked.mm) throw new Error("mymemory cooling down");
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`, { signal: AbortSignal.timeout(12000) });
  const j = await r.json().catch(() => null);
  const t = j?.responseData?.translatedText;
  if (r.status === 429 || /USED ALL AVAILABLE|QUERY LENGTH|MYMEMORY WARNING|INVALID/i.test(t || "")) { blocked.mm = Date.now() + 60 * 60 * 1000; throw new Error("mymemory quota"); }
  if (!t) throw new Error("mymemory");
  return t;
}
export function translationAvailable() { return Date.now() >= blocked.gtx || Date.now() >= blocked.mm; }
export async function translate(text) {
  if (!text) return "";
  if (tcache.has(text)) return tcache.get(text);
  const chunks = [];
  let cur = "";
  for (const sent of text.split(/(?<=[.!?])\s+|\n\n/)) {
    if ((cur + " " + sent).length > 1400) { chunks.push(cur); cur = sent; } else cur = cur ? cur + " " + sent : sent;
  }
  if (cur) chunks.push(cur);
  const out = [];
  for (const ch of chunks) {
    let t = null;
    try { t = await gtx(ch); } catch { try { t = await mymemory(ch.slice(0, 480)); } catch {} }
    if (t === null) return null; // give up on the whole text; caller keeps English and retries later
    out.push(t);
  }
  const result = out.join(" ");
  tcache.set(text, result);
  if (tcache.size > 2000) tcache.delete(tcache.keys().next().value);
  return result;
}
