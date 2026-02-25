// Minimal Service Worker for AU RadioChat PWA
const CACHE_NAME = 'auradiochat-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// self.addEventListener('fetch', (event) => {
//   // Pass through, no caching strategy
//   event.respondWith(fetch(event.request));
// });

