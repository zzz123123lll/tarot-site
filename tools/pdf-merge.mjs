// tools/pdf-merge.mjs — 多个 PDF 合并成一个
export function mount(root, H) {
  H.injectCss(".file-list{margin-top:16px}.file-row{display:flex;align-items:center;gap:8px;font-size:13px;color:#1d1d1f;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06)}.file-row .n{color:#86868b;font-size:12px;min-width:16px}.file-row .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.file-row .mv{background:none;border:none;color:#86868b;cursor:pointer;font-size:13px;padding:2px 6px;border-radius:4px}.file-row .mv:hover{color:#1d1d1f;background:#f5f5f7}.file-row .rm{background:none;border:none;color:#86868b;cursor:pointer;font-size:15px}.file-row .rm:hover{color:#d70015}.gen-bar{display:none;margin-top:18px}.note{font-size:13px;margin-top:12px;display:none}.note.ok{color:#1d9e4e}.note.err{color:#d70015}.opt-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.opt-row label{font-size:13px;color:#6e6e73;white-space:nowrap}.seg{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px}.seg button{flex:1;padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer}.seg button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.tool-drop .icon svg{width:40px;height:40px;color:#0071e3}");
  root.innerHTML =
    '<h1 class="tool-h1">PDF 合并</h1>' +
    '<p class="tool-sub">多个 PDF 按顺序合并成一个，纯本地处理。</p>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg></div><div class="title">点击选择 PDF，或拖拽到此处</div><div class="hint">可多选，按添加顺序合并</div></div>' +
    '<div class="file-list" id="list"></div>' +
    '<div class="gen-bar" id="gen"><button class="tool-btn" id="go">合并并下载</button></div>' +
    '<p class="note" id="note"></p>';

  var files = [];
  H.makeDropZone(root.querySelector('#dz'), function (fs) {
    fs.forEach(function (f) { if (f.type === 'application/pdf' || f.name.toLowerCase().indexOf('.pdf') >= 0) files.push(f); });
    render();
  }, 'application/pdf');

  root.querySelector('#go').addEventListener('click', generate);

  function render() {
    var list = root.querySelector('#list');
    var html = '';
    files.forEach(function (f, i) {
      html += '<div class="file-row"><span class="n">' + (i + 1) + '</span><span class="nm">' + H.esc(f.name) + '</span>'
        + '<button class="mv" data-i="' + i + '" data-d="-1" data-tippy-content="上移">↑</button>'
        + '<button class="mv" data-i="' + i + '" data-d="1" data-tippy-content="下移">↓</button>'
        + '<button class="rm" data-i="' + i + '" data-tippy-content="移除">×</button></div>';
    });
    list.innerHTML = html;
    list.querySelectorAll('.rm').forEach(function (b) {
      b.addEventListener('click', function () { files.splice(parseInt(b.dataset.i, 10), 1); render(); });
    });
    list.querySelectorAll('.mv').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.dataset.i, 10), d = parseInt(b.dataset.d, 10), j = i + d;
        if (j < 0 || j >= files.length) return;
        var t = files[i]; files[i] = files[j]; files[j] = t; render();
      });
    });
    root.querySelector('#gen').style.display = files.length >= 2 ? 'block' : 'none';
    H.initTips(root);
  }

  async function generate() {
    var note = root.querySelector('#note');
    note.className = 'note'; note.style.display = 'none';
    try { await H.loadScript('/vendor/pdf-lib.min.js?v=1'); } catch (e) { note.textContent = 'PDF 库加载失败。'; note.className = 'note err'; note.style.display = 'block'; return; }
    var PDFDoc = window.PDFLib.PDFDocument;
    var btn = root.querySelector('#go');
    btn.disabled = true;
    var oldText = btn.textContent;
    btn.textContent = '合并中…';
    try {
      var merged = await PDFDoc.create();
      for (var i = 0; i < files.length; i++) {
        var bytes = await files[i].arrayBuffer();
        var src = await PDFDoc.load(bytes, { ignoreEncryption: true });
        var pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(function (p) { merged.addPage(p); });
      }
      var out = await merged.save();
      H.downloadBlob(new Blob([out], { type: 'application/pdf' }), 'merged.pdf');
      note.textContent = '已合并 ' + files.length + ' 个 PDF，共 ' + merged.getPageCount() + ' 页。'; note.className = 'note ok'; note.style.display = 'block';
    } catch (e) {
      note.textContent = '合并失败：' + (e && e.message ? e.message : e); note.className = 'note err'; note.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = oldText;
  }
}
