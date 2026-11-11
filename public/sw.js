const MEDIA_CACHE_NAME = 'peshie-media-v1';
const MEDIA_CACHE_PATH = '/__peshie_media_cache__';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname !== MEDIA_CACHE_PATH
  ) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const cached = await cache.match(event.request);
    return cached || new Response('This media file is not saved on this device.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
