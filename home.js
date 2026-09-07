// home.js — 首页渲染：从 tools-manifest.js 读工具，分区 + 搜索 + 状态徽章
(function () {
  var ICONS = {
    tarot: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d4a8c"/><stop offset="0.5" stop-color="#2a2e60"/><stop offset="1" stop-color="#14152f"/></linearGradient><radialGradient id="hg" cx="0.28" cy="0.16" r="0.85"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8df96"/><stop offset="0.55" stop-color="#e4bd6b"/><stop offset="1" stop-color="#bd8b45"/></linearGradient><clipPath id="hc"><rect x="0.5" y="0.5" width="23" height="23" rx="4.8"/></clipPath></defs><g clip-path="url(#hc)"><rect x="0.5" y="0.5" width="23" height="23" fill="url(#hb)"/><rect x="0.5" y="0.5" width="23" height="23" fill="url(#hg)"/><circle cx="2.6" cy="2.6" r="0.5" fill="#fff" opacity="0.85"/><circle cx="21.4" cy="2.6" r="0.42" fill="#fff" opacity="0.6"/><circle cx="2.6" cy="21.4" r="0.4" fill="#fff" opacity="0.5"/><circle cx="21.4" cy="21.4" r="0.44" fill="#fff" opacity="0.5"/><circle cx="19.6" cy="8.2" r="0.4" fill="#fff" opacity="0.55"/><circle cx="19.6" cy="15.8" r="0.4" fill="#fff" opacity="0.55"/><path fill-rule="evenodd" fill="url(#hd)" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M15 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/><path fill="url(#hd)" d="M15.4 9.3l.85 2.05 2.05.85-2.05.85-.85 2.05-.85-2.05-2.05-.85 2.05-.85z"/></g><rect x="0.5" y="0.5" width="23" height="23" rx="4.8" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="0.5"/></svg>',
    compress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M3 17l5-5 3.5 3.5L16 11l5 5"/></svg>',
    disk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-4 5 4 5"/><path d="M16 7l4 5-4 5"/></svg>',
    convert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3l-5 5M21 3h-5M21 3v5"/><path d="M3 21l5-5M3 21h5M3 21v-5"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg>',
    color: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.7 6 11a6 6 0 0 1-12 0c0-4.3 6-11 6-11z"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6"/><path d="M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
    law: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 7h14"/><path d="M7 7l-2 5a3 3 0 0 0 4 0z"/><path d="M17 7l-2 5a3 3 0 0 0 4 0z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7-4-4-7 7-1 5z"/><path d="M15 6l3 3"/></svg>'
  };

  var data = window.TOOLS;
  var root = document.getElementById('apps');
  var search = document.getElementById('searchInput');
  if (!data || !root) return;

  function icon(key) { return ICONS[key] || ICONS.code; }

  function render(q) {
    var ql = (q || '').trim().toLowerCase();
    var tools = data.tools.filter(function (t) {
      return !ql || (t.name + ' ' + t.desc).toLowerCase().indexOf(ql) !== -1;
    });
    var html = '';
    data.sections.forEach(function (sec) {
      var list = tools.filter(function (t) { return t.section === sec.id; });
      if (!list.length) return;
      html += '<section class="section-block"><h2 class="section-title">' + sec.name + '</h2><div class="apps-grid">';
      list.forEach(function (t) {
        var soon = t.status === 'soon';
        var dl = t.status === 'download';
        var iconCls = t.dark ? 'app-icon app-icon--dark' : (soon ? 'app-icon app-icon--soon' : 'app-icon app-icon--light');
        var open = '<span class="' + iconCls + '">' + icon(t.icon) + '</span>';
        var name = '<span class="app-name">' + t.name + '</span>';
        var badge = soon ? '<span class="app-badge">敬请期待</span>' : (dl ? '<span class="app-badge app-badge--dl">下载</span>' : '');
        if (soon) {
          html += '<div class="app app--soon">' + open + name + badge + '</div>';
        } else {
          var target = dl ? ' target="_blank" rel="noopener"' : '';
          html += '<a class="app" href="' + t.url + '"' + target + '>' + open + name + badge + '</a>';
        }
      });
      html += '</div></section>';
    });
    root.innerHTML = html || '<p class="footnote">没找到匹配的工具。</p>';
  }

  if (search) search.addEventListener('input', function () { render(search.value); });
  render('');
})();