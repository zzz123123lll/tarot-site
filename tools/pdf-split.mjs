// tools/pdf-split.mjs — 提取/拆分/旋转（pdf-lib）
export function mount(root, H) {
  H.injectCss(".gen-bar{display:none;margin-top:18px}.note{font-size:14px;margin-top:12px;display:none}.note.ok{color:var(--c-ok)}.note.err{color:var(--c-err)}.opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");
  root.innerHTML =
    '<h1 class="tool-h1">PDF 拆分 / 旋转</h1>' +
    '<p class="tool-sub">提取页面、拆分、旋转，纯本地处理。</p>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg></div><div class="title">点击选择 PDF，或拖拽到此处</div><div class="hint">单个 PDF</div></div>' +
    '<div id="ops" style="display:none">' +
      '<div class="opt-row"><label>旋转</label><span class="seg" id="rot"><button data-r="0" class="active">0°</button><button data-r="90">90°</button><button data-r="180">180°</button><button data-r="270">270°</button></span></div>' +
      '<div class="opt-row"><label>页面范围</label><input type="text" class="tool-input" id="range" placeholder="留空=全部，如 1-3,5"></div>' +
      '<div class="opt-row"><label>输出</label><span class="seg" id="mode"><button data-m="single" class="active">合并成一个</button><button data-m="each">每页单独</button></span></div>' +
      '<div class="gen-bar" id="gen" style="display:block"><button class="tool-btn" id="go">处理并下载</button></div>' +
      '<p class="note" id="note"></p>' +
    '</div>';

  var file = null, rot = 0, mode = 'single';
  H.makeDropZone(root.querySelector('#dz'), function (fs) {
    var f = fs.find(function (x) { return x.type === 'application/pdf' || x.name.toLowerCase().indexOf('.pdf') >= 0; });
    if (f) { file = f; root.querySelector('#ops').style.display = 'block'; root.querySelector('#note').style.display = 'none'; }
  }, 'application/pdf');

  root.querySelector('#rot').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; rot = parseInt(b.dataset.r, 10); root.querySelectorAll('#rot button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
  root.querySelector('#mode').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; root.querySelectorAll('#mode button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
  root.querySelector('#go').addEventListener('click', generate);

  function parseRange(str, total) {
    var s = (str || '').trim();
    if (!s) { var all = []; for (var i = 0; i < total; i++) all.push(i); return all; }
    var result = [];
    s.split(',').forEach(function (part) {
      part = part.trim(); if (!part) return;
      if (part.indexOf('-') > 0) {
        var p = part.split('-'); var a = parseInt(p[0], 10), b = parseInt(p[1], 10);
        if (isNaN(a) || isNaN(b)) return;
        for (var i = a; i <= b; i++) result.push(i - 1);
      } else {
        var n = parseInt(part, 10); if (!isNaN(n)) result.push(n - 1);
      }
    });
    return result.filter(function (i) { return i >= 0 && i < total; });
  }

  async function generate() {
    var note = root.querySelector('#note');
    var btn = root.querySelector('#go');
    note.style.display = 'none';
    if (!file) return;
    btn.disabled = true;
    var oldText = btn.textContent;
    btn.textContent = '处理中…';
    try {
      try { await H.loadLib('/vendor/pdf-lib.min.js?v=1', 'PDF 处理程序'); } catch (e) { note.textContent = e.message; note.className = 'note err'; note.style.display = 'block'; return; }
      var PDFDoc = window.PDFLib.PDFDocument;
      var src = await PDFDoc.load(await file.arrayBuffer(), { ignoreEncryption: true });
      var idx = parseRange(root.querySelector('#range').value, src.getPageCount());
      if (!idx.length) { note.textContent = '没有匹配的页面。页面范围可以写成 1-3,5 这样的形式，留空表示全部。'; note.className = 'note err'; note.style.display = 'block'; return; }
      if (mode === 'each') {
        var parts = [];
        for (var k = 0; k < idx.length; k++) {
          var one = await PDFDoc.create();
          var pages = await one.copyPages(src, [idx[k]]);
          pages.forEach(function (p) { one.addPage(p); });
          if (rot) one.getPages().forEach(function (p) { p.setRotation(degrees(rot)); });
          var o = await one.save();
          parts.push({ name: 'page-' + (idx[k] + 1) + '.pdf', blob: new Blob([o], { type: 'application/pdf' }) });
        }
        H.downloadZip(parts, '拆分页面.zip');
        note.textContent = '已生成 ' + idx.length + ' 个单页 PDF,已打包下载。'; note.className = 'note ok'; note.style.display = 'block';
      } else {
        var out = await PDFDoc.create();
        var cpages = await out.copyPages(src, idx);
        cpages.forEach(function (p) { out.addPage(p); });
        if (rot) out.getPages().forEach(function (p) { p.setRotation(degrees(rot)); });
        var bytes = await out.save();
        H.downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'output.pdf');
        note.textContent = '已处理 ' + idx.length + ' 页。'; note.className = 'note ok'; note.style.display = 'block';
      }
    } catch (e) {
      note.textContent = '处理失败：' + H.friendlyError(e); note.className = 'note err'; note.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  function degrees(d) {
    if (d === 90) return 90; if (d === 180) return 180; if (d === 270) return 270; return 0;
  }
}
