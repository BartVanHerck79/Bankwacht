/* Bankwacht service worker — netwerk eerst, cache als terugval */
const CACHE = "bankwacht-2.6.0";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
  "./apple-touch-icon-v5.png", "./favicon-16-v5.png", "./favicon-32-v5.png",
  "./favicon-64-v5.png", "./icon-192-v5.png", "./icon-512-v5.png"];

/* geen skipWaiting hier: de app beslist zelf wanneer ze overschakelt,
   zodat er nooit midden in een wedstrijd herladen wordt */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
