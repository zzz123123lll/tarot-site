// tools/img-compress.mjs — 图片批量瘦身（三档预设 + 没压更小就跳过）
export function mount(root, H) {
  H.injectCss(".preset-tabs{display:flex;gap:0;background:#f5f5f7;border-radius:12px;padding:3px;margin-bottom:6px}.preset-tab{flex:1;padding:9px 0;border:none;border-radius:9px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .15s}.preset-tab.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.preset-hint{font-size:12px;color:#86868b;margin:0 0 22px}.progress-bar{display:none;height:6px;background:#f5f5f7;border-radius:999px;margin:16px 0 0;overflow:hidden}.progress-bar .fill{height:100%;background:#0071e3;border-radius:999px;transition:width .2s}.batch-actions{display:none;gap:10px;margin:16px 0 0}.results{margin-top:20px}.result-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:12px 16px;margin-bottom:10px}.result-card .preview{width:48px;height:48px;border-radius:8px;object-fit:cover;background:#f5f5f7;cursor:pointer}.result-card .info{flex:1;min-width:0}.result-card .name{font-size:13px;color:#1d1d1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.result-card .sizes{font-size:12px;color:#6e6e73;margin-top:2px}.result-card .sizes .old{text-decoration:line-through}.result-card .sizes .new{color:#1d9e4e;font-weight:600}.saved-badge{font-size:11px;color:#1d9e4e;background:rgba(29,158,78,.1);border-radius:999px;padding:2px 7px;margin-left:8px}.status-tag{font-size:11px;color:#86868b;background:#f5f5f7;border-radius:999px;padding:3px 9px;white-space:nowrap}.result-card.result-fail .name{color:#d70015}.result-card.result-fail .status-tag{color:#d70015;background:rgba(215,0,21,.08)}.remove-btn{background:none;border:none;color:#86868b;cursor:pointer;font-size:16px;padding:4px 8px;border-radius:6px}.remove-btn:hover{color:#d70015;background:rgba(215,0,21,.08)}.download-btn{background:#0071e3;color:#fff;border:none;border-radius:980px;padding:8px 14px;font-size:12px;cursor:pointer;white-space:nowrap}.download-btn:hover{background:#0077ed}.summary{margin-top:20px;background:#f5f5f7;border-radius:14px;padding:16px 18px}.summary .total{font-size:14px;color:#1d1d1f}.summary .note{font-size:12px;color:#6e6e73;margin-top:4px}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);align-items:center;justify-content:center;z-index:100}.modal.show{display:flex}.modal img{max-width:90%;max-height:90%;border-radius:12px}.modal .close{position:absolute;top:20px;right:24px;color:#fff;font-size:32px;cursor:pointer}");

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M3 17l5-5 3.5 3.5L16 11l5 5"/></svg>';

  root.innerHTML =
    '<h1 class="tool-h1">图片压缩</h1>' +
    '<p class="tool-sub">批量瘦身，纯本地处理，不上传、不联网。压了没变小就跳过。</p>' +
    '<div class="preset-tabs" id="pt"><button class="preset-tab" data-p="small">小文件</button><button class="preset-tab active" data-p="balanced">均衡</button><button class="preset-tab" data-p="high">高质量</button></div>' +
    '<p class="preset-hint">小文件 · 体积最小　均衡 · 推荐　高质量 · 最接近原图</p>' +
    '<div class="tool-drop" id="dz"><div class="icon">' + icon + '</div><div class="title">点击选择图片，或拖拽到此处</div><div class="hint">支持 JPG、PNG、WebP、BMP、GIF（批量）</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<div class="batch-actions" id="ba"><button class="tool-btn" id="dlAll">全部下载</button><button class="tool-btn tool-btn--ghost" id="clr">清除</button></div>' +
    '<div class="results" id="res"></div>' +
    '<div class="summary" id="sum" style="display:none"></div>' +
    '<div class="modal" id="m"><span class="close">&times;</span><img id="mi" alt=""></div>';

  var PRESETS = { small: 0.70, balanced: 0.82, high: 0.92 };
  var preset = 'balanced';
  var originals = [];
  var items = [];

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
    items = [];
    var total = originals.length;
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill');
    pg.style.display = 'block'; fill.style.width = '0%';
    var done = 0;
    (function next() {
      if (done >= total) { pg.style.display = 'none'; render(); return; }
      compressOne(originals[done], function () {
        done++;
        fill.style.width = (done / total * 100) + '%';
        setTimeout(next, 0);
      });
    })();
  }

  function compressOne(file, cb) {
    var origSize = file.size;
    var mime = file.type;
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) mime = 'image/png';
    createImageBitmap(file).then(function (img) {
      var c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      img.close();
      c.toBlob(function (blob) {
        if (!blob) { items.push({ name: file.name, origSize: origSize, status: 'fail' }); cb(); return; }
        if (blob.size >= origSize) {
          items.push({ name: file.name, origSize: origSize, status: 'skip' });
        } else {
          items.push({ name: file.name, origSize: origSize, outSize: blob.size, blob: blob, status: 'ok', saved: origSize - blob.size });
        }
        cb();
      }, mime, PRESETS[preset]);
    }).catch(function () { items.push({ name: file.name, origSize: origSize, status: 'fail' }); cb(); });
  }

  function render() {
    var res = root.querySelector('#res');
    var html = '';
    items.forEach(function (f, i) {
      if (f.status === 'ok') {
        var pct = f.origSize > 0 ? Math.round(f.saved / f.origSize * 100) : 0;
        html += '<div class="result-card">'
          + '<img class="preview" src="' + URL.createObjectURL(f.blob) + '" alt="" onclick="void 0">'
          + '<div class="info"><div class="name">' + H.esc(f.name) + '<span class="saved-badge">-' + pct + '%</span></div>'
          + '<div class="sizes"><span class="old">' + H.fmt(f.origSize) + '</span> → <span class="new">' + H.fmt(f.outSize) + '</span></div></div>'
          + '<button class="remove-btn" data-i="' + i + '">×</button>'
          + '<button class="download-btn" data-i="' + i + '">下载</button></div>';
      } else if (f.status === 'skip') {
        html += '<div class="result-card"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">未缩小，已保留原图（' + H.fmt(f.origSize) + '）</div></div>'
          + '<span class="status-tag">未缩小</span><button class="remove-btn" data-i="' + i + '">×</button></div>';
      } else {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="sizes">处理失败</div></div><span class="status-tag">失败</span>'
          + '<button class="remove-btn" data-i="' + i + '">×</button></div>';
      }
    });
    res.innerHTML = html;

    res.querySelectorAll('.download-btn').forEach(function (b) {
      b.addEventListener('click', function () { downloadOne(parseInt(b.dataset.i, 10)); });
    });
    res.querySelectorAll('.remove-btn').forEach(function (b) {
      b.addEventListener('click', function () { removeOne(parseInt(b.dataset.i, 10)); });
    });

    var ok = items.filter(function (f) { return f.status === 'ok'; });
    var skip = items.filter(function (f) { return f.status === 'skip'; });
    var fail = items.filter(function (f) { return f.status === 'fail'; });
    var savedTotal = 0; ok.forEach(function (f) { savedTotal += f.saved; });
    root.querySelector('#ba').style.display = ok.length ? 'flex' : 'none';
    var sum = root.querySelector('#sum');
    if (items.length) {
      sum.style.display = 'block';
      sum.innerHTML = '<div class="total">成功 ' + ok.length + ' 张 · 跳过 ' + skip.length + ' 张 · 失败 ' + fail.length + ' 张'
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
    items.forEach(function (f, i) { if (f.status === 'ok') setTimeout(function () { downloadOne(i); }, i * 200); });
  }
  function removeOne(i) { originals.splice(i, 1); items.splice(i, 1); render(); }
  function clearAll() { originals = []; items = []; render(); }
}
