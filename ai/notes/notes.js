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

  /* ---------- in-article practice + rule checker ---------- */
  var practice = document.querySelector('.practice');
  if (practice) {
    var key = practice.dataset.key;
    var answer = practice.querySelector('[data-answer]');
    var countEl = practice.querySelector('[data-count]');
    var scoreEl = practice.querySelector('[data-score]');
    var doneEl = practice.querySelector('[data-done]');
    var statusEl = practice.querySelector('[data-status]');
    var feedback = practice.querySelector('[data-feedback]');
    var ruleItems = practice.querySelectorAll('[data-rule]');
    var total = parseFloat(practice.dataset.total) || 0;
    var rules = [];
    try { rules = JSON.parse(practice.dataset.rules || '[]'); } catch (e) {}
    var saveTimer = 0;
    var state = readData(key);
    if (!state.answer) state.answer = '';
    if (typeof state.done !== 'boolean') state.done = false;

    answer.value = state.answer;
    doneEl.checked = !!state.done;

    function setStatus(text) { if (statusEl) statusEl.textContent = text; }
    function count() { countEl.textContent = (answer.value.length || 0) + ' 字'; }
    function save() {
      state.answer = answer.value;
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
    function resetCheck() {
      scoreEl.textContent = '—';
      if (feedback) feedback.textContent = '';
      ruleItems.forEach(function (item) {
        item.classList.remove('is-pass', 'is-fail');
        var s = item.querySelector('[data-state]');
        if (s) s.textContent = '待检查';
      });
    }
    function check() {
      var text = answer.value.trim();
      var low = text.toLowerCase();
      var score = 0;
      var missing = [];
      var tooShort = text.length < 20;
      ruleItems.forEach(function (item, i) {
        var r = rules[i] || { groups: [], weight: 1, text: '' };
        var miss = [];
        if (tooShort) {
          miss.push('答案太短');
        } else {
          (r.groups || []).forEach(function (g) {
            var found = g.some(function (w) { return low.indexOf(String(w).toLowerCase()) >= 0; });
            if (!found) miss.push(g[0]);
          });
          if (!r.groups || !r.groups.length) {
            if (text.length < 60) miss.push('内容过短');
          }
        }
        var pass = !tooShort && miss.length === 0;
        item.classList.toggle('is-pass', pass);
        item.classList.toggle('is-fail', !pass);
        var st = item.querySelector('[data-state]');
        if (st) st.textContent = pass ? '通过' : '未通过';
        if (pass) score += parseFloat(r.weight) || 0;
        miss.forEach(function (m) { if (missing.indexOf(m) < 0) missing.push(m); });
      });
      scoreEl.textContent = (score % 1 === 0 ? score : score.toFixed(1));
      if (!text) {
        if (feedback) feedback.textContent = '先写下你的答案，再检查。';
      } else if (tooShort) {
        if (feedback) feedback.textContent = '答案太短：至少写出一段完整的 Prompt / 方案，再检查得分点。';
      } else if (score >= total) {
        if (feedback) feedback.textContent = '得分点结构已覆盖。最后对照参考答案，检查语义和细节是否真的成立。';
      } else {
        if (feedback) feedback.textContent = '还缺：' + missing.join(' / ') + '。补齐后再检查一次。';
      }
      save();
      setStatus('检查完成');
    }

    answer.addEventListener('input', function () {
      count(); resetCheck(); setStatus('已修改，待保存'); scheduleSave();
    });
    doneEl.addEventListener('change', function () {
      state.done = doneEl.checked; save();
      setStatus(doneEl.checked ? '已标记完成' : '已取消完成');
    });
    practice.querySelector('[data-save]').addEventListener('click', save);
    practice.querySelector('[data-check]').addEventListener('click', check);
    practice.querySelector('[data-clear]').addEventListener('click', function () {
      if (!window.confirm('清空本关答案？')) return;
      answer.value = ''; resetCheck(); count(); save();
    });

    var reveal = practice.querySelector('[data-reveal]');
    var answerBox = document.querySelector('.answer');
    if (reveal) {
      if (!answerBox) reveal.style.display = 'none';
      else reveal.addEventListener('click', function () {
        answerBox.open = true;
        answerBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    count();
    resetCheck();
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
