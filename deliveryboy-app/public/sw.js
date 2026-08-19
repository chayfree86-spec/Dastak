// Dastak Delivery Boy App - Zero-Cache Auto-Update Service Worker
const APP_NAME = 'dastak-delivery';
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'PURGE_CACHE')) {
    self.skipWaiting();
    if (event.data.type === 'PURGE_CACHE') {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      });
    }
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (!request.url.startsWith('http')) {
    return;
  }

  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('/@vite/') ||
    request.url.includes('/@fs/') ||
    request.url.includes('/@id/') ||
    request.url.includes('/@react-refresh') ||
    request.url.includes('node_modules') ||
    request.url.includes('__vite') ||
    request.url.includes('chrome-extension:')
  ) {
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('', { status: 408, statusText: 'Offline or asset not in cache' });
      })
  );
});
