self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('ummy-cache').then(cache => {
      return cache.addAll([
        '/',
        '/rooms'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});