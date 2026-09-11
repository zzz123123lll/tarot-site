// tools/pdf-render.mjs — PDF 转图片（pdf.js）
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.gen-bar{display:none;margin-top:18px}.note{font-size:14px;margin-top:12px;display:none}.note.ok{color:var(--c-ok)}.note.err{color:#d70015}.progress-bar{display:none;height:6px;background:#f5f5f7;border-radius:999px;margin:16px 0 0;overflow:hidden}.progress-bar .fill{height:100%;background:#0071e3;border-radius:999px;transition:width .2s}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");
  root.innerHTML =
    '<h1 class="tool-h1">PDF 转图片</h1>' +
    '<p class="tool-sub">PDF 每页转成图片，纯本地处理。</p>' +
    '<div class="opt-row"><label>分辨率</label><span class="seg" id="dpi"><button data-d="150" class="active">150 DPI</button><button data-d="300">300 DPI</button></span></div>' +
    '<div class="opt-row"><label>格式</label><span class="seg" id="fmt"><button data-f="image/jpeg" class="active">JPG</button><button data-f="image/png">PNG</button></span></div>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg></div><div class="title">点击选择 PDF，或拖拽到此处</div><div class="hint">单个 PDF，逐页转图</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<div class="gen-bar" id="gen"><button class="tool-btn" id="dlAll">全部下载</button></div>' +
    '<p class="note" id="note"></p>';

  var dpi = 150, fmt = 'image/jpeg', pdfjsLib = null, blobs = [];

  root.querySelector('#dpi').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; dpi = parseInt(b.dataset.d, 10); root.querySelectorAll('#dpi button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
  root.querySelector('#fmt').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; fmt = b.dataset.f; root.querySelectorAll('#fmt button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
  root.querySelector('#dlAll').addEventListener('click', function () {
    H.downloadZip(blobs, 'PDF转图.zip');
  });

  H.makeDropZone(root.querySelector('#dz'), async function (files) {
    var f = files.find(function (x) { return x.type === 'application/pdf' || x.name.toLowerCase().indexOf('.pdf') >= 0; });
    if (!f) return;
    var note = root.querySelector('#note'); note.style.display = 'none';
    try {
      if (!pdfjsLib) {
        pdfjsLib = await import('/vendor/pdfjs/pdf.min.mjs?v=1');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
      }
      var bytes = await f.arrayBuffer();
      var doc = await pdfjsLib.getDocument({ data: bytes, cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
      if (doc.numPages > 200) { note.textContent = '页数过多（' + doc.numPages + ' 页），请拆分成多个文件。'; note.className = 'note err'; note.style.display = 'block'; return; }
      var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill');
      pg.style.display = 'block'; fill.style.width = '0%';
      var dl = root.querySelector('#dlAll');
      if (dl) dl.disabled = true;
      note.textContent = '正在转出 第 1/' + doc.numPages + ' 页…'; note.className = 'note'; note.style.display = 'block';
      blobs = [];
      var ext = fmt === 'image/jpeg' ? '.jpg' : '.png';
      for (var p = 1; p <= doc.numPages; p++) {
        var page = await doc.getPage(p);
        var scale = dpi / 72;
        var vp = page.getViewport({ scale: scale });
        var m = Math.max(vp.width, vp.height);
        if (m > 16000) { scale = scale * 16000 / m; vp = page.getViewport({ scale: scale }); }
        var c = document.createElement('canvas');
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        var ctx = c.getContext('2d');
        if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var blob = await new Promise(function (r) { c.toBlob(r, fmt, 0.92); });
        blobs.push({ blob: blob, name: 'page-' + p + ext });
        fill.style.width = (p / doc.numPages * 100) + '%';
        note.textContent = '正在转出 第 ' + p + '/' + doc.numPages + ' 页…';
      }
      pg.style.display = 'none';
      if (dl) dl.disabled = false;
      root.querySelector('#gen').style.display = 'block';
      note.textContent = '已转出 ' + doc.numPages + ' 页，点「全部下载」。'; note.className = 'note ok'; note.style.display = 'block';
    } catch (e) {
      var pg2 = root.querySelector('#pg');
      if (pg2) pg2.style.display = 'none';
      var dl2 = root.querySelector('#dlAll');
      if (dl2) dl2.disabled = false;
      note.textContent = '转换失败：' + H.friendlyError(e); note.className = 'note err'; note.style.display = 'block';
    }
  }, 'application/pdf');
}
