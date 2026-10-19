// tools/star-map.mjs — 纪念星图:把想留住的字,放回天上。
// 一段话 / 一列名字 / 一封信 → 一张可分享、可打印的私人星图(纯本地、确定性)。
export function mount(root, H) {
  H.injectCss(
    ".sm2-wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start}"
    + "@media (max-width:980px){.sm2-wrap{grid-template-columns:1fr}}"
    + ".sm2-stage{position:relative;border-radius:18px;overflow:hidden;background:#070a18;box-shadow:var(--sh-3)}"
    + ".sm2-stage canvas{display:block;width:100%;height:auto;touch-action:manipulation}"
    + ".sm2-tip{position:absolute;left:0;top:0;transform:translate(-50%,-120%);pointer-events:none;background:rgba(247,246,239,.96);color:#1e2a22;border:1px solid rgba(30,42,34,.18);border-radius:10px;padding:6px 10px;font-size:13px;white-space:nowrap;opacity:0;transition:opacity .15s ease;z-index:3}"
    + ".sm2-tip.on{opacity:1}"
    + ".sm2-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}"
    + ".sm2-templates{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}"
    + ".sm2-chip--tpl{min-height:34px;padding:0 10px;font-size:12px;border-style:dashed}"
    + ".sm2-error{margin:8px 0 0;font-size:13px;line-height:1.6;color:#bf4800;min-height:18px}"
    + ".tool-btn:disabled{opacity:.42;cursor:not-allowed}"
    + ".sm2-sharehint{font-size:12px;color:#86868b;margin-top:6px;line-height:1.6}"
    + ".sm2-side{background:var(--t-surface);border-radius:16px;padding:16px}"
    + ".sm2-label{display:block;font-size:13px;color:#6e6e73;margin:12px 0 6px}"
    + ".sm2-input{width:100%;padding:10px 12px;border:1px solid var(--c-line-strong);border-radius:10px;font-size:15px;font-family:inherit;background:#fff;color:#1d1d1f}"
    + ".sm2-input:focus{outline:2px solid var(--c-accent);outline-offset:1px}"
    + "textarea.sm2-input{resize:vertical;min-height:150px;line-height:1.7}"
    + ".sm2-tabs,.sm2-styles{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}"
    + ".sm2-chip{min-height:40px;padding:0 12px;border-radius:999px;border:1px solid var(--c-line-strong);background:#fff;font-size:13px;cursor:pointer;color:#1d1d1f}"
    + ".sm2-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".sm2-note{font-size:13px;line-height:1.7;color:#6e6e73;margin-top:12px}"
    + ".sm2-count{font-size:12px;color:#86868b;margin-top:8px}"
    + ".sm2-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}"
    + "@media (max-width:520px){.sm2-row{grid-template-columns:1fr}}"
  );

  root.innerHTML =
    '<h1 class="tool-h1">纪念星图</h1>'
    + '<p class="tool-sub">把想留住的字，放回天上。一段话、一列名字、一封信，都会变成只属于你们的星空；可导出分享卡，也可以打印成 A4 海报。</p>'
    + '<div class="sm2-wrap">'
    + '  <div>'
    + '    <div class="sm2-stage"><canvas id="sm2cv" width="1000" height="1250" aria-label="纪念星图预览"></canvas><div class="sm2-tip" id="sm2tip" role="status"></div></div>'
    + '    <div class="sm2-actions">'
    + '      <button class="tool-btn" id="sm2card">导出分享卡</button>'
    + '      <button class="tool-btn tool-btn--ghost" id="sm2poster">导出 A4 海报</button>'
    + '      <button class="tool-btn tool-btn--ghost" id="sm2share">复制分享链接</button>'
    + '      <button class="tool-btn tool-btn--ghost" id="sm2shuffle">换一片星空</button>'
    + '      <button class="tool-btn tool-btn--ghost" id="sm2example">换个例子</button>'
    + '    </div>'
    + '    <p class="sm2-sharehint">分享链接只包含文字与样式，不包含图片；对方打开后看到同一片星空。</p>'
    + '    <p class="sm2-note">同一段文字 + 同一个标题，永远得到同一片星空；「换一片星空」只改种子，不改文字。手机点一下任意一颗星，能看到它是哪个字。</p>'
    + '  </div>'
    + '  <aside class="sm2-side">'
    + '    <div class="sm2-tabs" id="sm2mode" role="group" aria-label="内容类型">'
    + '      <button class="sm2-chip active" type="button" data-mode="words">一段话</button>'
    + '      <button class="sm2-chip" type="button" data-mode="names">一列名字</button>'
    + '      <button class="sm2-chip" type="button" data-mode="letter">一封信</button>'
    + '    </div>'
    + '    <span class="sm2-label">从模板开始</span>'
    + '    <div class="sm2-templates" id="sm2templates" role="group" aria-label="模板">'
    + '      <button class="sm2-chip sm2-chip--tpl" type="button" data-tpl="birthday">生日</button>'
    + '      <button class="sm2-chip sm2-chip--tpl" type="button" data-tpl="wedding">婚礼</button>'
    + '      <button class="sm2-chip sm2-chip--tpl" type="button" data-tpl="graduation">毕业</button>'
    + '      <button class="sm2-chip sm2-chip--tpl" type="button" data-tpl="memorial">纪念</button>'
    + '      <button class="sm2-chip sm2-chip--tpl" type="button" data-tpl="team">团队</button>'
    + '    </div>'
    + '    <label class="sm2-label" for="sm2title">标题</label>'
    + '    <input class="sm2-input" id="sm2title" maxlength="40" placeholder="给未来的你">'
    + '    <div class="sm2-row">'
    + '      <div><label class="sm2-label" for="sm2date">日期</label><input class="sm2-input" id="sm2date" type="date"></div>'
    + '      <div><label class="sm2-label" for="sm2occasion">场合</label><select class="sm2-input" id="sm2occasion">'
    + '        <option>生日</option><option>毕业</option><option>婚礼</option><option>纪念日</option><option>团队</option><option>其他</option>'
    + '      </select></div>'
    + '    </div>'
    + '    <label class="sm2-label" for="sm2sign">署名（可留空）</label>'
    + '    <input class="sm2-input" id="sm2sign" maxlength="30" placeholder="Alex">'
    + '    <label class="sm2-label" for="sm2body">文字（每行一句；名字一行一个）</label>'
    + '    <textarea class="sm2-input" id="sm2body" spellcheck="false"></textarea>'
    + '    <span class="sm2-label">星空风格</span>'
    + '    <div class="sm2-styles" id="sm2style" role="group" aria-label="星空风格">'
    + '      <button class="sm2-chip active" type="button" data-style="classic">古典星图</button>'
    + '      <button class="sm2-chip" type="button" data-style="herbarium">标本室</button>'
    + '      <button class="sm2-chip" type="button" data-style="minimal">极简</button>'
    + '    </div>'
    + '    <p class="sm2-count" id="sm2count"></p>'
    + '    <p class="sm2-error" id="sm2error" role="status"></p>'
    + '    <p class="sm2-note">全部在浏览器里生成：不上传、不联网、不用 AI。A4 海报为 300dpi，可直接打印。</p>'
    + '  </aside>'
    + '</div>';

  var cv = root.querySelector('#sm2cv');
  var g = cv.getContext('2d');
  var tip = root.querySelector('#sm2tip');
  var bodyEl = root.querySelector('#sm2body');
  var titleEl = root.querySelector('#sm2title');
  var dateEl = root.querySelector('#sm2date');
  var occasionEl = root.querySelector('#sm2occasion');
  var signEl = root.querySelector('#sm2sign');
  var countEl = root.querySelector('#sm2count');
  var errorEl = root.querySelector('#sm2error');
  var templatesEl = root.querySelector('#sm2templates');
  var cardBtn = root.querySelector('#sm2card');
  var posterBtn = root.querySelector('#sm2poster');
  var shareBtn = root.querySelector('#sm2share');

  var state = { mode: 'words', style: 'classic', salt: 0, stars: [], lines: [], truncated: 0, total: 0, hash: '' };
  var styles = {
    classic: { bg: '#070A18', ink: '#EDE3CE', muted: 'rgba(237,227,206,.62)', accent: '#D9A441', line: 'rgba(217,164,65,.34)', grid: 'rgba(255,255,255,.07)', star: '#F3E9D8' },
    herbarium: { bg: '#E7EBE1', ink: '#1E2A22', muted: '#5F6B5F', accent: '#2F4B7C', line: 'rgba(47,75,124,.30)', grid: 'rgba(30,42,34,.08)', star: '#2F4B7C' },
    minimal: { bg: '#F7F6EF', ink: '#111111', muted: '#6E6A5F', accent: '#B24E2C', line: 'rgba(17,17,17,.22)', grid: 'rgba(17,17,17,.06)', star: '#111111' }
  };

  var EXAMPLES = {
    words: {
      title: '给未来的你', occasion: '生日', sign: 'Alex',
      text: '愿你所求皆如愿\n所行化坦途\n多喜乐\n长安宁'
    },
    names: {
      title: '我们的名字', occasion: '团队', sign: '',
      text: '张伟\n王芳\n李娜\n刘洋\n陈静\n周明'
    },
    letter: {
      title: '一封没有寄出的信', occasion: '纪念日', sign: 'Alex',
      text: '谢谢你出现在我的生活里。\n我们一起走过很多地方。\n有些话不必说完，星星会记得。\n愿你一切都好。'
    }
  };
  var exampleIndex = 0;
  var TEMPLATES = {
    birthday: {
      mode: 'words', title: '给 [名字] 的生日星图', occasion: '生日', sign: '',
      text: '愿你新的一岁\n所求皆如愿\n所行化坦途\n多喜乐\n长安宁'
    },
    wedding: {
      mode: 'names', title: '我们的婚礼', occasion: '婚礼', sign: '',
      text: '你的名字\nTA 的名字'
    },
    graduation: {
      mode: 'words', title: '毕业快乐', occasion: '毕业', sign: '',
      text: '此去山高水长\n愿你仍有少年气\n在更大的世界里\n继续发光'
    },
    memorial: {
      mode: 'letter', title: '写给想念的人', occasion: '纪念日', sign: '',
      text: '有些话没有说完。\n有些日子一直记得。\n如果你也在看星星，\n就知道我在想你。'
    },
    team: {
      mode: 'names', title: '我们的名字', occasion: '团队', sign: '',
      text: '张伟\n王芳\n李娜\n刘洋\n陈静\n周明'
    }
  };

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function cnDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[0] + ' 年 ' + Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日';
  }
  function cleanChar(ch) { return /[\s，。！？、；：,.!?;:"“”‘’（）()\[\]【】《》—\-…]/.test(ch); }

  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function collectState() {
    return {
      m: state.mode, st: state.style, t: titleEl.value, d: dateEl.value,
      o: occasionEl.value, s: signEl.value, x: bodyEl.value, salt: state.salt
    };
  }
  function applyData(data) {
    if (!data) return false;
    state.mode = ['words', 'names', 'letter'].indexOf(data.m) >= 0 ? data.m : 'words';
    state.style = styles[data.st] ? data.st : 'classic';
    state.salt = Number(data.salt) || 0;
    titleEl.value = data.t || '';
    dateEl.value = data.d || todayISO();
    occasionEl.value = data.o || '生日';
    signEl.value = data.s || '';
    bodyEl.value = data.x || '';
    updateModeUI();
    root.querySelectorAll('#sm2style .sm2-chip').forEach(function (x) {
      x.classList.toggle('active', x.dataset.style === state.style);
    });
    return true;
  }
  function readShare() {
    try {
      if (location.hash.indexOf('#s=') === 0) {
        return JSON.parse(b64urlDecode(location.hash.slice(3)));
      }
    } catch (e) { /* 坏链接就当没有 */ }
    return null;
  }
  function encodeShare() { return b64urlEncode(JSON.stringify(collectState())); }
  function draftKey() { return 'gjh-memorial-draft-v1'; }
  function saveDraft() {
    try { localStorage.setItem(draftKey(), JSON.stringify(collectState())); } catch (e) {}
  }
  function readDraft() {
    try {
      var raw = localStorage.getItem(draftKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function updateModeUI() {
    root.querySelectorAll('#sm2mode .sm2-chip').forEach(function (x) {
      x.classList.toggle('active', x.dataset.mode === state.mode);
    });
    bodyEl.placeholder = state.mode === 'names'
      ? '张伟\n王芳\n李娜（一行一个）'
      : state.mode === 'letter'
        ? '写一封信，每行一句…'
        : '每行一句，逗号句号也算断开…';
  }
  function updateStatus() {
    var ok = state.stars.length > 0;
    cardBtn.disabled = !ok;
    posterBtn.disabled = !ok;
    shareBtn.disabled = !ok;
    if (ok) {
      errorEl.textContent = '';
    } else {
      errorEl.textContent = '先写一点文字，才能生成星空。';
    }
  }

  function parseGroups() {
    var text = bodyEl.value || '';
    var mode = state.mode;
    var groups = [];
    if (mode === 'names') {
      var names = text.split(/[\n,，、;；]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (names.length) groups.push(names);
    } else if (mode === 'letter') {
      text.split(/\n+/).forEach(function (line) {
        var t = line.trim();
        if (!t) return;
        var sentences = t.split(/[。！？!?]/).map(function (s) { return s.trim(); }).filter(Boolean);
        sentences.forEach(function (s) {
          var chars = Array.from(s).filter(function (ch) { return !cleanChar(ch); });
          if (chars.length) groups.push(chars);
        });
      });
    } else {
      text.split(/\n+/).forEach(function (line) {
        var chars = Array.from(line.trim()).filter(function (ch) { return !cleanChar(ch); });
        if (chars.length) groups.push(chars);
      });
    }
    return groups;
  }

  function build() {
    var groups = parseGroups();
    var flat = [];
    var counts = {};
    groups.forEach(function (group, gi) {
      group.forEach(function (label) {
        var item = { label: label, group: gi, count: 1 };
        counts[label] = (counts[label] || 0) + 1;
        flat.push(item);
      });
    });
    flat.forEach(function (s) { s.count = counts[s.label]; });
    var total = flat.length;
    var truncated = 0;
    if (flat.length > 420) {
      truncated = flat.length - 420;
      flat = flat.slice(0, 420);
      groups = [];
      flat.forEach(function (s) {
        if (!groups[s.group]) groups[s.group] = [];
        groups[s.group].push(s);
      });
    }

    var seed = hashStr((titleEl.value || '') + '|' + bodyEl.value + '|' + state.style + '|' + state.salt);
    var rnd = rng(seed);
    var stars = [];
    var minDist = Math.sqrt((0.78 * 0.56) / Math.max(flat.length, 1)) * 0.52;
    flat.forEach(function (s) {
      var placed = false;
      for (var attempt = 0; attempt < 30; attempt++) {
        var x = 0.06 + rnd() * 0.88;
        var y = 0.21 + rnd() * 0.55;
        var ok = true;
        for (var i = 0; i < stars.length; i++) {
          var dx = stars[i].x - x, dy = stars[i].y - y;
          if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
        }
        if (ok || attempt === 29) {
          var size = 1.4 + (s.count > 1 ? Math.min(3.2, 1.4 + Math.log(s.count + 1) * 1.1) : 0) + rnd() * 0.7;
          stars.push({ x: x, y: y, label: s.label, group: s.group, count: s.count, size: size });
          placed = true;
          break;
        }
      }
      if (!placed) stars.push({ x: 0.5, y: 0.5, label: s.label, group: s.group, count: s.count, size: 1.4 });
    });

    var lines = [];
    var byGroup = {};
    stars.forEach(function (s) { (byGroup[s.group] = byGroup[s.group] || []).push(s); });
    Object.keys(byGroup).forEach(function (k) {
      var arr = byGroup[k];
      for (var i = 1; i < arr.length; i++) lines.push([arr[i - 1], arr[i]]);
    });

    state.stars = stars;
    state.lines = lines;
    state.truncated = truncated;
    state.total = total;
    state.hash = seed.toString(36);
    countEl.textContent = total + ' 颗星' + (truncated ? '（已省略 ' + truncated + ' 颗，避免糊成一片）' : '') + ' · 同一段文字永远同一片星空';
    updateStatus();
    saveDraft();
    draw();
  }

  function draw() {
    var W = cv.width, Hh = cv.height;
    drawScene(g, W, Hh, false);
  }

  function drawScene(ctx, W, Hh, exporting) {
    var st = styles[state.style];
    var fs = W / 1000;
    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = st.bg;
    ctx.fillRect(0, 0, W, Hh);

    if (state.style === 'classic') {
      for (var i = 0; i < 90; i++) {
        var rx = (i * 73 % 100) / 100, ry = (i * 37 % 100) / 100;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + (i % 5) * 0.02) + ')';
        ctx.beginPath(); ctx.arc(rx * W, ry * Hh, (i % 3) * 0.7 + 0.4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = st.grid;
      ctx.lineWidth = 1;
      for (var x = 0; x < W; x += 40 * fs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hh); ctx.stroke(); }
      for (var y = 0; y < Hh; y += 40 * fs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    var margin = W * 0.055;
    ctx.strokeStyle = st.line;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(margin, margin, W - margin * 2, Hh - margin * 2);

    // header
    ctx.fillStyle = st.muted;
    ctx.font = (13 * fs) + 'px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('纪念星图 / CONSTELLATION', margin + 10 * fs, margin + 30 * fs);
    ctx.textAlign = 'right';
    ctx.fillText(cnDate(dateEl.value), W - margin - 10 * fs, margin + 30 * fs);
    ctx.textAlign = 'left';

    ctx.fillStyle = st.ink;
    ctx.font = '600 ' + (46 * fs) + 'px Georgia,"Songti SC","SimSun",serif';
    var title = titleEl.value.trim() || '未命名星图';
    ctx.fillText(title, margin + 10 * fs, margin + 92 * fs);

    ctx.fillStyle = st.muted;
    ctx.font = (14 * fs) + 'px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
    var occasion = occasionEl.value || '纪念';
    ctx.fillText(occasion + ' · ' + (state.total || 0) + ' 颗星', margin + 12 * fs, margin + 122 * fs);

    // constellation lines
    ctx.strokeStyle = st.line;
    ctx.lineWidth = 1.1 * fs;
    state.lines.forEach(function (pair) {
      var a = pair[0], b = pair[1];
      var ax = margin + a.x * (W - margin * 2), ay = margin + a.y * (Hh - margin * 2);
      var bx = margin + b.x * (W - margin * 2), by = margin + b.y * (Hh - margin * 2);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2 + (by - ay) * 0.03, (ay + by) / 2 + (bx - ax) * 0.03, bx, by);
      ctx.stroke();
    });

    // stars
    state.stars.forEach(function (s) {
      var x = margin + s.x * (W - margin * 2);
      var y = margin + s.y * (Hh - margin * 2);
      var r = s.size * fs;
      if (state.style === 'classic') {
        var grd = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        grd.addColorStop(0, 'rgba(243,233,216,.95)');
        grd.addColorStop(0.35, 'rgba(217,164,65,.35)');
        grd.addColorStop(1, 'rgba(217,164,65,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = st.star;
      ctx.beginPath(); ctx.arc(x, y, Math.max(1.1, r), 0, Math.PI * 2); ctx.fill();
      if (s.count > 1) {
        ctx.strokeStyle = st.accent;
        ctx.lineWidth = 0.9 * fs;
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.1, r) + 2.6 * fs, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // footer
    var footY = Hh - margin - 46 * fs;
    ctx.fillStyle = st.muted;
    ctx.font = (13 * fs) + 'px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
    var sign = signEl.value.trim();
    if (sign) ctx.fillText('—— ' + sign, margin + 10 * fs, footY);
    ctx.textAlign = 'right';
    ctx.fillText('gongjuhe.top · 本图在本地生成', W - margin - 10 * fs, footY);
    ctx.textAlign = 'left';

    if (state.style === 'herbarium') {
      ctx.strokeStyle = st.accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W - margin - 52 * fs, margin + 66 * fs, 30 * fs, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = st.accent;
      ctx.font = (10 * fs) + 'px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('纪念', W - margin - 52 * fs, margin + 62 * fs);
      ctx.fillText('星图', W - margin - 52 * fs, margin + 74 * fs);
      ctx.textAlign = 'left';
    }
    if (state.truncated) {
      ctx.fillStyle = st.muted;
      ctx.font = (11 * fs) + 'px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('已省略 ' + state.truncated + ' 颗星，避免画面过密', margin + 10 * fs, Hh - margin - 22 * fs);
    }
  }

  function exportPng(w, h, name) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    drawScene(ctx, w, h, true);
    c.toBlob(function (blob) {
      if (blob) H.downloadBlob(blob, name);
    }, 'image/png');
    H.toast('正在生成 ' + name);
  }

  /* interactions */
  root.querySelector('#sm2mode').addEventListener('click', function (e) {
    var b = e.target.closest('.sm2-chip'); if (!b) return;
    state.mode = b.dataset.mode;
    updateModeUI();
    build();
  });
  root.querySelector('#sm2style').addEventListener('click', function (e) {
    var b = e.target.closest('.sm2-chip'); if (!b) return;
    state.style = b.dataset.style;
    root.querySelectorAll('#sm2style .sm2-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    build();
  });
  templatesEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tpl]'); if (!b) return;
    var tpl = TEMPLATES[b.dataset.tpl];
    if (!tpl) return;
    state.mode = tpl.mode;
    state.salt = 0;
    titleEl.value = tpl.title;
    dateEl.value = todayISO();
    occasionEl.value = tpl.occasion;
    signEl.value = tpl.sign;
    bodyEl.value = tpl.text;
    updateModeUI();
    build();
    H.toast('已套用模板：' + b.textContent);
  });
  [bodyEl, titleEl, dateEl, occasionEl, signEl].forEach(function (el) {
    el.addEventListener('input', build);
    el.addEventListener('change', build);
  });
  root.querySelector('#sm2shuffle').addEventListener('click', function () { state.salt++; build(); H.toast('换了一片星空'); });
  root.querySelector('#sm2example').addEventListener('click', function () {
    var keys = ['words', 'names', 'letter'];
    exampleIndex = (exampleIndex + 1) % keys.length;
    var k = keys[exampleIndex];
    state.mode = k;
    var ex = EXAMPLES[k];
    titleEl.value = ex.title; dateEl.value = todayISO(); occasionEl.value = ex.occasion; signEl.value = ex.sign; bodyEl.value = ex.text;
    root.querySelectorAll('#sm2mode .sm2-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.mode === k); });
    build();
    H.toast('例子：' + (k === 'words' ? '生日寄语' : k === 'names' ? '团队名单' : '一封短信'));
  });
  root.querySelector('#sm2card').addEventListener('click', function () { exportPng(1080, 1920, '纪念星图-分享卡.png'); });
  root.querySelector('#sm2poster').addEventListener('click', function () { exportPng(2480, 3508, '纪念星图-A4海报.png'); });
  shareBtn.addEventListener('click', function () {
    var url = location.origin + location.pathname + '#s=' + encodeShare();
    if (H.copyText) H.copyText(url, shareBtn);
    else if (navigator.clipboard) navigator.clipboard.writeText(url);
    H.toast('分享链接已复制（不含图片，只含文字与样式）');
  });

  // hover/tap label
  function findStar(e) {
    var r = cv.getBoundingClientRect();
    var mx = (e.clientX - r.left) / r.width * cv.width;
    var my = (e.clientY - r.top) / r.height * cv.height;
    var margin = cv.width * 0.055;
    var best = null, bestD = 1e9;
    state.stars.forEach(function (s) {
      var x = margin + s.x * (cv.width - margin * 2);
      var y = margin + s.y * (cv.height - margin * 2);
      var d = (x - mx) * (x - mx) + (y - my) * (y - my);
      if (d < bestD) { bestD = d; best = s; }
    });
    if (best && bestD < 18 * 18) return best;
    return null;
  }
  function showTip(e) {
    var s = findStar(e);
    if (!s) { tip.classList.remove('on'); return; }
    var r = cv.getBoundingClientRect();
    var margin = cv.width * 0.055;
    var x = (margin + s.x * (cv.width - margin * 2)) / cv.width * r.width;
    var y = (margin + s.y * (cv.height - margin * 2)) / cv.height * r.height;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.textContent = s.label + (s.count > 1 ? ' ×' + s.count : '');
    tip.classList.add('on');
  }
  cv.addEventListener('mousemove', showTip);
  cv.addEventListener('mouseleave', function () { tip.classList.remove('on'); });
  cv.addEventListener('click', function (e) { showTip(e); });

  // init: 分享链接优先，其次草稿，最后默认例子
  var shared = readShare();
  var draft = readDraft();
  if (!applyData(shared) && !applyData(draft)) {
    state.mode = 'words';
    bodyEl.value = EXAMPLES.words.text;
    titleEl.value = EXAMPLES.words.title;
    occasionEl.value = EXAMPLES.words.occasion;
    signEl.value = EXAMPLES.words.sign;
    updateModeUI();
  }
  if (!dateEl.value) dateEl.value = todayISO();
  build();
}
