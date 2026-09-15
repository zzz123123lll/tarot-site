// tools/cover-gen.mjs — 封面图生成(标题 → 平台尺寸封面,纯本地排版,不调用任何 AI)
// 为什么做:网上大量"AI 封面生成"小项目,本质是**模板排版 + 配色 + 字体**(确定性渲染),
// 真正需要模型的只有"凭空画图"。所以这类需求可以做成不用 AI、不用 API Key、不上传的小工具。
export function mount(root, H) {
  H.injectCss(".cv-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start}"
    + "@media (max-width:900px){.cv-wrap{grid-template-columns:1fr}}"
    + ".cv-stage{background:#f5f5f7;border:1px solid var(--c-hairline);border-radius:16px;padding:14px;display:flex;justify-content:center}"
    + ".cv-stage canvas{max-width:100%;height:auto;border-radius:10px;box-shadow:var(--sh-1)}"
    + ".cv-field{margin-bottom:14px}.cv-field label{display:block;font-size:14px;color:#6e6e73;margin-bottom:6px}"
    + ".cv-input{width:100%;padding:10px 12px;border:1px solid var(--c-line-strong);border-radius:10px;font-size:16px;font-family:inherit;background:#fff}"
    + ".cv-chips{display:flex;flex-wrap:wrap;gap:8px}.cv-chip{min-height:44px;padding:0 14px;border:1px solid var(--c-line-strong);background:#fff;border-radius:999px;font-size:14px;cursor:pointer}"
    + ".cv-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".cv-swatches{display:flex;gap:10px}.cv-sw{width:44px;height:44px;border-radius:12px;border:2px solid transparent;cursor:pointer}"
    + ".cv-sw.active{border-color:var(--t-text)}"
    + ".cv-tpls{display:grid;grid-template-columns:1fr 1fr;gap:8px}"
    + ".cv-tpl{text-align:left;min-height:64px;padding:8px 10px;border:1px solid var(--c-line-strong);background:#fff;border-radius:12px;cursor:pointer;font-family:inherit}"
    + ".cv-tpl b{display:block;font-size:13px;color:#1d1d1f;font-weight:600}"
    + ".cv-tpl span{display:block;font-size:11px;color:#6e6e73;line-height:1.4;margin-top:2px}"
    + ".cv-tpl.active{border-color:var(--c-accent);box-shadow:0 0 0 2px rgba(0,113,227,.18)}"
    + ".cv-tpl i{display:block;font-size:11px;color:var(--c-accent-text);font-style:normal;margin-top:4px}"
    + ".cv-el{display:flex;align-items:center;gap:6px;border:1px solid var(--c-line-strong);border-radius:10px;padding:5px 6px;margin-bottom:6px;background:#fff;font-size:13px}"
    + ".cv-el.active{border-color:var(--c-accent);box-shadow:0 0 0 2px rgba(0,113,227,.18)}"
    + ".cv-el .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}"
    + ".cv-el button{min-width:44px;min-height:44px;border:1px solid var(--c-line-strong);background:#fff;border-radius:9px;cursor:pointer;font-family:inherit;font-size:14px}"
    + ".cv-el button:hover{background:#f5f5f7}"
    + ".cv-elhint{font-size:13px;color:#6e6e73;line-height:1.55}"
    + ".cv-elprops{border:1px dashed var(--c-line-strong);border-radius:10px;padding:8px 10px;margin:8px 0}");

  // 规格与安全区(依据见 内部文档/计划-作品线成熟化.md 第 1 节):
  // 除 YouTube 外,各平台官方页是 JS 渲染/反爬,拿到的是第三方汇总,且小红书像素三源不一致 ——
  // 所以这里既给基准也留备选像素,并在页面上把"规格可能变、安全区内不会被裁"如实写出来。
  var SIZES = [
    { id: 'xhs', name: '小红书笔记 3:4', w: 1080, h: 1440, safe: [1080, 1080], note: '进主页/被分享会被裁成 1:1' },
    { id: 'xhs2', name: '小红书(备选像素)', w: 1242, h: 1660, safe: [1242, 1242], note: '另一套流传的像素,同样 3:4' },
    { id: 'wx', name: '公众号首图 2.35:1', w: 900, h: 383, safe: [383, 383], note: '历史列表与分享按 1:1 裁' },
    { id: 'wx2', name: '公众号次条/分享', w: 383, h: 383, safe: [383, 383], note: '方图' },
    { id: 'sph', name: '视频号竖版 6:7', w: 1080, h: 1260, note: '公开汇总称不会被二次裁切' },
    { id: 'bili', name: 'B站横版 16:10', w: 1146, h: 717 },
    { id: 'yt', name: 'YouTube 16:9', w: 1280, h: 720, safe: [1280, 640], note: '右下有时长角标,底部有进度条' },
    { id: 'square', name: '方图 1:1', w: 1080, h: 1080 }
  ];
  // 模板 = 规格 + 版式骨架 + 配色倾向(自己重画,不搬运任何现成模板的图形与素材)
  var TEMPLATES = [
    { id: 'xhs-bold', name: '小红书 · 大标题', cat: '小红书笔记', size: 'xhs', style: 'bold', align: 'left', desc: '左色块 + 大标题,适合干货清单' },
    { id: 'xhs-quote', name: '小红书 · 居中金句', cat: '小红书笔记', size: 'xhs', style: 'paper', align: 'center', desc: '纸感底 + 居中大字,适合金句/摘录' },
    { id: 'xhs-dark', name: '小红书 · 深色标题', cat: '小红书笔记', size: 'xhs', style: 'dark', align: 'left', desc: '深底白字,信息流里更跳' },
    { id: 'wx-band', name: '公众号 · 色块标题', cat: '公众号', size: 'wx', style: 'bold', align: 'center', desc: '横版首图,标题居中 + 角标' },
    { id: 'wx-square', name: '公众号 · 次条方图', cat: '公众号', size: 'wx2', style: 'gradient', align: 'center', desc: '次条与分享用方图' },
    { id: 'sph-top', name: '视频号 · 顶部大字', cat: '视频号/抖音', size: 'sph', style: 'outline', align: 'center', desc: '竖版留出人物位置' },
    { id: 'bili-left', name: 'B站 · 左字右图', cat: 'B站', size: 'bili', style: 'bold', align: 'left', desc: '左文右图,右侧留给人脸或截图' },
    { id: 'yt-wide', name: 'YouTube · 大字留角', cat: 'YouTube', size: 'yt', style: 'gradient', align: 'center', desc: '右下角留空给时长角标' },
    { id: 'card', name: '金句卡 · 居中', cat: '金句/海报', size: 'square', style: 'paper', align: 'center', desc: '方图,适合摘录与转发' }
  ];
  var STYLES = [
    { id: 'bold', name: '大字报' }, { id: 'dark', name: '深色' }, { id: 'gradient', name: '渐变' },
    { id: 'paper', name: '纸感' }, { id: 'outline', name: '描边' }
  ];
  var COLORS = ['#0071e3', '#F2416B', '#8AA169', '#6467E6', '#B6975A', '#1d1d1f'];
  // 叠加元素的状态必须在这里声明:writeEls() 在 mount 早期就会被调用一次,
  // 而 var 是"提升声明、不提升赋值" —— 声明写在后面的话,那一刻 elements 还是 undefined(实测报错)。
  var elements = [], selId = null, elSeq = 0;
  // "我的模板"的常量也必须在最前面:它会被 mount 早期的 paintMt() 读到,
  // 放在后面就是又一次 var 提升坑(读到的 MT_KEY 是 undefined,已保存的模板显示不出来)。
  var MT_KEY = 'tb-covers', MT_MAX = 24, MT_IMG_LIMIT = 400000;
  // 导出时不能把"选中框"画进去:导出走的就是预览那块画布,不区分的话虚线框会被烙进成品
  var exporting = false;
  var drag = null, guides = [];   // 拖动/缩放的临时状态与吸附参考线
  // 撤销/重做:元素层的每次改动前都留一份快照(纯 JSON,元素很少,60 步足够用)。
  // 依据:同类编辑器把撤销列为标配(avnac README 的交互清单),而"手滑删错一个元素"是真实痛点。
  // 图片元素不能进 JSON 快照(Image 对象没法序列化)—— 单独一张表按 key 存,
  // 快照里只留 key;不这样做的话,撤销一步回来图就变空白。
  var imgStore = {};
  var history = [], hIdx = -1, HIST_MAX = 60;
  function snapShot() { return JSON.stringify({ elements: elements, selId: selId }); }
  function pushHistory() {
    history = history.slice(0, hIdx + 1);
    history.push(snapShot());
    if (history.length > HIST_MAX) history.shift();
    hIdx = history.length - 1;
    paintHist();
  }
  function applyHistory(i) {
    if (i < 0 || i >= history.length) return;
    var s = JSON.parse(history[i]);
    elements = s.elements; selId = s.selId; hIdx = i;
    elements.forEach(function (el) { if (el.imgKey && imgStore[el.imgKey]) el.img = imgStore[el.imgKey].img; });
    writeEls(); render(); paintHist(); updateTouch();
  }
  function undo() { if (hIdx > 0) { applyHistory(hIdx - 1); H.toast('已撤销', { ms: 2600 }); } }
  function redo() { if (hIdx < history.length - 1) { applyHistory(hIdx + 1); H.toast('已重做', { ms: 2600 }); } }
  function paintHist() {
    var u = root.querySelector('#undo'), r = root.querySelector('#redo');
    if (u) u.disabled = hIdx <= 0;
    if (r) r.disabled = hIdx >= history.length - 1;
  }
  var state = { tpl: 'xhs-bold', size: 'xhs', style: 'bold', color: '#0071e3', align: 'left', title: '把文件改到能通过为止', sub: '22 个本地小工具 · 不上传不注册', tag: '' };

  root.innerHTML =
    '<h1 class="tool-h1">封面图生成</h1>' +
    '<p class="tool-sub">输入标题,直接出平台尺寸的封面图。这是"AI 封面生成"里**不需要 AI 的那部分** —— 模板排版、配色、字体全在本机算,不联网、不用 Key、不上传。</p>' +
    '<div class="cv-wrap">' +
      '<div><div class="cv-stage"><canvas id="cv" width="1080" height="1440" aria-label="封面预览"></canvas></div>' +
      '<div class="tool-row" style="margin-top:14px"><button class="tool-btn" id="dl">下载 PNG</button>' +
      '<button class="tool-btn tool-btn--ghost" id="set">导出一套尺寸(ZIP)</button>' +
      '<span class="idp-hint" id="info"></span></div></div>' +
      '<div>' +
        '<div class="cv-field"><label>模板(' + TEMPLATES.length + ' 个版式骨架,选中即套用规格与配色)</label><div class="cv-tpls" id="tpl"></div></div>' +
        '<div class="cv-field"><label for="t">标题(会按宽度自动换行、自动缩放字号)</label>' +
        '<textarea class="cv-input" id="t" rows="3" spellcheck="false"></textarea></div>' +
        '<div class="cv-field"><label for="s">副标题(可留空)</label><input class="cv-input" id="s"></div>' +
        '<div class="cv-field"><label for="g">角标(可留空,如"第 3 期")</label><input class="cv-input" id="g"></div>' +
        '<div class="cv-field"><label>尺寸</label><div class="cv-chips" id="sz"></div></div>' +
        '<div class="cv-field"><label>风格</label><div class="cv-chips" id="st"></div></div>' +
        '<div class="cv-field"><label>强调色</label><div class="cv-swatches" id="co"></div></div>' +
        '<div class="cv-field"><label>对齐</label><div class="cv-chips" id="al"><button class="cv-chip active" data-a="left">左对齐</button><button class="cv-chip" data-a="center">居中</button></div></div>' +
        '<div class="cv-field"><label>我的模板(存在本机,下次一键载入)</label>' +
          '<div class="tool-row" style="margin-bottom:8px"><input class="cv-input" id="mtName" placeholder="给它起个名(如:小店活动)" style="flex:1;min-width:120px">' +
          '<button class="tool-btn tool-btn--ghost" id="mtSave">保存当前</button></div>' +
          '<div id="mtList"></div></div>' +
        '<div class="cv-field"><label>叠加元素(模板之上的文字/色块,可增删、调序)</label>' +
          '<div class="tool-row" style="margin-bottom:8px"><button class="tool-btn tool-btn--ghost" id="addText">+ 文字</button>' +
          '<button class="tool-btn tool-btn--ghost" id="addBlock">+ 色块</button>' +
          '<button class="tool-btn tool-btn--ghost" id="addPic">+ 图片</button>' +
          '<button class="tool-btn tool-btn--ghost" id="undo">撤销</button>' +
          '<button class="tool-btn tool-btn--ghost" id="redo">重做</button></div>' +
          '<div class="cv-elprops" id="elprops" style="display:none"></div>' +
          '<div id="els"></div></div>' +
        '<div class="cv-field"><label><input type="checkbox" id="safe"> 显示安全区(不会被平台裁掉的范围)</label></div>' +
        '<div class="idp-hint">编辑器:选中元素后可以直接在画布上<b>拖动</b>,拖四角<b>缩放</b>;挪到中线或边距会<b>吸附</b>并出现粉色参考线(只在编辑时显示,导出图干净)。</div>' +
        '<div class="idp-hint">提示:标题越短字越大;所有文字按最大可用字号自动排版,不会溢出画布。规格来自公开汇总、平台会调整,' +
        '所以导出前建议对照平台后台确认;安全区内的内容不会在列表/分享里被裁。</div>' +
      '</div>' +
    '</div>' +
    '<div class="results" id="out"></div>';

  var cv = root.querySelector('#cv'), g = cv.getContext('2d');
  var info = root.querySelector('#info');

  function chips(box, list, key, fmt) {
    box.innerHTML = list.map(function (x, i) {
      return '<button class="cv-chip' + (state[key] === x.id ? ' active' : '') + '" data-v="' + x.id + '">' + fmt(x) + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.cv-chip'); if (!b) return;
      state[key] = b.dataset.v;
      box.querySelectorAll('.cv-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
      render();
    });
  }
  chips(root.querySelector('#sz'), SIZES, 'size', function (x) { return x.name + ' · ' + x.w + '×' + x.h; });
  var tplBox = root.querySelector('#tpl');
  function drawTpls() {
    tplBox.innerHTML = TEMPLATES.map(function (t) {
      var s = SIZES.filter(function (z) { return z.id === t.size; })[0];
      return '<button class="cv-tpl' + (state.tpl === t.id ? ' active' : '') + '" data-t="' + t.id + '"><b>' + H.esc(t.name) + '</b>'
        + '<span>' + H.esc(t.desc) + '</span><i>' + H.esc(t.cat) + ' · ' + s.w + '×' + s.h + '</i></button>';
    }).join('');
  }
  tplBox.addEventListener('click', function (e) {
    var b = e.target.closest('.cv-tpl'); if (!b) return;
    var t = TEMPLATES.filter(function (x) { return x.id === b.dataset.t; })[0]; if (!t) return;
    state.tpl = t.id; state.size = t.size; state.style = t.style; state.align = t.align;
    // 让"尺寸/风格/对齐"三组 chips 跟着模板走,避免界面自相矛盾
    root.querySelectorAll('#sz .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === t.size); });
    root.querySelectorAll('#st .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === t.style); });
    root.querySelectorAll('#al .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.a === t.align); });
    drawTpls(); render();
  });
  root.querySelector('#safe').addEventListener('change', function () { render(); });
  root.querySelector('#undo').addEventListener('click', undo);
  root.querySelector('#redo').addEventListener('click', redo);
  document.addEventListener('keydown', function (ev) {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    var k = (ev.key || '').toLowerCase();
    if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); undo(); }
    else if ((k === 'z' && ev.shiftKey) || k === 'y') { ev.preventDefault(); redo(); }
  });
  root.querySelector('#mtSave').addEventListener('click', saveMyTemplate);
  root.querySelector('#mtList').addEventListener('click', function (ev) {
    var row = ev.target.closest('.cv-el'); if (!row) return;
    var i = parseInt(row.dataset.mi, 10);
    var btn = ev.target.closest('button');
    if (btn && btn.dataset.mact === 'del') { delMyTemplate(i); return; }
    loadMyTemplate(i);
  });
  paintMt();
  root.querySelector('#addText').addEventListener('click', function () { addElement('text'); });
  root.querySelector('#addBlock').addEventListener('click', function () { addElement('block'); });
  root.querySelector('#addPic').addEventListener('click', pickImage);
  root.querySelector('#els').addEventListener('click', function (ev) {
    var row = ev.target.closest('.cv-el');
    var btn = ev.target.closest('button');
    if (btn && row) {
      var id = parseInt(row.dataset.id, 10);
      if (btn.dataset.act === 'del') delEl(id);
      else moveEl(id, btn.dataset.act === 'up' ? -1 : 1);
      return;
    }
    if (row) { selId = parseInt(row.dataset.id, 10); writeEls(); render(); }
  });
  // 自测钩子:端到端脚本要能读到元素真实坐标(不然只能靠像素猜) —— 只读,不参与渲染
  root.__cvState = function () {
    return { elements: elements.map(function (e) { return { id: e.id, type: e.type, x: e.x, y: e.y, w: e.w, h: e.h, imgKey: e.imgKey || null, hasImg: !!(e.img && e.img.width) }; }), selId: selId, guides: guides.length, imgs: Object.keys(imgStore).length };
  };
  updateTouch();
  writeEls(); pushHistory();   // 初始状态也进历史:撤销按钮一开始是禁用的
  paintHist();
  paintMt();   // 放在 mount 末尾再渲染一次"我的模板":早先那次渲染出来的还是空状态(已保存的读不出来)
  drawTpls(); // 首屏就要把模板列出来 —— 第一版漏了这一次调用,模板区是空的(端到端测试当场抓到)
  chips(root.querySelector('#st'), STYLES, 'style', function (x) { return x.name; });
  root.querySelector('#co').innerHTML = COLORS.map(function (c) {
    return '<button class="cv-sw' + (c === state.color ? ' active' : '') + '" data-c="' + c + '" aria-label="强调色 ' + c + '" style="background:' + c + '"></button>';
  }).join('');
  root.querySelector('#co').addEventListener('click', function (e) {
    var b = e.target.closest('.cv-sw'); if (!b) return;
    state.color = b.dataset.c;
    root.querySelectorAll('.cv-sw').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  root.querySelector('#al').addEventListener('click', function (e) {
    var b = e.target.closest('.cv-chip'); if (!b) return;
    state.align = b.dataset.a;
    root.querySelectorAll('#al .cv-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  var ta = root.querySelector('#t'), si = root.querySelector('#s'), gi = root.querySelector('#g');
  ta.value = state.title; si.value = state.sub;
  [ta, si, gi].forEach(function (el) {
    el.addEventListener('input', function () {
      state.title = ta.value; state.sub = si.value; state.tag = gi.value;
      render();
    });
  });

  // ---------- 叠加元素(编辑器第一步:图层模型 + 增删 + 选中 + 调序) ----------
  // 为什么用"叠在模板之上"而不是推翻模板:模板渲染已经过端到端验证,推翻它风险大;
  // 元素层是加法 —— 每个元素用**相对坐标**(0~1),所以换尺寸/一稿多尺寸导出时自动按比例缩放。
  var EL_NAME = { text: '文字', block: '色块', image: '图片' };
  function selEl() { return elements.filter(function (e) { return e.id === selId; })[0] || null; }
  function addElement(type) {
    var n = elements.length;
    elements.push({
      id: ++elSeq, type: type, text: type === 'text' ? '一行文字' : '',
      // 默认落在下半部空白处(第一版放在 0.62,正好压在模板副标题上 —— 导出图里一眼看出来)
      x: 0.10, y: 0.70 + (n % 3) * 0.08, w: type === 'block' ? 0.34 : 0.62, h: type === 'block' ? 0.10 : 0.14,
      fs: type === 'block' ? 0.035 : 0.05, color: type === 'block' ? state.color : (state.style === 'dark' || state.style === 'gradient' ? '#ffffff' : '#111114'),
      align: 'left'
    });
    selId = elements[elements.length - 1].id;
    writeEls(); render(); pushHistory();
    H.toast('已加一个' + EL_NAME[type] + '元素 —— 在下面改文字、字号、颜色与对齐', { ms: 4200 });
  }
  // 图片元素:读进来后按原比例摆好(不拉伸变形),之后可以拖动/缩放/吸附
  var imgInput = null;
  function addImageElement(file) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    var im = new Image();
    im.onload = function () {
      var id = ++elSeq, key = 'img' + id;
      imgStore[key] = { img: im, name: file.name || '图片', url: url };
      var boxW = 0.40, boxH = boxW * (im.height / im.width) * (cv.width / cv.height);
      boxH = Math.max(0.06, Math.min(0.6, boxH));
      elements.push({ id: id, type: 'image', imgKey: key, img: im, name: imgStore[key].name, x: 0.30, y: 0.16, w: boxW, h: boxH, fs: 0.05, color: '#111114', align: 'left' });
      selId = id;
      writeEls(); render(); pushHistory();
      H.toast('已加图片元素:' + imgStore[key].name + ' —— 可拖动、拖角缩放', { ms: 4200 });
    };
    im.onerror = function () { H.toast('这张图读不了,换一张试试', { ms: 4200 }); URL.revokeObjectURL(url); };
    im.src = url;
  }
  function pickImage() {
    if (!imgInput) {
      imgInput = document.createElement('input');
      imgInput.type = 'file';
      imgInput.accept = 'image/*';
      imgInput.style.display = 'none';
      document.body.appendChild(imgInput);
      imgInput.addEventListener('change', function () { addImageElement(imgInput.files && imgInput.files[0]); imgInput.value = ''; });
    }
    imgInput.click();
  }
  function moveEl(id, dir) {
    var i = -1;
    elements.forEach(function (e, k) { if (e.id === id) i = k; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= elements.length) return;
    var tmp = elements[i]; elements[i] = elements[j]; elements[j] = tmp;
    writeEls(); render(); pushHistory();
  }
  function delEl(id) { elements = elements.filter(function (e) { return e.id !== id; }); if (selId === id) selId = null; writeEls(); render(); pushHistory(); }
  function zOrder(id, top) {
    var i = -1; elements.forEach(function (e, k) { if (e.id === id) i = k; });
    if (i < 0) return;
    var e2 = elements.splice(i, 1)[0];
    if (top) elements.push(e2); else elements.unshift(e2);
    writeEls(); render(); pushHistory();
  }
  function writeEls() {
    var box = root.querySelector('#els'); if (!box) return;
    box.innerHTML = elements.length ? elements.map(function (e, i) {
      return '<div class="cv-el' + (e.id === selId ? ' active' : '') + '" data-id="' + e.id + '">'
        + '<span class="t" data-pick="1">' + (i + 1) + '. ' + EL_NAME[e.type] + (e.text ? ' · ' + H.esc(e.text.slice(0, 10)) : (e.type === 'image' && e.name ? ' · ' + H.esc(e.name.slice(0, 12)) : '')) + '</span>'
        + '<button data-act="up" aria-label="上移">↑</button><button data-act="down" aria-label="下移">↓</button><button data-act="del" aria-label="删除">×</button></div>';
    }).join('') : '<div class="cv-elhint">还没有叠加元素。模板是底子,这里可以再叠文字或色块(点上面的按钮)。</div>';
    var box2 = root.querySelector('#elprops');
    var e = selEl();
    if (!box2) return;
    if (!e) { box2.style.display = 'none'; return; }
    box2.style.display = 'block';
    box2.innerHTML = (e.type === 'text'
        ? '<div class="cv-field" style="margin-bottom:8px"><label for="elText">元素文字</label><input class="cv-input" id="elText" value="' + H.esc(e.text) + '"></div>'
        : '')
      + (e.type === 'image'
          ? '<div class="cv-field" style="margin-bottom:8px"><label>图片:' + H.esc(e.name || '') + '</label><div class="tool-row"><button class="tool-btn tool-btn--ghost" id="elSwap">换一张</button></div></div>'
          : '')
      + '<div class="cv-field" style="margin-bottom:8px"><label for="elFs">' + (e.type === 'image' ? '（图片不用字号,拖角缩放）' : '字号(相对画布宽度)') + '<span id="elFsV"> ' + Math.round(e.fs * 100) + '%</span></label>'
      + '<input class="cv-input" id="elFs" type="range" min="1.5" max="12" step="0.5" value="' + (e.fs * 100) + '"></div>'
      + '<div class="cv-field" style="margin-bottom:8px"><label for="elColor">颜色</label><input class="cv-input" id="elColor" type="color" value="' + e.color + '" style="height:44px;padding:4px"></div>'
      + '<div class="cv-field" style="margin-bottom:8px"><label>图层顺序</label><div class="tool-row">' +
        '<button class="tool-btn tool-btn--ghost" id="elTop">置顶</button><button class="tool-btn tool-btn--ghost" id="elBottom">置底</button></div></div>'
      + '<div class="cv-field" style="margin-bottom:0"><label>对齐</label><div class="cv-chips" id="elAlign">'
      + ['left:左', 'center:中', 'right:右'].map(function (x) {
          var v = x.split(':');
          return '<button class="cv-chip' + (e.align === v[0] ? ' active' : '') + '" data-a="' + v[0] + '">' + v[1] + '</button>';
        }).join('') + '</div></div>';
    var t = box2.querySelector('#elText');
    // 文字用 change 而不是 input 记历史:否则每敲一个字都进历史,撤销要按很多次才回到上一步
    if (t) t.addEventListener('input', function () { e.text = t.value; writeEls(); render(); });
    if (t) t.addEventListener('change', function () { pushHistory(); });
    var sw = box2.querySelector('#elSwap');
    if (sw) sw.addEventListener('click', function () {
      // 换图:替换同一元素的图片,历史里也换掉(否则撤销会回到旧图)
      var old = e.imgKey;
      var pick = document.createElement('input');
      pick.type = 'file'; pick.accept = 'image/*';
      pick.addEventListener('change', function () {
        var file = pick.files && pick.files[0]; if (!file) return;
        var url = URL.createObjectURL(file), nim = new Image();
        nim.onload = function () {
          var key = 'img' + e.id + '-' + Date.now();
          imgStore[key] = { img: nim, name: file.name || '图片', url: url };
          e.imgKey = key; e.img = nim; e.name = imgStore[key].name;
          if (old && imgStore[old]) { try { URL.revokeObjectURL(imgStore[old].url); } catch (err) {} }
          writeEls(); render(); pushHistory();
        };
        nim.src = url;
      });
      pick.click();
    });
    var zb = box2.querySelector('#elTop'), zb2 = box2.querySelector('#elBottom');
    if (zb) zb.addEventListener('click', function () { zOrder(e.id, true); });
    if (zb2) zb2.addEventListener('click', function () { zOrder(e.id, false); });
    var fs = box2.querySelector('#elFs');
    if (fs) fs.addEventListener('input', function () { e.fs = parseFloat(fs.value) / 100; box2.querySelector('#elFsV').textContent = ' ' + Math.round(e.fs * 100) + '%'; render(); });
    var co = box2.querySelector('#elColor');
    if (co) co.addEventListener('input', function () { e.color = co.value; render(); });
    if (co) co.addEventListener('change', function () { pushHistory(); });
    var al = box2.querySelector('#elAlign');
    if (al) al.addEventListener('click', function (ev) {
      var b = ev.target.closest('.cv-chip'); if (!b) return;
      e.align = b.dataset.a; al.querySelectorAll('.cv-chip').forEach(function (x) { x.classList.toggle('active', x === b); }); render(); pushHistory();
    });
  }
  // ---------- 第二步:画布上拖动 / 缩放 / 对齐吸附 ----------
  // 触屏友好:只有"选中了元素"时才把 touch-action 设为 none(否则手指落在画布上会把页面滚动卡住)。
  function updateTouch() { cv.style.touchAction = (elements.length && selId) ? 'none' : 'auto'; }
  function cvPoint(ev) {
    var r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height };
  }
  function hitEl(p) {
    for (var i = elements.length - 1; i >= 0; i--) {
      var e2 = elements[i];
      if (p.x >= e2.x && p.x <= e2.x + e2.w && p.y >= e2.y && p.y <= e2.y + e2.h) return e2;
    }
    return null;
  }
  var HANDLE = 0.028, SNAP = 0.014;
  function hitHandle(el, p) {
    if (!el) return null;
    var ry = HANDLE * (cv.width / cv.height);
    var hs = [['nw', el.x, el.y], ['ne', el.x + el.w, el.y], ['sw', el.x, el.y + el.h], ['se', el.x + el.w, el.y + el.h]];
    for (var i = 0; i < hs.length; i++) if (Math.abs(p.x - hs[i][1]) < HANDLE && Math.abs(p.y - hs[i][2]) < ry) return hs[i][0];
    return null;
  }
  function snapTo(v, targets) {
    for (var i = 0; i < targets.length; i++) if (Math.abs(v - targets[i]) < SNAP) return targets[i];
    return v;
  }
  cv.addEventListener('pointerdown', function (ev) {
    if (!elements.length) return;
    var p = cvPoint(ev), sel = selEl();
    var h = hitHandle(sel, p);
    if (h && sel) {   // 先判手柄:角上优先缩放
      pushHistory();   // 先记"拖之前"的状态,撤销才能回到原位
      drag = { id: sel.id, mode: 'resize', h: h, sx: p.x, sy: p.y, ow: sel.w, oh: sel.h, x0: sel.x, y0: sel.y };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      ev.preventDefault(); updateTouch(); return;
    }
    var t = hitEl(p);
    if (!t) return;   // 点空白处不抢事件,页面照常滚动
    selId = t.id; writeEls(); render();
    pushHistory();
    drag = { id: t.id, mode: 'move', sx: p.x, sy: p.y, x0: t.x, y0: t.y };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    if (ev.cancelable) ev.preventDefault();
    updateTouch();
  });
  cv.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var p = cvPoint(ev), el = selEl();
    if (!el || el.id !== drag.id) return;
    guides = [];
    if (drag.mode === 'move') {
      var cand = { x: drag.x0 + (p.x - drag.sx), y: drag.y0 + (p.y - drag.sy) };
      var vx = [0.08, 0.5 - el.w / 2, 0.92 - el.w];
      var hy = [0.08, 0.5 - el.h / 2, 0.92 - el.h];
      elements.forEach(function (o) {
        if (o.id === el.id) return;
        vx.push(o.x, o.x + o.w - el.w, o.x + o.w / 2 - el.w / 2);
        hy.push(o.y, o.y + o.h - el.h, o.y + o.h / 2 - el.h / 2);
      });
      var nx = snapTo(cand.x, vx), ny = snapTo(cand.y, hy);
      if (nx !== cand.x) guides.push({ v: nx + el.w / 2 });
      if (ny !== cand.y) guides.push({ h: ny + el.h / 2 });
      cand.x = nx; cand.y = ny;
      el.x = Math.max(0, Math.min(1 - el.w, cand.x));
      el.y = Math.max(0, Math.min(1 - el.h, cand.y));
    } else {
      var w = drag.ow + (drag.h.indexOf('e') >= 0 ? (p.x - drag.sx) : (drag.sx - p.x));
      var hh = drag.oh + (drag.h.indexOf('s') >= 0 ? (p.y - drag.sy) : (drag.sy - p.y));
      w = Math.max(0.08, Math.min(1, w)); hh = Math.max(0.04, Math.min(1, hh));
      if (drag.h.indexOf('w') >= 0) el.x = Math.max(0, Math.min(1 - w, drag.x0 + (drag.ow - w)));
      if (drag.h.indexOf('n') >= 0) el.y = Math.max(0, Math.min(1 - hh, drag.y0 + (drag.oh - hh)));
      el.w = w; el.h = hh;
    }
    render();
  });
  function endDrag() { if (!drag) return; drag = null; guides = []; render(); writeEls(); updateTouch(); pushHistory(); }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  // ---------- 我的模板:把"模板选择 + 文案 + 元素"整体存在本机 ----------
  // 只用 localStorage,不上传(与全站一致)。图片元素存成 dataURL,过大的就不存并如实说明。
  function mtRead() { try { var a = JSON.parse(localStorage.getItem(MT_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function mtWrite(a) { try { localStorage.setItem(MT_KEY, JSON.stringify(a.slice(0, MT_MAX))); } catch (e) { H.toast('本机存储写不进去了(可能已满)', { ms: 4200 }); } }
  function paintMt() {
    var box = root.querySelector('#mtList'); if (!box) return;
    var list = mtRead();
    box.innerHTML = list.length ? list.map(function (m, i) {
      return '<div class="cv-el" data-mi="' + i + '"><span class="t" data-load="1">' + H.esc(m.name) + ' · ' + H.esc(m.size) + (m.elements && m.elements.length ? ' · ' + m.elements.length + ' 个元素' : '') + '</span>'
        + '<button data-mact="load" aria-label="载入">载入</button><button data-mact="del" aria-label="删除">×</button></div>';
    }).join('') : '<div class="cv-elhint">还没有保存过。调好版式与元素后,起个名字点「保存当前」。</div>';
  }
  function saveMyTemplate() {
    var nameEl = root.querySelector('#mtName');
    var name = (nameEl && nameEl.value || '').trim() || ('我的封面 ' + (mtRead().length + 1));
    var skipped = 0;
    var els = [];
    elements.forEach(function (e) {
      if (e.type === 'image') {
        var rec = e.imgKey ? imgStore[e.imgKey] : null, im = e.img || (rec && rec.img);
        if (!im || !im.width) { skipped++; return; }
        try {
          var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
          c.getContext('2d').drawImage(im, 0, 0);
          var du = c.toDataURL('image/png');
          if (du.length > MT_IMG_LIMIT) { skipped++; return; }
          els.push({ type: 'image', dataUrl: du, name: e.name, x: e.x, y: e.y, w: e.w, h: e.h, align: e.align });
          return;
        } catch (err) { skipped++; return; }
      }
      els.push({ type: e.type, text: e.text, x: e.x, y: e.y, w: e.w, h: e.h, fs: e.fs, color: e.color, align: e.align });
    });
    var list = mtRead();
    list.unshift({ name: name, tpl: state.tpl, size: state.size, style: state.style, align: state.align, color: state.color,
      title: root.querySelector('#t').value, sub: root.querySelector('#s').value, tag: root.querySelector('#g').value, elements: els });
    mtWrite(list);
    if (nameEl) nameEl.value = '';
    paintMt();
    H.toast('已保存「' + name + '」' + (skipped ? '(有 ' + skipped + ' 个图片元素太大,没有存进去)' : ''), { ms: 5200 });
  }
  function loadMyTemplate(i) {
    var m = mtRead()[i]; if (!m) return;
    state.tpl = m.tpl; state.size = m.size; state.style = m.style; state.align = m.align; state.color = m.color;
    root.querySelector('#t').value = m.title || ''; root.querySelector('#s').value = m.sub || ''; root.querySelector('#g').value = m.tag || '';
    root.querySelectorAll('#sz .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === m.size); });
    root.querySelectorAll('#st .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === m.style); });
    root.querySelectorAll('#al .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.a === m.align); });
    elements = []; selId = null;
    (m.elements || []).forEach(function (src) {
      var id = ++elSeq;
      var e2 = { id: id, type: src.type, text: src.text || '', x: src.x, y: src.y, w: src.w, h: src.h,
        fs: src.fs || 0.05, color: src.color || state.color, align: src.align || 'left', name: src.name };
      elements.push(e2);
      if (src.type === 'image' && src.dataUrl) {
        var key = 'img' + id;
        var im = new Image();
        im.onload = function () { imgStore[key] = { img: im, name: src.name || '图片' }; e2.imgKey = key; e2.img = im; render(); };
        im.src = src.dataUrl;
        e2.imgKey = key;
      }
    });
    drawTpls(); writeEls(); render(); pushHistory(); paintMt();
    H.toast('已载入「' + m.name + '」', { ms: 3600 });
  }
  function delMyTemplate(i) {
    var list = mtRead();
    var nm = list[i] ? list[i].name : '';
    list.splice(i, 1); mtWrite(list); paintMt();
    H.toast('已删除「' + nm + '」', { ms: 3200 });
  }

  function drawElements(g2, W2, H2) {
    elements.forEach(function (e) {
      var x = e.x * W2, y = e.y * H2, w = e.w * W2, h = e.h * H2;
      if (e.type === 'image') {
        var rec = e.imgKey ? imgStore[e.imgKey] : null;
        var im2 = e.img || (rec && rec.img);
        if (im2 && im2.width) {
          var ir = im2.width / im2.height, br = w / h;   // 等比适配:contain,不拉伸
          var dw = ir > br ? w : h * ir, dh = ir > br ? w / ir : h;
          g2.drawImage(im2, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        }
      } else if (e.type === 'block') {
        g2.fillStyle = e.color;
        var r = Math.min(18, h / 2);
        g2.beginPath();
        g2.moveTo(x + r, y); g2.arcTo(x + w, y, x + w, y + h, r); g2.arcTo(x + w, y + h, x, y + h, r);
        g2.arcTo(x, y + h, x, y, r); g2.arcTo(x, y, x + w, y, r); g2.closePath(); g2.fill();
      } else {
        var fs2 = Math.max(10, Math.round(e.fs * W2));
        var font2 = '700 ' + fs2 + 'px ' + FONT();
        g2.font = font2; g2.fillStyle = e.color; g2.textBaseline = 'top';
        var ls2 = wrapSize(e.text || ' ', font2, w).slice(0, 4);
        ls2.forEach(function (ln, k) {
          var yy = y + k * fs2 * 1.2;
          if (e.align === 'center') { g2.textAlign = 'center'; g2.fillText(ln, x + w / 2, yy); }
          else if (e.align === 'right') { g2.textAlign = 'right'; g2.fillText(ln, x + w, yy); }
          else { g2.textAlign = 'left'; g2.fillText(ln, x, yy); }
        });
        g2.textAlign = 'left';
      }
      if (e.id === selId && !exporting) {   // 选中框只在编辑时画,导出必须干净
        g2.save();
        g2.strokeStyle = 'rgba(0,113,227,.95)'; g2.lineWidth = 3; g2.setLineDash([10, 7]);
        g2.strokeRect(x - 4, y - 4, w + 8, h + 8); g2.setLineDash([]);
        // 四个角手柄:提示"这里可以拉大小"
        g2.fillStyle = '#0071e3';
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(function (hh) { g2.fillRect(hh[0] - 7, hh[1] - 7, 14, 14); });
        g2.restore();
      }
    });
  }
  // 元素换行要用"独立度量",不能借用主画布的 g(多尺寸导出时字号不同,复用会错行)
  var _mc = document.createElement('canvas'), _mg = _mc.getContext('2d');
  function wrapSize(text, font, maxW) {
    _mg.font = font;
    var out = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      var test = cur + ch;
      if (_mg.measureText(test).width > maxW && cur) { out.push(cur); cur = ch; } else { cur = test; }
    }
    if (cur) out.push(cur);
    return out;
  }

  function sizeOf() { return SIZES.filter(function (s) { return s.id === state.size; })[0]; }
  function FONT(w) { return '"Geist", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'; }

  function wrap(text, font, maxW) {
    g.font = font;
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') { lines.push(cur); cur = ''; continue; }
      var test = cur + ch;
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch; } else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function render() {
    var s = sizeOf();
    cv.width = s.w; cv.height = s.h;
    var W = s.w, Hh = s.h, pad = Math.round(W * 0.08);
    var accent = state.color;
    // 背景
    if (state.style === 'dark') { g.fillStyle = '#111114'; g.fillRect(0, 0, W, Hh); }
    else if (state.style === 'gradient') {
      var lg = g.createLinearGradient(0, 0, W, Hh);
      lg.addColorStop(0, accent); lg.addColorStop(1, '#111114');
      g.fillStyle = lg; g.fillRect(0, 0, W, Hh);
    } else if (state.style === 'paper') { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, Hh); }
    else { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, Hh); }
    // 大字报:左侧色块
    if (state.style === 'bold') { g.fillStyle = accent; g.fillRect(0, 0, Math.round(W * 0.035), Hh); }
    // 描边:内框
    if (state.style === 'outline') {
      g.strokeStyle = accent; g.lineWidth = Math.max(6, Math.round(W * 0.006));
      g.strokeRect(pad * 0.55, pad * 0.55, W - pad * 1.1, Hh - pad * 1.1);
    }
    var dark = state.style === 'dark' || state.style === 'gradient';
    var textColor = dark ? '#ffffff' : '#111114';
    var subColor = dark ? 'rgba(255,255,255,.82)' : '#5b5b60';
    var maxW = W - pad * 2;
    // 标题:从大字号往下试,选能放进"标题区"的最大字号
    var maxTitleH = Hh - pad * 2 - Math.round(Hh * 0.16);
    var chosen = Math.round(W * 0.16), lines = [];
    for (var fs = chosen; fs >= Math.round(W * 0.045); fs -= 2) {
      var f = '700 ' + fs + 'px ' + FONT();
      var ls = wrap(state.title || '在这里写标题', f, maxW);
      g.font = f;
      if (ls.length * fs * 1.22 <= maxTitleH) { chosen = fs; lines = ls; break; }
      chosen = fs; lines = ls;
    }
    var titleFont = '700 ' + chosen + 'px ' + FONT();
    g.font = titleFont;
    g.textBaseline = 'top';
    var subFont = '500 ' + Math.round(chosen * 0.34) + 'px ' + FONT();
    var subLines = state.sub ? wrap(state.sub, subFont, maxW).slice(0, 3) : [];
    var titleLH = chosen * 1.22, subLH = Math.round(chosen * 0.34) * 1.5;
    var blockH = lines.length * titleLH + (subLines.length ? subLH * subLines.length + chosen * 0.5 : 0);
    var y = Math.max(pad, Math.round((Hh - blockH) / 2) - Math.round(Hh * 0.04));
    var drawText = function (line, font, color, yy) {
      g.font = font; g.fillStyle = color;
      if (state.align === 'center') { g.textAlign = 'center'; g.fillText(line, W / 2, yy); }
      else { g.textAlign = 'left'; g.fillText(line, pad, yy); }
    };
    if (state.tag) {
      var tagFont = '600 ' + Math.round(W * 0.028) + 'px ' + FONT();
      g.font = tagFont;
      var tw = g.measureText(state.tag).width + W * 0.05;
      var th = Math.round(W * 0.028 * 2.1);
      var tx = state.align === 'center' ? (W - tw) / 2 : pad;
      g.fillStyle = dark ? 'rgba(255,255,255,.16)' : accent;
      g.beginPath();
      var r = th / 2;
      g.moveTo(tx + r, y - th - W * 0.04); g.lineTo(tx + tw - r, y - th - W * 0.04);
      g.arc(tx + tw - r, y - th - W * 0.04 + r, r, -Math.PI / 2, Math.PI / 2);
      g.lineTo(tx + r, y - W * 0.04); g.arc(tx + r, y - th - W * 0.04 + r, r, Math.PI / 2, -Math.PI / 2);
      g.closePath(); g.fill();
      g.fillStyle = dark ? '#fff' : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(state.tag, tx + tw / 2, y - th - W * 0.04 + r + 1);
      g.textBaseline = 'top';
    }
    lines.forEach(function (line, i) {
      if (state.style === 'outline' && state.align === 'left') {
        g.lineWidth = Math.max(3, Math.round(chosen * 0.06)); g.strokeStyle = dark ? 'rgba(0,0,0,.0)' : 'rgba(0,0,0,0)';
      }
      drawText(line, titleFont, textColor, y + i * titleLH);
    });
    var sy = y + lines.length * titleLH + chosen * 0.5;
    subLines.forEach(function (line, i) { drawText(line, subFont, subColor, sy + i * subLH); });
    // 底部一条细线 + 站点名,让封面有落款但不抢戏
    g.fillStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.12)';
    g.fillRect(pad, Hh - pad * 0.9, maxW, 2);
    g.font = '500 ' + Math.round(W * 0.024) + 'px ' + FONT();
    g.fillStyle = dark ? 'rgba(255,255,255,.72)' : '#6e6e73';
    g.textAlign = 'left';
    g.fillText('gongjuhe.top · 本地生成', pad, Hh - pad * 0.68);
    drawElements(g, W, Hh);   // 叠加元素:模板之上,导出与多尺寸都会带上
    if (!exporting && guides.length) {   // 吸附参考线:只在编辑时显示
      g.save();
      g.strokeStyle = 'rgba(242,65,107,.9)'; g.lineWidth = 2;
      guides.forEach(function (gd) {
        g.beginPath();
        if (gd.v !== undefined) { g.moveTo(gd.v * W, 0); g.lineTo(gd.v * W, Hh); }
        else { g.moveTo(0, gd.h * Hh); g.lineTo(W, gd.h * Hh); }
        g.stroke();
      });
      g.restore();
    }
    // 安全区预览:把"会被平台裁掉"的区域压暗 —— 只画在画布预览上,导出时不会带上
    var showSafe = root.querySelector('#safe') && root.querySelector('#safe').checked;
    if (showSafe) {
      var sw = (s.safe ? s.safe[0] : W), sh = (s.safe ? s.safe[1] : Hh);
      var sx = (W - sw) / 2, sy2 = (Hh - sh) / 2;
      g.fillStyle = 'rgba(0,0,0,.42)';
      g.fillRect(0, 0, W, sy2); g.fillRect(0, sy2 + sh, W, Hh - sy2 - sh);
      g.fillRect(0, sy2, sx, sh); g.fillRect(sx + sw, sy2, W - sx - sw, sh);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
      g.setLineDash([14, 10]); g.strokeRect(sx, sy2, sw, sh); g.setLineDash([]);
    }
    info.textContent = '预览 ' + W + ' × ' + Hh + (s.safe ? ' · 安全区 ' + s.safe[0] + '×' + s.safe[1] : '')
      + ' · 标题字号 ' + chosen + 'px · 共 ' + lines.length + ' 行' + (s.note ? ' · ' + s.note : '');
  }

  var out = root.querySelector('#out');
  root.querySelector('#dl').addEventListener('click', async function () {
    exporting = true; render();
    await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
    cv.toBlob(async function (blob) {
      exporting = false; render();
      if (!blob) { out.innerHTML = '<div class="note err" style="display:block">导出失败,请重试。</div>'; return; }
      var chk = await H.checkImage(blob);
      var s = sizeOf();
      var ok = chk.ok && chk.width === s.w && chk.height === s.h;
      if (ok) H.downloadBlob(blob, 'cover-' + s.id + '-' + s.w + 'x' + s.h + '.png');
      out.innerHTML = '<div class="note ' + (ok ? 'ok' : 'err') + '" style="display:block">'
        + (ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓ 尺寸与所选平台一致)'
              : '自检没通过,先别拿去发:' + H.esc(chk.error || '尺寸不符')) + '</div>';
    }, 'image/png');
  });

  // 一稿多尺寸:同一份标题与配色,一次导出"小红书 + 公众号 + 视频号 + 方图"四个规格。
  // 复用同一条渲染路径(改 state.size → render → toBlob),所以"看到什么就导出什么";
  // 依据:Fotor/Canva 都直接列尺寸预设,调研里"多尺寸适配"是这类工具的标配。
  var SET_SIZES = ['xhs', 'wx', 'sph', 'square'];
  root.querySelector('#set').addEventListener('click', async function () {
    var btn = root.querySelector('#set');
    var orig = state.size;
    btn.disabled = true; btn.textContent = '正在导出 ' + SET_SIZES.length + ' 个尺寸…';
    var files = [];
    try {
      for (var i = 0; i < SET_SIZES.length; i++) {
        var id = SET_SIZES[i];
        var s = SIZES.filter(function (z) { return z.id === id; })[0];
        if (!s) continue;
        state.size = id; exporting = true; render();
        await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
        var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
        if (blob) files.push({ name: 'cover-' + id + '-' + s.w + 'x' + s.h + '.png', blob: blob });
      }
    } catch (e) {
      out.innerHTML = '<div class="note err" style="display:block">导出这套尺寸时出错:' + H.esc(H.friendlyError(e, '导出失败')) + '</div>';
    }
    exporting = false; state.size = orig; render();
    root.querySelectorAll('#sz .cv-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.v === orig); });
    btn.disabled = false; btn.textContent = '导出一套尺寸(ZIP)';
    if (!files.length) { out.innerHTML = '<div class="note err" style="display:block">没有可导出的尺寸。</div>'; return; }
    out.innerHTML = '<div class="note ok" style="display:block">已导出 ' + files.length + ' 个尺寸:' + files.map(function (f2) { return H.esc(f2.name.replace('cover-', '').replace('.png', '')); }).join(' · ') + '(打包成 ZIP,全部本地生成)</div>';
    H.downloadZip(files, 'cover-set.zip');
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render, function () {});
  render();
}
