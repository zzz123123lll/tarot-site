// tools/json.mjs — JSON 工具（美化/压缩/树形视图/校验定位）
export function mount(root, H) {
  H.injectCss(".jtree{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.47;color:#1d1d1f}.jtree ul{list-style:none;margin:0;padding-left:18px;border-left:1px solid rgba(0,0,0,.08)}.jtree summary{cursor:pointer;user-select:none;color:#6e6e73}.jtree summary:hover{color:#1d1d1f}.jtree .jk{color:#b25000}.jtree .js{color:#1d9e4e}.jtree .jn{color:#0071e3}.jtree .jp{color:#6e6e73}.err-box{display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(215,0,21,.06);color:#d70015;font-size:14px}");

  root.innerHTML =
    '<h1 class="tool-h1">JSON 格式化</h1>' +
    '<p class="tool-sub">美化、压缩、树形查看、校验。全部本地。</p>' +
    '<div class="tool-field"><label>输入</label><textarea id="in" class="tool-textarea" placeholder="粘贴 JSON…" style="min-height:140px"></textarea></div>' +
    '<div class="tool-row" style="margin-bottom:12px">' +
      '<span class="mode-tabs" id="mt"><button data-m="pretty" class="active">美化</button><button data-m="min">压缩</button><button data-m="tree">树形</button></span>' +
      '<button class="tool-btn tool-btn--ghost" id="cp" disabled>复制结果</button>' +
    '</div>' +
    '<p class="err-box" id="err"></p>' +
    '<div class="tool-output" id="out" style="min-height:80px"></div>';

  var mode = 'pretty';
  var tin = root.querySelector('#in'), tout = root.querySelector('#out'), terr = root.querySelector('#err'), tcp = root.querySelector('#cp');
  var prettyStr = '';

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function posFromError(msg) {
    var s = String(msg);
    // 原始报文两种形态:
    //   "… at position 8 (line 1 column 9)"  -> 用 position
    //   "… (line 1 column 9)"                 -> 用行列
    var m = s.match(/position\s+(\d+)/);
    if (m) return '（位置 ' + m[1] + '）';
    var lc = s.match(/line\s+(\d+)\s+column\s+(\d+)/);
    if (lc) return '（第 ' + lc[1] + ' 行第 ' + lc[2] + ' 列）';
    return '';
  }

  root.querySelector('#mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#mt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  tcp.addEventListener('click', function () { if (prettyStr) { H.copyText(prettyStr, this); tcp.textContent = '已复制'; setTimeout(function(){ tcp.textContent = '复制结果'; }, 1200); } });
  tin.addEventListener('input', function () { render(); });

  function render() {
    var v = tin.value.trim();
    if (!v) { tout.textContent = ''; terr.style.display = 'none'; tcp.disabled = true; return; }
    var parsed;
    try { parsed = JSON.parse(v); } catch (e) {
      tout.textContent = '';
      terr.textContent = 'JSON 无效：' + e.message + posFromError(e.message);
      terr.style.display = 'block';
      tcp.disabled = true;
      return;
    }
    terr.style.display = 'none';
    prettyStr = JSON.stringify(parsed, null, 2);
    if (mode === 'pretty') { tout.textContent = prettyStr; tout.style.whiteSpace = 'pre-wrap'; }
    else if (mode === 'min') { tout.textContent = JSON.stringify(parsed); tout.style.whiteSpace = 'pre-wrap'; }
    else { tout.innerHTML = renderTree(parsed); tout.style.whiteSpace = 'normal'; }
    tcp.disabled = false;
  }

  function renderTree(v) { return '<div class="jtree">' + treeNode(v, 0) + '</div>'; }
  function treeNode(v, depth) {
    if (depth > 8) return '<span class="jp">…</span>';
    if (Array.isArray(v)) {
      if (!v.length) return '<span class="jp">[]</span>';
      var items = v.slice(0, 200).map(function (x) { return '<li>' + treeNode(x, depth + 1) + '</li>'; }).join('');
      var more = v.length > 200 ? '<li><span class="jp">…共 ' + v.length + ' 项</span></li>' : '';
      return '<details' + (depth === 0 ? ' open' : '') + '><summary><span class="jp">[</span> ' + v.length + ' 项 <span class="jp">]</span></summary><ul>' + items + more + '</ul></details>';
    }
    if (v && typeof v === 'object') {
      var keys = Object.keys(v);
      if (!keys.length) return '<span class="jp">{}</span>';
      var kvs = keys.slice(0, 200).map(function (k) { return '<li><span class="jk">"' + esc(k) + '"</span>: ' + treeNode(v[k], depth + 1) + '</li>'; }).join('');
      var kmore = keys.length > 200 ? '<li><span class="jp">…共 ' + keys.length + ' 键</span></li>' : '';
      return '<details' + (depth === 0 ? ' open' : '') + '><summary><span class="jp">{</span> ' + keys.length + ' 键 <span class="jp">}</span></summary><ul>' + kvs + kmore + '</ul></details>';
    }
    if (typeof v === 'string') return '<span class="js">"' + esc(v) + '"</span>';
    return '<span class="jn">' + esc(String(v)) + '</span>';
  }

  render();
}
