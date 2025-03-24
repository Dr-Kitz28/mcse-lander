const CACHE_NAME = 'mcse-video-cache-v1';
const VIDEO_URL = '/bgfinal.mp4';

// Install event - cache the video file
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching video');
                return cache.add(VIDEO_URL);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    // Only intercept the video request
    if (event.request.url.includes('bgfinal.mp4')) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('Service Worker: Serving video from cache');
                        return cachedResponse;
                    }

                    console.log('Service Worker: Fetching video from network');
                    return fetch(event.request)
                        .then(response => {
                            // Clone the response
                            const responseToCache = response.clone();

                            // Update the cache
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        });
                })
        );
    }
});