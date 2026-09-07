// home.js — 首页渲染：manifest 驱动，分区 + 搜索 + 键盘导航
(function () {
  // 图标统一为 Lucide(lucide.dev, ISC 许可)精简内联
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var E = '</svg>';
  var ICONS = {
    tarot: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d4a8c"/><stop offset="0.5" stop-color="#2a2e60"/><stop offset="1" stop-color="#14152f"/></linearGradient><radialGradient id="hg" cx="0.28" cy="0.16" r="0.85"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8df96"/><stop offset="0.55" stop-color="#e4bd6b"/><stop offset="1" stop-color="#bd8b45"/></linearGradient><clipPath id="hc"><rect x="0.5" y="0.5" width="23" height="23" rx="4.8"/></clipPath></defs><g clip-path="url(#hc)"><rect x="0.5" y="0.5" width="23" height="23" fill="url(#hb)"/><rect x="0.5" y="0.5" width="23" height="23" fill="url(#hg)"/><circle cx="2.6" cy="2.6" r="0.5" fill="#fff" opacity="0.85"/><circle cx="2.6" cy="21.4" r="0.4" fill="#fff" opacity="0.5"/><circle cx="21.4" cy="21.4" r="0.44" fill="#fff" opacity="0.5"/><circle cx="19.6" cy="8.2" r="0.4" fill="#fff" opacity="0.55"/><circle cx="19.6" cy="15.8" r="0.4" fill="#fff" opacity="0.55"/><g fill="none" stroke="url(#hd)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 5h4"/><path d="M20 3v4"/><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></g></g><rect x="0.5" y="0.5" width="23" height="23" rx="4.8" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="0.5"/></svg>',
    image: S + '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>' + E,
    'image-down': S + '<path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19 3 3v-5.5"/><path d="m17 22 3-3"/><circle cx="9" cy="9" r="2"/>' + E,
    'arrow-left-right': S + '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>' + E,
    images: S + '<path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/>' + E,
    merge: S + '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>' + E,
    scissors: S + '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>' + E,
    'file-image': S + '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/>' + E,
    archive: S + '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>' + E,
    'file-text': S + '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>' + E,
    braces: S + '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>' + E,
    binary: S + '<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>' + E,
    regex: S + '<path d="M17 3v10"/><path d="m12.67 5.5 8.66 5"/><path d="m12.67 10.5 8.66-5"/><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z"/>' + E,
    palette: S + '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>' + E,
    'qr-code': S + '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>' + E,
    'key-round': S + '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>' + E,
    hash: S + '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>' + E,
    link: S + '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' + E,
    fingerprint: S + '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>' + E,
    calendar: S + '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>' + E,
    code: S + '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>' + E
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
    var order = 0;
    data.sections.forEach(function (sec) {
      var list = tools.filter(function (t) { return t.section === sec.id; });
      if (!list.length) return;
      html += '<section class="section-block section-block--' + sec.id + '">'
      + '<div class="section-head"><span class="section-ic">' + (ICONS[sec.icon] || '') + '</span>'
      + '<div><h2 class="section-title">' + sec.name + '</h2><p class="section-desc">' + (sec.desc || '') + '</p></div></div>'
      + '<div class="apps-grid">';
      list.forEach(function (t) {
        var iconCls = t.dark ? 'app-icon app-icon--dark' : 'app-icon app-icon--light app-icon--sec-' + t.section;
        html += '<a class="app" href="' + t.url + '" style="animation-delay:' + (order * 40) + 'ms">'
          + '<span class="' + iconCls + '">' + icon(t.icon) + '</span>'
          + '<span class="app-name">' + t.name + '</span>'
          + '<span class="app-desc">' + t.desc + '</span>'
          + '</a>';
        order++;
      });
      html += '</div></section>';
    });
    root.innerHTML = html || '<p class="footnote">没找到匹配的工具。</p>';
  }

  function isTyping() {
    var el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  if (search) {
    search.addEventListener('input', function () { render(search.value); });
    search.addEventListener('keydown', function (e) {
      var apps = root.querySelectorAll('a.app');
      if (e.key === 'ArrowDown' && apps.length) { e.preventDefault(); apps[0].focus(); }
      else if (e.key === 'Escape') { search.value = ''; render(''); search.blur(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && search && document.activeElement !== search && !isTyping()) {
      e.preventDefault(); search.focus();
    }
  });

  root.addEventListener('mousemove', function (e) {
    var app = e.target && e.target.closest ? e.target.closest('a.app') : null;
    if (!app) return;
    var rect = app.getBoundingClientRect();
    app.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    app.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  });

  var kicker = document.getElementById('kicker');
  if (kicker) kicker.textContent = '✦ ' + data.tools.length + ' 个工具 · 全部本地运行';

  render('');
})();
