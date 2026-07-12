const CACHE_NAME = 'matrix-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass Service Worker entirely for specific requests:
  // - Non-GET requests (e.g. POST, PUT, DELETE - including Server Actions)
  // - Cross-origin requests
  // - /api/ routes
  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    url.pathname.startsWith('/api/') ||
    request.headers.has('Next-Action')
  ) {
    // Return without calling event.respondWith(), letting the browser handle it (network-only)
    return;
  }

  // 2. Determine Request Type
  const isStaticAsset = url.pathname.startsWith('/_next/static/') || 
                        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf|css)$/);
  
  const isNavigation = request.mode === 'navigate' || 
                       request.headers.get('accept')?.includes('text/html') ||
                       request.headers.has('RSC'); // Next.js App Router RSC payload requests

  if (isStaticAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
  } else if (isNavigation) {
    // Network-first for HTML pages and navigations
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fallback to cache if offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback offline message if not even in cache
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return new Response('Offline mode. Please connect to the internet to use Matrix.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        });
      })
    );
  } else {
    // Default Stale-While-Revalidate for everything else (or just network-first)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Ignore network errors for stale-while-revalidate background fetches
        });
        
        return cachedResponse || fetchPromise;
      })
    );
  }
});
