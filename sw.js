const CACHE_NAME = 'print-calculator-v8'; // Новая версия для обновления

const URLS_TO_CACHE = [
    '/Print_Calculator/',
    '/Print_Calculator/index.html',
    '/Print_Calculator/style.css',
    '/Print_Calculator/app.js',
    '/Print_Calculator/manifest.json',
    '/Print_Calculator/lib/jspdf.umd.min.js',
    '/Print_Calculator/icons/icon-192x192.png',
    '/Print_Calculator/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)));
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
        }
    }))));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
