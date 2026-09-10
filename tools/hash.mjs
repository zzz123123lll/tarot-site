// tools/hash.mjs — Hash 摘要（SHA WebCrypto + MD5，文本/文件）
export function mount(root, H) {
  root.innerHTML =
    '<h1 class="tool-h1">Hash 摘要</h1>' +
    '<p class="tool-sub">SHA-1/256/512 与 MD5，支持文件和文本。全部本地。</p>' +
    '<div class="tool-row" style="margin-bottom:16px"><span id="algo" style="display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px"><button data-a="SHA-256" class="active">SHA-256</button><button data-a="SHA-1">SHA-1</button><button data-a="SHA-512">SHA-512</button><button data-a="MD5">MD5</button></span></div>' +
    '<div class="tool-field"><label>文本</label><textarea id="txt" class="tool-textarea mono" placeholder="输入要哈希的文本…"></textarea></div>' +
    '<div class="tool-row" style="margin-bottom:12px"><button class="tool-btn" id="go">计算</button><button class="tool-btn tool-btn--ghost" id="cp" disabled>复制</button></div>' +
    '<div class="tool-output mono" id="out" style="min-height:30px;word-break:break-all"></div>' +
    '<div class="tool-drop" id="dz" style="margin-top:20px"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/></svg></div><div class="title">或拖入文件计算哈希（不大于 500MB）</div></div>' +
    '<p class="err-box" id="err" style="display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(215,0,21,.06);color:#d70015;font-size:13px"></p>';

  var algo = 'SHA-256', out = root.querySelector('#out'), err = root.querySelector('#err');
  root.querySelector('#algo').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    algo = b.dataset.a;
    root.querySelectorAll('#algo button').forEach(function (x) { x.classList.toggle('active', x === b); });
  });
  function toHex(buf) { var bytes = new Uint8Array(buf), s = ''; for (var i = 0; i < bytes.length; i++) s += ('0' + bytes[i].toString(16)).slice(-2); return s; }
  async function compute(bytes) {
    err.style.display = 'none';
    if (algo === 'MD5') {
      try { await H.loadScript('/vendor/spark-md5.min.js?v=1'); } catch (e) { err.textContent = 'MD5 库加载失败，请检查网络后重试。'; err.style.display = 'block'; return; }
      // 必须按原始字节计算:内建 md5 库对二进制输入会给出错误结果(已实测),此处用 spark-md5
      var ab = (bytes && bytes.byteOffset !== undefined)
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : bytes;
      out.textContent = window.SparkMD5.ArrayBuffer.hash(ab);
      return;
    }
    if (!window.crypto || !crypto.subtle) { err.textContent = '当前环境不支持 WebCrypto（需要 HTTPS 或 localhost）。'; err.style.display = 'block'; return; }
    var buf = await crypto.subtle.digest(algo, bytes);
    out.textContent = toHex(buf);
  }
  root.querySelector('#go').addEventListener('click', function () {
    var v = root.querySelector('#txt').value;
    if (!v) { out.textContent = ''; return; }
    compute(new TextEncoder().encode(v)).then(function () { root.querySelector('#cp').disabled = false; })
      .catch(function (e) { err.textContent = '计算失败：' + (e && e.message ? e.message : e); err.style.display = 'block'; });
  });
  root.querySelector('#cp').addEventListener('click', function () { if (out.textContent) H.copyText(out.textContent, this); });
  H.makeDropZone(root.querySelector('#dz'), async function (fs) {
    var f = fs[0];
    if (f.size > 500 * 1024 * 1024) { err.textContent = '文件超过 500MB，请改用更小的文件，或先用「PDF 压缩 / 图片压缩」把它变小。'; err.style.display = 'block'; return; }
    var bytes = await f.arrayBuffer();
    compute(bytes).then(function () { root.querySelector('#cp').disabled = false; })
      .catch(function (e) { err.textContent = '计算失败：' + (e && e.message ? e.message : e); err.style.display = 'block'; });
  });
}
