// La Parole Apprivoisée — Service Worker v2.0
// Optimisé pour Vercel : cache statique + API getbible.net

const CACHE_NAME = 'lpa-v2';
const API_CACHE = 'lpa-bible-v2';

// Ressources statiques à précacher immédiatement
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Le JSON Bible sera mis en cache dynamiquement s'il existe
];

// ─── INSTALL ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Précache les assets statiques (best-effort)
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => {/* ignore si manquant */})
        )
      );
    }).then(() => {
      // Essaie de précacher le JSON Bible si présent sur Vercel
      return caches.open(API_CACHE).then(cache =>
        cache.add('./segond_1910.json').catch(() => {
          // Normal si le fichier n'est pas déployé
          console.log('[SW] segond_1910.json absent du déploiement — API fallback actif');
        })
      );
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH STRATEGY ───────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Fichier JSON Bible (gros fichier) → Cache First
  if(url.pathname.includes('segond_1910.json')){
    event.respondWith(
      caches.open(API_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if(cached) return cached;
          return fetch(event.request).then(response => {
            if(response.ok){
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // 2. API getbible.net → Network First + Cache Fallback
  if(url.hostname === 'api.getbible.net'){
    event.respondWith(
      caches.open(API_CACHE).then(cache =>
        fetch(event.request)
          .then(response => {
            if(response.ok){
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }

  // 3. Google Fonts → Stale While Revalidate
  if(url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')){
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => null);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // 4. Assets statiques → Cache First
  if(
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ){
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if(cached) return cached;
          return fetch(event.request).then(response => {
            if(response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 5. Tout le reste → Network avec fallback cache
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});

// ─── MESSAGE HANDLER ──────────────────────────────
// Permet à l'app de demander le précachage d'un livre
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'CACHE_BOOK'){
    const bookUrl = `https://api.getbible.net/v2/lsg/${event.data.bookNum}.json`;
    caches.open(API_CACHE).then(cache => cache.add(bookUrl).catch(()=>{}));
  }
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
