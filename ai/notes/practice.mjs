import { grade, gradeObjective } from '/shared/grading-engine.mjs';

const practice = document.querySelector('.practice[data-engine="v2"]');
if (practice) init(practice);

function init(root) {
  const PREFIX = 'gjh-notes:';
  const key = root.dataset.key;
  const exerciseUrl = root.dataset.exercise;
  const answer = root.querySelector('[data-answer]');
  const countEl = root.querySelector('[data-count]');
  const scoreEl = root.querySelector('[data-score]');
  const doneEl = root.querySelector('[data-done]');
  const statusEl = root.querySelector('[data-status]');
  const feedback = root.querySelector('[data-feedback]');
  const criteriaBox = root.querySelector('[data-criteria]');
  const objectiveBox = root.querySelector('[data-objective]');
  const checkBtn = root.querySelector('[data-check]');
  const answerBox = document.querySelector('.answer');
  let exercise = null;
  let knowledgeChecks = [];
  let loaded = false;
  let saveTimer = 0;
  let state = read();

  function read() {
    try { return JSON.parse(localStorage.getItem(PREFIX + key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function write() {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(state)); } catch (e) {}
  }
  function setStatus(text) { if (statusEl) statusEl.textContent = text; }
  function count() { if (countEl) countEl.textContent = answer.value.length + ' 字'; }
  function collectObjectives() {
    var out = {};
    if (!objectiveBox) return out;
    objectiveBox.querySelectorAll('.objective-card').forEach(function (card) {
      var checked = card.querySelector('input[type="radio"]:checked');
      if (checked) out[card.dataset.checkId] = Number(checked.value);
    });
    return out;
  }
  function save() {
    state.answer = answer.value;
    state.done = doneEl.checked;
    state.objectives = collectObjectives();
    state.at = Date.now();
    write();
    setStatus('已保存');
  }
  function scheduleSave() {
    setStatus('保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  }
  function validatorHint(v) {
    if (!v) return '';
    if (v.type === 'json') return '结构校验：可解析 JSON，且包含 ' + (v.required || []).join('、');
    if (v.type === 'numeric') return '结构校验：答案需出现数值 ' + v.expected + (v.tolerance ? ' ± ' + v.tolerance : '');
    if (v.type === 'regex') return '结构校验：' + (v.patterns || []).map((x) => x.label || x.pattern).join('、');
    if (v.type === 'code_static') return '结构校验：代码需包含 ' + (v.required || []).join('、') + (v.forbidden && v.forbidden.length ? '，且不能含 ' + v.forbidden.join('、') : '');
    return '结构校验：' + v.type;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (!state.answer) state.answer = '';
  if (typeof state.done !== 'boolean') state.done = false;
  if (!state.objectives || typeof state.objectives !== 'object') {
    state.objectives = {};
    if (typeof state.objective === 'number') state.objectives.q1 = state.objective;
  }
  answer.value = state.answer;
  doneEl.checked = state.done;
  if (feedback) feedback.textContent = '评分项加载中…';
  if (checkBtn) checkBtn.disabled = true;
  count();

  answer.addEventListener('input', () => {
    count();
    reset();
    setStatus('已修改，待保存');
    scheduleSave();
  });
  doneEl.addEventListener('change', () => {
    state.done = doneEl.checked;
    save();
    setStatus(doneEl.checked ? '已标记完成' : '已取消完成');
  });
  root.querySelector('[data-save]').addEventListener('click', save);
  root.querySelector('[data-clear]').addEventListener('click', () => {
    if (!window.confirm('清空本关答案？')) return;
    answer.value = '';
    doneEl.checked = false;
    state.done = false;
    count();
    reset();
    save();
  });
  const reveal = root.querySelector('[data-reveal]');
  if (reveal) {
    if (!answerBox) reveal.style.display = 'none';
    else reveal.addEventListener('click', () => {
      answerBox.open = true;
      answerBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function reset() {
    scoreEl.textContent = '—';
    feedback.textContent = '';
    criteriaBox.querySelectorAll('[data-criterion]').forEach((item) => {
      item.classList.remove('is-pass', 'is-partial', 'is-fail');
      const s = item.querySelector('[data-state]');
      if (s) s.textContent = '待检查';
    });
  }

  function renderObjective() {
    if (!objectiveBox || !knowledgeChecks.length) {
      if (objectiveBox) objectiveBox.hidden = true;
      return;
    }
    objectiveBox.innerHTML = `<p class="label">KNOWLEDGE CHECK / 客观题 · ${knowledgeChecks.length} 题</p>` +
      knowledgeChecks.map((q, index) => {
        const selected = state.objectives[q.id];
        const options = q.options.map((opt, i) => (
          `<label class="objective-option"><input type="radio" name="objective-${esc(q.id)}-${index}" value="${i}"${selected === i ? ' checked' : ''}><span><b>${String.fromCharCode(65 + i)}</b> ${esc(opt)}</span></label>`
        )).join('');
        return `<div class="objective-card" data-check-id="${esc(q.id)}">
          <p class="objective-index">0${index + 1} / ${esc(q.question)}</p>
          <div class="objective-options">${options}</div>
          <div class="objective-actions"><button type="button" class="check-answer" data-objective-check>检查这道题</button><span class="objective-result" data-objective-result role="status" aria-live="polite"></span></div>
          <p class="objective-explanation" data-objective-explanation></p>
        </div>`;
      }).join('');
    objectiveBox.querySelectorAll('.objective-card').forEach((card) => {
      card.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          state.objectives[card.dataset.checkId] = Number(input.value);
          write();
          setStatus('已保存');
          card.querySelectorAll('.objective-option').forEach((el) => el.classList.remove('is-correct', 'is-wrong'));
          const resultEl = card.querySelector('[data-objective-result]');
          const explanationEl = card.querySelector('[data-objective-explanation]');
          if (resultEl) resultEl.textContent = '';
          if (explanationEl) explanationEl.textContent = '';
        });
      });
      card.querySelector('[data-objective-check]').addEventListener('click', () => checkObjective(card));
    });
  }

  function recordMistake(q, selected, result) {
    var storeKey = 'gjh-mistakes';
    var store = {};
    try { store = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch (e) { store = {}; }
    var mk = key + '::' + q.id;
    if (result.correct) {
      delete store[mk];
      delete store[key];
    } else {
      var titleEl = document.querySelector('h1');
      store[mk] = {
        key: mk,
        title: titleEl ? titleEl.textContent.trim() : key,
        href: location.pathname.replace(/\.html$/, ''),
        question: q.question,
        options: q.options,
        selected: selected,
        answer: result.answer,
        explanation: q.explanation,
        at: Date.now()
      };
    }
    try { localStorage.setItem(storeKey, JSON.stringify(store)); } catch (e) {}
  }

  function checkObjective(card) {
    var q = knowledgeChecks.find((item) => item.id === card.dataset.checkId);
    if (!q) return;
    var checked = card.querySelector('input[type="radio"]:checked');
    var selected = checked ? Number(checked.value) : null;
    var resultEl = card.querySelector('[data-objective-result]');
    var explanationEl = card.querySelector('[data-objective-explanation]');
    if (selected === null) {
      if (resultEl) resultEl.textContent = '先选一个答案。';
      return;
    }
    var result = gradeObjective(q, selected);
    state.objectives[q.id] = selected;
    save();
    recordMistake(q, selected, result);
    card.querySelectorAll('.objective-option').forEach((el) => {
      var input = el.querySelector('input');
      el.classList.remove('is-correct', 'is-wrong');
      if (input && Number(input.value) === result.answer) el.classList.add('is-correct');
      if (input && Number(input.value) === selected && !result.correct) el.classList.add('is-wrong');
    });
    if (resultEl) resultEl.textContent = result.correct ? '回答正确' : '回答错误';
    if (explanationEl) {
      explanationEl.textContent = (result.correct ? '' : '正确答案：' + String.fromCharCode(65 + result.answer) + '. ' + q.options[result.answer] + '。') + q.explanation + (q.sourceRef ? ' 来源定位：' + q.sourceRef + '。' : '');
    }
  }

  function renderCriteria() {
    criteriaBox.innerHTML = exercise.criteria.map((c) => (
      `<div class="check-item" data-criterion="${esc(c.id)}"><span class="check-state" data-state>待检查</span>` +
      `<span>${esc(c.label)}${c.validator ? '<small class="validator-hint">' + esc(validatorHint(c.validator)) + '</small>' : ''}</span>` +
      `<span class="criterion-weight">${Number(c.weight)} 分</span></div>`
    )).join('');
  }

  function check() {
    if (!exercise || !loaded) return;
    const result = grade(exercise, answer.value);
    const byId = new Map(result.criteria.map((c) => [c.id, c]));
    criteriaBox.querySelectorAll('[data-criterion]').forEach((item) => {
      const r = byId.get(item.dataset.criterion);
      if (!r) return;
      item.classList.remove('is-pass', 'is-partial', 'is-fail');
      let cls = 'is-fail';
      let label = '未通过';
      if (r.status === 'pass') { cls = 'is-pass'; label = '通过'; }
      else if (r.status === 'partial') { cls = 'is-partial'; label = '部分'; }
      else if (r.status === 'ungradable') { cls = 'is-partial'; label = '待人工判断'; }
      else if (r.status === 'not_checked') { cls = 'is-fail'; label = '未检查'; }
      item.classList.add(cls);
      const s = item.querySelector('[data-state]');
      if (s) s.textContent = label;
    });
    scoreEl.textContent = result.score;
    if (result.status === 'too_short') {
      feedback.textContent = `答案太短：至少 ${exercise.minLength} 字，写完再检查。`;
    } else if (result.status === 'needs_review') {
      feedback.textContent = '有评分项需要人工判断：' + (result.missing.join(' / ') || '未命名评分项');
    } else if (result.status === 'pass') {
      feedback.textContent = '评分项已全部覆盖（含结构/数值/JSON 校验）。规则引擎仍不判断语义，最后要对照参考答案读一遍。';
    } else {
      feedback.textContent = '还缺：' + (result.missing.join(' / ') || '部分评分项') + '。补齐后再检查。';
    }
    setStatus('检查完成');
    save();
  }

  checkBtn.addEventListener('click', check);

  fetch(exerciseUrl, { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      exercise = data.exercise;
      knowledgeChecks = Array.isArray(data.knowledgeChecks) ? data.knowledgeChecks : [];
      loaded = true;
      if (checkBtn) { checkBtn.disabled = false; checkBtn.removeAttribute('aria-busy'); }
      if (feedback) feedback.textContent = '';
      renderCriteria();
      renderObjective();
      reset();
      setStatus(state.at ? '已从本机恢复' : '草稿保存在本机浏览器');
    })
    .catch((err) => {
      if (feedback) feedback.textContent = '评分数据加载失败：' + err.message + '。请刷新重试。';
      if (checkBtn) checkBtn.disabled = true;
    });
}
