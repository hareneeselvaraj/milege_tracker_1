const CACHE_NAME = 'ultralog-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Skip non-GET requests, blob URLs, chrome-extension, and data URIs
  if (e.request.method !== 'GET') return;
  if (url.startsWith('blob:')) return;
  if (url.startsWith('data:')) return;
  if (url.startsWith('chrome-extension:')) return;

  // Only cache same-origin navigation and asset requests
  if (!url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() => caches.match('/index.html'));
    })
  );
});
