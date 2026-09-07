// tools/qr.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">二维码生成</h1><p class="tool-sub">文字/链接生成二维码。</p>'
    + '<div class="tool-field"><label>内容</label><textarea id="txt" class="tool-textarea" placeholder="输入文字或链接…"></textarea></div>'
    + '<div class="tool-row"><button class="tool-btn" id="go">生成</button><button class="tool-btn tool-btn--ghost" id="dl" style="display:none">下载 PNG</button></div>'
    + '<div id="qr" style="margin-top:16px"></div>';
  var txt = root.querySelector('#txt'), box = root.querySelector('#qr'), dl = root.querySelector('#dl');
  var curDataUrl = '';
  root.querySelector('#go').addEventListener('click', async function () {
    var v = txt.value.trim(); if (!v) return;
    try { await H.loadScript('/vendor/qrcode.min.js?v=1'); } catch(e){ box.innerHTML='二维码库加载失败'; return; }
    try {
      var qr = window.qrcode(0, 'M'); qr.addData(v); qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2 });
      curDataUrl = qr.createDataURL(10, 2);
      dl.style.display = 'inline-flex';
    } catch(e){ box.innerHTML='生成失败：' + e.message; }
  });
  dl.addEventListener('click', function(){ if (curDataUrl) { var a=document.createElement('a'); a.href=curDataUrl; a.download='qrcode.png'; a.click(); } });
}