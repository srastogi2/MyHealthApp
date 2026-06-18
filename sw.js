const CACHE_NAME = 'macrotrack-v1';
const ASSETS_TO_CACHE = [
  './macro_tracker_india_40plus.html',
  './manifest.json'
];

// Install event — cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('Some assets could not be cached:', err);
        // Don't fail on missing files — app works offline anyway
      });
    })
  );
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event — Network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache when offline
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // If the requested resource is not in cache and we're offline,
          // serve the main app file so the user can still access their log
          if (event.request.destination === 'document') {
            return caches.match('./macro_tracker_india_40plus.html');
          }
          
          // For other resource types, return a basic offline response
          return new Response('Offline — no cached response available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Background sync — future feature (not used yet, but available)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-log') {
    event.waitUntil(
      // In future: sync food log to cloud
      Promise.resolve()
    );
  }
});

// Push notifications — future feature (not used yet, but available)
self.addEventListener('push', event => {
  // In future: show macro/water reminder notifications
});
