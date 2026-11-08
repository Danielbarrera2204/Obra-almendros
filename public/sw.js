// Service worker mínimo: deja la app disponible sin internet.
// Si algún día cambias algo y no se ve, sube el número de versión.
const VERSION = 'obra-cubiertas-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Página: primero la red (así siempre ve la última versión), si no hay internet usa la copia.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Archivos (JS, CSS, fuentes, imágenes): copia guardada y se actualiza en segundo plano.
  event.respondWith(
    caches.match(req).then((hit) => {
      const red = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || red;
    })
  );
});
