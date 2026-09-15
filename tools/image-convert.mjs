// tools/image-convert.mjs — 图片缩放 + 格式转换（保留 EXIF 方向、透明转 JPG 垫白底）
export function mount(root, H) {
  H.injectCss(".opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:14px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.width-input{width:110px}.result-card.result-fail .name{color:var(--c-err)}.result-card.result-fail .tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");

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

  // 实测发现的缺陷:目标宽度填了以后不生效 —— 只有"换格式"或重新拖文件才会重跑,
  // 用户填 200 再点下载,拿到的还是原尺寸。改成输入后防抖重跑(与换格式后的行为一致)。
  var _wTimer = null;
  root.querySelector('#w').addEventListener('input', function () {
    if (_wTimer) clearTimeout(_wTimer);
    _wTimer = setTimeout(function () { if (files.length) processAll(); }, 350);
  });

  H.makeDropZone(root.querySelector('#dz'), addFiles, 'image/*');
  root.querySelector('#dlAll').addEventListener('click', downloadAll);
  root.querySelector('#clr').addEventListener('click', function () { files = []; items = []; render(); });

  function addFiles(fs) {
    // 同图片压缩:HEIC 常带空 type,必须放进来由流程给出明确原因(而不是拖了没反应)
    fs.forEach(function (f) {
      var looksImage = /^image\//.test(f.type || '') || /\.(jpe?g|png|webp|bmp|gif|heic|heif|avif|tiff?)$/i.test(f.name || '');
      if (looksImage) files.push(f);
    });
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
      c.toBlob(async function (blob) {
        if (!blob) { items.push({ name: file.name, status: 'fail', why: '浏览器没能导出这个格式' }); cb(); return; }
        // 坑:canvas.toBlob 遇到浏览器不支持的格式会静默退回 PNG(规范如此)。
        // 那样文件名写着 .webp、内容却是 PNG —— 用户以为转了格式,交上去才发现不对。
        // 所以产物必须读回来看:类型对不对、能不能解码、尺寸是不是我们要的。
        var actual = blob.type || '';
        var fallback = !!(actual && mime && actual !== mime);
        var useMime = fallback ? actual : (actual || mime);
        var ext = useMime === 'image/jpeg' ? '.jpg' : useMime === 'image/webp' ? '.webp' : useMime === 'image/png' ? '.png' : useMime === 'image/gif' ? '.gif' : '.bin';
        var chk = await H.checkImage(blob, { width: nw, height: nh });
        if (!chk.ok) {
          items.push({ name: file.name, status: 'fail', why: '产物读不回来或不符:' + (chk.error || '解码失败') });
          cb(); return;
        }
        items.push({
          name: file.name, blob: blob, status: 'ok',
          outName: file.name.replace(/\.[^.]+$/, '') + ext,
          size: blob.size, w: chk.width, h: chk.height, mime: useMime, wantMime: mime,
          fallback: fallback, check: chk
        });
        cb();
      }, mime, 0.92);
    }).catch(async function () {
      // HEIC 不是"文件坏了":浏览器根本解不了,要单独说清并给出可走的路
      var heic = await H.sniffHeic(file);
      items.push({ name: file.name, status: 'fail', heic: heic, file: file });
      cb();
    });
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
          + '<div class="meta">' + f.w + '×' + f.h + ' · ' + H.fmt(f.size) + ' · 自检 ✓ 读回 ' + f.check.width + '×' + f.check.height + '</div>'
          + (f.fallback ? '<div class="meta" style="color:var(--c-warn)">这个浏览器没能导出 ' + H.esc((f.wantMime || '').replace('image/', '').toUpperCase()) + ',产物实际是 ' + H.esc(f.mime.replace('image/', '').toUpperCase()) + ' —— 文件名已按实际格式改;想要那个格式请换 Chrome / Edge 较新版本再试。</div>' : '') + '</div>'
          + '<button class="download-btn" data-i="' + i + '">下载</button></div>';
      } else {
        html += '<div class="result-card result-fail"><div class="info"><div class="name">' + H.esc(f.name) + '</div>'
          + (f.heic ? H.heicNotice(f.file, function (jpgFile) {
              // 解码成功后:替换掉列表里这份原件,只重跑这一份
              var idx = -1;
              for (var k = 0; k < files.length; k++) if (files[k] === f.file || files[k].name === f.name) { idx = k; break; }
              if (idx >= 0) files[idx] = jpgFile; else files.push(jpgFile);
              items = items.filter(function (it) { return it !== f; });
              render();
              var w = parseInt(root.querySelector('#w').value, 10) || 0;
              convertOne(jpgFile, w, function () { render(); });
            }) : '<div class="meta">处理失败</div>') + '</div><span class="status-tag">' + (f.heic ? '需先转 JPG' : '失败') + '</span></div>';
        if (!f.heic && f.why) html = html.replace('<div class="meta">处理失败</div>', '<div class="meta">' + H.esc(f.why) + '</div>');
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
