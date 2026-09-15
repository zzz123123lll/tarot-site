// tools/md-wechat.mjs — Markdown → 微信公众号排版(全部写成内联样式,一键复制进公众号编辑器)
// 证据(中文社区一手原话):"微信的富文本编辑器对 CSS 支持很有限,很多样式在浏览器里看着好好的,
// 复制到微信里就变形了。这部分我和 AI 反复调试了大概三个小时。"
// 做法:只产出微信编辑器认的东西 —— 内联 style + p/section/span/strong/em/blockquote/ul/ol/li/img/code/pre/table,
// 不用 <style>、不用 class、不用 flex/grid/CSS 变量,这样粘贴过去才不会变形。
export function mount(root, H) {
  H.injectCss(".mw-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}"
    + "@media (max-width:900px){.mw-grid{grid-template-columns:1fr}}"
    + ".mw-box{width:100%;min-height:300px;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:12px;font-size:14px;line-height:1.7;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#fff;resize:vertical}"
    + ".mw-prev{background:#fff;border:1px solid var(--c-hairline);border-radius:12px;padding:16px 18px;min-height:300px;max-height:620px;overflow:auto;font-size:15px}"
    + ".mw-themes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}"
    + ".mw-themes button{min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--c-line-strong);background:#fff;font-size:14px;cursor:pointer}"
    + ".mw-themes button.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".mw-note{font-size:14px;color:#6e6e73;line-height:1.7;margin-top:10px}");

  var SAMPLE = [
    '# 标题:三个月把一件事做成',
    '',
    '这是**加粗**、*斜体* 和 `行内代码` 的样子。',
    '',
    '## 小标题',
    '',
    '- 第一条要点',
    '- 第二条要点',
    '',
    '> 引用:别人说过的一句话。',
    '',
    '```',
    '// 代码块',
    'const a = 1;',
    '```',
    '',
    '[一个链接](https://gongjuhe.top/)',
    '',
    '---',
    '',
    '结尾一段普通文字。'
  ].join('\n');

  root.innerHTML =
    '<h1 class="tool-h1">Markdown → 公众号排版</h1>' +
    '<p class="tool-sub">把 Markdown 粘进来,右边直接是公众号里该有的样子:字体、行距、引用、代码、列表都用<b>内联样式</b>写好,<b>一键复制</b>即可粘进公众号编辑器 —— 不会像普通网页那样"看着好看,粘过去就变形"。</p>' +
    '<div class="tool-row"><span style="font-size:14px;color:#6e6e73">风格</span><span class="mw-themes" id="themes"></span>' +
      '<button class="tool-btn" id="copyRich">一键复制(富文本)</button>' +
      '<button class="tool-btn tool-btn--ghost" id="copyText">复制纯文本</button>' +
      '<button class="tool-btn tool-btn--ghost" id="dlHtml">下载 HTML</button></div>' +
    '<div class="mw-grid">' +
      '<div><label for="md" style="font-size:14px;color:#6e6e73">Markdown(可拖 .md 文件进来)</label>' +
      '<textarea class="mw-box" id="md" spellcheck="false"></textarea></div>' +
      '<div><label style="font-size:14px;color:#6e6e73">公众号里的样子(可直接全选复制)</label>' +
      '<div class="mw-prev" id="prev" contenteditable="true" role="textbox" aria-label="渲染结果,可编辑"></div></div>' +
    '</div>' +
    '<p class="mw-note" id="stat"></p>' +
    '<p class="mw-note">说明:微信编辑器不认 <code>&lt;style&gt;</code>、class、flex/grid/CSS 变量,所以我们全部用内联样式,只使用它支持的标签(p / section / span / strong / em / blockquote / ul / ol / li / img / code / pre / table)。<b>图片仍需你自己在公众号后台重新上传</b>(微信不允许外链图片)。</p>';

  var md = root.querySelector('#md'), prev = root.querySelector('#prev'), stat = root.querySelector('#stat');
  md.value = SAMPLE;

  // ---------- 三套风格:都只改内联样式 ----------
  var THEMES = [
    {
      id: 'default', name: '默认(公众号常见)',
      base: 'font-size:15px;line-height:1.75;color:#3f3f3f;letter-spacing:.02em;',
      h1: 'font-size:20px;font-weight:700;color:#1d1d1f;margin:26px 0 14px;line-height:1.4;',
      h2: 'font-size:17px;font-weight:700;color:#1d1d1f;margin:22px 0 12px;line-height:1.45;',
      h3: 'font-size:16px;font-weight:700;color:#1d1d1f;margin:20px 0 10px;',
      p: 'margin:0 0 16px;',
      quote: 'margin:0 0 16px;padding:10px 14px;border-left:3px solid #d2d2d7;background:#f7f7f8;color:#5b5b60;',
      code: 'font-family:Menlo,Consolas,monospace;font-size:13px;background:#f5f5f7;padding:2px 5px;border-radius:3px;color:#c7254e;',
      pre: 'font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;background:#f7f7f8;border-radius:6px;padding:12px 14px;overflow-x:auto;color:#3f3f3f;margin:0 0 16px;white-space:pre-wrap;word-break:break-all;',
      li: 'margin:0 0 8px;',
      hr: 'border:none;border-top:1px solid #e8e8ed;margin:24px 0;'
    },
    {
      id: 'accent', name: '标题带色条',
      base: 'font-size:15px;line-height:1.75;color:#3f3f3f;',
      h1: 'font-size:20px;font-weight:700;color:#0060c1;margin:26px 0 14px;padding-left:10px;border-left:4px solid #0071e3;line-height:1.4;',
      h2: 'font-size:17px;font-weight:700;color:#0060c1;margin:22px 0 12px;padding-left:8px;border-left:3px solid #0071e3;',
      h3: 'font-size:16px;font-weight:700;color:#1d1d1f;margin:20px 0 10px;',
      p: 'margin:0 0 16px;',
      quote: 'margin:0 0 16px;padding:10px 14px;border-left:3px solid #0071e3;background:rgba(0,113,227,.05);color:#3a3a3c;',
      code: 'font-family:Menlo,Consolas,monospace;font-size:13px;background:#f5f5f7;padding:2px 5px;border-radius:3px;color:#c7254e;',
      pre: 'font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;background:#f7f7f8;border-radius:6px;padding:12px 14px;overflow-x:auto;color:#3f3f3f;margin:0 0 16px;white-space:pre-wrap;word-break:break-all;',
      li: 'margin:0 0 8px;',
      hr: 'border:none;border-top:1px solid #e8e8ed;margin:24px 0;'
    },
    {
      id: 'card', name: '卡片(带底色框)',
      base: 'font-size:15px;line-height:1.8;color:#3a3a3c;',
      h1: 'font-size:20px;font-weight:700;color:#1d1d1f;margin:24px 0 14px;text-align:center;',
      h2: 'font-size:17px;font-weight:700;color:#1d1d1f;margin:22px 0 12px;',
      h3: 'font-size:16px;font-weight:700;color:#1d1d1f;margin:20px 0 10px;',
      p: 'margin:0 0 16px;',
      quote: 'margin:0 0 16px;padding:14px 16px;background:#f5f5f7;border-radius:8px;color:#3a3a3c;',
      code: 'font-family:Menlo,Consolas,monospace;font-size:13px;background:#f0f0f2;padding:2px 5px;border-radius:3px;color:#c7254e;',
      pre: 'font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;background:#111114;border-radius:8px;padding:14px 16px;overflow-x:auto;color:#f2f2f4;margin:0 0 16px;white-space:pre-wrap;word-break:break-all;',
      li: 'margin:0 0 8px;',
      hr: 'border:none;border-top:1px dashed #d2d2d7;margin:24px 0;'
    }
  ];
  var theme = THEMES[0];
  root.querySelector('#themes').innerHTML = THEMES.map(function (t, i) { return '<button data-i="' + i + '"' + (i === 0 ? ' class="active"' : '') + '>' + t.name + '</button>'; }).join('');
  root.querySelector('#themes').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    theme = THEMES[parseInt(b.dataset.i, 10)];
    root.querySelectorAll('#themes button').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });

  function esc(s) { return H.esc(s); }
  function inline(s) {
    var t = esc(s);
    t = t.replace(/`([^`]+)`/g, function (_, c) { return '<code style="' + theme.code + '">' + c + '</code>'; });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#0066cc;text-decoration:none;border-bottom:1px solid rgba(0,102,204,.35);">$1</a>');
    t = t.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;display:block;margin:0 auto 16px;">');
    return t;
  }
  // 极简 Markdown 渲染:只做公众号常用的那几样
  function renderMd(src) {
    var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [], inCode = false, listType = null, inQuote = false;
    function closeList() { if (listType) { out.push('</' + listType + '>'); listType = null; } }
    function closeQuote() { if (inQuote) { out.push('</blockquote>'); inQuote = false; } }
    lines.forEach(function (raw) {
      var line = raw;
      if (/^\s*```/.test(line)) {
        if (!inCode) { closeList(); closeQuote(); out.push('<pre style="' + theme.pre + '">'); inCode = true; }
        else { out.push('</pre>'); inCode = false; }
        return;
      }
      if (inCode) { out.push(esc(line)); return; }
      if (/^\s*$/.test(line)) { closeList(); closeQuote(); return; }
      var m;
      if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
        closeList(); closeQuote();
        var lvl = m[1].length;
        var st = lvl === 1 ? theme.h1 : (lvl === 2 ? theme.h2 : theme.h3);
        out.push('<h' + lvl + ' style="' + st + '">' + inline(m[2]) + '</h' + lvl + '>');
        return;
      }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { closeList(); closeQuote(); out.push('<hr style="' + theme.hr + '">'); return; }
      if ((m = line.match(/^\s*>\s?(.*)$/))) {
        closeList();
        if (!inQuote) { out.push('<blockquote style="' + theme.quote + '">'); inQuote = true; }
        out.push('<p style="margin:0 0 8px;">' + inline(m[1]) + '</p>');
        return;
      }
      closeQuote();
      if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
        if (listType !== 'ul') { closeList(); out.push('<ul style="margin:0 0 16px;padding-left:22px;">'); listType = 'ul'; }
        out.push('<li style="' + theme.li + '">' + inline(m[1]) + '</li>');
        return;
      }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        if (listType !== 'ol') { closeList(); out.push('<ol style="margin:0 0 16px;padding-left:22px;">'); listType = 'ol'; }
        out.push('<li style="' + theme.li + '">' + inline(m[1]) + '</li>');
        return;
      }
      closeList();
      out.push('<p style="' + theme.p + '">' + inline(line) + '</p>');
    });
    closeList(); closeQuote();
    if (inCode) out.push('</pre>');
    return '<section style="' + theme.base + '">' + out.join('\n') + '</section>';
  }

  function render() {
    var t0 = performance.now();
    var html = renderMd(md.value);
    prev.innerHTML = html;
    var chars = md.value.replace(/\s/g, '').length;
    stat.textContent = '已渲染 ' + chars + ' 字 · ' + Math.round(performance.now() - t0) + ' ms · 全部样式都是内联的(可以只看源码确认)';
  }
  md.addEventListener('input', render);

  function copyHtml() {
    var html = prev.innerHTML;
    var ok = function () { stat.textContent = '已复制富文本:直接去公众号编辑器里 Ctrl/⌘+V 粘贴即可。'; };
    var fail = function () { stat.textContent = '这个浏览器不允许直接写剪贴板:请点右边预览区,按 Ctrl/⌘+A 全选、Ctrl/⌘+C 复制,再粘进公众号。'; };
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        var item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([prev.innerText], { type: 'text/plain' })
        });
        navigator.clipboard.write([item]).then(ok, fail);
      } else fail();
    } catch (e) { fail(); }
  }
  root.querySelector('#copyRich').addEventListener('click', copyHtml);
  root.querySelector('#copyText').addEventListener('click', function () {
    H.copyText(prev.innerText).then(function () { stat.textContent = '已复制纯文本(不带样式)。'; }, function () { stat.textContent = '复制失败,请手动选中复制。'; });
  });
  root.querySelector('#dlHtml').addEventListener('click', function () {
    var html = '<!DOCTYPE html><meta charset="utf-8"><title>公众号排版</title>\n' + prev.innerHTML;
    H.downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), '公众号排版.html');
  });
  H.makeDropZone(root.querySelector('#md'), function (files) {
    var f = files && files[0]; if (!f) return;
    f.text().then(function (t) { md.value = t; render(); }, function () { H.warnBelow(root.querySelector('#md'), '这个文件读不了,换一个 .md / .txt 试试。'); });
  }, '.md,.markdown,.txt,text/markdown,text/plain', { multiple: false });

  render();
}
