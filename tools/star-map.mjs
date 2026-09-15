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
    + ".sm-oneline{font-size:14px;color:#6e6e73;margin-top:8px}"
    + ".sm-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}"
    + ".sm-chip{min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--c-line-strong);background:#fff;font-size:14px;cursor:pointer}"
    + ".sm-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".sm-score{margin-top:12px;border:1px solid var(--c-hairline);border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.7}"
    + ".sm-score .st{font-size:20px;color:#e8a33d;letter-spacing:2px}"
    + ".sm-score .lb{font-weight:600;margin-left:8px}"
    + ".sm-score .why{color:#6e6e73;margin-top:4px}"
    + ".sm-score .mx{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;color:#3a3a3c}"
    + ".sm-score .mx b{font-variant-numeric:tabular-nums}");

  // 引导:不知道写什么是最常见的卡点(NN/g 渐进披露:首屏给能直接用的例子,别弹教程)
  var EXAMPLES = [
    { name: '古诗', text: '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡', title: '静夜思' },
    { name: '名单', text: '张伟\n王芳\n李娜\n张伟\n刘洋\n王芳\n陈静\n张伟', title: '点名册' },
    { name: '金句', text: '慢慢来\n比较快\n把一件小事\n做到不需要解释', title: '慢慢来' },
    { name: '说明文', text: '全部在浏览器里完成\n文件不会离开这台电脑\n不联网\n不上传\n不用注册', title: '为什么本地' }
  ];
  var SAMPLE = EXAMPLES[0].text;
  // 今日星图:每天固定一篇,所有人当天看到同一片星空 —— 复玩理由来自"每天只有一篇"
  // (Wordle 的每日同题做法,见 内部文档/计划-作品线成熟化.md 第 8 节 The Verge 的分析)
  var DAILY = [
    { t: '静夜思', x: '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡' },
    { t: '登鹳雀楼', x: '白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼' },
    { t: '春晓', x: '春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少' },
    { t: '江雪', x: '千山鸟飞绝\n万径人踪灭\n孤舟蓑笠翁\n独钓寒江雪' },
    { t: '相思', x: '红豆生南国\n春来发几枝\n愿君多采撷\n此物最相思' },
    { t: '赋得古原草送别', x: '离离原上草\n一岁一枯荣\n野火烧不尽\n春风吹又生' },
    { t: '悯农', x: '锄禾日当午\n汗滴禾下土\n谁知盘中餐\n粒粒皆辛苦' }
  ];
  function dailyIndex() {
    var d = new Date();
    var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return ((days % DAILY.length) + DAILY.length) % DAILY.length;
  }
  function dailyLabel() {
    var d = new Date();
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }
  root.innerHTML =
    '<h1 class="tool-h1">文字星图</h1>' +
    '<p class="tool-sub">写下一段文字,它会变成一片星空:<b>每个字是一颗星</b>,字与字之间的连线就是句子的走向。同一段文字永远是同一片星空,可以导出成分享图。</p>' +
    '<div class="sm-wrap">' +
      '<div>' +
        '<div class="sm-stage"><canvas id="cv" width="1000" height="1250" aria-label="文字星图预览"></canvas></div>' +
        '<div class="tool-row" style="margin-top:14px">' +
          '<button class="tool-btn" id="poster">导出分享图(PNG)</button>' +
          '<button class="tool-btn tool-btn--ghost" id="again">换一片星空</button>' +
          '<button class="tool-btn" id="daily">今日星图</button>' +
          '<button class="tool-btn tool-btn--ghost" id="eg">换个例子</button>' +
          '<span class="idp-hint" id="info"></span>' +
        '</div>' +
        '<div id="out"></div>' +
      '</div>' +
      '<div>' +
        '<div class="sm-chips" id="mode"><button class="sm-chip active" data-m="char">按字(每字一颗星)</button><button class="sm-chip" data-m="phrase">按词句(重复的更大)</button><button class="sm-chip" data-m="line">按行(每行一颗星)</button></div>'
        + '<div class="sm-field"><label for="title">标题(可留空)</label><input class="sm-input" id="title" value="静夜思"></div>' +
        '<div class="sm-field"><label for="body">文字(每换行一句,逗号句号也算断开)</label><textarea class="sm-input" id="body" rows="7" spellcheck="false"></textarea></div>' +
        '<div class="sm-legend" id="legend" role="status" aria-live="polite"></div>' +
        '<div class="sm-score" id="score" role="status" aria-live="polite"></div>' +
        '<p class="sm-oneline" id="dailyline"></p>' +
        '<p class="sm-oneline">把鼠标放到星星上(手机点一下),能看到它是哪个字。</p>' +
        '<p class="sm-oneline">全部在浏览器里算:不联网、不上传、不用 AI。同一段文字 + 同一个种子 → 同一片星空。</p>' +
      '</div>' +
    '</div>';

  var cv = root.querySelector('#cv'), g = cv.getContext('2d');
  var body = root.querySelector('#body'), titleEl = root.querySelector('#title');
  var legend = root.querySelector('#legend'), info = root.querySelector('#info'), out = root.querySelector('#out');
  body.value = SAMPLE;
  var _dailyLine = root.querySelector('#dailyline');
  if (_dailyLine) _dailyLine.textContent = '今日星图(' + dailyLabel() + '):《' + DAILY[dailyIndex()].t + '》—— 点上面的按钮就能载入。';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var salt = 0, mode = 'char';
  var stars = [], lines = [], hoverIdx = -1;
  // 分享图要能"讲故事":把指标与星等带到图上(调研:分享图只给结论没人转,要带过程/指标)
  var meta = { stars: 0, sentences: 0, units: 0, longest: 0, dupKinds: 0, maxCount: 0, rating: '', label: '' };
  root.querySelector('#mode').addEventListener('click', function (e) {
    var b = e.target.closest('.sm-chip'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#mode .sm-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    build();
  });
  var W = cv.width, Hh = cv.height;
  var scoreEl = root.querySelector('#score');
  var egBtn = root.querySelector('#eg'), egIdx = 0;
  egBtn.addEventListener('click', function () {
    egIdx = (egIdx + 1) % EXAMPLES.length;
    body.value = EXAMPLES[egIdx].text;
    titleEl.value = EXAMPLES[egIdx].title;
    salt = 0; build();          // 换例子要看到立刻出图,不需要用户再点别的(NN/g:首屏可试)
    H.toast('例子:' + EXAMPLES[egIdx].name + '(再点一次换下一个)', { ms: 4000 });
  });

  var dailyBtn = root.querySelector('#daily');
  function loadDaily(announce) {
    var it = DAILY[dailyIndex()];
    body.value = it.x; titleEl.value = it.t; salt = 0;
    build();
    var line = root.querySelector('#dailyline');
    if (line) line.textContent = '今日星图(' + dailyLabel() + '):《' + it.t + '》—— 每天换一篇,当天所有人看到的是同一片星空。';
    if (announce) H.toast('今日星图:《' + it.t + '》', { ms: 4500 });
  }
  dailyBtn.addEventListener('click', function () { loadDaily(true); });

  // 目标与计分:先给可核对的反馈,再折算成"星等"(NN/g 游戏化:以学习者为中心、先反馈后计分)
  function gradeUnits(n, dupKinds, maxCount, sentenceCount) {
    // 文案里不写"几颗星":星星本身已经画出来了,而"重复"会再加一颗 ——
    // 第一版把星数写进 label,于出现过 ★★★★★ 旁边写着"四颗星"的自相矛盾(自己读出来的)。
    var stars = 1, label = '太短了', why = '';
    if (n >= 60) { stars = 5; label = '一片完整的星空'; }
    else if (n >= 20) { stars = 4; label = '够铺开一片天'; }
    else if (n >= 6) { stars = 3; label = '能连成星座了'; }
    else if (n >= 3) { stars = 2; label = '再写一句'; }
    if (dupKinds > 0 && stars < 5) { stars += 1; why = '有 ' + dupKinds + ' 个单位重复出现,星星更大更亮,加一颗。'; }
    else if (dupKinds === 0 && stars >= 3) { why = '没有重复的单位,星空比较均匀。'; }
    else if (n < 6) { why = '单位太少,连不成星座 —— 多写几行就好看多了。'; }
    return { stars: stars, label: label, why: why, sentenceCount: sentenceCount, maxCount: maxCount };
  }

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
  // 三种"星"的单位:按字 / 按词句(按标点断开)/ 按行(每行一颗,适合同名、名单)
  function tokensFor(text, mode) {
    var out2 = [];
    if (mode === 'line') {
      text.split(/\n/).forEach(function (line) {
        var t = line.trim();
        if (t) out2.push({ ch: t, line: 0 });
      });
      return out2;
    }
    if (mode === 'phrase') {
      text.split(/[，。！？；：、,.!?;:\s"'“”‘’()（）【】《》〈〉…—\-]+/).forEach(function (t) {
        if (t) out2.push({ ch: t, line: 0 });
      });
      return out2;
    }
    text.split(/\n/).forEach(function (line, li) {
      var seg = line.replace(/[\s]+/g, '');
      for (var i = 0; i < seg.length; i++) out2.push({ ch: seg[i], line: li });
      out2.push({ ch: '\u3000', line: li, br: true });   // 句末断开,保证连线不跨句
    });
    return out2;
  }

  function build() {
    var text = body.value || '';
    var cs = tokensFor(text, mode);
    // 词频:重复出现的单位要更大更亮(同一句话里重复的名字/词,一眼能看出来)
    var freq = {};
    cs.forEach(function (c) { if (c.br) return; freq[c.ch] = (freq[c.ch] || 0) + 1; });
    var maxCount = 1, dupKinds = 0;
    Object.keys(freq).forEach(function (k) { if (freq[k] > maxCount) maxCount = freq[k]; if (freq[k] > 1) dupKinds++; });
    var seed = hashStr(text + '|' + salt + '|' + mode);
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
      var cnt = freq[c.ch] || 1;
      var big = rnd() > 0.86 || cnt > 1;
      var boost = cnt > 1 ? (1 + Math.min(2.2, Math.log2(cnt) * 0.9)) : 1;
      stars.push({ ch: c.ch, x: x, y: y, r: (big ? 3.4 + rnd() * 2.6 : 1.5 + rnd() * 1.9) * boost, count: cnt, hue: 200 + rnd() * 120 + (cnt > 1 ? 40 : 0), tw: rnd() * Math.PI * 2, big: big });
      lines.push(stars.length - 1);
    });
    // 把上一句的最后一个字连到下一句的第一个字
    var seq = [];
    lines.forEach(function (idx) { if (idx !== null) seq.push(idx); });
    lines = seq;
    hoverIdx = -1;
    var unit = mode === 'char' ? '个字符' : (mode === 'phrase' ? '个词句' : '行');
    // 指标条 + 星等:都是本地能核对出来的数,不编造
    var units = text.replace(/[\s\u3000]/g, '').length;
    var uniqChars = Object.keys(freq).length;
    var sentenceCount = text.split(/\n/).filter(function (x) { return x.trim(); }).length;
    var longest = text.split(/\n/).reduce(function (a, x) { return Math.max(a, x.replace(/[\s\u3000]/g, '').length); }, 0);
    var gr = gradeUnits(stars.length, dupKinds, maxCount, sentenceCount);
    var stTxt = '';
    for (var si = 0; si < 5; si++) stTxt += (si < gr.stars ? '★' : '☆');
    scoreEl.innerHTML = '<div><span class="st">' + stTxt + '</span><span class="lb">' + H.esc(gr.label) + '</span></div>'
      + '<div class="why">' + H.esc(gr.why) + '</div>'
      + '<div class="mx"><span>星 <b>' + stars.length + '</b></span><span>句 <b>' + sentenceCount + '</b></span>'
      + '<span>不重复单位 <b>' + uniqChars + '</b></span><span>最长句 <b>' + longest + '</b> 字符</span>'
      + (dupKinds ? '<span>重复 <b>' + dupKinds + '</b> 种,最多 <b>' + maxCount + '</b> 次</span>' : '') + '</div>';
    meta.stars = stars.length; meta.sentences = sentenceCount; meta.units = uniqChars; meta.longest = longest;
    meta.dupKinds = dupKinds; meta.maxCount = maxCount; meta.rating = stTxt; meta.label = gr.label;
    info.textContent = '共 ' + stars.length + ' 颗星(按' + unit + '计)'
      + (dupKinds ? ' · ' + dupKinds + ' 个重复出现,最多 ' + maxCount + ' 次(重复的星更大更亮)' : '');
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
      legend.innerHTML = '<div style="font-size:22px">' + H.esc(s.ch) + '</div><div style="color:#6e6e73">第 ' + (hoverIdx + 1) + ' 颗' + (s.count > 1 ? ' · <b>重复出现 ' + s.count + ' 次</b>' : '') + ' · ' + (s.big ? '亮星' : '常星') + '</div>';
    } else {
      legend.innerHTML = '<div style="color:#6e6e73">把鼠标放到星星上(手机点一下),这里会显示它是哪个字。</div>';
    }
  }

  // 分享图上带二维码:产物本身就能拉人(调研结论:传播发生在外部分享,不在平台画廊)
  async function makeQr(text, size) {
    if (!window.qrcode) await H.loadScript('/vendor/qrcode.min.js?v=1');
    var qr = window.qrcode(0, 'M');
    qr.addData(text); qr.make();
    var n = qr.getModuleCount();
    var cell = Math.max(2, Math.floor(size / (n + 4)));
    var pad = 2 * cell;
    var c = document.createElement('canvas');
    c.width = c.height = n * cell + pad * 2;
    var g2 = c.getContext('2d');
    g2.fillStyle = '#fff'; g2.fillRect(0, 0, c.width, c.height);
    g2.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) if (qr.isDark(r, col)) g2.fillRect(pad + col * cell, pad + r * cell, cell, cell);
    return c;
  }

  function draw(t, qrImg) {
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
    // 指标条 + 星等:分享图上直接写清"这片星空是什么样",而不是只给一句结论
    if (meta.stars) {
      g.font = '600 30px "Geist", -apple-system, "PingFang SC", sans-serif';
      g.fillStyle = '#e8c37a';
      g.fillText(meta.rating + '  ' + meta.label, W * 0.08, Hh * 0.07 + 116);
      g.font = '500 24px "Geist", -apple-system, "PingFang SC", sans-serif';
      g.fillStyle = 'rgba(255,255,255,.72)';
      var mx = ['星 ' + meta.stars, '句 ' + meta.sentences, '不重复 ' + meta.units, '最长句 ' + meta.longest + ' 字'];
      if (meta.dupKinds) mx.push('重复 ' + meta.dupKinds + ' 种/最多 ' + meta.maxCount + ' 次');
      g.fillText(mx.join('   ·   '), W * 0.08, Hh * 0.07 + 160);
    }
    g.font = '500 24px "Geist", -apple-system, "PingFang SC", sans-serif';
    g.fillStyle = 'rgba(255,255,255,.42)';
    g.fillText('gongjuhe.top/star-map · 本机生成', W * 0.08, Hh - 70);
    if (qrImg) {
      var qs = qrImg.width, qx = W - qs - 68, qy = Hh - qs - 116;
      g.fillStyle = '#fff';
      g.beginPath();
      var rr = 14, qw = qs + 24;
      g.moveTo(qx - 12 + rr, qy - 12);
      g.arcTo(qx - 12 + qw, qy - 12, qx - 12 + qw, qy - 12 + qw, rr);
      g.arcTo(qx - 12 + qw, qy - 12 + qw, qx - 12, qy - 12 + qw, rr);
      g.arcTo(qx - 12, qy - 12 + qw, qx - 12, qy - 12, rr);
      g.arcTo(qx - 12, qy - 12, qx - 12 + qw, qy - 12, rr);
      g.closePath(); g.fill();
      g.drawImage(qrImg, qx, qy);
      g.fillStyle = 'rgba(255,255,255,.75)';
      g.font = '500 22px "Geist", -apple-system, "PingFang SC", sans-serif';
      g.textAlign = 'center';
      g.fillText('扫码做一张你的', qx + qs / 2, qy + qs + 16);
      g.textAlign = 'left';
    }
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
  // 星空是深色噪点图:PNG 会很大(实测 1.5MB),JPG 小得多。两种都编一份,谁小用谁,并如实说明。
  async function encode() {
    var toB = function (type, q) { return new Promise(function (r) { cv.toBlob(r, type, q); }); };
    var arr = await Promise.all([toB('image/png'), toB('image/jpeg', 0.92)]);
    start();
    var png = arr[0], jpg = arr[1];
    var useJpg = !!(png && jpg && jpg.size < png.size);
    var blob = useJpg ? jpg : png;
    if (!blob) { out.innerHTML = '<div class="note err" style="display:block">导出失败,请重试。</div>'; return; }
    var chk = await H.checkImage(blob);
    var base = '文字星图-' + (titleEl.value.trim() || '未命名');
    if (chk.ok) H.downloadBlob(blob, base + (useJpg ? '.jpg' : '.png'));
    out.innerHTML = '<div class="note ' + (chk.ok ? 'ok' : 'err') + '" style="display:block">'
      + (chk.ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓ 尺寸与预览一致)' + fmtNote(png, jpg, useJpg) + ' · 右下角是扫码入口' : '自检没通过:' + H.esc(chk.error)) + '</div>';
  }
  root.querySelector('#poster').addEventListener('click', function () {
    stop();
    makeQr('https://gongjuhe.top/star-map/', 210)
      .then(function (qr) { draw(0, qr); return encode(); })
      .catch(function (e) { draw(0); out.innerHTML = '<div class="note err" style="display:block">二维码画不出来(不影响星图):' + H.esc(H.friendlyError(e, 'QR 失败')) + '</div>'; return encode(); });
  });

  build();
  if (reduce) out.innerHTML = '<div class="note" style="display:block">系统开启了「减少动态效果」:星星不再闪烁,画面是静态的。</div>';
}
