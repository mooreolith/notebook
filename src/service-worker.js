import { manifest, version } from '@parcel/service-worker';

async function install(){
  const cache = await cache.open(version);
  await cache.addAll(manifest);
  await self.skipWaiting();
}
addEventListener('install', e => e.waitUntil(install()));

async function activate(){
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.filter((cache) => {
        cache !== cacheName && caches.delete(cache);
      })
    )
  })


  const keys = await caches.keys();
  return await Promise.all(
    keys.map(key => key !== version && caches.delete(key))
  );
}
addEventListener('activate', e => e.waitUntil(activate()));

addEventListener('fetch', 
  e => e.respondWith(
    caches.match(e.request).catch(fetch(e.request))));
