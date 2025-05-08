import { manifest, version } from '@parcel/service-worker';

async function install(){
  const cache = await cache.open(version);
  await cache.addAll(manifest);
}
addEventListener('install', e => e.waitUntil(install()));

async function activate(){
  const keys = await caches.keys();
  await Promise.all(
    keys.map(key => key !== version && caches.delete(key))
  );
}
addEventListener('activate', e => e.waitUntil(activate()));

/*
const CACHE_NAME = 'notebook-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './notebook.css',
  './notebook.mjs',
  './lib/parser.js',
  './img/spiral.png',
  './icon/notebook.png',
  './examples/Countdown.ipynb',
  './examples/fetch-threejs.ipynb',
  './examples/MicroGrad.ipynb',
  './examples/Notebook User Manual.ipynb'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.info('Opened cache');
        return cache.addAll(urlsToCache, {cache: 'force-cache'});
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

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if(response){
          return response;
        }

        return fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response);
          });
          return response;
        })
      })
  );
});
*/