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
// 轻提示(可带一个动作按钮),用于"刚做的事可以撤回"。
// 依据:sonner 的 action/undo(https://sonner.emilkowal.ski)、Radix Toast 的"悬停/聚焦时暂停倒计时"
// (https://www.radix-ui.com/primitives/docs/components/toast)、NN/g 的"用户控制与自由"。
// 站点里最需要它的是"清空/清除":一键就把整批结果销毁,而且原文件早被 URL 释放,撤不回来。
export function toast(msg, opts) {
  opts = opts || {};
  if (typeof document === 'undefined') return null;
  var host = document.getElementById('tb-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'tb-toast-host';
    host.className = 'tb-toast-host';
    document.body.appendChild(host);
  }
  var el = document.createElement('div');
  el.className = 'tb-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  var text = document.createElement('span');
  text.className = 'tb-toast-text';
  text.textContent = String(msg == null ? '' : msg);
  el.appendChild(text);

  var timer = null, closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); if (!host.childNodes.length && host.parentNode) host.parentNode.removeChild(host); }, 200);
  }
  function startTimer() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(close, opts.ms || 8000);
  }
  function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }

  if (opts.action) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tb-toast-action';
    btn.textContent = opts.action;
    btn.addEventListener('click', function () { close(); if (opts.onAction) opts.onAction(); });
    el.appendChild(btn);
  }
  var x = document.createElement('button');
  x.type = 'button';
  x.className = 'tb-toast-x';
  x.setAttribute('aria-label', '关闭这条提示');
  x.textContent = '×';
  x.addEventListener('click', close);
  el.appendChild(x);

  // 鼠标悬停或键盘聚焦时暂停倒计时 —— 否则用户正要把鼠标移到"撤销"上,它自己消失了
  el.addEventListener('mouseenter', stopTimer);
  el.addEventListener('mouseleave', startTimer);
  el.addEventListener('focusin', stopTimer);
  el.addEventListener('focusout', startTimer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  host.appendChild(el);
  if (opts.focusAction !== false && opts.action && el.querySelector('.tb-toast-action')) {
    try { el.querySelector('.tb-toast-action').focus(); } catch (e) { /* 焦点给不上就算了,别影响主流程 */ }
  }
  startTimer();
  return el;
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
// 接受格式的中文说法(集中一处,拖拽提示与拒绝提示共用,不再各写一份)
function acceptLabel(accept) {
  if (!accept) return '';
  if (accept.indexOf('application/pdf') >= 0) return 'PDF 文件';
  if (accept.indexOf('image/') >= 0) return '图片(JPG / PNG / WebP / BMP / GIF)';
  return accept;
}

// 拖拽过程中"这个能不能收":与 matchesAccept 同一套规则,但只用 type/name 字符串(拖拽阶段拿不到 File)。
// 关键:拖拽中很多浏览器(尤其从资源管理器拖)给不出 type —— 拿不到就不判"拒绝",免得把正常拖拽标红。
function typeAcceptable(accept, type, name) {
  var list = String(accept || '').split(',').map(function (a) { return a.trim(); }).filter(Boolean);
  if (!list.length) return true;
  var t = String(type || ''), n = String(name || '').toLowerCase();
  var hit = list.some(function (a) {
    if (a.slice(-2) === '/*') return t.indexOf(a.slice(0, a.indexOf('/') + 1)) === 0;
    if (a.charAt(0) === '.') return n.slice(-a.length) === a;
    return t === a;
  });
  if (hit) return true;
  var wantsImage = list.some(function (a) { return a.indexOf('image/') === 0 || /^\.(jpe?g|png|webp|bmp|gif|heic|heif)$/.test(a); });
  if (wantsImage && (/\.(heic|heif)$/.test(n) || t === 'image/heic' || t === 'image/heif')) return true;
  return false;
}

function dragAcceptable(dt, accept) {
  if (!dt || !accept) return true;
  var items = dt.items;
  if (items && items.length) {
    var anyFile = false, unknown = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind && it.kind !== 'file') continue;
      anyFile = true;
      if (!it.type) { unknown = true; continue; }
      if (typeAcceptable(accept, it.type, '')) return true;
    }
    if (!anyFile) return true;
    return unknown;
  }
  return true;
}

function matchesAccept(file, accept) {
  if (!accept) return true;
  var name = String(file.name || '').toLowerCase();
  var type = String(file.type || '');
  var list = accept.split(',').map(function (a) { return a.trim(); }).filter(Boolean);
  var hit = list.some(function (a) {
    if (a.slice(-2) === '/*') return type.indexOf(a.slice(0, a.indexOf('/') + 1)) === 0;
    if (a.charAt(0) === '.') return name.slice(-a.length) === a;
    return type === a;
  });
  if (hit) return true;
  // HEIC/HEIF 常见两种形态:type 是空的(从某些系统拖出来),或 image/heic。
  // 只要这个工具本来就是收图片的,就放行 —— 让工具自己去看文件头、并把"浏览器解不了 HEIC"这件事说清楚,
  // 而不是在这一层丢一句"格式不支持"(那用户根本不知道发生了什么)。
  var wantsImage = list.some(function (a) { return a.indexOf('image/') === 0 || /^\.(jpe?g|png|webp|bmp|gif|heic|heif)$/.test(a); });
  var looksHeic = /\.(heic|heif)$/.test(name) || type === 'image/heic' || type === 'image/heif';
  return wantsImage && looksHeic;
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
  // 拖拽三态(参照 react-dropzone 的 isDragActive / isDragAccept / isDragReject):
  // 原来只有一个 active 态,拖错东西时高亮和能收时一模一样,用户得松手才知道不行。
  var hintEl = el.querySelector && el.querySelector('.hint');
  // 提示原文必须"要改写前才记":有些工具会自己更新这一行(例如加水印页选完 logo 后写成"已选 logo: xxx.png")。
  // 如果在绑定时就把原文记死,拖错一次再拖走,工具自己写进去的那句话会被我们还原掉 —— 那是我们引入的回归。
  var hintOrig = null;
  function setDropState(ok, hovering) {
    el.classList.toggle('active', !!hovering && ok);
    el.classList.toggle('reject', !!hovering && !ok);
    if (!hintEl) return;
    if (hovering && !ok) {
      if (hintOrig === null) hintOrig = hintEl.textContent;
      hintEl.textContent = '这里不收这个格式' + (accept ? ' —— 只收 ' + acceptLabel(accept) : '') + ';松手也不会被处理';
    } else if (hintOrig !== null) {
      hintEl.textContent = hintOrig;
      hintOrig = null;
    }
  }
  el.addEventListener('dragover', function (e) {
    e.preventDefault();
    setDropState(dragAcceptable(e.dataTransfer, accept), true);
  });
  el.addEventListener('dragleave', function () { setDropState(true, false); });
  // 拖进来、粘进来都走这里:格式过滤 → 提示 → 骨架 → 交给工具
  function acceptFiles(all) {
    var okFiles = all.filter(function (f) { return matchesAccept(f, accept); });
    if (!okFiles.length) {
      warnBelow(el, '这个格式不支持' + (accept ? ',请拖入 ' + acceptLabel(accept) + '。' : '。'));
      return;
    }
    if (okFiles.length < all.length) {
      warnBelow(el, '已忽略 ' + (all.length - okFiles.length) + ' 个不支持的文件,只处理了 ' + okFiles.length + ' 个。');
    } else {
      clearWarn(el);
    }
    // 延后 60ms 再摆骨架:工具接手时的第一件事通常是清空结果区(innerHTML=''),
    // 立刻插进去会被它自己清掉 —— 那样骨架等于没做。
    try { var _r = el.closest ? (el.closest('#toolRoot') || document) : document; setTimeout(function () { showSkeletons(_r); }, 60); } catch (e) {}
    onFiles(okFiles);
  }
  el.addEventListener('drop', function (e) {
    e.preventDefault(); setDropState(true, false);
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    acceptFiles(Array.from(e.dataTransfer.files));
  });

  // 粘贴即用:首页早就写着"粘进来我告诉你该用哪个工具",可进了工具页反而只能拖文件 ——
  // 截图之后最顺的动作是 Ctrl+V,不该逼用户先存盘再拖。(参照 Squoosh 首屏的 Drop OR Paste)
  if (bindPasteToPage(el, accept, acceptFiles, opts)) {
    var pasteTip = document.createElement('div');
    pasteTip.className = 'tool-drop-paste';
    pasteTip.textContent = '也可以直接按 Ctrl / ⌘ + V 粘贴' + (/image\//.test(accept || '') ? '截图' : '复制进来的文件');
    el.appendChild(pasteTip);
  }
}

// 每页只绑一次,而且只绑**主**拖拽区:一个页面可能有多个拖拽区(加水印页还有一个 logo 框)。
// 实测踩到的坑:按"第一次调用 makeDropZone"来判定主区是错的 —— 加水印页先建 logo 框,结果粘贴的图片
// 进了 logo 而不是主区。判据改成"带大标题(.title)的那个",并允许工具用 { paste: true / false } 显式指定。
var _pasteBound = false;
function bindPasteToPage(el, accept, acceptFiles, opts) {
  if (_pasteBound || typeof document === 'undefined') return false;
  var wantPaste = opts && opts.paste === true ? true : (opts && opts.paste === false ? false : !!el.querySelector('.title'));
  if (!wantPaste) return false;   // 从属拖拽区不绑,也不占坑
  _pasteBound = true;
  document.addEventListener('paste', function (e) {
    var dt = e.clipboardData;
    if (!dt || !dt.files || !dt.files.length) return; // 纯文字粘贴不抢,照旧交给输入框
    var all = Array.prototype.slice.call(dt.files);
    var ok = all.filter(function (f) { return matchesAccept(f, accept); });
    if (!ok.length) return;
    e.preventDefault();
    clearWarn(el);
    acceptFiles(ok);
  });
  return true;
}

// ---------- HEIC/HEIF 识别与说明 ----------
// 为什么单独做:iPhone 拍的照片默认是 HEIC,而 Chrome / Edge / Firefox / 安卓 Chrome 都不能解码
// (只有 Safari 可以,见 caniuse:heif)。它是真实高频痛点(调研原话:"iPhone 拍的 HEIC 在 Windows、
// 安卓默认打不开,网上现成的转换工具基本都要上传服务器"),所以至少要说清楚、给出可走的路,
// 而不是丢一句"读不了这个文件"。
export async function sniffHeic(file) {
  try {
    if (!file) return false;
    if (/\.(heic|heif)$/i.test(file.name || '')) return true;
    if (/^image\/hei[cf]$/i.test(file.type || '')) return true;
    // 有些设备传上来 type 是空的:看文件头 ftyp brand(HEIC 与 MP4 同族)
    var head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (head.length >= 12) {
      var ftyp = String.fromCharCode(head[4], head[5], head[6], head[7]);
      var brand = String.fromCharCode(head[8], head[9], head[10], head[11]).toLowerCase();
      if (ftyp === 'ftyp' && ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].indexOf(brand) >= 0) return true;
    }
  } catch (e) { /* 读不了头就当不是 */ }
  return false;
}
// 解码按钮的回调登记:这个函数返回的是 HTML 字符串,没法直接绑事件,所以用一次性的事件委托
var _heicCbs = {};
var _heicSeq = 0;
var _heicDelegated = false;
function ensureHeicUI() {
  if (_heicDelegated || typeof document === 'undefined') return;
  _heicDelegated = true;
  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest('[data-heic-decode]') : null;
    if (!btn) return;
    var entry = _heicCbs[btn.getAttribute('data-heic-decode')];
    if (!entry || entry.busy) return;
    entry.busy = true;
    var old = btn.textContent;
    btn.disabled = true;
    var status = document.createElement('div');
    status.style.cssText = 'font-size:14px;color:#6e6e73;margin-top:8px';
    btn.insertAdjacentElement('afterend', status);
    status.textContent = '正在下载本地解码器(约 1.9MB,只下一次)…';
    import('/shared/heic.js?v=1').then(function (m) {
      return m.heicToJpeg(entry.file, function (s) { status.textContent = s; });
    }).then(function (out) {
      status.textContent = '解码完成:' + out.width + ' × ' + out.height + ' · ' + fmt(out.bytes) + ',已作为 JPG 交给这个工具继续处理。';
      status.style.color = '#008009';
      if (entry.cb) entry.cb(out.file);
    }).catch(function (e) {
      entry.busy = false;
      btn.disabled = false;
      btn.textContent = old;
      status.style.color = '#e30000';
      status.textContent = '解码没成功:' + friendlyError(e, 'HEIC 解码失败') + '(文件没有被上传)';
    });
  });
}
export function heicNotice(file, onDecoded) {
  var btn;
  if (onDecoded && file) {
    ensureHeicUI();
    var token = 'h' + (++_heicSeq);
    _heicCbs[token] = { file: file, cb: onDecoded, busy: false };
    btn = '<div class="tool-row" style="margin-top:10px"><button class="tool-btn" data-heic-decode="' + token + '">用本地解码器转成 JPG(下载约 1.9MB)</button></div>'
      + '<div class="sizes" style="color:#6e6e73">基于 libheif(LGPL-3.0,见 <a href="/licenses/">第三方组件</a>)。解码在你本机完成,照片不会被上传;解码器只下载一次,之后走浏览器缓存。</div>';
  } else {
    btn = '<div class="sizes">最快的办法:用本站<b>「图片转换」</b>把它转成 JPG —— 那个工具已经内置本地 HEIC 解码器。</div>';
  }
  return '<div class="sizes" style="color:var(--c-warn)">这是 iPhone 的 HEIC 照片 —— Chrome / Edge / Firefox / 安卓浏览器目前<b>都不能解码它</b>(只有 Safari 能),所以在这里打不开。你的文件没有被上传，也没有被改动。</div>'
    + btn
    + '<div class="sizes" style="color:#6e6e73">不想下载也可以:① iPhone「设置 → 照片 → 传输到 Mac 或 PC」选<b>自动</b>,再用数据线导出(得到 JPG);② 在 iPhone / Mac 上直接「导出为 JPG」;③ Windows 装微软商店的「HEIF 图像扩展」后,用「照片」打开并另存为 JPG。</div>';
}

// ---------- 导出后自检(把"悄悄坏掉"挡在下载之前) ----------
// 为什么需要:调研里最扎心的一条原话是"导出 PDF 排版丢了好几页,问题是我马上就要交了"。
// 做法:产物生成后**真的读回来**核对 —— 图片能不能解码、像素对不对、体积有没有超;
// PDF 能不能被解析、页数是不是和预期一致。自检不过就把话说清楚,而不是让你拿去交。
export async function checkImage(out, expect) {
  var res = { ok: false, bytes: 0, width: 0, height: 0, type: '', error: '' };
  try {
    var blob = out instanceof Blob ? out : new Blob([out]);
    res.bytes = blob.size;
    res.type = blob.type || '';
    var bmp = await createImageBitmap(blob);
    res.width = bmp.width; res.height = bmp.height;
    if (bmp.close) bmp.close();
    var problems = [];
    if (!res.bytes) problems.push('产物是 0 字节');
    if (expect && expect.maxBytes && res.bytes > expect.maxBytes) problems.push('体积 ' + fmt(res.bytes) + ' 超过目标 ' + fmt(expect.maxBytes));
    if (expect && expect.width && res.width !== expect.width) problems.push('宽度 ' + res.width + ' 与预期 ' + expect.width + ' 不一致');
    if (expect && expect.height && res.height !== expect.height) problems.push('高度 ' + res.height + ' 与预期 ' + expect.height + ' 不一致');
    if (expect && expect.maxSide && Math.max(res.width, res.height) > expect.maxSide) problems.push('边长超过 ' + expect.maxSide);
    res.ok = problems.length === 0;
    if (!res.ok) res.error = problems.join(';');
  } catch (e) {
    res.error = '产物读不回来(可能已损坏):' + friendlyError(e, '解码失败');
  }
  return res;
}
export async function checkPdf(out, expect) {
  var res = { ok: false, bytes: 0, pages: 0, error: '' };
  try {
    var blob = out instanceof Blob ? out : new Blob([out], { type: 'application/pdf' });
    res.bytes = blob.size;
    await loadLib('/vendor/pdf-lib.min.js?v=1', 'PDF 校验程序');
    var bytes = new Uint8Array(await blob.arrayBuffer());
    var doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    res.pages = doc.getPageCount();
    var problems = [];
    if (!res.bytes) problems.push('产物是 0 字节');
    if (!res.pages) problems.push('页数为 0');
    if (expect && expect.pages && res.pages !== expect.pages) problems.push('页数 ' + res.pages + ' 与预期 ' + expect.pages + ' 不一致');
    if (expect && expect.maxBytes && res.bytes > expect.maxBytes) problems.push('体积 ' + fmt(res.bytes) + ' 超过目标 ' + fmt(expect.maxBytes));
    res.ok = problems.length === 0;
    if (!res.ok) res.error = problems.join(';');
  } catch (e) {
    res.error = '产物读不回来(可能已损坏):' + friendlyError(e, 'PDF 解析失败');
  }
  return res;
}

const REGISTRY = {
  'star-map': { title: '文字星图', module: '/tools/star-map.mjs', v: 8 },
  'beat-toy': { title: '节奏玩具', module: '/tools/beat-toy.mjs', v: 7 },
  'cover-gen': { title: '封面图生成', module: '/tools/cover-gen.mjs', v: 8 },
  'watermark': { title: '批量加水印', module: '/tools/watermark.mjs', v: 1 },
  'exif-clean': { title: '照片去信息', module: '/tools/exif-clean.mjs', v: 1 },
  'receipt-clean': { title: '票据清理', module: '/tools/receipt-clean.mjs', v: 4 },
  'img-compress': { title: '图片压缩', module: '/tools/img-compress.mjs', v: 25 },
  'id-photo': { title: '证件照', module: '/tools/id-photo.mjs', v: 22 },
  'image-convert': { title: '图片转换', module: '/tools/image-convert.mjs', v: 9 },
  'images-to-pdf': { title: '图片合成 PDF', module: '/tools/images-to-pdf.mjs', v: 7 },
  'invoice-nup': { title: '发票拼版', module: '/tools/invoice-nup.mjs', v: 10 },
  'pdf-merge': { title: 'PDF 合并', module: '/tools/pdf-merge.mjs', v: 7 },
  'pdf-split': { title: 'PDF 拆分/旋转', module: '/tools/pdf-split.mjs', v: 7 },
  'pdf-render': { title: 'PDF 转图片', module: '/tools/pdf-render.mjs', v: 7 },
  'invoice-check': { title: '发票查重', module: '/tools/invoice-check.mjs', v: 5 },
  'pdf-compress': { title: 'PDF 压缩', module: '/tools/pdf-compress.mjs', v: 9 },
  'md-wechat': { title: 'Markdown 转公众号', module: '/tools/md-wechat.mjs', v: 1 },
  'text-clean': { title: '文本整理与对比', module: '/tools/text-clean.mjs', v: 1 },
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

const H = { esc, fmt, downloadBlob, downloadZip, checkImage, checkPdf, sniffHeic, heicNotice, injectCss, makeDropZone, loadScript, loadLib, dynLib, isLibFail, copyText, initTips, friendlyError, warnBelow, clearWarn, netMark, netReport, netLine, toast };

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


// ---------- 每个工具页都有的"零上传自证"行 ----------
// 为什么放在这里:以前只有 3 个工具自己画了这一行,其余 18 个页面没有 —— 而"能不能自己验证"
// 正是这个站点最该被看到的东西。放进位工具入口,谁都不用记得写。
// 已经是工具自己画的(文案更细,还带"压缩程序已就绪")就不重复加。
function ensureProofLine(root) {
  try {
    if (!root) return;
    if (root.getAttribute('data-tb-proof')) return;
    if (String(root.textContent || '').indexOf('上传 0 个文件') >= 0) return;
    if (String(root.textContent || '').indexOf('没有向服务器发送任何内容') >= 0) return;
    var box = document.createElement('div');
    box.className = 'tool-proof';
    box.setAttribute('data-tb-proof', '1');
    box.style.cssText = 'margin-top:22px;padding-top:14px;border-top:1px solid var(--c-hairline,#e8e8ed);font-size:14px;color:#6e6e73;line-height:1.6';
    var line = document.createElement('span');
    var link = document.createElement('a');
    link.href = '/verify/';
    link.textContent = '怎么自己验证';
    // 触控高度必须 ≥44px(自动检查会拦下来,这是真要求不是形式主义)
    link.style.cssText = 'color:#0066cc;margin-left:8px;display:inline-flex;align-items:center;min-height:44px;padding:0 2px';
    box.appendChild(line);
    box.appendChild(link);
    root.appendChild(box);
    var paint = function () { line.textContent = netLine(0); };
    paint();
    // 处理过程中数字会变(尤其是"跨域请求"),所以定期刷新;页面不可见时不刷,省电
    setInterval(function () { if (!document.hidden) paint(); }, 2000);
  } catch (e) { /* 自证行画不出来不能影响工具 */ }
}


// ---------- C 线:统一的手感增强(分段控件滑块 / 结果卡入场 / 进度条流光) ----------
// 放在工具入口而不是各工具里:22 个工具都应该有同样的手感,而且不该有人"忘了写"。
// 动效只做在 transform/opacity 上;分段滑块的 width 是唯一的例外(DESIGN.md 已如实记录原因)。
var _tbCssDone = false;
function injectSharedMotion() {
  if (_tbCssDone || typeof document === 'undefined') return;
  _tbCssDone = true;
  var s = document.createElement('style');
  s.setAttribute('data-tb-motion', '1');
  s.textContent = [
    '.seg-ind{position:absolute;left:0;top:0;z-index:0;border-radius:9px;background:#fff;',
    'box-shadow:inset 0 0 0 1px var(--c-hairline,#e8e8ed),0 1px 2px rgba(0,0,0,.06);pointer-events:none;',
    'transition:transform 220ms cubic-bezier(.22,1,.36,1),width 220ms cubic-bezier(.22,1,.36,1),height 220ms cubic-bezier(.22,1,.36,1)}',
    '.mode-tabs>button,.preset-tabs>button{position:relative;z-index:1}',
    '.mode-tabs>button.active,.preset-tabs>button.active{background:transparent!important;box-shadow:none!important}',
    '@media (prefers-reduced-motion: no-preference){',
    '@keyframes tbCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '.tb-card-in{animation:tbCardIn 320ms cubic-bezier(.22,1,.36,1) both}',
    '@keyframes tbShimmer{from{background-position:-120% 0}to{background-position:220% 0}}',
    '.progress-bar .fill{background-image:linear-gradient(100deg,var(--c-accent,#0071e3) 0%,var(--c-accent,#0071e3) 42%,#57a9ff 50%,var(--c-accent,#0071e3) 58%,var(--c-accent,#0071e3) 100%);background-size:220% 100%;animation:tbShimmer 1.7s linear infinite}',
    '}',
    '@media (prefers-reduced-motion: reduce){.seg-ind{transition:none}}',
    // 卡片收起(移除时)与结果区骨架屏
    '.tb-card-out{animation:tbCardOut 180ms cubic-bezier(.22,1,.36,1) both}',
    '@keyframes tbCardOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-6px) scale(.995)}}',
    '.tb-skel{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--c-hairline,#e8e8ed);border-radius:14px;padding:14px;margin-bottom:10px}',
    '.tb-skel .th{width:48px;height:48px;border-radius:10px;flex:0 0 auto;background:#eef0f3}',
    '.tb-skel .ln{flex:1}',
    '.tb-skel .ln i{display:block;height:10px;border-radius:6px;background:#eef0f3;margin:6px 0}',
    '.tb-skel .ln i:first-child{width:46%}',
    '.tb-skel .ln i:last-child{width:70%}',
    '@media (prefers-reduced-motion: no-preference){',
    '@keyframes tbSkelPulse{0%,100%{opacity:.55}50%{opacity:1}}',
    '.tb-skel .th,.tb-skel .ln i{animation:tbSkelPulse 1.4s ease-in-out infinite}',
    '}',
    '@media (prefers-reduced-motion: reduce){.tb-card-out{animation:none}}'
  ].join('');
  document.head.appendChild(s);
}

// 分段控件:一个会滑过去的白色药丸,跟着 active 走
function enhanceSegmented(root) {
  var boxes = root.querySelectorAll('.mode-tabs, .preset-tabs');
  Array.prototype.forEach.call(boxes, function (box) {
    if (box.getAttribute('data-tb-seg')) return;
    box.setAttribute('data-tb-seg', '1');
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    var ind = document.createElement('span');
    ind.className = 'seg-ind';
    ind.setAttribute('aria-hidden', 'true');
    box.insertBefore(ind, box.firstChild);
    function move() {
      var act = box.querySelector('button.active') || box.querySelector('button');
      if (!act) return;
      ind.style.width = act.offsetWidth + 'px';
      ind.style.height = act.offsetHeight + 'px';
      ind.style.transform = 'translate(' + act.offsetLeft + 'px,' + act.offsetTop + 'px)';
    }
    move();
    box.addEventListener('click', function () { requestAnimationFrame(move); });
    window.addEventListener('resize', move);
    if (window.ResizeObserver) { try { new ResizeObserver(move).observe(box); } catch (e) {} }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(move, function () {}); }
    // 工具可能在挂载后才渲染出 active(例如按用途预设),给它两次补位机会
    setTimeout(move, 120); setTimeout(move, 600);
  });
}

// 结果卡入场:只给"新出现的卡片"放一次动画,已经出现过的(整块重渲染时)不再重复播
var _tbCardSeen = {};
function enhanceCardEntrance(root) {
  if (typeof MutationObserver === 'undefined') return;
  var sel = '.result-card,.rc-card,.idp-card,.pdf-part,.cmp';
  var seen = _tbCardSeen;
  var mo = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes || [], function (n) {
        if (!n || n.nodeType !== 1) return;
        var list = [];
        if (n.matches && n.matches(sel)) list.push(n);
        if (n.querySelectorAll) list = list.concat(Array.prototype.slice.call(n.querySelectorAll(sel)));
        list.forEach(function (c, i) {
          if (c.getAttribute('data-tb-in')) return;
          c.setAttribute('data-tb-in', '1');
          var sig = (c.textContent || '').replace(/\s+/g, ' ').slice(0, 90);
          if (seen[sig]) return;           // 同一张卡(整块重渲染)不再重播
          seen[sig] = 1;
          c.classList.add('tb-card-in');
          c.style.animationDelay = Math.min(i * 40, 240) + 'ms';
        });
      });
    });
  });
  mo.observe(root, { childList: true, subtree: true });
}


// ---------- 卡片收起(移除时) ----------
// 各工具的"移除"按钮会直接重渲染、卡片瞬间消失。这里在捕获阶段先拦一下:
// 播 180ms 收起动画,再把点击交回工具自己的处理函数。reduced-motion 下完全不做这件事(不引入延迟)。
var _tbOutBound = false;
function enhanceCardExit(root) {
  if (_tbOutBound || typeof document === 'undefined') return;
  _tbOutBound = true;
  document.addEventListener('click', function (ev) {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var t = ev.target;
      var btn = t && t.closest ? t.closest('.remove-btn, .result-card .rm, .rc-card .rm') : null;
      if (!btn || btn.getAttribute('data-tb-out')) return;
      var card = btn.closest ? btn.closest('.result-card, .rc-card, .idp-card, .pdf-part') : null;
      if (!card) return;
      ev.preventDefault();
      ev.stopPropagation();
      btn.setAttribute('data-tb-out', '1');
      card.classList.add('tb-card-out');
      // FLIP:记下移除前每张卡的位置,等工具重渲染后把还在的卡片从不该在的位置动回去。
      // 很多工具是整块 innerHTML 重渲染(旧节点直接没了),所以按**内容签名**配对,而不是拿节点比。
      var box = card.parentElement;
      var before = {};
      if (box) {
        Array.prototype.forEach.call(box.querySelectorAll('.result-card, .rc-card'), function (n) {
          var s = (n.textContent || '').replace(/\s+/g, ' ').slice(0, 90);
          before[s] = n.getBoundingClientRect().top;
        });
      }
      setTimeout(function () {
        btn.click();
        if (!box) return;
        requestAnimationFrame(function () {
          try {
            Array.prototype.forEach.call(box.querySelectorAll('.result-card, .rc-card'), function (n) {
              var s = (n.textContent || '').replace(/\s+/g, ' ').slice(0, 90);
              if (before[s] === undefined) return;           // 新出现的卡交给入场动画
              var dy = before[s] - n.getBoundingClientRect().top;
              if (Math.abs(dy) < 4) return;
              n.style.transition = 'none';
              n.style.transform = 'translateY(' + Math.round(dy) + 'px)';
              requestAnimationFrame(function () {
                n.style.transition = 'transform 240ms cubic-bezier(.22,1,.36,1)';
                n.style.transform = '';
                setTimeout(function () { n.style.transition = ''; }, 280);
              });
            });
          } catch (e) { /* 补位动画失败不能影响移除结果 */ }
        });
      }, 185);
    } catch (e) { /* 动画失败不能挡住移除本身 */ }
  }, true);
}

// ---------- 结果区骨架屏 ----------
// 大文件/批量时"点完像没反应"是最容易劝退人的。投递文件后先摆几张骨架,
// 一旦真的有结果卡出现(或出现说明文字)就撤掉;最多留 10 秒,绝不让骨架挡住真相。
function skelContainer(root) {
  return root.querySelector('#res, #out, .results, .rc-grid, .idp-out');
}
// 只给"确实要算一会儿"的工具摆骨架:文档/文本类工具是瞬间出结果的,摆骨架反而是假信号
var TB_SLOW = { 'img-compress': 1, 'image-convert': 1, 'id-photo': 1, 'receipt-clean': 1, 'invoice-check': 1, 'invoice-nup': 1, 'images-to-pdf': 1, 'pdf-merge': 1, 'pdf-split': 1, 'pdf-render': 1, 'pdf-compress': 1 };
function showSkeletons(root) {
  var host = root && root.closest ? root.closest('[data-tb-slug]') : null;
  var slug = host ? host.getAttribute('data-tb-slug') : '';
  if (!TB_SLOW[slug]) return;
  var box = skelContainer(root);
  if (!box) return;
  // 只在容器完全空的时候摆,而且用插入而不是覆盖 —— 绝不碰工具已经写进去的任何内容
  if (box.children.length > 0 || box.querySelector('.tb-skel')) return;
  var html = '';
  for (var i = 0; i < 2; i++) html += '<div class="tb-skel" aria-hidden="true"><span class="th"></span><span class="ln"><i></i><i></i></span></div>';
  box.insertAdjacentHTML('afterbegin', html);
  var t0 = Date.now();
  var timer = setInterval(function () {
    if (box.querySelector('.result-card, .rc-card, .inv-tbl, .idp-card') || (box.querySelector('.note') && box.querySelector('.note').textContent.trim()) || Date.now() - t0 > 10000) {
      clearInterval(timer);
      var sk = box.querySelectorAll('.tb-skel');
      Array.prototype.forEach.call(sk, function (n) { n.parentNode && n.parentNode.removeChild(n); });
    }
  }, 250);
}

export async function mountTool(slug, root, titleEl) {
  const t = REGISTRY[slug];
  if (!t) {
    root.innerHTML = '<p class="tool-sub">工具未找到。</p>';
    if (titleEl) titleEl.textContent = '未找到';
    return;
  }
  if (titleEl) titleEl.textContent = t.title;
  try { root.setAttribute('data-tb-slug', slug); } catch (e) {}   // 供骨架屏判断"这个工具是否真的慢"
  // 页面 <title> 由各工具的静态 HTML 提供(SEO),这里不再覆盖
  try {
    const mod = await import(t.module + '?v=' + (t.v || 1));
    if (mod && mod.mount) {
      mod.mount(root, H);
      enhanceA11y(root);
      warmOffline([t.module + '?v=' + (t.v || 1)]);
      ensureProofLine(root);
      injectSharedMotion();
      enhanceSegmented(root);
      enhanceCardEntrance(root);
      enhanceCardExit(root);
    }
  } catch (e) {
    root.innerHTML = '<p class="tool-sub">工具加载失败。</p>';
    console.error('[toolbox]', slug, e);
  }
}