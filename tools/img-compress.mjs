// tools/img-compress.mjs — 图片批量瘦身（三档预设 + 没压更小就跳过）
export function mount(root, H) {
  H.injectCss(".preset-tabs{display:flex;gap:0;background:#f5f5f7;border-radius:12px;padding:3px;margin-bottom:6px}.preset-tab{flex:1;padding:9px 0;border:none;border-radius:9px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .15s}.preset-tab.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.preset-hint{font-size:14px;color:var(--c-muted);margin:0 0 22px}.result-card.result-fail .name{color:var(--c-err)}.result-card.result-fail .tool-drop .icon svg{width:40px;height:40px;color:#0071e3}.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);align-items:center;justify-content:center;z-index:100}.modal.show{display:flex}.modal img{max-width:90%;max-height:90%;border-radius:12px}.modal .close{line-height:1;position:absolute;top:20px;right:24px;color:#fff;font-size:28px;cursor:pointer}");

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M3 17l5-5 3.5 3.5L16 11l5 5"/></svg>';

  root.innerHTML =
    '<h1 class="tool-h1">图片压缩</h1>' +
    '<p class="tool-sub">批量瘦身，纯本地处理，文件不上传。使用真实编码器（mozjpeg / libwebp / PNG 无损重压），不是简单重画。</p>' +
    '<div class="mode-tabs" id="md"><button data-m="quality" class="active">画质优先</button><button data-m="target">压到指定大小</button></div>' +
    '<div id="tbox" style="display:none">' +
      '<div class="tool-row" style="margin-bottom:6px"><label style="font-size:14px;color:#6e6e73">目标大小</label>' +
      '<input type="number" class="tool-input" id="tval" value="500" min="1" max="200000" style="width:120px">' +
      '<span class="mode-tabs" id="tunit" style="margin:0"><button data-u="1024" class="active">KB</button><button data-u="1048576">MB</button></span></div>' +
      '<p class="preset-hint">用于报名、报销、政务、投稿等有明确大小上限的场景；会尽量保住画质去逼近目标。</p>' +
    '</div>' +
    '<div class="preset-tabs" id="pt"><button class="preset-tab" data-p="small">小文件</button><button class="preset-tab active" data-p="balanced">均衡</button><button class="preset-tab" data-p="high">高质量</button></div>' +
    '<p class="preset-hint" id="pth">小文件 · 体积最小　均衡 · 推荐　高质量 · 最接近原图</p>' +
    '<div class="tool-drop" id="dz"><div class="icon">' + icon + '</div><div class="title">点击选择图片，或拖拽到此处</div><div class="hint">支持 JPG、PNG、WebP、BMP、GIF（可批量）。GIF 动图只压缩第一帧，动画不会保留；BMP / GIF 会输出成 PNG。iPhone 的 HEIC 格式浏览器读不了，请先导出成 JPG。</div></div>' +
    '<div class="progress-bar" id="pg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="fill" style="width:0%"></div></div>' +
    '<p class="progress-note" id="pgt" role="status" aria-live="polite" style="display:none"></p>' +
    '<div class="batch-actions" id="ba"><button class="tool-btn" id="dlAll">全部下载</button><button class="tool-btn tool-btn--ghost" id="clr">清除</button></div>' +
    '<div class="results" id="res"></div>' +
    '<div class="summary" id="sum" role="status" aria-live="polite" style="display:none"></div>' +
    '<div class="modal" id="m"><span class="close">&times;</span><img id="mi" alt=""></div>';

  var PRESETS = { small: 70, balanced: 82, high: 92 };
  var preset = 'balanced';
  var mode = 'quality';
  var unit = 1024;
  var originals = [];
  var items = [];
  var runSeq = 0; // 每一轮处理一个序号,用户中途再拖文件时旧一轮的结果直接丢弃
  var appliedTarget = null; // 上一次真正用过的目标体积,用于判断输入框改动后是否需要重算
  var nextId = 1;
  var netFrom = 0;   // 本轮处理开始时的网络统计位置
  var loadsFrom = 0; // 本轮处理开始时已下载过的编码器个数
  var encMod = null; // 已加载的编码器模块(用于读"下载了几个编码器")

  function currentTarget() {
    return Math.max(1024, (parseInt(root.querySelector('#tval').value, 10) || 500) * unit);
  }

  // 真实编码器按需加载(首次压缩时才拉取 wasm)
  var _enc = null;
  function ensureEnc() {
    if (!_enc) {
      _enc = import('/shared/encoders.js?v=7');
      _enc.then(function (m) { encMod = m; }, function () {});
    }
    return _enc;
  }
  function encLoadsNow() {
    try { return encMod && encMod.encoderLoads ? encMod.encoderLoads() : 0; } catch (e) { return 0; }
  }
  function encBytesNow() {
    try { return encMod && encMod.encoderBytes ? encMod.encoderBytes() : 0; } catch (e) { return 0; }
  }

  root.querySelector('#md').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#md button').forEach(function (x) { x.classList.toggle('active', x === b); });
    var isTarget = mode === 'target';
    root.querySelector('#tbox').style.display = isTarget ? 'block' : 'none';
    root.querySelector('#pt').style.display = isTarget ? 'none' : 'flex';
    root.querySelector('#pth').style.display = isTarget ? 'none' : 'block';
    abortRun();
    if (originals.length) processAll();
  });
  root.querySelector('#tunit').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    unit = parseInt(b.dataset.u, 10);
    root.querySelectorAll('#tunit button').forEach(function (x) { x.classList.toggle('active', x === b); });
    abortRun();
    if (originals.length && mode === 'target') processAll();
  });

  // 改目标体积后自动重算:否则用户输完数字界面毫无反应,会以为这个功能坏了
  var tvalTimer = null;
  root.querySelector('#tval').addEventListener('input', function () {
    if (mode !== 'target' || !originals.length) return;
    if (tvalTimer) clearTimeout(tvalTimer);
    tvalTimer = setTimeout(function () {
      var raw = parseInt(root.querySelector('#tval').value, 10);
      if (!raw || raw < 1) return; // 输入到一半(空或非法)先不动
      if (currentTarget() === appliedTarget) return;
      processAll();
    }, 500);
  });

  var pt = root.querySelector('#pt');
  pt.addEventListener('click', function (e) {
    var t = e.target.closest('.preset-tab'); if (!t) return;
    preset = t.dataset.p;
    pt.querySelectorAll('.preset-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
    abortRun();
    if (originals.length) processAll();
  });

  H.makeDropZone(root.querySelector('#dz'), addFiles, 'image/*');
  root.querySelector('#dlAll').addEventListener('click', downloadAll);
  root.querySelector('#clr').addEventListener('click', clearAll);

  async function addFiles(files) {
    var added = [];
    files.forEach(function (f) { if (f.type.indexOf('image/') === 0) { f.__id = nextId++; originals.push(f); added.push(f); } });
    // 动图必须先认出来,不能悄悄只输出第一帧
    for (var i = 0; i < added.length; i++) {
      var f = added[i];
      if (f.type === 'image/gif' && !f.__frames) f.__frames = (await gifFrames(f)) || 1;
    }
    processAll();
  }

  // 动图帧数:优先用浏览器的 ImageDecoder,不支持时就退回扫 GIF 字节里的 NETSCAPE2.0 循环扩展
  function gifFrames(file) {
    if (file.type !== 'image/gif') return Promise.resolve(1);
    return new Promise(function (resolve) {
      var settled = false;
      function done(n) { if (!settled) { settled = true; resolve(n > 1 ? n : 1); } }
      function byBytes() { scanGif(file).then(done, function () { done(1); }); }
      // 任何一步不回来都不能卡住整批:4 秒后一律退回字节扫描
      var timer = setTimeout(byBytes, 4000);
      if (typeof ImageDecoder === 'undefined') { clearTimeout(timer); byBytes(); return; }
      try {
        var dec = new ImageDecoder({ data: file.stream(), type: 'image/gif' });
        dec.tracks.ready.then(function () {
          if (settled) { try { if (dec.close) dec.close(); } catch (e) {} return; }
          clearTimeout(timer);
          var track = dec.tracks.selectedTrack;
          var n = track ? track.frameCount : 1;
          try { if (dec.close) dec.close(); } catch (e) {}
          done(n);
        }).catch(function () { /* 交给超时后的字节扫描 */ });
      } catch (e) { /* 交给超时后的字节扫描 */ }
    });
  }
  function scanGif(file) {
    return file.slice(0, 262144).arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf);
      for (var i = 0; i + 14 <= b.length; i++) {
        if (b[i] === 0x21 && b[i + 1] === 0xFF && b[i + 2] === 0x0B) {
          var s = '';
          for (var j = 0; j < 11; j++) s += String.fromCharCode(b[i + 3 + j]);
          if (s === 'NETSCAPE2.0') return 2;
        }
      }
      return 1;
    }).catch(function () { return 1; });
  }

  // 打断在途的那一轮(用户中途改条件/删除/清除时用),让它的回调全部失效
  function abortRun() {
    var pg = root.querySelector('#pg');
    var wasRunning = pg.style.display === 'block';
    runSeq++;
    pg.style.display = 'none';
    pg.setAttribute('aria-valuenow', '0');
    root.querySelector('#pgt').style.display = 'none';
    return wasRunning;
  }

  function processAll() {
    var myRun = ++runSeq;
    if (mode === 'target') appliedTarget = currentTarget();
    netFrom = H.netMark ? H.netMark() : 0;
    loadsFrom = encLoadsNow();
    items = [];
    // 清空上一轮的结果,避免处理途中残留的旧卡片被点到(旧卡片上的下载按钮会指向新列表)
    releaseUrls();
    root.querySelector('#res').innerHTML = '';
    root.querySelector('#sum').style.display = 'none';
    root.querySelector('#ba').style.display = 'none';
    var total = originals.length;
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), note = root.querySelector('#pgt');
    pg.style.display = 'block'; fill.style.width = '0%'; pg.setAttribute('aria-valuenow', '0');
    if (!total) { pg.style.display = 'none'; note.style.display = 'none'; return; }
    note.style.display = 'block';
    note.textContent = '正在处理：第 1 / ' + total + ' 张…';
    var done = 0;
    (function next() {
      if (myRun !== runSeq) return; // 已被新一轮取代,安静退出
      if (done >= total) { pg.style.display = 'none'; note.style.display = 'none'; render(); return; }
      note.textContent = '正在处理：第 ' + (done + 1) + ' / ' + total + ' 张（' + Math.round(done / total * 100) + '%）· ' + originals[done].name
        + (mode === 'target' ? '（大图压到很小体积需要多试几次，请稍等）' : '');
      compressOne(originals[done], myRun, function () {
        if (myRun !== runSeq) return;
        done++;
        fill.style.width = (done / total * 100) + '%';
        pg.setAttribute('aria-valuenow', String(Math.round(done / total * 100)));
        setTimeout(next, 0);
      });
    })();
  }

  async function compressOne(file, myRun, cb) {
    var origSize = file.size;
    var mime = file.type;
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) mime = 'image/png';
    var extra = {
      id: file.__id,
      animated: (file.__frames || 1) > 1,
      frames: file.__frames || 1,
      retyped: ['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) < 0
    };
    function push(item) { if (myRun === runSeq) items.push(Object.assign(item, extra)); cb(); }
    // 编码器加载失败要和"文件读不了"分开说,否则是在冤枉用户的文件
    var E;
    try { E = await ensureEnc(); }
    catch (e) { push({ name: file.name, origSize: origSize, status: 'noenc' }); return; }
    try {
      if (mode === 'target') {
        var target = currentTarget();
        var r = await E.encodeToTarget(file, mime, target);
        if (r.blob) {
          push({
            name: file.name, origSize: origSize, outSize: r.blob.size, blob: r.blob,
            status: 'ok', saved: Math.max(0, origSize - r.blob.size),
            met: !!r.met, target: target, reason: r.reason, real: !!r.real
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
        push({ name: file.name, origSize: origSize, status: 'skip', real: !!res.real });
      } else {
        push({ name: file.name, origSize: origSize, outSize: blob.size, blob: blob, status: 'ok', saved: origSize - blob.size, real: !!res.real });
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
      // 行为披露:动图会丢动画、非常规格式会改输出类型,必须写在卡片上,不能静默
      var extraNote = '';
      // 降级必须自曝:压缩程序没取到时是浏览器内置编码在干活,效果不如真实编码器,不能装作一样
      if (f.real === false) extraNote += '<div class="sizes" style="color:var(--c-warn)">这次用的是浏览器内置编码，不是我们的真实编码器（压缩程序没加载成功，多半是断网且本机还没存过它）。压缩效果会差一些；联网后重开这个工具再处理一次就能用上真实编码器。</div>';
      if (f.animated) extraNote += '<div class="sizes" style="color:var(--c-warn)">这是动图（' + f.frames + ' 帧），压缩只保留第一帧，动画不会保留。</div>';
      else if (f.retyped && f.status === 'ok') extraNote += '<div class="sizes" style="color:#6e6e73">原格式不能直接压缩，已输出为 PNG。</div>';
      if (f.status === 'ok') {
        var pct = f.origSize > 0 ? Math.round(f.saved / f.origSize * 100) : 0;
        var badge = f.target
          ? (f.met ? '<span class="saved-badge saved-badge--ok">达标</span>' : '<span class="saved-badge saved-badge--bad">未达标</span>')
          : '<span class="saved-badge">-' + pct + '%</span>';
        var note = '';
        if (f.target && !f.met) {
          note = f.reason === 'png-lossless'
            ? '<div class="sizes" style="color:var(--c-warn)">PNG 是无损格式，压不到更小。建议用「图片转换」输出成 JPG 或 WebP 再试。</div>'
            : '<div class="sizes" style="color:var(--c-warn)">这已是该格式能压到的较小体积（' + H.fmt(f.outSize) + '），仍超过目标 ' + H.fmt(f.target) + '。建议改用 JPG / WebP，或先缩小尺寸。</div>';
        }
        html += '<div class="result-card">'
          + '<img class="preview" src="' + urlFor(f.blob) + '" alt="" onclick="void 0">'
          + '<div class="info"><div class="name">' + H.esc(f.name) + badge + '</div>'
          + '<div class="sizes"><span class="old">' + H.fmt(f.origSize) + '</span> → <span class="new">' + H.fmt(f.outSize) + '</span>'
          + (f.target ? '（目标 ' + H.fmt(f.target) + '）' : '') + '</div>' + note + extraNote + '</div>'
          + '<button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button>'
          + '<button class="download-btn" data-i="' + i + '">下载</button></div>';
      } else if (f.status === 'met') {
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '<span class="saved-badge saved-badge--ok">已达标</span></div>'
          + '<div class="sizes">原图 ' + H.fmt(f.origSize) + ' 已经在目标 ' + H.fmt(f.target) + ' 以内，不需要压缩，也不会生成新文件。</div>' + extraNote + '</div>'
          + '<span class="status-tag">无需处理</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else if (f.status === 'nowin') {
        var why = f.reason === 'png-lossless'
          ? 'PNG 是无损格式，没法压到指定大小；这张图重压后也不会更小，所以没有生成新文件。建议用「图片转换」输出成 JPG 或 WebP 再试。'
          : f.reason === 'no-gain'
          ? '已经试到最低画质，还是不会比原图更小，所以没有生成新文件。建议改用 JPG / WebP，或者先把尺寸改小。'
          : '这个格式在当前浏览器里没法编码，没有生成新文件。建议改用 JPG / PNG / WebP。';
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '<span class="saved-badge saved-badge--bad">未达标</span></div>'
          + '<div class="sizes" style="color:var(--c-warn)">' + why + '（原图 ' + H.fmt(f.origSize) + '，目标 ' + H.fmt(f.target) + '，已保留原图）</div>' + extraNote + '</div>'
          + '<span class="status-tag">未达标</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else if (f.status === 'skip') {
        // 用内置编码得出的"压不动"不能等同于"已经最小" —— 真实编码器的结论可能完全不同
        var skipWhy = f.real === false
          ? '这次用浏览器内置编码没能压得更小（原图 ' + H.fmt(f.origSize) + '）。这不代表它真的压不动——真实压缩程序没加载成功，联网后重开这个工具再试一次。你的原图没有被改动。'
          : '已是最小，无需压缩（原图 ' + H.fmt(f.origSize) + '）。没有新文件可下载，你的原图没有被改动。';
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">' + skipWhy + '</div>' + extraNote + '</div>'
          + '<span class="status-tag">未缩小</span><button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else if (f.status === 'noenc') {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">压缩程序没加载成功（不是文件的问题）：可能是网络把脚本拦掉了，或者你是离线打开、浏览器里还没缓存过它。联网后刷新一次页面再试；你的文件始终没有被上传。</div>' + extraNote + '</div><span class="status-tag">未加载</span>'
          + '<button class="remove-btn" data-i="' + i + '" data-tippy-content="移除" aria-label="移除">×</button></div>';
      } else {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">读不了这个文件：可能是 iPhone 的 HEIC 格式（请先转成 JPG），或者文件已损坏。</div>' + extraNote + '</div><span class="status-tag">失败</span>'
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
    var noenc = items.filter(function (f) { return f.status === 'noenc'; });
    var savedTotal = 0; ok.forEach(function (f) { savedTotal += f.saved; });
    root.querySelector('#ba').style.display = ok.length ? 'flex' : 'none';
    var sum = root.querySelector('#sum');
    if (items.length) {
      sum.style.display = 'block';
      var okMet = ok.filter(function (f) { return f.met !== false; });
      var okUnmet = ok.filter(function (f) { return f.met === false; });
      var parts = [];
      if (mode === 'target') {
        if (okMet.length) parts.push('达标 ' + okMet.length + ' 张');
        if (okUnmet.length + nowin.length) parts.push('未达标 ' + (okUnmet.length + nowin.length) + ' 张');
        if (met.length) parts.push('无需处理 ' + met.length + ' 张');
      } else {
        if (ok.length) parts.push('成功 ' + ok.length + ' 张');
        if (skip.length) parts.push('跳过 ' + skip.length + ' 张');
      }
      if (fail.length) parts.push('失败 ' + fail.length + ' 张');
      if (noenc.length) parts.push('压缩程序未加载 ' + noenc.length + ' 张');
      var softCount = items.filter(function (f) { return f.real === false && (f.status === 'ok' || f.status === 'skip'); }).length;
      if (softCount) parts.push('用内置编码 ' + softCount + ' 张');
      if (savedTotal > 0) parts.push('共节省 <strong>' + H.fmt(savedTotal) + '</strong>');
      var loads = encLoadsNow() - loadsFrom;
      var proof = (H.netLine ? H.netLine(netFrom) : '本次处理:上传 0 个文件');
      // 只说自己能确证的事:本次运行确实加载了压缩程序;浏览器缓存命中与否这里看不到,所以不称"首次"
      if (loads > 0) {
        var encBytes = encBytesNow();
        proof += encBytes > 0
          ? ' · 压缩程序已就绪(本次加载 ' + H.fmt(encBytes) + ',浏览器会缓存它)'
          : ' · 压缩程序已就绪(约 0.2～0.35 MB,浏览器会缓存它)';
      }
      sum.innerHTML = '<div class="total">' + (parts.join(' · ') || '没有可处理的项目') + '</div>'
        + '<div class="note">' + H.esc(proof) + ' · <a href="/verify/">怎么自己验证</a></div>';
    } else {
      sum.style.display = 'none';
    }
  }

  function outName(name, blob) {
    var ext = blob && blob.type === 'image/jpeg' ? '.jpg' : blob && blob.type === 'image/webp' ? '.webp' : '.png';
    return name.replace(/\.[^.]+$/, '') + '_compressed' + ext;
  }
  function downloadOne(i) {
    var f = items[i];
    if (!f || !f.blob) return;
    H.downloadBlob(f.blob, outName(f.name, f.blob));
  }
  function downloadAll() {
    var files = [];
    items.forEach(function (f) {
      if (f.status === 'ok' && f.blob) files.push({ name: outName(f.name, f.blob), blob: f.blob });
    });
    H.downloadZip(files, '图片压缩结果.zip');
  }
  // 按 id 对应删除,避免"已完成条目"和"待处理文件"下标错位
  function removeOne(i) {
    var wasRunning = abortRun();
    var it = items[i];
    if (!it) return;
    var id = it.id;
    items.splice(i, 1);
    for (var k = 0; k < originals.length; k++) {
      if (originals[k].__id === id) { originals.splice(k, 1); break; }
    }
    if (wasRunning && originals.length) processAll(); else render();
  }
  function clearAll() {
    abortRun();
    originals = []; items = []; appliedTarget = null;
    render();
  }
}
