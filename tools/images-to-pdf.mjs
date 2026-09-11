// tools/images-to-pdf.mjs — 多张图片合成一个 PDF（pdf-lib）
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.gen-bar{display:none;margin-top:18px}.note-ok{font-size:14px;color:var(--c-ok);margin-top:12px;display:none}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg>';

  root.innerHTML =
    '<h1 class="tool-h1">图片合成 PDF</h1>' +
    '<p class="tool-sub">多张图片合成一个 PDF，纯本地处理，不上传。</p>' +
    '<div class="opt-row"><label>页面</label><span class="seg" id="pm"><button data-p="fit" class="active">适应图片</button><button data-p="a4p">A4 纵向</button><button data-p="a4l">A4 横向</button></span></div>' +
    '<div class="tool-drop" id="dz"><div class="icon">' + icon + '</div><div class="title">点击选择图片，或拖拽到此处</div><div class="hint">支持 JPG、PNG、WebP、BMP、GIF（按添加顺序合成）</div></div>' +
    '<div class="file-list" id="list"></div>' +
    '<div class="gen-bar" id="gen"><button class="tool-btn" id="go">生成并下载 PDF</button></div>' +
    '<p class="note-ok" id="oknote">PDF 已生成，开始下载。</p>';

  var pageMode = 'fit';
  var files = [];

  root.querySelector('#pm').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    pageMode = b.dataset.p;
    root.querySelectorAll('#pm button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });

  H.makeDropZone(root.querySelector('#dz'), function (fs) {
    fs.forEach(function (f) { if (f.type.indexOf('image/') === 0) files.push(f); });
    renderList();
  }, 'image/*');

  root.querySelector('#go').addEventListener('click', function () { generate(); });

  function renderList() {
    var list = root.querySelector('#list');
    var html = '';
    files.forEach(function (f, i) {
      html += '<div class="file-row"><span class="n">' + (i + 1) + '</span><span class="nm">' + H.esc(f.name) + '</span>'
        + '<button class="mv" data-i="' + i + '" data-d="-1" data-tippy-content="上移" aria-label="上移">↑</button>'
        + '<button class="mv" data-i="' + i + '" data-d="1" data-tippy-content="下移" aria-label="下移">↓</button>'
        + '<button class="rm" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
    });
    list.innerHTML = html;
    list.querySelectorAll('.rm').forEach(function (b) {
      b.addEventListener('click', function () { files.splice(parseInt(b.dataset.i, 10), 1); renderList(); });
    });
    list.querySelectorAll('.mv').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.dataset.i, 10), d = parseInt(b.dataset.d, 10), j = i + d;
        if (j < 0 || j >= files.length) return;
        var t = files[i]; files[i] = files[j]; files[j] = t; renderList();
      });
    });
    root.querySelector('#gen').style.display = files.length ? 'block' : 'none';
    H.initTips(root);
  }

  async function generate() {
    if (!files.length) return;
    var btn = root.querySelector('#go');
    var ok = root.querySelector('#oknote');
    ok.style.display = 'none';
    btn.disabled = true;
    var oldText = btn.textContent;
    btn.textContent = '生成中…';
    try {
      await H.loadScript('/vendor/pdf-lib.min.js?v=1');
      var PDFDoc = window.PDFLib.PDFDocument;
      var pdfDoc = await PDFDoc.create();
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var mime = file.type;
      var data, imgW, imgH;
      if (mime === 'image/jpeg' || mime === 'image/png') {
        var bytes = await file.arrayBuffer();
        data = mime === 'image/jpeg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
        imgW = data.width; imgH = data.height;
      } else {
        var bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        var c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d').drawImage(bmp, 0, 0);
        bmp.close();
        var pngBlob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
        var pngBytes = await pngBlob.arrayBuffer();
        data = await pdfDoc.embedPng(pngBytes);
        imgW = data.width; imgH = data.height;
      }
      var pw, ph;
      if (pageMode === 'a4p') { pw = 595.28; ph = 841.89; }
      else if (pageMode === 'a4l') { pw = 841.89; ph = 595.28; }
      else { pw = imgW; ph = imgH; }
      var page = pdfDoc.addPage([pw, ph]);
      var scale = (pageMode === 'fit') ? 1 : Math.min(pw / imgW, ph / imgH);
      var dw = imgW * scale, dh = imgH * scale;
      page.drawImage(data, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
    }
    var out = await pdfDoc.save();
      var blob = new Blob([out], { type: 'application/pdf' });
      H.downloadBlob(blob, 'images.pdf');
      ok.textContent = 'PDF 已生成，开始下载。';
      ok.style.color = '';
      ok.style.display = 'block';
    } catch (e) {
      ok.textContent = '生成失败：' + H.friendlyError(e, '图片可能已损坏，或格式不受支持。');
      ok.style.color = '#d70015';
      ok.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = oldText;
  }
}
