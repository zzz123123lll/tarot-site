// tools/cover-gen.mjs — 封面图生成(标题 → 平台尺寸封面,纯本地排版,不调用任何 AI)
// 为什么做:网上大量"AI 封面生成"小项目,本质是**模板排版 + 配色 + 字体**(确定性渲染),
// 真正需要模型的只有"凭空画图"。所以这类需求可以做成不用 AI、不用 API Key、不上传的小工具。
export function mount(root, H) {
  H.injectCss(".cv-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start}"
    + "@media (max-width:900px){.cv-wrap{grid-template-columns:1fr}}"
    + ".cv-stage{background:#f5f5f7;border:1px solid var(--c-hairline);border-radius:16px;padding:14px;display:flex;justify-content:center}"
    + ".cv-stage canvas{max-width:100%;height:auto;border-radius:10px;box-shadow:var(--sh-1)}"
    + ".cv-field{margin-bottom:14px}.cv-field label{display:block;font-size:14px;color:#6e6e73;margin-bottom:6px}"
    + ".cv-input{width:100%;padding:10px 12px;border:1px solid var(--c-line-strong);border-radius:10px;font-size:16px;font-family:inherit;background:#fff}"
    + ".cv-chips{display:flex;flex-wrap:wrap;gap:8px}.cv-chip{min-height:44px;padding:0 14px;border:1px solid var(--c-line-strong);background:#fff;border-radius:999px;font-size:14px;cursor:pointer}"
    + ".cv-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".cv-swatches{display:flex;gap:10px}.cv-sw{width:44px;height:44px;border-radius:12px;border:2px solid transparent;cursor:pointer}"
    + ".cv-sw.active{border-color:var(--t-text)}");

  var SIZES = [
    { id: 'xhs', name: '小红书 3:4', w: 1080, h: 1440 },
    { id: 'wx', name: '公众号首图', w: 900, h: 383 },
    { id: 'video', name: '视频 16:9', w: 1280, h: 720 },
    { id: 'square', name: '方图 1:1', w: 1080, h: 1080 }
  ];
  var STYLES = [
    { id: 'bold', name: '大字报' }, { id: 'dark', name: '深色' }, { id: 'gradient', name: '渐变' },
    { id: 'paper', name: '纸感' }, { id: 'outline', name: '描边' }
  ];
  var COLORS = ['#0071e3', '#F2416B', '#8AA169', '#6467E6', '#B6975A', '#1d1d1f'];
  var state = { size: 'xhs', style: 'bold', color: '#0071e3', align: 'left', title: '把文件改到能通过为止', sub: '22 个本地小工具 · 不上传不注册', tag: '' };

  root.innerHTML =
    '<h1 class="tool-h1">封面图生成</h1>' +
    '<p class="tool-sub">输入标题,直接出平台尺寸的封面图。这是"AI 封面生成"里**不需要 AI 的那部分** —— 模板排版、配色、字体全在本机算,不联网、不用 Key、不上传。</p>' +
    '<div class="cv-wrap">' +
      '<div><div class="cv-stage"><canvas id="cv" width="1080" height="1440" aria-label="封面预览"></canvas></div>' +
      '<div class="tool-row" style="margin-top:14px"><button class="tool-btn" id="dl">下载 PNG</button>' +
      '<span class="idp-hint" id="info"></span></div></div>' +
      '<div>' +
        '<div class="cv-field"><label for="t">标题(会按宽度自动换行、自动缩放字号)</label>' +
        '<textarea class="cv-input" id="t" rows="3" spellcheck="false"></textarea></div>' +
        '<div class="cv-field"><label for="s">副标题(可留空)</label><input class="cv-input" id="s"></div>' +
        '<div class="cv-field"><label for="g">角标(可留空,如"第 3 期")</label><input class="cv-input" id="g"></div>' +
        '<div class="cv-field"><label>尺寸</label><div class="cv-chips" id="sz"></div></div>' +
        '<div class="cv-field"><label>风格</label><div class="cv-chips" id="st"></div></div>' +
        '<div class="cv-field"><label>强调色</label><div class="cv-swatches" id="co"></div></div>' +
        '<div class="cv-field"><label>对齐</label><div class="cv-chips" id="al"><button class="cv-chip active" data-a="left">左对齐</button><button class="cv-chip" data-a="center">居中</button></div></div>' +
        '<div class="idp-hint">提示:标题越短字越大;想更热闹就加副标题。所有文字都按最大可用字号自动排版,不会溢出画布。</div>' +
      '</div>' +
    '</div>' +
    '<div class="results" id="out"></div>';

  var cv = root.querySelector('#cv'), g = cv.getContext('2d');
  var info = root.querySelector('#info');

  function chips(box, list, key, fmt) {
    box.innerHTML = list.map(function (x, i) {
      return '<button class="cv-chip' + (state[key] === x.id ? ' active' : '') + '" data-v="' + x.id + '">' + fmt(x) + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.cv-chip'); if (!b) return;
      state[key] = b.dataset.v;
      box.querySelectorAll('.cv-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
      render();
    });
  }
  chips(root.querySelector('#sz'), SIZES, 'size', function (x) { return x.name + ' · ' + x.w + '×' + x.h; });
  chips(root.querySelector('#st'), STYLES, 'style', function (x) { return x.name; });
  root.querySelector('#co').innerHTML = COLORS.map(function (c) {
    return '<button class="cv-sw' + (c === state.color ? ' active' : '') + '" data-c="' + c + '" aria-label="强调色 ' + c + '" style="background:' + c + '"></button>';
  }).join('');
  root.querySelector('#co').addEventListener('click', function (e) {
    var b = e.target.closest('.cv-sw'); if (!b) return;
    state.color = b.dataset.c;
    root.querySelectorAll('.cv-sw').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  root.querySelector('#al').addEventListener('click', function (e) {
    var b = e.target.closest('.cv-chip'); if (!b) return;
    state.align = b.dataset.a;
    root.querySelectorAll('#al .cv-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  var ta = root.querySelector('#t'), si = root.querySelector('#s'), gi = root.querySelector('#g');
  ta.value = state.title; si.value = state.sub;
  [ta, si, gi].forEach(function (el) {
    el.addEventListener('input', function () {
      state.title = ta.value; state.sub = si.value; state.tag = gi.value;
      render();
    });
  });

  function sizeOf() { return SIZES.filter(function (s) { return s.id === state.size; })[0]; }
  function FONT(w) { return '"Geist", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'; }

  function wrap(text, font, maxW) {
    g.font = font;
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') { lines.push(cur); cur = ''; continue; }
      var test = cur + ch;
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch; } else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function render() {
    var s = sizeOf();
    cv.width = s.w; cv.height = s.h;
    var W = s.w, Hh = s.h, pad = Math.round(W * 0.08);
    var accent = state.color;
    // 背景
    if (state.style === 'dark') { g.fillStyle = '#111114'; g.fillRect(0, 0, W, Hh); }
    else if (state.style === 'gradient') {
      var lg = g.createLinearGradient(0, 0, W, Hh);
      lg.addColorStop(0, accent); lg.addColorStop(1, '#111114');
      g.fillStyle = lg; g.fillRect(0, 0, W, Hh);
    } else if (state.style === 'paper') { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, Hh); }
    else { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, Hh); }
    // 大字报:左侧色块
    if (state.style === 'bold') { g.fillStyle = accent; g.fillRect(0, 0, Math.round(W * 0.035), Hh); }
    // 描边:内框
    if (state.style === 'outline') {
      g.strokeStyle = accent; g.lineWidth = Math.max(6, Math.round(W * 0.006));
      g.strokeRect(pad * 0.55, pad * 0.55, W - pad * 1.1, Hh - pad * 1.1);
    }
    var dark = state.style === 'dark' || state.style === 'gradient';
    var textColor = dark ? '#ffffff' : '#111114';
    var subColor = dark ? 'rgba(255,255,255,.82)' : '#5b5b60';
    var maxW = W - pad * 2;
    // 标题:从大字号往下试,选能放进"标题区"的最大字号
    var maxTitleH = Hh - pad * 2 - Math.round(Hh * 0.16);
    var chosen = Math.round(W * 0.16), lines = [];
    for (var fs = chosen; fs >= Math.round(W * 0.045); fs -= 2) {
      var f = '700 ' + fs + 'px ' + FONT();
      var ls = wrap(state.title || '在这里写标题', f, maxW);
      g.font = f;
      if (ls.length * fs * 1.22 <= maxTitleH) { chosen = fs; lines = ls; break; }
      chosen = fs; lines = ls;
    }
    var titleFont = '700 ' + chosen + 'px ' + FONT();
    g.font = titleFont;
    g.textBaseline = 'top';
    var subFont = '500 ' + Math.round(chosen * 0.34) + 'px ' + FONT();
    var subLines = state.sub ? wrap(state.sub, subFont, maxW).slice(0, 3) : [];
    var titleLH = chosen * 1.22, subLH = Math.round(chosen * 0.34) * 1.5;
    var blockH = lines.length * titleLH + (subLines.length ? subLH * subLines.length + chosen * 0.5 : 0);
    var y = Math.max(pad, Math.round((Hh - blockH) / 2) - Math.round(Hh * 0.04));
    var drawText = function (line, font, color, yy) {
      g.font = font; g.fillStyle = color;
      if (state.align === 'center') { g.textAlign = 'center'; g.fillText(line, W / 2, yy); }
      else { g.textAlign = 'left'; g.fillText(line, pad, yy); }
    };
    if (state.tag) {
      var tagFont = '600 ' + Math.round(W * 0.028) + 'px ' + FONT();
      g.font = tagFont;
      var tw = g.measureText(state.tag).width + W * 0.05;
      var th = Math.round(W * 0.028 * 2.1);
      var tx = state.align === 'center' ? (W - tw) / 2 : pad;
      g.fillStyle = dark ? 'rgba(255,255,255,.16)' : accent;
      g.beginPath();
      var r = th / 2;
      g.moveTo(tx + r, y - th - W * 0.04); g.lineTo(tx + tw - r, y - th - W * 0.04);
      g.arc(tx + tw - r, y - th - W * 0.04 + r, r, -Math.PI / 2, Math.PI / 2);
      g.lineTo(tx + r, y - W * 0.04); g.arc(tx + r, y - th - W * 0.04 + r, r, Math.PI / 2, -Math.PI / 2);
      g.closePath(); g.fill();
      g.fillStyle = dark ? '#fff' : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(state.tag, tx + tw / 2, y - th - W * 0.04 + r + 1);
      g.textBaseline = 'top';
    }
    lines.forEach(function (line, i) {
      if (state.style === 'outline' && state.align === 'left') {
        g.lineWidth = Math.max(3, Math.round(chosen * 0.06)); g.strokeStyle = dark ? 'rgba(0,0,0,.0)' : 'rgba(0,0,0,0)';
      }
      drawText(line, titleFont, textColor, y + i * titleLH);
    });
    var sy = y + lines.length * titleLH + chosen * 0.5;
    subLines.forEach(function (line, i) { drawText(line, subFont, subColor, sy + i * subLH); });
    // 底部一条细线 + 站点名,让封面有落款但不抢戏
    g.fillStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.12)';
    g.fillRect(pad, Hh - pad * 0.9, maxW, 2);
    g.font = '500 ' + Math.round(W * 0.024) + 'px ' + FONT();
    g.fillStyle = dark ? 'rgba(255,255,255,.72)' : '#6e6e73';
    g.textAlign = 'left';
    g.fillText('gongjuhe.top · 本地生成', pad, Hh - pad * 0.68);
    info.textContent = '预览 ' + W + ' × ' + Hh + ' · 标题字号 ' + chosen + 'px · 共 ' + lines.length + ' 行';
  }

  var out = root.querySelector('#out');
  root.querySelector('#dl').addEventListener('click', function () {
    cv.toBlob(async function (blob) {
      if (!blob) { out.innerHTML = '<div class="note err" style="display:block">导出失败,请重试。</div>'; return; }
      var chk = await H.checkImage(blob);
      var s = sizeOf();
      var ok = chk.ok && chk.width === s.w && chk.height === s.h;
      if (ok) H.downloadBlob(blob, 'cover-' + s.id + '-' + s.w + 'x' + s.h + '.png');
      out.innerHTML = '<div class="note ' + (ok ? 'ok' : 'err') + '" style="display:block">'
        + (ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓ 尺寸与所选平台一致)'
              : '自检没通过,先别拿去发:' + H.esc(chk.error || '尺寸不符')) + '</div>';
    }, 'image/png');
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render, function () {});
  render();
}
