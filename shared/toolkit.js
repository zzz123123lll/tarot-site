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
  loadScript('/vendor/jszip.min.js?v=1').then(function () {
    if (!window.JSZip) return;
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
    }).catch(function () {});
  }, function () {});
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
  loadScript('/vendor/tippy-bundle.umd.min.js?v=1').then(apply, fallback);
}
// 让一个容器变成"点击选文件 + 拖拽"的投放区
export function makeDropZone(el, onFiles, accept) {
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
    if (e.dataTransfer && e.dataTransfer.files) onFiles(Array.from(e.dataTransfer.files));
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

const H = { esc, fmt, downloadBlob, downloadZip, injectCss, makeDropZone, loadScript, copyText, initTips };

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
    if (mod && mod.mount) mod.mount(root, H);
  } catch (e) {
    root.innerHTML = '<p class="tool-sub">工具加载失败。</p>';
    console.error('[toolbox]', slug, e);
  }
}