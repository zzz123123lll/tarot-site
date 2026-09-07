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
  'uuid': { title: 'UUID / 密码', module: '/tools/uuid.mjs' },
  'unit': { title: '单位换算', module: '/tools/unit.mjs' },
  'bmi': { title: 'BMI 计算器', module: '/tools/bmi.mjs' },
  'date': { title: '日期计算', module: '/tools/date.mjs' }
};

const H = { esc, fmt, downloadBlob, injectCss, makeDropZone, loadScript };

export async function mountTool(slug, root, titleEl) {
  const t = REGISTRY[slug];
  if (!t) {
    root.innerHTML = '<p class="tool-sub">工具未找到。</p>';
    if (titleEl) titleEl.textContent = '未找到';
    return;
  }
  if (titleEl) titleEl.textContent = t.title;
  document.title = t.title + ' · 工具盒';
  try {
    const mod = await import(t.module + '?v=1');
    if (mod && mod.mount) mod.mount(root, H);
  } catch (e) {
    root.innerHTML = '<p class="tool-sub">工具加载失败。</p>';
    console.error('[toolbox]', slug, e);
  }
}