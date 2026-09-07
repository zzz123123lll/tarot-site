// tools/regex.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">正则测试</h1><p class="tool-sub">实时匹配、高亮。</p>'
    + '<div class="tool-field"><label>正则表达式</label><input type="text" class="tool-input" id="pat" placeholder="/表达式/标志 或直接写表达式"></div>'
    + '<div class="tool-field"><label>测试文本</label><textarea id="txt" class="tool-textarea" placeholder="输入测试文本…"></textarea></div>'
    + '<p class="tool-output mono" id="out" style="min-height:24px">等待输入…</p>';
  var pat = root.querySelector('#pat'), txt = root.querySelector('#txt'), out = root.querySelector('#out');
  function run(){
    var p = pat.value.trim(); if (!p) { out.textContent = '等待输入…'; return; }
    var flags = '';
    var m = p.match(/^\/([\s\S]+)\/([gimsuy]*)$/);
    if (m) { p = m[1]; flags = m[2]; }
    try {
      var re = new RegExp(p, flags);
      var matches = txt.value.match(re);
      if (!matches) { out.textContent = '无匹配'; return; }
      out.innerHTML = '匹配 ' + matches.length + ' 处' + (flags.indexOf('g') >= 0 ? '（全局）' : '（首个）');
    } catch(e) { out.textContent = '正则无效：' + e.message; }
  }
  pat.addEventListener('input', run); txt.addEventListener('input', run);
}