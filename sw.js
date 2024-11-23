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
];

// Install event - cache the initial resources
self.addEventListener('install', (event) => {
    // Skip waiting to activate the new service worker immediately
    self.skipWaiting();
});

// Fetch event - always load from the network when online
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse; // Return the network response if invalid
                }

                // Update the cache with the new response
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone()); // Cache the new response
                    return networkResponse; // Return the network response
                });
            })
            .catch(() => {
                // If the network request fails, check the cache
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || Response.error(); // Return cached response if available or an error response
                });
            })
    );
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName); // Delete old caches
                    }
                })
            );
        })
    );
});