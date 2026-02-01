
const CACHE_NAME = 'neural-brain-v1';
const ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((error) => {
        console.warn('Cache installation failed, but service worker will continue:', error);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch((error) => {
        console.warn('Fetch failed for:', event.request.url, error);
        return new Response('Network error', { status: 503 });
      });
    })
  );
});
