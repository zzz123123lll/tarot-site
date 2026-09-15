// tools/invoice-check.mjs — 发票查重 + 报销清单(本地读文本型 PDF,不上传、不做 OCR)
export function mount(root, H) {
  H.injectCss('.inv-src{font-size:13px;color:#6e6e73;line-height:1.5;margin-top:2px}' + ".inv-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}"
    + ".inv-row label{font-size:14px;color:#6e6e73;white-space:nowrap}"
    + ".inv-warn{font-size:14px;color:#a1500a;background:rgba(191,72,0,.08);border:1px solid rgba(191,72,0,.18);border-radius:12px;padding:12px 14px;margin-bottom:14px;line-height:1.5}"
    + ".inv-tbl{width:100%;border-collapse:collapse;margin-top:14px;font-size:14px}"
    + ".inv-tbl th,.inv-tbl td{border-bottom:1px solid var(--c-hairline);padding:9px 8px;text-align:left;vertical-align:top}"
    + ".inv-tbl th{color:#6e6e73;font-weight:500;white-space:nowrap}"
    + ".inv-tbl td.num{white-space:nowrap;font-variant-numeric:tabular-nums}"
    + ".inv-dup{color:var(--c-err);font-weight:600}"
    + ".inv-sus{color:var(--c-warn);font-weight:600}"
    + ".inv-ok{color:var(--c-ok)}"
    + ".inv-none{color:#6e6e73}"
    + ".inv-sum{margin-top:14px;background:var(--t-surface);border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.7}"
    + ".inv-peek{margin-top:6px;font-size:13px;color:#6e6e73}.inv-peek summary{cursor:pointer}.inv-peek div{margin-top:6px;white-space:pre-wrap;word-break:break-all;max-height:130px;overflow:auto;background:#f5f5f7;border-radius:8px;padding:8px}");

  root.innerHTML =
    '<h1 class="tool-h1">发票查重</h1>' +
    '<p class="tool-sub">把要报销的电子发票 PDF 一起拖进来,本地读出发票号码、日期与金额,标出重复提交的那几张,再导出一份能直接交的报销清单。全程不上传,也不做 OCR(照片/扫描件读不出文字)。</p>' +
    '<div class="inv-warn">先说清边界:这里只认<b>文本型电子发票 PDF</b>(从税务系统下载的那种,文字可选中)。拍照、截图、扫描件没有文字层,我们<b>不做 OCR</b>,会直接告诉你哪几张读不出来,不会猜。</div>' +
    '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg></div><div class="title">点击选择发票 PDF,或拖拽到此处</div><div class="hint">可多选;只处理文本型电子发票 PDF</div></div>' +
    '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>' +
    '<p class="progress-note" id="pgt" role="status" aria-live="polite" style="display:none"></p>' +
    '<p class="note" id="note"></p>' +
    '<div id="out"></div>';

  var pdfjsLib = null;
  var rows = [];
  var note = root.querySelector('#note');
  function say(t, kind) { note.textContent = t; note.className = 'note' + (kind ? ' ' + kind : ''); note.style.display = 'block'; }

  function money(s) {
    if (!s) return null;
    var v = parseFloat(String(s).replace(/[,¥￥\s\u00a0]/g, ''));
    return isNaN(v) ? null : v;
  }
  function fmtMoney(v) { return v === null || v === undefined ? '' : '¥' + v.toFixed(2); }
  // 内容指纹:重复报销最常见的形态就是"同一个文件交了两次"。这条与能不能读出版式无关。
  async function sha256(bytes) {
    try {
      if (!(window.crypto && window.crypto.subtle)) return '';
      var d = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) { return ''; }
  }
  function esc(s) { return H.esc(s == null ? '' : s); }

  // 不同版式差异很大,先把文本"拍平"成统一形态再匹配:
  // 全角数字/全角括号冒号 → 半角;不换行空格 → 普通空格。
  function normText(t) {
    return String(t || '')
      .replace(/[\u00a0\u3000]/g, ' ')
      .replace(/[\uff10-\uff19]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/\uff1a/g, ':').replace(/\uff08/g, '(').replace(/\uff09/g, ')')
      .replace(/[\uffe5]/g, '¥');
  }
  // pdf.js 取文字时经常在每个字符之间插空格("2 4 3 1 ..."),所以数字必须允许中间有空格,
  // 取出来再拼回去;同时把 OCR 常见的 O/o 当 0。
  function digits(s) {
    return String(s || '').replace(/[\s\u00a0]/g, '').replace(/[Oo]/g, '0').replace(/[^0-9]/g, '');
  }
  function pickNum(seg, min, max) {
    var d = digits(seg);
    if (d.length < min) return '';
    if (d.length > max) {
      // 抓太长通常是"号码后面又跟了日期"之类的粘连:数电票固定 20 位,先按 20 位截断
      d = d.length > max && max >= 20 ? d.slice(0, 20) : d.slice(0, max);
    }
    return d;
  }

  // 从一页文字里抠字段。数电票是 20 位发票号码;老票是 12 位发票代码 + 8 位号码。
  function parseInvoice(rawText) {
    var t = normText(rawText);
    var out = { number: '', code: '', date: '', total: null, seller: '', raw: t.length, text: t.slice(0, 400), totalFrom: '', numberCount: 0 };
    // 一个 PDF 里塞两张发票很常见(尤其是合并打印的)。以前只读第一个号码,第二张就被**静默吞掉**——
    // 报销时少报一张是要出事的,所以这里数一下出现了几次,读到一个以上就在表里点名。
    out.numberCount = (t.match(/(发\s*票\s*号\s*码|invoice\s*(?:no|number|#))/gi) || []).length;
    var m;
    // 允许数字之间有空格(最多 40 个字符宽),再拼回连续数字
    if ((m = t.match(/发\s*票\s*号\s*码\s*[:：]?\s*([0-9O][0-9O\s]{6,44})/))) out.number = pickNum(m[1], 8, 25);
    if (!out.number && (m = t.match(/(?:invoice\s*(?:no|number|#)|no\.)\s*[:：#]?\s*([0-9][0-9\s]{6,44})/i))) out.number = pickNum(m[1], 8, 25);
    if (!out.number && (m = t.match(/\b(\d{20})\b/))) out.number = m[1];
    if ((m = t.match(/发\s*票\s*代\s*码\s*[:：]?\s*([0-9][0-9\s]{9,22})/))) out.code = pickNum(m[1], 10, 12);
    if (!out.code && (m = t.match(/(?:invoice\s*code)\s*[:：]?\s*([0-9][0-9\s]{9,22})/i))) out.code = pickNum(m[1], 10, 12);
    if ((m = t.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/))) {
      out.date = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    } else if ((m = t.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/))) {
      out.date = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    }
    // 金额的"来源"要记下来:从「价税合计」读到的是可信的,用宽泛兜底读到的可能是税额、单价或合计里的某一个数。
    // 报销金额错了是大事,所以弱来源的在表格里要标出来,让人自己去核对。
    if ((m = t.match(/价\s*税\s*合\s*计[^0-9¥￥]{0,24}[¥￥]?\s*([0-9][0-9,\s]*\.[0-9]{2})/))) { out.total = money(m[1]); out.totalFrom = '价税合计'; }
    if (out.total === null && (m = t.match(/\(?\s*小\s*写\s*\)?[^0-9¥￥]{0,12}[¥￥]?\s*([0-9][0-9,\s]*\.[0-9]{2})/))) { out.total = money(m[1]); out.totalFrom = '小写金额'; }
    // 英文/通用兜底:价税合计 / total / amount,以及单独的 ¥￥ 金额
    if (out.total === null && (m = t.match(/(?:total|amount|jia\s*shui\s*he\s*ji)[^0-9]{0,24}([0-9][0-9,\s]*\.[0-9]{2})/i))) { out.total = money(m[1]); out.totalFrom = 'total / amount'; }
    if (out.total === null && (m = t.match(/(?:CNY|RMB)\s*([0-9][0-9,\s]*\.[0-9]{2})/i))) { out.total = money(m[1]); out.totalFrom = 'CNY / RMB'; }
    if (out.total === null && (m = t.match(/[¥￥]\s*([0-9][0-9,\s]*\.[0-9]{2})/))) { out.total = money(m[1]); out.totalFrom = '¥ 后面的第一个数'; }
    if ((m = t.match(/销\s*售\s*方[^名]{0,6}名\s*称\s*[:：]?\s*([^\s]{2,40})/))) out.seller = m[1];
    // 英文兜底要"非贪婪 + 遇到下一个标签就停",否则会把下一行的 Total 也吞进销售方
    if (!out.seller && (m = t.match(/(?:seller|xiaoshoufang)[^:：A-Za-z0-9]{0,12}[:：]?\s*([A-Za-z0-9 \-]{2,40}?)(?=\s+(?:Total|Amount|Date|Invoice|No)\b|$)/i))) out.seller = m[1].trim();
    return out;
  }

  async function ensureDoc() {
    if (!pdfjsLib) {
      pdfjsLib = await H.dynLib('/vendor/pdfjs/pdf.min.mjs?v=1', 'PDF 读取程序');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=1';
    }
    return pdfjsLib;
  }

  function render() {
    var out = root.querySelector('#out');
    if (!rows.length) { out.innerHTML = ''; return; }
    var html = '<table class="inv-tbl"><thead><tr><th>#</th><th>文件名</th><th>发票号码</th><th>开票日期</th><th>价税合计</th><th>状态</th></tr></thead><tbody>';
    rows.forEach(function (r, i) {
      var st = r.status === 'duphash' ? '<span class="inv-dup">重复:文件内容完全相同</span>'
        : r.status === 'dup' ? '<span class="inv-dup">重复:发票号码相同</span>'
        : r.status === 'suspect' ? '<span class="inv-sus">疑似重复(需人工确认)</span>'
        : r.status === 'image' ? '<span class="inv-none">图片发票:已按文件内容查重(不做 OCR)</span>'
        : r.status === 'notext' ? '<span class="inv-none">读不出文字(扫描件)</span>'
        : r.status === 'error' ? '<span class="inv-dup">打不开:' + esc(r.why || '') + '</span>'
        : '<span class="inv-ok">唯一</span>';
      // 版式千差万别:把"我们到底读到了什么"摊开给用户,读不到时也能自己判断要不要人工核对
      var peek = r.text ? '<details class="inv-peek"><summary>看我们读到的文字</summary><div>' + esc(r.text) + '</div></details>' : '';
      // 金额来源是弱兜底时标出来;一个 PDF 里读到多个发票号码时点名 —— 这两条都是"别让用户拿到一个看起来很整齐、
      // 其实少了一张或金额取错的结果"。
      var weak = r.total !== null && ['CNY / RMB', '¥ 后面的第一个数'].indexOf(r.totalFrom) >= 0;
      var amountNote = (r.total !== null && r.totalFrom ? '<div class="inv-src">金额来源:' + esc(r.totalFrom) + (weak ? ' —— 弱匹配,请核对这一项' : '') + '</div>' : '')
        + (r.numberCount > 1 ? '<div class="inv-sus">这一份里读到 ' + r.numberCount + ' 个发票号码(一个文件可能含多张发票);查重与金额只取了第一张,请拆开再传一次</div>' : '');
      html += '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(r.file) + '</td>'
        + '<td class="num">' + (r.number ? esc(r.number) : '<span class="inv-none">—</span>') + '</td>'
        + '<td class="num">' + (r.date || '<span class="inv-none">—</span>') + '</td>'
        + '<td class="num">' + (r.total === null ? '<span class="inv-none">—</span>' : fmtMoney(r.total)) + '</td>'
        + '<td>' + st + amountNote + peek + '</td></tr>';
    });
    html += '</tbody></table>';

    var uniq = rows.filter(function (r) { return r.status === 'uniq' || r.status === 'suspect'; });
    var dupHash = rows.filter(function (r) { return r.status === 'duphash'; });
    var dup = rows.filter(function (r) { return r.status === 'dup' || r.status === 'duphash'; });
    var imgRows = rows.filter(function (r) { return r.status === 'image'; });
    var notext = rows.filter(function (r) { return r.status === 'notext'; });
    var errs = rows.filter(function (r) { return r.status === 'error'; });
    var withMoney = rows.filter(function (r) { return r.total !== null; });
    var sumAll = withMoney.reduce(function (a, r) { return a + r.total; }, 0);
    var sumUniq = uniq.reduce(function (a, r) { return a + (r.total || 0); }, 0);
    var sumDup = dup.reduce(function (a, r) { return a + (r.total || 0); }, 0);
    var noNumber = rows.filter(function (r) { return r.status !== 'error' && !r.number; }).length;
    html += '<div class="inv-sum"><b>共 ' + rows.length + ' 张</b>'
      + ' · 读到金额的 ' + withMoney.length + ' 张,合计 <b>' + fmtMoney(sumAll) + '</b>'
      + (dup.length ? ' · <span class="inv-dup">重复 ' + dup.length + ' 张(' + fmtMoney(sumDup) + ')</span>' : ' · 没有发现重复')
      + ' · 去重后合计 <b>' + fmtMoney(sumUniq) + '</b>'
      + (imgRows.length ? '<br>其中 ' + imgRows.length + ' 张是图片发票:不做 OCR,只按文件内容查重(同一个文件交两次能查出来)' : '')
      + (dupHash.length ? '<br>有 ' + dupHash.length + ' 张与前面的文件<b>内容完全相同</b>(同一个文件交了两次)' : '')
      + (notext.length ? '<br>其中 ' + notext.length + ' 张读不出文字(扫描件,本工具不做 OCR)' : '')
      + (noNumber && !notext.length ? '<br>有 ' + noNumber + ' 张没读到发票号码:可能是版式不同,建议人工核对' : '')
      + (errs.length ? '<br>有 ' + errs.length + ' 张打不开' : '')
      + '</div>';
    html += '<div class="tool-row" style="margin-top:14px"><button class="tool-btn" id="csv">导出报销清单 (CSV)</button>'
      + (dup.length ? '<button class="tool-btn tool-btn--ghost" id="csvdup">只导出重复的</button>' : '')
      + '<button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>';
    out.innerHTML = html;

    function csvFor(list) {
      var head = ['序号', '文件名', '发票代码', '发票号码', '开票日期', '价税合计', '销售方', '状态'];
      var lines = [head.join(',')];
      list.forEach(function (r, i) {
        var st = r.status === 'duphash' ? '重复(文件内容相同)' : r.status === 'dup' ? '重复(号码相同)' : r.status === 'suspect' ? '疑似重复' : r.status === 'image' ? '图片发票(仅按内容查重)' : r.status === 'notext' ? '读不出文字' : r.status === 'error' ? '打不开' : '唯一';
        var cells = [i + 1, r.file, r.code || '', r.number || '', r.date || '', r.total === null ? '' : r.total.toFixed(2), r.seller || '', st];
        lines.push(cells.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','));
      });
      lines.push(['', '', '', '', '合计(全部)', sumAll.toFixed(2), '', ''].map(function (c) { return '"' + c + '"'; }).join(','));
      if (dup.length) lines.push(['', '', '', '', '重复部分', sumDup.toFixed(2), '', ''].map(function (c) { return '"' + c + '"'; }).join(','));
      // 加 BOM,Excel 打开中文不乱码
      return '\ufeff' + lines.join('\r\n') + '\r\n';
    }
    var c1 = root.querySelector('#csv');
    if (c1) c1.addEventListener('click', function () {
      H.downloadBlob(new Blob([csvFor(rows)], { type: 'text/csv;charset=utf-8' }), '发票报销清单.csv');
    });
    var c2 = root.querySelector('#csvdup');
    if (c2) c2.addEventListener('click', function () {
      H.downloadBlob(new Blob([csvFor(dup)], { type: 'text/csv;charset=utf-8' }), '发票重复清单.csv');
    });
    var c3 = root.querySelector('#clr');
    if (c3) c3.addEventListener('click', function () {
      var snap = rows.slice();
      rows = []; render(); say('已清空。');
      if (snap.length) H.toast('已清空 ' + snap.length + ' 张', { action: '撤销', onAction: function () { rows = snap; render(); say('已恢复 ' + snap.length + ' 张。'); } });
    });
  }

  async function analyze(files) {
    // PDF 走文字解析;图片(照片/截图)不做 OCR,但可以按**文件内容**查重 —— 重复报销最常见的情况就是同一个文件交了两次
    var pdfs = files.filter(function (f) {
      return f.type === 'application/pdf' || /\.pdf$/i.test(f.name) || /^image\//.test(f.type) || /\.(jpe?g|png|webp|bmp)$/i.test(f.name);
    });
    if (!pdfs.length) { say('请拖入 PDF 电子发票,或照片/截图(图片只做按内容查重,不做 OCR)。', 'err'); return; }
    rows = [];
    var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), pgt = root.querySelector('#pgt');
    pg.style.display = 'block'; fill.style.width = '0%'; pgt.style.display = 'block';
    fill.style.width = '10%';
    say('正在读取 ' + pdfs.length + ' 个 PDF(本地解析,不上传)…');
    try {
      var lib = await ensureDoc();
      for (var i = 0; i < pdfs.length; i++) {
        var f = pdfs[i];
        pgt.textContent = '正在读第 ' + (i + 1) + ' / ' + pdfs.length + ' 个:' + f.name;
        fill.style.width = (10 + (i / pdfs.length) * 85) + '%';
        var row = { file: f.name, number: '', code: '', date: '', total: null, seller: '', status: 'uniq', why: '', sha: '', text: '', isImage: false };
        try {
          var bytes = new Uint8Array(await f.arrayBuffer());
          row.sha = await sha256(bytes);   // 内容指纹:与版式、有没有文字层都无关
          row.isImage = /^image\//.test(f.type) || /\.(jpe?g|png|webp|bmp)$/i.test(f.name);
          if (row.isImage) {
            row.status = 'image';   // 图片发票:不做 OCR,只按内容查重
          } else {
            var doc = await lib.getDocument({ data: bytes.slice(), cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/' }).promise;
            var text = '';
            for (var p = 1; p <= doc.numPages; p++) {
              var page = await doc.getPage(p);
              var tc = await page.getTextContent();
              text += ' ' + tc.items.map(function (it) { return it.str; }).join(' ');
            }
            if (text.replace(/\s/g, '').length < 20) {
              row.status = 'notext';   // 没有文字层:扫描件
            } else {
              var parsed = parseInvoice(text);
              row.number = parsed.number; row.code = parsed.code; row.date = parsed.date; row.total = parsed.total; row.seller = parsed.seller;
              row.text = parsed.text;
              // 这两个字段是"证据":金额从哪儿读到的、这份里出现了几次发票号码。
              // 第一版漏了这一步赋值,表格里就永远不显示来源 —— 加了新字段却忘了搬到 row 上,是这类"多一层映射"代码的经典漏法。
              row.totalFrom = parsed.totalFrom; row.numberCount = parsed.numberCount;
            }
          }
        } catch (e) {
          row.status = 'error';
          row.why = H.isLibFail(e) ? '程序没加载成功' : H.friendlyError(e, 'PDF/图片打不开');
        }
        rows.push(row);
      }
      // 查重:
      // ① 文件内容指纹相同(最硬:同一个文件交了两次,图片发票也能查出来)
      // ② 发票号码完全相同
      // ③ 没有号码时按费用要素(日期+金额)判"疑似",交人工确认
      var seenHash = {};
      rows.forEach(function (r) {
        if (!r.sha || r.status === 'error') return;
        if (seenHash[r.sha]) { r.status = 'duphash'; } else { seenHash[r.sha] = 1; }
      });
      var seen = {};
      rows.forEach(function (r) {
        if (r.status === 'error' || r.status === 'notext' || r.status === 'image' || r.status === 'duphash') return;
        var key = r.number ? ('N:' + r.number) : ('F:' + (r.date || '') + '|' + (r.total === null ? '' : r.total.toFixed(2)) + '|' + (r.seller || ''));
        if (r.number && seen[key]) { r.status = 'dup'; }
        else if (r.number) { seen[key] = 1; }
      });
      var feats = {};
      rows.forEach(function (r) {
        if (r.status !== 'uniq' || r.number || r.isImage) return;
        var k = (r.date || '') + '|' + (r.total === null ? '' : r.total.toFixed(2));
        if (k === '|') return;
        if (feats[k]) { r.status = 'suspect'; } else { feats[k] = 1; }
      });
      fill.style.width = '100%';
      pg.style.display = 'none'; pgt.style.display = 'none';
      render();
      var dup = rows.filter(function (r) { return r.status === 'dup' || r.status === 'duphash'; }).length;
      var dupH = rows.filter(function (r) { return r.status === 'duphash'; }).length;
      var notext = rows.filter(function (r) { return r.status === 'notext'; }).length;
      say('读完了 ' + rows.length + ' 张:' + (dup ? '发现 ' + dup + ' 张重复' + (dupH ? '(其中 ' + dupH + ' 张是同一份文件交了两次)' : '') : '没有发现重复')
        + (notext ? ';有 ' + notext + ' 张读不出文字(扫描件/照片)' : '')
        + '。下面可以导出 CSV 报销清单。', dup ? 'err' : 'ok');
    } catch (e) {
      pg.style.display = 'none'; pgt.style.display = 'none';
      say(H.isLibFail(e) ? H.friendlyError(e) : '读取出错:' + H.friendlyError(e), 'err');
    }
  }

  H.makeDropZone(root.querySelector('#dz'), analyze, 'application/pdf');
}
