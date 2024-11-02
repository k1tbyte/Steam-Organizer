const CACHE_NAME = 'image-cache-v1';

self.addEventListener('fetch', (event) => {
    const request  = event.request;
    if(request.destination !== 'image') {
        return
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(request).then(cachedResponse => {
                // If the image is in the cache, return it
                if (cachedResponse) {
                    return cachedResponse;
                }
                // If the image is not in the cache, fetch it
                return fetch(request).then(networkResponse => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});