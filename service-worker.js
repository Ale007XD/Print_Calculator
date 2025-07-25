const CACHE_NAME = 'print-calculator-v3'; // Снова увеличиваем версию кеша
const URLS_TO_CACHE = [
    '/Print_Calculator/',
    '/Print_Calculator/index.html',
    '/Print_Calculator/style.css',
    '/Print_Calculator/script.js',
    '/Print_Calculator/manifest.json',
    '/Print_Calculator/assets/icon-192x192.png',
    '/Print_Calculator/assets/icon-512x512.png',
    // ИЗМЕНЕНО: Кешируем новые библиотеки
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    // Кешируем сам шрифт
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
    'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2' // Может отличаться, но SW сам закеширует нужное
];

// Установка Service Worker и кеширование всех ресурсов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Активация и очистка старых кешей
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов: отдавать из кеша, если есть, иначе идти в сеть
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если ресурс найден в кеше, отдаем его
                if (response) {
                    return response;
                }
                // Иначе, выполняем обычный запрос к сети
                return fetch(event.request);
            })
    );
});
