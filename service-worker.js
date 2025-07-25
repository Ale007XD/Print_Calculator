// service-worker.js

const CACHE_NAME = 'printing-calculator-v1.1'; // Изменили имя кэша, чтобы сбросить старый
// Пути должны быть относительными для корректной работы из подкаталога
const urlsToCache = [
  './', // Или '/Print_Calculator/'
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
  // Добавьте пути к вашим иконкам
  // './icon-192x192.png',
  // './icon-512x5152.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
            console.error('Fetch failed for:', event.request.url, error);
            // Здесь можно вернуть fallback-страницу или ресурс
        });
      })
  );
});

// Опционально: добавьте обработчик activate для очистки старых кэшей
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
