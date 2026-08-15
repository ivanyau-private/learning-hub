/* Learning Hub service worker — offline-first for the app shell.
   Bump CACHE when you deploy new content. */
const CACHE = "learning-hub-v3";
const ASSETS = [
  "./", "./index.html", "./ai.html", "./english.html",
  "./assets/theme.css", "./assets/ui.js", "./assets/hub.js",
  "./assets/plans.js", "./assets/day.js", "./assets/ref.js", "./assets/ask.js", "./assets/dashboard.js",
  "./assets/data-ai.js", "./assets/data-eng.js", "./assets/ref-eng.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // never cache the GitHub API — sync must always hit the network
  if (url.hostname === "api.github.com" || url.hostname === "api.anthropic.com" || e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  // network-first so a redeploy is picked up, cache as offline fallback
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
