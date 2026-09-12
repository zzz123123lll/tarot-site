// tools/pdf-compress.mjs — PDF 压缩（栅格化重压，适合扫描件/图片型）
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.gen-bar{display:none;margin-top:18px}.note{font-size:14px;margin-top:12px;display:none}.note.ok{color:var(--c-ok)}.note.err{color:var(--c-err)}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");
  root.innerHTML =
    '<h1 class="tool-h1">PDF 压缩</h1>' +
    '<p class="tool-sub">适合扫描件/图片型 PDF；文字型会变成图、丢失可复制文本。没压更小就跳过。</p>' +
    '<div class="opt-row"><label>预设</label><span class="seg" id="pr"><button data-d="120">小文件</button><button data-d="150" class="active">均衡</button><button data-d="200">高质量</button></span></div>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg></div><div class="title">点击选择 PDF，或拖拽到此处</div><div class="hint">单个 PDF，本地栅格化重压</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<p class="note" id="note"></p>';

  var dpi = 150, pdfjsLib = null;

  root.querySelector('#pr').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; dpi = parseInt(b.dataset.d, 10); root.querySelectorAll('#pr button').forEach(function (x) { x.classList.toggle('active', x === b); }); });

  H.makeDropZone(root.querySelector('#dz'), async function (files) {
    var f = files.find(function (x) { return x.type === 'application/pdf' || x.name.toLowerCase().indexOf('.pdf') >= 0; });
    if (!f) return;
    var note = root.querySelector('#note'); note.style.display = 'none';
    try {
      if (!pdfjsLib) {
        pdfjsLib = await H.dynLib('/vendor/pdfjs/pdf.min.mjs?v=1', 'PDF 显示程序');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
      }
      await H.loadLib('/vendor/pdf-lib.min.js?v=1', 'PDF 生成程序');
      var PDFDoc = window.PDFLib.PDFDocument;
      var origBytes = await f.arrayBuffer();
      var doc = await pdfjsLib.getDocument({ data: origBytes, cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
      if (doc.numPages > 100) { note.textContent = '页数过多，请拆分。'; note.className = 'note err'; note.style.display = 'block'; return; }
      var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill');
      pg.style.display = 'block'; fill.style.width = '0%';
      note.textContent = '正在压缩,请稍候…'; note.className = 'note'; note.style.display = 'block';
      var out = await PDFDoc.create();
      for (var p = 1; p <= doc.numPages; p++) {
        var page = await doc.getPage(p);
        var vp1 = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: dpi / 72 });
        var c = document.createElement('canvas');
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var jpegBlob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.8); });
        var jpegBytes = await jpegBlob.arrayBuffer();
        var img = await out.embedJpg(jpegBytes);
        var np = out.addPage([vp1.width, vp1.height]);
        np.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
        fill.style.width = (p / doc.numPages * 100) + '%';
      }
      pg.style.display = 'none';
      var outBytes = await out.save();
      if (outBytes.length >= origBytes.byteLength) {
        note.textContent = '压缩后没有变小（' + H.fmt(outBytes.length) + ' ≥ ' + H.fmt(origBytes.byteLength) + '），已保留原文件。'; note.className = 'note err'; note.style.display = 'block';
      } else {
        H.downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), f.name.replace(/\.pdf$/i, '_compressed.pdf'));
        var pct = Math.round((1 - outBytes.length / origBytes.byteLength) * 100);
        note.textContent = '已压缩：' + H.fmt(origBytes.byteLength) + ' → ' + H.fmt(outBytes.length) + '（-' + pct + '%）'; note.className = 'note ok'; note.style.display = 'block';
      }
    } catch (e) {
      var pg2 = root.querySelector('#pg');
      if (pg2) pg2.style.display = 'none';
      note.textContent = H.isLibFail(e) ? H.friendlyError(e) : '压缩失败：' + H.friendlyError(e); note.className = 'note err'; note.style.display = 'block';
    }
  }, 'application/pdf');
}
