// tools/qr.mjs — 二维码（自绘 canvas 支持颜色、容错级别）
export function mount(root, H) {
  H.injectCss(".crow{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}.crow label{font-size:14px;color:#6e6e73}");
  root.innerHTML =
    '<h1 class="tool-h1">二维码生成</h1>' +
    '<p class="tool-sub">文字/链接生成二维码，可调颜色。全部本地。</p>' +
    '<div class="tool-field"><label>内容</label><textarea id="txt" class="tool-textarea" placeholder="输入文字或链接…" style="min-height:90px"></textarea></div>' +
    '<div class="crow"><label>前景色</label><input type="color" id="fg" value="#1d1d1f"><label style="margin-left:12px">背景色</label><input type="color" id="bg" value="#ffffff"><label style="margin-left:12px">容错</label><select class="tool-select" id="ec"><option value="L">L 7%</option><option value="M" selected>M 15%</option><option value="Q">Q 25%</option><option value="H">H 30%</option></select></div>' +
    '<div class="tool-row" style="margin-bottom:16px"><button class="tool-btn" id="go">生成</button><button class="tool-btn tool-btn--ghost" id="dl" style="display:none">下载 PNG</button></div>' +
    '<div id="qr" style="margin-top:16px"></div>';

  var canvas = null, txt = root.querySelector('#txt');
  root.querySelector('#go').addEventListener('click', async function () {
    var v = txt.value.trim(); if (!v) return;
    try { await H.loadScript('/vendor/qrcode.min.js?v=1'); } catch (e) { root.querySelector('#qr').innerHTML = '二维码库加载失败'; return; }
    try {
      var qr = window.qrcode(0, root.querySelector('#ec').value);
      qr.addData(v); qr.make();
      var n = qr.getModuleCount(), margin = 2, cell = 6, fg = root.querySelector('#fg').value, bg = root.querySelector('#bg').value;
      var c = document.createElement('canvas');
      c.width = c.height = (n + margin * 2) * cell;
      var ctx = c.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = fg;
      for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) if (qr.isDark(r, col)) ctx.fillRect((col + margin) * cell, (r + margin) * cell, cell, cell);
      var box = root.querySelector('#qr');
      box.innerHTML = '';
      canvas = c;
      c.style.borderRadius = '8px';
      box.appendChild(c);
      root.querySelector('#dl').style.display = 'inline-flex';
    } catch (e) { root.querySelector('#qr').innerHTML = '生成失败：' + e.message; }
  });
  root.querySelector('#dl').addEventListener('click', function () {
    if (canvas) { canvas.toBlob(function (b) { H.downloadBlob(b, 'qrcode.png'); }, 'image/png'); }
  });
}
