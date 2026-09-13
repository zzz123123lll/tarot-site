// tools/pdf-compress.mjs — PDF 压缩(栅格化重压)+ 目标体积模式(压不到就换策略:降 DPI → 拆分)
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}"
    + ".opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}"
    + ".opt-hint{font-size:14px;color:#6e6e73}"
    + ".pdf-parts{margin-top:16px}"
    + ".pdf-part{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--c-hairline);border-radius:12px;padding:10px 14px;margin-bottom:8px}"
    + ".pdf-part .nm{flex:1;font-size:14px;color:var(--t-text)}"
    + ".pdf-part .meta{font-size:14px;color:#6e6e73;white-space:nowrap}");
  root.innerHTML =
    '<h1 class="tool-h1">PDF 压缩</h1>' +
    '<p class="tool-sub">适合扫描件 / 图片型 PDF;文字型会变成图、丢失可复制文本。选"压到指定大小"时,压不到会先降 DPI、再拆成几份,并把代价写在结果里。</p>' +
    '<span class="mode-tabs" id="mt" style="margin-bottom:14px"><button data-m="preset" class="active">按预设压</button><button data-m="target">压到指定大小</button></span>' +
    '<div class="opt-row" id="rowPreset"><label>预设</label><span class="seg" id="pr" style="margin:0"><button data-d="120">小文件</button><button data-d="150" class="active">均衡</button><button data-d="200">高质量</button></span></div>' +
    '<div class="opt-row" id="rowTarget" style="display:none"><label>目标上限</label>' +
    '<input class="tool-input" id="kb" type="number" min="10" max="200000" value="2048" style="width:120px" aria-label="目标体积上限">' +
    '<span class="mode-tabs" id="unit" style="margin:0"><button data-u="1024" class="active">KB</button><button data-u="1048576">MB</button></span>' +
    '<span class="opt-hint">常见限制:系统上传 5MB / 邮箱 10MB</span></div>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg></div><div class="title">点击选择 PDF,或拖拽到此处</div><div class="hint">单个 PDF,本地栅格化重压</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<p class="note" id="note"></p>' +
    '<div class="results" id="out"></div>';

  var dpi = 150, mode = 'preset', unit = 1024, pdfjsLib = null;
  var note = root.querySelector('#note'), pg = root.querySelector('#pg'), fill = pg.querySelector('.fill');

  root.querySelector('#mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#mt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#rowPreset').style.display = mode === 'preset' ? 'flex' : 'none';
    root.querySelector('#rowTarget').style.display = mode === 'target' ? 'flex' : 'none';
    root.querySelector('#out').innerHTML = '';
    note.style.display = 'none';
  });
  root.querySelector('#pr').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    dpi = parseInt(b.dataset.d, 10);
    root.querySelectorAll('#pr button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });
  root.querySelector('#unit').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    unit = parseInt(b.dataset.u, 10);
    root.querySelectorAll('#unit button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });

  function say(text, kind) {
    note.textContent = text;
    note.className = 'note' + (kind ? ' ' + kind : '');
    note.style.display = 'block';
  }
  function setProgress(p, total, extra) {
    pg.style.display = 'block';
    fill.style.width = (total ? Math.round(p / total * 100) : 0) + '%';
    if (extra) say(extra);
  }
  function hideProgress() { pg.style.display = 'none'; }

  // ---------- 栅格化:把每一页渲染成 JPEG 字节(只渲染,不组装) ----------
  async function rasterizePages(doc, d, onPage) {
    var pages = [];
    for (var p = 1; p <= doc.numPages; p++) {
      var page = await doc.getPage(p);
      var vp1 = page.getViewport({ scale: 1 });
      var vp = page.getViewport({ scale: d / 72 });
      var c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      var jpeg = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.8); });
      pages.push({ bytes: new Uint8Array(await jpeg.arrayBuffer()), w: vp1.width, h: vp1.height });
      if (onPage) onPage(p, doc.numPages);
    }
    return pages;
  }
  // ---------- 用一组渲染好的页组装成一个 PDF ----------
  async function buildPdf(pages) {
    var PDFDoc = window.PDFLib.PDFDocument;
    var out = await PDFDoc.create();
    for (var i = 0; i < pages.length; i++) {
      var img = await out.embedJpg(pages[i].bytes);
      var np = out.addPage([pages[i].w, pages[i].h]);
      np.drawImage(img, { x: 0, y: 0, width: pages[i].w, height: pages[i].h });
    }
    return new Uint8Array(await out.save());
  }
  function fmtPages(a, b) { return a === b ? ('第 ' + a + ' 页') : ('第 ' + a + '-' + b + ' 页'); }

  // ---------- 目标体积:降 DPI → 拆分 ----------
  async function runTarget(f, origSize, doc, target) {
    var out = root.querySelector('#out');
    var base = f.name.replace(/\.pdf$/i, '');
    if (origSize <= target) {
      hideProgress();
      say('原文件 ' + H.fmt(origSize) + ' 已经在目标 ' + H.fmt(target) + ' 以内,不需要压缩,也不会生成新文件。', 'ok');
      return;
    }
    var cands = [];
    [dpi, 120, 96, 72].forEach(function (d) { if (d <= dpi && cands.indexOf(d) < 0) cands.push(d); });
    if (doc.numPages > 60) cands = cands.slice(0, 2); // 大文件只试两档,避免让人干等
    var t0 = Date.now(), budget = 40000;
    var pages = null, usedDpi = null, single = null;
    for (var i = 0; i < cands.length; i++) {
      var d = cands[i];
      pages = await rasterizePages(doc, d, function (p, total) {
        setProgress(p, total, '正在按目标体积重压:第 ' + p + '/' + total + ' 页 · ' + d + ' dpi');
      });
      single = await buildPdf(pages);
      usedDpi = d;
      if (single.byteLength <= target) break;
      if (Date.now() - t0 > budget) { say('已经试到 ' + d + ' dpi 还没达标,为了不让你干等,先看下面的结果。'); break; }
      if (i === cands.length - 1) break;
      say('“' + d + ' dpi 重压后 ' + H.fmt(single.byteLength) + ' 仍超过目标,继续降画质…” ');
    }
    // ① 单文件达标
    if (single && single.byteLength <= target) {
      hideProgress();
      // 导出后自检:把产物读回来核对页数与体积,过了才让下载
      var chk1 = await H.checkPdf(single, { pages: doc.numPages, maxBytes: target });
      var file1 = base + '_compressed.pdf';
      if (chk1.ok) H.downloadBlob(new Blob([single], { type: 'application/pdf' }), file1);
      var pct1 = Math.round((1 - single.byteLength / origSize) * 100);
      say('已压缩:' + H.fmt(origSize) + ' → ' + H.fmt(single.byteLength) + '(-' + pct1 + '%),' + usedDpi + ' dpi 栅格化重压。代价:文字变成图,不能复制、不能搜索。'
        + (chk1.ok ? ' 自检 ✓ ' + chk1.pages + ' 页(与原文一致)· ' + H.fmt(chk1.bytes) + ' ≤ 目标。' : ' 自检没通过,先别拿去交:' + chk1.error),
        chk1.ok ? 'ok' : 'err');
      // 自检没过就不给下载按钮(宁可少一步操作,也不让人拿坏文件去交)
      out.innerHTML = '<div class="pdf-parts"><div class="pdf-part"><span class="nm">' + H.esc(file1) + '</span><span class="meta">' + H.fmt(single.byteLength) + ' · 1 份 · ' + doc.numPages + ' 页 · ' + (chk1.ok ? '自检 ✓ ' + chk1.pages + ' 页' : '自检失败') + '</span>'
        + (chk1.ok ? '<button class="tool-btn" id="dl1">下载</button>' : '') + '</div></div>';
      var dl1 = root.querySelector('#dl1');
      if (dl1) dl1.addEventListener('click', function () { H.downloadBlob(new Blob([single], { type: 'application/pdf' }), file1); });
      return;
    }
    // ② 拆分成多份:按每页 JPEG 字节累计切(留 5% + 24KB 组装余量)
    if (pages && pages.length > 1) {
      var overhead = 24 * 1024, margin = 1.05;
      var groups = [], cur = [], curBytes = overhead;
      for (var k = 0; k < pages.length; k++) {
        var cost = pages[k].bytes.byteLength * margin;
        if (cur.length && curBytes + cost > target) { groups.push(cur); cur = []; curBytes = overhead; }
        cur.push(k); curBytes += cost;
      }
      if (cur.length) groups.push(cur);
      // 注意:这里不要用"单页 JPEG 字节 + 估算余量"提前判死 —— 估算值大于真实 PDF,会得出
      // "95 KB 已经超过目标 102 KB"这种自相矛盾的结论。让它真的建一份出来,按实测说话(见下面 allSingle 分支)。
      if (false) {
        hideProgress();
        say('即使降到 ' + usedDpi + ' dpi,单页就有 ' + H.fmt(pages[groups[0][0]].bytes.byteLength) + ',已经超过目标 ' + H.fmt(target) + ' —— 这种情况拆页也解决不了。建议放宽目标,或先把 PDF 里的图片单独压小再合并。', 'err');
        return;
      }
      var parts = [];
      for (var g = 0; g < groups.length; g++) {
        setProgress(g + 1, groups.length, '正在生成第 ' + (g + 1) + '/' + groups.length + ' 份…');
        var set = groups[g].map(function (idx) { return pages[idx]; });
        var bytes = await buildPdf(set);
        // 实测超了就往后挪一页(最多挪两轮)
        var guard = 0;
        // 实测超目标:把本份最后一页挪给下一份(最多挪两轮,避免死循环)。
        // 注意要改 groups[g] 本身,否则后面报出来的页号会和实际内容对不上。
        while (bytes.byteLength > target && groups[g].length > 1 && guard < 2 && g + 1 < groups.length) {
          groups[g + 1].unshift(groups[g].pop());
          set = groups[g].map(function (idx) { return pages[idx]; });
          bytes = await buildPdf(set);
          guard++;
        }
        var first = groups[g][0] + 1, last = groups[g][groups[g].length - 1] + 1;
        // 导出后自检:每一份都读回来核对页数(必须等于这份应有的页数)与体积
        var chkP = await H.checkPdf(bytes, { pages: groups[g].length, maxBytes: target });
        parts.push({ name: base + '_part' + (g + 1) + '.pdf', bytes: bytes, pages: fmtPages(first, last), size: bytes.byteLength, met: bytes.byteLength <= target, want: groups[g].length, chk: chkP });
      }
      hideProgress();
      var allMet = parts.every(function (x) { return x.met; });
      // 页覆盖自检:每一页都必须出现且只出现一次(拆分的经典事故就是丢页/重页)
      var seen = {}, dup = 0, total = 0;
      groups.forEach(function (gg) { gg.forEach(function (idx) { if (seen[idx]) dup++; seen[idx] = 1; total++; }); });
      var missing = pages.length - Object.keys(seen).length;
      var coverageOk = dup === 0 && missing === 0 && total === pages.length;
      var checkBad = parts.filter(function (x) { return !x.chk.ok; });
      var worst = Math.max.apply(null, parts.map(function (x) { return x.size; }));
      // 全部都是"一页一份"却仍超标 = 单页本身就超目标,拆页解决不了 —— 按实测数字说清,别给假希望
      var allSinglePage = parts.length === groups.length && groups.every(function (g) { return g.length === 1; });
      if (!allMet && allSinglePage) {
        say('拆页也解决不了:即使降到 ' + usedDpi + ' dpi,单页就有 ' + H.fmt(worst) + ',已经超过目标 ' + H.fmt(target) + '。'
          + '建议放宽目标,或先把 PDF 里的图片单独压小再合并。(下面这些每页一份的文件仍比原文件小,需要可以拿。)', 'err');
      } else {
        say('目标 ' + H.fmt(target) + ' 拆不开:' + usedDpi + ' dpi 之下整份仍超过,所以拆成了 ' + parts.length + ' 份,最大一份 ' + H.fmt(worst) + '。'
          + (allMet ? '每份都在上限内。' : '仍有份超标(下面标出来了)。')
          + ' 自检 ' + (coverageOk && !checkBad.length ? '✓ ' + parts.length + ' 份 · 共 ' + total + ' 页 · 无重复无遗漏 · 每份页数与体积都与预期一致。'
            : '没通过:' + (coverageOk ? '' : ('页覆盖有问题(重复 ' + dup + ' 页 / 缺 ' + missing + ' 页);')) + (checkBad.length ? checkBad.length + ' 份产物读回来不对;' : ''))
          + '代价:文字变成图,不能复制、不能搜索。', coverageOk && !checkBad.length ? (allMet ? 'ok' : 'err') : 'err');
      }
      var html = '<div class="pdf-parts">';
      parts.forEach(function (x, i) {
        html += '<div class="pdf-part"><span class="nm">' + H.esc(x.name) + '</span><span class="meta">' + x.pages + ' · ' + H.fmt(x.size) + ' · ' + (x.chk.ok ? '自检 ✓ ' + x.chk.pages + ' 页' : '自检失败:' + H.esc(x.chk.error || '')) + (x.met ? '' : ' · 超目标') + '</span>' + (x.chk.ok ? '<button class="tool-btn" data-p="' + i + '">下载</button>' : '') + '</div>';
      });
      html += '<div class="tool-row" style="margin-top:12px"><button class="tool-btn tool-btn--ghost" id="dlzip">打包下载全部(' + parts.length + ' 份)</button></div></div>';
      out.innerHTML = html;
      out.querySelectorAll('.pdf-part [data-p]').forEach(function (b) {
        b.addEventListener('click', function () {
          var x = parts[parseInt(b.dataset.p, 10)];
          H.downloadBlob(new Blob([x.bytes], { type: 'application/pdf' }), x.name);
        });
      });
      root.querySelector('#dlzip').addEventListener('click', function () {
        H.downloadZip(parts.map(function (x) { return { name: x.name, blob: new Blob([x.bytes], { type: 'application/pdf' }) }; }), base + '_parts.zip');
      });
      return;
    }
    // ③ 连拆分都不适用
    hideProgress();
    if (single) {
      H.downloadBlob(new Blob([single], { type: 'application/pdf' }), base + '_compressed.pdf');
      say('已经降到 ' + usedDpi + ' dpi,最小只有 ' + H.fmt(single.byteLength) + ',仍超过目标 ' + H.fmt(target) + '(原文件 ' + H.fmt(origSize) + ')。已提供这一份,你可以再放宽目标或换工具。', 'err');
    } else {
      say('这份 PDF 没能压到目标以内。', 'err');
    }
  }

  // ---------- 预设模式(原有行为) ----------
  async function runPreset(f, origSize, doc) {
    var PDFDoc = window.PDFLib.PDFDocument;
    var pgBar = pg, fillBar = fill;
    pgBar.style.display = 'block'; fillBar.style.width = '0%';
    say('正在压缩,请稍候…');
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
      var img = await out.embedJpg(await jpegBlob.arrayBuffer());
      var np = out.addPage([vp1.width, vp1.height]);
      np.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
      fillBar.style.width = (p / doc.numPages * 100) + '%';
    }
    pgBar.style.display = 'none';
    var outBytes = await out.save();
    if (outBytes.length >= origSize) {
      say('压缩后没有变小(' + H.fmt(outBytes.length) + ' ≥ ' + H.fmt(origSize) + '),已保留原文件。', 'err');
    } else {
      // 导出后自检:预设模式也要核对页数
      var chkPre = await H.checkPdf(outBytes, { pages: doc.numPages });
      var pct = Math.round((1 - outBytes.length / origSize) * 100);
      if (chkPre.ok) H.downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), f.name.replace(/\.pdf$/i, '_compressed.pdf'));
      say('已压缩:' + H.fmt(origSize) + ' → ' + H.fmt(outBytes.length) + '(-' + pct + '%)'
        + (chkPre.ok ? ' 自检 ✓ ' + chkPre.pages + ' 页(与原文一致)。' : ' 自检没通过,先别拿去交:' + chkPre.error),
        chkPre.ok ? 'ok' : 'err');
    }
  }

  H.makeDropZone(root.querySelector('#dz'), async function (files) {
    var f = files.find(function (x) { return x.type === 'application/pdf' || x.name.toLowerCase().indexOf('.pdf') >= 0; });
    if (!f) return;
    root.querySelector('#out').innerHTML = '';
    note.style.display = 'none';
    try {
      if (!pdfjsLib) {
        pdfjsLib = await H.dynLib('/vendor/pdfjs/pdf.min.mjs?v=1', 'PDF 显示程序');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
      }
      await H.loadLib('/vendor/pdf-lib.min.js?v=1', 'PDF 生成程序');
      var origBytes = await f.arrayBuffer();
      // ⚠️ pdf.js 会把传进去的 ArrayBuffer 转移走(之后 byteLength 变 0),
      // 所以体积必须在 getDocument 之前记下来 —— 否则整份 PDF 都会被当成 "0 B 已达标" 而拒绝压缩。
      var origSize = origBytes.byteLength;
      var doc = await pdfjsLib.getDocument({ data: origBytes.slice(0), cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
      if (doc.numPages > 100) { say('页数过多(超过 100 页),请先拆分。', 'err'); return; }
      if (mode === 'target') {
        var target = Math.max(10 * 1024, Math.round((parseFloat(root.querySelector('#kb').value) || 0) * unit));
        await runTarget(f, origSize, doc, target);
      } else {
        await runPreset(f, origSize, doc);
      }
    } catch (e) {
      hideProgress();
      say(H.isLibFail(e) ? H.friendlyError(e) : '压缩失败:' + H.friendlyError(e), 'err');
    }
  }, 'application/pdf');
}
