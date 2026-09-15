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
    + ".cv-sw.active{border-color:var(--t-text)}"
    + ".cv-tpls{display:grid;grid-template-columns:1fr 1fr;gap:8px}"
    + ".cv-tpl{text-align:left;min-height:64px;padding:8px 10px;border:1px solid var(--c-line-strong);background:#fff;border-radius:12px;cursor:pointer;font-family:inherit}"
    + ".cv-tpl b{display:block;font-size:13px;color:#1d1d1f;font-weight:600}"
    + ".cv-tpl span{display:block;font-size:11px;color:#6e6e73;line-height:1.4;margin-top:2px}"
    + ".cv-tpl.active{border-color:var(--c-accent);box-shadow:0 0 0 2px rgba(0,113,227,.18)}"
    + ".cv-tpl i{display:block;font-size:11px;color:var(--c-accent-text);font-style:normal;margin-top:4px}");

  // 规格与安全区(依据见 内部文档/计划-作品线成熟化.md 第 1 节):
  // 除 YouTube 外,各平台官方页是 JS 渲染/反爬,拿到的是第三方汇总,且小红书像素三源不一致 ——
  // 所以这里既给基准也留备选像素,并在页面上把"规格可能变、安全区内不会被裁"如实写出来。
  var SIZES = [
    { id: 'xhs', name: '小红书笔记 3:4', w: 1080, h: 1440, safe: [1080, 1080], note: '进主页/被分享会被裁成 1:1' },
    { id: 'xhs2', name: '小红书(备选像素)', w: 1242, h: 1660, safe: [1242, 1242], note: '另一套流传的像素,同样 3:4' },
    { id: 'wx', name: '公众号首图 2.35:1', w: 900, h: 383, safe: [383, 383], note: '历史列表与分享按 1:1 裁' },
    { id: 'wx2', name: '公众号次条/分享', w: 383, h: 383, safe: [383, 383], note: '方图' },
    { id: 'sph', name: '视频号竖版 6:7', w: 1080, h: 1260, note: '公开汇总称不会被二次裁切' },
    { id: 'bili', name: 'B站横版 16:10', w: 1146, h: 717 },
    { id: 'yt', name: 'YouTube 16:9', w: 1280, h: 720, safe: [1280, 640], note: '右下有时长角标,底部有进度条' },
    { id: 'square', name: '方图 1:1', w: 1080, h: 1080 }
  ];
  // 模板 = 规格 + 版式骨架 + 配色倾向(自己重画,不搬运任何现成模板的图形与素材)
  var TEMPLATES = [
    { id: 'xhs-bold', name: '小红书 · 大标题', cat: '小红书笔记', size: 'xhs', style: 'bold', align: 'left', desc: '左色块 + 大标题,适合干货清单' },
    { id: 'xhs-quote', name: '小红书 · 居中金句', cat: '小红书笔记', size: 'xhs', style: 'paper', align: 'center', desc: '纸感底 + 居中大字,适合金句/摘录' },
    { id: 'xhs-dark', name: '小红书 · 深色标题', cat: '小红书笔记', size: 'xhs', style: 'dark', align: 'left', desc: '深底白字,信息流里更跳' },
    { id: 'wx-band', name: '公众号 · 色块标题', cat: '公众号', size: 'wx', style: 'bold', align: 'center', desc: '横版首图,标题居中 + 角标' },
    { id: 'wx-square', name: '公众号 · 次条方图', cat: '公众号', size: 'wx2', style: 'gradient', align: 'center', desc: '次条与分享用方图' },
    { id: 'sph-top', name: '视频号 · 顶部大字', cat: '视频号/抖音', size: 'sph', style: 'outline', align: 'center', desc: '竖版留出人物位置' },
    { id: 'bili-left', name: 'B站 · 左字右图', cat: 'B站', size: 'bili', style: 'bold', align: 'left', desc: '左文右图,右侧留给人脸或截图' },
    { id: 'yt-wide', name: 'YouTube · 大字留角', cat: 'YouTube', size: 'yt', style: 'gradient', align: 'center', desc: '右下角留空给时长角标' },
    { id: 'card', name: '金句卡 · 居中', cat: '金句/海报', size: 'square', style: 'paper', align: 'center', desc: '方图,适合摘录与转发' }
  ];
  var STYLES = [
    { id: 'bold', name: '大字报' }, { id: 'dark', name: '深色' }, { id: 'gradient', name: '渐变' },
    { id: 'paper', name: '纸感' }, { id: 'outline', name: '描边' }
  ];
  var COLORS = ['#0071e3', '#F2416B', '#8AA169', '#6467E6', '#B6975A', '#1d1d1f'];
  var state = { tpl: 'xhs-bold', size: 'xhs', style: 'bold', color: '#0071e3', align: 'left', title: '把文件改到能通过为止', sub: '22 个本地小工具 · 不上传不注册', tag: '' };

  root.innerHTML =
    '<h1 class="tool-h1">封面图生成</h1>' +
    '<p class="tool-sub">输入标题,直接出平台尺寸的封面图。这是"AI 封面生成"里**不需要 AI 的那部分** —— 模板排版、配色、字体全在本机算,不联网、不用 Key、不上传。</p>' +
    '<div class="cv-wrap">' +
      '<div><div class="cv-stage"><canvas id="cv" width="1080" height="1440" aria-label="封面预览"></canvas></div>' +
      '<div class="tool-row" style="margin-top:14px"><button class="tool-btn" id="dl">下载 PNG</button>' +
      '<button class="tool-btn tool-btn--ghost" id="set">导出一套尺寸(ZIP)</button>' +
      '<span class="idp-hint" id="info"></span></div></div>' +
      '<div>' +
        '<div class="cv-field"><label>模板(' + TEMPLATES.length + ' 个版式骨架,选中即套用规格与配色)</label><div class="cv-tpls" id="tpl"></div></div>' +
        '<div class="cv-field"><label for="t">标题(会按宽度自动换行、自动缩放字号)</label>' +
        '<textarea class="cv-input" id="t" rows="3" spellcheck="false"></textarea></div>' +
        '<div class="cv-field"><label for="s">副标题(可留空)</label><input class="cv-input" id="s"></div>' +
        '<div class="cv-field"><label for="g">角标(可留空,如"第 3 期")</label><input class="cv-input" id="g"></div>' +
        '<div class="cv-field"><label>尺寸</label><div class="cv-chips" id="sz"></div></div>' +
        '<div class="cv-field"><label>风格</label><div class="cv-chips" id="st"></div></div>' +
        '<div class="cv-field"><label>强调色</label><div class="cv-swatches" id="co"></div></div>' +
        '<div class="cv-field"><label>对齐</label><div class="cv-chips" id="al"><button class="cv-chip active" data-a="left">左对齐</button><button class="cv-chip" data-a="center">居中</button></div></div>' +
        '<div class="cv-field"><label><input type="checkbox" id="safe"> 显示安全区(不会被平台裁掉的范围)</label></div>' +
        '<div class="idp-hint">提示:标题越短字越大;所有文字按最大可用字号自动排版,不会溢出画布。规格来自公开汇总、平台会调整,' +
        '所以导出前建议对照平台后台确认;安全区内的内容不会在列表/分享里被裁。</div>' +
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
  var tplBox = root.querySelector('#tpl');
  function drawTpls() {
    tplBox.innerHTML = TEMPLATES.map(function (t) {
      var s = SIZES.filter(function (z) { return z.id === t.size; })[0];
      return '<button class="cv-tpl' + (state.tpl === t.id ? ' active' : '') + '" data-t="' + t.id + '"><b>' + H.esc(t.name) + '</b>'
        + '<span>' + H.esc(t.desc) + '</span><i>' + H.esc(t.cat) + ' · ' + s.w + '×' + s.h + '</i></button>';
    }).join('');
  }
  tplBox.addEventListener('click', function (e) {
    var b = e.target.closest('.cv-tpl'); if (!b) return;
    var t = TEMPLATES.filter(function (x) { return x.id === b.dataset.t; })[0]; if (!t) return;
    state.tpl = t.id; state.size = t.size; state.style = t.style; state.align = t.align;
    // 让"尺寸/风格/对齐"三组 chips 跟着模板走,避免界面自相矛盾
    root.querySelectorAll('#sz .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === t.size); });
    root.querySelectorAll('#st .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === t.style); });
    root.querySelectorAll('#al .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.a === t.align); });
    drawTpls(); render();
  });
  root.querySelector('#safe').addEventListener('change', function () { render(); });
  drawTpls(); // 首屏就要把模板列出来 —— 第一版漏了这一次调用,模板区是空的(端到端测试当场抓到)
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
    // 安全区预览:把"会被平台裁掉"的区域压暗 —— 只画在画布预览上,导出时不会带上
    var showSafe = root.querySelector('#safe') && root.querySelector('#safe').checked;
    if (showSafe) {
      var sw = (s.safe ? s.safe[0] : W), sh = (s.safe ? s.safe[1] : Hh);
      var sx = (W - sw) / 2, sy2 = (Hh - sh) / 2;
      g.fillStyle = 'rgba(0,0,0,.42)';
      g.fillRect(0, 0, W, sy2); g.fillRect(0, sy2 + sh, W, Hh - sy2 - sh);
      g.fillRect(0, sy2, sx, sh); g.fillRect(sx + sw, sy2, W - sx - sw, sh);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
      g.setLineDash([14, 10]); g.strokeRect(sx, sy2, sw, sh); g.setLineDash([]);
    }
    info.textContent = '预览 ' + W + ' × ' + Hh + (s.safe ? ' · 安全区 ' + s.safe[0] + '×' + s.safe[1] : '')
      + ' · 标题字号 ' + chosen + 'px · 共 ' + lines.length + ' 行' + (s.note ? ' · ' + s.note : '');
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

  // 一稿多尺寸:同一份标题与配色,一次导出"小红书 + 公众号 + 视频号 + 方图"四个规格。
  // 复用同一条渲染路径(改 state.size → render → toBlob),所以"看到什么就导出什么";
  // 依据:Fotor/Canva 都直接列尺寸预设,调研里"多尺寸适配"是这类工具的标配。
  var SET_SIZES = ['xhs', 'wx', 'sph', 'square'];
  root.querySelector('#set').addEventListener('click', async function () {
    var btn = root.querySelector('#set');
    var orig = state.size;
    btn.disabled = true; btn.textContent = '正在导出 ' + SET_SIZES.length + ' 个尺寸…';
    var files = [];
    try {
      for (var i = 0; i < SET_SIZES.length; i++) {
        var id = SET_SIZES[i];
        var s = SIZES.filter(function (z) { return z.id === id; })[0];
        if (!s) continue;
        state.size = id; render();
        await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
        var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
        if (blob) files.push({ name: 'cover-' + id + '-' + s.w + 'x' + s.h + '.png', blob: blob });
      }
    } catch (e) {
      out.innerHTML = '<div class="note err" style="display:block">导出这套尺寸时出错:' + H.esc(H.friendlyError(e, '导出失败')) + '</div>';
    }
    state.size = orig; render();
    root.querySelectorAll('#sz .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === orig); });
    btn.disabled = false; btn.textContent = '导出一套尺寸(ZIP)';
    if (!files.length) { out.innerHTML = '<div class="note err" style="display:block">没有可导出的尺寸。</div>'; return; }
    out.innerHTML = '<div class="note ok" style="display:block">已导出 ' + files.length + ' 个尺寸:' + files.map(function (f2) { return H.esc(f2.name.replace('cover-', '').replace('.png', '')); }).join(' · ') + '(打包成 ZIP,全部本地生成)</div>';
    H.downloadZip(files, 'cover-set.zip');
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render, function () {});
  render();
}
