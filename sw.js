// sw.js — 工具盒 Service Worker
// 策略:
//   - 导航:网络优先(改动即时生效),断网回退到"访问过的那个页面",最后回退首页外壳;
//   - /shared/ 与 /tools/(程序与工具模块):缓存优先 + 后台刷新;
//   - /vendor/、/icons/、页面样式与清单:缓存优先;
//   - 其余同源 GET:网络优先,失败时回退缓存(例如 /manifest.webmanifest)。
// 关键点(踩过坑):
//   1) 缓存查找一律带 ignoreSearch —— 页面请求的是 /base.css?v=3 这类带版本号的 URL,
//      而安装期预缓存用的是不带版本号的路径,不忽略查询串就等于预缓存白做、断网必挂;
//   2) 每一个分支都必须有 catch 兜底,否则缓存未命中时 respondWith 会直接 reject,
//      断网时用户看到的是"工具打不开",而不是一个可用的降级页面;
//   3) 工具页要能离线**处理文件**,除 HTML 与工具模块外还需要 /shared/encoders.js、
//      encoder-worker.js、encoder-core.js 与 /vendor/encoders/* —— 这些在"第一次成功处理"时才进缓存。
const CACHE = 'gongjuhe-v11';
// /offline.html 是"断网打开一个确实没缓存过的地址"时的兜底说明页
const OFFLINE_PAGE = '/offline.html';
// 首次访问就把**所有工具页的 HTML** 预缓存(20 页,合计约 60KB)。
// 为什么这么做:Chromium 不允许 Service Worker 用"另一个 URL 的缓存响应"顶替一次导航,
// 所以"没访问过的工具页"没法靠兜底页顶替;直接把页面本体缓存下来最实在,
// 顺便把承诺从"访问过的工具页能离线打开"升级成"访问过一次工具盒,之后断网能打开任何工具页"。
// 这份清单必须与 tools-manifest.js 的 live 工具一致 —— 一致性自检脚本会核对,新增工具忘了加就会报错。
const TOOL_PAGES = [
  '/tarot/',   '/img-compress/',   '/id-photo/',   '/image-convert/',   '/images-to-pdf/',   '/invoice-nup/',   '/pdf-merge/',   '/pdf-split/',   '/pdf-render/',   '/pdf-compress/',   '/tools/json/',   '/tools/base64/',   '/tools/regex/',   '/tools/color/',   '/tools/qr/',   '/tools/jwt/',   '/tools/hash/',   '/tools/url/',   '/tools/uuid/',   '/tools/date/'
];
const SHELL = ['/', OFFLINE_PAGE, '/verify/'].concat(TOOL_PAGES, ['/base.css', '/site.css', '/fonts.css', '/home.js', '/tools-manifest.js', '/icons/icon-192.png', '/vendor/fonts/Geist-sub.woff2']);
const CACHEABLE = ['/vendor/', '/icons/', '/tool.css', '/base.css', '/fonts.css', '/site.css', '/home.js', '/tools-manifest.js'];
const SHARED = ['/shared/', '/tools/'];

// 缓存查找:先精确匹配,再忽略查询串(把 /x.css?v=3 与预缓存的 /x.css 对上)
function fromCache(c, req) {
  return c.match(req).then(function (hit) {
    return hit || c.match(req, { ignoreSearch: true });
  });
}

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
    // 关键:导航响应必须用一个"普通的同源 GET 请求"当缓存键。
    // 直接 c.put(navigationRequest) 会被浏览器拒绝(而我们以前用 .catch 把错误吞了),
    // 结果缓存里从来没有工具页的 HTML —— 断网时只能回退到首页,用户看到的是"工具打不开"。
    var navKey = new Request(url.origin + url.pathname, { method: 'GET' });
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(navKey, copy).catch(function () {}); });
        }
        return res;
      }).catch(function () {
        return caches.open(CACHE).then(function (c) {
          return c.match(navKey).then(function (hit) {
            if (hit) return hit;
            // 再退一步:忽略查询串按路径匹配,最后回退首页外壳
            return c.match(navKey, { ignoreSearch: true }).then(function (hit2) {
              // 都没命中(这个页面从没访问过):给一页说得清的说明,不要静默换成首页
              return hit2 || c.match(OFFLINE_PAGE) || c.match('/');
            });
          });
        });
      })
    );
    return;
  }

  if (SHARED.some(function (p) { return url.pathname.indexOf(p) === 0; })) {
    // 先给缓存里的旧版本(秒开),同时在后台取新版本,下次访问就是新的
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return fromCache(c, req).then(function (hit) {
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
        return fromCache(c, req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res.ok) c.put(req, res.clone());
            return res;
          }).catch(function () {
            // 断网且没缓存:不要 reject(那会让整页报错),交给浏览器按普通失败处理
            return new Response('', { status: 504, statusText: 'offline' });
          });
        });
      })
    );
    return;
  }

  // 其余同源 GET(例如 /manifest.webmanifest):网络优先,失败回退缓存
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
      }
      return res;
    }).catch(function () {
      return caches.open(CACHE).then(function (c) {
        return fromCache(c, req).then(function (hit) {
          return hit || new Response('', { status: 504, statusText: 'offline' });
        });
      });
    })
  );
});
