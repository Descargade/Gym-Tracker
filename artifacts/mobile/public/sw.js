const CACHE_NAME = 'gym-tracker-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/history',
  '/history.html',
  '/progress',
  '/progress.html',
  '/routines',
  '/routines.html',
  '/exercises',
  '/exercises.html',
  '/settings',
  '/settings.html',
  '/train',
  '/train.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        return cache.addAll([
          '/',
          '/index.html',
          '/history.html',
          '/progress.html',
          '/routines.html',
          '/exercises.html',
          '/settings.html',
          '/train.html',
        ]);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
