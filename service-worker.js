const CACHE_NAME = 'notebook-cache-v1';
const urlsToCache = [
  '/',
  '/src/index.html',
  '/src/notebook.css',
  '/src/notebook.mjs',
  '/src/lib/parser.js',
  '/src/img/spiral.png',
  '/icon/notebook.png',
  '/src/examples/Countdown.ipynb',
  '/src/examples/fetch-threejs.ipynb',
  '/src/examples/MicroGrad.ipynb',
  '/src/examples/Notebook User Manual.ipynb'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.info('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if(response){
          return response;
        }

        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      )
    })
  );
});

