const CACHE_NAME = 'offline-cache-v1';
const CACHE_LIFETIME = 60 * 60 * 24 * 1000 // If Expires header is not set, cache for 1 day
const cacheArea = /^(image|font|style|script)$/;


self.addEventListener('install', event => {
    event.waitUntil(
            self.skipWaiting()
    );
});

/*self.addEventListener('activate', (event) => {
    // `self.clients.claim()` allows SW to start intercepting requests from the beginning,
    // This works in conjunction with `skipWaiting()`, allowing `fallback` to be used from the first requests.
    event.waitUntil(self.clients.claim());
});*/

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
