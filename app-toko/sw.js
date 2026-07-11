const CACHE_NAME = 'app-toko-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './login.html',
  './cetak.html',
  './cetak.js',
  './manifest.json'
];

// Install
self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files...');
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
            });
          })
        );
      })
  );
});

// Activate - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Active');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch - Cache First, Network Fallback
self.addEventListener('fetch', event => {
  // 1. Hanya proses request GET
  if (event.request.method !== 'GET') return;

  // 2. BYPASS: Navigasi halaman utama (HTML/PHP) agar ditangani langsung oleh browser
  // Ini menghindari pemblokiran cookie challenge __test oleh InfinityFree
  if (event.request.mode === 'navigate') {
    return;
  }

  // 3. BYPASS: Request ke API PHP dinamis agar tidak tersangkut cache/filter service worker
  if (event.request.url.includes('/api-toko/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).catch(error => {
          console.error('Service Worker: Fetch failed for ' + event.request.url, error);
          return new Response('Network error occurred', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
