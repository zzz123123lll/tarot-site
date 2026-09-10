// tools/img-compress.mjs — 图片批量瘦身（三档预设 + 没压更小就跳过）
export function mount(root, H) {
  H.injectCss(".preset-tabs{display:flex;gap:0;background:#f5f5f7;border-radius:12px;padding:3px;margin-bottom:6px}.preset-tab{flex:1;padding:9px 0;border:none;border-radius:9px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .15s}.preset-tab.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.preset-hint{font-size:12px;color:#86868b;margin:0 0 22px}.progress-bar{display:none;height:6px;background:#f5f5f7;border-radius:999px;margin:16px 0 0;overflow:hidden}.progress-bar .fill{height:100%;background:#0071e3;border-radius:999px;transition:width .2s}.progress-note{font-size:12px;color:#6e6e73;margin:8px 0 0}.batch-actions{display:none;gap:10px;margin:16px 0 0}.results{margin-top:20px}.result-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:12px 16px;margin-bottom:10px}.result-card .preview{width:48px;height:48px;border-radius:8px;object-fit:cover;background:#f5f5f7;cursor:pointer}.result-card .info{flex:1;min-width:0}.result-card .name{font-size:13px;color:#1d1d1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.result-card .sizes{font-size:12px;color:#6e6e73;margin-top:2px}.result-card .sizes .old{text-decoration:line-through}.result-card .sizes .new{color:#1d9e4e;font-weight:600}.saved-badge--ok{color:#10743a;background:rgba(16,116,58,.10)}.saved-badge--bad{color:#a1500a;background:rgba(200,106,30,.12)}.saved-badge{font-size:11px;color:#1d9e4e;background:rgba(29,158,78,.1);border-radius:999px;padding:2px 7px;margin-left:8px}.status-tag{font-size:11px;color:#86868b;background:#f5f5f7;border-radius:999px;padding:3px 9px;white-space:nowrap}.result-card.result-fail .name{color:#d70015}.result-card.result-fail .status-tag{color:#d70015;background:rgba(215,0,21,.08)}.remove-btn{background:none;border:none;color:#86868b;cursor:pointer;font-size:16px;padding:4px 8px;border-radius:6px}.remove-btn:hover{color:#d70015;background:rgba(215,0,21,.08)}.download-btn{background:#0071e3;color:#fff;border:none;border-radius:980px;padding:8px 14px;font-size:12px;cursor:pointer;white-space:nowrap}.download-btn:hover{background:#0077ed}.summary{margin-top:20px;background:#f5f5f7;border-radius:14px;padding:16px 18px}.summary .total{font-size:14px;color:#1d1d1f}.summary .note{font-size:12px;color:#6e6e73;margin-top:4px}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);align-items:center;justify-content:center;z-index:100}.modal.show{display:flex}.modal img{max-width:90%;max-height:90%;border-radius:12px}.modal .close{position:absolute;top:20px;right:24px;color:#fff;font-size:32px;cursor:pointer}");

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M3 17l5-5 3.5 3.5L16 11l5 5"/></svg>';

  root.innerHTML =
    '<h1 class="tool-h1">图片压缩</h1>' +
    '<p class="tool-sub">批量瘦身，纯本地处理，文件不上传。使用真实编码器（mozjpeg / libwebp），不是简单重画。</p>' +
    '<div class="mode-tabs" id="md"><button data-m="quality" class="active">画质优先</button><button data-m="target">压到指定大小</button></div>' +
    '<div id="tbox" style="display:none">' +
      '<div class="tool-row" style="margin-bottom:6px"><label style="font-size:13px;color:#6e6e73">目标大小</label>' +
      '<input type="number" class="tool-input" id="tval" value="500" min="1" max="200000" style="width:120px">' +
      '<span class="mode-tabs" id="tunit" style="margin:0"><button data-u="1024" class="active">KB</button><button data-u="1048576">MB</button></span></div>' +
      '<p class="preset-hint">用于报名、报销、政务、投稿等有明确大小上限的场景；会尽量保住画质去逼近目标。</p>' +
    '</div>' +
    '<div class="preset-tabs" id="pt"><button class="preset-tab" data-p="small">小文件</button><button class="preset-tab active" data-p="balanced">均衡</button><button class="preset-tab" data-p="high">高质量</button></div>' +
    '<p class="preset-hint" id="pth">小文件 · 体积最小　均衡 · 推荐　高质量 · 最接近原图</p>' +
    '<div class="tool-drop" id="dz"><div class="icon">' + icon + '</div><div class="title">点击选择图片，或拖拽到此处</div><div class="hint">支持 JPG、PNG、WebP、BMP、GIF（可批量）。iPhone 的 HEIC 格式浏览器读不了，请先导出成 JPG。</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<p class="progress-note" id="pgt" style="display:none"></p>' +
    '<div class="batch-actions" id="ba"><button class="tool-btn" id="dlAll">全部下载</button><button class="tool-btn tool-btn--ghost" id="clr">清除</button></div>' +
    '<div class="results" id="res"></div>' +
    '<div class="summary" id="sum" style="display:none"></div>' +
    '<div class="modal" id="m"><span class="close">&times;</span><img id="mi" alt=""></div>';

  var PRESETS = { small: 70, balanced: 82, high: 92 };
  var preset = 'balanced';
  var mode = 'quality';
  var unit = 1024;
  var originals = [];
  var items = [];
  var runSeq = 0; // 每一轮处理一个序号,用户中途再拖文件时旧一轮的结果直接丢弃

  // 真实编码器按需加载(首次压缩时才拉取 wasm)
  var _enc = null;
  function ensureEnc() { if (!_enc) _enc = import('/shared/encoders.js?v=1'); return _enc; }

  root.querySelector('#md').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#md button').forEach(function (x) { x.classList.toggle('active', x === b); });
    var isTarget = mode === 'target';
    root.querySelector('#tbox').style.display = isTarget ? 'block' : 'none';
    root.querySelector('#pt').style.display = isTarget ? 'none' : 'flex';
    root.querySelector('#pth').style.display = isTarget ? 'none' : 'block';
    if (originals.length) processAll();
  });
  root.querySelector('#tunit').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    unit = parseInt(b.dataset.u, 10);
    root.querySelectorAll('#tunit button').forEach(function (x) { x.classList.toggle('active', x === b); });
    if (originals.length && mode === 'target') processAll();
  });

  var pt = root.querySelector('#pt');
  pt.addEventListener('click', function (e) {
    var t = e.target.closest('.preset-tab'); if (!t) return;
    preset = t.dataset.p;
    pt.querySelectorAll('.preset-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
    if (originals.length) processAll();
  });

  H.makeDropZone(root.querySelector('#dz'), addFiles, 'image/*');
  root.querySelector('#dlAll').addEventListener('click', downloadAll);
  root.querySelector('#clr').addEventListener('click', clearAll);

  function addFiles(files) {
    files.forEach(function (f) { if (f.type.indexOf('image/') === 0) originals.push(f); });
    processAll();
  }

  function processAll() {
    var myRun = ++runSeq;
    items = [];
    // 清空上一轮的结果,避免处理途中残留的旧卡片被点到(旧卡片上的下载按钮会指向新列表)
    releaseUrls();
    root.querySelector('#res').innerHTML = '';
    root.querySelector('#sum').style.display = 'none';
    root.querySelector('#ba').style.display = 'none';
    var total = originals.length;
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), note = root.querySelector('#pgt');
    pg.style.display = 'block'; fill.style.width = '0%';
    if (!total) { pg.style.display = 'none'; note.style.display = 'none'; return; }
    note.style.display = 'block';
    note.textContent = '正在处理：第 1 / ' + total + ' 张…';
    var done = 0;
    (function next() {
      if (myRun !== runSeq) return; // 已被新一轮取代,安静退出
      if (done >= total) { pg.style.display = 'none'; note.style.display = 'none'; render(); return; }
      note.textContent = '正在处理：第 ' + (done + 1) + ' / ' + total + ' 张 · ' + originals[done].name
        + (mode === 'target' ? '（大图压到很小体积需要多试几次，请稍等）' : '');
      compressOne(originals[done], myRun, function () {
        if (myRun !== runSeq) return;
        done++;
        fill.style.width = (done / total * 100) + '%';
        setTimeout(next, 0);
      });
    })();
  }

  async function compressOne(file, myRun, cb) {
    var origSize = file.size;
    var mime = file.type;
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) mime = 'image/png';
    function push(item) { if (myRun === runSeq) items.push(item); cb(); }
    try {
      var E = await ensureEnc();
      if (mode === 'target') {
        var target = Math.max(1024, (parseInt(root.querySelector('#tval').value, 10) || 500) * unit);
        var r = await E.encodeToTarget(file, mime, target);
        if (r.blob) {
          push({
            name: file.name, origSize: origSize, outSize: r.blob.size, blob: r.blob,
            status: 'ok', saved: Math.max(0, origSize - r.blob.size),
            met: !!r.met, target: target, reason: r.reason
          });
        } else if (r.met) {
          push({ name: file.name, origSize: origSize, status: 'met', target: target });
        } else {
          push({ name: file.name, origSize: origSize, status: 'nowin', target: target, reason: r.reason });
        }
        return;
      }
      var res = await E.encodeWithQuality(file, mime, PRESETS[preset]);
      var blob = res.blob;
      if (!blob) { push({ name: file.name, origSize: origSize, status: 'fail' }); return; }
      if (blob.size >= origSize) {
        push({ name: file.name, origSize: origSize, status: 'skip' });
      } else {
        push({ name: file.name, origSize: origSize, outSize: blob.size, blob: blob, status: 'ok', saved: origSize - blob.size });
      }
    } catch (e) {
      push({ name: file.name, origSize: origSize, status: 'fail' });
    }
  }

  var _urls = [];
  function releaseUrls() { _urls.forEach(function (u) { URL.revokeObjectURL(u); }); _urls = []; }
  function urlFor(blob) { var u = URL.createObjectURL(blob); _urls.push(u); return u; }
  function render() {
    var res = root.querySelector('#res');
    releaseUrls();
    var html = '';
    items.forEach(function (f, i) {
      if (f.status === 'ok') {
        var pct = f.origSize > 0 ? Math.round(f.saved / f.origSize * 100) : 0;
        var badge = f.target
          ? (f.met ? '<span class="saved-badge saved-badge--ok">达标</span>' : '<span class="saved-badge saved-badge--bad">未达标</span>')
          : '<span class="saved-badge">-' + pct + '%</span>';
        var note = '';
        if (f.target && !f.met) {
          note = f.reason === 'png-lossless'
            ? '<div class="sizes" style="color:#a1500a">PNG 是无损格式，压不到更小。建议用「图片转换」输出成 JPG 或 WebP 再试。</div>'
            : '<div class="sizes" style="color:#a1500a">这已是该格式能压到的较小体积（' + H.fmt(f.outSize) + '），仍超过目标 ' + H.fmt(f.target) + '。建议改用 JPG / WebP，或先缩小尺寸。</div>';
        }
        html += '<div class="result-card">'
          + '<img class="preview" src="' + urlFor(f.blob) + '" alt="" onclick="void 0">'
          + '<div class="info"><div class="name">' + H.esc(f.name) + badge + '</div>'
          + '<div class="sizes"><span class="old">' + H.fmt(f.origSize) + '</span> → <span class="new">' + H.fmt(f.outSize) + '</span>'
          + (f.target ? '（目标 ' + H.fmt(f.target) + '）' : '') + '</div>' + note + '</div>'
          + '<button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button>'
          + '<button class="download-btn" data-i="' + i + '">下载</button></div>';
      } else if (f.status === 'met') {
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '<span class="saved-badge saved-badge--ok">已达标</span></div>'
          + '<div class="sizes">原图 ' + H.fmt(f.origSize) + ' 已经在目标 ' + H.fmt(f.target) + ' 以内，不需要压缩，也不会生成新文件。</div></div>'
          + '<span class="status-tag">无需处理</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else if (f.status === 'nowin') {
        var why = f.reason === 'png-lossless'
          ? 'PNG 是无损格式，没法压到指定大小；这张图重压后也不会更小，所以没有生成新文件。建议用「图片转换」输出成 JPG 或 WebP 再试。'
          : f.reason === 'no-gain'
          ? '已经试到最低画质，还是不会比原图更小，所以没有生成新文件。建议改用 JPG / WebP，或者先把尺寸改小。'
          : '这个格式在当前浏览器里没法编码，没有生成新文件。建议改用 JPG / PNG / WebP。';
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '<span class="saved-badge saved-badge--bad">未达标</span></div>'
          + '<div class="sizes" style="color:#a1500a">' + why + '（原图 ' + H.fmt(f.origSize) + '，目标 ' + H.fmt(f.target) + '，已保留原图）</div></div>'
          + '<span class="status-tag">未达标</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else if (f.status === 'skip') {
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">已是最小，无需压缩（原图 ' + H.fmt(f.origSize) + '）。没有新文件可下载，你的原图没有被改动。</div></div>'
          + '<span class="status-tag">未缩小</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">读不了这个文件：可能是 iPhone 的 HEIC 格式（请先转成 JPG），或者文件已损坏。</div></div><span class="status-tag">失败</span>'
          + '<button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      }
    });
    res.innerHTML = html;

    res.querySelectorAll('.download-btn').forEach(function (b) {
      b.addEventListener('click', function () { downloadOne(parseInt(b.dataset.i, 10)); });
    });
    res.querySelectorAll('.remove-btn').forEach(function (b) {
      b.addEventListener('click', function () { removeOne(parseInt(b.dataset.i, 10)); });
    });
    H.initTips(root);

    var ok = items.filter(function (f) { return f.status === 'ok'; });
    var skip = items.filter(function (f) { return f.status === 'skip'; });
    var fail = items.filter(function (f) { return f.status === 'fail'; });
    var met = items.filter(function (f) { return f.status === 'met'; });
    var nowin = items.filter(function (f) { return f.status === 'nowin'; });
    var savedTotal = 0; ok.forEach(function (f) { savedTotal += f.saved; });
    root.querySelector('#ba').style.display = ok.length ? 'flex' : 'none';
    var sum = root.querySelector('#sum');
    if (items.length) {
      sum.style.display = 'block';
      sum.innerHTML = '<div class="total">成功 ' + ok.length + ' 张'
        + (met.length ? ' · 已达标无需处理 ' + met.length + ' 张' : '')
        + (nowin.length ? ' · 压不到目标 ' + nowin.length + ' 张' : '')
        + (skip.length ? ' · 跳过 ' + skip.length + ' 张' : '')
        + (fail.length ? ' · 失败 ' + fail.length + ' 张' : '')
        + (savedTotal > 0 ? ' · 共节省 <strong>' + H.fmt(savedTotal) + '</strong>' : '') + '</div>'
        + '<div class="note">全程本地运算，图片不会离开你的电脑。</div>';
    } else {
      sum.style.display = 'none';
    }
  }

  function downloadOne(i) {
    var f = items[i];
    if (!f || !f.blob) return;
    H.downloadBlob(f.blob, f.name.replace(/(\.[^.]+)$/, '_compressed$1'));
  }
  function downloadAll() {
    var files = [];
    items.forEach(function (f) {
      if (f.status === 'ok' && f.blob) files.push({ name: f.name.replace(/(\.[^.]+)$/, '_compressed$1'), blob: f.blob });
    });
    H.downloadZip(files, '图片压缩结果.zip');
  }
  function removeOne(i) { originals.splice(i, 1); items.splice(i, 1); render(); }
  function clearAll() { originals = []; items = []; render(); }
}
