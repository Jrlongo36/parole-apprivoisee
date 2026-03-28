/* ═══════════════════════════════════════════════════
   LA PAROLE APPRIVOISÉE — SERVICE WORKER v2.0
   Cache offline complet : HTML, assets, Bible API
═══════════════════════════════════════════════════ */

const CACHE_NAME = 'lpa-v2';
const BIBLE_CACHE = 'lpa-bible-v2';

// Fichiers à mettre en cache immédiatement à l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
];

// ─── INSTALLATION ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // On cache les assets statiques, on ignore les erreurs individuelles
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn('SW: cache miss for', url, e)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATION ────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== BIBLE_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH STRATEGY ────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bible API → Cache First, puis réseau, puis erreur offline
  if (url.hostname === 'api.getbible.net') {
    event.respondWith(
      caches.open(BIBLE_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request)
            .then(response => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => new Response(
              JSON.stringify({ error: 'offline', chapters: {} }),
              { headers: { 'Content-Type': 'application/json' } }
            ));
        })
      )
    );
    return;
  }

  // Google Fonts → Network First avec fallback cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CDN (confetti, etc.) → Cache First
  if (url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // App shell → Cache First avec fallback réseau
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (response.ok && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
