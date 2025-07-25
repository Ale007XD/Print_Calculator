const CACHE_NAME = 'print-calculator-v8'; // ВАЖНО: Смените номер версии

const URLS_TO_CACHE = [
    '/Print_Calculator/',
    '/Print_Calculator/index.html',
    '/Print_Calculator/style.css',
    '/Print_Calculator/app.js',
    '/Print_Calculator/manifest.json',
    '/Print_Calculator/lib/jspdf.umd.min.js'
];

// Установка Service Worker и кэширование всех ресурсов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // Удаляем старые кэши, например 'print-calculator-v1'
                    }
                })
            );
        })
    );
});


// Перехват сетевых запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если ресурс есть в кэше, возвращаем его
                if (response) {
                    return response;
                }
                // Иначе, выполняем сетевой запрос
                return fetch(event.request);
            })
    );
});
