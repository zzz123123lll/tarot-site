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
// 让一个容器变成"点击选文件 + 拖拽"的投放区
export function makeDropZone(el, onFiles, accept) {
  // 键盘可达:让只用键盘的人也能选择文件
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', '选择文件：按回车或空格打开文件选择框，也可以把文件拖到这里');
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
    input.multiple = true;
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
  'img-compress': { title: '图片压缩', module: '/tools/img-compress.mjs' },
  'image-convert': { title: '图片转换', module: '/tools/image-convert.mjs' },
  'images-to-pdf': { title: '图片合成 PDF', module: '/tools/images-to-pdf.mjs' },
  'pdf-merge': { title: 'PDF 合并', module: '/tools/pdf-merge.mjs' },
  'pdf-split': { title: 'PDF 拆分/旋转', module: '/tools/pdf-split.mjs' },
  'pdf-render': { title: 'PDF 转图片', module: '/tools/pdf-render.mjs' },
  'pdf-compress': { title: 'PDF 压缩', module: '/tools/pdf-compress.mjs' },
  'json': { title: 'JSON 格式化', module: '/tools/json.mjs' },
  'base64': { title: 'Base64 编解码', module: '/tools/base64.mjs' },
  'regex': { title: '正则测试', module: '/tools/regex.mjs' },
  'color': { title: '颜色工具', module: '/tools/color.mjs' },
  'qr': { title: '二维码生成', module: '/tools/qr.mjs' },
  'jwt': { title: 'JWT 解码', module: '/tools/jwt.mjs' },
  'hash': { title: 'Hash 摘要', module: '/tools/hash.mjs' },
  'url': { title: 'URL 编解码', module: '/tools/url.mjs' },
  'uuid': { title: 'UUID / 密码', module: '/tools/uuid.mjs' },
  'date': { title: '日期 & 时间戳', module: '/tools/date.mjs' }
};

const H = { esc, fmt, downloadBlob, downloadZip, injectCss, makeDropZone, loadScript, copyText, initTips, friendlyError, warnBelow, clearWarn };

// 通用无障碍增强:动态状态区可被读屏播报;标签与输入框建立关联
export function enhanceA11y(root) {
  if (!root || !root.querySelectorAll) return;
  Array.prototype.forEach.call(root.querySelectorAll('.note, .err-box, .err-text, .tool-warn, .note-ok'), function (el) {
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
    const mod = await import(t.module + '?v=1');
    if (mod && mod.mount) { mod.mount(root, H); enhanceA11y(root); }
  } catch (e) {
    root.innerHTML = '<p class="tool-sub">工具加载失败。</p>';
    console.error('[toolbox]', slug, e);
  }
}