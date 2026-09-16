// Service worker: app shell cached, API responses cached for offline reading (yesterday's lessons).
const SHELL = "rasid-shell-v3";
const DATA = "rasid-data-v3";
const SHELL_FILES = ["/", "/index.html", "/css/app.css", "/js/i18n.js", "/js/sprite.js", "/js/intro.js", "/js/faris.js", "/js/app.js", "/vendor/webauthn.js", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Read-only content endpoints: network first, cache fallback.
  if (url.pathname.startsWith("/api/")) {
    if (!/^\/api\/(content|lesson\/|me|status)/.test(url.pathname)) return;
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(DATA).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((m) => m || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "content-type": "application/json" } }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // App shell: network first (so updates land immediately), cache when offline.
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((m) => m || caches.match("/index.html"))));
});
