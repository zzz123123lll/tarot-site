// tools/jwt.mjs — JWT 解码（base64url + 过期提示，不验签）
export function mount(root, H) {
  root.innerHTML =
    '<h1 class="tool-h1">JWT 解码</h1>' +
    '<p class="tool-sub">解码 header/payload、检查过期。仅本地解析，不验证签名。</p>' +
    '<div class="tool-field"><label>JWT</label><textarea id="jwt" class="tool-textarea mono" placeholder="粘贴 JWT…" style="min-height:100px"></textarea></div>' +
    '<div class="tool-row" style="margin-bottom:12px"><button class="tool-btn" id="go">解码</button><button class="tool-btn tool-btn--ghost" id="cp" disabled>复制 payload</button></div>' +
    '<p class="err-box" id="err" style="display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(215,0,21,.06);color:#d70015;font-size:14px"></p>' +
    '<div id="out"></div>';

  function b64url(s) {
    var b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var bin = atob(b);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var payloadStr = '';
  root.querySelector('#go').addEventListener('click', function () {
    var err = root.querySelector('#err'), out = root.querySelector('#out');
    err.style.display = 'none'; out.innerHTML = '';
    var v = root.querySelector('#jwt').value.trim();
    if (!v) return;
    var parts = v.split('.');
    if (parts.length !== 3) { err.textContent = '不是有效的 JWT（应为三段，用 . 分隔）。'; err.style.display = 'block'; return; }
    try {
      var header = JSON.parse(b64url(parts[0]));
      var payload = JSON.parse(b64url(parts[1]));
      payloadStr = JSON.stringify(payload, null, 2);
      var html = '';
      html += '<div class="tool-output mono" style="max-height:220px;overflow:auto"><strong>Header</strong>' + esc(JSON.stringify(header, null, 2)).replace(/\\n/g, '<br>') + '</div>';
      html += '<div class="tool-output mono" style="max-height:300px;overflow:auto;margin-top:10px"><strong>Payload</strong>' + esc(payloadStr).replace(/\\n/g, '<br>') + '</div>';
      if (header.alg) html += '<p class="tool-sub" style="margin-top:10px">算法 alg：' + esc(header.alg) + (header.kid ? ' ｜ kid：' + esc(header.kid) : '') + '</p>';
      if (payload.exp) {
        var now = Math.floor(Date.now() / 1000);
        var left = payload.exp - now;
        if (left < 0) html += '<p class="tool-sub" style="margin-top:4px;color:#d70015">已过期 ' + Math.abs(left) + ' 秒</p>';
        else html += '<p class="tool-sub" style="margin-top:4px;color:var(--c-ok)">剩余 ' + left + ' 秒（' + new Date(payload.exp * 1000).toString() + ' 过期）</p>';
      }
      html += '<p class="tool-sub" style="margin-top:10px">本页只做本地解码，不验证签名，也不上传任何数据。</p>';
      out.innerHTML = html;
      root.querySelector('#cp').disabled = false;
    } catch (e) {
      err.textContent = '解码失败：' + e.message; err.style.display = 'block';
      root.querySelector('#cp').disabled = true;
    }
  });
  root.querySelector('#cp').addEventListener('click', function () { if (payloadStr) H.copyText(payloadStr, this); });
}
