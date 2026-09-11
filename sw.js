// sw.js — 工具盒 Service Worker
// 策略:HTML 网络优先(改动即时生效),断网时回退到已访问过的页面,最后回退首页外壳;
// shared/* 与 tools/*(工具模块)用"缓存优先 + 后台刷新",vendor/*、icons/* 与页面样式缓存优先;
// 安装时预缓存首页外壳。目标是:访问过一次的工具页,断网后仍能真正处理文件。
// 注意:工具页要能离线处理,除了 HTML 与工具模块,还要有 /shared/encoders.js、encoder-worker.js、
// encoder-core.js 与 /vendor/encoders/* 的编码器 —— 这些在"第一次成功处理"时才会进缓存。
const CACHE = 'gongjuhe-v6';
const SHELL = ['/', '/site.css', '/fonts.css', '/home.js', '/tools-manifest.js', '/icons/icon-192.png', '/vendor/fonts/Geist-sub.woff2'];
const CACHEABLE = ['/vendor/', '/icons/', '/tool.css', '/fonts.css', '/site.css', '/home.js', '/tools-manifest.js'];
const SHARED = ['/shared/', '/tools/'];
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (res) { if (res.ok) return c.put(u, res); }).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
// 页面加载完自己的程序文件后主动告诉 SW:把"这一页真正用到的东西"也存下来。
// 原因:页面首次加载时 SW 可能还没接管,单靠 fetch 拦截会漏掉工具模块与样式,导致断网时工具打不开。
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type !== 'warm' || !d.urls || !d.urls.length) return;
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(d.urls.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
      }));
    })
  );
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        // 按访问过的网址缓存,断网时这个工具页可以直接再打开
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('/'); });
      })
    );
    return;
  }
  if (SHARED.some(function (p) { return url.pathname.indexOf(p) === 0; })) {
    // 先给缓存里的旧版本(秒开),同时在后台取新版本,下次访问就是新的
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          var fresh = fetch(req, { cache: 'reload' }).then(function (res) {
            if (res.ok) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || fresh;
        });
      })
    );
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
