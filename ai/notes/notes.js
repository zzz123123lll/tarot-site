(function () {
  'use strict';

  var PREFIX = 'gjh-notes:';

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

  /* ---------- in-article practice ---------- */
  var practice = document.querySelector('.practice');
  if (practice) {
    var key = practice.dataset.key;
    var answer = practice.querySelector('[data-answer]');
    var countEl = practice.querySelector('[data-count]');
    var checks = practice.querySelectorAll('[data-req]');
    var scoreEl = practice.querySelector('[data-score]');
    var doneEl = practice.querySelector('[data-done]');
    var statusEl = practice.querySelector('[data-status]');
    var total = parseFloat(practice.dataset.total) || 0;
    var saveTimer = 0;

    var state = readData(key);
    if (!state.answer) state.answer = '';
    if (!state.checks) state.checks = {};
    if (typeof state.done !== 'boolean') state.done = false;

    answer.value = state.answer;
    checks.forEach(function (c, i) {
      c.checked = !!state.checks[i];
      c.addEventListener('change', function () { update(); save(); });
    });
    doneEl.checked = !!state.done;
    doneEl.addEventListener('change', function () {
      state.done = doneEl.checked;
      save();
      setStatus(state.done ? '已标记完成' : '已取消完成');
    });

    function update() {
      countEl.textContent = (answer.value.length || 0) + ' 字';
      var s = 0;
      checks.forEach(function (c) { if (c.checked) s += parseFloat(c.dataset.weight) || 0; });
      if (scoreEl) scoreEl.textContent = (s % 1 === 0 ? s : s.toFixed(1));
    }
    function save() {
      state.answer = answer.value;
      var map = {};
      checks.forEach(function (c, i) { if (c.checked) map[i] = true; });
      state.checks = map;
      state.done = doneEl.checked;
      state.at = Date.now();
      writeData(key, state);
      setStatus('已保存');
    }
    function scheduleSave() {
      setStatus('保存中…');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 350);
    }
    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    answer.addEventListener('input', function () { update(); scheduleSave(); });
    practice.querySelector('[data-save]').addEventListener('click', function () { save(); });
    practice.querySelector('[data-clear]').addEventListener('click', function () {
      if (!window.confirm('清空本关答案和勾选？')) return;
      answer.value = '';
      checks.forEach(function (c) { c.checked = false; });
      update(); save();
    });

    var reveal = practice.querySelector('[data-reveal]');
    var answerBox = document.querySelector('.answer');
    if (reveal) {
      if (!answerBox) {
        reveal.style.display = 'none';
      } else {
        reveal.addEventListener('click', function () {
          answerBox.open = true;
          answerBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }

    update();
    setStatus(state.at ? '已从本机恢复' : '草稿保存在本机浏览器');
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
      var p = card.querySelector('[data-series-progress]');
      if (p) p.textContent = n + ' / ' + (card.dataset.total || '') + ' 完成';
    });
    var overall = document.querySelector('[data-overall]');
    if (overall) overall.textContent = allDone + ' / 26 关完成';
  }
})();
