// tools/base64.mjs — Base64（文本 UTF-8 安全 / 文件 / base64url）
export function mount(root, H) {
  H.injectCss(".err-box{display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(227,0,0,.06);color:var(--c-err);font-size:14px}");

  root.innerHTML =
    '<h1 class="tool-h1">Base64 编解码</h1>' +
    '<p class="tool-sub">文本、文件、base64url。全部本地。</p>' +
    '<span class="mode-tabs" id="mt"><button data-m="text" class="active">文本</button><button data-m="file">文件</button></span>' +
    '<div id="textPane">' +
      '<div class="tool-field"><label>输入</label><textarea id="in" class="tool-textarea" placeholder="输入文本或 Base64…"></textarea></div>' +
      '<div class="tool-row" style="margin-bottom:12px">' +
        '<button class="tool-btn" id="enc">编码 →</button><button class="tool-btn" id="dec">← 解码</button>' +
        '<label style="font-size:14px;color:#6e6e73;margin-left:8px"><input type="checkbox" id="url" style="margin-right:4px">base64url</label>' +
        '<button class="tool-btn tool-btn--ghost" id="cp">复制</button>' +
      '</div>' +
      '<p class="err-box" id="terr"></p>' +
      '<div class="tool-output mono" id="out" style="white-space:pre-wrap"></div>' +
    '</div>' +
    '<div id="filePane" style="display:none">' +
      '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/></svg></div><div class="title">点击选择文件，转成 Base64</div><div class="hint">最大 100MB，文本样式输出</div></div>' +
      '<div class="tool-field" style="margin-top:16px"><label>或粘贴 Base64，转回文件下载</label><textarea id="fin" class="tool-textarea" placeholder="粘贴 Base64…" style="min-height:90px"></textarea></div>' +
      '<div class="tool-row" style="margin-top:12px"><button class="tool-btn" id="fb2file">转回文件并下载</button><button class="tool-btn tool-btn--ghost" id="fcp">复制 Base64</button></div>' +
      '<p class="err-box" id="ferr"></p>' +
      '<div class="tool-output mono" id="fout" style="white-space:pre-wrap;word-break:break-all;display:none;max-height:200px;overflow:auto"></div>' +
    '</div>';

  var out = root.querySelector('#out'), terr = root.querySelector('#terr');

  function b64encode(s) {
    var bytes = new TextEncoder().encode(s);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64decode(b) {
    var bin = atob(b);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function toUrl(b) { return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function fromUrl(b) { var s = b.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return s; }
  function showErr(el, msg) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  function stripDataUrl(b) { return b.replace(/^data:[^;]+;base64,/, ''); }

  var isUrl = function () { return root.querySelector('#url').checked; };
  root.querySelector('#enc').addEventListener('click', function () {
    try { var b = b64encode(root.querySelector('#in').value); out.textContent = isUrl() ? toUrl(b) : b; showErr(terr, ''); } catch (e) { showErr(terr, '编码失败：' + e.message); }
  });
  root.querySelector('#dec').addEventListener('click', function () {
    try {
      var raw = stripDataUrl(root.querySelector('#in').value.trim());
      var b = isUrl() ? fromUrl(raw) : raw;
      out.textContent = b64decode(b);
      showErr(terr, '');
    } catch (e) { showErr(terr, '解码失败：输入不是有效的 Base64。'); }
  });
  root.querySelector('#cp').addEventListener('click', function () { if (out.textContent) H.copyText(out.textContent, this); });

  root.querySelector('#mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var m = b.dataset.m;
    root.querySelectorAll('#mt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#textPane').style.display = m === 'text' ? 'block' : 'none';
    root.querySelector('#filePane').style.display = m === 'file' ? 'block' : 'none';
  });

  var ferr = root.querySelector('#ferr'), fout = root.querySelector('#fout');
  var fileB64 = '';
  H.makeDropZone(root.querySelector('#dz'), function (fs) {
    var f = fs[0];
    if (f.size > 100 * 1024 * 1024) { showErr(ferr, '文件超过 100MB，请用更小的文件。'); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      fileB64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      fout.textContent = fileB64.slice(0, 500) + (fileB64.length > 500 ? '…（共 ' + fileB64.length + ' 字符）' : '');
      fout.style.display = 'block';
      showErr(ferr, '');
    };
    reader.onerror = function () { showErr(ferr, '读取失败。'); };
    reader.readAsDataURL(f);
  });
  root.querySelector('#fcp').addEventListener('click', function () { if (fileB64) H.copyText(fileB64, this); });
  root.querySelector('#fb2file').addEventListener('click', function () {
    var raw = stripDataUrl(root.querySelector('#fin').value.trim()) || fileB64;
    if (!raw) { showErr(ferr, '请先粘贴 Base64 或选择文件。'); return; }
    try {
      var bin = atob(raw);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      H.downloadBlob(new Blob([bytes]), 'decoded.bin');
      showErr(ferr, '');
    } catch (e) { showErr(ferr, '解码失败：不是有效的 Base64。'); }
  });
}
