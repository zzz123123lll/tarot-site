// tools/json.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">JSON 格式化</h1><p class="tool-sub">美化、压缩、校验 JSON。</p>'
    + '<div class="tool-field"><label>输入</label><textarea id="in" class="tool-textarea" placeholder="粘贴 JSON…"></textarea></div>'
    + '<div class="tool-row"><button class="tool-btn" id="pretty">格式化</button><button class="tool-btn tool-btn--ghost" id="min">压缩</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>'
    + '<p class="err-text" id="err"></p><div class="tool-output" id="out"></div>';
  var tin = root.querySelector('#in'), tout = root.querySelector('#out'), terr = root.querySelector('#err');
  function showErr(msg){ terr.textContent = msg; terr.style.display = msg ? 'block' : 'none'; }
  function run(indent) {
    showErr('');
    var v = tin.value.trim(); if (!v) { tout.textContent = ''; return; }
    try { var p = JSON.parse(v); tout.textContent = JSON.stringify(p, null, indent); }
    catch (e) { tout.textContent = ''; showErr('JSON 无效：' + e.message); }
  }
  root.querySelector('#pretty').addEventListener('click', function(){ run(2); });
  root.querySelector('#min').addEventListener('click', function(){ run(0); });
  root.querySelector('#clr').addEventListener('click', function(){ tin.value=''; tout.textContent=''; showErr(''); });
}