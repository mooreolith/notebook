import { manifest, version } from '@parcel/service-worker';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(version).then(cache => {
      return cache.addAll(manifest);
    })
  )

  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if(key !== version){
            return caches.delete(key);
          }
        })
      ).catch(err => console.error(err));
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(version)
    .then(cache => {
      return fetch(e.request)
        .then(response => {
          if(response.ok){
            cache.put(e.request.url, response.clone());
          }

          return response;
        })
        .catch(error => {
          return cache.match(e.request);
        });
    })
    .catch(error => console.error(error))
  )
})