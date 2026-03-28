/* ═══════════════════════════════════════════════════
   SERVICE WORKER — La Parole Apprivoisée v2.0
   Stratégie : Cache First + Pré-chargement Bible complet
═══════════════════════════════════════════════════ */

const CACHE_NAME = 'parole-apprivoisee-v2';
const BIBLE_CACHE = 'parole-bible-v2';
const FONT_CACHE = 'parole-fonts-v2';

/* Ressources de l'application (coquille) */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;500;600&display=swap',
];

/* 66 livres à pré-charger */
const BIBLE_URLS = [];
for (let i = 1; i <= 66; i++) {
  BIBLE_URLS.push(`https://api.getbible.net/v2/lsg/${i}.json`);
}

/* ═══════════════════════
   INSTALL — pré-cache la coquille
═══════════════════════ */
self.addEventListener('install', event => {
  console.log('[SW] Install v2');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Shell cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ═══════════════════════
   ACTIVATE — nettoyer anciens caches
═══════════════════════ */
self.addEventListener('activate', event => {
  console.log('[SW] Activate v2');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k !== CACHE_NAME && k !== BIBLE_CACHE && k !== FONT_CACHE)
        .map(k => {
          console.log('[SW] Suppression ancien cache:', k);
          return caches.delete(k);
        })
    )).then(() => self.clients.claim())
  );
});

/* ═══════════════════════
   FETCH — Cache First
═══════════════════════ */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Polices Google Fonts → Cache dédié
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstStrategy(event.request, FONT_CACHE));
    return;
  }

  // API Bible → Cache Bible dédié
  if (url.includes('api.getbible.net')) {
    event.respondWith(cacheFirstStrategy(event.request, BIBLE_CACHE));
    return;
  }

  // Coquille app
  if (url.includes(self.location.origin) || url.endsWith('.html') || url.endsWith('.js') || url.endsWith('.json')) {
    event.respondWith(cacheFirstStrategy(event.request, CACHE_NAME));
    return;
  }

  // Par défaut : network
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const network = await fetch(request);
    if (network && network.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, network.clone());
    }
    return network;
  } catch (err) {
    console.warn('[SW] Network failed for:', request.url);
    return new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

/* ═══════════════════════
   MESSAGE — Pré-charger la Bible complète
   Appelé depuis l'app avec postMessage({type:'PRELOAD_BIBLE'})
═══════════════════════ */
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'PRELOAD_BIBLE') {
    console.log('[SW] Début pré-chargement Bible complète');
    const cache = await caches.open(BIBLE_CACHE);
    let loaded = 0;
    const total = BIBLE_URLS.length;

    for (const url of BIBLE_URLS) {
      const existing = await cache.match(url);
      if (!existing) {
        try {
          const res = await fetch(url);
          if (res && res.status === 200) {
            await cache.put(url, res);
          }
          await new Promise(r => setTimeout(r, 50)); // Délai poli
        } catch (e) {
          console.warn('[SW] Impossible de charger:', url);
        }
      }
      loaded++;
      // Notifier la progression
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ loaded, total, pct: Math.round((loaded/total)*100) });
      }
    }
    console.log('[SW] Bible pré-chargée:', loaded + '/' + total);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ done: true, loaded, total });
    }
  }
});
