// tools/text-clean.mjs — 文本整理与对比:清理从 PDF/网页复制来的文本 + 两份文本字符级比对
// 证据(中文社区一手原话):
//  - "能一键去除从 PDF/网页复制文本时多余的换行,可选「全部合并成一行」或「保留空行分段、只合并段内换行」两种模式,
//     并能在合并处按需补空格。这个在整理复制来的资料时非常常用"
//  - "文件比对的工具有吗…不是 word 或者 pdf,做到字符级的比对"
// 全部纯字符串处理:零依赖、零上传、离线可用。
export function mount(root, H) {
  H.injectCss(".tc-tabs{display:inline-flex;background:#f5f5f7;border-radius:12px;padding:4px;margin-bottom:16px}"
    + ".tc-tabs button{min-height:44px;padding:0 18px;border:none;border-radius:9px;background:transparent;font-size:15px;color:#6e6e73;cursor:pointer}"
    + ".tc-tabs button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 2px rgba(0,0,0,.06)}"
    + ".tc-pane{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}"
    + ".tc-box{width:100%;min-height:190px;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:12px;font-size:15px;line-height:1.7;font-family:inherit;background:#fff;resize:vertical}"
    + ".tc-opts{display:flex;flex-wrap:wrap;gap:12px 18px;margin:10px 0 14px}"
    + ".tc-opts label{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:14px;color:#1d1d1f;cursor:pointer}"
    + ".tc-opts input[type=checkbox]{width:20px;height:20px}"
    + ".tc-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0}"
    + ".tc-diff{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid var(--c-hairline);border-radius:12px;padding:14px;font-size:15px;line-height:1.8;max-height:460px;overflow:auto}"
    + ".tc-diff ins{background:rgba(0,128,9,.14);color:#0a5c0f;text-decoration:none;border-radius:3px}"
    + ".tc-diff del{background:rgba(227,0,0,.12);color:#9b1c1c;border-radius:3px}"
    + ".tc-stat{font-size:14px;color:#6e6e73;margin-top:10px}");

  root.innerHTML =
    '<h1 class="tool-h1">文本整理与对比</h1>' +
    '<p class="tool-sub">两件常被卡住的小事:<b>整理</b>(把从 PDF / 网页复制出来的多余换行、空格、全角字符收拾干净)与<b>对比</b>(两份文本逐字符比出改了哪里)。纯文本处理,不上传、不联网。</p>' +
    '<div class="tc-tabs" id="tabs"><button data-t="clean" class="active">整理文本</button><button data-t="diff">对比两份文本</button></div>' +

    '<div id="paneClean" class="tc-pane">' +
      '<div><label for="src" style="font-size:14px;color:#6e6e73">把内容粘进来(或拖一个 .txt 文件)</label>' +
      '<textarea class="tc-box" id="src" spellcheck="false" placeholder="粘贴从 PDF / 网页 / 微信里复制出来的文本…"></textarea></div>' +
      '<div class="tc-opts">' +
        '<label><input type="radio" name="mode" value="oneline" checked> 全部合并成一行</label>' +
        '<label><input type="radio" name="mode" value="para"> 保留空行分段(只合并段内换行)</label>' +
        '<label><input type="checkbox" id="oTrim" checked> 去掉每行首尾空白</label>' +
        '<label><input type="checkbox" id="oSpace" checked> 合并处按需补空格(英文/数字之间)</label>' +
        '<label><input type="checkbox" id="oFull"> 全角数字/字母/标点转半角</label>' +
        '<label><input type="checkbox" id="oBlank" checked> 去掉多余空行</label>' +
        '<label><input type="checkbox" id="oCJKSpace"> 中英文之间补一个空格(排版偏好)</label>' +
      '</div>' +
      '<div class="tc-row"><button class="tool-btn" id="run">整理</button><button class="tool-btn tool-btn--ghost" id="copy">复制结果</button><button class="tool-btn tool-btn--ghost" id="save">下载 .txt</button><span class="tc-stat" id="stat1"></span></div>' +
      '<div><label for="dst" style="font-size:14px;color:#6e6e73">结果(可以直接改)</label><textarea class="tc-box" id="dst" spellcheck="false"></textarea></div>' +
    '</div>' +

    '<div id="paneDiff" class="tc-pane" style="display:none">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" id="diffCols">' +
        '<div><label for="a" style="font-size:14px;color:#6e6e73">原版(旧)</label><textarea class="tc-box" id="a" spellcheck="false"></textarea></div>' +
        '<div><label for="b" style="font-size:14px;color:#6e6e73">新版(新)</label><textarea class="tc-box" id="b" spellcheck="false"></textarea></div>' +
      '</div>' +
      '<div class="tc-row"><button class="tool-btn" id="cmp">开始对比</button><button class="tool-btn tool-btn--ghost" id="saveDiff">导出对比结果 .txt</button></div>' +
      '<div class="tc-diff" id="diffOut" role="status" aria-live="polite">把两份文本分别放进上面两个框,点「开始对比」。</div>' +
      '<div class="tc-stat" id="stat2"></div>' +
    '</div>';

  var tabs = root.querySelector('#tabs');
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    tabs.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#paneClean').style.display = b.dataset.t === 'clean' ? 'grid' : 'none';
    root.querySelector('#paneDiff').style.display = b.dataset.t === 'diff' ? 'grid' : 'none';
  });

  // ---------- 整理 ----------
  function toHalf(s) {
    return s.replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/\u3000/g, ' ');
  }
  function clean(text) {
    var mode = (root.querySelector('input[name=mode]:checked') || {}).value || 'oneline';
    var s = String(text || '').replace(/\r\n?/g, '\n');
    if (root.querySelector('#oFull').checked) s = toHalf(s);
    var lines = s.split('\n');
    if (root.querySelector('#oTrim').checked) lines = lines.map(function (l) { return l.trim(); });
    var out;
    var oSpace = root.querySelector('#oSpace').checked;
    // 合并处补空格:只在"前后都是英文字母/数字"时补(中文之间不补,更不能在英文单词内部插空格)
    var wordish = function (c) { return /[A-Za-z0-9]/.test(c); };
    var joinLines = function (arr) {
      var r = '';
      arr.forEach(function (l) {
        if (!l) return;
        if (!r) { r = l; return; }
        if (oSpace && wordish(r.slice(-1)) && wordish(l.charAt(0))) r += ' ';
        r += l;
      });
      return r;
    };
    if (mode === 'oneline') {
      out = joinLines(lines.filter(function (l) { return l !== ''; }));
      out = out.replace(/ {2,}/g, ' ').trim();
    } else {
      var paras = [], cur = [];
      lines.forEach(function (l) {
        if (l === '') { if (cur.length) { paras.push(cur); cur = []; } paras.push([]); return; }
        cur.push(l);
      });
      if (cur.length) paras.push(cur);
      out = paras.map(function (p) {
        if (!p.length) return '';
        return joinLines(p).replace(/ {2,}/g, ' ').trim();
      }).join('\n');
      if (root.querySelector('#oBlank').checked) out = out.replace(/\n{3,}/g, '\n\n');
    }
    if (root.querySelector('#oCJKSpace').checked) {
      out = out.replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2').replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
    }
    if (root.querySelector('#oBlank').checked) out = out.replace(/^\n+|\n+$/g, '');
    return out;
  }
  var src = root.querySelector('#src'), dst = root.querySelector('#dst'), stat1 = root.querySelector('#stat1');
  function runClean() {
    var t0 = performance.now();
    var out = clean(src.value);
    dst.value = out;
    stat1.textContent = '原 ' + src.value.length + ' 字 → 结果 ' + out.length + ' 字 · ' + Math.round(performance.now() - t0) + ' ms';
  }
  root.querySelector('#run').addEventListener('click', runClean);
  root.querySelector('#copy').addEventListener('click', function () {
    H.copyText(dst.value).then(function () { stat1.textContent = '已复制到剪贴板。'; }, function () { stat1.textContent = '复制失败,请手动选中复制。'; });
  });
  root.querySelector('#save').addEventListener('click', function () {
    H.downloadBlob(new Blob(['\ufeff' + dst.value], { type: 'text/plain;charset=utf-8' }), '整理后的文本.txt');
  });

  // 拖一个 .txt 进来
  H.makeDropZone(root.querySelector('#src'), function (files) {
    var f = files && files[0]; if (!f) return;
    f.text().then(function (t) { src.value = t; runClean(); }, function () { H.warnBelow(root.querySelector('#src'), '这个文件读不了,换一个纯文本 .txt 试试。'); });
  }, '.txt,text/plain', { multiple: false });

  // ---------- 对比 ----------
  function diffChars(a, b) {
    // 字符级 LCS;太长时退化为按行对比,避免卡死(页面上会说明)
    var n = a.length, m = b.length;
    if (n * m > 4e6) return null;
    var dp = new Uint32Array((n + 1) * (m + 1));
    var W = m + 1;
    for (var i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      }
    }
    var ops = [], x = 0, y = 0;
    while (x < n && y < m) {
      if (a[x] === b[y]) { ops.push(['=', a[x]]); x++; y++; }
      else if (dp[(x + 1) * W + y] >= dp[x * W + y + 1]) { ops.push(['-', a[x]]); x++; }
      else { ops.push(['+', b[y]]); y++; }
    }
    while (x < n) { ops.push(['-', a[x]]); x++; }
    while (y < m) { ops.push(['+', b[y]]); y++; }
    return ops;
  }
  function esc(s) { return H.esc(s); }
  function renderOps(ops) {
    var html = '', i = 0;
    while (i < ops.length) {
      var kind = ops[i][0], buf = '';
      while (i < ops.length && ops[i][0] === kind) { buf += ops[i][1]; i++; }
      if (kind === '=') html += esc(buf);
      else if (kind === '+') html += '<ins>' + esc(buf) + '</ins>';
      else html += '<del>' + esc(buf) + '</del>';
    }
    return html;
  }
  var diffOut = root.querySelector('#diffOut'), stat2 = root.querySelector('#stat2');
  var lastDiffText = '';
  root.querySelector('#cmp').addEventListener('click', function () {
    var A = root.querySelector('#a').value, B = root.querySelector('#b').value;
    if (!A && !B) { diffOut.textContent = '两边都是空的,先放进要对比的文本。'; stat2.textContent = ''; return; }
    var t0 = performance.now();
    var ops = diffChars(A, B);
    var added = 0, removed = 0, same = 0;
    if (ops) {
      ops.forEach(function (o) { if (o[0] === '+') added++; else if (o[0] === '-') removed++; else same++; });
      diffOut.innerHTML = renderOps(ops);
      lastDiffText = ops.map(function (o) { return (o[0] === '=' ? '  ' : o[0] === '+' ? '+ ' : '- ') + o[1]; }).join('');
    } else {
      // 退化:按行比对,仍然是本地算
      var la = A.split('\n'), lb = B.split('\n');
      var setA = {}; la.forEach(function (l) { setA[l] = (setA[l] || 0) + 1; });
      var setB = {}; lb.forEach(function (l) { setB[l] = (setB[l] || 0) + 1; });
      var html = '';
      la.forEach(function (l) { if (!setB[l]) { html += '<del>' + esc(l) + '</del>\n'; removed += l.length; } else same += l.length; });
      lb.forEach(function (l) { if (!setA[l]) { html += '<ins>' + esc(l) + '</ins>\n'; added += l.length; } });
      diffOut.innerHTML = html || '两份文本没有差异。';
      lastDiffText = diffOut.innerText;
    }
    var total = Math.max(1, same + removed + added);
    stat2.textContent = '新增 ' + added + ' 字 · 删除 ' + removed + ' 字 · 相同率 ' + Math.round(same / total * 100) + '% · 用时 ' + Math.round(performance.now() - t0) + ' ms'
      + (ops ? '' : '(文本很长,已自动改用按行对比)');
  });
  root.querySelector('#saveDiff').addEventListener('click', function () {
    var txt = lastDiffText || diffOut.innerText;
    H.downloadBlob(new Blob(['\ufeff' + txt], { type: 'text/plain;charset=utf-8' }), '文本对比结果.txt');
  });

  H.makeDropZone(root.querySelector('#diffCols'), function (files) {
    if (!files || !files.length) return;
    var f = files[0];
    f.text().then(function (t) { root.querySelector('#b').value = t; }, function () { H.warnBelow(root.querySelector('#diffCols'), '这个文件读不了,试试纯文本。'); });
  }, '.txt,text/plain', { multiple: false });
}
