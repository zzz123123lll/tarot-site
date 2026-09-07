// sw.js — 工具盒 Service Worker
// 克制策略：HTML/JS/CSS 永远走网络（_headers 已设 max-age=0，改动即时生效），
// 只缓存 vendor/*（含字体）与图标；离线导航回退到首页缓存。
const CACHE = 'gongjuhe-v1';
const CACHEABLE = ['/vendor/', '/icons/'];
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function () { return caches.match('/'); }));
    return;
  }
  if (CACHEABLE.some(function (p) { return url.pathname.indexOf(p) === 0; })) {
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          return hit || fetch(req).then(function (res) {
            if (res.ok) c.put(req, res.clone());
            return res;
          });
        });
      })
    );
  }
});
