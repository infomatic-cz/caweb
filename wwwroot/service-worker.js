const CACHE = 'caweb-shell-0.1.5';
const APP_BASE_URL = new URL('./', self.registration.scope);
const APP_BASE_PATH = APP_BASE_URL.pathname;
const API_PATH_PREFIX = new URL('api/', APP_BASE_URL).pathname;
const HEALTH_PATH = new URL('health', APP_BASE_URL).pathname;
const SHELL = ['', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'favicon.svg']
  .map(path => new URL(path, APP_BASE_URL).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('caweb-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(APP_BASE_PATH) || url.pathname.startsWith(API_PATH_PREFIX) || url.pathname === HEALTH_PATH) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(APP_BASE_URL.href)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && ['script', 'style', 'image', 'manifest'].includes(request.destination)) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
