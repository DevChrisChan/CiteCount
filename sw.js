const CACHE_NAME = 'dynamic-cache-v1';
const urlsToCache = [
    '/',
    '/styles/style.css',
    '/styles/dark.css',
    '/styles/drop.css',
    '/scripts/citations.js',
    '/scripts/core.js',
    '/scripts/drop.js',
    '/scripts/initialization.js',
    '/scripts/notifications.js',
    '/scripts/settings.js',
    '/countdown',
    ''
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse; 
                }
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone()); 
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || Response.error(); 
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
    );
});