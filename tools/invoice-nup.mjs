// tools/invoice-nup.mjs — 发票拼版:多张发票/扫描件排到 A4 上,输出一份 PDF
// 依据(有官方原文):单位报销常要求"原版 PDF/OFD 文件,不接受截图"(山西医科大学计划财务部《退单避坑攻略·发票篇》)。
// 所以这个工具的定位写清楚:适合打印报销与纸质留档;若对方要求原件,请直接交原文件 —— 不制造"交了却被退单"的结果。
// 原则:不裁剪发票内容、不改变比例、不压缩到看不清;每张发票完整可见。
export function mount(root, H) {
  H.injectCss(
    '.inv-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}'
    + '.inv-row label{font-size:13px;color:#6e6e73;white-space:nowrap}'
    + '.inv-list{margin-top:14px}'
    + '.inv-item{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:10px 14px;margin-bottom:8px}'
    + '.inv-item .n{font-size:12px;color:#6e6e73;min-width:18px}'
    + '.inv-item .nm{flex:1;font-size:13px;color:#1d1d1f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.inv-item .mv,.inv-item .rm{background:none;border:none;color:#6e6e73;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:6px}'
    + '.inv-item .rm:hover{color:#d70015;background:rgba(215,0,21,.08)}'
    + '.inv-hint{font-size:12.5px;color:#6e6e73;line-height:1.7}'
    + '.inv-warn{font-size:13px;color:#a1500a;background:rgba(200,106,30,.08);border:1px solid rgba(200,106,30,.18);border-radius:12px;padding:12px 14px;line-height:1.7;margin-bottom:16px}'
    + '.inv-out{margin-top:16px;font-size:13px;line-height:1.8}'
    + '.inv-out b{font-weight:600}'
  );

  var PER_PAGE = { 1: { cols: 1, rows: 1 }, 2: { cols: 1, rows: 2 }, 4: { cols: 2, rows: 2 } };
  var A4 = { w: 595.28, h: 841.89 };
  var MM = 2.8346; // 1mm = 2.8346pt

  var state = { perPage: 2, marginMm: 5, out: null, sources: [] };

  root.innerHTML =
    '<h1 class="tool-h1">发票拼版</h1>' +
    '<p class="tool-sub">把多张发票/扫描件排到 A4 上,输出一份 PDF。不裁剪、不变形、不压到看不清,全部在本机完成。</p>' +
    '<div class="inv-warn" id="warn">' +
      '<b>先说清楚:什么情况别用这个工具。</b><br>' +
      '很多单位报销要求「原版电子发票(PDF / OFD 原件)」——有财务部门的原话是「仅上传截图、照片,未使用原版 PDF/OFD 文件,无法检验真伪」,这类单据会被退单。' +
      '如果对方要原件,请直接交原文件;本工具适合<b>打印报销、纸质留档</b>。' +
    '</div>' +
    '<div class="inv-row"><label>每页几张</label><span class="mode-tabs" id="pp" style="margin:0"><button data-p="2" class="active">2 张(上下)</button><button data-p="1">1 张</button><button data-p="4">4 张(2×2)</button></span></div>' +
    '<div class="inv-row"><label>页边距</label><span class="mode-tabs" id="mg" style="margin:0"><button data-m="0">0</button><button data-m="5" class="active">5mm</button><button data-m="10">10mm</button></span></div>' +
    '<div class="tool-drop" id="dz"><div class="title">点击选择发票图片或 PDF,或拖拽到此处</div><div class="hint">支持 JPG / PNG / WebP 与 PDF(可多选,按添加顺序排);PDF 每页算一张</div></div>' +
    '<div class="inv-list" id="list"></div>' +
    '<div class="inv-row" id="actions" style="display:none"><button class="tool-btn" id="go">生成 A4 PDF</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>' +
    '<div class="inv-out" id="out" role="status" aria-live="polite"></div>' +
    '<p class="inv-hint" id="proof"></p>';

  var dz = root.querySelector('#dz');
  var out = root.querySelector('#out');

  root.querySelector('#pp').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.perPage = parseInt(b.dataset.p, 10);
    root.querySelectorAll('#pp button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });
  root.querySelector('#mg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.marginMm = parseInt(b.dataset.m, 10);
    root.querySelectorAll('#mg button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });

  H.makeDropZone(dz, addFiles, null, { multiple: true });
  root.querySelector('#go').addEventListener('click', generate);
  root.querySelector('#clr').addEventListener('click', function () {
    state.sources = []; state.out = null; out.innerHTML = ''; renderList();
  });

  async function addFiles(files) {
    var rejected = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.type === 'application/pdf') state.sources.push({ file: f, kind: 'pdf', name: f.name });
      else if (f.type.indexOf('image/') === 0) state.sources.push({ file: f, kind: 'image', name: f.name });
      else rejected++;
    }
    if (rejected) H.warnBelow(dz, '有 ' + rejected + ' 个文件不是图片也不是 PDF,已跳过。');
    else H.clearWarn(dz);
    renderList();
  }

  function renderList() {
    var list = root.querySelector('#list');
    list.innerHTML = state.sources.map(function (s, i) {
      return '<div class="inv-item"><span class="n">' + (i + 1) + '</span><span class="nm">' + H.esc(s.name) + '</span>'
        + '<span class="inv-hint">' + (s.kind === 'pdf' ? 'PDF' : '图片') + '</span>'
        + '<button class="mv" data-i="' + i + '" data-d="-1" data-tippy-content="上移" aria-label="上移">↑</button>'
        + '<button class="mv" data-i="' + i + '" data-d="1" data-tippy-content="下移" aria-label="下移">↓</button>'
        + '<button class="rm" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
    }).join('');
    list.querySelectorAll('.rm').forEach(function (b) {
      b.addEventListener('click', function () { state.sources.splice(parseInt(b.dataset.i, 10), 1); renderList(); });
    });
    list.querySelectorAll('.mv').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.dataset.i, 10), d = parseInt(b.dataset.d, 10), j = i + d;
        if (j < 0 || j >= state.sources.length) return;
        var t = state.sources[i]; state.sources[i] = state.sources[j]; state.sources[j] = t;
        renderList();
      });
    });
    root.querySelector('#actions').style.display = state.sources.length ? 'flex' : 'none';
    var hasShot = state.sources.some(function (s) { return s.kind === 'image'; });
    var tip = state.sources.length + ' 张待排';
    if (hasShot) tip += ' · 其中包含图片(截图/照片):部分单位明确不接受截图发票,请先确认对方要求';
    root.querySelector('#proof').textContent = state.sources.length ? tip : '';
    H.initTips(root);
  }

  // JPEG 的 EXIF 方向标记:不为 1 时说明照片被旋转过,必须走画布归一化,否则 PDF 里会躺倒
  function jpegOrientation(bytes) {
    try {
      if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return 1;
      var i = 2;
      while (i + 4 < bytes.length && bytes[i] === 0xFF) {
        var marker = bytes[i + 1], len = (bytes[i + 2] << 8) | bytes[i + 3];
        if (marker === 0xE1 && len > 8) {
          var s = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7], bytes[i + 8], bytes[i + 9]);
          if (s === 'Exif\u0000\u0000') {
            var base = i + 10;
            var big = bytes[base] === 0x4D;
            var rd16 = function (o) { return big ? (bytes[o] << 8) | bytes[o + 1] : (bytes[o + 1] << 8) | bytes[o]; };
            var rd32 = function (o) { return big ? (bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3] : (bytes[o + 3] << 24) | (bytes[o + 2] << 16) | (bytes[o + 1] << 8) | bytes[o]; };
            var ifd = base + rd32(base + 4);
            var n = rd16(ifd);
            for (var e = 0; e < n; e++) {
              var off = ifd + 2 + e * 12;
              if (rd16(off) === 0x0112) return rd16(off + 8) || 1;
            }
          }
        }
        if (marker === 0xDA) break;
        if (len < 2) break;
        i += 2 + len;
      }
    } catch (err) { /* 解析失败就按 1 处理 */ }
    return 1;
  }

  // 把每张发票变成可嵌入 PDF 的字节
  async function toPngBytes(src) {
    if (src.kind === 'pdf') {
      var pdfjsLib = await import('/vendor/pdfjs/pdf.min.mjs?v=1');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
      var bytes = new Uint8Array(await src.file.arrayBuffer());
      var doc = await pdfjsLib.getDocument({ data: bytes, cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
      var pages = [];
      for (var p = 1; p <= doc.numPages; p++) {
        var page = await doc.getPage(p);
        var vp1 = page.getViewport({ scale: 1 });
        var scale = Math.min(4, 150 / 72); // 约 150 DPI,保证小字看得清
        var vp = page.getViewport({ scale: scale });
        var c = document.createElement('canvas');
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
        pages.push({ bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, name: src.name + ' 第 ' + p + ' 页' });
      }
      return pages;
    }
    if (src.file.type === 'image/png') {
      var bmpP = await createImageBitmap(src.file, { imageOrientation: 'from-image' });
      var dimP = { w: bmpP.width, h: bmpP.height };
      bmpP.close();
      return [{ bytes: new Uint8Array(await src.file.arrayBuffer()), w: dimP.w, h: dimP.h, name: src.name, png: true }];
    }
    if (src.file.type === 'image/jpeg') {
      var raw = new Uint8Array(await src.file.arrayBuffer());
      if (jpegOrientation(raw) === 1) {
        var bmpJ = await createImageBitmap(src.file, { imageOrientation: 'from-image' });
        var dimJ = { w: bmpJ.width, h: bmpJ.height };
        bmpJ.close();
        return [{ bytes: raw, w: dimJ.w, h: dimJ.h, name: src.name, jpg: true }];
      }
      // 带旋转的 JPEG:走画布摆正后再嵌入
    }
    var b2 = await createImageBitmap(src.file, { imageOrientation: 'from-image' });
    var c2 = document.createElement('canvas');
    c2.width = b2.width; c2.height = b2.height;
    var x2 = c2.getContext('2d');
    x2.fillStyle = '#fff'; x2.fillRect(0, 0, c2.width, c2.height);
    x2.drawImage(b2, 0, 0);
    b2.close();
    var pb = await new Promise(function (r) { c2.toBlob(r, 'image/png'); });
    return [{ bytes: new Uint8Array(await pb.arrayBuffer()), w: c2.width, h: c2.height, name: src.name, png: true }];
  }

  async function generate() {
    if (!state.sources.length) return;
    var go = root.querySelector('#go');
    go.disabled = true;
    var netFrom = H.netMark ? H.netMark() : 0;
    out.innerHTML = '<div class="inv-hint" id="busy">正在读取 ' + state.sources.length + ' 个文件…</div>';
    try {
      await H.loadScript('/vendor/pdf-lib.min.js?v=1');
      var PDFDoc = window.PDFLib.PDFDocument;
      var doc = await PDFDoc.create();
      var items = [];
      for (var i = 0; i < state.sources.length; i++) {
        var pages = await toPngBytes(state.sources[i]);
        pages.forEach(function (pg) { items.push(pg); });
      }
      var out2 = root.querySelector('#busy');
      if (out2) out2.textContent = '正在排版 ' + items.length + ' 张…';

      var grid = PER_PAGE[state.perPage];
      var margin = state.marginMm * MM;
      var gap = 4 * MM;
      var cellW = (A4.w - margin * 2 - gap * (grid.cols - 1)) / grid.cols;
      var cellH = (A4.h - margin * 2 - gap * (grid.rows - 1)) / grid.rows;
      var perPage = grid.cols * grid.rows;
      var placedSizes = [];
      for (var k = 0; k < items.length; k += perPage) {
        var page = doc.addPage([A4.w, A4.h]);
        for (var slot = 0; slot < perPage && k + slot < items.length; slot++) {
          var it = items[k + slot];
          var img = it.jpg ? await doc.embedJpg(it.bytes) : await doc.embedPng(it.bytes);
          // 以"真正嵌进去的那张图"的尺寸算比例:等比缩放、刚好放进格子、不裁剪
          var iw = img.width || it.w, ih = img.height || it.h;
          var sc = Math.min(cellW / iw, cellH / ih);
          var dw = iw * sc, dh = ih * sc;
          var col = slot % grid.cols, row = Math.floor(slot / grid.cols);
          var cx = margin + col * (cellW + gap) + (cellW - dw) / 2;
          // PDF 坐标原点在左下角:第一格放在最上面
          var cyTop = A4.h - margin - row * (cellH + gap);
          var cy = cyTop - (cellH - dh) / 2 - dh;
          page.drawImage(img, { x: cx, y: cy, width: dw, height: dh });
          placedSizes.push({ w: dw / MM / 10, h: dh / MM / 10 });
        }
      }
      var bytes = await doc.save();
      var blob = new Blob([bytes], { type: 'application/pdf' });
      state.out = blob;
      var dims = placedSizes[0] ? (placedSizes[0].w.toFixed(1) + '×' + placedSizes[0].h.toFixed(1) + ' cm') : '-';
      var proof = H.netLine ? H.netLine(netFrom) : '本次处理:上传 0 个文件';
      out.innerHTML =
        '<div><b>' + doc.getPageCount() + ' 页 A4</b> · ' + items.length + ' 张发票 · ' + H.fmt(blob.size) + ' · 每张约 ' + dims + '</div>'
        + '<div class="inv-hint">每页 ' + perPage + ' 张,页边距 ' + state.marginMm + 'mm,按原比例居中缩放,<b>没有裁剪</b>发票内容。</div>'
        + '<div class="inv-row" style="margin-top:12px"><button class="tool-btn" id="dl">下载 PDF</button></div>'
        + '<div class="inv-hint">' + H.esc(proof) + ' · <a href="/verify/">怎么自己验证</a></div>';
      out.querySelector('#dl').addEventListener('click', function () {
        if (state.out) H.downloadBlob(state.out, '发票拼版-A4-' + doc.getPageCount() + '页.pdf');
      });
    } catch (e) {
      out.innerHTML = '<div class="inv-hint">生成失败:' + H.esc(H.friendlyError ? H.friendlyError(e, '文件可能已损坏或受密码保护') : '请换一批文件再试') + '</div>';
    }
    go.disabled = false;
  }

  renderList();
}
