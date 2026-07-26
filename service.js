const CACHE_NAME = 'site-static-cache';
const ASSETS = [
  '/',
  '/index.html',
  '/v2/app-state.js',
  '/v2/app-init.js',
  '/v2/editor.js',
  '/v2/settings-core.js',
  '/v2/counters.js',
  '/v2/layout.js',
  '/v2/overlays.js',
  '/v2/tools-panel.js',
  '/v2/engagement.js',
  '/v2/system.js',
  '/v2/style.css',
  '/v2/flowbite.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
