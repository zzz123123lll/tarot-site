// shared/toolkit.js — 工具盒共享层（每个工具模块只写自己的逻辑，通用能力都在这）
export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function fmt(bytes) {
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
  return bytes + ' B';
}
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}
export function copyText(text, el) {
  var t = String(text == null ? '' : text);
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).catch(fallback);
  } else { fallback(); }
  if (el && el.getBoundingClientRect) celebrate(el);
}
// 复制成功的一小簇彩花（懒加载 canvas-confetti，克制不喧宾）
export function celebrate(el) {
  if (!el || !el.getBoundingClientRect) return;
  function fire() {
    if (!window.confetti) return;
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    window.confetti({
      particleCount: 26,
      spread: 55,
      startVelocity: 24,
      gravity: 0.85,
      ticks: 90,
      scalar: 0.6,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
      colors: ['#0071e3', '#1d9e4e', '#c86a1e', '#c99a3e', '#86868b'],
      disableForReducedMotion: true
    });
  }
  if (window.confetti) { fire(); return; }
  loadScript('/vendor/canvas-confetti.min.js?v=1').then(fire, function () {});
}
// 多个文件打成一个 zip 下载(懒加载 JSZip,自动处理重名)
export function downloadZip(files, zipName) {
  if (!files || !files.length) return;
  // 打包库不可用时的兜底:退回逐个下载,至少让用户能拿到文件
  function fallbackDownloads() {
    files.forEach(function (f, i) {
      setTimeout(function () { downloadBlob(f.blob, f.name); }, i * 200);
    });
  }
  loadScript('/vendor/jszip.min.js?v=1').then(function () {
    if (!window.JSZip) { fallbackDownloads(); return; }
    var zip = new window.JSZip();
    var seen = {};
    files.forEach(function (f) {
      var base = f.name || 'file';
      var n = seen[base] || 0;
      seen[base] = n + 1;
      var dot = base.lastIndexOf('.');
      var stem = dot > 0 ? base.slice(0, dot) : base;
      var ext = dot > 0 ? base.slice(dot) : '';
      zip.file(n ? stem + '(' + (n + 1) + ')' + ext : base, f.blob);
    });
    zip.generateAsync({ type: 'blob' }).then(function (b) {
      downloadBlob(b, zipName || 'download.zip');
    }).catch(fallbackDownloads);
  }, fallbackDownloads);
}
export function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = function () { reject(new Error('load failed: ' + src)); };
    document.head.appendChild(s);
  });
}
// 大体积程序库(pdf-lib 512KB / pdf.js 1.7MB / 压缩引擎)在"断网且没缓存"时会加载失败。
// 用这个包装器统一给出人话错误,而不是把英文的 load failed 交给 friendlyError 兜底成"换个文件试试"。
function libFailError(label, cause) {
  var err = new Error((label || '这个工具要用到的程序') + '没加载成功（不是你的文件的问题）：多半是断网、而这个程序还没存到你本机。联网后重新打开这个工具一次，之后断网也能用。');
  err.code = 'libfail';
  err.cause = cause;
  return err;
}
export function loadLib(src, label) {
  return loadScript(src).catch(function (e) { throw libFailError(label, e); });
}
// 动态 import 的大库(pdf.js / 压缩编码器)同理:不能用英文的 import 报错糊弄用户
export function dynLib(url, label) {
  return import(url).catch(function (e) { throw libFailError(label, e); });
}
// 判断一个错误是不是"程序没取到"。模块要把这种情况和"文件有问题"分开说。
export function isLibFail(e) {
  if (e && e.code === 'libfail') return true;
  var raw = String((e && e.message) || e || '');
  return /load failed|Failed to fetch|NetworkError|Importing a module script failed|error loading dynamically imported module|net::ERR|ERR_INTERNET|ERR_NAME_NOT_RESOLVED|ERR_NETWORK/i.test(raw);
}
export function injectCss(css) {
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
}
// 给带 data-tippy-content 的元素挂提示（懒加载 tippy；重复调用安全）
export function initTips(scope) {
  var root = scope || document;
  var els = root.querySelectorAll('[data-tippy-content]');
  if (!els.length) return;
  function fallback() {
    // 兜底:库不可用时退化为系统原生 title 提示,不让按钮变成无解释的符号
    Array.prototype.forEach.call(els, function (el) {
      if (!el.getAttribute('title')) el.setAttribute('title', el.getAttribute('data-tippy-content'));
    });
  }
  function apply() {
    if (!window.tippy) { fallback(); return; }
    window.tippy(Array.prototype.filter.call(els, function (el) { return !el._tippy; }), {
      theme: 'tool', arrow: true, placement: 'top',
      delay: [250, 0], offset: [0, 8], animation: 'shift-toward', duration: [140, 90]
    });
  }
  if (window.tippy) { apply(); return; }
  // tippy 6.x 的 UMD 包(包括官方 bundle 版)都要求全局 Popper,必须先加载 Popper 本体
  loadScript('/vendor/popper.min.js?v=1')
    .then(function () { return loadScript('/vendor/tippy-bundle.umd.min.js?v=1'); })
    .then(apply, fallback);
}
// 把库抛出的英文错误翻译成用户能懂的话(原始信息不进 UI)
export function friendlyError(e, fallback) {
  var raw = String((e && e.message) || e || '');
  // 程序库没取到(断网且没缓存)必须和"文件有问题"分开说 —— 否则等于把我们的问题说成用户的问题。
  if (isLibFail(e)) return libFailError(null, e).message;
  if (/Pages|InvalidPDF|PDF structure|not a PDF|No PDF header|Failed to parse PDF|XRef|trailer/i.test(raw)) return '这个文件读不出来：可能已损坏、有密码保护，或者不是标准 PDF。';
  if (/PNG|JPEG|image|decode|bitmap/i.test(raw)) return '这张图片读不出来：可能已损坏，或者是浏览器不支持的格式。';
  if (/atob|base64|InvalidCharacterError/i.test(raw)) return '内容不是有效的 Base64，请检查是否复制完整。';
  if (/JSON|Unexpected token/i.test(raw)) return 'JSON 格式有误，请检查括号、引号与逗号。';
  if (/digest|WebCrypto|crypto/i.test(raw)) return '当前浏览器不支持该加密算法，请换用 Chrome 或 Edge 打开。';
  return fallback || '处理失败，请换一个文件再试。';
}
// 在投放区下方显示一条提示(拖错文件类型时用,不再是静默失败)
export function warnBelow(el, msg) {
  if (!el || !el.parentNode) return;
  var warn = el.parentNode.querySelector('.tool-warn');
  if (!warn) {
    warn = document.createElement('p');
    warn.className = 'tool-warn';
    // 动态插入的提示必须自带播报属性,否则读屏用户收不到
    warn.setAttribute('aria-live', 'polite');
    warn.setAttribute('role', 'status');
    el.parentNode.insertBefore(warn, el.nextSibling);
  }
  warn.textContent = msg;
}
export function clearWarn(el) {
  if (!el || !el.parentNode) return;
  var warn = el.parentNode.querySelector('.tool-warn');
  if (warn) warn.textContent = '';
}
function matchesAccept(file, accept) {
  if (!accept) return true;
  return accept.split(',').some(function (a) {
    a = a.trim();
    if (!a) return false;
    if (a.slice(-2) === '/*') return String(file.type || '').indexOf(a.slice(0, a.indexOf('/') + 1)) === 0;
    if (a.charAt(0) === '.') return file.name.toLowerCase().slice(-a.length) === a.toLowerCase();
    return file.type === a;
  });
}
// ---------- 零上传自证:统计"可能夹带你的文件"的请求 ----------
// 只统计,不改行为。统计对象:带请求体的请求(任何 fetch / XHR / sendBeacon)与跨域请求。
// 说明:Worker 内部的资源加载主线程看不见(浏览器按上下文分开计时),那部分由编码器模块单独回报;
// 这里只管"有没有什么东西被发出去",所以只关心带内容的请求。
const netLog = [];

function absUrl(u) {
  try { return new URL(String(u), location.href).href; } catch (e) { return String(u); }
}

function netRecord(url, method, hasBody) {
  var abs = absUrl(url);
  netLog.push({
    url: abs,
    method: String(method || 'GET').toUpperCase(),
    hasBody: !!hasBody,
    cross: abs.indexOf(location.origin) !== 0,
    host: (function () { try { return new URL(abs).host; } catch (e) { return ''; } })(),
    t: Date.now()
  });
}

function installNetAudit() {
  if (typeof window === 'undefined' || window.__tbNetHooked) return;
  window.__tbNetHooked = true;
  var of = window.fetch;
  if (of) {
    window.fetch = function (input, init) {
      try {
        var url = (input && input.url) ? input.url : String(input);
        var method = (init && init.method) || (input && input.method) || 'GET';
        var hasBody = !!(init && init.body) || !!(input && input.body);
        netRecord(url, method, hasBody);
      } catch (e) { /* 统计失败不能影响功能 */ }
      return of.apply(this, arguments);
    };
  }
  if (typeof XMLHttpRequest !== 'undefined') {
    var oo = XMLHttpRequest.prototype.open;
    var os = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__tbUrl = u; this.__tbMethod = m; return oo.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (body) {
      try { netRecord(this.__tbUrl, this.__tbMethod, body != null); } catch (e) {}
      return os.apply(this, arguments);
    };
  }
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    var ob = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (u, d) {
      try { netRecord(u, 'BEACON', d != null); } catch (e) {}
      return ob(u, d);
    };
  }
}

installNetAudit();

// 标记一个时间点(处理开始),之后用 netReport 取这段时间内的统计
export function netMark() {
  return netLog.length;
}

export function netReport(since) {
  var from = typeof since === 'number' ? since : 0;
  var seg = netLog.slice(from);
  var withBody = seg.filter(function (r) { return r.hasBody; });
  var cross = seg.filter(function (r) { return r.cross; });
  var crossHosts = [];
  cross.forEach(function (r) { if (r.host && crossHosts.indexOf(r.host) < 0) crossHosts.push(r.host); });
  return {
    total: seg.length,
    withBody: withBody.length,
    bodyUrls: withBody.map(function (r) { return r.url; }),
    crossOrigin: cross.length,
    crossHosts: crossHosts
  };
}

// 给工具用的 HTML 片段:如实说明这一次处理有没有把东西发出去
export function netLine(since) {
  var s = netReport(since);
  if (s.withBody > 0) {
    return '处理期间检测到 ' + s.withBody + ' 条带内容的请求,请立刻停止使用并把这个情况告诉我们。';
  }
  var t = '本次处理:上传 0 个文件 · 没有向服务器发送任何内容';
  if (s.crossOrigin > 0) {
    t += ' · 跨域请求 ' + s.crossOrigin + ' 条(' + s.crossHosts.join('、') + '),不含你的文件';
  }
  return t;
}

// 让一个容器变成"点击选文件 + 拖拽"的投放区
export function makeDropZone(el, onFiles, accept, opts) {
  var multiple = !opts || opts.multiple !== false;
  // 键盘可达:让只用键盘的人也能选择文件
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', '选择文件：按回车或空格打开文件选择框，也可以把文件拖到这里' + (multiple ? '' : '（一次一张）'));
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      el.click();
    }
  });
  el.addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    input.multiple = multiple;
    input.onchange = function () { if (input.files && input.files.length) onFiles(Array.from(input.files)); };
    input.click();
  });
  el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('active'); });
  el.addEventListener('dragleave', function () { el.classList.remove('active'); });
  el.addEventListener('drop', function (e) {
    e.preventDefault(); el.classList.remove('active');
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    var all = Array.from(e.dataTransfer.files);
    var okFiles = all.filter(function (f) { return matchesAccept(f, accept); });
    if (!okFiles.length) {
      warnBelow(el, '这个格式不支持' + (accept ? '，请拖入 ' + accept.replace('image/*', '图片（JPG / PNG / WebP / BMP / GIF）').replace('application/pdf', 'PDF 文件') + '。' : '。'));
      return;
    }
    if (okFiles.length < all.length) {
      warnBelow(el, '已忽略 ' + (all.length - okFiles.length) + ' 个不支持的文件，只处理了 ' + okFiles.length + ' 个。');
    } else {
      clearWarn(el);
    }
    onFiles(okFiles);
  });
}

const REGISTRY = {
  'img-compress': { title: '图片压缩', module: '/tools/img-compress.mjs', v: 17 },
  'id-photo': { title: '证件照', module: '/tools/id-photo.mjs', v: 14 },
  'image-convert': { title: '图片转换', module: '/tools/image-convert.mjs', v: 5 },
  'images-to-pdf': { title: '图片合成 PDF', module: '/tools/images-to-pdf.mjs', v: 6 },
  'invoice-nup': { title: '发票拼版', module: '/tools/invoice-nup.mjs', v: 8 },
  'pdf-merge': { title: 'PDF 合并', module: '/tools/pdf-merge.mjs', v: 6 },
  'pdf-split': { title: 'PDF 拆分/旋转', module: '/tools/pdf-split.mjs', v: 6 },
  'pdf-render': { title: 'PDF 转图片', module: '/tools/pdf-render.mjs', v: 6 },
  'pdf-compress': { title: 'PDF 压缩', module: '/tools/pdf-compress.mjs', v: 6 },
  'json': { title: 'JSON 格式化', module: '/tools/json.mjs', v: 6 },
  'base64': { title: 'Base64 编解码', module: '/tools/base64.mjs', v: 5 },
  'regex': { title: '正则测试', module: '/tools/regex.mjs', v: 5 },
  'color': { title: '颜色工具', module: '/tools/color.mjs', v: 6 },
  'qr': { title: '二维码生成', module: '/tools/qr.mjs', v: 6 },
  'jwt': { title: 'JWT 解码', module: '/tools/jwt.mjs', v: 5 },
  'hash': { title: 'Hash 摘要', module: '/tools/hash.mjs', v: 6 },
  'url': { title: 'URL 编解码', module: '/tools/url.mjs', v: 5 },
  'uuid': { title: 'UUID / 密码', module: '/tools/uuid.mjs', v: 5 },
  'date': { title: '日期 & 时间戳', module: '/tools/date.mjs', v: 5 }
};

const H = { esc, fmt, downloadBlob, downloadZip, injectCss, makeDropZone, loadScript, loadLib, dynLib, isLibFail, copyText, initTips, friendlyError, warnBelow, clearWarn, netMark, netReport, netLine };

// 通用无障碍增强:动态状态区可被读屏播报;标签与输入框建立关联
export function enhanceA11y(root) {
  if (!root || !root.querySelectorAll) return;
  Array.prototype.forEach.call(root.querySelectorAll('.note, .err-box, .err-text, .tool-warn, .note-ok, .summary, .progress-note'), function (el) {
    if (!el.getAttribute('aria-live')) el.setAttribute('aria-live', 'polite');
    if (!el.getAttribute('role')) el.setAttribute('role', 'status');
  });
  var seq = 0;
  Array.prototype.forEach.call(root.querySelectorAll('label'), function (lb) {
    if (lb.getAttribute('for') || lb.querySelector('input, textarea, select')) return;
    var field = lb.closest('.tool-field, .tool-row, .crow, .opt-row') || lb.parentNode;
    var ctl = field ? field.querySelector('input, textarea, select') : null;
    if (!ctl) return;
    if (!ctl.id) ctl.id = 'f-' + (++seq) + '-' + Math.random().toString(36).slice(2, 6);
    lb.setAttribute('for', ctl.id);
  });
}

// 把"这一页真正用到的程序文件"交给 Service Worker 存好,这样访问过一次的工具页断网也能打开。
// 细节:页面第一次加载时 SW 往往还没接管当前页面,navigator.serviceWorker.controller 为空,
// 所以用 registration.active 而不是 controller。
function warmOffline(urls) {
  try {
    if (!('serviceWorker' in navigator)) return;
    var list = urls.slice();
    // 关键:把"当前这个页面自己的 HTML"也交给 SW 存下来。
    // 首次访问时 SW 往往还没接管,导航请求不经过它 → 页面 HTML 从没进过缓存,
    // 断网重开时只能回退到首页(用户看到的是"工具打不开")。
    // 用 origin+pathname 作为键,与 sw.js 里导航缓存的 navKey 完全一致。
    list.push(location.origin + location.pathname);
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) {
      if (l.href && l.href.indexOf(location.origin) === 0) list.push(l.href);
    });
    try { if (import.meta && import.meta.url) list.push(import.meta.url); } catch (e) {}
    var send = function (sw) { try { if (sw) sw.postMessage({ type: 'warm', urls: list }); } catch (e) {} };
    if (navigator.serviceWorker.controller) send(navigator.serviceWorker.controller);
    navigator.serviceWorker.ready.then(function (reg) { send(reg.active || navigator.serviceWorker.controller); }).catch(function () {});
  } catch (e) { /* 离线增强失败不影响功能 */ }
}

export async function mountTool(slug, root, titleEl) {
  const t = REGISTRY[slug];
  if (!t) {
    root.innerHTML = '<p class="tool-sub">工具未找到。</p>';
    if (titleEl) titleEl.textContent = '未找到';
    return;
  }
  if (titleEl) titleEl.textContent = t.title;
  // 页面 <title> 由各工具的静态 HTML 提供(SEO),这里不再覆盖
  try {
    const mod = await import(t.module + '?v=' + (t.v || 1));
    if (mod && mod.mount) {
      mod.mount(root, H);
      enhanceA11y(root);
      warmOffline([t.module + '?v=' + (t.v || 1)]);
    }
  } catch (e) {
    root.innerHTML = '<p class="tool-sub">工具加载失败。</p>';
    console.error('[toolbox]', slug, e);
  }
}