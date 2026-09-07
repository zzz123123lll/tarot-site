// tools/uuid.mjs — UUID / 密码（批量 + 复制）
export function mount(root, H) {
  H.injectCss('');

  root.innerHTML =
    '<h1 class="tool-h1">UUID / 密码</h1>' +
    '<p class="tool-sub">生成 UUID 和随机密码。全部本地。</p>' +
    '<div class="tool-row" style="margin-bottom:12px"><button class="tool-btn" id="u1">生成 1 个</button><button class="tool-btn" id="u10">生成 10 个</button><button class="tool-btn" id="u100">生成 100 个</button><button class="tool-btn tool-btn--ghost" id="ucp">复制</button></div>' +
    '<div class="tool-output mono" id="ulist" style="min-height:28px"></div>' +
    '<div class="tool-field" style="margin-top:20px"><label>密码长度</label><input type="number" class="tool-input" id="len" value="16" min="4" max="128" style="width:100px"></div>' +
    '<div class="tool-row" style="margin-bottom:12px"><button class="tool-btn" id="pw">生成密码</button><button class="tool-btn tool-btn--ghost" id="pcp">复制</button></div>' +
    '<div class="tool-output mono" id="pout" style="min-height:28px"></div>';

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
  }
  function gen(n) { var a = []; for (var i = 0; i < n; i++) a.push(uuid()); return a.join('\n'); }
  function genPw(n) {
    var ch = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?';
    var a = new Uint32Array(n); crypto.getRandomValues(a);
    var s = ''; for (var i = 0; i < n; i++) s += ch[a[i] % ch.length];
    return s;
  }
  var ulist = root.querySelector('#ulist'), pout = root.querySelector('#pout');
  root.querySelector('#u1').addEventListener('click', function () { ulist.textContent = gen(1); });
  root.querySelector('#u10').addEventListener('click', function () { ulist.textContent = gen(10); });
  root.querySelector('#u100').addEventListener('click', function () { ulist.textContent = gen(100); });
  root.querySelector('#ucp').addEventListener('click', function () { if (ulist.textContent) H.copyText(ulist.textContent, this); });
  root.querySelector('#pw').addEventListener('click', function () { pout.textContent = genPw(parseInt(root.querySelector('#len').value, 10) || 16); });
  root.querySelector('#pcp').addEventListener('click', function () { if (pout.textContent) H.copyText(pout.textContent, this); });
}
