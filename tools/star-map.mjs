// tools/star-map.mjs — 文字星图:把一段文字变成一片可分享的星空(纯本地、确定性)
// 为什么做:抖音/B站爆款里播放最高的一类是"把文字/数据变成好看的可视化"(如《诗云》135 万点赞)。
// 那类作品最核心、且不需要任何模型与数据源的部分就是"排版 + 可视化";这里只做真正确定的那一半:
// 同一段文字永远得到同一片星空(用文本哈希做种子),可导出分享图。
export function mount(root, H) {
  H.injectCss(".sm-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:22px;align-items:start}"
    + "@media (max-width:900px){.sm-wrap{grid-template-columns:1fr}}"
    + ".sm-stage{border-radius:18px;overflow:hidden;background:#07080d;box-shadow:var(--sh-3)}"
    + ".sm-stage canvas{display:block;width:100%;height:auto}"
    + ".sm-field{margin-bottom:14px}.sm-field label{display:block;font-size:14px;color:#6e6e73;margin-bottom:6px}"
    + ".sm-input{width:100%;padding:10px 12px;border:1px solid var(--c-line-strong);border-radius:10px;font-size:16px;font-family:inherit;background:#fff}"
    + ".sm-legend{margin-top:12px;background:var(--t-surface);border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.7;min-height:76px}"
    + ".sm-oneline{font-size:14px;color:#6e6e73;margin-top:8px}");

  var SAMPLE = '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡';
  root.innerHTML =
    '<h1 class="tool-h1">文字星图</h1>' +
    '<p class="tool-sub">写下一段文字,它会变成一片星空:<b>每个字是一颗星</b>,字与字之间的连线就是句子的走向。同一段文字永远是同一片星空,可以导出成分享图。</p>' +
    '<div class="sm-wrap">' +
      '<div>' +
        '<div class="sm-stage"><canvas id="cv" width="1000" height="1250" aria-label="文字星图预览"></canvas></div>' +
        '<div class="tool-row" style="margin-top:14px">' +
          '<button class="tool-btn" id="poster">导出分享图(PNG)</button>' +
          '<button class="tool-btn tool-btn--ghost" id="again">换一片星空</button>' +
          '<span class="idp-hint" id="info"></span>' +
        '</div>' +
        '<div id="out"></div>' +
      '</div>' +
      '<div>' +
        '<div class="sm-field"><label for="title">标题(可留空)</label><input class="sm-input" id="title" value="静夜思"></div>' +
        '<div class="sm-field"><label for="body">文字(每换行一句,逗号句号也算断开)</label><textarea class="sm-input" id="body" rows="7" spellcheck="false"></textarea></div>' +
        '<div class="sm-legend" id="legend" role="status" aria-live="polite"></div>' +
        '<p class="sm-oneline">把鼠标放到星星上(手机点一下),能看到它是哪个字。</p>' +
        '<p class="sm-oneline">全部在浏览器里算:不联网、不上传、不用 AI。同一段文字 + 同一个种子 → 同一片星空。</p>' +
      '</div>' +
    '</div>';

  var cv = root.querySelector('#cv'), g = cv.getContext('2d');
  var body = root.querySelector('#body'), titleEl = root.querySelector('#title');
  var legend = root.querySelector('#legend'), info = root.querySelector('#info'), out = root.querySelector('#out');
  body.value = SAMPLE;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var salt = 0;
  var stars = [], lines = [], hoverIdx = -1;
  var W = cv.width, Hh = cv.height;

  // ---------- 确定性随机:同一段文字必须得到同一片星空 ----------
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function charsOf(text) {
    var out2 = [];
    text.split(/\n/).forEach(function (line, li) {
      var seg = line.replace(/[\s]+/g, '');
      for (var i = 0; i < seg.length; i++) out2.push({ ch: seg[i], line: li });
      out2.push({ ch: '\u3000', line: li, br: true });   // 句末断开,保证连线不跨句
    });
    return out2;
  }

  function build() {
    var text = body.value || '';
    var cs = charsOf(text);
    var seed = hashStr(text + '|' + salt);
    var rnd = rng(seed);
    var padX = W * 0.14, padY = Hh * 0.16;
    var innerW = W - padX * 2, innerH = Hh * 0.6;
    stars = []; lines = [];
    var cx = W / 2, cy = padY + innerH / 2;
    cs.forEach(function (c, i) {
      if (c.br) { lines.push(null); return; }
      // 椭圆内分布 + 轻微的螺旋,让星图"有形状"而不是随机撒点
      var t = i / Math.max(1, cs.length - 1);
      var ang = t * Math.PI * 3.1 + rnd() * 0.9;
      var rad = Math.sqrt(rnd()) * 0.92;
      var x = cx + Math.cos(ang) * (innerW / 2) * rad * (0.75 + 0.35 * t);
      var y = cy + Math.sin(ang) * (innerH / 2) * rad * (0.55 + 0.45 * t);
      var big = rnd() > 0.86;
      stars.push({ ch: c.ch, x: x, y: y, r: big ? 3.4 + rnd() * 2.6 : 1.5 + rnd() * 1.9, hue: 200 + rnd() * 120, tw: rnd() * Math.PI * 2, big: big });
      lines.push(stars.length - 1);
    });
    // 把上一句的最后一个字连到下一句的第一个字
    var seq = [];
    lines.forEach(function (idx) { if (idx !== null) seq.push(idx); });
    lines = seq;
    hoverIdx = -1;
    info.textContent = '共 ' + stars.length + ' 颗星(每个字一颗)';
    paintLegend();
  }
  // 如实说明为什么换了格式(深色噪点图 PNG 天然大)
  function fmtNote(png, jpg, useJpg) {
    if (!png || !jpg) return '';
    return useJpg
      ? '(深色星空用 PNG 要 ' + H.fmt(png.size) + ',JPG 更小,已自动输出 JPG)'
      : '(JPG 是 ' + H.fmt(jpg.size) + ',PNG 更小,已输出 PNG)';
  }
  function paintLegend() {
    if (hoverIdx >= 0) {
      var s = stars[hoverIdx];
      legend.innerHTML = '<div style="font-size:22px">' + H.esc(s.ch) + '</div><div style="color:#6e6e73">第 ' + (hoverIdx + 1) + ' 个字 · 亮度 ' + (s.big ? '亮星' : '常星') + '</div>';
    } else {
      legend.innerHTML = '<div style="color:#6e6e73">把鼠标放到星星上(手机点一下),这里会显示它是哪个字。</div>';
    }
  }

  function draw(t) {
    var grad = g.createLinearGradient(0, 0, W, Hh);
    grad.addColorStop(0, '#070a12'); grad.addColorStop(0.55, '#0a0e1a'); grad.addColorStop(1, '#06070c');
    g.fillStyle = grad; g.fillRect(0, 0, W, Hh);
    // 星云:几团很淡的径向渐变
    var neb = [[0.28, 0.30, '#2b4a8b'], [0.72, 0.62, '#6a3f6b'], [0.48, 0.84, '#1f5c58']];
    g.globalCompositeOperation = 'lighter';
    neb.forEach(function (n) {
      var rg = g.createRadialGradient(W * n[0], Hh * n[1], 10, W * n[0], Hh * n[1], W * 0.5);
      rg.addColorStop(0, n[2] + '55'); rg.addColorStop(1, 'transparent');
      g.fillStyle = rg; g.fillRect(0, 0, W, Hh);
    });
    // 背景细星(固定由 seed 决定,不闪烁)
    var bg = rng(hashStr(body.value) ^ 0x9e3779b9);
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (var i = 0; i < 160; i++) { var bx = bg() * W, by = bg() * Hh; g.fillRect(bx, by, 1.2, 1.2); }
    // 连线(星座)
    g.strokeStyle = 'rgba(140,190,255,.28)'; g.lineWidth = 1.2;
    g.beginPath();
    for (var k = 1; k < lines.length; k++) {
      var a = stars[lines[k - 1]], b = stars[lines[k]];
      if (!a || !b) continue;
      g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    }
    g.stroke();
    // 星星
    stars.forEach(function (s, idx) {
      var tw = reduce ? 1 : (0.72 + 0.28 * Math.sin(t / 900 + s.tw));
      var hot = idx === hoverIdx;
      var r = s.r * (hot ? 2.1 : 1) * tw;
      var rg2 = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
      rg2.addColorStop(0, 'hsla(' + s.hue + ',95%,' + (hot ? 92 : 82) + '%,' + (hot ? 0.95 : 0.8) + ')');
      rg2.addColorStop(1, 'transparent');
      g.fillStyle = rg2; g.beginPath(); g.arc(s.x, s.y, r * 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, Math.max(1, r * 0.7), 0, Math.PI * 2); g.fill();
      if (hot) {
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(s.x, s.y, r * 6, 0, Math.PI * 2); g.stroke();
      }
    });
    g.globalCompositeOperation = 'source-over';
    // 标题与落款
    g.fillStyle = '#fff'; g.textBaseline = 'top';
    g.font = '700 58px "Geist", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    var tt = (titleEl.value || '').trim();
    if (tt) g.fillText(tt, W * 0.08, Hh * 0.07);
    g.font = '500 26px "Geist", -apple-system, "PingFang SC", sans-serif';
    g.fillStyle = 'rgba(255,255,255,.62)';
    g.fillText('每个字是一颗星 · 共 ' + stars.length + ' 颗', W * 0.08, Hh * 0.07 + 70);
    g.font = '500 24px "Geist", -apple-system, "PingFang SC", sans-serif';
    g.fillStyle = 'rgba(255,255,255,.42)';
    g.fillText('gongjuhe.top/star-map · 本机生成', W * 0.08, Hh - 70);
  }
  var raf = null;
  function loop(t) { draw(t || 0); raf = requestAnimationFrame(loop); }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  start();
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  // 悬停 / 触摸看字
  function pick(clientX, clientY) {
    var rect = cv.getBoundingClientRect();
    var x = (clientX - rect.left) / rect.width * W, y = (clientY - rect.top) / rect.height * Hh;
    var best = -1, bestD = 22 * 22;
    stars.forEach(function (s, i) { var d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y); if (d < bestD) { bestD = d; best = i; } });
    if (best !== hoverIdx) { hoverIdx = best; paintLegend(); }
  }
  cv.addEventListener('pointermove', function (e) { pick(e.clientX, e.clientY); });
  cv.addEventListener('pointerleave', function () { hoverIdx = -1; paintLegend(); });
  cv.addEventListener('pointerdown', function (e) { pick(e.clientX, e.clientY); });
  cv.setAttribute('tabindex', '0');
  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', '文字星图:每个字一颗星,鼠标悬停可看字');

  body.addEventListener('input', build);
  titleEl.addEventListener('input', function () { /* 下一帧就会画上 */ });
  root.querySelector('#again').addEventListener('click', function () { salt++; build(); out.innerHTML = ''; });
  root.querySelector('#poster').addEventListener('click', function () {
    stop();
    draw(0);
    // 星空是深色噪点图:PNG 会很大(实测 1.7MB),JPG 小得多。两种都编一份,谁小用谁,并如实说明。
    var toB = function (type, q) { return new Promise(function (r) { cv.toBlob(r, type, q); }); };
    Promise.all([toB('image/png'), toB('image/jpeg', 0.92)]).then(async function (arr) {
      start();
      var png = arr[0], jpg = arr[1];
      var useJpg = !!(png && jpg && jpg.size < png.size);
      var blob = useJpg ? jpg : png;
      if (!blob) { out.innerHTML = '<div class="note err" style="display:block">导出失败,请重试。</div>'; return; }
      var chk = await H.checkImage(blob);
      var base = '文字星图-' + (titleEl.value.trim() || '未命名');
      if (chk.ok) H.downloadBlob(blob, base + (useJpg ? '.jpg' : '.png'));
      out.innerHTML = '<div class="note ' + (chk.ok ? 'ok' : 'err') + '" style="display:block">'
        + (chk.ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓ 尺寸与预览一致)' + fmtNote(png, jpg, useJpg) : '自检没通过:' + H.esc(chk.error)) + '</div>';
    });
  });

  build();
  if (reduce) out.innerHTML = '<div class="note" style="display:block">系统开启了「减少动态效果」:星星不再闪烁,画面是静态的。</div>';
}
