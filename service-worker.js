// ─── BABYLON SERVICE WORKER ───
// Bump this version string whenever you deploy changes
// The old cache will be deleted and everything re-fetched
const CACHE_VERSION = 'babylon-v1';

const PRECACHE_URLS = [
    '/app/',
    '/app/index.html',
    '/app/babylon.html',
    '/app/babylon-debt.html',
    '/app/babylon-goals.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// ─── INSTALL: cache all app files ───
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ─── ACTIVATE: delete old caches ───
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// ─── FETCH: serve from cache, fall back to network ───
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests (Google Fonts, CDN, Analytics, etc.)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                // Not in cache — fetch from network and cache it
                return fetch(event.request)
                    .then(response => {
                        // Only cache valid responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_VERSION)
                            .then(cache => cache.put(event.request, responseToCache));
                        return response;
                    })
                    .catch(() => {
                        if (event.request.destination === 'document') {
                            return caches.match('/app/index.html');
                        }
                    });
            })
    );
});