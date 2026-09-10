// tools/image-convert.mjs — 图片缩放 + 格式转换（保留 EXIF 方向、透明转 JPG 垫白底）
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:13px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.width-input{width:110px}.progress-bar{display:none;height:6px;background:#f5f5f7;border-radius:999px;margin:16px 0 0;overflow:hidden}.progress-bar .fill{height:100%;background:#0071e3;border-radius:999px;transition:width .2s}.batch-actions{display:none;gap:10px;margin:16px 0 0}.results{margin-top:20px}.result-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:12px 16px;margin-bottom:10px}.result-card .preview{width:48px;height:48px;border-radius:8px;object-fit:cover;background:#f5f5f7}.result-card .info{flex:1;min-width:0}.result-card .name{font-size:13px;color:#1d1d1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.result-card .meta{font-size:12px;color:#6e6e73;margin-top:2px}.result-card.result-fail .name{color:#d70015}.status-tag{font-size:11px;color:#86868b;background:#f5f5f7;border-radius:999px;padding:3px 9px;white-space:nowrap}.result-card.result-fail .status-tag{color:#d70015;background:rgba(215,0,21,.08)}.download-btn{background:#0071e3;color:#fff;border:none;border-radius:980px;padding:8px 14px;font-size:12px;cursor:pointer;white-space:nowrap}.download-btn:hover{background:#0077ed}.summary{margin-top:20px;background:#f5f5f7;border-radius:14px;padding:16px 18px}.summary .total{font-size:14px;color:#1d1d1f}.summary .note{font-size:12px;color:#6e6e73;margin-top:4px}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3l-5 5M21 3h-5M21 3v5"/><path d="M3 21l5-5M3 21h5M3 21v-5"/></svg>';

  root.innerHTML =
    '<h1 class="tool-h1">图片转换</h1>' +
    '<p class="tool-sub">缩放尺寸、转换格式，纯本地处理，不上传。</p>' +
    '<div class="opt-row"><label>输出格式</label><span class="seg" id="fmt"><button data-f="keep" class="active">保持原格式</button><button data-f="image/jpeg">JPG</button><button data-f="image/png">PNG</button><button data-f="image/webp">WebP</button></span></div>' +
    '<div class="opt-row"><label>目标宽度（可选）</label><input type="number" class="tool-input width-input" id="w" min="1" max="12000" placeholder="留空不缩放"><span class="preset-hint" style="margin:0">px，高度按比例自动</span></div>' +
    '<div class="tool-drop" id="dz"><div class="icon">' + icon + '</div><div class="title">点击选择图片，或拖拽到此处</div><div class="hint">支持 JPG、PNG、WebP、BMP、GIF（批量）</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<div class="batch-actions" id="ba"><button class="tool-btn" id="dlAll">全部下载</button><button class="tool-btn tool-btn--ghost" id="clr">清除</button></div>' +
    '<div class="results" id="res"></div>' +
    '<div class="summary" id="sum" style="display:none"></div>';

  var fmt = 'keep';
  var items = [];
  var files = [];

  root.querySelector('#fmt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    fmt = b.dataset.f;
    root.querySelectorAll('#fmt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    if (files.length) processAll();
  });

  H.makeDropZone(root.querySelector('#dz'), addFiles, 'image/*');
  root.querySelector('#dlAll').addEventListener('click', downloadAll);
  root.querySelector('#clr').addEventListener('click', function () { files = []; items = []; render(); });

  function addFiles(fs) {
    fs.forEach(function (f) { if (f.type.indexOf('image/') === 0) files.push(f); });
    processAll();
  }

  function outMime(srcType) {
    if (fmt !== 'keep') return fmt;
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(srcType) >= 0) return srcType;
    return 'image/png';
  }

  function processAll() {
    items = [];
    var total = files.length;
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill');
    pg.style.display = 'block'; fill.style.width = '0%';
    var w = parseInt(root.querySelector('#w').value, 10) || 0;
    var done = 0;
    (function next() {
      if (done >= total) { pg.style.display = 'none'; render(); return; }
      convertOne(files[done], w, function () {
        done++;
        fill.style.width = (done / total * 100) + '%';
        setTimeout(next, 0);
      });
    })();
  }

  function convertOne(file, w, cb) {
    createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (img) {
      var nw = img.width, nh = img.height;
      if (w && w < nw) { nh = Math.round(nh * w / nw); nw = w; }
      var c = document.createElement('canvas');
      c.width = nw; c.height = nh;
      var ctx = c.getContext('2d');
      var mime = outMime(file.type);
      if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, nw, nh); }
      ctx.drawImage(img, 0, 0, nw, nh);
      img.close();
      c.toBlob(function (blob) {
        if (!blob) { items.push({ name: file.name, status: 'fail' }); cb(); return; }
        var ext = mime === 'image/jpeg' ? '.jpg' : (mime === 'image/webp' ? '.webp' : '.png');
        items.push({ name: file.name, blob: blob, status: 'ok', outName: file.name.replace(/\.[^.]+$/, '') + ext, size: blob.size, w: nw, h: nh, mime: mime });
        cb();
      }, mime, 0.92);
    }).catch(function () { items.push({ name: file.name, status: 'fail' }); cb(); });
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
        html += '<div class="result-card">'
          + '<img class="preview" src="' + urlFor(f.blob) + '" alt="">'
          + '<div class="info"><div class="name">' + H.esc(f.outName) + '</div>'
          + '<div class="meta">' + f.w + '×' + f.h + ' · ' + H.fmt(f.size) + '</div></div>'
          + '<button class="download-btn" data-i="' + i + '">下载</button></div>';
      } else {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + '<div class="meta">处理失败</div></div><span class="status-tag">失败</span></div>';
      }
    });
    res.innerHTML = html;
    res.querySelectorAll('.download-btn').forEach(function (b) {
      b.addEventListener('click', function () { downloadOne(parseInt(b.dataset.i, 10)); });
    });
    var ok = items.filter(function (f) { return f.status === 'ok'; });
    var fail = items.filter(function (f) { return f.status === 'fail'; });
    root.querySelector('#ba').style.display = ok.length ? 'flex' : 'none';
    var sum = root.querySelector('#sum');
    if (items.length) {
      sum.style.display = 'block';
      sum.innerHTML = '<div class="total">成功 ' + ok.length + ' 张' + (fail.length ? ' · 失败 ' + fail.length + ' 张' : '') + '</div>'
        + '<div class="note">全程本地运算，图片不会离开你的电脑。</div>';
    } else {
      sum.style.display = 'none';
    }
  }

  function downloadOne(i) { var f = items[i]; if (f && f.blob) H.downloadBlob(f.blob, f.outName); }
  function downloadAll() {
    var files = [];
    items.forEach(function (f) { if (f.status === 'ok' && f.blob) files.push({ name: f.outName, blob: f.blob }); });
    H.downloadZip(files, '转换结果.zip');
  }
}
