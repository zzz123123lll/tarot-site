// tools/receipt-clean.mjs — 票据/扫描件清理:去灰底 + 自动裁边 + 自动摆正(全本地,零依赖)
// 为什么做:手机拍发票常是"发灰、拍歪、四周一堆桌面",打印或上传都看不清。
// 做法都是纯 canvas 像素运算,不引入任何库,也不上传。
export function mount(root, H) {
  H.injectCss(".rc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:16px}"
    + ".rc-card{background:#fff;border:1px solid var(--c-hairline);border-radius:14px;padding:14px}"
    + ".rc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}"
    + ".rc-name{font-size:14px;color:var(--t-text);word-break:break-all}"
    + ".rc-meta{font-size:13px;color:#6e6e73;line-height:1.6;margin-top:6px}"
    + ".rc-opt{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px}"
    + ".rc-opt label{font-size:14px;color:#6e6e73}"
    + ".rc-chk{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--t-text);cursor:pointer;min-height:44px}"
    + ".rc-chk input{width:18px;height:18px}"
    + ".cmp img{background:repeating-conic-gradient(#f0f0f2 0% 25%,#fff 0% 50%) 50%/16px 16px}");

  root.innerHTML =
    '<h1 class="tool-h1">票据清理</h1>' +
    '<p class="tool-sub">把手机拍的发票、单据、扫描件变干净:去灰底、自动裁掉四周多余边距、自动摆正。支持图片与 PDF(扫描件 PDF 也会逐页处理),全程本地。</p>' +
    '<div class="rc-opt">' +
      '<label class="rc-chk"><input type="checkbox" id="oWhite" checked>去灰底(纸面变白)</label>' +
      '<label class="rc-chk"><input type="checkbox" id="oCrop" checked>自动裁边</label>' +
      '<label class="rc-chk"><input type="checkbox" id="oDesk" checked>自动摆正</label>' +
      '<label>强度<select class="tool-input" id="oStr" style="width:110px"><option value="0.85">柔和</option><option value="1" selected>标准</option><option value="1.18">强烈</option></select></label>' +
      '<label>输出<select class="tool-input" id="oFmt" style="width:120px"><option value="image/png" selected>PNG(文字最清楚)</option><option value="image/jpeg">JPG(体积小)</option></select></label>' +
    '</div>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/><path d="M3 12h18"/><path d="M7 10v4"/><path d="M17 10v4"/></svg></div><div class="title">点击选择发票照片 / 扫描件,或拖拽到此处</div><div class="hint">JPG / PNG / WebP / PDF,可批量</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<p class="progress-note" id="pgt" role="status" aria-live="polite" style="display:none"></p>' +
    '<p class="note" id="note"></p>' +
    '<div class="batch-actions" id="ba" style="display:none"><button class="tool-btn" id="dlAll">打包下载(ZIP)</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>' +
    '<div class="rc-grid" id="out"></div>';

  var note = root.querySelector('#note');
  var out = root.querySelector('#out');
  var items = [];
  var urls = [];
  var pdfLib = null;
  function say(t, kind) { note.textContent = t; note.className = 'note' + (kind ? ' ' + kind : ''); note.style.display = 'block'; }
  function urlFor(blob) { var u = URL.createObjectURL(blob); urls.push(u); return u; }
  function releaseUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }

  // ---------- 像素工具 ----------
  function newCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function scaleCanvas(src, maxSide) {
    var s = Math.min(1, maxSide / Math.max(src.width, src.height));
    if (s >= 1) return src;
    var c = newCanvas(Math.max(1, Math.round(src.width * s)), Math.max(1, Math.round(src.height * s)));
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function percentiles(canvas) {
    // 采样估黑白场:纸面白 ≈ 90 分位,字迹/阴影黑 ≈ 3 分位(比取平均稳,不受内容多少影响)
    var g = canvas.getContext('2d', { willReadFrequently: true });
    var w = canvas.width, h = canvas.height;
    var d = g.getImageData(0, 0, w, h).data;
    var step = Math.max(1, Math.floor(Math.sqrt(w * h / 60000)));
    var hist = new Uint32Array(256), n = 0;
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) {
      var i = (y * w + x) * 4;
      var lum = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
      hist[Math.max(0, Math.min(255, Math.round(lum)))]++; n++;
    }
    function pct(p) { var target = n * p, acc = 0; for (var v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) return v; } return 255; }
    return { black: pct(0.03), white: pct(0.90) };
  }
  function whiteBalance(canvas, strength) {
    var g = canvas.getContext('2d', { willReadFrequently: true });
    var w = canvas.width, h = canvas.height;
    var img = g.getImageData(0, 0, w, h), d = img.data;
    var st = percentiles(canvas);
    var lo = st.black, hi = Math.max(st.white, lo + 12);
    // 白点按强度往 255 推;黑点保持不动,免得把浅灰文字压没
    var white = 255 - (255 - hi) / Math.max(0.4, strength);
    var span = Math.max(18, white - lo);
    var lut = new Uint8ClampedArray(256);
    for (var v = 0; v < 256; v++) lut[v] = Math.round(Math.max(0, Math.min(255, (v - lo) * 255 / span)));
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      // 按通道白平衡:发票上的红章不会被当成灰底抹掉
      d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
    }
    g.putImageData(img, 0, 0);
    return { black: lo, white: Math.round(white) };
  }
  function contentBox(canvas) {
    var small = scaleCanvas(canvas, 600);
    var g = small.getContext('2d', { willReadFrequently: true });
    var w = small.width, h = small.height;
    var d = g.getImageData(0, 0, w, h).data;
    function px(x, y) { var i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }
    // 以四条边中位数当"背景色",与背景差别够大或明显更暗的算内容
    var samples = [];
    for (var x = 0; x < w; x += 2) { samples.push(px(x, 0)); samples.push(px(x, h - 1)); }
    for (var y = 0; y < h; y += 2) { samples.push(px(0, y)); samples.push(px(w - 1, y)); }
    var med = [0, 1, 2].map(function (k) { var a = samples.map(function (s) { return s[k]; }).sort(function (p, q) { return p - q; }); return a[Math.floor(a.length / 2)]; });
    var bgLum = (med[0] * 299 + med[1] * 587 + med[2] * 114) / 1000;
    var rows = new Uint32Array(h), cols = new Uint32Array(w);
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      var c = px(xx, yy);
      var diff = Math.max(Math.abs(c[0] - med[0]), Math.abs(c[1] - med[1]), Math.abs(c[2] - med[2]));
      var lum = (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000;
      if (diff > 30 || lum < bgLum - 45) { rows[yy]++; cols[xx]++; }
    }
    var rowMin = Math.max(1, w * 0.004), colMin = Math.max(1, h * 0.004);
    var top = 0, bottom = h - 1, left = 0, right = w - 1;
    while (top < h && rows[top] < rowMin) top++;
    while (bottom > top && rows[bottom] < rowMin) bottom--;
    while (left < w && cols[left] < colMin) left++;
    while (right > left && cols[right] < colMin) right--;
    if (bottom <= top || right <= left) return null;
    var padX = Math.round(w * 0.012), padY = Math.round(h * 0.012);
    top = Math.max(0, top - padY); bottom = Math.min(h - 1, bottom + padY);
    left = Math.max(0, left - padX); right = Math.min(w - 1, right + padX);
    // 换算回原尺寸
    var sx = canvas.width / w, sy = canvas.height / h;
    return { x: Math.round(left * sx), y: Math.round(top * sy), w: Math.round((right - left + 1) * sx), h: Math.round((bottom - top + 1) * sy) };
  }
  function cropTo(canvas, box) {
    var c = newCanvas(box.w, box.h);
    c.getContext('2d').drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    return c;
  }
  function rotate(canvas, deg) {
    var rad = deg * Math.PI / 180;
    var w = canvas.width, h = canvas.height;
    var cw = Math.round(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
    var ch = Math.round(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));
    var c = newCanvas(cw, ch);
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch);
    g.translate(cw / 2, ch / 2); g.rotate(rad); g.drawImage(canvas, -w / 2, -h / 2);
    return c;
  }
  function detectSkew(canvas) {
    // 投影法:把每个角度的行"墨迹和"做成剖面,剖面越像方波(相邻差平方和越大)说明越正
    var small = scaleCanvas(canvas, 420);
    var base = scaleCanvas(small, 300);
    var maxDeg = 6, step = 0.5;
    function score(deg) {
      var c = deg === 0 ? base : rotate(base, deg);
      var g = c.getContext('2d', { willReadFrequently: true });
      var w = c.width, h = c.height;
      var d = g.getImageData(0, 0, w, h).data;
      var rows = new Float64Array(h);
      for (var y = 0; y < h; y++) {
        var s = 0;
        for (var x = 0; x < w; x += 2) {
          var i = (y * w + x) * 4;
          var lum = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
          s += Math.max(0, 190 - lum);
        }
        rows[y] = s;
      }
      var sc = 0;
      for (var k = 1; k < h; k++) { var df = rows[k] - rows[k - 1]; sc += df * df; }
      return sc;
    }
    var s0 = score(0), best = 0, bestScore = s0;
    for (var deg = -maxDeg; deg <= maxDeg + 1e-9; deg += step) {
      if (Math.abs(deg) < 1e-9) continue;
      var sc = score(deg);
      if (sc > bestScore) { bestScore = sc; best = deg; }
    }
    var confident = s0 > 0 && (bestScore / s0) > 1.08; // 提升不到 8% 就别乱转
    return { deg: confident ? best : 0, raw: best, gain: s0 ? bestScore / s0 : 0, confident: confident };
  }

  // ---------- 处理一张(已解码为 canvas) ----------
  function clean(canvas, opt) {
    var work = canvas, info = { crop: null, skew: null, levels: null };
    if (opt.crop) {
      var b = contentBox(work);
      if (b && (b.w < work.width * 0.995 || b.h < work.height * 0.995)) {
        info.crop = { from: work.width + '×' + work.height, to: b.w + '×' + b.h };
        work = cropTo(work, b);
      }
    }
    if (opt.deskew) {
      var sk = detectSkew(work);
      info.skew = sk;
      if (Math.abs(sk.deg) >= 0.5) work = rotate(work, sk.deg);
      // 转完再裁一次,把转出来的白边去掉
      if (opt.crop) {
        var b2 = contentBox(work);
        if (b2) work = cropTo(work, b2);
      }
    }
    if (opt.white) info.levels = whiteBalance(work, opt.strength);
    return { canvas: work, info: info };
  }

  async function canvasToBlob(c, type) {
    return await new Promise(function (r) { c.toBlob(r, type, type === 'image/jpeg' ? 0.92 : undefined); });
  }

  function render() {
    if (!items.length) { out.innerHTML = ''; root.querySelector('#ba').style.display = 'none'; return; }
    var html = '';
    items.forEach(function (it, i) {
      html += '<div class="rc-card"><div class="rc-head"><span class="rc-name">' + H.esc(it.name) + '</span>' +
        (it.status === 'ok' ? '<button class="tool-btn" data-dl="' + i + '">下载</button>' : '') + '</div>';
      if (it.status === 'ok') {
        var afterImg = it.preview || it.blob;   // PDF 的产物是 PDF,对比展示用第 1 页的清理结果
        html += '<div class="cmp"><img class="cmp-old" src="' + urlFor(it.before) + '" alt="处理前">'
          + '<div class="cmp-new"><img src="' + urlFor(afterImg) + '" alt="处理后"></div>'
          + '<span class="cmp-line" aria-hidden="true"></span>'
          + '<input class="cmp-r" type="range" min="0" max="100" value="50" step="1" aria-label="拖动对比处理前后"></div>';
        var m = [];
        if (it.info.crop) m.push('裁边:' + it.info.crop.from + ' → ' + it.info.crop.to);
        if (it.info.skew) m.push('摆正:' + (it.info.skew.confident ? (it.info.skew.deg > 0 ? '+' : '') + it.info.skew.deg.toFixed(1) + '°' : '看起来已经摆正'));
        if (it.info.levels) m.push('纸面白场提到 ' + it.info.levels.white + '(原 ' + it.info.levels.black + '-' + it.info.levels.white + ')');
        var sizeText = it.isPdf ? (it.info.pages + ' 页 · ' + H.fmt(it.blob.size)) : (it.outW + '×' + it.outH + ' · ' + H.fmt(it.blob.size));
        if (it.isPdf) m.unshift('逐页清理后重新组装成 PDF');
        html += '<div class="rc-meta">' + H.esc(sizeText) + (m.length ? ' · ' + H.esc(m.join(' · ')) : '') + '</div>';
        if (it.fmtNote) html += '<div class="rc-meta" style="color:var(--c-warn)">' + H.esc(it.fmtNote) + '</div>';
        if (it.check) {
          html += '<div class="rc-meta" style="color:' + (it.check.ok ? 'var(--c-ok)' : 'var(--c-err)') + '">'
            + (it.check.ok ? '自检:产物读回 ' + (it.isPdf ? (it.check.pages + ' 页(与原文一致)') : (it.check.width + ' × ' + it.check.height)) + ' · ' + H.fmt(it.check.bytes) : '自检没通过:' + H.esc(it.check.error)) + '</div>';
        }
      } else if (it.status === 'fail') {
        html += it.heic ? H.heicNotice() : '<div class="rc-meta" style="color:var(--c-err)">这一张没处理成功:' + H.esc(it.why || '读不了这个文件') + '</div>';
      } else {
        html += '<div class="rc-meta" style="color:#6e6e73">' + H.esc(it.why || '处理中…') + '</div>';
      }
      html += '</div>';
    });
    out.innerHTML = html;
    out.querySelectorAll('.cmp').forEach(function (box) {
      var r = box.querySelector('.cmp-r'), top = box.querySelector('.cmp-new'), line = box.querySelector('.cmp-line');
      if (!r || !top || !line) return;
      function sync() { var v = parseInt(r.value, 10) || 0; top.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
      r.addEventListener('input', sync); sync();
    });
    out.querySelectorAll('[data-dl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var it = items[parseInt(b.dataset.dl, 10)];
        H.downloadBlob(it.blob, it.outName);
      });
    });
    root.querySelector('#ba').style.display = items.some(function (i) { return i.status === 'ok'; }) ? 'flex' : 'none';
  }

  function opts() {
    return {
      white: root.querySelector('#oWhite').checked,
      crop: root.querySelector('#oCrop').checked,
      deskew: root.querySelector('#oDesk').checked,
      strength: parseFloat(root.querySelector('#oStr').value),
      type: root.querySelector('#oFmt').value
    };
  }

  async function run(files) {
    if (!files.length) return;
    releaseUrls();
    items = []; render();
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), pgt = root.querySelector('#pgt');
    pg.style.display = 'block'; pgt.style.display = 'block'; fill.style.width = '0%';
    var opt = opts();
    var all = files.filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|bmp|heic|heif)$/i.test(f.name) || f.type === 'application/pdf' || /\.pdf$/i.test(f.name); });
    if (!all.length) { pg.style.display = 'none'; pgt.style.display = 'none'; say('请拖入图片或 PDF。', 'err'); return; }
    say('正在处理 ' + all.length + ' 个文件(本地运算,不上传)…');
    var ok = 0, fail = 0;
    for (var i = 0; i < all.length; i++) {
      var f = all[i];
      pgt.textContent = '正在处理:第 ' + (i + 1) + ' / ' + all.length + ' 个 · ' + f.name;
      fill.style.width = Math.round(i / all.length * 100) + '%';
      // 先把"原始画面"画出来(供对比);PDF 逐页处理,这里只展示第一页
      var isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      try {
        if (isPdf) {
          await cleanPdf(f, opt, pgt);   // 逐页清理后重新组装一份 PDF(cleanPdf 自己会推结果卡)
          ok++;
          continue;
        }
        var bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
        var src = newCanvas(bmp.width, bmp.height);
        var g0 = src.getContext('2d');
        g0.fillStyle = '#fff'; g0.fillRect(0, 0, src.width, src.height);
        g0.drawImage(bmp, 0, 0);
        if (bmp.close) bmp.close();
        var beforeBlob = await canvasToBlob(scaleCanvas(src, 900), 'image/jpeg');
        var res = clean(src, opt);
        // 两种都编一份再挑:照片型内容 PNG 会比 JPG 大很多,而我们自己定的规矩是"不给用户更大的文件"。
        // 谁小用谁,并在卡片上写清为什么换了格式。
        var blobPng = await canvasToBlob(res.canvas, 'image/png');
        var blobJpg = await canvasToBlob(res.canvas, 'image/jpeg');
        var blob = blobPng, fmtNote = '', ext = '.png';
        if (blobPng && blobJpg) {
          if (opt.type === 'image/png' && blobPng.size > blobJpg.size * 1.2) {
            blob = blobJpg; ext = '.jpg';
            fmtNote = '这张内容偏照片,PNG 反而更大(' + H.fmt(blobPng.size) + '),已自动输出 JPG(' + H.fmt(blobJpg.size) + ')';
          } else if (opt.type === 'image/jpeg' && blobPng.size < blobJpg.size) {
            blob = blobPng; ext = '.png';
            fmtNote = 'JPG 比 PNG 还大,已自动输出 PNG(' + H.fmt(blobPng.size) + ')';
          } else {
            ext = opt.type === 'image/png' ? '.png' : '.jpg';
          }
        }
        var chk = await H.checkImage(blob);
        items.push({
          name: f.name, status: 'ok', info: res.info, before: beforeBlob, blob: blob,
          outW: res.canvas.width, outH: res.canvas.height, check: chk, fmtNote: fmtNote,
          outName: f.name.replace(/\.[^.]+$/, '') + '_clean' + ext
        });
        ok++;
      } catch (e) {
        var heic = await H.sniffHeic(f);
        items.push({ name: f.name, status: 'fail', heic: heic, why: heic ? '' : H.friendlyError(e, '处理失败') });
        fail++;
      }
      render();
    }
    fill.style.width = '100%';
    pg.style.display = 'none'; pgt.style.display = 'none';
    render();
    say('处理完成:' + ok + ' 个成功' + (fail ? ',' + fail + ' 个失败' : '') + '。每张都可以拖动对比前后。', fail ? 'err' : 'ok');
  }

  // PDF 扫描件:逐页栅格化 → 清理 → 用原页面尺寸重新组装一份 PDF
  async function cleanPdf(file, opt, pgt) {
    if (!pdfLib) {
      var m = await H.dynLib('/vendor/pdfjs/pdf.min.mjs?v=1', 'PDF 读取程序');
      m.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
      pdfLib = m;
    }
    await H.loadLib('/vendor/pdf-lib.min.js?v=1', 'PDF 生成程序');
    var bytes = new Uint8Array(await file.arrayBuffer());
    var doc = await pdfLib.getDocument({ data: bytes.slice(), cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
    var PDFDoc = window.PDFLib.PDFDocument;
    var outDoc = await PDFDoc.create();
    var firstBefore = null, firstAfter = null;
    for (var p = 1; p <= doc.numPages; p++) {
      pgt.textContent = '正在处理 ' + file.name + ':第 ' + p + ' / ' + doc.numPages + ' 页';
      var page = await doc.getPage(p);
      var vp1 = page.getViewport({ scale: 1 });
      var vp = page.getViewport({ scale: 200 / 72 });
      var c = newCanvas(Math.floor(vp.width), Math.floor(vp.height));
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      if (p === 1) firstBefore = await canvasToBlob(scaleCanvas(c, 900), 'image/jpeg');
      var res = clean(c, opt);
      if (p === 1) firstAfter = await canvasToBlob(scaleCanvas(res.canvas, 900), 'image/jpeg');
      var pageBlob = await canvasToBlob(res.canvas, 'image/jpeg');
      var img = await outDoc.embedJpg(await pageBlob.arrayBuffer());
      var np = outDoc.addPage([vp1.width, vp1.height]);
      np.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
    }
    var outBytes = await outDoc.save();
    var outBlob = new Blob([outBytes], { type: 'application/pdf' });
    var chk = await H.checkPdf(outBlob, { pages: doc.numPages });
    items.push({
      name: file.name, status: 'ok', info: { pages: doc.numPages }, before: firstBefore, preview: firstAfter, blob: outBlob,
      outW: 0, outH: 0, check: chk, outName: file.name.replace(/\.pdf$/i, '') + '_clean.pdf', isPdf: true
    });
    render();
  }

  H.makeDropZone(root.querySelector('#dz'), run);
  root.querySelector('#dlAll').addEventListener('click', function () {
    var list = items.filter(function (i) { return i.status === 'ok'; }).map(function (i) { return { name: i.outName, blob: i.blob }; });
    if (list.length) H.downloadZip(list, 'clean.zip');
  });
  root.querySelector('#clr').addEventListener('click', function () {
    var snap = items.slice();
    releaseUrls(); items = []; render(); say('已清空。');
    if (snap.length) H.toast('已清空 ' + snap.length + ' 张', { action: '撤销', onAction: function () { items = snap; render(); say('已恢复 ' + snap.length + ' 张。'); } });
  });
}
