// tools/watermark.mjs — 批量加水印(文字 / 图片 logo):本地处理、可打包下载
// 为什么做:调研里"本地批量加水印/改尺寸"被三个不同的人点名,其中一条原话是
// "还是说其实有这样的产品但我没找到?";而同类站要么收费要么要上传。这里全部在本机做。
export function mount(root, H) {
  H.injectCss(".wm-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:22px;align-items:start}"
    + "@media (max-width:900px){.wm-grid{grid-template-columns:1fr}}"
    + ".wm-field{margin-bottom:12px}.wm-field label{display:block;font-size:14px;color:#6e6e73;margin-bottom:6px}"
    + ".wm-in{width:100%;padding:9px 12px;border:1px solid var(--c-line-strong);border-radius:10px;font-size:15px;font-family:inherit;background:#fff}"
    + ".wm-pos{display:grid;grid-template-columns:repeat(3,44px);grid-gap:6px}"
    + ".wm-pos button{width:44px;height:44px;border-radius:10px;border:1px solid var(--c-line-strong);background:#fff;cursor:pointer;font-size:12px;color:#6e6e73}"
    + ".wm-pos button.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".wm-row{display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap}"
    + ".wm-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:16px}"
    + ".wm-card{background:#fff;border:1px solid var(--c-hairline);border-radius:14px;padding:12px}"
    + ".wm-name{font-size:14px;word-break:break-all;margin-bottom:8px}"
    + ".wm-meta{font-size:13px;color:#6e6e73;line-height:1.6;margin-top:6px}");

  root.innerHTML =
    '<h1 class="tool-h1">批量加水印</h1>' +
    '<p class="tool-sub">给一堆图统一打上文字或 logo:位置(九宫格)、透明度、旋转、边距都能调,处理完全在本机,可打包下载。带防盗提醒 —— 水印会被裁掉,它只提高搬运成本。</p>' +
    '<div class="wm-grid">' +
      '<div>' +
        '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 15l3-4 3 5 2-2 2 3"/><circle cx="9" cy="8" r="1.4"/></svg></div><div class="title">点击选择图片,或拖拽到此处</div><div class="hint">JPG / PNG / WebP,可批量;水印在本机画上去</div></div>' +
        '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
        '<p class="progress-note" id="pgt" role="status" aria-live="polite" style="display:none"></p>' +
        '<div class="tool-row" style="margin-top:12px"><button class="tool-btn" id="dlAll">打包下载(ZIP)</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>' +
        '<div class="wm-cards" id="out"></div>' +
      '</div>' +
      '<div>' +
        '<div class="wm-field"><label for="txt">水印文字(留空则只用 logo)</label><input class="wm-in" id="txt" value="仅供办理使用" maxlength="40"></div>' +
        '<div class="wm-row"><label style="font-size:14px;color:#6e6e73">字号 <span id="fsV">4%</span></label></div>' +
        '<input class="wm-in" id="fs" type="range" min="1.5" max="12" step="0.5" value="4" aria-label="水印字号(相对图片宽度百分比)">' +
        '<div class="wm-row"><label style="font-size:14px;color:#6e6e73">透明度 <span id="opV">28%</span></label></div>' +
        '<input class="wm-in" id="op" type="range" min="5" max="100" step="1" value="28" aria-label="水印透明度">' +
        '<div class="wm-row"><label style="font-size:14px;color:#6e6e73">旋转 <span id="roV">-24°</span></label></div>' +
        '<input class="wm-in" id="ro" type="range" min="-90" max="90" step="1" value="-24" aria-label="水印旋转角度">' +
        '<div class="wm-field"><label>位置</label><div class="wm-pos" id="pos"></div></div>' +
        '<div class="wm-row"><label style="font-size:14px;color:#6e6e73"><input type="checkbox" id="tile"> 平铺(适合整张图防盗)</label></div>' +
        '<div class="wm-field"><label for="color">颜色</label><input class="wm-in" id="color" type="color" value="#ffffff" style="height:44px;padding:4px"></div>' +
        '<div class="wm-field"><label>logo(可选,PNG 透明底最好)</label><div class="tool-drop" id="dz2" style="padding:14px"><div class="hint" id="logoHint">点击选择 logo,或拖到此处</div></div></div>' +
        '<div class="idp-hint">原图不会被改动;输出的文件名会加 <b>_wm</b> 后缀。全部本地完成,不上传。</div>' +
      '</div>' +
    '</div>';

  var items = [], urls = [], logoBmp = null, pos = 'br';
  var out = root.querySelector('#out');
  var POSITIONS = [['tl', '左上'], ['tc', '上中'], ['tr', '右上'], ['ml', '左中'], ['mc', '居中'], ['mr', '右中'], ['bl', '左下'], ['bc', '下中'], ['br', '右下']];
  root.querySelector('#pos').innerHTML = POSITIONS.map(function (p) { return '<button data-p="' + p[0] + '"' + (p[0] === 'br' ? ' class="active"' : '') + '>' + p[1] + '</button>'; }).join('');
  root.querySelector('#pos').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    pos = b.dataset.p;
    root.querySelectorAll('#pos button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });
  ['fs', 'op', 'ro'].forEach(function (id) {
    var el = root.querySelector('#' + id), lab = root.querySelector('#' + id + 'V');
    el.addEventListener('input', function () { lab.textContent = el.value + (id === 'fs' ? '%' : (id === 'ro' ? '°' : '%')); });
  });
  H.makeDropZone(root.querySelector('#dz2'), function (files) {
    var f = files && files[0]; if (!f) return;
    createImageBitmap(f).then(function (bmp) {
      logoBmp = bmp;
      root.querySelector('#logoHint').textContent = '已选 logo:' + f.name + '(' + bmp.width + '×' + bmp.height + ')';
    }).catch(function () { H.warnBelow(root.querySelector('#dz2'), '这个 logo 读不了,换一张 PNG 试试。'); });
  }, 'image/*', { multiple: false });

  function urlFor(blob) { var u = URL.createObjectURL(blob); urls.push(u); return u; }
  function releaseUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }

  function settings() {
    return {
      text: root.querySelector('#txt').value,
      fs: parseFloat(root.querySelector('#fs').value) / 100,
      op: parseInt(root.querySelector('#op').value, 10) / 100,
      ro: parseInt(root.querySelector('#ro').value, 10),
      color: root.querySelector('#color').value,
      tile: root.querySelector('#tile').checked,
      pos: pos
    };
  }
  function anchorPos(p, W, Hh, bw, bh, m) {
    var x = m, y = m;
    if (p === 'tc' || p === 'mc' || p === 'bc') x = (W - bw) / 2;
    if (p === 'tr' || p === 'mr' || p === 'br') x = W - bw - m;
    if (p === 'ml' || p === 'mc' || p === 'mr') y = (Hh - bh) / 2;
    if (p === 'bl' || p === 'bc' || p === 'br') y = Hh - bh - m;
    return { x: x, y: y };
  }
  function drawMark(ctx, W, Hh, st, text) {
    var m = Math.round(Math.min(W, Hh) * 0.04);
    var fs = Math.max(10, Math.round(W * st.fs));
    ctx.save();
    ctx.globalAlpha = st.op;
    if (st.tile) {
      ctx.translate(W / 2, Hh / 2); ctx.rotate(st.ro * Math.PI / 180);
      ctx.font = '600 ' + fs + 'px "Geist", -apple-system, "PingFang SC", sans-serif';
      ctx.fillStyle = st.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var stepX = Math.max(140, ctx.measureText(text || ' ').width * 1.9), stepY = Math.max(110, fs * 4.2);
      for (var y = -Hh; y <= Hh; y += stepY) for (var x = -W; x <= W; x += stepX) if (text) ctx.fillText(text, x, y);
    } else {
      var pieces = [];
      if (text) pieces.push({ kind: 'text', v: text });
      if (logoBmp) pieces.push({ kind: 'logo' });
      pieces.forEach(function (p) {
        ctx.save();
        ctx.translate(W / 2, Hh / 2); ctx.rotate(st.ro * Math.PI / 180); ctx.translate(-W / 2, -Hh / 2);
        if (p.kind === 'text') {
          ctx.font = '600 ' + fs + 'px "Geist", -apple-system, "PingFang SC", sans-serif';
          var tw = ctx.measureText(p.v).width, th = fs * 1.3;
          var at = anchorPos(st.pos, W, Hh, tw, th, m);
          ctx.fillStyle = st.color; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(p.v, at.x, at.y);
        } else {
          var lw = Math.round(W * 0.16), lh = Math.round(logoBmp.height / logoBmp.width * lw);
          var at2 = anchorPos(st.pos, W, Hh, lw, lh, m);
          ctx.drawImage(logoBmp, at2.x, at2.y, lw, lh);
        }
        ctx.restore();
      });
    }
    ctx.restore();
  }

  function render() {
    if (!items.length) { out.innerHTML = ''; return; }
    var html = '';
    items.forEach(function (it, i) {
      html += '<div class="wm-card"><div class="wm-name">' + H.esc(it.name) + '</div>';
      if (it.status === 'ok') {
        html += '<div class="cmp"><img class="cmp-old" src="' + urlFor(it.before) + '" alt="加水印前">'
          + '<div class="cmp-new"><img src="' + urlFor(it.blob) + '" alt="加水印后"></div>'
          + '<span class="cmp-line" aria-hidden="true"></span>'
          + '<input class="cmp-r" type="range" min="0" max="100" value="50" step="1" aria-label="拖动对比加水印前后"></div>';
        html += '<div class="wm-meta">' + it.w + '×' + it.h + ' · ' + H.fmt(it.blob.size) + (it.check ? ' · 自检 ' + (it.check.ok ? '✓ 读回 ' + it.check.width + '×' + it.check.height : '失败:' + H.esc(it.check.error)) : '') + '</div>';
        html += '<div class="tool-row" style="margin-top:8px"><button class="tool-btn" data-dl="' + i + '">下载</button></div>';
      } else if (it.status === 'fail') {
        html += '<div class="wm-meta" style="color:var(--c-err)">这一张没处理成功:' + H.esc(it.why || '读不了这个文件') + '</div>';
      } else {
        html += '<div class="wm-meta">' + H.esc(it.why || '处理中…') + '</div>';
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
  }

  async function run(files) {
    releaseUrls();
    items = []; render();
    var st = settings();
    var list = files.filter(function (f) { return /^image\//.test(f.type || '') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name || ''); });
    if (!list.length) { H.warnBelow(root.querySelector('#dz'), '请拖入图片(JPG / PNG / WebP)。'); return; }
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), pgt = root.querySelector('#pgt');
    pg.style.display = 'block'; pgt.style.display = 'block'; fill.style.width = '0%';
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      pgt.textContent = '正在加水印:第 ' + (i + 1) + ' / ' + list.length + ' 张 · ' + f.name;
      fill.style.width = Math.round(i / list.length * 100) + '%';
      try {
        var bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
        var c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        var ctx = c.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        var beforeC = document.createElement('canvas');
        beforeC.width = 480; beforeC.height = Math.round(480 * bmp.height / bmp.width);
        beforeC.getContext('2d').drawImage(bmp, 0, 0, beforeC.width, beforeC.height);
        drawMark(ctx, c.width, c.height, st, st.text);
        bmp.close();
        var type = f.type === 'image/png' ? 'image/png' : 'image/jpeg';
        var blob = await new Promise(function (r) { c.toBlob(r, type, type === 'image/jpeg' ? 0.92 : undefined); });
        var chk = await H.checkImage(blob, { width: c.width, height: c.height });
        var beforeBlob = await new Promise(function (r) { beforeC.toBlob(r, 'image/jpeg', 0.85); });
        items.push({
          name: f.name, status: 'ok', blob: blob, before: beforeBlob, w: c.width, h: c.height, check: chk,
          outName: f.name.replace(/\.[^.]+$/, '') + '_wm' + (type === 'image/png' ? '.png' : '.jpg')
        });
      } catch (e) {
        items.push({ name: f.name, status: 'fail', why: H.friendlyError(e, '处理失败') });
      }
      render();
    }
    fill.style.width = '100%';
    pg.style.display = 'none'; pgt.style.display = 'none';
    render();
    var ok = items.filter(function (x) { return x.status === 'ok'; }).length;
    H.warnBelow(root.querySelector('#dz'), '处理完成:' + ok + ' 张成功' + (ok ? ',可以单张下载或点上面的「打包下载」' : '') + '。原图没有被改动。');
  }

  H.makeDropZone(root.querySelector('#dz'), run, 'image/*');
  root.querySelector('#dlAll').addEventListener('click', function () {
    var list = items.filter(function (x) { return x.status === 'ok'; }).map(function (x) { return { name: x.outName, blob: x.blob }; });
    if (list.length) H.downloadZip(list, 'watermarked.zip');
    else H.warnBelow(root.querySelector('#dz'), '还没有可下载的结果。');
  });
  root.querySelector('#clr').addEventListener('click', function () { releaseUrls(); items = []; render(); H.clearWarn(root.querySelector('#dz')); });
}
