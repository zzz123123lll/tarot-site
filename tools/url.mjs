// tools/url.mjs — URL 编解码 + query 解析
export function mount(root, H) {
  root.innerHTML =
    '<h1 class="tool-h1">URL 编解码</h1>' +
    '<p class="tool-sub">encode/decodeURIComponent、query 参数解析。全部本地。</p>' +
    '<div class="tool-field"><label>输入</label><textarea id="in" class="tool-textarea mono" placeholder="输入 URL、query 或文本…" style="min-height:90px"></textarea></div>' +
    '<div class="tool-row" style="margin-bottom:12px">' +
      '<button class="tool-btn" id="enc">encodeURIComponent</button><button class="tool-btn" id="dec">decodeURIComponent</button>' +
      '<button class="tool-btn tool-btn--ghost" id="qp">解析 query</button><button class="tool-btn tool-btn--ghost" id="cp">复制</button>' +
    '</div>' +
    '<p class="err-box" id="err" style="display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(215,0,21,.06);color:#d70015;font-size:13px"></p>' +
    '<div class="tool-output mono" id="out" style="white-space:pre-wrap;word-break:break-all"></div>';

  var tin = root.querySelector('#in'), tout = root.querySelector('#out'), terr = root.querySelector('#err');
  function show(msg) { terr.textContent = msg; terr.style.display = msg ? 'block' : 'none'; }
  root.querySelector('#enc').addEventListener('click', function () { try { tout.textContent = encodeURIComponent(tin.value); show(''); } catch (e) { show('编码失败：' + e.message); } });
  root.querySelector('#dec').addEventListener('click', function () {
    try { tout.textContent = decodeURIComponent(tin.value.trim()); show(''); }
    catch (e) { show('解码失败：包含畸形的 % 序列，请检查输入。'); }
  });
  root.querySelector('#qp').addEventListener('click', function () {
    var v = tin.value.trim();
    var q = v.indexOf('?') >= 0 ? v.slice(v.indexOf('?') + 1) : v;
    try {
      var params = new URLSearchParams(q);
      var lines = [];
      params.forEach(function (val, key) { lines.push(key + ' = ' + val); });
      tout.textContent = lines.length ? lines.join(' | ') : '没有解析到参数。';
      show('');
    } catch (e) { show('解析失败：' + e.message); }
  });
  root.querySelector('#cp').addEventListener('click', function () { if (tout.textContent) H.copyText(tout.textContent); });
}
