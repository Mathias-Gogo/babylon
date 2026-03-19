// ─── BABYLON SERVICE WORKER ───
// Bump version on every deploy to bust old cache
const CACHE_VERSION = 'babylon-v1';

const PRECACHE_URLS = [
    '/app/',
    '/app/index.html',
    '/app/babylon.html',
    '/app/babylon-debt.html',
    '/app/babylon-goals.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/fonts/fonts.css',
    '/fonts/cormorant-garamond-v21-latin-regular.woff2',
    '/fonts/cormorant-garamond-v21-latin-italic.woff2',
    '/fonts/cormorant-garamond-v21-latin-600.woff2',
    '/fonts/cormorant-garamond-v21-latin-600italic.woff2',
    '/fonts/cormorant-garamond-v21-latin-700.woff2',
    '/fonts/cormorant-garamond-v21-latin-700italic.woff2',
    '/fonts/montserrat-v31-latin-regular.woff2',
    '/fonts/montserrat-v31-latin-500.woff2',
    '/fonts/montserrat-v31-latin-600.woff2',
    '/fonts/montserrat-v31-latin-700.woff2',
    '/fonts/montserrat-v31-latin-900.woff2',
    '/lib/chart.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

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

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const clone = response.clone();
                        caches.open(CACHE_VERSION)
                            .then(cache => cache.put(event.request, clone));
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