// Service worker: only public app-shell files are cached; personal data always needs the server.
const SHELL = "rasid-shell-v18";
const SHELL_FILES = ["js/security.js", "js/agent-lab.js", "js/experiments.js", "js/experiment-model.js", "css/experiments.css", "js/passkeys.js", "js/vision.js", "js/vision-model.js", "js/site-guide.js", "css/vision.css", "js/local-tutor.js", "js/learning-ai.js", "css/learning-ai.css", "css/refinement.css", "js/card-nav.js", "vendor/gsap.min.js", "css/craft.css", "js/craft.js", "css/experience.css", "js/voice.js", "js/algorithm-model.js", "js/lab.js", "js/motion.js", "./", "index.html", "css/app.css", "css/portal.css", "css/hub.css", "css/campus.css", "js/campus.js", "art/valley.png", "js/hub.js", "js/i18n.js", "js/sprite.js", "js/intro.js", "js/faris.js", "js/app.js", "js/portal.js", "vendor/webauthn.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('rasid-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Personal APIs and downloads must never be stored in a shared device cache.
  if (url.pathname.startsWith("/api/") || url.pathname === "/apk") return;
  if (url.origin !== location.origin) return;
  if (url.pathname !== '/' && !SHELL_FILES.includes(url.pathname.slice(1))) return;
  // App shell: network first (so updates land immediately), cache when offline.
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((m) => m || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
