// tools/base64.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">Base64 编解码</h1><p class="tool-sub">文本与 Base64 互转，支持中文。</p>'
    + '<div class="tool-field"><label>输入</label><textarea id="in" class="tool-textarea" placeholder="输入文本或 Base64…"></textarea></div>'
    + '<div class="tool-row"><button class="tool-btn" id="enc">编码(→Base64)</button><button class="tool-btn" id="dec">解码(→文本)</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>'
    + '<div class="tool-output" id="out"></div>';
  var tin = root.querySelector('#in'), tout = root.querySelector('#out');
  function enc(){ var s = unescape(encodeURIComponent(tin.value)); tout.textContent = btoa(s); }
  function dec(){ try { var s = decodeURIComponent(escape(atob(tin.value.trim()))); tout.textContent = s; } catch(e){ tout.textContent = '解码失败：' + e.message; } }
  root.querySelector('#enc').addEventListener('click', enc);
  root.querySelector('#dec').addEventListener('click', dec);
  root.querySelector('#clr').addEventListener('click', function(){ tin.value=''; tout.textContent=''; });
}