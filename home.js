// home.js — 首页渲染：manifest 驱动，分区 + 搜索 + 键盘导航
(function () {
  // 图标 = 塔罗同款图标砖：分区色系渐变底 + 柔光 + Lucide 白色线条(lucide.dev, ISC 许可)
  var U = '<stop offset="0" stop-color="#4f95ea"/><stop offset="0.55" stop-color="#2a6fc4"/><stop offset="1" stop-color="#0e3f7d"/>';
  var G = '<stop offset="0" stop-color="#5cc98a"/><stop offset="0.55" stop-color="#2f9d62"/><stop offset="1" stop-color="#145a37"/>';
  var O = '<stop offset="0" stop-color="#eea45c"/><stop offset="0.55" stop-color="#cf7a2e"/><stop offset="1" stop-color="#8a4a16"/>';
  var P = '<stop offset="0" stop-color="#5aa2f7"/><stop offset="0.5" stop-color="#8e7bf0"/><stop offset="1" stop-color="#e885b2"/>';
  // 单色线性图标:一个强调色 + 中性墨色就够。渐变彩色图标砖是"手机启动器"的语言,
  // 评审实测我们原来有 7 个色相族、20 组渐变,和"近黑 + 单一蓝"的页面身份打架。
  function tile(key, stops, glyph) {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="currentColor">' + glyph + '</g></svg>';
  }
  var ICONS = {
    tarot: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.2 6.1 6.3 2.4-6.3 2.4L12 20.5l-2.2-6.1L3.5 12l6.3-2.4z"/></g></svg>',
    code: tile('code', U, '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
    image: tile('image', G, '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
    'file-text': tile('file-text', O, '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
    'image-down': tile('image-down', G, '<path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19 3 3v-5.5"/><path d="m17 22 3-3"/><circle cx="9" cy="9" r="2"/>'),
    'arrow-left-right': tile('arrow-left-right', G, '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>'),
    images: tile('images', G, '<path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/>'),
    merge: tile('merge', O, '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>'),
    scissors: tile('scissors', O, '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>'),
    'file-image': tile('file-image', O, '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/>'),
    archive: tile('archive', O, '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'),
    braces: tile('braces', U, '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'),
    binary: tile('binary', U, '<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>'),
    regex: tile('regex', U, '<path d="M17 3v10"/><path d="m12.67 5.5 8.66 5"/><path d="m12.67 10.5 8.66-5"/><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z"/>'),
    palette: tile('palette', P, '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>'),
    'qr-code': tile('qr-code', U, '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>'),
    'key-round': tile('key-round', U, '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>'),
    hash: tile('hash', U, '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>'),
    link: tile('link', U, '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    fingerprint: tile('fingerprint', U, '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>'),
    calendar: tile('calendar', U, '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>'),
    user: tile('user', G, '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    receipt: tile('receipt', O, '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>')
  };

  var data = window.TOOLS;
  var root = document.getElementById('apps');
  var search = document.getElementById('searchInput');
  if (!data || !root) return;

  function icon(key) { return ICONS[key] || ICONS.code; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var secName = {};
  data.sections.forEach(function (s) { secName[s.id] = s.name; });

  // 产品卡(对标 Apple 的 tile 逻辑:名字大、一句人话、整卡可点;图标只做标识)
  function card(t, order, showSec) {
    var iconCls = t.dark ? 'app-icon app-icon--dark' : 'app-icon app-icon--light';
    return '<a class="app reveal" href="' + t.url + '">'
      + '<span class="' + iconCls + '">' + icon(t.icon) + '</span>'
      + '<span class="app-body">'
      + '<span class="app-name">' + esc(t.name) + (t.status === 'download' ? '<span class="app-badge app-badge--dl">下载</span>' : '') + '</span>'
      + '<span class="app-desc">' + esc(t.desc) + '</span>'
      + (showSec ? '<span class="app-sec">' + esc(secName[t.section] || '') + '</span>' : '')
      + '</span></a>';
  }

  function render(q) {
    var ql = (q || '').trim().toLowerCase();
    var html = '';
    var order = 0;

    if (ql) {
      // 搜索:名称命中优先,其次说明命中,再其次分区名命中;结果不分区、按相关度排
      var scored = data.tools.map(function (t) {
        var score = 0;
        if (t.name.toLowerCase().indexOf(ql) !== -1) score += 4;
        if (String(t.desc || '').toLowerCase().indexOf(ql) !== -1) score += 2;
        if (String(secName[t.section] || '').toLowerCase().indexOf(ql) !== -1) score += 1;
        return { t: t, score: score };
      }).filter(function (x) { return x.score > 0; });
      scored.sort(function (a, b) { return b.score - a.score; });
      var list = scored.map(function (x) { return x.t; });
      if (list.length) {
        html += '<div class="group group--search">'
          + '<div class="group-head reveal"><h3 class="group-title">搜索结果</h3>'
          + '<p class="group-desc">' + list.length + ' 个工具匹配「' + esc(q) + '」</p></div>'
          + '<div class="apps-grid">';
        list.forEach(function (t) { html += card(t, order, true); order++; });
        html += '</div></div>';
      }
      root.innerHTML = html || '<p class="footnote">没找到「' + esc(q) + '」相关的工具。可以试试「压缩」「PDF」「二维码」这类更短的词,或者直接看下面的分区。</p>';
      return;
    }

    // 分区渲染成"组":首页的分区标题(全部 20 个工具)与带底色的目录区在 HTML 里,
    // 这里只负责按分区吐出组,保证"静态预渲染"与"运行时渲染"是同一份结构。
    data.sections.forEach(function (sec) {
      var list = data.tools.filter(function (t) { return t.section === sec.id; });
      if (!list.length) return;
      html += '<div class="group group--' + sec.id + '">'
        + '<div class="group-head reveal"><h3 class="group-title">' + esc(sec.name) + '</h3><p class="group-desc">' + esc(sec.desc || '') + '</p></div>'
        + '<div class="apps-grid">';
      list.forEach(function (t) { html += card(t, order, false); order++; });
      html += '</div></div>';
    });
    root.innerHTML = html;
  }

  // ---------- 动效运行时(第 2 阶段) ----------
  // 原则:只动 transform/opacity;无 JS 时内容可见(初态挂在 html.js-motion 上,且 head 里有 2s 兜底会摘掉它);
  //      reduced-motion 由 CSS 的反向包裹(prefers-reduced-motion: no-preference)负责,这里只跳过错峰与观察器。
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canIO = 'IntersectionObserver' in window;
  var io = null;
  function eachText(list, fn) { Array.prototype.forEach.call(list, fn); }
  // 可见性守卫(取自 Vercel 线上实现):元素自己或任一祖先是 display:none / visibility:hidden / opacity:0 时不播动画。
  // 优先用原生的 checkVisibility,不支持就逐级看计算样式。
  function isRendered(el) {
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ opacityProperty: true, contentVisibilityAuto: true });
    for (var node = el; node && node.nodeType === 1; node = node.parentElement) {
      var cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  }
  function stagger() {
    eachText(root.querySelectorAll('.group'), function (g) {
      // 卡片错峰:步长 40ms(transitions.dev 的 --duration-stagger),封顶 240ms,避免第 20 张等 1 秒
      eachText(g.querySelectorAll('a.app'), function (cardEl, i) { cardEl.style.setProperty('--rd', Math.min(240, (i % 3) * 40) + 'ms'); });
    });
    // 三件事与目录标题:用苹果实测的交错(每项 150ms、封顶 6 项)
    eachText(document.querySelectorAll('.feature-head, .feature-row, .catalog-head'), function (el, i) {
      el.style.setProperty('--rd', Math.min(6, i) * 150 + 'ms');
    });
    eachText(document.querySelectorAll('.group-head'), function (el, i) {
      el.style.setProperty('--rd', Math.min(6, i) * 150 + 'ms');
    });
  }
  // 兜底扫描:IntersectionObserver 在"瞬间跳转"(例如点『看全部工具 ↓』)时可能整段跳过,
  // 这里在滚动时按几何位置补一次 —— 已经滚过头的(在视口上方)也直接显示,避免"看不见的空卡"。
  function sweep() {
    eachText(document.querySelectorAll('.reveal:not(.is-in)'), function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.96 && isRendered(el)) el.classList.add('is-in');
    });
  }
  function initReveal() {
    // 注意:要查整页,不只是 #apps —— 三件事/catalog 标题这些 reveal 元素在 #apps 外面(静态 HTML 里的),
    // 上一版只查了 #apps,结果那几块永远停在 opacity:0(测试才发现)。
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    if (reduce || !canIO) { eachText(els, function (el) { el.classList.add('is-in'); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target); // 只播一次,滚回去不重播
          if (!isRendered(en.target)) return; // 祖先 display:none 之类就不必播(否则动画播在看不见的地方)
          en.target.classList.add('is-in');
        });
      }, { root: null, rootMargin: '0px', threshold: 0.1 }); // Vercel 线上原码的配置(threshold .1 / rootMargin 0)
    }
    eachText(els, function (el) { io.observe(el); });
  }
  // 搜索过滤:支持的浏览器用原生 view transition 做交叉淡入,不支持就直接切换
  function paint(q) {
    var run = function () { render(q); stagger(); initReveal(); sweep(); };
    if (!reduce && document.startViewTransition) { document.startViewTransition(run); } else { run(); }
  }
  var navEl = document.querySelector('.site-nav');
  var ticking = false;
  function onScroll() {
    if (navEl) navEl.classList.toggle('is-scrolled', window.scrollY > 8);
    sweep();
    if (!reduce && window.innerWidth >= 1069 && window.scrollY < 900) {
      var shot = document.querySelector('.shot-hero');
      if (shot) shot.style.setProperty('--py', Math.round(Math.min(window.scrollY * 0.05, 34)) + 'px');
    }
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('pageshow', function () { onScroll(); });
  // 主脚本起来了,撤掉 head 里的兜底计时器(它到点会摘掉 js-motion 类,把内容直接显示出来)
  if (window.__revealFallback) clearTimeout(window.__revealFallback);
  function isTyping() {
    var el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  if (search) {
    search.addEventListener('input', function () { paint(search.value); });
    search.addEventListener('keydown', function (e) {
      var apps = root.querySelectorAll('a.app');
      if (e.key === 'ArrowDown' && apps.length) { e.preventDefault(); apps[0].focus(); }
      else if (e.key === 'Escape') { search.value = ''; paint(''); search.blur(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && search && document.activeElement !== search && !isTyping()) {
      e.preventDefault(); search.focus();
    }
  });

  var kicker = document.getElementById('kicker');
  if (kicker) kicker.innerHTML = '<svg class="star-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.55 7.05L21.6 12l-7.05 2.55L12 21.6l-2.55-7.05L2.4 12l7.05-2.55z" fill="currentColor"/></svg> ' + data.tools.length + ' 个工具 · 全部本地运行';

  paint('');
  onScroll();
})();
