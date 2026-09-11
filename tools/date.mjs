// tools/date.mjs — 日期 & 时间戳（日历运算 + Unix 互转）
export function mount(root, H) {
  H.injectCss(".crow{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}.crow label{font-size:14px;color:#6e6e73}");
  root.innerHTML =
    '<h1 class="tool-h1">日期 & 时间戳</h1>' +
    '<p class="tool-sub">日期差、加减天数、Unix 时间戳互转。全部本地。</p>' +
    '<span class="mode-tabs" id="mt"><button data-m="calc" class="active">日期运算</button><button data-m="ts">时间戳</button></span>' +
    '<div id="calcPane">' +
      '<div class="tool-field"><label>起始日期</label><input type="date" class="tool-input" id="d1"></div>' +
      '<div class="tool-field"><label>结束日期</label><input type="date" class="tool-input" id="d2"></div>' +
      '<div class="tool-row" style="margin-bottom:12px"><button class="tool-btn" id="diff">算相差天数</button>' +
      '<label style="font-size:14px;color:#6e6e73;margin-left:12px">加减</label><input type="number" class="tool-input" id="n" value="30" style="width:80px"><span style="color:#6e6e73;font-size:14px">天</span>' +
      '<button class="tool-btn tool-btn--ghost" id="add">加</button><button class="tool-btn tool-btn--ghost" id="sub">减</button></div>' +
      '<div class="tool-output" id="cout"></div>' +
    '</div>' +
    '<div id="tsPane" style="display:none">' +
      '<div class="tool-field"><label>Unix 时间戳（秒或毫秒）</label><input type="text" class="tool-input" id="ts" placeholder="如 1700000000 或 1700000000000"><button class="tool-btn" id="ts2d" style="margin-left:8px">转为日期</button></div>' +
      '<div class="tool-field"><label>日期转时间戳</label><div class="crow"><input type="datetime-local" class="tool-input" id="dts"><button class="tool-btn" id="d2ts">转换</button></div></div>' +
      '<div class="tool-output mono" id="tsout"></div>' +
      '<p class="tool-sub" style="margin-top:12px">当前时间戳（实时）：<span id="nowts" class="mono"></span></p>' +
    '</div>';

  function dstr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function getD(id) { var v = root.querySelector(id).value; if (!v) return null; var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  root.querySelector('#mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    root.querySelectorAll('#mt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#calcPane').style.display = b.dataset.m === 'calc' ? 'block' : 'none';
    root.querySelector('#tsPane').style.display = b.dataset.m === 'ts' ? 'block' : 'none';
  });

  root.querySelector('#diff').addEventListener('click', function () { var a = getD('#d1'), b = getD('#d2'); if (!a || !b) { root.querySelector('#cout').textContent = '请选日期'; return; } root.querySelector('#cout').textContent = '相差 ' + Math.round((b - a) / 86400000) + ' 天'; });
  root.querySelector('#add').addEventListener('click', function () { var a = getD('#d1'); if (!a) { root.querySelector('#cout').textContent = '请选起始日期'; return; } var d = new Date(a); d.setDate(d.getDate() + (parseInt(root.querySelector('#n').value, 10) || 0)); root.querySelector('#cout').textContent = dstr(d); });
  root.querySelector('#sub').addEventListener('click', function () { var a = getD('#d1'); if (!a) { root.querySelector('#cout').textContent = '请选起始日期'; return; } var d = new Date(a); d.setDate(d.getDate() - (parseInt(root.querySelector('#n').value, 10) || 0)); root.querySelector('#cout').textContent = dstr(d); });

  root.querySelector('#ts2d').addEventListener('click', function () {
    var v = root.querySelector('#ts').value.trim(); var out = root.querySelector('#tsout');
    if (!/^\d+$/.test(v)) { out.textContent = '请输入数字时间戳（例如 1700000000）。'; return; }
    var n = parseInt(v, 10);
    if (v.length > 10) n = n; else n = n * 1000;
    var d = new Date(n);
    if (isNaN(d.getTime())) { out.textContent = '无效时间戳'; return; }
    out.innerHTML = '本地：' + d.toString() + '<br>ISO：' + d.toISOString() + '<br>UTC：' + d.toUTCString() + '<br>秒：' + Math.floor(d.getTime() / 1000) + ' ｜ 毫秒：' + d.getTime();
  });
  root.querySelector('#d2ts').addEventListener('click', function () {
    var v = root.querySelector('#dts').value; var out = root.querySelector('#tsout');
    if (!v) { out.textContent = '请选日期时间'; return; }
    var d = new Date(v);
    out.innerHTML = '秒：' + Math.floor(d.getTime() / 1000) + '<br>毫秒：' + d.getTime() + '<br>ISO：' + d.toISOString();
  });
  setInterval(function () { var el = root.querySelector('#nowts'); if (el) el.textContent = Math.floor(Date.now() / 1000) + ' 秒 / ' + Date.now() + ' 毫秒'; }, 1000);
}
