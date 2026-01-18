// achtung.live Service Worker
// Version 4.0.0 - PWA Support with Offline Functionality

const CACHE_VERSION = 'v4.0.0';
const STATIC_CACHE = `achtung-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `achtung-dynamic-${CACHE_VERSION}`;
const PATTERNS_CACHE = `achtung-patterns-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/demo.html',
  '/style.css',
  '/auth.js',
  '/manifest.json',
  '/locales/de.json',
  '/locales/en.json',
  '/locales/fr.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// API endpoints that can be cached
const CACHEABLE_API_PATTERNS = [
  /\.netlify\/functions\/health/,
  /api\/v2\/health/,
  /api\/v2\/patterns/,
  /api\/v2\/languages/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker', CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('achtung-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== PATTERNS_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, cache fallback for specific endpoints
  if (url.pathname.includes('/api/') || url.pathname.includes('.netlify/functions/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(handleStaticRequest(request));
});

// Handle static asset requests (cache first)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached version, but fetch update in background
    fetchAndCache(request, STATIC_CACHE);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, return offline page if available
    console.log('[SW] Network failed for:', request.url);
    return caches.match('/demo.html');
  }
}

// Handle API requests (network first, cache for specific endpoints)
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(PATTERNS_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API network failed:', request.url);

    // Try to return cached response
    if (isCacheable) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Returning cached API response');
        return cachedResponse;
      }
    }

    // Return offline response for health check
    if (url.pathname.includes('health') || url.pathname.includes('ping')) {
      return new Response(JSON.stringify({
        status: 'offline',
        offline: true,
        message: 'You are currently offline'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return error response
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_PATTERNS':
      // Cache offline patterns
      if (payload?.url) {
        caches.open(PATTERNS_CACHE)
          .then(cache => fetch(payload.url).then(response => cache.put(payload.url, response)));
      }
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;

    case 'CLEAR_CACHE':
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.startsWith('achtung-')) {
            caches.delete(name);
          }
        });
      });
      break;
  }
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'Neue Sicherheitswarnung',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/demo.html'
    },
    actions: [
      { action: 'open', title: 'Öffnen' },
      { action: 'dismiss', title: 'Schließen' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'achtung.live', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/demo.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes('achtung') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker loaded', CACHE_VERSION);
