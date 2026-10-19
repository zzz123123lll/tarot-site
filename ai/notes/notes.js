(function () {
  'use strict';

  var PREFIX = 'gjh-notes:';
  var LABELS = {
    system: 'System / 系统提示词', user: 'User / 用户指令', xml: 'XML 标签', json: 'JSON',
    rrf: 'RRF 融合', star: 'STAR 法则', l2: 'L2 范数', rsvp: 'RSVP / 截止',
    '字': '字数限制', '字数': '字数限制', '时间': '时间', '地点': '地点',
    '亮点': '核心亮点', '媒体': '媒体权益', '退货': '售后/退货', '物流': '物流风险',
    '复购': '复购/客单价', '空话': '量化/数据', '量化': '量化/数据', '数据': '量化/数据',
    '职级': '职级/身份', '立场': '立场', '受众': '目标受众', '引用': '引用/溯源',
    '拒答': '拒答机制', '过滤': '过滤条件', '阈值': '相似度阈值', '检索': '检索',
    '拆分': '拆解', '拆解': '拆解', '规划': '规划结构', '工具': '工具定义',
    '记忆': '分层记忆', '反思': '反思/校验', '多智能体': '多智能体', '护栏': '安全护栏',
    '上下文': '上下文工程', 'chunk': '分块', 'schema': 'JSON Schema', 'required': '必填字段',
    'tool': '工具', 'id': 'id', 'score': 'score', 'text': 'text', 'source': 'source',
    'streamlit': 'Streamlit', 'faithfulness': '忠实度', 'context recall': 'Context Recall',
    'generator': 'Generator', 'validator': 'Validator', 'refiner': 'Refiner',
    'thought': 'Thought', 'action': 'Action', 'observation': 'Observation',
    'final decision': 'Final Decision', 'l1': 'L1 自动执行', 'l2': 'L2 需确认', 'l3': 'L3 严禁外发',
    'hitl': 'HITL', 'judge': 'LLM Judge', 'router': 'Router', 'rewriter': 'Query Rewriter'
  };
  function labelOf(word) {
    var w = String(word);
    return LABELS[w] || LABELS[w.toLowerCase()] || w;
  }

  function readData(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeData(key, data) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }

  /* ---------- copy code ---------- */
  document.querySelectorAll('.code-block .copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var block = btn.closest('.code-block');
      var code = block ? block.querySelector('code') : null;
      if (!code) return;
      var text = code.innerText;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = old; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  });

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- reading progress ---------- */
  var bar = document.querySelector('.read-progress');
  if (bar) {
    var updateBar = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = pct.toFixed(2) + '%';
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();
  }

  /* ---------- series page progress ---------- */
  var track = document.querySelector('.track-progress');
  if (track) {
    var rows = document.querySelectorAll('.level-row[data-url]');
    var doneCount = 0;
    rows.forEach(function (row) {
      var d = readData(row.dataset.url);
      if (d.done) {
        row.classList.add('is-done');
        doneCount++;
      }
    });
    var tc = track.querySelector('[data-track-count]');
    if (tc) tc.textContent = doneCount + ' / ' + rows.length + ' 完成';
    var tb = track.querySelector('.bar i');
    if (tb && rows.length) tb.style.width = (doneCount / rows.length * 100).toFixed(1) + '%';
  }

  /* ---------- index progress ---------- */
  var cards = document.querySelectorAll('.series-card[data-series]');
  if (cards.length) {
    var allDone = 0;
    var allTotal = 0;
    cards.forEach(function (card) {
      var prefix = PREFIX + '/ai/notes/' + card.dataset.series + '/';
      var n = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k || k.indexOf(prefix) !== 0) continue;
          var v = JSON.parse(localStorage.getItem(k) || '{}');
          if (v && v.done) n++;
        }
      } catch (e) {}
      allDone += n;
      allTotal += Number(card.dataset.total) || 0;
      var p = card.querySelector('[data-series-progress]');
      if (p) p.textContent = n + ' / ' + (card.dataset.total || '') + ' 完成';
    });
    var overall = document.querySelector('[data-overall]');
    if (overall) overall.textContent = allDone + ' / ' + allTotal + ' 关完成';
  }
  // 知识库外壳的离线缓存（旧站 SW 已被替换）
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
