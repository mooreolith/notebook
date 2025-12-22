(() => {

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

      var $parcel$global = globalThis;
    
var $parcel$modules = {};
var $parcel$inits = {};

var parcelRequire = $parcel$global["parcelRequire752b"];

if (parcelRequire == null) {
  parcelRequire = function(id) {
    if (id in $parcel$modules) {
      return $parcel$modules[id].exports;
    }
    if (id in $parcel$inits) {
      var init = $parcel$inits[id];
      delete $parcel$inits[id];
      var module = {id: id, exports: {}};
      $parcel$modules[id] = module;
      init.call(module.exports, module, module.exports);
      return module.exports;
    }
    var err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  };

  parcelRequire.register = function register(id, init) {
    $parcel$inits[id] = init;
  };

  $parcel$global["parcelRequire752b"] = parcelRequire;
}

var parcelRegister = parcelRequire.register;
parcelRegister("2XNL0", function(module, exports) {

var $5WX9Q = parcelRequire("5WX9Q");
self.addEventListener('install', (e)=>{
    e.waitUntil(caches.open((0, $5WX9Q.version)).then((cache)=>{
        return cache.addAll((0, $5WX9Q.manifest));
    }));
    self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
    e.waitUntil(caches.keys().then((keys)=>{
        return Promise.all(keys.map((key)=>{
            if (key !== (0, $5WX9Q.version)) return caches.delete(key);
        })).catch((err)=>console.error(err));
    }));
    self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
    e.respondWith(caches.open((0, $5WX9Q.version)).then((cache)=>{
        return fetch(e.request).then((response)=>{
            if (response.ok) cache.put(e.request.url, response.clone());
            return response;
        }).catch((error)=>{
            return cache.match(e.request);
        });
    }).catch((error)=>console.error(error)));
});

});
parcelRegister("5WX9Q", function(module, exports) {

$parcel$export(module.exports, "manifest", () => $4550420cc206d4d6$export$e538f94cc8cf4db8);
$parcel$export(module.exports, "version", () => $4550420cc206d4d6$export$83d89fbfd8236492);
$parcel$export(module.exports, "_register", () => $4550420cc206d4d6$export$c208e1278d7beb2);
let $4550420cc206d4d6$export$e538f94cc8cf4db8 = [];
let $4550420cc206d4d6$export$83d89fbfd8236492 = '';
function $4550420cc206d4d6$export$c208e1278d7beb2(m, v) {
    $4550420cc206d4d6$export$e538f94cc8cf4db8 = m;
    $4550420cc206d4d6$export$83d89fbfd8236492 = v;
}

});


var $2318c1dc9fb1b998$exports = {};

var $5WX9Q = parcelRequire("5WX9Q");
const $2318c1dc9fb1b998$var$manifest = [
    "/index.html",
    "/manifest.webmanifest",
    "/notebook-maskable.a3a8f0b1.png",
    "/notebook.0749d991.png",
    "/notebook.3df10f15.css",
    "/spiral-small.1b78af88.png"
];
const $2318c1dc9fb1b998$var$version = "600ff55e";
(0, $5WX9Q._register)($2318c1dc9fb1b998$var$manifest, $2318c1dc9fb1b998$var$version);


parcelRequire("2XNL0");
})();
//# sourceMappingURL=service-worker.js.map
