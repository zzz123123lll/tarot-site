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
  let knowledgeCheck = null;
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
  function save() {
    state.answer = answer.value;
    state.done = doneEl.checked;
    state.objective = selectedObjective();
    state.at = Date.now();
    write();
    setStatus('已保存');
  }
  function scheduleSave() {
    setStatus('保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (!state.answer) state.answer = '';
  if (typeof state.done !== 'boolean') state.done = false;
  if (typeof state.objective !== 'number') state.objective = null;
  answer.value = state.answer;
  doneEl.checked = state.done;
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

  function selectedObjective() {
    if (!objectiveBox) return null;
    const checked = objectiveBox.querySelector('input[type="radio"]:checked');
    return checked ? Number(checked.value) : null;
  }

  function renderObjective() {
    if (!objectiveBox || !knowledgeCheck) {
      if (objectiveBox) objectiveBox.hidden = true;
      return;
    }
    const selected = typeof state.objective === 'number' ? state.objective : null;
    objectiveBox.innerHTML = `
      <p class="label">KNOWLEDGE CHECK / 客观题 · 1 题</p>
      <p class="objective-question">${esc(knowledgeCheck.question)}</p>
      <div class="objective-options">${knowledgeCheck.options.map((opt, i) => (
        `<label class="objective-option"><input type="radio" name="objective-${esc(key)}" value="${i}"${selected === i ? ' checked' : ''}><span><b>${String.fromCharCode(65 + i)}</b> ${esc(opt)}</span></label>`
      )).join('')}</div>
      <div class="objective-actions"><button type="button" class="check-answer" data-objective-check>检查这道题</button><span class="objective-result" data-objective-result></span></div>
      <p class="objective-explanation" data-objective-explanation></p>`;
    objectiveBox.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        state.objective = selectedObjective();
        write();
        setStatus('已保存');
        objectiveBox.querySelectorAll('.objective-option').forEach((el) => el.classList.remove('is-correct', 'is-wrong'));
        if (objectiveBox.querySelector('[data-objective-result]')) objectiveBox.querySelector('[data-objective-result]').textContent = '';
        if (objectiveBox.querySelector('[data-objective-explanation]')) objectiveBox.querySelector('[data-objective-explanation]').textContent = '';
      });
    });
    objectiveBox.querySelector('[data-objective-check]').addEventListener('click', checkObjective);
  }

  function recordMistake(selected, result) {
    var storeKey = 'gjh-mistakes';
    var store = {};
    try { store = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch (e) { store = {}; }
    if (result.correct) {
      delete store[key];
    } else {
      var titleEl = document.querySelector('h1');
      store[key] = {
        key: key,
        title: titleEl ? titleEl.textContent.trim() : key,
        href: location.pathname.replace(/\.html$/, ''),
        question: knowledgeCheck.question,
        options: knowledgeCheck.options,
        selected: selected,
        answer: result.answer,
        explanation: knowledgeCheck.explanation,
        at: Date.now()
      };
    }
    try { localStorage.setItem(storeKey, JSON.stringify(store)); } catch (e) {}
  }

  function checkObjective() {
    const selected = selectedObjective();
    const resultEl = objectiveBox.querySelector('[data-objective-result]');
    const explanationEl = objectiveBox.querySelector('[data-objective-explanation]');
    if (selected === null) {
      if (resultEl) resultEl.textContent = '先选一个答案。';
      return;
    }
    const result = gradeObjective(knowledgeCheck, selected);
    state.objective = selected;
    save();
    recordMistake(selected, result);
    objectiveBox.querySelectorAll('.objective-option').forEach((el) => {
      const input = el.querySelector('input');
      el.classList.remove('is-correct', 'is-wrong');
      if (input && Number(input.value) === result.answer) el.classList.add('is-correct');
      if (input && Number(input.value) === selected && !result.correct) el.classList.add('is-wrong');
    });
    if (resultEl) resultEl.textContent = result.correct ? '回答正确' : '回答错误';
    if (explanationEl) {
      explanationEl.textContent = (result.correct ? '' : '正确答案：' + String.fromCharCode(65 + result.answer) + '. ' + knowledgeCheck.options[result.answer] + '。') + knowledgeCheck.explanation;
    }
  }

  function renderCriteria() {
    criteriaBox.innerHTML = exercise.criteria.map((c) => (
      `<div class="check-item" data-criterion="${esc(c.id)}"><span class="check-state" data-state>待检查</span><span>${esc(c.label)}</span>` +
      `<span class="criterion-weight">${Number(c.weight)} 分</span></div>`
    )).join('');
  }

  function check() {
    if (!exercise) return;
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
      feedback.textContent = '评分项已全部覆盖。规则引擎只检查结构与关键词，最后仍要对照参考答案检查语义。';
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
      knowledgeCheck = data.knowledgeCheck;
      renderCriteria();
      renderObjective();
      reset();
      setStatus(state.at ? '已从本机恢复' : '草稿保存在本机浏览器');
    })
    .catch((err) => {
      feedback.textContent = '评分数据加载失败：' + err.message;
    });
}
