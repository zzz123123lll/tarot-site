// tools/id-photo.mjs — 证件照 / 报名照:精确像素 + 精确 KB + 真实 DPI
// 规格全部来自官方来源取证(见内部文档《调研-证件照官方规格.md》),每个预设都标注来源与适用场景。
// 诚实边界:不做人脸检测、不自动抠图换底色。像素/DPI/体积严格按要求输出,底色是否合规用"取样提醒"的方式告诉你。
export function mount(root, H) {
  H.injectCss(
    '.idp-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 18px}'
    + '.idp-preset{text-align:left;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:12px;padding:10px 12px;cursor:pointer;font-family:inherit}'
    + '.idp-preset.active{border-color:#0071e3;box-shadow:0 0 0 3px rgba(0,113,227,.12)}'
    + '.idp-preset b{display:block;font-size:13.5px;color:#1d1d1f;font-weight:600}'
    + '.idp-preset span{display:block;font-size:11.5px;color:#6e6e73;margin-top:3px;line-height:1.4}'
    + '.idp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}'
    + '@media (max-width:640px){.idp-grid{grid-template-columns:1fr}}'
    + '.idp-stage{background:#f5f5f7;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:12px;text-align:center}'
    + '.idp-stage canvas{max-width:100%;height:auto;background:#fff;border-radius:6px;display:block;margin:0 auto}'
    + '.idp-fields{display:flex;flex-direction:column;gap:10px}'
    + '.idp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}'
    + '.idp-row label{font-size:12.5px;color:#6e6e73;min-width:64px}'
    + '.idp-num{width:78px}'
    + '.idp-hint{font-size:12px;color:#6e6e73;line-height:1.6}'
    + '.idp-out{margin-top:18px}'
    + '.idp-card{display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px 16px;margin-top:12px}'
    + '.idp-card img{width:96px;border-radius:6px;border:1px solid rgba(0,0,0,.08)}'
    + '.idp-kv{font-size:13px;color:#1d1d1f;line-height:1.7}'
    + '.idp-kv b{font-weight:600}'
    + '.idp-ok{color:#10743a}.idp-bad{color:#a1500a}'
  );

  var PRESETS = [
    { id: 'exam', name: '考试报名照', w: 295, h: 413, dpi: 300, bg: '#ffffff', bgName: '白底', kb: [10, 20, 200], kbDefault: 20,
      spec: '宽 ≥295、高 ≥413 像素,蓝底或白底,JPG/JPEG;国考的照片处理工具保存后约 10K',
      src: '国家公务员局报名确认平台、安徽省考、中国人事考试网(25×35mm=295×413)' },
    { id: 'idcard', name: '身份证 / 社保卡', w: 358, h: 441, dpi: 350, bg: '#ffffff', bgName: '纯白底', kb: [20, 40, 80], kbDefault: 40,
      spec: '358×441 像素、350 dpi、24 位真彩、纯白背景;身份证一般 14–20KB,社保卡 15–80KB',
      src: '兴国县公安局身份证标准、广州社保卡(350DPI)、肇庆社保卡(15–80KB)' },
    { id: 'passport', name: '护照 / 签证', w: 420, h: 560, dpi: 300, bg: '#ffffff', bgName: '白底', kb: [80, 120], kbDefault: 120,
      spec: '纸面 33×48 毫米;数字照 354×472 ～ 420×560 像素,JPEG 30–120KB,6 个月内、白底',
      src: '中国驻外使领馆护照/签证相片规格' },
    { id: 'degree', name: '学历图像采集', w: 480, h: 640, dpi: 300, bg: '#64c5ff', bgName: '浅蓝底', kb: [40], kbDefault: 40,
      spec: '480×640 像素、300 dpi、浅蓝(RGB 100,197,255)/白/浅灰底、JPG,一般 20–40KB',
      src: '教毕指〔2017〕99 号《高等教育学历证书电子注册图像采集规范》' },
    { id: 'custom', name: '自定义', w: 295, h: 413, dpi: 300, bg: '#ffffff', bgName: '自定', kb: [], kbDefault: 0,
      spec: '按对方要求自己填;注意公告里的顺序(有的写"宽×高",有的反过来)',
      src: '' }
  ];

  var state = { preset: 'exam', kb: 20, custom: { w: 295, h: 413, dpi: 300, bg: '#ffffff' }, zoom: 1, offX: 0, offY: 0, img: null, file: null, out: null, netFrom: 0 };

  root.innerHTML =
    '<h1 class="tool-h1">证件照 / 报名照</h1>' +
    '<p class="tool-sub">按对方要求的像素、DPI 和体积上限输出,全程在浏览器里完成,不换底色、不美颜。像素与 KB 是硬要求,我们只改这两件事。</p>' +
    '<div class="idp-presets" id="ps"></div>' +
    '<div class="idp-grid">' +
      '<div>' +
        '<div class="tool-drop" id="dz"><div class="title">点击选择照片,或拖拽到此处</div><div class="hint">JPG / PNG / WebP,单张。照片不合规的通常是这几处:像素不够、底色不对、体积超限——前两个我们管,底色请看下方提醒。</div></div>' +
        '<div class="idp-stage" id="stage" style="display:none;margin-top:12px"><canvas id="pv" width="295" height="413"></canvas>' +
        '<p class="idp-hint" id="pvhint" style="margin-top:8px"></p></div>' +
      '</div>' +
      '<div class="idp-fields">' +
        '<div class="idp-row"><label>像素</label><input class="tool-input idp-num" id="w" type="number" min="40" max="3000" value="295"><span style="color:#6e6e73">×</span><input class="tool-input idp-num" id="h" type="number" min="40" max="3000" value="413"><span class="idp-hint">宽 × 高</span></div>' +
        '<div class="idp-row"><label>DPI</label><input class="tool-input idp-num" id="dpi" type="number" min="72" max="1200" value="300"><span class="idp-hint">写进文件的密度标记</span></div>' +
        '<div class="idp-row"><label>体积上限</label><input class="tool-input idp-num" id="kb" type="number" min="5" max="5000" value="20"><span class="idp-hint">KB,填 0 表示不限制</span></div>' +
        '<div class="idp-row" id="kbs"></div>' +
        '<div class="idp-row"><label>缩放</label><input type="range" id="zoom" min="100" max="260" value="100" style="flex:1"></div>' +
        '<div class="idp-row"><label>左右</label><input type="range" id="ox" min="-100" max="100" value="0" style="flex:1"></div>' +
        '<div class="idp-row"><label>上下</label><input type="range" id="oy" min="-100" max="100" value="0" style="flex:1"></div>' +
        '<p class="idp-hint" id="spec"></p>' +
        '<div class="idp-row"><button class="tool-btn" id="go">生成合规照片</button><button class="tool-btn tool-btn--ghost" id="clr">清除</button></div>' +
      '</div>' +
    '</div>' +
    '<div class="idp-out" id="out" role="status" aria-live="polite"></div>';

  var ps = root.querySelector('#ps');
  var out = root.querySelector('#out');
  var pv = root.querySelector('#pv');
  var dz = root.querySelector('#dz');

  function P(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return PRESETS[0]; }

  function renderPresets() {
    ps.innerHTML = PRESETS.map(function (p) {
      return '<button class="idp-preset' + (p.id === state.preset ? ' active' : '') + '" data-p="' + p.id + '">'
        + '<b>' + H.esc(p.name) + '</b><span>' + p.w + '×' + p.h + ' px · ' + p.dpi + ' dpi · ' + H.esc(p.bgName) + (p.kb.length ? ' · ≤' + p.kb.join('/') + ' KB' : '') + '</span></button>';
    }).join('');
  }

  function applyPreset(keepValues) {
    var p = P(state.preset);
    if (!keepValues) {
      root.querySelector('#w').value = p.w;
      root.querySelector('#h').value = p.h;
      root.querySelector('#dpi').value = p.dpi;
    }
    if (state.preset !== 'custom') state.kb = p.kbDefault;
    root.querySelector('#kb').value = state.kb || 0;
    root.querySelector('#kbs').innerHTML = p.kb.map(function (k) {
      return '<button class="tool-btn tool-btn--ghost" data-kb="' + k + '" style="min-height:32px;padding:4px 10px;font-size:12.5px">≤' + k + ' KB</button>';
    }).join('') + (p.kb.length ? '' : '<span class="idp-hint">这一项官方没给统一上限,按对方页面填。</span>');
    root.querySelector('#spec').innerHTML = '<b>' + H.esc(p.name) + '</b>:' + H.esc(p.spec)
      + (p.src ? '<br>来源:' + H.esc(p.src) : '')
      + '<br>底色的要求是「' + H.esc(p.bgName) + '」——我们不会替你换底色(浏览器里抠图容易留下毛边),只会在下方提醒你的照片看起来是什么颜色。';
    draw();
  }

  ps.addEventListener('click', function (e) {
    var b = e.target.closest('.idp-preset'); if (!b) return;
    state.preset = b.dataset.p;
    renderPresets();
    applyPreset(false);
  });
  root.querySelector('#kbs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-kb]'); if (!b) return;
    state.kb = parseInt(b.dataset.kb, 10);
    root.querySelector('#kb').value = state.kb;
  });
  ['#w', '#h', '#dpi', '#kb'].forEach(function (sel) {
    root.querySelector(sel).addEventListener('input', function () { state.preset = 'custom'; renderPresets(); draw(); });
  });
  ['#zoom', '#ox', '#oy'].forEach(function (sel) {
    root.querySelector(sel).addEventListener('input', function () {
      state.zoom = parseInt(root.querySelector('#zoom').value, 10) / 100;
      state.offX = parseInt(root.querySelector('#ox').value, 10) / 100;
      state.offY = parseInt(root.querySelector('#oy').value, 10) / 100;
      draw();
    });
  });

  H.makeDropZone(dz, addFiles, 'image/*');
  root.querySelector('#go').addEventListener('click', generate);
  root.querySelector('#clr').addEventListener('click', function () {
    state.img = null; state.file = null; state.out = null;
    root.querySelector('#stage').style.display = 'none';
    out.innerHTML = '';
  });

  async function addFiles(files) {
    var f = files[0];
    if (!f) return;
    try {
      var bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
      state.img = bmp; state.file = f; state.zoom = 1; state.offX = 0; state.offY = 0;
      root.querySelector('#zoom').value = 100;
      root.querySelector('#ox').value = 0;
      root.querySelector('#oy').value = 0;
      root.querySelector('#stage').style.display = 'block';
      out.innerHTML = '';
      draw();
    } catch (e) {
      H.warnBelow(dz, '这张图读不了:可能是 iPhone 的 HEIC,或者文件已损坏。请先转成 JPG 再试。');
    }
  }

  function targetSize() {
    var w = Math.max(40, parseInt(root.querySelector('#w').value, 10) || 295);
    var h = Math.max(40, parseInt(root.querySelector('#h').value, 10) || 413);
    return { w: w, h: h };
  }

  // 按"覆盖裁切"摆放照片:保证不变形,多出来的部分用缩放/位置调
  function cropRect() {
    var t = targetSize();
    var iw = state.img.width, ih = state.img.height;
    var scale = Math.max(t.w / iw, t.h / ih) * state.zoom;
    var dw = iw * scale, dh = ih * scale;
    var x = (t.w - dw) / 2 - state.offX * Math.max(0, dw - t.w) / 2;
    var y = (t.h - dh) / 2 - state.offY * Math.max(0, dh - t.h) / 2;
    return { x: x, y: y, dw: dw, dh: dh, scale: scale, t: t };
  }

  function draw() {
    if (!state.img) return;
    var t = targetSize();
    if (pv.width !== t.w || pv.height !== t.h) { pv.width = t.w; pv.height = t.h; }
    var ctx = pv.getContext('2d');
    ctx.clearRect(0, 0, pv.width, pv.height);
    var r = cropRect();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.img, r.x, r.y, r.dw, r.dh);
    var hint = t.w + '×' + t.h + ' px · DPI ' + (parseInt(root.querySelector('#dpi').value, 10) || 300)
      + ' · 输出 JPG · ' + (state.kb ? '≤' + state.kb + ' KB' : '不限体积');
    // 放大提醒:国考明确"不得放大不达标像素"
    var needScale = Math.max(t.w / state.img.width, t.h / state.img.height);
    if (needScale > 1.02) {
      hint += ' · 注意:原图这片区域比目标小,输出属于放大(' + Math.round(needScale * 100) + '%),官方常不接受放大出来的照片';
    }
    root.querySelector('#pvhint').textContent = hint;
  }

  // 采样最外圈像素判断底色:按"每个样本是否接近白/蓝"投票,比取平均值稳(有噪点或渐变时不会误判)
  function borderStats(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var d = ctx.getImageData(0, 0, w, h).data;
    var step = Math.max(1, Math.floor(Math.min(w, h) / 24));
    var n = 0, white = 0, blue = 0, sr = 0, sg = 0, sb = 0;
    function look(x, y) {
      var i = (y * w + x) * 4;
      var r = d[i], g = d[i + 1], b = d[i + 2];
      sr += r; sg += g; sb += b; n++;
      // "接近白"按饱和度与亮度判断,不用严格 255:照片过一遍 JPEG 后本来就会有噪点
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mn > 200 && mx - mn < 40) white++;
      else if (b > r + 25 && b > g + 12) blue++;
    }
    var ring = Math.max(1, Math.round(Math.min(w, h) * 0.01));
    for (var x = 0; x < w; x += step) { var yy; for (yy = 0; yy < ring; yy++) { look(x, yy); look(x, h - 1 - yy); } }
    for (var y = 0; y < h; y += step) { var xx; for (xx = 0; xx < ring; xx++) { look(xx, y); look(w - 1 - xx, y); } }
    if (!n) return null;
    return { n: n, whiteRatio: white / n, blueRatio: blue / n, r: Math.round(sr / n), g: Math.round(sg / n), b: Math.round(sb / n) };
  }

  function judgeBg(s, want) {
    if (!s) return { ok: null, text: '取不到底色样本。' };
    var mean = '(取样 RGB ' + s.r + ',' + s.g + ',' + s.b + ',边缘 ' + Math.round(s.whiteRatio * 100) + '% 接近白、' + Math.round(s.blueRatio * 100) + '% 接近蓝)';
    if (want === '#64c5ff') return { ok: s.whiteRatio > 0.5 || s.blueRatio > 0.5, text: '底色可用(浅蓝/白/浅灰要求)' + mean };
    if (want === '#ffffff') {
      if (s.whiteRatio >= 0.85) return { ok: true, text: '看起来是白底' + mean };
      if (s.blueRatio >= 0.6) return { ok: false, text: '看起来是蓝底,而这一项要求白底' + mean };
      return { ok: false, text: '边缘底色不统一(可能背景有噪点、渐变或有物体贴近边缘),无法确认是白底' + mean };
    }
    return { ok: null, text: '这一项没有统一底色要求' + mean };
  }

  function setJpegDpi(buf, dpi) {
    var b = new Uint8Array(buf);
    if (b[0] !== 0xFF || b[1] !== 0xD8) return buf;
    var app0 = new Uint8Array([0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
      (dpi >> 8) & 0xFF, dpi & 0xFF, (dpi >> 8) & 0xFF, dpi & 0xFF, 0x00, 0x00]);
    // 已有的 JFIF APP0:原地改写密度字段(段长不变)
    var i = 2;
    while (i + 4 <= b.length && b[i] === 0xFF && b[i + 1] !== 0xDA) {
      var marker = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
      if (marker === 0xE0 && len >= 16 && b[i + 4] === 0x4A && b[i + 5] === 0x46) {
        var out = new Uint8Array(b);
        out[i + 11] = 1;
        out[i + 12] = (dpi >> 8) & 0xFF; out[i + 13] = dpi & 0xFF;
        out[i + 14] = (dpi >> 8) & 0xFF; out[i + 15] = dpi & 0xFF;
        out[i + 16] = 0; out[i + 17] = 0;
        return out.buffer;
      }
      if (len < 2) break;
      i += 2 + len;
    }
    // 没有就插一个
    var res = new Uint8Array(b.length + app0.length);
    res.set(b.subarray(0, 2), 0);
    res.set(app0, 2);
    res.set(b.subarray(2), 2 + app0.length);
    return res.buffer;
  }

  async function generate() {
    if (!state.img) { H.warnBelow(dz, '先选一张照片。'); return; }
    var t = targetSize();
    var dpi = Math.max(72, Math.min(1200, parseInt(root.querySelector('#dpi').value, 10) || 300));
    var cap = Math.max(0, parseInt(root.querySelector('#kb').value, 10) || 0) * 1024;
    var preset = P(state.preset);
    root.querySelector('#go').disabled = true;
    out.setAttribute('aria-busy', 'true');
    out.innerHTML = '<p class="idp-hint">正在按 ' + t.w + '×' + t.h + ' 输出…</p>';
    var netFrom = H.netMark ? H.netMark() : 0;
    try {
      var c = document.createElement('canvas');
      c.width = t.w; c.height = t.h;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, t.w, t.h); // JPEG 没有透明通道,先垫白底,避免透明区域变黑
      var r = cropRect();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(state.img, r.x, r.y, r.dw, r.dh);
      var bg = judgeBg(borderStats(c), preset.bg);

      var seed = await new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/jpeg', 0.98); });
      var seedFile = new File([seed], 'seed.jpg', { type: 'image/jpeg' });
      var enc = await import('/shared/encoders.js?v=4');
      // 关键:encodeToTarget 在"原片本来就小于上限"时会返回 blob:null(它不为没必要的事重压),
      // 但用户要的是"一个能交上去的文件",所以这里必须退回用当前画布导出的那片,
      // 并如实报告它到底达标没有 —— 绝不因为"没压缩"就报告失败。
      var bytes = null, met = false, reason = 'ok';
      var seedBuf = await seed.arrayBuffer();
      if (cap > 0) {
        var result = await enc.encodeToTarget(seedFile, 'image/jpeg', cap);
        if (result.blob) { bytes = await result.blob.arrayBuffer(); met = true; reason = result.reason; }
        else { bytes = seedBuf; met = seed.size <= cap; reason = result.reason; }
      } else {
        var q = await enc.encodeWithQuality(seedFile, 'image/jpeg', 92);
        bytes = q.blob ? await q.blob.arrayBuffer() : seedBuf;
        met = true;
        reason = q.real ? 'ok' : 'canvas';
      }
      var finalBlob = bytes ? new Blob([setJpegDpi(bytes, dpi)], { type: 'image/jpeg' }) : null;
      var back = finalBlob ? await createImageBitmap(finalBlob) : null;
      var okW = back && back.width === t.w, okH = back && back.height === t.h;
      state.out = finalBlob;
      var sizeOk = finalBlob ? (!cap || finalBlob.size <= cap) : false;
      var loads = 0;
      try { loads = enc.encoderLoads ? enc.encoderLoads() : 0; } catch (e) {}
      var proof = H.netLine ? H.netLine(netFrom) : '本次处理:上传 0 个文件';
      out.innerHTML =
        '<div class="idp-card">' +
          (finalBlob ? '<img src="' + URL.createObjectURL(finalBlob) + '" alt="输出预览">' : '') +
          '<div class="idp-kv">' +
            '<div><b>' + t.w + ' × ' + t.h + ' px</b> · ' + dpi + ' dpi · ' + (finalBlob ? H.fmt(finalBlob.size) : '未生成') + (cap ? '(上限 ' + H.fmt(cap) + ')' : '') + '</div>' +
            '<div class="' + (sizeOk ? 'idp-ok' : 'idp-bad') + '">' + (finalBlob
              ? (sizeOk ? '体积达标' + (reason === 'already' ? '(原片本来就在上限内,没有重压)' : '') : '体积仍超过上限:这已是这张图能给出的最小体积,建议换一张细节更少的照片,或按对方要求放宽上限')
              : '没生成出文件') + '</div>' +
            '<div class="' + (okW && okH ? 'idp-ok' : 'idp-bad') + '">像素核对:' + (back ? back.width + '×' + back.height : '读不回来') + (okW && okH ? '(与要求一致)' : '(与要求不一致,请把这个情况告诉我们)') + '</div>' +
            '<div class="' + (bg.ok === null ? '' : bg.ok ? 'idp-ok' : 'idp-bad') + '">底色:' + H.esc(bg.text) + ';该用途要求「' + H.esc(preset.bgName) + '」' + (bg.ok === false ? ' —— 我们不会替你换底色,请换一张底色合规的照片' : '') + '</div>' +
            '<div class="idp-hint" style="margin-top:6px">' + H.esc(proof) + (loads > 0 ? ' · 压缩程序已就绪' : '') + ' · <a href="/verify/">怎么自己验证</a></div>' +
            '<div class="idp-row" style="margin-top:10px"><button class="tool-btn" id="dl">下载照片</button></div>' +
          '</div>' +
        '</div>';
      out.setAttribute('aria-busy', 'false');
      var dl = out.querySelector('#dl');
      if (dl) dl.addEventListener('click', function () {
        if (!state.out) return;
        H.downloadBlob(state.out, '证件照-' + preset.id + '-' + t.w + 'x' + t.h + '-' + dpi + 'dpi.jpg');
      });
      if (back && back.close) back.close();
    } catch (e) {
      out.setAttribute('aria-busy', 'false');
      out.innerHTML = '<p class="idp-hint">生成失败:' + H.esc(H.friendlyError ? H.friendlyError(e, '请换一张图再试') : '请换一张图再试') + '</p>';
    }
    root.querySelector('#go').disabled = false;
  }

  renderPresets();
  applyPreset(false);
}
