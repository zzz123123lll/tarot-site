// tarot/js/share-card.js — 解读分享图:把一次占卜画成 1080x1440 的卡片(纯 Canvas,本地生成)
(function () {
  var W = 1080, H = 1440;
  var GOLD = '#e4bd6b';
  var GOLD_DIM = 'rgba(228,189,107,0.6)';
  var INK = '#f5f2e8';
  var MUTED = 'rgba(245,242,232,0.52)';
  var SERIF_ZH = '"LXGW WenKai","Songti SC","STSong","SimSun",serif';
  var SERIF_EN = 'Georgia,"Times New Roman",serif';
  var QR_URL = 'https://gongjuhe.top/tarot/';

  // 确定性星野(固定种子 LCG,每次生成的图一致)
  var stars = (function () {
    var s = 7, out = [];
    function n() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < 48; i++) out.push({ x: 70 + n() * 940, y: 80 + n() * 520, r: 0.8 + n() * 2.2, a: 0.2 + n() * 0.5 });
    return out;
  })();

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function spaced(ctx, text, cx, y, gap) {
    var i, total = 0;
    for (i = 0; i < text.length; i++) total += ctx.measureText(text[i]).width;
    total += gap * Math.max(0, text.length - 1);
    var x = cx - total / 2;
    for (i = 0; i < text.length; i++) { ctx.fillText(text[i], x, y); x += ctx.measureText(text[i]).width + gap; }
  }

  function wrap(ctx, text, maxW) {
    var out = [], line = '';
    for (var i = 0; i < text.length; i++) {
      if (ctx.measureText(line + text[i]).width > maxW) { out.push(line); line = text[i]; }
      else line += text[i];
    }
    if (line) out.push(line);
    return out;
  }

  function drawQr(ctx, qrLib, tileX, tileY, tileSize) {
    // 白色圆角底
    roundRect(ctx, tileX, tileY, tileSize, tileSize, 22);
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (!qrLib) return;
    var q = qrLib(0, 'L');
    q.addData(QR_URL); q.make();
    var n = q.getModuleCount();
    var cell = Math.floor((tileSize - 24) / n);
    var size = n * cell;
    var off = (tileSize - size) / 2;
    ctx.fillStyle = '#14152f';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (q.isDark(r, c)) ctx.fillRect(tileX + off + c * cell, tileY + off + r * cell, cell, cell);
      }
    }
  }

  function fmtDate(ts) {
    var d = ts ? new Date(ts) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function build(reading, summary, qrLib) {
    var c = document.createElement('canvas');
    c.width = W * 2; c.height = H * 2;
    var x = c.getContext('2d');
    x.scale(2, 2);
    x.textBaseline = 'alphabetic';

    var bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#171838'); bg.addColorStop(0.45, '#10122b'); bg.addColorStop(1, '#090b1a');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(170, 120, 0, 170, 120, 640);
    glow.addColorStop(0, 'rgba(228,189,107,0.10)'); glow.addColorStop(1, 'rgba(228,189,107,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff';
    stars.forEach(function (st) { x.globalAlpha = st.a; x.beginPath(); x.arc(st.x, st.y, st.r, 0, 7); x.fill(); });
    x.globalAlpha = 1;

    x.strokeStyle = 'rgba(228,189,107,0.42)'; x.lineWidth = 1.5;
    x.strokeRect(56, 56, W - 112, H - 112);
    x.strokeStyle = 'rgba(228,189,107,0.16)';
    x.strokeRect(76, 76, W - 152, H - 152);

    x.textAlign = 'center';
    x.fillStyle = GOLD_DIM; x.font = '26px ' + SERIF_EN;
    spaced(x, 'RIDER-WAITE · 有依据的解读', W / 2, 172, 6);
    x.fillStyle = GOLD; x.font = '64px ' + SERIF_ZH;
    spaced(x, '✦ 星辉塔罗', W / 2, 250, 8);
    x.strokeStyle = 'rgba(228,189,107,0.28)';
    x.beginPath(); x.moveTo(330, 306); x.lineTo(750, 306); x.stroke();

    // 主牌名 + 正逆位(同基线,两段字号)
    var first = reading.cards[0];
    var rev = first.reversed;
    var name = String(first.card.name || '');
    x.font = '116px ' + SERIF_ZH;
    var nameW = x.measureText(name).width;
    var suffix = rev ? ' · 逆位' : ' · 正位';
    x.font = '62px ' + SERIF_ZH;
    var suffixW = x.measureText(suffix).width;
    var totalW = nameW + suffixW;
    var nameX = W / 2 - totalW / 2;
    x.fillStyle = GOLD;
    x.textAlign = 'left';
    x.font = '116px ' + SERIF_ZH;
    x.fillText(name, nameX, 486);
    x.font = '62px ' + SERIF_ZH;
    x.fillText(suffix, nameX + nameW, 486);
    x.textAlign = 'center';

    // 英文名
    var enY = 566;
    x.fillStyle = MUTED; x.font = '32px ' + SERIF_EN;
    spaced(x, String(first.card.en || '').toUpperCase() + (rev ? ' · REVERSED' : ' · UPRIGHT'), W / 2, enY, 4);

    // 同场其他牌
    var subY = enY;
    if (reading.cards.length > 1) {
      var rest = [];
      for (var i = 1; i < reading.cards.length; i++) {
        var it = reading.cards[i];
        rest.push(it.card.name + (it.reversed ? ' · 逆' : ' · 正'));
      }
      x.fillStyle = GOLD_DIM; x.font = '30px ' + SERIF_ZH;
      subY = enY + 66;
      x.fillText('同场 ' + rest.join(' / '), W / 2, subY);
    }

    // 金句(解读摘要)
    var quote = String(summary || '').replace(/^[✦✧\s]+/, '').trim();
    if (!quote) quote = first.position.label + ' · ' + name;
    x.fillStyle = INK; x.font = '44px ' + SERIF_ZH;
    var lines = wrap(x, quote, 840);
    var maxL = reading.cards.length > 1 ? 2 : 3;
    if (lines.length > maxL) lines = lines.slice(0, maxL).map(function (l, i) { return i === maxL - 1 ? l.replace(/.$/, '…') : l; });
    var quoteTop = subY + 104;
    lines.forEach(function (l, i) { x.fillText('「' + (i === 0 ? '' : '') + l + (i === lines.length - 1 ? '」' : ''), W / 2, quoteTop + i * 70); });

    // 牌阵 + 日期
    var infoY = quoteTop + lines.length * 70 + 86;
    x.fillStyle = GOLD_DIM; x.font = '28px ' + SERIF_ZH;
    spaced(x, '✦ ' + (reading.spread && reading.spread.name ? reading.spread.name : '塔罗占卜') + ' · ' + fmtDate(reading.time), W / 2, infoY, 4);

    // 底部:分隔 + 品牌 + 二维码
    var divY = Math.max(1210, infoY + 96);
    x.strokeStyle = 'rgba(228,189,107,0.28)';
    x.beginPath(); x.moveTo(320, divY); x.lineTo(760, divY); x.stroke();
    x.textAlign = 'left'; x.fillStyle = MUTED; x.font = '26px ' + SERIF_ZH;
    x.fillText('星辉塔罗 · 全部本地解读', 110, divY + 66);
    x.font = '24px ' + SERIF_EN;
    x.fillText('gongjuhe.top', 110, divY + 104);
    drawQr(x, qrLib, W - 56 - 168, divY - 22, 168);
    x.textAlign = 'center'; x.fillStyle = 'rgba(245,242,232,0.34)'; x.font = '22px ' + SERIF_ZH;
    x.fillText('塔罗是自我探索的工具,不是宿命判决', W / 2, H - 70);

    return c;
  }

  function ensureQr(cb) {
    if (window.qrcode) { cb(window.qrcode); return; }
    var s = document.createElement('script');
    s.src = '/vendor/qrcode.min.js?v=1';
    s.onload = function () { cb(window.qrcode || null); };
    s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  }

  function open(reading, summary) {
    var modal = document.getElementById('shareModal');
    var img = document.getElementById('shareImg');
    var dl = document.getElementById('shareDownload');
    if (!modal || !img) return;
    if (!reading || !reading.cards || !reading.cards.length) return;
    modal.classList.remove('hidden');
    ensureQr(function (qrLib) {
      var c = build(reading, summary, qrLib);
      var url = c.toDataURL('image/png');
      img.src = url;
      if (dl) { dl.href = url; dl.download = '星辉塔罗-' + reading.cards[0].card.name + '.png'; }
    });
  }

  function wireClose() {
    var modal = document.getElementById('shareModal');
    if (!modal) return;
    var close = function () { modal.classList.add('hidden'); };
    ['shareClose', 'shareClose2'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', close);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  window.ShareCard = { open: open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireClose);
  else wireClose();
})();
