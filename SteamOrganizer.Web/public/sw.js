const CACHE_NAME = 'image-cache-v1';
const CACHE_LIFETIME = 60 * 60 * 24 * 1000 // If Expires header is not set, cache for 1 day
const cacheArea = /^(image|font|style)$/;

self.addEventListener('fetch', (event) => {
    const request  = event.request;

    // Skip cross-origin requests, but not for images
    if(cacheArea.test(request.destination) &&
        (request.destination !== 'script' || !request.url.startsWith(self.location.origin))) {
        return
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cachedResponse = await cache.match(request);
            const now = Date.now();

            if(cachedResponse) {
                const cachedDate = cachedResponse.headers.get('Expires') || cachedResponse.headers.get('Date');

                if(!cachedDate || !navigator.onLine || (now - new Date(cachedDate) < CACHE_LIFETIME)) {
                    return cachedResponse;
                }
            }

            return fetch(request).then(networkResponse => {

                if(networkResponse.ok || networkResponse.type === "opaque") {
                    cache.put(request, networkResponse.clone());
                }

                return networkResponse;
            });
        })
    );
});