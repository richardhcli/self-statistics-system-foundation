
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
  // For development, use network-first strategy for assets
  // This allows Vite to serve hot-updated files
  const url = new URL(event.request.url);
  
  // EXCLUDE Firebase Auth and reserved paths from Service Worker interception
  if (url.pathname.startsWith('/__/auth') || url.pathname.includes('identitytoolkit')) {
    return;
  }


  // For API calls and important requests, try network first
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok && event.request.method === 'GET') {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request).then(cached => {
            return cached || new Response('Network error', { status: 503 });
          });
        })
    );
  } else {
    // For HTML and other requests, try cache first
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch((error) => {
          console.warn('Fetch failed for:', event.request.url, error);
          return new Response('Network error', { status: 503 });
        });
      })
    );
  }
});
