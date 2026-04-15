const CACHE_NAME = 'offline-cache-v1';
const CACHE_LIFETIME = 60 * 60 * 24 * 1000 // If Expires header is not set, cache for 1 day
const cacheArea = /^(image|font|style|script)$/;

// Install event - cache essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/favicon.svg'
            ]).then(() => self.skipWaiting());
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (cacheArea.test(request.destination) || request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const cachedResponse = await cache.match(request);
                const now = Date.now();

                if (cachedResponse) {
                    const cachedDate = cachedResponse.headers.get('Expires') || cachedResponse.headers.get('Date');

                    if (!cachedDate || !navigator.onLine || (now - new Date(cachedDate) < CACHE_LIFETIME)) {
                        return cachedResponse;
                    }
                }

                return fetch(request).then(networkResponse => {

                    if (networkResponse.ok || networkResponse.type === "opaque") {
                        cache.put(request, networkResponse.clone());
                    }

                    return networkResponse;
                });
            })
        );
    }
});
