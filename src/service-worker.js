import { manifest, version } from '@parcel/service-worker';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(version).then(cache => {
      console.info('files pre-cached');
      return cache.addAll(manifest);
    })
  )

  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.info('activated');
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if(key !== version){
            console.info("removing old cached data", key);
            return caches.delete(key);
          }
        })
      ).catch(err => console.error(err));
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', e => {
  console.info('fetched', e.request.url);

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